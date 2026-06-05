import React from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Shield, Crosshair, Trophy, ChevronRight } from "lucide-react";
import logoUrl from "@assets/Screenshot_20260530-082032_1780652801331.png";

export default function LandingPage() {
  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex flex-col max-w-[428px] mx-auto relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-[-20%] left-[-20%] w-[140%] h-[50%] bg-primary/20 blur-[120px] pointer-events-none rounded-full" />
      
      <header className="px-6 py-8 flex flex-col items-center z-10">
        <img src={logoUrl} alt="SOLOS+ ESPORTZ" className="w-32 h-32 rounded-2xl border border-primary/20 shadow-lg shadow-primary/20 mb-6 object-cover" />
        <div className="inline-flex items-center space-x-2 bg-primary/10 text-primary px-3 py-1 rounded-full border border-primary/20 text-xs font-bold uppercase tracking-wider mb-8">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span>Recruiting Tier 1 Players</span>
        </div>
        <h1 className="text-5xl font-heading font-bold text-center leading-tight mb-4 text-white drop-shadow-md">
          ONE SQUAD.<br/>ONE GOAL.<br/><span className="text-primary">ONE LEGACY.</span>
        </h1>
        <p className="text-muted-foreground text-center mb-8 px-4">
          The elite competitive Call of Duty Mobile clan. Prove your worth, climb the tiers, and dominate the leaderboards.
        </p>
        
        <div className="w-full flex flex-col space-y-3 px-4">
          <Link href="/auth" className="w-full">
            <Button size="lg" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold uppercase tracking-wider h-14 text-lg border border-primary-border shadow-[0_0_15px_rgba(255,0,0,0.3)]">
              Join Clan <ChevronRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
          <Link href="/auth" className="w-full">
            <Button variant="outline" size="lg" className="w-full font-bold uppercase tracking-wider h-14 border-border bg-card/50 backdrop-blur-sm text-white">
              Member Login
            </Button>
          </Link>
        </div>
      </header>
      
      <div className="flex-1 px-6 pb-12 z-10 space-y-8">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-4 flex flex-col items-center justify-center text-center">
            <Trophy className="w-8 h-8 text-primary mb-2" />
            <h3 className="font-heading font-bold text-xl text-white">Tier System</h3>
            <p className="text-xs text-muted-foreground mt-1">Climb from Tier 3 to Tier 1</p>
          </div>
          <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-4 flex flex-col items-center justify-center text-center">
            <Swords className="w-8 h-8 text-primary mb-2" />
            <h3 className="font-heading font-bold text-xl text-white">Scrims</h3>
            <p className="text-xs text-muted-foreground mt-1">Weekly competitive matches</p>
          </div>
        </div>
        
        <div className="space-y-4">
          <a href="https://chat.whatsapp.com/JGkaBobItjVKhlpbQAvaX8?mode=gi_t" target="_blank" rel="noreferrer" className="flex items-center justify-between bg-[#25D366]/10 border border-[#25D366]/30 p-4 rounded-xl text-[#25D366]">
            <div className="font-bold uppercase tracking-wider">WhatsApp Community</div>
            <ChevronRight className="w-5 h-5" />
          </a>
          <a href="https://www.tiktok.com/@solosesportz?_r=1&_t=ZS-96nBUlDDxdl" target="_blank" rel="noreferrer" className="flex items-center justify-between bg-white/5 border border-white/10 p-4 rounded-xl text-white">
            <div className="font-bold uppercase tracking-wider">TikTok @solosesportz</div>
            <ChevronRight className="w-5 h-5" />
          </a>
        </div>
      </div>
    </div>
  );
}

function Swords(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinelinejoin="round">
      <polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5" />
      <line x1="13" x2="19" y1="19" y2="13" />
      <line x1="16" x2="20" y1="16" y2="20" />
      <line x1="19" x2="21" y1="21" y2="19" />
      <polyline points="14.5 6.5 18 3 21 3 21 6 17.5 9.5" />
      <line x1="5" x2="9" y1="14" y2="18" />
      <line x1="7" x2="4" y1="17" y2="20" />
      <line x1="3" x2="5" y1="19" y2="21" />
    </svg>
  );
}
