import NextAuth, { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import { encode } from "next-auth/jwt"
import bcrypt from "bcryptjs"
import prisma from "@/lib/prisma"

export const authOptions: NextAuthOptions = {
  // Note: Not using PrismaAdapter with JWT strategy - we handle user creation manually in signIn callback
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true, // Allows linking OAuth accounts to existing email accounts
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        })

        if (!user || !user.password) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        )

        if (!isPasswordValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name || null,
          role: user.role,
        }
      }
    })
  ],
  session: {
    strategy: "jwt"
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      // For Google OAuth sign-ins, ensure user exists in database
      if (account?.provider === "google" && user.email) {
        try {
          let dbUser = await prisma.user.findUnique({
            where: { email: user.email }
          })

          if (!dbUser) {
            // Create new user for Google sign-in
            dbUser = await prisma.user.create({
              data: {
                email: user.email,
                name: user.name || null,
                image: user.image || null,
                emailVerified: new Date(), // Google emails are pre-verified
                role: "USER",
              }
            })
            console.log("[NextAuth] Created new Google user:", dbUser.email)
          } else if (!dbUser.name && user.name) {
            // Update existing user's name from Google if not set
            await prisma.user.update({
              where: { email: user.email },
              data: { name: user.name }
            })
          }

          // Ensure Account record exists for OAuth
          const existingAccount = await prisma.account.findFirst({
            where: {
              provider: account.provider,
              providerAccountId: account.providerAccountId,
            }
          })

          if (!existingAccount) {
            await prisma.account.create({
              data: {
                userId: dbUser.id,
                type: account.type,
                provider: account.provider,
                providerAccountId: account.providerAccountId,
                access_token: account.access_token,
                expires_at: account.expires_at,
                token_type: account.token_type,
                scope: account.scope,
                id_token: account.id_token,
              }
            })
            console.log("[NextAuth] Created Account link for:", dbUser.email)
          }

          // Attach the database user ID to the user object for JWT callback
          user.id = dbUser.id
          ;(user as any).role = dbUser.role
        } catch (error) {
          console.error("[NextAuth] Google signIn error:", error)
          return false
        }
      }
      return true
    },
    async jwt({ token, user, account }) {
      // On sign-in, user object is populated - update token with fresh data
      if (user) {
        token.id = user.id
        token.email = user.email
        token.name = user.name
        token.picture = user.image
        token.role = (user as any).role || "USER"
        console.log("[NextAuth] JWT updated for user:", user.email)

        // Encode the token once at sign-in for WebSocket authentication
        token.accessToken = await encode({
          token,
          secret: process.env.NEXTAUTH_SECRET!,
        })
      }

      return token
    },
    async session({ session, token }) {
      // Always use token data for session (token is refreshed on sign-in)
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.name = token.name as string | null
        session.user.email = token.email as string
      }
      // Copy the pre-encoded token for WebSocket authentication
      session.accessToken = token.accessToken as string
      return session
    },
  },
  pages: {
    signIn: "/login",
    // signUp: "/signup", // NextAuth doesn't have a signUp page config, but we keep the page
    error: "/auth/error",
  },
  secret: process.env.NEXTAUTH_SECRET,
}

export default NextAuth(authOptions)