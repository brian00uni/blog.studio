import { Link as RouterLink } from "react-router-dom";
import {
  Badge,
  Box,
  Heading,
  SimpleGrid,
  Text,
} from "@chakra-ui/react";
import { useAuth } from "../lib/auth";

const tools = [
  {
    to: "/keyword",
    title: "키워드 레이더",
    desc: "지역·업종·카테고리로 글감과 제목 후보를 찾습니다.",
    badge: "PRO",
  },
  {
    to: "/write",
    title: "사진 글쓰기",
    desc: "사진과 키워드로 원고 초안을 잡습니다.",
    badge: "무료",
  },
  {
    to: "/check",
    title: "협찬 조건 점검",
    desc: "필수 키워드·글자수·이미지·지도 조건을 확인합니다.",
    badge: "무료",
  },
];

export default function Dashboard() {
  const { session, profile } = useAuth();
  const isPro = profile?.tier === "pro";

  return (
    <Box>
      <Box mb={8}>
        <Heading size="lg">
          안녕하세요, {session?.user.email?.split("@")[0]}님 👋
        </Heading>
        <Text mt={1} color="gray.500">
          오늘도 좋은 글 하나 만들어 볼까요?
        </Text>
      </Box>

      <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} gap={4}>
        {tools.map((t) => {
          const locked = t.badge === "PRO" && !isPro;
          const card = (
            <Box
              h="full"
              bg="white"
              borderWidth="1px"
              rounded="xl"
              p={5}
              opacity={locked ? 0.6 : 1}
              cursor={locked ? "not-allowed" : "pointer"}
              transition="all 0.15s"
              _hover={
                locked
                  ? undefined
                  : { borderColor: "brand.400", shadow: "sm" }
              }
            >
              <Box display="flex" justifyContent="space-between" mb={2}>
                <Heading size="sm">{t.title}</Heading>
                <Badge
                  colorPalette={t.badge === "PRO" ? "yellow" : "green"}
                  variant="subtle"
                >
                  {t.badge}
                </Badge>
              </Box>
              <Text fontSize="sm" color="gray.500">
                {t.desc}
              </Text>
              {locked && (
                <Text mt={3} fontSize="xs" fontWeight="medium" color="yellow.600">
                  🔒 PRO 등급에서 이용 가능
                </Text>
              )}
            </Box>
          );

          return locked ? (
            <Box key={t.to}>{card}</Box>
          ) : (
            <RouterLink key={t.to} to={t.to} style={{ textDecoration: "none" }}>
              {card}
            </RouterLink>
          );
        })}
      </SimpleGrid>
    </Box>
  );
}
