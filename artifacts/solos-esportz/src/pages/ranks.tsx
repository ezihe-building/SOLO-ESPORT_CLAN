import React, { useState } from "react";
import { useGetLeaderboard } from "@workspace/api-client-react";
import { AppLayout } from "@/components/layout";
import { useAuth } from "@/lib/auth";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Crosshair, Star, Zap, Swords } from "lucide-react";

type SortKey = "clanPoints" | "kdRatio" | "mvpCount" | "activity" | "scrimWins";

const SORT_OPTIONS: { key: SortKey; label: string; icon: any }[] = [
  { key: "clanPoints", label: "Points", icon: Trophy },
  { key: "kdRatio", label: "K/D", icon: Crosshair },
  { key: "mvpCount", label: "MVP", icon: Star },
  { key: "scrimWins", label: "Wins", icon: Swords },
];

function tierColor(role?: string) {
  if (role === "CLAN_MASTER" || role === "CO_LEADER") return "border-yellow-500 text-yellow-400";
  if (role === "TIER1") return "border-yellow-400 text-yellow-400";
  if (role === "TIER2") return "border-blue-400 text-blue-400";
  if (role === "TIER3") return "border-green-400 text-green-400";
  return "border-border text-muted-foreground";
}

function tierBadge(role?: string) {
  const map: Record<string, string> = {
    CLAN_MASTER: "CM",
    CO_LEADER: "CL",
    MANAGEMENT: "MG",
    TIER1: "T1",
    TIER2: "T2",
    TIER3: "T3",
    NEW_MEMBER: "NM",
  };
  return map[role ?? ""] ?? "?";
}

function rankMedal(rank: number) {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return null;
}

export default function RanksPage() {
  const { user } = useAuth();
  const [sortBy, setSortBy] = useState<SortKey>("clanPoints");
  const { data: entries, isLoading } = useGetLeaderboard({ sortBy }, { query: { queryKey: ["leaderboard", sortBy] } });

  const myEntry = entries?.find(e => e.userId === user?.id);

  return (
    <AppLayout>
      <div className="px-4 pt-6 pb-4 space-y-5">
        {/* Header */}
        <div>
          <h1 className="font-heading font-bold text-3xl text-white uppercase tracking-wider">Rankings</h1>
          <p className="text-muted-foreground text-sm">Clan leaderboard — season standings</p>
        </div>

        {/* Sort tabs */}
        <div className="flex space-x-2 overflow-x-auto pb-1">
          {SORT_OPTIONS.map(opt => (
            <button
              key={opt.key}
              onClick={() => setSortBy(opt.key)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-colors border ${
                sortBy === opt.key
                  ? "bg-primary/20 border-primary/50 text-primary"
                  : "bg-card border-border text-muted-foreground hover:text-white"
              }`}
            >
              <opt.icon className="w-3 h-3" />
              <span>{opt.label}</span>
            </button>
          ))}
        </div>

        {/* My rank banner */}
        {myEntry && (
          <div className="bg-primary/10 border border-primary/30 rounded-xl p-3 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="font-heading font-bold text-2xl text-primary w-8 text-center">#{myEntry.rank}</div>
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider">Your rank</div>
                <div className="font-heading font-bold text-white">{myEntry.clanPoints} pts</div>
              </div>
            </div>
            <div className="text-right text-xs text-muted-foreground">
              <div>K/D: {myEntry.kdRatio?.toFixed(2)}</div>
              <div>MVPs: {myEntry.mvpCount}</div>
            </div>
          </div>
        )}

        {/* Leaderboard */}
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
          </div>
        ) : (
          <div className="space-y-2">
            {entries?.map(entry => {
              const isMe = entry.userId === user?.id;
              const medal = rankMedal(entry.rank);
              return (
                <div
                  key={entry.userId}
                  className={`flex items-center space-x-3 rounded-xl p-3 border transition-colors ${
                    isMe ? "bg-primary/10 border-primary/40" : "bg-card border-border"
                  }`}
                >
                  {/* Rank */}
                  <div className="w-8 text-center">
                    {medal ? (
                      <span className="text-lg">{medal}</span>
                    ) : (
                      <span className="font-heading font-bold text-muted-foreground text-sm">#{entry.rank}</span>
                    )}
                  </div>

                  {/* Avatar + Tier badge */}
                  <div className="relative">
                    <div className={`w-10 h-10 rounded-full border-2 ${tierColor(entry.role)} bg-card flex items-center justify-center overflow-hidden`}>
                      {entry.avatarUrl ? (
                        <img src={entry.avatarUrl} alt={entry.username} className="w-full h-full object-cover" />
                      ) : (
                        <span className="font-heading font-bold text-sm">{entry.username?.[0]?.toUpperCase()}</span>
                      )}
                    </div>
                    <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-background bg-card flex items-center justify-center ${tierColor(entry.role)}`}>
                      <span className="text-[7px] font-bold">{tierBadge(entry.role)}</span>
                    </div>
                  </div>

                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    <div className="font-heading font-bold text-white text-sm truncate">
                      S²十{entry.username}
                      {isMe && <span className="text-primary ml-1 text-xs">(you)</span>}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      K/D {entry.kdRatio?.toFixed(2)} · {entry.scrimWins}W · {entry.mvpCount} MVP
                    </div>
                  </div>

                  {/* Score */}
                  <div className="text-right">
                    <div className="font-heading font-bold text-primary text-lg leading-none">
                      {sortBy === "kdRatio" ? entry.kdRatio?.toFixed(2) :
                       sortBy === "mvpCount" ? entry.mvpCount :
                       sortBy === "scrimWins" ? entry.scrimWins :
                       entry.clanPoints}
                    </div>
                    <div className="text-xs text-muted-foreground uppercase">
                      {sortBy === "kdRatio" ? "K/D" : sortBy === "mvpCount" ? "mvp" : sortBy === "scrimWins" ? "wins" : "pts"}
                    </div>
                  </div>
                </div>
              );
            })}

            {entries?.length === 0 && (
              <div className="bg-card border border-border rounded-xl p-8 text-center text-muted-foreground">
                No ranked members yet
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
