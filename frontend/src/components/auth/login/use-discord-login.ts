"use client";
import { useState } from "react";
import { useDiscordCallback } from "../../../api/mutations/use-get-discord-callback";
import { useAuth } from "#/providers/auth";
import { useGetDiscordLoginUrl } from "#/api/queries/use-get-discord-login-url";

export function useDiscordLogin() {
  const [isOpen, setIsOpen] = useState(false);
  const { login, isAuth, isLoading } = useAuth();
  const discordUrlQuery = useGetDiscordLoginUrl({ enabled: !isAuth });

  const mutation = useDiscordCallback();

  const handle = async () => {
    setIsOpen(true);

    try {
      const wdw = window.open(
        discordUrlQuery.data?.url,
        "newWindow",
        "width=600,height=600"
      );
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
        }, 60000);
      });

      await mutation.mutateAsync(code);
      login();
      setIsOpen(false);
    } catch (err) {
      console.error(err);
      setIsOpen(false);
    }
  };

  return {
    handle,
    isOpen,
    isLoading: mutation.isPending || isLoading,
  };
}
