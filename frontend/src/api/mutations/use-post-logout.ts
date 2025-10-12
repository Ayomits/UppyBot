import { useMutation } from "@tanstack/react-query";
import { api } from "../utils/api";

export async function postLogout() {
  return await api.post("/api/auth/logout");
}

export function useLogout() {
  return useMutation({
    mutationFn: postLogout,
  });
}
