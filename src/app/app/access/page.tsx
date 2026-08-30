'use client';

import React, { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { QrCode, Camera, CheckCircle2, AlertTriangle, XCircle, Search, RefreshCw, Layers } from 'lucide-react';
import { eventService, accessService } from '@/lib/api/services';
import { EventDetail, SessionDay, AccessSummary, ValidateTicketResponse } from '@/types';
import { formatDateTime, formatPercentage } from '@/lib/formatting';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';

function AccessControlContent() {
  const searchParams = useSearchParams();
  const initialEvtId = searchParams.get('eventId') || '';
  const { showToast } = useToast();

  const [events, setEvents] = useState<EventDetail[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>(initialEvtId);
  const [days, setDays] = useState<SessionDay[]>([]);
  const [selectedDayId, setSelectedDayId] = useState<string>('');

  const [summary, setSummary] = useState<AccessSummary | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);

  // Validation state
  const [manualCode, setManualCode] = useState('');
  const [validating, setValidating] = useState(false);
  const [lastValidation, setLastValidation] = useState<ValidateTicketResponse | null>(null);

  // Camera state
  const [cameraActive, setCameraActive] = useState(false);
  const scannerRef = useRef<HTMLDivElement>(null);
  const html5QrCodeRef = useRef<any>(null);

  useEffect(() => {
    loadEventsList();
  }, []);

  useEffect(() => {
    if (selectedEventId) {
      const evt = events.find((e) => e.id === selectedEventId);
      if (evt && evt.days?.length > 0) {
        setDays(evt.days);
        const dayId = evt.days[0].id;
        setSelectedDayId(dayId);
        loadSummaryData(selectedEventId, dayId);
      }
    }
  }, [selectedEventId, events]);

  const loadEventsList = async () => {
    try {
      const res = await eventService.search({ limit: 50 });
      setEvents(res.items);
      if (!selectedEventId && res.items.length > 0) {
        setSelectedEventId(res.items[0].id);
      }
    } catch (e) {
      console.error('Failed to load events:', e);
    }
  };

  const loadSummaryData = async (evtId: string, dayId: string) => {
    setLoadingSummary(true);
    try {
      const sum = await accessService.getSummary(evtId, dayId);
      setSummary(sum);
    } catch (e) {
      console.error('Failed to load access summary:', e);
    } finally {
      setLoadingSummary(false);
    }
  };

  const handleValidateCode = async (codeToValidate: string) => {
    if (!selectedEventId || !selectedDayId || !codeToValidate.trim() || validating) return;
    setValidating(true);
    try {
      const res = await accessService.validateTicket({
        eventId: selectedEventId,
        dayId: selectedDayId,
        code: codeToValidate.trim(),
      });
      setLastValidation(res);

      if (res.result === 'VALID') {
        showToast('success', '¡Acceso VÁLIDO!', `Ticket ${res.ticket?.code} verificado.`);
      } else if (res.result === 'ALREADY_USED') {
        showToast('warning', '¡Ticket YA USADO!', `Entrada escaneada previamente.`);
      } else {
        showToast('error', '¡Acceso INVÁLIDO!', `Motivo: ${res.reason}`);
      }

      setManualCode('');
      await loadSummaryData(selectedEventId, selectedDayId);
    } catch (e) {
      showToast('error', 'Error de conexión', 'No se pudo procesar la lectura del código.');
    } finally {
      setValidating(false);
    }
  };

  const toggleCamera = async () => {
    if (cameraActive) {
      if (html5QrCodeRef.current) {
        try {
          await html5QrCodeRef.current.stop();
        } catch (e) {
          console.error(e);
        }
      }
      setCameraActive(false);
    } else {
      setCameraActive(true);
      setTimeout(async () => {
        try {
          const { Html5Qrcode } = await import('html5-qrcode');
          const html5QrCode = new Html5Qrcode('reader');
          html5QrCodeRef.current = html5QrCode;
          await html5QrCode.start(
            { facingMode: 'environment' },
            { fps: 10, qrbox: { width: 250, height: 250 } },
            (decodedText) => {
              handleValidateCode(decodedText);
            },
            () => {}
          );
        } catch (err) {
          console.error('Camera access denied or error:', err);
          showToast('error', 'Cámara no disponible', 'Verifica los permisos de cámara en tu navegador.');
          setCameraActive(false);
        }
      }, 300);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Escáner & Control de Acceso Web</h1>
        <p className="text-xs text-slate-500 mt-1">Validación de pases digitales mediante QR o código manual de entrada.</p>
      </div>

      {/* Event & Day Selector Header */}
      <Card className="p-4 bg-white border border-slate-200">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Evento Obligatorio"
            options={events.map((e) => ({ value: e.id, label: e.name }))}
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
          />
          <Select
            label="Función / Fecha Obligatoria"
            options={days.map((d) => ({ value: d.id, label: `${d.description || 'Función'} (${d.date} ${d.startTime})` }))}
            value={selectedDayId}
            onChange={(e) => {
              setSelectedDayId(e.target.value);
              if (selectedEventId) loadSummaryData(selectedEventId, e.target.value);
            }}
          />
        </div>
      </Card>

      {/* KPI Access Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-slate-700">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Total Entradas</span>
          <p className="text-xl font-black text-slate-900 mt-1">{summary?.total || 0}</p>
        </Card>

        <Card className="border-l-4 border-l-emerald-500">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Entradas Validadas</span>
          <p className="text-xl font-black text-emerald-600 mt-1">{summary?.used || 0}</p>
        </Card>

        <Card className="border-l-4 border-l-sky-500">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Pendientes por Ingresar</span>
          <p className="text-xl font-black text-sky-600 mt-1">{summary?.active || 0}</p>
        </Card>

        <Card className="border-l-4 border-l-brand-600">
          <span className="text-[10px] font-bold text-slate-400 uppercase">% Validado</span>
          <p className="text-xl font-black text-brand-600 mt-1">{formatPercentage(summary?.percentageUsed || 0)}</p>
        </Card>
      </div>

      {/* Main Validation Scanner Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: Scanner Controls */}
        <Card header={<h3 className="text-sm font-bold text-slate-900">Validar Entrada</h3>}>
          <div className="space-y-4">
            {/* Camera Box */}
            <div className="bg-slate-900 rounded-xl overflow-hidden min-h-[220px] flex flex-col items-center justify-center p-4 text-white relative">
              {cameraActive ? (
                <div id="reader" ref={scannerRef} className="w-full h-full" />
              ) : (
                <div className="text-center space-y-3">
                  <QrCode className="w-16 h-16 text-slate-600 mx-auto" />
                  <p className="text-xs text-slate-400">Escáner de cámara desactivado</p>
                  <Button variant="primary" size="sm" leftIcon={<Camera className="w-4 h-4" />} onClick={toggleCamera}>
                    Activar Cámara Web / PWA
                  </Button>
                </div>
              )}
            </div>

            {/* Manual Code Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleValidateCode(manualCode);
              }}
              className="space-y-3"
            >
              <Input
                label="Ingreso Manual de Código de Ticket"
                placeholder="Ej. TCK-8J4A2 o TCK-USED1"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                leftIcon={<Search className="w-4 h-4" />}
              />
              <Button type="submit" variant="primary" className="w-full" isLoading={validating}>
                Validar Código Manual
              </Button>
            </form>
          </div>
        </Card>

        {/* Right: Validation Result Feedback Box */}
        <Card header={<h3 className="text-sm font-bold text-slate-900">Resultado de la Última Lectura</h3>}>
          {lastValidation ? (
            <div className="space-y-4 animate-in fade-in duration-200">
              {lastValidation.result === 'VALID' && (
                <div className="p-5 bg-emerald-50 border-2 border-emerald-500 rounded-2xl text-emerald-900 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-700 font-extrabold text-base">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                    <span>¡ACCESO AUTORIZADO!</span>
                  </div>
                  <div className="text-xs space-y-1 pt-1 border-t border-emerald-200">
                    <p>Código: <strong className="font-mono text-sm">{lastValidation.ticket?.code}</strong></p>
                    <p>Titular: <strong>{lastValidation.ticket?.customer?.name}</strong></p>
                    <p>Zona: <strong>{lastValidation.ticket?.zone?.name} {lastValidation.ticket?.seat ? `(${lastValidation.ticket.seat.code})` : ''}</strong></p>
                    <p className="text-[11px] text-emerald-700">Validado a las: {formatDateTime(lastValidation.ticket?.usedAt)}</p>
                  </div>
                </div>
              )}

              {lastValidation.result === 'ALREADY_USED' && (
                <div className="p-5 bg-amber-50 border-2 border-amber-500 rounded-2xl text-amber-900 space-y-2">
                  <div className="flex items-center gap-2 text-amber-800 font-extrabold text-base">
                    <AlertTriangle className="w-6 h-6 text-amber-600" />
                    <span>¡TICKET YA UTILIZADO!</span>
                  </div>
                  <div className="text-xs space-y-1 pt-1 border-t border-amber-200">
                    <p>Código: <strong className="font-mono text-sm">{lastValidation.ticket?.code}</strong></p>
                    <p className="text-amber-800 font-medium">Esta entrada ya ingresó previamente a las {formatDateTime(lastValidation.ticket?.usedAt)}.</p>
                  </div>
                </div>
              )}

              {lastValidation.result === 'INVALID' && (
                <div className="p-5 bg-rose-50 border-2 border-rose-500 rounded-2xl text-rose-900 space-y-2">
                  <div className="flex items-center gap-2 text-rose-800 font-extrabold text-base">
                    <XCircle className="w-6 h-6 text-rose-600" />
                    <span>¡ACCESO DENEGADO!</span>
                  </div>
                  <div className="text-xs space-y-1 pt-1 border-t border-rose-200">
                    <p>Motivo: <strong className="uppercase font-bold">{lastValidation.reason}</strong></p>
                    <p className="text-rose-700">El código no existe o no corresponde a esta función o compañía.</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400 text-xs">
              Escanea un QR con la cámara o ingresa un código de ticket para verificar la entrada.
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

export default function AccessControlPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Cargando módulo de control de acceso...</div>}>
      <AccessControlContent />
    </Suspense>
  );
}
