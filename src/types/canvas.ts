export interface CanvasLabel {
  text: string;
  fontSize?: number;
  fontWeight?: number | string;
  color?: string;
  align?: 'left' | 'center' | 'right';
  showPrice?: boolean;
  showAvailability?: boolean;
  visible?: boolean;
}

export interface CanvasStyle {
  fill: string;
  stroke: string;
  strokeWidth: number;
  opacity: number;
  strokeDasharray?: string;
}

export interface CanvasPoint {
  x: number;
  y: number;
}

export interface CanvasGeometry {
  id: string;
  type: 'polygon' | 'rect' | 'circle';
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  radius?: number;
  points?: CanvasPoint[];
  rotation?: number;
}

export interface EventCanvasObject {
  id: string;
  type: 'stage' | 'rect' | 'circle' | 'line' | 'text' | 'entrance' | 'exit' | 'image';
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  locked?: boolean;
  visible?: boolean;
  zIndex: number;
  style: CanvasStyle;
  label?: CanvasLabel;
  imageUrl?: string;
}

export interface ZoneCanvasSchema {
  visible: boolean;
  locked: boolean;
  zIndex: number;
  geometries: CanvasGeometry[];
  style: CanvasStyle;
  label: CanvasLabel;
}

export interface ZoneWithCanvas {
  id: string;
  name: string;
  price: number;
  quantity: {
    total: number;
    sold: number;
    reserved: number;
  };
  canvas: ZoneCanvasSchema;
}

export interface EventLayout {
  eventId: string;
  version: number;
  updatedAt: string;
  eventCanvas: {
    width: number;
    height: number;
    background: {
      type: 'color' | 'image';
      color: string;
      image?: string | null;
      opacity: number;
    };
    grid: {
      enabled: boolean;
      size: number;
      snap: boolean;
      visible: boolean;
    };
    viewport: {
      zoom: number;
      x: number;
      y: number;
    };
    objects: EventCanvasObject[];
  };
  zones: ZoneWithCanvas[];
}
