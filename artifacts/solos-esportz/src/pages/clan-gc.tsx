import React, { useState, useEffect, useRef, useCallback } from "react";
import { AppLayout } from "@/components/layout";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import {
  Mic, MicOff, Send, Image as ImageIcon, X, Loader2, Play, Pause,
  Hash, Search, Pin, Reply, Trash2, Edit3, Check, Crown, Shield,
  Star, Award, Medal, ChevronLeft, ChevronDown, ChevronUp,
  Smile, AtSign, User, Trophy, Swords, Crosshair, Calendar, Menu
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

/* ─────────────── Types ─────────────── */

type MessageType = "TEXT" | "IMAGE" | "VOICE";

type Channel = {
  id: number;
  name: string;
  slug: string;
  allowedRoles: string;
};

type Reaction = {
  emoji: string;
  userIds: number[];
  count: number;
};

type AuthorStats = {
  kills: number;
  wins: number;
  clanPoints: number;
  joinedAt: string | null;
};

type GcMessage = {
  id: number;
  content: string;
  type: MessageType;
  channel: string;
  replyToId: number | null;
  editedAt: string | null;
  isPinned: boolean;
  authorId: number;
  authorName: string;
  authorDisplayName: string | null;
  authorAvatar: string | null;
  authorRole: string;
  authorStats: AuthorStats;
  createdAt: string;
  reactions: Reaction[];
};

type MentionUser = {
  id: number;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  role: string;
};

/* ─────────────── Constants ─────────────── */

const CHANNELS: Channel[] = [
  { id: 1, name: "General", slug: "GENERAL", allowedRoles: "ALL" },
  { id: 2, name: "Tier 1", slug: "TIER1", allowedRoles: "TIER1,MANAGEMENT,CLAN_MASTER" },
  { id: 3, name: "Tier 2", slug: "TIER2", allowedRoles: "TIER2,MANAGEMENT,CLAN_MASTER" },
  { id: 4, name: "Tier 3", slug: "TIER3", allowedRoles: "TIER3,MANAGEMENT,CLAN_MASTER" },
  { id: 5, name: "Management", slug: "MANAGEMENT", allowedRoles: "MANAGEMENT,CLAN_MASTER" },
];

const EMOJI_REACTIONS = ["👍", "❤️", "😂", "🔥", "😭", "👀"];

const ROLE_META: Record<string, { label: string; className: string; emoji?: string; icon?: any }> = {
  CLAN_MASTER: { label: "Clan Master", emoji: "👑", className: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30", icon: Crown },
  ADMIN: { label: "Admin", emoji: "🛡️", className: "text-blue-400 bg-blue-400/10 border-blue-400/30", icon: Shield },
  MANAGEMENT: { label: "Management", emoji: "🛡️", className: "text-blue-400 bg-blue-400/10 border-blue-400/30", icon: Shield },
  CO_LEADER: { label: "Co-Leader", emoji: "⭐", className: "text-yellow-300 bg-yellow-300/10 border-yellow-300/30", icon: Star },
  TIER1: { label: "Tier 1", className: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30", icon: Award },
  TIER2: { label: "Tier 2", className: "text-blue-400 bg-blue-400/10 border-blue-400/30", icon: Medal },
  TIER3: { label: "Tier 3", className: "text-green-400 bg-green-400/10 border-green-400/30", icon: Medal },
  NEW_MEMBER: { label: "Recruit", className: "text-muted-foreground bg-muted/10 border-border", icon: User },
};

function canAccessChannel(role: string, channelSlug: string): boolean {
  const ch = CHANNELS.find(c => c.slug === channelSlug);
  if (!ch) return false;
  const roles = ch.allowedRoles.split(",");
  if (roles.includes("ALL")) return true;
  return roles.includes(role);
}

function isManagement(role: string) {
  return role === "CLAN_MASTER" || role === "ADMIN" || role === "MANAGEMENT";
}

/* ─────────────── Helper Components ─────────────── */

function RoleBadge({ role }: { role: string }) {
  const meta = ROLE_META[role] ?? ROLE_META.NEW_MEMBER;
  const Icon = meta.icon || User;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${meta.className}`}>
      {meta.emoji ? <span>{meta.emoji}</span> : <Icon className="w-3 h-3" />}
      {meta.label}
    </span>
  );
}

function AvatarFallback({ name, className = "" }: { name: string; className?: string }) {
  return (
    <div className={`w-full h-full flex items-center justify-center text-xs font-bold text-white bg-primary/30 ${className}`}>
      {name?.[0]?.toUpperCase()}
    </div>
  );
}

function SafeImg({ src, alt, className = "" }: { src?: string | null; alt: string; className?: string }) {
  const [err, setErr] = useState(false);
  if (!src || err) {
    return (
      <div className={`w-full h-full flex items-center justify-center text-xs font-bold text-white bg-primary/30 ${className}`}>
        {alt?.[0]?.toUpperCase()}
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      className={`w-full h-full object-cover ${className}`}
      onError={() => setErr(true)}
      loading="lazy"
      draggable={false}
    />
  );
}

function AudioPlayer({ src }: { src: string }) {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    const audio = new Audio(src);
    audioRef.current = audio;
    audio.onended = () => setPlaying(false);
    audio.onloadedmetadata = () => setDuration(audio.duration);
    audio.ontimeupdate = () => setCurrentTime(audio.currentTime);
    return () => { audio.pause(); audio.src = ""; };
  }, [src]);

  const toggle = () => {
    if (!audioRef.current) return;
    if (playing) { audioRef.current.pause(); setPlaying(false); }
    else { audioRef.current.play().catch(() => setPlaying(false)); setPlaying(true); }
  };

  const formatTime = (s: number) => {
    if (!isFinite(s)) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <button onClick={toggle} className="flex items-center gap-2 bg-[#1a1a2e] border border-white/10 rounded-full px-3 py-1.5 text-xs text-white">
      {playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
      <span>Voice note</span>
      <span className="text-white/40 text-[10px]">{formatTime(playing ? currentTime : duration)}</span>
    </button>
  );
}

function MentionedText({ text, users }: { text: string; users: MentionUser[] }) {
  const parts = text.split(/(@\w+)/g);
  return (
    <p className="leading-relaxed break-words">
      {parts.map((part, i) => {
        if (part.startsWith("@")) {
          const username = part.slice(1);
          const user = users.find(u => u.username === username);
          return (
            <span key={i} className="text-primary font-bold hover:underline cursor-pointer">
              {part}
            </span>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </p>
  );
}

function ProfilePreview({ user, open, onClose }: { user: GcMessage["authorStats"] & { name: string; displayName: string | null; avatar: string | null; role: string }; open: boolean; onClose: () => void }) {
  const meta = ROLE_META[user.role] ?? ROLE_META.NEW_MEMBER;
  const Icon = meta.icon || User;
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#0a0a0a] border-white/10 text-white max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-center text-lg font-bold uppercase tracking-wider">{user.displayName || user.name}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-3">
          <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-white/10">
            <SafeImg src={user.avatar} alt={user.displayName || user.name} />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-white">{user.name}</span>
            <span className={`inline-flex items-center gap-0.5 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${meta.className}`}>
              {meta.emoji ? <span>{meta.emoji}</span> : <Icon className="w-3 h-3" />}
              {meta.label}
            </span>
          </div>
          <div className="w-full grid grid-cols-3 gap-2 mt-2">
            <div className="bg-[#1a1a2e] rounded-lg p-3 text-center border border-white/5">
              <Swords className="w-4 h-4 text-destructive mx-auto mb-1" />
              <div className="text-lg font-bold text-white">{user.kills}</div>
              <div className="text-[10px] text-muted-foreground uppercase">Kills</div>
            </div>
            <div className="bg-[#1a1a2e] rounded-lg p-3 text-center border border-white/5">
              <Trophy className="w-4 h-4 text-yellow-400 mx-auto mb-1" />
              <div className="text-lg font-bold text-white">{user.wins}</div>
              <div className="text-[10px] text-muted-foreground uppercase">Wins</div>
            </div>
            <div className="bg-[#1a1a2e] rounded-lg p-3 text-center border border-white/5">
              <Crosshair className="w-4 h-4 text-primary mx-auto mb-1" />
              <div className="text-lg font-bold text-white">{user.clanPoints}</div>
              <div className="text-[10px] text-muted-foreground uppercase">Points</div>
            </div>
          </div>
          <div className="w-full flex items-center justify-center gap-2 text-xs text-muted-foreground mt-1">
            <Calendar className="w-3 h-3" />
            {user.joinedAt ? new Date(user.joinedAt).toLocaleDateString() : "Unknown"}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

async function uploadFile(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch("/api/upload", { method: "POST", body: form, credentials: "include" });
  if (!res.ok) throw new Error("Upload failed");
  const data = await res.json();
  return data.url as string;
}

/* ─────────────── Main Page ─────────────── */

export default function ClanGcPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [messages, setMessages] = useState<GcMessage[]>([]);
  const [pinnedMessages, setPinnedMessages] = useState<GcMessage[]>([]);
  const [channels, setChannels] = useState<Channel[]>(CHANNELS);
  const [activeChannel, setActiveChannel] = useState("GENERAL");
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [recording, setRecording] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [voiceBlob, setVoiceBlob] = useState<Blob | null>(null);
  const [voicePreview, setVoicePreview] = useState(false);
  const [replyingTo, setReplyingTo] = useState<GcMessage | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<GcMessage[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [showPinned, setShowPinned] = useState(false);
  const [mentionUsers, setMentionUsers] = useState<MentionUser[]>([]);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionIndex, setMentionIndex] = useState(0);
  const [profileUser, setProfileUser] = useState<any>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; msg: GcMessage | null }>({ x: 0, y: 0, msg: null });
  const [showChannelSheet, setShowChannelSheet] = useState(false);
  const [usersListOpen, setUsersListOpen] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const latestIdRef = useRef<number>(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const isMe = (msg: GcMessage) => msg.authorId === user?.id;
  const userRole = user?.role || "NEW_MEMBER";

  /* ── Fetchers ── */

  const fetchMessages = useCallback(async (initial = false) => {
    try {
      const res = await fetch(`/api/clan-gc?channel=${activeChannel}`, { credentials: "include" });
      if (!res.ok) return;
      const data: GcMessage[] = await res.json();
      setMessages(prev => {
        const merged = [...prev, ...data];
        const byId = new Map(merged.map(m => [m.id, m]));
        return Array.from(byId.values()).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      });
      if (data.length > 0) {
        const maxId = Math.max(...data.map(m => m.id));
        if (initial || maxId > latestIdRef.current) {
          latestIdRef.current = maxId;
          if (!initial) {
            setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
          }
        }
      }
      if (initial) {
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "auto" }), 100);
      }
    } catch {}
  }, [activeChannel]);

  const fetchPinned = useCallback(async () => {
    try {
      const res = await fetch(`/api/clan-gc/pinned?channel=${activeChannel}`, { credentials: "include" });
      if (!res.ok) return;
      const data: GcMessage[] = await res.json();
      setPinnedMessages(data);
    } catch {}
  }, [activeChannel]);

  const fetchMentionUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/clan-gc/users", { credentials: "include" });
      if (!res.ok) return;
      const data: MentionUser[] = await res.json();
      setMentionUsers(data);
    } catch {}
  }, []);

  const fetchChannels = useCallback(async () => {
    try {
      const res = await fetch("/api/clan-gc/channels", { credentials: "include" });
      if (!res.ok) return;
      const data: Channel[] = await res.json();
      if (data.length > 0) setChannels(data);
    } catch {}
  }, []);

  useEffect(() => {
    fetchMessages(true);
    fetchPinned();
    fetchMentionUsers();
    fetchChannels();
    pollingRef.current = setInterval(() => {
      fetchMessages(false);
      fetchPinned();
    }, 3000);
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [fetchMessages, fetchPinned, fetchMentionUsers, fetchChannels]);

  useEffect(() => {
    fetchMessages(true);
    fetchPinned();
  }, [activeChannel]);

  /* ── Send ── */

  const sendMessage = async (content: string, type: MessageType) => {
    setSending(true);
    try {
      const res = await fetch("/api/clan-gc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          content,
          type,
          channel: activeChannel,
          replyToId: replyingTo?.id || undefined,
        }),
      });
      if (!res.ok) throw new Error("Failed to send");
      const msg: GcMessage = await res.json();
      setMessages(prev => [...prev.filter(m => m.id !== msg.id), msg]);
      setReplyingTo(null);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch (e: any) {
      toast({ variant: "destructive", title: "Failed to send", description: e?.message });
    } finally {
      setSending(false);
    }
  };

  const handleSendText = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId !== null) {
      handleEditSubmit();
      return;
    }
    if (imageFile) {
      try {
        setSending(true);
        const url = await uploadFile(imageFile);
        await sendMessage(url, "IMAGE");
        setImageFile(null);
        setImagePreview(null);
      } catch {
        toast({ variant: "destructive", title: "Image upload failed" });
        setSending(false);
      }
      return;
    }
    if (voiceBlob) {
      try {
        setSending(true);
        const file = new File([voiceBlob], `voice-${Date.now()}.webm`, { type: "audio/webm" });
        const url = await uploadFile(file);
        await sendMessage(url, "VOICE");
        setVoiceBlob(null);
      } catch {
        toast({ variant: "destructive", title: "Voice upload failed" });
        setSending(false);
      }
      return;
    }
    if (!text.trim()) return;
    const msg = text.trim();
    setText("");
    setShowMentions(false);
    await sendMessage(msg, "TEXT");
  };

  /* ── Edit ── */

  const handleEdit = (msg: GcMessage) => {
    setEditingId(msg.id);
    setEditText(msg.content);
  };

  const handleEditSubmit = async () => {
    if (!editingId || !editText.trim()) return;
    try {
      const res = await fetch(`/api/clan-gc/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ content: editText.trim() }),
      });
      if (!res.ok) throw new Error("Failed to edit");
      const updated: GcMessage = await res.json();
      setMessages(prev => prev.map(m => m.id === updated.id ? updated : m));
      setEditingId(null);
      setEditText("");
    } catch (e: any) {
      toast({ variant: "destructive", title: "Failed to edit", description: e?.message });
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText("");
  };

  /* ── Delete ── */

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/clan-gc/${id}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error("Failed to delete");
      setMessages(prev => prev.filter(m => m.id !== id));
      setPinnedMessages(prev => prev.filter(m => m.id !== id));
    } catch (e: any) {
      toast({ variant: "destructive", title: "Failed to delete", description: e?.message });
    }
  };

  /* ── Pin ── */

  const handlePin = async (id: number) => {
    try {
      const res = await fetch(`/api/clan-gc/${id}/pin`, { method: "POST", credentials: "include" });
      if (!res.ok) throw new Error("Failed to pin");
      const updated: GcMessage = await res.json();
      setMessages(prev => prev.map(m => m.id === updated.id ? updated : m));
      fetchPinned();
    } catch (e: any) {
      toast({ variant: "destructive", title: "Failed to pin", description: e?.message });
    }
  };

  const handleUnpin = async (id: number) => {
    try {
      const res = await fetch(`/api/clan-gc/${id}/unpin`, { method: "POST", credentials: "include" });
      if (!res.ok) throw new Error("Failed to unpin");
      const updated: GcMessage = await res.json();
      setMessages(prev => prev.map(m => m.id === updated.id ? updated : m));
      fetchPinned();
    } catch (e: any) {
      toast({ variant: "destructive", title: "Failed to unpin", description: e?.message });
    }
  };

  /* ── Reactions ── */

  const toggleReaction = async (messageId: number, emoji: string) => {
    try {
      const msg = messages.find(m => m.id === messageId);
      const existing = msg?.reactions?.find(r => r.emoji === emoji && r.userIds.includes(user?.id || 0));
      if (existing) {
        await fetch(`/api/clan-gc/${messageId}/react?emoji=${encodeURIComponent(emoji)}`, {
          method: "DELETE", credentials: "include",
        });
      } else {
        await fetch(`/api/clan-gc/${messageId}/react`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ emoji }),
        });
      }
      fetchMessages(false);
      fetchPinned();
    } catch (e: any) {
      toast({ variant: "destructive", title: "Failed", description: e?.message });
    }
  };

  /* ── Search ── */

  const handleSearch = async (q: string) => {
    setSearchQuery(q);
    if (!q.trim()) {
      setSearchResults([]);
      return;
    }
    try {
      const res = await fetch(`/api/clan-gc/search?q=${encodeURIComponent(q)}&channel=${activeChannel}`, { credentials: "include" });
      if (!res.ok) throw new Error("Search failed");
      const data: GcMessage[] = await res.json();
      setSearchResults(data);
    } catch {}
  };

  /* ── Image & Voice ── */

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setVoiceBlob(null);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setVoiceBlob(blob);
        setVoicePreview(true);
      };
      mr.start();
      mediaRecorderRef.current = mr;
      setRecording(true);
    } catch {
      toast({ variant: "destructive", title: "Microphone access denied" });
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current = null;
    setRecording(false);
  };

  const cancelRecording = () => {
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current = null;
    setRecording(false);
    setVoiceBlob(null);
    setVoicePreview(false);
  };

  /* ── Mentions ── */

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setText(val);
    const lastAt = val.lastIndexOf("@");
    if (lastAt !== -1) {
      const afterAt = val.slice(lastAt + 1);
      if (!afterAt.includes(" ") && afterAt.length <= 20) {
        setMentionQuery(afterAt.toLowerCase());
        setShowMentions(true);
        setMentionIndex(0);
      } else {
        setShowMentions(false);
      }
    } else {
      setShowMentions(false);
    }
  };

  const insertMention = (username: string) => {
    const lastAt = text.lastIndexOf("@");
    const before = text.slice(0, lastAt);
    const newText = `${before}@${username} `;
    setText(newText);
    setShowMentions(false);
    inputRef.current?.focus();
  };

  const filteredMentions = mentionQuery
    ? mentionUsers.filter(u =>
        u.username.toLowerCase().includes(mentionQuery) ||
        (u.displayName?.toLowerCase() || "").includes(mentionQuery)
      )
    : mentionUsers;

  /* ── Profile ── */

  const openProfile = (msg: GcMessage) => {
    setProfileUser({
      name: msg.authorName,
      displayName: msg.authorDisplayName,
      avatar: msg.authorAvatar,
      role: msg.authorRole,
      ...msg.authorStats,
    });
    setShowProfile(true);
  };

  /* ── Context Menu ── */

  const handleContextMenu = (e: React.MouseEvent, msg: GcMessage) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, msg });
  };

  const closeContextMenu = () => setContextMenu({ x: 0, y: 0, msg: null });

  /* ── Scroll to message ── */

  const scrollToMessage = (id: number) => {
    const el = document.getElementById(`msg-${id}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("ring-2", "ring-primary", "ring-offset-2", "ring-offset-background");
      setTimeout(() => el.classList.remove("ring-2", "ring-primary", "ring-offset-2", "ring-offset-background"), 2000);
    }
  };

  /* ── Render ── */

  const activeChannelName = channels.find(c => c.slug === activeChannel)?.name || "General";
  const accessibleChannels = channels.filter(c => canAccessChannel(userRole, c.slug));

  const inputDisabled = sending || !!imageFile || !!voiceBlob || editingId !== null;

  return (
    <AppLayout>
      <div className="flex h-[calc(100dvh-6.5rem)]">
        {/* Desktop Channel Sidebar */}
        <div className="hidden md:flex flex-col w-56 border-r border-white/5 bg-[#0a0a0a] flex-shrink-0">
          <div className="px-4 py-3 border-b border-white/5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Channels</h2>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-0.5">
              {accessibleChannels.map(ch => (
                <button
                  key={ch.slug}
                  onClick={() => { setActiveChannel(ch.slug); setShowChannelSheet(false); }}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                    activeChannel === ch.slug
                      ? "bg-primary/15 text-white font-semibold"
                      : "text-muted-foreground hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Hash className="w-4 h-4" />
                  <span className="flex-1 text-left">{ch.name}</span>
                  {ch.slug === "MANAGEMENT" && <Shield className="w-3 h-3 text-blue-400" />}
                </button>
              ))}
            </div>
          </ScrollArea>
          <div className="px-4 py-3 border-t border-white/5 flex items-center gap-2">
            <div className="w-6 h-6 rounded-full overflow-hidden">
              <SafeImg src={user?.avatarUrl} alt={user?.username || "Me"} />
            </div>
            <span className="text-xs font-bold text-white truncate">{user?.displayName || user?.username || "You"}</span>
            <RoleBadge role={userRole} />
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#0a0a0a]">
          {/* Header */}
          <div className="px-3 md:px-4 py-3 border-b border-white/5 flex items-center gap-3 flex-shrink-0">
            {/* Mobile channel toggle */}
            <Sheet open={showChannelSheet} onOpenChange={setShowChannelSheet}>
              <SheetTrigger asChild>
                <button className="md:hidden flex items-center justify-center w-8 h-8 text-muted-foreground hover:text-white">
                  <Menu className="w-5 h-5" />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="bg-[#0a0a0a] border-r border-white/5 w-56 p-0">
                <div className="px-4 py-3 border-b border-white/5">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Channels</h2>
                </div>
                <div className="p-2 space-y-0.5">
                  {accessibleChannels.map(ch => (
                    <button
                      key={ch.slug}
                      onClick={() => { setActiveChannel(ch.slug); setShowChannelSheet(false); }}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                        activeChannel === ch.slug
                          ? "bg-primary/15 text-white font-semibold"
                          : "text-muted-foreground hover:text-white hover:bg-white/5"
                      }`}
                    >
                      <Hash className="w-4 h-4" />
                      <span className="flex-1 text-left">{ch.name}</span>
                    </button>
                  ))}
                </div>
              </SheetContent>
            </Sheet>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <Hash className="w-4 h-4 text-primary hidden md:block" />
                <h1 className="font-heading font-bold text-base md:text-lg text-white uppercase tracking-wider">{activeChannelName}</h1>
                <RoleBadge role={userRole} />
              </div>
              <p className="text-muted-foreground text-[10px] md:text-xs">
                {accessibleChannels.length} channels available
                {showSearch && ` • Searching "${searchQuery}"`}
              </p>
            </div>

            {/* Search toggle */}
            <button
              onClick={() => { setShowSearch(!showSearch); if (showSearch) { setSearchQuery(""); setSearchResults([]); } }}
              className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${showSearch ? "bg-primary/20 text-white" : "text-muted-foreground hover:text-white hover:bg-white/5"}`}
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Users toggle */}
            <button
              onClick={() => setUsersListOpen(!usersListOpen)}
              className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${usersListOpen ? "bg-primary/20 text-white" : "text-muted-foreground hover:text-white hover:bg-white/5"}`}
            >
              <User className="w-4 h-4" />
            </button>
          </div>

          {/* Search bar */}
          {showSearch && (
            <div className="px-3 md:px-4 py-2 border-b border-white/5 flex-shrink-0">
              <div className="flex items-center gap-2 bg-[#1a1a2e] rounded-lg px-3 py-2 border border-white/10">
                <Search className="w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => handleSearch(e.target.value)}
                  placeholder="Search messages..."
                  className="flex-1 bg-transparent text-sm text-white placeholder:text-muted-foreground outline-none"
                  autoFocus
                />
                {searchQuery && (
                  <button onClick={() => { setSearchQuery(""); setSearchResults([]); }}>
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                )}
              </div>
              {searchResults.length > 0 && (
                <div className="mt-2 text-xs text-muted-foreground">
                  {searchResults.length} result{searchResults.length !== 1 ? "s" : ""} found
                </div>
              )}
            </div>
          )}

          {/* Users list */}
          {usersListOpen && (
            <div className="px-3 md:px-4 py-2 border-b border-white/5 flex-shrink-0">
              <ScrollArea className="h-32">
                <div className="flex flex-wrap gap-2">
                  {mentionUsers.map(u => (
                    <button
                      key={u.id}
                      onClick={() => { setText(t => t + `@${u.username} `); setUsersListOpen(false); inputRef.current?.focus(); }}
                      className="flex items-center gap-1.5 bg-[#1a1a2e] border border-white/5 rounded-full px-2 py-1 text-xs text-white hover:bg-white/5 transition-colors"
                    >
                      <div className="w-4 h-4 rounded-full overflow-hidden">
                        <SafeImg src={u.avatarUrl} alt={u.username} />
                      </div>
                      <span>{u.displayName || u.username}</span>
                      <RoleBadge role={u.role} />
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Pinned messages */}
          {pinnedMessages.length > 0 && (
            <div className="flex-shrink-0 border-b border-white/5">
              <button
                onClick={() => setShowPinned(!showPinned)}
                className="w-full flex items-center gap-2 px-3 md:px-4 py-2 text-xs text-muted-foreground hover:text-white transition-colors"
              >
                <Pin className="w-3 h-3 text-primary" />
                <span>{pinnedMessages.length} pinned message{pinnedMessages.length !== 1 ? "s" : ""}</span>
                {showPinned ? <ChevronUp className="w-3 h-3 ml-auto" /> : <ChevronDown className="w-3 h-3 ml-auto" />}
              </button>
              {showPinned && (
                <div className="px-3 md:px-4 pb-2 space-y-2 max-h-40 overflow-y-auto">
                  {pinnedMessages.map(msg => (
                    <div key={msg.id} className="bg-[#1a1a2e] rounded-lg p-2 border border-white/5 text-xs">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="font-bold text-white">{msg.authorDisplayName || msg.authorName}</span>
                        <RoleBadge role={msg.authorRole} />
                      </div>
                      <p className="text-muted-foreground line-clamp-2">{msg.content}</p>
                      {isManagement(userRole) && (
                        <button onClick={() => handleUnpin(msg.id)} className="text-[10px] text-destructive mt-1 hover:underline">Unpin</button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 md:px-4 py-3 space-y-3" ref={messagesContainerRef}>
            {(showSearch ? searchResults : messages).length === 0 && (
              <div className="text-center text-muted-foreground text-sm py-8">
                {showSearch ? "No messages found" : "No messages yet. Say something!"}
              </div>
            )}
            {(showSearch ? searchResults : messages).map(msg => {
              const me = isMe(msg);
              const replyMsg = msg.replyToId ? messages.find(m => m.id === msg.replyToId) : null;
              return (
                <div
                  key={msg.id}
                  id={`msg-${msg.id}`}
                  className={`flex gap-2 group ${me ? "flex-row-reverse" : ""}`}
                  onContextMenu={e => handleContextMenu(e, msg)}
                >
                  {/* Avatar */}
                  <button
                    onClick={() => openProfile(msg)}
                    className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex-shrink-0 overflow-hidden hover:ring-2 hover:ring-primary/50 transition-all"
                  >
                    <SafeImg src={msg.authorAvatar} alt={msg.authorDisplayName ?? msg.authorName} />
                  </button>

                  {/* Content */}
                  <div className={`max-w-[80%] md:max-w-[70%] ${me ? "items-end" : "items-start"} flex flex-col gap-0.5`}>
                    {/* Name + role */}
                    {!me && (
                      <div className="flex items-center gap-1.5 flex-wrap px-0.5">
                        <button onClick={() => openProfile(msg)} className="text-[10px] font-bold text-white hover:underline">
                          {msg.authorDisplayName ?? msg.authorName}
                        </button>
                        <RoleBadge role={msg.authorRole} />
                        {msg.isPinned && <Pin className="w-3 h-3 text-primary" />}
                        {msg.editedAt && <span className="text-[9px] text-muted-foreground">(edited)</span>}
                      </div>
                    )}
                    {me && (
                      <div className="flex items-center gap-1.5 flex-wrap px-0.5 justify-end">
                        {msg.isPinned && <Pin className="w-3 h-3 text-primary" />}
                        {msg.editedAt && <span className="text-[9px] text-muted-foreground">(edited)</span>}
                      </div>
                    )}

                    {/* Reply preview */}
                    {replyMsg && (
                      <button
                        onClick={() => scrollToMessage(replyMsg.id)}
                        className={`text-[10px] text-muted-foreground bg-white/5 rounded-lg px-2 py-1 border-l-2 border-primary mb-0.5 max-w-full ${me ? "text-right" : "text-left"}`}
                      >
                        <span className="font-bold text-white">{replyMsg.authorDisplayName || replyMsg.authorName}</span>
                        <span className="line-clamp-1 ml-1">{replyMsg.content}</span>
                      </button>
                    )}

                    {/* Bubble */}
                    <div className={`rounded-2xl px-3 py-2 text-sm relative group ${me
                      ? "bg-[#006d5b] text-white rounded-tr-sm"
                      : "bg-[#1a1a2e] text-white rounded-tl-sm"}`}
                    >
                      {msg.type === "IMAGE" ? (
                        <SafeImg src={msg.content} alt="Shared" className="max-w-[220px] rounded-xl" />
                      ) : msg.type === "VOICE" ? (
                        <AudioPlayer src={msg.content} />
                      ) : (
                        <MentionedText text={msg.content} users={mentionUsers} />
                      )}

                      {/* Context menu on hover */}
                      <div className={`absolute ${me ? "left-0 -translate-x-full" : "right-0 translate-x-full"} top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-0.5 bg-[#0a0a0a] border border-white/10 rounded-lg p-1 z-10`}>
                        <button onClick={() => setReplyingTo(msg)} className="p-1 text-muted-foreground hover:text-white" title="Reply">
                          <Reply className="w-3.5 h-3.5" />
                        </button>
                        {me && (
                          <button onClick={() => handleEdit(msg)} className="p-1 text-muted-foreground hover:text-white" title="Edit">
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {(me || isManagement(userRole)) && (
                          <button onClick={() => handleDelete(msg.id)} className="p-1 text-muted-foreground hover:text-destructive" title="Delete">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {isManagement(userRole) && !msg.isPinned && (
                          <button onClick={() => handlePin(msg.id)} className="p-1 text-muted-foreground hover:text-primary" title="Pin">
                            <Pin className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Reactions */}
                    {msg.reactions.length > 0 && (
                      <div className={`flex items-center gap-1 flex-wrap px-0.5 ${me ? "justify-end" : "justify-start"}`}>
                        {msg.reactions.map(r => (
                          <button
                            key={r.emoji}
                            onClick={() => toggleReaction(msg.id, r.emoji)}
                            className={`inline-flex items-center gap-0.5 text-[11px] px-1.5 py-0.5 rounded-full border transition-colors ${
                              r.userIds.includes(user?.id || 0)
                                ? "bg-primary/20 border-primary/40 text-white"
                                : "bg-[#1a1a2e] border-white/10 text-muted-foreground hover:bg-white/5"
                            }`}
                          >
                            <span>{r.emoji}</span>
                            <span className="font-bold">{r.count}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Quick reaction bar */}
                    <div className={`flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity ${me ? "justify-end" : "justify-start"}`}>
                      {EMOJI_REACTIONS.map(emoji => (
                        <button
                          key={emoji}
                          onClick={() => toggleReaction(msg.id, emoji)}
                          className="text-[13px] p-0.5 rounded hover:bg-white/10 transition-colors"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>

                    {/* Timestamp */}
                    <span className="text-[9px] text-muted-foreground px-0.5">
                      {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          {/* Input Area */}
          <div className="flex-shrink-0 px-3 md:px-4 pb-3 pt-2 border-t border-white/5">
            {/* Reply bar */}
            {replyingTo && (
              <div className="flex items-center gap-2 mb-2 bg-[#1a1a2e] rounded-lg px-3 py-2 border border-white/10">
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] text-primary font-bold">Replying to {replyingTo.authorDisplayName || replyingTo.authorName}</div>
                  <div className="text-[11px] text-muted-foreground truncate">{replyingTo.content}</div>
                </div>
                <button onClick={() => setReplyingTo(null)} className="text-muted-foreground hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Edit bar */}
            {editingId !== null && (
              <div className="flex items-center gap-2 mb-2 bg-[#1a1a2e] rounded-lg px-3 py-2 border border-white/10">
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] text-primary font-bold">Editing message</div>
                </div>
                <button onClick={cancelEdit} className="text-muted-foreground hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Image preview */}
            {imagePreview && (
              <div className="relative inline-block mb-2">
                <img src={imagePreview} alt="Preview" className="h-20 w-auto rounded-xl border border-border" />
                <button onClick={() => { setImagePreview(null); setImageFile(null); }}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-destructive rounded-full flex items-center justify-center">
                  <X className="w-3 h-3 text-white" />
                </button>
              </div>
            )}

            {/* Voice preview */}
            {voiceBlob && (
              <div className="flex items-center gap-2 mb-2 bg-[#1a1a2e] rounded-full px-3 py-2 border border-white/10">
                <button onClick={() => {
                  const url = URL.createObjectURL(voiceBlob);
                  const a = new Audio(url);
                  a.play();
                }} className="text-white">
                  <Play className="w-4 h-4" />
                </button>
                <span className="text-xs text-white/60">Voice note ready</span>
                <button onClick={cancelRecording} className="text-destructive ml-auto">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Recording indicator */}
            {recording && (
              <div className="flex items-center gap-2 mb-2 text-destructive text-xs font-bold">
                <span className="w-2 h-2 bg-destructive rounded-full animate-pulse" />
                Recording...
                <span className="text-muted-foreground font-normal">Release mic to stop</span>
              </div>
            )}

            {/* Mention dropdown */}
            {showMentions && filteredMentions.length > 0 && (
              <div className="mb-2 bg-[#1a1a2e] border border-white/10 rounded-lg overflow-hidden max-h-40 overflow-y-auto">
                {filteredMentions.map((u, i) => (
                  <button
                    key={u.id}
                    onClick={() => insertMention(u.username)}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors ${
                      i === mentionIndex ? "bg-primary/15 text-white" : "text-muted-foreground hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <div className="w-6 h-6 rounded-full overflow-hidden">
                      <SafeImg src={u.avatarUrl} alt={u.username} />
                    </div>
                    <span className="font-bold">{u.displayName || u.username}</span>
                    <span className="text-xs text-muted-foreground">@{u.username}</span>
                    <RoleBadge role={u.role} />
                  </button>
                ))}
              </div>
            )}

            <form onSubmit={handleSendText} className="flex items-center gap-2">
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
              <button type="button" onClick={() => fileInputRef.current?.click()}
                className="w-8 h-8 flex-shrink-0 flex items-center justify-center text-muted-foreground hover:text-white transition-colors">
                <ImageIcon className="w-5 h-5" />
              </button>
              <input
                ref={inputRef}
                type="text"
                value={editingId !== null ? editText : text}
                onChange={editingId !== null ? e => setEditText(e.target.value) : handleInputChange}
                placeholder={
                  editingId !== null ? "Editing..." :
                  imageFile ? "Add caption or send..." :
                  voiceBlob ? "Voice note ready" :
                  replyingTo ? `Replying to ${replyingTo.authorDisplayName || replyingTo.authorName}...` :
                  "Message..."
                }
                disabled={!!recording || inputDisabled}
                className="flex-1 bg-[#1a1a2e] border border-white/10 rounded-full px-4 py-2 text-sm text-white placeholder:text-muted-foreground outline-none focus:border-primary/50 transition-colors"
                onKeyDown={e => {
                  if (e.key === "Escape") {
                    if (editingId !== null) cancelEdit();
                    else setReplyingTo(null);
                  }
                }}
              />
              {editingId !== null ? (
                <button type="submit" disabled={sending}
                  className="w-8 h-8 flex-shrink-0 bg-primary rounded-full flex items-center justify-center text-white hover:bg-primary/80 transition-colors">
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                </button>
              ) : (
                (!text.trim() && !imageFile && !voiceBlob ? (
                  <button
                    type="button"
                    onMouseDown={startRecording}
                    onMouseUp={stopRecording}
                    onTouchStart={startRecording}
                    onTouchEnd={stopRecording}
                    className={`w-8 h-8 flex-shrink-0 flex items-center justify-center transition-colors rounded-full ${recording ? "bg-destructive text-white animate-pulse" : "text-muted-foreground hover:text-white"}`}>
                    {recording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </button>
                ) : (
                  <button type="submit" disabled={sending}
                    className="w-8 h-8 flex-shrink-0 bg-primary rounded-full flex items-center justify-center text-white hover:bg-primary/80 transition-colors">
                    {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </button>
                ))
              )}
            </form>
          </div>
        </div>
      </div>

      {/* Profile Preview Modal */}
      {profileUser && (
        <ProfilePreview
          user={profileUser}
          open={showProfile}
          onClose={() => setShowProfile(false)}
        />
      )}

      {/* Custom context menu */}
      {contextMenu.msg && (
        <div
          className="fixed z-50 bg-[#1a1a2e] border border-white/10 rounded-lg shadow-xl py-1 min-w-[160px]"
          style={{ top: contextMenu.y, left: Math.min(contextMenu.x, window.innerWidth - 180) }}
          onClick={closeContextMenu}
        >
          <button onClick={() => { setReplyingTo(contextMenu.msg); closeContextMenu(); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white hover:bg-white/5 text-left">
            <Reply className="w-4 h-4" /> Reply
          </button>
          {isMe(contextMenu.msg) && (
            <button onClick={() => { handleEdit(contextMenu.msg!); closeContextMenu(); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white hover:bg-white/5 text-left">
              <Edit3 className="w-4 h-4" /> Edit
            </button>
          )}
          {(isMe(contextMenu.msg) || isManagement(userRole)) && (
            <button onClick={() => { handleDelete(contextMenu.msg!.id); closeContextMenu(); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-white/5 text-left">
              <Trash2 className="w-4 h-4" /> Delete
            </button>
          )}
          <button onClick={() => { openProfile(contextMenu.msg!); closeContextMenu(); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white hover:bg-white/5 text-left">
            <User className="w-4 h-4" /> Profile
          </button>
          {isManagement(userRole) && !contextMenu.msg!.isPinned && (
            <button onClick={() => { handlePin(contextMenu.msg!.id); closeContextMenu(); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white hover:bg-white/5 text-left">
              <Pin className="w-4 h-4" /> Pin
            </button>
          )}
          {isManagement(userRole) && contextMenu.msg!.isPinned && (
            <button onClick={() => { handleUnpin(contextMenu.msg!.id); closeContextMenu(); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white hover:bg-white/5 text-left">
              <Pin className="w-4 h-4" /> Unpin
            </button>
          )}
        </div>
      )}

      {/* Click outside to close context menu */}
      {contextMenu.msg && (
        <div className="fixed inset-0 z-40" onClick={closeContextMenu} />
      )}
    </AppLayout>
  );
}
