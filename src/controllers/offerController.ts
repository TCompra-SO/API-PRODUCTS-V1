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

const GetOffersController = async (req: Request, res: Response) => {
  try {
    const responseUser = await OfferService.GetOffers();
    if (responseUser.success) {
      res.status(responseUser.code).send(responseUser);
    } else {
      res.status(responseUser.code).send(responseUser.error);
    }
  } catch (error) {
    console.error("Error en GetOffersController");
    res.status(500).send({
      success: false,
      msg: "Error interno en el servidor",
    });
  }
};

const GetOffersByEntityController = async (req: Request, res: Response) => {
  const { uid } = req.params;
  try {
    const responseUser = await OfferService.getOffersByEntity(uid);
    if (responseUser.success) {
      res.status(responseUser.code).send(responseUser);
    } else {
      res.status(responseUser.code).send(responseUser.error);
    }
  } catch (error) {
    console.error("Error en GetOffersByEntityController");
    res.status(500).send({
      success: false,
      msg: "Error interno en el servidor",
    });
  }
};

const GetOffersBySubUserController = async (req: Request, res: Response) => {
  const { uid } = req.params;
  try {
    const responseUser = await OfferService.getOffersBySubUser(uid);
    if (responseUser.success) {
      res.status(responseUser.code).send(responseUser);
    } else {
      res.status(responseUser.code).send(responseUser.error);
    }
  } catch (error) {
    console.error("Error en GetOffersBySubUserController");
    res.status(500).send({
      success: false,
      msg: "Error interno en el servidor",
    });
  }
};

const GetOffersByRequerimentController = async (
  req: Request,
  res: Response
) => {
  try {
    const { requerimentID } = req.params;
    const responseUser = await OfferService.getOffersByRequeriment(
      requerimentID
    );
    if (responseUser.success) {
      res.status(responseUser.code).send(responseUser);
    } else {
      res.status(responseUser.code).send(responseUser.error);
    }
  } catch (error) {
    console.error("Error en GetOffersByRequerimentController");
    res.status(500).send({
      success: false,
      msg: "Error interno en el servidor",
    });
  }
};

const getbasicRateDataController = async (req: Request, res: Response) => {
  try {
    const { uid } = req.params;
    console.log(uid);
    const responseUser = await OfferService.BasicRateData(uid);
    if (responseUser && responseUser.success) {
      res.status(responseUser.code).send(responseUser);
    } else {
      res.status(responseUser.code).send(responseUser.error);
    }
  } catch (error) {
    console.error("Error en BasicRateDataController", error);
    res.status(500).send({
      success: false,
      msg: "Error interno del Servidor",
    });
  }
};

const deleteController = async (req: Request, res: Response) => {
  try {
    const { uid } = req.params;
    const responseUser = await OfferService.deleteOffer(uid);
    if (responseUser && responseUser.success) {
      res.status(responseUser.code).send(responseUser);
    } else {
      res.status(responseUser.code).send(responseUser.error);
    }
  } catch (error) {
    console.error("Error en deleteController", error);
    res.status(500).send({
      success: false,
      msg: "Error interno del Servidor",
    });
  }
};

export {
  CreateOfferController,
  GetDetailOfferController,
  GetOffersController,
  GetOffersByRequerimentController,
  getbasicRateDataController,
  GetOffersByEntityController,
  GetOffersBySubUserController,
  deleteController,
};
