import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase, type Profile } from "./supabase";

interface AuthState {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  session: null,
  profile: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // 로그인되면 profiles 테이블에서 등급/사용량을 읽어온다.
  useEffect(() => {
    if (!session?.user) {
      setProfile(null);
      return;
    }
    supabase
      .from("profiles")
      .select("id, email, tier, daily_ai_used")
      .eq("id", session.user.id)
      .single()
      .then(({ data }) => {
        let p = (data as Profile) ?? null;
        // [개발 편의] 개발 모드에선 모든 기능을 PRO 로 언락.
        // 프로덕션 빌드(npm run build)에선 import.meta.env.DEV 가 false 라 원래 등급대로 동작.
        if (import.meta.env.DEV) {
          p = {
            id: session.user!.id,
            email: session.user!.email ?? "",
            daily_ai_used: p?.daily_ai_used ?? 0,
            tier: "pro",
          };
        }
        setProfile(p);
      });
  }, [session]);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, profile, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
