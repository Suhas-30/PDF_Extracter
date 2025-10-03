import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const missing = (name: string) => {
  if (!process.env[name] || process.env[name]!.trim().length === 0) {
    console.error(`[auth] Missing required env variable: ${name}`);
    return true;
  }
  return false;
};

const hasMissingEnv = [
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "NEXTAUTH_SECRET",
  // NEXTAUTH_URL is recommended for correct callback URLs
  "NEXTAUTH_URL",
].some(missing);

if (hasMissingEnv) {
  // Throwing here makes the error visible immediately at server startup
  throw new Error(
    "One or more required env variables are missing. Check console for which ones are missing and set them in frontend/.env.local"
  );
}

console.log("[auth] Using Google Client ID:", (process.env.GOOGLE_CLIENT_ID || "").slice(0, 12) + "…");
console.log("[auth] NEXTAUTH_URL:", process.env.NEXTAUTH_URL);

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
};
