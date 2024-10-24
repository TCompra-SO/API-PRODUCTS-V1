import { Request, Response } from "express";
import { OfferService } from "../services/offerService";

const CreateOfferController = async ({ body }: Request, res: Response) => {
  try {
    const responseUser = await OfferService.CreateOffer(body);
    if (responseUser.success) {
      res.status(responseUser.code).send(responseUser);
    } else {
      res.status(responseUser.code).send(responseUser.error);
    }
  } catch (error) {
    console.error("Error en CreateOfferController", error);
    res.status(500).send({
      success: false,
      msg: "Error interno del Servidor",
    });
  }
};

const GetDetailOfferController = async (req: Request, res: Response) => {
  try {
    const { uid } = req.params;
    const responseUser = await OfferService.GetDetailOffer(uid);
    if (responseUser.success) {
      res.status(responseUser.code).send(responseUser);
    } else {
      res.status(responseUser.code).send(responseUser.error);
    }
  } catch (error) {
    console.error("Error en GetDatailOfferController");
    res.status(500).send({
      success: false,
      msg: "Error interno en el servidor",
    });
  }
};

export { CreateOfferController };
