"use client";

import { useState } from "react";

interface FileUploadProps {
  onUpload: (file: File) => void;
  accept?: string;
}

export function FileUpload({ onUpload, accept = "image/png,image/jpeg" }: FileUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
    onUpload(file);
  }

  return (
    <div>
      <input type="file" accept={accept} onChange={handleChange} className="border rounded p-2 w-full" />
      {preview && <img src={preview} alt="Preview" className="mt-2 max-h-40 rounded" />}
    </div>
  );
}
