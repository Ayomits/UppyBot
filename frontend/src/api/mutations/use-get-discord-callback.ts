import { useMutation } from "@tanstack/react-query";
import { api } from "../utils/api";

export async function postDiscordCallback(code: string) {
  return await api.get("/discord/callback", {
    params: {
      code,
    },
  });
}

export function useGetDiscordCallback() {
  return useMutation({
    mutationFn: postDiscordCallback,
  });
}
