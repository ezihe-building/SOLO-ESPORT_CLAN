import React, { useState, useRef, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  X, Loader2, Save, Trash2, ChevronDown, Plus, Pin, Bell,
  Users, BarChart3, Megaphone, Calendar, Swords, MessageSquare,
  Settings, CheckCircle, XCircle, UserX, RefreshCw, Search,
  LogOut, Shield, Star, Trophy,
} from "lucide-react";
import logoUrl from "@assets/solos-logo-clean.png";

const PANEL_TOKEN = "terrorist";
const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

async function pf(path: string, opts: RequestInit = {}) {
  const method = opts.method ?? "GET";
  const res = await fetch(`${BASE}/api${path}`, {
    ...opts,
    credentials: "include",
    headers: {
      ...(method !== "GET" ? { "Content-Type": "application/json" } : {}),
      "x-panel-token": PANEL_TOKEN,
      ...(opts.headers as Record<string, string> ?? {}),
    },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.status === 204 ? null : res.json();
}

const ROLES = ["CLAN_MASTER", "CO_LEADER", "MANAGEMENT", "TIER1", "TIER2", "TIER3", "NEW_MEMBER"] as const;
const STATUSES = ["ACTIVE", "PENDING", "SUSPENDED", "REJECTED"] as const;

function roleColor(role: string) {
  if (role === "CLAN_MASTER") return "text-yellow-400 bg-yellow-500/10 border-yellow-500/30";
  if (role === "CO_LEADER") return "text-orange-400 bg-orange-500/10 border-orange-500/30";
  if (role === "MANAGEMENT") return "text-purple-400 bg-purple-500/10 border-purple-500/30";
  if (role === "TIER1") return "text-yellow-300 bg-yellow-400/10 border-yellow-400/30";
  if (role === "TIER2") return "text-blue-400 bg-blue-500/10 border-blue-500/30";
  if (role === "TIER3") return "text-green-400 bg-green-500/10 border-green-500/30";
  return "text-gray-400 bg-gray-500/10 border-gray-500/30";
}

function statusColor(status: string) {
  if (status === "ACTIVE") return "text-green-400";
  if (status === "PENDING") return "text-yellow-400";
  if (status === "SUSPENDED") return "text-orange-400";
  return "text-red-400";
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`bg-black/40 border border-white/10 rounded-xl ${className}`}>{children}</div>;
}

function StatCard({ label, value, color = "text-white" }: { label: string; value: number | string; color?: string }) {
  return (
    <Card className="p-4 text-center">
      <div className={`font-heading font-bold text-2xl ${color}`}>{value}</div>
      <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">{label}</div>
    </Card>
  );
}

// ── DASHBOARD TAB ──
function DashboardTab({ stats, onRefresh }: { stats: any; onRefresh: () => void }) {
  if (!stats) return <div className="flex items-center justify-center py-16"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>;
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-heading font-bold text-white text-lg uppercase tracking-wider">Overview</h2>
        <button onClick={onRefresh} className="text-muted-foreground hover:text-white transition-colors"><RefreshCw className="w-4 h-4" /></button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <StatCard label="Total Members" value={stats.total} />
        <StatCard label="Active" value={stats.active} color="text-green-400" />
        <StatCard label="Pending" value={stats.pending} color="text-yellow-400" />
        <StatCard label="Suspended" value={stats.suspended} color="text-orange-400" />
        <StatCard label="Tier 1" value={stats.tier1} color="text-yellow-300" />
        <StatCard label="Tier 2" value={stats.tier2} color="text-blue-400" />
        <StatCard label="Tier 3" value={stats.tier3} color="text-green-400" />
        <StatCard label="Management" value={stats.management} color="text-purple-400" />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <StatCard label="Announcements" value={stats.announcements} />
        <StatCard label="Events" value={stats.events} />
        <StatCard label="Scrims" value={stats.scrims} />
      </div>
      {stats.recentMembers?.length > 0 && (
        <Card className="p-4">
          <h3 className="font-heading font-bold text-white text-sm uppercase tracking-wider mb-3">Recent Registrations</h3>
          <div className="space-y-2">
            {stats.recentMembers.map((m: any) => (
              <div key={m.id} className="flex items-center justify-between">
                <div>
                  <div className="text-white text-xs font-bold">S²十{m.username}</div>
                  <div className={`text-[10px] font-bold ${statusColor(m.status)}`}>{m.status}</div>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${roleColor(m.role)}`}>{m.role}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

// ── MEMBER ROW ──
function MemberRow({ member, onSave, onDelete }: { member: any; onSave: (d: any) => Promise<void>; onDelete: () => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    role: member.role, status: member.status,
    kills: member.kills ?? 0, deaths: member.deaths ?? 0,
    wins: member.wins ?? 0, losses: member.losses ?? 0,
    clanPoints: member.clanPoints ?? 0, mvpCount: member.mvpCount ?? 0,
    scrimWins: member.scrimWins ?? 0, tournamentWins: member.tournamentWins ?? 0,
    activity: member.activity ?? 0,
  });
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const quickAction = async (status: string) => {
    setSaving(true);
    try { await onSave({ status }); } finally { setSaving(false); }
  };

  const save = async () => {
    setSaving(true);
    try { await onSave(form); setOpen(false); } finally { setSaving(false); }
  };

  return (
    <Card className="overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors text-left">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0 font-bold text-sm text-primary">
            {member.username?.[0]?.toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="text-white text-sm font-bold truncate">S²十{member.username}</div>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-bold ${statusColor(member.status)}`}>{member.status}</span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${roleColor(member.role)}`}>{member.role}</span>
            </div>
          </div>
        </div>
        <ChevronDown className={`w-4 h-4 text-muted-foreground flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {!open && member.status === "PENDING" && (
        <div className="flex gap-2 px-4 pb-3">
          <Button size="sm" onClick={() => quickAction("ACTIVE")} disabled={saving}
            className="flex-1 bg-green-600/20 border border-green-600/30 text-green-400 hover:bg-green-600/30 text-xs">
            <CheckCircle className="w-3 h-3 mr-1" />Approve
          </Button>
          <Button size="sm" onClick={() => quickAction("REJECTED")} disabled={saving}
            className="flex-1 bg-red-600/20 border border-red-600/30 text-red-400 hover:bg-red-600/30 text-xs">
            <XCircle className="w-3 h-3 mr-1" />Reject
          </Button>
        </div>
      )}

      {open && (
        <div className="border-t border-white/10 p-4 space-y-4 bg-black/20">
          <div className="text-[10px] text-muted-foreground">KD: {(member.kdRatio ?? 0).toFixed(2)} · Kills: {member.kills} · Deaths: {member.deaths}</div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-muted-foreground uppercase block mb-1">Role / Tag</label>
              <select value={form.role} onChange={e => set("role", e.target.value)}
                className="w-full bg-black/60 border border-white/20 rounded-lg px-2 py-2 text-white text-xs">
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground uppercase block mb-1">Status</label>
              <select value={form.status} onChange={e => set("status", e.target.value)}
                className="w-full bg-black/60 border border-white/20 rounded-lg px-2 py-2 text-white text-xs">
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {([["kills","Kills"],["deaths","Deaths"],["wins","Wins"],["losses","Losses"],["clanPoints","Points"],["mvpCount","MVPs"],["scrimWins","Scrim W"],["tournamentWins","Tourn W"],["activity","Activity"]] as [string, string][]).map(([k, l]) => (
              <div key={k}>
                <label className="text-[10px] text-muted-foreground uppercase block mb-1">{l}</label>
                <input type="number" value={(form as any)[k]}
                  onChange={e => set(k, parseInt(e.target.value) || 0)}
                  className="w-full bg-black/60 border border-white/20 rounded-lg px-2 py-1.5 text-white text-xs" />
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <Button size="sm" onClick={save} disabled={saving}
              className="flex-1 bg-primary border-primary/50 text-white font-bold text-xs uppercase h-9">
              {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <><Save className="w-3 h-3 mr-1" />Save</>}
            </Button>
            <Button size="sm" onClick={() => quickAction("SUSPENDED")} disabled={saving}
              className="bg-orange-600/20 border border-orange-600/30 text-orange-400 text-xs h-9">
              <UserX className="w-3 h-3" />
            </Button>
            <Button size="sm" onClick={onDelete} disabled={saving}
              className="bg-red-600/20 border border-red-600/30 text-red-400 text-xs h-9">
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}

// ── MEMBERS TAB ──
function MembersTab({ members, loading, onRefresh, onSave, onDelete }: {
  members: any[]; loading: boolean; onRefresh: () => void;
  onSave: (id: number, d: any) => Promise<void>; onDelete: (id: number) => Promise<void>;
}) {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterRole, setFilterRole] = useState("ALL");

  const filtered = members.filter(m => {
    const matchSearch = !search || m.username.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "ALL" || m.status === filterStatus;
    const matchRole = filterRole === "ALL" || m.role === filterRole;
    return matchSearch && matchStatus && matchRole;
  });

  const pending = members.filter(m => m.status === "PENDING");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-heading font-bold text-white text-lg uppercase tracking-wider">Members ({members.length})</h2>
        <button onClick={onRefresh} className="text-muted-foreground hover:text-white transition-colors"><RefreshCw className="w-4 h-4" /></button>
      </div>

      {pending.length > 0 && (
        <Card className="p-3 border-yellow-500/20 bg-yellow-500/5">
          <div className="text-yellow-400 font-bold text-xs uppercase tracking-wider mb-1">⏳ {pending.length} Pending Approval</div>
          <div className="text-yellow-400/70 text-[10px]">Expand member rows below to approve or reject</div>
        </Card>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search members..."
          className="pl-9 bg-black/40 border-white/20 text-white h-10" />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-white text-xs">
          <option value="ALL">All Statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filterRole} onChange={e => setFilterRole(e.target.value)}
          className="bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-white text-xs">
          <option value="ALL">All Roles</option>
          {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>
      ) : (
        <div className="space-y-2">
          {filtered.map(m => (
            <MemberRow key={m.id} member={m}
              onSave={d => onSave(m.id, d)}
              onDelete={() => onDelete(m.id)} />
          ))}
          {filtered.length === 0 && <div className="text-center text-muted-foreground py-8 text-sm">No members found</div>}
        </div>
      )}
    </div>
  );
}

// ── ANNOUNCEMENTS TAB ──
function AnnouncementsTab() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ title: "", content: "", link: "", isPinned: false });
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { setItems(await pf("/panel/announcements")); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const submit = async () => {
    if (!form.title || !form.content) return;
    setSaving(true);
    try {
      if (editId) {
        const updated = await pf(`/panel/announcements/${editId}`, { method: "PATCH", body: JSON.stringify(form) });
        setItems(i => i.map(x => x.id === editId ? updated : x));
      } else {
        const created = await pf("/panel/announcements", { method: "POST", body: JSON.stringify(form) });
        setItems(i => [created, ...i]);
      }
      setForm({ title: "", content: "", link: "", isPinned: false });
      setCreating(false); setEditId(null);
    } finally { setSaving(false); }
  };

  const del = async (id: number) => {
    if (!confirm("Delete announcement?")) return;
    await pf(`/panel/announcements/${id}`, { method: "DELETE" });
    setItems(i => i.filter(x => x.id !== id));
  };

  const pin = async (id: number, isPinned: boolean) => {
    const updated = await pf(`/panel/announcements/${id}`, { method: "PATCH", body: JSON.stringify({ isPinned }) });
    setItems(i => i.map(x => x.id === id ? updated : x));
  };

  const startEdit = (item: any) => {
    setForm({ title: item.title, content: item.content, link: item.link ?? "", isPinned: item.isPinned });
    setEditId(item.id); setCreating(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-heading font-bold text-white text-lg uppercase tracking-wider">Announcements</h2>
        <Button size="sm" onClick={() => { setCreating(!creating); setEditId(null); setForm({ title: "", content: "", link: "", isPinned: false }); }}
          className="bg-primary border-primary/50 text-white text-xs h-8 px-3 font-bold uppercase">
          <Plus className="w-3 h-3 mr-1" />{creating ? "Cancel" : "New"}
        </Button>
      </div>

      {creating && (
        <Card className="p-4 space-y-3">
          <h3 className="font-bold text-white text-sm uppercase tracking-wider">{editId ? "Edit" : "New"} Announcement</h3>
          <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Title *"
            className="bg-black/60 border-white/20 text-white h-10" />
          <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} placeholder="Content *" rows={4}
            className="w-full bg-black/60 border border-white/20 rounded-lg px-3 py-2 text-white text-sm resize-none" />
          <Input value={form.link} onChange={e => setForm(f => ({ ...f, link: e.target.value }))} placeholder="Link (optional)"
            className="bg-black/60 border-white/20 text-white h-10" />
          <label className="flex items-center gap-2 text-white text-sm cursor-pointer">
            <input type="checkbox" checked={form.isPinned} onChange={e => setForm(f => ({ ...f, isPinned: e.target.checked }))}
              className="w-4 h-4" />
            Pin this announcement
          </label>
          <Button onClick={submit} disabled={saving} className="w-full bg-primary border-primary/50 font-bold uppercase h-10">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editId ? "Update" : "Post"}
          </Button>
        </Card>
      )}

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>
      ) : (
        <div className="space-y-2">
          {items.map(item => (
            <Card key={item.id} className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    {item.isPinned && <Pin className="w-3 h-3 text-primary flex-shrink-0" />}
                    <h4 className="font-bold text-white text-sm truncate">{item.title}</h4>
                  </div>
                  <p className="text-muted-foreground text-xs line-clamp-2">{item.content}</p>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => pin(item.id, !item.isPinned)}
                    className={`p-1.5 rounded transition-colors ${item.isPinned ? "text-primary" : "text-muted-foreground hover:text-white"}`}>
                    <Pin className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => startEdit(item)} className="p-1.5 rounded text-muted-foreground hover:text-white">
                    <Save className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => del(item.id)} className="p-1.5 rounded text-muted-foreground hover:text-red-400">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
          {items.length === 0 && <div className="text-center text-muted-foreground py-8 text-sm">No announcements yet</div>}
        </div>
      )}
    </div>
  );
}

// ── EVENTS TAB ──
function EventsTab() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", link: "", eventDate: "" });
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { setItems(await pf("/panel/events")); } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const submit = async () => {
    if (!form.title || !form.description) return;
    setSaving(true);
    try {
      if (editId) {
        const updated = await pf(`/panel/events/${editId}`, { method: "PATCH", body: JSON.stringify(form) });
        setItems(i => i.map(x => x.id === editId ? updated : x));
      } else {
        const created = await pf("/panel/events", { method: "POST", body: JSON.stringify(form) });
        setItems(i => [created, ...i]);
      }
      setForm({ title: "", description: "", link: "", eventDate: "" });
      setCreating(false); setEditId(null);
    } finally { setSaving(false); }
  };

  const del = async (id: number) => {
    if (!confirm("Delete event?")) return;
    await pf(`/panel/events/${id}`, { method: "DELETE" });
    setItems(i => i.filter(x => x.id !== id));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-heading font-bold text-white text-lg uppercase tracking-wider">Events</h2>
        <Button size="sm" onClick={() => { setCreating(!creating); setEditId(null); setForm({ title: "", description: "", link: "", eventDate: "" }); }}
          className="bg-primary border-primary/50 text-white text-xs h-8 px-3 font-bold uppercase">
          <Plus className="w-3 h-3 mr-1" />{creating ? "Cancel" : "New"}
        </Button>
      </div>
      {creating && (
        <Card className="p-4 space-y-3">
          <h3 className="font-bold text-white text-sm uppercase tracking-wider">{editId ? "Edit" : "New"} Event</h3>
          <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Title *"
            className="bg-black/60 border-white/20 text-white h-10" />
          <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Description *" rows={3}
            className="w-full bg-black/60 border border-white/20 rounded-lg px-3 py-2 text-white text-sm resize-none" />
          <Input value={form.eventDate} onChange={e => setForm(f => ({ ...f, eventDate: e.target.value }))} type="datetime-local"
            className="bg-black/60 border-white/20 text-white h-10" />
          <Input value={form.link} onChange={e => setForm(f => ({ ...f, link: e.target.value }))} placeholder="Link (optional)"
            className="bg-black/60 border-white/20 text-white h-10" />
          <Button onClick={submit} disabled={saving} className="w-full bg-primary border-primary/50 font-bold uppercase h-10">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editId ? "Update" : "Create"}
          </Button>
        </Card>
      )}
      {loading ? <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div> : (
        <div className="space-y-2">
          {items.map(item => (
            <Card key={item.id} className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-white text-sm mb-1">{item.title}</h4>
                  <p className="text-muted-foreground text-xs line-clamp-2">{item.description}</p>
                  {item.eventDate && <div className="text-primary text-[10px] mt-1">📅 {new Date(item.eventDate).toLocaleDateString()}</div>}
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => { setForm({ title: item.title, description: item.description, link: item.link ?? "", eventDate: item.eventDate?.slice(0,16) ?? "" }); setEditId(item.id); setCreating(true); }}
                    className="p-1.5 rounded text-muted-foreground hover:text-white"><Save className="w-3.5 h-3.5" /></button>
                  <button onClick={() => del(item.id)} className="p-1.5 rounded text-muted-foreground hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            </Card>
          ))}
          {items.length === 0 && <div className="text-center text-muted-foreground py-8 text-sm">No events yet</div>}
        </div>
      )}
    </div>
  );
}

// ── SCRIMS TAB ──
function ScrimsTab() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", link: "", scheduledAt: "", status: "UPCOMING" });
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { setItems(await pf("/panel/scrims")); } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const submit = async () => {
    if (!form.title) return;
    setSaving(true);
    try {
      if (editId) {
        const updated = await pf(`/panel/scrims/${editId}`, { method: "PATCH", body: JSON.stringify(form) });
        setItems(i => i.map(x => x.id === editId ? updated : x));
      } else {
        const created = await pf("/panel/scrims", { method: "POST", body: JSON.stringify(form) });
        setItems(i => [created, ...i]);
      }
      setForm({ title: "", description: "", link: "", scheduledAt: "", status: "UPCOMING" });
      setCreating(false); setEditId(null);
    } finally { setSaving(false); }
  };

  const del = async (id: number) => {
    if (!confirm("Delete scrim?")) return;
    await pf(`/panel/scrims/${id}`, { method: "DELETE" });
    setItems(i => i.filter(x => x.id !== id));
  };

  const statusColors: Record<string, string> = {
    UPCOMING: "text-blue-400", ONGOING: "text-yellow-400", COMPLETED: "text-green-400", CANCELLED: "text-red-400",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-heading font-bold text-white text-lg uppercase tracking-wider">Scrims</h2>
        <Button size="sm" onClick={() => { setCreating(!creating); setEditId(null); setForm({ title: "", description: "", link: "", scheduledAt: "", status: "UPCOMING" }); }}
          className="bg-primary border-primary/50 text-white text-xs h-8 px-3 font-bold uppercase">
          <Plus className="w-3 h-3 mr-1" />{creating ? "Cancel" : "New"}
        </Button>
      </div>
      {creating && (
        <Card className="p-4 space-y-3">
          <h3 className="font-bold text-white text-sm uppercase tracking-wider">{editId ? "Edit" : "New"} Scrim</h3>
          <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Title *"
            className="bg-black/60 border-white/20 text-white h-10" />
          <Input value={form.scheduledAt} onChange={e => setForm(f => ({ ...f, scheduledAt: e.target.value }))} type="datetime-local"
            className="bg-black/60 border-white/20 text-white h-10" />
          <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Description" rows={2}
            className="w-full bg-black/60 border border-white/20 rounded-lg px-3 py-2 text-white text-sm resize-none" />
          <Input value={form.link} onChange={e => setForm(f => ({ ...f, link: e.target.value }))} placeholder="External link (optional)"
            className="bg-black/60 border-white/20 text-white h-10" />
          <div>
            <label className="text-[10px] text-muted-foreground uppercase block mb-1">Status</label>
            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
              className="w-full bg-black/60 border border-white/20 rounded-lg px-3 py-2 text-white text-sm">
              {["UPCOMING","ONGOING","COMPLETED","CANCELLED"].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <Button onClick={submit} disabled={saving} className="w-full bg-primary border-primary/50 font-bold uppercase h-10">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editId ? "Update" : "Create"}
          </Button>
        </Card>
      )}
      {loading ? <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div> : (
        <div className="space-y-2">
          {items.map(item => (
            <Card key={item.id} className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-bold text-white text-sm">{item.title}</h4>
                    <span className={`text-[10px] font-bold ${statusColors[item.status] ?? "text-white"}`}>{item.status}</span>
                  </div>
                  {item.opponent && <div className="text-muted-foreground text-xs">vs {item.opponent}</div>}
                  {item.scheduledAt && <div className="text-primary text-[10px] mt-1">⚔️ {new Date(item.scheduledAt).toLocaleString()}</div>}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => { setForm({ title: item.title, description: item.description ?? "", link: item.link ?? "", scheduledAt: item.scheduledAt?.slice(0,16) ?? "", status: item.status }); setEditId(item.id); setCreating(true); }}
                    className="p-1.5 rounded text-muted-foreground hover:text-white"><Save className="w-3.5 h-3.5" /></button>
                  <button onClick={() => del(item.id)} className="p-1.5 rounded text-muted-foreground hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            </Card>
          ))}
          {items.length === 0 && <div className="text-center text-muted-foreground py-8 text-sm">No scrims yet</div>}
        </div>
      )}
    </div>
  );
}

// ── FEED TAB ──
function FeedTab() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ content: "", link: "" });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { setPosts(await pf("/panel/feed")); } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const submit = async () => {
    if (!form.content) return;
    setSaving(true);
    try {
      const created = await pf("/panel/feed", { method: "POST", body: JSON.stringify(form) });
      setPosts(p => [created, ...p]);
      setForm({ content: "", link: "" }); setCreating(false);
    } finally { setSaving(false); }
  };

  const del = async (id: number) => {
    if (!confirm("Delete post?")) return;
    await pf(`/panel/feed/${id}`, { method: "DELETE" });
    setPosts(p => p.filter(x => x.id !== id));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-heading font-bold text-white text-lg uppercase tracking-wider">Feed Posts</h2>
        <Button size="sm" onClick={() => setCreating(!creating)}
          className="bg-primary border-primary/50 text-white text-xs h-8 px-3 font-bold uppercase">
          <Plus className="w-3 h-3 mr-1" />{creating ? "Cancel" : "Post"}
        </Button>
      </div>
      {creating && (
        <Card className="p-4 space-y-3">
          <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} placeholder="Write a post... (announcements, news, recruitment)" rows={4}
            className="w-full bg-black/60 border border-white/20 rounded-lg px-3 py-2 text-white text-sm resize-none" />
          <Input value={form.link} onChange={e => setForm(f => ({ ...f, link: e.target.value }))} placeholder="Link (optional)"
            className="bg-black/60 border-white/20 text-white h-10" />
          <Button onClick={submit} disabled={saving} className="w-full bg-primary border-primary/50 font-bold uppercase h-10">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Publish Post"}
          </Button>
        </Card>
      )}
      {loading ? <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div> : (
        <div className="space-y-2">
          {posts.map(post => (
            <Card key={post.id} className="p-4">
              <div className="flex items-start justify-between gap-2">
                <p className="text-white text-sm flex-1 leading-relaxed">{post.content}</p>
                <button onClick={() => del(post.id)} className="p-1.5 rounded text-muted-foreground hover:text-red-400 flex-shrink-0">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              {post.link && <a href={post.link} target="_blank" rel="noreferrer" className="text-primary text-xs mt-2 block truncate">{post.link}</a>}
              <div className="text-muted-foreground text-[10px] mt-2">{new Date(post.createdAt).toLocaleString()}</div>
            </Card>
          ))}
          {posts.length === 0 && <div className="text-center text-muted-foreground py-8 text-sm">No posts yet</div>}
        </div>
      )}
    </div>
  );
}

// ── SETTINGS TAB ──
function SettingsTab() {
  const [links, setLinks] = useState({
    whatsapp: "https://chat.whatsapp.com/JGkaBobItjVKhlpbQAvaX8?mode=gi_t",
    tiktok: "https://www.tiktok.com/@solosesportz",
  });
  const [saved, setSaved] = useState(false);

  return (
    <div className="space-y-4">
      <h2 className="font-heading font-bold text-white text-lg uppercase tracking-wider">Settings</h2>

      <Card className="p-4 space-y-4">
        <h3 className="font-bold text-white text-sm uppercase tracking-wider">Community Links</h3>
        <div>
          <label className="text-[10px] text-muted-foreground uppercase block mb-1">WhatsApp Community Link</label>
          <Input value={links.whatsapp} onChange={e => setLinks(l => ({ ...l, whatsapp: e.target.value }))}
            className="bg-black/60 border-white/20 text-white h-10 text-xs" />
        </div>
        <div>
          <label className="text-[10px] text-muted-foreground uppercase block mb-1">TikTok Link</label>
          <Input value={links.tiktok} onChange={e => setLinks(l => ({ ...l, tiktok: e.target.value }))}
            className="bg-black/60 border-white/20 text-white h-10 text-xs" />
        </div>
        <Button onClick={() => setSaved(true)} className="w-full bg-primary border-primary/50 font-bold uppercase h-10">
          {saved ? <><CheckCircle className="w-4 h-4 mr-2" />Saved!</> : "Save Links"}
        </Button>
      </Card>

      <Card className="p-4 space-y-3">
        <h3 className="font-bold text-white text-sm uppercase tracking-wider">Clan Info</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center p-3 bg-black/40 rounded-lg">
            <div className="font-heading font-bold text-primary text-lg">S²十</div>
            <div className="text-[10px] text-muted-foreground uppercase">Clan Tag</div>
          </div>
          <div className="text-center p-3 bg-black/40 rounded-lg">
            <div className="font-heading font-bold text-white text-sm">CoD:M</div>
            <div className="text-[10px] text-muted-foreground uppercase">Game</div>
          </div>
        </div>
        <div className="text-[10px] text-muted-foreground leading-relaxed">
          To change the clan password, edit <code className="text-primary">PANEL_PASSWORD</code> in <code className="text-primary">artifacts/api-server/src/routes/panel.ts</code>
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="font-bold text-white text-sm uppercase tracking-wider mb-3">Quick Links</h3>
        <div className="space-y-2">
          <a href={links.whatsapp} target="_blank" rel="noreferrer"
            className="flex items-center gap-2 text-green-400 text-sm py-2 border-b border-white/5">
            💬 Join WhatsApp Community
          </a>
          <a href={links.tiktok} target="_blank" rel="noreferrer"
            className="flex items-center gap-2 text-white text-sm py-2">
            🎵 Visit TikTok @solosesportz
          </a>
        </div>
      </Card>
    </div>
  );
}

// ── CONTENT TAB (hub for Announcements/Events/Scrims) ──
function ContentTab() {
  const [sub, setSub] = useState<"announcements" | "events" | "scrims">("announcements");
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-1 bg-black/40 p-1 rounded-xl">
        {([["announcements", "📢", "Announce"], ["events", "📅", "Events"], ["scrims", "⚔️", "Scrims"]] as const).map(([key, icon, label]) => (
          <button key={key} onClick={() => setSub(key)}
            className={`flex flex-col items-center py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${sub === key ? "bg-primary text-white" : "text-muted-foreground hover:text-white"}`}>
            <span>{icon}</span><span>{label}</span>
          </button>
        ))}
      </div>
      {sub === "announcements" && <AnnouncementsTab />}
      {sub === "events" && <EventsTab />}
      {sub === "scrims" && <ScrimsTab />}
    </div>
  );
}

// ── MAIN ADMIN PANEL ──
type Tab = "dashboard" | "members" | "content" | "feed" | "settings";

export function AdminPanel({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [stats, setStats] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [membersLoading, setMembersLoading] = useState(true);

  const loadStats = useCallback(async () => {
    try { setStats(await pf("/panel/stats")); } catch {}
  }, []);

  const loadMembers = useCallback(async () => {
    setMembersLoading(true);
    try { setMembers(await pf("/panel/members")); } finally { setMembersLoading(false); }
  }, []);

  useEffect(() => {
    loadStats();
    loadMembers();
  }, [loadStats, loadMembers]);

  const saveMember = async (id: number, data: any) => {
    const updated = await pf(`/panel/members/${id}`, { method: "PATCH", body: JSON.stringify(data) });
    setMembers(m => m.map(u => u.id === id ? updated : u));
    loadStats();
  };

  const deleteMember = async (id: number) => {
    if (!confirm("Permanently delete this member?")) return;
    await pf(`/panel/members/${id}`, { method: "DELETE" });
    setMembers(m => m.filter(u => u.id !== id));
    loadStats();
  };

  const navTabs: { key: Tab; icon: React.ReactNode; label: string }[] = [
    { key: "dashboard", icon: <BarChart3 className="w-5 h-5" />, label: "Stats" },
    { key: "members", icon: <Users className="w-5 h-5" />, label: "Members" },
    { key: "content", icon: <Megaphone className="w-5 h-5" />, label: "Content" },
    { key: "feed", icon: <MessageSquare className="w-5 h-5" />, label: "Feed" },
    { key: "settings", icon: <Settings className="w-5 h-5" />, label: "Settings" },
  ];

  return (
    <div className="fixed inset-0 z-[100] bg-[#060606] flex flex-col max-w-[428px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-12 border-b border-white/10 bg-black/40 flex-shrink-0">
        <div className="flex items-center gap-2">
          <img src={logoUrl} alt="SOLOS+" className="h-6 object-contain mix-blend-screen" />
          <span className="font-heading font-bold text-primary text-sm uppercase tracking-widest">Clan Panel</span>
        </div>
        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-white rounded-lg hover:bg-white/10 transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-24">
        {tab === "dashboard" && <DashboardTab stats={stats} onRefresh={() => { loadStats(); loadMembers(); }} />}
        {tab === "members" && <MembersTab members={members} loading={membersLoading} onRefresh={loadMembers} onSave={saveMember} onDelete={deleteMember} />}
        {tab === "content" && <ContentTab />}
        {tab === "feed" && <FeedTab />}
        {tab === "settings" && <SettingsTab />}
      </div>

      {/* Bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 max-w-[428px] mx-auto h-16 bg-[#0a0a0a] border-t border-white/10 flex items-center justify-around px-2 z-[101]">
        {navTabs.map(({ key, icon, label }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex flex-col items-center justify-center w-16 h-full space-y-0.5 transition-colors ${tab === key ? "text-primary" : "text-muted-foreground hover:text-white"}`}>
            {icon}
            <span className="text-[9px] uppercase font-bold tracking-wider">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── HIDDEN TRIGGER (for landing page) ──
export function HiddenAdminTrigger() {
  const [tapCount, setTapCount] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showPanel, setShowPanel] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleTap = () => {
    const next = tapCount + 1;
    setTapCount(next);
    if (timer.current) clearTimeout(timer.current);
    if (next >= 7) {
      setTapCount(0);
      setShowPassword(true);
    } else {
      timer.current = setTimeout(() => setTapCount(0), 2000);
    }
  };

  const submit = async () => {
    setChecking(true);
    try {
      await pf("/panel/auth", { method: "POST", body: JSON.stringify({ password }) });
      setShowPassword(false);
      setShowPanel(true);
      setPassword(""); setError("");
    } catch {
      setError("Wrong password");
    } finally { setChecking(false); }
  };

  return (
    <>
      <button onClick={handleTap} className="select-none text-white/10 text-[10px] tracking-widest cursor-default" aria-hidden>
        © SOLOS+ ESPORTZ 2026
      </button>

      {showPassword && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-sm px-6">
          <div className="bg-[#0d0d0d] border border-white/10 rounded-2xl p-6 w-full max-w-xs space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="font-heading font-bold text-white text-xl uppercase tracking-wider">Panel Access</h2>
              <button onClick={() => { setShowPassword(false); setPassword(""); setError(""); }}>
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            <Input type="password" placeholder="Enter panel password" value={password}
              onChange={e => { setPassword(e.target.value); setError(""); }}
              onKeyDown={e => e.key === "Enter" && submit()}
              className="bg-black border-white/20 text-white h-12" autoFocus />
            {error && <p className="text-red-400 text-xs">{error}</p>}
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => { setShowPassword(false); setPassword(""); setError(""); }}
                className="flex-1 border-white/20 text-white h-11">
                <X className="w-4 h-4 mr-1" />Back
              </Button>
              <Button onClick={submit} disabled={checking}
                className="flex-1 bg-primary border-primary/50 font-bold uppercase h-11">
                {checking ? <Loader2 className="w-4 h-4 animate-spin" /> : "Enter"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {showPanel && <AdminPanel onClose={() => setShowPanel(false)} />}
    </>
  );
}
