import React, { createContext, useContext } from "react";
import { useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";
import type { User } from "@workspace/api-client-react";
import { Loader2, AlertCircle } from "lucide-react";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  error: null,
});

function isUnauthorizedError(error: unknown): boolean {
  // 401 means the user is not logged in — this is normal, not a server error
  if (error && typeof error === "object" && "status" in error) {
    return (error as { status: number }).status === 401;
  }
  return false;
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { data: user, isLoading, error } = useGetMe({
    query: {
      retry: false,
      queryKey: getGetMeQueryKey(),
    }
  });

  const isAuthError = error && !isUnauthorizedError(error);

  return (
    <AuthContext.Provider value={{ user: user || null, isLoading, error: error as Error | null }}>
      {isLoading ? (
        <div className="min-h-[100dvh] flex items-center justify-center bg-background text-primary">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : isAuthError ? (
        <div className="min-h-[100dvh] flex items-center justify-center bg-background text-foreground px-6">
          <div className="text-center max-w-xs space-y-3">
            <AlertCircle className="w-10 h-10 text-destructive mx-auto" />
            <h2 className="font-heading font-bold text-white text-lg uppercase tracking-wider">Server Error</h2>
            <p className="text-muted-foreground text-sm">The server is having trouble. Please check back in a few minutes.</p>
          </div>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
