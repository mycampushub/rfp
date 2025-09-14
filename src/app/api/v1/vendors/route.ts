import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { requireAuth, requirePermission } from "@/lib/auth-utils"
import { db } from "@/lib/db"
import { PERMISSIONS } from "@/types/auth"
import { z } from "zod"

const createVendorSchema = z.object({
  name: z.string().min(1, "Vendor name is required"),
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
})

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

// GET /api/v1/vendors - List vendors
export async function GET(request: NextRequest) {
  try {
    await requireAuth()
    await requirePermission(PERMISSIONS.VIEW_RFP)

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const category = searchParams.get("category")
    const search = searchParams.get("search")
    const isActive = searchParams.get("isActive")

    const skip = (page - 1) * limit

    const where: any = {}
    
    if (category) {
      where.categories = {
        contains: category
      }
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { contactInfo: { path: "$.email", string_contains: search, mode: "insensitive" } },
      ]
    }
    if (isActive !== null) {
      where.isActive = isActive === "true"
    }

    const [vendors, total] = await Promise.all([
      db.vendor.findMany({
        where,
        include: {
          _count: {
            select: {
              invitations: true,
              submissions: true,
              qna: true,
            }
          }
        },
        skip,
        take: limit,
        orderBy: { name: "asc" }
      }),
      db.vendor.count({ where })
    ])

    return NextResponse.json({
      data: vendors,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error("Error fetching vendors:", error)
    return NextResponse.json(
      { error: "Failed to fetch vendors" },
      { status: 500 }
    )
  }
}

// POST /api/v1/vendors - Create vendor
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth()
    await requirePermission(PERMISSIONS.CREATE_VENDOR)

    const body = await request.json()
    const validatedData = createVendorSchema.parse(body)

    // Get tenant ID from session
    const tenantId = session.user.tenantId

    // Create vendor
    const vendor = await db.vendor.create({
      data: {
        tenantId,
        name: validatedData.name,
        contactInfo: validatedData.contactInfo,
        categories: validatedData.categories,
        certifications: validatedData.certifications,
        diversityAttrs: validatedData.diversityAttrs,
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
        tenantId,
        actor: session.user.id,
        action: "CREATE_VENDOR",
        targetType: "Vendor",
        targetId: vendor.id,
        metadata: {
          vendorName: vendor.name
        }
      }
    })

    return NextResponse.json(vendor, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Error creating vendor:", error)
    return NextResponse.json(
      { error: "Failed to create vendor" },
      { status: 500 }
    )
  }
}