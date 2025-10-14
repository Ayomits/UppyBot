export const Env = {
  ApiUrl: process.env.NEXT_PUBLIC_API_URL,
  AppEnv: process.env.APP_ENV ?? "dev",
} as const;
