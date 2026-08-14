import { Sparkles } from "lucide-react";
import Link from "next/link";

/** Cadre commun aux écrans de connexion, inscription et mot de passe oublié. */
export function AuthShell({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-8 flex items-center gap-2.5">
          <span className="bg-primary text-primary-foreground flex size-8 shrink-0 items-center justify-center rounded-lg">
            <Sparkles className="size-4" />
          </span>
          <span className="text-sm font-semibold">Agent community manager</span>
        </Link>

        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        <p className="text-muted-foreground mt-1 mb-6 text-sm">{description}</p>

        {children}

        {footer ? (
          <div className="text-muted-foreground mt-6 text-sm">{footer}</div>
        ) : null}
      </div>
    </main>
  );
}
