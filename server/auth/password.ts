import "server-only";

import argon2 from "argon2";

/** 生成密码哈希（Argon2id） */
export async function hashPassword(password: string) {
  return argon2.hash(password, {
    type: argon2.argon2id,
  });
}

/** 校验密码是否与数据库中的哈希匹配 */
export async function verifyPassword(
  password: string,
  passwordHash: string,
) {
  return argon2.verify(passwordHash, password);
}
