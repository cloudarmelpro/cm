"use client";

import type { DeepPartial } from "ai";
import { CopyButton } from "@/components/section";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { NETWORKS, isNetworkId } from "@/lib/networks";
import type { Post } from "@/lib/schema";
import { cn } from "@/lib/utils";

export type PartialPost = DeepPartial<Post>;

/** Texte prêt à coller dans le réseau, tel que le CM le publierait. */
export function renderPost(post: PartialPost): string {
  const tags = (post.hashtags ?? [])
    .filter((t): t is string => Boolean(t))
    .map((t) => `#${t.replace(/^#/, "")}`)
    .join(" ");

  return [post.title, post.hook, post.body, post.cta, tags]
    .filter(Boolean)
    .join("\n\n");
}

export function PostCard({ post }: { post: PartialPost }) {
  const spec =
    post.network && isNetworkId(post.network) ? NETWORKS[post.network] : null;

  const text = renderPost(post);
  const bodyLength = [post.hook, post.body].filter(Boolean).join("\n\n").length;
  const over = spec ? bodyLength > spec.maxChars : false;

  return (
    <Card className="gap-0 overflow-hidden py-0">
      <header className="flex items-center gap-2.5 border-b px-4 py-3">
        <span
          className={cn(
            "size-2.5 shrink-0 rounded-full bg-gradient-to-br",
            spec?.accent ?? "from-neutral-400 to-neutral-500",
          )}
        />
        <span className="text-sm font-semibold">{spec?.label ?? "Réseau"}</span>

        <Badge
          variant={over ? "destructive" : "secondary"}
          className="ml-2 tabular-nums"
          title={
            over
              ? "Le post dépasse la limite du réseau, à raccourcir"
              : "Longueur du post"
          }
        >
          {bodyLength}
          {spec ? ` / ${spec.maxChars}` : ""}
        </Badge>

        {text ? (
          <div className="ml-auto">
            <CopyButton text={text} label="Copier le post" />
          </div>
        ) : null}
      </header>

      <div className="space-y-4 p-4">
        {post.title ? (
          <div>
            <FieldLabel>Titre</FieldLabel>
            <p className="text-base font-semibold">{post.title}</p>
          </div>
        ) : null}

        {post.hook ? (
          <div>
            <FieldLabel>Accroche</FieldLabel>
            <p className="text-sm font-medium">{post.hook}</p>

            {post.hookAlternatives?.length ? (
              <ul className="mt-2 space-y-1.5 border-l pl-3">
                {post.hookAlternatives.filter(Boolean).map((alt, i) => (
                  <li
                    key={i}
                    className="text-muted-foreground flex items-start justify-between gap-3 text-sm"
                  >
                    <span>{alt}</span>
                    <CopyButton
                      text={String(alt)}
                      label="Prendre"
                      variant="ghost"
                    />
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}

        {post.body ? (
          <div>
            <FieldLabel>Post</FieldLabel>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {post.body}
            </p>
          </div>
        ) : null}

        {post.cta ? (
          <div>
            <FieldLabel>Appel à l&apos;action</FieldLabel>
            <p className="text-sm">{post.cta}</p>
          </div>
        ) : null}

        {post.hashtags?.length ? (
          <div>
            <FieldLabel>Hashtags</FieldLabel>
            <div className="flex flex-wrap gap-1.5">
              {post.hashtags.filter(Boolean).map((tag, i) => (
                <Badge key={`${tag}-${i}`} variant="secondary">
                  #{String(tag).replace(/^#/, "")}
                </Badge>
              ))}
            </div>
          </div>
        ) : null}

        {post.script?.length ? (
          <div>
            <FieldLabel>Script vidéo</FieldLabel>
            <ol className="space-y-2">
              {post.script.filter(Boolean).map((beat, i) => (
                <li key={i} className="bg-muted/50 rounded-lg border p-3">
                  <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                    {beat?.timecode ?? `Beat ${i + 1}`}
                  </p>
                  {beat?.says ? (
                    <p className="mt-1 text-sm">{beat.says}</p>
                  ) : null}
                  {beat?.shows ? (
                    <p className="text-muted-foreground mt-1 text-sm">
                      {beat.shows}
                    </p>
                  ) : null}
                </li>
              ))}
            </ol>
          </div>
        ) : null}

        {post.visualIdea ? (
          <div>
            <FieldLabel>Brief visuel</FieldLabel>
            <p className="text-muted-foreground text-sm">{post.visualIdea}</p>
          </div>
        ) : null}
      </div>
    </Card>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-muted-foreground mb-1 text-xs font-semibold tracking-wide uppercase">
      {children}
    </p>
  );
}
