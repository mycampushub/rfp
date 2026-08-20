import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { getTenantContext, AuthError, PermissionError } from "@/lib/tenant-context"
import { requirePermission } from "@/lib/rbac"
import { z } from "zod"

const createVendorSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  website: z.string().optional(),
  location: z.string().optional(),
  contactInfo: z.any().optional(),
  categories: z.array(z.string()).optional(),
  certifications: z.array(z.string()).optional(),
  specialties: z.array(z.string()).optional(),
  portfolio: z.array(z.string()).optional(),
  serviceAreas: z.array(z.string()).optional(),
  languages: z.array(z.string()).optional(),
  paymentMethods: z.array(z.string()).optional(),
  references: z.array(z.string()).optional(),
  socialMedia: z.any().optional(),
  diversityAttrs: z.object({
    isMinorityOwned: z.boolean().optional(),
    isWomenOwned: z.boolean().optional(),
    isVeteranOwned: z.boolean().optional(),
    isDisabilityOwned: z.boolean().optional(),
  }).optional(),
  // Additional business detail fields stored in contactInfo JSON
  businessType: z.string().optional(),
  taxId: z.string().optional(),
  insurance: z.string().optional(),
  licenseNumber: z.string().optional(),
  employees: z.string().optional(),
  yearFounded: z.string().optional(),
  hourlyRate: z.string().optional(),
  responseTime: z.string().optional(),
  availability: z.string().optional(),
  ndaSigned: z.boolean().optional(),
  backgroundCheck: z.boolean().optional(),
})

// GET /api/vendors - List vendors
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const ctx = getTenantContext(session)

    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category")
    const certification = searchParams.get("certification")
    const search = searchParams.get("search")

    const where: Record<string, unknown> = { tenantId: ctx.tenantId }

    if (category) {
      (where as Record<string, unknown>).categories = { contains: category }
    }
    if (certification) {
      (where as Record<string, unknown>).certifications = { contains: certification }
    }
    if (search) {
      (where as Record<string, unknown>).OR = [
        { name: { contains: search } },
        { contactInfo: { path: "$.email", string_contains: search } },
      ]
    }

    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const skip = (page - 1) * limit

    const [vendors, total] = await Promise.all([
      db.vendor.findMany({
        where,
        include: {
          _count: {
            select: { invitations: true, submissions: true },
          },
        },
        orderBy: { name: "asc" },
        take: limit,
        skip,
      }),
      db.vendor.count({ where }),
    ])

    return NextResponse.json({
      data: vendors,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    })
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 })
    console.error("Error fetching vendors:", error)
    return NextResponse.json({ error: "Failed to fetch vendors" }, { status: 500 })
  }
}

// POST /api/vendors - Create vendor
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const ctx = getTenantContext(session)
    await requirePermission('vendor:create')

    const body = await request.json()
    const validatedData = createVendorSchema.parse(body)

    // Build the contactInfo JSON from legacy contactInfo + extra fields
    // that don't have direct columns on the Vendor model
    const enrichedContactInfo = {
      ...(typeof validatedData.contactInfo === 'object' && validatedData.contactInfo !== null
        ? validatedData.contactInfo as Record<string, unknown>
        : {}),
      // Store extra business details inside contactInfo JSON
    }
    if (validatedData.businessType) enrichedContactInfo.businessType = validatedData.businessType
    if (validatedData.taxId) enrichedContactInfo.taxId = validatedData.taxId
    if (validatedData.insurance) enrichedContactInfo.insurance = validatedData.insurance
    if (validatedData.licenseNumber) enrichedContactInfo.licenseNumber = validatedData.licenseNumber
    if (validatedData.employees) enrichedContactInfo.employees = validatedData.employees
    if (validatedData.yearFounded) enrichedContactInfo.yearFounded = validatedData.yearFounded
    if (validatedData.hourlyRate) enrichedContactInfo.hourlyRate = validatedData.hourlyRate
    if (validatedData.responseTime) enrichedContactInfo.responseTime = validatedData.responseTime
    if (validatedData.availability) enrichedContactInfo.availability = validatedData.availability
    if (validatedData.ndaSigned != null) enrichedContactInfo.ndaSigned = validatedData.ndaSigned
    if (validatedData.backgroundCheck != null) enrichedContactInfo.backgroundCheck = validatedData.backgroundCheck
    if (validatedData.specialties?.length) enrichedContactInfo.specialties = validatedData.specialties
    if (validatedData.portfolio?.length) enrichedContactInfo.portfolio = validatedData.portfolio
    if (validatedData.serviceAreas?.length) enrichedContactInfo.serviceAreas = validatedData.serviceAreas
    if (validatedData.languages?.length) enrichedContactInfo.languages = validatedData.languages
    if (validatedData.paymentMethods?.length) enrichedContactInfo.paymentMethods = validatedData.paymentMethods
    if (validatedData.references?.length) enrichedContactInfo.references = validatedData.references
    if (validatedData.socialMedia && Object.keys(validatedData.socialMedia).length > 0) {
      enrichedContactInfo.socialMedia = validatedData.socialMedia
    }

    const vendor = await db.vendor.create({
      data: {
        tenantId: ctx.tenantId,
        name: validatedData.name,
        description: validatedData.description,
        email: validatedData.email,
        phone: validatedData.phone,
        website: validatedData.website,
        location: validatedData.location,
        contactInfo: enrichedContactInfo as unknown as object,
        categories: validatedData.categories,
        certifications: validatedData.certifications,
        diversityAttrs: validatedData.diversityAttrs,
      },
    })

    return NextResponse.json(vendor, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.issues }, { status: 400 })
    }
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 })
    if (error instanceof PermissionError) return NextResponse.json({ error: error.message }, { status: 403 })
    console.error("Error creating vendor:", error)
    return NextResponse.json({ error: "Failed to create vendor" }, { status: 500 })
  }
}
