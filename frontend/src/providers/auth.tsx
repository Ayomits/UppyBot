"use client";
import {
  createContext,
  use,
  useContext,
  useState,
  type ReactNode,
} from "react";
import {
  invalidateUser,
  useGetUsersMe,
  type UsersMeResponsse as UsersMeResponse,
} from "../api/queries/use-get-users-me";
import { useLogout } from "#/api/mutations/use-post-logout";
import { useRouter } from "next/navigation";
import { AppRoutes } from "#/const/routes";

type AuthContext = {
  isAuth: boolean | null;
  isLoading: boolean;
  logout: (withRedirect?: boolean) => void;
  login: () => Promise<void>;
  user?: UsersMeResponse;
};

const AuthContext = createContext<AuthContext | undefined>(undefined);

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("cannot use auth context within provider");
  }

  return ctx;
}

export function AuthProvider({
  children,
  defaultAuth = false,
}: {
  children: ReactNode;
  defaultAuth?: boolean;
}) {
  const [isAuth, setIsAuth] = useState<boolean>(defaultAuth);
  const user = useGetUsersMe({ enabled: isAuth });

  const logoutMutation = useLogout();

  function logout() {
    setIsAuth(false);
    logoutMutation.mutate();
  }

  async function login() {
    setIsAuth(true);
    user.refetch();
  }

  return (
    <AuthContext.Provider
      value={{
        isAuth,
        logout,
        login,
        user: user.data,
        isLoading: user.isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
