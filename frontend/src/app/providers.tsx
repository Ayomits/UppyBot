import { AuthProvider } from "#/providers/auth";
import { ReactQueryProvider } from "#/providers/react-query";
import { type ReactNode } from "react";

export function AppProvider({ children }: { children: ReactNode }) {
  return (
    <ReactQueryProvider>
      <AuthProvider>{children}</AuthProvider>
    </ReactQueryProvider>
  );
}
