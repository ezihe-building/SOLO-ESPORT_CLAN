import React from "react";
import { Link } from "wouter";
import { useGetDashboardStats, useListAnnouncements, useListScrims } from "@workspace/api-client-react";
import { AppLayout } from "@/components/layout";
import { useAuth } from "@/lib/auth";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Trophy, Swords, Users, Bell, CalendarDays, Pin, ChevronRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string | number; color?: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 flex flex-col space-y-2">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color ?? "bg-primary/10"}`}>
        <Icon className={`w-4 h-4 ${color ? "text-white" : "text-primary"}`} />
      </div>
      <div className="text-2xl font-heading font-bold text-white">{value}</div>
      <div className="text-xs text-muted-foreground uppercase tracking-wider">{label}</div>
    </div>
  );
}

function tierColor(role?: string) {
  if (!role) return "text-muted-foreground";
  if (role === "TIER1" || role === "CLAN_MASTER" || role === "CO_LEADER") return "text-yellow-400";
  if (role === "TIER2") return "text-blue-400";
  if (role === "TIER3") return "text-green-400";
  return "text-muted-foreground";
}

function tierLabel(role?: string) {
  const map: Record<string, string> = {
    CLAN_MASTER: "Clan Master",
    CO_LEADER: "Co-Leader",
    MANAGEMENT: "Management",
    TIER1: "Tier 1",
    TIER2: "Tier 2",
    TIER3: "Tier 3",
    NEW_MEMBER: "New Member",
  };
  return map[role ?? ""] ?? role ?? "Member";
}

export default function HomePage() {
  const { user } = useAuth();
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: announcements, isLoading: annLoading } = useListAnnouncements();

  const pinnedAnn = announcements?.filter(a => a.isPinned).slice(0, 1)[0];
  const recentAnn = announcements?.filter(a => !a.isPinned).slice(0, 3) ?? [];

  return (
    <AppLayout>
      <div className="px-4 pt-6 pb-4 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground text-xs uppercase tracking-wider">Welcome back</p>
            <h1 className="font-heading font-bold text-2xl text-white leading-tight">
              S²十{user?.username}
            </h1>
            <span className={`text-xs font-bold uppercase tracking-wider ${tierColor(user?.role)}`}>
              {tierLabel(user?.role)}
            </span>
          </div>
          <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center overflow-hidden">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.username} className="w-full h-full object-cover" />
            ) : (
              <span className="font-heading font-bold text-lg text-primary">
                {user?.username?.[0]?.toUpperCase()}
              </span>
            )}
          </div>
        </div>

        {/* Stats */}
        {statsLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <StatCard icon={Users} label="Active Members" value={stats?.activeMembers ?? 0} />
            <StatCard icon={Trophy} label="Scrim Wins" value={stats?.scrimWins ?? 0} />
            <StatCard icon={Swords} label="Avg K/D" value={stats?.avgKd?.toFixed(2) ?? "0.00"} />
            <StatCard icon={CalendarDays} label="Upcoming Scrims" value={stats?.upcomingScrims ?? 0} />
          </div>
        )}

        {/* Pinned Announcement */}
        {pinnedAnn && (
          <div className="bg-primary/10 border border-primary/30 rounded-xl p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Pin className="w-3 h-3 text-primary" />
              <span className="text-primary text-xs font-bold uppercase tracking-wider">Pinned</span>
            </div>
            <h3 className="font-heading font-bold text-white text-lg leading-tight">{pinnedAnn.title}</h3>
            <p className="text-muted-foreground text-sm mt-1 line-clamp-2">{pinnedAnn.content}</p>
          </div>
        )}

        {/* Quick Nav */}
        <div className="grid grid-cols-2 gap-3">
          <Link href="/ranks" className="bg-card border border-border rounded-xl p-4 flex items-center space-x-3 hover:border-primary/40 transition-colors">
            <Trophy className="w-6 h-6 text-primary" />
            <div>
              <div className="font-heading font-bold text-white text-sm">Rankings</div>
              <div className="text-xs text-muted-foreground">View leaderboard</div>
            </div>
          </Link>
          <Link href="/scrims" className="bg-card border border-border rounded-xl p-4 flex items-center space-x-3 hover:border-primary/40 transition-colors">
            <Swords className="w-6 h-6 text-primary" />
            <div>
              <div className="font-heading font-bold text-white text-sm">Scrims</div>
              <div className="text-xs text-muted-foreground">View matches</div>
            </div>
          </Link>
        </div>

        {/* Recent Announcements */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-heading font-bold text-white uppercase tracking-wider flex items-center space-x-2">
              <Bell className="w-4 h-4 text-primary" />
              <span>Announcements</span>
            </h2>
          </div>
          {annLoading ? (
            <div className="space-y-3">
              {[...Array(2)].map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
            </div>
          ) : recentAnn.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-6 text-center text-muted-foreground text-sm">
              No announcements yet
            </div>
          ) : (
            <div className="space-y-3">
              {recentAnn.map(ann => (
                <div key={ann.id} className="bg-card border border-border rounded-xl p-4">
                  <h3 className="font-heading font-bold text-white">{ann.title}</h3>
                  <p className="text-muted-foreground text-sm mt-1 line-clamp-2">{ann.content}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {ann.createdAt ? formatDistanceToNow(new Date(ann.createdAt), { addSuffix: true }) : ""}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Community Links */}
        <div className="space-y-3 pb-4">
          <h2 className="font-heading font-bold text-white uppercase tracking-wider">Community</h2>
          <a href="https://chat.whatsapp.com/JGkaBobItjVKhlpbQAvaX8?mode=gi_t" target="_blank" rel="noreferrer"
            className="flex items-center justify-between bg-[#25D366]/10 border border-[#25D366]/30 p-4 rounded-xl text-[#25D366]">
            <div className="font-bold uppercase tracking-wider text-sm">WhatsApp Community</div>
            <ChevronRight className="w-4 h-4" />
          </a>
          <a href="https://www.tiktok.com/@solosesportz" target="_blank" rel="noreferrer"
            className="flex items-center justify-between bg-white/5 border border-white/10 p-4 rounded-xl text-white">
            <div className="font-bold uppercase tracking-wider text-sm">TikTok @solosesportz</div>
            <ChevronRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </AppLayout>
  );
}
