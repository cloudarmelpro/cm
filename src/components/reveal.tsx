"use client";

import { motion } from "motion/react";

/**
 * Apparition au défilement : léger fondu et montée de quelques pixels.
 *
 * `once: true` — une section qui rejoue son animation à chaque passage devient
 * fatigante dans un outil qu'on utilise plusieurs fois par jour.
 *
 * La préférence « animations réduites » n'est PAS traitée ici par une condition.
 * Un `if (useReducedMotion())` qui renvoie un arbre différent casse l'hydratation :
 * le serveur ignore la préférence du navigateur et rend l'autre branche. C'est
 * `MotionConfig reducedMotion="user"`, posé une fois à la racine, qui s'en charge
 * au moment de l'exécution — même arbre rendu des deux côtés.
 */
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -80px 0px" }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1], delay }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Entrée d'un élément produit en flux : la carte n'apparaît qu'une fois son
 * contenu complet, on peut donc l'animer sans faire sauter du texte en cours
 * de rédaction.
 */
export function StreamIn({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 16, scale: 0.985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
