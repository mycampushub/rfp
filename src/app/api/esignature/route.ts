import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { getTenantContext, AuthError, PermissionError } from "@/lib/tenant-context"
import { z } from "zod"

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

const verifySignatureSchema = z.object({
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
    const limit = parseInt(searchParams.get('limit') || '50')
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
        auditTrail: {
          ...(signature.auditTrail as Record<string, unknown>),
          actions: [
            ...((signature.auditTrail as Record<string, unknown>)?.actions as Array<Record<string, unknown>>) || [],
            {
              action: "verification_completed",
              timestamp: new Date().toISOString(),
              details: `Signature verification ${verificationResult.valid ? "passed" : "failed"}`
            }
          ]
        }
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
async function getLocationFromIP(ip: string): Promise<string> {
  // Mock location service - in real implementation, use a geolocation service
  const locations: Record<string, string> = {
    "192.168.1.1": "New York, NY",
    "10.0.0.1": "San Francisco, CA",
    "unknown": "Unknown Location"
  }
  return locations[ip] || "Unknown Location"
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
  const checks = {
    signatureFormat: !!(signature.signatureData && typeof signature.signatureData === 'string' && signature.signatureData.length > 0),
    dataIntegrity: !!(signature.documentHash && typeof signature.documentHash === 'string' && signature.documentHash.length === 64),
    timestampValid: !!(signature.createdAt && new Date(signature.createdAt as string).getTime() > 0),
    certificateValid: !!(signature.signerName && signature.signerEmail),
    chainOfCustody: !!(Array.isArray(signature.auditTrail?.actions)),
  }

  const passedChecks = Object.values(checks).filter(Boolean).length
  const totalChecks = Object.values(checks).length
  const score = Math.round((passedChecks / totalChecks) * 100)
  const valid = passedChecks === totalChecks

  const warnings: string[] = []
  if (!checks.signatureFormat) warnings.push('Signature data is missing or invalid format')
  if (!checks.dataIntegrity) warnings.push('Document hash is missing or invalid')
  if (!checks.timestampValid) warnings.push('Timestamp is invalid')
  if (!checks.certificateValid) warnings.push('Signer name or email is missing')
  if (!checks.chainOfCustody) warnings.push('Audit trail is incomplete')

  return {
    valid,
    score,
    checks,
    warnings,
    verifiedAt: new Date().toISOString()
  }
}

async function sendSignatureConfirmation(signature: Record<string, unknown>): Promise<boolean> {
  // In real implementation, use email service (e.g. Resend, SendGrid)
  return true
}
