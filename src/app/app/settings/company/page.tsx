'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Building2, MapPin, Save, Trash2, Upload } from 'lucide-react';
import { companyService } from '@/lib/api/services';
import { Company, DocumentType, DocumentTypeLabels } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';

const CountryCitySelector = dynamic(() => import('@/components/location/CountryCitySelector'), {
  ssr: false,
  loading: () => <Skeleton className="h-16 w-full rounded-xl" />,
});

const timezoneOptions = [
  { value: 'America/Lima', label: 'America/Lima (UTC-05:00)' },
  { value: 'America/Bogota', label: 'America/Bogotá (UTC-05:00)' },
  { value: 'America/Santiago', label: 'America/Santiago' },
  { value: 'America/Argentina/Buenos_Aires', label: 'America/Buenos Aires (UTC-03:00)' },
  { value: 'America/Mexico_City', label: 'America/Ciudad de México (UTC-06:00)' },
  { value: 'America/New_York', label: 'America/Nueva York' },
  { value: 'America/Los_Angeles', label: 'America/Los Ángeles' },
  { value: 'Europe/Madrid', label: 'Europa/Madrid' },
];

export default function CompanySettingsPage() {
  const { showToast } = useToast();
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [removingLogo, setRemovingLogo] = useState(false);
  const [confirmingLogoRemoval, setConfirmingLogoRemoval] = useState(false);

  useEffect(() => {
    const loadCompany = async () => {
      setLoading(true);
      try {
        const response = await companyService.getCompanyDetails();
        setCompany({
          ...response,
          country: response.country || 'PE',
          city: response.city || '',
          timezone: response.timezone || 'America/Lima',
          defaultCurrency: response.defaultCurrency || 'PEN',
          defaultTaxRate: response.defaultTaxRate ?? 18,
          document: response.document || { type: DocumentType.RUC, number: '' },
        });
      } catch (error) {
        console.error('Failed to load company details:', error);
        showToast('error', 'No se pudo cargar la compañía', 'Inténtalo nuevamente.');
      } finally {
        setLoading(false);
      }
    };
    loadCompany();
  }, []);

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!company) return;
    setSaving(true);
    try {
      await companyService.updateCompany(company);
      showToast('success', 'Compañía actualizada', 'Los datos fueron guardados correctamente.');
    } catch (error: any) {
      showToast('error', 'No se pudo guardar la compañía', error?.error?.message || 'Revisa los datos e inténtalo nuevamente.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !company) return;
    setUploadingLogo(true);
    try {
      const url = await companyService.uploadLogo(file);
      setCompany({ ...company, logo: url });
      showToast('success', 'Logo actualizado', 'El nuevo logo fue guardado correctamente.');
    } catch (error: any) {
      showToast('error', 'No se pudo subir el logo', error?.error?.message || 'Inténtalo nuevamente.');
    } finally {
      setUploadingLogo(false);
      event.target.value = '';
    }
  };

  const handleRemoveLogo = async () => {
    if (!company) return;
    setRemovingLogo(true);
    try {
      await companyService.updateCompany({ ...company, logo: null });
      setCompany({ ...company, logo: null });
      setConfirmingLogoRemoval(false);
      showToast('success', 'Logo eliminado', 'El logotipo de la compañía fue retirado correctamente.');
    } catch (error: any) {
      showToast('error', 'No se pudo eliminar el logo', error?.error?.message || 'Inténtalo nuevamente.');
    } finally {
      setRemovingLogo(false);
    }
  };

  if (loading || !company) {
    return <div className="space-y-6"><Skeleton className="h-16 rounded-xl" /><Skeleton className="h-96 rounded-xl" /></div>;
  }

  const hasCurrentTimezone = timezoneOptions.some((option) => option.value === company.timezone);
  const availableTimezoneOptions = hasCurrentTimezone
    ? timezoneOptions
    : [{ value: company.timezone, label: company.timezone }, ...timezoneOptions];

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card lg:p-6">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Compañía</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">Administra la identidad, información fiscal y configuración comercial de la compañía activa.</p>
        </div>
      </header>

      <form onSubmit={handleSave} className="space-y-6">
        <Card header={<div className="flex items-center gap-2"><Building2 className="h-4 w-4 text-brand-600" /><h2 className="text-sm font-bold text-slate-900">Identidad y contacto</h2></div>}>
          <div className="space-y-5">
            <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-brand-200 bg-brand-50">
                {company.logo ? <img src={company.logo} alt={company.name} className="h-full w-full object-cover" /> : <Building2 className="h-8 w-8 text-brand-500" />}
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">Logotipo</p>
                <p className="mt-0.5 text-[11px] text-slate-500">Usa una imagen cuadrada en formato PNG, JPG o WEBP.</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <label className={`inline-flex items-center gap-2 rounded-lg border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 transition-colors hover:bg-brand-100 ${uploadingLogo || removingLogo ? 'pointer-events-none opacity-60' : 'cursor-pointer'}`}>
                    <Upload className="h-3.5 w-3.5" /> {uploadingLogo ? 'Subiendo...' : company.logo ? 'Reemplazar logo' : 'Agregar logo'}
                    <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleLogoUpload} />
                  </label>
                  {company.logo && (confirmingLogoRemoval ? (
                    <>
                      <Button type="button" variant="danger" size="sm" isLoading={removingLogo} onClick={handleRemoveLogo}>Confirmar</Button>
                      <Button type="button" variant="outline" size="sm" disabled={removingLogo} onClick={() => setConfirmingLogoRemoval(false)}>Cancelar</Button>
                    </>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                      leftIcon={<Trash2 className="h-3.5 w-3.5" />}
                      disabled={uploadingLogo}
                      onClick={() => setConfirmingLogoRemoval(true)}
                    >
                      Eliminar logo
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            <Input label="Nombre comercial o razón social" value={company.name} onChange={(event) => setCompany({ ...company, name: event.target.value })} />
            <Textarea label="Descripción de la compañía" rows={3} value={company.description || ''} onChange={(event) => setCompany({ ...company, description: event.target.value })} />

            <div className="grid gap-4 md:grid-cols-2">
              <Select label="Tipo de documento" options={Object.entries(DocumentTypeLabels).map(([value, label]) => ({ value: Number(value), label }))} value={company.document.type} onChange={(event) => setCompany({ ...company, document: { ...company.document, type: Number(event.target.value) as DocumentType } })} />
              <Input label="Número de documento" value={company.document.number} onChange={(event) => setCompany({ ...company, document: { ...company.document, number: event.target.value } })} />
              <Input label="Correo de contacto" type="email" value={company.email || ''} onChange={(event) => setCompany({ ...company, email: event.target.value })} />
              <Input label="Teléfono" type="tel" value={company.telephone || ''} onChange={(event) => setCompany({ ...company, telephone: event.target.value })} />
              <Input label="Sitio web" type="url" placeholder="https://" value={company.webSite || ''} onChange={(event) => setCompany({ ...company, webSite: event.target.value })} />
            </div>
          </div>
        </Card>

        <Card header={<div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-brand-600" /><h2 className="text-sm font-bold text-slate-900">Ubicación y configuración comercial</h2></div>}>
          <div className="space-y-5">
            <CountryCitySelector
              countryCode={company.country || ''}
              cityCode={company.city || ''}
              onCountryChange={(country) => setCompany((current) => current ? { ...current, country, city: '' } : current)}
              onCityChange={(city) => setCompany((current) => current ? { ...current, city } : current)}
            />
            <Input label="Dirección fiscal" value={company.location || ''} onChange={(event) => setCompany({ ...company, location: event.target.value })} />
            <div className="grid gap-4 md:grid-cols-3">
              <Select label="Zona horaria" options={availableTimezoneOptions} value={company.timezone} onChange={(event) => setCompany({ ...company, timezone: event.target.value })} />
              <Select label="Moneda predeterminada" options={[{ value: 'PEN', label: 'PEN — Sol peruano' }, { value: 'USD', label: 'USD — Dólar estadounidense' }]} value={company.defaultCurrency} onChange={(event) => setCompany({ ...company, defaultCurrency: event.target.value })} />
              <Select label="Impuesto predeterminado" options={[{ value: 18, label: '18% — IGV' }, { value: 0, label: '0% — Exonerado' }]} value={company.defaultTaxRate} onChange={(event) => setCompany({ ...company, defaultTaxRate: Number(event.target.value) })} />
            </div>
          </div>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" variant="primary" isLoading={saving} disabled={!company.name.trim() || !company.country || !company.city || !company.document.number.trim()} leftIcon={<Save className="h-4 w-4" />}>
            Guardar cambios
          </Button>
        </div>
      </form>
    </div>
  );
}
