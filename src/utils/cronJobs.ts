import cron from "node-cron";
import { RequerimentService } from "../services/requerimentService";

// Configura el cron job para ejecutar la función 'expired' cada hora (en el minuto 0 de cada hora)
cron.schedule("0 */12 * * *", async () => {
  try {
    console.log("Verificando y actualizando estados vencidos...");
    await RequerimentService.expired(); // Llama a la función para actualizar los estados
    console.log("Estados vencidos actualizados correctamente.");
  } catch (error) {
    console.error("Error al actualizar los estados vencidos:", error);
  }
});
