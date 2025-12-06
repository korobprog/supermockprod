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

        // Проверка админ доступа через переменные окружения
        const adminUser = process.env.ADMIN_USER;
        const adminPass = process.env.ADMIN_PASS;

        if (adminUser && adminPass && email === adminUser && password === adminPass) {
          // Возвращаем виртуального админ пользователя с валидным UUID
          // Используем специальный UUID для виртуального админа
          const { VIRTUAL_ADMIN_ID } = await import("./auth-helpers");
          return {
            id: VIRTUAL_ADMIN_ID,
            email: adminUser,
            name: 'Admin',
            role: 'ADMIN',
          };
        }

        // Обычная проверка через базу данных
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
        // Защита: если ID не валидный UUID и это не виртуальный админ, используем виртуальный админ ID
        const { VIRTUAL_ADMIN_ID } = await import("./auth-helpers");
        const userId = user.id;
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        
        // Если ID не валидный UUID (например, старый "admin-env-user"), заменяем на виртуальный админ ID
        if (userId && !uuidRegex.test(userId) && (user as any).role === 'ADMIN') {
          token.id = VIRTUAL_ADMIN_ID;
        } else {
          token.id = userId;
        }
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        // Защита: если ID в токене не валидный UUID, заменяем на виртуальный админ ID
        const { VIRTUAL_ADMIN_ID, isVirtualAdmin } = await import("./auth-helpers");
        const tokenId = token.id as string;
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        
        // Если ID не валидный UUID и роль ADMIN, используем виртуальный админ ID
        if (tokenId && !uuidRegex.test(tokenId) && token.role === 'ADMIN') {
          (session.user as any).id = VIRTUAL_ADMIN_ID;
        } else {
          (session.user as any).id = tokenId;
        }
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

