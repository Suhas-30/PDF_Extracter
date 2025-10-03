"use client";
import { useState, useEffect } from "react";

interface FileListAndSubmitProps {
  files: File[];
  uploading: boolean;
  onUploadingChange: (v: boolean) => void;
  onShowProgressChange: (v: boolean) => void;
  onSubmit: (files: File[]) => Promise<void> | void;
}

export default function FileListAndSubmit({
  files,
  uploading,
  onUploadingChange,
  onShowProgressChange,
  onSubmit,
}: FileListAndSubmitProps) {
  const [showAlert, setShowAlert] = useState(false);

  async function handleSubmit() {
    onUploadingChange(true);
    onShowProgressChange(true);
    setShowAlert(true);
    try {
      await onSubmit(files);
    } finally {
      onUploadingChange(false);
      onShowProgressChange(false);
      // Keep alert briefly to show feedback
      setTimeout(() => setShowAlert(false), 1200);
    }
  }

  // ...rest of your code...
  return (
    <>
      {files.length === 0 ? (
        <div className="flex flex-col items-center opacity-70">
          <span className="text-5xl mb-2">📄</span>
          <span className="text-gray-500">No content extracted yet</span>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <ul className="list-disc pl-5 text-gray-700">
            {files.map((file: File, i: number) => (
              <li key={i}>{file.name}</li>
            ))}
          </ul>
          <button
            onClick={handleSubmit}
            disabled={uploading}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 w-fit"
          >
            {uploading ? "Processing..." : "Submit"}
          </button>
          {showAlert && (
            <div className="relative mt-4 w-64 h-8 bg-blue-100 rounded overflow-hidden">
              <div className="absolute top-0 left-0 h-8 bg-blue-500 animate-slide"></div>
              <div className="relative z-10 text-blue-700 font-semibold flex items-center justify-center h-full">
                Submitted successfully
              </div>
            </div>
          )}
          <style jsx>{`
            @keyframes slide {
              0% { left: -100%; width: 100%; }
              50% { left: 0%; width: 100%; }
              100% { left: 100%; width: 100%; }
            }
            .animate-slide {
              animation: slide 3s linear forwards;
            }
          `}</style>
        </div>
      )}
    </>
  );
}