import { useState } from "react";
import {
  Badge,
  Box,
  Button,
  Field,
  Heading,
  HStack,
  Input,
  SimpleGrid,
  Stack,
  Text,
  Wrap,
} from "@chakra-ui/react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/auth";

type Provider = "gemini" | "claude";
interface Candidate {
  title: string;
  tags: string[];
}

const ENGINES = [
  { id: "gemini", label: "Gemini" },
  { id: "claude", label: "Claude" },
] as const;

export default function KeywordRadar() {
  const { profile } = useAuth();
  const isPro = profile?.tier === "pro";

  const [region, setRegion] = useState("");
  const [industry, setIndustry] = useState("");
  const [category, setCategory] = useState("");
  const [provider, setProvider] = useState<Provider>("gemini");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function search() {
    setBusy(true);
    setError(null);
    setCandidates([]);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const res = await fetch("/api/keywords", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${session?.access_token ?? ""}`,
        },
        body: JSON.stringify({ region, industry, category, provider }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "생성에 실패했어요.");
      setCandidates(data.candidates);
    } catch (e) {
      setError(e instanceof Error ? e.message : "알 수 없는 오류");
    } finally {
      setBusy(false);
    }
  }

  if (!isPro) {
    return (
      <Box borderWidth="1px" rounded="xl" bg="yellow.50" p={8} textAlign="center">
        <Text fontSize="lg" fontWeight="semibold" color="yellow.700">
          🔒 키워드 레이더는 PRO 등급 전용이에요
        </Text>
        <Text mt={2} fontSize="sm" color="yellow.600">
          월 구독으로 지역·업종별 글감과 제목 후보를 받아보세요.
        </Text>
      </Box>
    );
  }

  return (
    <Box>
      <Heading size="lg" mb={1}>
        키워드 레이더
      </Heading>
      <Text mb={6} fontSize="sm" color="gray.500">
        지역·업종·카테고리로 검색 유입이 잘 되는 제목·태그 후보를 찾습니다.
      </Text>

      <SimpleGrid columns={{ base: 1, lg: 2 }} gap={6}>
        <Stack gap={4}>
          <Box>
            <Text mb={1} fontSize="xs" fontWeight="medium" color="gray.500">
              AI 엔진
            </Text>
            <HStack gap={1} p={1} bg="gray.100" rounded="lg" w="fit-content">
              {ENGINES.map((e) => {
                const active = provider === e.id;
                return (
                  <Button
                    key={e.id}
                    size="sm"
                    variant={active ? "solid" : "ghost"}
                    colorPalette={active ? "brand" : "gray"}
                    onClick={() => setProvider(e.id)}
                  >
                    {e.label}
                  </Button>
                );
              })}
            </HStack>
          </Box>

          <Field.Root required>
            <Field.Label>
              지역 <Field.RequiredIndicator />
            </Field.Label>
            <Input
              placeholder="예: 성수동, 부산 서면"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
            />
          </Field.Root>
          <Field.Root required>
            <Field.Label>
              업종 <Field.RequiredIndicator />
            </Field.Label>
            <Input
              placeholder="예: 브런치 카페, 네일샵"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
            />
          </Field.Root>
          <Field.Root>
            <Field.Label>카테고리 (선택)</Field.Label>
            <Input
              placeholder="예: 맛집, 데이트, 가성비"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
          </Field.Root>

          <Button
            colorPalette="brand"
            loading={busy}
            loadingText="후보 찾는 중…"
            disabled={!region || !industry}
            onClick={search}
          >
            제목 후보 찾기
          </Button>
          {error && (
            <Text fontSize="sm" color="red.500">
              {error}
            </Text>
          )}
        </Stack>

        <Stack gap={2}>
          {candidates.length === 0 ? (
            <Box
              borderWidth="1px"
              rounded="lg"
              bg="white"
              p={8}
              textAlign="center"
              fontSize="sm"
              color="gray.400"
            >
              지역·업종을 입력하고 후보를 찾아보세요.
            </Box>
          ) : (
            candidates.map((c, i) => (
              <Box key={i} borderWidth="1px" rounded="lg" bg="white" p={4}>
                <HStack justify="space-between" align="start">
                  <Text fontWeight="medium" flex={1}>
                    {c.title}
                  </Text>
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={() => navigator.clipboard.writeText(c.title)}
                  >
                    복사
                  </Button>
                </HStack>
                {c.tags.length > 0 && (
                  <Wrap mt={2} gap={1}>
                    {c.tags.map((t, j) => (
                      <Badge key={j} colorPalette="brand" variant="subtle">
                        #{t.replace(/^#/, "")}
                      </Badge>
                    ))}
                  </Wrap>
                )}
              </Box>
            ))
          )}
        </Stack>
      </SimpleGrid>
    </Box>
  );
}
