import React, { Suspense, lazy } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ChakraProvider, Center, Spinner } from "@chakra-ui/react";
import { system } from "./theme";
import { AuthProvider } from "./lib/auth";
import { RequireAuth } from "./components/RequireAuth";
import Layout from "./components/Layout";

// 라우트 코드 스플리팅 — 필요한 화면만 그때그때 로드해 초기 번들을 줄인다.
const LoginPage = lazy(() => import("./pages/LoginPage"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const KeywordRadar = lazy(() => import("./tools/KeywordRadar"));
const PhotoWriter = lazy(() => import("./tools/PhotoWriter"));
const SponsorCheck = lazy(() => import("./tools/SponsorCheck"));
const History = lazy(() => import("./pages/History"));

const queryClient = new QueryClient();

const Fallback = (
  <Center h="60vh">
    <Spinner color="brand.500" />
  </Center>
);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ChakraProvider value={system}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <BrowserRouter>
            <Suspense fallback={Fallback}>
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route
                  element={
                    <RequireAuth>
                      <Layout />
                    </RequireAuth>
                  }
                >
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/keyword" element={<KeywordRadar />} />
                  <Route path="/write" element={<PhotoWriter />} />
                  <Route path="/check" element={<SponsorCheck />} />
                  <Route path="/history" element={<History />} />
                </Route>
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </AuthProvider>
      </QueryClientProvider>
    </ChakraProvider>
  </React.StrictMode>
);
