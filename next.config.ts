import type { NextConfig } from "next";

/**
 * En-têtes de sécurité. Vercel ne pose que HSTS : le reste est à la charge de
 * l'application. Pas de CSP stricte ici — Next injecte des styles et des scripts
 * en ligne, une CSP posée sans nonce casserait la page. Les quatre en-têtes
 * ci-dessous n'ont, eux, aucun effet de bord.
 */
const securityHeaders = [
  // Empêche l'app d'être encadrée dans un iframe (clickjacking).
  { key: "X-Frame-Options", value: "DENY" },
  // Interdit au navigateur de deviner un type MIME différent de celui annoncé.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Ne fuite pas l'URL complète vers les sites tiers.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // L'application n'a besoin ni de caméra, ni de micro, ni de géolocalisation.
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
];

const nextConfig: NextConfig = {
  reactCompiler: true,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
