
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
  acceptedFileTypes?: string[];
  acceptedFileExtensionsString?: string;
  label?: string;
}

const DEFAULT_ACCEPTED_DOC_TYPES = [
  "application/pdf",
  "text/plain",
  "application/msword", // .doc
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document" // .docx
];
const DEFAULT_ACCEPTED_DOC_EXTENSIONS_STRING = ".pdf, .txt, .doc, .docx";

export function FileUpload({ 
  onFileChange, 
  selectedFile, 
  isLoading, 
  inputId = "file-upload",
  acceptedFileTypes,
  acceptedFileExtensionsString,
  label = "Upload Document (Optional)"
}: FileUploadProps) {
  const { toast } = useToast();

  const currentAcceptedTypes = acceptedFileTypes || DEFAULT_ACCEPTED_DOC_TYPES;
  const currentAcceptedExtensionsString = acceptedFileExtensionsString || DEFAULT_ACCEPTED_DOC_EXTENSIONS_STRING;

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (currentAcceptedTypes.includes(file.type) || currentAcceptedTypes.some(type => type.endsWith('/*') && file.type.startsWith(type.slice(0, -2)))) {
        onFileChange(file);
      } else {
        onFileChange(null);
        toast({
          title: "Invalid File Type",
          description: `Please upload a ${currentAcceptedExtensionsString} file.`,
          variant: "destructive",
        });
        const fileInput = document.getElementById(inputId) as HTMLInputElement;
        if (fileInput) {
          fileInput.value = '';
        }
      }
    } else {
      onFileChange(null);
    }
  };

  const handleRemoveFile = () => {
    onFileChange(null);
    const fileInput = document.getElementById(inputId) as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  return (
    <div className="space-y-4">
      <Label htmlFor={inputId} className="text-lg font-medium text-foreground font-headline">
        {label}
      </Label>
      <div className="flex items-center space-x-3">
        <Input
          id={inputId}
          type="file"
          accept={currentAcceptedExtensionsString}
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
        Supported formats: {currentAcceptedExtensionsString}.
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
