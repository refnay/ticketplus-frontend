import {
  UserProfile,
  Company,
  Membership,
  Category,
  EventDetail,
  SessionDay,
  Zone,
  Seat,
  Discount,
  Order,
  Payment,
  Ticket,
  Customer,
  Review,
  ReviewSummary,
  AccessSummary,
  ValidateTicketResponse,
  DashboardData,
  PaginatedResult,
  PaginationParams,
  EventStatus,
  DayStatus,
  SeatStatus,
  DiscountType,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  TicketStatus,
  CanvasSchema,
} from '../../types';

export interface LoginParams {
  email: string;
  password: string;
}

export interface RegisterParams {
  email: string;
  password: string;
  birthDate: string;
  city: string;
  country: string;
  documentType: number;
  documentNumber: string;
  name: string;
  lastName: string;
  mobile: string;
}

export interface AuthResponse {
  token: string;
}

export interface AuthService {
  login(params: LoginParams): Promise<AuthResponse>;
  register(params: RegisterParams): Promise<AuthResponse>;
  requestRecovery(email: string): Promise<void>;
  resetPassword(token: string, newPassword: string): Promise<void>;
  getCurrentUser(): Promise<UserProfile>;
  updateProfile(input: Partial<UserProfile>): Promise<UserProfile>;
  changePassword(oldPassword: string, newPassword: string): Promise<void>;
  uploadProfileImage(file: File): Promise<string>;
}

export interface CompanyService {
  getUserCompanies(params?: PaginationParams): Promise<PaginatedResult<Membership>>;
  getCurrentMembership(): Promise<Membership>;
  switchCompany(companyId: string): Promise<void>;
  createCompany(input: Partial<Company>): Promise<{ id: string }>;
  updateCompany(input: Partial<Company>): Promise<void>;
  uploadLogo(file: File): Promise<string>;
  getCompanyDetails(id?: string): Promise<Company>;
  getTeamMembers(params?: PaginationParams & { search?: string; role?: number; status?: number }): Promise<PaginatedResult<Membership>>;
}

export interface CategoryFilters extends PaginationParams {
  name?: string;
  reference?: number;
}

export interface CategoryService {
  search(filters?: CategoryFilters): Promise<PaginatedResult<Category>>;
  create(input: Omit<Category, 'id'>): Promise<{ id: string }>;
  update(id: string, input: Partial<Category>): Promise<void>;
  remove(id: string): Promise<void>;
}

export interface EventFilters extends PaginationParams {
  value?: string;
  name?: string;
  country?: string;
  city?: string;
  status?: EventStatus;
  category?: string;
  date?: string;
}

export interface EventService {
  search(filters?: EventFilters): Promise<PaginatedResult<EventDetail>>;
  find(id: string): Promise<EventDetail>;
  create(input: Partial<EventDetail>): Promise<{ id: string }>;
  update(id: string, input: Partial<EventDetail>): Promise<void>;
  remove(id: string): Promise<void>;
  publish(id: string, reason?: string): Promise<void>;
  pause(id: string, reason?: string): Promise<void>;
  resume(id: string): Promise<void>;
  cancel(id: string, reason?: string): Promise<void>;
  complete(id: string): Promise<void>;
  uploadCover(id: string, file: File): Promise<string>;
  uploadBanner(id: string, file: File): Promise<string>;
  uploadLogo(id: string, file: File): Promise<string>;
  uploadThumbnail(id: string, file: File): Promise<string>;
  removeCover(id: string): Promise<void>;
  removeBanner(id: string): Promise<void>;
  removeLogo(id: string): Promise<void>;
  removeThumbnail(id: string): Promise<void>;
  getCanvas(eventId: string): Promise<CanvasSchema | null>;
  saveCanvas(eventId: string, canvas: CanvasSchema): Promise<void>;
  getLayout(eventId: string): Promise<any>;
  saveLayout(eventId: string, layout: any, expectedUpdatedAt?: string): Promise<{ updatedAt: string }>;
}

export interface SessionService {
  listDays(eventId: string): Promise<SessionDay[]>;
  findDay(eventId: string, dayId: string): Promise<SessionDay>;
  createDay(eventId: string, input: Partial<SessionDay>): Promise<{ id: string }>;
  updateDay(eventId: string, dayId: string, input: Partial<SessionDay>): Promise<void>;
  removeDay(eventId: string, dayId: string): Promise<void>;
  startDay(eventId: string, dayId: string): Promise<void>;
  postponeDay(eventId: string, dayId: string, reason?: string): Promise<void>;
  rescheduleDay(eventId: string, dayId: string, newDate: string, startTime: string): Promise<void>;
  cancelDay(eventId: string, dayId: string, reason?: string): Promise<void>;
  completeDay(eventId: string, dayId: string): Promise<void>;
}

export interface ZoneFilters extends PaginationParams {
  name?: string;
}

export interface ZoneMutationInput {
  name: string;
  price: number;
  quantity: number;
  hierarchy: number;
  numberedSeating: boolean;
}

export interface ZoneService {
  getZones(eventId: string, dayId: string, filters?: ZoneFilters): Promise<PaginatedResult<Zone>>;
  createZone(eventId: string, dayId: string, input: ZoneMutationInput): Promise<{ id: string }>;
  updateZone(zoneId: string, eventId: string, dayId: string, input: ZoneMutationInput): Promise<void>;
  removeZone(zoneId: string, eventId: string, dayId: string): Promise<void>;
}

export interface SeatFilters extends PaginationParams {
  code?: string;
  status?: SeatStatus;
}

export interface SeatService {
  getSeats(eventId: string, dayId: string, zoneId: string, filters?: SeatFilters): Promise<PaginatedResult<Seat>>;
  findSeat(seatId: string, eventId: string, dayId: string, zoneId: string): Promise<Seat>;
  createSeat(eventId: string, dayId: string, zoneId: string, code: string): Promise<{ id: string }>;
  updateSeat(seatId: string, eventId: string, dayId: string, zoneId: string, input: Partial<Seat>): Promise<void>;
  removeSeat(seatId: string, eventId: string, dayId: string, zoneId: string): Promise<void>;
  blockSeat(seatId: string, eventId: string, dayId: string, zoneId: string): Promise<void>;
  unblockSeat(seatId: string, eventId: string, dayId: string, zoneId: string): Promise<void>;
  bulkCreateSeats(eventId: string, dayId: string, zoneId: string, codes: string[]): Promise<{ created: number; ids: string[] }>;
}

export interface DiscountFilters extends PaginationParams {
  eventId?: string;
  code?: string;
  type?: DiscountType;
  active?: boolean;
}

export interface DiscountService {
  getDiscounts(filters?: DiscountFilters): Promise<PaginatedResult<Discount>>;
  create(input: Partial<Discount>): Promise<{ id: string }>;
  update(id: string, input: Partial<Discount>): Promise<void>;
  remove(id: string): Promise<void>;
}

export interface OrderFilters extends PaginationParams {
  id?: string;
  eventId?: string;
  dayId?: string;
  user?: string;
  status?: OrderStatus;
  paymentMethod?: PaymentMethod;
  dateFrom?: string;
  dateTo?: string;
  amountMin?: number;
  amountMax?: number;
}

export interface OrderService {
  getOrders(filters?: OrderFilters): Promise<PaginatedResult<Order>>;
  getOrderDetails(id: string): Promise<Order>;
  cancelPendingOrder(id: string): Promise<void>;
}

export interface PaymentFilters extends PaginationParams {
  id?: string;
  externalReference?: string;
  orderId?: string;
  eventId?: string;
  dayId?: string;
  method?: PaymentMethod;
  status?: PaymentStatus;
  dateFrom?: string;
  dateTo?: string;
}

export interface PaymentService {
  getPayments(filters?: PaymentFilters): Promise<PaginatedResult<Payment>>;
  getPaymentDetails(id: string): Promise<Payment>;
}

export interface TicketFilters extends PaginationParams {
  code?: string;
  qrCode?: string;
  eventId?: string;
  dayId?: string;
  zoneId?: string;
  status?: TicketStatus;
  orderId?: string;
  hasSeat?: boolean;
}

export interface TicketService {
  getTickets(filters?: TicketFilters): Promise<PaginatedResult<Ticket>>;
  getTicketDetails(id: string): Promise<Ticket>;
  downloadPdfBlob(id: string, orderId: string): Promise<Blob>;
}

export interface AccessService {
  getSummary(eventId: string, dayId: string): Promise<AccessSummary>;
  validateTicket(params: { eventId: string; dayId: string; code?: string; qrCode?: string }): Promise<ValidateTicketResponse>;
}

export interface CustomerFilters extends PaginationParams {
  search?: string;
  email?: string;
  document?: string;
  eventId?: string;
}

export interface CustomerService {
  getCustomers(filters?: CustomerFilters): Promise<PaginatedResult<Customer>>;
  getCustomerDetails(id: string): Promise<Customer>;
}

export interface ReviewFilters extends PaginationParams {
  eventId?: string;
  rating?: number;
}

export interface ReviewService {
  getReviews(filters?: ReviewFilters): Promise<PaginatedResult<Review>>;
  getReviewSummary(eventId?: string): Promise<ReviewSummary>;
}

export interface DashboardFilters {
  dateFrom?: string;
  dateTo?: string;
  eventId?: string;
  dayId?: string;
  currency?: string;
}

export interface DashboardService {
  getDashboardData(filters?: DashboardFilters): Promise<DashboardData>;
}
