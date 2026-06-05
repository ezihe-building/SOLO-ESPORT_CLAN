import React, { useState } from "react";
import { useLocation } from "wouter";
import { useRegister, useLogin } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ChevronLeft } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { getGetMeQueryKey } from "@workspace/api-client-react";
import logoUrl from "@assets/Screenshot_20260530-082032_1780652801331.png";

type Mode = "login" | "register" | "forgot";

export default function AuthPage() {
  const [mode, setMode] = useState<Mode>("login");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({ username: "", password: "", confirmPassword: "", email: "" });

  const register = useRegister({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        navigate("/home");
      },
      onError: (err: any) => {
        toast({ variant: "destructive", title: "Registration failed", description: err?.message ?? "Something went wrong" });
      },
    },
  });

  const login = useLogin({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        navigate("/home");
      },
      onError: (err: any) => {
        toast({ variant: "destructive", title: "Login failed", description: err?.message ?? "Invalid credentials" });
      },
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "register") {
      if (form.password !== form.confirmPassword) {
        toast({ variant: "destructive", title: "Passwords don't match" });
        return;
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      register.mutate({ data: { username: form.username, password: form.password } as any });
    } else if (mode === "login") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      login.mutate({ data: { username: form.username, password: form.password } as any });
    }
  };

  const isPending = register.isPending || login.isPending;

  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex flex-col max-w-[428px] mx-auto relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-20%] w-[140%] h-[50%] bg-primary/15 blur-[120px] pointer-events-none rounded-full" />

      <div className="flex-1 flex flex-col px-6 py-8 z-10">
        <button onClick={() => navigate("/")} className="flex items-center text-muted-foreground mb-8 w-fit">
          <ChevronLeft className="w-5 h-5 mr-1" />
          <span className="text-sm uppercase tracking-wider font-bold">Back</span>
        </button>

        <div className="flex flex-col items-center mb-8">
          <img src={logoUrl} alt="SOLOS+" className="w-20 h-20 rounded-2xl border border-primary/20 shadow-lg shadow-primary/20 mb-4 object-cover" />
          <h1 className="font-heading font-bold text-3xl text-white tracking-wider">
            {mode === "register" ? "JOIN THE CLAN" : mode === "forgot" ? "RESET PASSWORD" : "MEMBER LOGIN"}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {mode === "register" ? "Applications require clan master approval" : mode === "forgot" ? "Enter your email to reset" : "Welcome back, soldier"}
          </p>
        </div>

        {mode === "forgot" ? (
          <div className="space-y-4">
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-2 block">Email</Label>
              <Input
                type="email"
                placeholder="your@email.com"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="bg-card border-border h-12"
              />
            </div>
            <Button className="w-full h-12 bg-primary hover:bg-primary/90 font-bold uppercase tracking-wider" disabled={isPending}>
              Send Reset Link
            </Button>
            <button onClick={() => setMode("login")} className="w-full text-center text-muted-foreground text-sm mt-2">
              Back to login
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-2 block">Username</Label>
              <Input
                placeholder="Your in-game name"
                value={form.username}
                onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                className="bg-card border-border h-12"
                required
              />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-2 block">Password</Label>
              <Input
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                className="bg-card border-border h-12"
                required
              />
            </div>
            {mode === "register" && (
              <div>
                <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-2 block">Confirm Password</Label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={form.confirmPassword}
                  onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))}
                  className="bg-card border-border h-12"
                  required
                />
              </div>
            )}

            {mode === "register" && (
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                <p className="text-yellow-400 text-xs text-center">
                  New members require approval from the Clan Master before gaining access.
                </p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-12 bg-primary hover:bg-primary/90 font-bold uppercase tracking-wider shadow-[0_0_15px_rgba(255,0,0,0.3)] border border-primary-border"
              disabled={isPending}
            >
              {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : mode === "register" ? "Submit Application" : "Login"}
            </Button>

            <div className="flex items-center justify-between text-sm mt-2">
              {mode === "login" ? (
                <>
                  <button type="button" onClick={() => setMode("forgot")} className="text-muted-foreground hover:text-white transition-colors">
                    Forgot password?
                  </button>
                  <button type="button" onClick={() => setMode("register")} className="text-primary font-bold">
                    Join Clan →
                  </button>
                </>
              ) : (
                <button type="button" onClick={() => setMode("login")} className="w-full text-center text-muted-foreground">
                  Already a member? <span className="text-primary font-bold">Login</span>
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
