import { Box, Heading, Text } from "@chakra-ui/react";
import { useAuth } from "../lib/auth";

// 키워드 레이더 — PRO 전용. (다음 단계에서 검색량/트렌드 API + AI 제목 후보 구현)
export default function KeywordRadar() {
  const { profile } = useAuth();
  const isPro = profile?.tier === "pro";

  if (!isPro) {
    return (
      <Box
        borderWidth="1px"
        rounded="xl"
        bg="yellow.50"
        p={8}
        textAlign="center"
      >
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
        지역·업종·카테고리로 글감과 제목 후보를 찾습니다. (구현 예정)
      </Text>
      <Box
        borderWidth="1px"
        rounded="xl"
        bg="white"
        p={8}
        textAlign="center"
        fontSize="sm"
        color="gray.400"
      >
        다음 단계에서 검색량·트렌드 분석과 AI 제목 후보 생성을 붙일 자리예요.
      </Box>
    </Box>
  );
}
