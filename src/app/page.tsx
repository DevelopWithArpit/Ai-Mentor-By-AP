
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
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RefreshCcw, Sparkles, Code, Image as ImageIconLucide, Presentation as PresentationIcon, Wand2, Brain, FileText, Loader2, Lightbulb, Download, Palette, Info } from 'lucide-react'; // Renamed ImageIcon to avoid conflict
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

interface PdfTheme {
  titleFont: string;
  titleStyle: 'normal' | 'bold' | 'italic' | 'bolditalic';
  titleColor: [number, number, number]; // RGB
  bodyFont: string;
  bodyStyle: 'normal' | 'bold' | 'italic' | 'bolditalic';
  bodyColor: [number, number, number]; // RGB
  bulletColor: [number, number, number]; // RGB
  accentColor?: [number, number, number]; // RGB for things like slide numbers
}

const pdfThemes: Record<string, PdfTheme> = {
  default: {
    titleFont: 'helvetica',
    titleStyle: 'bold',
    titleColor: [0, 0, 0], // Black
    bodyFont: 'helvetica',
    bodyStyle: 'normal',
    bodyColor: [50, 50, 50], // Dark Gray
    bulletColor: [0, 0, 0],
    accentColor: [100, 100, 100], // Medium Gray
  },
  professional: {
    titleFont: 'times',
    titleStyle: 'bold',
    titleColor: [0, 51, 102], // Dark Blue
    bodyFont: 'times',
    bodyStyle: 'normal',
    bodyColor: [30, 30, 30], // Very Dark Gray
    bulletColor: [0, 51, 102],
    accentColor: [0, 51, 102],
  },
  creative: {
    titleFont: 'courier',
    titleStyle: 'bolditalic',
    titleColor: [102, 0, 102], // Purple
    bodyFont: 'courier',
    bodyStyle: 'normal',
    bodyColor: [70, 70, 70], // Gray
    bulletColor: [102, 0, 102],
    accentColor: [102, 0, 102],
  },
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
  const [presentationTheme, setPresentationTheme] = useState<string>('default');
  const [imageStylePrompt, setImageStylePrompt] = useState<string>('');
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
    toast({ title: "Generating Presentation...", description: "This may take a moment, especially with images and styles." });
    try {
      const numSlidesParsed = parseInt(numSlides, 10);
      const input: GeneratePresentationInput = { 
        topic: presentationTopic, 
        numSlides: isNaN(numSlidesParsed) ? 3 : numSlidesParsed, // Default to 3 if NaN
        imageStylePrompt: imageStylePrompt || undefined,
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

  const handleDownloadPresentationPdf = async (themeKey: string) => {
    if (!generatedPresentation) return;

    const theme = pdfThemes[themeKey] || pdfThemes.default;
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
        return true; 
      }
      return false; 
    };
    
    // Presentation Title
    if (generatedPresentation.title) {
      doc.setFont(theme.titleFont, theme.titleStyle);
      doc.setFontSize(22);
      doc.setTextColor(theme.titleColor[0], theme.titleColor[1], theme.titleColor[2]);
      const titleLines = doc.splitTextToSize(generatedPresentation.title, maxTextWidth);
      const titleHeight = doc.getTextDimensions(titleLines).h;
      addNewPageIfNeeded(titleHeight);
      doc.text(titleLines, pageWidth / 2, currentY, { align: 'center' });
      currentY += titleHeight + 12;
    }

    for (let i = 0; i < generatedPresentation.slides.length; i++) {
      const slide = generatedPresentation.slides[i];
      
      if (i > 0 || (i === 0 && !generatedPresentation.title)) { 
        currentY += 8; 
        addNewPageIfNeeded(40); 
      }
      if (i === 0 && generatedPresentation.title){ 
         // currentY is already advanced
      } else if (i > 0){
        doc.addPage();
        currentY = margin;
      }
      
      // Slide Number
      doc.setFont(theme.bodyFont, 'normal');
      doc.setFontSize(10);
      if(theme.accentColor) doc.setTextColor(theme.accentColor[0], theme.accentColor[1], theme.accentColor[2]);
      else doc.setTextColor(pdfThemes.default.accentColor[0], pdfThemes.default.accentColor[1], pdfThemes.default.accentColor[2]);
      const slideNumberText = `Slide ${i + 1}`;
      doc.text(slideNumberText, pageWidth - margin - doc.getTextWidth(slideNumberText), currentY);


      // Slide Title
      doc.setFont(theme.titleFont, theme.titleStyle);
      doc.setFontSize(18);
      doc.setTextColor(theme.titleColor[0], theme.titleColor[1], theme.titleColor[2]);
      const slideTitle = `${slide.title}`;
      let lines = doc.splitTextToSize(slideTitle, maxTextWidth);
      let textBlockHeight = doc.getTextDimensions(lines).h;
      addNewPageIfNeeded(textBlockHeight);
      doc.text(lines, margin, currentY);
      currentY += textBlockHeight + 8;

      // Bullet Points
      doc.setFont(theme.bodyFont, theme.bodyStyle);
      doc.setFontSize(12);
      doc.setTextColor(theme.bodyColor[0], theme.bodyColor[1], theme.bodyColor[2]);
      for (const point of slide.bulletPoints) {
        const bulletPointText = `• ${point}`; 
        lines = doc.splitTextToSize(bulletPointText, maxTextWidth - 8); 
        textBlockHeight = doc.getTextDimensions(lines).h;
        if (addNewPageIfNeeded(textBlockHeight + 3)) { 
           doc.setFont(theme.bodyFont, theme.bodyStyle);
           doc.setFontSize(12);
           doc.setTextColor(theme.bodyColor[0], theme.bodyColor[1], theme.bodyColor[2]);
        }
        doc.setTextColor(theme.bulletColor[0], theme.bulletColor[1], theme.bulletColor[2]);
        doc.text(lines, margin + 5, currentY);
        doc.setTextColor(theme.bodyColor[0], theme.bodyColor[1], theme.bodyColor[2]); 
        currentY += textBlockHeight + 4;
      }

      // Image (if exists)
      if (slide.imageUrl) {
        currentY += 6; 
        const IMAGE_MAX_WIDTH = maxTextWidth * 0.9; 
        const IMAGE_MAX_HEIGHT = pageHeight * 0.45; 

        try {
            const imgProps = doc.getImageProperties(slide.imageUrl);
            let imgWidth = imgProps.width;
            let imgHeight = imgProps.height;
            const aspectRatio = imgWidth / imgHeight;

            if (imgWidth > IMAGE_MAX_WIDTH) {
                imgWidth = IMAGE_MAX_WIDTH;
                imgHeight = imgWidth / aspectRatio;
            }
            if (imgHeight > IMAGE_MAX_HEIGHT) {
                imgHeight = IMAGE_MAX_HEIGHT;
                imgWidth = imgHeight * aspectRatio;
            }
            if (imgWidth > IMAGE_MAX_WIDTH) {
                imgWidth = IMAGE_MAX_WIDTH;
                imgHeight = imgWidth / aspectRatio;
            }

            if (addNewPageIfNeeded(imgHeight + 10)) { 
                doc.addImage(slide.imageUrl, 'PNG', margin + (maxTextWidth - imgWidth)/2 , currentY, imgWidth, imgHeight);
                currentY += imgHeight + 10;
            } else {
                 doc.addImage(slide.imageUrl, 'PNG', margin + (maxTextWidth - imgWidth)/2, currentY, imgWidth, imgHeight);
                 currentY += imgHeight + 10;
            }

        } catch (e) {
          console.error("Error adding image to PDF:", e);
          doc.setFont(theme.bodyFont, 'italic');
          doc.setFontSize(10);
          doc.setTextColor(theme.bodyColor[0], theme.bodyColor[1], theme.bodyColor[2]);
          lines = doc.splitTextToSize("[Image embedding failed for this slide]", maxTextWidth);
          textBlockHeight = doc.getTextDimensions(lines).h;
          addNewPageIfNeeded(textBlockHeight);
          doc.text(lines, margin, currentY);
          currentY += textBlockHeight + 7;
        }
      } else if (slide.suggestedImageDescription) { 
        currentY += 4; 
        doc.setFont(theme.bodyFont, 'italic');
        doc.setFontSize(10);
        doc.setTextColor(theme.bodyColor[0], theme.bodyColor[1], theme.bodyColor[2]);
        const suggestionText = `Suggested Image: ${slide.suggestedImageDescription}`;
        lines = doc.splitTextToSize(suggestionText, maxTextWidth);
        textBlockHeight = doc.getTextDimensions(lines).h;
        addNewPageIfNeeded(textBlockHeight);
        doc.text(lines, margin, currentY);
        currentY += textBlockHeight + 7;
      }
    }

    doc.save(`scholarai_presentation_${themeKey}.pdf`);
    toast({title: "PDF Downloaded", description: `Presentation PDF with ${themeKey} theme has been saved.`});
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
            <CardDescription>Generate code, images, diagrams, and presentations. Download presentations as themed PDFs.</CardDescription>
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
                 <CardDescription>
                  Create presentation outlines with AI-generated images for each slide.
                  You can influence image style with an optional prompt and download the result as a themed PDF.
                  Transitions and animations are not supported in PDF format.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input placeholder="Presentation Topic (e.g., 'The Future of AI')" value={presentationTopic} onChange={(e) => setPresentationTopic(e.target.value)} disabled={isGeneratingPresentation} />
                <Input type="number" placeholder="Number of Slides (e.g., 3, default 3)" value={numSlides} onChange={(e) => setNumSlides(e.target.value)} disabled={isGeneratingPresentation} min="1" max="7" />
                <Input placeholder="Image Style Prompt (Optional, e.g., 'watercolor', 'photorealistic')" value={imageStylePrompt} onChange={(e) => setImageStylePrompt(e.target.value)} disabled={isGeneratingPresentation} />
                
                <div className="space-y-2">
                  <Label htmlFor="presentation-theme-select" className="text-md font-medium text-foreground flex items-center">
                    <Palette className="mr-2 h-5 w-5 text-primary" />
                    PDF Theme
                  </Label>
                  <Select
                    value={presentationTheme}
                    onValueChange={setPresentationTheme}
                    disabled={isGeneratingPresentation}
                  >
                    <SelectTrigger id="presentation-theme-select" className="w-full sm:w-[200px] bg-card focus:ring-primary">
                      <SelectValue placeholder="Select PDF theme" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(pdfThemes).map((themeKey) => (
                        <SelectItem key={themeKey} value={themeKey} className="capitalize">
                          {themeKey}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                 <p className="text-xs text-muted-foreground">Note: Generating presentations with images can be slow. Start with 2-3 slides. Max 7 slides. PDF theming applies to downloaded file.</p>
                 <div className="flex items-center text-xs text-muted-foreground bg-muted/50 p-2 rounded-md">
                    <Info className="mr-2 h-4 w-4 text-primary shrink-0" />
                    <span>Slide transitions and animations are features of presentation software and cannot be included in the PDF download.</span>
                 </div>
                <div className="flex flex-wrap gap-2">
                  <Button onClick={handleGeneratePresentation} disabled={isGeneratingPresentation || !presentationTopic.trim()} className="flex-grow sm:flex-grow-0">
                    {isGeneratingPresentation && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Generate Presentation
                  </Button>
                  {generatedPresentation && (
                    <Button onClick={() => handleDownloadPresentationPdf(presentationTheme)} variant="outline" className="flex-grow sm:flex-grow-0" disabled={isGeneratingPresentation}>
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
                               Generated Image for this slide (style: {imageStylePrompt || 'default'}):
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

    
