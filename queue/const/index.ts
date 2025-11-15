export const QueueMessages = {
  remind: {
    send: "",
  },
  telegram: {
    notification: "telegram.notification",
    remind: "telegram.remind"
  },
  webhooks: {
    send: "webhooks.send",
  },
  like: {
    sync: "likes.sync",
  },
} as const;
