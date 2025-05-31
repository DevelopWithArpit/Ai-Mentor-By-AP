"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Globe } from 'lucide-react';

interface LanguageSelectorProps {
  selectedLanguage: string;
  onLanguageChange: (language: string) => void;
  isLoading: boolean;
}

const languages = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Español (Spanish)' },
  { value: 'fr', label: 'Français (French)' },
  { value: 'de', label: 'Deutsch (German)' },
  { value: 'hi', label: 'हिन्दी (Hindi)' },
];

export function LanguageSelector({
  selectedLanguage,
  onLanguageChange,
  isLoading,
}: LanguageSelectorProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="language-select" className="text-md font-medium text-foreground flex items-center">
        <Globe className="mr-2 h-5 w-5 text-primary" />
        Explanation Language
      </Label>
      <Select
        value={selectedLanguage}
        onValueChange={onLanguageChange}
        disabled={isLoading}
      >
        <SelectTrigger id="language-select" className="w-full sm:w-[200px] bg-card focus:ring-primary">
          <SelectValue placeholder="Select language" />
        </SelectTrigger>
        <SelectContent>
          {languages.map((lang) => (
            <SelectItem key={lang.value} value={lang.value}>
              {lang.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">
        Note: AI explanation is currently provided in English. Language selection is for future enhancements.
      </p>
    </div>
  );
}
