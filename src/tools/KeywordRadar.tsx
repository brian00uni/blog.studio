import { useEffect, useMemo, useRef, useState } from "react";
import {
  Badge,
  Box,
  Button,
  Flex,
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
interface Metrics {
  attention: number;
  momentum: number;
  gap: number;
  videoFit: number;
}
interface Candidate {
  keyword: string;
  score: number;
  tags: string[];
  metrics: Metrics;
  reasons: string[];
  titles: string[];
}

const ACC = "#2ee6a6"; // 네온 민트
const BODY = "#0a0f1a"; // 전체 배경
const SIDEBAR = "#0b1322"; // 좌 사이드바 / 우 subView
const CARD = "#101c31"; // 카드
const INPUT = "#16233d"; // 입력 필드
const BORDER = "rgba(255,255,255,0.10)";
const BORDER2 = "rgba(255,255,255,0.16)";

const KEYFRAMES = `
@keyframes radarSweep { to { transform: rotate(360deg); } }
@keyframes tickerScroll { to { transform: translateX(-50%); } }
@keyframes softPulse { 0%,100%{opacity:.4} 50%{opacity:1} }
`;

const METRIC_LABELS: { key: keyof Metrics; label: string }[] = [
  { key: "attention", label: "주목도" },
  { key: "momentum", label: "상승세" },
  { key: "gap", label: "빈틈" },
  { key: "videoFit", label: "영상감" },
];

// 점수 → 레이더 좌표(높은 점수일수록 중심에 가깝게, 골든앵글 분산)
function radarPos(score: number, i: number) {
  const r = 8 + ((100 - score) / 100) * 40;
  const a = i * 137.5 * (Math.PI / 180);
  return { left: `${50 + r * Math.cos(a)}%`, top: `${50 + r * Math.sin(a)}%` };
}

export default function KeywordRadar() {
  const { profile } = useAuth();
  const isPro = profile?.tier === "pro";

  const [region, setRegion] = useState("");
  const [industry, setIndustry] = useState("");
  const [category, setCategory] = useState("");
  const [provider, setProvider] = useState<Provider>("gemini");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selected, setSelected] = useState(0);
  const [busy, setBusy] = useState(false);
  const [scan, setScan] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const sel = candidates[selected];
  const feed = useMemo(() => candidates.slice(0, 8), [candidates]);

  async function runScan() {
    setBusy(true);
    setError(null);
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
      if (!res.ok) throw new Error(data.error ?? "스캔 실패");
      setCandidates(data.candidates);
      setSelected(0);
      setScan((n) => n + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "알 수 없는 오류");
    } finally {
      setBusy(false);
    }
  }

  // 로드 시 최신 트렌드 기준 자동 스캔
  const didInit = useRef(false);
  useEffect(() => {
    if (didInit.current || !isPro) return;
    didInit.current = true;
    runScan();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPro]);

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
    <Flex direction="column" w="full" flex="1" minH={0} bg={BODY} color="gray.100">
      <style>{KEYFRAMES}</style>

      {/* ═══ 본문: 왼쪽 사이드바 | 오른쪽 컨테이너 ═══ */}
      <Flex flex="1" minH={0} direction={{ base: "column", lg: "row" }}>
        {/* ── 왼쪽: 메뉴단 (input / info) ── */}
        <Box
          w={{ base: "full", lg: "300px" }}
          flexShrink={0}
          bg={SIDEBAR}
          borderRightWidth={{ lg: "1px" }}
          borderColor={BORDER}
          overflowY="auto"
          p={5}
        >
          {/* 입력 카드 */}
          <Box
            bg={CARD}
            borderWidth="1px"
            borderColor={BORDER2}
            rounded="lg"
            p={4}
          >
            <HStack justify="space-between" mb={3}>
              <Text fontWeight="semibold">직접 조준</Text>
              <Badge bg="rgba(46,230,166,0.15)" color={ACC} fontSize="10px">
                자동 레이더
              </Badge>
            </HStack>
            <Stack gap={3}>
              <DarkField
                label="카테고리"
                placeholder="예: 맛집, 데이트"
                value={category}
                onChange={setCategory}
              />
              <DarkField
                label="지역"
                placeholder="예: 성수동, 강남"
                value={region}
                onChange={setRegion}
              />
              <DarkField
                label="중심 키워드"
                placeholder="예: 브런치 카페"
                value={industry}
                onChange={setIndustry}
              />
              <Box>
                <FieldLabel>AI 엔진</FieldLabel>
                <HStack gap={1} p={1} bg={INPUT} rounded="md" borderWidth="1px" borderColor={BORDER2}>
                  {(["gemini", "claude"] as const).map((p) => (
                    <Button
                      key={p}
                      flex={1}
                      size="xs"
                      variant={provider === p ? "solid" : "ghost"}
                      bg={provider === p ? ACC : "transparent"}
                      color={provider === p ? "#062018" : "gray.400"}
                      _hover={{ bg: provider === p ? "#25c78f" : "whiteAlpha.100" }}
                      onClick={() => setProvider(p)}
                    >
                      {p === "gemini" ? "Gemini" : "Claude"}
                    </Button>
                  ))}
                </HStack>
              </Box>
              <Button
                size="sm"
                bg={ACC}
                color="#062018"
                fontWeight="bold"
                _hover={{ bg: "#25c78f" }}
                loading={busy}
                loadingText="스캔 중"
                onClick={runScan}
              >
                조준 시작
              </Button>
              {error && (
                <Text fontSize="xs" color="red.300">
                  {error}
                </Text>
              )}
            </Stack>
          </Box>

          {/* 정보: 자동 수집 경로 */}
          <Text fontSize="xs" color="gray.500" mt={5} mb={2} fontWeight="medium">
            자동 수집 경로
          </Text>
          <Stack gap={2}>
            {[
              { name: "상승 신호", state: "흐름 반영" },
              { name: "빈틈 탐색", state: busy ? "계산 중" : "대기" },
              { name: "현장 신호", state: "반응 대기" },
              { name: "집단 레이더", state: "대기" },
            ].map((s) => (
              <HStack
                key={s.name}
                justify="space-between"
                bg={CARD}
                borderWidth="1px"
                borderColor={BORDER}
                rounded="md"
                px={3}
                py={2}
              >
                <HStack gap={2}>
                  <Box
                    w={2}
                    h={2}
                    rounded="full"
                    bg={ACC}
                    css={{ animation: "softPulse 1.6s ease-in-out infinite" }}
                  />
                  <Text fontSize="sm">{s.name}</Text>
                </HStack>
                <Text fontSize="xs" color="gray.500">
                  {s.state}
                </Text>
              </HStack>
            ))}
          </Stack>
        </Box>

        {/* ── 오른쪽: 컨테이너 (header - contents) ── */}
        <Flex direction="column" flex="1" minH={0}>
          {/* header */}
          <Flex
            align="center"
            justify="space-between"
            gap={4}
            px={5}
            py={3}
            borderBottomWidth="1px"
            borderColor={BORDER}
            flexShrink={0}
            flexWrap="wrap"
          >
            <HStack gap={2}>
              <Flex
                w={7}
                h={7}
                rounded="md"
                bg={ACC}
                color="#062018"
                align="center"
                justify="center"
                fontWeight="bold"
                fontSize="10px"
              >
                DAF
              </Flex>
              <Text fontWeight="bold">실시간 트렌드 레이더</Text>
            </HStack>
            <HStack gap={{ base: 3, md: 5 }}>
              <Stat label="MODE" value="AUTO" />
              <Stat label="LIVE" value="SYNC" accent />
              <Stat label="SCAN" value={String(scan).padStart(2, "0")} />
              <Button
                size="sm"
                bg={ACC}
                color="#062018"
                fontWeight="bold"
                _hover={{ bg: "#25c78f" }}
                loading={busy}
                loadingText="스캔 중"
                onClick={runScan}
              >
                즉시 스캔
              </Button>
            </HStack>
          </Flex>

          {/* contents: content(레이더) + subView(브리핑) */}
          <Flex flex="1" minH={0} direction={{ base: "column", xl: "row" }}>
            {/* content: 레이더 */}
            <Flex
              direction="column"
              flex="1"
              minH={0}
              overflowY="auto"
              justify="center"
              align="center"
              p={4}
            >
              <Box position="relative" w="full" maxW="440px" aspectRatio={1}>
                {[100, 66, 33].map((s) => (
                  <Box
                    key={s}
                    position="absolute"
                    top="50%"
                    left="50%"
                    w={`${s}%`}
                    h={`${s}%`}
                    transform="translate(-50%, -50%)"
                    rounded="full"
                    borderWidth="1px"
                    borderColor={BORDER}
                  />
                ))}
                <Box position="absolute" top="50%" left={0} right={0} h="1px" bg={BORDER} />
                <Box position="absolute" left="50%" top={0} bottom={0} w="1px" bg={BORDER} />
                <Box
                  position="absolute"
                  inset={0}
                  rounded="full"
                  css={{
                    background: `conic-gradient(from 0deg, transparent 0deg, ${ACC}33 40deg, transparent 70deg)`,
                    animation: "radarSweep 4s linear infinite",
                  }}
                />
                <Box
                  position="absolute"
                  top="50%"
                  left="50%"
                  transform="translate(-50%,-50%)"
                  w={3}
                  h={3}
                  rounded="full"
                  bg={ACC}
                  boxShadow={`0 0 12px ${ACC}`}
                />
                {candidates.map((c, i) => {
                  const p = radarPos(c.score, i);
                  const active = i === selected;
                  return (
                    <Box
                      key={c.keyword + i}
                      position="absolute"
                      left={p.left}
                      top={p.top}
                      transform="translate(-50%, -50%)"
                      onClick={() => setSelected(i)}
                      cursor="pointer"
                      zIndex={active ? 3 : 1}
                    >
                      <Box
                        px={2}
                        py={0.5}
                        rounded="full"
                        fontSize="10px"
                        whiteSpace="nowrap"
                        bg={active ? ACC : "rgba(46,230,166,0.12)"}
                        color={active ? "#062018" : ACC}
                        borderWidth="1px"
                        borderColor={active ? ACC : "rgba(46,230,166,0.3)"}
                        fontWeight={active ? "bold" : "normal"}
                        boxShadow={active ? `0 0 10px ${ACC}` : "none"}
                        _hover={{ bg: ACC, color: "#062018" }}
                      >
                        {c.keyword.length > 10
                          ? c.keyword.slice(0, 10) + "…"
                          : c.keyword}
                      </Box>
                    </Box>
                  );
                })}

                {candidates.length === 0 && (
                  <Flex
                    position="absolute"
                    inset={0}
                    align="center"
                    justify="center"
                    color="gray.500"
                    textAlign="center"
                    px={6}
                  >
                    <Text fontSize="sm">
                      {busy ? (
                        <>
                          <b style={{ color: ACC }}>최신 트렌드</b>를 불러오는 중…
                        </>
                      ) : (
                        <>
                          지역·중심 키워드를 넣고
                          <br />
                          <b style={{ color: ACC }}>즉시 스캔</b>을 눌러보세요.
                        </>
                      )}
                    </Text>
                  </Flex>
                )}
              </Box>

              {candidates.length > 0 && (
                <Wrap gap={2} mt={4} justify="center" maxW="640px">
                  {candidates.map((c, i) => (
                    <HStack
                      key={c.keyword + i}
                      gap={2}
                      px={3}
                      py={1}
                      rounded="full"
                      cursor="pointer"
                      onClick={() => setSelected(i)}
                      bg={i === selected ? "rgba(46,230,166,0.15)" : CARD}
                      borderWidth="1px"
                      borderColor={i === selected ? ACC : BORDER}
                    >
                      <Text fontSize="sm">{c.keyword}</Text>
                      <Text fontSize="sm" fontWeight="bold" color={ACC}>
                        {c.score}
                      </Text>
                    </HStack>
                  ))}
                </Wrap>
              )}
            </Flex>

            {/* subView: 판단 에너지 + 브리핑 */}
            <Box
              w={{ base: "full", xl: "340px" }}
              flexShrink={0}
              bg={SIDEBAR}
              borderLeftWidth={{ xl: "1px" }}
              borderTopWidth={{ base: "1px", xl: 0 }}
              borderColor={BORDER}
              overflowY="auto"
              p={4}
            >
              {sel ? (
                <Stack gap={5}>
                  <Box>
                    <Text fontSize="xs" color="gray.500">
                      선택 키워드
                    </Text>
                    <Text fontSize="lg" fontWeight="bold" color={ACC}>
                      {sel.keyword}
                    </Text>
                    {sel.reasons[0] && (
                      <Text fontSize="sm" color="gray.400" mt={1}>
                        {sel.reasons[0]}
                      </Text>
                    )}
                  </Box>

                  <HStack gap={4} align="center">
                    <Gauge score={sel.score} />
                    <SimpleGrid columns={2} gap={2} flex={1}>
                      {METRIC_LABELS.map((m) => (
                        <MetricTile
                          key={m.key}
                          label={m.label}
                          value={sel.metrics[m.key]}
                        />
                      ))}
                    </SimpleGrid>
                  </HStack>

                  <Box>
                    <HStack justify="space-between" mb={2}>
                      <Text fontSize="sm" fontWeight="medium">
                        브리핑
                      </Text>
                      <Button
                        size="2xs"
                        variant="outline"
                        borderColor={BORDER2}
                        color="gray.300"
                        onClick={() =>
                          navigator.clipboard.writeText(
                            `키워드: ${sel.keyword} (${sel.score}점)\n` +
                              sel.reasons.map((r) => `- ${r}`).join("\n")
                          )
                        }
                      >
                        복사
                      </Button>
                    </HStack>
                    <Stack gap={1.5}>
                      {sel.reasons.map((r, i) => (
                        <Text key={i} fontSize="sm" color="gray.300">
                          • {r}
                        </Text>
                      ))}
                    </Stack>
                  </Box>

                  <Box>
                    <Text fontSize="sm" fontWeight="medium" mb={2}>
                      추천 제목
                    </Text>
                    <Stack gap={2}>
                      {sel.titles.map((t, i) => (
                        <HStack
                          key={i}
                          justify="space-between"
                          bg={CARD}
                          borderWidth="1px"
                          borderColor={BORDER}
                          rounded="md"
                          px={3}
                          py={2}
                        >
                          <Text fontSize="sm" flex={1}>
                            {t}
                          </Text>
                          <Button
                            size="2xs"
                            variant="ghost"
                            color={ACC}
                            onClick={() => navigator.clipboard.writeText(t)}
                          >
                            복사
                          </Button>
                        </HStack>
                      ))}
                    </Stack>
                  </Box>

                  {sel.tags.length > 0 && (
                    <Wrap gap={1}>
                      {sel.tags.map((t, i) => (
                        <Badge key={i} bg="whiteAlpha.100" color={ACC} rounded="full">
                          #{t.replace(/^#/, "")}
                        </Badge>
                      ))}
                    </Wrap>
                  )}
                </Stack>
              ) : (
                <Flex h="full" minH="200px" align="center" justify="center" color="gray.600">
                  <Text fontSize="sm">스캔 후 키워드를 선택하세요.</Text>
                </Flex>
              )}
            </Box>
          </Flex>
        </Flex>
      </Flex>

      {/* ═══ footer: 라이브 피드 (하단 고정) ═══ */}
      <Box
        flexShrink={0}
        borderTopWidth="1px"
        borderColor={BORDER}
        bg="#070b12"
        py={2}
        overflow="hidden"
      >
        {feed.length > 0 ? (
          <HStack
            gap={8}
            minW="max-content"
            css={{ animation: "tickerScroll 22s linear infinite" }}
            px={4}
          >
            {[...feed, ...feed].map((c, i) => (
              <HStack key={i} gap={2} flexShrink={0}>
                <Text fontSize="xs" color={ACC} fontWeight="bold">
                  LIVE
                </Text>
                <Text fontSize="xs" color="gray.400">
                  {c.keyword} · 지금 쓰기 {c.score}
                </Text>
              </HStack>
            ))}
          </HStack>
        ) : (
          <Text px={4} fontSize="xs" color="gray.600">
            LIVE FEED · 스캔 대기 중
          </Text>
        )}
      </Box>
    </Flex>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <Box>
      <Text fontSize="10px" color="gray.500">
        {label}
      </Text>
      <Text fontSize="sm" fontWeight="bold" color={accent ? ACC : "gray.100"}>
        {value}
      </Text>
    </Box>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <Text fontSize="xs" color="gray.400" mb={1} fontWeight="medium">
      {children}
    </Text>
  );
}

function DarkField({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <Box>
      <FieldLabel>{label}</FieldLabel>
      <Input
        size="sm"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        bg={INPUT}
        borderColor={BORDER2}
        color="white"
        _placeholder={{ color: "gray.600" }}
        _hover={{ borderColor: "whiteAlpha.400" }}
        _focus={{ borderColor: ACC, boxShadow: `0 0 0 1px ${ACC}` }}
      />
    </Box>
  );
}

function MetricTile({ label, value }: { label: string; value: number }) {
  return (
    <Box bg={CARD} borderWidth="1px" borderColor={BORDER} rounded="md" px={2.5} py={1.5}>
      <Text fontSize="10px" color="gray.500">
        {label}
      </Text>
      <Text fontSize="lg" fontWeight="bold" lineHeight="1.1">
        {value}
      </Text>
      <Box mt={1} h="3px" bg="whiteAlpha.100" rounded="full" overflow="hidden">
        <Box h="full" w={`${value}%`} bg={ACC} rounded="full" />
      </Box>
    </Box>
  );
}

function Gauge({ score }: { score: number }) {
  const R = 40;
  const C = 2 * Math.PI * R;
  const off = C * (1 - score / 100);
  return (
    <Box position="relative" w="112px" h="112px" flexShrink={0}>
      <svg viewBox="0 0 100 100" width="112" height="112">
        <circle cx="50" cy="50" r={R} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
        <circle
          cx="50"
          cy="50"
          r={R}
          fill="none"
          stroke={ACC}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={off}
          transform="rotate(-90 50 50)"
        />
      </svg>
      <Flex position="absolute" inset={0} direction="column" align="center" justify="center">
        <Text fontSize="2xl" fontWeight="bold" lineHeight="1">
          {score}
        </Text>
        <Text fontSize="10px" color="gray.500">
          지금 쓰기
        </Text>
      </Flex>
    </Box>
  );
}
