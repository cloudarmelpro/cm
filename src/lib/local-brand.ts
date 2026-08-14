"use client";

import type { Brand } from "./schema";

/**
 * Vestige d'avant les comptes : le profil de marque vivait dans le navigateur.
 *
 * On ne s'en sert plus pour travailler, seulement pour proposer une reprise à
 * quelqu'un qui avait déjà rempli ses champs. Une fois repris ou ignoré, la
 * clé est effacée et ce fichier n'a plus aucun effet.
 */
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

export function readLocalBrand(): Brand | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = { ...EMPTY_BRAND, ...JSON.parse(raw) } as Brand;
    // Un profil sans nom n'a rien à reprendre.
    return parsed.name.trim() ? parsed : null;
  } catch {
    return null;
  }
}

export function clearLocalBrand(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // stockage bloqué : rien à nettoyer
  }
}
