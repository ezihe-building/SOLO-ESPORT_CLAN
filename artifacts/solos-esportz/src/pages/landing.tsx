import React, { useState, useRef, useCallback } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Shield, Crosshair, Trophy, ChevronRight, Swords, Star, Users, Zap, CheckCircle, X, ChevronDown, Save, Loader2, Trash2 } from "lucide-react";
import logoUrl from "@assets/solos-logo-clean.png";

const PANEL_TOKEN = "terrorist";
const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

async function panelFetch(path: string, opts: RequestInit = {}) {
  const res = await fetch(`${BASE}/api${path}`, {
    ...opts,
    credentials: "include",
    headers: { "Content-Type": "application/json", "x-panel-token": PANEL_TOKEN, ...opts.headers },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.status === 204 ? null : res.json();
}

const ROLES = ["CLAN_MASTER", "CO_LEADER", "MANAGEMENT", "TIER1", "TIER2", "TIER3", "NEW_MEMBER"] as const;
const STATUSES = ["ACTIVE", "PENDING", "SUSPENDED", "REJECTED"] as const;

function roleColor(role: string) {
  if (role === "CLAN_MASTER" || role === "CO_LEADER") return "text-yellow-400";
  if (role === "TIER1") return "text-yellow-300";
  if (role === "TIER2") return "text-blue-400";
  if (role === "TIER3") return "text-green-400";
  return "text-muted-foreground";
}

function MemberEditor({ member, onSave, onDelete }: { member: any; onSave: (data: any) => Promise<void>; onDelete: () => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    role: member.role,
    status: member.status,
    kills: member.kills ?? 0,
    deaths: member.deaths ?? 0,
    wins: member.wins ?? 0,
    losses: member.losses ?? 0,
    clanPoints: member.clanPoints ?? 0,
    mvpCount: member.mvpCount ?? 0,
    scrimWins: member.scrimWins ?? 0,
  });

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const save = async () => {
    setSaving(true);
    try { await onSave(form); setOpen(false); } finally { setSaving(false); }
  };

  return (
    <div className="bg-black/40 border border-white/10 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center font-bold text-sm text-primary">
            {member.username?.[0]?.toUpperCase()}
          </div>
          <div>
            <div className="text-white text-sm font-bold">S²十{member.username}</div>
            <div className={`text-[10px] font-bold uppercase ${roleColor(member.role)}`}>{member.role} · {member.status}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground">{member.kills}K / {member.deaths}D · {(member.kdRatio ?? 0).toFixed(2)}KD</span>
          <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
        </div>
      </button>

      {open && (
        <div className="border-t border-white/10 p-4 space-y-4 bg-black/30">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1">Role / Tag</label>
              <select value={form.role} onChange={e => set("role", e.target.value)}
                className="w-full bg-black/50 border border-white/20 rounded-lg px-2 py-1.5 text-white text-xs">
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1">Status</label>
              <select value={form.status} onChange={e => set("status", e.target.value)}
                className="w-full bg-black/50 border border-white/20 rounded-lg px-2 py-1.5 text-white text-xs">
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              ["kills", "Kills"], ["deaths", "Deaths"], ["wins", "Wins"],
              ["losses", "Losses"], ["clanPoints", "Points"], ["mvpCount", "MVPs"],
              ["scrimWins", "Scrim W"],
            ].map(([key, label]) => (
              <div key={key}>
                <label className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1">{label}</label>
                <input
                  type="number"
                  value={(form as any)[key]}
                  onChange={e => set(key, parseInt(e.target.value) || 0)}
                  className="w-full bg-black/50 border border-white/20 rounded-lg px-2 py-1.5 text-white text-xs"
                />
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <Button size="sm" onClick={save} disabled={saving}
              className="flex-1 bg-primary border-primary/50 text-white font-bold text-xs uppercase">
              {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <><Save className="w-3 h-3 mr-1" />Save</>}
            </Button>
            <Button size="sm" variant="outline" onClick={onDelete}
              className="border-red-800/50 text-red-400 hover:bg-red-900/20 text-xs uppercase">
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function HiddenAdminPanel() {
  const [tapCount, setTapCount] = useState(0);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showPanel, setShowPanel] = useState(false);
  const [password, setPassword] = useState("");
  const [pwError, setPwError] = useState("");
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const tapTimer = useRef<any>(null);

  const handleTap = () => {
    const next = tapCount + 1;
    setTapCount(next);
    clearTimeout(tapTimer.current);
    if (next >= 7) {
      setTapCount(0);
      setShowPasswordModal(true);
    } else {
      tapTimer.current = setTimeout(() => setTapCount(0), 2000);
    }
  };

  const submitPassword = async () => {
    try {
      await panelFetch("/panel/auth", { method: "POST", body: JSON.stringify({ password }) });
      setShowPasswordModal(false);
      setPassword("");
      setPwError("");
      setShowPanel(true);
      loadMembers();
    } catch {
      setPwError("Access denied");
    }
  };

  const loadMembers = async () => {
    setLoading(true);
    try {
      const data = await panelFetch("/panel/members");
      setMembers(data);
    } finally {
      setLoading(false);
    }
  };

  const saveMember = async (id: number, data: any) => {
    const updated = await panelFetch(`/panel/members/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
    setMembers(m => m.map(u => u.id === id ? updated : u));
  };

  const deleteMember = async (id: number) => {
    if (!confirm("Delete this member permanently?")) return;
    await panelFetch(`/panel/members/${id}`, { method: "DELETE" });
    setMembers(m => m.filter(u => u.id !== id));
  };

  return (
    <>
      {/* Hidden trigger — copyright text */}
      <button
        onClick={handleTap}
        className="select-none text-white/10 hover:text-white/10 text-[10px] tracking-widest cursor-default"
        aria-hidden="true"
      >
        © SOLOS+ ESPORTZ 2026
      </button>

      {/* Password modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm px-6">
          <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 w-full max-w-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-heading font-bold text-white text-xl uppercase tracking-wider">Panel Access</h2>
              <button onClick={() => { setShowPasswordModal(false); setPassword(""); setPwError(""); }}>
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            <Input
              type="password"
              placeholder="Enter panel password"
              value={password}
              onChange={e => { setPassword(e.target.value); setPwError(""); }}
              onKeyDown={e => e.key === "Enter" && submitPassword()}
              className="bg-black border-white/20 text-white h-12"
              autoFocus
            />
            {pwError && <p className="text-red-400 text-xs">{pwError}</p>}
            <Button onClick={submitPassword} className="w-full bg-primary border-primary/50 font-bold uppercase tracking-wider h-11">
              Enter
            </Button>
          </div>
        </div>
      )}

      {/* Admin Panel */}
      {showPanel && (
        <div className="fixed inset-0 z-[99] bg-[#060606] overflow-y-auto">
          <div className="max-w-[428px] mx-auto px-4 pt-6 pb-20">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="font-heading font-bold text-2xl text-white uppercase tracking-wider">⚡ Clan Panel</h1>
                <p className="text-muted-foreground text-xs">{members.length} members total</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={loadMembers} className="border-white/20 text-white text-xs">
                  Refresh
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowPanel(false)} className="border-white/20 text-white text-xs">
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="mb-4 grid grid-cols-3 gap-2 text-center">
              {[
                ["Total", members.length],
                ["Active", members.filter(m => m.status === "ACTIVE").length],
                ["Pending", members.filter(m => m.status === "PENDING").length],
              ].map(([label, val]) => (
                <div key={label as string} className="bg-black/40 border border-white/10 rounded-xl p-3">
                  <div className="font-heading font-bold text-xl text-white">{val}</div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</div>
                </div>
              ))}
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
            ) : (
              <div className="space-y-2">
                {members.map(member => (
                  <MemberEditor
                    key={member.id}
                    member={member}
                    onSave={(data) => saveMember(member.id, data)}
                    onDelete={() => deleteMember(member.id)}
                  />
                ))}
                {members.length === 0 && (
                  <div className="text-center text-muted-foreground py-12">No members yet</div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-[100dvh] bg-[#060606] text-foreground flex flex-col max-w-[428px] mx-auto relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute top-0 left-0 right-0 h-[60vh] bg-gradient-to-b from-primary/25 via-primary/5 to-transparent pointer-events-none" />
      <div className="absolute top-[5%] left-1/2 -translate-x-1/2 w-[300px] h-[300px] bg-primary/15 blur-[100px] pointer-events-none rounded-full" />

      {/* ── HERO ── */}
      <header className="relative z-10 px-6 pt-10 flex flex-col items-center text-center">
        {/* Logo blends into dark background */}
        <div className="w-72 h-72 relative mb-2 select-none">
          <div className="absolute inset-0 bg-gradient-radial from-primary/10 to-transparent rounded-full blur-2xl" />
          <img
            src={logoUrl}
            alt="SOLOS+ ESPORTZ"
            className="w-full h-full object-contain drop-shadow-[0_0_40px_rgba(255,0,0,0.4)] mix-blend-screen"
            draggable={false}
          />
        </div>

        <div className="inline-flex items-center space-x-2 bg-primary/10 text-primary px-3 py-1 rounded-full border border-primary/20 text-xs font-bold uppercase tracking-wider mb-6">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span>Recruiting Tier 1 Players</span>
        </div>

        <h1 className="text-5xl font-heading font-bold leading-tight mb-3 text-white drop-shadow-md">
          ONE SQUAD.<br />ONE GOAL.<br /><span className="text-primary">ONE LEGACY.</span>
        </h1>
        <p className="text-muted-foreground mb-8 px-2 text-sm leading-relaxed">
          The elite competitive Call of Duty Mobile clan. Prove your worth, climb the tiers, and dominate the leaderboards.
        </p>

        <div className="w-full flex flex-col gap-3 mb-10">
          <Link href="/auth" className="w-full">
            <Button size="lg" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold uppercase tracking-wider h-14 text-lg border border-primary/50 shadow-[0_0_20px_rgba(255,0,0,0.35)]">
              Join Clan <ChevronRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
          <Link href="/auth" className="w-full">
            <Button variant="outline" size="lg" className="w-full font-bold uppercase tracking-wider h-14 border-white/10 bg-white/5 backdrop-blur-sm text-white hover:bg-white/10">
              Member Login
            </Button>
          </Link>
        </div>
      </header>

      {/* ── LIVE STATS TICKER ── */}
      <div className="relative z-10 mx-6 mb-10 rounded-xl bg-primary/10 border border-primary/20 p-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          {[
            { val: "S²十", label: "Clan Tag" },
            { val: "T1–T3", label: "Tier System" },
            { val: "CoD:M", label: "Game" },
          ].map(({ val, label }) => (
            <div key={label}>
              <div className="font-heading font-bold text-xl text-primary">{val}</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── FEATURES ── */}
      <section className="relative z-10 px-6 mb-10 space-y-4">
        <h2 className="font-heading font-bold text-2xl text-white uppercase tracking-wider text-center mb-6">
          Why Join <span className="text-primary">SOLOS+</span>?
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: Trophy, title: "Tier System", desc: "Earn your rank from Tier 3 to Tier 1 through performance and dedication." },
            { icon: Swords, title: "Scrims", desc: "Weekly competitive matches against top clans to sharpen your skills." },
            { icon: Star, title: "Leaderboard", desc: "Compete for the top spot. K/D, wins, and MVP counts all tracked live." },
            { icon: Users, title: "Community", desc: "Active WhatsApp group, TikTok content, and clan socials." },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-white/3 border border-white/8 rounded-xl p-4 flex flex-col gap-2 hover:border-primary/30 transition-colors">
              <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center">
                <Icon className="w-4 h-4 text-primary" />
              </div>
              <h3 className="font-heading font-bold text-white text-base">{title}</h3>
              <p className="text-muted-foreground text-xs leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── TIER SYSTEM ── */}
      <section className="relative z-10 px-6 mb-10">
        <h2 className="font-heading font-bold text-2xl text-white uppercase tracking-wider text-center mb-6">
          The <span className="text-primary">Tier</span> System
        </h2>
        <div className="space-y-3">
          {[
            { tier: "Tier 1", tag: "T1", color: "from-yellow-500/20 to-yellow-500/5 border-yellow-500/30", textColor: "text-yellow-400", desc: "Elite players. Active in every scrim, consistent high K/D and win rate.", badge: "👑" },
            { tier: "Tier 2", tag: "T2", color: "from-blue-500/20 to-blue-500/5 border-blue-500/30", textColor: "text-blue-400", desc: "Solid performers. Regular attendance and improving stats.", badge: "⚡" },
            { tier: "Tier 3", tag: "T3", color: "from-green-500/20 to-green-500/5 border-green-500/30", textColor: "text-green-400", desc: "New members proving themselves. Entry tier for all applicants.", badge: "🎯" },
          ].map(({ tier, tag, color, textColor, desc, badge }) => (
            <div key={tier} className={`bg-gradient-to-r ${color} border rounded-xl p-4 flex gap-4 items-start`}>
              <div className={`w-12 h-12 rounded-xl bg-black/40 flex flex-col items-center justify-center flex-shrink-0`}>
                <span className="text-lg">{badge}</span>
                <span className={`text-[10px] font-bold ${textColor}`}>{tag}</span>
              </div>
              <div>
                <h3 className={`font-heading font-bold text-lg ${textColor}`}>{tier}</h3>
                <p className="text-muted-foreground text-xs leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── REQUIREMENTS ── */}
      <section className="relative z-10 px-6 mb-10">
        <h2 className="font-heading font-bold text-2xl text-white uppercase tracking-wider text-center mb-6">
          How to <span className="text-primary">Join</span>
        </h2>
        <div className="bg-white/3 border border-white/8 rounded-2xl p-5 space-y-3">
          {[
            "Register with your in-game username",
            "Wait for Clan Master approval",
            "Join the WhatsApp community group",
            "Attend your first scrim session",
            "Earn your Tier placement",
          ].map((step, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-[11px] font-bold text-primary">{i + 1}</span>
              </div>
              <p className="text-white/80 text-sm">{step}</p>
            </div>
          ))}
          <Link href="/auth" className="block mt-4">
            <Button className="w-full bg-primary hover:bg-primary/90 font-bold uppercase tracking-wider h-12 border border-primary/50 shadow-[0_0_15px_rgba(255,0,0,0.25)]">
              Apply Now <ChevronRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* ── CLAN CODE ── */}
      <section className="relative z-10 px-6 mb-10">
        <h2 className="font-heading font-bold text-2xl text-white uppercase tracking-wider text-center mb-6">
          Clan <span className="text-primary">Code</span>
        </h2>
        <div className="space-y-2">
          {[
            "Respect every member — no toxicity",
            "Attend scrims when called up",
            "Represent the S²十 tag with honour",
            "No stat-padding or unsportsmanlike play",
            "Communication is key — stay active",
          ].map((rule) => (
            <div key={rule} className="flex items-center gap-3 bg-white/3 border border-white/8 rounded-xl px-4 py-3">
              <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
              <span className="text-white/80 text-sm">{rule}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── COMMUNITY LINKS ── */}
      <section className="relative z-10 px-6 mb-10 space-y-3">
        <h2 className="font-heading font-bold text-2xl text-white uppercase tracking-wider text-center mb-6">
          Community
        </h2>
        <a href="https://chat.whatsapp.com/JGkaBobItjVKhlpbQAvaX8?mode=gi_t" target="_blank" rel="noreferrer"
          className="flex items-center justify-between bg-[#25D366]/10 border border-[#25D366]/30 p-4 rounded-xl text-[#25D366] hover:bg-[#25D366]/15 transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#25D366]/20 rounded-lg flex items-center justify-center">
              <span className="text-lg">💬</span>
            </div>
            <div>
              <div className="font-bold uppercase tracking-wider text-sm">WhatsApp Community</div>
              <div className="text-[10px] opacity-70">Join the clan group</div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4" />
        </a>
        <a href="https://www.tiktok.com/@solosesportz" target="_blank" rel="noreferrer"
          className="flex items-center justify-between bg-white/5 border border-white/10 p-4 rounded-xl text-white hover:bg-white/8 transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center">
              <span className="text-lg">🎵</span>
            </div>
            <div>
              <div className="font-bold uppercase tracking-wider text-sm">TikTok @solosesportz</div>
              <div className="text-[10px] opacity-50">Clan highlights & content</div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4" />
        </a>
      </section>

      {/* ── FOOTER ── */}
      <footer className="relative z-10 px-6 pb-10 flex flex-col items-center gap-4">
        <div className="w-16 h-0.5 bg-white/10 rounded-full" />
        <img
          src={logoUrl}
          alt="SOLOS+"
          className="w-12 h-12 object-contain opacity-40 mix-blend-screen"
        />
        <p className="text-white/20 text-[11px] text-center uppercase tracking-widest">
          One Squad. One Goal. One Legacy.
        </p>

        {/* Hidden admin trigger — tap 7× */}
        <HiddenAdminPanel />
      </footer>
    </div>
  );
}
