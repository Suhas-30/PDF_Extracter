import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Paperclip, Upload } from 'lucide-react';
import { useState, useCallback, useRef, DragEvent, ChangeEvent, forwardRef, useImperativeHandle } from 'react';

// You will likely want to define a type for your files
interface CustomFile extends File {
  id: string;
  progress: number;
}

interface UploadBoxProps {
  onFilesSelect: (files: File[]) => void;
}

export type UploadBoxHandle = {
  open: () => void;
};

export const UploadBox = forwardRef<UploadBoxHandle, UploadBoxProps>(function UploadBox({ onFilesSelect }, ref) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files).filter(file => file.type === 'application/pdf');
    if (files.length > 0) {
      onFilesSelect(files);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length > 0) {
      onFilesSelect(files.filter(file => file.type === 'application/pdf'));
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  useImperativeHandle(ref, () => ({
    open: handleClick,
  }));

  return (
    <Card 
      className={`w-full p-4 border-2 border-dashed transition-colors ${
        isDragging ? 'border-primary bg-primary/10' : 'border-gray-300 dark:border-gray-700 hover:border-primary/50'
      }`}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <CardContent className="flex flex-col items-center justify-center p-8 text-center">
        <Upload className="w-8 h-8 text-muted-foreground mb-3" />
        <CardTitle className="text-lg font-medium">
          Drag & drop PDF files here
        </CardTitle>
        <CardDescription className="text-sm">
          or <span className="text-primary cursor-pointer hover:underline" onClick={handleClick}>click to upload</span>
        </CardDescription>
        <p className="mt-2 text-xs text-muted-foreground">
          (Max 5 files, each {'<'} 200MB, PDF only)
        </p>
        
        {/* Hidden File Input */}
        <Input
          type="file"
          accept=".pdf"
          multiple
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
        />
      </CardContent>
    </Card>
  );
});