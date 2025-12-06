import NextAuth from "next-auth";
import { initDB } from "@/lib/db";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

export const { auth, signIn, signOut, handlers } = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = typeof credentials.email === 'string' ? credentials.email : null;
        const password = typeof credentials.password === 'string' ? credentials.password : null;

        if (!email || !password) {
          return null;
        }

        // Ensure DB is initialized
        await initDB();
        // Lazy import to avoid circular dependency
        const { userRepository } = await import("./db");
        const userRepo = await userRepository();



        const user = await userRepo.findOne({
          where: { email },
        });



        if (!user) {

          return null;
        }


        const isPasswordValid = await bcrypt.compare(
          password,
          user.password
        );


        if (!isPasswordValid) {

          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    signOut: "/",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  trustHost: true,
});

