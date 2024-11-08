/*export interface PurchaseOrderI {
import { PurchaseOrderI } from './purchaseOrder.interface';
  uid: string;
  type: number; // esto es requerimiento,
  userClient: string;
  subUserClient?: string;
  userProvider: string;
  subUserProvider?: string;
  requirementTitle?: string;
  requirementId: string;
  selectionDate: string;
  state: PurchaseOrderState;
  offerTitle: string;
  offerId: string;
  filters: OfferFilters;
}*/

export interface PurchaseOrderI {
  uid: string;
  type: TypeRequeriment;
  userClientID: string;
  userNameClient: string;
  addressClient: string;
  documentClient: string;
  subUserClientID: string;
  nameSubUserClient: string;
  createDate: Date;
  deliveryDate: Date;
  requerimentID: string;
  requerimentTitle: string;
  price: number;
  subtotal: number;
  totaligv: number;
  total: number;
  igv: number;
  userProviderID: string;
  nameUserProvider: string;
  subUserProviderID: string;
  nameSubUserProvider: string;
  addressProvider: string;
  documentProvider: string;
  emailProvider: string;
  state: PurchaseOrderState;
  offerID: string;
  offerTitle: string;
  price_Filter: CommonFilter;
  deliveryTime_Filter: number;
  location_Filter: number;
  warranty_Filter: number;
}
export enum PurchaseOrderState {
  PENDING = 1,
  CANCELED = 2,
  FINISHED = 3,
  DISPUTE = 4,
  ELIMINATED = 7,
}

export enum CommonFilter {
  ALL = 999,
  ASC = 1,
  DESC = 2,
}

export interface OfferFilters {
  price: CommonFilter;
  deliveryTime: number;
  location: number;
  warranty: CommonFilter;
}

export enum TypeRequeriment {
  PRODUCTS = 1,
  SERVICES = 2,
  LIQUIDATIONS = 3,
  RRHH = 4,
}
