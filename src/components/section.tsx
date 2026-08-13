"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { Reveal } from "@/components/reveal";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/**
 * Bloc de réglages : un titre, une phrase qui explique à quoi il sert, puis les
 * contrôles. La description n'est pas décorative — c'est elle qui évite d'avoir
 * à deviner ce que fait un champ.
 */
export function Section({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Reveal>
      <section className={cn("space-y-4", className)}>
        <div className="space-y-1">
          <h2 className="text-base font-semibold tracking-tight">{title}</h2>
          {description ? (
            <p className="text-muted-foreground text-sm">{description}</p>
          ) : null}
        </div>
        {children}
      </section>
    </Reveal>
  );
}

export function Field({
  label,
  hint,
  htmlFor,
  children,
}: {
  label: string;
  hint?: string;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor} className="text-xs font-medium">
        {label}
      </Label>
      {children}
      {hint ? <p className="text-muted-foreground text-xs">{hint}</p> : null}
    </div>
  );
}

/** Choix exclusif présenté comme une carte, à la manière du panneau de réglages. */
export function SelectableCard({
  selected,
  onSelect,
  icon,
  title,
  description,
}: {
  selected: boolean;
  onSelect: () => void;
  icon?: React.ReactNode;
  title: string;
  description?: string;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "focus-visible:ring-ring/50 relative flex w-full flex-col items-start gap-1 rounded-lg border p-3 text-left transition focus-visible:ring-[3px] focus-visible:outline-none",
        selected
          ? "border-primary bg-accent/60"
          : "border-border bg-card hover:border-muted-foreground/30",
      )}
    >
      <span
        className={cn(
          "absolute top-3 right-3 flex size-4 items-center justify-center rounded-full border transition",
          selected ? "border-primary bg-primary" : "border-muted-foreground/40",
        )}
      >
        {selected ? (
          <span className="bg-primary-foreground size-1.5 rounded-full" />
        ) : null}
      </span>

      {icon ? <span className="text-primary [&>svg]:size-4">{icon}</span> : null}
      <span className="pr-6 text-sm font-medium">{title}</span>
      {description ? (
        <span className="text-muted-foreground text-xs leading-snug">
          {description}
        </span>
      ) : null}
    </button>
  );
}

export function CopyButton({
  text,
  label = "Copier",
  variant = "outline",
}: {
  text: string;
  label?: string;
  variant?: "outline" | "ghost";
}) {
  const [copied, setCopied] = useState(false);

  return (
    <Button
      type="button"
      variant={variant}
      size="sm"
      className="h-7 gap-1.5 px-2 text-xs"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          setCopied(false);
        }
      }}
    >
      {copied ? (
        <Check className="size-3.5" />
      ) : (
        <Copy className="size-3.5" />
      )}
      {copied ? "Copié" : label}
    </Button>
  );
}
