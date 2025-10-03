"use client";
import React, { useEffect, useRef, useState } from "react";

// Define a more specific type without the index signature that causes issues
type StandardBBox = {
  l: number;
  t: number;
  r: number;
  b: number;
  width?: number;
  height?: number;
  coord_origin?: "TOPLEFT" | string;
};

type DoclingBBox = {
  r_x0: number;
  r_y0: number;
  r_x2: number;
  r_y2: number;
  coord_origin?: "TOPLEFT" | string;
};

type BBox = StandardBBox | DoclingBBox;

type TextBlock = {
  page: number;
  content: string;
  bbox: BBox;
  block_type?: string;
  confidence?: number;
  reading_order?: number;
  font_info?: {
    font_name?: string;
    font_size?: number;
    bold?: boolean;
    italic?: boolean;
    color?: number;
  };
};

interface LayoutPreviewProps {
  textBlocks: TextBlock[];
  pageWidth?: number;
  pageHeight?: number;
  fitToParent?: boolean;
}

const LayoutPreview: React.FC<LayoutPreviewProps> = ({ 
  textBlocks, 
  pageWidth = 800, 
  pageHeight = 1120, 
  fitToParent = true 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    if (!fitToParent) return;
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      for (const e of entries) {
        const w = e.contentRect.width;
        if (w > 0) {
          const s = Math.min(1, w / pageWidth);
          setScale(s);
        }
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [fitToParent, pageWidth]);

  if (!textBlocks || textBlocks.length === 0) {
    return <div className="text-gray-500 text-sm">No text blocks to render.</div>;
  }

  function toRect(b: BBox) {
    if ("l" in b) {
      // TypeScript now knows this is StandardBBox
      const maybeWidth = b.width;
      const maybeHeight = b.height;
      return { 
        l: b.l, 
        t: b.t, 
        r: b.r, 
        b: b.b, 
        w: maybeWidth ?? Math.max(1, b.r - b.l), 
        h: maybeHeight ?? Math.max(1, b.b - b.t) 
      };
    } else {
      // TypeScript knows this is DoclingBBox
      return { 
        l: b.r_x0, 
        t: b.r_y0, 
        r: b.r_x2, 
        b: b.r_y2, 
        w: Math.max(1, b.r_x2 - b.r_x0), 
        h: Math.max(1, b.r_y2 - b.r_y0) 
      };
    }
  }

  const rects = textBlocks.map(tb => toRect(tb.bbox));
  const minLeft = Math.min(...rects.map(r => r.l));
  const minTop = Math.min(...rects.map(r => r.t));
  const maxRight = Math.max(...rects.map(r => r.r));
  const maxBottom = Math.max(...rects.map(r => r.b));

  const originalWidth = Math.max(1, maxRight - minLeft);
  const originalHeight = Math.max(1, maxBottom - minTop);

  const scaleX = pageWidth / originalWidth;
  const scaleY = pageHeight / originalHeight;

  return (
    <div ref={containerRef} className="w-full overflow-y-auto overflow-x-hidden">
      <div 
        className="relative bg-white border shadow origin-top-left" 
        style={{ 
          width: `${pageWidth}px`, 
          height: `${pageHeight}px`, 
          transform: `scale(${scale})` 
        }}
      >
        {textBlocks.map((b, idx) => {
          const r = toRect(b.bbox);
          const left = (r.l - minLeft) * scaleX;
          const top = (r.t - minTop) * scaleY;
          const width = r.w * scaleX;
          const height = r.h * scaleY;

          const targetFont = (b.font_info?.font_size || 12) * scaleY;
          const fontSize = Math.max(8, Math.min(height * 0.85, targetFont));
          const fontWeight = b.font_info?.bold ? 700 : 400;
          const fontStyle = b.font_info?.italic ? "italic" : "normal";

          return (
            <div
              key={idx}
              className="absolute text-gray-900"
              style={{ 
                left, 
                top, 
                width, 
                height, 
                fontSize, 
                fontWeight, 
                fontStyle, 
                lineHeight: 1.1, 
                whiteSpace: "nowrap", 
                overflow: "hidden" 
              }}
              title={`${b.block_type || ""} (conf: ${b.confidence ?? "-"})`}
            >
              {b.content}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LayoutPreview;