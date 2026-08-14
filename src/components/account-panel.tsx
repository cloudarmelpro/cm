"use client";

import { ArrowLeft, Download, Loader2, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Field, Section } from "@/components/section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { deleteAccount, exportAccount } from "@/lib/account";
import { authClient } from "@/lib/auth-client";
import type { QuotaState } from "@/lib/quota-shared";
import type { Viewer } from "@/lib/session";

export function AccountPanel({
  viewer,
  quota,
}: {
  viewer: Viewer;
  quota: QuotaState;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirmation, setConfirmation] = useState("");
  const [wantsDelete, setWantsDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function download() {
    startTransition(async () => {
      const data = await exportAccount();
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `cm-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  function remove() {
    setError(null);
    startTransition(async () => {
      const result = await deleteAccount(confirmation);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      await authClient.signOut();
      router.push("/connexion");
    });
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-10">
      <Link
        href="/"
        className="text-muted-foreground hover:text-foreground mb-8 inline-flex items-center gap-1.5 text-sm"
      >
        <ArrowLeft className="size-4" />
        Retour
      </Link>

      <div className="space-y-10">
        <Section title="Mon compte" description="Vos informations et votre consommation.">
          <dl className="divide-y rounded-lg border">
            <Ligne label="Nom" value={viewer.name} />
            <Ligne label="Adresse e-mail" value={viewer.email} />
            <Ligne label="Espace de travail" value={viewer.organizationName} />
            <Ligne
              label="Crédits utilisés ce mois"
              value={`${quota.used} sur ${quota.limit}`}
            />
            <Ligne
              label="Réinitialisation"
              value={quota.resetsOn.toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            />
          </dl>
        </Section>

        <Separator />

        <Section
          title="Exporter mes données"
          description="Marques, campagnes et posts, au format JSON."
        >
          <Button
            variant="outline"
            className="gap-2"
            onClick={download}
            disabled={pending}
          >
            <Download className="size-4" />
            Télécharger l&apos;export
          </Button>
        </Section>

        <Separator />

        <Section
          title="Supprimer mon compte"
          description="Définitif. Marques, campagnes et posts sont effacés avec le compte."
        >
          <div className="border-destructive/30 bg-destructive/5 space-y-4 rounded-lg border p-4">
            <p className="text-destructive flex items-center gap-1.5 text-sm font-medium">
              <TriangleAlert className="size-4" />
              Cette action est irréversible
            </p>
            <p className="text-muted-foreground text-sm">
              Pensez à exporter vos données avant : elles ne seront pas
              récupérables ensuite.
            </p>

            {!wantsDelete ? (
              <Button
                variant="outline"
                className="text-destructive"
                onClick={() => setWantsDelete(true)}
              >
                Je veux supprimer mon compte
              </Button>
            ) : (
              <div className="space-y-3">
                <Field
                  label="Saisissez votre adresse e-mail pour confirmer"
                  htmlFor="confirmation"
                >
                  <Input
                    id="confirmation"
                    value={confirmation}
                    onChange={(e) => setConfirmation(e.target.value)}
                    placeholder={viewer.email}
                  />
                </Field>

                {error ? (
                  <p className="text-destructive text-sm">{error}</p>
                ) : null}

                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setWantsDelete(false);
                      setConfirmation("");
                      setError(null);
                    }}
                  >
                    Annuler
                  </Button>
                  <Button
                    variant="destructive"
                    className="gap-2"
                    onClick={remove}
                    disabled={pending || confirmation !== viewer.email}
                  >
                    {pending ? <Loader2 className="size-4 animate-spin" /> : null}
                    Supprimer définitivement
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Section>
      </div>
    </main>
  );
}

function Ligne({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3">
      <dt className="text-muted-foreground text-sm">{label}</dt>
      <dd className="text-sm font-medium">{value}</dd>
    </div>
  );
}
