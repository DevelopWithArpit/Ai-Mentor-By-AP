import { ScholarAiLogo } from './icons/ScholarAiLogo';

export function Header() {
  return (
    <header className="py-6 px-4 md:px-8 border-b border-border/50 shadow-md bg-card">
      <div className="container mx-auto flex items-center gap-3">
        <ScholarAiLogo className="h-10 w-10 text-primary" />
        <h1 className="text-3xl font-headline font-bold text-primary">ScholarAI</h1>
      </div>
    </header>
  );
}
