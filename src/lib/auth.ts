import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { betterAuth } from "better-auth";
import { admin, organization } from "better-auth/plugins";
import { db, schema } from "@/db";
import { sendEmail } from "./email";

const googleId = process.env.GOOGLE_CLIENT_ID;
const googleSecret = process.env.GOOGLE_CLIENT_SECRET;

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg", schema }),

  emailAndPassword: {
    enabled: true,
    // Sans vérification, on peut créer cinquante comptes jetables et consommer
    // cinquante fois le quota gratuit — payé par notre clé modèle.
    requireEmailVerification: true,
    // `async` est requis par la signature : Better Auth attend une promesse.
    // L'envoi lui-même reste non attendu, à dessein (voir `sendEmail`).
    sendResetPassword: async ({ user, url }) => {
      sendEmail({
        to: user.email,
        subject: "Réinitialisation de votre mot de passe",
        text: `Bonjour,\n\nPour choisir un nouveau mot de passe, ouvrez ce lien :\n${url}\n\nSi vous n'êtes pas à l'origine de cette demande, ignorez ce message.`,
      });
    },
  },

  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    // `requireEmailVerification` est inopérant sans ce crochet : les deux vont
    // ensemble, sinon la vérification ne s'applique jamais.
    sendVerificationEmail: async ({ user, url }) => {
      sendEmail({
        to: user.email,
        subject: "Vérifiez votre adresse e-mail",
        text: `Bienvenue,\n\nConfirmez votre adresse en ouvrant ce lien :\n${url}\n\nÀ tout de suite.`,
      });
    },
  },

  // Le fournisseur Google n'est déclaré que si les identifiants existent :
  // démarrer sans est parfaitement possible, on l'ajoute ensuite.
  ...(googleId && googleSecret
    ? { socialProviders: { google: { clientId: googleId, clientSecret: googleSecret } } }
    : {}),

  rateLimit: {
    enabled: true,
    window: 60,
    max: 100,
    // Par défaut le compteur vit en mémoire. Sur Vercel, chaque requête peut
    // tomber sur une instance différente : la protection ne protégerait rien.
    storage: "database",
    customRules: {
      "/sign-in/email": { window: 60, max: 5 },
      "/sign-up/email": { window: 60, max: 3 },
      "/forget-password": { window: 60, max: 3 },
    },
  },

  plugins: [
    // Consulter les comptes, suspendre un abus, se substituer à un utilisateur
    // pour diagnostiquer un problème. Indispensable sur un SaaS tenu par une
    // seule personne.
    admin(),
    // Les marques appartiendront à une organisation, jamais directement à un
    // utilisateur. Un compte solo est une organisation d'une personne. Modéliser
    // cela maintenant évite de migrer la propriété de chaque table le jour où
    // une agence veut partager ses marques.
    organization(),
  ],
});
