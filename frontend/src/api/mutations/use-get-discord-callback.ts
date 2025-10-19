import { useMutation } from "@tanstack/react-query";
import { api } from "../utils/api";

export async function getDiscordCallback(code: string) {
  return await api.get(`/api/auth/discord/callback?code=${code}`);
}

export function useDiscordCallback() {
  return useMutation({
    mutationFn: async (code: string) => {
      await getDiscordCallback(code);
    },
  });
}
