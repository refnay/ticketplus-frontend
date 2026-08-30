'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Lock, Save, Trash2, Upload, UserRound } from 'lucide-react';
import { authService } from '@/lib/api/services';
import { DocumentType, DocumentTypeLabels, UserProfile } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';

const CountryCitySelector = dynamic(() => import('@/components/location/CountryCitySelector'), {
  ssr: false,
  loading: () => <Skeleton className="h-16 w-full rounded-xl" />,
});

const toInputDate = (value: string): string => {
  const match = value?.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  return match ? `${match[3]}-${match[2]}-${match[1]}` : value || '';
};

export default function ProfileSettingsPage() {
  const { showToast } = useToast();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [removingAvatar, setRemovingAvatar] = useState(false);
  const [confirmingAvatarRemoval, setConfirmingAvatarRemoval] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    const loadUser = async () => {
      setLoading(true);
      try {
        const response = await authService.getCurrentUser();
        setUser({ ...response, birthDate: toInputDate(response.birthDate) });
      } catch (error) {
        console.error('Failed to load profile:', error);
        showToast('error', 'No se pudo cargar el perfil', 'Inténtalo nuevamente.');
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  const handleSaveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) return;
    setSavingProfile(true);
    try {
      const updated = await authService.updateProfile(user);
      setUser({ ...user, ...updated, birthDate: toInputDate(updated.birthDate || user.birthDate) });
      showToast('success', 'Perfil actualizado', 'Tus datos personales fueron guardados.');
    } catch (error: any) {
      showToast('error', 'No se pudo actualizar el perfil', error?.error?.message || 'Revisa los datos e inténtalo nuevamente.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!oldPassword || !newPassword || newPassword !== confirmPassword) {
      showToast('warning', 'Revisa las contraseñas', 'La nueva contraseña y su confirmación deben coincidir.');
      return;
    }
    setChangingPassword(true);
    try {
      await authService.changePassword(oldPassword, newPassword);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showToast('success', 'Contraseña actualizada', 'Tu contraseña fue modificada correctamente.');
    } catch (error: any) {
      showToast('error', 'No se pudo cambiar la contraseña', error?.error?.message || 'Verifica tu contraseña actual.');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;
    setUploadingAvatar(true);
    try {
      const url = await authService.uploadProfileImage(file);
      setUser({ ...user, profileImage: url });
      showToast('success', 'Foto actualizada', 'La nueva imagen de perfil fue guardada.');
    } catch (error: any) {
      showToast('error', 'No se pudo subir la foto', error?.error?.message || 'Inténtalo nuevamente.');
    } finally {
      setUploadingAvatar(false);
      event.target.value = '';
    }
  };

  const handleRemoveAvatar = async () => {
    if (!user) return;
    setRemovingAvatar(true);
    try {
      await authService.updateProfile({ ...user, profileImage: null });
      setUser({ ...user, profileImage: null });
      setConfirmingAvatarRemoval(false);
      showToast('success', 'Foto eliminada', 'La imagen de perfil fue retirada correctamente.');
    } catch (error: any) {
      showToast('error', 'No se pudo eliminar la foto', error?.error?.message || 'Inténtalo nuevamente.');
    } finally {
      setRemovingAvatar(false);
    }
  };

  if (loading || !user) {
    return <div className="space-y-6"><Skeleton className="h-16 rounded-xl" /><Skeleton className="h-96 rounded-xl" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900">Perfil</h1>
        <p className="mt-1 text-xs text-slate-500">Administra tus datos personales y credenciales de acceso.</p>
      </div>

      <Card header={<div className="flex items-center gap-2"><UserRound className="h-4 w-4 text-brand-600" /><h2 className="text-sm font-bold text-slate-900">Información personal</h2></div>}>
        <form onSubmit={handleSaveProfile} className="space-y-5">
          <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border border-brand-200 bg-brand-100 text-xl font-bold text-brand-700">
              {user.profileImage ? <img src={user.profileImage} alt={`${user.name} ${user.lastName}`} className="h-full w-full object-cover" /> : <span>{user.name?.[0]}{user.lastName?.[0]}</span>}
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">Foto de perfil</p>
              <p className="mt-0.5 text-[11px] text-slate-500">Usa una imagen cuadrada en formato PNG, JPG o WEBP.</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <label className={`inline-flex items-center gap-2 rounded-lg border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 transition-colors hover:bg-brand-100 ${uploadingAvatar || removingAvatar ? 'pointer-events-none opacity-60' : 'cursor-pointer'}`}>
                  <Upload className="h-3.5 w-3.5" /> {uploadingAvatar ? 'Subiendo...' : user.profileImage ? 'Reemplazar foto' : 'Agregar foto'}
                  <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleAvatarUpload} />
                </label>
                {user.profileImage && (confirmingAvatarRemoval ? (
                  <>
                    <Button type="button" variant="danger" size="sm" isLoading={removingAvatar} onClick={handleRemoveAvatar}>Confirmar</Button>
                    <Button type="button" variant="outline" size="sm" disabled={removingAvatar} onClick={() => setConfirmingAvatarRemoval(false)}>Cancelar</Button>
                  </>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                    leftIcon={<Trash2 className="h-3.5 w-3.5" />}
                    disabled={uploadingAvatar}
                    onClick={() => setConfirmingAvatarRemoval(true)}
                  >
                    Eliminar foto
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Input label="Nombres" value={user.name} onChange={(event) => setUser({ ...user, name: event.target.value })} />
            <Input label="Apellidos" value={user.lastName} onChange={(event) => setUser({ ...user, lastName: event.target.value })} />
            <Input label="Correo electrónico" type="email" value={user.email} disabled helperText="El correo no se puede modificar desde esta sección." />
            <Input label="Teléfono celular" type="tel" value={user.mobile || ''} onChange={(event) => setUser({ ...user, mobile: event.target.value })} />
            <Input label="Fecha de nacimiento" type="date" value={user.birthDate || ''} onChange={(event) => setUser({ ...user, birthDate: event.target.value })} />
          </div>

          <CountryCitySelector
            countryCode={user.country || ''}
            cityCode={user.city || ''}
            onCountryChange={(country) => setUser((current) => current ? { ...current, country, city: '' } : current)}
            onCityChange={(city) => setUser((current) => current ? { ...current, city } : current)}
          />

          <div className="grid gap-4 md:grid-cols-2">
            <Select label="Tipo de documento" options={Object.entries(DocumentTypeLabels).map(([value, label]) => ({ value: Number(value), label }))} value={user.document.type} onChange={(event) => setUser({ ...user, document: { ...user.document, type: Number(event.target.value) as DocumentType } })} />
            <Input label="Número de documento" value={user.document.number} onChange={(event) => setUser({ ...user, document: { ...user.document, number: event.target.value } })} />
          </div>

          <div className="flex justify-end"><Button type="submit" variant="primary" isLoading={savingProfile} leftIcon={<Save className="h-4 w-4" />}>Guardar perfil</Button></div>
        </form>
      </Card>

      <Card header={<div className="flex items-center gap-2"><Lock className="h-4 w-4 text-brand-600" /><h2 className="text-sm font-bold text-slate-900">Seguridad</h2></div>}>
        <form onSubmit={handleChangePassword} className="space-y-5">
          <div className="grid gap-4 lg:grid-cols-3">
            <Input label="Contraseña actual" type="password" autoComplete="current-password" value={oldPassword} onChange={(event) => setOldPassword(event.target.value)} required />
            <Input label="Nueva contraseña" type="password" autoComplete="new-password" minLength={8} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} required />
            <Input label="Confirmar contraseña" type="password" autoComplete="new-password" minLength={8} error={confirmPassword && newPassword !== confirmPassword ? 'Las contraseñas no coinciden.' : undefined} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required />
          </div>
          <div className="flex justify-end"><Button type="submit" variant="outline" isLoading={changingPassword} disabled={!oldPassword || !newPassword || newPassword !== confirmPassword}>Actualizar contraseña</Button></div>
        </form>
      </Card>
    </div>
  );
}
