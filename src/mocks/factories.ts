import { EventDetail, EventStatus, SessionDay, DayStatus, Zone, Seat, SeatStatus } from '../types';

export const createEventFactory = (overrides: Partial<EventDetail> = {}): EventDetail => {
  const id = `evt-custom-${Date.now()}`;
  return {
    id,
    name: 'Nuevo Evento de Prueba',
    slug: 'nuevo-evento-prueba',
    description: 'Descripción del nuevo evento',
    location: 'Av. Principal 123',
    venueName: 'Local Central',
    country: 'PE',
    city: 'LIM',
    currency: 'PEN',
    taxRate: 18,
    status: EventStatus.DRAFT,
    category: { code: 'cat-1', label: 'Conciertos' },
    days: [
      {
        id: `day-${id}-1`,
        eventId: id,
        date: new Date().toISOString().split('T')[0],
        startTime: '19:00',
        endTime: '22:00',
        description: 'Fecha principal',
        status: DayStatus.SCHEDULED,
        inventory: { total: 500, sold: 0, reserved: 0, available: 500 },
        sales: { currency: 'PEN', gross: 0 },
      },
    ],
    salesStartAt: new Date().toISOString(),
    maxTicketsPerOrder: 10,
    ...overrides,
  };
};

export const createZoneFactory = (eventId: string, dayId: string, overrides: Partial<Zone> = {}): Zone => {
  const id = `zn-custom-${Date.now()}`;
  return {
    id,
    name: 'Zona VIP Nueva',
    hierarchy: 1,
    price: 150,
    numberedSeating: true,
    quantity: { total: 200, sold: 0, reserved: 0, available: 200 },
    eventId,
    dayId,
    ...overrides,
  };
};

export const createSeatsBulkFactory = (
  eventId: string,
  dayId: string,
  zoneId: string,
  codes: string[]
): Seat[] => {
  return codes.map((code) => ({
    id: `seat-${zoneId}-${code}-${Math.random().toString(36).substring(2, 7)}`,
    code,
    status: SeatStatus.AVAILABLE,
    zoneId,
    dayId,
    eventId,
  }));
};
