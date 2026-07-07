import { useState } from "react";
import {
  Box,
  Button,
  Field,
  Heading,
  HStack,
  Input,
  SimpleGrid,
  Stack,
  Text,
  Textarea,
} from "@chakra-ui/react";
import { supabase } from "../lib/supabase";

type Provider = "gemini" | "claude";

const ENGINES = [
  { id: "gemini", label: "Gemini", hint: "기본·빠름" },
  { id: "claude", label: "Claude", hint: "고품질" },
] as const;

export default function PhotoWriter() {
  const [keyword, setKeyword] = useState("");
  const [photoNotes, setPhotoNotes] = useState("");
  const [tone, setTone] = useState("친근하고 정보성 있게");
  const [provider, setProvider] = useState<Provider>("gemini");
  const [result, setResult] = useState("");
  const [resultMeta, setResultMeta] = useState<{
    provider: string;
    model: string;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setBusy(true);
    setError(null);
    setResult("");
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${session?.access_token ?? ""}`,
        },
        body: JSON.stringify({ keyword, photoNotes, tone, provider }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "생성에 실패했어요.");
      setResult(data.text);
      setResultMeta({ provider: data.provider, model: data.model });
    } catch (e) {
      setError(e instanceof Error ? e.message : "알 수 없는 오류");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Box>
      <Heading size="lg" mb={1}>
        사진 글쓰기
      </Heading>
      <Text mb={6} fontSize="sm" color="gray.500">
        키워드와 사진 설명을 넣으면 네이버 블로그 초안을 만들어 드려요.
      </Text>

      <SimpleGrid columns={{ base: 1, lg: 2 }} gap={6}>
        <Stack gap={3}>
          {/* AI 엔진 선택 (기본 Gemini) */}
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
                    <Text
                      as="span"
                      ml={1.5}
                      fontSize="xs"
                      opacity={0.7}
                      fontWeight="normal"
                    >
                      {e.hint}
                    </Text>
                  </Button>
                );
              })}
            </HStack>
          </Box>

          <Field.Root required>
            <Field.Label>
              핵심 키워드 <Field.RequiredIndicator />
            </Field.Label>
            <Input
              placeholder="예: 성수동 브런치 카페"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </Field.Root>

          <Field.Root>
            <Field.Label>사진 설명</Field.Label>
            <Textarea
              placeholder="각 사진에 뭐가 담겼는지 간단히 적어주세요."
              value={photoNotes}
              onChange={(e) => setPhotoNotes(e.target.value)}
              rows={6}
            />
            <Field.HelperText>
              사진 순서대로 적으면 흐름을 더 잘 잡아줘요.
            </Field.HelperText>
          </Field.Root>

          <Field.Root>
            <Field.Label>톤</Field.Label>
            <Input value={tone} onChange={(e) => setTone(e.target.value)} />
          </Field.Root>
          <Button
            colorPalette="brand"
            loading={busy}
            loadingText="AI가 쓰는 중…"
            disabled={!keyword}
            onClick={generate}
          >
            초안 생성
          </Button>
          {error && (
            <Text fontSize="sm" color="red.500">
              {error}
            </Text>
          )}
        </Stack>

        <Box bg="white" borderWidth="1px" rounded="lg" p={4}>
          {result ? (
            <>
              <HStack justify="space-between" mb={2}>
                <Text fontSize="xs" color="gray.400">
                  {resultMeta &&
                    `${
                      resultMeta.provider === "claude" ? "Claude" : "Gemini"
                    } · ${resultMeta.model}`}
                </Text>
                <Button
                  size="xs"
                  variant="outline"
                  onClick={() => navigator.clipboard.writeText(result)}
                >
                  📋 복사
                </Button>
              </HStack>
              <Text whiteSpace="pre-wrap" fontSize="sm" lineHeight="tall">
                {result}
              </Text>
            </>
          ) : (
            <Text py={20} textAlign="center" fontSize="sm" color="gray.400">
              생성된 초안이 여기에 표시됩니다.
            </Text>
          )}
        </Box>
      </SimpleGrid>
    </Box>
  );
}
