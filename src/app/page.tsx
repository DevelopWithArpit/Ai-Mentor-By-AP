
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
import { RefreshCcw, Sparkles, Code, Image as ImageIconLucide, Presentation as PresentationIcon, Wand2, Brain, FileText, Loader2, Lightbulb, Download } from 'lucide-react'; // Renamed ImageIcon to avoid conflict
import { useToast } from "@/hooks/use-toast";
import Image from 'next/image'; // Standard Next.js Image component
import jsPDF from 'jspdf';

import { smartSearch, type SmartSearchInput, type SmartSearchOutput } from '@/ai/flows/smart-search';
import { explainAnswer, type ExplainAnswerInput, type ExplainAnswerOutput } from '@/ai/flows/ai-explanation';
import { generateCode, type GenerateCodeInput, type GenerateCodeOutput } from '@/ai/flows/code-generator-flow';
import { wrappedGenerateImage, type GenerateImageInput, type GenerateImageOutput } from '@/ai/flows/image-generator-flow';
import { wrappedGenerateDiagram, type GenerateDiagramInput, type GenerateDiagramOutput } from '@/ai/flows/diagram-generator-flow';
import { generatePresentationOutline, type GeneratePresentationInput, type GeneratePresentationOutput, type SlideSchema } from '@/ai/flows/presentation-generator-flow';

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
  const [numSlides, setNumSlides] = useState<string>('3'); // Default to 3 for faster generation with images
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
    toast({ title: "Generating Presentation...", description: "This may take a moment, especially with images." });
    try {
      const numSlidesParsed = parseInt(numSlides, 10);
      const input: GeneratePresentationInput = { 
        topic: presentationTopic, 
        numSlides: isNaN(numSlidesParsed) ? 3 : numSlidesParsed // Default to 3 if NaN
      };
      const result = await generatePresentationOutline(input);
      setGeneratedPresentation(result);
      toast({ title: "Presentation Generated!", description: "Outline and images created successfully." });
    } catch (err: any) {
      console.error('Error generating presentation:', err);
      toast({ title: "Presentation Generation Error", description: err.message || "Failed to generate presentation.", variant: "destructive" });
    } finally {
      setIsGeneratingPresentation(false);
    }
  };

  const handleDownloadPresentationPdf = async () => {
    if (!generatedPresentation) return;

    const doc = new jsPDF();
    const pageHeight = doc.internal.pageSize.height || doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.width || doc.internal.pageSize.getWidth();
    const margin = 15;
    const maxTextWidth = pageWidth - margin * 2;
    let currentY = margin;

    const addNewPageIfNeeded = (neededHeight: number) => {
      if (currentY + neededHeight > pageHeight - margin) {
        doc.addPage();
        currentY = margin;
        return true; // Page was added
      }
      return false; // No page added
    };
    
    // Presentation Title
    if (generatedPresentation.title) {
      doc.setFontSize(20);
      doc.setFont(undefined, 'bold');
      const titleLines = doc.splitTextToSize(generatedPresentation.title, maxTextWidth);
      const titleHeight = doc.getTextDimensions(titleLines).h;
      addNewPageIfNeeded(titleHeight);
      doc.text(titleLines, pageWidth / 2, currentY, { align: 'center' });
      currentY += titleHeight + 12;
    }

    for (let i = 0; i < generatedPresentation.slides.length; i++) {
      const slide = generatedPresentation.slides[i];
      
      if (i > 0) {
        currentY += 8; // Space before new slide content
        addNewPageIfNeeded(40); // Check if enough space for slide title at least
      }
      
      // Slide Title
      doc.setFontSize(16);
      doc.setFont(undefined, 'bold');
      const slideTitle = `${i + 1}. ${slide.title}`;
      let lines = doc.splitTextToSize(slideTitle, maxTextWidth);
      let textBlockHeight = doc.getTextDimensions(lines).h;
      addNewPageIfNeeded(textBlockHeight);
      doc.text(lines, margin, currentY);
      currentY += textBlockHeight + 6;

      // Bullet Points
      doc.setFontSize(12);
      doc.setFont(undefined, 'normal');
      for (const point of slide.bulletPoints) {
        const bulletPointText = `- ${point}`;
        lines = doc.splitTextToSize(bulletPointText, maxTextWidth - 5); // Indent bullets
        textBlockHeight = doc.getTextDimensions(lines).h;
        addNewPageIfNeeded(textBlockHeight + 2); // +2 for small spacing
        doc.text(lines, margin + 5, currentY);
        currentY += textBlockHeight + 3;
      }

      // Image (if exists)
      if (slide.imageUrl) {
        currentY += 5; // Space before image
        const IMAGE_MAX_WIDTH = maxTextWidth * 0.85; // Image slightly smaller than text width
        const IMAGE_MAX_HEIGHT = pageHeight * 0.5; // Max half a page for image

        try {
            // For jsPDF, it's often best to let it determine dimensions from the image data itself if possible,
            // or provide one dimension and let it scale, then check.
            // We'll try to give it a width and let it determine height to maintain aspect.
            // However, jsPDF's handling of base64 image dimensions can be tricky without loading into an Image element first.
            // For simplicity, let's define a target width and calculate height, then check for page fit.
            // This part is complex to get perfect aspect ratio and fit without async operations.
            // A common approach is to define a bounding box.
            
            // Simplified approach: add image with max width and let jsPDF scale height.
            // Then check currentY. This might not be perfectly aspect-ratio controlled by us here.
            const availableHeight = pageHeight - margin - currentY;
            if (availableHeight < 50) { // If less than 50 units of space, new page for image
                addNewPageIfNeeded(IMAGE_MAX_HEIGHT); // Force new page if not enough space
            }
            
            // jsPDF addImage can take width & height. If one is 0, it uses aspect ratio.
            // Let's give it a max width and 0 for height to preserve aspect ratio.
            doc.addImage(slide.imageUrl, 'PNG', margin, currentY, IMAGE_MAX_WIDTH, 0);
            
            // The height of the added image is not directly returned.
            // This is a known challenge with jsPDF synchronously.
            // We'll estimate or add a fixed spacing, or assume it fits if availableHeight was enough.
            // For a more robust solution, one would load the image into an <img> tag, get its dimensions, then add to PDF.
            // Let's assume a typical image might take up to IMAGE_MAX_HEIGHT if scaled.
            // A simpler but less accurate way is to add a fixed height or make the image smaller.
            // We'll add a placeholder height and ensure new page if it's too large.
            const placeholderImageHeight = IMAGE_MAX_HEIGHT * 0.6; // Estimate
            
            if (placeholderImageHeight > pageHeight - margin - currentY) { // If estimated height overflows
                 doc.deletePage(doc.internal.getNumberOfPages()); // Remove potentially broken partial image
                 doc.addPage();
                 currentY = margin;
                 doc.addImage(slide.imageUrl, 'PNG', margin, currentY, IMAGE_MAX_WIDTH, 0);
                 currentY += placeholderImageHeight + 7;
            } else {
                 currentY += placeholderImageHeight + 7; // Add estimated height + spacing
            }

        } catch (e) {
          console.error("Error adding image to PDF:", e);
          doc.setFontSize(10);
          doc.setFont(undefined, 'italic');
          lines = doc.splitTextToSize("[Image generation/embedding failed for this slide]", maxTextWidth);
          textBlockHeight = doc.getTextDimensions(lines).h;
          addNewPageIfNeeded(textBlockHeight);
          doc.text(lines, margin, currentY);
          currentY += textBlockHeight + 7;
        }
      } else if (slide.suggestedImageDescription) { // If no image URL but there was a suggestion
        currentY += 2; 
        doc.setFontSize(10);
        doc.setFont(undefined, 'italic');
        const suggestionText = `Suggested Image: ${slide.suggestedImageDescription}`;
        lines = doc.splitTextToSize(suggestionText, maxTextWidth);
        textBlockHeight = doc.getTextDimensions(lines).h;
        addNewPageIfNeeded(textBlockHeight);
        doc.text(lines, margin, currentY);
        currentY += textBlockHeight + 7;
      }

      if (i < generatedPresentation.slides.length - 1) {
        currentY += 5; 
      }
    }

    doc.save('scholarai_presentation.pdf');
    toast({title: "PDF Downloaded", description: "Presentation PDF has been saved."});
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
            <CardDescription>Generate code, images, diagrams, and presentations.</CardDescription>
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
                <CardTitle className="font-headline text-xl text-accent flex items-center"><ImageIconLucide className="mr-2 h-6 w-6"/>Image Generator</CardTitle>
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
                    <Image src={generatedImageUrl} alt="Generated by AI" width={512} height={512} className="rounded-md border shadow-md object-contain" />
                  </div>
                )}
                 {!generatedImageUrl && !isGeneratingImage && (
                     <div className="text-center text-muted-foreground py-4">
                        <ImageIconLucide className="mx-auto h-12 w-12 text-muted-foreground/50" />
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
                    <Image src={generatedDiagramUrl} alt="Diagram generated by AI" width={512} height={512} className="rounded-md border shadow-md object-contain" />
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
                <CardTitle className="font-headline text-xl text-accent flex items-center"><PresentationIcon className="mr-2 h-6 w-6"/>Presentation Generator</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input placeholder="Presentation Topic (e.g., 'The Future of AI')" value={presentationTopic} onChange={(e) => setPresentationTopic(e.target.value)} disabled={isGeneratingPresentation} />
                <Input type="number" placeholder="Number of Slides (e.g., 3, default 3)" value={numSlides} onChange={(e) => setNumSlides(e.target.value)} disabled={isGeneratingPresentation} min="1" max="7" />
                 <p className="text-xs text-muted-foreground">Note: Generating presentations with images can be slow. Start with 2-3 slides. Max 7 slides.</p>
                <div className="flex flex-wrap gap-2">
                  <Button onClick={handleGeneratePresentation} disabled={isGeneratingPresentation || !presentationTopic.trim()} className="flex-grow sm:flex-grow-0">
                    {isGeneratingPresentation && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Generate Presentation
                  </Button>
                  {generatedPresentation && (
                    <Button onClick={handleDownloadPresentationPdf} variant="outline" className="flex-grow sm:flex-grow-0" disabled={isGeneratingPresentation}>
                      <Download className="mr-2 h-4 w-4" />
                      Download PDF
                    </Button>
                  )}
                </div>
                {generatedPresentation && (
                  <div className="mt-4 p-4 bg-muted rounded-md max-h-[600px] overflow-y-auto">
                    <h4 className="font-semibold mb-2 text-foreground">Generated Presentation:</h4>
                    {generatedPresentation.title && <h5 className="text-xl font-bold text-primary mb-4 text-center">{generatedPresentation.title}</h5>}
                    {generatedPresentation.slides.map((slide, index) => (
                      <div key={index} className="mb-6 p-4 bg-background/70 rounded-lg shadow">
                        <h6 className="font-semibold text-lg text-accent">{index + 1}. {slide.title}</h6>
                        <ul className="list-disc list-inside ml-4 my-2 text-sm text-foreground">
                          {slide.bulletPoints.map((point, pIndex) => (
                            <li key={pIndex} className="mb-1">{point}</li>
                          ))}
                        </ul>
                        {slide.imageUrl && (
                           <div className="mt-3 p-2 border border-primary/20 rounded-md bg-primary/5">
                             <p className="text-xs text-primary font-medium flex items-center mb-2">
                               <ImageIconLucide className="mr-1.5 h-4 w-4 text-primary/80" />
                               Generated Image for this slide:
                             </p>
                             <Image src={slide.imageUrl} alt={`AI generated for ${slide.title}`} width={300} height={200} className="rounded-md border shadow-sm object-contain mx-auto" />
                           </div>
                        )}
                        {!slide.imageUrl && slide.suggestedImageDescription && (
                           <div className="mt-2 p-2 bg-primary/10 rounded">
                             <p className="text-xs text-primary font-medium flex items-center">
                               <Lightbulb className="mr-1.5 h-3.5 w-3.5 text-primary/80" />
                               Suggested Image Idea: <span className="italic ml-1 text-primary/90">{slide.suggestedImageDescription}</span>
                                (Image not generated)
                             </p>
                           </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                 {!generatedPresentation && !isGeneratingPresentation && (
                     <div className="text-center text-muted-foreground py-4">
                        <PresentationIcon className="mx-auto h-12 w-12 text-muted-foreground/50" />
                        <p>Your generated presentation (outline and images) will appear here.</p>
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

// Helper type for the SlideSchema if needed directly in the component, though it's usually imported
// export type SlideSchema = GeneratePresentationOutput['slides'][number];

