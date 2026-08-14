"use client";

import {
  Building2,
  CircleUser,
  LogOut,
  MessageSquareReply,
  MoreHorizontal,
  PenLine,
  Plus,
  Shield,
  Sparkles,
} from "lucide-react";
import { MotionConfig } from "motion/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BrandPanel } from "@/components/brand-panel";
import { GeneratePanel } from "@/components/generate-panel";
import { ReplyPanel } from "@/components/reply-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { authClient } from "@/lib/auth-client";
import type { QuotaState } from "@/lib/quota-shared";
import type { Brand } from "@/lib/schema";
import type { Viewer } from "@/lib/session";
import { cn } from "@/lib/utils";

export type BrandRecord = Brand & { id: string; organizationId: string };

const STEPS = [
  { id: "creer", label: "Créer des posts", icon: PenLine },
  { id: "repondre", label: "Répondre", icon: MessageSquareReply },
  { id: "marque", label: "Marque", icon: Building2 },
] as const;

type Step = (typeof STEPS)[number]["id"];

export function Workspace({
  viewer,
  brands,
  quota,
}: {
  viewer: Viewer;
  brands: BrandRecord[];
  quota: QuotaState;
}) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(brands.length ? "creer" : "marque");
  const [activeId, setActiveId] = useState<string | null>(
    brands[0]?.id ?? null,
  );

  const active = brands.find((b) => b.id === activeId) ?? brands[0] ?? null;
  const exhausted = quota.remaining <= 0;

  return (
    <MotionConfig reducedMotion="user">
      <div className="flex min-h-full flex-col">
        <header className="bg-card sticky top-0 z-20">
          <div className="mx-auto flex w-full max-w-3xl items-center gap-3 px-6 py-3">
            <span className="bg-primary text-primary-foreground flex size-8 shrink-0 items-center justify-center rounded-lg">
              <Sparkles className="size-4" />
            </span>

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">
                Agent community manager
              </p>
              <p className="text-muted-foreground truncate text-xs">
                {viewer.organizationName}
              </p>
            </div>

            {/* Le quota est visible en permanence : c'est ce qui évite la
                surprise d'un blocage en plein travail. */}
            <Badge
              variant={exhausted ? "destructive" : "secondary"}
              className="ml-2 hidden tabular-nums sm:inline-flex"
              title={`Réinitialisé le ${quota.resetsOn.toLocaleDateString("fr-FR")}`}
            >
              {quota.remaining} / {quota.limit} crédits
            </Badge>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="ml-auto"
                  aria-label="Menu"
                >
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60">
                <DropdownMenuLabel className="font-normal">
                  <p className="text-sm font-medium">{viewer.name}</p>
                  <p className="text-muted-foreground text-xs">{viewer.email}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => router.push("/compte")}>
                  <CircleUser className="size-4" />
                  Mon compte
                </DropdownMenuItem>
                {viewer.role === "admin" ? (
                  <DropdownMenuItem onSelect={() => router.push("/administration")}>
                    <Shield className="size-4" />
                    Administration
                  </DropdownMenuItem>
                ) : null}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={async () => {
                    await authClient.signOut();
                    router.push("/connexion");
                    router.refresh();
                  }}
                >
                  <LogOut className="size-4" />
                  Se déconnecter
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="mx-auto flex w-full max-w-3xl items-center gap-2 px-6 pb-3">
            <nav className="flex items-center gap-1.5 overflow-x-auto">
              {STEPS.map((s, i) => {
                const isActive = step === s.id;
                const Icon = s.icon;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setStep(s.id)}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "focus-visible:ring-ring/50 flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition focus-visible:ring-[3px] focus-visible:outline-none",
                      isActive
                        ? "border-primary text-primary bg-accent/60 font-medium"
                        : "text-muted-foreground hover:text-foreground border-transparent",
                    )}
                  >
                    <Icon className="size-3.5" />
                    {i + 1}. {s.label}
                  </button>
                );
              })}
            </nav>

            {brands.length > 1 ? (
              <div className="ml-auto w-44">
                <Select
                  value={active?.id}
                  onValueChange={(v) => setActiveId(v)}
                >
                  <SelectTrigger className="h-8 w-full text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {brands.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}
          </div>
        </header>

        <main className="mx-auto w-full max-w-3xl flex-1 px-6 pt-10 pb-4">
          {/* L'onglet Marque est testé en premier : sinon, un compte sans
              marque resterait bloqué sur l'écran d'accueil, dont le bouton
              renvoie précisément vers cet onglet. */}
          {step === "marque" ? (
            <BrandPanel brand={active} brands={brands} />
          ) : !active ? (
            <Accueil onStart={() => setStep("marque")} />
          ) : step === "creer" ? (
            <GeneratePanel brand={active} quota={quota} />
          ) : (
            <ReplyPanel brand={active} quota={quota} />
          )}
        </main>
      </div>
    </MotionConfig>
  );
}

/**
 * Premier écran d'un compte neuf. Un profil de marque vide produit une mauvaise
 * première génération, et une mauvaise première génération ne donne pas de
 * deuxième essai : on force donc ce passage avant tout le reste.
 */
function Accueil({ onStart }: { onStart: () => void }) {
  return (
    <div className="mx-auto max-w-md py-12 text-center">
      <span className="bg-accent text-primary mx-auto mb-4 flex size-12 items-center justify-center rounded-xl">
        <Building2 className="size-6" />
      </span>
      <h2 className="text-lg font-semibold">Créez votre première marque</h2>
      <p className="text-muted-foreground mt-2 text-sm">
        L&apos;agent écrit au ton de votre entreprise. Renseignez son nom, son
        secteur et surtout deux publications existantes : c&apos;est ce qui lui
        permet d&apos;imiter une voix réelle plutôt que de la deviner.
      </p>
      <Button onClick={onStart} className="mt-6 gap-2">
        <Plus className="size-4" />
        Créer une marque
      </Button>
    </div>
  );
}
