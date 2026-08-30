import { HttpClient, httpClient } from './httpClient';
import {
  AuthService,
  LoginParams,
  RegisterParams,
  AuthResponse,
  CompanyService,
  CategoryService,
  CategoryFilters,
  EventService,
  EventFilters,
  ZoneMutationInput,
  SessionService,
  ZoneService,
  ZoneFilters,
  SeatService,
  SeatFilters,
  DiscountService,
  DiscountFilters,
  OrderService,
  OrderFilters,
  PaymentService,
  PaymentFilters,
  TicketService,
  TicketFilters,
  AccessService,
  CustomerService,
  CustomerFilters,
  ReviewService,
  ReviewFilters,
  DashboardService,
  DashboardFilters,
} from './interfaces';

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
  CanvasSchema,
  EventStatus,
} from '../../types';

export class HttpAuthService implements AuthService {
  constructor(private http: HttpClient = httpClient) {}

  async login(params: LoginParams): Promise<AuthResponse> {
    const res = await this.http.post<AuthResponse>('/login', params);
    if (typeof window !== 'undefined' && res.token) {
      localStorage.setItem('ticketplus_jwt_token', res.token);
    }
    return res;
  }

  async register(params: RegisterParams): Promise<AuthResponse> {
    const res = await this.http.post<AuthResponse>('/register', params);
    if (typeof window !== 'undefined' && res.token) {
      localStorage.setItem('ticketplus_jwt_token', res.token);
    }
    return res;
  }

  async requestRecovery(email: string): Promise<void> {
    await this.http.post('/recovery/email', { email });
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    await this.http.post('/recovery/execute', { token, newPassword });
  }

  async getCurrentUser(): Promise<UserProfile> {
    return this.http.get<UserProfile>('/api/user');
  }

  async updateProfile(input: Partial<UserProfile>): Promise<UserProfile> {
    return this.http.put<UserProfile>('/api/user', input);
  }

  async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    await this.http.put('/api/user/password', { oldPassword, newPassword });
  }

  async uploadProfileImage(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('profileImage', file);
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'}/api/user/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('ticketplus_jwt_token') || ''}`,
      },
      body: formData,
    });
    const json = await res.json();
    return json.url || json.profileImage;
  }
}

export class HttpCompanyService implements CompanyService {
  constructor(private http: HttpClient = httpClient) {}

  async getUserCompanies(params?: PaginationParams): Promise<PaginatedResult<Membership>> {
    const page = params?.page || 1;
    const limit = params?.limit || 10;
    const res = await this.http.get<{ total: number; companies: Membership[] }>(
      `/api/member/company?orderBy=createdAt&order=DESC&limit=${limit}&page=${page}`
    );
    return { items: res.companies, total: res.total, page, limit };
  }

  async getCurrentMembership(): Promise<Membership> {
    return this.http.get<Membership>('/api/member');
  }

  async switchCompany(companyId: string): Promise<void> {
    await this.http.put('/api/user/company', { company: companyId });
  }

  async createCompany(input: Partial<Company>): Promise<{ id: string }> {
    return this.http.post<{ id: string }>('/api/company', input);
  }

  async updateCompany(input: Partial<Company>): Promise<void> {
    const payload = {
      name: input.name,
      description: input.description,
      logo: input.logo,
      email: input.email,
      telephone: input.telephone,
      webSite: input.webSite,
      country: input.country,
      city: input.city,
      location: input.location,
      timezone: input.timezone,
      documentType: input.document?.type,
      documentNumber: input.document?.number,
      default: {
        taxRate: input.defaultTaxRate,
        currency: input.defaultCurrency,
      },
    };
    await this.http.put('/api/company', payload);
  }

  async uploadLogo(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('logo', file);
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'}/api/company/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('ticketplus_jwt_token') || ''}`,
      },
      body: formData,
    });
    const json = await res.json();
    return json.url || json.logo;
  }

  async getCompanyDetails(id?: string): Promise<Company> {
    type CompanyDefault = { taxRate?: number; currency?: string };
    type CompanyDetailsResponse = Omit<Company, 'defaultTaxRate' | 'defaultCurrency'> & {
      default: CompanyDefault;
    };

    const response = await this.http.get<CompanyDetailsResponse>(id ? `/api/company/${id}` : '/api/company');
    const { default: defaultValues, ...company } = response;

    return {
      ...company,
      defaultTaxRate: defaultValues.taxRate ?? 18,
      defaultCurrency: defaultValues.currency ?? 'PEN',
    };
  }

  async getTeamMembers(params?: PaginationParams & { search?: string; role?: number; status?: number }): Promise<PaginatedResult<Membership>> {
    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const res = await this.http.get<{ total: number; members: Membership[] }>(
      `/api/member/team?limit=${limit}&page=${page}`
    );
    return { items: res.members, total: res.total, page, limit };
  }
}

export class HttpCategoryService implements CategoryService {
  constructor(private http: HttpClient = httpClient) {}

  async search(filters?: CategoryFilters): Promise<PaginatedResult<Category>> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const res = await this.http.get<{ total: number; categories: Category[] }>(
      `/api/category?orderBy=createdAt&order=DESC&limit=${limit}&page=${page}`
    );
    return { items: res.categories, total: res.total, page, limit };
  }

  async create(input: Omit<Category, 'id'>): Promise<{ id: string }> {
    return this.http.post<{ id: string }>('/api/category', input);
  }

  async update(id: string, input: Partial<Category>): Promise<void> {
    await this.http.put(`/api/category/${id}`, input);
  }

  async remove(id: string): Promise<void> {
    await this.http.delete(`/api/category/${id}`);
  }
}

export class HttpEventService implements EventService {
  constructor(private http: HttpClient = httpClient) {}

  async search(filters?: EventFilters): Promise<PaginatedResult<EventDetail>> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const orderBy = filters?.orderBy || 'createdAt';
    const order = filters?.order || 'DESC';
    const query = new URLSearchParams({
      orderBy,
      order,
      limit: String(limit),
      page: String(page),
    });
    const value = filters?.value || filters?.name;
    if (value) query.set('value', value);
    if (filters?.status !== undefined) query.set('status', String(filters.status));
    if (filters?.category) query.set('category', filters.category);
    if (filters?.date) query.set('date', filters.date);

    const res = await this.http.get<{
      total: number;
      events: Array<{
        id: string;
        name: string;
        location: string;
        country: string;
        city: string;
        currency: string;
        taxRate: number;
        status: EventStatus;
        category: EventDetail['category'];
        date: string;
        thumbnail?: string | null;
        coverImage?: string | null;
      }>;
    }>(`/api/event?${query.toString()}`);

    return {
      items: res.events.map((event) => ({
        ...event,
        description: '',
        coverImage: event.thumbnail || event.coverImage || null,
        venueName: event.location,
        days: [],
      })),
      total: res.total,
      page,
      limit,
    };
  }

  async getCategoryOptions(): Promise<Array<{ code: string; label: string }>> {
    return this.http.get<Array<{ code: string; label: string }>>('/api/category/choose');
  }

  async find(id: string): Promise<EventDetail> {
    const event = await this.http.get<EventDetail & {
      venue?: string;
      orderLimit?: number;
      thumbnail?: string | null;
    }>(`/api/event/${id}`);

    return {
      ...event,
      description: event.description || '',
      venueName: event.venueName || event.venue || event.location,
      coverImage: event.coverImage ?? null,
      maxTicketsPerOrder: event.maxTicketsPerOrder ?? event.orderLimit ?? 5,
      days: event.days || [],
    };
  }

  async create(input: Partial<EventDetail>): Promise<{ id: string }> {
    return this.http.post<{ id: string }>('/api/event', input);
  }

  async createEvent(input: CreateEventRequest): Promise<{ id: string }> {
    return this.http.post<{ id: string }>('/api/event', input);
  }

  async update(id: string, input: Partial<EventDetail>): Promise<void> {
    await this.http.put(`/api/event/${id}`, { id, ...input });
  }

  async remove(id: string): Promise<void> {
    await this.http.delete(`/api/event/${id}`);
  }

  async publish(id: string, reason?: string): Promise<void> {
    await this.http.post(`/api/event/${id}/publish`, { reason });
  }

  async pause(id: string, reason?: string): Promise<void> {
    await this.http.post(`/api/event/${id}/pause`, { reason });
  }

  async resume(id: string): Promise<void> {
    await this.http.post(`/api/event/${id}/resume`, {});
  }

  async cancel(id: string, reason?: string): Promise<void> {
    await this.http.post(`/api/event/${id}/cancel`, { reason });
  }

  async complete(id: string): Promise<void> {
    await this.http.post(`/api/event/${id}/complete`, {});
  }

  private async uploadImage(id: string, path: string, key: string, file: File): Promise<string> {
    const formData = new FormData();
    formData.append(key, file);
    const token = localStorage.getItem('ticketplus_jwt_token');
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'}/api/event/${id}/${path}`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: formData,
    });
    const contentType = res.headers.get('content-type');
    let json: any = {};
    if (contentType?.includes('application/json')) {
      try { json = await res.json(); } catch { json = {}; }
    }
    if (!res.ok) throw json;
    return json[key] || json.url || '';
  }

  async uploadCover(id: string, file: File): Promise<string> {
    return this.uploadImage(id, 'cover', 'coverImage', file);
  }

  async uploadBanner(id: string, file: File): Promise<string> {
    return this.uploadImage(id, 'banner', 'bannerImage', file);
  }

  async uploadLogo(id: string, file: File): Promise<string> {
    return this.uploadImage(id, 'logo', 'logo', file);
  }

  async uploadThumbnail(id: string, file: File): Promise<string> {
    return this.uploadImage(id, 'thumbnail', 'thumbnail', file);
  }

  async removeCover(id: string): Promise<void> {
    await this.http.post(`/api/event/${id}/cover`, { coverImage: null });
  }

  async removeBanner(id: string): Promise<void> {
    await this.http.post(`/api/event/${id}/banner`, { bannerImage: null });
  }

  async removeLogo(id: string): Promise<void> {
    await this.http.post(`/api/event/${id}/logo`, { logo: null });
  }

  async removeThumbnail(id: string): Promise<void> {
    await this.http.post(`/api/event/${id}/thumbnail`, { thumbnail: null });
  }

  async getCanvas(eventId: string): Promise<CanvasSchema | null> {
    return this.http.get<CanvasSchema>(`/api/event/${eventId}/canvas`);
  }

  async saveCanvas(eventId: string, canvas: CanvasSchema): Promise<void> {
    await this.http.put(`/api/event/${eventId}/canvas`, { canvas });
  }

  async getLayout(eventId: string): Promise<any> {
    return this.http.get<any>(`/api/event/${eventId}/layout`);
  }

  async saveLayout(eventId: string, layout: any, expectedUpdatedAt?: string): Promise<{ updatedAt: string }> {
    return this.http.put<{ updatedAt: string }>(`/api/event/${eventId}/layout`, {
      ...layout,
      expectedUpdatedAt,
    });
  }
}

export interface CreateEventRequest {
  name: string;
  description: string;
  venue: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  location: string;
  orderLimit: number;
  country: string;
  city: string;
  taxRate: 0 | 18;
  currency: 'PEN' | 'USD';
  category: string;
  days: Array<{
    date: string;
    startTime: string;
    endTime: string;
    saleStartAt: string;
    description: string;
  }>;
}

export class HttpSessionService implements SessionService {
  constructor(private http: HttpClient = httpClient) {}

  async listDays(eventId: string): Promise<SessionDay[]> {
    const res = await this.http.get<{ days: SessionDay[] }>(`/api/event/${eventId}/day`);
    return res.days || [];
  }

  async findDay(eventId: string, dayId: string): Promise<SessionDay> {
    return this.http.get<SessionDay>(`/api/event/${eventId}/day/${dayId}`);
  }

  async createDay(eventId: string, input: Partial<SessionDay>): Promise<{ id: string }> {
    return this.http.post<{ id: string }>(`/api/event/${eventId}/day`, input);
  }

  async updateDay(eventId: string, dayId: string, input: Partial<SessionDay>): Promise<void> {
    await this.http.put(`/api/event/${eventId}/day/${dayId}`, input);
  }

  async removeDay(eventId: string, dayId: string): Promise<void> {
    await this.http.delete(`/api/event/${eventId}/day/${dayId}`);
  }

  async startDay(eventId: string, dayId: string): Promise<void> {
    await this.http.post(`/api/event/${eventId}/day/${dayId}/start`, {});
  }

  async postponeDay(eventId: string, dayId: string, reason?: string): Promise<void> {
    await this.http.post(`/api/event/${eventId}/day/${dayId}/postpone`, { reason });
  }

  async rescheduleDay(eventId: string, dayId: string, newDate: string, startTime: string): Promise<void> {
    await this.http.post(`/api/event/${eventId}/day/${dayId}/reschedule`, { date: newDate, startTime });
  }

  async cancelDay(eventId: string, dayId: string, reason?: string): Promise<void> {
    await this.http.post(`/api/event/${eventId}/day/${dayId}/cancel`, { reason });
  }

  async completeDay(eventId: string, dayId: string): Promise<void> {
    await this.http.post(`/api/event/${eventId}/day/${dayId}/complete`, {});
  }
}

export class HttpZoneService implements ZoneService {
  constructor(private http: HttpClient = httpClient) {}

  async getZones(eventId: string, dayId: string, filters?: ZoneFilters): Promise<PaginatedResult<Zone>> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 50;
    const res = await this.http.get<{ total: number; zones: Array<Omit<Zone, 'quantity'> & { quantity: number | Zone['quantity'] }> }>(
      `/api/zone/event/${eventId}/day/${dayId}?orderBy=hierarchy&order=DESC&limit=${limit}&page=${page}`
    );
    return {
      items: (res.zones || []).map((zone) => ({
        ...zone,
        quantity: typeof zone.quantity === 'number'
          ? { total: zone.quantity, sold: 0, reserved: 0, available: zone.quantity }
          : zone.quantity,
      })),
      total: res.total || 0,
      page,
      limit,
    };
  }

  async createZone(eventId: string, dayId: string, input: ZoneMutationInput): Promise<{ id: string }> {
    return this.http.post<{ id: string }>(`/api/zone/event/${eventId}/day/${dayId}`, input);
  }

  async updateZone(zoneId: string, eventId: string, dayId: string, input: ZoneMutationInput): Promise<void> {
    await this.http.put(`/api/zone/${zoneId}/event/${eventId}/day/${dayId}`, input);
  }

  async removeZone(zoneId: string, eventId: string, dayId: string): Promise<void> {
    await this.http.delete(`/api/zone/${zoneId}/event/${eventId}/day/${dayId}`);
  }
}

export class HttpSeatService implements SeatService {
  constructor(private http: HttpClient = httpClient) {}

  async getSeats(eventId: string, dayId: string, zoneId: string, filters?: SeatFilters): Promise<PaginatedResult<Seat>> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 50;
    const res = await this.http.get<{ total: number; seats: Seat[] }>(
      `/api/seat/event/${eventId}/day/${dayId}/zone/${zoneId}?orderBy=code&order=ASC`
    );
    return { items: res.seats || [], total: res.total || 0, page, limit };
  }

  async findSeat(seatId: string, eventId: string, dayId: string, zoneId: string): Promise<Seat> {
    return this.http.get<Seat>(`/api/seat/${seatId}/event/${eventId}/day/${dayId}/zone/${zoneId}`);
  }

  async createSeat(eventId: string, dayId: string, zoneId: string, code: string): Promise<{ id: string }> {
    return this.http.post<{ id: string }>(`/api/seat/event/${eventId}/day/${dayId}/zone/${zoneId}`, { code });
  }

  async updateSeat(seatId: string, eventId: string, dayId: string, zoneId: string, input: Partial<Seat>): Promise<void> {
    await this.http.put(`/api/seat/${seatId}/event/${eventId}/day/${dayId}/zone/${zoneId}`, input);
  }

  async removeSeat(seatId: string, eventId: string, dayId: string, zoneId: string): Promise<void> {
    await this.http.delete(`/api/seat/${seatId}/event/${eventId}/day/${dayId}/zone/${zoneId}`);
  }

  async blockSeat(seatId: string, eventId: string, dayId: string, zoneId: string): Promise<void> {
    await this.http.post(`/api/seat/${seatId}/event/${eventId}/day/${dayId}/zone/${zoneId}/block`, {});
  }

  async unblockSeat(seatId: string, eventId: string, dayId: string, zoneId: string): Promise<void> {
    await this.http.post(`/api/seat/${seatId}/event/${eventId}/day/${dayId}/zone/${zoneId}/unblock`, {});
  }

  async bulkCreateSeats(eventId: string, dayId: string, zoneId: string, codes: string[]): Promise<{ created: number; ids: string[] }> {
    return this.http.post<{ created: number; ids: string[] }>(`/api/seat/event/${eventId}/day/${dayId}/zone/${zoneId}/bulk`, { seats: codes });
  }
}

export class HttpDiscountService implements DiscountService {
  constructor(private http: HttpClient = httpClient) {}

  async getDiscounts(filters?: DiscountFilters): Promise<PaginatedResult<Discount>> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const endpoint = filters?.eventId ? `/api/discount/event/${filters.eventId}` : '/api/discount';
    const res = await this.http.get<{ total: number; discounts: Discount[] }>(
      `${endpoint}?orderBy=createdAt&order=DESC&limit=${limit}&page=${page}`
    );
    return { items: res.discounts, total: res.total, page, limit };
  }

  async create(input: Partial<Discount>): Promise<{ id: string }> {
    const endpoint = input.eventId ? `/api/discount/event/${input.eventId}` : '/api/discount';
    return this.http.post<{ id: string }>(endpoint, input);
  }

  async update(id: string, input: Partial<Discount>): Promise<void> {
    const endpoint = input.eventId ? `/api/discount/${id}/event/${input.eventId}` : `/api/discount/${id}`;
    await this.http.put(endpoint, input);
  }

  async remove(id: string): Promise<void> {
    await this.http.delete(`/api/discount/${id}`);
  }
}

export class HttpOrderService implements OrderService {
  constructor(private http: HttpClient = httpClient) {}

  async getOrders(filters?: OrderFilters): Promise<PaginatedResult<Order>> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const res = await this.http.get<{ total: number; orders: Order[] }>(
      `/api/order?orderBy=createdAt&order=DESC&limit=${limit}&page=${page}`
    );
    return { items: res.orders, total: res.total, page, limit };
  }

  async getOrderDetails(id: string): Promise<Order> {
    return this.http.get<Order>(`/api/order/${id}`);
  }

  async cancelPendingOrder(id: string): Promise<void> {
    await this.http.delete(`/api/order/${id}`);
  }
}

export class HttpPaymentService implements PaymentService {
  constructor(private http: HttpClient = httpClient) {}

  async getPayments(filters?: PaymentFilters): Promise<PaginatedResult<Payment>> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const res = await this.http.get<{ total: number; payments: Payment[] }>(
      `/api/payment?orderBy=createdAt&order=DESC&limit=${limit}&page=${page}`
    );
    return { items: res.payments, total: res.total, page, limit };
  }

  async getPaymentDetails(id: string): Promise<Payment> {
    return this.http.get<Payment>(`/api/payment/${id}`);
  }
}

export class HttpTicketService implements TicketService {
  constructor(private http: HttpClient = httpClient) {}

  async getTickets(filters?: TicketFilters): Promise<PaginatedResult<Ticket>> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const res = await this.http.get<{ total: number; tickets: Ticket[] }>(
      `/api/ticket?orderBy=createdAt&order=DESC&limit=${limit}&page=${page}`
    );
    return { items: res.tickets, total: res.total, page, limit };
  }

  async getTicketDetails(id: string): Promise<Ticket> {
    return this.http.get<Ticket>(`/api/ticket/${id}`);
  }

  async downloadPdfBlob(id: string, orderId: string): Promise<Blob> {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'}/api/ticket/${id}/order/${orderId}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('ticketplus_jwt_token') || ''}` },
    });
    return res.blob();
  }
}

export class HttpAccessService implements AccessService {
  constructor(private http: HttpClient = httpClient) {}

  async getSummary(eventId: string, dayId: string): Promise<AccessSummary> {
    return this.http.get<AccessSummary>(`/api/access/summary?event=${eventId}&day=${dayId}`);
  }

  async validateTicket(params: { eventId: string; dayId: string; code?: string; qrCode?: string }): Promise<ValidateTicketResponse> {
    return this.http.post<ValidateTicketResponse>('/api/access/validate', params);
  }
}

export class HttpCustomerService implements CustomerService {
  constructor(private http: HttpClient = httpClient) {}

  async getCustomers(filters?: CustomerFilters): Promise<PaginatedResult<Customer>> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const res = await this.http.get<{ total: number; customers: Customer[] }>(
      `/api/customer?orderBy=lastPurchaseAt&order=DESC&limit=${limit}&page=${page}`
    );
    return { items: res.customers, total: res.total, page, limit };
  }

  async getCustomerDetails(id: string): Promise<Customer> {
    return this.http.get<Customer>(`/api/customer/${id}`);
  }
}

export class HttpReviewService implements ReviewService {
  constructor(private http: HttpClient = httpClient) {}

  async getReviews(filters?: ReviewFilters): Promise<PaginatedResult<Review>> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const res = await this.http.get<{ total: number; reviews: Review[] }>(
      `/api/review?orderBy=createdAt&order=DESC&limit=${limit}&page=${page}`
    );
    return { items: res.reviews, total: res.total, page, limit };
  }

  async getReviewSummary(eventId?: string): Promise<ReviewSummary> {
    return this.http.get<ReviewSummary>(eventId ? `/api/review/summary?event=${eventId}` : '/api/review/summary');
  }
}

export class HttpDashboardService implements DashboardService {
  constructor(private http: HttpClient = httpClient) {}

  async getDashboardData(filters?: DashboardFilters): Promise<DashboardData> {
    return this.http.get<DashboardData>('/api/dashboard');
  }
}

export interface DashboardSummary {
  approvedSales: number;
  approvedSalesVariation: number | null;
  paidOrders: number;
  averageOrderValue: number;
  soldTickets: number;
  soldTicketsVariation: number | null;
}

export interface ZoneOccupancySummary {
  occupancyPercentage: number;
  totalCapacity: number;
  soldCapacity: number;
  reservedCapacity: number;
  availableCapacity: number;
}

interface ApprovedSalesSummaryResponse {
  from: string;
  to: string;
  previousFrom: string;
  previousTo: string;
  amount: number;
  currency: string;
  variation: number | null;
}

interface PaidCountSummaryResponse {
  from: string;
  to: string;
  quantity: number;
  averageAmount: number;
  currency: string;
}

interface SoldTicketsSummaryResponse {
  from: string;
  to: string;
  previousFrom: string;
  previousTo: string;
  quantity: number;
  variation: number | null;
}

interface OccupancySummaryResponse {
  total: number;
  sold: number;
  reserved: number;
  available: number;
  occupancy: number;
}

export interface ApprovedSalesEvolution {
  from: string;
  to: string;
  currency: string;
  interval: string;
  sales: Array<{
    date: string;
    amount: number;
  }>;
}

export interface ApprovedSalesByEvent {
  from: string;
  to: string;
  currency: string;
  events: Array<{
    id: string;
    name: string;
    amount: number;
  }>;
}

interface UpcomingEventsResponse {
  events: Array<{
    id: string;
    name: string;
    location: string;
    venue?: string;
    venueName?: string;
    thumbnail?: string | null;
    coverImage?: string | null;
    country: string;
    city: string;
    currency: string;
    taxRate: number;
    status: EventStatus;
    category: EventDetail['category'];
    date: string;
  }>;
  total: number;
}

function variationToPercentage(variation: number | null): number | null {
  return variation === null ? null : variation * 100;
}

export class HttpDashboardSummaryService {
  constructor(private http: HttpClient = httpClient) {}

  async getSummary(filters: DashboardFilters): Promise<DashboardSummary> {
    const from = filters.dateFrom || '';
    const to = filters.dateTo || '';
    const currency = filters.currency || 'PEN';
    const dateQuery = `from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;

    const [approvedSales, paidOrders, soldTickets] = await Promise.all([
      this.http.get<ApprovedSalesSummaryResponse>(
        `/api/order/report/approved-sales-summary?${dateQuery}&currency=${encodeURIComponent(currency)}`
      ),
      this.http.get<PaidCountSummaryResponse>(
        `/api/order/report/paid-count-summary?${dateQuery}&currency=${encodeURIComponent(currency)}`
      ),
      this.http.get<SoldTicketsSummaryResponse>(`/api/ticket/report/sold-summary?${dateQuery}`),
    ]);

    return {
      approvedSales: approvedSales.amount,
      approvedSalesVariation: variationToPercentage(approvedSales.variation),
      paidOrders: paidOrders.quantity,
      averageOrderValue: paidOrders.averageAmount,
      soldTickets: soldTickets.quantity,
      soldTicketsVariation: variationToPercentage(soldTickets.variation),
    };
  }

  async getOccupancy(): Promise<ZoneOccupancySummary> {
    const occupancy = await this.http.get<OccupancySummaryResponse>('/api/zone/report/occupancy-summary');

    return {
      occupancyPercentage: occupancy.occupancy,
      totalCapacity: occupancy.total,
      soldCapacity: occupancy.sold,
      reservedCapacity: occupancy.reserved,
      availableCapacity: occupancy.available,
    };
  }

  async getSalesEvolution(filters: DashboardFilters): Promise<ApprovedSalesEvolution> {
    const from = filters.dateFrom || '';
    const to = filters.dateTo || '';
    const currency = filters.currency || 'PEN';
    const query = [
      `from=${encodeURIComponent(from)}`,
      `to=${encodeURIComponent(to)}`,
      `currency=${encodeURIComponent(currency)}`,
    ].join('&');

    return this.http.get<ApprovedSalesEvolution>(`/api/order/report/approved-sales-evolution?${query}`);
  }

  async getSalesByEvent(filters: DashboardFilters, limit = 5): Promise<ApprovedSalesByEvent> {
    const from = filters.dateFrom || '';
    const to = filters.dateTo || '';
    const currency = filters.currency || 'PEN';
    const query = [
      `from=${encodeURIComponent(from)}`,
      `to=${encodeURIComponent(to)}`,
      `currency=${encodeURIComponent(currency)}`,
      `limit=${encodeURIComponent(String(limit))}`,
    ].join('&');

    return this.http.get<ApprovedSalesByEvent>(`/api/order/report/approved-sales-by-event?${query}`);
  }

  async getUpcomingEvents(date: string, limit = 5): Promise<EventDetail[]> {
    const query = [
      'orderBy=createdAt',
      'order=DESC',
      `limit=${encodeURIComponent(String(limit))}`,
      `date=${encodeURIComponent(date)}`,
    ].join('&');
    const response = await this.http.get<UpcomingEventsResponse>(`/api/event?${query}`);

    return response.events.map((event) => ({
      id: event.id,
      name: event.name,
      description: '',
      coverImage: event.thumbnail || event.coverImage || null,
      location: event.location,
      venueName: event.venueName || event.venue || event.location,
      country: event.country,
      city: event.city,
      currency: event.currency,
      taxRate: event.taxRate,
      status: event.status,
      category: event.category,
      days: [],
      date: event.date,
    }));
  }
}
