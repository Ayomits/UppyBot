"use client";

import { useGetPublicStats } from "#/api/queries/stats/use-get-public-stats";
import { Card, CardContent, CardHeader, CardTitle } from "#/ui/card";
import { Skeleton } from "#/ui/skeleton";

export function HomeStatCard({
  name,
  count,
  loading,
}: {
  name: string;
  count?: number | string;
  loading?: boolean;
}) {
  return (
    <Card className="w-[22.5rem] h-[8rem] py-auto gap-2 text-center">
      <CardHeader className="text-xl">
        <CardTitle>{name}</CardTitle>
      </CardHeader>
      <CardContent className="flex justify-center">
        {loading ? <Skeleton className="h-4 w-24" /> : count}
      </CardContent>
    </Card>
  );
}

export function HomeStats() {
  const publicStats = useGetPublicStats();
  return (
    <section className="flex items-center flex-col gap-9 max-w-[var(--max-app-width)] mx-auto">
      <h3 className="text-2xl">Немного статистики</h3>
      <div className="flex justify-center flex-wrap gap-8">
        <HomeStatCard
          name="Количество серверов"
          count={publicStats.data?.guilds}
          loading={publicStats.isLoading}
        />
        <HomeStatCard
          name="Количество выполненных команд"
          count={publicStats.data?.commands}
          loading={publicStats.isLoading}
        />
      </div>
    </section>
  );
}
