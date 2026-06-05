import React, { createContext, useContext } from "react";
import { useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";
import type { User } from "@workspace/api-client-react";
import { Loader2 } from "lucide-react";

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

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { data: user, isLoading, error } = useGetMe({
    query: {
      retry: false,
      queryKey: getGetMeQueryKey(),
    }
  });

  return (
    <AuthContext.Provider value={{ user: user || null, isLoading, error: error as Error | null }}>
      {isLoading ? (
        <div className="min-h-[100dvh] flex items-center justify-center bg-background text-primary">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
