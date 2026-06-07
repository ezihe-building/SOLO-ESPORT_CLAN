import React, { useState } from "react";
import { useLocation } from "wouter";
import { useRegister, useLogin } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ChevronLeft, Shield } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { getGetMeQueryKey } from "@workspace/api-client-react";
import artworkUrl from "@assets/Screenshot_20260607-113520~2_1780830818338.png";

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
    <div className="min-h-[100dvh] bg-[#050505] text-foreground flex flex-col max-w-[428px] mx-auto relative overflow-hidden">

      {/* ── Deep background glow ── */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-5%,rgba(180,0,0,0.22),transparent_70%)]" />
        <div className="absolute bottom-0 left-0 right-0 h-64 bg-[radial-gradient(ellipse_80%_60%_at_50%_100%,rgba(120,0,0,0.15),transparent_70%)]" />
      </div>

      {/* ── Hero artwork banner ── */}
      <div className="relative z-10 w-full select-none" style={{ height: 220, overflow: "hidden" }}>
        {/* Blurred full-bleed background */}
        <img
          src={artworkUrl}
          alt=""
          draggable={false}
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover object-center"
          style={{ filter: "blur(8px) brightness(0.35)", transform: "scale(1.1)" }}
        />
        {/* Sharp centered artwork on top */}
        <div className="absolute inset-0 flex items-center justify-center">
          <img
            src={artworkUrl}
            alt="SOLOS+ ESPORTZ"
            draggable={false}
            className="h-full w-auto object-contain animate-float"
            style={{
              filter: "drop-shadow(0 0 30px rgba(200,0,0,0.6)) drop-shadow(0 0 8px rgba(255,80,80,0.3))",
              maxWidth: "240px",
            }}
          />
        </div>
        {/* Fade bottom to blend with form */}
        <div
          className="absolute inset-x-0 bottom-0 h-24 pointer-events-none"
          style={{ background: "linear-gradient(to bottom, transparent, #050505)" }}
        />
        {/* Back button */}
        <button
          onClick={() => navigate("/")}
          className="absolute top-4 left-4 flex items-center gap-1 text-white/60 hover:text-white transition-colors z-20 backdrop-blur-sm rounded-lg px-3 py-1.5"
          style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="text-xs uppercase tracking-wider font-bold">Back</span>
        </button>
      </div>

      {/* ── Form section ── */}
      <div className="relative z-10 flex-1 flex flex-col px-5 pb-10">

        {/* Title */}
        <div className="text-center mb-6">
          <h1 className="font-heading font-bold text-3xl text-white tracking-widest">
            {mode === "register"
              ? "JOIN THE CLAN"
              : mode === "forgot"
              ? "RESET PASSWORD"
              : "MEMBER LOGIN"}
          </h1>
          <p className="text-white/40 text-xs mt-1 uppercase tracking-wider">
            {mode === "register"
              ? "Applications require clan master approval"
              : mode === "forgot"
              ? "Enter your email to reset"
              : "Welcome back, soldier"}
          </p>
        </div>

        {/* Glass form card */}
        <div
          className="rounded-2xl p-5 animate-fade-in-up"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            backdropFilter: "blur(20px)",
            boxShadow: "0 8px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)",
          }}
        >
          {mode === "forgot" ? (
            <div className="space-y-4">
              <div>
                <Label className="text-xs uppercase tracking-widest text-white/50 mb-2 block">Email</Label>
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="input-premium h-12 rounded-xl text-white placeholder:text-white/25"
                />
              </div>
              <Button
                className="w-full h-12 font-bold uppercase tracking-widest border rounded-xl text-white"
                style={{
                  background: "linear-gradient(135deg, #cc0000, #ff2200)",
                  borderColor: "rgba(255,50,0,0.4)",
                  boxShadow: "0 0 20px rgba(200,0,0,0.35)",
                }}
                disabled={isPending}
              >
                Send Reset Link
              </Button>
              <button
                onClick={() => setMode("login")}
                className="w-full text-center text-white/40 text-sm mt-2 hover:text-white/70 transition-colors"
              >
                Back to login
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label className="text-xs uppercase tracking-widest text-white/50 mb-2 block">Username</Label>
                <Input
                  placeholder="Your in-game name"
                  value={form.username}
                  onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                  className="input-premium h-12 rounded-xl text-white placeholder:text-white/25"
                  required
                />
              </div>
              <div>
                <Label className="text-xs uppercase tracking-widest text-white/50 mb-2 block">Password</Label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  className="input-premium h-12 rounded-xl text-white placeholder:text-white/25"
                  required
                />
              </div>

              {mode === "register" && (
                <div>
                  <Label className="text-xs uppercase tracking-widest text-white/50 mb-2 block">Confirm Password</Label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={form.confirmPassword}
                    onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))}
                    className="input-premium h-12 rounded-xl text-white placeholder:text-white/25"
                    required
                  />
                </div>
              )}

              {mode === "register" && (
                <div
                  className="rounded-xl p-3 flex items-start gap-2"
                  style={{
                    background: "rgba(234,179,8,0.08)",
                    border: "1px solid rgba(234,179,8,0.2)",
                  }}
                >
                  <Shield className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <p className="text-yellow-400/90 text-xs">
                    New members require approval from the Clan Master before gaining access.
                  </p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-12 font-bold uppercase tracking-widest border rounded-xl text-white transition-all duration-200"
                style={{
                  background: "linear-gradient(135deg, #cc0000, #ff2200)",
                  borderColor: "rgba(255,50,0,0.4)",
                  boxShadow: "0 0 22px rgba(200,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)",
                }}
                disabled={isPending}
              >
                {isPending
                  ? <Loader2 className="w-5 h-5 animate-spin" />
                  : mode === "register"
                  ? "Submit Application"
                  : "Login"}
              </Button>

              <div className="flex items-center justify-between text-sm pt-1">
                {mode === "login" ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setMode("forgot")}
                      className="text-white/35 hover:text-white/70 transition-colors text-xs"
                    >
                      Forgot password?
                    </button>
                    <button
                      type="button"
                      onClick={() => setMode("register")}
                      className="text-primary font-bold text-xs hover:text-red-400 transition-colors"
                    >
                      Join Clan →
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setMode("login")}
                    className="w-full text-center text-white/35 text-xs hover:text-white/60 transition-colors"
                  >
                    Already a member? <span className="text-primary font-bold">Login</span>
                  </button>
                )}
              </div>
            </form>
          )}
        </div>

        {/* Bottom brand tag */}
        <div className="flex items-center justify-center gap-2 mt-6 opacity-30">
          <div className="w-8 h-px bg-white/30" />
          <span className="text-[10px] uppercase tracking-widest text-white/50 font-bold">S²十 SOLOS+ ESPORTZ</span>
          <div className="w-8 h-px bg-white/30" />
        </div>
      </div>
    </div>
  );
}
