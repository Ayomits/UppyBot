import type { NotificationUser } from "#/shared/db/models/uppy-telegram/user.model.js";

export function verifyProfileConnection(
  entry: Partial<NotificationUser> | null | undefined,
) {
  return (
    entry?.discord_user_id &&
    entry?.tokens?.access_token &&
    entry?.tokens.refresh_token &&
    entry?.tokens.expires_at
  );
}
