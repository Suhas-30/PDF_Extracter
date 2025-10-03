export type TextBlock = {
  page: number;
  content: string;
  bbox?: any;
  reading_order?: number;
};

// Sort blocks into human reading order: by page, then by reading_order if present,
// otherwise by top (t/r_y0) then left (l/r_x0)
export function sortTextBlocks(blocks: TextBlock[]): TextBlock[] {
  const getTop = (b: any) => (b?.bbox?.t ?? b?.bbox?.r_y0 ?? 0);
  const getLeft = (b: any) => (b?.bbox?.l ?? b?.bbox?.r_x0 ?? 0);
  return [...blocks].sort((a, b) => {
    if ((a.page || 1) !== (b.page || 1)) return (a.page || 1) - (b.page || 1);
    if (a.reading_order != null && b.reading_order != null) return a.reading_order - b.reading_order;
    if (getTop(a) !== getTop(b)) return getTop(a) - getTop(b);
    return getLeft(a) - getLeft(b);
  });
}

export function blocksToPlainText(blocks: TextBlock[], pageBreak = "\n\n") {
  const sorted = sortTextBlocks(blocks);
  let lastPage = sorted.length ? sorted[0].page || 1 : 1;
  const lines: string[] = [];
  for (const b of sorted) {
    const p = b.page || 1;
    if (p !== lastPage) {
      lines.push(pageBreak);
      lastPage = p;
    }
    lines.push(b.content);
  }
  return lines.join("\n");
}

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
