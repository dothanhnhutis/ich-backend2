import crypto from "crypto";
import { z } from "zod";
import bcryptjs from "bcryptjs";

export const hashData = (data: string) => {
  const salt = bcryptjs.genSaltSync(10);
  return bcryptjs.hashSync(data, salt);
};

export const compareData = (hash: string, input: string): Promise<boolean> => {
  return bcryptjs.compare(input, hash).catch((e) => false);
};

export function encrypt(text: string, secret: string) {
  const secretValidate = z
    .string()
    .refine(
      (key) => {
        const keyBuffer = Buffer.from(key, "base64");
        return keyBuffer.length === 32; // Kiểm tra độ dài 32 byte
      },
      {
        message:
          "The secret key must be 32 bytes long when decoded from base64.",
      }
    )
    .safeParse(secret);
  if (!secretValidate.success)
    throw new Error(secretValidate.error.issues[0].message);
  const iv = crypto.randomBytes(16); // Generate a random IV (Initialization Vector)
  const cipher = crypto.createCipheriv(
    "aes-256-cbc",
    Buffer.from(secretValidate.data, "base64"),
    iv
  );
  let encrypted = cipher.update(text, "utf8", "hex") + cipher.final("hex");
  return iv.toString("hex") + "." + encrypted;
}
export function decrypt(encrypted: string, secret: string) {
  const secretValidate = z
    .string()
    .refine(
      (key) => {
        const keyBuffer = Buffer.from(key, "base64");
        return keyBuffer.length === 32; // Kiểm tra độ dài 32 byte
      },
      {
        message:
          "The secret key must be 32 bytes long when decoded from base64.",
      }
    )
    .safeParse(secret);
  if (!secretValidate.success)
    throw new Error(secretValidate.error.issues[0].message);
  const parts = encrypted.split(".");
  const iv = Buffer.from(parts[0], "hex");
  const decipher = crypto.createDecipheriv(
    "aes-256-cbc",
    Buffer.from(secretValidate.data, "base64"),
    iv
  );
  let decrypted =
    decipher.update(parts[1], "hex", "utf8") + decipher.final("utf8");
  return decrypted;
}

export function genid(userId: string) {
  const randomId = crypto.randomBytes(10).toString("hex");
  return `${userId}:${randomId}`;
}
