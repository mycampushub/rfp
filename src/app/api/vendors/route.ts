import { NextRequest, NextResponse } from "next/server"
import { requireAuth, requirePermission } from "@/lib/auth-utils"
import { PERMISSIONS } from "@/types/auth"
import { db } from "@/lib/db"
import { z } from "zod"

const createVendorSchema = z.object({
  name: z.string().min(1),
  contactInfo: z.object({
    email: z.string().email().optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
  }).optional(),
  categories: z.array(z.string()).optional(),
  certifications: z.array(z.string()).optional(),
  diversityAttrs: z.object({
    isMinorityOwned: z.boolean().optional(),
    isWomenOwned: z.boolean().optional(),
    isVeteranOwned: z.boolean().optional(),
    isDisabilityOwned: z.boolean().optional(),
  }).optional(),
})

// GET /api/vendors - List vendors
export async function GET(request: NextRequest) {
  try {
    await requireAuth()
    
    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category")
    const certification = searchParams.get("certification")
    const search = searchParams.get("search")

    const where: any = {
      // tenantId: (await getCurrentUser()).tenantId
    }

    if (category) {
      where.categories = {
        contains: category,
      }
    }

    if (certification) {
      where.certifications = {
        contains: certification,
      }
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { contactInfo: { path: "$.email", string_contains: search, mode: "insensitive" } },
      ]
    }

    const vendors = await db.vendor.findMany({
      where,
      include: {
        _count: {
          select: {
            invitations: true,
            submissions: true,
          },
        },
      },
      orderBy: { name: "asc" },
    })

    return NextResponse.json(vendors)
  } catch (error) {
    console.error("Error fetching vendors:", error)
    return NextResponse.json(
      { error: "Failed to fetch vendors" },
      { status: 500 }
    )
  }
}

// POST /api/vendors - Create vendor
export async function POST(request: NextRequest) {
  try {
    await requirePermission(PERMISSIONS.CREATE_VENDOR)
    
    const body = await request.json()
    const validatedData = createVendorSchema.parse(body)

    // TODO: Get tenant ID from current user
    const tenantId = "default-tenant-id"

    const vendor = await db.vendor.create({
      data: {
        tenantId,
        name: validatedData.name,
        contactInfo: validatedData.contactInfo,
        categories: validatedData.categories,
        certifications: validatedData.certifications,
        diversityAttrs: validatedData.diversityAttrs,
      },
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