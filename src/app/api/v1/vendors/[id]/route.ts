import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { requireAuth, requirePermission } from "@/lib/auth-utils"
import { db } from "@/lib/db"
import { PERMISSIONS } from "@/types/auth"
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
  params: {
    id: string
  }
}

// GET /api/v1/vendors/[id] - Get single vendor
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAuth()
    await requirePermission(PERMISSIONS.VIEW_RFP)

    const vendor = await db.vendor.findUnique({
      where: { id: params.id },
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
    const session = await requireAuth()
    await requirePermission(PERMISSIONS.EDIT_VENDOR)

    const body = await request.json()
    const validatedData = updateVendorSchema.parse(body)

    // Check if vendor exists
    const existingVendor = await db.vendor.findUnique({
      where: { id: params.id }
    })

    if (!existingVendor) {
      return NextResponse.json(
        { error: "Vendor not found" },
        { status: 404 }
      )
    }

    // Update vendor
    const updatedVendor = await db.vendor.update({
      where: { id: params.id },
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
        tenantId: session.user.tenantId,
        actor: session.user.id,
        action: "UPDATE_VENDOR",
        targetType: "Vendor",
        targetId: params.id,
        metadata: {
          changes: validatedData
        }
      }
    })

    return NextResponse.json(updatedVendor)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
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
    const session = await requireAuth()
    await requirePermission(PERMISSIONS.DELETE_VENDOR)

    // Check if vendor exists
    const existingVendor = await db.vendor.findUnique({
      where: { id: params.id }
    })

    if (!existingVendor) {
      return NextResponse.json(
        { error: "Vendor not found" },
        { status: 404 }
      )
    }

    // Delete vendor (Prisma will handle cascading deletes)
    await db.vendor.delete({
      where: { id: params.id }
    })

    // Log activity
    await db.activityLog.create({
      data: {
        tenantId: session.user.tenantId,
        actor: session.user.id,
        action: "DELETE_VENDOR",
        targetType: "Vendor",
        targetId: params.id,
        metadata: {
          vendorName: existingVendor.name
        }
      }
    })

    return NextResponse.json({ message: "Vendor deleted successfully" })
  } catch (error) {
    console.error("Error deleting vendor:", error)
    return NextResponse.json(
      { error: "Failed to delete vendor" },
      { status: 500 }
    )
  }
}