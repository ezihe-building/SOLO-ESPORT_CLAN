import React from "react";
import { Link, useLocation } from "wouter";
import { Home, Trophy, Swords, Users, User, LogOut, Settings, Bell, RefreshCw, Lock } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

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

  // If pending, show pending screen
  if (user && user.status === "PENDING") {
    return (
      <div className="min-h-[100dvh] bg-background text-foreground flex flex-col items-center justify-center p-4 text-center max-w-[428px] mx-auto border-x border-border">
        <div className="w-20 h-20 bg-yellow-500/10 rounded-full flex items-center justify-center mb-6">
          <Lock className="w-10 h-10 text-yellow-500" />
        </div>
        <h1 className="text-3xl font-heading font-bold text-white mb-2">APPLICATION PENDING</h1>
        <p className="text-muted-foreground mb-8">
          Your application to join SOLOS+ is currently under review by the Clan Master. Please check back later.
        </p>
      </div>
    );
  }

  // If rejected/suspended
  if (user && (user.status === "REJECTED" || user.status === "SUSPENDED")) {
    return (
      <div className="min-h-[100dvh] bg-background text-foreground flex flex-col items-center justify-center p-4 text-center max-w-[428px] mx-auto border-x border-border">
        <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mb-6">
          <Lock className="w-10 h-10 text-destructive" />
        </div>
        <h1 className="text-3xl font-heading font-bold text-destructive mb-2">ACCOUNT {user.status}</h1>
        <p className="text-muted-foreground mb-8">
          Your account has been {user.status.toLowerCase()}. You do not have access to the clan platform.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex flex-col max-w-[428px] mx-auto border-x border-border relative pb-16 shadow-2xl shadow-primary/5">
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
      <nav className="fixed bottom-0 left-0 right-0 max-w-[428px] mx-auto h-16 bg-card border-t border-border flex items-center justify-around px-2 z-50">
        {navItems.map((item) => {
          const isActive = location === item.href || location.startsWith(`${item.href}/`);
          return (
            <Link key={item.href} href={item.href} className={`flex flex-col items-center justify-center w-16 h-full space-y-1 transition-colors ${isActive ? "text-primary" : "text-muted-foreground hover:text-white"}`}>
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] uppercase font-bold tracking-wider">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};
