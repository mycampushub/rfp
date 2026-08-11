import { NextAuthOptions } from "next-auth"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import CredentialsProvider from "next-auth/providers/credentials"
import { db } from "@/lib/db"
import { compare } from "bcryptjs"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db) as any,
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        businessId: { label: "Business ID", type: "text" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password || !credentials?.businessId) {
          return null
        }

        // X26: Account lockout — rate limit login attempts
        const { loginRateLimit } = await import("@/lib/rate-limiter")
        const rl = loginRateLimit(`${credentials.email}:${credentials.businessId}`)
        if (!rl.success) {
          throw new Error(`Too many login attempts. Try again in ${Math.ceil((rl.resetAt - Date.now()) / 60000)} minutes.`)
        }

        const user = await db.user.findFirst({
          where: {
            email: credentials.email,
            tenantId: credentials.businessId,
            isActive: true
          }
        })

        if (!user || !user.password) {
          return null
        }

        const isValidPassword = await compare(credentials.password, user.password)
        if (!isValidPassword) {
          return null
        }

        // Resolve role names for JWT embedding
        // roleIds is stored as Json? in the DB; safe cast: we always write string[]
        const rawRoleIds = user.roleIds
        const roleIds = (Array.isArray(rawRoleIds) ? rawRoleIds : []) as string[]
        let roleNames: string[] = []
        if (roleIds.length > 0) {
          const roles = await db.role.findMany({
            where: { id: { in: roleIds } },
            select: { name: true },
          })
          roleNames = roles.map(r => r.name)
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          tenantId: user.tenantId,
          roleIds: user.roleIds,
          roleNames,
        }
      }
    })
  ],
  // X27: Session expires in 8 hours
  session: {
    strategy: "jwt" as const,
    maxAge: 8 * 60 * 60, // 8 hours
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.tenantId = user.tenantId
        token.roleIds = user.roleIds
        token.roleNames = user.roleNames
        // X27: Set token expiration to match session maxAge
        token.exp = Math.floor(Date.now() / 1000) + 8 * 60 * 60
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!
        session.user.tenantId = token.tenantId as string
        // roleIds stored as Json in DB, embedded in JWT token — cast to string[]
        session.user.roleIds = Array.isArray(token.roleIds) ? (token.roleIds as string[]) : []
      }
      return session
    }
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error"
  }
}
