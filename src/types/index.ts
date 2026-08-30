export enum DocumentType {
  DNI = 0,
  PASSPORT = 1,
  FOREIGN_CARD = 2,
  RUC = 3,
  ID_CARD = 4,
}

export const DocumentTypeLabels: Record<DocumentType, string> = {
  [DocumentType.DNI]: 'DNI',
  [DocumentType.PASSPORT]: 'Pasaporte',
  [DocumentType.FOREIGN_CARD]: 'Carnet de extranjería',
  [DocumentType.RUC]: 'RUC',
  [DocumentType.ID_CARD]: 'Cédula de identidad',
};

export enum CompanyStatus {
  PENDING = 0,
  ACTIVE = 1,
  INACTIVE = 2,
  SUSPENDED = 3,
}

export const CompanyStatusLabels: Record<CompanyStatus, string> = {
  [CompanyStatus.PENDING]: 'Pendiente',
  [CompanyStatus.ACTIVE]: 'Activa',
  [CompanyStatus.INACTIVE]: 'Inactiva',
  [CompanyStatus.SUSPENDED]: 'Suspendida',
};

export enum MemberRole {
  OWNER = 0,
  ASSOCIATE = 1,
}

export const MemberRoleLabels: Record<MemberRole, string> = {
  [MemberRole.OWNER]: 'Propietario',
  [MemberRole.ASSOCIATE]: 'Asociado',
};

export enum MemberStatus {
  ACTIVE = 0,
  INACTIVE = 1,
}

export const MemberStatusLabels: Record<MemberStatus, string> = {
  [MemberStatus.ACTIVE]: 'Activo',
  [MemberStatus.INACTIVE]: 'Inactivo',
};

export enum CategoryReference {
  CONCERT = 0,
  THEATER = 1,
  SPORTS = 2,
  CONFERENCE = 3,
  WORKSHOP = 4,
  COURSE = 5,
  BUSINESS = 6,
  TECHNOLOGY = 7,
  GAMING = 8,
  ANIME_COMICS = 9,
  FAMILY = 10,
  GASTRONOMY = 11,
  ART = 12,
  CINEMA = 13,
  FASHION = 14,
  WELLNESS = 15,
  RELIGIOUS = 16,
  CHARITY = 17,
  OUTDOOR = 18,
  NIGHTLIFE = 19,
  OTHERS = 20,
}

export const CategoryReferenceLabels: Record<CategoryReference, string> = {
  [CategoryReference.CONCERT]: 'Concierto',
  [CategoryReference.THEATER]: 'Teatro',
  [CategoryReference.SPORTS]: 'Deportes',
  [CategoryReference.CONFERENCE]: 'Conferencia',
  [CategoryReference.WORKSHOP]: 'Taller',
  [CategoryReference.COURSE]: 'Curso',
  [CategoryReference.BUSINESS]: 'Negocios',
  [CategoryReference.TECHNOLOGY]: 'Tecnología',
  [CategoryReference.GAMING]: 'Gaming',
  [CategoryReference.ANIME_COMICS]: 'Anime y cómics',
  [CategoryReference.FAMILY]: 'Familia',
  [CategoryReference.GASTRONOMY]: 'Gastronomía',
  [CategoryReference.ART]: 'Arte',
  [CategoryReference.CINEMA]: 'Cine',
  [CategoryReference.FASHION]: 'Moda',
  [CategoryReference.WELLNESS]: 'Salud y bienestar',
  [CategoryReference.RELIGIOUS]: 'Religioso',
  [CategoryReference.CHARITY]: 'Caridad',
  [CategoryReference.OUTDOOR]: 'Aire libre',
  [CategoryReference.NIGHTLIFE]: 'Vida nocturna',
  [CategoryReference.OTHERS]: 'Otros',
};

export enum EventStatus {
  DRAFT = 0,
  PUBLISHED = 1,
  SOLD_OUT = 2,
  PAUSED = 3,
  CANCELLED = 4,
  COMPLETED = 5,
}

export const EventStatusLabels: Record<EventStatus, string> = {
  [EventStatus.DRAFT]: 'Borrador',
  [EventStatus.PUBLISHED]: 'Publicado',
  [EventStatus.SOLD_OUT]: 'Agotado',
  [EventStatus.PAUSED]: 'Pausado',
  [EventStatus.CANCELLED]: 'Cancelado',
  [EventStatus.COMPLETED]: 'Finalizado',
};

export enum DayStatus {
  SCHEDULED = 0,
  IN_PROGRESS = 1,
  COMPLETED = 2,
  CANCELLED = 3,
  POSTPONED = 4,
}

export const DayStatusLabels: Record<DayStatus, string> = {
  [DayStatus.SCHEDULED]: 'Programada',
  [DayStatus.IN_PROGRESS]: 'En progreso',
  [DayStatus.COMPLETED]: 'Completada',
  [DayStatus.CANCELLED]: 'Cancelada',
  [DayStatus.POSTPONED]: 'Postergada',
};

export enum SeatStatus {
  AVAILABLE = 0,
  RESERVED = 1,
  SOLD = 2,
  BLOCKED = 3,
  UNAVAILABLE = 4,
}

export const SeatStatusLabels: Record<SeatStatus, string> = {
  [SeatStatus.AVAILABLE]: 'Disponible',
  [SeatStatus.RESERVED]: 'Reservado',
  [SeatStatus.SOLD]: 'Vendido',
  [SeatStatus.BLOCKED]: 'Bloqueado',
  [SeatStatus.UNAVAILABLE]: 'No disponible',
};

export enum DiscountType {
  PERCENTAGE = 0,
  FIXED_AMOUNT = 1,
}

export const DiscountTypeLabels: Record<DiscountType, string> = {
  [DiscountType.PERCENTAGE]: 'Porcentaje',
  [DiscountType.FIXED_AMOUNT]: 'Monto fijo',
};

export type ComputedDiscountStatus = 'Activo' | 'Programado' | 'Vencido' | 'Agotado' | 'Inactivo';

export enum OrderStatus {
  PENDING = 0,
  PAID = 1,
  CANCELLED = 2,
  REFUNDED = 3,
  EXPIRED = 4,
}

export const OrderStatusLabels: Record<OrderStatus, string> = {
  [OrderStatus.PENDING]: 'Pendiente',
  [OrderStatus.PAID]: 'Pagada',
  [OrderStatus.CANCELLED]: 'Cancelada',
  [OrderStatus.REFUNDED]: 'Reembolsada',
  [OrderStatus.EXPIRED]: 'Expirada',
};

export enum PaymentMethod {
  UNDEFINED = -1,
  CREDIT_CARD = 0,
  DEBIT_CARD = 1,
  YAPE = 2,
  PLIN = 3,
  BANK_TRANSFER = 4,
  CASH = 5,
}

export const PaymentMethodLabels: Record<PaymentMethod, string> = {
  [PaymentMethod.UNDEFINED]: 'Indefinido',
  [PaymentMethod.CREDIT_CARD]: 'Tarjeta de crédito',
  [PaymentMethod.DEBIT_CARD]: 'Tarjeta de débito',
  [PaymentMethod.YAPE]: 'Yape',
  [PaymentMethod.PLIN]: 'Plin',
  [PaymentMethod.BANK_TRANSFER]: 'Transferencia',
  [PaymentMethod.CASH]: 'Efectivo',
};

export enum PaymentStatus {
  PENDING = 0,
  PROCESSING = 1,
  APPROVED = 2,
  REJECTED = 3,
}

export const PaymentStatusLabels: Record<PaymentStatus, string> = {
  [PaymentStatus.PENDING]: 'Pendiente',
  [PaymentStatus.PROCESSING]: 'Procesando',
  [PaymentStatus.APPROVED]: 'Aprobado',
  [PaymentStatus.REJECTED]: 'Rechazado',
};

export enum TicketStatus {
  ACTIVE = 0,
  USED = 1,
  CANCELLED = 2,
  REFUNDED = 3,
  EXPIRED = 4,
}

export const TicketStatusLabels: Record<TicketStatus, string> = {
  [TicketStatus.ACTIVE]: 'Activo',
  [TicketStatus.USED]: 'Usado',
  [TicketStatus.CANCELLED]: 'Cancelado',
  [TicketStatus.REFUNDED]: 'Reembolsado',
  [TicketStatus.EXPIRED]: 'Expirado',
};

// Domain Entities
export interface UserDocument {
  type: DocumentType;
  number: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  lastName: string;
  birthDate: string; // YYYY-MM-DD or DD/MM/YYYY
  city: string;
  country: string;
  document: UserDocument;
  mobile: string;
  profileImage?: string | null;
}

export interface Company {
  id: string;
  name: string;
  description?: string;
  logo?: string | null;
  email: string;
  telephone: string;
  webSite?: string;
  country: string;
  city: string;
  location: string;
  document: UserDocument;
  status: CompanyStatus;
  timezone: string;
  defaultCurrency: string;
  defaultTaxRate: number;
}

export interface Membership {
  id: string;
  userId: string;
  userName: string;
  companyId: string;
  companyName: string;
  role: MemberRole;
  status: MemberStatus;
  createdAt?: string;
  user?: UserProfile;
  company?: Company;
}

export interface Category {
  id: string;
  name: string;
  reference: CategoryReference;
}

export interface SessionDay {
  id: string;
  eventId?: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  saleStartAt?: string;
  description?: string;
  status: DayStatus;
  inventory?: {
    total: number;
    sold: number;
    reserved: number;
    available: number;
  };
  sales?: {
    currency: string;
    gross: number;
  };
}

export interface CanvasShapeStyle {
  fill: string;
  stroke: string;
  strokeWidth: number;
  opacity: number;
}

export interface CanvasPoint {
  x: number;
  y: number;
}

export interface CanvasObject {
  id: string;
  type: 'stage' | 'zone' | 'text' | 'rect';
  zoneId?: string;
  shape?: 'polygon' | 'rect' | 'circle';
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  points?: CanvasPoint[];
  rotation?: number;
  locked?: boolean;
  label: string;
  style: CanvasShapeStyle;
}

export interface CanvasSchema {
  version: number;
  width: number;
  height: number;
  background: {
    color: string;
    image?: string | null;
  };
  objects: CanvasObject[];
}

export interface Zone {
  id: string;
  name: string;
  hierarchy: number;
  price: number;
  numberedSeating: boolean;
  quantity: {
    total: number;
    sold: number;
    reserved: number;
    available?: number;
  };
  canvas?: CanvasSchema | Record<string, any>;
  eventId?: string;
  dayId?: string;
}

export interface Seat {
  id: string;
  code: string;
  status: SeatStatus;
  zoneId?: string;
  dayId?: string;
  eventId?: string;
}

export interface EventDetail {
  id: string;
  name: string;
  slug?: string;
  description: string;
  coverImage?: string | null;
  bannerImage?: string | null;
  logo?: string | null;
  thumbnail?: string | null;
  location: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  venueName?: string;
  country: string;
  city: string;
  currency: string;
  taxRate: number;
  status: EventStatus;
  category: {
    code: string;
    label: string;
  } | string;
  days: SessionDay[];
  salesStartAt?: string;
  salesEndAt?: string;
  maxTicketsPerOrder?: number;
  canvas?: CanvasSchema;
  date?: string;
}

export interface Discount {
  id: string;
  active: boolean;
  code: string;
  startDate: string;
  endDate: string;
  type: DiscountType;
  usageLimit?: number;
  usageCount?: number;
  usage?: {
    limit: number;
    count: number;
  };
  value: number;
  eventId?: string;
  event?: {
    id: string;
    name: string;
  };
}

export interface OrderItem {
  zone: {
    id: string;
    name: string;
  };
  quantity: number;
  seats?: Array<{
    id: string;
    code: string;
  }>;
  unitPrice: number;
}

export interface Order {
  id: string;
  currency: string;
  paymentMethod: PaymentMethod;
  status: OrderStatus;
  price: number;
  subTotal: number;
  tax: number;
  total: number;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
  customer: {
    id: string;
    name: string;
    email: string;
    document?: UserDocument;
    mobile?: string;
  };
  event: {
    id: string;
    name: string;
  };
  day: {
    id: string;
    date: string;
    startTime: string;
    endTime: string;
  };
  discount?: {
    id: string;
    code: string;
  } | null;
  items: OrderItem[];
  ticketsCount: number;
  payments?: Payment[];
  tickets?: Ticket[];
}

export interface Payment {
  id: string;
  orderId: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  externalReference?: string;
  payer?: {
    email: string;
  };
  customer?: {
    id: string;
    name: string;
  };
  event?: {
    id: string;
    name: string;
  };
  day?: {
    id: string;
    date: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Ticket {
  id: string;
  qrCode: string;
  code: string;
  price: number;
  status: TicketStatus;
  orderId: string;
  createdAt: string;
  usedAt?: string | null;
  validatedBy?: {
    id: string;
    name: string;
  } | null;
  customer: {
    id: string;
    name: string;
    email: string;
  };
  event: {
    id: string;
    name: string;
  };
  day: {
    id: string;
    date: string;
    startTime: string;
    endTime: string;
  };
  zone: {
    id: string;
    name: string;
  };
  seat?: {
    id: string;
    code: string;
  } | null;
}

export interface Customer {
  id: string;
  name: string;
  lastName: string;
  fullName: string;
  email: string;
  mobile: string;
  country: string;
  city: string;
  document: UserDocument;
  ordersCount: number;
  ticketsCount: number;
  eventsCount: number;
  totalSpent: number;
  currency: string;
  lastPurchaseAt: string;
  orders?: Order[];
  payments?: Payment[];
  tickets?: Ticket[];
  reviews?: Review[];
}

export interface Review {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
  customer: {
    id: string;
    name: string;
    profileImage?: string | null;
  };
  event: {
    id: string;
    name: string;
  };
}

export interface ReviewSummary {
  average: number;
  total: number;
  distribution: Record<number, number>;
}

export interface AccessSummary {
  event: {
    id: string;
    name: string;
  };
  day: {
    id: string;
    date: string;
    startTime: string;
  };
  total: number;
  active: number;
  used: number;
  invalid: number;
  percentageUsed: number;
  recent: Ticket[];
}

export type ValidationResultType = 'VALID' | 'ALREADY_USED' | 'INVALID';

export type ValidationInvalidReason =
  | 'TICKET_NOT_FOUND'
  | 'WRONG_COMPANY'
  | 'WRONG_EVENT'
  | 'WRONG_DAY'
  | 'TICKET_CANCELLED'
  | 'TICKET_REFUNDED'
  | 'TICKET_EXPIRED';

export interface ValidateTicketResponse {
  result: ValidationResultType;
  reason?: ValidationInvalidReason;
  ticket?: Ticket;
}

export interface DashboardData {
  filters: {
    currency: string;
    timezone: string;
  };
  kpis: {
    approvedSales: number;
    paidOrders: number;
    soldTickets: number;
    averageOrderValue: number;
    totalCapacity: number;
    occupancyPercentage: number;
    activeReservations: number;
    declinedPayments: number;
    discountUses: number;
  };
  salesTimeline: Array<{
    date: string;
    sales: number;
    orders: number;
    tickets: number;
  }>;
  salesByEvent: Array<{
    eventId: string;
    eventName: string;
    sales: number;
    tickets: number;
  }>;
  ordersByStatus: Array<{
    status: OrderStatus;
    count: number;
  }>;
  paymentsByMethod: Array<{
    method: PaymentMethod;
    count: number;
    amount: number;
  }>;
  upcomingEvents: EventDetail[];
  alerts: Array<{
    id: string;
    type: 'INFO' | 'WARNING' | 'ERROR';
    title: string;
    description: string;
    eventId?: string;
  }>;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  orderBy?: string;
  order?: 'ASC' | 'DESC';
}
