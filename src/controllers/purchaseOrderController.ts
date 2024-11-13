import { Request, Response } from "express";
import { PurchaseOrderService } from "../services/purchaseOrderService";
const fs = require("fs");

const CreatePurchaseOrderController = async (req: Request, res: Response) => {
  try {
    const {
      requerimentID,
      offerID,
      price_Filter,
      deliveryTime_Filter,
      location_Filter,
      warranty_Filter,
    } = req.body;
    const responseUser = await PurchaseOrderService.CreatePurchaseOrder(
      requerimentID,
      offerID,
      price_Filter,
      deliveryTime_Filter,
      location_Filter,
      warranty_Filter
    );
    if (responseUser && responseUser.success) {
      res.status(responseUser.code).send(responseUser);
    } else {
      res.status(responseUser.code).send(responseUser.error);
    }
  } catch (error) {
    console.error("Error en CreatePurchaseOrderController", error);
    res.status(500).send({
      success: false,
      msg: "Error interno del Servidor",
    });
  }
};

const getPurchaseOrdersController = async (req: Request, res: Response) => {
  try {
    const responseUser = await PurchaseOrderService.getPurchaseOrders();
    if (responseUser && responseUser.success) {
      res.status(responseUser.code).send(responseUser);
    } else {
      res.status(responseUser.code).send(responseUser.error);
    }
  } catch (error) {
    console.error("Error en getPurchaseOrdersController", error);
    res.status(500).send({
      success: false,
      msg: "Error interno del Servidor",
    });
  }
};

const getPurchaseOrderByUser = async (req: Request, res: Response) => {
  const { userClientID } = req.params;
  try {
    const responseUser = await PurchaseOrderService.getPurchaseOrderByUser(
      userClientID
    );
    if (responseUser && responseUser.success) {
      res.status(responseUser.code).send(responseUser);
    } else {
      res.status(responseUser.code).send(responseUser.error);
    }
  } catch (error) {
    console.error("Error en getPurchaseOrderByUserController", error);
    res.status(500).send({
      success: false,
      msg: "Error interno del Servidor",
    });
  }
};

const getPurchaseOrderIDController = async (req: Request, res: Response) => {
  const { uid } = req.params;
  try {
    const responseUser = await PurchaseOrderService.getPurchaseOrderID(uid);
    if (responseUser && responseUser.success) {
      res.status(responseUser.code).send(responseUser);
    } else {
      res.status(responseUser.code).send(responseUser.error);
    }
  } catch (error) {
    console.error("Error en getPurchaseOrderIDController", error);
    res.status(500).send({
      success: false,
      msg: "Error interno del Servidor",
    });
  }
};

const getPurchaseOrderPDFController = async (req: Request, res: Response) => {
  const { uid } = req.params;

  try {
    const pdfBuffer = await PurchaseOrderService.getPurchaseOrderPDF(uid);

    // Verifica si pdfBuffer es null antes de continuar
    if (!pdfBuffer) {
      return res.status(404).send({
        success: false,
        msg: "No se encontró la orden de compra o ocurrió un error al generar el PDF",
      });
    }

    // Convierte pdfBuffer a Buffer si es necesario
    const bufferData = Buffer.isBuffer(pdfBuffer)
      ? pdfBuffer
      : Buffer.from(pdfBuffer);

    // Guarda el archivo temporalmente para verificar su contenido
    fs.writeFileSync("./orden_compra_temp.pdf", bufferData);
    console.log("PDF guardado temporalmente");

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="orden_compra.pdf"'
    );

    // Enviamos el buffer del PDF como respuesta
    return res.status(200).send(bufferData);
  } catch (error) {
    console.error("Error en getPurchaseOrderPDFController", error);
    return res.status(500).send({
      success: false,
      msg: "Error interno del Servidor",
    });
  }
};

export {
  CreatePurchaseOrderController,
  getPurchaseOrdersController,
  getPurchaseOrderByUser,
  getPurchaseOrderIDController,
  getPurchaseOrderPDFController,
};
