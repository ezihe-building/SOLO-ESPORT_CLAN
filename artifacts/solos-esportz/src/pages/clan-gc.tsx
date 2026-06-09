import React, { useState, useEffect, useRef, useCallback } from "react";
import { AppLayout } from "@/components/layout";
import { useAuth } from "@/lib/auth";
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

function AvatarFallback({ name, className = "" }: { name: string; className?: string }) {
  return (
    <div className={`w-full h-full flex items-center justify-center text-xs font-bold text-white bg-primary/30 ${className}`}>
      {name?.[0]?.toUpperCase()}
    </div>
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

async function uploadFile(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch("/api/upload", { method: "POST", body: form, credentials: "include" });
  if (!res.ok) throw new Error("Upload failed");
  const data = await res.json();
  return data.url as string;
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
  const [voiceBlob, setVoiceBlob] = useState<Blob | null>(null);
  const [voicePreview, setVoicePreview] = useState(false);

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
    await sendMessage(msg, "TEXT");
  };

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

  const isMe = (msg: GcMessage) => msg.authorId === user?.id;

  const inputDisabled = sending || !!imageFile || !!voiceBlob;

  return (
    <AppLayout>
      <div className="flex flex-col h-[calc(100dvh-6.5rem)]">
        {/* Header */}
        <div className="px-4 pt-4 pb-2 border-b border-white/5 flex-shrink-0">
          <h1 className="font-heading font-bold text-xl text-white uppercase tracking-wider">Clan GC</h1>
          <p className="text-muted-foreground text-xs">Members only group chat</p>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground text-sm py-8">No messages yet. Say something!</div>
          )}
          {messages.map(msg => {
            const me = isMe(msg);
            return (
              <div key={msg.id} className={`flex gap-2 ${me ? "flex-row-reverse" : ""}`}>
                {/* Avatar */}
                <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex-shrink-0 overflow-hidden">
                  <SafeImg src={msg.authorAvatar} alt={msg.authorDisplayName ?? msg.authorName} />
                </div>
                {/* Content */}
                <div className={`max-w-[75%] ${me ? "items-end" : "items-start"} flex flex-col gap-0.5`}>
                  {!me && (
                    <div className="flex items-center gap-1.5 flex-wrap px-0.5">
                      <span className="text-[10px] font-bold text-white">
                        {msg.authorDisplayName ?? msg.authorName}
                      </span>
                      <RoleBadge role={msg.authorRole} />
                    </div>
                  )}
                  {/* Bubble */}
                  <div className={`rounded-2xl px-3 py-2 text-sm ${me
                    ? "bg-[#006d5b] text-white rounded-tr-sm"
                    : "bg-[#1a1a2e] text-white rounded-tl-sm"}`}
                  >
                    {msg.type === "IMAGE" ? (
                      <SafeImg src={msg.content} alt="Shared" className="max-w-[220px] rounded-xl" />
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
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Input Area */}
        <div className="flex-shrink-0 px-3 pb-3 pt-2 border-t border-white/5">
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
              placeholder={imageFile ? "Add caption or send..." : voiceBlob ? "Voice note ready" : "Message..."}
              disabled={!!recording || inputDisabled}
              className="flex-1 bg-[#1a1a2e] border border-white/10 rounded-full px-4 py-2 text-sm text-white placeholder:text-muted-foreground outline-none focus:border-primary/50 transition-colors"
            />
            {!text.trim() && !imageFile && !voiceBlob ? (
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
            )}
          </form>
        </div>
      </div>
    </AppLayout>
  );
}
