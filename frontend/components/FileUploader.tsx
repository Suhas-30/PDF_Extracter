"use client";
import { useRef } from "react";

export default function FileUploader({ onFilesSelect }: { onFilesSelect: (files: File[]) => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    onFilesSelect(files);
  };

  return (
    <div className="flex flex-col items-center">
      <input
        type="file"
        multiple
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        id="file-upload"
      />
      <label
        htmlFor="file-upload"
        className="px-4 py-2 bg-blue-600 text-white rounded cursor-pointer hover:bg-blue-700"
      >
        Select Files
      </label>
    </div>
  );
}