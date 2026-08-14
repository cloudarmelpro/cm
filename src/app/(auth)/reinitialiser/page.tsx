"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { Field } from "@/components/section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";

function Formulaire() {
  const router = useRouter();
  const token = useSearchParams().get("token");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!token) {
    return (
      <AuthShell
        title="Lien invalide"
        description="Ce lien de réinitialisation est incomplet ou a expiré."
        footer={
          <Link href="/mot-de-passe-oublie" className="text-primary font-medium">
            Demander un nouveau lien
          </Link>
        }
      >
        <p className="text-muted-foreground text-sm">
          Les liens expirent au bout d&apos;une heure pour des raisons de
          sécurité.
        </p>
      </AuthShell>
    );
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (password.length < 8) {
      setError("Le mot de passe doit faire au moins 8 caractères.");
      return;
    }

    setLoading(true);
    setError(null);

    const { error } = await authClient.resetPassword({
      newPassword: password,
      token: token!,
    });

    setLoading(false);

    if (error) {
      setError(error.message ?? "Le lien a expiré ou a déjà été utilisé.");
      return;
    }

    router.push("/connexion");
  }

  return (
    <AuthShell
      title="Nouveau mot de passe"
      description="Choisissez un mot de passe que vous n'utilisez nulle part ailleurs."
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <Field
          label="Nouveau mot de passe"
          htmlFor="password"
          hint="8 caractères minimum."
        >
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>

        {error ? <p className="text-destructive text-sm">{error}</p> : null}

        <Button type="submit" disabled={loading} className="w-full gap-2">
          {loading ? <Loader2 className="size-4 animate-spin" /> : null}
          Enregistrer
        </Button>
      </form>
    </AuthShell>
  );
}

export default function ReinitialiserPage() {
  // `useSearchParams` impose une frontière Suspense au moment du prérendu.
  return (
    <Suspense>
      <Formulaire />
    </Suspense>
  );
}
