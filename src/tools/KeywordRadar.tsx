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

const ACC = "#fbbf24"; // 엠버 옐로우 (주색)
const ACC_D = "#f59e0b"; // 진한 엠버 (호버)
const INK = "#241a00"; // 엠버 위 텍스트
const BODY = "#0a0f1a";
const SIDEBAR = "#0b1322";
const CARD = "#101c31";
const INPUT = "#16233d";
const BORDER = "rgba(255,255,255,0.10)";
const BORDER2 = "rgba(255,255,255,0.16)";
const A = (o: number) => `rgba(251,191,36,${o})`; // 엠버 알파

const KEYFRAMES = `
@keyframes radarSweep { to { transform: rotate(360deg); } }
@keyframes tickerScroll { to { transform: translateX(-50%); } }
@keyframes softPulse { 0%,100%{opacity:.35;transform:scale(.85)} 50%{opacity:1;transform:scale(1)} }
@keyframes eqBar { 0%,100%{transform:scaleY(.35)} 50%{transform:scaleY(1)} }
`;

const METRIC_LABELS: { key: keyof Metrics; label: string }[] = [
  { key: "attention", label: "주목도" },
  { key: "momentum", label: "상승세" },
  { key: "gap", label: "빈틈" },
  { key: "videoFit", label: "영상감" },
];

// 점수 기반 반경 + 결정적 지터로 레이더 전체에 골고루 분포
function radarPos(score: number, i: number) {
  const base = 12 + ((100 - score) / 100) * 33; // 12% ~ 45%
  const jitter = ((i * 53) % 11) - 5; // -5 ~ +5 (결정적)
  const r = Math.max(7, Math.min(46, base + jitter));
  const a = i * 137.5 * (Math.PI / 180);
  return { left: `${50 + r * Math.cos(a)}%`, top: `${50 + r * Math.sin(a)}%` };
}

function signalLabel(score: number) {
  if (score >= 85) return "강한 신호";
  if (score >= 72) return "양호 신호";
  return "관망";
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
  const [lastScan, setLastScan] = useState("--:--");
  const [error, setError] = useState<string | null>(null);

  const sel = candidates[selected];
  const top = candidates[0];
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
      setLastScan(
        new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "알 수 없는 오류");
    } finally {
      setBusy(false);
    }
  }

  const didInit = useRef(false);
  useEffect(() => {
    if (didInit.current || !isPro) return;
    didInit.current = true;
    runScan();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPro]);

  function saveReport(c: Candidate) {
    const text =
      `키워드: ${c.keyword} (${c.score}점, ${signalLabel(c.score)})\n` +
      `카테고리: ${category || "전체"}\n\n` +
      `[지표]\n` +
      METRIC_LABELS.map((m) => `- ${m.label}: ${c.metrics[m.key]}`).join("\n") +
      `\n\n[왜 보이는가]\n` +
      c.reasons.map((r) => `- ${r}`).join("\n") +
      `\n\n[추천 제목]\n` +
      c.titles.map((t) => `- ${t}`).join("\n");
    const url = URL.createObjectURL(
      new Blob([text], { type: "text/plain;charset=utf-8" })
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `${c.keyword}_리포트.txt`;
    a.click();
    URL.revokeObjectURL(url);
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
    <Flex direction="column" w="100%" h="100%" flex="1" minH={0} bg={BODY} color="gray.100">
      <style>{KEYFRAMES}</style>

      <Flex flex="1" minH={0} direction={{ base: "column", lg: "row" }}>
        {/* ── 왼쪽: 흐름 / 자동 수집 경로 / 직접 조준 ── */}
        <Box
          w={{ base: "full", lg: "300px" }}
          flexShrink={0}
          bg={SIDEBAR}
          borderRightWidth={{ lg: "1px" }}
          borderColor={BORDER}
          overflowY="auto"
          p={5}
        >
          {/* 흐름 상태 카드 */}
          <Box bg={CARD} borderWidth="1px" borderColor={BORDER2} rounded="lg" p={4}>
            <Text fontSize="xs" color="gray.500">
              4시간 흐름
            </Text>
            <Text fontSize="2xl" fontWeight="bold" lineHeight="1.1">
              스캔 {scan}
            </Text>
            <Text fontSize="xs" color="gray.500" mt={1}>
              최근 흐름을 유지하며 새 변화를 감지하는 중
            </Text>
          </Box>

          {/* 자동 수집 경로 (바 차트) */}
          <Text fontSize="xs" color="gray.500" mt={5} mb={2} fontWeight="medium">
            자동 수집 경로
          </Text>
          <Stack gap={2}>
            {[
              { name: "상승 신호", state: "흐름 반영" },
              { name: "빈틈 탐색", state: busy ? "빈틈 계산 중" : "대기" },
              { name: "현장 신호", state: "반응 대기" },
              { name: "집단 레이더", state: "대기" },
            ].map((s, idx) => {
              const active = busy ? idx === 1 : idx === 0;
              return (
                <HStack
                  key={s.name}
                  justify="space-between"
                  bg={CARD}
                  borderWidth="1px"
                  borderColor={active ? ACC : BORDER}
                  rounded="md"
                  px={3}
                  py={2.5}
                >
                  <HStack gap={2.5} align="start">
                    <Box
                      mt={1}
                      w={2}
                      h={2}
                      rounded="full"
                      bg={ACC}
                      css={{ animation: `softPulse 1.6s ease-in-out ${idx * 0.2}s infinite` }}
                    />
                    <Box>
                      <Text fontSize="sm" fontWeight="medium">
                        {s.name}
                      </Text>
                      <Text fontSize="xs" color={active ? ACC : "gray.500"}>
                        {s.state}
                      </Text>
                    </Box>
                  </HStack>
                  <BarChart active={active} />
                </HStack>
              );
            })}
          </Stack>

          {/* 직접 조준 */}
          <Box
            mt={5}
            bg={CARD}
            borderWidth="1px"
            borderColor={BORDER2}
            rounded="lg"
            p={4}
          >
            <HStack justify="space-between" mb={1}>
              <Text fontWeight="semibold">직접 조준</Text>
              <Badge bg={A(0.15)} color={ACC} fontSize="10px">
                추천
              </Badge>
            </HStack>
            <Text fontSize="xs" color="gray.500" mb={3}>
              무료 자동 레이더
            </Text>
            <Stack gap={3}>
              <DarkField label="카테고리" placeholder="예: 맛집, 데이트" value={category} onChange={setCategory} />
              <DarkField label="지역 반응" placeholder="예: 성수동, 강남, 제주" value={region} onChange={setRegion} />
              <DarkField label="중심 키워드" placeholder="예: 팝업스토어, 데이트 코스" value={industry} onChange={setIndustry} />
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
                      color={provider === p ? INK : "gray.400"}
                      _hover={{ bg: provider === p ? ACC_D : "whiteAlpha.100" }}
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
                color={INK}
                fontWeight="bold"
                _hover={{ bg: ACC_D }}
                loading={busy}
                loadingText="스캔 중"
                onClick={runScan}
              >
                조준 시작
              </Button>
              <Text fontSize="10px" color="gray.600">
                무료 모드는 입력 없이 자동 갱신됩니다.
              </Text>
              {error && (
                <Text fontSize="xs" color="red.300">
                  {error}
                </Text>
              )}
            </Stack>
          </Box>
        </Box>

        {/* ── 오른쪽: 컨테이너 (header - contents) ── */}
        <Flex direction="column" flex="1" minH={0}>
          {/* header: MODE / LIVE / SCAN + 즉시 스캔 (DAF 타이틀 없음) */}
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
            <HStack gap={2.5}>
              <StatCard label="MODE" value="AUTO" />
              <StatCard label="LIVE" value="SYNC" accent />
              <StatCard label="SCAN" value={String(scan).padStart(2, "0")} />
            </HStack>
            <Button
              size="sm"
              bg={ACC}
              color={INK}
              fontWeight="bold"
              _hover={{ bg: ACC_D }}
              loading={busy}
              loadingText="스캔 중"
              onClick={runScan}
            >
              즉시 스캔
            </Button>
          </Flex>

          {/* contents: content(레이더) + subView */}
          <Flex flex="1" minH={0} direction={{ base: "column", xl: "row" }}>
            {/* content: 레이더 */}
            <Box flex="1" minH={{ base: "480px", xl: 0 }} position="relative" overflow="hidden" p={4}>
              {/* 좌상단 TOP SIGNAL / LAST SCAN */}
              {candidates.length > 0 && (
                <HStack position="absolute" top={3} left={3} gap={2} zIndex={4}>
                  <FloatCard label="TOP SIGNAL" value={top ? `${top.keyword} · ${top.score}` : "-"} />
                  <FloatCard label="LAST SCAN" value={lastScan} />
                </HStack>
              )}
              {/* 우상단 에너지 배지 */}
              {candidates.length > 0 && (
                <HStack
                  position="absolute"
                  top={3}
                  right={3}
                  zIndex={4}
                  gap={1.5}
                  bg="rgba(9,14,24,0.72)"
                  borderWidth="1px"
                  borderColor={BORDER2}
                  rounded="full"
                  px={3}
                  py={1}
                  css={{ backdropFilter: "blur(8px)" }}
                >
                  <Text color={ACC}>⚡</Text>
                  <Text fontSize="sm" fontWeight="bold">
                    {candidates.length} / 12
                  </Text>
                </HStack>
              )}

              <Flex h="full" align="center" justify="center">
                <Box position="relative" w="min(100%, 82vh)" maxW="960px" aspectRatio={1}>
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
                      background: `conic-gradient(from 0deg, transparent 0deg, ${A(0.22)} 40deg, transparent 70deg)`,
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
                          bg={active ? ACC : "rgba(10,17,30,0.9)"}
                          color={active ? INK : ACC}
                          borderWidth="1px"
                          borderColor={active ? ACC : A(0.45)}
                          fontWeight={active ? "bold" : "medium"}
                          boxShadow={
                            active
                              ? `0 0 14px ${ACC}`
                              : "0 2px 8px rgba(0,0,0,0.5)"
                          }
                          css={{ backdropFilter: "blur(2px)" }}
                          _hover={{ bg: ACC, color: INK, borderColor: ACC }}
                        >
                          {c.keyword.length > 12 ? c.keyword.slice(0, 12) + "…" : c.keyword}
                        </Box>
                      </Box>
                    );
                  })}

                  {candidates.length === 0 && (
                    <Flex position="absolute" inset={0} align="center" justify="center" color="gray.500" textAlign="center" px={6}>
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
              </Flex>

              {/* 플로팅 키워드 뱃지 */}
              {candidates.length > 0 && (
                <Box
                  position="absolute"
                  left="50%"
                  bottom={4}
                  transform="translateX(-50%)"
                  maxW="calc(100% - 32px)"
                  bg="rgba(9,14,24,0.72)"
                  borderWidth="1px"
                  borderColor={BORDER2}
                  rounded="xl"
                  boxShadow="0 8px 28px rgba(0,0,0,0.5)"
                  px={3}
                  py={2}
                  css={{ backdropFilter: "blur(10px)" }}
                >
                  <HStack gap={2} overflowX="auto" css={{ scrollbarWidth: "thin" }} maxW="100%">
                    {candidates.map((c, i) => (
                      <HStack
                        key={c.keyword + i}
                        gap={1.5}
                        px={3}
                        py={1}
                        rounded="full"
                        flexShrink={0}
                        cursor="pointer"
                        onClick={() => setSelected(i)}
                        bg={i === selected ? A(0.18) : INPUT}
                        borderWidth="1px"
                        borderColor={i === selected ? ACC : BORDER}
                        _hover={{ borderColor: ACC }}
                      >
                        <Text fontSize="sm" whiteSpace="nowrap">
                          {c.keyword}
                        </Text>
                        <Text fontSize="sm" fontWeight="bold" color={ACC}>
                          {c.score}
                        </Text>
                      </HStack>
                    ))}
                  </HStack>
                </Box>
              )}
            </Box>

            {/* subView: 섹션별 카드 */}
            <Box
              w={{ base: "full", xl: "360px" }}
              flexShrink={0}
              bg={SIDEBAR}
              borderLeftWidth={{ xl: "1px" }}
              borderTopWidth={{ base: "1px", xl: 0 }}
              borderColor={BORDER}
              overflowY="auto"
              p={4}
            >
              {sel ? (
                <Stack gap={3}>
                  {/* 선택 키워드 */}
                  <Section title="선택 키워드">
                    <Text fontSize="lg" fontWeight="bold" color={ACC}>
                      {sel.keyword}
                    </Text>
                    {sel.reasons[0] && (
                      <Text fontSize="sm" color="gray.400" mt={1}>
                        {sel.reasons[0]}
                      </Text>
                    )}
                    {sel.tags.length > 0 && (
                      <Wrap gap={1} mt={3}>
                        {sel.tags.map((t, i) => (
                          <Badge key={i} bg={INPUT} color={ACC} rounded="full">
                            #{t.replace(/^#/, "")}
                          </Badge>
                        ))}
                      </Wrap>
                    )}
                  </Section>

                  {/* 판단 에너지 */}
                  <Section
                    title="판단 에너지"
                    action={
                      <Text fontSize="xs" fontWeight="bold" color={ACC}>
                        {signalLabel(sel.score)}
                      </Text>
                    }
                  >
                    <HStack gap={4} align="center">
                      <Gauge score={sel.score} />
                      <SimpleGrid columns={2} gap={2} flex={1}>
                        {METRIC_LABELS.map((m) => (
                          <MetricTile key={m.key} label={m.label} value={sel.metrics[m.key]} />
                        ))}
                      </SimpleGrid>
                    </HStack>
                  </Section>

                  {/* 브리핑 */}
                  <Section title="브리핑">
                    <Stack gap={1} fontSize="sm">
                      <Text color="gray.400">
                        키워드: <b style={{ color: "#e5e7eb" }}>{sel.keyword}</b>
                      </Text>
                      <Text color="gray.400">
                        판정: 지금 쓰기 ({sel.score}점)
                      </Text>
                      <Text color="gray.400">카테고리: {category || "전체"}</Text>
                    </Stack>
                    <Box borderTopWidth="1px" borderColor={BORDER} my={3} />
                    <Text fontSize="xs" color="gray.500" mb={1.5} fontWeight="medium">
                      왜 보이는가
                    </Text>
                    <Stack gap={1.5}>
                      {sel.reasons.map((r, i) => (
                        <Text key={i} fontSize="sm" color="gray.300">
                          • {r}
                        </Text>
                      ))}
                    </Stack>
                    <HStack gap={2} mt={4}>
                      <Button
                        flex={1}
                        size="sm"
                        bg={ACC}
                        color={INK}
                        fontWeight="bold"
                        _hover={{ bg: ACC_D }}
                        onClick={() =>
                          navigator.clipboard.writeText(
                            `키워드: ${sel.keyword} (${sel.score}점)\n` +
                              sel.reasons.map((r) => `- ${r}`).join("\n")
                          )
                        }
                      >
                        브리핑 복사
                      </Button>
                      <Button
                        flex={1}
                        size="sm"
                        variant="outline"
                        borderColor={BORDER2}
                        color="gray.200"
                        _hover={{ bg: "whiteAlpha.100" }}
                        onClick={() => saveReport(sel)}
                      >
                        리포트 저장
                      </Button>
                    </HStack>
                  </Section>

                  {/* 추천 제목 */}
                  <Section title="추천 제목">
                    <Stack gap={2}>
                      {sel.titles.map((t, i) => (
                        <HStack
                          key={i}
                          justify="space-between"
                          bg={INPUT}
                          borderWidth="1px"
                          borderColor={BORDER}
                          rounded="md"
                          px={3}
                          py={2}
                        >
                          <Text fontSize="sm" flex={1}>
                            {t}
                          </Text>
                          <Button size="2xs" variant="ghost" color={ACC} onClick={() => navigator.clipboard.writeText(t)}>
                            복사
                          </Button>
                        </HStack>
                      ))}
                    </Stack>
                  </Section>
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
      <Box flexShrink={0} borderTopWidth="1px" borderColor={BORDER} bg="#070b12" py={2.5}>
        <HStack gap={0} align="center">
          <Text
            flexShrink={0}
            px={4}
            fontSize="xs"
            fontWeight="bold"
            color={ACC}
            letterSpacing="0.08em"
            borderRightWidth="1px"
            borderColor={BORDER}
            mr={4}
          >
            LIVE FEED
          </Text>
          <Box flex={1} overflow="hidden">
            {feed.length > 0 ? (
              <HStack gap={10} minW="max-content" css={{ animation: "tickerScroll 22s linear infinite" }}>
                {[...feed, ...feed].map((c, i) => (
                  <Text key={i} flexShrink={0} fontSize="xs" color="gray.300" fontWeight="medium">
                    {c.keyword} - 지금 쓰기 - {c.score}
                  </Text>
                ))}
              </HStack>
            ) : (
              <Text fontSize="xs" color="gray.600">
                스캔 대기 중
              </Text>
            )}
          </Box>
        </HStack>
      </Box>
    </Flex>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <Box bg={CARD} borderWidth="1px" borderColor={BORDER} rounded="md" px={3} py={1.5} minW="70px">
      <Text fontSize="10px" color="gray.500">
        {label}
      </Text>
      <Text fontSize="sm" fontWeight="bold" color={accent ? ACC : "gray.100"}>
        {value}
      </Text>
    </Box>
  );
}

function FloatCard({ label, value }: { label: string; value: string }) {
  return (
    <Box
      bg="rgba(9,14,24,0.72)"
      borderWidth="1px"
      borderColor={BORDER2}
      rounded="lg"
      px={3}
      py={1.5}
      maxW="220px"
      css={{ backdropFilter: "blur(8px)" }}
    >
      <Text fontSize="10px" color="gray.500">
        {label}
      </Text>
      <Text fontSize="xs" fontWeight="bold" css={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
        {value}
      </Text>
    </Box>
  );
}

function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Box bg={CARD} borderWidth="1px" borderColor={BORDER2} rounded="lg" p={4}>
      <HStack justify="space-between" mb={2.5}>
        <Text fontSize="xs" color="gray.500" fontWeight="medium" textTransform="uppercase" letterSpacing="0.05em">
          {title}
        </Text>
        {action}
      </HStack>
      {children}
    </Box>
  );
}

function BarChart({ active }: { active?: boolean }) {
  const bars = [45, 70, 55, 85, 65];
  return (
    <HStack gap="2px" h="24px" w="38px" align="flex-end" flexShrink={0}>
      {bars.map((h, i) => (
        <Box
          key={i}
          flex={1}
          h={`${h}%`}
          bg={active ? ACC : A(0.45)}
          rounded="1px"
          css={{
            transformOrigin: "bottom",
            animation: `eqBar 1.1s ease-in-out ${i * 0.12}s infinite`,
          }}
        />
      ))}
    </HStack>
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
    <Box bg={INPUT} borderWidth="1px" borderColor={BORDER} rounded="md" px={2.5} py={1.5}>
      <HStack justify="space-between">
        <Text fontSize="10px" color="gray.500">
          {label}
        </Text>
        <Text fontSize="10px" color={ACC}>
          ↗
        </Text>
      </HStack>
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
