import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { getDb } from "@/db";
import * as schema from "@/db/schema";

const authOptions = {
  database: drizzleAdapter(getDb, {
    provider: "pg" as const,
    schema: {
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
      verification: schema.verifications,
    },
  }),
  emailAndPassword: {
    enabled: true,
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
    },
  },
};

type AuthInstance = ReturnType<typeof betterAuth<typeof authOptions>>;

let _auth: AuthInstance | null = null;

export function getAuth(): AuthInstance {
  if (!_auth) {
    _auth = betterAuth(authOptions);
  }
  return _auth;
}
