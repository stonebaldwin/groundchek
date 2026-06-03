import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { magicLink } from "better-auth/plugins";
import { accounts, getDb, sessions, users, verifications } from "@groundbreak/db";
import { env, requireEnv } from "./env";
import { sendMagicLinkEmail } from "./email";

function buildAuth() {
  return betterAuth({
    secret: requireEnv("BETTER_AUTH_SECRET"),
    baseURL: env("BETTER_AUTH_URL") ?? env("NEXT_PUBLIC_APP_URL"),
    database: drizzleAdapter(getDb(), {
      provider: "pg",
      schema: { user: users, session: sessions, account: accounts, verification: verifications },
    }),
    emailAndPassword: { enabled: true, requireEmailVerification: false },
    session: { expiresIn: 60 * 60 * 24 * 30, updateAge: 60 * 60 * 24 },
    plugins: [
      magicLink({
        sendMagicLink: async ({ email, url }) => {
          await sendMagicLinkEmail(email, url);
        },
      }),
    ],
  });
}

type AuthInstance = ReturnType<typeof buildAuth>;
let cached: AuthInstance | undefined;

/**
 * Lazily build the Better Auth instance, memoized per isolate. On Workers the
 * secret + DATABASE_URL are only available inside a request scope, so we
 * construct on first use rather than at module load (keeps the build safe).
 */
export function getAuth(): AuthInstance {
  cached ??= buildAuth();
  return cached;
}
