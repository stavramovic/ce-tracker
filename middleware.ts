// src/middleware.ts
// Ide u koren src/ foldera (isti nivo kao app/), NE u src/lib/

import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Pokreni middleware na svim rutama OSIM:
     * - _next/static, _next/image (Next.js interni fajlovi)
     * - favicon.ico
     * - slike (svg, png, jpg, jpeg, gif, webp)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};