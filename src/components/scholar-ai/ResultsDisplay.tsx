
"use client";

import type { SmartSearchOutput } from '@/ai/flows/smart-search';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Lightbulb, FileText, BookOpen, AlertCircle, Loader2, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface ResultsDisplayProps {
  searchResult: SmartSearchOutput | null;
  explanation: string | null;
  isLoading: boolean;
  error: string | null;
  language: string;
  hasDocument?: boolean; // To provide better context for "no results"
}

export function ResultsDisplay({
  searchResult,
  explanation,
  isLoading,
  error,
  language,
  hasDocument = false,
}: ResultsDisplayProps) {
  if (isLoading) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-primary flex items-center">
            <Loader2 className="mr-2 h-6 w-6 animate-spin" />
            Processing your request...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Please wait while ScholarAI analyzes the document and generates insights.</p>
          <div className="mt-4 space-y-3">
            <div className="h-4 bg-muted rounded w-3/4 animate-pulse"></div>
            <div className="h-4 bg-muted rounded w-1/2 animate-pulse"></div>
            <div className="h-4 bg-muted rounded w-5/6 animate-pulse"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="shadow-md">
        <AlertCircle className="h-5 w-5" />
        <AlertTitle className="font-headline">Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!searchResult && !explanation) {
    return (
      <Card className="shadow-lg text-center bg-card">
        <CardHeader>
          <CardTitle className="font-headline text-primary flex items-center justify-center">
             <Info className="mr-2 h-6 w-6" /> Ready to Assist!
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Ask a question to get started. You can also upload an optional document (PDF, TXT, DOC, DOCX) for context-specific answers.
          </p>
          <img data-ai-hint="education study" src="https://placehold.co/300x200.png" alt="Decorative illustration of books and a lightbulb" className="mx-auto mt-4 rounded-md" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg bg-card">
      <CardHeader>
        <CardTitle className="font-headline text-2xl text-primary">ScholarAI Insights</CardTitle>
        <CardDescription>Here's what I found based on your query:</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {searchResult?.answer && (
          <div>
            <h3 className="text-xl font-headline font-semibold mb-2 flex items-center text-foreground">
              <FileText className="mr-2 h-6 w-6 text-accent" />
              Answer
            </h3>
            <p className="text-foreground leading-relaxed whitespace-pre-wrap">{searchResult.answer}</p>
            {searchResult.pageNumber !== undefined && (
               <div className="mt-3 flex items-center">
                <BookOpen className="mr-2 h-5 w-5 text-primary" />
                <Badge variant="secondary" className="text-sm">
                  Found on Page: {searchResult.pageNumber}
                </Badge>
              </div>
            )}
          </div>
        )}

        {searchResult?.answer && explanation && <Separator className="my-6" />}
        
        {explanation && (
          <div>
            <h3 className="text-xl font-headline font-semibold mb-2 flex items-center text-foreground">
              <Lightbulb className="mr-2 h-6 w-6 text-accent" />
              AI Explanation
            </h3>
            <p className="text-foreground leading-relaxed whitespace-pre-wrap">{explanation}</p>
            <p className="text-xs text-muted-foreground mt-2">
              (Explanation provided in English)
            </p>
          </div>
        )}

        {!searchResult?.answer && !explanation && !isLoading && (
          <p className="text-muted-foreground text-center py-4">
            {hasDocument 
              ? "No specific information found in the document for your query, or an explanation could not be generated. Try rephrasing your question or checking the document."
              : "I couldn't find a specific answer to your question right now. Try rephrasing it."
            }
          </p>
        )}
      </CardContent>
    </Card>
  );
}
