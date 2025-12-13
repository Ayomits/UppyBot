export const QueueMessages = {
  remind: {
    send: "",
  },
  telegram: {
    notification: "telegram.notification",
    remind: "telegram.remind",
    bumpBan: "telegram.bumpban",
    server: "telegram.server",
  },
  webhooks: {
    send: "webhooks.send",
  },
  like: {
    sync: "likes.sync",
  },
  theme: {
    sync: "theme.sync",
    syncGlobal: "theme.syncGlobal",
  },
} as const;
