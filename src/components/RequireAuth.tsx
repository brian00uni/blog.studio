import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import { Center, Spinner } from "@chakra-ui/react";
import { useAuth } from "../lib/auth";

/** 로그인하지 않은 사용자를 /login 으로 보낸다. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();
  if (loading) {
    return (
      <Center h="100vh">
        <Spinner color="brand.500" />
      </Center>
    );
  }
  if (!session) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
