import { relations } from "drizzle-orm";
import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { organization, user } from "./auth-schema";

/**
 * Schéma de la base.
 *
 * Les tables d'authentification sont générées par `npx auth@latest generate`
 * dans `auth-schema.ts` — ne pas les modifier à la main, elles seraient
 * écrasées. Elles fournissent `user`, `session`, `account`, `verification`,
 * `organization`, `member`, `invitation` et `rateLimit`.
 *
 * Règle d'or de ce fichier : **tout appartient à une organisation**, jamais
 * directement à un utilisateur. Un compte solo est une organisation d'une
 * personne. C'est ce qui permettra d'ouvrir le partage à une agence sans
 * migrer la propriété de chaque table.
 *
 * Les identifiants de `user` et `organization` sont des `text`, pas des `uuid` :
 * c'est ce qu'émet Better Auth par défaut. Nos clés étrangères doivent suivre,
 * sous peine d'un conflit de types à la migration.
 */
export * from "./auth-schema";

/* ------------------------------------------------------------------ */
/* Profils de marque                                                   */
/* ------------------------------------------------------------------ */

/**
 * Une marque = un client du community manager. C'est ce qui remplace le profil
 * unique stocké jusqu'ici dans `localStorage`.
 */
export const brand = pgTable(
  "brand",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),

    name: text("name").notNull(),
    sector: text("sector").notNull().default(""),
    audience: text("audience").notNull().default(""),
    tone: text("tone").notNull().default(""),
    avoid: text("avoid").notNull().default(""),
    language: text("language").notNull().default("français"),
    /** Publications existantes : le champ qui améliore le plus le résultat. */
    examples: text("examples").notNull().default(""),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [index("brand_organization_idx").on(table.organizationId)],
);

/* ------------------------------------------------------------------ */
/* Campagnes et posts                                                  */
/* ------------------------------------------------------------------ */

export const campaign = pgTable(
  "campaign",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    brandId: uuid("brand_id")
      .notNull()
      .references(() => brand.id, { onDelete: "cascade" }),
    /**
     * Dupliqué depuis la marque à dessein : permet de filtrer par organisation
     * sans jointure, sur la requête la plus fréquente de l'application.
     */
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),

    topic: text("topic").notNull(),
    goal: text("goal").notNull(),
    extra: text("extra").notNull().default(""),
    /** Angle éditorial retenu par le premier appel. */
    angle: text("angle").notNull().default(""),
    /** Réseaux dont la rédaction a échoué, avec leur cause. */
    failed: jsonb("failed")
      .$type<{ network: string; reason: string }[]>()
      .notNull()
      .default([]),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("campaign_brand_idx").on(table.brandId),
    index("campaign_organization_idx").on(table.organizationId),
  ],
);

export const post = pgTable(
  "post",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    campaignId: uuid("campaign_id")
      .notNull()
      .references(() => campaign.id, { onDelete: "cascade" }),

    network: text("network").notNull(),
    title: text("title"),
    hook: text("hook").notNull(),
    hookAlternatives: jsonb("hook_alternatives")
      .$type<string[]>()
      .notNull()
      .default([]),
    body: text("body").notNull(),
    cta: text("cta").notNull(),
    hashtags: jsonb("hashtags").$type<string[]>().notNull().default([]),
    visualIdea: text("visual_idea").notNull().default(""),
    script: jsonb("script").$type<
      { timecode: string; says: string; shows: string }[] | null
    >(),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [index("post_campaign_idx").on(table.campaignId)],
);

/* ------------------------------------------------------------------ */
/* Consommation                                                        */
/* ------------------------------------------------------------------ */

/**
 * Un enregistrement par appel modèle facturé, pas par campagne.
 *
 * Le coût réel est par réseau : une campagne à six réseaux consomme 7 appels,
 * une campagne à deux réseaux en consomme 3. Compter les campagnes mentirait
 * sur la dépense, et obligerait à tarifer sur le pire cas.
 */
export const usage = pgTable(
  "usage",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),

    /** "brief", "post", "repair", "reply" — pour savoir où part la dépense. */
    kind: text("kind").notNull(),
    network: text("network"),
    model: text("model").notNull(),
    credits: integer("credits").notNull().default(1),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("usage_organization_idx").on(table.organizationId),
    index("usage_created_idx").on(table.createdAt),
  ],
);

/* ------------------------------------------------------------------ */
/* Relations                                                           */
/* ------------------------------------------------------------------ */

export const brandRelations = relations(brand, ({ one, many }) => ({
  organization: one(organization, {
    fields: [brand.organizationId],
    references: [organization.id],
  }),
  campaigns: many(campaign),
}));

export const campaignRelations = relations(campaign, ({ one, many }) => ({
  brand: one(brand, {
    fields: [campaign.brandId],
    references: [brand.id],
  }),
  posts: many(post),
}));

export const postRelations = relations(post, ({ one }) => ({
  campaign: one(campaign, {
    fields: [post.campaignId],
    references: [campaign.id],
  }),
}));
