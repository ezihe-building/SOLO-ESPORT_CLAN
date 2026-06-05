import React, { useState } from "react";
import { useListFeedPosts, useCreateFeedPost, useDeleteFeedPost, useLikeFeedPost } from "@workspace/api-client-react";
import { AppLayout } from "@/components/layout";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { getListFeedPostsQueryKey } from "@workspace/api-client-react";
import { Heart, Trash2, Plus, X, Image, Link as LinkIcon } from "lucide-react";
import { FeedPostInputType } from "@workspace/api-client-react";
import { formatDistanceToNow } from "date-fns";

const MANAGEMENT_ROLES = ["CLAN_MASTER", "CO_LEADER", "MANAGEMENT"];

function canManage(role?: string) {
  return MANAGEMENT_ROLES.includes(role ?? "");
}

export default function FeedPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [link, setLink] = useState("");

  const { data: posts, isLoading } = useListFeedPosts();

  const createPost = useCreateFeedPost({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListFeedPostsQueryKey() });
        setContent(""); setImageUrl(""); setLink(""); setShowCreate(false);
        toast({ title: "Post created!" });
      },
      onError: (err: any) => {
        toast({ variant: "destructive", title: "Failed to post", description: err?.message });
      },
    },
  });

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    createPost.mutate({ data: { content, type: FeedPostInputType.NEWS, imageUrl: imageUrl || undefined, link: link || undefined } });
  };

  return (
    <AppLayout>
      <div className="px-4 pt-6 pb-4 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading font-bold text-3xl text-white uppercase tracking-wider">Feed</h1>
            <p className="text-muted-foreground text-sm">Clan updates & activity</p>
          </div>
          {canManage(user?.role) && (
            <Button size="sm" onClick={() => setShowCreate(!showCreate)}
              className={showCreate ? "bg-muted text-white border border-border" : "bg-primary border border-primary-border shadow-[0_0_10px_rgba(255,0,0,0.2)] text-primary-foreground"}>
              {showCreate ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            </Button>
          )}
        </div>

        {/* Create Post */}
        {showCreate && canManage(user?.role) && (
          <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-4 space-y-3">
            <h3 className="font-heading font-bold text-white text-sm uppercase tracking-wider">New Post</h3>
            <Textarea
              placeholder="What's happening in the clan..."
              value={content}
              onChange={e => setContent(e.target.value)}
              className="bg-background border-border min-h-[80px] resize-none"
              required
            />
            <div className="flex space-x-2">
              <div className="flex-1">
                <div className="flex items-center space-x-2 bg-background border border-border rounded-lg px-3 py-2">
                  <Image className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <input
                    type="url"
                    placeholder="Image URL (optional)"
                    value={imageUrl}
                    onChange={e => setImageUrl(e.target.value)}
                    className="bg-transparent text-sm text-white outline-none w-full placeholder:text-muted-foreground"
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2 bg-background border border-border rounded-lg px-3 py-2">
              <LinkIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <input
                type="url"
                placeholder="Link (optional)"
                value={link}
                onChange={e => setLink(e.target.value)}
                className="bg-transparent text-sm text-white outline-none w-full placeholder:text-muted-foreground"
              />
            </div>
            <div className="flex space-x-2">
              <Button type="button" variant="outline" size="sm" className="flex-1" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button type="submit" size="sm" className="flex-1 bg-primary border-primary-border" disabled={createPost.isPending}>
                {createPost.isPending ? "Posting..." : "Post"}
              </Button>
            </div>
          </form>
        )}

        {/* Posts */}
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-36 rounded-xl" />)}
          </div>
        ) : !posts?.length ? (
          <div className="bg-card border border-border rounded-xl p-8 text-center text-muted-foreground">
            No posts yet. The clan is quiet...
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map(post => (
              <div key={post.id} className="bg-card border border-border rounded-xl overflow-hidden">
                {post.imageUrl && (
                  <img src={post.imageUrl} alt="Post media" className="w-full max-h-48 object-cover" />
                )}
                <div className="p-4 space-y-3">
                  {/* Author */}
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center overflow-hidden">
                      {post.authorAvatar ? (
                        <img src={post.authorAvatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs font-bold text-primary">{post.authorName?.[0]?.toUpperCase() ?? "S"}</span>
                      )}
                    </div>
                    <div>
                      <div className="font-bold text-white text-xs">S²十{post.authorName ?? "SOLOS+"}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {post.createdAt ? formatDistanceToNow(new Date(post.createdAt), { addSuffix: true }) : ""}
                      </div>
                    </div>
                  </div>

                  <p className="text-foreground text-sm leading-relaxed">{post.content}</p>

                  {post.link && (
                    <a href={post.link} target="_blank" rel="noreferrer"
                      className="block text-primary text-xs font-bold uppercase tracking-wider border border-primary/30 rounded-lg py-2 text-center hover:bg-primary/10 transition-colors">
                      View Link
                    </a>
                  )}

                  <div className="flex items-center justify-between border-t border-border pt-3">
                    <button
                      onClick={() => likePost.mutate({ id: post.id })}
                      className={`flex items-center space-x-1.5 transition-colors ${post.isLikedByMe ? "text-primary" : "text-muted-foreground hover:text-primary"}`}
                    >
                      <Heart className={`w-4 h-4 ${post.isLikedByMe ? "fill-primary" : ""}`} />
                      <span className="text-xs font-bold">{post.likeCount ?? 0}</span>
                    </button>
                    {canManage(user?.role) && (
                      <button
                        onClick={() => deletePost.mutate({ id: post.id })}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
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
