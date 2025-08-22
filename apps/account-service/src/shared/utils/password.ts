import argon2 from 'argon2';

export async function hashPassword(password: string) {
  const hash = await argon2.hash(password, {
    type: argon2.argon2id,
    timeCost: 3, // ~iterations (CPU cost)
    memoryCost: 2 ** 15, // 32 MB memory
    parallelism: 1, // single thread
  });
  return hash;
}

export async function verifyPassword(hash: string, password: string) {
  return await argon2.verify(hash, password);
}
