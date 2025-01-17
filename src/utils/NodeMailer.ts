import nodemailer from "nodemailer";
import { PurchaseOrderI } from "../interfaces/purchaseOrder.interface";
import { OrderPurchaseTemplate } from "./OrderPurchaseTemplate";
import { PurchaseOrderService } from "../services/purchaseOrderService";
export const sendEmailPurchaseOrder = async (
  data: Omit<PurchaseOrderI, "uid">,
  emailUser: string
) => {
  const html = await OrderPurchaseTemplate(data);
  const pdfBuffer = await PurchaseOrderService.createPDF(html);

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "tcompraperu@gmail.com",
      pass: "uzof pfmc lcwz kgko",
    },
  });

  const mailOptions = {
    from: '"TCOMPRA" <tcompraperu@gmail.com>', // Cambia al correo de la empresa si es necesario
    to: emailUser,
    subject: `Se aceptó tu oferta para el requerimiento: ${data.requerimentTitle}`,
    html: `${await OrderPurchaseTemplate(data)}`,
    attachments: [
      {
        filename: `orden_de_compra_${data.userClientID}.pdf`,
        content: pdfBuffer, // Adjuntar el PDF generado
      },
    ],
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Mensaje enviado: %s", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error al enviar el correo:", error);
    return { success: false, error: error };
  }
};
