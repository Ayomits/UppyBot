"use client"
import { useCallback, useState } from "react";
import { useDiscordCallback } from "../../../api/mutations/use-get-discord-callback";
import { useAuth } from "#/providers/auth";
import { useGetDiscordLoginUrl } from "#/api/queries/use-get-discord-login-url";

export function useDiscordLogin() {
  const [isOpen, setIsOpen] = useState(false);
  const discordUrlQuery = useGetDiscordLoginUrl();

  const { login } = useAuth();

  const mutation = useDiscordCallback();

  const handle = useCallback(
    async () => {
      setIsOpen(true);

      try {
        const wdw = window.open(discordUrlQuery.data?.url, "newWindow", "width=600,height=600");
        if (!wdw) {
          throw new Error();
        }

        const code = await new Promise<string>((resolve, reject) => {
          const checkInterval = setInterval(() => {
            try {
              if (wdw.closed) {
                clearInterval(checkInterval);
                reject(new Error());
                return;
              }

              const currentUrl = wdw.location.href;
              const urlObj = new URL(currentUrl);
              const codeParam = urlObj.searchParams.get("code");

              if (codeParam) {
                clearInterval(checkInterval);
                wdw.close();
                resolve(codeParam);
              }
              // eslint-disable-next-line no-empty
            } catch {}
          }, 500);

          setTimeout(() => {
            clearInterval(checkInterval);
            wdw.close();
            reject(new Error("Таймаут авторизации"));
          }, 60000);
        });

        setIsOpen(false);
        await mutation.mutateAsync(code);
        login();
      } catch {
        setIsOpen(false);
      }
    },
    [discordUrlQuery.data?.url, login, mutation]
  );

  return {
    handle,
    isOpen,
    isLoading: mutation.isPending || discordUrlQuery.isLoading,
  };
}
