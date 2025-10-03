// Updated PDFViewer.tsx
import { useState } from "react";

export interface FileResult {
  filename: string;
  metadata: {
    total_pages: number;
    total_lines: number;
    total_tables: number;
  };
  content: {
    lines: string[];
    text_blocks?: Array<{ [key: string]: unknown }>;
    tables?: Array<{ [key: string]: unknown }>;
  };
}

export interface SessionResult {
  sessionId: string;
  files: FileResult[];
}

interface PDFViewerProps {
  // Keep the original results prop for backward compatibility
  results?: SessionResult[];
  // Add new props that you're trying to use
  pdfUrl?: string;
  annotations?: unknown;
  // You might also want these based on your usage
  extractedData?: {
    total_pages?: number;
    total_lines?: number;
    total_tables?: number;
    text_content?: string;
    text_blocks?: Array<{ [key: string]: unknown }>;
    tables?: Array<{ [key: string]: unknown }>;
  };
}

const PDFViewer: React.FC<PDFViewerProps> = ({ 
  results, 
  pdfUrl, 
  annotations, 
  extractedData 
}) => {
  const [sessionIndex, setSessionIndex] = useState(0);
  const [fileIndex, setFileIndex] = useState(0);

  // If we have extractedData but no results, convert it
  const displayResults = results || (extractedData ? [
    {
      sessionId: "current",
      files: [
        {
          filename: pdfUrl || "document.pdf",
          metadata: {
            total_pages: extractedData?.total_pages || 0,
            total_lines: extractedData?.total_lines || 0,
            total_tables: extractedData?.total_tables || 0,
          },
          content: {
            lines: extractedData?.text_content ? [extractedData.text_content] : [],
            text_blocks: extractedData?.text_blocks || [],
            tables: extractedData?.tables || [],
          }
        }
      ]
    }
  ] : []);

  if (!displayResults || displayResults.length === 0) {
    return <div className="p-4 text-gray-500">No results to display</div>;
  }

  const session = displayResults[sessionIndex];
  const file = session.files[fileIndex];

  // ... rest of your existing component code
  return (
    <div className="p-4">
      {/* Show PDF URL if available */}
      {pdfUrl && <div className="mb-2 text-sm text-gray-500">PDF: {pdfUrl}</div>}
      
      <div className="mb-2 text-sm text-gray-600">
        Session {sessionIndex + 1} of {displayResults.length} | File {fileIndex + 1} of {session.files.length}
      </div>

      {/* ... rest of your existing JSX */}
    </div>
  );
};

export default PDFViewer;