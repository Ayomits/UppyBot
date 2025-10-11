import { useGetDiscordLoginUrl } from "../../api/queries/use-get-discord-login-url";
import { EnterIcon } from "../../icons/enter.icon";
import { Button } from "../../ui/button";
import { useDiscordLogin } from "./use-discord-login";

export function Login() {
  const discordUrlQuery = useGetDiscordLoginUrl();

  const login = useDiscordLogin();

  return (
    <Button
      loading={login.isLoading || login.isOpen}
      onClick={() => login.handle(discordUrlQuery.data?.url ?? "")}
      disabled={discordUrlQuery.isLoading}
    >
      <EnterIcon className="size-4" />
      Войти
    </Button>
  );
}
