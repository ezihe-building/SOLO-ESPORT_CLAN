import React, { useEffect, useRef } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Trophy, ChevronRight, Swords, Star, Users, CheckCircle, Shield } from "lucide-react";
import artworkUrl from "@assets/Screenshot_20260607-113520~2_1780830818338.png";
import logoUrl from "@assets/solos-logo-clean.png";
import { HiddenAdminTrigger } from "@/components/admin-panel";

function Particles() {
  const particles = [
    { left: "10%", delay: "0s",   dur: "3.2s",  opacity: 0.6 },
    { left: "22%", delay: "0.8s", dur: "4.1s",  opacity: 0.4 },
    { left: "38%", delay: "1.4s", dur: "2.8s",  opacity: 0.7 },
    { left: "54%", delay: "0.3s", dur: "3.7s",  opacity: 0.5 },
    { left: "67%", delay: "2.1s", dur: "4.5s",  opacity: 0.4 },
    { left: "78%", delay: "1.0s", dur: "3.0s",  opacity: 0.6 },
    { left: "88%", delay: "0.5s", dur: "4.8s",  opacity: 0.3 },
    { left: "45%", delay: "1.7s", dur: "3.4s",  opacity: 0.5 },
  ];
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {particles.map((p, i) => (
        <div
          key={i}
          className="particle"
          style={{
            left: p.left,
            bottom: "20%",
            animationDelay: p.delay,
            animationDuration: p.dur,
            opacity: p.opacity,
          }}
        />
      ))}
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-[100dvh] bg-[#050505] text-foreground flex flex-col max-w-[428px] mx-auto relative overflow-x-hidden">

      {/* ── Deep background layers ── */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(180,0,0,0.18),transparent_70%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_80%_80%,rgba(120,0,0,0.10),transparent_60%)]" />
        <div className="scan-line" />
      </div>

      <Particles />

      {/* ── HERO ── Full artwork, no crop ── */}
      <header className="relative z-10 flex flex-col items-center text-center pt-8">

        {/* Artwork — full, contained, glowing */}
        <div className="relative w-full flex items-center justify-center select-none" style={{ minHeight: 320 }}>
          {/* Glow behind image */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: "radial-gradient(ellipse 70% 60% at 50% 50%, rgba(200,0,0,0.22), transparent 70%)" }}
          />
          <img
            src={artworkUrl}
            alt="SOLOS+ ESPORTZ"
            draggable={false}
            className="w-full max-w-[360px] object-contain animate-float"
            style={{
              filter: "drop-shadow(0 0 40px rgba(200,0,0,0.55)) drop-shadow(0 0 10px rgba(255,80,80,0.3))",
            }}
          />
        </div>

        {/* Live badge */}
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full border border-primary/25 text-xs font-bold uppercase tracking-widest mb-5 animate-fade-in-up delay-200">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          Recruiting Tier 1 Players
        </div>

        {/* Headline */}
        <h1 className="text-5xl font-heading font-bold leading-none mb-4 text-white px-6 animate-fade-in-up delay-300">
          ONE SQUAD.<br />ONE GOAL.<br />
          <span
            className="text-transparent bg-clip-text"
            style={{ backgroundImage: "linear-gradient(135deg,#ff2200,#ff6644)" }}
          >
            ONE LEGACY.
          </span>
        </h1>

        <p className="text-white/50 mb-8 px-8 text-sm leading-relaxed animate-fade-in-up delay-400">
          The elite competitive Call of Duty Mobile clan. Prove your worth, climb the tiers, and dominate the leaderboards.
        </p>

        {/* CTA buttons */}
        <div className="w-full flex flex-col gap-3 px-6 mb-10 animate-fade-in-up delay-500">
          <Link href="/auth?mode=register" className="w-full">
            <Button
              size="lg"
              className="w-full text-white font-bold uppercase tracking-widest h-14 text-base border"
              style={{
                background: "linear-gradient(135deg, #cc0000, #ff2200)",
                borderColor: "rgba(255,50,0,0.5)",
                boxShadow: "0 0 24px rgba(200,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)",
              }}
            >
              Join Clan <ChevronRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
          <Link href="/auth" className="w-full">
            <Button
              variant="outline"
              size="lg"
              className="w-full font-bold uppercase tracking-widest h-14 text-white transition-all duration-300"
              style={{
                background: "rgba(255,255,255,0.04)",
                borderColor: "rgba(255,255,255,0.12)",
                backdropFilter: "blur(8px)",
              }}
            >
              Member Login
            </Button>
          </Link>
        </div>
      </header>

      {/* ── CLAN STATS ── */}
      <div
        className="relative z-10 mx-6 mb-10 rounded-2xl p-5 animate-fade-in-up delay-500"
        style={{
          background: "linear-gradient(135deg, rgba(180,0,0,0.12), rgba(255,255,255,0.02))",
          border: "1px solid rgba(180,0,0,0.2)",
          boxShadow: "0 0 30px rgba(180,0,0,0.08)",
        }}
      >
        <div className="grid grid-cols-3 gap-4 text-center">
          {[
            { val: "S²十", label: "Clan Tag" },
            { val: "T1–T3", label: "Tier System" },
            { val: "CoD:M", label: "Game" },
          ].map(({ val, label }) => (
            <div key={label}>
              <div className="font-heading font-bold text-xl text-primary" style={{ textShadow: "0 0 12px rgba(255,0,0,0.5)" }}>{val}</div>
              <div className="text-[10px] text-white/40 uppercase tracking-widest mt-1">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="relative z-10 mx-6 mb-10">
        <div className="w-full h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(180,0,0,0.4), transparent)" }} />
      </div>

      {/* ── WHY JOIN ── */}
      <section className="relative z-10 px-6 mb-10">
        <h2 className="font-heading font-bold text-2xl text-white uppercase tracking-widest text-center mb-2">
          Why Join
        </h2>
        <p className="text-primary text-center font-heading font-bold text-2xl mb-6" style={{ textShadow: "0 0 16px rgba(255,0,0,0.5)" }}>
          SOLOS+ ?
        </p>
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: Trophy, title: "Tier System", desc: "Earn your rank from Tier 3 to Tier 1 through performance." },
            { icon: Swords, title: "Scrims", desc: "Weekly competitive matches against top clans." },
            { icon: Star, title: "Leaderboard", desc: "K/D, wins, and MVP counts tracked live." },
            { icon: Users, title: "Community", desc: "Active WhatsApp group and TikTok clan socials." },
          ].map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="glass-card rounded-2xl p-4 flex flex-col gap-2 transition-all duration-300 hover:border-primary/25 hover:scale-[1.02]"
              style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.3)" }}
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(200,0,0,0.15)", border: "1px solid rgba(200,0,0,0.2)" }}>
                <Icon className="w-4 h-4 text-primary" />
              </div>
              <h3 className="font-heading font-bold text-white text-sm">{title}</h3>
              <p className="text-white/45 text-xs leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── TIER SYSTEM ── */}
      <section className="relative z-10 px-6 mb-10">
        <h2 className="font-heading font-bold text-2xl text-white uppercase tracking-widest text-center mb-6">
          The <span className="text-primary">Tier</span> System
        </h2>
        <div className="space-y-3">
          {[
            { tier: "Tier 1", tag: "T1", gradStart: "rgba(234,179,8,0.12)", border: "rgba(234,179,8,0.2)", color: "#eab308", desc: "Elite. Active in every scrim, high K/D and win rate.", badge: "👑" },
            { tier: "Tier 2", tag: "T2", gradStart: "rgba(59,130,246,0.12)", border: "rgba(59,130,246,0.2)", color: "#60a5fa", desc: "Solid performers. Regular attendance and improving stats.", badge: "⚡" },
            { tier: "Tier 3", tag: "T3", gradStart: "rgba(34,197,94,0.12)", border: "rgba(34,197,94,0.2)", color: "#4ade80", desc: "New members proving themselves. Entry tier for all.", badge: "🎯" },
          ].map(({ tier, tag, gradStart, border, color, desc, badge }) => (
            <div
              key={tier}
              className="flex gap-4 items-start rounded-2xl p-4 transition-all duration-300 hover:scale-[1.01]"
              style={{
                background: `linear-gradient(135deg, ${gradStart}, rgba(255,255,255,0.02))`,
                border: `1px solid ${border}`,
                boxShadow: "0 4px 24px rgba(0,0,0,0.25)",
              }}
            >
              <div className="w-12 h-12 rounded-xl bg-black/50 flex flex-col items-center justify-center flex-shrink-0" style={{ border: `1px solid ${border}` }}>
                <span className="text-xl">{badge}</span>
                <span className="text-[10px] font-bold" style={{ color }}>{tag}</span>
              </div>
              <div>
                <h3 className="font-heading font-bold text-lg" style={{ color }}>{tier}</h3>
                <p className="text-white/45 text-xs leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW TO JOIN ── */}
      <section className="relative z-10 px-6 mb-10">
        <h2 className="font-heading font-bold text-2xl text-white uppercase tracking-widest text-center mb-6">
          How to <span className="text-primary">Join</span>
        </h2>
        <div
          className="rounded-2xl p-5 space-y-4"
          style={{
            background: "rgba(255,255,255,0.025)",
            border: "1px solid rgba(255,255,255,0.07)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
          }}
        >
          {[
            "Register with your in-game username",
            "Wait for Clan Master approval",
            "Join the WhatsApp community group",
            "Attend your first scrim session",
            "Earn your Tier placement",
          ].map((step, i) => (
            <div key={i} className="flex items-start gap-3">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 font-bold text-primary text-xs"
                style={{ background: "rgba(200,0,0,0.15)", border: "1px solid rgba(200,0,0,0.3)" }}
              >
                {i + 1}
              </div>
              <p className="text-white/75 text-sm pt-0.5">{step}</p>
            </div>
          ))}
          <Link href="/auth?mode=register" className="block pt-2">
            <Button
              className="w-full font-bold uppercase tracking-widest h-12 border text-white"
              style={{
                background: "linear-gradient(135deg, #cc0000, #ff2200)",
                borderColor: "rgba(255,50,0,0.4)",
                boxShadow: "0 0 18px rgba(200,0,0,0.35)",
              }}
            >
              Apply Now <ChevronRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* ── CLAN CODE ── */}
      <section className="relative z-10 px-6 mb-10">
        <h2 className="font-heading font-bold text-2xl text-white uppercase tracking-widest text-center mb-6">
          Clan <span className="text-primary">Code</span>
        </h2>
        <div className="space-y-2">
          {[
            "Respect every member — zero toxicity",
            "Attend scrims when called up",
            "Represent the S²十 tag with honour",
            "No stat-padding or unsportsmanlike play",
            "Communication is key — stay active",
          ].map((rule) => (
            <div
              key={rule}
              className="flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-300 hover:border-primary/20"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" style={{ filter: "drop-shadow(0 0 4px rgba(255,0,0,0.5))" }} />
              <span className="text-white/75 text-sm">{rule}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Watermark artwork between sections */}
      <div className="relative z-0 -mx-2 mb-4 select-none pointer-events-none" style={{ height: 120, overflow: "hidden" }}>
        <img
          src={artworkUrl}
          alt=""
          draggable={false}
          className="absolute inset-0 w-full h-full object-cover object-top"
          style={{ filter: "blur(2px) brightness(0.15)", transform: "scale(1.05)" }}
        />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, #050505, transparent 40%, transparent 60%, #050505)" }} />
      </div>

      {/* ── COMMUNITY LINKS ── */}
      <section className="relative z-10 px-6 mb-10 space-y-3">
        <h2 className="font-heading font-bold text-2xl text-white uppercase tracking-widest text-center mb-6">
          Community
        </h2>
        <a
          href="https://chat.whatsapp.com/JGkaBobItjVKhlpbQAvaX8?mode=gi_t"
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-between p-4 rounded-2xl transition-all duration-300 hover:scale-[1.01]"
          style={{
            background: "rgba(37,211,102,0.06)",
            border: "1px solid rgba(37,211,102,0.2)",
          }}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg" style={{ background: "rgba(37,211,102,0.12)" }}>💬</div>
            <div>
              <div className="font-bold uppercase tracking-wider text-sm text-[#25D366]">WhatsApp Community</div>
              <div className="text-[10px] text-white/35">Join the clan group</div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[#25D366]" />
        </a>
        <a
          href="https://www.tiktok.com/@solosesportz?_r=1&_t=ZS-96nBUlDDxdl"
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-between p-4 rounded-2xl transition-all duration-300 hover:scale-[1.01]"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg" style={{ background: "rgba(255,255,255,0.06)" }}>🎵</div>
            <div>
              <div className="font-bold uppercase tracking-wider text-sm text-white">TikTok @solosesportz</div>
              <div className="text-[10px] text-white/35">Clan highlights & content</div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-white/50" />
        </a>
      </section>

      {/* ── FOOTER ── */}
      <footer className="relative z-10 px-6 pb-12 flex flex-col items-center gap-4 mt-4">
        <div className="w-24 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(180,0,0,0.5), transparent)" }} />
        <img
          src={logoUrl}
          alt="SOLOS+"
          className="w-14 h-14 object-contain mix-blend-screen"
          style={{ opacity: 0.25, filter: "drop-shadow(0 0 8px rgba(255,0,0,0.3))" }}
          draggable={false}
        />
        <p className="text-center uppercase tracking-widest text-[10px]" style={{ color: "rgba(255,255,255,0.12)" }}>
          One Squad. One Goal. One Legacy.
        </p>
        {/* Tap 7× on copyright to reveal admin panel */}
        <HiddenAdminTrigger />
      </footer>
    </div>
  );
}
