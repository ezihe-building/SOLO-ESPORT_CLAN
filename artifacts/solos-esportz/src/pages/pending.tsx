import React from "react";
import { Link } from "wouter";
import { Clock, MessageCircle, ArrowLeft } from "lucide-react";
import { useAuth } from "@/lib/auth";

export default function PendingPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex flex-col max-w-[428px] mx-auto relative overflow-hidden">
      {/* Background */}
      <div className="absolute top-0 left-0 right-0 h-[40vh] bg-gradient-to-b from-primary/20 via-primary/5 to-transparent pointer-events-none" />
      <div className="absolute top-[10%] left-1/2 -translate-x-1/2 w-[300px] h-[300px] bg-primary/10 blur-[100px] pointer-events-none rounded-full" />

      <div className="flex-1 flex flex-col items-center justify-center px-6 z-10 text-center">
        {/* Pulsing icon */}
        <div className="w-20 h-20 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mb-6 animate-pulse">
          <Clock className="w-10 h-10 text-primary" />
        </div>

        {/* Title */}
        <h1 className="font-heading font-bold text-2xl text-white mb-2 uppercase tracking-wider">
          Application Pending
        </h1>
        <p className="text-muted-foreground text-sm max-w-[280px] leading-relaxed mb-6">
          Your application has been submitted and is currently under review by the clan management.
        </p>

        {/* Info Card */}
        <div className="bg-card/50 border border-border rounded-xl p-5 w-full space-y-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-lg">👤</span>
            </div>
            <div className="text-left">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Username</p>
              <p className="text-white font-bold text-sm">{user?.username}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center flex-shrink-0">
              <span className="text-lg">⏳</span>
            </div>
            <div className="text-left">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Status</p>
              <p className="text-yellow-400 font-bold text-sm">PENDING APPROVAL</p>
            </div>
          </div>
        </div>

        {/* WhatsApp Fast Track */}
        <div className="bg-[#25D366]/8 border border-[#25D366]/25 rounded-xl p-4 w-full mb-6">
          <div className="flex items-center gap-2 mb-2">
            <MessageCircle className="w-4 h-4 text-[#25D366]" />
            <span className="text-[#25D366] text-xs font-bold uppercase tracking-wider">Fast Track</span>
          </div>
          <p className="text-white/80 text-sm text-left mb-3">
            Want to speed up your approval? Hit up the clan programmer directly on WhatsApp.
          </p>
          <a
            href="https://wa.me/2349035659542"
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center w-full bg-[#25D366]/15 hover:bg-[#25D366]/25 border border-[#25D366]/30 rounded-lg py-2.5 text-[#25D366] font-bold text-sm transition-colors"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            WhatsApp: +234 903 565 9542
          </a>
        </div>

        <Link href="/" className="flex items-center text-muted-foreground hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          <span className="text-sm">Back to home</span>
        </Link>
      </div>
    </div>
  );
}
