
"use client";

import type { SmartSearchOutput } from '@/ai/flows/smart-search';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Lightbulb, FileText, BookOpen, AlertCircle, Loader2, Info, Download, Languages } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import jsPDF from 'jspdf';

// Map language codes to full names for display if needed elsewhere,
// but for the explanation note, we'll use the code directly from selectedLanguage prop.
const languageDisplayNames: Record<string, string> = {
  en: "English",
  es: "Spanish",
  fr: "French",
  de: "German",
  hi: "Hindi",
  mr: "Marathi",
};


interface ResultsDisplayProps {
  searchResult: SmartSearchOutput | null;
  explanation: string | null;
  isLoading: boolean;
  error: string | null;
  language: string; // This is the language code for the EXPLANATION (e.g., 'en', 'mr')
  hasDocument?: boolean; 
  question: string;
}

export function ResultsDisplay({
  searchResult,
  explanation,
  isLoading,
  error,
  language, // This is the target language for the explanation
  hasDocument = false,
  question,
}: ResultsDisplayProps) {

  const handleDownloadPdf = () => {
    if (!question && !searchResult?.answer && !explanation) {
      // This case should ideally be prevented by disabling the button
      return;
    }

    const doc = new jsPDF();
    const pageHeight = doc.internal.pageSize.height || doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.width || doc.internal.pageSize.getWidth();
    const margin = 15; // mm
    const maxLineWidth = pageWidth - margin * 2;
    let currentY = margin;

    const addNewPageIfNeeded = (textHeight: number) => {
      if (currentY + textHeight > pageHeight - margin) {
        doc.addPage();
        currentY = margin;
      }
    };

    const addSection = (title: string, content: string | null | undefined, titleFontSize = 14, contentFontSize = 12) => {
      if (!content || content.trim() === "") return;

      doc.setFontSize(titleFontSize);
      doc.setFont(undefined, 'bold');
      let lines = doc.splitTextToSize(title, maxLineWidth);
      let textBlockHeight = doc.getTextDimensions(lines).h;
      addNewPageIfNeeded(textBlockHeight);
      doc.text(lines, margin, currentY);
      currentY += textBlockHeight + 2; 

      doc.setFontSize(contentFontSize);
      doc.setFont(undefined, 'normal');
      lines = doc.splitTextToSize(content, maxLineWidth);
      textBlockHeight = doc.getTextDimensions(lines).h;
      addNewPageIfNeeded(textBlockHeight);
      doc.text(lines, margin, currentY);
      currentY += textBlockHeight + 7; 
    };

    doc.setFontSize(20);
    doc.setFont(undefined, 'bold');
    let mainTitleLines = doc.splitTextToSize("ScholarAI Insights", maxLineWidth);
    let mainTitleHeight = doc.getTextDimensions(mainTitleLines).h;
    addNewPageIfNeeded(mainTitleHeight);
    doc.text(mainTitleLines, margin, currentY);
    currentY += mainTitleHeight + 10;

    addSection("Question:", question);
    addSection("Answer:", searchResult?.answer); // Answer might be in question's language
    addSection(`AI Explanation (in ${languageDisplayNames[language] || language}):`, explanation);


    doc.save('scholarai_insights.pdf');
  };


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
  
  const hasContentToDownload = !!(question || searchResult?.answer || explanation);
  const explanationLanguageName = languageDisplayNames[language] || language; // Get full name or use code

  return (
    <Card className="shadow-lg bg-card">
      <CardHeader>
        <CardTitle className="font-headline text-2xl text-primary">ScholarAI Insights</CardTitle>
        <CardDescription>Here's what I found based on your query. The AI attempts to answer in the language of your question. Explanations are provided in your selected global language setting.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {searchResult?.answer && (
          <div>
            <h3 className="text-xl font-headline font-semibold mb-2 flex items-center text-foreground">
              <FileText className="mr-2 h-6 w-6 text-accent" />
              Answer
            </h3>
            <p className="text-foreground leading-relaxed whitespace-pre-wrap">{searchResult.answer}</p>
            {searchResult.pageNumber !== undefined && searchResult.pageNumber !== null && (
               <div className="mt-3 flex items-center">
                <BookOpen className="mr-2 h-5 w-5 text-primary" />
                <Badge variant="secondary" className="text-sm">
                  Found on Page: {searchResult.pageNumber}
                </Badge>
              </div>
            )}
             <p className="text-xs text-muted-foreground mt-2 flex items-center">
              <Languages className="mr-1 h-3.5 w-3.5" /> Answer language aims to match your question.
            </p>
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
            <p className="text-xs text-muted-foreground mt-2 flex items-center">
              <Languages className="mr-1 h-3.5 w-3.5" /> Explanation provided in {explanationLanguageName}.
            </p>
          </div>
        )}

        {!searchResult?.answer && !explanation && !isLoading && (
          <p className="text-muted-foreground text-center py-4">
            {hasDocument 
              ? "No specific information found in the document for your query, AI attempted a general response. Try rephrasing or check the document."
              : "I couldn't find a specific answer to your question right now. Try rephrasing it."
            }
          </p>
        )}

        {hasContentToDownload && (
          <>
            <Separator className="my-6" />
            <div className="flex justify-end">
               <Button onClick={handleDownloadPdf} variant="outline" disabled={isLoading || !hasContentToDownload}>
                 <Download className="mr-2 h-4 w-4" />
                 Download PDF
               </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

