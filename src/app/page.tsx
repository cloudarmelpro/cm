"use client";

import {
  CircleUser,
  MessageSquareReply,
  MoreHorizontal,
  PenLine,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { MotionConfig } from "motion/react";
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
import { EMPTY_BRAND, useBrand } from "@/hooks/use-brand";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: "profil", label: "Profil", icon: CircleUser },
  { id: "creer", label: "Créer des posts", icon: PenLine },
  { id: "repondre", label: "Répondre", icon: MessageSquareReply },
] as const;

type Step = (typeof STEPS)[number]["id"];

export default function Home() {
  const { brand, update } = useBrand();
  const [step, setStep] = useState<Step>("creer");

  const profileReady = brand.name.trim().length > 0;

  return (
    // reducedMotion="user" : motion coupe lui-même les animations de position
    // quand le système le demande, sans qu'on ait à brancher le rendu.
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
              {profileReady ? brand.name : "Aucun profil de marque"}
            </p>
          </div>

          {!profileReady ? (
            <Badge variant="outline" className="ml-2 hidden sm:inline-flex">
              Profil à compléter
            </Badge>
          ) : null}

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
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Profil de marque</DropdownMenuLabel>
              <DropdownMenuItem onSelect={() => setStep("profil")}>
                <CircleUser className="size-4" />
                Modifier le profil
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                onSelect={() => update(EMPTY_BRAND)}
              >
                <RotateCcw className="size-4" />
                Réinitialiser le profil
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-muted-foreground text-xs font-normal">
                L&apos;agent rédige, il ne publie pas. Les posts sont à copier
                vers chaque réseau.
              </DropdownMenuLabel>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <nav className="mx-auto flex w-full max-w-3xl items-center gap-1.5 overflow-x-auto px-6 pb-3">
          {STEPS.map((s, i) => {
            const active = step === s.id;
            const Icon = s.icon;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setStep(s.id)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "focus-visible:ring-ring/50 flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition focus-visible:ring-[3px] focus-visible:outline-none",
                  active
                    ? "border-primary text-primary bg-accent/60 font-medium"
                    : "text-muted-foreground border-transparent hover:text-foreground",
                )}
              >
                <Icon className="size-3.5" />
                {i + 1}. {s.label}
              </button>
            );
          })}
        </nav>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-6 pt-10 pb-4">
        {step === "profil" ? (
          <BrandPanel brand={brand} update={update} />
        ) : step === "creer" ? (
          <GeneratePanel brand={brand} />
        ) : (
          <ReplyPanel brand={brand} />
          )}
        </main>
      </div>
    </MotionConfig>
  );
}
