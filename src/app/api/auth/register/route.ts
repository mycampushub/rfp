import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import bcrypt from "bcryptjs"
import { z } from "zod"

const registerSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters")
    .regex(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Password must contain uppercase, lowercase, and number"),
  company: z.string().min(1, "Company name is required"),
  businessId: z.string().min(1, "Business ID is required"),
  phone: z.string().min(1, "Phone number is required"),
  agreeToTerms: z.boolean().refine(val => val === true, "You must agree to the terms and conditions"),
  agreeToPrivacy: z.boolean().refine(val => val === true, "You must agree to the privacy policy")
})

export async function POST(request: NextRequest) {
  try {
    // Check if user is already authenticated
    const session = await getServerSession(authOptions)
    if (session) {
      return NextResponse.json({ error: "Already authenticated" }, { status: 400 })
    }

    const body = await request.json()
    const validatedData = registerSchema.parse(body)

    // Check if user already exists
    const existingUser = await db.user.findFirst({
      where: {
        email: validatedData.email
      }
    })

    if (existingUser) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 409 })
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(validatedData.password, 12)

    // Create or get tenant using the provided businessId
    let tenant = await db.tenant.findFirst({
      where: {
        id: validatedData.businessId
      }
    })

    if (!tenant) {
      // Create new tenant with the provided businessId as the ID
      tenant = await db.tenant.create({
        data: {
          id: validatedData.businessId,
          name: validatedData.company,
          plan: "standard", // Default plan
          region: "US", // Default region
          settings: {
            notifications: {
              emailEnabled: true,
              smsEnabled: false
            },
            security: {
              mfaRequired: false,
              sessionTimeout: 3600
            }
          }
        }
      })
    }

    // Create default role for the user
    const userRole = await db.role.findFirst({
      where: {
        tenantId: tenant.id,
        name: "Tenant Admin"
      }
    })

    if (!userRole) {
      // Create default role
      await db.role.create({
        data: {
          tenantId: tenant.id,
          name: "Tenant Admin",
          permissions: [
            "admin:users",
            "admin:roles", 
            "rfp:create",
            "rfp:edit",
            "rfp:view",
            "rfp:delete",
            "vendor:invite",
            "vendor:view",
            "submission:view",
            "score:create",
            "score:edit"
          ]
        }
      })
    }

    // Create user
    const user = await db.user.create({
      data: {
        tenantId: tenant.id,
        email: validatedData.email,
        name: `${validatedData.firstName} ${validatedData.lastName}`,
        roleIds: ["Tenant Admin"], // Default role
        isActive: true
      }
    })

    // In a real application, you would:
    // 1. Send a verification email
    // 2. Create audit log entry
    // 3. Send welcome notification
    // 4. Set up default preferences

    return NextResponse.json({
      success: true,
      message: "User registered successfully",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        tenantId: tenant.id
      },
      tenant: {
        id: tenant.id,
        name: tenant.name
      }
    }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: "Validation Error", 
        details: error.errors 
      }, { status: 400 })
    }

    console.error("Registration error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}