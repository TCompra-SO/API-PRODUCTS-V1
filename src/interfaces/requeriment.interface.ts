export interface RequerimentI {
  uid: string;
  name: string;
  description: string;
  categoryID: number;
  cityID: number;
  budget: number;
  currencyID: number;
  payment_methodID: number;
  completion_date: Date;
  submission_dateID: number;
  warranty: number;
  duration: string;
  allowed_bidersID: number;
  userID: string;
  publish_date: Date;
  stateID: number;
  number_offerts: number;
}
