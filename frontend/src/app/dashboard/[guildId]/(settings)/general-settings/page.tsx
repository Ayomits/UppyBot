"use client";
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
  DropdownMenuCheckbox,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuZone,
} from "#/ui/dropdown-menu";
import { DropdownMenuGroup } from "@radix-ui/react-dropdown-menu";
import { DashboardSettingsHeader } from "../_components/header";
import { useState } from "react";

export default function GeneralSettingsPage() {
  const [isOpen, setIsOpen] = useState(false);

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
          <CardFooter>
            <DropdownMenu modal={false} open={isOpen} onOpenChange={setIsOpen}>
              <DropdownMenuZone placeholder="Hello world" />
              <DropdownMenuContent className="w-[25rem]">
                <DropdownMenuCheckbox>idk</DropdownMenuCheckbox>
                <DropdownMenuCheckbox>idk2</DropdownMenuCheckbox>
                <DropdownMenuCheckbox>idk3</DropdownMenuCheckbox>
                <DropdownMenuCheckbox>idk4</DropdownMenuCheckbox>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
