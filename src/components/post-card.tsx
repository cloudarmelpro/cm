"use client";

import type { DeepPartial } from "ai";
import { CopyButton } from "@/components/ui";
import { NETWORKS, isNetworkId } from "@/lib/networks";
import type { Post } from "@/lib/schema";

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
    <article className="overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900/40">
      <header
        className={`flex items-center justify-between gap-3 bg-gradient-to-r ${
          spec?.accent ?? "from-neutral-700 to-neutral-500"
        } px-4 py-2`}
      >
        <span className="text-sm font-semibold text-white drop-shadow">
          {spec?.label ?? "Réseau"}
        </span>
        <div className="flex items-center gap-2">
          <span
            className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
              over ? "bg-red-950/80 text-red-200" : "bg-black/30 text-white/90"
            }`}
            title={
              over
                ? "Le post dépasse la limite du réseau, à raccourcir"
                : "Longueur du post"
            }
          >
            {bodyLength}
            {spec ? ` / ${spec.maxChars}` : ""}
          </span>
          {text ? <CopyButton text={text} /> : null}
        </div>
      </header>

      <div className="space-y-4 p-4">
        {post.title ? (
          <div>
            <Label>Titre</Label>
            <p className="text-base font-semibold text-neutral-50">{post.title}</p>
          </div>
        ) : null}

        {post.hook ? (
          <div>
            <Label>Accroche</Label>
            <p className="text-sm font-medium text-neutral-100">{post.hook}</p>

            {post.hookAlternatives?.length ? (
              <ul className="mt-2 space-y-1 border-l border-neutral-800 pl-3">
                {post.hookAlternatives.filter(Boolean).map((alt, i) => (
                  <li
                    key={i}
                    className="flex items-start justify-between gap-2 text-sm text-neutral-400"
                  >
                    <span>{alt}</span>
                    <CopyButton text={String(alt)} label="Prendre" />
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}

        {post.body ? (
          <div>
            <Label>Post</Label>
            <p className="text-sm whitespace-pre-wrap text-neutral-200">
              {post.body}
            </p>
          </div>
        ) : null}

        {post.cta ? (
          <div>
            <Label>Call to action</Label>
            <p className="text-sm text-neutral-200">{post.cta}</p>
          </div>
        ) : null}

        {post.hashtags?.length ? (
          <div>
            <Label>Hashtags</Label>
            <div className="flex flex-wrap gap-1.5">
              {post.hashtags.filter(Boolean).map((tag, i) => (
                <span
                  key={`${tag}-${i}`}
                  className="rounded-full bg-neutral-800 px-2 py-0.5 text-xs text-neutral-300"
                >
                  #{String(tag).replace(/^#/, "")}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        {post.script?.length ? (
          <div>
            <Label>Script vidéo</Label>
            <ol className="space-y-2">
              {post.script.filter(Boolean).map((beat, i) => (
                <li
                  key={i}
                  className="rounded-lg border border-neutral-800 bg-neutral-950/60 p-2.5"
                >
                  <p className="text-[11px] font-semibold tracking-wide text-neutral-400 uppercase">
                    {beat?.timecode ?? `Beat ${i + 1}`}
                  </p>
                  {beat?.says ? (
                    <p className="mt-1 text-sm text-neutral-100">
                      🗣 {beat.says}
                    </p>
                  ) : null}
                  {beat?.shows ? (
                    <p className="mt-1 text-sm text-neutral-400">🎬 {beat.shows}</p>
                  ) : null}
                </li>
              ))}
            </ol>
          </div>
        ) : null}

        {post.visualIdea ? (
          <div>
            <Label>Brief visuel</Label>
            <p className="text-sm text-neutral-400">{post.visualIdea}</p>
          </div>
        ) : null}
      </div>
    </article>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-1 text-[11px] font-semibold tracking-wide text-neutral-500 uppercase">
      {children}
    </p>
  );
}
