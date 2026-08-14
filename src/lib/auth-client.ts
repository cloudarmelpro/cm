"use client";

import { adminClient, organizationClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

/**
 * Les greffons déclarés ici doivent correspondre à ceux du serveur
 * (`src/lib/auth.ts`), sans quoi les méthodes correspondantes n'existent pas
 * côté client.
 */
export const authClient = createAuthClient({
  plugins: [adminClient(), organizationClient()],
});

export const { signIn, signUp, signOut, useSession } = authClient;
