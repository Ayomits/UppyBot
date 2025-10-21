import { Button } from "#/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "#/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "#/ui/dropdown-menu";
import { DropdownMenuGroup } from "@radix-ui/react-dropdown-menu";
import { DashboardSettingsHeader } from "../_components/header";

export default function GeneralSettingsPage() {
  return (
    <div className="flex flex-col mx-auto py-[3.125rem]">
      <DashboardSettingsHeader className="text-center">
        Общие настройки
      </DashboardSettingsHeader>
      <div>
        <Card className="w-[25rem]">
          <CardHeader className="text-center">
            <CardTitle>Роли управляющих</CardTitle>
            <CardDescription>
              Роль, имеющая расширенные права в боте
            </CardDescription>
          </CardHeader>
          <CardFooter className="mx-auto">
            <DropdownMenu>
              <DropdownMenuTrigger>
                <Button variant="backgounrd-secondary">Press me</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuGroup>
                  <DropdownMenuItem>idk</DropdownMenuItem>
                  <DropdownMenuItem>idk</DropdownMenuItem>
                  <DropdownMenuItem>idk</DropdownMenuItem>
                  <DropdownMenuItem>idk</DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
