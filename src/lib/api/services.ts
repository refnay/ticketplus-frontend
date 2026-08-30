import {
  AuthService,
  CompanyService,
  CategoryService,
  EventService,
  SessionService,
  ZoneService,
  SeatService,
  DiscountService,
  OrderService,
  PaymentService,
  TicketService,
  AccessService,
  CustomerService,
  ReviewService,
  DashboardService,
} from './interfaces';

import {
  MockAuthService,
  MockCompanyService,
  MockCategoryService,
  MockEventService,
  MockSessionService,
  MockZoneService,
  MockSeatService,
  MockDiscountService,
  MockOrderService,
  MockPaymentService,
  MockTicketService,
  MockAccessService,
  MockCustomerService,
  MockReviewService,
  MockDashboardService,
} from '../../mocks/services';

import {
  HttpAuthService,
  HttpCompanyService,
  HttpCategoryService,
  HttpEventService,
  HttpSessionService,
  HttpZoneService,
  HttpSeatService,
  HttpDiscountService,
  HttpOrderService,
  HttpPaymentService,
  HttpTicketService,
  HttpAccessService,
  HttpCustomerService,
  HttpReviewService,
  HttpDashboardService,
  HttpDashboardSummaryService,
} from './httpServices';

export const USE_MOCK_API = process.env.NEXT_PUBLIC_USE_MOCK_API !== 'false';

export const authService: AuthService = new HttpAuthService();
export const companyService: CompanyService = new HttpCompanyService();
export const categoryService: CategoryService = USE_MOCK_API ? new MockCategoryService() : new HttpCategoryService();
export const categoryAdminService: CategoryService = new HttpCategoryService();
export const eventService: EventService = USE_MOCK_API ? new MockEventService() : new HttpEventService();
export const eventListingService = new HttpEventService();
export const eventCreationService = new HttpEventService();
export const eventWorkspaceService = new HttpEventService();
export const eventWorkspaceSessionService = new HttpSessionService();
export const eventWorkspaceZoneService = new HttpZoneService();
export const eventWorkspaceSeatService = new HttpSeatService();
export const sessionService: SessionService = USE_MOCK_API ? new MockSessionService() : new HttpSessionService();
export const zoneService: ZoneService = USE_MOCK_API ? new MockZoneService() : new HttpZoneService();
export const seatService: SeatService = USE_MOCK_API ? new MockSeatService() : new HttpSeatService();
export const discountService: DiscountService = USE_MOCK_API ? new MockDiscountService() : new HttpDiscountService();
export const orderService: OrderService = USE_MOCK_API ? new MockOrderService() : new HttpOrderService();
export const paymentService: PaymentService = USE_MOCK_API ? new MockPaymentService() : new HttpPaymentService();
export const ticketService: TicketService = USE_MOCK_API ? new MockTicketService() : new HttpTicketService();
export const accessService: AccessService = USE_MOCK_API ? new MockAccessService() : new HttpAccessService();
export const customerService: CustomerService = USE_MOCK_API ? new MockCustomerService() : new HttpCustomerService();
export const reviewService: ReviewService = USE_MOCK_API ? new MockReviewService() : new HttpReviewService();
export const dashboardService: DashboardService = USE_MOCK_API ? new MockDashboardService() : new HttpDashboardService();
export const dashboardSummaryService = new HttpDashboardSummaryService();
