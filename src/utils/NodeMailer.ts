import nodemailer from "nodemailer";
import { PurchaseOrderI } from "../interfaces/purchaseOrder.interface";
import { OrderPurchaseTemplate } from "./OrderPurchaseTemplate";
import { PurchaseOrderService } from "../services/purchaseOrderService";
export const sendEmailPurchaseOrder = async (
  data: Omit<PurchaseOrderI, "uid">,
  emailUser: string,
) => {
  const html = await OrderPurchaseTemplate(data);
  const pdfBuffer = await PurchaseOrderService.createPDF(html);
  /*
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "tcompraperu@gmail.com",
      pass: "uzof pfmc lcwz kgko",
    },
  });*/

  const FROM_EMAIL = process.env.SMTP_USER || "contacto@tcompra.com";
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === "true", // false en 587
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  const mailOptions = {
    from: `"TCOMPRA" <${FROM_EMAIL}>`, // Cambia al correo de la empresa si es necesario
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
