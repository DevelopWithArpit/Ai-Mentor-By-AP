
"use client";

import { useState, useEffect } from 'react';
import { Header } from '@/components/scholar-ai/Header';
import { FileUpload } from '@/components/scholar-ai/FileUpload';
import { QuestionInput } from '@/components/scholar-ai/QuestionInput';
import { LanguageSelector } from '@/components/scholar-ai/LanguageSelector';
import { ResultsDisplay } from '@/components/scholar-ai/ResultsDisplay';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { smartSearch, type SmartSearchInput, type SmartSearchOutput } from '@/ai/flows/smart-search';
import { explainAnswer, type ExplainAnswerInput } from '@/ai/flows/ai-explanation';
import { useToast } from "@/hooks/use-toast";
import { Button } from '@/components/ui/button';
import { RefreshCcw } from 'lucide-react';

const fileToDataUri = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result as string);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export default function ScholarAiPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [question, setQuestion] = useState<string>('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en');
  const [searchResult, setSearchResult] = useState<SmartSearchOutput | null>(null);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleFileChange = (file: File | null) => {
    setSelectedFile(file);
    // Reset results if file changes
    setSearchResult(null);
    setExplanation(null);
    setError(null);
  };

  const handleSubmit = async () => {
    if (!question.trim()) {
      setError('Please enter a question.');
      toast({ title: "Error", description: "Please enter a question.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    setError(null);
    setSearchResult(null);
    setExplanation(null);

    try {
      let documentDataUriForFlow: string | undefined = undefined;
      if (selectedFile) {
        documentDataUriForFlow = await fileToDataUri(selectedFile);
      }

      const searchInput: SmartSearchInput = {
        documentDataUri: documentDataUriForFlow,
        question,
      };
      const result = await smartSearch(searchInput);
      setSearchResult(result);

      if (result && result.answer) {
        const explainInput: ExplainAnswerInput = { question, answer: result.answer };
        const explainerResult = await explainAnswer(explainInput);
        setExplanation(explainerResult.explanation);
        toast({ title: "Success!", description: "Insights generated successfully." });
      } else if (result && !result.answer) {
         toast({ title: "No answer found", description: selectedFile ? "Could not find a direct answer in the document." : "I couldn't find an answer to your question." });
      } else {
         toast({ title: "Search complete", description: "Search finished, but no specific answer or explanation generated." });
      }

    } catch (err: any) {
      console.error('Error processing request:', err);
      const errorMessage = err.message || 'An unexpected error occurred. Please try again.';
      setError(errorMessage);
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleReset = () => {
    setSelectedFile(null);
    setQuestion('');
    setSearchResult(null);
    setExplanation(null);
    setError(null);
    setIsLoading(false);
    const fileInput = document.getElementById('file-upload-input') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
    toast({ title: "Cleared", description: "Inputs and results have been cleared." });
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow container mx-auto p-4 md:p-8 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <Card className="lg:col-span-1 shadow-xl bg-card">
            <CardHeader>
              <CardTitle className="font-headline text-2xl text-primary">Get Started</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <FileUpload
                selectedFile={selectedFile}
                onFileChange={handleFileChange}
                isLoading={isLoading}
                inputId="file-upload-input"
              />
              <QuestionInput
                question={question}
                onQuestionChange={setQuestion}
                onSubmit={handleSubmit}
                isLoading={isLoading}
                isSubmitDisabled={!question.trim()}
              />
              <LanguageSelector
                selectedLanguage={selectedLanguage}
                onLanguageChange={setSelectedLanguage}
                isLoading={isLoading}
              />
              <Button variant="outline" onClick={handleReset} disabled={isLoading} className="w-full">
                <RefreshCcw className="mr-2 h-4 w-4" />
                Clear All
              </Button>
            </CardContent>
          </Card>

          <div className="lg:col-span-2">
            <ResultsDisplay
              searchResult={searchResult}
              explanation={explanation}
              isLoading={isLoading}
              error={error}
              language={selectedLanguage}
              hasDocument={!!selectedFile}
            />
          </div>
        </div>
      </main>
      <footer className="text-center p-4 text-muted-foreground text-sm border-t border-border/50 bg-card">
        © {new Date().getFullYear()} ScholarAI. Empowering students with AI.
      </footer>
    </div>
  );
}
