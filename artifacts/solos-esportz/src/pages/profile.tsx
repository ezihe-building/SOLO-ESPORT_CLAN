import React, { useState, useRef } from "react";
import { AppLayout } from "@/components/layout";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { getGetMeQueryKey, useLogout } from "@workspace/api-client-react";
import { Trophy, Crosshair, Star, Target, Swords, Shield, Edit2, LogOut, ChevronRight, Camera, Loader2 } from "lucide-react";
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
    CLAN_MASTER: "👑 Clan Master",
    CO_LEADER: "⭐ Co-Leader",
    MANAGEMENT: "🛡️ Management",
    ADMIN: "🛡️ Admin",
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
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="w-4 h-4 text-primary" />
        </div>
        <span className="text-muted-foreground text-sm">{label}</span>
      </div>
      <span className="font-heading font-bold text-white">{value}</span>
    </div>
  );
}

async function uploadFile(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch("/api/upload", { method: "POST", body: form, credentials: "include" });
  if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err?.error || "Upload failed"); }
  return (await res.json()).url as string;
}

export default function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    displayName: (user as any)?.displayName ?? "",
    bio: user?.bio ?? "",
  });
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const logoutMutation = useLogout({
    mutation: {
      onSuccess: () => {
        queryClient.clear();
        navigate("/");
      },
    },
  });

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      let avatarUrl: string | undefined;
      if (avatarFile) {
        avatarUrl = await uploadFile(avatarFile);
      }

      const updates: Record<string, any> = {
        displayName: form.displayName.trim() || null,
        bio: form.bio.trim() || null,
      };
      if (avatarUrl) updates.avatarUrl = avatarUrl;

      const res = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(updates),
      });
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e?.error || "Update failed"); }

      await queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
      setEditing(false);
      setAvatarFile(null);
      setAvatarPreview(null);
      toast({ title: "Profile updated!" });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Update failed", description: err?.message });
    } finally { setSaving(false); }
  };

  if (!user) return null;

  const displayAvatar = avatarPreview ?? user.avatarUrl;
  const displayName = (user as any).displayName ?? user.username;

  return (
    <AppLayout>
      <div className="px-4 pt-6 pb-4 space-y-5">
        <div className="bg-card border border-border rounded-xl p-5 flex flex-col items-center text-center space-y-3">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center overflow-hidden">
              {displayAvatar ? (
                <img src={displayAvatar} alt={displayName} className="w-full h-full object-cover" />
              ) : (
                <span className="font-heading font-bold text-3xl text-primary">{displayName[0]?.toUpperCase()}</span>
              )}
            </div>
            {editing && (
              <>
                <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarSelect} />
                <button type="button" onClick={() => avatarInputRef.current?.click()}
                  className="absolute bottom-0 right-0 w-7 h-7 bg-primary rounded-full flex items-center justify-center border-2 border-background">
                  <Camera className="w-3.5 h-3.5 text-white" />
                </button>
              </>
            )}
          </div>

          <div>
            <h1 className="font-heading font-bold text-2xl text-white leading-none">
              S²十{displayName}
            </h1>
            {(user as any).displayName && (
              <p className="text-muted-foreground text-xs mt-0.5">@{user.username}</p>
            )}
            <span className={`inline-block mt-1 text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${tierColor(user.role)}`}>
              {tierLabel(user.role)}
            </span>
          </div>

          {user.bio && !editing && <p className="text-muted-foreground text-xs text-center leading-relaxed max-w-xs">{user.bio}</p>}
          {user.email && <p className="text-muted-foreground text-xs">{user.email}</p>}

          <div className="flex gap-2 w-full">
            <Button size="sm" variant="outline" onClick={() => { setEditing(!editing); setForm({ displayName: (user as any).displayName ?? "", bio: user.bio ?? "" }); }}
              className="flex-1 border-border font-bold uppercase tracking-wider text-xs">
              <Edit2 className="w-3 h-3 mr-1.5" />
              {editing ? "Cancel" : "Edit"}
            </Button>
            <Button size="sm" variant="outline" onClick={() => logoutMutation.mutate()}
              className="flex-1 border-destructive/30 text-destructive hover:bg-destructive/10 font-bold uppercase tracking-wider text-xs">
              <LogOut className="w-3 h-3 mr-1.5" />
              Logout
            </Button>
          </div>
        </div>

        {editing && (
          <form onSubmit={handleSave} className="bg-card border border-border rounded-xl p-4 space-y-4">
            <h3 className="font-heading font-bold text-white text-sm uppercase tracking-wider">Edit Profile</h3>
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5 block">Display Name</Label>
              <Input
                type="text"
                placeholder={user.username}
                maxLength={50}
                value={form.displayName}
                onChange={e => setForm(f => ({ ...f, displayName: e.target.value }))}
                className="bg-background border-border h-10 text-sm"
              />
              <p className="text-[10px] text-muted-foreground mt-1">This is the name others will see. Username stays as your login.</p>
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5 block">Bio</Label>
              <Input
                type="text"
                placeholder="Tell the clan about yourself..."
                maxLength={200}
                value={form.bio}
                onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                className="bg-background border-border h-10 text-sm"
              />
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" className="flex-1"
                onClick={() => { setEditing(false); setAvatarFile(null); setAvatarPreview(null); }}>
                Cancel
              </Button>
              <Button type="submit" size="sm" className="flex-1 bg-primary border-primary-border" disabled={saving}>
                {saving ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Saving...</> : "Save"}
              </Button>
            </div>
          </form>
        )}

        <div className="bg-card border border-border rounded-xl px-4">
          <h2 className="font-heading font-bold text-white uppercase tracking-wider pt-4 pb-2 text-sm flex items-center gap-2">
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
