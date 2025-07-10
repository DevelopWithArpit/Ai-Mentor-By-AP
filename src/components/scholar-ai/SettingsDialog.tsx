
"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageSelector } from "@/components/scholar-ai/LanguageSelector";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import type { Theme } from "@/components/theme-provider";

interface SettingsDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  selectedLanguage: string;
  onLanguageChange: (language: string) => void;
  currentTheme: Theme; // Pass current theme
  onThemeChange: (theme: Theme) => void; // Pass theme change handler
}

export function SettingsDialog({
  isOpen,
  onOpenChange,
  selectedLanguage,
  onLanguageChange,
  currentTheme,
  onThemeChange,
}: SettingsDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-headline text-primary">Settings</DialogTitle>
          <DialogDescription>
            Customize your AI Mentor experience.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="space-y-3">
            <Label className="font-medium text-foreground">Appearance</Label>
            <div className="flex items-center justify-between rounded-md border p-3">
              <span className="text-sm text-muted-foreground">Theme</span>
              <ThemeToggle /> {/* ThemeToggle now uses useTheme internally, so no props needed here if ThemeProvider is set up correctly */}
            </div>
          </div>
          <Separator />
          <div className="space-y-2">
             {/* LanguageSelector now used globally, removed isLoading prop */}
            <LanguageSelector
              selectedLanguage={selectedLanguage}
              onLanguageChange={onLanguageChange}
              isLoading={false} 
            />
            <p className="text-xs text-muted-foreground px-1">
              This sets the language for AI-generated explanations. UI language is English.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
