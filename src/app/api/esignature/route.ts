import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getTenantContext } from "@/lib/tenant-context"
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

    const tenantContext = getTenantContext()

    if (signatureId) {
      // Get specific signature
      const signature = await db.eSignature.findFirst({
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
      const signatures = await db.eSignature.findMany({
        where: {
          submissionId,
          submission: {
            rfp: {
              tenantId: tenantContext.tenantId,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      })

      return NextResponse.json(signatures)
    }

    return NextResponse.json({ error: "Missing submissionId or signatureId" }, { status: 400 })

  } catch (error) {
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

    const tenantContext = getTenantContext()

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
    const signatureMetadata = {
      ipAddress: validatedData.ipAddress || request.ip || "unknown",
      userAgent: validatedData.userAgent || request.headers.get("user-agent") || "unknown",
      location: await getLocationFromIP(validatedData.ipAddress || request.ip || "unknown"),
      deviceFingerprint: generateDeviceFingerprint(request),
      timestamp: new Date().toISOString(),
    }

    // Create signature record
    const signature = await db.eSignature.create({
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
    await db.eSignature.update({
      where: { id: signature.id },
      data: {
        status: verificationResult.valid ? "verified" : "failed",
        verificationResult: verificationResult,
        auditTrail: {
          ...signature.auditTrail as any,
          actions: [
            ...(signature.auditTrail as any)?.actions || [],
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
    await sendSignatureConfirmation(signature)

    return NextResponse.json({
      ...signature,
      verificationResult,
      status: verificationResult.valid ? "verified" : "failed"
    }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation Error", details: error.errors }, { status: 400 })
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

    const tenantContext = getTenantContext()

    const signature = await db.eSignature.findFirst({
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

    let updateData: any = {}

    switch (action) {
      case "verify":
        const verificationResult = await verifySignatureIntegrity(signature)
        updateData = {
          status: verificationResult.valid ? "verified" : "failed",
          verificationResult,
          auditTrail: {
            ...signature.auditTrail as any,
            actions: [
              ...(signature.auditTrail as any)?.actions || [],
              {
                action: "manual_verification",
                timestamp: new Date().toISOString(),
                details: `Manual verification ${verificationResult.valid ? "passed" : "failed"}`
              }
            ]
          }
        }
        break

      case "revoke":
        updateData = {
          status: "revoked",
          auditTrail: {
            ...signature.auditTrail as any,
            actions: [
              ...(signature.auditTrail as any)?.actions || [],
              {
                action: "signature_revoked",
                timestamp: new Date().toISOString(),
                details: "Signature revoked by administrator"
              }
            ]
          }
        }
        break

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    const updatedSignature = await db.eSignature.update({
      where: { id: signatureId },
      data: updateData,
    })

    return NextResponse.json(updatedSignature)

  } catch (error) {
    console.error("Error updating signature:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

// Helper functions
async function getLocationFromIP(ip: string) {
  // Mock location service - in real implementation, use a geolocation service
  const locations = {
    "192.168.1.1": "New York, NY",
    "10.0.0.1": "San Francisco, CA",
    "unknown": "Unknown Location"
  }
  return locations[ip as keyof typeof locations] || "Unknown Location"
}

function generateDeviceFingerprint(request: NextRequest) {
  // Generate a simple device fingerprint
  const userAgent = request.headers.get("user-agent") || ""
  const ip = request.ip || "unknown"
  return Buffer.from(`${userAgent}:${ip}:${Date.now()}`).toString("base64").substring(0, 32)
}

async function generateDocumentHash(submission: any) {
  // Generate a hash of the submission data
  const crypto = require("crypto")
  const submissionString = JSON.stringify(submission)
  return crypto.createHash("sha256").update(submissionString).digest("hex")
}

async function verifySignatureIntegrity(signature: any) {
  // Mock signature verification - in real implementation, use proper cryptographic verification
  return {
    valid: true,
    score: 95,
    checks: {
      signatureFormat: true,
      dataIntegrity: true,
      timestampValid: true,
      certificateValid: true,
      chainOfCustody: true
    },
    warnings: [],
    verifiedAt: new Date().toISOString()
  }
}

async function sendSignatureConfirmation(signature: any) {
  // Mock email sending - in real implementation, use email service
  console.log(`Signature confirmation sent to ${signature.signerEmail}`)
  return true
}

// Database models (these would be in prisma schema)
const db = {
  eSignature: {
    findFirst: async () => ({}),
    findMany: async () => [],
    create: async (data: any) => ({ id: "sig_" + Date.now(), ...data }),
    update: async () => ({})
  },
  submission: {
    findFirst: async () => ({})
  }
}