import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import bcrypt from "bcryptjs"
import { z } from "zod"
import { randomUUID } from "crypto"

const registerSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters")
    .regex(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Password must contain uppercase, lowercase, and number"),
  company: z.string().min(1, "Company name is required"),
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

    // Hash the password
    const hashedPassword = await bcrypt.hash(validatedData.password, 12)

    // Wrap multi-step writes in a transaction
    const result = await db.$transaction(async (tx) => {
      // Check if user already exists
      const existingUser = await tx.user.findFirst({
        where: {
          email: validatedData.email
        }
      })

      if (existingUser) {
        throw new Error('CONFLICT')
      }

      // Always create a new tenant for registration (never join an existing one)
      // Generate tenant ID server-side — never trust user input for this
      const generatedTenantId = randomUUID()
      const tenant = await tx.tenant.create({
        data: {
          id: generatedTenantId,
          name: validatedData.company,
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

      // Find or create a basic 'Member' role (NOT Tenant Admin)
      let userRole = await tx.role.findFirst({
        where: {
          tenantId: tenant.id,
          name: "Member"
        }
      })

      if (!userRole) {
        userRole = await tx.role.create({
          data: {
            tenantId: tenant.id,
            name: "Member",
            permissions: [
              "rfp:view",
              "submission:view",
              "approval:view"
            ]
          }
        })
      }

      // Create user with hashed password and real role ID
      const user = await tx.user.create({
        data: {
          tenantId: tenant.id,
          email: validatedData.email,
          name: `${validatedData.firstName} ${validatedData.lastName}`,
          password: hashedPassword,
          roleIds: [userRole.id],
          isActive: true
        }
      })

      return { user, tenant }
    })

    return NextResponse.json({
      success: true,
      message: "User registered successfully",
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        tenantId: result.tenant.id
      },
      tenant: {
        id: result.tenant.id,
        name: result.tenant.name
      }
    }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: "Validation Error", 
        details: error.issues 
      }, { status: 400 })
    }
    if (error instanceof Error && error.message === 'CONFLICT') {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 409 })
    }

    console.error("Registration error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}