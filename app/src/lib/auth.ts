import crypto from "crypto";
import { cookies } from "next-headers"; // Wait, in Next.js App Router we can import cookies from 'next/headers'

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-family-tree-key-change-this-in-prod-12345";

export interface SessionPayload {
  userId: string;
  username: string;
  role: string;
  exp: number;
}

// ── PASSWORD HASHING ──

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, originalHash] = stored.split(":");
  if (!salt || !originalHash) return false;
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
  return hash === originalHash;
}

// ── SESSION SIGNING & VERIFYING ──

export function signSession(payload: Omit<SessionPayload, "exp">, expiresInDays = 7): string {
  const exp = Math.floor(Date.now() / 1000) + expiresInDays * 24 * 60 * 60;
  const fullPayload: SessionPayload = { ...payload, exp };
  
  const encodedPayload = Buffer.from(JSON.stringify(fullPayload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(encodedPayload)
    .digest("base64url");
    
  return `${encodedPayload}.${signature}`;
}

export function verifySession(token: string): SessionPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return null;
    
    const [encodedPayload, signature] = parts;
    const expectedSignature = crypto
      .createHmac("sha256", JWT_SECRET)
      .update(encodedPayload)
      .digest("base64url");
      
    if (signature !== expectedSignature) return null;
    
    const payloadStr = Buffer.from(encodedPayload, "base64url").toString("utf8");
    const payload = JSON.parse(payloadStr) as SessionPayload;
    
    if (Date.now() / 1000 > payload.exp) {
      return null; // Expired
    }
    
    return payload;
  } catch {
    return null;
  }
}
