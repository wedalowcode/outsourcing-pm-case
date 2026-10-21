import "server-only";

import argon2 from "argon2";

import { db } from "@/lib/db";
import type { LoginFormValues } from "@/server/auth/schema";

export type CredentialFailureReason =
  | "INVALID_CREDENTIALS"
  | "ACCOUNT_DISABLED";

export type CredentialResult =
  | {
      ok: true;
      user: {
        id: string;
        username: string;
        name: string;
      };
    }
  | {
      ok: false;
      reason: CredentialFailureReason;
    };

export async function verifyCredentials(
  input: LoginFormValues,
): Promise<CredentialResult> {
  const user = await db.user.findUnique({
    where: {
      username: input.username,
    },
    select: {
      id: true,
      username: true,
      name: true,
      passwordHash: true,
      status: true,
    },
  });

  if (!user) {
    return {
      ok: false,
      reason: "INVALID_CREDENTIALS",
    };
  }

  if (user.status !== "ACTIVE") {
    return {
      ok: false,
      reason: "ACCOUNT_DISABLED",
    };
  }

  const passwordMatches = await argon2.verify(
    user.passwordHash,
    input.password,
  );

  if (!passwordMatches) {
    return {
      ok: false,
      reason: "INVALID_CREDENTIALS",
    };
  }

  return {
    ok: true,
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
    },
  };
}
