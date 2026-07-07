import { useEffect, useState } from "react";
import {
  Badge,
  Box,
  Button,
  Heading,
  HStack,
  Spinner,
  Stack,
  Text,
} from "@chakra-ui/react";
import { supabase, type Draft } from "../lib/supabase";

export default function History() {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("drafts")
      .select("id, keyword, content, provider, model, created_at")
      .order("created_at", { ascending: false });
    setDrafts((data as Draft[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function remove(id: string) {
    await supabase.from("drafts").delete().eq("id", id);
    setDrafts((d) => d.filter((x) => x.id !== id));
  }

  if (loading) {
    return (
      <HStack color="gray.400">
        <Spinner size="sm" /> <Text>불러오는 중…</Text>
      </HStack>
    );
  }

  return (
    <Box>
      <Heading size="lg" mb={1}>
        생성 히스토리
      </Heading>
      <Text mb={6} fontSize="sm" color="gray.500">
        사진 글쓰기로 만든 초안이 자동 저장됩니다. ({drafts.length}개)
      </Text>

      {drafts.length === 0 ? (
        <Box
          borderWidth="1px"
          rounded="xl"
          bg="white"
          p={8}
          textAlign="center"
          fontSize="sm"
          color="gray.400"
        >
          아직 생성한 초안이 없어요. 사진 글쓰기에서 첫 글을 만들어 보세요.
        </Box>
      ) : (
        <Stack gap={3}>
          {drafts.map((d) => {
            const open = openId === d.id;
            return (
              <Box key={d.id} borderWidth="1px" rounded="lg" bg="white" p={4}>
                <HStack justify="space-between" align="start" mb={2}>
                  <Box flex={1}>
                    <Text fontWeight="medium">
                      {d.keyword || "(키워드 없음)"}
                    </Text>
                    <HStack gap={2} mt={1}>
                      <Text fontSize="xs" color="gray.400">
                        {new Date(d.created_at).toLocaleString("ko-KR")}
                      </Text>
                      {d.provider && (
                        <Badge
                          size="sm"
                          colorPalette={
                            d.provider === "claude" ? "purple" : "blue"
                          }
                          variant="subtle"
                        >
                          {d.provider === "claude" ? "Claude" : "Gemini"}
                        </Badge>
                      )}
                    </HStack>
                  </Box>
                  <HStack gap={1}>
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() => navigator.clipboard.writeText(d.content)}
                    >
                      복사
                    </Button>
                    <Button
                      size="xs"
                      variant="ghost"
                      onClick={() => setOpenId(open ? null : d.id)}
                    >
                      {open ? "접기" : "보기"}
                    </Button>
                    <Button
                      size="xs"
                      variant="ghost"
                      colorPalette="red"
                      onClick={() => remove(d.id)}
                    >
                      삭제
                    </Button>
                  </HStack>
                </HStack>
                {open ? (
                  <Text
                    whiteSpace="pre-wrap"
                    fontSize="sm"
                    lineHeight="tall"
                    color="gray.700"
                    borderTopWidth="1px"
                    pt={3}
                  >
                    {d.content}
                  </Text>
                ) : (
                  <Text fontSize="sm" color="gray.500" lineClamp={2}>
                    {d.content}
                  </Text>
                )}
              </Box>
            );
          })}
        </Stack>
      )}
    </Box>
  );
}
