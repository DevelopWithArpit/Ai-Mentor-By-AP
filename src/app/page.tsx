
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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { RefreshCcw, Sparkles, Code, Image as ImageIconLucide, Presentation as PresentationIcon, Wand2, Brain, FileText, Loader2, Lightbulb, Download, Palette, Info, Briefcase, MessageSquareQuote, CheckCircle, Edit3, FileSearch, GraduationCap, Copy, Share2, Send, FileType, Star } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import Image from 'next/image';
import jsPDF from 'jspdf';

import { smartSearch, type SmartSearchInput, type SmartSearchOutput } from '@/ai/flows/smart-search';
import { explainAnswer, type ExplainAnswerInput, type ExplainAnswerOutput } from '@/ai/flows/ai-explanation';
import { generateCode, type GenerateCodeInput, type GenerateCodeOutput } from '@/ai/flows/code-generator-flow';
import { wrappedGenerateImage, type GenerateImageInput, type GenerateImageOutput } from '@/ai/flows/image-generator-flow';
import { wrappedGenerateDiagram, type GenerateDiagramInput, type GenerateDiagramOutput } from '@/ai/flows/diagram-generator-flow';
import { generatePresentationOutline, type GeneratePresentationInput, type GeneratePresentationOutput } from '@/ai/flows/presentation-generator-flow';
import { generateInterviewQuestions, type GenerateInterviewQuestionsInput, type GenerateInterviewQuestionsOutput, type QuestionCategory } from '@/ai/flows/interview-question-generator-flow';
import { getResumeFeedback, type ResumeFeedbackInput, type ResumeFeedbackOutput } from '@/ai/flows/resume-feedback-flow';
import { generateCoverLetter, type GenerateCoverLetterInput, type GenerateCoverLetterOutput } from '@/ai/flows/cover-letter-assistant-flow';
import { suggestCareerPaths, type SuggestCareerPathsInput, type SuggestCareerPathsOutput } from '@/ai/flows/career-path-suggester-flow';
import { summarizeDocument, type SummarizeDocumentInput, type SummarizeDocumentOutput } from '@/ai/flows/document-summarizer-flow';


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
  titleColor: [number, number, number];
  bodyFont: string;
  bodyStyle: 'normal' | 'bold' | 'italic' | 'bolditalic';
  bodyColor: [number, number, number];
  bulletColor: [number, number, number];
  accentColor?: [number, number, number];
}

const pdfThemes: Record<string, PdfTheme> = {
  default: { titleFont: 'helvetica', titleStyle: 'bold', titleColor: [0, 0, 0], bodyFont: 'helvetica', bodyStyle: 'normal', bodyColor: [50, 50, 50], bulletColor: [0, 0, 0], accentColor: [100, 100, 100] },
  professional: { titleFont: 'times', titleStyle: 'bold', titleColor: [0, 51, 102], bodyFont: 'times', bodyStyle: 'normal', bodyColor: [30, 30, 30], bulletColor: [0, 51, 102], accentColor: [0, 51, 102] },
  creative: { titleFont: 'courier', titleStyle: 'bolditalic', titleColor: [102, 0, 102], bodyFont: 'courier', bodyStyle: 'normal', bodyColor: [70, 70, 70], bulletColor: [102, 0, 102], accentColor: [102, 0, 102] },
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
  const [numSlides, setNumSlides] = useState<string>('3');
  const [presentationTheme, setPresentationTheme] = useState<string>('default');
  const [imageStylePrompt, setImageStylePrompt] = useState<string>('');
  const [generatedPresentation, setGeneratedPresentation] = useState<GeneratePresentationOutput | null>(null);
  const [isGeneratingPresentation, setIsGeneratingPresentation] = useState<boolean>(false);

  // Interview Prep States
  const [interviewJobRole, setInterviewJobRole] = useState<string>('');
  const [interviewNumQuestions, setInterviewNumQuestions] = useState<string>('5');
  const [interviewQuestionCategory, setInterviewQuestionCategory] = useState<QuestionCategory>('any');
  const [generatedInterviewQuestions, setGeneratedInterviewQuestions] = useState<GenerateInterviewQuestionsOutput | null>(null);
  const [isGeneratingInterviewQuestions, setIsGeneratingInterviewQuestions] = useState<boolean>(false);

  // Resume Feedback States
  const [resumeText, setResumeText] = useState<string>('');
  const [resumeTargetJobRole, setResumeTargetJobRole] = useState<string>('');
  const [resumeFeedback, setResumeFeedback] = useState<ResumeFeedbackOutput | null>(null);
  const [isGeneratingResumeFeedback, setIsGeneratingResumeFeedback] = useState<boolean>(false);

  // Cover Letter Assistant States
  const [coverLetterJobDesc, setCoverLetterJobDesc] = useState<string>('');
  const [coverLetterUserInfo, setCoverLetterUserInfo] = useState<string>('');
  const [coverLetterTone, setCoverLetterTone] = useState<"professional" | "enthusiastic" | "formal" | "slightly-informal">("professional");
  const [generatedCoverLetter, setGeneratedCoverLetter] = useState<GenerateCoverLetterOutput | null>(null);
  const [isGeneratingCoverLetter, setIsGeneratingCoverLetter] = useState<boolean>(false);

  // Career Path Suggester States
  const [careerInterests, setCareerInterests] = useState<string>(''); // Comma-separated
  const [careerSkills, setCareerSkills] = useState<string>(''); // Comma-separated
  const [careerExperienceLevel, setCareerExperienceLevel] = useState<"entry-level" | "mid-level" | "senior-level" | "executive">("entry-level");
  const [generatedCareerPaths, setGeneratedCareerPaths] = useState<SuggestCareerPathsOutput | null>(null);
  const [isGeneratingCareerPaths, setIsGeneratingCareerPaths] = useState<boolean>(false);

  // Document Summarizer States
  const [summarizerFile, setSummarizerFile] = useState<File | null>(null);
  const [summaryLength, setSummaryLength] = useState<"short" | "medium" | "long">("medium");
  const [summaryStyle, setSummaryStyle] = useState<"general" | "bullet_points" | "for_layperson" | "for_expert">("general");
  const [summaryCustomPrompt, setSummaryCustomPrompt] = useState<string>('');
  const [generatedSummary, setGeneratedSummary] = useState<SummarizeDocumentOutput | null>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState<boolean>(false);


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
    setIsLoading(true); setError(null); setSearchResult(null); setExplanation(null);
    try {
      const documentDataUriForFlow = selectedFile ? await fileToDataUri(selectedFile) : undefined;
      const searchInput: SmartSearchInput = { documentDataUri: documentDataUriForFlow, question };
      const result = await smartSearch(searchInput);
      setSearchResult(result);
      if (result?.answer) {
        const explainerResult = await explainAnswer({ question, answer: result.answer });
        setExplanation(explainerResult.explanation);
        toast({ title: "ScholarAI Success!", description: "Insights generated successfully." });
      } else {
        toast({ title: "Search complete", description: selectedFile ? "Could not find a direct answer in the document." : "I couldn't find an answer to your question." });
      }
    } catch (err: any) {
      const errorMessage = err.message || 'An unexpected error occurred.';
      setError(errorMessage);
      toast({ title: "ScholarAI Error", description: errorMessage, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleResetScholarAI = () => {
    setSelectedFile(null); setQuestion(''); setSearchResult(null); setExplanation(null); setError(null); setIsLoading(false);
    const fileInput = document.getElementById('file-upload-input') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
    toast({ title: "Cleared", description: "ScholarAI inputs and results have been cleared." });
  };

  const handleGenerateCode = async () => {
    if (!codePrompt.trim()) { toast({ title: "Error", description: "Please enter a code description.", variant: "destructive" }); return; }
    setIsGeneratingCode(true); setGeneratedCode(null);
    try {
      const result = await generateCode({ description: codePrompt, language: codeLanguage || undefined });
      setGeneratedCode(result.generatedCode);
      toast({ title: "Code Generated!", description: "Code snippet has been generated." });
    } catch (err: any) { toast({ title: "Code Generation Error", description: err.message || "Failed to generate code.", variant: "destructive" }); }
    finally { setIsGeneratingCode(false); }
  };

  const handleGenerateImage = async () => {
    if (!imagePrompt.trim()) { toast({ title: "Error", description: "Please enter an image prompt.", variant: "destructive" }); return; }
    setIsGeneratingImage(true); setGeneratedImageUrl(null);
    try {
      const result = await wrappedGenerateImage({ prompt: imagePrompt });
      setGeneratedImageUrl(result.imageUrl);
      toast({ title: "Image Generated!", description: "Image has been generated successfully." });
    } catch (err: any) { toast({ title: "Image Generation Error", description: err.message || "Failed to generate image.", variant: "destructive" }); }
    finally { setIsGeneratingImage(false); }
  };

  const handleGenerateDiagram = async () => {
    if (!diagramPrompt.trim()) { toast({ title: "Error", description: "Please enter a diagram description.", variant: "destructive" }); return; }
    setIsGeneratingDiagram(true); setGeneratedDiagramUrl(null);
    try {
      const result = await wrappedGenerateDiagram({ prompt: diagramPrompt });
      setGeneratedDiagramUrl(result.diagramImageUrl);
      toast({ title: "Diagram Generated!", description: "Diagram has been generated." });
    } catch (err: any) { toast({ title: "Diagram Generation Error", description: err.message || "Failed to generate diagram.", variant: "destructive" }); }
    finally { setIsGeneratingDiagram(false); }
  };

  const handleGeneratePresentation = async () => {
    if (!presentationTopic.trim()) { toast({ title: "Error", description: "Please enter a presentation topic.", variant: "destructive" }); return; }
    setIsGeneratingPresentation(true); setGeneratedPresentation(null);
    toast({ title: "Generating Presentation...", description: "This may take a moment, especially with images and styles." });
    try {
      const numSlidesParsed = parseInt(numSlides, 10);
      const result = await generatePresentationOutline({ topic: presentationTopic, numSlides: isNaN(numSlidesParsed) ? 3 : numSlidesParsed, imageStylePrompt: imageStylePrompt || undefined });
      setGeneratedPresentation(result);
      toast({ title: "Presentation Generated!", description: "Outline and images created successfully." });
    } catch (err: any) { toast({ title: "Presentation Generation Error", description: err.message || "Failed to generate presentation.", variant: "destructive" }); }
    finally { setIsGeneratingPresentation(false); }
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
      if (currentY + neededHeight > pageHeight - margin) { doc.addPage(); currentY = margin; return true; } return false;
    };
    
    if (generatedPresentation.title) {
      doc.setFont(theme.titleFont, theme.titleStyle); doc.setFontSize(22); doc.setTextColor(theme.titleColor[0], theme.titleColor[1], theme.titleColor[2]);
      const titleLines = doc.splitTextToSize(generatedPresentation.title, maxTextWidth);
      const titleHeight = doc.getTextDimensions(titleLines).h;
      addNewPageIfNeeded(titleHeight);
      doc.text(titleLines, pageWidth / 2, currentY, { align: 'center' });
      currentY += titleHeight + 10;
    }

    if (imageStylePrompt?.trim()) {
        doc.setFont(theme.bodyFont, 'italic'); doc.setFontSize(10); doc.setTextColor(theme.bodyColor[0], theme.bodyColor[1], theme.bodyColor[2]);
        const stylePromptText = `Overall Image Style Applied: ${imageStylePrompt.trim()}`;
        let lines = doc.splitTextToSize(stylePromptText, maxTextWidth);
        let textBlockHeight = doc.getTextDimensions(lines).h;
        if (addNewPageIfNeeded(textBlockHeight + 5)) { /* Font might need to be reset if new page */ doc.setFont(theme.bodyFont, 'italic'); doc.setFontSize(10); doc.setTextColor(theme.bodyColor[0], theme.bodyColor[1], theme.bodyColor[2]); }
        doc.text(lines, margin, currentY);
        currentY += textBlockHeight + 7; 
    }

    for (let i = 0; i < generatedPresentation.slides.length; i++) {
      const slide = generatedPresentation.slides[i];
      if (i > 0 || (i === 0 && (!generatedPresentation.title && !imageStylePrompt?.trim()))) { 
         if (i > 0) { doc.addPage(); currentY = margin; } 
         else if (currentY <= margin + 5 && !generatedPresentation.title && !imageStylePrompt?.trim() ) { /* no-op, likely first element on page */ } 
         else { if(!addNewPageIfNeeded(40) && currentY > margin + 20) { doc.addPage(); currentY = margin; } else { currentY +=8; } } // Add space or new page if needed
      } else if (i === 0 && (generatedPresentation.title || imageStylePrompt?.trim())){ // If there was a title or style prompt, check if enough space for first slide
         if (pageHeight - currentY < pageHeight * 0.4) { doc.addPage(); currentY = margin; } else { currentY += 5; } // Add some space
      }
      
      doc.setFont(theme.bodyFont, 'normal'); doc.setFontSize(10); 
      if(theme.accentColor) doc.setTextColor(theme.accentColor[0], theme.accentColor[1], theme.accentColor[2]);
      else doc.setTextColor(pdfThemes.default.accentColor![0], pdfThemes.default.accentColor![1], pdfThemes.default.accentColor![2]);
      const slideNumberText = `Slide ${i + 1}`;
      doc.text(slideNumberText, pageWidth - margin - doc.getTextWidth(slideNumberText), currentY); // Slide number top-right

      doc.setFont(theme.titleFont, theme.titleStyle); doc.setFontSize(18); doc.setTextColor(theme.titleColor[0], theme.titleColor[1], theme.titleColor[2]);
      let lines = doc.splitTextToSize(slide.title, maxTextWidth);
      let textBlockHeight = doc.getTextDimensions(lines).h;
      if(addNewPageIfNeeded(textBlockHeight + 8)) {
          // Reset font if new page was added
          doc.setFont(theme.titleFont, theme.titleStyle); doc.setFontSize(18); doc.setTextColor(theme.titleColor[0], theme.titleColor[1], theme.titleColor[2]);
      }
      doc.text(lines, margin, currentY);
      currentY += textBlockHeight + 8;

      doc.setFont(theme.bodyFont, theme.bodyStyle); doc.setFontSize(12); doc.setTextColor(theme.bodyColor[0], theme.bodyColor[1], theme.bodyColor[2]);
      for (const point of slide.bulletPoints) {
        lines = doc.splitTextToSize(`• ${point}`, maxTextWidth - 8); // Indent bullet points slightly
        textBlockHeight = doc.getTextDimensions(lines).h;
        if (addNewPageIfNeeded(textBlockHeight + 4)) { 
           // Reset font and color if new page was added
           doc.setFont(theme.bodyFont, theme.bodyStyle); doc.setFontSize(12); doc.setTextColor(theme.bulletColor[0], theme.bulletColor[1], theme.bulletColor[2]);
        } else { doc.setTextColor(theme.bulletColor[0], theme.bulletColor[1], theme.bulletColor[2]); } // Set bullet color
        doc.text(lines, margin + 5, currentY); // x-offset for bullet point
        doc.setTextColor(theme.bodyColor[0], theme.bodyColor[1], theme.bodyColor[2]); // Reset to body color for next point if not new page
        currentY += textBlockHeight + 4;
      }

      if (slide.imageUrl) {
        currentY += 6; // Space before image
        const IMAGE_MAX_WIDTH = maxTextWidth * 0.9; const IMAGE_MAX_HEIGHT = pageHeight * 0.45; // Max image dimensions
        try {
            const imgProps = doc.getImageProperties(slide.imageUrl);
            let imgWidth = imgProps.width; let imgHeight = imgProps.height; const aspectRatio = imgWidth / imgHeight;
            if (imgWidth > IMAGE_MAX_WIDTH) { imgWidth = IMAGE_MAX_WIDTH; imgHeight = imgWidth / aspectRatio; }
            if (imgHeight > IMAGE_MAX_HEIGHT) { imgHeight = IMAGE_MAX_HEIGHT; imgWidth = imgHeight * aspectRatio; }
            if (imgWidth > IMAGE_MAX_WIDTH) { imgWidth = IMAGE_MAX_WIDTH; imgHeight = imgWidth / aspectRatio; } // Recheck width constraint

            if (addNewPageIfNeeded(imgHeight + 10)) { // Check if image fits, add new page if not
                doc.addImage(slide.imageUrl, 'PNG', margin + (maxTextWidth - imgWidth)/2 , currentY, imgWidth, imgHeight);
            } else { doc.addImage(slide.imageUrl, 'PNG', margin + (maxTextWidth - imgWidth)/2, currentY, imgWidth, imgHeight); } // Center image
            currentY += imgHeight + 10; // Space after image
        } catch (e) {
          console.error("Error adding image to PDF:", e);
          doc.setFont(theme.bodyFont, 'italic'); doc.setFontSize(10); doc.setTextColor(theme.bodyColor[0], theme.bodyColor[1], theme.bodyColor[2]);
          lines = doc.splitTextToSize("[Image embedding failed or image format not supported by jsPDF]", maxTextWidth); textBlockHeight = doc.getTextDimensions(lines).h;
          addNewPageIfNeeded(textBlockHeight + 7); doc.text(lines, margin, currentY); currentY += textBlockHeight + 7;
        }
      } else if (slide.suggestedImageDescription) { // Fallback if no image URL but description exists
        currentY += 4; doc.setFont(theme.bodyFont, 'italic'); doc.setFontSize(10); doc.setTextColor(theme.bodyColor[0], theme.bodyColor[1], theme.bodyColor[2]);
        lines = doc.splitTextToSize(`Suggested Image Idea: ${slide.suggestedImageDescription}`, maxTextWidth);
        textBlockHeight = doc.getTextDimensions(lines).h;
        addNewPageIfNeeded(textBlockHeight + 7); doc.text(lines, margin, currentY); currentY += textBlockHeight + 7;
      }
    }
    doc.save(`scholarai_presentation_${themeKey}.pdf`);
    toast({title: "PDF Downloaded", description: `Presentation PDF with ${themeKey} theme has been saved.`});
  };

  const handleGenerateInterviewQuestions = async () => {
    if (!interviewJobRole.trim()) { toast({ title: "Error", description: "Please enter a job role or topic.", variant: "destructive" }); return; }
    setIsGeneratingInterviewQuestions(true); setGeneratedInterviewQuestions(null);
    try {
      const numQs = parseInt(interviewNumQuestions, 10) || 5;
      const result = await generateInterviewQuestions({ jobRoleOrTopic: interviewJobRole, numQuestions: numQs, questionCategory: interviewQuestionCategory });
      setGeneratedInterviewQuestions(result);
      toast({ title: "Interview Questions Generated!", description: "Questions are ready for practice." });
    } catch (err: any) { toast({ title: "Question Generation Error", description: err.message || "Failed to generate questions.", variant: "destructive" }); }
    finally { setIsGeneratingInterviewQuestions(false); }
  };

  const handleGetResumeFeedback = async () => {
    if (!resumeText.trim()) { toast({ title: "Error", description: "Please paste your resume text.", variant: "destructive" }); return; }
    setIsGeneratingResumeFeedback(true); setResumeFeedback(null);
    try {
      const result = await getResumeFeedback({ resumeText, targetJobRole: resumeTargetJobRole || undefined });
      setResumeFeedback(result);
      toast({ title: "Resume Feedback Ready!", description: "Suggestions for your resume have been generated." });
    } catch (err: any) { toast({ title: "Resume Feedback Error", description: err.message || "Failed to get feedback.", variant: "destructive" }); }
    finally { setIsGeneratingResumeFeedback(false); }
  };

  const handleGenerateCoverLetter = async () => {
    if (!coverLetterJobDesc.trim() || !coverLetterUserInfo.trim()) {
      toast({ title: "Error", description: "Please provide both Job Description and Your Information.", variant: "destructive" }); return;
    }
    setIsGeneratingCoverLetter(true); setGeneratedCoverLetter(null);
    try {
      const result = await generateCoverLetter({ jobDescription: coverLetterJobDesc, userInformation: coverLetterUserInfo, tone: coverLetterTone });
      setGeneratedCoverLetter(result);
      toast({ title: "Cover Letter Drafted!", description: "Your cover letter is ready for review." });
    } catch (err: any) { toast({ title: "Cover Letter Error", description: err.message || "Failed to generate cover letter.", variant: "destructive" }); }
    finally { setIsGeneratingCoverLetter(false); }
  };

  const handleGenerateCareerPaths = async () => {
    if (!careerInterests.trim() || !careerSkills.trim()) {
      toast({ title: "Error", description: "Please provide both Interests and Skills.", variant: "destructive" }); return;
    }
    setIsGeneratingCareerPaths(true); setGeneratedCareerPaths(null);
    try {
      const interestsArray = careerInterests.split(',').map(s => s.trim()).filter(s => s);
      const skillsArray = careerSkills.split(',').map(s => s.trim()).filter(s => s);
      if (!interestsArray.length || !skillsArray.length) {
        toast({ title: "Error", description: "Please provide valid comma-separated Interests and Skills.", variant: "destructive" });
        setIsGeneratingCareerPaths(false);
        return;
      }
      const result = await suggestCareerPaths({ interests: interestsArray, skills: skillsArray, experienceLevel: careerExperienceLevel });
      setGeneratedCareerPaths(result);
      toast({ title: "Career Paths Suggested!", description: "Potential career paths are ready for exploration." });
    } catch (err: any) { toast({ title: "Career Path Error", description: err.message || "Failed to suggest career paths.", variant: "destructive" }); }
    finally { setIsGeneratingCareerPaths(false); }
  };

  const handleSummarizeDocument = async () => {
    if (!summarizerFile) {
      toast({ title: "Error", description: "Please upload a document to summarize.", variant: "destructive" }); return;
    }
    setIsGeneratingSummary(true); setGeneratedSummary(null);
    try {
      const documentDataUri = await fileToDataUri(summarizerFile);
      const result = await summarizeDocument({ documentDataUri, summaryLength, summaryStyle, customPrompt: summaryCustomPrompt || undefined });
      setGeneratedSummary(result);
      toast({ title: "Document Summarized!", description: "Summary is ready." });
    } catch (err: any) { toast({ title: "Summarization Error", description: err.message || "Failed to summarize document.", variant: "destructive" }); }
    finally { setIsGeneratingSummary(false); }
  };


  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow container mx-auto p-4 md:p-8 space-y-8">
        {/* ScholarAI Document Q&A Section */}
        <Card className="shadow-xl bg-card">
          <CardHeader>
            <CardTitle className="font-headline text-2xl text-primary flex items-center"><Brain className="mr-2 h-7 w-7"/> ScholarAI Document Q&amp;A</CardTitle>
            <CardDescription>Upload a document (PDF, TXT, DOC, DOCX) and ask questions, or ask general questions without a document.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              <div className="lg:col-span-1 space-y-6">
                <FileUpload selectedFile={selectedFile} onFileChange={handleFileChange} isLoading={isLoading} inputId="file-upload-input"/>
                <QuestionInput question={question} onQuestionChange={setQuestion} onSubmit={handleSubmitScholarAI} isLoading={isLoading} isSubmitDisabled={!question.trim()}/>
                <LanguageSelector selectedLanguage={selectedLanguage} onLanguageChange={setSelectedLanguage} isLoading={isLoading}/>
                <Button variant="outline" onClick={handleResetScholarAI} disabled={isLoading} className="w-full"><RefreshCcw className="mr-2 h-4 w-4" /> Clear ScholarAI</Button>
              </div>
              <div className="lg:col-span-2">
                <ResultsDisplay searchResult={searchResult} explanation={explanation} isLoading={isLoading} error={error} language={selectedLanguage} hasDocument={!!selectedFile} question={question}/>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Document Summarizer Section */}
        <Card className="shadow-xl bg-card">
            <CardHeader>
                <CardTitle className="font-headline text-2xl text-primary flex items-center"><FileType className="mr-2 h-7 w-7"/>AI Document Summarizer</CardTitle>
                <CardDescription>Upload a document (PDF, TXT, DOC, DOCX) to get a concise summary. Useful for research papers, articles, and long texts.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <FileUpload selectedFile={summarizerFile} onFileChange={setSummarizerFile} isLoading={isGeneratingSummary} inputId="summarizer-file-upload"/>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="summary-length">Summary Length</Label>
                        <Select value={summaryLength} onValueChange={(v) => setSummaryLength(v as any)} disabled={isGeneratingSummary}>
                            <SelectTrigger id="summary-length"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="short">Short</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="long">Long</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label htmlFor="summary-style">Summary Style</Label>
                        <Select value={summaryStyle} onValueChange={(v) => setSummaryStyle(v as any)} disabled={isGeneratingSummary}>
                            <SelectTrigger id="summary-style"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="general">General</SelectItem>
                                <SelectItem value="bullet_points">Bullet Points</SelectItem>
                                <SelectItem value="for_layperson">For Layperson</SelectItem>
                                <SelectItem value="for_expert">For Expert</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <div>
                    <Label htmlFor="summary-custom-prompt">Custom Instructions (Optional)</Label>
                    <Input id="summary-custom-prompt" placeholder="e.g., Focus on methodology and results" value={summaryCustomPrompt} onChange={(e) => setSummaryCustomPrompt(e.target.value)} disabled={isGeneratingSummary}/>
                </div>
                <Button onClick={handleSummarizeDocument} disabled={isGeneratingSummary || !summarizerFile} className="w-full sm:w-auto">
                    {isGeneratingSummary && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>} Summarize Document
                </Button>
                {generatedSummary && (
                    <div className="mt-4 p-4 bg-muted rounded-md max-h-[500px] overflow-y-auto">
                        <h4 className="font-semibold mb-2 text-foreground">Generated Summary:</h4>
                        <p className="text-sm whitespace-pre-wrap mb-3">{generatedSummary.summary}</p>
                        {generatedSummary.keyTakeaways && generatedSummary.keyTakeaways.length > 0 && (
                            <>
                                <h5 className="font-medium mt-3 mb-1 text-foreground">Key Takeaways:</h5>
                                <ul className="list-disc list-inside text-sm space-y-1">
                                    {generatedSummary.keyTakeaways.map((item, index) => <li key={index}>{item}</li>)}
                                </ul>
                            </>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
        
        {/* AI Interview Question Generator Section */}
        <Card className="shadow-xl bg-card">
            <CardHeader>
                <CardTitle className="font-headline text-2xl text-primary flex items-center"><MessageSquareQuote className="mr-2 h-7 w-7"/>AI Interview Question Generator</CardTitle>
                <CardDescription>Generate targeted interview questions based on job role, topic, and desired category (technical, behavioral, situational).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <Input placeholder="Job Role or Topic (e.g., 'Software Engineer', 'Leadership')" value={interviewJobRole} onChange={(e) => setInterviewJobRole(e.target.value)} disabled={isGeneratingInterviewQuestions} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input type="number" placeholder="Number of Questions (e.g., 5)" value={interviewNumQuestions} onChange={(e) => setInterviewNumQuestions(e.target.value)} disabled={isGeneratingInterviewQuestions} min="1" max="10" />
                    <Select value={interviewQuestionCategory} onValueChange={(value) => setInterviewQuestionCategory(value as QuestionCategory)} disabled={isGeneratingInterviewQuestions}>
                        <SelectTrigger><SelectValue placeholder="Question Category" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="any">Any Category</SelectItem>
                            <SelectItem value="technical">Technical</SelectItem>
                            <SelectItem value="behavioral">Behavioral</SelectItem>
                            <SelectItem value="situational">Situational</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <Button onClick={handleGenerateInterviewQuestions} disabled={isGeneratingInterviewQuestions || !interviewJobRole.trim()} className="w-full sm:w-auto">
                    {isGeneratingInterviewQuestions && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Generate Questions
                </Button>
                {generatedInterviewQuestions && (
                    <div className="mt-4 p-4 bg-muted rounded-md max-h-[400px] overflow-y-auto">
                        <h4 className="font-semibold mb-2 text-foreground">Generated Interview Questions:</h4>
                        <Accordion type="single" collapsible className="w-full">
                            {generatedInterviewQuestions.questions.map((q, index) => (
                            <AccordionItem value={`item-${index}`} key={index}>
                                <AccordionTrigger className="text-sm hover:no-underline text-left">
                                <div className="flex items-start">
                                    <span className={`mr-2 mt-1 h-2 w-2 rounded-full flex-shrink-0 ${q.category.toLowerCase().includes('technical') ? 'bg-blue-500' : q.category.toLowerCase().includes('behavioral') ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                                    {q.question} ({q.category})
                                </div>
                                </AccordionTrigger>
                                <AccordionContent className="text-xs pl-6">
                                <strong>Suggested Approach:</strong> {q.suggestedApproach || "Consider the key aspects of the question and structure your answer clearly."}
                                </AccordionContent>
                            </AccordionItem>
                            ))}
                        </Accordion>
                    </div>
                )}
            </CardContent>
        </Card>

        {/* AI Resume Feedback Tool Section */}
        <Card className="shadow-xl bg-card">
            <CardHeader>
                <CardTitle className="font-headline text-2xl text-primary flex items-center"><Edit3 className="mr-2 h-7 w-7"/>AI Resume Feedback Tool (ATS Optimized)</CardTitle>
                <CardDescription>Paste your resume text to get AI-driven feedback, focusing on ATS keywords and overall effectiveness for job applications.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <Textarea placeholder="Paste your full resume text here..." value={resumeText} onChange={(e) => setResumeText(e.target.value)} disabled={isGeneratingResumeFeedback} className="min-h-[200px]"/>
                <Input placeholder="Target Job Role or Industry (Optional, e.g., 'Data Analyst', 'Healthcare')" value={resumeTargetJobRole} onChange={(e) => setResumeTargetJobRole(e.target.value)} disabled={isGeneratingResumeFeedback} />
                <Button onClick={handleGetResumeFeedback} disabled={isGeneratingResumeFeedback || !resumeText.trim()} className="w-full sm:w-auto">
                    {isGeneratingResumeFeedback && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Get Resume Feedback
                </Button>
                {resumeFeedback && (
                    <div className="mt-4 p-4 bg-muted rounded-md max-h-[500px] overflow-y-auto">
                        <h4 className="font-semibold mb-2 text-foreground">Resume Feedback:</h4>
                        <p className="text-sm mb-3 p-3 bg-background/50 rounded-md"><strong>Overall Assessment:</strong> {resumeFeedback.overallAssessment}</p>
                        {resumeFeedback.atsKeywordsSummary && <p className="text-sm mb-3 p-3 bg-primary/10 text-primary rounded-md"><strong>ATS Keywords Summary:</strong> {resumeFeedback.atsKeywordsSummary}</p>}
                        <Accordion type="single" collapsible className="w-full">
                            {resumeFeedback.feedbackItems.map((item, index) => (
                            <AccordionItem value={`feedback-${index}`} key={index}>
                                <AccordionTrigger className="text-sm hover:no-underline text-left">
                                <div className="flex items-start">
                                    <CheckCircle className={`mr-2 mt-1 h-4 w-4 flex-shrink-0 ${item.importance === 'high' ? 'text-red-500' : item.importance === 'medium' ? 'text-yellow-500' : 'text-green-500'}`}/>
                                    <span><strong>{item.area}</strong> {item.importance && `(${item.importance})`}</span>
                                </div>
                                </AccordionTrigger>
                                <AccordionContent className="text-xs pl-8">
                                {item.suggestion}
                                </AccordionContent>
                            </AccordionItem>
                            ))}
                        </Accordion>
                    </div>
                )}
            </CardContent>
        </Card>

        {/* AI Cover Letter Assistant Section */}
        <Card className="shadow-xl bg-card">
            <CardHeader>
                <CardTitle className="font-headline text-2xl text-primary flex items-center"><Send className="mr-2 h-7 w-7"/>AI Cover Letter Assistant</CardTitle>
                <CardDescription>Generate a tailored cover letter draft. Provide the job description and your key information or resume text.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <Textarea placeholder="Paste the full Job Description here..." value={coverLetterJobDesc} onChange={(e) => setCoverLetterJobDesc(e.target.value)} disabled={isGeneratingCoverLetter} className="min-h-[150px]"/>
                <Textarea placeholder="Paste your resume text or key achievements, skills, and experiences relevant to this job..." value={coverLetterUserInfo} onChange={(e) => setCoverLetterUserInfo(e.target.value)} disabled={isGeneratingCoverLetter} className="min-h-[150px]"/>
                <Select value={coverLetterTone} onValueChange={(v) => setCoverLetterTone(v as any)} disabled={isGeneratingCoverLetter}>
                    <SelectTrigger><SelectValue placeholder="Select Tone" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="professional">Professional</SelectItem>
                        <SelectItem value="enthusiastic">Enthusiastic</SelectItem>
                        <SelectItem value="formal">Formal</SelectItem>
                        <SelectItem value="slightly-informal">Slightly Informal</SelectItem>
                    </SelectContent>
                </Select>
                <Button onClick={handleGenerateCoverLetter} disabled={isGeneratingCoverLetter || !coverLetterJobDesc.trim() || !coverLetterUserInfo.trim()} className="w-full sm:w-auto">
                    {isGeneratingCoverLetter && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>} Generate Cover Letter
                </Button>
                {generatedCoverLetter && (
                    <div className="mt-4 p-4 bg-muted rounded-md max-h-[500px] overflow-y-auto">
                        <h4 className="font-semibold mb-2 text-foreground">Draft Cover Letter:</h4>
                        <pre className="text-sm whitespace-pre-wrap bg-background/50 p-3 rounded-md">{generatedCoverLetter.draftCoverLetter}</pre>
                        {generatedCoverLetter.keyPointsCovered && generatedCoverLetter.keyPointsCovered.length > 0 && (
                            <>
                                <h5 className="font-medium mt-3 mb-1 text-foreground">Key Points Addressed:</h5>
                                <ul className="list-disc list-inside text-xs space-y-1">
                                    {generatedCoverLetter.keyPointsCovered.map((item, index) => <li key={index}>{item}</li>)}
                                </ul>
                            </>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>

        {/* AI Career Path Suggester Section */}
        <Card className="shadow-xl bg-card">
            <CardHeader>
                <CardTitle className="font-headline text-2xl text-primary flex items-center"><Star className="mr-2 h-7 w-7"/>AI Career Path Suggester</CardTitle>
                <CardDescription>Discover potential career paths. Input your interests, skills, and experience level for personalized suggestions.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <Input placeholder="Your Interests (comma-separated, e.g., AI, healthcare, teaching)" value={careerInterests} onChange={(e) => setCareerInterests(e.target.value)} disabled={isGeneratingCareerPaths}/>
                <Input placeholder="Your Skills (comma-separated, e.g., Python, project management, writing)" value={careerSkills} onChange={(e) => setCareerSkills(e.target.value)} disabled={isGeneratingCareerPaths}/>
                <Select value={careerExperienceLevel} onValueChange={(v) => setCareerExperienceLevel(v as any)} disabled={isGeneratingCareerPaths}>
                    <SelectTrigger><SelectValue placeholder="Select Experience Level"/></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="entry-level">Entry-Level</SelectItem>
                        <SelectItem value="mid-level">Mid-Level</SelectItem>
                        <SelectItem value="senior-level">Senior-Level</SelectItem>
                        <SelectItem value="executive">Executive</SelectItem>
                    </SelectContent>
                </Select>
                <Button onClick={handleGenerateCareerPaths} disabled={isGeneratingCareerPaths || !careerInterests.trim() || !careerSkills.trim()} className="w-full sm:w-auto">
                    {isGeneratingCareerPaths && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>} Suggest Career Paths
                </Button>
                {generatedCareerPaths && (
                    <div className="mt-4 p-4 bg-muted rounded-md max-h-[500px] overflow-y-auto">
                        <h4 className="font-semibold mb-2 text-foreground">Suggested Career Paths:</h4>
                        <Accordion type="single" collapsible className="w-full">
                            {generatedCareerPaths.suggestions.map((path, index) => (
                                <AccordionItem value={`career-${index}`} key={index}>
                                    <AccordionTrigger className="text-sm hover:no-underline text-left font-medium">{path.pathTitle}</AccordionTrigger>
                                    <AccordionContent className="text-xs space-y-2 pl-4">
                                        <p><strong>Description:</strong> {path.description}</p>
                                        <p><strong>Why it aligns:</strong> {path.alignmentReason}</p>
                                        {path.potentialSkillsToDevelop && path.potentialSkillsToDevelop.length > 0 && (
                                            <p><strong>Skills to develop:</strong> {path.potentialSkillsToDevelop.join(', ')}</p>
                                        )}
                                        {path.typicalIndustries && path.typicalIndustries.length > 0 && (
                                            <p><strong>Typical Industries:</strong> {path.typicalIndustries.join(', ')}</p>
                                        )}
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </div>
                )}
            </CardContent>
        </Card>

        {/* AI Code Generator Section */}
        <Card className="shadow-xl bg-card">
            <CardHeader>
                <CardTitle className="font-headline text-2xl text-primary flex items-center"><Code className="mr-2 h-7 w-7"/>AI Code Generator</CardTitle>
                <CardDescription>Generate code snippets in various programming languages based on your description.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <Textarea placeholder="Describe the code you want to generate..." value={codePrompt} onChange={(e) => setCodePrompt(e.target.value)} disabled={isGeneratingCode} className="min-h-[80px]"/>
                <Input placeholder="Programming Language (e.g., Python, JavaScript, Java - optional)" value={codeLanguage} onChange={(e) => setCodeLanguage(e.target.value)} disabled={isGeneratingCode} />
                <Button onClick={handleGenerateCode} disabled={isGeneratingCode || !codePrompt.trim()} className="w-full sm:w-auto">
                    {isGeneratingCode && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Generate Code
                </Button>
                {generatedCode && <div className="mt-4 p-4 bg-muted rounded-md"><h4 className="font-semibold mb-2">Generated Code:</h4><pre className="text-sm whitespace-pre-wrap overflow-x-auto bg-background/50 p-3 rounded-md"><code>{generatedCode}</code></pre></div>}
                {!generatedCode && !isGeneratingCode && <div className="text-center text-muted-foreground py-4"><FileText className="mx-auto h-12 w-12 text-muted-foreground/50" /><p>Your generated code will appear here.</p></div>}
            </CardContent>
        </Card>

        {/* AI Image Generator Section */}
        <Card className="shadow-xl bg-card">
            <CardHeader>
                <CardTitle className="font-headline text-2xl text-primary flex items-center"><ImageIconLucide className="mr-2 h-7 w-7"/>AI Image Generator</CardTitle>
                <CardDescription>Create unique images from your text descriptions using generative AI.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <Textarea placeholder="Describe the image you want to create (e.g., 'A cat wearing a wizard hat')..." value={imagePrompt} onChange={(e) => setImagePrompt(e.target.value)} disabled={isGeneratingImage} className="min-h-[80px]"/>
                <Button onClick={handleGenerateImage} disabled={isGeneratingImage || !imagePrompt.trim()} className="w-full sm:w-auto">
                    {isGeneratingImage && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Generate Image
                </Button>
                {generatedImageUrl && <div className="mt-4"><h4 className="font-semibold mb-2">Generated Image:</h4><Image src={generatedImageUrl} alt="Generated by AI" width={512} height={512} className="rounded-md border shadow-md object-contain" /></div>}
                {!generatedImageUrl && !isGeneratingImage && <div className="text-center text-muted-foreground py-4"><ImageIconLucide className="mx-auto h-12 w-12 text-muted-foreground/50" /><p>Your generated image will appear here.</p><img data-ai-hint="abstract creative" src="https://placehold.co/300x200.png" alt="Placeholder" className="mx-auto mt-2 rounded-md opacity-50" /></div>}
            </CardContent>
        </Card>

        {/* AI Diagram Generator Section */}
        <Card className="shadow-xl bg-card">
            <CardHeader>
                <CardTitle className="font-headline text-2xl text-primary flex items-center"><Wand2 className="mr-2 h-7 w-7"/>AI Diagram Generator</CardTitle>
                <CardDescription>Generate visual diagrams (flowcharts, mind maps, etc.) as images from your text descriptions.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <Textarea placeholder="Describe the diagram (e.g., 'A flowchart for a login process', 'A mind map about photosynthesis')..." value={diagramPrompt} onChange={(e) => setDiagramPrompt(e.target.value)} disabled={isGeneratingDiagram} className="min-h-[80px]"/>
                <Button onClick={handleGenerateDiagram} disabled={isGeneratingDiagram || !diagramPrompt.trim()} className="w-full sm:w-auto">
                    {isGeneratingDiagram && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Generate Diagram
                </Button>
                {generatedDiagramUrl && <div className="mt-4"><h4 className="font-semibold mb-2">Generated Diagram:</h4><Image src={generatedDiagramUrl} alt="Diagram by AI" width={512} height={512} className="rounded-md border shadow-md object-contain" /></div>}
                {!generatedDiagramUrl && !isGeneratingDiagram && <div className="text-center text-muted-foreground py-4"><Wand2 className="mx-auto h-12 w-12 text-muted-foreground/50" /><p>Your generated diagram will appear here.</p><img data-ai-hint="flowchart structure" src="https://placehold.co/300x200.png" alt="Placeholder" className="mx-auto mt-2 rounded-md opacity-50" /></div>}
            </CardContent>
        </Card>

        {/* AI Presentation Generator Section */}
        <Card className="shadow-xl bg-card">
            <CardHeader>
                <CardTitle className="font-headline text-2xl text-primary flex items-center"><PresentationIcon className="mr-2 h-7 w-7"/>AI Presentation Generator</CardTitle>
                <CardDescription>Create presentation outlines with AI-generated text and images. Customize image style and download as a themed PDF. (Note: Transitions/animations not supported in PDF).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <Input placeholder="Presentation Topic" value={presentationTopic} onChange={(e) => setPresentationTopic(e.target.value)} disabled={isGeneratingPresentation} />
                <Input type="number" placeholder="Number of Slides (e.g., 3)" value={numSlides} onChange={(e) => setNumSlides(e.target.value)} disabled={isGeneratingPresentation} min="1" max="7" />
                <Input placeholder="Image Style Prompt (Optional, e.g., 'vintage art style', 'minimalist flat design')" value={imageStylePrompt} onChange={(e) => setImageStylePrompt(e.target.value)} disabled={isGeneratingPresentation} />
                <div className="space-y-2">
                    <Label htmlFor="presentation-theme-select" className="text-md font-medium flex items-center"><Palette className="mr-2 h-5 w-5 text-primary" />PDF Theme</Label>
                    <Select value={presentationTheme} onValueChange={setPresentationTheme} disabled={isGeneratingPresentation}>
                        <SelectTrigger id="presentation-theme-select" className="w-full sm:w-[200px]"><SelectValue placeholder="Select PDF theme" /></SelectTrigger>
                        <SelectContent>{Object.keys(pdfThemes).map((key) => <SelectItem key={key} value={key} className="capitalize">{key}</SelectItem>)}</SelectContent>
                    </Select>
                </div>
                 <p className="text-xs text-muted-foreground">Note: Generating presentations with images can be slow (2-3 slides recommended). Max 7 slides.</p>
                 <div className="flex items-center text-xs text-muted-foreground bg-muted/50 p-2 rounded-md"><Info className="mr-2 h-4 w-4 text-primary shrink-0" /><span>Slide transitions/animations are not included in PDF output.</span></div>
                <div className="flex flex-wrap gap-2">
                    <Button onClick={handleGeneratePresentation} disabled={isGeneratingPresentation || !presentationTopic.trim()} className="flex-grow sm:flex-grow-0">
                        {isGeneratingPresentation && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Generate Presentation
                    </Button>
                    {generatedPresentation && <Button onClick={() => handleDownloadPresentationPdf(presentationTheme)} variant="outline" className="flex-grow sm:flex-grow-0" disabled={isGeneratingPresentation}><Download className="mr-2 h-4 w-4" /> Download PDF</Button>}
                </div>
                {generatedPresentation && (
                    <div className="mt-4 p-4 bg-muted rounded-md max-h-[600px] overflow-y-auto">
                        <h4 className="font-semibold mb-2">Generated Presentation:</h4>
                        {generatedPresentation.title && <h5 className="text-xl font-bold text-primary mb-4 text-center">{generatedPresentation.title}</h5>}
                        {generatedPresentation.slides.map((slide, index) => (
                        <div key={index} className="mb-6 p-4 bg-background/70 rounded-lg shadow">
                            <h6 className="font-semibold text-lg text-accent">{index + 1}. {slide.title}</h6>
                            <ul className="list-disc list-inside ml-4 my-2 text-sm">{slide.bulletPoints.map((point, pIndex) => <li key={pIndex} className="mb-1">{point}</li>)}</ul>
                            {slide.imageUrl && <div className="mt-3 p-2 border border-primary/20 rounded-md bg-primary/5"><p className="text-xs text-primary font-medium flex items-center mb-2"><ImageIconLucide className="mr-1.5 h-4 w-4 text-primary/80" />Generated Image (style: {imageStylePrompt || 'default'}):</p><Image src={slide.imageUrl} alt={`AI for ${slide.title}`} width={300} height={200} className="rounded-md border shadow-sm object-contain mx-auto" /></div>}
                            {!slide.imageUrl && slide.suggestedImageDescription && <div className="mt-2 p-2 bg-primary/10 rounded"><p className="text-xs text-primary font-medium flex items-center"><Lightbulb className="mr-1.5 h-3.5 w-3.5 text-primary/80" />Suggested Image Idea: <span className="italic ml-1 text-primary/90">{slide.suggestedImageDescription}</span> (Not generated)</p></div>}
                        </div>
                        ))}
                    </div>
                )}
                {!generatedPresentation && !isGeneratingPresentation && <div className="text-center text-muted-foreground py-4"><PresentationIcon className="mx-auto h-12 w-12 text-muted-foreground/50" /><p>Your presentation will appear here.</p></div>}
            </CardContent>
        </Card>

      </main>
      <footer className="text-center p-4 text-muted-foreground text-sm border-t border-border/50 bg-card">
        © {new Date().getFullYear()} ScholarAI. Empowering students, creators, and professionals with AI.
      </footer>
    </div>
  );
}

