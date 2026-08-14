import { desc, eq, sql } from "drizzle-orm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { db, schema } from "@/db";
import { requireViewer } from "@/lib/session";

/**
 * Console d'administration.
 *
 * Le contrôle du rôle est fait ici, côté serveur : un lien caché dans
 * l'interface n'est pas une protection. Quelqu'un qui tape l'URL directement
 * doit être renvoyé, et il l'est.
 */
export default async function AdministrationPage() {
  const viewer = await requireViewer();
  if (viewer.role !== "admin") redirect("/");

  const comptes = await db
    .select({
      email: schema.user.email,
      name: schema.user.name,
      verified: schema.user.emailVerified,
      banned: schema.user.banned,
      role: schema.user.role,
      createdAt: schema.user.createdAt,
    })
    .from(schema.user)
    .orderBy(desc(schema.user.createdAt))
    .limit(100);

  const consommation = await db
    .select({
      organisation: schema.organization.name,
      credits: sql<number>`sum(${schema.usage.credits})`,
    })
    .from(schema.usage)
    .innerJoin(
      schema.organization,
      eq(schema.usage.organizationId, schema.organization.id),
    )
    .groupBy(schema.organization.name)
    .orderBy(desc(sql`sum(${schema.usage.credits})`))
    .limit(20);

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-10">
      <Link
        href="/"
        className="text-muted-foreground hover:text-foreground mb-8 inline-flex items-center gap-1.5 text-sm"
      >
        <ArrowLeft className="size-4" />
        Retour
      </Link>

      <h1 className="text-lg font-semibold">Administration</h1>
      <p className="text-muted-foreground mt-1 mb-8 text-sm">
        {comptes.length} compte{comptes.length > 1 ? "s" : ""} enregistré
        {comptes.length > 1 ? "s" : ""}.
      </p>

      <section className="mb-10">
        <h2 className="mb-3 text-sm font-semibold">Comptes</h2>
        <div className="divide-y rounded-lg border">
          {comptes.map((c) => (
            <div
              key={c.email}
              className="flex flex-wrap items-center gap-2 px-4 py-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{c.name}</p>
                <p className="text-muted-foreground truncate text-xs">
                  {c.email}
                </p>
              </div>
              <div className="ml-auto flex items-center gap-1.5">
                {c.role === "admin" ? <Badge>admin</Badge> : null}
                {c.banned ? (
                  <Badge variant="destructive">suspendu</Badge>
                ) : null}
                <Badge variant={c.verified ? "secondary" : "outline"}>
                  {c.verified ? "vérifié" : "non vérifié"}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold">
          Consommation par espace de travail
        </h2>
        {consommation.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Aucune consommation enregistrée.
          </p>
        ) : (
          <div className="divide-y rounded-lg border">
            {consommation.map((c) => (
              <div
                key={c.organisation}
                className="flex items-center justify-between px-4 py-3"
              >
                <span className="text-sm">{c.organisation}</span>
                <span className="text-sm font-medium tabular-nums">
                  {Number(c.credits)} crédits
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
