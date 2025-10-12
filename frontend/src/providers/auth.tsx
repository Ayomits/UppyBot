import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  useGetUsersMe,
  type UsersMeResponsse as UsersMeResponse,
} from "../api/queries/use-get-users-me";
import { useLogout } from "#/api/mutations/use-post-logout";

type AuthContext = {
  isAuth: boolean | null;
  isLoading: boolean;
  logout: () => void;
  login: () => void;
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const user = useGetUsersMe();
  const [isAuth, setIsAuth] = useState<boolean | null>(null);

  const logoutMutation = useLogout();

  useEffect(() => {
    if (user.isLoading) {
      setIsAuth(null);
    } else if (user.data) {
      setIsAuth(true);
    } else {
      setIsAuth(false);
    }
  }, [user.data, user.isLoading, user.error]);

  function logout() {
    setIsAuth(false);
    logoutMutation.mutate();
  }

  function login() {
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
