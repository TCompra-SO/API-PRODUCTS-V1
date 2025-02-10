import { OfferI } from "../interfaces/offer.interface";
export interface OfferFrontI {
  key: string;
  type?: number;
  title: string;
  user: string;
  subUser?: string;
  requirementTitle: string;
  requirementId: string;
  publishDate: string;
  coin: number;
  price: number;
  state: number;
  description?: string;
  warranty?: number;
  warrantyTime?: number;
  deliveryTime: number;
  location: number;
  image?: string[];
  document?: string[];
  selectionDate?: string;
  igv?: boolean;
  deliveryDate?: string;
  delivered?: boolean;
  canceledByCreator?: boolean;
  includesDelivery?: boolean;
  cancelRated?: boolean;
}

interface OfferFrontE extends OfferI {
  requerimentTitle: string;
  userName?: string;
  subUserName?: string;
  cityName?: string;
}

function transformOffersData(response: any): {
  success: boolean;
  code: number;
  data: any[];
  res: any;
} {
  const transformedData: any[] = response.data.map((offer: OfferFrontE) => ({
    key: offer.uid, // 'uid' renombrado a 'key'
    title: offer.name, // 'name' renombrado a 'title'
    user: offer.entityID, // 'userID' renombrado a 'user'
    subUser: offer.userID, // 'entityID' usado como 'subUser'
    requirementTitle: offer.requerimentTitle, // No está presente en OfferI; deberás buscarlo si es necesario
    requirementId: offer.requerimentID, // 'requerimentID' renombrado a 'requirementId'
    publishDate: offer.publishDate.toISOString(), // 'publishDate' convertido a string
    coin: offer.currencyID, // 'currencyID' renombrado a 'coin'
    price: offer.budget, // 'budget' renombrado a 'price'
    state: offer.stateID, // 'stateID' renombrado a 'state'
    description: offer.description, // Sin cambios
    warranty: offer?.warranty, // Sin cambios
    warrantyTime: offer?.timeMeasurementID, // 'timeMeasurementID' renombrado a 'warrantyTime'
    deliveryTime: offer.deliveryTimeID, // 'deliveryTimeID' renombrado a 'deliveryTime'
    location: offer.cityID, // 'cityID' renombrado a 'location'
    image: offer.images, //
    document: offer.files, //
    selectionDate: offer.selectionDate?.toISOString(), //
    igv: offer.includesIGV, // 'includesIGV' renombrado a 'igv'
    deliveryDate: offer.deliveryDate?.toISOString(), // 'deliveryDate' convertido a string
    canceledByCreator: offer.canceledByCreator, // Sin cambios
    includesDelivery: offer.includesDelivery,
    delivered: offer.delivered, // Sin cambios
    userName: offer.userName,
    subUserName: offer.subUserName,
    emailUser: offer?.email,
    emailSubUser: offer?.subUserEmail,
    cancelRated: offer?.cancelRated,
  }));

  return {
    success: response.success,
    code: response.code,
    data: transformedData,
    res: response.res,
  };
}

export { transformOffersData };
