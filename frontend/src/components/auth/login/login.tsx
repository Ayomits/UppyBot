import { EnterIcon } from "../../../icons/enter.icon";
import { Button, type ButtonProps } from "../../../ui/button";
import { useDiscordLogin } from "./use-discord-login";

export function Login({ loading, disabled, ...props }: ButtonProps) {
  const loginHandler = useDiscordLogin();

  return (
    <Button
      loading={loginHandler.isLoading || loginHandler.isOpen || loading}
      onClick={() => loginHandler.handle()}
      disabled={loginHandler.isLoading || disabled}
      {...props}
    >
      <EnterIcon className="size-4" />
      Войти
    </Button>
  );
}
