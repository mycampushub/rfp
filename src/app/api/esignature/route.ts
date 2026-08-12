import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { getTenantContext, AuthError, PermissionError } from "@/lib/tenant-context"
import { requirePermission } from "@/lib/rbac"
import { z } from "zod"
import crypto from "crypto"

const createSignatureSchema = z.object({
  submissionId: z.string(),
  signerName: z.string(),
  signerEmail: z.string(),
  signerTitle: z.string(),
  signatureData: z.string(), // Base64 encoded signature
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  documentHash: z.string().optional(),
  termsAccepted: z.boolean(),
})

const _verifySignatureSchema = z.object({
  signatureId: z.string(),
  documentHash: z.string(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const submissionId = searchParams.get("submissionId")
    const signatureId = searchParams.get("signatureId")
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const skip = (page - 1) * limit

    const tenantContext = getTenantContext(session)

    if (signatureId) {
      // Get specific signature
      const signature = await db.electronicSignature.findFirst({
        where: {
          id: signatureId,
          submission: {
            rfp: {
              tenantId: tenantContext.tenantId,
            },
          },
        },
        include: {
          submission: {
            select: {
              id: true,
              rfp: {
                select: {
                  title: true,
                },
              },
            },
          },
        },
      })

      if (!signature) {
        return NextResponse.json({ error: "Signature not found" }, { status: 404 })
      }

      return NextResponse.json(signature)
    }

    if (submissionId) {
      // Get all signatures for a submission
      const whereClause = {
        submissionId,
        submission: {
          rfp: {
            tenantId: tenantContext.tenantId,
          },
        },
      }

      const [signatures, total] = await Promise.all([
        db.electronicSignature.findMany({
          where: whereClause,
          orderBy: { createdAt: "desc" },
          take: limit,
          skip,
        }),
        db.electronicSignature.count({ where: whereClause }),
      ])

      return NextResponse.json({
        data: signatures,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      })
    }

    return NextResponse.json({ error: "Missing submissionId or signatureId" }, { status: 400 })

  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    if (error instanceof PermissionError) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    console.error("Error fetching signatures:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createSignatureSchema.parse(body)

    const tenantContext = getTenantContext(session)
    await requirePermission('esignature:create')

    // Verify submission belongs to tenant
    const submission = await db.submission.findFirst({
      where: {
        id: validatedData.submissionId,
        rfp: {
          tenantId: tenantContext.tenantId,
        },
      },
    })

    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 })
    }

    // Generate signature metadata
    const clientIp = getClientIp(request)
    const signatureMetadata = {
      ipAddress: validatedData.ipAddress || clientIp,
      userAgent: validatedData.userAgent || request.headers.get("user-agent") || "unknown",
      location: await getLocationFromIP(validatedData.ipAddress || clientIp),
      deviceFingerprint: generateDeviceFingerprint(request),
      timestamp: new Date().toISOString(),
    }

    // Create signature record
    const signature = await db.electronicSignature.create({
      data: {
        submissionId: validatedData.submissionId,
        signerName: validatedData.signerName,
        signerEmail: validatedData.signerEmail,
        signerTitle: validatedData.signerTitle,
        signatureData: validatedData.signatureData,
        ipAddress: signatureMetadata.ipAddress,
        userAgent: signatureMetadata.userAgent,
        location: signatureMetadata.location,
        deviceFingerprint: signatureMetadata.deviceFingerprint,
        documentHash: validatedData.documentHash || await generateDocumentHash(submission),
        status: "pending",
        termsAccepted: validatedData.termsAccepted,
        auditTrail: {
          created: signatureMetadata.timestamp,
          actions: [
            {
              action: "signature_initiated",
              timestamp: signatureMetadata.timestamp,
              details: "Signature process initiated"
            }
          ]
        }
      },
    })

    // Trigger verification process
    const verificationResult = await verifySignatureIntegrity(signature)

    // Update signature with verification result
    const updatedSignature = await db.electronicSignature.update({
      where: { id: signature.id },
      data: {
        status: verificationResult.valid ? "verified" : "failed",
        verificationResult: verificationResult,
        auditTrail: JSON.parse(JSON.stringify({
          ...(signature.auditTrail as Record<string, unknown> || {}),
          actions: [
            ...((signature.auditTrail as Record<string, unknown>)?.actions as Array<Record<string, unknown>> || []),
            {
              action: "verification_completed",
              timestamp: new Date().toISOString(),
              details: `Signature verification ${verificationResult.valid ? "passed" : "failed"}`
            }
          ]
        })) as any,
      }
    })

    // Send confirmation email (in real implementation)
    await sendSignatureConfirmation(updatedSignature)

    return NextResponse.json({
      ...updatedSignature,
      verificationResult,
      status: verificationResult.valid ? "verified" : "failed"
    }, { status: 201 })

  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    if (error instanceof PermissionError) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation Error", details: error.issues }, { status: 400 })
    }
    console.error("Error creating signature:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { signatureId, action } = body

    const tenantContext = getTenantContext(session)
    await requirePermission('esignature:manage')

    const signature = await db.electronicSignature.findFirst({
      where: {
        id: signatureId,
        submission: {
          rfp: {
            tenantId: tenantContext.tenantId,
          },
        },
      },
    })

    if (!signature) {
      return NextResponse.json({ error: "Signature not found" }, { status: 404 })
    }

    let updateData: Record<string, unknown> = {}

    switch (action) {
      case "verify": {
        const verificationResult = await verifySignatureIntegrity(signature)
        updateData = {
          status: verificationResult.valid ? "verified" : "failed",
          verificationResult,
          auditTrail: {
            ...(signature.auditTrail as Record<string, unknown>),
            actions: [
              ...((signature.auditTrail as Record<string, unknown>)?.actions as Array<Record<string, unknown>>) || [],
              {
                action: "manual_verification",
                timestamp: new Date().toISOString(),
                details: `Manual verification ${verificationResult.valid ? "passed" : "failed"}`
              }
            ]
          }
        }
        break
      }

      case "revoke": {
        updateData = {
          status: "revoked",
          auditTrail: {
            ...(signature.auditTrail as Record<string, unknown>),
            actions: [
              ...((signature.auditTrail as Record<string, unknown>)?.actions as Array<Record<string, unknown>>) || [],
              {
                action: "signature_revoked",
                timestamp: new Date().toISOString(),
                details: "Signature revoked by administrator"
              }
            ]
          }
        }
        break
      }

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    const updatedSignature = await db.electronicSignature.update({
      where: { id: signatureId },
      data: updateData,
    })

    return NextResponse.json(updatedSignature)

  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    if (error instanceof PermissionError) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    console.error("Error updating signature:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

// Helper functions
async function getLocationFromIP(_ip: string): Promise<string> {
  return 'Unknown Location'
}

function getClientIp(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || "unknown"
}

function generateDeviceFingerprint(request: NextRequest): string {
  const userAgent = request.headers.get("user-agent") || ""
  const ip = getClientIp(request)
  return Buffer.from(`${userAgent}:${ip}`).toString("base64").substring(0, 32)
}

async function generateDocumentHash(submission: Record<string, unknown>): Promise<string> {
  // Generate a hash of the submission data
  const encoder = new TextEncoder()
  const submissionString = JSON.stringify(submission)
  const data = encoder.encode(submissionString)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  return hashHex
}

async function verifySignatureIntegrity(signature: Record<string, unknown>) {
  const sha256HexRegex = /^[0-9a-f]{64}$/i
  const documentHash = signature.documentHash as string | undefined
  const signatureData = signature.signatureData as string | undefined
  const signerName = signature.signerName as string | undefined
  const signerEmail = signature.signerEmail as string | undefined
  const existingVerifiedHash = (signature.verificationResult as Record<string, unknown> | undefined)?.verifiedHash as string | undefined

  // Check: signature data present and non-empty
  const signatureFormat = !!(signatureData && typeof signatureData === 'string' && signatureData.length > 0)

  // Check: documentHash is a valid SHA-256 hex string (exactly 64 hex chars)
  const dataIntegrity = !!(documentHash && typeof documentHash === 'string' && sha256HexRegex.test(documentHash))

  // Check: timestamp is valid
  const timestampValid = !!(signature.createdAt && new Date(signature.createdAt as string).getTime() > 0)

  // Check: signer info present
  const certificateValid = !!(signerName && signerEmail)

  // Check: audit trail exists
  const auditTrail = signature.auditTrail as Record<string, unknown> | null
  const chainOfCustody = !!(auditTrail && Array.isArray(auditTrail.actions))

  // HMAC-based integrity verification
  let hmacValid = false
  let computedHash = ''
  let hmacCheck = false
  if (signerName && signerEmail && documentHash && signatureData && dataIntegrity) {
    const hmac = crypto.createHmac('sha256', process.env.NEXTAUTH_SECRET || 'fallback-secret')
    hmac.update(`${signerName}${signerEmail}${documentHash}${signatureData}`)
    computedHash = hmac.digest('hex')

    if (existingVerifiedHash) {
      // Compare against stored/approved hash
      hmacValid = crypto.timingSafeEqual(
        Buffer.from(computedHash, 'hex'),
        Buffer.from(existingVerifiedHash, 'hex')
      )
    } else {
      // First-time verification: generate and store the hash
      hmacValid = true
    }
    hmacCheck = true
  }

  const checks = {
    signatureFormat,
    dataIntegrity,
    timestampValid,
    certificateValid,
    chainOfCustody,
    hmacIntegrity: hmacValid,
  }

  const passedChecks = Object.values(checks).filter(Boolean).length
  const totalChecks = Object.values(checks).length
  const score = Math.round((passedChecks / totalChecks) * 100)
  const valid = passedChecks === totalChecks

  const warnings: string[] = []
  if (!checks.signatureFormat) warnings.push('Signature data is missing or invalid format')
  if (!checks.dataIntegrity) warnings.push('Document hash is missing or not a valid SHA-256 hex string')
  if (!checks.timestampValid) warnings.push('Timestamp is invalid')
  if (!checks.certificateValid) warnings.push('Signer name or email is missing')
  if (!checks.chainOfCustody) warnings.push('Audit trail is incomplete')
  if (hmacCheck && !checks.hmacIntegrity) warnings.push('HMAC integrity check failed: signature data may have been tampered with')
  if (!hmacCheck) warnings.push('HMAC integrity check could not be performed: missing required fields')

  return {
    valid,
    score,
    checks,
    warnings,
    verifiedHash: computedHash || undefined,
    verifiedAt: new Date().toISOString()
  }
}

async function sendSignatureConfirmation(_signature: Record<string, unknown>): Promise<boolean> {
  // TODO: integrate email service
  return true
}
