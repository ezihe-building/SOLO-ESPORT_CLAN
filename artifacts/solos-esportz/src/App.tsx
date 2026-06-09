import React, { useEffect } from "react";
import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth";
import { initGlobalClickSound } from "@/lib/click-sound";
import NotFound from "@/pages/not-found";

import LandingPage from "@/pages/landing";
import AuthPage from "@/pages/auth";
import HomePage from "@/pages/home";
import RanksPage from "@/pages/ranks";
import ScrimsPage from "@/pages/scrims";
import FeedPage from "@/pages/feed";
import ProfilePage from "@/pages/profile";
import AdminPage from "@/pages/admin";
import PendingPage from "@/pages/pending";
import ClanGcPage from "@/pages/clan-gc";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      staleTime: 30_000,
    },
  },
});

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user } = useAuth();
  if (!user) return <Redirect to="/" />;
  if (user.status === "PENDING") return <Redirect to="/pending" />;
  return <Component />;
}

function Router() {
  const { user } = useAuth();

  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/auth" component={user ? () => user.status === "PENDING" ? <Redirect to="/pending" /> : <Redirect to="/home" /> : AuthPage} />
      <Route path="/pending" component={PendingPage} />
      <Route path="/home" component={() => <ProtectedRoute component={HomePage} />} />
      <Route path="/ranks" component={() => <ProtectedRoute component={RanksPage} />} />
      <Route path="/scrims" component={() => <ProtectedRoute component={ScrimsPage} />} />
      <Route path="/feed" component={() => <ProtectedRoute component={FeedPage} />} />
      <Route path="/profile" component={() => <ProtectedRoute component={ProfilePage} />} />
      <Route path="/admin" component={() => <ProtectedRoute component={AdminPage} />} />
      <Route path="/clan-gc" component={() => <ProtectedRoute component={ClanGcPage} />} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  useEffect(() => {
    return initGlobalClickSound();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
