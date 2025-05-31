
"use client";

import type { ChangeEvent } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { UploadCloud, FileText, XCircle } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface FileUploadProps {
  onFileChange: (file: File | null) => void;
  selectedFile: File | null;
  isLoading: boolean;
  inputId?: string;
}

const ACCEPTED_FILE_TYPES = [
  "application/pdf",
  "text/plain",
  "application/msword", // .doc
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document" // .docx
];

const ACCEPTED_FILE_EXTENSIONS_STRING = ".pdf, .txt, .doc, .docx";

export function FileUpload({ onFileChange, selectedFile, isLoading, inputId = "file-upload" }: FileUploadProps) {
  const { toast } = useToast();

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (ACCEPTED_FILE_TYPES.includes(file.type)) {
        onFileChange(file);
      } else {
        onFileChange(null);
        toast({
          title: "Invalid File Type",
          description: `Please upload a ${ACCEPTED_FILE_EXTENSIONS_STRING} file.`,
          variant: "destructive",
        });
         // Reset file input value if invalid file was chosen
        const fileInput = document.getElementById(inputId) as HTMLInputElement;
        if (fileInput) {
          fileInput.value = '';
        }
      }
    } else {
      onFileChange(null); // No file selected or dialog cancelled
    }
  };

  const handleRemoveFile = () => {
    onFileChange(null);
    // Reset file input value
    const fileInput = document.getElementById(inputId) as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  return (
    <div className="space-y-4">
      <Label htmlFor={inputId} className="text-lg font-medium text-foreground font-headline">
        Upload Document (Optional)
      </Label>
      <div className="flex items-center space-x-3">
        <Input
          id={inputId}
          type="file"
          accept={ACCEPTED_FILE_EXTENSIONS_STRING}
          onChange={handleFileChange}
          className="hidden"
          disabled={isLoading}
        />
        <Button
            variant="outline"
            onClick={() => document.getElementById(inputId)?.click()}
            disabled={isLoading}
            className="flex-grow sm:flex-grow-0"
          >
            <UploadCloud className="mr-2 h-5 w-5" />
            {selectedFile ? "Change File" : "Select File"}
        </Button>
      </div>
       <p className="text-xs text-muted-foreground">
        Supported formats: {ACCEPTED_FILE_EXTENSIONS_STRING}.
      </p>
      {selectedFile && (
        <div className="mt-3 flex items-center justify-between p-3 border rounded-md bg-secondary/30 text-secondary-foreground">
          <div className="flex items-center space-x-2 overflow-hidden">
            <FileText className="h-5 w-5 text-primary flex-shrink-0" />
            <span className="text-sm font-medium truncate" title={selectedFile.name}>{selectedFile.name}</span>
          </div>
          <Button variant="ghost" size="icon" onClick={handleRemoveFile} disabled={isLoading} aria-label="Remove file">
            <XCircle className="h-5 w-5 text-destructive" />
          </Button>
        </div>
      )}
    </div>
  );
}
