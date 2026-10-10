"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { api, type PublicAuthor } from "@/lib/api";
import { User as UserIcon, Calendar } from "lucide-react";

interface AuthorBylineProps {
  username: string;
  publishedAt?: string;
}

export function AuthorByline({ username, publishedAt }: AuthorBylineProps) {
  const [author, setAuthor] = useState<PublicAuthor | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    api.authors
      .getByUsername(username)
      .then((data) => {
        if (isMounted) setAuthor(data);
      })
      .catch(() => {
        // Fallback silently if author lookup fails
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [username]);

  const fullName = author
    ? `${author.firstName} ${author.lastName}`.trim() || author.username
    : username;

  return (
    <div className="flex items-center gap-3 py-4">
      {/* Avatar */}
      <div className="relative h-10 w-10 overflow-hidden rounded-full border border-white/10 bg-slate-800 flex items-center justify-center shrink-0">
        {author?.profilePic ? (
          <Image
            src={author.profilePic}
            alt={fullName}
            fill
            className="object-cover"
          />
        ) : (
          <UserIcon className="h-5 w-5 text-slate-400" />
        )}
      </div>

      {/* Author Name and Metadata */}
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-white">
            {loading ? "..." : fullName}
          </span>
          {author?.role && (
            <span className="rounded bg-white/5 border border-white/10 px-1.5 py-0.5 text-[10px] text-slate-400 capitalize">
              {author.role}
            </span>
          )}
        </div>

        {publishedAt && (
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
            <Calendar className="h-3 w-3" />
            <time dateTime={publishedAt}>
              {new Date(publishedAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </time>
          </div>
        )}
      </div>
    </div>
  );
}