import cron from "node-cron";
import { RequerimentService } from "../services/requerimentService";
import { timeNotificationNewRequirements } from "../globals";
import { getNotificationForLastCreatedRequirements } from "../services/notificationService";
import { sendBatchUpdate } from "./CounterManager";
import { OfferService } from "../services/offerService";

// Configura el cron job para ejecutar la función 'expired' cada hora (en el minuto 0 de cada hora)
cron.schedule("0 */12 * * *", async () => {
  try {
    console.log("Verificando y actualizando estados vencidos...");
    await RequerimentService.expired(); // Llama a la función para actualizar los estados
  } catch (error) {
    console.error("Error al actualizar los estados vencidos:", error);
  }
});

cron.schedule(`*/${timeNotificationNewRequirements} * * * *`, async () => {
  try {
    await getNotificationForLastCreatedRequirements();
  } catch (error) {
    console.error(
      "Error al obtener cantidad de últimos requerimientos publicados:",
      error
    );
  }
});

// Enviar actualización de contadores de subsusuarios
cron.schedule("*/5 * * * *", sendBatchUpdate);

//enviar notificaciones de Requerimientos pendientes de entrega

cron.schedule("0 0 * * *", async () => {
  try {
    await RequerimentService.sendNotifyCalificate();
  } catch (error) {
    console.error("Error al ejecutar sendNotifyCalifate Requeriment", error);
  }
});

cron.schedule("0 0 * * *", async () => {
  try {
    await OfferService.sendNotifyCalificate();
  } catch (error) {
    console.error("Error al ejecutar sendNotifyCalifate Offer", error);
  }
});
