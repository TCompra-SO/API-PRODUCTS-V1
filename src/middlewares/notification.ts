import { Request, Response, NextFunction } from "express";
import axios from "axios";
import { NotificationI } from "../interfaces/notification.interface";
import { NotificationAction } from "../utils/Types";

export const saveNotificationMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const originalSend = res.send.bind(res);
  let notificationSaved = false;

  res.send = function (body: any) {
    try {
      if (
        !notificationSaved &&
        res.statusCode >= 200 &&
        res.statusCode < 300 &&
        req.body.notification
      ) {
        notificationSaved = true;
        let notification: NotificationI | undefined = req.body.notification;
        const extraNotification: NotificationI | undefined =
          req.body.extraNotification;
        if (notification) {
          // Descargar orden de oferta seleccionada
          if (
            notification.action == NotificationAction.DOWNLOAD_PURCHASE_ORDER &&
            !notification.targetId
          ) {
            notification.targetId = body.res?.purchaseOrderUID;
          }
          // Cancelar 'mi' oferta seleccionada
          else if (
            notification.action == NotificationAction.VIEW_REQUIREMENT &&
            !notification.receiverId
          ) {
            notification.receiverId = body.res?.requirementSubUserUid; // creador del requerimiento
            // Se produjo una disputa al culminar
          } else if (
            (notification.action == NotificationAction.VIEW_OFFER ||
              notification.action == NotificationAction.VIEW_REQUIREMENT) &&
            body.res?.dispute
          ) {
            if (extraNotification) notification = extraNotification;
            else notification = undefined;
          }
          if (notification?.targetId && notification?.receiverId)
            axios.post(
              `${process.env.API_USER}notification/send`,
              notification
            );
        }
      }
    } catch (e) {
      console.log("Error al enviar notificación", e);
    }

    return originalSend(body);
  };

  next();
};
