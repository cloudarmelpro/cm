import { type NextRequest, NextResponse } from "next/server";

/**
 * Protection des routes. En Next.js 16 ce fichier remplace `middleware.ts`.
 *
 * Le contrôle fait ici est **optimiste** : il regarde seulement si un cookie de
 * session existe, sans interroger la base. C'est volontaire — vérifier la
 * session à chaque requête coûterait un aller-retour base sur chaque
 * navigation, y compris pour les fichiers statiques.
 *
 * La vraie autorisation est faite côté serveur par `requireViewer()`, qui lit
 * la session pour de bon. Ce filtre n'est qu'un raccourci de confort : il évite
 * d'afficher une page vide à quelqu'un qui n'est pas connecté.
 */
const PUBLIC_ROUTES = [
  "/connexion",
  "/inscription",
  "/mot-de-passe-oublie",
  "/reinitialiser",
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Les routes d'authentification et les ressources internes passent toujours.
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  const isPublic = PUBLIC_ROUTES.some((route) => pathname.startsWith(route));
  const hasSession = request.cookies
    .getAll()
    .some((cookie) => cookie.name.includes("session_token"));

  if (!hasSession && !isPublic) {
    const url = new URL("/connexion", request.url);
    return NextResponse.redirect(url);
  }

  if (hasSession && isPublic) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
