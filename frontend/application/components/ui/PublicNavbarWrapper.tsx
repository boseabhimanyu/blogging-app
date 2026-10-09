"use client";

import { usePathname } from "next/navigation";
import { GlassNavbar } from "./GlassNavbar";

export function PublicNavbarWrapper() {
  const pathname = usePathname();

  // Hide on dashboard routes (which have their own sidebar)
  if (pathname.startsWith("/dashboard")) {
    return null;
  }

  return <GlassNavbar />;
}