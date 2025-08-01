export interface PurchaseOrderI {
  uid: string;
  type: TypeRequeriment;
  userClientID: string;
  userNameClient: string;
  addressClient: string;
  documentClient: string;
  emailClient: string;
  subUserClientID: string;
  nameSubUserClient: string;
  subUserClientEmail: string;
  createDate: Date;
  deliveryDate: Date | null;
  requerimentID: string;
  requerimentTitle: string;
  price: number;
  subtotal: number;
  totaligv: number;
  total: number;
  igv: number;
  currency: string;
  userProviderID: string;
  nameUserProvider: string;
  subUserProviderID: string;
  nameSubUserProvider: string;
  addressProvider: string;
  documentProvider: string;
  emailProvider: string;
  subUserEmailProvider: string;
  stateID: PurchaseOrderState;
  offerID: string;
  offerTitle: string;
  price_Filter: CommonFilter;
  deliveryTime_Filter: number;
  location_Filter: number;
  warranty_Filter: number;
  scoreState?: ScoreStateI;
  canceledByCreator?: boolean;
  reasonCancellation?: string;
  cancellationDate?: Date;
}

export interface ScoreStateI {
  scoreClient: boolean;
  scoreProvider: boolean;
  deliveredClient: boolean;
  deliveredProvider: boolean;
  notifyClient?: boolean;
  notifyProvider?: boolean;
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
