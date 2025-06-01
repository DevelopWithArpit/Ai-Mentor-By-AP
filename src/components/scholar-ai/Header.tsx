"use client";

import { useState } from 'react';
import { ScholarAiLogo } from './icons/ScholarAiLogo';
import { SettingsDialog } from './SettingsDialog'; // Import SettingsDialog
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';
import type { Theme } from '@/components/theme-provider'; // Import Theme type

interface HeaderProps {
  selectedLanguage: string;
  onLanguageChange: (language: string) => void;
  currentTheme: Theme;
  onThemeChange: (theme: Theme) => void;
}

export function Header({ selectedLanguage, onLanguageChange, currentTheme, onThemeChange }: HeaderProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <header className="py-6 px-4 md:px-8 border-b border-border/50 shadow-md bg-card">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ScholarAiLogo className="h-10 w-10 text-primary" />
          <div>
            <h1 className="text-3xl font-headline font-bold text-primary">AI Mentor</h1>
            <p className="text-sm text-muted-foreground font-medium">By AP</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setIsSettingsOpen(true)} aria-label="Open settings">
          <Settings className="h-6 w-6" />
        </Button>
      </div>
      <SettingsDialog
        isOpen={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
        selectedLanguage={selectedLanguage}
        onLanguageChange={onLanguageChange}
        currentTheme={currentTheme}
        onThemeChange={onThemeChange}
      />
    </header>
  );
}
