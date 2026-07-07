import { useMemo, useState } from "react";
import {
  Box,
  Heading,
  HStack,
  Input,
  SimpleGrid,
  Stack,
  Text,
  Textarea,
} from "@chakra-ui/react";

// 협찬 조건 점검 — AI 없이 클라이언트에서 즉시 계산.
export default function SponsorCheck() {
  const [text, setText] = useState("");
  const [minChars, setMinChars] = useState(1000);
  const [required, setRequired] = useState(""); // 쉼표로 구분한 필수 키워드

  const charCount = useMemo(() => text.replace(/\s/g, "").length, [text]);

  const keywords = required
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);

  const checks = [
    {
      label: `글자수 ${minChars}자 이상`,
      ok: charCount >= minChars,
      detail: `현재 ${charCount}자 (공백 제외)`,
    },
    ...keywords.map((k) => ({
      label: `필수 키워드 "${k}" 포함`,
      ok: text.includes(k),
      detail: text.includes(k) ? "포함됨" : "누락",
    })),
  ];

  return (
    <Box>
      <Heading size="lg" mb={1}>
        협찬 조건 점검
      </Heading>
      <Text mb={6} fontSize="sm" color="gray.500">
        발행 전 필수 키워드·글자수 조건을 즉시 확인하세요. (이미지·지도 항목은
        확장 예정)
      </Text>

      <SimpleGrid columns={{ base: 1, lg: 2 }} gap={6}>
        <Stack gap={3}>
          <Textarea
            placeholder="완성한 원고를 붙여넣으세요."
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={12}
          />
          <Box>
            <Text mb={1} fontSize="sm" color="gray.600">
              최소 글자수
            </Text>
            <Input
              type="number"
              value={minChars}
              onChange={(e) => setMinChars(Number(e.target.value))}
            />
          </Box>
          <Input
            placeholder="필수 키워드 (쉼표로 구분)"
            value={required}
            onChange={(e) => setRequired(e.target.value)}
          />
        </Stack>

        <Stack gap={2}>
          {checks.map((c, i) => (
            <HStack
              key={i}
              justify="space-between"
              borderWidth="1px"
              rounded="lg"
              px={4}
              py={3}
              fontSize="sm"
              borderColor={c.ok ? "green.200" : "red.200"}
              bg={c.ok ? "green.50" : "red.50"}
            >
              <Text>
                {c.ok ? "✅" : "❌"} {c.label}
              </Text>
              <Text color="gray.500">{c.detail}</Text>
            </HStack>
          ))}
        </Stack>
      </SimpleGrid>
    </Box>
  );
}
