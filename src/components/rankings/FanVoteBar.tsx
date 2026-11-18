"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Vote } from "lucide-react";
import { isSupabaseConfigured } from "@/utils/supabase/config";
import {
  fetchCurrentUserId,
  fetchMyBallot,
  type BallotType,
} from "@/data/userData";
import type { Position } from "@/data/types";
import BallotBuilder from "./BallotBuilder";

export default function FanVoteBar({ position }: { position: Position }) {
  const router = useRouter();
  const params = useSearchParams();
  const [userId, setUserId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [initial, setInitial] = useState<{
    ballotType: BallotType;
    playerIds: string[];
  } | null>(null);

  // Resolve the signed-in user; if arriving from a shared ballot link
  // (?ballot=1) and signed in, auto-open the builder.
  useEffect(() => {
    let cancelled = false;
    const autoOpen = params.get("ballot") === "1";
    fetchCurrentUserId().then(async (id) => {
      if (cancelled) return;
      setUserId(id);
      if (id && autoOpen) {
        const mine = await fetchMyBallot(position);
        if (!cancelled) {
          setInitial(mine);
          setOpen(true);
        }
      }
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [position]);

  async function openBuilder() {
    setInitial(await fetchMyBallot(position));
    setOpen(true);
  }

  function handleVote() {
    if (!isSupabaseConfigured || !userId) {
      const next = `/rankings?source=fan&position=${position}&ballot=1`;
      router.push(`/login?next=${encodeURIComponent(next)}`);
      return;
    }
    openBuilder();
  }

  const subtitle = !isSupabaseConfigured
    ? "Fan voting opens once accounts are connected."
    : userId
      ? "Build or update your Top 10 / Top 20 ballot."
      : "Sign in to cast your ballot. One per position per week.";

  return (
    <>
      <div className="hero-silver mb-4 flex flex-wrap items-center justify-between gap-4 rounded-[14px] border border-silver px-5 py-4">
        <div>
          <p className="font-display text-lg text-ink">
            Vote for the Fan {position} ranking
          </p>
          <p className="mt-0.5 text-sm text-silver-deep">{subtitle}</p>
        </div>
        <button
          type="button"
          onClick={handleVote}
          className="btn btn-primary"
        >
          <Vote size={16} />
          Cast your ballot
        </button>
      </div>

      {open && (
        <BallotBuilder
          position={position}
          initial={initial}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
