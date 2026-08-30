'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ArrowLeft,
  Undo2,
  Redo2,
  Save,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Eye,
  Edit3,
  Flame,
  MousePointer,
  Hand,
  Square,
  Pentagon,
  Type,
  LogIn,
  LogOut as LogOutIcon,
  Circle,
  Minus,
  Lock,
  Unlock,
  Trash2,
  Copy,
  Layers,
  Building2,
  AlertTriangle,
  CheckCircle2,
  MonitorOff,
} from 'lucide-react';
import { EventLayout, EventCanvasObject, ZoneWithCanvas, CanvasPoint } from '@/types/canvas';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, formatPercentage } from '@/lib/formatting';

export interface CanvasEditorProps {
  eventId: string;
  eventName: string;
  initialLayout?: EventLayout | null;
  onSave: (layout: EventLayout) => Promise<void>;
  onBack: () => void;
}

export type ViewMode = 'edit' | 'preview' | 'heatmap';
export type ToolType = 'select' | 'pan' | 'stage' | 'rect_zone' | 'poly_zone' | 'text' | 'entrance' | 'exit' | 'line';

const MAX_HISTORY = 30;

export const CanvasEditor: React.FC<CanvasEditorProps> = ({
  eventId,
  eventName,
  initialLayout,
  onSave,
  onBack,
}) => {
  // Mobile check
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Main Layout Model State
  const [layout, setLayout] = useState<EventLayout>(
    initialLayout || {
      eventId,
      version: 1,
      updatedAt: new Date().toISOString(),
      eventCanvas: {
        width: 1400,
        height: 900,
        background: { type: 'color', color: '#F8FAFC', opacity: 1 },
        grid: { enabled: true, size: 20, snap: true, visible: true },
        viewport: { zoom: 1, x: 0, y: 0 },
        objects: [
          {
            id: 'stage-main',
            type: 'stage',
            name: 'Escenario Principal',
            x: 400,
            y: 40,
            width: 600,
            height: 100,
            rotation: 0,
            locked: false,
            visible: true,
            zIndex: 10,
            style: { fill: '#1E293B', stroke: '#0F172A', strokeWidth: 2, opacity: 1 },
            label: { text: 'ESCENARIO PRINCIPAL', fontSize: 22, fontWeight: 700, color: '#FFFFFF', align: 'center' },
          },
          {
            id: 'entrance-1',
            type: 'entrance',
            name: 'Ingreso Puerta Norte',
            x: 80,
            y: 60,
            width: 150,
            height: 40,
            rotation: 0,
            locked: false,
            visible: true,
            zIndex: 15,
            style: { fill: '#16A34A', stroke: '#15803D', strokeWidth: 2, opacity: 0.9 },
            label: { text: 'PUERTA NORTE', fontSize: 12, fontWeight: 700, color: '#FFFFFF', align: 'center' },
          },
          {
            id: 'exit-1',
            type: 'exit',
            name: 'Salida Sur',
            x: 1170,
            y: 780,
            width: 150,
            height: 40,
            rotation: 0,
            locked: false,
            visible: true,
            zIndex: 15,
            style: { fill: '#DC2626', stroke: '#B91C1C', strokeWidth: 2, opacity: 0.9 },
            label: { text: 'SALIDA DE EMERGENCIA', fontSize: 12, fontWeight: 700, color: '#FFFFFF', align: 'center' },
          },
        ],
      },
      zones: [
        {
          id: 'zn-vip-1',
          name: 'Platinum VIP',
          price: 180,
          quantity: { total: 500, sold: 320, reserved: 20 },
          canvas: {
            visible: true,
            locked: false,
            zIndex: 20,
            geometries: [
              {
                id: 'geo-vip-poly',
                type: 'polygon',
                points: [
                  { x: 250, y: 180 },
                  { x: 1150, y: 180 },
                  { x: 1080, y: 420 },
                  { x: 320, y: 420 },
                ],
                rotation: 0,
              },
            ],
            style: { fill: '#4F46E5', stroke: '#3730A3', strokeWidth: 2, opacity: 0.85 },
            label: { text: 'Platinum VIP', visible: true, fontSize: 20, fontWeight: 700, color: '#FFFFFF', showPrice: true },
          },
        },
        {
          id: 'zn-gen-1',
          name: 'General Campo',
          price: 90,
          quantity: { total: 4000, sold: 2626, reserved: 104 },
          canvas: {
            visible: true,
            locked: false,
            zIndex: 21,
            geometries: [
              {
                id: 'geo-gen-rect',
                type: 'rect',
                x: 150,
                y: 460,
                width: 1100,
                height: 280,
                rotation: 0,
              },
            ],
            style: { fill: '#0284C7', stroke: '#0369A1', strokeWidth: 2, opacity: 0.8 },
            label: { text: 'General Campo', visible: true, fontSize: 22, fontWeight: 700, color: '#FFFFFF', showPrice: true },
          },
        },
      ],
    }
  );

  // View & Tool States
  const [viewMode, setViewMode] = useState<ViewMode>('edit');
  const [activeTool, setActiveTool] = useState<ToolType>('select');
  const [zoom, setZoom] = useState(1);
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [activeTabRight, setActiveTabRight] = useState<'properties' | 'layers' | 'zones' | 'validation'>('properties');

  // Polygon Drawing state
  const [polyPoints, setPolyPoints] = useState<CanvasPoint[]>([]);
  const [drawingPolyZoneId, setDrawingPolyZoneId] = useState<string | null>(null);

  // Undo / Redo History Stack
  const [history, setHistory] = useState<EventLayout[]>([layout]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [isDirty, setIsDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  // Mouse Dragging State
  const [dragging, setDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Push History State
  const pushState = useCallback((newLayout: EventLayout) => {
    setLayout(newLayout);
    setIsDirty(true);
    setHistory((prev) => {
      const sliced = prev.slice(0, historyIndex + 1);
      if (sliced.length >= MAX_HISTORY) sliced.shift();
      return [...sliced, newLayout];
    });
    setHistoryIndex((prev) => Math.min(MAX_HISTORY - 1, prev + 1));
  }, [historyIndex]);

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevIdx = historyIndex - 1;
      setHistoryIndex(prevIdx);
      setLayout(history[prevIdx]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextIdx = historyIndex + 1;
      setHistoryIndex(nextIdx);
      setLayout(history[nextIdx]);
    }
  };

  // Keyboard Shortcuts Handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing inside an input/textarea
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) handleRedo();
        else handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSave();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedObjectId) deleteSelectedObject();
      } else if (e.key === 'Escape') {
        setPolyPoints([]);
        setSelectedObjectId(null);
        setActiveTool('select');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [historyIndex, history, selectedObjectId, layout]);

  // Object Dragging Handlers
  const handleMouseDownObject = (e: React.MouseEvent, objId: string, isZone: boolean = false) => {
    if (viewMode !== 'edit' || activeTool === 'pan') return;
    e.stopPropagation();

    if (isZone) {
      setSelectedZoneId(objId);
      setSelectedObjectId(null);
    } else {
      setSelectedObjectId(objId);
      setSelectedZoneId(null);
    }

    setDragging(true);
    const obj = layout.eventCanvas.objects.find((o) => o.id === objId);
    if (obj) {
      setDragOffset({ x: e.clientX - obj.x, y: e.clientY - obj.y });
    }
  };

  const handleMouseMoveWorkspace = (e: React.MouseEvent) => {
    if (!dragging || !selectedObjectId) return;
    const newX = Math.round((e.clientX - dragOffset.x) / 10) * 10;
    const newY = Math.round((e.clientY - dragOffset.y) / 10) * 10;

    const updatedObjects = layout.eventCanvas.objects.map((obj) =>
      obj.id === selectedObjectId ? { ...obj, x: Math.max(0, newX), y: Math.max(0, newY) } : obj
    );

    setLayout({
      ...layout,
      eventCanvas: { ...layout.eventCanvas, objects: updatedObjects },
    });
  };

  const handleMouseUpWorkspace = () => {
    if (dragging) {
      setDragging(false);
      pushState(layout);
    }
  };

  // Polygon Drawing Click
  const handleWorkspaceClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (activeTool === 'poly_zone') {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = Math.round((e.clientX - rect.left) / 10) * 10;
      const y = Math.round((e.clientY - rect.top) / 10) * 10;
      setPolyPoints((prev) => [...prev, { x, y }]);
    }
  };

  const handleFinishPolygon = () => {
    if (polyPoints.length < 3) return;
    const zoneId = drawingPolyZoneId || layout.zones[0]?.id || 'zn-vip-1';
    const newGeoId = `geo-poly-${Date.now()}`;

    const updatedZones = layout.zones.map((zn) => {
      if (zn.id === zoneId) {
        return {
          ...zn,
          canvas: {
            ...zn.canvas,
            geometries: [
              ...zn.canvas.geometries,
              { id: newGeoId, type: 'polygon' as const, points: polyPoints, rotation: 0 },
            ],
          },
        };
      }
      return zn;
    });

    pushState({ ...layout, zones: updatedZones });
    setPolyPoints([]);
    setActiveTool('select');
  };

  // Object Creation Helpers
  const addStage = () => {
    const newObj: EventCanvasObject = {
      id: `stage-${Date.now()}`,
      type: 'stage',
      name: 'Escenario Secundario',
      x: 350,
      y: 100,
      width: 500,
      height: 90,
      rotation: 0,
      locked: false,
      visible: true,
      zIndex: 10,
      style: { fill: '#0F172A', stroke: '#000000', strokeWidth: 2, opacity: 1 },
      label: { text: 'ESCENARIO', fontSize: 18, color: '#FFFFFF', align: 'center' },
    };
    pushState({
      ...layout,
      eventCanvas: { ...layout.eventCanvas, objects: [...layout.eventCanvas.objects, newObj] },
    });
    setSelectedObjectId(newObj.id);
  };

  const addEntrance = () => {
    const newObj: EventCanvasObject = {
      id: `entrance-${Date.now()}`,
      type: 'entrance',
      name: 'Ingreso Puerta',
      x: 100,
      y: 100,
      width: 140,
      height: 40,
      rotation: 0,
      locked: false,
      visible: true,
      zIndex: 15,
      style: { fill: '#16A34A', stroke: '#15803D', strokeWidth: 2, opacity: 0.9 },
      label: { text: 'INGRESO', fontSize: 12, color: '#FFFFFF', align: 'center' },
    };
    pushState({
      ...layout,
      eventCanvas: { ...layout.eventCanvas, objects: [...layout.eventCanvas.objects, newObj] },
    });
  };

  const deleteSelectedObject = () => {
    if (selectedObjectId) {
      pushState({
        ...layout,
        eventCanvas: {
          ...layout.eventCanvas,
          objects: layout.eventCanvas.objects.filter((o) => o.id !== selectedObjectId),
        },
      });
      setSelectedObjectId(null);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(layout);
      setIsDirty(false);
    } finally {
      setSaving(false);
    }
  };

  // Compute Heatmap Color for Zone
  const getHeatmapColor = (sold: number, total: number) => {
    const pct = (sold / (total || 1)) * 100;
    if (pct >= 80) return '#DC2626'; // Red high demand
    if (pct >= 50) return '#D97706'; // Amber medium
    return '#16A34A'; // Green low/available
  };

  // Selected Items Reference
  const selectedObject = layout.eventCanvas.objects.find((o) => o.id === selectedObjectId);
  const selectedZone = layout.zones.find((z) => z.id === selectedZoneId);

  // Validation Warnings
  const warnings: string[] = [];
  layout.zones.forEach((z) => {
    if (!z.canvas?.geometries || z.canvas.geometries.length === 0) {
      warnings.push(`La zona comercial "${z.name}" no tiene representación visual en el mapa.`);
    }
  });

  if (isMobile) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border space-y-4">
        <MonitorOff className="w-12 h-12 text-amber-500 mx-auto" />
        <h3 className="text-lg font-extrabold text-slate-900">Diseñador para Computadora</h3>
        <p className="text-xs text-slate-500">
          Para maquetar zonas y escenarios utiliza un dispositivo con pantalla de escritorio o tablet.
        </p>
        <Button variant="primary" onClick={onBack}>Volver al evento</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-slate-900 text-slate-100 select-none overflow-hidden">
      {/* 1. Topbar */}
      <header className="h-14 px-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver</span>
          </button>
          <div>
            <h2 className="text-sm font-extrabold text-white leading-tight">{eventName}</h2>
            <span className="text-[10px] text-indigo-400 font-semibold uppercase tracking-wider">
              {isDirty ? '● Cambios sin guardar' : '✓ Layout sincronizado'}
            </span>
          </div>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-1 p-1 bg-slate-900 rounded-xl border border-slate-800">
          <button
            onClick={() => setViewMode('edit')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
              viewMode === 'edit' ? 'bg-brand-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" /> Editar
          </button>

          <button
            onClick={() => setViewMode('preview')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
              viewMode === 'preview' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Eye className="w-3.5 h-3.5" /> Vista Previa Comprador
          </button>

          <button
            onClick={() => setViewMode('heatmap')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
              viewMode === 'heatmap' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Flame className="w-3.5 h-3.5" /> Mapa de Ocupación (Heatmap)
          </button>
        </div>

        {/* Actions & Save */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleUndo}
            disabled={historyIndex <= 0}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40"
            title="Deshacer (Ctrl+Z)"
          >
            <Undo2 className="w-4 h-4" />
          </button>

          <button
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40"
            title="Rehacer (Ctrl+Shift+Z)"
          >
            <Redo2 className="w-4 h-4" />
          </button>

          <Button variant="primary" size="sm" leftIcon={<Save className="w-4 h-4" />} isLoading={saving} onClick={handleSave}>
            Guardar Maquetación
          </Button>
        </div>
      </header>

      {/* 2. Main Workspace Layout */}
      <div className="grow flex overflow-hidden">
        {/* Left Toolbar */}
        {viewMode === 'edit' && (
          <aside className="w-16 bg-slate-950 border-r border-slate-800 flex flex-col items-center py-4 space-y-2 shrink-0">
            <button
              onClick={() => setActiveTool('select')}
              className={`p-3 rounded-xl transition-colors ${
                activeTool === 'select' ? 'bg-brand-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
              title="Selección y Puntero"
            >
              <MousePointer className="w-5 h-5" />
            </button>

            <button
              onClick={addStage}
              className="p-3 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
              title="Agregar Escenario"
            >
              <Square className="w-5 h-5" />
            </button>

            <button
              onClick={() => setActiveTool('poly_zone')}
              className={`p-3 rounded-xl transition-colors ${
                activeTool === 'poly_zone' ? 'bg-brand-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
              title="Dibujar Zona Poligonal (Clics por vértices)"
            >
              <Pentagon className="w-5 h-5" />
            </button>

            <button
              onClick={addEntrance}
              className="p-3 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
              title="Agregar Puerta de Ingreso"
            >
              <LogIn className="w-5 h-5 text-emerald-400" />
            </button>
          </aside>
        )}

        {/* Central SVG Viewport */}
        <main
          className="grow bg-slate-900 flex items-center justify-center relative overflow-auto p-8"
          onMouseMove={handleMouseMoveWorkspace}
          onMouseUp={handleMouseUpWorkspace}
        >
          {/* Polygon Drawing Helper Bar */}
          {activeTool === 'poly_zone' && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-elevated flex items-center gap-3 z-30">
              <span>Haz clic en el canvas para colocar vértices ({polyPoints.length} puntos)</span>
              {polyPoints.length >= 3 && (
                <Button variant="success" size="sm" onClick={handleFinishPolygon}>
                  Cerrar Polígono
                </Button>
              )}
            </div>
          )}

          <div
            className="bg-white rounded-2xl shadow-2xl relative overflow-hidden transition-all"
            style={{ width: layout.eventCanvas.width * zoom, height: layout.eventCanvas.height * zoom }}
          >
            <svg
              width={layout.eventCanvas.width * zoom}
              height={layout.eventCanvas.height * zoom}
              onClick={handleWorkspaceClick}
              className="w-full h-full"
            >
              <defs>
                <pattern id="grid-pattern" width={20 * zoom} height={20 * zoom} patternUnits="userSpaceOnUse">
                  <path d={`M ${20 * zoom} 0 L 0 0 0 ${20 * zoom}`} fill="none" stroke="#F1F5F9" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid-pattern)" />

              {/* 1. General Event Objects (Stage, Entrances, Text) */}
              {layout.eventCanvas.objects.map((obj) => {
                const isSelected = obj.id === selectedObjectId;
                return (
                  <g
                    key={obj.id}
                    onMouseDown={(e) => handleMouseDownObject(e, obj.id, false)}
                    className="cursor-move"
                  >
                    <rect
                      x={obj.x * zoom}
                      y={obj.y * zoom}
                      width={obj.width * zoom}
                      height={obj.height * zoom}
                      rx={8}
                      fill={obj.style.fill}
                      stroke={isSelected ? '#4F46E5' : obj.style.stroke}
                      strokeWidth={isSelected ? 4 : obj.style.strokeWidth}
                      opacity={obj.style.opacity}
                    />
                    {obj.label && (
                      <text
                        x={(obj.x + obj.width / 2) * zoom}
                        y={(obj.y + obj.height / 2 + 5) * zoom}
                        textAnchor="middle"
                        fill={obj.label.color || '#FFFFFF'}
                        fontSize={(obj.label.fontSize || 14) * zoom}
                        fontWeight={obj.label.fontWeight || 700}
                        className="pointer-events-none"
                      >
                        {obj.label.text}
                      </text>
                    )}
                  </g>
                );
              })}

              {/* 2. Zone Geometries */}
              {layout.zones.map((zn) => {
                const isSelected = zn.id === selectedZoneId;
                const total = zn.quantity.total;
                const sold = zn.quantity.sold;

                const fillColor = viewMode === 'heatmap' ? getHeatmapColor(sold, total) : zn.canvas.style.fill;

                return (
                  <g key={zn.id} onClick={(e) => { e.stopPropagation(); setSelectedZoneId(zn.id); }}>
                    {zn.canvas.geometries.map((geo) => {
                      if (geo.type === 'polygon' && geo.points) {
                        const pointsStr = geo.points.map((p) => `${p.x * zoom},${p.y * zoom}`).join(' ');
                        const center = geo.points.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 });
                        center.x /= geo.points.length;
                        center.y /= geo.points.length;

                        return (
                          <g key={geo.id}>
                            <polygon
                              points={pointsStr}
                              fill={fillColor}
                              stroke={isSelected ? '#4F46E5' : zn.canvas.style.stroke}
                              strokeWidth={isSelected ? 4 : zn.canvas.style.strokeWidth}
                              opacity={zn.canvas.style.opacity}
                              className="cursor-pointer hover:opacity-90 transition-all"
                            />
                            <text
                              x={center.x * zoom}
                              y={center.y * zoom}
                              textAnchor="middle"
                              fill="#FFFFFF"
                              fontSize={16 * zoom}
                              fontWeight="bold"
                              className="pointer-events-none drop-shadow-md"
                            >
                              {zn.name} {viewMode === 'preview' ? `- ${formatCurrency(zn.price)}` : ''}
                            </text>
                          </g>
                        );
                      }

                      return (
                        <g key={geo.id}>
                          <rect
                            x={(geo.x || 100) * zoom}
                            y={(geo.y || 100) * zoom}
                            width={(geo.width || 300) * zoom}
                            height={(geo.height || 150) * zoom}
                            rx={10}
                            fill={fillColor}
                            stroke={isSelected ? '#4F46E5' : zn.canvas.style.stroke}
                            strokeWidth={isSelected ? 4 : zn.canvas.style.strokeWidth}
                            opacity={zn.canvas.style.opacity}
                            className="cursor-pointer hover:opacity-90 transition-all"
                          />
                          <text
                            x={((geo.x || 100) + (geo.width || 300) / 2) * zoom}
                            y={((geo.y || 100) + (geo.height || 150) / 2 + 6) * zoom}
                            textAnchor="middle"
                            fill="#FFFFFF"
                            fontSize={18 * zoom}
                            fontWeight="bold"
                            className="pointer-events-none drop-shadow-md"
                          >
                            {zn.name} {viewMode === 'preview' ? `- ${formatCurrency(zn.price)}` : ''}
                          </text>
                        </g>
                      );
                    })}
                  </g>
                );
              })}

              {/* Active Polygon Drawing Line */}
              {polyPoints.length > 0 && (
                <polyline
                  points={polyPoints.map((p) => `${p.x * zoom},${p.y * zoom}`).join(' ')}
                  fill="none"
                  stroke="#4F46E5"
                  strokeWidth="3"
                  strokeDasharray="4"
                />
              )}
            </svg>
          </div>
        </main>

        {/* Right Inspector Sidebar */}
        <aside className="w-80 bg-slate-950 border-l border-slate-800 flex flex-col shrink-0">
          {/* Right Tabs */}
          <div className="flex border-b border-slate-800">
            <button
              onClick={() => setActiveTabRight('properties')}
              className={`grow py-3 text-xs font-bold text-center border-b-2 transition-colors ${
                activeTabRight === 'properties' ? 'border-brand-500 text-white' : 'border-transparent text-slate-500'
              }`}
            >
              Propiedades
            </button>
            <button
              onClick={() => setActiveTabRight('layers')}
              className={`grow py-3 text-xs font-bold text-center border-b-2 transition-colors ${
                activeTabRight === 'layers' ? 'border-brand-500 text-white' : 'border-transparent text-slate-500'
              }`}
            >
              Capas ({layout.eventCanvas.objects.length + layout.zones.length})
            </button>
            <button
              onClick={() => setActiveTabRight('zones')}
              className={`grow py-3 text-xs font-bold text-center border-b-2 transition-colors ${
                activeTabRight === 'zones' ? 'border-brand-500 text-white' : 'border-transparent text-slate-500'
              }`}
            >
              Zonas ({layout.zones.length})
            </button>
          </div>

          <div className="p-4 grow overflow-y-auto space-y-4 text-xs">
            {/* Inspector tab 1: Properties */}
            {activeTabRight === 'properties' && (
              <>
                {selectedObject ? (
                  <div className="space-y-4">
                    <h4 className="font-extrabold text-slate-200 uppercase tracking-wider text-[11px] border-b border-slate-800 pb-2">
                      Objeto General: {selectedObject.name}
                    </h4>

                    <Input
                      label="Nombre del Elemento"
                      value={selectedObject.name}
                      onChange={(e) => {
                        const updated = layout.eventCanvas.objects.map((o) =>
                          o.id === selectedObject.id ? { ...o, name: e.target.value } : o
                        );
                        setLayout({ ...layout, eventCanvas: { ...layout.eventCanvas, objects: updated } });
                      }}
                    />

                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        label="Ancho (px)"
                        type="number"
                        value={selectedObject.width}
                        onChange={(e) => {
                          const updated = layout.eventCanvas.objects.map((o) =>
                            o.id === selectedObject.id ? { ...o, width: Number(e.target.value) } : o
                          );
                          setLayout({ ...layout, eventCanvas: { ...layout.eventCanvas, objects: updated } });
                        }}
                      />
                      <Input
                        label="Alto (px)"
                        type="number"
                        value={selectedObject.height}
                        onChange={(e) => {
                          const updated = layout.eventCanvas.objects.map((o) =>
                            o.id === selectedObject.id ? { ...o, height: Number(e.target.value) } : o
                          );
                          setLayout({ ...layout, eventCanvas: { ...layout.eventCanvas, objects: updated } });
                        }}
                      />
                    </div>

                    <Button variant="danger" size="sm" className="w-full" leftIcon={<Trash2 className="w-4 h-4" />} onClick={deleteSelectedObject}>
                      Eliminar Elemento
                    </Button>
                  </div>
                ) : selectedZone ? (
                  <div className="space-y-4">
                    <h4 className="font-extrabold text-indigo-400 uppercase tracking-wider text-[11px] border-b border-slate-800 pb-2">
                      Zona Comercial: {selectedZone.name}
                    </h4>

                    <div className="p-3 bg-slate-900 rounded-xl space-y-1.5 border border-slate-800">
                      <p className="text-slate-400">Precio Comercial: <strong className="text-white">{formatCurrency(selectedZone.price)}</strong></p>
                      <p className="text-slate-400">Capacidad Total: <strong className="text-white">{selectedZone.quantity.total} entradas</strong></p>
                      <p className="text-slate-400">Vendidas: <strong className="text-emerald-400">{selectedZone.quantity.sold} entradas</strong></p>
                      <p className="text-slate-400">Ocupación: <strong className="text-amber-400">{formatPercentage((selectedZone.quantity.sold / selectedZone.quantity.total) * 100)}</strong></p>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-slate-400 font-semibold">Color de la Zona</label>
                      <input
                        type="color"
                        value={selectedZone.canvas.style.fill}
                        onChange={(e) => {
                          const val = e.target.value;
                          const updated = layout.zones.map((z) =>
                            z.id === selectedZone.id ? { ...z, canvas: { ...z.canvas, style: { ...z.canvas.style, fill: val } } } : z
                          );
                          pushState({ ...layout, zones: updated });
                        }}
                        className="w-full h-9 rounded-lg border border-slate-800 cursor-pointer"
                      />
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-500 text-center py-8">
                    Haz clic sobre un objeto o zona del escenario para editar sus propiedades espaciales.
                  </p>
                )}
              </>
            )}

            {/* Inspector tab 2: Layers */}
            {activeTabRight === 'layers' && (
              <div className="space-y-2">
                <h4 className="font-bold text-slate-400 uppercase text-[10px]">Capa General de Objetos</h4>
                {layout.eventCanvas.objects.map((obj) => (
                  <div
                    key={obj.id}
                    onClick={() => { setSelectedObjectId(obj.id); setSelectedZoneId(null); }}
                    className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                      obj.id === selectedObjectId ? 'bg-brand-600 text-white border-brand-500 font-bold' : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span>{obj.name}</span>
                    <Square className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                ))}
              </div>
            )}

            {/* Inspector tab 3: Zones */}
            {activeTabRight === 'zones' && (
              <div className="space-y-3">
                {layout.zones.map((zn) => (
                  <div key={zn.id} className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">{zn.name}</span>
                      <span className="font-bold text-emerald-400">{formatCurrency(zn.price)}</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Geometrías en canvas: {zn.canvas.geometries?.length || 0}
                    </p>
                  </div>
                ))}

                {warnings.length > 0 && (
                  <div className="p-3 bg-amber-950/60 border border-amber-800/80 rounded-xl text-amber-300 space-y-1 mt-4">
                    <div className="flex items-center gap-1.5 font-bold text-amber-200">
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                      <span>Alertas de Diseño</span>
                    </div>
                    {warnings.map((w, idx) => (
                      <p key={idx} className="text-[11px] leading-relaxed">{w}</p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};
