import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Center,
  Heading,
  Input,
  Stack,
  Text,
} from "@chakra-ui/react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/auth";

export default function LoginPage() {
  const nav = useNavigate();
  const { session } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (session) nav("/", { replace: true });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const fn =
      mode === "login"
        ? supabase.auth.signInWithPassword({ email, password })
        : supabase.auth.signUp({ email, password });
    const { error } = await fn;
    setBusy(false);
    if (error) setError(error.message);
    else nav("/", { replace: true });
  }

  return (
    <Center minH="100vh" px={4}>
      <Box
        w="full"
        maxW="sm"
        bg="white"
        borderWidth="1px"
        rounded="xl"
        shadow="sm"
        p={8}
      >
        <Heading size="md" color="brand.600" mb={1}>
          블로그 스튜디오
        </Heading>
        <Text fontSize="sm" color="gray.500" mb={6}>
          {mode === "login" ? "로그인" : "회원가입"} 후 시작하세요
        </Text>

        <form onSubmit={submit}>
          <Stack gap={3}>
            <Input
              type="email"
              required
              placeholder="이메일"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input
              type="password"
              required
              placeholder="비밀번호"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {error && (
              <Text fontSize="sm" color="red.500">
                {error}
              </Text>
            )}
            <Button type="submit" colorPalette="brand" loading={busy} w="full">
              {mode === "login" ? "로그인" : "회원가입"}
            </Button>
          </Stack>
        </form>

        <Button
          variant="plain"
          size="sm"
          w="full"
          mt={4}
          color="gray.500"
          onClick={() => setMode(mode === "login" ? "signup" : "login")}
        >
          {mode === "login"
            ? "계정이 없으신가요? 회원가입"
            : "이미 계정이 있으신가요? 로그인"}
        </Button>
      </Box>
    </Center>
  );
}
