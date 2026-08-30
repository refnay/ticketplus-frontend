'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Building2, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { companyService } from '@/lib/api/services';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useToast } from '@/components/ui/Toast';
import { DocumentType } from '@/types';

const companySchema = z.object({
  name: z.string().min(3, 'El nombre de la empresa debe tener al menos 3 caracteres'),
  description: z.string().optional(),
  documentType: z.coerce.number(),
  documentNumber: z.string().min(8, 'Ingresa un número de documento válido'),
  email: z.string().email('Ingresa un correo de contacto válido'),
  telephone: z.string().min(6, 'Ingresa un teléfono de contacto'),
  webSite: z.string().optional(),
  country: z.string().min(2, 'Ingresa el país'),
  city: z.string().min(2, 'Ingresa la ciudad'),
  location: z.string().min(3, 'Ingresa la dirección física'),
  timezone: z.string().default('America/Lima'),
  defaultCurrency: z.string().default('PEN'),
  defaultTaxRate: z.coerce.number().default(18),
});

type CompanyFormData = z.infer<typeof companySchema>;

export default function NewCompanyPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      country: 'PE',
      city: 'LIM',
      documentType: DocumentType.RUC,
      documentNumber: '20601234567',
      timezone: 'America/Lima',
      defaultCurrency: 'PEN',
      defaultTaxRate: 18,
    },
  });

  const onSubmit = async (data: CompanyFormData) => {
    setLoading(true);
    try {
      const res = await companyService.createCompany({
        ...data,
        document: { type: data.documentType as DocumentType, number: data.documentNumber },
      });
      showToast('success', 'Compañía creada', 'Tu empresa ha sido registrada con éxito.');
      router.push('/app');
    } catch (e: any) {
      showToast('error', 'Error al crear compañía', e?.error?.message || 'No se pudo crear la empresa.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-elevated p-8 border border-slate-100 space-y-6 animate-in fade-in duration-200">
        <div>
          <Link href="/companies/select" className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-900 mb-4">
            <ArrowLeft className="w-4 h-4" /> Volver a selección
          </Link>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Crear Nueva Compañía</h1>
          <p className="text-xs text-slate-500 mt-1">Registra tu empresa organizadora para gestionar tus eventos</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Nombre de la empresa" placeholder="Productora Andina S.A.C." error={errors.name?.message} {...register('name')} />

          <Input label="Descripción o rubro" placeholder="Productora de eventos musicales y festivales" error={errors.description?.message} {...register('description')} />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Tipo de documento"
              options={[
                { value: DocumentType.RUC, label: 'RUC' },
                { value: DocumentType.DNI, label: 'DNI' },
              ]}
              {...register('documentType')}
            />
            <Input label="Número de RUC / Documento" placeholder="20601234567" error={errors.documentNumber?.message} {...register('documentNumber')} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label="Correo corporativo" type="email" placeholder="contacto@andina.pe" error={errors.email?.message} {...register('email')} />
            <Input label="Teléfono de contacto" placeholder="+5115551234" error={errors.telephone?.message} {...register('telephone')} />
          </div>

          <Input label="Sitio Web" placeholder="https://andina.pe" error={errors.webSite?.message} {...register('webSite')} />

          <div className="grid grid-cols-2 gap-4">
            <Input label="Ciudad" placeholder="LIM" error={errors.city?.message} {...register('city')} />
            <Input label="País" placeholder="PE" error={errors.country?.message} {...register('country')} />
          </div>

          <Input label="Dirección / Ubicación" placeholder="Av. Javier Prado Este 1234, San Isidro" error={errors.location?.message} {...register('location')} />

          <Button type="submit" variant="primary" className="w-full py-2.5 mt-2" isLoading={loading} rightIcon={<CheckCircle2 className="w-4 h-4" />}>
            Registrar empresa y continuar
          </Button>
        </form>
      </div>
    </div>
  );
}
