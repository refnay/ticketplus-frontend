'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, CheckCircle2 } from 'lucide-react';
import { authService } from '@/lib/api/services';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || 'mock-recovery-token';
  const { showToast } = useToast();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showToast('error', 'Error', 'Las contraseñas no coinciden');
      return;
    }
    setLoading(true);
    try {
      await authService.resetPassword(token, newPassword);
      showToast('success', 'Contraseña restablecida', 'Inicia sesión con tu nueva contraseña.');
      router.push('/login');
    } catch (e) {
      showToast('error', 'Error', 'No se pudo restablecer la contraseña.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Nueva contraseña"
        type="password"
        placeholder="••••••••"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        leftIcon={<Lock className="w-4 h-4" />}
        required
      />
      <Input
        label="Confirmar contraseña"
        type="password"
        placeholder="••••••••"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        leftIcon={<Lock className="w-4 h-4" />}
        required
      />
      <Button type="submit" variant="primary" className="w-full" isLoading={loading} rightIcon={<CheckCircle2 className="w-4 h-4" />}>
        Guardar nueva contraseña
      </Button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-elevated p-8 border border-slate-100 space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Restablecer Contraseña</h1>
          <p className="text-xs text-slate-500 mt-1">Ingresa tu nueva contraseña para ingresar al ERP.</p>
        </div>
        <Suspense fallback={<div className="text-xs text-slate-400">Cargando formulario...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
