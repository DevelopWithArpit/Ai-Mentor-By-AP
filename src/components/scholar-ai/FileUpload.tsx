
"use client";

import type { ChangeEvent } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { UploadCloud, FileText, XCircle } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface FileUploadProps {
  onFileChange: (files: File[]) => void;
  selectedFiles: File[];
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
  selectedFiles, 
  isLoading, 
  inputId = "file-upload",
  acceptedFileTypes,
  acceptedFileExtensionsString,
  label = "Upload Document(s) (Optional)"
}: FileUploadProps) {
  const { toast } = useToast();

  const currentAcceptedTypes = acceptedFileTypes || DEFAULT_ACCEPTED_DOC_TYPES;
  const currentAcceptedExtensionsString = acceptedFileExtensionsString || DEFAULT_ACCEPTED_DOC_EXTENSIONS_STRING;

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const newFiles = event.target.files ? Array.from(event.target.files) : [];
    if (newFiles.length > 0) {
      const validFiles = newFiles.filter(file =>
        currentAcceptedTypes.some(type => {
          if (type.endsWith('/*')) {
            return file.type.startsWith(type.slice(0, -1));
          }
          return file.type === type;
        })
      );

      const invalidFiles = newFiles.filter(file => !validFiles.includes(file));

      if (invalidFiles.length > 0) {
        toast({
          title: "Invalid File Type",
          description: `Skipped invalid files: ${invalidFiles.map(f => f.name).join(', ')}. Supported types: ${currentAcceptedExtensionsString}`,
          variant: "destructive",
        });
      }

      const currentFileNames = new Set(selectedFiles.map(f => f.name));
      const filesToAdd = validFiles.filter(f => !currentFileNames.has(f.name));

      if (filesToAdd.length > 0) {
        onFileChange([...selectedFiles, ...filesToAdd]);
      } else if (validFiles.length > 0 && invalidFiles.length === 0) {
        toast({
          title: "Duplicate Files",
          description: "All selected files are already in the list.",
        });
      }
      
      // Clear the input value to allow re-selecting the same file after removing it
      const fileInput = document.getElementById(inputId) as HTMLInputElement;
      if(fileInput) fileInput.value = '';
    }
  };

  const handleRemoveFile = (fileToRemove: File) => {
    onFileChange(selectedFiles.filter(file => file !== fileToRemove));
  };
  
  const handleResetFiles = () => {
    onFileChange([]);
    const fileInput = document.getElementById(inputId) as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

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
          multiple
        />
        <Button
            variant="outline"
            onClick={() => document.getElementById(inputId)?.click()}
            disabled={isLoading}
            className="flex-grow sm:flex-grow-0"
          >
            <UploadCloud className="mr-2 h-5 w-5" />
            {selectedFiles.length > 0 ? "Add More Files" : "Select Files"}
        </Button>
      </div>
       <p className="text-xs text-muted-foreground">
        Supported formats: {currentAcceptedExtensionsString}.
      </p>
      {selectedFiles.length > 0 && (
        <div className="mt-3 space-y-2">
            {selectedFiles.map((file, index) => (
                 <div key={index} className="flex items-center justify-between p-3 border rounded-md bg-secondary/30 text-secondary-foreground">
                    <div className="flex items-center space-x-2 overflow-hidden">
                        <FileText className="h-5 w-5 text-primary flex-shrink-0" />
                        <span className="text-sm font-medium truncate" title={file.name}>{file.name}</span>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleRemoveFile(file)} disabled={isLoading} aria-label={`Remove ${file.name}`}>
                        <XCircle className="h-5 w-5 text-destructive" />
                    </Button>
                </div>
            ))}
            <Button variant="link" size="sm" className="text-destructive px-0" onClick={handleResetFiles} disabled={isLoading}>
              Clear all files
            </Button>
        </div>
      )}
    </div>
  );
}
