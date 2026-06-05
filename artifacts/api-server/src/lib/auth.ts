import bcrypt from "bcryptjs";

export const CLAN_TAG = "S²十";

export function buildClanTag(username: string): string {
  return `${CLAN_TAG}${username}`;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function isManagement(role: string): boolean {
  return role === "CLAN_MASTER" || role === "ADMIN";
}

export function requireAuth(req: any, res: any, next: any): void {
  if (!req.session?.userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  next();
}

export function requireManagement(req: any, res: any, next: any): void {
  if (!req.session?.userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  if (!isManagement(req.session.role || "")) {
    res.status(403).json({ error: "Insufficient permissions" });
    return;
  }
  next();
}
