import React from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Trophy, ChevronRight, Swords, Star, Users, CheckCircle } from "lucide-react";
import logoUrl from "@assets/solos-logo-clean.png";
import { HiddenAdminTrigger } from "@/components/admin-panel";

export default function LandingPage() {
  return (
    <div className="min-h-[100dvh] bg-[#060606] text-foreground flex flex-col max-w-[428px] mx-auto relative overflow-x-hidden">
      {/* Background gradient */}
      <div className="absolute top-0 left-0 right-0 h-[55vh] bg-gradient-to-b from-primary/20 via-primary/5 to-transparent pointer-events-none" />
      <div className="absolute top-[5%] left-1/2 -translate-x-1/2 w-[300px] h-[300px] bg-primary/12 blur-[100px] pointer-events-none rounded-full" />

      {/* ── HERO ── */}
      <header className="relative z-10 px-6 pt-10 flex flex-col items-center text-center">
        <div className="w-72 h-72 relative mb-2 select-none flex items-center justify-center">
          <div className="absolute inset-0 bg-primary/8 rounded-full blur-3xl" />
          <img
            src={logoUrl}
            alt="SOLOS+ ESPORTZ"
            className="w-full h-full object-contain mix-blend-screen drop-shadow-[0_0_50px_rgba(200,0,0,0.5)]"
            draggable={false}
          />
        </div>

        <div className="inline-flex items-center space-x-2 bg-primary/10 text-primary px-3 py-1 rounded-full border border-primary/20 text-xs font-bold uppercase tracking-wider mb-5">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span>Recruiting Tier 1 Players</span>
        </div>

        <h1 className="text-5xl font-heading font-bold leading-tight mb-3 text-white">
          ONE SQUAD.<br />ONE GOAL.<br /><span className="text-primary">ONE LEGACY.</span>
        </h1>
        <p className="text-muted-foreground mb-8 px-2 text-sm leading-relaxed">
          The elite competitive Call of Duty Mobile clan. Prove your worth, climb the tiers, and dominate the leaderboards.
        </p>

        <div className="w-full flex flex-col gap-3 mb-10">
          <Link href="/auth" className="w-full">
            <Button size="lg" className="w-full bg-primary hover:bg-primary/90 text-white font-bold uppercase tracking-wider h-14 text-base border border-primary/50 shadow-[0_0_20px_rgba(200,0,0,0.3)]">
              Join Clan <ChevronRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
          <Link href="/auth" className="w-full">
            <Button variant="outline" size="lg" className="w-full font-bold uppercase tracking-wider h-14 border-white/10 bg-white/5 text-white hover:bg-white/10">
              Member Login
            </Button>
          </Link>
        </div>
      </header>

      {/* ── CLAN STATS ── */}
      <div className="relative z-10 mx-6 mb-10 rounded-xl bg-primary/8 border border-primary/15 p-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          {[
            { val: "S²十", label: "Clan Tag" },
            { val: "T1–T3", label: "Tier System" },
            { val: "CoD:M", label: "Game" },
          ].map(({ val, label }) => (
            <div key={label}>
              <div className="font-heading font-bold text-xl text-primary">{val}</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── WHY JOIN ── */}
      <section className="relative z-10 px-6 mb-10">
        <h2 className="font-heading font-bold text-2xl text-white uppercase tracking-wider text-center mb-6">
          Why Join <span className="text-primary">SOLOS+</span>?
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: Trophy, title: "Tier System", desc: "Earn your rank from Tier 3 to Tier 1 through performance." },
            { icon: Swords, title: "Scrims", desc: "Weekly competitive matches against top clans." },
            { icon: Star, title: "Leaderboard", desc: "K/D, wins, and MVP counts tracked live." },
            { icon: Users, title: "Community", desc: "Active WhatsApp group and TikTok clan socials." },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-white/3 border border-white/8 rounded-xl p-4 flex flex-col gap-2">
              <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center">
                <Icon className="w-4 h-4 text-primary" />
              </div>
              <h3 className="font-heading font-bold text-white text-sm">{title}</h3>
              <p className="text-muted-foreground text-xs leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── TIER SYSTEM ── */}
      <section className="relative z-10 px-6 mb-10">
        <h2 className="font-heading font-bold text-2xl text-white uppercase tracking-wider text-center mb-6">
          The <span className="text-primary">Tier</span> System
        </h2>
        <div className="space-y-3">
          {[
            { tier: "Tier 1", tag: "T1", from: "from-yellow-500/15", border: "border-yellow-500/25", color: "text-yellow-400", desc: "Elite. Active in every scrim, high K/D and win rate.", badge: "👑" },
            { tier: "Tier 2", tag: "T2", from: "from-blue-500/15", border: "border-blue-500/25", color: "text-blue-400", desc: "Solid performers. Regular attendance and improving stats.", badge: "⚡" },
            { tier: "Tier 3", tag: "T3", from: "from-green-500/15", border: "border-green-500/25", color: "text-green-400", desc: "New members proving themselves. Entry tier for all.", badge: "🎯" },
          ].map(({ tier, tag, from, border, color, desc, badge }) => (
            <div key={tier} className={`bg-gradient-to-r ${from} to-transparent border ${border} rounded-xl p-4 flex gap-4 items-start`}>
              <div className="w-12 h-12 rounded-xl bg-black/50 flex flex-col items-center justify-center flex-shrink-0">
                <span className="text-xl">{badge}</span>
                <span className={`text-[10px] font-bold ${color}`}>{tag}</span>
              </div>
              <div>
                <h3 className={`font-heading font-bold text-lg ${color}`}>{tier}</h3>
                <p className="text-muted-foreground text-xs leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW TO JOIN ── */}
      <section className="relative z-10 px-6 mb-10">
        <h2 className="font-heading font-bold text-2xl text-white uppercase tracking-wider text-center mb-6">
          How to <span className="text-primary">Join</span>
        </h2>
        <div className="bg-white/3 border border-white/8 rounded-2xl p-5 space-y-4">
          {[
            "Register with your in-game username",
            "Wait for Clan Master approval",
            "Join the WhatsApp community group",
            "Attend your first scrim session",
            "Earn your Tier placement",
          ].map((step, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-[11px] font-bold text-primary">{i + 1}</span>
              </div>
              <p className="text-white/80 text-sm">{step}</p>
            </div>
          ))}
          <Link href="/auth" className="block">
            <Button className="w-full bg-primary hover:bg-primary/90 font-bold uppercase tracking-wider h-12 border border-primary/50 mt-2">
              Apply Now <ChevronRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* ── CLAN CODE ── */}
      <section className="relative z-10 px-6 mb-10">
        <h2 className="font-heading font-bold text-2xl text-white uppercase tracking-wider text-center mb-6">
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
            <div key={rule} className="flex items-center gap-3 bg-white/3 border border-white/8 rounded-xl px-4 py-3">
              <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
              <span className="text-white/80 text-sm">{rule}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── COMMUNITY LINKS ── */}
      <section className="relative z-10 px-6 mb-10 space-y-3">
        <h2 className="font-heading font-bold text-2xl text-white uppercase tracking-wider text-center mb-6">
          Community
        </h2>
        <a href="https://chat.whatsapp.com/JGkaBobItjVKhlpbQAvaX8?mode=gi_t" target="_blank" rel="noreferrer"
          className="flex items-center justify-between bg-[#25D366]/8 border border-[#25D366]/25 p-4 rounded-xl text-[#25D366] hover:bg-[#25D366]/15 transition-colors block">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#25D366]/15 rounded-lg flex items-center justify-center">
              <span className="text-lg">💬</span>
            </div>
            <div>
              <div className="font-bold uppercase tracking-wider text-sm">WhatsApp Community</div>
              <div className="text-[10px] opacity-70">Join the clan group</div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4" />
        </a>
        <a href="https://www.tiktok.com/@solosesportz?_r=1&_t=ZS-96nBUlDDxdl" target="_blank" rel="noreferrer"
          className="flex items-center justify-between bg-white/4 border border-white/8 p-4 rounded-xl text-white hover:bg-white/8 transition-colors block">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white/8 rounded-lg flex items-center justify-center">
              <span className="text-lg">🎵</span>
            </div>
            <div>
              <div className="font-bold uppercase tracking-wider text-sm">TikTok @solosesportz</div>
              <div className="text-[10px] opacity-50">Clan highlights & content</div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4" />
        </a>
      </section>

      {/* ── FOOTER ── */}
      <footer className="relative z-10 px-6 pb-12 flex flex-col items-center gap-4 mt-4">
        <div className="w-16 h-px bg-white/10" />
        <img src={logoUrl} alt="SOLOS+" className="w-14 h-14 object-contain mix-blend-screen opacity-30" draggable={false} />
        <p className="text-white/15 text-[11px] text-center uppercase tracking-widest">
          One Squad. One Goal. One Legacy.
        </p>
        {/* Tap 7× on copyright to reveal admin panel */}
        <HiddenAdminTrigger />
      </footer>
    </div>
  );
}
