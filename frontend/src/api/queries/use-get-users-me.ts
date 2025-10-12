import { useQuery } from "@tanstack/react-query";
import { api } from "../utils/api";

export type UsersMeResponsse = {
  id: string;
  username: string;
  avatar: string | null;
  global_name: string | null;
};

export async function getUsersMe(): Promise<UsersMeResponsse> {
  const response = await api.get<UsersMeResponsse>("/api/users/@me");
  return response.data;
}

export const usersMeQueryKey = "users_me"

export function useGetUsersMe() {
  return useQuery({
    queryKey: [usersMeQueryKey],
    queryFn: getUsersMe,
  });
}
