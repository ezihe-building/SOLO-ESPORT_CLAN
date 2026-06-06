import React from "react";
import { Link, useLocation } from "wouter";
import { Home, Trophy, Swords, Users, User, Lock, LogOut, RefreshCw } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import logoUrl from "@assets/solos-logo-clean.png";

async function signOut() {
  await fetch("/api/auth/logout", { method: "POST", credentials: "include" }).catch(() => {});
  window.location.href = "/";
}

export const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const [location] = useLocation();
  const { user } = useAuth();

  const navItems = [
    { icon: Home, label: "Home", href: "/home" },
    { icon: Trophy, label: "Ranks", href: "/ranks" },
    { icon: Swords, label: "Scrims", href: "/scrims" },
    { icon: Users, label: "Feed", href: "/feed" },
    { icon: User, label: "Profile", href: "/profile" },
  ];

  if (user && user.status === "PENDING") {
    return (
      <div className="min-h-[100dvh] bg-[#060606] text-foreground flex flex-col items-center justify-center p-6 text-center max-w-[428px] mx-auto">
        <img src={logoUrl} alt="SOLOS+" className="w-24 h-24 object-contain mb-6 mix-blend-screen" />
        <div className="w-16 h-16 bg-yellow-500/10 border border-yellow-500/20 rounded-full flex items-center justify-center mb-4">
          <Lock className="w-8 h-8 text-yellow-500" />
        </div>
        <h1 className="text-2xl font-heading font-bold text-white mb-3 uppercase tracking-wider">Application Pending</h1>
        <p className="text-muted-foreground mb-8 text-sm leading-relaxed max-w-xs">
          Your application is under review by the Clan Master. You'll have access once approved.
        </p>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <Button variant="outline" onClick={() => window.location.reload()}
            className="border-white/20 text-white hover:bg-white/5 h-12 font-bold uppercase tracking-wider">
            <RefreshCw className="w-4 h-4 mr-2" />Check Approval Status
          </Button>
          <Button variant="outline" onClick={signOut}
            className="border-red-800/40 text-red-400 hover:bg-red-900/20 h-12 font-bold uppercase tracking-wider">
            <LogOut className="w-4 h-4 mr-2" />Sign Out
          </Button>
        </div>
      </div>
    );
  }

  if (user && (user.status === "REJECTED" || user.status === "SUSPENDED")) {
    return (
      <div className="min-h-[100dvh] bg-[#060606] text-foreground flex flex-col items-center justify-center p-6 text-center max-w-[428px] mx-auto">
        <img src={logoUrl} alt="SOLOS+" className="w-24 h-24 object-contain mb-6 mix-blend-screen" />
        <div className="w-16 h-16 bg-destructive/10 border border-destructive/20 rounded-full flex items-center justify-center mb-4">
          <Lock className="w-8 h-8 text-destructive" />
        </div>
        <h1 className="text-2xl font-heading font-bold text-destructive mb-3 uppercase tracking-wider">
          Account {user.status === "REJECTED" ? "Rejected" : "Suspended"}
        </h1>
        <p className="text-muted-foreground mb-8 text-sm leading-relaxed max-w-xs">
          {user.status === "REJECTED"
            ? "Your application was rejected. Contact the Clan Master."
            : "Your account has been suspended. Contact the Clan Master to appeal."}
        </p>
        <Button variant="outline" onClick={signOut}
          className="border-red-800/40 text-red-400 hover:bg-red-900/20 h-12 font-bold uppercase tracking-wider w-full max-w-xs">
          <LogOut className="w-4 h-4 mr-2" />Sign Out
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#060606] text-foreground flex flex-col max-w-[428px] mx-auto relative pb-16">
      <header className="sticky top-0 z-40 bg-[#060606]/95 backdrop-blur-sm border-b border-white/5 flex items-center justify-between px-4 h-11">
        <img src={logoUrl} alt="SOLOS+" className="h-7 object-contain mix-blend-screen" />
        <span className="font-heading font-bold text-primary text-[10px] uppercase tracking-widest">SOLOS+ ESPORTZ</span>
      </header>
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
      <nav className="fixed bottom-0 left-0 right-0 max-w-[428px] mx-auto h-16 bg-[#0a0a0a] border-t border-white/8 flex items-center justify-around px-2 z-50">
        {navItems.map((item) => {
          const isActive = location === item.href || location.startsWith(`${item.href}/`);
          return (
            <Link key={item.href} href={item.href}
              className={`flex flex-col items-center justify-center w-16 h-full space-y-1 transition-colors ${isActive ? "text-primary" : "text-muted-foreground hover:text-white"}`}>
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] uppercase font-bold tracking-wider">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};
