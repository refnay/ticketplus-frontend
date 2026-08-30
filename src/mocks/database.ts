import {
  Company,
  UserProfile,
  Membership,
  Category,
  EventDetail,
  Zone,
  Seat,
  Discount,
  Order,
  Payment,
  Ticket,
  Customer,
  Review,
} from '../types';

import {
  SEED_COMPANIES,
  SEED_USERS,
  SEED_MEMBERSHIPS,
  SEED_CATEGORIES,
  SEED_EVENTS,
  SEED_ZONES,
  SEED_SEATS,
  SEED_DISCOUNTS,
  SEED_ORDERS,
  SEED_PAYMENTS,
  SEED_TICKETS,
  SEED_CUSTOMERS,
  SEED_REVIEWS,
} from './seed';

const STORAGE_KEY = 'ticketplus_mock_db_v1';

export class MockDatabase {
  companies: Company[] = [];
  users: UserProfile[] = [];
  memberships: Membership[] = [];
  categories: Category[] = [];
  events: EventDetail[] = [];
  zones: Zone[] = [];
  seats: Seat[] = [];
  discounts: Discount[] = [];
  orders: Order[] = [];
  payments: Payment[] = [];
  tickets: Ticket[] = [];
  customers: Customer[] = [];
  reviews: Review[] = [];

  activeCompanyId: string = 'comp-1111-1111';
  activeUserId: string = 'usr-admin';

  constructor() {
    this.init();
  }

  init() {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          this.companies = parsed.companies || SEED_COMPANIES;
          this.users = parsed.users || SEED_USERS;
          this.memberships = parsed.memberships || SEED_MEMBERSHIPS;
          this.categories = parsed.categories || SEED_CATEGORIES;
          this.events = parsed.events || SEED_EVENTS;
          this.zones = parsed.zones || SEED_ZONES;
          this.seats = parsed.seats || SEED_SEATS;
          this.discounts = parsed.discounts || SEED_DISCOUNTS;
          this.orders = parsed.orders || SEED_ORDERS;
          this.payments = parsed.payments || SEED_PAYMENTS;
          this.tickets = parsed.tickets || SEED_TICKETS;
          this.customers = parsed.customers || SEED_CUSTOMERS;
          this.reviews = parsed.reviews || SEED_REVIEWS;
          this.activeCompanyId = parsed.activeCompanyId || 'comp-1111-1111';
          this.activeUserId = parsed.activeUserId || 'usr-admin';
          return;
        } catch (e) {
          console.error('Failed to parse mock database from storage:', e);
        }
      }
    }
    this.seedDefaults();
  }

  seedDefaults() {
    this.companies = [...SEED_COMPANIES];
    this.users = [...SEED_USERS];
    this.memberships = [...SEED_MEMBERSHIPS];
    this.categories = [...SEED_CATEGORIES];
    this.events = [...SEED_EVENTS];
    this.zones = [...SEED_ZONES];
    this.seats = [...SEED_SEATS];
    this.discounts = [...SEED_DISCOUNTS];
    this.orders = [...SEED_ORDERS];
    this.payments = [...SEED_PAYMENTS];
    this.tickets = [...SEED_TICKETS];
    this.customers = [...SEED_CUSTOMERS];
    this.reviews = [...SEED_REVIEWS];
    this.activeCompanyId = 'comp-1111-1111';
    this.activeUserId = 'usr-admin';
    this.save();
  }

  save() {
    if (typeof window !== 'undefined') {
      try {
        const dump = {
          companies: this.companies,
          users: this.users,
          memberships: this.memberships,
          categories: this.categories,
          events: this.events,
          zones: this.zones,
          seats: this.seats,
          discounts: this.discounts,
          orders: this.orders,
          payments: this.payments,
          tickets: this.tickets,
          customers: this.customers,
          reviews: this.reviews,
          activeCompanyId: this.activeCompanyId,
          activeUserId: this.activeUserId,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dump));
      } catch (e) {
        console.error('Failed to persist mock database to localStorage:', e);
      }
    }
  }

  async simulateLatency(minMs = 200, maxMs = 700): Promise<void> {
    const delay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
    return new Promise((resolve) => setTimeout(resolve, delay));
  }
}

export const mockDb = new MockDatabase();
