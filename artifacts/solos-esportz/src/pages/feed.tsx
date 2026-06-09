import React, { useState, useRef } from "react";
import { useListFeedPosts, useDeleteFeedPost, useLikeFeedPost, getListFeedPostsQueryKey } from "@workspace/api-client-react";
import { AppLayout } from "@/components/layout";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Heart, Trash2, Plus, X, Image as ImageIcon, Video, Send, MessageCircle, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const ROLE_BADGES: Record<string, { label: string; emoji?: string; className: string }> = {
  CLAN_MASTER: { label: "Clan Master", emoji: "👑", className: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30" },
  CO_LEADER: { label: "Co-Leader", emoji: "⭐", className: "text-yellow-300 bg-yellow-300/10 border-yellow-300/30" },
  MANAGEMENT: { label: "Management", emoji: "🛡️", className: "text-blue-400 bg-blue-400/10 border-blue-400/30" },
  ADMIN: { label: "Admin", emoji: "🛡️", className: "text-blue-400 bg-blue-400/10 border-blue-400/30" },
  TIER1: { label: "T1", className: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30" },
  TIER2: { label: "T2", className: "text-blue-400 bg-blue-400/10 border-blue-400/30" },
  TIER3: { label: "T3", className: "text-green-400 bg-green-400/10 border-green-400/30" },
  NEW_MEMBER: { label: "New", className: "text-muted-foreground bg-muted/10 border-border" },
};

function RoleBadge({ role }: { role?: string | null }) {
  if (!role) return null;
  const badge = ROLE_BADGES[role] ?? ROLE_BADGES.NEW_MEMBER;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[9px] font-bold uppercase tracking-wider px-1 py-0.5 rounded border ${badge.className}`}>
      {badge.emoji && <span>{badge.emoji}</span>}
      {badge.label}
    </span>
  );
}

async function uploadFile(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch("/api/upload", { method: "POST", body: form, credentials: "include" });
  if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err?.error || "Upload failed"); }
  const data = await res.json();
  return data.url as string;
}

interface Comment {
  id: number;
  authorName: string;
  authorDisplayName: string | null;
  authorAvatar: string | null;
  authorRole: string;
  content: string;
  createdAt: string;
}

function CommentsSection({ postId, commentCount }: { postId: number; commentCount: number }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [text, setText] = useState("");
  const [localCount, setLocalCount] = useState(commentCount);

  const loadComments = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/feed/${postId}/comments`, { credentials: "include" });
      if (res.ok) setComments(await res.json());
    } catch {} finally { setLoading(false); }
  };

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next) loadComments();
  };

  const sendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`/api/feed/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ content: text.trim() }),
      });
      if (!res.ok) throw new Error("Failed to comment");
      const c: Comment = await res.json();
      setComments(prev => [...prev, c]);
      setLocalCount(n => n + 1);
      setText("");
    } catch (err: any) {
      toast({ variant: "destructive", title: "Comment failed", description: err?.message });
    } finally { setSending(false); }
  };

  return (
    <div>
      <button onClick={toggle} className="flex items-center gap-1.5 text-muted-foreground hover:text-white transition-colors">
        <MessageCircle className="w-4 h-4" />
        <span className="text-xs font-bold">{localCount}</span>
        {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>

      {open && (
        <div className="mt-3 space-y-3 border-t border-border pt-3">
          {loading ? (
            <div className="text-xs text-muted-foreground">Loading...</div>
          ) : comments.length === 0 ? (
            <div className="text-xs text-muted-foreground">No comments yet.</div>
          ) : (
            comments.map(c => (
              <div key={c.id} className="flex gap-2">
                <div className="w-6 h-6 rounded-full bg-primary/10 border border-primary/20 flex-shrink-0 overflow-hidden">
                  {c.authorAvatar ? (
                    <img src={c.authorAvatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[9px] font-bold text-primary">
                      {(c.authorDisplayName ?? c.authorName)?.[0]?.toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-xs font-bold text-white">{c.authorDisplayName ?? c.authorName}</span>
                    <RoleBadge role={c.authorRole} />
                    <span className="text-[9px] text-muted-foreground">
                      {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-xs text-foreground leading-relaxed">{c.content}</p>
                </div>
              </div>
            ))
          )}

          {user && (
            <form onSubmit={sendComment} className="flex gap-2 pt-1">
              <input
                type="text"
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 bg-background border border-border rounded-full px-3 py-1.5 text-xs text-white placeholder:text-muted-foreground outline-none focus:border-primary/50"
              />
              <Button type="submit" size="icon" disabled={sending || !text.trim()}
                className="w-7 h-7 bg-primary rounded-full border-primary-border flex-shrink-0">
                {sending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
              </Button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

export default function FeedPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [content, setContent] = useState("");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<"image" | "video" | null>(null);
  const [posting, setPosting] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const { data: posts, isLoading } = useListFeedPosts();

  const deletePost = useDeleteFeedPost({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListFeedPostsQueryKey() });
        toast({ title: "Post deleted" });
      },
    },
  });

  const likePost = useLikeFeedPost({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListFeedPostsQueryKey() });
      },
    },
  });

  const selectMedia = (type: "image" | "video") => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMediaFile(file);
    setMediaType(type);
    const reader = new FileReader();
    reader.onload = () => setMediaPreview(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const clearMedia = () => { setMediaFile(null); setMediaPreview(null); setMediaType(null); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !mediaFile) return;
    setPosting(true);
    try {
      let imageUrl: string | undefined;
      let videoUrl: string | undefined;
      let type = "NEWS";

      if (mediaFile) {
        const url = await uploadFile(mediaFile);
        if (mediaType === "image") { imageUrl = url; type = "IMAGE"; }
        else { videoUrl = url; type = "VIDEO"; }
      }

      const res = await fetch("/api/feed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ content: content || " ", type, imageUrl, videoUrl }),
      });
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e?.error || "Failed to post"); }

      queryClient.invalidateQueries({ queryKey: getListFeedPostsQueryKey() });
      setContent(""); clearMedia(); setShowCreate(false);
      toast({ title: "Posted!" });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Post failed", description: err?.message });
    } finally { setPosting(false); }
  };

  return (
    <AppLayout>
      <div className="px-4 pt-6 pb-4 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading font-bold text-3xl text-white uppercase tracking-wider">Feed</h1>
            <p className="text-muted-foreground text-sm">Clan updates & activity</p>
          </div>
          {user && (
            <Button size="sm" onClick={() => setShowCreate(!showCreate)}
              className={showCreate ? "bg-muted text-white border border-border" : "bg-primary border border-primary-border shadow-[0_0_10px_rgba(255,0,0,0.2)] text-primary-foreground"}>
              {showCreate ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            </Button>
          )}
        </div>

        {showCreate && user && (
          <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-4 space-y-3">
            <h3 className="font-heading font-bold text-white text-sm uppercase tracking-wider">New Post</h3>
            <Textarea
              placeholder="What's happening in the clan..."
              value={content}
              onChange={e => setContent(e.target.value)}
              className="bg-background border-border min-h-[80px] resize-none"
            />

            {mediaPreview && (
              <div className="relative">
                {mediaType === "video" ? (
                  <video src={mediaPreview} className="w-full max-h-40 rounded-xl object-cover" controls />
                ) : (
                  <img src={mediaPreview} alt="Preview" className="w-full max-h-40 rounded-xl object-cover" />
                )}
                <button type="button" onClick={clearMedia}
                  className="absolute top-2 right-2 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center">
                  <X className="w-3.5 h-3.5 text-white" />
                </button>
              </div>
            )}

            <div className="flex gap-2">
              <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={selectMedia("image")} />
              <input ref={videoInputRef} type="file" accept="video/*" className="hidden" onChange={selectMedia("video")} />
              <button type="button" onClick={() => imageInputRef.current?.click()}
                className="flex items-center gap-1.5 text-muted-foreground hover:text-white transition-colors text-xs font-bold uppercase tracking-wider border border-border rounded-lg px-3 py-2">
                <ImageIcon className="w-4 h-4" /> Image
              </button>
              <button type="button" onClick={() => videoInputRef.current?.click()}
                className="flex items-center gap-1.5 text-muted-foreground hover:text-white transition-colors text-xs font-bold uppercase tracking-wider border border-border rounded-lg px-3 py-2">
                <Video className="w-4 h-4" /> Video
              </button>
            </div>

            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" className="flex-1" onClick={() => { setShowCreate(false); clearMedia(); setContent(""); }}>Cancel</Button>
              <Button type="submit" size="sm" className="flex-1 bg-primary border-primary-border" disabled={posting || (!content.trim() && !mediaFile)}>
                {posting ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Posting...</> : "Post"}
              </Button>
            </div>
          </form>
        )}

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-36 rounded-xl" />)}
          </div>
        ) : !posts?.length ? (
          <div className="bg-card border border-border rounded-xl p-8 text-center text-muted-foreground">
            No posts yet. Be the first to post!
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map(post => (
              <div key={post.id} className="bg-card border border-border rounded-xl overflow-hidden">
                {post.imageUrl && (
                  <img src={post.imageUrl} alt="Post media" className="w-full max-h-64 object-cover" />
                )}
                {post.videoUrl && (
                  <video src={post.videoUrl} className="w-full max-h-64 object-cover bg-black" controls preload="metadata" />
                )}
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {post.authorAvatar ? (
                          <img src={post.authorAvatar} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xs font-bold text-primary">
                            {(post.authorDisplayName ?? post.authorName ?? "S")?.[0]?.toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-white text-xs">
                            {post.authorDisplayName ?? post.authorName ?? "SOLOS+"}
                          </span>
                          <RoleBadge role={post.authorRole} />
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {post.createdAt ? formatDistanceToNow(new Date(post.createdAt), { addSuffix: true }) : ""}
                        </div>
                      </div>
                    </div>
                    {(user?.id === post.authorId || ["CLAN_MASTER", "CO_LEADER", "MANAGEMENT"].includes(user?.role ?? "")) && (
                      <button onClick={() => deletePost.mutate({ id: post.id })}
                        className="text-muted-foreground hover:text-destructive transition-colors p-1">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {post.content && post.content.trim() !== " " && (
                    <p className="text-foreground text-sm leading-relaxed">{post.content}</p>
                  )}

                  {post.link && (
                    <a href={post.link} target="_blank" rel="noreferrer"
                      className="block text-primary text-xs font-bold uppercase tracking-wider border border-primary/30 rounded-lg py-2 text-center hover:bg-primary/10 transition-colors">
                      View Link
                    </a>
                  )}

                  <div className="flex items-center gap-4 border-t border-border pt-3">
                    <button
                      onClick={() => likePost.mutate({ id: post.id })}
                      className={`flex items-center gap-1.5 transition-colors ${post.isLikedByMe ? "text-primary" : "text-muted-foreground hover:text-primary"}`}
                    >
                      <Heart className={`w-4 h-4 ${post.isLikedByMe ? "fill-primary" : ""}`} />
                      <span className="text-xs font-bold">{post.likeCount ?? 0}</span>
                    </button>
                    <CommentsSection postId={post.id} commentCount={post.commentCount ?? 0} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
