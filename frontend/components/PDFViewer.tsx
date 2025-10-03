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
    text_blocks?: any[];
    tables?: any[];
  };
}

export interface SessionResult {
  sessionId: string; // optional, for multiple requests
  files: FileResult[];
}

interface PDFViewerProps {
  results: SessionResult[];
}

const PDFViewer: React.FC<PDFViewerProps> = ({ results }) => {
  const [sessionIndex, setSessionIndex] = useState(0);
  const [fileIndex, setFileIndex] = useState(0);

  if (!results || results.length === 0) {
    return <div className="p-4 text-gray-500">No results to display</div>;
  }

  const session = results[sessionIndex];
  const file = session.files[fileIndex];

  const nextFile = () => {
    if (fileIndex < session.files.length - 1) setFileIndex(fileIndex + 1);
  };
  const prevFile = () => {
    if (fileIndex > 0) setFileIndex(fileIndex - 1);
  };

  const nextSession = () => {
    if (sessionIndex < results.length - 1) {
      setSessionIndex(sessionIndex + 1);
      setFileIndex(0);
    }
  };
  const prevSession = () => {
    if (sessionIndex > 0) {
      setSessionIndex(sessionIndex - 1);
      setFileIndex(0);
    }
  };

  return (
    <div className="p-4">
      <div className="mb-2 text-sm text-gray-600">
        Session {sessionIndex + 1} of {results.length} | File {fileIndex + 1} of {session.files.length}
      </div>

      <div className="border rounded p-4 bg-gray-50">
        <h3 className="font-bold mb-2">{file.filename}</h3>
        <div className="mb-2">
          <strong>Pages:</strong> {file.metadata.total_pages} | 
          <strong> Lines:</strong> {file.metadata.total_lines} | 
          <strong> Tables:</strong> {file.metadata.total_tables}
        </div>
        <div className="mb-2">
          <strong>Text:</strong>
          <pre className="whitespace-pre-wrap">{file.content.lines.join("\n")}</pre>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <button
          className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
          onClick={prevFile}
          disabled={fileIndex === 0}
        >
          Previous File
        </button>
        <button
          className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
          onClick={nextFile}
          disabled={fileIndex === session.files.length - 1}
        >
          Next File
        </button>

        <button
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50 ml-auto"
          onClick={prevSession}
          disabled={sessionIndex === 0}
        >
          Previous Session
        </button>
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
          onClick={nextSession}
          disabled={sessionIndex === results.length - 1}
        >
          Next Session
        </button>
      </div>
    </div>
  );
};

export default PDFViewer;
