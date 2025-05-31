"use client";

import type { ChangeEvent } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { UploadCloud, FileText, XCircle } from 'lucide-react';

interface FileUploadProps {
  onFileChange: (file: File | null) => void;
  selectedFile: File | null;
  isLoading: boolean;
}

export function FileUpload({ onFileChange, selectedFile, isLoading }: FileUploadProps) {
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === "application/pdf") {
      onFileChange(file);
    } else {
      onFileChange(null);
      // TODO: Add toast notification for invalid file type
      alert("Please upload a PDF file.");
    }
  };

  const handleRemoveFile = () => {
    onFileChange(null);
    // Reset file input value
    const fileInput = document.getElementById('pdf-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  return (
    <div className="space-y-4">
      <Label htmlFor="pdf-upload" className="text-lg font-medium text-foreground font-headline">
        Upload Syllabus or Document (PDF)
      </Label>
      <div className="flex items-center space-x-3">
        <Input
          id="pdf-upload"
          type="file"
          accept="application/pdf"
          onChange={handleFileChange}
          className="hidden"
          disabled={isLoading}
        />
        <Button
            variant="outline"
            onClick={() => document.getElementById('pdf-upload')?.click()}
            disabled={isLoading}
            className="flex-grow sm:flex-grow-0"
          >
            <UploadCloud className="mr-2 h-5 w-5" />
            {selectedFile ? "Change PDF" : "Select PDF"}
        </Button>
      </div>
      {selectedFile && (
        <div className="mt-3 flex items-center justify-between p-3 border rounded-md bg-secondary/30 text-secondary-foreground">
          <div className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">{selectedFile.name}</span>
          </div>
          <Button variant="ghost" size="icon" onClick={handleRemoveFile} disabled={isLoading} aria-label="Remove file">
            <XCircle className="h-5 w-5 text-destructive" />
          </Button>
        </div>
      )}
    </div>
  );
}
