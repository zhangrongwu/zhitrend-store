import { useState, useRef } from 'react';
import { CloudArrowUpIcon } from '@heroicons/react/24/outline';

interface ImageUploadProps {
  onUpload: (file: File) => void;
  preview?: string;
  className?: string;
}

export default function ImageUpload({ onUpload, preview, className = '' }: ImageUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onUpload(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      onUpload(e.target.files[0]);
    }
  };

  return (
    <div
      className={`relative ${className}`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleChange}
        className="hidden"
      />
      
      <div
        onClick={() => inputRef.current?.click()}
        className={`
          cursor-pointer border-2 border-dashed rounded-lg p-4
          ${dragActive ? 'border-indigo-600 bg-indigo-50' : 'border-gray-300'}
          ${preview ? 'h-full' : 'h-48'}
          flex flex-col items-center justify-center space-y-2
          transition-colors duration-200
        `}
      >
        {preview ? (
          <div className="relative w-full h-full">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-full object-cover rounded-lg"
            />
            <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 hover:opacity-100 transition-opacity duration-200 rounded-lg flex items-center justify-center">
              <p className="text-white text-sm">点击或拖拽更换图片</p>
            </div>
          </div>
        ) : (
          <>
            <CloudArrowUpIcon className="h-12 w-12 text-gray-400" />
            <p className="text-sm text-gray-500">
              点击或拖拽上传图片
            </p>
          </>
        )}
      </div>
    </div>
  );
} 