"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";

interface PDFPreviewProps {
  file: File;
  width?: number;
  height?: number;
}

// Minimal PDF preview using built-in browser PDF renderer via object URL
const PDFPreview: React.FC<PDFPreviewProps> = ({ file, width, height }) => {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  if (!url) return null;

  // Responsive default (previous behavior): full width, ~70vh height
  if (!width || !height) {
    return (
      <div className="w-full h-[70vh] border rounded overflow-hidden bg-white">
        <iframe src={url} className="w-full h-full" title={file.name} />
      </div>
    );
  }

  // Fixed size if explicit dimensions provided
  return (
    <div className="border rounded overflow-hidden bg-white" style={{ width: `${width}px`, height: `${height}px` }}>
      <iframe src={url} className="w-full h-full" title={file.name} />
    </div>
  );
};

export default PDFPreview;


