import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  Badge,
  Box,
  Button,
  Container,
  Flex,
  HStack,
  Text,
} from "@chakra-ui/react";
import { useAuth } from "../lib/auth";

// 전체 폭·전체 높이로 쓰는 풀블리드 라우트 (컨테이너 폭 제한 없음)
const FULL_BLEED = ["/keyword"];

const nav = [
  { to: "/", label: "홈", end: true },
  { to: "/keyword", label: "키워드 레이더" },
  { to: "/write", label: "사진 글쓰기" },
  { to: "/check", label: "협찬 조건 점검" },
  { to: "/history", label: "히스토리" },
];

export default function Layout() {
  const { profile, signOut } = useAuth();
  const isPro = profile?.tier === "pro";
  const { pathname } = useLocation();
  const fullBleed = FULL_BLEED.includes(pathname);

  return (
    <Flex direction="column" minH="100vh">
      <Box as="header" borderBottomWidth="1px" bg="white" position="sticky" top={0} zIndex={10}>
        <Container maxW="5xl">
          <Flex align="center" gap={{ base: 3, md: 6 }} py={3}>
            <Text
              fontSize="lg"
              fontWeight="bold"
              color="brand.600"
              flexShrink={0}
            >
              블로그 스튜디오
            </Text>

            {/* 모바일에서 항목이 넘치면 가로 스크롤 */}
            <Box flex={1} overflowX="auto" css={{ scrollbarWidth: "none" }}>
              <HStack gap={1} minW="max-content">
                {nav.map((n) => (
                  <NavLink key={n.to} to={n.to} end={n.end}>
                    {({ isActive }) => (
                      <Box
                        px={3}
                        py={1.5}
                        rounded="md"
                        fontSize="sm"
                        whiteSpace="nowrap"
                        fontWeight={isActive ? "medium" : "normal"}
                        color={isActive ? "brand.700" : "gray.600"}
                        bg={isActive ? "brand.50" : "transparent"}
                        _hover={{ bg: isActive ? "brand.50" : "gray.100" }}
                        transition="background 0.15s"
                      >
                        {n.label}
                      </Box>
                    )}
                  </NavLink>
                ))}
              </HStack>
            </Box>

            <HStack gap={2} flexShrink={0}>
              <Badge colorPalette={isPro ? "yellow" : "gray"} variant="subtle">
                {isPro ? "PRO" : "무료"}
              </Badge>
              <Button size="xs" variant="ghost" onClick={signOut}>
                로그아웃
              </Button>
            </HStack>
          </Flex>
        </Container>
      </Box>

      {fullBleed ? (
        <Flex flex="1" minH={0}>
          <Outlet />
        </Flex>
      ) : (
        <Container maxW="5xl" py={8}>
          <Outlet />
        </Container>
      )}
    </Flex>
  );
}
