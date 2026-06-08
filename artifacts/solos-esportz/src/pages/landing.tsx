import React, { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Trophy, ChevronRight, Swords, Star, Users, CheckCircle, ChevronLeft } from "lucide-react";
import artworkUrl from "@assets/Screenshot_20260607-113520~2_1780830818338.png";
import logoUrl from "@assets/solos-logo-clean.png";
import gameplay1Url from "@assets/IMG-20251214-WA0003_1780879715947.jpg";
import gameplay2Url from "@assets/Screenshot_20260608-014142~2_1780879735104.png";
import scrim1Url from "@assets/IMG-20260608-WA0003_1780879751655.jpg";
import scrim2Url from "@assets/IMG-20260608-WA0004_1780879751672.jpg";
import scrim3Url from "@assets/IMG-20260608-WA0002_1780879751686.jpg";
import rankUrl from "@assets/IMG-20260608-WA0006_1780879935026.jpg";
import { HiddenAdminTrigger } from "@/components/admin-panel";

function Particles() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {[10,22,38,54,67,78,88,45].map((left, i) => (
        <div key={i} className="particle" style={{
          left: `${left}%`, bottom: "15%",
          animationDelay: `${[0,0.8,1.4,0.3,2.1,1.0,0.5,1.7][i]}s`,
          animationDuration: `${[3.2,4.1,2.8,3.7,4.5,3.0,4.8,3.4][i]}s`,
          opacity: [0.6,0.4,0.7,0.5,0.4,0.6,0.3,0.5][i],
        }} />
      ))}
    </div>
  );
}

const SCRIM_SLIDES = [
  {
    img: scrim1Url,
    label: "MATCH 1 — VICTORY",
    sub: "Battle Royale • ISOLATED • 23:31:15",
    result: "#1/2",
    highlight: "Toxican 12K · TerrorOa 11K",
  },
  {
    img: scrim2Url,
    label: "MATCH 2 — VICTORY",
    sub: "Battle Royale • ISOLATED • 22:54:24",
    result: "#1/2",
    highlight: "Toxican 14K · TerrorOa 12K",
  },
  {
    img: scrim3Url,
    label: "MATCH 3 — VICTORY",
    sub: "Battle Royale • ISOLATED • 00:07:39",
    result: "#1/2",
    highlight: "Toxican 18K · RÂMBO 10K",
  },
  {
    img: rankUrl,
    label: "FINAL RANK — DOMINANT",
    sub: "SOLOS+ vs RX ESPORT • Overall",
    result: "#1",
    highlight: "S²+ Toxican 18 · TerrorOa 13",
  },
];

function ScrimSlideshow() {
  const [active, setActive] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const goTo = (idx: number) => {
    if (isAnimating) return;
    setIsAnimating(true);
    setTimeout(() => {
      setActive(idx);
      setIsAnimating(false);
    }, 200);
  };

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setActive(prev => (prev + 1) % SCRIM_SLIDES.length);
    }, 3500);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const resetTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setActive(prev => (prev + 1) % SCRIM_SLIDES.length);
    }, 3500);
  };

  const slide = SCRIM_SLIDES[active];

  return (
    <div className="relative w-full select-none">
      {/* Main slide image */}
      <div
        className="relative w-full rounded-2xl overflow-hidden"
        style={{
          border: "1px solid rgba(255,50,0,0.25)",
          boxShadow: "0 0 30px rgba(200,0,0,0.2), 0 8px 32px rgba(0,0,0,0.5)",
        }}
      >
        <img
          src={slide.img}
          alt={slide.label}
          draggable={false}
          className="w-full object-cover"
          style={{
            aspectRatio: "16/9",
            transition: "opacity 0.25s ease",
            opacity: isAnimating ? 0 : 1,
          }}
        />

        {/* Overlay gradient */}
        <div className="absolute inset-0" style={{
          background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.1) 50%, transparent 100%)"
        }} />

        {/* VICTORY badge top right */}
        <div
          className="absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-heading font-bold uppercase tracking-widest text-white"
          style={{
            background: "linear-gradient(135deg, #cc0000, #ff2200)",
            boxShadow: "0 0 14px rgba(255,0,0,0.6)",
          }}
        >
          {slide.result} WIN
        </div>

        {/* VS badge top left */}
        <div
          className="absolute top-3 left-3 px-2.5 py-1 rounded-lg text-xs font-bold text-white/90 uppercase tracking-wider"
          style={{
            background: "rgba(0,0,0,0.6)",
            border: "1px solid rgba(255,255,255,0.12)",
            backdropFilter: "blur(8px)",
          }}
        >
          S²+ vs RX
        </div>

        {/* Bottom info */}
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-3">
          <div className="font-heading font-bold text-white text-base uppercase tracking-wider leading-tight">
            {slide.label}
          </div>
          <div className="text-white/55 text-[10px] uppercase tracking-wider mt-0.5">{slide.sub}</div>
          <div className="text-primary text-xs font-bold mt-1" style={{ textShadow: "0 0 8px rgba(255,0,0,0.6)" }}>
            ⚡ {slide.highlight}
          </div>
        </div>
      </div>

      {/* Prev/Next arrows */}
      <button
        onClick={() => { goTo((active - 1 + SCRIM_SLIDES.length) % SCRIM_SLIDES.length); resetTimer(); }}
        className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 z-10"
        style={{ background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.15)", backdropFilter: "blur(6px)" }}
      >
        <ChevronLeft className="w-4 h-4 text-white" />
      </button>
      <button
        onClick={() => { goTo((active + 1) % SCRIM_SLIDES.length); resetTimer(); }}
        className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 z-10"
        style={{ background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.15)", backdropFilter: "blur(6px)" }}
      >
        <ChevronRight className="w-4 h-4 text-white" />
      </button>

      {/* Dot indicators */}
      <div className="flex items-center justify-center gap-2 mt-3">
        {SCRIM_SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => { goTo(i); resetTimer(); }}
            className="rounded-full transition-all duration-300"
            style={{
              width: i === active ? 20 : 6,
              height: 6,
              background: i === active ? "hsl(0,100%,50%)" : "rgba(255,255,255,0.2)",
              boxShadow: i === active ? "0 0 8px rgba(255,0,0,0.6)" : "none",
            }}
          />
        ))}
      </div>
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

      {/* ══════════════════════════════════════
          HERO — Artwork + CTA
      ══════════════════════════════════════ */}
      <header className="relative z-10 flex flex-col items-center text-center pt-8">

        {/* Artwork */}
        <div className="relative w-full flex items-center justify-center select-none mt-2 mb-6" style={{ minHeight: 280 }}>
          <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 70% 60% at 50% 50%, rgba(200,0,0,0.22), transparent 70%)" }} />
          <img
            src={artworkUrl}
            alt="SOLOS+ ESPORTZ"
            draggable={false}
            className="w-full max-w-[280px] aspect-square object-cover rounded-[2rem] animate-float relative z-10"
            style={{ border: "1px solid rgba(255,50,0,0.2)", boxShadow: "0 0 40px rgba(200,0,0,0.25)" }}
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
          <span className="text-transparent bg-clip-text" style={{ backgroundImage: "linear-gradient(135deg,#ff2200,#ff6644)" }}>
            ONE LEGACY.
          </span>
        </h1>

        <p className="text-white/50 mb-8 px-8 text-sm leading-relaxed animate-fade-in-up delay-400">
          The elite competitive Call of Duty Mobile clan. Prove your worth, climb the tiers, and dominate the leaderboards.
        </p>

        {/* CTA buttons */}
        <div className="w-full flex flex-col gap-3 px-6 mb-10 animate-fade-in-up delay-500">
          <Link href="/auth?mode=register" className="w-full">
            <Button size="lg" className="w-full text-white font-bold uppercase tracking-widest h-14 text-base border"
              style={{ background: "linear-gradient(135deg, #cc0000, #ff2200)", borderColor: "rgba(255,50,0,0.5)", boxShadow: "0 0 24px rgba(200,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)" }}>
              Join Clan <ChevronRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
          <Link href="/auth" className="w-full">
            <Button variant="outline" size="lg" className="w-full font-bold uppercase tracking-widest h-14 text-white transition-all duration-300"
              style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.12)", backdropFilter: "blur(8px)" }}>
              Member Login
            </Button>
          </Link>
        </div>
      </header>

      {/* ── CLAN STATS ── */}
      <div className="relative z-10 mx-6 mb-10 rounded-2xl p-5 animate-fade-in-up delay-500"
        style={{ background: "linear-gradient(135deg, rgba(180,0,0,0.12), rgba(255,255,255,0.02))", border: "1px solid rgba(180,0,0,0.2)", boxShadow: "0 0 30px rgba(180,0,0,0.08)" }}>
        <div className="grid grid-cols-3 gap-4 text-center">
          {[{ val: "S²十", label: "Clan Tag" }, { val: "T1–T3", label: "Tier System" }, { val: "CoD:M", label: "Game" }].map(({ val, label }) => (
            <div key={label}>
              <div className="font-heading font-bold text-xl text-primary" style={{ textShadow: "0 0 12px rgba(255,0,0,0.5)" }}>{val}</div>
              <div className="text-[10px] text-white/40 uppercase tracking-widest mt-1">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════
          GAMEPLAY SHOWCASE — 2 real screenshots
      ══════════════════════════════════════ */}
      <section className="relative z-10 px-6 mb-10">
        {/* Section header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(255,0,0,0.4))" }} />
          <h2 className="font-heading font-bold text-sm text-primary uppercase tracking-widest whitespace-nowrap">
            ⚔ IN-GAME ACTION
          </h2>
          <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg, rgba(255,0,0,0.4), transparent)" }} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Gameplay shot 1 */}
          <div className="relative rounded-xl overflow-hidden group"
            style={{ border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 4px 20px rgba(0,0,0,0.4)" }}>
            <img src={gameplay1Url} alt="CoD Mobile gameplay" draggable={false}
              className="w-full object-cover transition-transform duration-500 group-hover:scale-105"
              style={{ aspectRatio: "4/3" }} />
            <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)" }} />
            <div className="absolute bottom-0 left-0 right-0 px-2 pb-2">
              <div className="text-[10px] font-bold uppercase tracking-wider text-primary">Legendary</div>
              <div className="text-white text-[9px] opacity-60">Chun-Li Shadowfall</div>
            </div>
            <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[9px] font-bold text-white"
              style={{ background: "rgba(200,0,0,0.7)", backdropFilter: "blur(4px)" }}>
              CODM
            </div>
          </div>

          {/* Gameplay shot 2 */}
          <div className="relative rounded-xl overflow-hidden group"
            style={{ border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 4px 20px rgba(0,0,0,0.4)" }}>
            <img src={gameplay2Url} alt="CoD Mobile gameplay" draggable={false}
              className="w-full object-cover transition-transform duration-500 group-hover:scale-105"
              style={{ aspectRatio: "4/3" }} />
            <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)" }} />
            <div className="absolute bottom-0 left-0 right-0 px-2 pb-2">
              <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#FFD700" }}>LEGENDARY LV400</div>
              <div className="text-white text-[9px] opacity-60">Boot Camp • Oliver</div>
            </div>
            <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[9px] font-bold text-white"
              style={{ background: "rgba(200,0,0,0.7)", backdropFilter: "blur(4px)" }}>
              CODM
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          SCRIM RESULTS — SOLOS+ vs RX ESPORT
      ══════════════════════════════════════ */}
      <section className="relative z-10 px-6 mb-10">
        {/* Victory banner */}
        <div className="relative rounded-2xl overflow-hidden mb-4"
          style={{ background: "linear-gradient(135deg, rgba(200,0,0,0.2), rgba(0,0,0,0.6))", border: "1px solid rgba(200,0,0,0.35)", boxShadow: "0 0 24px rgba(200,0,0,0.15)" }}>
          <div className="px-5 py-4 flex items-center justify-between">
            <div>
              <div className="text-[10px] text-primary uppercase tracking-widest font-bold mb-0.5">Battle Report</div>
              <h2 className="font-heading font-bold text-xl text-white uppercase tracking-wider leading-tight">
                S²+ vs RX ESPORT
              </h2>
              <div className="text-white/45 text-[11px] mt-1">Battle Royale — ISOLATED</div>
            </div>
            <div className="text-right">
              <div className="font-heading font-bold text-4xl" style={{ color: "#FFD700", textShadow: "0 0 20px rgba(255,215,0,0.5)" }}>3–0</div>
              <div className="text-[10px] text-primary font-bold uppercase tracking-wider">SWEEP</div>
            </div>
          </div>
          {/* Glowing red line */}
          <div className="h-0.5 w-full" style={{ background: "linear-gradient(90deg, transparent, rgba(255,0,0,0.8), transparent)" }} />
        </div>

        {/* Slideshow */}
        <ScrimSlideshow />
      </section>

      {/* Divider */}
      <div className="relative z-10 mx-6 mb-10">
        <div className="w-full h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(180,0,0,0.4), transparent)" }} />
      </div>

      {/* ══════════════════════════════════════
          WHY JOIN
      ══════════════════════════════════════ */}
      <section className="relative z-10 px-6 mb-10">
        <h2 className="font-heading font-bold text-2xl text-white uppercase tracking-widest text-center mb-2">Why Join</h2>
        <p className="text-primary text-center font-heading font-bold text-2xl mb-6" style={{ textShadow: "0 0 16px rgba(255,0,0,0.5)" }}>SOLOS+ ?</p>
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: Trophy, title: "Tier System", desc: "Earn your rank from Tier 3 to Tier 1 through performance." },
            { icon: Swords, title: "Scrims", desc: "Weekly competitive matches against top clans." },
            { icon: Star, title: "Leaderboard", desc: "K/D, wins, and MVP counts tracked live." },
            { icon: Users, title: "Community", desc: "Active WhatsApp group and TikTok clan socials." },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="glass-card rounded-2xl p-4 flex flex-col gap-2 transition-all duration-300 hover:border-primary/25 hover:scale-[1.02]"
              style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.3)" }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(200,0,0,0.15)", border: "1px solid rgba(200,0,0,0.2)" }}>
                <Icon className="w-4 h-4 text-primary" />
              </div>
              <h3 className="font-heading font-bold text-white text-sm">{title}</h3>
              <p className="text-white/45 text-xs leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════
          TIER SYSTEM
      ══════════════════════════════════════ */}
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
            <div key={tier} className="flex gap-4 items-start rounded-2xl p-4 transition-all duration-300 hover:scale-[1.01]"
              style={{ background: `linear-gradient(135deg, ${gradStart}, rgba(255,255,255,0.02))`, border: `1px solid ${border}`, boxShadow: "0 4px 24px rgba(0,0,0,0.25)" }}>
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

      {/* ══════════════════════════════════════
          HOW TO JOIN
      ══════════════════════════════════════ */}
      <section className="relative z-10 px-6 mb-10">
        <h2 className="font-heading font-bold text-2xl text-white uppercase tracking-widest text-center mb-6">
          How to <span className="text-primary">Join</span>
        </h2>
        <div className="rounded-2xl p-5 space-y-4"
          style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", boxShadow: "0 8px 32px rgba(0,0,0,0.3)" }}>
          {["Register with your in-game username", "Wait for Clan Master approval", "Join the WhatsApp community group", "Attend your first scrim session", "Earn your Tier placement"].map((step, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 font-bold text-primary text-xs"
                style={{ background: "rgba(200,0,0,0.15)", border: "1px solid rgba(200,0,0,0.3)" }}>
                {i + 1}
              </div>
              <p className="text-white/75 text-sm pt-0.5">{step}</p>
            </div>
          ))}
          <Link href="/auth?mode=register" className="block pt-2">
            <Button className="w-full font-bold uppercase tracking-widest h-12 border text-white"
              style={{ background: "linear-gradient(135deg, #cc0000, #ff2200)", borderColor: "rgba(255,50,0,0.4)", boxShadow: "0 0 18px rgba(200,0,0,0.35)" }}>
              Apply Now <ChevronRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* ══════════════════════════════════════
          CLAN CODE
      ══════════════════════════════════════ */}
      <section className="relative z-10 px-6 mb-10">
        <h2 className="font-heading font-bold text-2xl text-white uppercase tracking-widest text-center mb-6">
          Clan <span className="text-primary">Code</span>
        </h2>
        <div className="space-y-2">
          {["Respect every member — zero toxicity", "Attend scrims when called up", "Represent the S²十 tag with honour", "No stat-padding or unsportsmanlike play", "Communication is key — stay active"].map((rule) => (
            <div key={rule} className="flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-300 hover:border-primary/20"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" style={{ filter: "drop-shadow(0 0 4px rgba(255,0,0,0.5))" }} />
              <span className="text-white/75 text-sm">{rule}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Watermark strip */}
      <div className="relative z-0 -mx-2 mb-4 select-none pointer-events-none" style={{ height: 100, overflow: "hidden" }}>
        <img src={artworkUrl} alt="" draggable={false} className="absolute inset-0 w-full h-full object-cover object-top"
          style={{ filter: "blur(3px) brightness(0.12)", transform: "scale(1.05)" }} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, #050505, transparent 40%, transparent 60%, #050505)" }} />
      </div>

      {/* ══════════════════════════════════════
          COMMUNITY LINKS
      ══════════════════════════════════════ */}
      <section className="relative z-10 px-6 mb-10 space-y-3">
        <h2 className="font-heading font-bold text-2xl text-white uppercase tracking-widest text-center mb-6">Community</h2>
        <a href="https://chat.whatsapp.com/JGkaBobItjVKhlpbQAvaX8?mode=gi_t" target="_blank" rel="noreferrer"
          className="flex items-center justify-between p-4 rounded-2xl transition-all duration-300 hover:scale-[1.01]"
          style={{ background: "rgba(37,211,102,0.06)", border: "1px solid rgba(37,211,102,0.2)" }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg" style={{ background: "rgba(37,211,102,0.12)" }}>💬</div>
            <div>
              <div className="font-bold uppercase tracking-wider text-sm text-[#25D366]">WhatsApp Community</div>
              <div className="text-[10px] text-white/35">Join the clan group</div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[#25D366]" />
        </a>
        <a href="https://www.tiktok.com/@solosesportz?_r=1&_t=ZS-96nBUlDDxdl" target="_blank" rel="noreferrer"
          className="flex items-center justify-between p-4 rounded-2xl transition-all duration-300 hover:scale-[1.01]"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
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
        <img src={logoUrl} alt="SOLOS+" className="w-14 h-14 object-contain mix-blend-screen"
          style={{ opacity: 0.25, filter: "drop-shadow(0 0 8px rgba(255,0,0,0.3))" }} draggable={false} />
        <p className="text-center uppercase tracking-widest text-[10px]" style={{ color: "rgba(255,255,255,0.12)" }}>
          One Squad. One Goal. One Legacy.
        </p>
        {/* Tap 7× on copyright to reveal admin panel */}
        <HiddenAdminTrigger />
      </footer>
    </div>
  );
}
