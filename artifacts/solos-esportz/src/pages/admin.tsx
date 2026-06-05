import React, { useState } from "react";
import {
  useListUsers,
  useApproveMember,
  useRejectMember,
  useSuspendMember,
  useRestoreMember,
  useDeleteMember,
  useUpdateMemberRole,
  useCreateAnnouncement,
  useDeleteAnnouncement,
  usePinAnnouncement,
  useListAnnouncements,
  useCreateScrim,
  useDeleteScrim,
  usePostScrimResult,
  useListScrims,
} from "@workspace/api-client-react";
import { getListUsersQueryKey, getListAnnouncementsQueryKey, getListScrimsQueryKey } from "@workspace/api-client-react";
import { AppLayout } from "@/components/layout";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  Users, Bell, Swords, CheckCircle2, XCircle, Shield, RotateCcw, Trash2,
  ChevronDown, Plus, X, Pin, ChevronLeft
} from "lucide-react";

const MANAGEMENT_ROLES = ["CLAN_MASTER", "CO_LEADER", "MANAGEMENT"];
const ROLE_OPTIONS = ["CLAN_MASTER", "CO_LEADER", "MANAGEMENT", "TIER1", "TIER2", "TIER3", "NEW_MEMBER"];

type Tab = "members" | "announcements" | "scrims";

function statusColor(status: string) {
  const map: Record<string, string> = {
    PENDING: "text-yellow-400",
    ACTIVE: "text-green-400",
    REJECTED: "text-destructive",
    SUSPENDED: "text-orange-400",
  };
  return map[status] ?? "text-muted-foreground";
}

function tierColor(role?: string) {
  if (role === "CLAN_MASTER" || role === "CO_LEADER") return "text-yellow-400";
  if (role === "TIER1") return "text-yellow-300";
  if (role === "TIER2") return "text-blue-400";
  if (role === "TIER3") return "text-green-400";
  return "text-muted-foreground";
}

export default function AdminPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [, navigate] = useLocation();
  const [tab, setTab] = useState<Tab>("members");
  const [memberFilter, setMemberFilter] = useState<string>("PENDING");
  const [expandedUser, setExpandedUser] = useState<number | null>(null);

  // Members
  const { data: users, isLoading: usersLoading } = useListUsers();
  const approveMember = useApproveMember({ mutation: { onSuccess: () => { qc.invalidateQueries({ queryKey: getListUsersQueryKey() }); toast({ title: "Member approved" }); }, onError: (e: any) => toast({ variant: "destructive", title: e?.message }) } });
  const rejectMember = useRejectMember({ mutation: { onSuccess: () => { qc.invalidateQueries({ queryKey: getListUsersQueryKey() }); toast({ title: "Member rejected" }); }, onError: (e: any) => toast({ variant: "destructive", title: e?.message }) } });
  const suspendMember = useSuspendMember({ mutation: { onSuccess: () => { qc.invalidateQueries({ queryKey: getListUsersQueryKey() }); toast({ title: "Member suspended" }); }, onError: (e: any) => toast({ variant: "destructive", title: e?.message }) } });
  const restoreMember = useRestoreMember({ mutation: { onSuccess: () => { qc.invalidateQueries({ queryKey: getListUsersQueryKey() }); toast({ title: "Member restored" }); }, onError: (e: any) => toast({ variant: "destructive", title: e?.message }) } });
  const deleteMember = useDeleteMember({ mutation: { onSuccess: () => { qc.invalidateQueries({ queryKey: getListUsersQueryKey() }); toast({ title: "Member deleted" }); }, onError: (e: any) => toast({ variant: "destructive", title: e?.message }) } });
  const updateRole = useUpdateMemberRole({ mutation: { onSuccess: () => { qc.invalidateQueries({ queryKey: getListUsersQueryKey() }); toast({ title: "Role updated" }); }, onError: (e: any) => toast({ variant: "destructive", title: e?.message }) } });

  // Announcements
  const { data: announcements, isLoading: annLoading } = useListAnnouncements();
  const [annForm, setAnnForm] = useState({ title: "", content: "", imageUrl: "", link: "" });
  const [showAnnForm, setShowAnnForm] = useState(false);
  const createAnn = useCreateAnnouncement({ mutation: { onSuccess: () => { qc.invalidateQueries({ queryKey: getListAnnouncementsQueryKey() }); setAnnForm({ title: "", content: "", imageUrl: "", link: "" }); setShowAnnForm(false); toast({ title: "Announcement created" }); } } });
  const deleteAnn = useDeleteAnnouncement({ mutation: { onSuccess: () => { qc.invalidateQueries({ queryKey: getListAnnouncementsQueryKey() }); toast({ title: "Announcement deleted" }); } } });
  const pinAnn = usePinAnnouncement({ mutation: { onSuccess: () => { qc.invalidateQueries({ queryKey: getListAnnouncementsQueryKey() }); } } });

  // Scrims
  const { data: scrims, isLoading: scrimsLoading } = useListScrims();
  const [scrimForm, setScrimForm] = useState({ title: "", description: "", scheduledAt: "", imageUrl: "", link: "" });
  const [showScrimForm, setShowScrimForm] = useState(false);
  const [resultForms, setResultForms] = useState<Record<number, string>>({});
  const createScrim = useCreateScrim({ mutation: { onSuccess: () => { qc.invalidateQueries({ queryKey: getListScrimsQueryKey() }); setScrimForm({ title: "", description: "", scheduledAt: "", imageUrl: "", link: "" }); setShowScrimForm(false); toast({ title: "Scrim created" }); } } });
  const deleteScrim = useDeleteScrim({ mutation: { onSuccess: () => { qc.invalidateQueries({ queryKey: getListScrimsQueryKey() }); toast({ title: "Scrim deleted" }); } } });
  const postResult = usePostScrimResult({ mutation: { onSuccess: () => { qc.invalidateQueries({ queryKey: getListScrimsQueryKey() }); toast({ title: "Result saved" }); } } });

  if (!user || !MANAGEMENT_ROLES.includes(user.role)) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-full p-8 text-center">
          <Shield className="w-16 h-16 text-destructive mb-4" />
          <h1 className="font-heading font-bold text-2xl text-white">Access Denied</h1>
          <p className="text-muted-foreground mt-2">Management access required</p>
        </div>
      </AppLayout>
    );
  }

  const filteredUsers = users?.filter(u => memberFilter === "ALL" ? true : u.status === memberFilter) ?? [];
  const pendingCount = users?.filter(u => u.status === "PENDING").length ?? 0;

  const FILTER_OPTIONS = ["ALL", "PENDING", "ACTIVE", "SUSPENDED", "REJECTED"];

  return (
    <AppLayout>
      <div className="px-4 pt-6 pb-4 space-y-5">
        <div className="flex items-center space-x-3">
          <button onClick={() => navigate("/profile")} className="text-muted-foreground hover:text-white">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-heading font-bold text-3xl text-white uppercase tracking-wider">Management</h1>
            <p className="text-muted-foreground text-sm">Clan administration panel</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-card border border-border rounded-lg p-1">
          {([
            { key: "members", label: "Members", icon: Users },
            { key: "announcements", label: "Posts", icon: Bell },
            { key: "scrims", label: "Scrims", icon: Swords },
          ] as { key: Tab; label: string; icon: any }[]).map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex-1 flex items-center justify-center space-x-1.5 py-2 rounded text-xs font-bold uppercase tracking-wider transition-colors ${tab === t.key ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-white"}`}>
              <t.icon className="w-3.5 h-3.5" />
              <span>{t.label}</span>
              {t.key === "members" && pendingCount > 0 && (
                <span className="bg-primary text-primary-foreground rounded-full w-4 h-4 text-[9px] flex items-center justify-center">{pendingCount}</span>
              )}
            </button>
          ))}
        </div>

        {/* MEMBERS TAB */}
        {tab === "members" && (
          <div className="space-y-4">
            <div className="flex space-x-2 overflow-x-auto pb-1">
              {FILTER_OPTIONS.map(f => (
                <button key={f} onClick={() => setMemberFilter(f)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider whitespace-nowrap border transition-colors ${memberFilter === f ? "bg-primary/20 border-primary/50 text-primary" : "bg-card border-border text-muted-foreground"}`}>
                  {f} {f !== "ALL" && `(${users?.filter(u => u.status === f).length ?? 0})`}
                </button>
              ))}
            </div>

            {usersLoading ? (
              <div className="space-y-2">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
            ) : filteredUsers.length === 0 ? (
              <div className="bg-card border border-border rounded-xl p-6 text-center text-muted-foreground text-sm">No members</div>
            ) : (
              <div className="space-y-2">
                {filteredUsers.map(member => (
                  <div key={member.id} className="bg-card border border-border rounded-xl overflow-hidden">
                    <button
                      className="w-full flex items-center space-x-3 p-3 text-left"
                      onClick={() => setExpandedUser(expandedUser === member.id ? null : member.id)}
                    >
                      <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {member.avatarUrl ? (
                          <img src={member.avatarUrl} alt={member.username} className="w-full h-full object-cover" />
                        ) : (
                          <span className="font-heading font-bold text-sm text-primary">{member.username[0]?.toUpperCase()}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-heading font-bold text-white text-sm truncate">S²十{member.username}</div>
                        <div className={`text-xs font-bold uppercase tracking-wider ${tierColor(member.role)}`}>{member.role}</div>
                      </div>
                      <div className={`text-xs font-bold uppercase ${statusColor(member.status)}`}>{member.status}</div>
                      <ChevronDown className={`w-4 h-4 text-muted-foreground flex-shrink-0 transition-transform ${expandedUser === member.id ? "rotate-180" : ""}`} />
                    </button>

                    {expandedUser === member.id && (
                      <div className="border-t border-border p-3 space-y-3 bg-background/30">
                        {/* Role selector */}
                        <div className="flex items-center space-x-2">
                          <Label className="text-xs text-muted-foreground uppercase tracking-wider w-12">Role</Label>
                          <select
                            value={member.role}
                            onChange={e => updateRole.mutate({ id: member.id, data: { role: e.target.value as any } })}
                            className="flex-1 bg-card border border-border rounded-lg px-2 py-1.5 text-white text-xs"
                          >
                            {ROLE_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                          </select>
                        </div>

                        {/* Action buttons */}
                        <div className="grid grid-cols-2 gap-2">
                          {member.status === "PENDING" && (
                            <>
                              <Button size="sm" className="bg-green-500/20 border-green-500/30 text-green-400 hover:bg-green-500/30 text-xs font-bold uppercase" variant="outline"
                                onClick={() => approveMember.mutate({ id: member.id })}>
                                <CheckCircle2 className="w-3 h-3 mr-1" />Approve
                              </Button>
                              <Button size="sm" className="border-destructive/30 text-destructive hover:bg-destructive/10 text-xs font-bold uppercase" variant="outline"
                                onClick={() => rejectMember.mutate({ id: member.id })}>
                                <XCircle className="w-3 h-3 mr-1" />Reject
                              </Button>
                            </>
                          )}
                          {member.status === "ACTIVE" && member.id !== user.id && (
                            <Button size="sm" className="border-orange-500/30 text-orange-400 hover:bg-orange-500/10 text-xs font-bold uppercase col-span-1" variant="outline"
                              onClick={() => suspendMember.mutate({ id: member.id })}>
                              <Shield className="w-3 h-3 mr-1" />Suspend
                            </Button>
                          )}
                          {(member.status === "SUSPENDED" || member.status === "REJECTED") && (
                            <Button size="sm" className="border-green-500/30 text-green-400 hover:bg-green-500/10 text-xs font-bold uppercase col-span-1" variant="outline"
                              onClick={() => restoreMember.mutate({ id: member.id })}>
                              <RotateCcw className="w-3 h-3 mr-1" />Restore
                            </Button>
                          )}
                          {member.id !== user.id && (
                            <Button size="sm" className="border-destructive/30 text-destructive hover:bg-destructive/10 text-xs font-bold uppercase col-span-1" variant="outline"
                              onClick={() => { if (confirm(`Delete ${member.username}?`)) deleteMember.mutate({ id: member.id }); }}>
                              <Trash2 className="w-3 h-3 mr-1" />Delete
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ANNOUNCEMENTS TAB */}
        {tab === "announcements" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-heading font-bold text-white uppercase tracking-wider text-sm">Announcements</h2>
              <Button size="sm" onClick={() => setShowAnnForm(!showAnnForm)}
                className={showAnnForm ? "bg-muted border border-border text-white" : "bg-primary border-primary-border text-primary-foreground"}>
                {showAnnForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              </Button>
            </div>

            {showAnnForm && (
              <form onSubmit={e => { e.preventDefault(); createAnn.mutate({ data: { title: annForm.title, content: annForm.content, imageUrl: annForm.imageUrl || undefined, link: annForm.link || undefined } }); }}
                className="bg-card border border-border rounded-xl p-4 space-y-3">
                <Input placeholder="Title" value={annForm.title} onChange={e => setAnnForm(f => ({ ...f, title: e.target.value }))} className="bg-background border-border h-10 text-sm" required />
                <Textarea placeholder="Content" value={annForm.content} onChange={e => setAnnForm(f => ({ ...f, content: e.target.value }))} className="bg-background border-border resize-none min-h-[80px]" required />
                <Input placeholder="Image URL (optional)" value={annForm.imageUrl} onChange={e => setAnnForm(f => ({ ...f, imageUrl: e.target.value }))} className="bg-background border-border h-10 text-sm" />
                <Input placeholder="Link (optional)" value={annForm.link} onChange={e => setAnnForm(f => ({ ...f, link: e.target.value }))} className="bg-background border-border h-10 text-sm" />
                <div className="flex space-x-2">
                  <Button type="button" variant="outline" size="sm" className="flex-1" onClick={() => setShowAnnForm(false)}>Cancel</Button>
                  <Button type="submit" size="sm" className="flex-1 bg-primary border-primary-border" disabled={createAnn.isPending}>{createAnn.isPending ? "Creating..." : "Create"}</Button>
                </div>
              </form>
            )}

            {annLoading ? (
              <div className="space-y-2">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
            ) : !announcements?.length ? (
              <div className="bg-card border border-border rounded-xl p-6 text-center text-muted-foreground text-sm">No announcements</div>
            ) : (
              <div className="space-y-2">
                {announcements.map(ann => (
                  <div key={ann.id} className="bg-card border border-border rounded-xl p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          {ann.isPinned && <Pin className="w-3 h-3 text-primary flex-shrink-0" />}
                          <h3 className="font-heading font-bold text-white text-sm truncate">{ann.title}</h3>
                        </div>
                        <p className="text-muted-foreground text-xs line-clamp-2">{ann.content}</p>
                      </div>
                      <div className="flex space-x-1 ml-2 flex-shrink-0">
                        <button onClick={() => pinAnn.mutate({ id: ann.id, data: { isPinned: !ann.isPinned } })}
                          className={`p-1.5 rounded-lg border transition-colors ${ann.isPinned ? "border-primary/50 text-primary bg-primary/10" : "border-border text-muted-foreground hover:text-white"}`}>
                          <Pin className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => deleteAnn.mutate({ id: ann.id })}
                          className="p-1.5 rounded-lg border border-destructive/30 text-destructive hover:bg-destructive/10 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SCRIMS TAB */}
        {tab === "scrims" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-heading font-bold text-white uppercase tracking-wider text-sm">Scrims</h2>
              <Button size="sm" onClick={() => setShowScrimForm(!showScrimForm)}
                className={showScrimForm ? "bg-muted border border-border text-white" : "bg-primary border-primary-border text-primary-foreground"}>
                {showScrimForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              </Button>
            </div>

            {showScrimForm && (
              <form onSubmit={e => {
                e.preventDefault();
                createScrim.mutate({ data: {
                  title: scrimForm.title,
                  description: scrimForm.description || undefined,
                  scheduledAt: scrimForm.scheduledAt || undefined,
                  imageUrl: scrimForm.imageUrl || undefined,
                  link: scrimForm.link || undefined,
                }});
              }} className="bg-card border border-border rounded-xl p-4 space-y-3">
                <Input placeholder="Scrim title" value={scrimForm.title} onChange={e => setScrimForm(f => ({ ...f, title: e.target.value }))} className="bg-background border-border h-10 text-sm" required />
                <Textarea placeholder="Description (optional)" value={scrimForm.description} onChange={e => setScrimForm(f => ({ ...f, description: e.target.value }))} className="bg-background border-border resize-none min-h-[60px]" />
                <Input type="datetime-local" value={scrimForm.scheduledAt} onChange={e => setScrimForm(f => ({ ...f, scheduledAt: e.target.value }))} className="bg-background border-border h-10 text-sm" />
                <Input placeholder="Image URL (optional)" value={scrimForm.imageUrl} onChange={e => setScrimForm(f => ({ ...f, imageUrl: e.target.value }))} className="bg-background border-border h-10 text-sm" />
                <Input placeholder="Link (optional)" value={scrimForm.link} onChange={e => setScrimForm(f => ({ ...f, link: e.target.value }))} className="bg-background border-border h-10 text-sm" />
                <div className="flex space-x-2">
                  <Button type="button" variant="outline" size="sm" className="flex-1" onClick={() => setShowScrimForm(false)}>Cancel</Button>
                  <Button type="submit" size="sm" className="flex-1 bg-primary border-primary-border" disabled={createScrim.isPending}>{createScrim.isPending ? "Creating..." : "Create"}</Button>
                </div>
              </form>
            )}

            {scrimsLoading ? (
              <div className="space-y-2">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
            ) : !scrims?.length ? (
              <div className="bg-card border border-border rounded-xl p-6 text-center text-muted-foreground text-sm">No scrims yet</div>
            ) : (
              <div className="space-y-3">
                {scrims.map(scrim => (
                  <div key={scrim.id} className="bg-card border border-border rounded-xl p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${
                          scrim.status === "UPCOMING" ? "text-blue-400" :
                          scrim.status === "ONGOING" ? "text-green-400" :
                          scrim.status === "COMPLETED" ? "text-muted-foreground" : "text-destructive"
                        }`}>{scrim.status}</div>
                        <h3 className="font-heading font-bold text-white text-sm truncate">{scrim.title}</h3>
                        <div className="text-xs text-muted-foreground">{scrim.participants?.length ?? 0} participants</div>
                      </div>
                      <button onClick={() => deleteScrim.mutate({ id: scrim.id })}
                        className="p-1.5 rounded-lg border border-destructive/30 text-destructive hover:bg-destructive/10 ml-2 flex-shrink-0">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Post result */}
                    {scrim.status !== "CANCELLED" && (
                      <div className="flex space-x-2">
                        <Input
                          placeholder="Post result (e.g. Win 4-0 vs XYZ)"
                          value={resultForms[scrim.id] ?? scrim.result ?? ""}
                          onChange={e => setResultForms(f => ({ ...f, [scrim.id]: e.target.value }))}
                          className="bg-background border-border h-8 text-xs flex-1"
                        />
                        <Button size="sm" className="bg-primary border-primary-border text-xs h-8 px-3 font-bold uppercase"
                          onClick={() => postResult.mutate({ id: scrim.id, data: { result: resultForms[scrim.id] ?? "", status: "COMPLETED" } })}
                          disabled={postResult.isPending || !resultForms[scrim.id]}>
                          Save
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
