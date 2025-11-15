import { UppyNotificationService } from "../services/uppy-notifications.service.js";
import type { Controller } from "../types/controller.js";

export const registerUppyNotificationController: Controller = (app) => {
  const service = UppyNotificationService.create();

  app.post(
    "/uppy/notifications",
    service.handleNotificationWebhook.bind(service)
  );
};
