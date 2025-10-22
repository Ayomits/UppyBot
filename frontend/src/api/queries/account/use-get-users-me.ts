import { useQuery } from "@tanstack/react-query";
import { api } from "#/api/utils/api";

import { QueryOptions } from "../../utils/types";
import { getQueryClient } from "../../utils/queryclient";

export type UsersMeResponsse = {
  id: string;
  username: string;
  avatar: string | null;
  global_name: string | null;
};

export async function getUsersMe(): Promise<UsersMeResponsse> {
  const res = await api.get<UsersMeResponsse>("/api/users/@me");
  return await res.json() as UsersMeResponsse;
}

export const usersMeQueryKey = "users_me";

export function useGetUsersMe(options?: QueryOptions<UsersMeResponsse>) {
  return useQuery({
    queryKey: [usersMeQueryKey],
    queryFn: getUsersMe,
    ...options,
  });
}

export function invalidateUser() {
  const qc = getQueryClient();
  qc.invalidateQueries({
    queryKey: [usersMeQueryKey],
  });
}
