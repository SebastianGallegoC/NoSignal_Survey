export interface JwtPayloadShape {
  sub?: string;
  exp?: number;
}

export const decodeJwtPayload = (token: string): JwtPayloadShape | null => {
  try {
    const parts = token.split('.');
    if (parts.length < 2) {
      return null;
    }
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const json = atob(padded);
    return JSON.parse(json) as JwtPayloadShape;
  } catch {
    return null;
  }
};

const CLOCK_SKEW_MS = 30_000;

export const isAccessTokenValid = (token: string | null): boolean => {
  if (!token) {
    return false;
  }
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) {
    return false;
  }
  return payload.exp * 1000 > Date.now() + CLOCK_SKEW_MS;
};
