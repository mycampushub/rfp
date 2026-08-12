/**
 * Versioned Vendors API (v1) — Single Vendor
 *
 * This is the versioned API under /api/v1/vendors/[id].
 * The base routes at /api/vendors/[id] are considered legacy and will be deprecated.
 *
 * Consumers should migrate to these v1 endpoints for new integrations.
 */
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getTenantContext, AuthError, PermissionError } from "@/lib/tenant-context"
import { db } from "@/lib/db"
import { z } from "zod"

const updateVendorSchema = z.object({
  name: z.string().min(1).optional(),
  contactInfo: z.object({
    email: z.string().email().optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    website: z.string().url().optional(),
  }).optional(),
  categories: z.array(z.string()).optional(),
  certifications: z.array(z.string()).optional(),
  diversityAttrs: z.object({
    isMinorityOwned: z.boolean().optional(),
    isWomenOwned: z.boolean().optional(),
    isVeteranOwned: z.boolean().optional(),
    isDisabilityOwned: z.boolean().optional(),
    certifications: z.array(z.string()).optional(),
  }).optional(),
  isActive: z.boolean().optional(),
})

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/v1/vendors/[id] - Get single vendor
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const ctx = getTenantContext(session)
    const { id } = await params

    const vendor = await db.vendor.findFirst({
      where: { id, tenantId: ctx.tenantId },
      include: {
        invitations: {
          include: {
            rfp: {
              select: {
                id: true,
                title: true,
                status: true,
              }
            }
          }
        },
        submissions: {
          include: {
            rfp: {
              select: {
                id: true,
                title: true,
                status: true,
              }
            },
            answers: {
              include: {
                question: true
              }
            },
            scores: true
          }
        },
        qna: {
          include: {
            rfp: {
              select: {
                id: true,
                title: true,
              }
            }
          }
        },
        acknowledgments: {
          include: {
            addendum: {
              select: {
                id: true,
                title: true,
              }
            }
          }
        }
      }
    })

    if (!vendor) {
      return NextResponse.json(
        { error: "Vendor not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(vendor)
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 })
    if (error instanceof PermissionError) return NextResponse.json({ error: error.message }, { status: 403 })
    console.error("Error fetching vendor:", error)
    return NextResponse.json(
      { error: "Failed to fetch vendor" },
      { status: 500 }
    )
  }
}

// PATCH /api/v1/vendors/[id] - Update vendor
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const ctx = getTenantContext(session)
    const { id } = await params

    const body = await request.json()
    const validatedData = updateVendorSchema.parse(body)

    // Check if vendor exists
    const existingVendor = await db.vendor.findFirst({
      where: { id, tenantId: ctx.tenantId }
    })

    if (!existingVendor) {
      return NextResponse.json(
        { error: "Vendor not found" },
        { status: 404 }
      )
    }
    const updatedVendor = await db.vendor.update({
      where: { id, tenantId: ctx.tenantId },
      data: {
        ...(validatedData.name && { name: validatedData.name }),
        ...(validatedData.contactInfo && { contactInfo: validatedData.contactInfo }),
        ...(validatedData.categories && { categories: validatedData.categories }),
        ...(validatedData.certifications && { certifications: validatedData.certifications }),
        ...(validatedData.diversityAttrs && { diversityAttrs: validatedData.diversityAttrs }),
        ...(validatedData.isActive !== undefined && { isActive: validatedData.isActive }),
      },
      include: {
        _count: {
          select: {
            invitations: true,
            submissions: true,
            qna: true,
          }
        }
      }
    })

    // Log activity
    await db.activityLog.create({
      data: {
        tenantId: ctx.tenantId,
        actor: ctx.userId,
        action: "UPDATE_VENDOR",
        targetType: "Vendor",
        targetId: id,
        metadata: {
          changes: validatedData
        }
      }
    })

    return NextResponse.json(updatedVendor)
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 })
    if (error instanceof PermissionError) return NextResponse.json({ error: error.message }, { status: 403 })
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      )
    }

    console.error("Error updating vendor:", error)
    return NextResponse.json(
      { error: "Failed to update vendor" },
      { status: 500 }
    )
  }
}

// DELETE /api/v1/vendors/[id] - Delete vendor
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const ctx = getTenantContext(session)
    const { id } = await params

    // Check if vendor exists
    const existingVendor = await db.vendor.findFirst({
      where: { id, tenantId: ctx.tenantId }
    })

    if (!existingVendor) {
      return NextResponse.json(
        { error: "Vendor not found" },
        { status: 404 }
      )
    }
    await db.vendor.delete({
      where: { id, tenantId: ctx.tenantId }
    })

    // Log activity
    await db.activityLog.create({
      data: {
        tenantId: ctx.tenantId,
        actor: ctx.userId,
        action: "DELETE_VENDOR",
        targetType: "Vendor",
        targetId: id,
        metadata: {
          vendorName: existingVendor.name
        }
      }
    })

    return NextResponse.json({ message: "Vendor deleted successfully" })
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 })
    if (error instanceof PermissionError) return NextResponse.json({ error: error.message }, { status: 403 })
    console.error("Error deleting vendor:", error)
    return NextResponse.json(
      { error: "Failed to delete vendor" },
      { status: 500 }
    )
  }
}