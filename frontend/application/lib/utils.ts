import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
// lib/utils.ts or inline
export function getAvatarUrl(path?: string): string | null {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;

  const backendUrl =
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/v1\/?$/, "") ||
    "http://localhost:5000";

  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${backendUrl}${cleanPath}`;
}