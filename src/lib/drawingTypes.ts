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
  startTime: number; // logical index
  startPrice: number;
  endTime: number;
  endPrice: number;
  color: string;
}

export interface RectangleDrawing {
  type: 'rectangle';
  id: string;
  startTime: number;
  startPrice: number;
  endTime: number;
  endPrice: number;
  fillColor: string;
  borderColor: string;
}

export interface TextDrawing {
  type: 'text';
  id: string;
  time: number;
  price: number;
  text: string;
  color: string;
  bgColor: string;
}

export type Drawing = HorizontalLineDrawing | TrendLineDrawing | RectangleDrawing | TextDrawing;
