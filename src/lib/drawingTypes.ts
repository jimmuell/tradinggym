import type { Logical } from 'lightweight-charts';

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
  startTime: Logical;
  startPrice: number;
  endTime: Logical;
  endPrice: number;
  color: string;
}

export interface RectangleDrawing {
  type: 'rectangle';
  id: string;
  startTime: Logical;
  startPrice: number;
  endTime: Logical;
  endPrice: number;
  fillColor: string;
  borderColor: string;
}

export interface TextDrawing {
  type: 'text';
  id: string;
  time: Logical;
  price: number;
  text: string;
  color: string;
  bgColor: string;
}

export type Drawing = HorizontalLineDrawing | TrendLineDrawing | RectangleDrawing | TextDrawing;
