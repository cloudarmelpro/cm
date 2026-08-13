"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { Brand } from "@/lib/schema";

const STORAGE_KEY = "cm.brand";

export const EMPTY_BRAND: Brand = {
  name: "",
  sector: "",
  audience: "",
  tone: "",
  avoid: "",
  language: "français",
  examples: "",
};

/**
 * Le profil de marque vit dans localStorage. On le expose via useSyncExternalStore
 * pour garder un snapshot stable (React réclame la même référence entre deux rendus)
 * et rester compatible avec le rendu serveur, qui n'a pas accès au stockage.
 */
let cache: Brand | null = null;
const listeners = new Set<() => void>();

function readBrand(): Brand {
  if (cache) return cache;

  let stored: Brand;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    stored = raw ? { ...EMPTY_BRAND, ...JSON.parse(raw) } : EMPTY_BRAND;
  } catch {
    stored = EMPTY_BRAND; // profil illisible ou stockage bloqué
  }

  cache = stored;
  return stored;
}

function serverBrand(): Brand {
  return EMPTY_BRAND;
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);

  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) {
      cache = null; // modifié dans un autre onglet
      onChange();
    }
  };

  window.addEventListener("storage", onStorage);

  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onStorage);
  };
}

export function useBrand() {
  const brand = useSyncExternalStore(subscribe, readBrand, serverBrand);

  const update = useCallback((patch: Partial<Brand>) => {
    const next = { ...readBrand(), ...patch };
    cache = next;

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // quota ou navigation privée : le profil reste en mémoire pour la session
    }

    for (const listener of listeners) listener();
  }, []);

  return { brand, update };
}
