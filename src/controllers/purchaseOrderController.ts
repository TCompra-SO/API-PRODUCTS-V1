import { Request, Response } from "express";
import { PurchaseOrderService } from "../services/purchaseOrderService";

const CreatePurchaseOrderController = async (req: Request, res: Response) => {
  try {
    const { requerimentID, offerID } = req.body;
    const responseUser = await PurchaseOrderService.CreatePurchaseOrder(
      requerimentID,
      offerID
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
export { CreatePurchaseOrderController };
