export const StaffCustomIds = {
  remaining: {
    buttons: {
      updaters: {
        updateRemaining: "remaining-refresh",
      },
    },
  },
  info: {
    buttons: {
      actions: {
        removeBumpBan: "info-remove-bump-ban",
      },
    },
  },
  top: {
    pagination: {
      prev: "top-prev",
      next: "top-next",
    },
  },
} as const;

export const PaginationLimit = 10;
