export type DrawingTool = 'horizontal' | 'trendline' | 'rectangle' | 'text' | null;

export interface HorizontalLineDrawing {
  type: 'horizontal';
  id: string;
  price: number;
  color: string;
}

export interface TrendLineDrawing {
  type: 'trendline';
  id: string;
  startTime: any; // Logical branded type from lightweight-charts
  startPrice: number;
  endTime: any;
  endPrice: number;
  color: string;
}

export interface RectangleDrawing {
  type: 'rectangle';
  id: string;
  startTime: any;
  startPrice: number;
  endTime: any;
  endPrice: number;
  fillColor: string;
  borderColor: string;
}

export interface TextDrawing {
  type: 'text';
  id: string;
  time: any;
  price: number;
  text: string;
  color: string;
  bgColor: string;
}

export type Drawing = HorizontalLineDrawing | TrendLineDrawing | RectangleDrawing | TextDrawing;
