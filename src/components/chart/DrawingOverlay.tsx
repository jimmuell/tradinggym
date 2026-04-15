import { useEffect, useRef, useState, useCallback } from 'react';
import { IChartApi, ISeriesApi, Logical } from 'lightweight-charts';
import { Drawing, DrawingTool } from '@/lib/drawingTypes';

interface DrawingOverlayProps {
  activeTool: DrawingTool;
  chartApi: IChartApi | null;
  seriesApi: ISeriesApi<'Candlestick'> | null;
  isCoachMode?: boolean;
  onToolComplete?: () => void;
  onDrawingCountChange?: (count: number) => void;
}

const TICK_SIZE = 0.25;
const snap = (p: number) => Math.round(p / TICK_SIZE) * TICK_SIZE;

const DEFAULT_LINE_COLOR = 'rgba(255,255,255,0.6)';
const COACH_COLOR = 'rgba(251,146,60,0.8)';
const RECT_FILL = 'rgba(59,130,246,0.15)';
const RECT_BORDER = 'rgba(59,130,246,0.6)';
const COACH_RECT_FILL = 'rgba(251,146,60,0.15)';
const COACH_RECT_BORDER = 'rgba(251,146,60,0.6)';
const TEXT_BG = 'rgba(30,34,45,0.85)';
const COACH_TEXT_BG = 'rgba(100,60,20,0.85)';
const SELECTION_COLOR = 'rgba(96,165,250,0.8)'; // blue-400
const HOVER_COLOR = 'rgba(96,165,250,0.4)';
const PREVIEW_COLOR = 'rgba(255,255,255,0.25)';

export default function DrawingOverlay({ activeTool, chartApi, seriesApi, isCoachMode = false, onToolComplete, onDrawingCountChange }: DrawingOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawings, setDrawings] = useState<Drawing[]>([]);
  const drawingsRef = useRef<Drawing[]>([]);
  drawingsRef.current = drawings;

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedIdRef = useRef<string | null>(null);
  selectedIdRef.current = selectedId;

  const hoveredIdRef = useRef<string | null>(null);
  const mouseRef = useRef<{ x: number; y: number } | null>(null);

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; drawingId: string } | null>(null);

  const pendingRef = useRef<{
    tool: DrawingTool;
    startTime?: Logical;
    startPrice?: number;
    startX?: number;
    startY?: number;
  } | null>(null);

  const [textInput, setTextInput] = useState<{ x: number; y: number; time: number; price: number } | null>(null);
  const [textValue, setTextValue] = useState('');
  const textInputRef = useRef<HTMLInputElement>(null);

  const dragRef = useRef<{ drawingId: string; startX: number; startY: number; origDrawing: Drawing } | null>(null);
  const [cursorStyle, setCursorStyle] = useState<string>('default');

  const lineColor = isCoachMode ? COACH_COLOR : DEFAULT_LINE_COLOR;
  const rectFill = isCoachMode ? COACH_RECT_FILL : RECT_FILL;
  const rectBorder = isCoachMode ? COACH_RECT_BORDER : RECT_BORDER;
  const textBg = isCoachMode ? COACH_TEXT_BG : TEXT_BG;
  const textColor = isCoachMode ? COACH_COLOR : 'white';

  // Notify parent of drawing count changes
  useEffect(() => {
    onDrawingCountChange?.(drawings.length);
  }, [drawings.length, onDrawingCountChange]);

  // Expose clearAll method
  useEffect(() => {
    (window as any).__drawingOverlayClearAll = () => {
      setDrawings([]);
      setSelectedId(null);
    };
    return () => { delete (window as any).__drawingOverlayClearAll; };
  }, []);

  const priceToY = useCallback((price: number) => {
    if (!seriesApi) return null;
    return seriesApi.priceToCoordinate(price);
  }, [seriesApi]);

  const timeToX = useCallback((logicalIndex: Logical) => {
    if (!chartApi) return null;
    return chartApi.timeScale().logicalToCoordinate(logicalIndex);
  }, [chartApi]);

  const xToLogical = useCallback((x: number): Logical | null => {
    if (!chartApi) return null;
    return chartApi.timeScale().coordinateToLogical(x);
  }, [chartApi]);

  const yToPrice = useCallback((y: number) => {
    if (!seriesApi) return null;
    return seriesApi.coordinateToPrice(y);
  }, [seriesApi]);

  // Hit test
  const hitTest = useCallback((cx: number, cy: number): Drawing | null => {
    for (let i = drawingsRef.current.length - 1; i >= 0; i--) {
      const d = drawingsRef.current[i];
      if (d.type === 'horizontal') {
        const y = priceToY(d.price);
        if (y != null && Math.abs(cy - y) < 6) return d;
      } else if (d.type === 'trendline') {
        const x1 = timeToX(d.startTime);
        const y1 = priceToY(d.startPrice);
        const x2 = timeToX(d.endTime);
        const y2 = priceToY(d.endPrice);
        if (x1 == null || y1 == null || x2 == null || y2 == null) continue;
        const dx = x2 - x1, dy = y2 - y1;
        const len2 = dx * dx + dy * dy;
        let t = len2 === 0 ? 0 : ((cx - x1) * dx + (cy - y1) * dy) / len2;
        t = Math.max(0, Math.min(1, t));
        const px = x1 + t * dx, py = y1 + t * dy;
        if (Math.sqrt((cx - px) ** 2 + (cy - py) ** 2) < 6) return d;
      } else if (d.type === 'rectangle') {
        const x1 = timeToX(d.startTime);
        const y1 = priceToY(d.startPrice);
        const x2 = timeToX(d.endTime);
        const y2 = priceToY(d.endPrice);
        if (x1 == null || y1 == null || x2 == null || y2 == null) continue;
        const minX = Math.min(x1, x2), maxX = Math.max(x1, x2);
        const minY = Math.min(y1, y2), maxY = Math.max(y1, y2);
        if (cx >= minX && cx <= maxX && cy >= minY && cy <= maxY) return d;
      } else if (d.type === 'text') {
        const x = timeToX(d.time);
        const y = priceToY(d.price);
        if (x == null || y == null) continue;
        if (Math.abs(cx - x) < 40 && Math.abs(cy - y) < 12) return d;
      }
    }
    return null;
  }, [priceToY, timeToX]);

  // Render all drawings with selection/hover highlights and preview
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    const dpr = window.devicePixelRatio || 1;

    const sel = selectedIdRef.current;
    const hov = hoveredIdRef.current;

    for (const d of drawingsRef.current) {
      const isSelected = d.id === sel;
      const isHovered = d.id === hov && d.id !== sel;

      if (d.type === 'horizontal') {
        const y = priceToY(d.price);
        if (y == null) continue;
        const color = isSelected ? SELECTION_COLOR : isHovered ? HOVER_COLOR : d.color;
        ctx.strokeStyle = color;
        ctx.lineWidth = (isSelected ? 2 : 1) * dpr;
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(0, y * dpr);
        ctx.lineTo(w, y * dpr);
        ctx.stroke();
        ctx.fillStyle = color;
        ctx.font = `${11 * dpr}px sans-serif`;
        ctx.fillText(d.price.toFixed(2), 6 * dpr, (y - 4) * dpr);
        if (isSelected) {
          // Selection handles
          for (const hx of [40, w / dpr - 40]) {
            ctx.fillStyle = SELECTION_COLOR;
            ctx.beginPath();
            ctx.arc(hx * dpr, y * dpr, 4 * dpr, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      } else if (d.type === 'trendline') {
        const x1 = timeToX(d.startTime);
        const y1 = priceToY(d.startPrice);
        const x2 = timeToX(d.endTime);
        const y2 = priceToY(d.endPrice);
        if (x1 == null || y1 == null || x2 == null || y2 == null) continue;
        const color = isSelected ? SELECTION_COLOR : isHovered ? HOVER_COLOR : d.color;
        ctx.strokeStyle = color;
        ctx.lineWidth = (isSelected ? 2.5 : 1.5) * dpr;
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(x1 * dpr, y1 * dpr);
        ctx.lineTo(x2 * dpr, y2 * dpr);
        ctx.stroke();
        const angle = Math.atan2(y2 - y1, x2 - x1);
        const arrLen = 8 * dpr;
        ctx.beginPath();
        ctx.moveTo(x2 * dpr, y2 * dpr);
        ctx.lineTo(x2 * dpr - arrLen * Math.cos(angle - Math.PI / 6), y2 * dpr - arrLen * Math.sin(angle - Math.PI / 6));
        ctx.moveTo(x2 * dpr, y2 * dpr);
        ctx.lineTo(x2 * dpr - arrLen * Math.cos(angle + Math.PI / 6), y2 * dpr - arrLen * Math.sin(angle + Math.PI / 6));
        ctx.stroke();
        if (isSelected) {
          for (const [px, py] of [[x1, y1], [x2, y2]]) {
            ctx.fillStyle = SELECTION_COLOR;
            ctx.beginPath();
            ctx.arc(px * dpr, py * dpr, 4 * dpr, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      } else if (d.type === 'rectangle') {
        const x1 = timeToX(d.startTime);
        const y1 = priceToY(d.startPrice);
        const x2 = timeToX(d.endTime);
        const y2 = priceToY(d.endPrice);
        if (x1 == null || y1 == null || x2 == null || y2 == null) continue;
        const rx = Math.min(x1, x2) * dpr;
        const ry = Math.min(y1, y2) * dpr;
        const rw = Math.abs(x2 - x1) * dpr;
        const rh = Math.abs(y2 - y1) * dpr;
        ctx.fillStyle = isSelected ? 'rgba(96,165,250,0.15)' : isHovered ? 'rgba(96,165,250,0.1)' : d.fillColor;
        ctx.fillRect(rx, ry, rw, rh);
        ctx.strokeStyle = isSelected ? SELECTION_COLOR : isHovered ? HOVER_COLOR : d.borderColor;
        ctx.lineWidth = (isSelected ? 2 : 1) * dpr;
        ctx.setLineDash([]);
        ctx.strokeRect(rx, ry, rw, rh);
        if (isSelected) {
          for (const [px, py] of [[x1, y1], [x2, y2], [x1, y2], [x2, y1]]) {
            ctx.fillStyle = SELECTION_COLOR;
            ctx.beginPath();
            ctx.arc(px * dpr, py * dpr, 4 * dpr, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      } else if (d.type === 'text') {
        const x = timeToX(d.time);
        const y = priceToY(d.price);
        if (x == null || y == null) continue;
        ctx.font = `${12 * dpr}px sans-serif`;
        const metrics = ctx.measureText(d.text);
        const pad = 4 * dpr;
        const tw = metrics.width + pad * 2;
        const th = 16 * dpr + pad * 2;
        const bx = x * dpr - tw / 2;
        const by = y * dpr - th / 2;
        ctx.fillStyle = d.bgColor;
        const radius = 6 * dpr;
        ctx.beginPath();
        ctx.roundRect(bx, by, tw, th, radius);
        ctx.fill();
        if (isSelected || isHovered) {
          ctx.strokeStyle = isSelected ? SELECTION_COLOR : HOVER_COLOR;
          ctx.lineWidth = 1.5 * dpr;
          ctx.stroke();
        }
        ctx.fillStyle = d.color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(d.text, x * dpr, y * dpr);
        ctx.textAlign = 'start';
        ctx.textBaseline = 'alphabetic';
      }
    }

    // Preview for horizontal line tool
    if (activeTool === 'horizontal' && mouseRef.current) {
      const price = yToPrice(mouseRef.current.y);
      if (price != null) {
        const snapped = snap(price);
        const y = priceToY(snapped);
        if (y != null) {
          ctx.strokeStyle = PREVIEW_COLOR;
          ctx.lineWidth = 1 * dpr;
          ctx.setLineDash([6 * dpr, 4 * dpr]);
          ctx.beginPath();
          ctx.moveTo(0, y * dpr);
          ctx.lineTo(w, y * dpr);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.fillStyle = PREVIEW_COLOR;
          ctx.font = `${11 * dpr}px sans-serif`;
          ctx.fillText(snapped.toFixed(2), 6 * dpr, (y - 4) * dpr);
        }
      }
    }

    // Trendline preview (after first click)
    const pending = pendingRef.current;
    if (pending?.tool === 'trendline' && pending.startTime != null && mouseRef.current) {
      const x1 = timeToX(pending.startTime);
      const y1 = priceToY(pending.startPrice!);
      if (x1 != null && y1 != null) {
        ctx.strokeStyle = PREVIEW_COLOR;
        ctx.lineWidth = 1 * dpr;
        ctx.setLineDash([4 * dpr, 4 * dpr]);
        ctx.beginPath();
        ctx.moveTo(x1 * dpr, y1 * dpr);
        ctx.lineTo(mouseRef.current.x * dpr, mouseRef.current.y * dpr);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    // Rectangle preview (while dragging)
    if (pending?.tool === 'rectangle' && pending.startX != null && mouseRef.current) {
      const sx = pending.startX * dpr;
      const sy = pending.startY! * dpr;
      const ex = mouseRef.current.x * dpr;
      const ey = mouseRef.current.y * dpr;
      ctx.fillStyle = 'rgba(59,130,246,0.1)';
      ctx.fillRect(Math.min(sx, ex), Math.min(sy, ey), Math.abs(ex - sx), Math.abs(ey - sy));
      ctx.strokeStyle = PREVIEW_COLOR;
      ctx.lineWidth = 1 * dpr;
      ctx.setLineDash([4 * dpr, 4 * dpr]);
      ctx.strokeRect(Math.min(sx, ex), Math.min(sy, ey), Math.abs(ex - sx), Math.abs(ey - sy));
      ctx.setLineDash([]);
    }
  }, [priceToY, timeToX, yToPrice, activeTool]);

  // Resize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = parent.clientWidth * dpr;
      canvas.height = parent.clientHeight * dpr;
      canvas.style.width = parent.clientWidth + 'px';
      canvas.style.height = parent.clientHeight + 'px';
      render();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(parent);
    return () => ro.disconnect();
  }, [render]);

  // Re-render when chart scrolls/zooms
  useEffect(() => {
    if (!chartApi) return;
    const sub = () => render();
    chartApi.timeScale().subscribeVisibleLogicalRangeChange(sub);
    return () => chartApi.timeScale().unsubscribeVisibleLogicalRangeChange(sub);
  }, [chartApi, render]);

  useEffect(() => { render(); }, [drawings, selectedId, render]);

  // Delete/Backspace key handler for selected drawing
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedIdRef.current) {
        setDrawings(prev => prev.filter(d => d.id !== selectedIdRef.current));
        setSelectedId(null);
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Close context menu on click elsewhere
  useEffect(() => {
    if (!contextMenu) return;
    const handler = () => setContextMenu(null);
    window.addEventListener('click', handler);
    return () => window.removeEventListener('click', handler);
  }, [contextMenu]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Close context menu on any click
    if (contextMenu) {
      setContextMenu(null);
    }

    if (e.button !== 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;

    // If no active tool, handle selection and drag
    if (!activeTool) {
      const hit = hitTest(cx, cy);
      if (hit) {
        setSelectedId(hit.id);
        dragRef.current = { drawingId: hit.id, startX: cx, startY: cy, origDrawing: { ...hit } };
        setCursorStyle('grabbing');
        e.preventDefault();
        e.stopPropagation();
      } else {
        setSelectedId(null);
      }
      return;
    }

    const logical = xToLogical(cx);
    const price = yToPrice(cy);
    if (logical == null || price == null) return;

    if (activeTool === 'horizontal') {
      const snapped = snap(price);
      const newDrawing: Drawing = {
        type: 'horizontal',
        id: Date.now().toString(),
        price: snapped,
        color: lineColor,
      };
      setDrawings(prev => [...prev, newDrawing]);
      e.preventDefault();
      e.stopPropagation();
    } else if (activeTool === 'trendline') {
      const pending = pendingRef.current;
      if (!pending || pending.tool !== 'trendline' || pending.startTime == null) {
        pendingRef.current = { tool: 'trendline', startTime: logical, startPrice: snap(price), startX: cx, startY: cy };
      } else {
        const newDrawing: Drawing = {
          type: 'trendline',
          id: Date.now().toString(),
          startTime: pending.startTime,
          startPrice: pending.startPrice!,
          endTime: logical,
          endPrice: snap(price),
          color: lineColor,
        };
        setDrawings(prev => [...prev, newDrawing]);
        pendingRef.current = null;
      }
      e.preventDefault();
      e.stopPropagation();
    } else if (activeTool === 'rectangle') {
      pendingRef.current = { tool: 'rectangle', startTime: logical, startPrice: price, startX: cx, startY: cy };
      e.preventDefault();
      e.stopPropagation();
    } else if (activeTool === 'text') {
      setTextInput({ x: cx, y: cy, time: logical, price });
      setTextValue('');
      e.preventDefault();
      e.stopPropagation();
      setTimeout(() => textInputRef.current?.focus(), 50);
    }
  }, [activeTool, lineColor, xToLogical, yToPrice, hitTest, contextMenu]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    mouseRef.current = { x: cx, y: cy };

    // Handle drag
    const drag = dragRef.current;
    if (drag) {
      const dx = cx - drag.startX;
      const dy = cy - drag.startY;
      const orig = drag.origDrawing;

      setDrawings(prev => prev.map(d => {
        if (d.id !== drag.drawingId) return d;
        if (d.type === 'horizontal') {
          const origY = priceToY((orig as any).price);
          if (origY == null) return d;
          const newPrice = yToPrice(origY + dy);
          if (newPrice == null) return d;
          return { ...d, price: snap(newPrice) };
        } else if (d.type === 'trendline') {
          const o = orig as any;
          const origY1 = priceToY(o.startPrice);
          const origY2 = priceToY(o.endPrice);
          const origX1 = timeToX(o.startTime);
          const origX2 = timeToX(o.endTime);
          if (origY1 == null || origY2 == null || origX1 == null || origX2 == null) return d;
          const newP1 = yToPrice(origY1 + dy);
          const newP2 = yToPrice(origY2 + dy);
          const newT1 = xToLogical(origX1 + dx);
          const newT2 = xToLogical(origX2 + dx);
          if (newP1 == null || newP2 == null || newT1 == null || newT2 == null) return d;
          return { ...d, startPrice: snap(newP1), endPrice: snap(newP2), startTime: newT1, endTime: newT2 };
        } else if (d.type === 'rectangle') {
          const o = orig as any;
          const origY1 = priceToY(o.startPrice);
          const origY2 = priceToY(o.endPrice);
          const origX1 = timeToX(o.startTime);
          const origX2 = timeToX(o.endTime);
          if (origY1 == null || origY2 == null || origX1 == null || origX2 == null) return d;
          const newP1 = yToPrice(origY1 + dy);
          const newP2 = yToPrice(origY2 + dy);
          const newT1 = xToLogical(origX1 + dx);
          const newT2 = xToLogical(origX2 + dx);
          if (newP1 == null || newP2 == null || newT1 == null || newT2 == null) return d;
          return { ...d, startPrice: newP1, endPrice: newP2, startTime: newT1, endTime: newT2 };
        } else if (d.type === 'text') {
          const o = orig as any;
          const origY = priceToY(o.price);
          const origX = timeToX(o.time);
          if (origY == null || origX == null) return d;
          const newP = yToPrice(origY + dy);
          const newT = xToLogical(origX + dx);
          if (newP == null || newT == null) return d;
          return { ...d, price: newP, time: newT };
        }
        return d;
      }));
      return;
    }

    // Update cursor based on hover state when no tool active
    if (!activeTool) {
      const hit = hitTest(cx, cy);
      const newHovered = hit?.id ?? null;
      if (newHovered !== hoveredIdRef.current) {
        hoveredIdRef.current = newHovered;
        render();
      }
      setCursorStyle(hit ? 'pointer' : 'default');
    } else {
      // Tool is active — always crosshair, but render preview
      if (hoveredIdRef.current) {
        hoveredIdRef.current = null;
      }
      render();
    }
  }, [activeTool, lineColor, rectFill, rectBorder, render, priceToY, timeToX, xToLogical, yToPrice, hitTest]);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    // Complete rectangle
    const pending = pendingRef.current;
    if (pending?.tool === 'rectangle' && pending.startTime != null) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      const logical = xToLogical(cx);
      const price = yToPrice(cy);
      if (logical != null && price != null) {
        const newDrawing: Drawing = {
          type: 'rectangle',
          id: Date.now().toString(),
          startTime: pending.startTime,
          startPrice: pending.startPrice!,
          endTime: logical,
          endPrice: price,
          fillColor: rectFill,
          borderColor: rectBorder,
        };
        setDrawings(prev => [...prev, newDrawing]);
      }
      pendingRef.current = null;
    }

    if (dragRef.current) {
      dragRef.current = null;
      setCursorStyle('pointer');
    }
  }, [rectFill, rectBorder, xToLogical, yToPrice]);

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;

    const hit = hitTest(cx, cy);
    if (hit) {
      if (hit.type === 'text') {
        // Edit text on double-click
        const x = timeToX(hit.time);
        const y = priceToY(hit.price);
        if (x != null && y != null) {
          setTextInput({ x, y, time: hit.time, price: hit.price });
          setTextValue(hit.text);
          setDrawings(prev => prev.filter(d => d.id !== hit.id));
          setTimeout(() => textInputRef.current?.focus(), 50);
        }
      } else {
        // Delete drawing on double-click
        setDrawings(prev => prev.filter(d => d.id !== hit.id));
        if (selectedId === hit.id) setSelectedId(null);
      }
      e.preventDefault();
      e.stopPropagation();
    }
  }, [hitTest, timeToX, priceToY, selectedId]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;

    const hit = hitTest(cx, cy);
    if (hit) {
      e.preventDefault();
      e.stopPropagation();
      setSelectedId(hit.id);
      setContextMenu({ x: e.clientX - rect.left, y: e.clientY - rect.top, drawingId: hit.id });
    }
  }, [hitTest]);

  const handleContextDelete = useCallback(() => {
    if (contextMenu) {
      setDrawings(prev => prev.filter(d => d.id !== contextMenu.drawingId));
      if (selectedId === contextMenu.drawingId) setSelectedId(null);
      setContextMenu(null);
    }
  }, [contextMenu, selectedId]);

  const handleMouseLeave = useCallback(() => {
    mouseRef.current = null;
    if (hoveredIdRef.current) {
      hoveredIdRef.current = null;
      render();
    }
  }, [render]);

  const handleTextSubmit = useCallback(() => {
    if (!textInput || !textValue.trim()) {
      setTextInput(null);
      setTextValue('');
      return;
    }
    const newDrawing: Drawing = {
      type: 'text',
      id: Date.now().toString(),
      time: textInput.time,
      price: textInput.price,
      text: textValue.trim(),
      color: textColor,
      bgColor: textBg,
    };
    setDrawings(prev => [...prev, newDrawing]);
    setTextInput(null);
    setTextValue('');
  }, [textInput, textValue, textColor, textBg]);

  const handleTextKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTextSubmit();
    } else if (e.key === 'Escape') {
      setTextInput(null);
      setTextValue('');
    }
  }, [handleTextSubmit]);

  const shouldIntercept = activeTool != null || textInput != null || drawings.length > 0;

  const effectiveCursor = activeTool ? 'crosshair' : cursorStyle;

  return (
    <>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 z-[15]"
        style={{
          pointerEvents: shouldIntercept ? 'auto' : 'none',
          cursor: effectiveCursor,
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onDoubleClick={handleDoubleClick}
        onContextMenu={handleContextMenu}
      />
      {textInput && (
        <input
          ref={textInputRef}
          value={textValue}
          onChange={e => setTextValue(e.target.value)}
          onKeyDown={handleTextKeyDown}
          onBlur={handleTextSubmit}
          className="absolute z-[25] px-2 py-1 text-[12px] rounded bg-card border border-border text-foreground outline-none"
          style={{ left: textInput.x - 50, top: textInput.y - 14, width: 120 }}
          placeholder="Label..."
        />
      )}
      {contextMenu && (
        <div
          className="absolute z-[30] bg-card border border-border rounded-md shadow-lg py-1 min-w-[120px]"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button
            onClick={handleContextDelete}
            className="w-full text-left px-3 py-1.5 text-sm text-destructive hover:bg-accent transition-colors"
          >
            Delete
          </button>
        </div>
      )}
    </>
  );
}
