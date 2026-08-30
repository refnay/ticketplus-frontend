'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  Calendar,
  ArrowLeft,
  ArrowRight,
  MapPin,
  Tag,
  Layers,
  ShoppingBag,
  Ticket as TicketIcon,
  MessageSquare,
  QrCode,
  Edit,
  Plus,
  Play,
  Pause,
  XCircle,
  CheckCircle,
  LayoutTemplate,
  AlertCircle,
  ImageIcon,
  Upload,
  Save,
  SlidersHorizontal,
  Trash2,
} from 'lucide-react';
import { eventService, eventWorkspaceService, eventWorkspaceSessionService, eventWorkspaceZoneService, eventWorkspaceSeatService } from '@/lib/api/services';
import {
  EventDetail,
  EventStatus,
  EventStatusLabels,
  SessionDay,
  DayStatus,
  DayStatusLabels,
  Zone,
  Seat,
  SeatStatus,
  SeatStatusLabels,
} from '@/types';
import { EventLayout } from '@/types/canvas';
import { formatCurrency, formatDate } from '@/lib/formatting';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Tabs } from '@/components/ui/Tabs';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { Skeleton } from '@/components/ui/Skeleton';
import { CanvasEditor } from '@/features/canvas/CanvasEditor';

const CoordinatePicker = dynamic(() => import('@/components/maps/CoordinatePicker'), {
  ssr: false,
  loading: () => <Skeleton className="h-72 w-full rounded-xl" />,
});

const CountryCitySelector = dynamic(() => import('@/components/location/CountryCitySelector'), {
  ssr: false,
  loading: () => <Skeleton className="h-16 w-full rounded-xl" />,
});

const toInputDate = (date: string): string => {
  const match = date.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  return match ? `${match[3]}-${match[2]}-${match[1]}` : date;
};

const formatDayDate = (date: string): string => {
  const match = date.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : date;
};

const toDateTimeLocal = (dateTime?: string): string => {
  if (!dateTime) return '';
  const displayFormat = dateTime.match(/^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})$/);
  if (displayFormat) {
    return `${displayFormat[3]}-${displayFormat[2]}-${displayFormat[1]}T${displayFormat[4]}:${displayFormat[5]}`;
  }
  return dateTime.slice(0, 16);
};
const withSeconds = (time: string): string => time.length === 5 ? `${time}:00` : time;
const parseSeatCodes = (value: string): string[] => Array.from(new Set(
  value.split(/[\n,;]+/).map((code) => code.trim().toUpperCase()).filter(Boolean)
));
const toLimaDateTime = (dateTime?: string): string | undefined => {
  if (!dateTime) return undefined;
  if (/Z$|[+-]\d{2}:\d{2}$/.test(dateTime)) return dateTime;
  return `${dateTime.length === 16 ? `${dateTime}:00` : dateTime}-05:00`;
};

const emptySessionDay = (): SessionDay => ({
  id: '',
  date: '',
  startTime: '19:00',
  endTime: '22:00',
  saleStartAt: '',
  description: '',
  status: DayStatus.SCHEDULED,
});

type EventStatusAction = 'publish' | 'pause' | 'resume' | 'cancel' | 'complete';

const statusActionLabels: Record<EventStatusAction, string> = {
  publish: 'Publicar evento',
  pause: 'Pausar ventas',
  resume: 'Reanudar ventas',
  cancel: 'Cancelar evento',
  complete: 'Marcar como finalizado',
};

const getStatusActions = (status: EventStatus): EventStatusAction[] => {
  if (status === EventStatus.DRAFT) return ['publish', 'cancel'];
  if (status === EventStatus.PUBLISHED) return ['pause', 'complete', 'cancel'];
  if (status === EventStatus.PAUSED) return ['resume', 'cancel'];
  if (status === EventStatus.SOLD_OUT) return ['complete', 'cancel'];
  return [];
};

const resizeImage = (
  file: File,
  width: number,
  height: number,
  fit: 'cover' | 'contain'
): Promise<{ file: File; previewUrl: string }> => new Promise((resolve, reject) => {
  const sourceUrl = URL.createObjectURL(file);
  const image = new Image();

  image.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) {
      URL.revokeObjectURL(sourceUrl);
      reject(new Error('No se pudo procesar la imagen.'));
      return;
    }

    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    const scale = fit === 'cover'
      ? Math.max(width / image.naturalWidth, height / image.naturalHeight)
      : Math.min(width / image.naturalWidth, height / image.naturalHeight);
    const drawWidth = image.naturalWidth * scale;
    const drawHeight = image.naturalHeight * scale;
    context.drawImage(image, (width - drawWidth) / 2, (height - drawHeight) / 2, drawWidth, drawHeight);

    canvas.toBlob((blob) => {
      URL.revokeObjectURL(sourceUrl);
      if (!blob) {
        reject(new Error('No se pudo procesar la imagen.'));
        return;
      }
      const baseName = file.name.replace(/\.[^.]+$/, '');
      const resizedFile = new File([blob], `${baseName}-${width}x${height}.webp`, { type: 'image/webp' });
      resolve({ file: resizedFile, previewUrl: URL.createObjectURL(resizedFile) });
    }, 'image/webp', 0.9);
  };
  image.onerror = () => {
    URL.revokeObjectURL(sourceUrl);
    reject(new Error('El archivo seleccionado no es una imagen válida.'));
  };
  image.src = sourceUrl;
});

export default function EventWorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.eventId as string;
  const { showToast } = useToast();

  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('general');
  const [categoryOptions, setCategoryOptions] = useState<Array<{ code: string; label: string }>>([]);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [statusAction, setStatusAction] = useState<EventStatusAction | ''>('');
  const [statusReason, setStatusReason] = useState('');
  const [changingStatus, setChangingStatus] = useState(false);
  const [eventDeleteModalOpen, setEventDeleteModalOpen] = useState(false);
  const [eventDeleteConfirmation, setEventDeleteConfirmation] = useState('');
  const [deletingEvent, setDeletingEvent] = useState(false);

  // Sub-data for workspace tabs
  const [days, setDays] = useState<SessionDay[]>([]);
  const [newDay, setNewDay] = useState<SessionDay | null>(null);
  const [savingDayId, setSavingDayId] = useState<string | null>(null);
  const [zones, setZones] = useState<Zone[]>([]);
  const [zonesLoading, setZonesLoading] = useState(false);
  const [zonesError, setZonesError] = useState(false);
  const [selectedDayId, setSelectedDayId] = useState<string>('');

  // Advanced Canvas Layout state
  const [layoutMode, setLayoutMode] = useState(false);
  const [layoutData, setLayoutData] = useState<EventLayout | null>(null);

  // Modals state
  const [zoneModalOpen, setZoneModalOpen] = useState(false);
  const [editingZoneId, setEditingZoneId] = useState<string | null>(null);
  const [savingZone, setSavingZone] = useState(false);
  const [deletingZoneId, setDeletingZoneId] = useState<string | null>(null);
  const [confirmingZoneDeleteId, setConfirmingZoneDeleteId] = useState<string | null>(null);
  const [deletingDayId, setDeletingDayId] = useState<string | null>(null);

  // Seat management state
  const [selectedSeatZoneId, setSelectedSeatZoneId] = useState('');
  const [seats, setSeats] = useState<Seat[]>([]);
  const [seatTotal, setSeatTotal] = useState(0);
  const [seatsLoading, setSeatsLoading] = useState(false);
  const [seatsError, setSeatsError] = useState(false);
  const [seatCreateModalOpen, setSeatCreateModalOpen] = useState(false);
  const [bulkSeatCodes, setBulkSeatCodes] = useState('');
  const [seatGenerator, setSeatGenerator] = useState({ prefix: 'A', start: 1, quantity: 1 });
  const [creatingSeats, setCreatingSeats] = useState(false);
  const [seatEditModalOpen, setSeatEditModalOpen] = useState(false);
  const [editingSeat, setEditingSeat] = useState<Seat | null>(null);
  const [seatForm, setSeatForm] = useState({ code: '', status: SeatStatus.AVAILABLE });
  const [loadingSeatDetail, setLoadingSeatDetail] = useState(false);
  const [savingSeat, setSavingSeat] = useState(false);
  const [deletingSeat, setDeletingSeat] = useState(false);
  const [confirmingSeatDelete, setConfirmingSeatDelete] = useState(false);

  // New Zone Form state
  const [zoneForm, setZoneForm] = useState({ name: '', price: 0, quantity: 0, hierarchy: 1, numberedSeating: false });

  useEffect(() => {
    loadEventDetails();
    eventWorkspaceService.getCategoryOptions()
      .then(setCategoryOptions)
      .catch((error) => console.error('Failed to load event categories:', error));
  }, [eventId]);

  const loadEventDetails = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const evt = await eventWorkspaceService.find(eventId);
      setEvent(evt);
      setDays((evt.days || []).map((day) => ({ ...day, date: toInputDate(day.date), saleStartAt: toDateTimeLocal(day.saleStartAt) })));
      if (evt.days?.length > 0) {
        setSelectedDayId(evt.days[0].id);
        loadZonesForDay(evt.id, evt.days[0].id);
      }
    } catch (e: any) {
      console.error('Failed to load event workspace:', e);
      setEvent(null);
      setLoadError(e?.error?.message || 'No se pudo cargar la información del evento.');
    } finally {
      setLoading(false);
    }
  };

  const loadZonesForDay = async (evtId: string, dayId: string) => {
    setZonesLoading(true);
    setZonesError(false);
    try {
      const res = await eventWorkspaceZoneService.getZones(evtId, dayId, { limit: 50 });
      setZones(res.items);
    } catch (e) {
      console.error('Failed to load zones:', e);
      setZones([]);
      setZonesError(true);
    } finally {
      setZonesLoading(false);
    }
  };

  const updateDayDraft = (dayId: string, changes: Partial<SessionDay>) => {
    setDays((current) => current.map((day) => day.id === dayId ? { ...day, ...changes } : day));
  };

  const handleSaveAllDays = async () => {
    const pendingDays = newDay ? [...days, newDay] : days;
    if (pendingDays.some((day) => !day.date || !day.startTime || !day.endTime || !day.saleStartAt)) {
      showToast('warning', 'Datos incompletos', 'Indica la fecha, el horario y el inicio de venta.');
      return;
    }

    setSavingDayId('all');
    try {
      await Promise.all(days.map((day) => eventWorkspaceSessionService.updateDay(eventId, day.id, {
        date: day.date,
        startTime: withSeconds(day.startTime),
        endTime: withSeconds(day.endTime),
        saleStartAt: toLimaDateTime(day.saleStartAt),
        description: day.description,
        status: day.status,
      })));

      if (newDay) {
        const result = await eventWorkspaceSessionService.createDay(eventId, {
          date: newDay.date,
          startTime: withSeconds(newDay.startTime),
          endTime: withSeconds(newDay.endTime),
          saleStartAt: toLimaDateTime(newDay.saleStartAt),
          description: newDay.description,
          status: DayStatus.SCHEDULED,
        });
        const createdDay = { ...newDay, id: result.id };
        setDays((current) => [...current, createdDay]);
        setNewDay(null);
        if (!selectedDayId) setSelectedDayId(result.id);
      }

      showToast('success', 'Fechas actualizadas', 'Los cambios de fechas y horarios fueron guardados.');
    } catch (error: any) {
      showToast('error', 'No se pudieron guardar las fechas', error?.error?.message || 'Revisa los datos e inténtalo nuevamente.');
    } finally {
      setSavingDayId(null);
    }
  };

  const handleRemoveDay = async (dayId: string) => {
    setDeletingDayId(dayId);
    try {
      await eventWorkspaceSessionService.removeDay(eventId, dayId);
      const remainingDays = days.filter((day) => day.id !== dayId);
      setDays(remainingDays);
      if (selectedDayId === dayId) {
        const nextDayId = remainingDays[0]?.id || '';
        setSelectedDayId(nextDayId);
        if (nextDayId) await loadZonesForDay(eventId, nextDayId);
        else setZones([]);
      }
      showToast('success', 'Fecha eliminada', 'La fecha fue retirada del evento.');
    } catch (error: any) {
      showToast('error', 'No se pudo eliminar la fecha', error?.error?.message || 'Puede tener zonas, ventas o entradas asociadas.');
    } finally {
      setDeletingDayId(null);
    }
  };

  const handleUploadEventImage = async (
    field: 'coverImage' | 'bannerImage' | 'logo' | 'thumbnail',
    file: File
  ) => {
    try {
      let url = '';
      if (field === 'coverImage') url = await eventWorkspaceService.uploadCover(eventId, file);
      if (field === 'bannerImage') url = await eventWorkspaceService.uploadBanner(eventId, file);
      if (field === 'logo') url = await eventWorkspaceService.uploadLogo(eventId, file);
      if (field === 'thumbnail') url = await eventWorkspaceService.uploadThumbnail(eventId, file);
      if (url) setEvent((current) => current ? { ...current, [field]: url } : current);
      showToast('success', 'Imagen actualizada', 'El archivo fue procesado y guardado correctamente.');
    } catch (error: any) {
      showToast('error', 'No se pudo subir la imagen', error?.error?.message || 'Inténtalo nuevamente.');
      throw error;
    }
  };

  const handleRemoveEventImage = async (field: 'coverImage' | 'bannerImage' | 'logo' | 'thumbnail') => {
    try {
      if (field === 'coverImage') await eventWorkspaceService.removeCover(eventId);
      if (field === 'bannerImage') await eventWorkspaceService.removeBanner(eventId);
      if (field === 'logo') await eventWorkspaceService.removeLogo(eventId);
      if (field === 'thumbnail') await eventWorkspaceService.removeThumbnail(eventId);
      setEvent((current) => current ? { ...current, [field]: null } : current);
      showToast('success', 'Imagen eliminada', 'El recurso visual fue retirado del evento.');
    } catch (error: any) {
      showToast('error', 'No se pudo eliminar la imagen', error?.error?.message || 'Inténtalo nuevamente.');
      throw error;
    }
  };

  const openStatusModal = () => {
    if (!event) return;
    const actions = getStatusActions(event.status);
    setStatusAction(actions[0] || '');
    setStatusReason('');
    setStatusModalOpen(true);
  };

  const handleChangeStatus = async () => {
    if (!event || !statusAction) return;
    setChangingStatus(true);
    try {
      if (statusAction === 'publish') await eventWorkspaceService.publish(event.id, statusReason || undefined);
      if (statusAction === 'pause') await eventWorkspaceService.pause(event.id, statusReason || undefined);
      if (statusAction === 'resume') await eventWorkspaceService.resume(event.id);
      if (statusAction === 'cancel') await eventWorkspaceService.cancel(event.id, statusReason || undefined);
      if (statusAction === 'complete') await eventWorkspaceService.complete(event.id);

      const nextStatus: Record<EventStatusAction, EventStatus> = {
        publish: EventStatus.PUBLISHED,
        pause: EventStatus.PAUSED,
        resume: EventStatus.PUBLISHED,
        cancel: EventStatus.CANCELLED,
        complete: EventStatus.COMPLETED,
      };
      setEvent({ ...event, status: nextStatus[statusAction] });
      setStatusModalOpen(false);
      showToast('success', 'Estado actualizado', statusActionLabels[statusAction]);
    } catch (error: any) {
      showToast('error', 'No se pudo cambiar el estado', error?.error?.message || 'Inténtalo nuevamente.');
    } finally {
      setChangingStatus(false);
    }
  };

  const handleDeleteEvent = async () => {
    if (!event || eventDeleteConfirmation.trim() !== event.name) return;
    setDeletingEvent(true);
    try {
      await eventWorkspaceService.remove(event.id);
      showToast('success', 'Evento eliminado', 'El evento fue eliminado correctamente.');
      router.push('/app/events');
    } catch (error: any) {
      showToast('error', 'No se pudo eliminar el evento', error?.error?.message || 'Puede tener ventas, entradas u otros registros asociados.');
    } finally {
      setDeletingEvent(false);
    }
  };

  const openAdvancedCanvas = async () => {
    try {
      const l = await eventService.getLayout(eventId);
      setLayoutData(l);
      setLayoutMode(true);
    } catch (e) {
      showToast('error', 'Error', 'No se pudo cargar el maquetador del evento.');
    }
  };

  const handleSaveAdvancedLayout = async (layout: EventLayout) => {
    try {
      await eventService.saveLayout(eventId, layout);
      showToast('success', 'Layout Guardado', 'El mapa del recinto ha sido actualizado correctamente.');
      setLayoutData(layout);
    } catch (e) {
      showToast('error', 'Error', 'No se pudo guardar el mapa del recinto.');
    }
  };

  const resetZoneForm = () => {
    setEditingZoneId(null);
    setZoneForm({ name: '', price: 0, quantity: 0, hierarchy: 1, numberedSeating: false });
  };

  const openCreateZone = () => {
    resetZoneForm();
    setZoneModalOpen(true);
  };

  const openEditZone = (zone: Zone) => {
    setEditingZoneId(zone.id);
    setZoneForm({
      name: zone.name,
      price: zone.price,
      quantity: zone.quantity.total,
      hierarchy: zone.hierarchy,
      numberedSeating: Boolean(zone.numberedSeating),
    });
    setZoneModalOpen(true);
  };

  const handleSaveZone = async () => {
    if (!selectedDayId) return;
    if (!zoneForm.name.trim() || zoneForm.price < 0 || zoneForm.quantity < 0 || zoneForm.hierarchy < 1) {
      showToast('warning', 'Datos incompletos', 'Revisa el nombre, precio, cantidad y jerarquía.');
      return;
    }
    setSavingZone(true);
    try {
      const payload = {
        name: zoneForm.name.trim(),
        price: Number(zoneForm.price),
        quantity: Number(zoneForm.quantity),
        hierarchy: Number(zoneForm.hierarchy),
        numberedSeating: zoneForm.numberedSeating,
      };
      if (editingZoneId) {
        await eventWorkspaceZoneService.updateZone(editingZoneId, eventId, selectedDayId, payload);
        showToast('success', 'Zona actualizada', `${payload.name} fue actualizada.`);
      } else {
        await eventWorkspaceZoneService.createZone(eventId, selectedDayId, payload);
        showToast('success', 'Zona creada', `${payload.name} fue agregada.`);
      }
      setZoneModalOpen(false);
      resetZoneForm();
      await loadZonesForDay(eventId, selectedDayId);
    } catch (e: any) {
      showToast('error', 'No se pudo guardar la zona', e?.error?.message || 'Revisa los datos e inténtalo nuevamente.');
    } finally {
      setSavingZone(false);
    }
  };

  const handleRemoveZone = async (zoneId: string) => {
    if (!selectedDayId) return;
    setDeletingZoneId(zoneId);
    try {
      await eventWorkspaceZoneService.removeZone(zoneId, eventId, selectedDayId);
      setZones((current) => current.filter((zone) => zone.id !== zoneId));
      setConfirmingZoneDeleteId(null);
      showToast('success', 'Zona eliminada', 'La zona fue retirada de esta fecha.');
    } catch (e: any) {
      showToast('error', 'No se pudo eliminar la zona', e?.error?.message || 'Puede tener ventas o asientos asociados.');
    } finally {
      setDeletingZoneId(null);
    }
  };

  const loadSeatsForZone = async (dayId: string, zoneId: string) => {
    if (!dayId || !zoneId) {
      setSeats([]);
      setSeatTotal(0);
      return;
    }
    setSeatsLoading(true);
    setSeatsError(false);
    try {
      const response = await eventWorkspaceSeatService.getSeats(eventId, dayId, zoneId);
      setSeats(response.items);
      setSeatTotal(response.total);
    } catch (error) {
      console.error('Failed to load seats:', error);
      setSeats([]);
      setSeatTotal(0);
      setSeatsError(true);
    } finally {
      setSeatsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab !== 'seats') return;
    const numberedZones = zones.filter((zone) => zone.numberedSeating === true);
    const zoneId = numberedZones.some((zone) => zone.id === selectedSeatZoneId)
      ? selectedSeatZoneId
      : numberedZones[0]?.id || '';
    if (zoneId !== selectedSeatZoneId) {
      setSelectedSeatZoneId(zoneId);
      return;
    }
    if (selectedDayId && zoneId) loadSeatsForZone(selectedDayId, zoneId);
    else {
      setSeats([]);
      setSeatTotal(0);
    }
  }, [activeTab, selectedDayId, selectedSeatZoneId, zones]);

  const openSeatCreator = () => {
    const zone = zones.find((item) => item.id === selectedSeatZoneId && item.numberedSeating === true);
    const remaining = Math.max(0, (zone?.quantity.total || 0) - seatTotal);
    setBulkSeatCodes('');
    setSeatGenerator({ prefix: 'A', start: 1, quantity: Math.min(10, remaining) || 1 });
    setSeatCreateModalOpen(true);
  };

  const handleGenerateSeatCodes = () => {
    const zone = zones.find((item) => item.id === selectedSeatZoneId && item.numberedSeating === true);
    const remaining = Math.max(0, (zone?.quantity.total || 0) - seatTotal);
    const prefix = seatGenerator.prefix.trim().toUpperCase();
    const start = Math.max(1, Math.trunc(seatGenerator.start));
    const quantity = Math.trunc(seatGenerator.quantity);
    if (!prefix) {
      showToast('warning', 'Prefijo requerido', 'Indica el prefijo de la fila, por ejemplo A.');
      return;
    }
    if (quantity < 1 || quantity > remaining) {
      showToast('warning', 'Cantidad no válida', `Puedes generar entre 1 y ${remaining} asientos para esta zona.`);
      return;
    }
    const generatedCodes = Array.from({ length: quantity }, (_, index) => `${prefix}${start + index}`);
    setBulkSeatCodes(generatedCodes.join(', '));
  };

  const handleCreateSeats = async () => {
    if (!selectedDayId || !selectedSeatZoneId) return;
    const zone = zones.find((item) => item.id === selectedSeatZoneId && item.numberedSeating === true);
    const capacity = zone?.quantity.total || 0;
    const remaining = Math.max(0, capacity - seatTotal);
    const codes = parseSeatCodes(bulkSeatCodes);
    if (codes.length === 0) {
      showToast('warning', 'Códigos requeridos', 'Ingresa al menos un código de asiento.');
      return;
    }
    if (codes.length > remaining) {
      showToast('warning', 'Capacidad superada', `Solo quedan ${remaining} espacios disponibles de una capacidad total de ${capacity}.`);
      return;
    }
    const existingCodes = new Set(seats.map((seat) => seat.code.trim().toUpperCase()));
    const repeatedCodes = codes.filter((code) => existingCodes.has(code));
    if (repeatedCodes.length > 0) {
      showToast('warning', 'Códigos ya registrados', `Retira los códigos repetidos: ${repeatedCodes.slice(0, 5).join(', ')}${repeatedCodes.length > 5 ? '…' : ''}`);
      return;
    }
    setCreatingSeats(true);
    try {
      await eventWorkspaceSeatService.bulkCreateSeats(eventId, selectedDayId, selectedSeatZoneId, codes);
      setSeatCreateModalOpen(false);
      setBulkSeatCodes('');
      await loadSeatsForZone(selectedDayId, selectedSeatZoneId);
      showToast('success', 'Asientos agregados', `Se registraron ${codes.length} códigos de asiento.`);
    } catch (error: any) {
      showToast('error', 'No se pudieron agregar los asientos', error?.error?.message || 'Revisa los códigos e inténtalo nuevamente.');
    } finally {
      setCreatingSeats(false);
    }
  };

  const openSeatEditor = async (seat: Seat) => {
    if (!selectedDayId || !selectedSeatZoneId) return;
    setEditingSeat(seat);
    setSeatForm({ code: seat.code, status: seat.status });
    setConfirmingSeatDelete(false);
    setSeatEditModalOpen(true);
    setLoadingSeatDetail(true);
    try {
      const detail = await eventWorkspaceSeatService.findSeat(seat.id, eventId, selectedDayId, selectedSeatZoneId);
      setEditingSeat(detail);
      setSeatForm({ code: detail.code, status: detail.status });
    } catch (error: any) {
      showToast('error', 'No se pudo cargar el asiento', error?.error?.message || 'Inténtalo nuevamente.');
      setSeatEditModalOpen(false);
    } finally {
      setLoadingSeatDetail(false);
    }
  };

  const handleUpdateSeat = async () => {
    if (!editingSeat || !selectedDayId || !selectedSeatZoneId || !seatForm.code.trim()) return;
    setSavingSeat(true);
    try {
      await eventWorkspaceSeatService.updateSeat(editingSeat.id, eventId, selectedDayId, selectedSeatZoneId, {
        code: seatForm.code.trim(),
        status: seatForm.status,
      });
      setSeatEditModalOpen(false);
      await loadSeatsForZone(selectedDayId, selectedSeatZoneId);
      showToast('success', 'Asiento actualizado', 'El código y estado fueron guardados.');
    } catch (error: any) {
      showToast('error', 'No se pudo actualizar el asiento', error?.error?.message || 'Revisa los datos e inténtalo nuevamente.');
    } finally {
      setSavingSeat(false);
    }
  };

  const handleDeleteSeat = async () => {
    if (!editingSeat || !selectedDayId || !selectedSeatZoneId) return;
    setDeletingSeat(true);
    try {
      await eventWorkspaceSeatService.removeSeat(editingSeat.id, eventId, selectedDayId, selectedSeatZoneId);
      setSeatEditModalOpen(false);
      await loadSeatsForZone(selectedDayId, selectedSeatZoneId);
      showToast('success', 'Asiento eliminado', `El asiento ${editingSeat.code} fue eliminado.`);
    } catch (error: any) {
      showToast('error', 'No se pudo eliminar el asiento', error?.error?.message || 'Puede estar asociado a una reserva o venta.');
    } finally {
      setDeletingSeat(false);
      setConfirmingSeatDelete(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Cargando workspace del evento...</div>;
  }

  if (loadError || !event) {
    return (
      <div className="mx-auto max-w-lg py-16">
        <Card className="text-center">
          <AlertCircle className="mx-auto h-9 w-9 text-rose-500" />
          <h1 className="mt-3 text-base font-bold text-slate-900">No se pudo abrir el evento</h1>
          <p className="mt-1 text-sm text-slate-500">{loadError || 'El evento solicitado no está disponible.'}</p>
          <div className="mt-5 flex justify-center gap-3">
            <Button variant="outline" onClick={() => router.push('/app/events')}>Volver a eventos</Button>
            <Button variant="primary" onClick={loadEventDetails}>Reintentar</Button>
          </div>
        </Card>
      </div>
    );
  }

  // Full-screen Advanced Canvas Editor Mode
  if (layoutMode) {
    return (
      <CanvasEditor
        eventId={eventId}
        eventName={event.name}
        initialLayout={layoutData}
        onSave={handleSaveAdvancedLayout}
        onBack={() => setLayoutMode(false)}
      />
    );
  }

  const currentCategoryCode = typeof event.category === 'string' ? event.category : event.category?.code || '';
  const currentCategoryLabel = typeof event.category === 'string' ? event.category : event.category?.label || '';
  const categorySelectOptions = [
    ...(currentCategoryCode && !categoryOptions.some((option) => option.code === currentCategoryCode)
      ? [{ value: currentCategoryCode, label: currentCategoryLabel || currentCategoryCode }]
      : []),
    ...categoryOptions.map((option) => ({ value: option.code, label: option.label })),
  ];
  const numberedSeatingZones = zones.filter((zone) => zone.numberedSeating === true);
  const selectedSeatZone = numberedSeatingZones.find((zone) => zone.id === selectedSeatZoneId);
  const selectedSeatCapacity = selectedSeatZone?.quantity.total || 0;
  const remainingSeatCapacity = Math.max(0, selectedSeatCapacity - seatTotal);
  const pendingSeatCodes = parseSeatCodes(bulkSeatCodes);
  const registeredSeatCodes = new Set(seats.map((seat) => seat.code.trim().toUpperCase()));
  const repeatedPendingSeatCodes = pendingSeatCodes.filter((code) => registeredSeatCodes.has(code));
  const selectedZoneDay = days.find((day) => day.id === selectedDayId);
  const zoneModalContext = editingZoneId
    ? zoneForm.name || 'Zona seleccionada'
    : selectedZoneDay ? `${formatDayDate(selectedZoneDay.date)} · ${selectedZoneDay.startTime}` : 'Fecha seleccionada';

  const workspaceTabs = [
    { id: 'general', label: 'Información general', icon: <Edit className="w-4 h-4" /> },
    { id: 'location', label: 'Recinto y ubicación', icon: <MapPin className="w-4 h-4" /> },
    { id: 'days', label: 'Fechas y horarios', icon: <Calendar className="w-4 h-4" /> },
    { id: 'commercial', label: 'Configuración comercial', icon: <SlidersHorizontal className="w-4 h-4" /> },
    { id: 'media', label: 'Imágenes', icon: <ImageIcon className="w-4 h-4" /> },
    { id: 'inventory', label: 'Zonas', icon: <Layers className="w-4 h-4" /> },
    { id: 'seats', label: 'Asientos', icon: <TicketIcon className="w-4 h-4" /> },
    { id: 'operations', label: 'Gestión operativa', icon: <ShoppingBag className="w-4 h-4" /> },
    { id: 'danger', label: 'Zona de peligro', icon: <Trash2 className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Event Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-5 lg:p-6">
        <Link href="/app/events" className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900">
          <ArrowLeft className="h-4 w-4" /> Volver a eventos
        </Link>
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-xl bg-slate-100 border overflow-hidden shrink-0 shadow-xs flex items-center justify-center">
            {event.thumbnail ? (
              <img src={event.thumbnail} alt={`Miniatura de ${event.name}`} className="w-full h-full object-cover" />
            ) : (
              <ImageIcon className="h-7 w-7 text-slate-300" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900">{event.name}</h1>
              <Badge variant={event.status === 1 ? 'success' : event.status === 0 ? 'neutral' : 'warning'} dot>
                {EventStatusLabels[event.status]}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
              <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-slate-400" /> {event.venueName}</span>
              <span>•</span>
              <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-slate-400" /> {event.days?.[0]?.date ? formatDate(event.days[0].date) : event.date ? formatDate(event.date) : '-'}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Button
            variant="outline"
            size="sm"
            leftIcon={event.status === EventStatus.PAUSED ? <Play className="h-4 w-4 text-emerald-600" /> : <Pause className="h-4 w-4 text-amber-600" />}
            disabled={getStatusActions(event.status).length === 0}
            onClick={openStatusModal}
          >
            {getStatusActions(event.status).length === 0 ? 'Estado final' : 'Cambiar estado'}
          </Button>
          <Button variant="outline" size="sm" leftIcon={<LayoutTemplate className="w-4 h-4 text-indigo-600" />} onClick={openAdvancedCanvas}>
            Diseñador Canvas Avanzado
          </Button>

          <Link href={`/app/access?event=${eventId}`}>
            <Button variant="outline" size="sm" leftIcon={<QrCode className="w-4 h-4 text-emerald-600" />}>
              Validar accesos
            </Button>
          </Link>
        </div>
        </div>
      </div>

      {/* Tabs Bar */}
      <Tabs tabs={workspaceTabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* General information */}
      {activeTab === 'general' && (
        <Card>
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); showToast('success', 'Guardado', 'Información general actualizada.'); }}>
            <Input label="Nombre del evento" value={event.name} onChange={(e) => setEvent({ ...event, name: e.target.value })} />
            <Textarea label="Descripción" rows={5} value={event.description} onChange={(e) => setEvent({ ...event, description: e.target.value })} />
            <div className="grid gap-4 md:grid-cols-2">
              <Select
                label="Categoría"
                options={categorySelectOptions}
                value={currentCategoryCode}
                onChange={(e) => {
                  const selected = categoryOptions.find((option) => option.code === e.target.value);
                  setEvent({ ...event, category: { code: e.target.value, label: selected?.label || currentCategoryLabel } });
                }}
              />
              <Input label="Identificador URL" value={event.slug || ''} disabled />
            </div>
            <div className="flex justify-end pt-1"><Button type="submit" variant="primary">Guardar cambios</Button></div>
          </form>
        </Card>
      )}

      {/* Venue and location */}
      {activeTab === 'location' && (
        <Card>
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); showToast('success', 'Guardado', 'Ubicación del evento actualizada.'); }}>
            <div className="grid gap-4 md:grid-cols-2">
              <Input label="Recinto" value={event.venueName || ''} onChange={(e) => setEvent({ ...event, venueName: e.target.value })} />
              <Input label="Dirección" value={event.location} onChange={(e) => setEvent({ ...event, location: e.target.value })} />
            </div>
            <CountryCitySelector
              countryCode={event.country}
              cityCode={event.city}
              onCountryChange={(country) => setEvent((current) => current ? { ...current, country, city: '' } : current)}
              onCityChange={(city, coordinates) => setEvent((current) => current ? { ...current, city, coordinates: coordinates || current.coordinates } : current)}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Latitud" type="number" step="any" value={event.coordinates?.latitude ?? ''} onChange={(e) => setEvent({ ...event, coordinates: { latitude: Number(e.target.value), longitude: event.coordinates?.longitude ?? -77.042793 } })} />
              <Input label="Longitud" type="number" step="any" value={event.coordinates?.longitude ?? ''} onChange={(e) => setEvent({ ...event, coordinates: { latitude: event.coordinates?.latitude ?? -12.046374, longitude: Number(e.target.value) } })} />
            </div>
            <CoordinatePicker
              latitude={event.coordinates?.latitude ?? -12.046374}
              longitude={event.coordinates?.longitude ?? -77.042793}
              onChange={(coordinates) => setEvent({ ...event, coordinates })}
            />
            <p className="text-[11px] text-slate-500">Mapa provisto por OpenStreetMap. Haz clic para mover el marcador.</p>
            <div className="flex justify-end pt-1"><Button type="submit" variant="primary">Guardar ubicación</Button></div>
          </form>
        </Card>
      )}

      {/* Event dates */}
      {activeTab === 'days' && (
        <Card>
          <div className="mb-4 flex justify-end">
            <Button type="button" variant="primary" leftIcon={<Plus className="h-4 w-4" />} disabled={Boolean(newDay)} onClick={() => setNewDay(emptySessionDay())}>Agregar fecha</Button>
          </div>
          <div className="space-y-4">
            {days.length === 0 && !newDay && (
              <div className="rounded-xl border border-dashed border-slate-200 px-5 py-10 text-center">
                <Calendar className="mx-auto h-7 w-7 text-slate-300" />
                <p className="mt-2 text-xs font-semibold text-slate-600">No se recibieron fechas para este evento.</p>
                <Button type="button" variant="ghost" size="sm" className="mt-2" onClick={loadEventDetails}>Volver a cargar</Button>
              </div>
            )}
            {days.map((day, index) => (
              <DayEditor
                key={day.id}
                day={day}
                number={index + 1}
                onChange={(changes) => updateDayDraft(day.id, changes)}
                onDelete={() => handleRemoveDay(day.id)}
                isDeleting={deletingDayId === day.id}
              />
            ))}
            {newDay && (
              <DayEditor
                day={newDay}
                number={days.length + 1}
                isNew
                onChange={(changes) => setNewDay((current) => current ? { ...current, ...changes } : current)}
                onCancel={() => setNewDay(null)}
                isDeleting={false}
              />
            )}
          </div>
          {(days.length > 0 || newDay) && (
            <div className="mt-5 flex justify-end">
              <Button
                type="button"
                variant="primary"
                isLoading={savingDayId === 'all'}
                leftIcon={<Save className="h-4 w-4" />}
                onClick={handleSaveAllDays}
              >
                Guardar fechas y horarios
              </Button>
            </div>
          )}
        </Card>
      )}

      {/* Commercial settings */}
      {activeTab === 'commercial' && (
        <Card>
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); showToast('success', 'Guardado', 'Configuración comercial actualizada.'); }}>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Select label="Moneda" options={[{ value: 'PEN', label: 'PEN — Sol peruano' }, { value: 'USD', label: 'USD — Dólar estadounidense' }]} value={event.currency} onChange={(e) => setEvent({ ...event, currency: e.target.value })} />
              <Select label="Impuesto" options={[{ value: 18, label: '18% — IGV' }, { value: 0, label: '0% — Exonerado' }]} value={event.taxRate} onChange={(e) => setEvent({ ...event, taxRate: Number(e.target.value) })} />
              <Input label="Máximo por orden" type="number" min={1} max={50} helperText="Cantidad máxima de entradas por compra." value={event.maxTicketsPerOrder ?? 5} onChange={(e) => setEvent({ ...event, maxTicketsPerOrder: Number(e.target.value) })} />
            </div>
            <div className="flex justify-end pt-1"><Button type="submit" variant="primary">Guardar configuración</Button></div>
          </form>
        </Card>
      )}

      {/* Event images */}
      {activeTab === 'media' && (
        <Card>
            <div className="grid gap-4 md:grid-cols-2">
              <EventImageField label="Imagen de portada" helper="Imagen principal del evento" initialUrl={event.coverImage} width={1200} height={675} fit="cover" aspectClass="aspect-[16/9]" onUpload={(file) => handleUploadEventImage('coverImage', file)} onRemove={() => handleRemoveEventImage('coverImage')} />
              <EventImageField label="Banner" helper="Cabecera horizontal de la página" initialUrl={event.bannerImage} width={1920} height={640} fit="cover" aspectClass="aspect-[3/1]" onUpload={(file) => handleUploadEventImage('bannerImage', file)} onRemove={() => handleRemoveEventImage('bannerImage')} />
              <EventImageField label="Logotipo" helper="Marca del evento" initialUrl={event.logo} width={800} height={800} fit="contain" aspectClass="aspect-square" onUpload={(file) => handleUploadEventImage('logo', file)} onRemove={() => handleRemoveEventImage('logo')} />
              <EventImageField label="Miniatura" helper="Listados y tarjetas" initialUrl={event.thumbnail} width={600} height={600} fit="cover" aspectClass="aspect-square" onUpload={(file) => handleUploadEventImage('thumbnail', file)} onRemove={() => handleRemoveEventImage('thumbnail')} />
            </div>
        </Card>
      )}

      {/* Zones and inventory */}
      {activeTab === 'inventory' && (
        <Card>
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-[minmax(0,24rem)_auto] sm:items-start">
            <div className="w-full">
              <Select
                label="Fecha del evento"
                options={days.map((day, index) => ({ value: day.id, label: `Fecha ${index + 1} · ${formatDayDate(day.date)} · ${day.startTime}` }))}
                value={selectedDayId}
                disabled={days.length === 0}
                onChange={(event) => {
                  const dayId = event.target.value;
                  setSelectedDayId(dayId);
                  setConfirmingZoneDeleteId(null);
                  loadZonesForDay(eventId, dayId);
                }}
              />
            </div>
            <Button className="w-full sm:w-auto sm:justify-self-end" variant="primary" leftIcon={<Plus className="w-4 h-4" />} disabled={!selectedDayId} onClick={openCreateZone}>
              Agregar zona
            </Button>
          </div>

          {zonesLoading ? (
            <div className="grid gap-4 md:grid-cols-2">
              <Skeleton className="h-48 rounded-xl" />
              <Skeleton className="h-48 rounded-xl" />
            </div>
          ) : zonesError ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-5 py-10 text-center">
              <AlertCircle className="mx-auto h-7 w-7 text-rose-400" />
              <p className="mt-2 text-xs font-semibold text-rose-700">No se pudieron cargar las zonas de esta fecha.</p>
              <Button type="button" variant="ghost" size="sm" className="mt-2" onClick={() => selectedDayId && loadZonesForDay(eventId, selectedDayId)}>Reintentar</Button>
            </div>
          ) : zones.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 px-5 py-12 text-center">
              <Layers className="mx-auto h-7 w-7 text-slate-300" />
              <p className="mt-2 text-xs font-semibold text-slate-600">No hay zonas registradas para esta fecha.</p>
              <p className="mt-0.5 text-[11px] text-slate-400">Agrega la primera zona para comenzar a configurar el aforo.</p>
            </div>
          ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {zones.map((zn) => {
              const available = Math.max(0, zn.quantity.total - zn.quantity.sold - zn.quantity.reserved);
              const occupancy = Number(((zn.quantity.sold / (zn.quantity.total || 1)) * 100).toFixed(1));

              return (
                <Card key={zn.id} header={
                  <div className="flex w-full items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h4 className="truncate text-sm font-bold text-slate-900">{zn.name}</h4>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-base font-extrabold text-brand-600">{formatCurrency(zn.price, event.currency)}</p>
                      <p className="max-w-36 text-[10px] font-medium leading-tight text-slate-400">Por entrada · impuestos no incluidos</p>
                    </div>
                  </div>
                }>
                  <div className="space-y-4 text-xs">
                    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-slate-200 bg-slate-200 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
                      <div className="bg-slate-50 px-2 py-3 text-center">
                        <span className="block text-[9px] font-bold uppercase tracking-wide text-slate-400">Capacidad</span>
                        <span className="mt-0.5 block text-sm font-extrabold text-slate-800">{zn.quantity.total}</span>
                      </div>
                      <div className="bg-slate-50 px-2 py-3 text-center">
                        <span className="block text-[9px] font-bold uppercase tracking-wide text-slate-400">Vendidos</span>
                        <span className="mt-0.5 block text-sm font-extrabold text-emerald-600">{zn.quantity.sold}</span>
                      </div>
                      <div className="bg-slate-50 px-2 py-3 text-center">
                        <span className="block text-[9px] font-bold uppercase tracking-wide text-slate-400">Reservados</span>
                        <span className="mt-0.5 block text-sm font-extrabold text-amber-600">{zn.quantity.reserved}</span>
                      </div>
                      <div className="bg-slate-50 px-2 py-3 text-center">
                        <span className="block text-[9px] font-bold uppercase tracking-wide text-slate-400">Disponibles</span>
                        <span className="mt-0.5 block text-sm font-extrabold text-slate-800">{available}</span>
                      </div>
                    </div>

                    <div>
                      <div className="mb-1.5 flex items-center justify-between">
                        <span className="font-medium text-slate-500">Ocupación por ventas</span>
                        <span className="font-bold text-slate-800">{occupancy}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-emerald-500 transition-[width] duration-300"
                          style={{ width: `${Math.min(100, Math.max(0, occupancy))}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-brand-200 bg-brand-50 text-brand-700 hover:bg-brand-100"
                        leftIcon={<Edit className="h-3.5 w-3.5" />}
                        onClick={() => openEditZone(zn)}
                      >
                        Editar
                      </Button>
                      {confirmingZoneDeleteId === zn.id ? (
                        <>
                          <Button variant="danger" size="sm" isLoading={deletingZoneId === zn.id} onClick={() => handleRemoveZone(zn.id)}>Confirmar</Button>
                          <Button variant="outline" size="sm" onClick={() => setConfirmingZoneDeleteId(null)}>Cancelar</Button>
                        </>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                          leftIcon={<Trash2 className="h-3.5 w-3.5" />}
                          onClick={() => setConfirmingZoneDeleteId(zn.id)}
                        >
                          Eliminar
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
          )}
        </div>
        </Card>
      )}

      {/* Seats */}
      {activeTab === 'seats' && (
        <Card>
          <div className="space-y-6">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,20rem)_minmax(0,20rem)_auto] lg:items-start">
              <Select
                label="Fecha del evento"
                options={days.map((day, index) => ({ value: day.id, label: `Fecha ${index + 1} · ${formatDayDate(day.date)} · ${day.startTime}` }))}
                value={selectedDayId}
                disabled={days.length === 0}
                onChange={(event) => {
                  const dayId = event.target.value;
                  setSelectedDayId(dayId);
                  setSelectedSeatZoneId('');
                  setSeats([]);
                  loadZonesForDay(eventId, dayId);
                }}
              />
              <Select
                label="Zona"
                options={numberedSeatingZones.map((zone) => ({ value: zone.id, label: zone.name }))}
                value={selectedSeatZoneId}
                disabled={!selectedDayId || zonesLoading || numberedSeatingZones.length === 0}
                onChange={(event) => setSelectedSeatZoneId(event.target.value)}
              />
              <Button
                className="w-full lg:w-auto lg:justify-self-end"
                variant="primary"
                leftIcon={<Plus className="h-4 w-4" />}
                disabled={!selectedDayId || !selectedSeatZoneId || remainingSeatCapacity === 0}
                title={remainingSeatCapacity === 0 ? 'La zona alcanzó su capacidad o no tiene capacidad configurada.' : undefined}
                onClick={openSeatCreator}
              >
                Agregar asientos
              </Button>
            </div>

            {zonesLoading || seatsLoading ? (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10">
                {Array.from({ length: 10 }).map((_, index) => <Skeleton key={index} className="h-16 rounded-xl" />)}
              </div>
            ) : zonesError ? (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-5 py-10 text-center">
                <AlertCircle className="mx-auto h-7 w-7 text-rose-400" />
                <p className="mt-2 text-xs font-semibold text-rose-700">No se pudieron cargar las zonas de esta fecha.</p>
                <Button type="button" variant="ghost" size="sm" className="mt-2" onClick={() => selectedDayId && loadZonesForDay(eventId, selectedDayId)}>Reintentar</Button>
              </div>
            ) : numberedSeatingZones.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 px-5 py-12 text-center">
                <Layers className="mx-auto h-7 w-7 text-slate-300" />
                <p className="mt-2 text-xs font-semibold text-slate-600">No hay zonas con asientos numerados para esta fecha.</p>
                <p className="mt-0.5 text-[11px] text-slate-400">Configura una zona como numerada para poder registrar sus asientos.</p>
              </div>
            ) : selectedSeatZone && selectedSeatCapacity === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 px-5 py-12 text-center">
                <TicketIcon className="mx-auto h-7 w-7 text-slate-300" />
                <p className="mt-2 text-xs font-semibold text-slate-600">Esta zona no tiene capacidad configurada.</p>
                <p className="mt-0.5 text-[11px] text-slate-400">Actualiza la cantidad de la zona antes de generar asientos.</p>
              </div>
            ) : seatsError ? (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-5 py-10 text-center">
                <AlertCircle className="mx-auto h-7 w-7 text-rose-400" />
                <p className="mt-2 text-xs font-semibold text-rose-700">No se pudieron cargar los asientos de esta zona.</p>
                <Button type="button" variant="ghost" size="sm" className="mt-2" onClick={() => loadSeatsForZone(selectedDayId, selectedSeatZoneId)}>Reintentar</Button>
              </div>
            ) : seats.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 px-5 py-12 text-center">
                <TicketIcon className="mx-auto h-7 w-7 text-slate-300" />
                <p className="mt-2 text-xs font-semibold text-slate-600">No hay asientos registrados en esta zona.</p>
                <p className="mt-0.5 text-[11px] text-slate-400">Agrega códigos de asiento para comenzar.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10">
                {seats.map((seat) => {
                  const statusClass = seat.status === SeatStatus.AVAILABLE
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                    : seat.status === SeatStatus.RESERVED
                      ? 'border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100'
                      : seat.status === SeatStatus.SOLD
                        ? 'border-brand-200 bg-brand-50 text-brand-800 hover:bg-brand-100'
                        : seat.status === SeatStatus.BLOCKED
                          ? 'border-slate-300 bg-slate-100 text-slate-800 hover:bg-slate-200'
                          : 'border-rose-200 bg-rose-50 text-rose-800 hover:bg-rose-100';
                  return (
                    <button
                      key={seat.id}
                      type="button"
                      className={`flex min-h-16 flex-col items-center justify-center rounded-xl border px-2 py-2 text-center transition-colors ${statusClass}`}
                      onClick={() => openSeatEditor(seat)}
                    >
                      <span className="text-sm font-extrabold">{seat.code}</span>
                      <span className="mt-0.5 text-[9px] font-bold uppercase tracking-wide opacity-75">{SeatStatusLabels[seat.status] || `Estado ${seat.status}`}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </Card>
      )}

      {activeTab === 'operations' && (
        <Card>
          <div className="grid gap-4 md:grid-cols-2">
            <OperationLink
              href={`/app/sales?event=${eventId}`}
              title="Ventas"
              description="Consulta las órdenes, pagos y entradas asociadas al evento."
              action="Ver ventas"
              icon={<ShoppingBag className="h-5 w-5" />}
              tone="brand"
            />
            <OperationLink
              href={`/app/discounts?event=${eventId}`}
              title="Descuentos"
              description="Administra promociones y cupones aplicables a este evento."
              action="Gestionar descuentos"
              icon={<Tag className="h-5 w-5" />}
              tone="amber"
            />
            <OperationLink
              href={`/app/reviews?event=${eventId}`}
              title="Opiniones"
              description="Revisa las valoraciones y comentarios de los compradores."
              action="Revisar opiniones"
              icon={<MessageSquare className="h-5 w-5" />}
              tone="sky"
            />
            <OperationLink
              href={`/app/access?event=${eventId}`}
              title="Control de acceso"
              description="Abre el escáner para validar las entradas de las funciones."
              action="Abrir control de acceso"
              icon={<QrCode className="h-5 w-5" />}
              tone="emerald"
            />
          </div>
        </Card>
      )}

      {activeTab === 'danger' && (
        <Card className="border-rose-200">
          <div className="flex flex-col gap-5 rounded-xl border border-rose-200 bg-rose-50/70 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-700">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-rose-950">Eliminar evento</h3>
                <p className="mt-1 max-w-2xl text-xs leading-relaxed text-rose-700">Esta acción elimina permanentemente el evento y no se puede deshacer. El servidor puede rechazarla si existen ventas, entradas u otros registros asociados.</p>
              </div>
            </div>
            <Button
              variant="danger"
              className="w-full shrink-0 sm:w-auto"
              leftIcon={<Trash2 className="h-4 w-4" />}
              onClick={() => { setEventDeleteConfirmation(''); setEventDeleteModalOpen(true); }}
            >
              Eliminar evento
            </Button>
          </div>
        </Card>
      )}

      <Modal
        isOpen={eventDeleteModalOpen}
        onClose={() => !deletingEvent && setEventDeleteModalOpen(false)}
        title="Eliminar evento"
        footer={
          <>
            <Button variant="outline" disabled={deletingEvent} onClick={() => setEventDeleteModalOpen(false)}>Cancelar</Button>
            <Button
              variant="danger"
              isLoading={deletingEvent}
              disabled={eventDeleteConfirmation.trim() !== event.name}
              onClick={handleDeleteEvent}
            >
              Eliminar definitivamente
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs leading-relaxed text-rose-800">
            Esta acción no se puede deshacer. Para confirmar, escribe exactamente el nombre del evento.
          </div>
          <Input
            label={`Escribe “${event.name}”`}
            autoComplete="off"
            value={eventDeleteConfirmation}
            onChange={(event) => setEventDeleteConfirmation(event.target.value)}
          />
        </div>
      </Modal>

      <Modal
        isOpen={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        title="Cambiar estado del evento"
        subtitle={`Estado actual: ${EventStatusLabels[event.status]}`}
        footer={
          <>
            <Button variant="outline" onClick={() => setStatusModalOpen(false)}>Cancelar</Button>
            <Button variant="primary" isLoading={changingStatus} disabled={!statusAction} onClick={handleChangeStatus}>Confirmar cambio</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Select
            label="Nuevo estado"
            options={getStatusActions(event.status).map((action) => ({ value: action, label: statusActionLabels[action] }))}
            value={statusAction}
            onChange={(e) => setStatusAction(e.target.value as EventStatusAction)}
          />
          {(statusAction === 'pause' || statusAction === 'cancel') && (
            <Textarea label="Motivo del cambio" rows={3} placeholder="Describe brevemente el motivo..." value={statusReason} onChange={(e) => setStatusReason(e.target.value)} />
          )}
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-[11px] text-amber-800">El cambio afecta la disponibilidad y las ventas del evento.</p>
        </div>
      </Modal>

      {/* Zone Modal */}
      <Modal
        isOpen={zoneModalOpen}
        onClose={() => { if (!savingZone) { setZoneModalOpen(false); resetZoneForm(); } }}
        title={`${editingZoneId ? 'Editar zona' : 'Agregar zona'} · ${zoneModalContext}`}
        maxWidth="2xl"
        footer={
          <>
            <Button variant="outline" disabled={savingZone} onClick={() => { setZoneModalOpen(false); resetZoneForm(); }}>Cancelar</Button>
            <Button
              variant="primary"
              isLoading={savingZone}
              disabled={!zoneForm.name.trim() || zoneForm.price < 0 || zoneForm.quantity < 0 || zoneForm.hierarchy < 1}
              onClick={handleSaveZone}
            >
              {editingZoneId ? 'Guardar cambios' : 'Agregar zona'}
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          <Input
            label="Nombre de la zona"
            placeholder="Ej. VIP"
            value={zoneForm.name}
            onChange={(event) => setZoneForm({ ...zoneForm, name: event.target.value })}
          />
          <div className="grid gap-4 md:grid-cols-3">
            <Input
              label={`Precio (${event.currency})`}
              type="number"
              min={0}
              step="0.01"
              helperText="Por entrada, impuestos no incluidos."
              value={zoneForm.price}
              onChange={(event) => setZoneForm({ ...zoneForm, price: Number(event.target.value) })}
            />
            <Input
              label="Capacidad"
              type="number"
              min={0}
              helperText="Cantidad máxima disponible."
              value={zoneForm.quantity}
              onChange={(event) => setZoneForm({ ...zoneForm, quantity: Number(event.target.value) })}
            />
            <Input
              label="Jerarquía"
              type="number"
              min={1}
              helperText="Un valor mayor tiene más prioridad."
              value={zoneForm.hierarchy}
              onChange={(event) => setZoneForm({ ...zoneForm, hierarchy: Number(event.target.value) })}
            />
          </div>
          <label className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors ${zoneForm.numberedSeating ? 'border-brand-200 bg-brand-50/70' : 'border-slate-200 bg-slate-50'}`}>
            <input
              type="checkbox"
              checked={zoneForm.numberedSeating}
              onChange={(event) => setZoneForm({ ...zoneForm, numberedSeating: event.target.checked })}
              className="mt-0.5 h-4 w-4 rounded accent-brand-600"
            />
            <span>
              <strong className="block text-xs text-slate-800">Zona con asientos numerados</strong>
              <span className="mt-0.5 block text-[11px] leading-relaxed text-slate-500">Habilita la administración individual de códigos y estados desde la sección Asientos.</span>
            </span>
          </label>
        </div>
      </Modal>

      <Modal
        isOpen={seatCreateModalOpen}
        onClose={() => !creatingSeats && setSeatCreateModalOpen(false)}
        title={`Agregar asientos · ${selectedSeatZone?.name || 'Zona seleccionada'}`}
        maxWidth="2xl"
        footer={
          <>
            <Button variant="outline" disabled={creatingSeats} onClick={() => setSeatCreateModalOpen(false)}>Cancelar</Button>
            <Button
              variant="primary"
              isLoading={creatingSeats}
              disabled={pendingSeatCodes.length === 0 || pendingSeatCodes.length > remainingSeatCapacity || repeatedPendingSeatCodes.length > 0}
              onClick={handleCreateSeats}
            >
              {pendingSeatCodes.length > 0 ? `Agregar ${pendingSeatCodes.length} asientos` : 'Agregar asientos'}
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          <div className="grid grid-cols-3 gap-px overflow-hidden rounded-xl border border-slate-200 bg-slate-200 text-center">
            <div className="bg-slate-50 px-3 py-3">
              <span className="block text-[9px] font-bold uppercase tracking-wide text-slate-400">Capacidad</span>
              <strong className="mt-0.5 block text-base text-slate-900">{selectedSeatCapacity}</strong>
            </div>
            <div className="bg-slate-50 px-3 py-3">
              <span className="block text-[9px] font-bold uppercase tracking-wide text-slate-400">Registrados</span>
              <strong className="mt-0.5 block text-base text-slate-900">{seatTotal}</strong>
            </div>
            <div className="bg-emerald-50 px-3 py-3">
              <span className="block text-[9px] font-bold uppercase tracking-wide text-emerald-600">Cupos restantes</span>
              <strong className="mt-0.5 block text-base text-emerald-700">{remainingSeatCapacity}</strong>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-3">
              <p className="text-xs font-bold text-slate-800">Generador automático</p>
              <p className="text-[11px] text-slate-500">Crea una secuencia como A1, A2, A3 y luego podrás revisarla antes de guardar.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <Input
                label="Prefijo"
                placeholder="A"
                value={seatGenerator.prefix}
                onChange={(event) => setSeatGenerator({ ...seatGenerator, prefix: event.target.value })}
              />
              <Input
                label="Número inicial"
                type="number"
                min={1}
                value={seatGenerator.start}
                onChange={(event) => setSeatGenerator({ ...seatGenerator, start: Number(event.target.value) })}
              />
              <Input
                label="Cantidad"
                type="number"
                min={1}
                max={remainingSeatCapacity}
                helperText={`Máximo disponible: ${remainingSeatCapacity}`}
                value={seatGenerator.quantity}
                onChange={(event) => setSeatGenerator({ ...seatGenerator, quantity: Math.min(remainingSeatCapacity, Math.max(1, Number(event.target.value))) })}
              />
            </div>
            <div className="mt-3 flex justify-end">
              <Button type="button" variant="outline" size="sm" disabled={remainingSeatCapacity === 0} onClick={handleGenerateSeatCodes}>
                Generar lista
              </Button>
            </div>
          </div>

          <div>
            <Textarea
              label="Códigos a registrar"
              rows={5}
              placeholder={'A1, A2, A3\nB1, B2, B3'}
              helperText="Puedes editar la lista o ingresar códigos manualmente, separados por comas, punto y coma o saltos de línea."
              value={bulkSeatCodes}
              onChange={(event) => setBulkSeatCodes(event.target.value)}
            />
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px]">
              <span className={pendingSeatCodes.length > remainingSeatCapacity ? 'font-semibold text-rose-600' : 'text-slate-500'}>
                {pendingSeatCodes.length} de {remainingSeatCapacity} cupos disponibles
              </span>
              {repeatedPendingSeatCodes.length > 0 && (
                <span className="font-semibold text-amber-700">Ya existen: {repeatedPendingSeatCodes.slice(0, 4).join(', ')}{repeatedPendingSeatCodes.length > 4 ? '…' : ''}</span>
              )}
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={seatEditModalOpen}
        onClose={() => !savingSeat && !deletingSeat && setSeatEditModalOpen(false)}
        title={`Editar asiento · ${selectedSeatZone?.name || 'Zona seleccionada'}`}
        footer={
          confirmingSeatDelete ? (
            <>
              <Button variant="danger" isLoading={deletingSeat} onClick={handleDeleteSeat}>Confirmar eliminación</Button>
              <Button variant="outline" disabled={deletingSeat} onClick={() => setConfirmingSeatDelete(false)}>Cancelar</Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                className="mr-auto border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                leftIcon={<Trash2 className="h-4 w-4" />}
                disabled={loadingSeatDetail || savingSeat}
                onClick={() => setConfirmingSeatDelete(true)}
              >
                Eliminar
              </Button>
              <Button variant="outline" disabled={savingSeat} onClick={() => setSeatEditModalOpen(false)}>Cancelar</Button>
              <Button variant="primary" isLoading={savingSeat} disabled={loadingSeatDetail || !seatForm.code.trim()} onClick={handleUpdateSeat}>Guardar cambios</Button>
            </>
          )
        }
      >
        {loadingSeatDetail ? (
          <div className="space-y-4">
            <Skeleton className="h-16 rounded-xl" />
            <Skeleton className="h-16 rounded-xl" />
          </div>
        ) : (
          <div className="space-y-4">
            <Input label="Código del asiento" value={seatForm.code} onChange={(event) => setSeatForm({ ...seatForm, code: event.target.value })} />
            <Select
              label="Estado"
              options={Object.entries(SeatStatusLabels).map(([value, label]) => ({ value: Number(value), label }))}
              value={seatForm.status}
              onChange={(event) => setSeatForm({ ...seatForm, status: Number(event.target.value) as SeatStatus })}
            />
          </div>
        )}
      </Modal>
    </div>
  );
}

function OperationLink({
  href,
  title,
  description,
  action,
  icon,
  tone,
}: {
  href: string;
  title: string;
  description: string;
  action: string;
  icon: React.ReactNode;
  tone: 'brand' | 'amber' | 'sky' | 'emerald';
}) {
  const tones = {
    brand: {
      icon: 'bg-brand-50 text-brand-700',
      button: 'border-brand-200 bg-brand-50 text-brand-700 hover:bg-brand-100',
    },
    amber: {
      icon: 'bg-amber-50 text-amber-700',
      button: 'border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100',
    },
    sky: {
      icon: 'bg-sky-50 text-sky-700',
      button: 'border-sky-200 bg-sky-50 text-sky-800 hover:bg-sky-100',
    },
    emerald: {
      icon: 'bg-emerald-50 text-emerald-700',
      button: 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100',
    },
  }[tone];

  return (
    <section className="flex min-h-48 flex-col rounded-xl border border-slate-200 bg-slate-50/60 p-4">
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${tones.icon}`}>{icon}</div>
      <h3 className="mt-3 text-sm font-bold text-slate-900">{title}</h3>
      <p className="mt-1 grow text-xs leading-relaxed text-slate-500">{description}</p>
      <Link href={href} className="mt-4 block">
        <Button variant="outline" className={`w-full justify-between ${tones.button}`} rightIcon={<ArrowRight className="h-4 w-4" />}>
          {action}
        </Button>
      </Link>
    </section>
  );
}

function DayEditor({
  day,
  number,
  isNew = false,
  onChange,
  onCancel,
  onDelete,
  isDeleting,
}: {
  day: SessionDay;
  number: number;
  isNew?: boolean;
  onChange: (changes: Partial<SessionDay>) => void;
  onCancel?: () => void;
  onDelete?: () => void;
  isDeleting: boolean;
}) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  return (
    <Card className="bg-slate-50/60" header={
      <div className="flex w-full items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-brand-600" />
          <h4 className="text-xs font-bold text-slate-800">{isNew ? 'Nueva fecha' : `Fecha ${number}`}</h4>
        </div>
        {!isNew && (
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-500">Estado</span>
            <div className="w-44">
            <Select
              aria-label={`Estado de la fecha ${number}`}
              options={Object.entries(DayStatusLabels).map(([value, label]) => ({ value: Number(value), label }))}
              value={day.status}
              onChange={(event) => onChange({ status: Number(event.target.value) as DayStatus })}
              className="py-1.5 text-xs"
            />
            </div>
          </div>
        )}
      </div>
    }>
      <div className="grid gap-4 lg:grid-cols-3">
        <Input label="Fecha" type="date" value={day.date} onChange={(event) => onChange({ date: event.target.value })} />
        <Input label="Hora de inicio" type="time" value={day.startTime} onChange={(event) => onChange({ startTime: event.target.value })} />
        <Input label="Hora de fin" type="time" value={day.endTime} onChange={(event) => onChange({ endTime: event.target.value })} />
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-[260px_1fr]">
        <Input label="Inicio de venta" type="datetime-local" value={day.saleStartAt || ''} onChange={(event) => onChange({ saleStartAt: event.target.value })} />
        <Textarea label="Descripción de la fecha" rows={2} className="min-h-[68px]" value={day.description || ''} onChange={(event) => onChange({ description: event.target.value })} />
      </div>
      <div className="mt-4 flex justify-end gap-2">
        {onDelete && (confirmingDelete ? (
          <>
            <Button type="button" variant="danger" size="sm" isLoading={isDeleting} onClick={onDelete}>
              Confirmar
            </Button>
            <Button type="button" variant="outline" size="sm" disabled={isDeleting} onClick={() => setConfirmingDelete(false)}>
              Cancelar
            </Button>
          </>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
            leftIcon={<Trash2 className="h-3.5 w-3.5" />}
            onClick={() => setConfirmingDelete(true)}
          >
            Eliminar fecha
          </Button>
        ))}
        {isNew && <Button type="button" variant="ghost" size="sm" onClick={onCancel}>Cancelar</Button>}
      </div>
    </Card>
  );
}

function EventImageField({
  label,
  helper,
  initialUrl,
  width,
  height,
  fit,
  aspectClass,
  onUpload,
  onRemove,
}: {
  label: string;
  helper: string;
  initialUrl?: string | null;
  width: number;
  height: number;
  fit: 'cover' | 'contain';
  aspectClass: string;
  onUpload: (file: File) => Promise<void>;
  onRemove: () => Promise<void>;
}) {
  const [preview, setPreview] = useState(initialUrl || '');
  const [processedFile, setProcessedFile] = useState<File | null>(null);
  const [objectUrl, setObjectUrl] = useState('');
  const [processing, setProcessing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [confirmingRemove, setConfirmingRemove] = useState(false);
  const [imageError, setImageError] = useState('');

  useEffect(() => () => {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
  }, [objectUrl]);

  const uploadProcessedFile = async (file: File) => {
    setUploading(true);
    setImageError('');
    try {
      await onUpload(file);
      setUploaded(true);
    } catch (error: any) {
      setUploaded(false);
      setImageError(error?.error?.message || 'No se pudo subir la imagen.');
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setProcessing(true);
    setImageError('');
    try {
      const resized = await resizeImage(file, width, height, fit);
      setProcessedFile(resized.file);
      setObjectUrl(resized.previewUrl);
      setPreview(resized.previewUrl);
      setUploaded(false);
      setProcessing(false);
      await uploadProcessedFile(resized.file);
    } catch (error: any) {
      setImageError(error?.message || 'No se pudo procesar la imagen.');
    } finally {
      setProcessing(false);
      event.target.value = '';
    }
  };

  const handleRemove = async () => {
    if (!confirmingRemove) {
      setConfirmingRemove(true);
      return;
    }
    setRemoving(true);
    setImageError('');
    try {
      await onRemove();
      setPreview('');
      setObjectUrl('');
      setProcessedFile(null);
      setUploaded(false);
      setConfirmingRemove(false);
    } catch (error: any) {
      setImageError(error?.error?.message || 'No se pudo eliminar la imagen.');
    } finally {
      setRemoving(false);
    }
  };

  return (
    <section className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
      <div className="mb-2 min-w-0">
        <h4 className="text-xs font-bold text-slate-800">{label}</h4>
        <p className="text-[10px] text-slate-500">{helper} · {width} × {height} px</p>
      </div>
      <div className={`${aspectClass} relative flex w-full items-center justify-center overflow-hidden rounded-lg border border-dashed border-slate-300 bg-white`}>
        {preview ? (
          <img src={preview} alt={label} className="h-full w-full object-contain" />
        ) : (
          <div className="flex flex-col items-center gap-1 text-slate-300">
            <ImageIcon className="h-6 w-6" />
            <span className="text-[10px] font-medium">Sin imagen</span>
          </div>
        )}
        <label className={`absolute bottom-2 right-2 inline-flex items-center gap-1.5 rounded-lg border border-brand-200 bg-brand-50/95 px-2.5 py-1.5 text-[11px] font-semibold text-brand-700 shadow-sm backdrop-blur transition-colors hover:bg-brand-100 ${processing || uploading ? 'pointer-events-none opacity-60' : 'cursor-pointer'}`}>
          <Upload className="h-3.5 w-3.5" /> {processing ? 'Procesando...' : uploading ? 'Subiendo...' : preview ? 'Reemplazar' : 'Agregar'}
          <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleFileChange} />
        </label>
        {preview && (
          <div className="absolute bottom-2 left-2 flex items-center gap-1.5">
            <button
              type="button"
              disabled={removing || processing || uploading}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold shadow-sm backdrop-blur transition-colors disabled:opacity-60 ${confirmingRemove ? 'border-rose-600 bg-rose-600 text-white hover:bg-rose-700' : 'border-rose-200 bg-rose-50/95 text-rose-700 hover:bg-rose-100'}`}
              onClick={handleRemove}
            >
              <Trash2 className="h-3.5 w-3.5" /> {removing ? 'Eliminando...' : confirmingRemove ? 'Confirmar' : 'Eliminar'}
            </button>
            {confirmingRemove && (
              <button
                type="button"
                disabled={removing}
                className="inline-flex items-center rounded-lg border border-slate-300 bg-white/95 px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 shadow-sm backdrop-blur transition-colors hover:bg-slate-50 disabled:opacity-60"
                onClick={() => setConfirmingRemove(false)}
              >
                Cancelar
              </button>
            )}
          </div>
        )}
      </div>
      {processedFile && uploaded && <p className="mt-2 truncate text-[10px] text-emerald-700">Subida: {processedFile.name} · {Math.max(1, Math.round(processedFile.size / 1024))} KB</p>}
      {imageError && (
        <div className="mt-2 flex items-center justify-between gap-2">
          <p className="text-[10px] text-rose-600">{imageError}</p>
          {processedFile && <button type="button" className="text-[10px] font-bold text-brand-600 hover:text-brand-700" disabled={uploading} onClick={() => uploadProcessedFile(processedFile)}>Reintentar</button>}
        </div>
      )}
    </section>
  );
}
