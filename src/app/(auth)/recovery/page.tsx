'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft, Send } from 'lucide-react';
import { authService } from '@/lib/api/services';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';

export default function RecoveryPage() {
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      await authService.requestRecovery(email);
      setSent(true);
      showToast('success', 'Correo enviado', 'Revisa tu bandeja para restablecer tu contraseña.');
    } catch (e) {
      showToast('error', 'Error', 'No se pudo enviar el correo de recuperación.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-elevated p-8 border border-slate-100 space-y-6">
        <div>
          <Link href="/login" className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-900 mb-4">
            <ArrowLeft className="w-4 h-4" /> Volver al login
          </Link>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Recuperar Contraseña</h1>
          <p className="text-xs text-slate-500 mt-1">
            Ingresa el correo electrónico asociado a tu cuenta para recibir las instrucciones.
          </p>
        </div>

        {sent ? (
          <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-center space-y-2">
            <p className="text-xs font-bold text-emerald-800">¡Enlace de recuperación enviado!</p>
            <p className="text-xs text-emerald-700">
              Hemos enviado un correo a <span className="font-semibold">{email}</span> con las instrucciones.
            </p>
            <div className="pt-2">
              <Link href="/recovery/reset?token=mock-recovery-token">
                <Button variant="outline" size="sm">
                  Probar enlace de restablecimiento
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Correo electrónico"
              type="email"
              placeholder="admin@ticketplus.pe"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="w-4 h-4" />}
              required
            />
            <Button type="submit" variant="primary" className="w-full" isLoading={loading} rightIcon={<Send className="w-4 h-4" />}>
              Enviar instrucciones
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
