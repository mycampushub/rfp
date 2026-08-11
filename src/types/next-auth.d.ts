import { DefaultSession } from "next-auth"
import { DefaultJWT } from "next-auth/jwt"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      image?: string | null
      tenantId: string
      roleIds: string[]
    } & DefaultSession["user"]
  }

  interface User {
    tenantId: string
    roleIds: unknown // Json? from Prisma — cast to string[] at usage sites
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    sub: string
    tenantId: string
    roleIds: unknown
    iat?: number
    exp?: number
  }
}
