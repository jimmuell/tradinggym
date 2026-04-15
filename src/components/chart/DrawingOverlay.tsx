import { useEffect, useRef, useState, useCallback } from 'react';
import { IChartApi, ISeriesApi, Logical } from 'lightweight-charts';
import { Drawing, DrawingTool } from '@/lib/drawingTypes';

interface DrawingOverlayProps {
  activeTool: DrawingTool;
  chartApi: IChartApi | null;
  seriesApi: ISeriesApi<'Candlestick'> | null;
  isCoachMode?: boolean;
  onToolComplete?: () => void; // called after text placement to deactivate
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

export default function DrawingOverlay({ activeTool, chartApi, seriesApi, isCoachMode = false, onToolComplete }: DrawingOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawings, setDrawings] = useState<Drawing[]>([]);
  const drawingsRef = useRef<Drawing[]>([]);
  drawingsRef.current = drawings;

  // Pending state for multi-click tools
  const pendingRef = useRef<{
    tool: DrawingTool;
    startTime?: Logical;
    startPrice?: number;
    startX?: number;
    startY?: number;
  } | null>(null);

  // Text input state
  const [textInput, setTextInput] = useState<{ x: number; y: number; time: number; price: number } | null>(null);
  const [textValue, setTextValue] = useState('');
  const textInputRef = useRef<HTMLInputElement>(null);

  // Drag state
  const dragRef = useRef<{ drawingId: string; startX: number; startY: number; origDrawing: Drawing } | null>(null);

  const lineColor = isCoachMode ? COACH_COLOR : DEFAULT_LINE_COLOR;
  const rectFill = isCoachMode ? COACH_RECT_FILL : RECT_FILL;
  const rectBorder = isCoachMode ? COACH_RECT_BORDER : RECT_BORDER;
  const textBg = isCoachMode ? COACH_TEXT_BG : TEXT_BG;
  const textColor = isCoachMode ? COACH_COLOR : 'white';

  // Convert chart coordinates
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

  // Render all drawings
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const dpr = window.devicePixelRatio || 1;

    for (const d of drawingsRef.current) {
      if (d.type === 'horizontal') {
        const y = priceToY(d.price);
        if (y == null) continue;
        ctx.strokeStyle = d.color;
        ctx.lineWidth = 1 * dpr;
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(0, y * dpr);
        ctx.lineTo(w, y * dpr);
        ctx.stroke();
        // Price label
        ctx.fillStyle = d.color;
        ctx.font = `${11 * dpr}px sans-serif`;
        ctx.fillText(d.price.toFixed(2), 6 * dpr, (y - 4) * dpr);
      } else if (d.type === 'trendline') {
        const x1 = timeToX(d.startTime);
        const y1 = priceToY(d.startPrice);
        const x2 = timeToX(d.endTime);
        const y2 = priceToY(d.endPrice);
        if (x1 == null || y1 == null || x2 == null || y2 == null) continue;
        ctx.strokeStyle = d.color;
        ctx.lineWidth = 1.5 * dpr;
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(x1 * dpr, y1 * dpr);
        ctx.lineTo(x2 * dpr, y2 * dpr);
        ctx.stroke();
        // Arrow at end
        const angle = Math.atan2((y2 - y1), (x2 - x1));
        const arrLen = 8 * dpr;
        ctx.beginPath();
        ctx.moveTo(x2 * dpr, y2 * dpr);
        ctx.lineTo(x2 * dpr - arrLen * Math.cos(angle - Math.PI / 6), y2 * dpr - arrLen * Math.sin(angle - Math.PI / 6));
        ctx.moveTo(x2 * dpr, y2 * dpr);
        ctx.lineTo(x2 * dpr - arrLen * Math.cos(angle + Math.PI / 6), y2 * dpr - arrLen * Math.sin(angle + Math.PI / 6));
        ctx.stroke();
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
        ctx.fillStyle = d.fillColor;
        ctx.fillRect(rx, ry, rw, rh);
        ctx.strokeStyle = d.borderColor;
        ctx.lineWidth = 1 * dpr;
        ctx.setLineDash([]);
        ctx.strokeRect(rx, ry, rw, rh);
      } else if (d.type === 'text') {
        const x = timeToX(d.time);
        const y = priceToY(d.price);
        if (x == null || y == null) continue;
        ctx.font = `${12 * dpr}px sans-serif`;
        const metrics = ctx.measureText(d.text);
        const pad = 4 * dpr;
        const tw = metrics.width + pad * 2;
        const th = 16 * dpr + pad * 2;
        ctx.fillStyle = d.bgColor;
        const radius = 6 * dpr;
        const bx = x * dpr - tw / 2;
        const by = y * dpr - th / 2;
        ctx.beginPath();
        ctx.roundRect(bx, by, tw, th, radius);
        ctx.fill();
        ctx.fillStyle = d.color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(d.text, x * dpr, y * dpr);
        ctx.textAlign = 'start';
        ctx.textBaseline = 'alphabetic';
      }
    }

    // Render pending trendline preview
    const pending = pendingRef.current;
    if (pending?.tool === 'trendline' && pending.startTime != null && pending.startPrice != null) {
      // We'll draw a temporary line from start to current mouse in handleMouseMove
    }
  }, [priceToY, timeToX]);

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

  // Re-render when drawings change
  useEffect(() => { render(); }, [drawings, render]);

  // Hit test for drawings
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
        // Distance from point to line segment
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

  // Preview state for in-progress drawings
  const previewRef = useRef<{ x: number; y: number } | null>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;

    // If no active tool, check for drag
    if (!activeTool) {
      const hit = hitTest(cx, cy);
      if (hit) {
        dragRef.current = { drawingId: hit.id, startX: cx, startY: cy, origDrawing: { ...hit } };
        e.preventDefault();
        e.stopPropagation();
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
      // Tool stays active for next placement
      e.preventDefault();
      e.stopPropagation();
    } else if (activeTool === 'trendline') {
      const pending = pendingRef.current;
      if (!pending || pending.tool !== 'trendline' || pending.startTime == null) {
        // First click
        pendingRef.current = { tool: 'trendline', startTime: logical, startPrice: snap(price), startX: cx, startY: cy };
      } else {
        // Second click — complete
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
        previewRef.current = null;
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
  }, [activeTool, lineColor, xToLogical, yToPrice, hitTest]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;

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

    // Trendline preview
    const pending = pendingRef.current;
    if (pending?.tool === 'trendline' && pending.startTime != null) {
      previewRef.current = { x: cx, y: cy };
      render();
      // Draw preview line
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const dpr = window.devicePixelRatio || 1;
        const x1 = timeToX(pending.startTime);
        const y1 = priceToY(pending.startPrice!);
        if (x1 != null && y1 != null) {
          ctx.strokeStyle = lineColor;
          ctx.lineWidth = 1 * dpr;
          ctx.setLineDash([4 * dpr, 4 * dpr]);
          ctx.beginPath();
          ctx.moveTo(x1 * dpr, y1 * dpr);
          ctx.lineTo(cx * dpr, cy * dpr);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }
    }

    // Rectangle preview
    if (pending?.tool === 'rectangle' && pending.startX != null) {
      render();
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const dpr = window.devicePixelRatio || 1;
        const sx = pending.startX! * dpr;
        const sy = pending.startY! * dpr;
        const ex = cx * dpr;
        const ey = cy * dpr;
        ctx.fillStyle = rectFill;
        ctx.fillRect(Math.min(sx, ex), Math.min(sy, ey), Math.abs(ex - sx), Math.abs(ey - sy));
        ctx.strokeStyle = rectBorder;
        ctx.lineWidth = 1 * dpr;
        ctx.setLineDash([]);
        ctx.strokeRect(Math.min(sx, ex), Math.min(sy, ey), Math.abs(ex - sx), Math.abs(ey - sy));
      }
    }
  }, [activeTool, lineColor, rectFill, rectBorder, render, priceToY, timeToX, xToLogical, yToPrice]);

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

    // End drag
    if (dragRef.current) {
      dragRef.current = null;
    }
  }, [rectFill, rectBorder, xToLogical, yToPrice]);

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;

    // Check for text edit
    const hit = hitTest(cx, cy);
    if (hit) {
      if (hit.type === 'text') {
        // Edit text
        const x = timeToX(hit.time);
        const y = priceToY(hit.price);
        if (x != null && y != null) {
          setTextInput({ x, y, time: hit.time, price: hit.price });
          setTextValue(hit.text);
          setDrawings(prev => prev.filter(d => d.id !== hit.id));
          setTimeout(() => textInputRef.current?.focus(), 50);
        }
      } else {
        // Delete drawing
        setDrawings(prev => prev.filter(d => d.id !== hit.id));
      }
      e.preventDefault();
      e.stopPropagation();
    }
  }, [hitTest, timeToX, priceToY]);

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

  // Determine if overlay should intercept pointer events
  const isActive = activeTool != null || textInput != null;

  return (
    <>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 z-[15]"
        style={{
          pointerEvents: isActive ? 'auto' : 'none',
          cursor: activeTool ? 'crosshair' : 'default',
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onDoubleClick={handleDoubleClick}
      />
      {/* Always render a non-interactive canvas for existing drawings when tool is inactive */}
      {!isActive && drawings.length > 0 && (
        <canvas
          ref={(el) => {
            // This is a secondary hit-test canvas for drag & double-click when no tool active
            // We handle it via the main canvas pointer-events logic instead
          }}
          className="absolute inset-0 z-[15] pointer-events-auto"
          style={{ cursor: 'default', background: 'transparent' }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onDoubleClick={handleDoubleClick}
        />
      )}
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
    </>
  );
}
