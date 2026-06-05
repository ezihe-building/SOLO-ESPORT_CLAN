import React, { useState } from "react";
import { useUpdateUser } from "@workspace/api-client-react";
import { AppLayout } from "@/components/layout";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { getGetMeQueryKey } from "@workspace/api-client-react";
import { Trophy, Crosshair, Star, Target, Swords, Shield, Edit2, LogOut, ChevronRight } from "lucide-react";
import { useLogout } from "@workspace/api-client-react";
import { useLocation } from "wouter";

function tierColor(role?: string) {
  if (role === "CLAN_MASTER" || role === "CO_LEADER") return "text-yellow-400 bg-yellow-400/10 border-yellow-400/30";
  if (role === "TIER1") return "text-yellow-400 bg-yellow-400/10 border-yellow-400/30";
  if (role === "TIER2") return "text-blue-400 bg-blue-400/10 border-blue-400/30";
  if (role === "TIER3") return "text-green-400 bg-green-400/10 border-green-400/30";
  return "text-muted-foreground bg-muted/10 border-border";
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
  return map[role ?? ""] ?? "Member";
}

function StatRow({ icon: Icon, label, value }: { icon: any; label: string; value: any }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="w-4 h-4 text-primary" />
        </div>
        <span className="text-muted-foreground text-sm">{label}</span>
      </div>
      <span className="font-heading font-bold text-white">{value}</span>
    </div>
  );
}

export default function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ avatarUrl: user?.avatarUrl ?? "" });

  const updateUser = useUpdateUser({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        setEditing(false);
        toast({ title: "Profile updated!" });
      },
      onError: (err: any) => {
        toast({ variant: "destructive", title: "Update failed", description: err?.message });
      },
    },
  });

  const logoutMutation = useLogout({
    mutation: {
      onSuccess: () => {
        queryClient.clear();
        navigate("/");
      },
    },
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateUser.mutate({ id: user!.id, data: { avatarUrl: form.avatarUrl || undefined } });
  };

  if (!user) return null;

  return (
    <AppLayout>
      <div className="px-4 pt-6 pb-4 space-y-5">
        {/* Profile Header */}
        <div className="bg-card border border-border rounded-xl p-5 flex flex-col items-center text-center space-y-3">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center overflow-hidden">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.username} className="w-full h-full object-cover" />
              ) : (
                <span className="font-heading font-bold text-3xl text-primary">{user.username[0]?.toUpperCase()}</span>
              )}
            </div>
          </div>

          <div>
            <h1 className="font-heading font-bold text-2xl text-white leading-none">S²十{user.username}</h1>
            <span className={`inline-block mt-1 text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${tierColor(user.role)}`}>
              {tierLabel(user.role)}
            </span>
          </div>

          {user.email && <p className="text-muted-foreground text-xs">{user.email}</p>}

          <div className="flex space-x-2 w-full">
            <Button size="sm" variant="outline" onClick={() => setEditing(!editing)} className="flex-1 border-border font-bold uppercase tracking-wider text-xs">
              <Edit2 className="w-3 h-3 mr-1.5" />
              Edit
            </Button>
            <Button size="sm" variant="outline" onClick={() => logoutMutation.mutate()}
              className="flex-1 border-destructive/30 text-destructive hover:bg-destructive/10 font-bold uppercase tracking-wider text-xs">
              <LogOut className="w-3 h-3 mr-1.5" />
              Logout
            </Button>
          </div>
        </div>

        {/* Edit Form */}
        {editing && (
          <form onSubmit={handleSave} className="bg-card border border-border rounded-xl p-4 space-y-4">
            <h3 className="font-heading font-bold text-white text-sm uppercase tracking-wider">Edit Profile</h3>
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5 block">Avatar URL</Label>
              <Input
                type="url"
                placeholder="https://..."
                value={form.avatarUrl}
                onChange={e => setForm(f => ({ ...f, avatarUrl: e.target.value }))}
                className="bg-background border-border h-10 text-sm"
              />
            </div>
            <div className="flex space-x-2">
              <Button type="button" variant="outline" size="sm" className="flex-1" onClick={() => setEditing(false)}>Cancel</Button>
              <Button type="submit" size="sm" className="flex-1 bg-primary border-primary-border" disabled={updateUser.isPending}>
                {updateUser.isPending ? "Saving..." : "Save"}
              </Button>
            </div>
          </form>
        )}

        {/* Stats */}
        <div className="bg-card border border-border rounded-xl px-4">
          <h2 className="font-heading font-bold text-white uppercase tracking-wider pt-4 pb-2 text-sm flex items-center space-x-2">
            <Trophy className="w-4 h-4 text-primary" />
            <span>Statistics</span>
          </h2>
          <StatRow icon={Crosshair} label="Kills" value={user.kills ?? 0} />
          <StatRow icon={Shield} label="Deaths" value={(user as any).deaths ?? 0} />
          <StatRow icon={Target} label="K/D Ratio" value={(user.kdRatio ?? 0).toFixed(2)} />
          <StatRow icon={Trophy} label="Wins" value={user.wins ?? 0} />
          <StatRow icon={Swords} label="Scrim Wins" value={user.scrimWins ?? 0} />
          <StatRow icon={Star} label="MVP Count" value={user.mvpCount ?? 0} />
          <StatRow icon={Trophy} label="Clan Points" value={user.clanPoints ?? 0} />
        </div>

        {/* Admin Quick Link */}
        {(["CLAN_MASTER", "CO_LEADER", "MANAGEMENT"] as string[]).includes(user.role) && (
          <a href="/admin" className="flex items-center justify-between bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 text-yellow-400">
            <div className="font-heading font-bold uppercase tracking-wider text-sm">Management Panel</div>
            <ChevronRight className="w-4 h-4" />
          </a>
        )}
      </div>
    </AppLayout>
  );
}
