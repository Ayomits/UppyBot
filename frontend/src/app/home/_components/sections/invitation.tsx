import { Link } from "react-router";
import { ExternalLinks } from "../../../../const/routes";
import { Button } from "../../../../ui/button";
import { InviteIcon } from "../../../../icons/invite.icon";
import { ChatIcon } from "../../../../icons/chat.icon";

export function HomeInvitation() {
  return (
    <div className="flex justify-center items-center flex-col gap-4">
      <h4 className="font-bold text-[2rem]">Вы ещё не с нами ?</h4>
      <div className="flex gap-2.5">
        <Button variant="accent" asChild>
          <Link to={ExternalLinks.InviteBot} target="_blank">
            <InviteIcon className="size-6" />
            Пригласить
          </Link>
        </Button>
        <Button asChild>
          {/* TODO: Login button */}
          <Link to={ExternalLinks.SupportServer} target="_blank">
            <ChatIcon className="size-6" />
            Сервер поддержки
          </Link>
        </Button>
      </div>
    </div>
  );
}
