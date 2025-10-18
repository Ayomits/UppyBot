import { Card, CardContent, CardHeader, CardTitle } from "#/ui/card";

export function HomeStatCard({
  name,
  count,
}: {
  name: string;
  count: number | string;
}) {
  return (
    <Card className="w-[22.5rem] h-[8rem] py-auto gap-2 text-center">
      <CardHeader className="text-xl">
        <CardTitle>{name}</CardTitle>
      </CardHeader>
      <CardContent>
        <span>{count}</span>
      </CardContent>
    </Card>
  );
}

export function HomeStats() {
  return (
    <section className="flex items-center flex-col gap-9 max-w-[var(--max-app-width)] mx-auto">
      <h3 className="text-2xl">Немного статистики</h3>
      <div className="flex justify-center flex-wrap gap-8">
        <HomeStatCard name="Количество серверов" count={10} />
        <HomeStatCard name="Количество серверов" count={10} />
        <HomeStatCard name="Количество серверов" count={10} />
      </div>
    </section>
  );
}
