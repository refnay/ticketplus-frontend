'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Lock, Mail, ArrowRight, Sparkles } from 'lucide-react';
import { authService } from '@/lib/api/services';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';

const loginSchema = z.object({
  email: z.string().email('Ingresa un correo electrónico válido'),
  password: z.string().min(5, 'La contraseña debe tener al menos 5 caracteres'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: 'admin@ticketplus.pe',
      password: 'Password123!',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true);
    try {
      await authService.login(data);
      showToast('success', 'Bienvenido a Ticketplus', 'Sesión iniciada correctamente.');
      router.push('/companies/select');
    } catch (e: any) {
      showToast('error', 'Error al iniciar sesión', e?.error?.message || 'Credenciales inválidas.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoCreds = () => {
    setValue('email', 'admin@ticketplus.pe');
    setValue('password', 'Password123!');
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-elevated p-8 border border-slate-100 space-y-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-brand-600 text-white font-black text-xl shadow-md mb-2">
            T+
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Acceso a Ticketplus ERP</h1>
          <p className="text-xs text-slate-500">Ingresa tus credenciales para administrar tus eventos</p>
        </div>

        <button
          type="button"
          onClick={fillDemoCreds}
          className="w-full p-3 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-between text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span>Usar credenciales de demostración</span>
          </div>
          <span className="underline">Autocompletar</span>
        </button>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Correo electrónico"
            type="email"
            placeholder="admin@ticketplus.pe"
            leftIcon={<Mail className="w-4 h-4" />}
            error={errors.email?.message}
            {...register('email')}
          />

          <Input
            label="Contraseña"
            type="password"
            placeholder="••••••••"
            leftIcon={<Lock className="w-4 h-4" />}
            error={errors.password?.message}
            {...register('password')}
          />

          <div className="flex items-center justify-between text-xs">
            <label className="flex items-center gap-2 cursor-pointer text-slate-600">
              <input type="checkbox" defaultChecked className="rounded border-slate-300 text-brand-600" />
              <span>Recordar sesión</span>
            </label>
            <Link href="/recovery" className="font-semibold text-brand-600 hover:underline">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          <Button type="submit" variant="primary" className="w-full py-2.5" isLoading={loading} rightIcon={<ArrowRight className="w-4 h-4" />}>
            Iniciar sesión
          </Button>
        </form>

        <div className="text-center pt-2 border-t border-slate-100">
          <p className="text-xs text-slate-500">
            ¿Aún no tienes una cuenta de organizador?{' '}
            <Link href="/register" className="font-bold text-brand-600 hover:underline">
              Regístrate aquí
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
