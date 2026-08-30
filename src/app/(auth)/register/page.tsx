'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Mail, Lock, Phone, CreditCard, Calendar as CalendarIcon, ArrowRight } from 'lucide-react';
import { authService } from '@/lib/api/services';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useToast } from '@/components/ui/Toast';
import { DocumentType } from '@/types';

const registerSchema = z.object({
  name: z.string().min(2, 'Ingresa tu nombre'),
  lastName: z.string().min(2, 'Ingresa tu apellido'),
  email: z.string().email('Ingresa un correo electrónico válido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  birthDate: z.string().min(1, 'Ingresa tu fecha de nacimiento'),
  city: z.string().min(2, 'Ingresa tu ciudad'),
  country: z.string().min(2, 'Ingresa tu país'),
  documentType: z.coerce.number(),
  documentNumber: z.string().min(5, 'Ingresa tu número de documento'),
  mobile: z.string().min(6, 'Ingresa tu número de celular'),
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      country: 'PE',
      city: 'LIM',
      documentType: DocumentType.DNI,
      birthDate: '1992-06-15',
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setLoading(true);
    try {
      await authService.register(data);
      showToast('success', 'Cuenta creada', 'Te has registrado exitosamente.');
      router.push('/companies/select');
    } catch (e: any) {
      showToast('error', 'Error en registro', e?.error?.message || 'No se pudo completar el registro.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-elevated p-8 border border-slate-100 space-y-6 animate-in fade-in duration-200">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Registro de Organizador</h1>
          <p className="text-xs text-slate-500">Crea tu cuenta de organizador en Ticketplus</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Nombre" placeholder="Oscar" error={errors.name?.message} {...register('name')} />
            <Input label="Apellido" placeholder="Ramírez" error={errors.lastName?.message} {...register('lastName')} />
          </div>

          <Input label="Correo electrónico" type="email" placeholder="admin@empresa.pe" leftIcon={<Mail className="w-4 h-4" />} error={errors.email?.message} {...register('email')} />

          <Input label="Contraseña" type="password" placeholder="••••••••" leftIcon={<Lock className="w-4 h-4" />} error={errors.password?.message} {...register('password')} />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Tipo de documento"
              options={[
                { value: DocumentType.DNI, label: 'DNI' },
                { value: DocumentType.PASSPORT, label: 'Pasaporte' },
                { value: DocumentType.FOREIGN_CARD, label: 'Carnet Extranjería' },
                { value: DocumentType.RUC, label: 'RUC' },
                { value: DocumentType.ID_CARD, label: 'Cédula' },
              ]}
              {...register('documentType')}
            />
            <Input label="Número de documento" placeholder="71234567" error={errors.documentNumber?.message} {...register('documentNumber')} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label="Teléfono celular" placeholder="+51987654321" leftIcon={<Phone className="w-4 h-4" />} error={errors.mobile?.message} {...register('mobile')} />
            <Input label="Fecha de nacimiento" type="date" error={errors.birthDate?.message} {...register('birthDate')} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label="Ciudad" placeholder="LIM" error={errors.city?.message} {...register('city')} />
            <Input label="País" placeholder="PE" error={errors.country?.message} {...register('country')} />
          </div>

          <Button type="submit" variant="primary" className="w-full py-2.5 mt-2" isLoading={loading} rightIcon={<ArrowRight className="w-4 h-4" />}>
            Crear cuenta de organizador
          </Button>
        </form>

        <div className="text-center pt-2 border-t border-slate-100">
          <p className="text-xs text-slate-500">
            ¿Ya tienes una cuenta?{' '}
            <Link href="/login" className="font-bold text-brand-600 hover:underline">
              Inicia sesión aquí
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
