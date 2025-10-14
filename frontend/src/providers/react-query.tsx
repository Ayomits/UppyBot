"use client";
import { getQueryClient } from "#/api/utils/queryclient";
import { QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

export function ReactQueryProvider({ children }: { children: ReactNode }) {
  const qc = getQueryClient();
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}
