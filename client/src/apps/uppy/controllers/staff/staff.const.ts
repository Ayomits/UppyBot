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

export const startDateValue = { hour: 0, minute: 0, second: 0, millisecond: 0 };
export const endDateValue = {
  hour: 23,
  minute: 59,
  second: 59,
  millisecond: 59,
};
