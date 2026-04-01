import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

const handler = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      // Add custom fields to session
      const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
      session.user.id = user.id;
      session.user.hasCompletedProfile = dbUser?.hasCompletedProfile;
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
    newUser: '/onboarding', // Redirect here first time
  }
});

export { handler as GET, handler as POST };