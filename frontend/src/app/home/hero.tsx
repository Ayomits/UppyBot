import { Link } from "react-router";
import { Button } from "../../ui/button";
import { ExternalLinks } from "../../const/routes";

export function HomeHero() {
  return (
    <section className="flex flex-col items-center gap-6 text-center font-bold">
      <div>
        <p>
          Продвигайте ваш <span className="text-accent-200">Discord</span>{" "}
          эффективно
        </p>
        <p>
          Вместе с <span className="text-accent-200">Uppy</span>
        </p>
      </div>
      <div className="flex items-center gap-2.5">
        <Button variant="accent">Пригласить</Button>
        <Button asChild>
          {/* TODO: Login button */}
          <Link to={ExternalLinks.SupportServer}>Сервер поддержки</Link>
        </Button>
      </div>
    </section>
  );
}
