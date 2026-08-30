'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, CalendarDays, CheckCircle2, DollarSign, MapPin, Plus, RotateCcw, Trash2 } from 'lucide-react';
import { eventCreationService } from '@/lib/api/services';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';

const CoordinatePicker = dynamic(() => import('@/components/maps/CoordinatePicker'), {
  ssr: false,
  loading: () => <Skeleton className="h-72 w-full rounded-xl" />,
});

const CountryCitySelector = dynamic(() => import('@/components/location/CountryCitySelector'), {
  ssr: false,
  loading: () => <Skeleton className="h-16 w-full rounded-xl" />,
});

const eventDaySchema = z.object({
  date: z.string().min(1, 'Selecciona la fecha del evento'),
  startTime: z.string().min(1, 'Indica la hora de inicio'),
  endTime: z.string().min(1, 'Indica la hora de finalización'),
  saleStartAt: z.string().min(1, 'Indica cuándo inicia la venta'),
  description: z.string().min(3, 'Describe brevemente esta fecha'),
});

const createEventSchema = z.object({
  name: z.string().trim().min(3, 'El nombre debe tener al menos 3 caracteres'),
  description: z.string().trim().min(20, 'La descripción debe tener al menos 20 caracteres'),
  venue: z.string().trim().min(3, 'Ingresa el nombre del recinto'),
  coordinates: z.object({
    latitude: z.coerce.number().min(-90, 'Latitud inválida').max(90, 'Latitud inválida'),
    longitude: z.coerce.number().min(-180, 'Longitud inválida').max(180, 'Longitud inválida'),
  }),
  location: z.string().trim().min(5, 'Ingresa la dirección completa'),
  orderLimit: z.coerce.number().int().min(1, 'El mínimo es 1').max(50, 'El máximo es 50'),
  country: z.string().trim().length(2, 'Selecciona un país'),
  city: z.string().trim().min(1, 'Selecciona un departamento o región'),
  taxRate: z.coerce.number().refine((value) => value === 0 || value === 18, 'Selecciona una tasa válida'),
  currency: z.enum(['PEN', 'USD']),
  category: z.string().min(1, 'Selecciona una categoría'),
  days: z.array(eventDaySchema).min(1, 'Agrega al menos una fecha'),
}).superRefine((data, context) => {
  const usedDates = new Set<string>();
  data.days.forEach((day, index) => {
    if (day.startTime && day.endTime && day.endTime <= day.startTime) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: 'La hora de fin debe ser posterior al inicio', path: ['days', index, 'endTime'] });
    }
    if (day.date && usedDates.has(day.date)) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: 'Esta fecha ya fue agregada', path: ['days', index, 'date'] });
    }
    usedDates.add(day.date);
  });
});

type CreateEventFormData = z.infer<typeof createEventSchema>;

const emptyDay = (): CreateEventFormData['days'][number] => ({
  date: '', startTime: '20:00', endTime: '22:30', saleStartAt: '', description: '',
});

const withSeconds = (time: string): string => time.length === 5 ? `${time}:00` : time;
const toLimaDateTime = (dateTime: string): string => {
  if (/Z$|[+-]\d{2}:\d{2}$/.test(dateTime)) return dateTime;
  return `${dateTime.length === 16 ? `${dateTime}:00` : dateTime}-05:00`;
};

export default function NewEventPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [categoryOptions, setCategoryOptions] = useState<Array<{ code: string; label: string }>>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState(false);

  const { register, control, handleSubmit, watch, setValue, formState: { errors } } = useForm<CreateEventFormData>({
    resolver: zodResolver(createEventSchema),
    defaultValues: {
      name: '', description: '', venue: '',
      coordinates: { latitude: -12.046374, longitude: -77.042793 },
      location: '', orderLimit: 5, country: 'PE', city: '', taxRate: 18, currency: 'PEN', category: '',
      days: [emptyDay()],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'days' });
  const coordinates = watch('coordinates');
  const country = watch('country');
  const city = watch('city');

  useEffect(() => { loadCategoryOptions(); }, []);

  const loadCategoryOptions = async () => {
    setCategoriesLoading(true);
    setCategoriesError(false);
    try {
      setCategoryOptions(await eventCreationService.getCategoryOptions());
    } catch (error) {
      console.error('Failed to load event categories:', error);
      setCategoriesError(true);
    } finally {
      setCategoriesLoading(false);
    }
  };

  const onSubmit = async (data: CreateEventFormData) => {
    setLoading(true);
    try {
      await eventCreationService.createEvent({
        name: data.name.trim(), description: data.description.trim(), venue: data.venue.trim(),
        coordinates: data.coordinates, location: data.location.trim(), orderLimit: data.orderLimit,
        country: data.country.toUpperCase(), city: data.city, taxRate: data.taxRate as 0 | 18,
        currency: data.currency, category: data.category,
        days: data.days.map((day) => ({
          date: day.date, startTime: withSeconds(day.startTime), endTime: withSeconds(day.endTime),
          saleStartAt: toLimaDateTime(day.saleStartAt), description: day.description.trim(),
        })),
      });
      showToast('success', 'Evento creado', 'Ya puedes encontrarlo en el listado de eventos.');
      router.push('/app/events');
    } catch (error: any) {
      showToast('error', 'No se pudo crear el evento', error?.error?.message || 'Revisa la información e inténtalo nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card lg:p-6">
        <Link href="/app/events" className="mb-3 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900">
          <ArrowLeft className="h-4 w-4" /> Volver a eventos
        </Link>
        <div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">Crear evento</h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-500">Registra la información general, ubicación y todas las fechas del evento.</p>
          </div>
        </div>
      </header>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <main className="space-y-6">
            <Card header={<SectionHeader number="1" title="Información general" subtitle="Datos con los que se presentará el evento." />}>
              <div className="space-y-4">
                <Input label="Nombre del evento" placeholder="Ej. YOASOBI ASIA TOUR 2026" error={errors.name?.message} {...register('name')} />
                <Textarea label="Descripción" placeholder="Describe la propuesta, artistas, formato y aspectos principales..." rows={5} error={errors.description?.message} {...register('description')} />
                <Select
                  label="Categoría"
                  options={[{ value: '', label: categoriesLoading ? 'Cargando categorías...' : 'Selecciona una categoría' }, ...categoryOptions.map((item) => ({ value: item.code, label: item.label }))]}
                  disabled={categoriesLoading || categoriesError}
                  error={errors.category?.message}
                  {...register('category')}
                />
                {categoriesError && (
                  <div className="flex items-center justify-between gap-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2">
                    <p className="text-xs text-rose-700">No se pudieron cargar las categorías.</p>
                    <Button type="button" variant="ghost" size="sm" leftIcon={<RotateCcw className="h-3.5 w-3.5" />} onClick={loadCategoryOptions}>Reintentar</Button>
                  </div>
                )}
              </div>
            </Card>

            <Card header={<SectionHeader number="2" title="Recinto y ubicación" subtitle="Selecciona el punto exacto haciendo clic en el mapa." />}>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Input label="Recinto" placeholder="Ej. Arena 1" leftIcon={<MapPin className="h-4 w-4" />} error={errors.venue?.message} {...register('venue')} />
                  <Input label="Dirección" placeholder="Circuito de Playas s/n, Costa Verde..." error={errors.location?.message} {...register('location')} />
                </div>
                <CountryCitySelector
                  countryCode={country}
                  cityCode={city}
                  countryError={errors.country?.message}
                  cityError={errors.city?.message}
                  onCountryChange={(countryCode) => {
                    setValue('country', countryCode, { shouldDirty: true, shouldValidate: true });
                  }}
                  onCityChange={(cityCode, nextCoordinates) => {
                    setValue('city', cityCode, { shouldDirty: true, shouldValidate: true });
                    if (nextCoordinates) {
                      setValue('coordinates.latitude', nextCoordinates.latitude, { shouldDirty: true, shouldValidate: true });
                      setValue('coordinates.longitude', nextCoordinates.longitude, { shouldDirty: true, shouldValidate: true });
                    }
                  }}
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input label="Latitud" type="number" step="any" error={errors.coordinates?.latitude?.message} {...register('coordinates.latitude', { valueAsNumber: true })} />
                  <Input label="Longitud" type="number" step="any" error={errors.coordinates?.longitude?.message} {...register('coordinates.longitude', { valueAsNumber: true })} />
                </div>
                <CoordinatePicker
                  latitude={Number(coordinates?.latitude) || -12.046374}
                  longitude={Number(coordinates?.longitude) || -77.042793}
                  onChange={({ latitude, longitude }) => {
                    setValue('coordinates.latitude', latitude, { shouldDirty: true, shouldValidate: true });
                    setValue('coordinates.longitude', longitude, { shouldDirty: true, shouldValidate: true });
                  }}
                />
                <p className="text-[11px] text-slate-500">Mapa provisto por OpenStreetMap. Haz clic para mover el marcador.</p>
              </div>
            </Card>

            <Card
              header={
                <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <SectionHeader number="3" title="Fechas y horarios" subtitle="Puedes registrar una o más presentaciones." />
                  <Button type="button" variant="primary" size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => append(emptyDay())}>Agregar fecha</Button>
                </div>
              }
            >
              <div className="space-y-4">
                {fields.map((field, index) => (
                  <section key={field.id} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-brand-600" /><h3 className="text-xs font-bold text-slate-800">Fecha {index + 1}</h3></div>
                      {fields.length > 1 && <button type="button" onClick={() => remove(index)} className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"><Trash2 className="h-4 w-4" /></button>}
                    </div>
                    <div className="grid gap-4 md:grid-cols-3">
                      <Input label="Fecha" type="date" error={errors.days?.[index]?.date?.message} {...register(`days.${index}.date`)} />
                      <Input label="Hora de inicio" type="time" error={errors.days?.[index]?.startTime?.message} {...register(`days.${index}.startTime`)} />
                      <Input label="Hora de fin" type="time" error={errors.days?.[index]?.endTime?.message} {...register(`days.${index}.endTime`)} />
                    </div>
                    <div className="mt-4 grid gap-4 md:grid-cols-[260px_1fr]">
                      <Input label="Inicio de venta" type="datetime-local" error={errors.days?.[index]?.saleStartAt?.message} {...register(`days.${index}.saleStartAt`)} />
                      <Textarea label="Descripción de la fecha" placeholder="Ej. Presentación única. Apertura de puertas a las 18:00." rows={2} className="min-h-[68px]" error={errors.days?.[index]?.description?.message} {...register(`days.${index}.description`)} />
                    </div>
                  </section>
                ))}
              </div>
            </Card>
          </main>

          <aside className="space-y-5 xl:sticky xl:top-6">
            <Card header={<div className="flex items-center gap-2"><DollarSign className="h-4 w-4 text-emerald-600" /><h2 className="text-sm font-bold text-slate-900">Configuración comercial</h2></div>}>
              <div className="space-y-4">
                <Select label="Moneda" options={[{ value: 'PEN', label: 'PEN — Sol peruano' }, { value: 'USD', label: 'USD — Dólar estadounidense' }]} error={errors.currency?.message} {...register('currency')} />
                <Select label="Impuesto" options={[{ value: 18, label: '18% — IGV' }, { value: 0, label: '0% — Exonerado' }]} error={errors.taxRate?.message} {...register('taxRate')} />
                <Input label="Máximo por orden" type="number" min={1} max={50} helperText="Cantidad máxima de entradas por compra." error={errors.orderLimit?.message} {...register('orderLimit', { valueAsNumber: true })} />
              </div>
            </Card>

            <div className="flex flex-col gap-2.5">
              <Button type="submit" variant="primary" size="lg" className="w-full whitespace-nowrap" isLoading={loading} rightIcon={<CheckCircle2 className="h-4 w-4" />}>Crear evento en borrador</Button>
              <Link href="/app/events"><Button type="button" variant="outline" size="md" className="w-full">Cancelar</Button></Link>
            </div>
          </aside>
        </div>
      </form>
    </div>
  );
}

function SectionHeader({ number, title, subtitle }: { number: string; title: string; subtitle: string }) {
  return <div className="flex items-center gap-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-sm font-black text-brand-600">{number}</span><div><h2 className="text-sm font-bold text-slate-900">{title}</h2><p className="text-[11px] text-slate-500">{subtitle}</p></div></div>;
}
