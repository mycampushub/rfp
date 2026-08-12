import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { getTenantContext, AuthError, PermissionError } from "@/lib/tenant-context"
import { z } from "zod"

const updateVendorSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  website: z.string().optional(),
  location: z.string().optional(),
  contactInfo: z.any().optional(),
  categories: z.array(z.string()).optional(),
  certifications: z.array(z.string()).optional(),
  diversityAttrs: z.any().optional(),
  isActive: z.boolean().optional(),
})

/** Strip internal fields from a vendor object before returning to the client */
function toPublicVendor(vendor: Record<string, unknown>) {
  return {
    id: vendor.id,
    name: vendor.name,
    email: vendor.email,
    phone: vendor.phone,
    website: vendor.website,
    location: vendor.location,
    categories: vendor.categories,
    rating: vendor.rating,
    isActive: vendor.isActive,
    description: vendor.description,
    verified: vendor.verified,
    logo: vendor.logo,
    certifications: vendor.certifications,
    diversityAttrs: vendor.diversityAttrs,
    contactInfo: vendor.contactInfo,
    _count: vendor._count,
    submissions: vendor.submissions,
    contracts: vendor.contracts,
    createdAt: vendor.createdAt,
    updatedAt: vendor.updatedAt,
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const ctx = getTenantContext(session)
    const { id } = await params

    const vendor = await db.vendor.findFirst({
      where: { id, tenantId: ctx.tenantId },
      include: {
        _count: {
          select: { submissions: true, invitations: true },
        },
        submissions: {
          include: {
            rfp: {
              select: {
                id: true,
                title: true,
                status: true,
                category: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        contracts: {
          include: {
            rfp: {
              select: {
                id: true,
                title: true,
                status: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!vendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 })
    }

    return NextResponse.json(toPublicVendor(vendor as unknown as Record<string, unknown>))
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 })
    if (error instanceof PermissionError) return NextResponse.json({ error: error.message }, { status: 403 })
    console.error("Error fetching vendor:", error)
    return NextResponse.json({ error: "Failed to fetch vendor" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const ctx = getTenantContext(session)
    const { id } = await params

    const existing = await db.vendor.findFirst({
      where: { id, tenantId: ctx.tenantId },
    })
    if (!existing) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 })
    }

    const body = await request.json()
    const data = updateVendorSchema.parse(body)

    const vendor = await db.vendor.update({
      where: { id },
      data,
    })

    return NextResponse.json(toPublicVendor(vendor as unknown as Record<string, unknown>))
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 })
    if (error instanceof PermissionError) return NextResponse.json({ error: error.message }, { status: 403 })
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Validation failed", details: error.issues }, { status: 400 })
    console.error("Error updating vendor:", error)
    return NextResponse.json({ error: "Failed to update vendor" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const ctx = getTenantContext(session)
    const { id } = await params

    const existing = await db.vendor.findFirst({
      where: { id, tenantId: ctx.tenantId },
    })
    if (!existing) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 })
    }

    await db.vendor.update({
      where: { id },
      data: { isActive: false },
    })

    return NextResponse.json({ message: "Vendor deactivated successfully" })
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 })
    if (error instanceof PermissionError) return NextResponse.json({ error: error.message }, { status: 403 })
    console.error("Error deactivating vendor:", error)
    return NextResponse.json({ error: "Failed to deactivate vendor" }, { status: 500 })
  }
}
