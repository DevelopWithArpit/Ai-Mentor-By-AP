
"use client";

import { useState, useEffect } from 'react';
import { Header } from '@/components/scholar-ai/Header';
import { FileUpload } from '@/components/scholar-ai/FileUpload';
import { QuestionInput } from '@/components/scholar-ai/QuestionInput';
import { LanguageSelector } from '@/components/scholar-ai/LanguageSelector';
import { ResultsDisplay } from '@/components/scholar-ai/ResultsDisplay';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { RefreshCcw, Sparkles, Code, Image as ImageIcon, Presentation, Wand2, Brain, FileText, Loader2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import Image from 'next/image';

import { smartSearch, type SmartSearchInput, type SmartSearchOutput } from '@/ai/flows/smart-search';
import { explainAnswer, type ExplainAnswerInput, type ExplainAnswerOutput } from '@/ai/flows/ai-explanation';
import { generateCode, type GenerateCodeInput, type GenerateCodeOutput } from '@/ai/flows/code-generator-flow';
import { wrappedGenerateImage, type GenerateImageInput, type GenerateImageOutput } from '@/ai/flows/image-generator-flow';
import { wrappedGenerateDiagram, type GenerateDiagramInput, type GenerateDiagramOutput } from '@/ai/flows/diagram-generator-flow';
import { generatePresentationOutline, type GeneratePresentationInput, type GeneratePresentationOutput } from '@/ai/flows/presentation-generator-flow';

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

  // States for new features
  const [codePrompt, setCodePrompt] = useState<string>('');
  const [codeLanguage, setCodeLanguage] = useState<string>('');
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [isGeneratingCode, setIsGeneratingCode] = useState<boolean>(false);

  const [imagePrompt, setImagePrompt] = useState<string>('');
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState<boolean>(false);

  const [diagramPrompt, setDiagramPrompt] = useState<string>('');
  const [generatedDiagramUrl, setGeneratedDiagramUrl] = useState<string | null>(null);
  const [isGeneratingDiagram, setIsGeneratingDiagram] = useState<boolean>(false);

  const [presentationTopic, setPresentationTopic] = useState<string>('');
  const [numSlides, setNumSlides] = useState<string>('5');
  const [generatedPresentation, setGeneratedPresentation] = useState<GeneratePresentationOutput | null>(null);
  const [isGeneratingPresentation, setIsGeneratingPresentation] = useState<boolean>(false);


  const handleFileChange = (file: File | null) => {
    setSelectedFile(file);
    setSearchResult(null);
    setExplanation(null);
    setError(null);
  };

  const handleSubmitScholarAI = async () => {
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
        toast({ title: "ScholarAI Success!", description: "Insights generated successfully." });
      } else if (result && !result.answer) {
         toast({ title: "No answer found", description: selectedFile ? "Could not find a direct answer in the document." : "I couldn't find an answer to your question." });
      } else {
         toast({ title: "Search complete", description: "Search finished, but no specific answer or explanation generated." });
      }

    } catch (err: any) {
      console.error('Error processing ScholarAI request:', err);
      const errorMessage = err.message || 'An unexpected error occurred. Please try again.';
      setError(errorMessage);
      toast({ title: "ScholarAI Error", description: errorMessage, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleResetScholarAI = () => {
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
    toast({ title: "Cleared", description: "ScholarAI inputs and results have been cleared." });
  };

  const handleGenerateCode = async () => {
    if (!codePrompt.trim()) {
      toast({ title: "Error", description: "Please enter a code description.", variant: "destructive" });
      return;
    }
    setIsGeneratingCode(true);
    setGeneratedCode(null);
    try {
      const input: GenerateCodeInput = { description: codePrompt, language: codeLanguage || undefined };
      const result = await generateCode(input);
      setGeneratedCode(result.generatedCode);
      toast({ title: "Code Generated!", description: "Code snippet has been generated." });
    } catch (err: any) {
      console.error('Error generating code:', err);
      toast({ title: "Code Generation Error", description: err.message || "Failed to generate code.", variant: "destructive" });
    } finally {
      setIsGeneratingCode(false);
    }
  };

  const handleGenerateImage = async () => {
    if (!imagePrompt.trim()) {
      toast({ title: "Error", description: "Please enter an image prompt.", variant: "destructive" });
      return;
    }
    setIsGeneratingImage(true);
    setGeneratedImageUrl(null);
    try {
      const input: GenerateImageInput = { prompt: imagePrompt };
      const result = await wrappedGenerateImage(input);
      setGeneratedImageUrl(result.imageUrl);
      toast({ title: "Image Generated!", description: "Image has been generated successfully." });
    } catch (err: any) {
      console.error('Error generating image:', err);
      toast({ title: "Image Generation Error", description: err.message || "Failed to generate image.", variant: "destructive" });
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleGenerateDiagram = async () => {
    if (!diagramPrompt.trim()) {
      toast({ title: "Error", description: "Please enter a diagram description.", variant: "destructive" });
      return;
    }
    setIsGeneratingDiagram(true);
    setGeneratedDiagramUrl(null);
    try {
      const input: GenerateDiagramInput = { prompt: diagramPrompt };
      const result = await wrappedGenerateDiagram(input);
      setGeneratedDiagramUrl(result.diagramImageUrl);
      toast({ title: "Diagram Generated!", description: "Diagram has been generated." });
    } catch (err: any) {
      console.error('Error generating diagram:', err);
      toast({ title: "Diagram Generation Error", description: err.message || "Failed to generate diagram.", variant: "destructive" });
    } finally {
      setIsGeneratingDiagram(false);
    }
  };

  const handleGeneratePresentation = async () => {
    if (!presentationTopic.trim()) {
      toast({ title: "Error", description: "Please enter a presentation topic.", variant: "destructive" });
      return;
    }
    setIsGeneratingPresentation(true);
    setGeneratedPresentation(null);
    try {
      const numSlidesParsed = parseInt(numSlides, 10);
      const input: GeneratePresentationInput = { 
        topic: presentationTopic, 
        numSlides: isNaN(numSlidesParsed) ? undefined : numSlidesParsed 
      };
      const result = await generatePresentationOutline(input);
      setGeneratedPresentation(result);
      toast({ title: "Presentation Outline Generated!", description: "Outline created successfully." });
    } catch (err: any) {
      console.error('Error generating presentation:', err);
      toast({ title: "Presentation Generation Error", description: err.message || "Failed to generate presentation outline.", variant: "destructive" });
    } finally {
      setIsGeneratingPresentation(false);
    }
  };


  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow container mx-auto p-4 md:p-8 space-y-8">
        {/* ScholarAI Section */}
        <Card className="shadow-xl bg-card">
          <CardHeader>
            <CardTitle className="font-headline text-2xl text-primary flex items-center"><Brain className="mr-2 h-7 w-7"/> ScholarAI Document Q&amp;A</CardTitle>
            <CardDescription>Upload a document and ask questions, or ask general questions without a document.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              <div className="lg:col-span-1 space-y-6">
                <FileUpload
                  selectedFile={selectedFile}
                  onFileChange={handleFileChange}
                  isLoading={isLoading}
                  inputId="file-upload-input"
                />
                <QuestionInput
                  question={question}
                  onQuestionChange={setQuestion}
                  onSubmit={handleSubmitScholarAI}
                  isLoading={isLoading}
                  isSubmitDisabled={!question.trim()}
                />
                <LanguageSelector
                  selectedLanguage={selectedLanguage}
                  onLanguageChange={setSelectedLanguage}
                  isLoading={isLoading}
                />
                <Button variant="outline" onClick={handleResetScholarAI} disabled={isLoading} className="w-full">
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  Clear ScholarAI
                </Button>
              </div>
              <div className="lg:col-span-2">
                <ResultsDisplay
                  searchResult={searchResult}
                  explanation={explanation}
                  isLoading={isLoading}
                  error={error}
                  language={selectedLanguage}
                  hasDocument={!!selectedFile}
                  question={question}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Creative AI Tools Section */}
        <Card className="shadow-xl bg-card">
          <CardHeader>
            <CardTitle className="font-headline text-2xl text-primary flex items-center"><Sparkles className="mr-2 h-7 w-7"/> Creative AI Tools</CardTitle>
            <CardDescription>Generate code, images, diagrams, and presentation outlines.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Code Generator */}
            <Card className="bg-card/80">
              <CardHeader>
                <CardTitle className="font-headline text-xl text-accent flex items-center"><Code className="mr-2 h-6 w-6"/>Code Generator</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea placeholder="Describe the code you want to generate (e.g., 'a Python function to sort a list')..." value={codePrompt} onChange={(e) => setCodePrompt(e.target.value)} disabled={isGeneratingCode} className="min-h-[80px]"/>
                <Input placeholder="Language (optional, e.g., 'python', 'javascript')" value={codeLanguage} onChange={(e) => setCodeLanguage(e.target.value)} disabled={isGeneratingCode} />
                <Button onClick={handleGenerateCode} disabled={isGeneratingCode || !codePrompt.trim()} className="w-full sm:w-auto">
                  {isGeneratingCode && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Generate Code
                </Button>
                {generatedCode && (
                  <div className="mt-4 p-4 bg-muted rounded-md">
                    <h4 className="font-semibold mb-2 text-foreground">Generated Code:</h4>
                    <pre className="text-sm text-foreground whitespace-pre-wrap overflow-x-auto bg-background/50 p-3 rounded-md"><code>{generatedCode}</code></pre>
                  </div>
                )}
                {!generatedCode && !isGeneratingCode && (
                     <div className="text-center text-muted-foreground py-4">
                        <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
                        <p>Your generated code will appear here.</p>
                    </div>
                )}
              </CardContent>
            </Card>

            {/* Image Generator */}
            <Card className="bg-card/80">
              <CardHeader>
                <CardTitle className="font-headline text-xl text-accent flex items-center"><ImageIcon className="mr-2 h-6 w-6"/>Image Generator</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea placeholder="Describe the image you want (e.g., 'a futuristic cityscape at sunset')..." value={imagePrompt} onChange={(e) => setImagePrompt(e.target.value)} disabled={isGeneratingImage} className="min-h-[80px]"/>
                <Button onClick={handleGenerateImage} disabled={isGeneratingImage || !imagePrompt.trim()} className="w-full sm:w-auto">
                  {isGeneratingImage && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Generate Image
                </Button>
                {generatedImageUrl && (
                  <div className="mt-4">
                    <h4 className="font-semibold mb-2 text-foreground">Generated Image:</h4>
                    <Image src={generatedImageUrl} alt="Generated by AI" width={512} height={512} className="rounded-md border shadow-md" />
                  </div>
                )}
                 {!generatedImageUrl && !isGeneratingImage && (
                     <div className="text-center text-muted-foreground py-4">
                        <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground/50" />
                        <p>Your generated image will appear here.</p>
                        <img data-ai-hint="abstract creative" src="https://placehold.co/300x200.png" alt="Placeholder for image generation" className="mx-auto mt-2 rounded-md opacity-50" />
                    </div>
                )}
              </CardContent>
            </Card>

            {/* Diagram Generator */}
            <Card className="bg-card/80">
              <CardHeader>
                <CardTitle className="font-headline text-xl text-accent flex items-center"><Wand2 className="mr-2 h-6 w-6"/>Diagram Generator</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea placeholder="Describe the diagram (e.g., 'flowchart for a login process', 'mind map about renewable energy')..." value={diagramPrompt} onChange={(e) => setDiagramPrompt(e.target.value)} disabled={isGeneratingDiagram} className="min-h-[80px]"/>
                <Button onClick={handleGenerateDiagram} disabled={isGeneratingDiagram || !diagramPrompt.trim()} className="w-full sm:w-auto">
                  {isGeneratingDiagram && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Generate Diagram
                </Button>
                {generatedDiagramUrl && (
                  <div className="mt-4">
                    <h4 className="font-semibold mb-2 text-foreground">Generated Diagram:</h4>
                    <Image src={generatedDiagramUrl} alt="Diagram generated by AI" width={512} height={512} className="rounded-md border shadow-md" />
                  </div>
                )}
                {!generatedDiagramUrl && !isGeneratingDiagram && (
                     <div className="text-center text-muted-foreground py-4">
                        <Wand2 className="mx-auto h-12 w-12 text-muted-foreground/50" />
                        <p>Your generated diagram will appear here.</p>
                        <img data-ai-hint="flowchart structure" src="https://placehold.co/300x200.png" alt="Placeholder for diagram generation" className="mx-auto mt-2 rounded-md opacity-50" />
                    </div>
                )}
              </CardContent>
            </Card>

            {/* Presentation Outline Generator */}
            <Card className="bg-card/80">
              <CardHeader>
                <CardTitle className="font-headline text-xl text-accent flex items-center"><Presentation className="mr-2 h-6 w-6"/>Presentation Outline Generator</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input placeholder="Presentation Topic (e.g., 'The Future of AI')" value={presentationTopic} onChange={(e) => setPresentationTopic(e.target.value)} disabled={isGeneratingPresentation} />
                <Input type="number" placeholder="Number of Slides (optional, default 5)" value={numSlides} onChange={(e) => setNumSlides(e.target.value)} disabled={isGeneratingPresentation} min="1" />
                <Button onClick={handleGeneratePresentation} disabled={isGeneratingPresentation || !presentationTopic.trim()} className="w-full sm:w-auto">
                  {isGeneratingPresentation && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Generate Outline
                </Button>
                {generatedPresentation && (
                  <div className="mt-4 p-4 bg-muted rounded-md">
                    <h4 className="font-semibold mb-2 text-foreground">Generated Presentation Outline:</h4>
                    {generatedPresentation.title && <h5 className="text-lg font-semibold text-primary mb-3">{generatedPresentation.title}</h5>}
                    {generatedPresentation.slides.map((slide, index) => (
                      <div key={index} className="mb-3 p-3 bg-background/50 rounded">
                        <h6 className="font-semibold text-accent">{index + 1}. {slide.title}</h6>
                        <ul className="list-disc list-inside ml-4 text-sm text-foreground">
                          {slide.bulletPoints.map((point, pIndex) => (
                            <li key={pIndex}>{point}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
                 {!generatedPresentation && !isGeneratingPresentation && (
                     <div className="text-center text-muted-foreground py-4">
                        <Presentation className="mx-auto h-12 w-12 text-muted-foreground/50" />
                        <p>Your presentation outline will appear here.</p>
                    </div>
                )}
              </CardContent>
            </Card>
          </CardContent>
        </Card>

      </main>
      <footer className="text-center p-4 text-muted-foreground text-sm border-t border-border/50 bg-card">
        © {new Date().getFullYear()} ScholarAI. Empowering students and creators with AI.
      </footer>
    </div>
  );
}
