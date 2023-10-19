import NextAuth, { NextAuthOptions } from "next-auth";
import GitHubProvider from "next-auth/providers/github";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "../../../../prisma/prisma";
import axios from "axios";
import { novu } from "@trending/helpers/novu";

export const nextOptions: NextAuthOptions = {
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
  ],
  session: {
    strategy: "jwt",
  },
  adapter: PrismaAdapter(prisma),
  callbacks: {
    async jwt({ user, account, token, profile }) {
      if (account) {
        token.access_token = account.access_token;
      }
      if (user) {
        // @ts-ignore
        token.handle = user.handle;
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user) {
        // @ts-ignore
        session.user.id = token.sub;
        // @ts-ignore
        session.user.access_token = token.access_token;
        // @ts-ignore
        session.user.handle = token.handle;
      }

      return session;
    },
  },
  events: {
    async signIn({ user, account }) {
      // Get user email if we don't have it in public emails
      const { login } = await fetch("https://api.github.com/user", {
        headers: {
          Authorization: `Bearer ${account?.access_token}`,
        },
      }).then((res) => res.json());

      await prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          handle: login,
        },
      });

      await novu.subscribers.identify(user.email!, {
        email: user.email!,
      });

      try {
        await axios.post(
          `https://api.beehiiv.com/v2/publications/${process.env.BEEHIVE_PUBLICATION}/subscriptions`,
          {
            email: user.email,
            reactivate_existing: false,
            send_welcome_email: true,
            utm_source: "gitrend",
          },
          {
            headers: {
              Authorization: `Bearer ${process.env.BEEHIVE_API_KEY}`,
            },
          }
        );
      } catch (err) {
        console.log(err);
        throw err;
      }
    },
  },
};
export default NextAuth(nextOptions);
