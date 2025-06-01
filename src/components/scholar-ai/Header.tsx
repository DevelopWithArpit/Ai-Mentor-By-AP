
import { ScholarAiLogo } from './icons/ScholarAiLogo';
import { ThemeToggle } from '@/components/theme-toggle';

export function Header() {
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
        <ThemeToggle />
      </div>
    </header>
  );
}
