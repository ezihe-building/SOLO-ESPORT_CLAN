import React, { useState, useEffect, useRef, useCallback } from "react";
import { AppLayout } from "@/components/layout";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Mic, MicOff, Send, Image as ImageIcon, X, Loader2, Play, Pause } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type MessageType = "TEXT" | "IMAGE" | "VOICE";

interface GcMessage {
  id: number;
  content: string;
  type: MessageType;
  authorId: number;
  authorName: string;
  authorDisplayName: string | null;
  authorAvatar: string | null;
  authorRole: string;
  createdAt: string;
}

const ROLE_BADGES: Record<string, { label: string; className: string; emoji?: string }> = {
  CLAN_MASTER: { label: "Clan Master", emoji: "👑", className: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30" },
  CO_LEADER: { label: "Co-Leader", emoji: "⭐", className: "text-yellow-300 bg-yellow-300/10 border-yellow-300/30" },
  MANAGEMENT: { label: "Management", emoji: "🛡️", className: "text-blue-400 bg-blue-400/10 border-blue-400/30" },
  ADMIN: { label: "Admin", emoji: "🛡️", className: "text-blue-400 bg-blue-400/10 border-blue-400/30" },
  TIER1: { label: "Tier 1", className: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30" },
  TIER2: { label: "Tier 2", className: "text-blue-400 bg-blue-400/10 border-blue-400/30" },
  TIER3: { label: "Tier 3", className: "text-green-400 bg-green-400/10 border-green-400/30" },
  NEW_MEMBER: { label: "New Member", className: "text-muted-foreground bg-muted/10 border-border" },
};

function RoleBadge({ role }: { role: string }) {
  const badge = ROLE_BADGES[role] ?? ROLE_BADGES.NEW_MEMBER;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${badge.className}`}>
      {badge.emoji && <span>{badge.emoji}</span>}
      {badge.label}
    </span>
  );
}

function AudioPlayer({ src }: { src: string }) {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio(src);
    audioRef.current.onended = () => setPlaying(false);
    return () => { audioRef.current?.pause(); };
  }, [src]);

  const toggle = () => {
    if (!audioRef.current) return;
    if (playing) { audioRef.current.pause(); setPlaying(false); }
    else { audioRef.current.play(); setPlaying(true); }
  };

  return (
    <button onClick={toggle} className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-3 py-1.5 text-xs text-white">
      {playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
      <span>Voice note</span>
    </button>
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

async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export default function ClanGcPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<GcMessage[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [recording, setRecording] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const latestIdRef = useRef<number>(0);

  const fetchMessages = useCallback(async (initial = false) => {
    try {
      const res = await fetch("/api/clan-gc", { credentials: "include" });
      if (!res.ok) return;
      const data: GcMessage[] = await res.json();
      setMessages(data);
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
  }, []);

  useEffect(() => {
    fetchMessages(true);
    pollingRef.current = setInterval(() => fetchMessages(false), 3000);
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [fetchMessages]);

  const sendMessage = async (content: string, type: MessageType) => {
    setSending(true);
    try {
      const res = await fetch("/api/clan-gc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ content, type }),
      });
      if (!res.ok) throw new Error("Failed to send");
      const msg: GcMessage = await res.json();
      setMessages(prev => [...prev.filter(m => m.id !== msg.id), msg]);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch (e: any) {
      toast({ variant: "destructive", title: "Failed to send", description: e?.message });
    } finally {
      setSending(false);
    }
  };

  const handleSendText = async (e: React.FormEvent) => {
    e.preventDefault();
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
    if (!text.trim()) return;
    const msg = text.trim();
    setText("");
    await sendMessage(msg, "TEXT");
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
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
        try {
          const base64 = await blobToBase64(blob);
          await sendMessage(base64, "VOICE");
        } catch {
          toast({ variant: "destructive", title: "Failed to send voice note" });
        }
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

  const isMe = (msg: GcMessage) => msg.authorId === user?.id;

  return (
    <AppLayout>
      <div className="flex flex-col h-[calc(100dvh-6.5rem)]">
        <div className="px-4 pt-4 pb-2 border-b border-white/5 flex-shrink-0">
          <h1 className="font-heading font-bold text-xl text-white uppercase tracking-wider">Clan GC</h1>
          <p className="text-muted-foreground text-xs">Members only group chat</p>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground text-sm py-8">No messages yet. Say something!</div>
          )}
          {messages.map(msg => (
            <div key={msg.id} className={`flex gap-2 ${isMe(msg) ? "flex-row-reverse" : ""}`}>
              <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex-shrink-0 overflow-hidden">
                {msg.authorAvatar ? (
                  <img src={msg.authorAvatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs font-bold text-primary">
                    {(msg.authorDisplayName ?? msg.authorName)?.[0]?.toUpperCase()}
                  </div>
                )}
              </div>
              <div className={`max-w-[75%] ${isMe(msg) ? "items-end" : "items-start"} flex flex-col gap-0.5`}>
                {!isMe(msg) && (
                  <div className="flex items-center gap-1.5 flex-wrap px-0.5">
                    <span className="text-[10px] font-bold text-white">
                      {msg.authorDisplayName ?? msg.authorName}
                    </span>
                    <RoleBadge role={msg.authorRole} />
                  </div>
                )}
                <div className={`rounded-2xl px-3 py-2 text-sm ${isMe(msg)
                  ? "bg-primary/20 border border-primary/30 text-white rounded-tr-sm"
                  : "bg-card border border-border text-foreground rounded-tl-sm"}`}>
                  {msg.type === "IMAGE" ? (
                    <img src={msg.content} alt="Shared image" className="max-w-[200px] rounded-xl" />
                  ) : msg.type === "VOICE" ? (
                    <AudioPlayer src={msg.content} />
                  ) : (
                    <p className="leading-relaxed break-words">{msg.content}</p>
                  )}
                </div>
                <span className="text-[9px] text-muted-foreground px-0.5">
                  {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                </span>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        <div className="flex-shrink-0 px-3 pb-3 pt-2 border-t border-white/5">
          {imagePreview && (
            <div className="relative inline-block mb-2">
              <img src={imagePreview} alt="Preview" className="h-20 w-auto rounded-xl border border-border" />
              <button onClick={() => { setImagePreview(null); setImageFile(null); }}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-destructive rounded-full flex items-center justify-center">
                <X className="w-3 h-3 text-white" />
              </button>
            </div>
          )}
          <form onSubmit={handleSendText} className="flex items-center gap-2">
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
            <button type="button" onClick={() => fileInputRef.current?.click()}
              className="w-8 h-8 flex-shrink-0 flex items-center justify-center text-muted-foreground hover:text-white transition-colors">
              <ImageIcon className="w-5 h-5" />
            </button>
            <input
              type="text"
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder={imageFile ? "Add caption or send..." : "Message..."}
              disabled={recording}
              className="flex-1 bg-card border border-border rounded-full px-4 py-2 text-sm text-white placeholder:text-muted-foreground outline-none focus:border-primary/50 transition-colors"
            />
            {!text.trim() && !imageFile ? (
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
              <Button type="submit" size="icon" disabled={sending}
                className="w-8 h-8 flex-shrink-0 bg-primary rounded-full border-primary-border">
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            )}
          </form>
        </div>
      </div>
    </AppLayout>
  );
}
