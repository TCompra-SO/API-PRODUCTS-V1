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

const getPurchaseOrdersProviderController = async (
  req: Request,
  res: Response
) => {
  const { userProviderID } = req.params;
  try {
    const responseUser = await PurchaseOrderService.getPurchaseOrdersProvider(
      userProviderID
    );
    if (responseUser && responseUser.success) {
      res.status(responseUser.code).send(responseUser);
    } else {
      res.status(responseUser.code).send(responseUser.error);
    }
  } catch (error) {
    console.error("Error en getPurchaseOrderByEntityProviderController", error);
    res.status(500).send({
      success: false,
      msg: "Error interno del Servidor",
    });
  }
};

const getPurchaseOrdersClientController = async (
  req: Request,
  res: Response
) => {
  const { userClientID } = req.params;
  try {
    const responseUser = await PurchaseOrderService.getPurchaseOrdersClient(
      userClientID
    );
    if (responseUser && responseUser.success) {
      res.status(responseUser.code).send(responseUser);
    } else {
      res.status(responseUser.code).send(responseUser.error);
    }
  } catch (error) {
    console.error("Error en getPurchaseOrderByEntityClientController", error);
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

const getPurchaseOrdersByProvider = async (req: Request, res: Response) => {
  const { uid, typeUser } = req.params;
  try {
    const responseUser =
      await PurchaseOrderService.getPurchaseOrdersByEntityProvider(
        uid,
        Number(typeUser)
      );
    if (responseUser && responseUser.success) {
      res.status(responseUser.code).send(responseUser);
    } else {
      res.status(responseUser.code).send(responseUser.error);
    }
  } catch (error) {
    console.error("Error en getPurchaseOrdersByProviderController", error);
    res.status(500).send({
      success: false,
      msg: "Error interno del Servidor",
    });
  }
};

const getPurchaseOrdersByClient = async (req: Request, res: Response) => {
  const { uid, typeUser } = req.params;
  try {
    const responseUser =
      await PurchaseOrderService.getPurchaseOrdersByEntityClient(
        uid,
        Number(typeUser)
      );
    if (responseUser && responseUser.success) {
      res.status(responseUser.code).send(responseUser);
    } else {
      res.status(responseUser.code).send(responseUser.error);
    }
  } catch (error) {
    console.error("Error en getPurchaseOrdersByClientController", error);
    res.status(500).send({
      success: false,
      msg: "Error interno del Servidor",
    });
  }
};

const getPurchaseOrderPDFController = async (req: Request, res: Response) => {
  const { uid } = req.params;

  try {
    const responseUser = await PurchaseOrderService.getPurchaseOrderPDF(uid);
    if (responseUser && responseUser.success) {
      res.status(responseUser.code).send(responseUser);
    } else {
      res.status(responseUser.code).send(responseUser.error);
    }
  } catch (error) {
    console.error("Error en getPurchaseOrderPDFController", error);
    return res.status(500).send({
      success: false,
      msg: "Error interno del Servidor",
    });
  }
};

const canceledController = async (req: Request, res: Response) => {
  const { purchaseOrderID } = req.params;
  try {
    const responseUser = await PurchaseOrderService.canceled(purchaseOrderID);
    if (responseUser && responseUser.success) {
      res.status(responseUser.code).send(responseUser);
    } else {
      res.status(responseUser.code).send(responseUser.error);
    }
  } catch (error) {
    console.error("Error en canceledController", error);
    return res.status(500).send({
      success: false,
      msg: "Error interno del Servidor",
    });
  }
};

export {
  CreatePurchaseOrderController,
  getPurchaseOrdersController,
  getPurchaseOrdersProviderController,
  getPurchaseOrdersClientController,
  getPurchaseOrderIDController,
  getPurchaseOrderPDFController,
  getPurchaseOrdersByProvider,
  getPurchaseOrdersByClient,
  canceledController,
};
