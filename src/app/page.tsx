"use client";

import { useState } from "react";
import { BrandPanel } from "@/components/brand-panel";
import { GeneratePanel } from "@/components/generate-panel";
import { ReplyPanel } from "@/components/reply-panel";
import { useBrand } from "@/hooks/use-brand";

const TABS = [
  { id: "creer", label: "Créer des posts" },
  { id: "repondre", label: "Répondre" },
] as const;

type Tab = (typeof TABS)[number]["id"];

export default function Home() {
  const { brand, update } = useBrand();
  const [tab, setTab] = useState<Tab>("creer");

  return (
    <main className="mx-auto w-full max-w-5xl px-5 py-10">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold text-neutral-50">
          Agent community manager
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Un brief, six réseaux. Posts adaptés à chaque plateforme et réponses aux
          commentaires, au ton de la marque.
        </p>
      </header>

      <div className="space-y-6">
        <BrandPanel brand={brand} update={update} />

        <nav className="flex gap-1 rounded-lg border border-neutral-800 bg-neutral-900/40 p-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition ${
                tab === t.id
                  ? "bg-neutral-100 text-neutral-900"
                  : "text-neutral-400 hover:text-neutral-100"
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>

        {tab === "creer" ? (
          <GeneratePanel brand={brand} />
        ) : (
          <ReplyPanel brand={brand} />
        )}
      </div>
    </main>
  );
}
