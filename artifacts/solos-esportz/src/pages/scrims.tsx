import React, { useState } from "react";
import { useListScrims, useRegisterForScrim, useUnregisterFromScrim } from "@workspace/api-client-react";
import { AppLayout } from "@/components/layout";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { getListScrimsQueryKey } from "@workspace/api-client-react";
import { CalendarDays, Clock, Users, Trophy, CheckCircle2, XCircle } from "lucide-react";
import { format, isPast } from "date-fns";

function statusBadge(status: string) {
  const map: Record<string, string> = {
    UPCOMING: "bg-blue-500/10 text-blue-400 border-blue-500/30",
    ONGOING: "bg-green-500/10 text-green-400 border-green-500/30",
    COMPLETED: "bg-muted/10 text-muted-foreground border-border",
    CANCELLED: "bg-destructive/10 text-destructive border-destructive/30",
  };
  return map[status] ?? "bg-card text-muted-foreground border-border";
}

export default function ScrimsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<"upcoming" | "completed">("upcoming");

  const { data: scrims, isLoading } = useListScrims();

  const registerMutation = useRegisterForScrim({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListScrimsQueryKey() });
        toast({ title: "Registered for scrim!" });
      },
      onError: (err: any) => {
        toast({ variant: "destructive", title: "Failed to register", description: err?.message });
      },
    },
  });

  const unregisterMutation = useUnregisterFromScrim({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListScrimsQueryKey() });
        toast({ title: "Unregistered from scrim" });
      },
      onError: (err: any) => {
        toast({ variant: "destructive", title: "Failed to unregister", description: err?.message });
      },
    },
  });

  const upcoming = scrims?.filter(s => s.status === "UPCOMING" || s.status === "ONGOING") ?? [];
  const completed = scrims?.filter(s => s.status === "COMPLETED" || s.status === "CANCELLED") ?? [];
  const displayed = tab === "upcoming" ? upcoming : completed;

  return (
    <AppLayout>
      <div className="px-4 pt-6 pb-4 space-y-5">
        <div>
          <h1 className="font-heading font-bold text-3xl text-white uppercase tracking-wider">Scrims</h1>
          <p className="text-muted-foreground text-sm">Competitive matches & results</p>
        </div>

        {/* Tabs */}
        <div className="flex space-x-2">
          {(["upcoming", "completed"] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors border ${
                tab === t ? "bg-primary/20 border-primary/50 text-primary" : "bg-card border-border text-muted-foreground"
              }`}
            >
              {t === "upcoming" ? `Upcoming (${upcoming.length})` : `Results (${completed.length})`}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)}
          </div>
        ) : displayed.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-8 text-center text-muted-foreground">
            No {tab} scrims
          </div>
        ) : (
          <div className="space-y-4">
            {displayed.map(scrim => {
              const isRegistered = scrim.participants?.some(p => p.userId === user?.id);
              const isUpcoming = scrim.status === "UPCOMING";

              return (
                <div key={scrim.id} className="bg-card border border-border rounded-xl overflow-hidden">
                  {scrim.imageUrl && (
                    <img src={scrim.imageUrl} alt={scrim.title} className="w-full h-32 object-cover" />
                  )}
                  <div className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${statusBadge(scrim.status)}`}>
                            {scrim.status}
                          </span>
                        </div>
                        <h3 className="font-heading font-bold text-white text-lg leading-tight">{scrim.title}</h3>
                        {scrim.description && <p className="text-muted-foreground text-sm mt-1">{scrim.description}</p>}
                      </div>
                    </div>

                    {scrim.scheduledAt && (
                      <div className="flex items-center space-x-2 text-muted-foreground text-xs">
                        <CalendarDays className="w-3 h-3" />
                        <span>{format(new Date(scrim.scheduledAt), "MMM d, yyyy · h:mm a")}</span>
                      </div>
                    )}

                    <div className="flex items-center space-x-2 text-muted-foreground text-xs">
                      <Users className="w-3 h-3" />
                      <span>{scrim.participants?.length ?? 0} registered</span>
                    </div>

                    {scrim.result && (
                      <div className="bg-primary/10 border border-primary/30 rounded-lg p-3">
                        <div className="flex items-center space-x-2 mb-1">
                          <Trophy className="w-4 h-4 text-primary" />
                          <span className="font-bold text-white text-sm">Result</span>
                        </div>
                        <p className="text-muted-foreground text-sm">{scrim.result}</p>
                      </div>
                    )}

                    {scrim.link && (
                      <a href={scrim.link} target="_blank" rel="noreferrer"
                        className="block text-center text-primary text-xs font-bold uppercase tracking-wider border border-primary/30 rounded-lg py-2 hover:bg-primary/10 transition-colors">
                        View Details
                      </a>
                    )}

                    {isUpcoming && user?.status === "ACTIVE" && (
                      <Button
                        size="sm"
                        variant={isRegistered ? "outline" : "default"}
                        className={`w-full font-bold uppercase tracking-wider ${
                          isRegistered
                            ? "border-destructive/50 text-destructive hover:bg-destructive/10"
                            : "bg-primary hover:bg-primary/90 border-primary-border shadow-[0_0_10px_rgba(255,0,0,0.2)]"
                        }`}
                        disabled={registerMutation.isPending || unregisterMutation.isPending}
                        onClick={() => {
                          if (isRegistered) {
                            unregisterMutation.mutate({ id: scrim.id });
                          } else {
                            registerMutation.mutate({ id: scrim.id });
                          }
                        }}
                      >
                        {isRegistered ? (
                          <><XCircle className="w-4 h-4 mr-2" />Unregister</>
                        ) : (
                          <><CheckCircle2 className="w-4 h-4 mr-2" />Register</>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
