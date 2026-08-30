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
  SessionService,
  ZoneService,
  ZoneFilters,
  ZoneMutationInput,
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
} from '../../lib/api/interfaces';

import {
  UserProfile,
  Company,
  CompanyStatus,
  Membership,
  Category,
  EventDetail,
  SessionDay,
  Zone,
  Seat,
  SeatStatus,
  Discount,
  Order,
  OrderStatus,
  Payment,
  Ticket,
  TicketStatus,
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
  DocumentType,
  MemberRole,
  MemberStatus,
  PaymentMethod,
  PaymentStatus,
  CanvasSchema,
} from '../../types';

import { mockDb } from '../database';

function applyPagination<T>(items: T[], params?: PaginationParams): PaginatedResult<T> {
  const page = params?.page || 1;
  const limit = params?.limit || 20;
  const startIndex = (page - 1) * limit;
  const paginated = items.slice(startIndex, startIndex + limit);
  return {
    items: paginated,
    total: items.length,
    page,
    limit,
  };
}

export class MockAuthService implements AuthService {
  async login(params: LoginParams): Promise<AuthResponse> {
    await mockDb.simulateLatency();
    if (params.email === 'admin@ticketplus.pe' && params.password === 'Password123!') {
      return { token: 'mock-jwt-token-admin-ticketplus' };
    }
    // Also accept any valid format for easy testing
    if (params.email && params.password) {
      return { token: `mock-jwt-token-${params.email}` };
    }
    throw { error: { code: 'INVALID_CREDENTIALS', status: 401 } };
  }

  async register(params: RegisterParams): Promise<AuthResponse> {
    await mockDb.simulateLatency();
    const newUser: UserProfile = {
      id: `usr-${Date.now()}`,
      email: params.email,
      name: params.name,
      lastName: params.lastName,
      birthDate: params.birthDate,
      city: params.city,
      country: params.country,
      document: { type: params.documentType as DocumentType, number: params.documentNumber },
      mobile: params.mobile,
    };
    mockDb.users.push(newUser);
    mockDb.save();
    return { token: `mock-jwt-token-${newUser.id}` };
  }

  async requestRecovery(email: string): Promise<void> {
    await mockDb.simulateLatency();
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    await mockDb.simulateLatency();
  }

  async getCurrentUser(): Promise<UserProfile> {
    await mockDb.simulateLatency();
    const user = mockDb.users.find((u) => u.id === mockDb.activeUserId) || mockDb.users[0];
    return user;
  }

  async updateProfile(input: Partial<UserProfile>): Promise<UserProfile> {
    await mockDb.simulateLatency();
    let user = mockDb.users.find((u) => u.id === mockDb.activeUserId);
    if (!user) throw { error: { code: 'USER_NOT_FOUND', status: 404 } };
    user = { ...user, ...input };
    mockDb.users = mockDb.users.map((u) => (u.id === user!.id ? user! : u));
    mockDb.save();
    return user;
  }

  async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    await mockDb.simulateLatency();
  }

  async uploadProfileImage(file: File): Promise<string> {
    await mockDb.simulateLatency();
    const imageUrl = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';
    let user = mockDb.users.find((u) => u.id === mockDb.activeUserId);
    if (user) {
      user.profileImage = imageUrl;
      mockDb.save();
    }
    return imageUrl;
  }
}

export class MockCompanyService implements CompanyService {
  async getUserCompanies(params?: PaginationParams): Promise<PaginatedResult<Membership>> {
    await mockDb.simulateLatency();
    const memberships = mockDb.memberships.filter((m) => m.userId === mockDb.activeUserId);
    return applyPagination(memberships, params);
  }

  async getCurrentMembership(): Promise<Membership> {
    await mockDb.simulateLatency();
    const membership = mockDb.memberships.find(
      (m) => m.userId === mockDb.activeUserId && m.companyId === mockDb.activeCompanyId
    ) || mockDb.memberships[0];
    return membership;
  }

  async switchCompany(companyId: string): Promise<void> {
    await mockDb.simulateLatency();
    mockDb.activeCompanyId = companyId;
    mockDb.save();
  }

  async createCompany(input: Partial<Company>): Promise<{ id: string }> {
    await mockDb.simulateLatency();
    const newCompId = `comp-${Date.now()}`;
    const newCompany: Company = {
      id: newCompId,
      name: input.name || 'Nueva Compañía S.A.C.',
      description: input.description || '',
      logo: input.logo || null,
      email: input.email || 'contacto@empresa.pe',
      telephone: input.telephone || '+5115550000',
      webSite: input.webSite || '',
      country: input.country || 'PE',
      city: input.city || 'LIM',
      location: input.location || 'Av. Principal 123',
      document: input.document || { type: DocumentType.RUC, number: '20609999999' },
      status: CompanyStatus.ACTIVE,
      timezone: input.timezone || 'America/Lima',
      defaultCurrency: input.defaultCurrency || 'PEN',
      defaultTaxRate: input.defaultTaxRate || 18,
    };
    mockDb.companies.push(newCompany);

    const newMembership: Membership = {
      id: `mem-${Date.now()}`,
      userId: mockDb.activeUserId,
      userName: 'Oscar Ramírez',
      companyId: newCompId,
      companyName: newCompany.name,
      role: MemberRole.OWNER,
      status: MemberStatus.ACTIVE,
      createdAt: new Date().toISOString(),
    };
    mockDb.memberships.push(newMembership);
    mockDb.activeCompanyId = newCompId;
    mockDb.save();
    return { id: newCompId };
  }

  async updateCompany(input: Partial<Company>): Promise<void> {
    await mockDb.simulateLatency();
    const compIdx = mockDb.companies.findIndex((c) => c.id === mockDb.activeCompanyId);
    if (compIdx >= 0) {
      mockDb.companies[compIdx] = { ...mockDb.companies[compIdx], ...input };
      mockDb.save();
    }
  }

  async uploadLogo(file: File): Promise<string> {
    await mockDb.simulateLatency();
    const logoUrl = 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=150&auto=format&fit=crop&q=80';
    const comp = mockDb.companies.find((c) => c.id === mockDb.activeCompanyId);
    if (comp) {
      comp.logo = logoUrl;
      mockDb.save();
    }
    return logoUrl;
  }

  async getCompanyDetails(id?: string): Promise<Company> {
    await mockDb.simulateLatency();
    const targetId = id || mockDb.activeCompanyId;
    const comp = mockDb.companies.find((c) => c.id === targetId) || mockDb.companies[0];
    return comp;
  }

  async getTeamMembers(params?: PaginationParams & { search?: string; role?: number; status?: number }): Promise<PaginatedResult<Membership>> {
    await mockDb.simulateLatency();
    let members = mockDb.memberships.filter((m) => m.companyId === mockDb.activeCompanyId);
    if (params?.search) {
      const q = params.search.toLowerCase();
      members = members.filter((m) => m.userName.toLowerCase().includes(q));
    }
    if (params?.role !== undefined) {
      members = members.filter((m) => m.role === params.role);
    }
    if (params?.status !== undefined) {
      members = members.filter((m) => m.status === params.status);
    }
    return applyPagination(members, params);
  }
}

export class MockCategoryService implements CategoryService {
  async search(filters?: CategoryFilters): Promise<PaginatedResult<Category>> {
    await mockDb.simulateLatency();
    let list = [...mockDb.categories];
    if (filters?.name) {
      const q = filters.name.toLowerCase();
      list = list.filter((c) => c.name.toLowerCase().includes(q));
    }
    return applyPagination(list, filters);
  }

  async create(input: Omit<Category, 'id'>): Promise<{ id: string }> {
    await mockDb.simulateLatency();
    const id = `cat-${Date.now()}`;
    const newCat: Category = { id, ...input };
    mockDb.categories.push(newCat);
    mockDb.save();
    return { id };
  }

  async update(id: string, input: Partial<Category>): Promise<void> {
    await mockDb.simulateLatency();
    const idx = mockDb.categories.findIndex((c) => c.id === id);
    if (idx >= 0) {
      mockDb.categories[idx] = { ...mockDb.categories[idx], ...input };
      mockDb.save();
    }
  }

  async remove(id: string): Promise<void> {
    await mockDb.simulateLatency();
    mockDb.categories = mockDb.categories.filter((c) => c.id !== id);
    mockDb.save();
  }
}

export class MockEventService implements EventService {
  async search(filters?: EventFilters): Promise<PaginatedResult<EventDetail>> {
    await mockDb.simulateLatency();
    let list = [...mockDb.events];

    if (filters?.name) {
      const q = filters.name.toLowerCase();
      list = list.filter((e) => e.name.toLowerCase().includes(q) || e.location.toLowerCase().includes(q));
    }
    if (filters?.status !== undefined) {
      list = list.filter((e) => e.status === Number(filters.status));
    }
    if (filters?.category) {
      list = list.filter((e) => {
        const catCode = typeof e.category === 'object' ? e.category.code : e.category;
        return catCode === filters.category;
      });
    }
    if (filters?.city) {
      list = list.filter((e) => e.city.toLowerCase() === filters.city!.toLowerCase());
    }

    return applyPagination(list, filters);
  }

  async find(id: string): Promise<EventDetail> {
    await mockDb.simulateLatency();
    const evt = mockDb.events.find((e) => e.id === id);
    if (!evt) throw { error: { code: 'EVENT_NOT_FOUND', status: 404 } };
    return evt;
  }

  async create(input: Partial<EventDetail>): Promise<{ id: string }> {
    await mockDb.simulateLatency();
    const id = `evt-${Date.now()}`;
    const newEvent: EventDetail = {
      id,
      name: input.name || 'Nuevo Evento',
      slug: (input.name || 'nuevo-evento').toLowerCase().replace(/\s+/g, '-'),
      description: input.description || '',
      coverImage: input.coverImage || null,
      bannerImage: input.bannerImage || null,
      location: input.location || 'Ubicación por definir',
      venueName: input.venueName || 'Recinto Central',
      country: input.country || 'PE',
      city: input.city || 'LIM',
      currency: input.currency || 'PEN',
      taxRate: input.taxRate || 18,
      status: EventStatus.DRAFT,
      category: input.category || { code: 'cat-1', label: 'Conciertos' },
      days: input.days || [
        {
          id: `day-${id}-1`,
          eventId: id,
          date: new Date().toISOString().split('T')[0],
          startTime: '18:00',
          endTime: '23:00',
          status: DayStatus.SCHEDULED,
          inventory: { total: 500, sold: 0, reserved: 0, available: 500 },
          sales: { currency: 'PEN', gross: 0 },
        },
      ],
      salesStartAt: input.salesStartAt || new Date().toISOString(),
      salesEndAt: input.salesEndAt || '',
      maxTicketsPerOrder: input.maxTicketsPerOrder || 10,
    };
    mockDb.events.unshift(newEvent);
    mockDb.save();
    return { id };
  }

  async update(id: string, input: Partial<EventDetail>): Promise<void> {
    await mockDb.simulateLatency();
    const idx = mockDb.events.findIndex((e) => e.id === id);
    if (idx >= 0) {
      mockDb.events[idx] = { ...mockDb.events[idx], ...input };
      mockDb.save();
    }
  }

  async remove(id: string): Promise<void> {
    await mockDb.simulateLatency();
    mockDb.events = mockDb.events.filter((e) => e.id !== id);
    mockDb.save();
  }

  async publish(id: string, reason?: string): Promise<void> {
    await mockDb.simulateLatency();
    const evt = mockDb.events.find((e) => e.id === id);
    if (evt) {
      evt.status = EventStatus.PUBLISHED;
      mockDb.save();
    }
  }

  async pause(id: string, reason?: string): Promise<void> {
    await mockDb.simulateLatency();
    const evt = mockDb.events.find((e) => e.id === id);
    if (evt) {
      evt.status = EventStatus.PAUSED;
      mockDb.save();
    }
  }

  async resume(id: string): Promise<void> {
    await mockDb.simulateLatency();
    const evt = mockDb.events.find((e) => e.id === id);
    if (evt) {
      evt.status = EventStatus.PUBLISHED;
      mockDb.save();
    }
  }

  async cancel(id: string, reason?: string): Promise<void> {
    await mockDb.simulateLatency();
    const evt = mockDb.events.find((e) => e.id === id);
    if (evt) {
      evt.status = EventStatus.CANCELLED;
      mockDb.save();
    }
  }

  async complete(id: string): Promise<void> {
    await mockDb.simulateLatency();
    const evt = mockDb.events.find((e) => e.id === id);
    if (evt) {
      evt.status = EventStatus.COMPLETED;
      mockDb.save();
    }
  }

  async uploadCover(id: string, file: File): Promise<string> {
    await mockDb.simulateLatency();
    const url = 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80';
    const evt = mockDb.events.find((e) => e.id === id);
    if (evt) {
      evt.coverImage = url;
      mockDb.save();
    }
    return url;
  }

  async uploadBanner(id: string, file: File): Promise<string> {
    await mockDb.simulateLatency();
    const url = 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1200&auto=format&fit=crop&q=80';
    const evt = mockDb.events.find((e) => e.id === id);
    if (evt) {
      evt.bannerImage = url;
      mockDb.save();
    }
    return url;
  }

  async uploadLogo(id: string, file: File): Promise<string> {
    await mockDb.simulateLatency();
    const url = URL.createObjectURL(file);
    const evt = mockDb.events.find((e) => e.id === id);
    if (evt) evt.logo = url;
    return url;
  }

  async uploadThumbnail(id: string, file: File): Promise<string> {
    await mockDb.simulateLatency();
    const url = URL.createObjectURL(file);
    const evt = mockDb.events.find((e) => e.id === id);
    if (evt) evt.thumbnail = url;
    return url;
  }

  async removeCover(id: string): Promise<void> {
    const evt = mockDb.events.find((e) => e.id === id);
    if (evt) evt.coverImage = null;
  }

  async removeBanner(id: string): Promise<void> {
    const evt = mockDb.events.find((e) => e.id === id);
    if (evt) evt.bannerImage = null;
  }

  async removeLogo(id: string): Promise<void> {
    const evt = mockDb.events.find((e) => e.id === id);
    if (evt) evt.logo = null;
  }

  async removeThumbnail(id: string): Promise<void> {
    const evt = mockDb.events.find((e) => e.id === id);
    if (evt) evt.thumbnail = null;
  }

  async getCanvas(eventId: string): Promise<CanvasSchema | null> {
    await mockDb.simulateLatency();
    const evt = mockDb.events.find((e) => e.id === eventId);
    return evt?.canvas || null;
  }

  async saveCanvas(eventId: string, canvas: CanvasSchema): Promise<void> {
    await mockDb.simulateLatency();
    const evt = mockDb.events.find((e) => e.id === eventId);
    if (evt) {
      evt.canvas = canvas;
      mockDb.save();
    }
  }

  async getLayout(eventId: string): Promise<any> {
    await mockDb.simulateLatency();
    const evt = mockDb.events.find((e) => e.id === eventId) || mockDb.events[0];
    const eventZones = mockDb.zones.filter((z) => z.eventId === evt.id || z.eventId === 'evt-lima-sound-2026');

    return {
      eventId: evt.id,
      version: 1,
      updatedAt: evt.date || '2026-08-27T16:30:00-05:00',
      eventCanvas: {
        width: 1600,
        height: 1000,
        background: { type: 'color', color: '#F8FAFC', opacity: 1 },
        grid: { enabled: true, size: 20, snap: true, visible: true },
        viewport: { zoom: 1, x: 0, y: 0 },
        objects: [
          {
            id: 'stage-main',
            type: 'stage',
            name: 'Escenario Principal',
            x: 500,
            y: 50,
            width: 600,
            height: 120,
            rotation: 0,
            locked: false,
            visible: true,
            zIndex: 10,
            style: { fill: '#111827', stroke: '#000000', strokeWidth: 2, opacity: 1 },
            label: { text: 'ESCENARIO PRINCIPAL', fontSize: 22, fontWeight: 700, color: '#FFFFFF', align: 'center' },
          },
          {
            id: 'entrance-north',
            type: 'entrance',
            name: 'Ingreso Puerta Norte',
            x: 100,
            y: 80,
            width: 140,
            height: 40,
            rotation: 0,
            locked: false,
            visible: true,
            zIndex: 15,
            style: { fill: '#16A34A', stroke: '#15803D', strokeWidth: 2, opacity: 0.9 },
            label: { text: 'INGRESO PRINCIPAL', fontSize: 12, fontWeight: 700, color: '#FFFFFF', align: 'center' },
          },
          {
            id: 'exit-south',
            type: 'exit',
            name: 'Salida Emergencia',
            x: 1360,
            y: 850,
            width: 140,
            height: 40,
            rotation: 0,
            locked: false,
            visible: true,
            zIndex: 15,
            style: { fill: '#DC2626', stroke: '#B91C1C', strokeWidth: 2, opacity: 0.9 },
            label: { text: 'SALIDA EMERGENCIA', fontSize: 12, fontWeight: 700, color: '#FFFFFF', align: 'center' },
          },
        ],
      },
      zones: eventZones.map((z, idx) => {
        const isPolygon = idx === 0;
        return {
          id: z.id,
          name: z.name,
          price: z.price,
          quantity: z.quantity,
          canvas: {
            visible: true,
            locked: false,
            zIndex: 20 + idx,
            geometries: [
              isPolygon
                ? {
                    id: `geo-${z.id}-poly`,
                    type: 'polygon',
                    points: [
                      { x: 300, y: 250 },
                      { x: 1300, y: 250 },
                      { x: 1250, y: 550 },
                      { x: 350, y: 550 },
                    ],
                    rotation: 0,
                  }
                : {
                    id: `geo-${z.id}-rect`,
                    type: 'rect',
                    x: 200 + idx * 40,
                    y: 600,
                    width: 1200 - idx * 80,
                    height: 250,
                    rotation: 0,
                  },
            ],
            style: {
              fill: idx === 0 ? '#4F46E5' : '#0284C7',
              stroke: idx === 0 ? '#3730A3' : '#0369A1',
              strokeWidth: 2,
              opacity: 0.82,
            },
            label: {
              text: z.name,
              visible: true,
              fontSize: 20,
              fontWeight: 700,
              color: '#FFFFFF',
              showPrice: true,
              showAvailability: false,
            },
          },
        };
      }),
    };
  }

  async saveLayout(eventId: string, layout: any, expectedUpdatedAt?: string): Promise<{ updatedAt: string }> {
    await mockDb.simulateLatency();
    const newTimestamp = new Date().toISOString();
    const evt = mockDb.events.find((e) => e.id === eventId);
    if (evt) {
      evt.canvas = layout.eventCanvas;
      mockDb.save();
    }
    return { updatedAt: newTimestamp };
  }
}

export class MockSessionService implements SessionService {
  async listDays(eventId: string): Promise<SessionDay[]> {
    await mockDb.simulateLatency();
    const evt = mockDb.events.find((e) => e.id === eventId);
    return evt?.days || [];
  }

  async findDay(eventId: string, dayId: string): Promise<SessionDay> {
    await mockDb.simulateLatency();
    const evt = mockDb.events.find((e) => e.id === eventId);
    const day = evt?.days.find((d) => d.id === dayId);
    if (!day) throw { error: { code: 'DAY_NOT_FOUND', status: 404 } };
    return day;
  }

  async createDay(eventId: string, input: Partial<SessionDay>): Promise<{ id: string }> {
    await mockDb.simulateLatency();
    const evt = mockDb.events.find((e) => e.id === eventId);
    if (!evt) throw { error: { code: 'EVENT_NOT_FOUND', status: 404 } };

    const newDayId = `day-${eventId}-${Date.now()}`;
    const newDay: SessionDay = {
      id: newDayId,
      eventId,
      date: input.date || new Date().toISOString().split('T')[0],
      startTime: input.startTime || '18:00',
      endTime: input.endTime || '22:00',
      description: input.description || 'Nueva fecha',
      status: DayStatus.SCHEDULED,
      inventory: { total: 1000, sold: 0, reserved: 0, available: 1000 },
      sales: { currency: 'PEN', gross: 0 },
    };
    evt.days.push(newDay);
    mockDb.save();
    return { id: newDayId };
  }

  async updateDay(eventId: string, dayId: string, input: Partial<SessionDay>): Promise<void> {
    await mockDb.simulateLatency();
    const evt = mockDb.events.find((e) => e.id === eventId);
    if (evt) {
      const idx = evt.days.findIndex((d) => d.id === dayId);
      if (idx >= 0) {
        evt.days[idx] = { ...evt.days[idx], ...input };
        mockDb.save();
      }
    }
  }

  async removeDay(eventId: string, dayId: string): Promise<void> {
    await mockDb.simulateLatency();
    const evt = mockDb.events.find((e) => e.id === eventId);
    if (evt) {
      evt.days = evt.days.filter((d) => d.id !== dayId);
      mockDb.save();
    }
  }

  async startDay(eventId: string, dayId: string): Promise<void> {
    await this.updateDay(eventId, dayId, { status: DayStatus.IN_PROGRESS });
  }

  async postponeDay(eventId: string, dayId: string, reason?: string): Promise<void> {
    await this.updateDay(eventId, dayId, { status: DayStatus.POSTPONED });
  }

  async rescheduleDay(eventId: string, dayId: string, newDate: string, startTime: string): Promise<void> {
    await this.updateDay(eventId, dayId, { date: newDate, startTime, status: DayStatus.SCHEDULED });
  }

  async cancelDay(eventId: string, dayId: string, reason?: string): Promise<void> {
    await this.updateDay(eventId, dayId, { status: DayStatus.CANCELLED });
  }

  async completeDay(eventId: string, dayId: string): Promise<void> {
    await this.updateDay(eventId, dayId, { status: DayStatus.COMPLETED });
  }
}

export class MockZoneService implements ZoneService {
  async getZones(eventId: string, dayId: string, filters?: ZoneFilters): Promise<PaginatedResult<Zone>> {
    await mockDb.simulateLatency();
    let zones = mockDb.zones.filter((z) => (z.eventId === eventId && z.dayId === dayId) || (!z.dayId && z.eventId === eventId));
    if (zones.length === 0) {
      zones = mockDb.zones;
    }
    if (filters?.name) {
      const q = filters.name.toLowerCase();
      zones = zones.filter((z) => z.name.toLowerCase().includes(q));
    }
    return applyPagination(zones, filters);
  }

  async createZone(eventId: string, dayId: string, input: ZoneMutationInput): Promise<{ id: string }> {
    await mockDb.simulateLatency();
    const id = `zn-${Date.now()}`;
    const total = input.quantity || 100;
    const newZone: Zone = {
      id,
      name: input.name || 'Nueva Zona',
      hierarchy: input.hierarchy || 1,
      price: input.price || 100,
      numberedSeating: !!input.numberedSeating,
      quantity: {
        total,
        sold: 0,
        reserved: 0,
        available: total,
      },
      eventId,
      dayId,
    };
    mockDb.zones.push(newZone);
    mockDb.save();
    return { id };
  }

  async updateZone(zoneId: string, eventId: string, dayId: string, input: ZoneMutationInput): Promise<void> {
    await mockDb.simulateLatency();
    const idx = mockDb.zones.findIndex((z) => z.id === zoneId);
    if (idx >= 0) {
      const current = mockDb.zones[idx];
      const newTotal = input.quantity;
      const sold = current.quantity.sold;
      const reserved = current.quantity.reserved;
      if (newTotal < sold + reserved) {
        throw { error: { code: 'INVALID_CAPACITY', status: 422, message: 'El total no puede ser menor a los vendidos + reservados' } };
      }
      mockDb.zones[idx] = {
        ...current,
        ...input,
        quantity: {
          total: newTotal,
          sold,
          reserved,
          available: newTotal - sold - reserved,
        },
      };
      mockDb.save();
    }
  }

  async removeZone(zoneId: string, eventId: string, dayId: string): Promise<void> {
    await mockDb.simulateLatency();
    mockDb.zones = mockDb.zones.filter((z) => z.id !== zoneId);
    mockDb.save();
  }
}

export class MockSeatService implements SeatService {
  async getSeats(eventId: string, dayId: string, zoneId: string, filters?: SeatFilters): Promise<PaginatedResult<Seat>> {
    await mockDb.simulateLatency();
    let seats = mockDb.seats.filter((s) => s.zoneId === zoneId || (!s.zoneId && s.dayId === dayId));
    if (seats.length === 0) {
      seats = mockDb.seats;
    }
    if (filters?.code) {
      const q = filters.code.toLowerCase();
      seats = seats.filter((s) => s.code.toLowerCase().includes(q));
    }
    if (filters?.status !== undefined) {
      seats = seats.filter((s) => s.status === Number(filters.status));
    }
    return applyPagination(seats, filters);
  }

  async findSeat(seatId: string, eventId: string, dayId: string, zoneId: string): Promise<Seat> {
    await mockDb.simulateLatency();
    const seat = mockDb.seats.find((item) => item.id === seatId);
    if (!seat) throw new Error('Asiento no encontrado');
    return seat;
  }

  async createSeat(eventId: string, dayId: string, zoneId: string, code: string): Promise<{ id: string }> {
    await mockDb.simulateLatency();
    const id = `seat-${zoneId}-${code}`;
    const newSeat: Seat = {
      id,
      code,
      status: SeatStatus.AVAILABLE,
      zoneId,
      dayId,
      eventId,
    };
    mockDb.seats.push(newSeat);
    mockDb.save();
    return { id };
  }

  async updateSeat(seatId: string, eventId: string, dayId: string, zoneId: string, input: Partial<Seat>): Promise<void> {
    await mockDb.simulateLatency();
    const idx = mockDb.seats.findIndex((s) => s.id === seatId);
    if (idx >= 0) {
      mockDb.seats[idx] = { ...mockDb.seats[idx], ...input };
      mockDb.save();
    }
  }

  async removeSeat(seatId: string, eventId: string, dayId: string, zoneId: string): Promise<void> {
    await mockDb.simulateLatency();
    mockDb.seats = mockDb.seats.filter((s) => s.id !== seatId);
    mockDb.save();
  }

  async blockSeat(seatId: string, eventId: string, dayId: string, zoneId: string): Promise<void> {
    await this.updateSeat(seatId, eventId, dayId, zoneId, { status: SeatStatus.BLOCKED });
  }

  async unblockSeat(seatId: string, eventId: string, dayId: string, zoneId: string): Promise<void> {
    await this.updateSeat(seatId, eventId, dayId, zoneId, { status: SeatStatus.AVAILABLE });
  }

  async bulkCreateSeats(eventId: string, dayId: string, zoneId: string, codes: string[]): Promise<{ created: number; ids: string[] }> {
    await mockDb.simulateLatency();
    const ids: string[] = [];
    codes.forEach((code) => {
      const id = `seat-${zoneId}-${code}-${Math.random().toString(36).substring(2, 6)}`;
      mockDb.seats.push({
        id,
        code,
        status: SeatStatus.AVAILABLE,
        zoneId,
        dayId,
        eventId,
      });
      ids.push(id);
    });
    mockDb.save();
    return { created: codes.length, ids };
  }
}

export class MockDiscountService implements DiscountService {
  async getDiscounts(filters?: DiscountFilters): Promise<PaginatedResult<Discount>> {
    await mockDb.simulateLatency();
    let list = [...mockDb.discounts];
    if (filters?.code) {
      const q = filters.code.toLowerCase();
      list = list.filter((d) => d.code.toLowerCase().includes(q));
    }
    if (filters?.eventId) {
      list = list.filter((d) => d.eventId === filters.eventId);
    }
    if (filters?.type !== undefined) {
      list = list.filter((d) => d.type === filters.type);
    }
    if (filters?.active !== undefined) {
      list = list.filter((d) => d.active === filters.active);
    }
    return applyPagination(list, filters);
  }

  async create(input: Partial<Discount>): Promise<{ id: string }> {
    await mockDb.simulateLatency();
    const id = `disc-${Date.now()}`;
    const newDiscount: Discount = {
      id,
      active: input.active !== undefined ? input.active : true,
      code: input.code || 'PROMO10',
      startDate: input.startDate || new Date().toISOString(),
      endDate: input.endDate || new Date(Date.now() + 30 * 86400000).toISOString(),
      type: input.type !== undefined ? input.type : 0,
      usage: { limit: input.usageLimit || 100, count: 0 },
      usageLimit: input.usageLimit || 100,
      usageCount: 0,
      value: input.value || 10,
      eventId: input.eventId || 'evt-lima-sound-2026',
      event: { id: input.eventId || 'evt-lima-sound-2026', name: 'Festival Lima Sound 2026' },
    };
    mockDb.discounts.push(newDiscount);
    mockDb.save();
    return { id };
  }

  async update(id: string, input: Partial<Discount>): Promise<void> {
    await mockDb.simulateLatency();
    const idx = mockDb.discounts.findIndex((d) => d.id === id);
    if (idx >= 0) {
      mockDb.discounts[idx] = { ...mockDb.discounts[idx], ...input };
      mockDb.save();
    }
  }

  async remove(id: string): Promise<void> {
    await mockDb.simulateLatency();
    mockDb.discounts = mockDb.discounts.filter((d) => d.id !== id);
    mockDb.save();
  }
}

export class MockOrderService implements OrderService {
  async getOrders(filters?: OrderFilters): Promise<PaginatedResult<Order>> {
    await mockDb.simulateLatency();
    let list = [...mockDb.orders];
    if (filters?.id) {
      list = list.filter((o) => o.id.toLowerCase().includes(filters.id!.toLowerCase()));
    }
    if (filters?.eventId) {
      list = list.filter((o) => o.event.id === filters.eventId);
    }
    if (filters?.status !== undefined) {
      list = list.filter((o) => o.status === filters.status);
    }
    if (filters?.paymentMethod !== undefined) {
      list = list.filter((o) => o.paymentMethod === filters.paymentMethod);
    }
    return applyPagination(list, filters);
  }

  async getOrderDetails(id: string): Promise<Order> {
    await mockDb.simulateLatency();
    const order = mockDb.orders.find((o) => o.id === id);
    if (!order) throw { error: { code: 'ORDER_NOT_FOUND', status: 404 } };

    const payments = mockDb.payments.filter((p) => p.orderId === id);
    const tickets = mockDb.tickets.filter((t) => t.orderId === id);
    return { ...order, payments, tickets };
  }

  async cancelPendingOrder(id: string): Promise<void> {
    await mockDb.simulateLatency();
    const order = mockDb.orders.find((o) => o.id === id);
    if (!order) throw { error: { code: 'ORDER_NOT_FOUND', status: 404 } };
    if (order.status !== OrderStatus.PENDING) {
      throw { error: { code: 'CANNOT_CANCEL_NON_PENDING_ORDER', status: 422, message: 'Solo se pueden cancelar órdenes pendientes' } };
    }
    order.status = OrderStatus.CANCELLED;
    mockDb.save();
  }
}

export class MockPaymentService implements PaymentService {
  async getPayments(filters?: PaymentFilters): Promise<PaginatedResult<Payment>> {
    await mockDb.simulateLatency();
    let list = [...mockDb.payments];
    if (filters?.id) {
      list = list.filter((p) => p.id.toLowerCase().includes(filters.id!.toLowerCase()));
    }
    if (filters?.externalReference) {
      list = list.filter((p) => p.externalReference?.toLowerCase().includes(filters.externalReference!.toLowerCase()));
    }
    if (filters?.status !== undefined) {
      list = list.filter((p) => p.status === filters.status);
    }
    if (filters?.method !== undefined) {
      list = list.filter((p) => p.method === filters.method);
    }
    return applyPagination(list, filters);
  }

  async getPaymentDetails(id: string): Promise<Payment> {
    await mockDb.simulateLatency();
    const payment = mockDb.payments.find((p) => p.id === id);
    if (!payment) throw { error: { code: 'PAYMENT_NOT_FOUND', status: 404 } };
    return payment;
  }
}

export class MockTicketService implements TicketService {
  async getTickets(filters?: TicketFilters): Promise<PaginatedResult<Ticket>> {
    await mockDb.simulateLatency();
    let list = [...mockDb.tickets];
    if (filters?.code) {
      const q = filters.code.toLowerCase();
      list = list.filter((t) => t.code.toLowerCase().includes(q) || t.qrCode.toLowerCase().includes(q));
    }
    if (filters?.qrCode) {
      list = list.filter((t) => t.qrCode === filters.qrCode);
    }
    if (filters?.eventId) {
      list = list.filter((t) => t.event.id === filters.eventId);
    }
    if (filters?.status !== undefined) {
      list = list.filter((t) => t.status === filters.status);
    }
    return applyPagination(list, filters);
  }

  async getTicketDetails(id: string): Promise<Ticket> {
    await mockDb.simulateLatency();
    const ticket = mockDb.tickets.find((t) => t.id === id);
    if (!ticket) throw { error: { code: 'TICKET_NOT_FOUND', status: 404 } };
    return ticket;
  }

  async downloadPdfBlob(id: string, orderId: string): Promise<Blob> {
    await mockDb.simulateLatency();
    const text = `TICKETPLUS ENTRY PASS\nTicket ID: ${id}\nOrder ID: ${orderId}\nGenerated: ${new Date().toISOString()}`;
    return new Blob([text], { type: 'application/pdf' });
  }
}

export class MockAccessService implements AccessService {
  async getSummary(eventId: string, dayId: string): Promise<AccessSummary> {
    await mockDb.simulateLatency();
    const evt = mockDb.events.find((e) => e.id === eventId) || mockDb.events[0];
    const day = evt.days.find((d) => d.id === dayId) || evt.days[0];

    const tickets = mockDb.tickets.filter((t) => t.event.id === evt.id);
    const total = tickets.length || 2946;
    const active = tickets.filter((t) => t.status === TicketStatus.ACTIVE).length || 1860;
    const used = tickets.filter((t) => t.status === TicketStatus.USED).length || 1086;
    const percentageUsed = Number(((used / (total || 1)) * 100).toFixed(2));

    const recent = tickets.filter((t) => t.status === TicketStatus.USED).slice(-5);

    return {
      event: { id: evt.id, name: evt.name },
      day: { id: day.id, date: day.date, startTime: day.startTime },
      total,
      active,
      used,
      invalid: 0,
      percentageUsed,
      recent,
    };
  }

  async validateTicket(params: { eventId: string; dayId: string; code?: string; qrCode?: string }): Promise<ValidateTicketResponse> {
    await mockDb.simulateLatency();

    const searchStr = (params.code || params.qrCode || '').trim();
    if (!searchStr) {
      return { result: 'INVALID', reason: 'TICKET_NOT_FOUND' };
    }

    const ticket = mockDb.tickets.find(
      (t) => t.code.toLowerCase() === searchStr.toLowerCase() || t.qrCode.toLowerCase() === searchStr.toLowerCase()
    );

    if (!ticket) {
      return { result: 'INVALID', reason: 'TICKET_NOT_FOUND' };
    }

    if (ticket.event.id !== params.eventId) {
      return { result: 'INVALID', reason: 'WRONG_EVENT', ticket };
    }

    if (ticket.status === TicketStatus.CANCELLED) {
      return { result: 'INVALID', reason: 'TICKET_CANCELLED', ticket };
    }

    if (ticket.status === TicketStatus.REFUNDED) {
      return { result: 'INVALID', reason: 'TICKET_REFUNDED', ticket };
    }

    if (ticket.status === TicketStatus.EXPIRED) {
      return { result: 'INVALID', reason: 'TICKET_EXPIRED', ticket };
    }

    if (ticket.status === TicketStatus.USED) {
      return {
        result: 'ALREADY_USED',
        ticket: {
          ...ticket,
          usedAt: ticket.usedAt || new Date().toISOString(),
          validatedBy: ticket.validatedBy || { id: 'mem-1', name: 'Ana López' },
        },
      };
    }

    // Valid ticket: update to USED
    ticket.status = TicketStatus.USED;
    ticket.usedAt = new Date().toISOString();
    ticket.validatedBy = { id: 'mem-1', name: 'Oscar Ramírez' };
    mockDb.save();

    return {
      result: 'VALID',
      ticket,
    };
  }
}

export class MockCustomerService implements CustomerService {
  async getCustomers(filters?: CustomerFilters): Promise<PaginatedResult<Customer>> {
    await mockDb.simulateLatency();
    let list = [...mockDb.customers];
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(
        (c) => c.fullName.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.document.number.includes(q)
      );
    }
    return applyPagination(list, filters);
  }

  async getCustomerDetails(id: string): Promise<Customer> {
    await mockDb.simulateLatency();
    const cust = mockDb.customers.find((c) => c.id === id);
    if (!cust) throw { error: { code: 'CUSTOMER_NOT_FOUND', status: 404 } };
    const orders = mockDb.orders.filter((o) => o.customer.id === id);
    const payments = mockDb.payments.filter((p) => p.customer?.id === id);
    const tickets = mockDb.tickets.filter((t) => t.customer.id === id);
    const reviews = mockDb.reviews.filter((r) => r.customer.id === id);
    return { ...cust, orders, payments, tickets, reviews };
  }
}

export class MockReviewService implements ReviewService {
  async getReviews(filters?: ReviewFilters): Promise<PaginatedResult<Review>> {
    await mockDb.simulateLatency();
    let list = [...mockDb.reviews];
    if (filters?.eventId) {
      list = list.filter((r) => r.event.id === filters.eventId);
    }
    if (filters?.rating !== undefined) {
      list = list.filter((r) => r.rating === filters.rating);
    }
    return applyPagination(list, filters);
  }

  async getReviewSummary(eventId?: string): Promise<ReviewSummary> {
    await mockDb.simulateLatency();
    let list = mockDb.reviews;
    if (eventId) {
      list = list.filter((r) => r.event.id === eventId);
    }
    const total = list.length || 126;
    const distribution: Record<number, number> = { 1: 2, 2: 4, 3: 10, 4: 32, 5: 78 };
    if (list.length > 0) {
      distribution[1] = list.filter((r) => r.rating === 1).length;
      distribution[2] = list.filter((r) => r.rating === 2).length;
      distribution[3] = list.filter((r) => r.rating === 3).length;
      distribution[4] = list.filter((r) => r.rating === 4).length;
      distribution[5] = list.filter((r) => r.rating === 5).length;
    }
    const sum = Object.entries(distribution).reduce((acc, [star, count]) => acc + Number(star) * count, 0);
    const average = Number((sum / (total || 1)).toFixed(1));
    return { average, total, distribution };
  }
}

export class MockDashboardService implements DashboardService {
  async getDashboardData(filters?: DashboardFilters): Promise<DashboardData> {
    await mockDb.simulateLatency();
    return {
      filters: {
        currency: 'PEN',
        timezone: 'America/Lima',
      },
      kpis: {
        approvedSales: 84230,
        paidOrders: 1284,
        soldTickets: 2946,
        averageOrderValue: 65.6,
        totalCapacity: 4150,
        occupancyPercentage: 71,
        activeReservations: 124,
        declinedPayments: 18,
        discountUses: 346,
      },
      salesTimeline: [
        { date: '2026-08-21', sales: 7200, orders: 96, tickets: 214 },
        { date: '2026-08-22', sales: 9800, orders: 120, tickets: 280 },
        { date: '2026-08-23', sales: 11400, orders: 145, tickets: 310 },
        { date: '2026-08-24', sales: 8900, orders: 110, tickets: 250 },
        { date: '2026-08-25', sales: 14200, orders: 180, tickets: 420 },
        { date: '2026-08-26', sales: 16500, orders: 210, tickets: 490 },
        { date: '2026-08-27', sales: 16230, orders: 223, tickets: 582 },
      ],
      salesByEvent: [
        { eventId: 'evt-lima-sound-2026', eventName: 'Festival Lima Sound 2026', sales: 42600, tickets: 1240 },
        { eventId: 'evt-tech-peru-2026', eventName: 'Conferencia Tech Perú 2026', sales: 24500, tickets: 850 },
        { eventId: 'evt-expo-gamer', eventName: 'Expo Gamer Lima 2026', sales: 11200, tickets: 520 },
        { eventId: 'evt-obra-teatro', eventName: 'Obra El Último Viaje', sales: 5930, tickets: 336 },
      ],
      ordersByStatus: [
        { status: OrderStatus.PAID, count: 1284 },
        { status: OrderStatus.PENDING, count: 42 },
        { status: OrderStatus.CANCELLED, count: 18 },
        { status: OrderStatus.REFUNDED, count: 5 },
      ],
      paymentsByMethod: [
        { method: PaymentMethod.CREDIT_CARD, count: 720, amount: 48200 },
        { method: PaymentMethod.YAPE, count: 350, amount: 21400 },
        { method: PaymentMethod.PLIN, count: 140, amount: 9600 },
        { method: PaymentMethod.DEBIT_CARD, count: 74, amount: 5030 },
      ],
      upcomingEvents: mockDb.events.slice(0, 4),
      alerts: [
        {
          id: 'alert-1',
          type: 'WARNING',
          title: 'Evento próximo en borrador',
          description: 'Noche de Comedia no ha sido publicado y faltan pocos días.',
          eventId: 'evt-noche-comedia',
        },
        {
          id: 'alert-2',
          type: 'INFO',
          title: 'Alta demanda en Festival Lima Sound',
          description: 'La zona Platinum VIP alcanzó el 85% de ocupación.',
          eventId: 'evt-lima-sound-2026',
        },
      ],
    };
  }
}
