"use client";

import { EnterIcon } from "#/icons/enter.icon";
import { useAuth } from "#/providers/auth";
import { Button } from "#/ui/button";

export function Logout() {
  const { logout } = useAuth();

  const handleLogout = () => {
    logout(true);
  };

  return (
    <Button variant="icon" onClick={handleLogout}>
      <EnterIcon className="text-error size-6" />
    </Button>
  );
}
