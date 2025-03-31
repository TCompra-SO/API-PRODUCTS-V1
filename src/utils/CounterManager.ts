let updateBuffer: Record<string, Record<string, Record<string, number>>> = {};

export function queueUpdate(
  entityId: string,
  subUserId: string,
  field: string,
  newValue: number
) {
  if (!updateBuffer[entityId]) updateBuffer[entityId] = {};
  if (!updateBuffer[entityId][subUserId])
    updateBuffer[entityId][subUserId] = {};

  updateBuffer[entityId][subUserId][field] =
    (updateBuffer[entityId][subUserId][field] ?? 0) + newValue;
}

function hasUpdates() {
  return Object.values(updateBuffer).some((users) =>
    Object.values(users).some((rows) => Object.keys(rows).length > 0)
  );
}

export async function sendBatchUpdate() {
  if (!hasUpdates()) {
    return;
  }

  try {
    const response = await fetch(
      `${process.env.API_USER ?? ""}subUser/sendCounterUpdate`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateBuffer),
      }
    );
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    console.log("Actualización de contadores de subusuarios enviada");
    updateBuffer = {};
  } catch (error) {
    console.error(
      "Error al enviar actualización de contadores de subusuarios:",
      error
    );
  }
}
