export const QueueMessages = {
  remind: {
    send: "",
  },
  telegram: {
    notification: "telegram.notification",
    remind: "telegram.remind",
    bumpBan: "telegram.bumpban"
  },
  webhooks: {
    send: "webhooks.send",
  },
  like: {
    sync: "likes.sync",
  },
} as const;
