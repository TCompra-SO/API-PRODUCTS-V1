import { RequerimentI } from "../interfaces/requeriment.interface";
// Interfaz Frontend adaptada

export interface RequerimentFrontI {
  key: string; // Mapea a uid
  title: string; // Mapea a name
  description: string; // Mapea a description
  category: number; // Mapea a categoryID
  location: number; // Mapea a cityID
  publishDate: Date; // Mapea a completion_date
  coin: number; // Mapea a currencyID
  price: number; // Mapea a budget
  numberOffers: number; // Mapea a allowed_bidersID
  state?: number; // Campo nuevo, no tiene equivalente en RequerimentI
  type?: string; // Campo nuevo, no tiene equivalente en RequerimentI
  image?: string[]; // Campo nuevo, opcional
  document?: string; // Campo nuevo, opcional
  user: string; // Mapea a userID (deberás obtener información adicional de `userID`)
  subUser?: string; // Campo nuevo, opcional
  warranty?: number; // Mapea a warranty
  warrantyTime?: string; // Campo nuevo, relacionado con la duración de la garantía
  usage?: string; // Campo nuevo, sólo para liquidaciones
  duration: number;
}

// Interfaz para la respuesta
interface ApiResponse {
  success: boolean;
  code: number;
  data: RequerimentFrontI[];
}

function transformData(response: {
  success: boolean;
  code: number;
  data: RequerimentI[];
}): { success: boolean; code: number; data: RequerimentFrontI[] } {
  const transformedData: RequerimentFrontI[] = response.data.map((item) => ({
    key: item.uid, // Aquí 'uid' viene de RequerimentI y lo renombramos a 'key'
    title: item.name, // 'name' renombrado a 'title'
    description: item.description, // Sin cambios
    category: item.categoryID, // 'categoryID' renombrado a 'category'
    location: item.cityID, // 'cityID' renombrado a 'location'
    price: item.budget, // 'budget' renombrado a 'price'
    coin: item.currencyID, // 'currencyID' renombrado a 'coin'
    payment_methodID: item.payment_methodID,
    publishDate: item.publish_date, // 'completion_date' convertido a 'publishDate'
    completion_date: item.completion_date,
    submission_date: item.submission_dateID,
    numberOffers: item.number_offers, // 'allowed_bidersID' renombrado a 'numberOffers'
    allowed_bidersID: item.allowed_bidersID,
    user: item.userID, // Sin cambios
    warranty: item.warranty, // Mantener el campo 'warranty'
    duration: item.durationID, // Mantener el campo 'duration'// Convertir string de fecha a objeto Date
    state: item.stateID, // Añadir un valor por defecto o según lógica
    images: item.images,
    files: item.files,
    winOffer: item.winOffer,
  }));

  return {
    success: response.success,
    code: response.code,
    data: transformedData,
  };
}

export { transformData };
