
"use client";

import { useState, useEffect, useRef, type MouseEvent as ReactMouseEvent } from 'react';
import { Header } from '@/components/scholar-ai/Header';
import { FileUpload } from '@/components/scholar-ai/FileUpload';
import { QuestionInput } from '@/components/scholar-ai/QuestionInput';
import { ResultsDisplay } from '@/components/scholar-ai/ResultsDisplay';
import ImageEditorCanvas, { type TextElement } from '@/components/image-text-editor/ImageEditorCanvas';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { RefreshCcw, Sparkles, Code, Image as ImageIconLucide, Presentation as PresentationIcon, Wand2, Brain, FileText, Loader2, Lightbulb, Download, Palette, Info, Briefcase, MessageSquareQuote, CheckCircle, Edit3, FileSearch, GraduationCap, Copy, Share2, Send, FileType, Star, BookOpen, Users, SearchCode, PanelLeft, Mic, Check, X, FileSignature, Settings as SettingsIcon, Edit, Trash2, DownloadCloud, Type, AlertTriangle, Eraser } from 'lucide-react';
import {
  SidebarProvider,
  Sidebar,
  SidebarContent as ShadSidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { useToast } from "@/hooks/use-toast";
import Image from 'next/image';
import jsPDF from 'jspdf';
import { useTheme, type Theme } from "@/components/theme-provider";


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
import { analyzeGeneratedCode, type AnalyzeCodeInput, type AnalyzeCodeOutput } from '@/ai/flows/code-analyzer-flow';
import { manipulateImageText, type ManipulateImageTextInput, type ManipulateImageTextOutput } from '@/ai/flows/image-text-manipulation-flow';
import { removeWatermarkFromImage, type WatermarkRemoverInput, type WatermarkRemoverOutput } from '@/ai/flows/watermark-remover-flow';


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

const tools = [
  { id: 'document-qa', label: 'Document Q&A', icon: Brain, cardTitle: 'Document Q&A' },
  { id: 'summarizer', label: 'Summarizer', icon: FileType, cardTitle: 'AI Document Summarizer' },
  { id: 'interview-prep', label: 'Interview Prep', icon: MessageSquareQuote, cardTitle: 'AI Interview Question Generator' },
  { id: 'resume-review', label: 'Resume Improver', icon: Edit3, cardTitle: 'AI Resume Improver (ATS Optimized)' },
  { id: 'cover-letter', label: 'Cover Letter', icon: Send, cardTitle: 'AI Cover Letter Assistant' },
  { id: 'career-paths', label: 'Career Paths', icon: Star, cardTitle: 'AI Career Path Suggester' },
  { id: 'code-gen', label: 'Code & DSA', icon: SearchCode, cardTitle: 'AI Code & DSA Helper' },
  { id: 'image-gen', label: 'Image Gen', icon: ImageIconLucide, cardTitle: 'AI Image Generator' },
  { id: 'image-text-editor', label: 'Image-Text Editor', icon: Edit, cardTitle: 'Image Text Editor' },
  { id: 'diagram-gen', label: 'Diagram Gen', icon: Wand2, cardTitle: 'AI Diagram Generator' },
  { id: 'presentations', label: 'Presentations', icon: PresentationIcon, cardTitle: 'AI Presentation Generator' },
];

const COMMON_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/*'];
const COMMON_IMAGE_EXTENSIONS_STRING = ".jpg, .jpeg, .png, .gif, .webp, .bmp";


export default function MentorAiPage() {
  const [activeTool, setActiveTool] = useState<string>(tools[0].id);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [question, setQuestion] = useState<string>('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en'); 
  const [searchResult, setSearchResult] = useState<SmartSearchOutput | null>(null);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();

  const [codePrompt, setCodePrompt] = useState<string>('');
  const [codeLanguage, setCodeLanguage] = useState<string>('');
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [isGeneratingCode, setIsGeneratingCode] = useState<boolean>(false);
  const [codeAnalysis, setCodeAnalysis] = useState<AnalyzeCodeOutput | null>(null);
  const [isAnalyzingCode, setIsAnalyzingCode] = useState<boolean>(false);

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

  const [interviewJobRole, setInterviewJobRole] = useState<string>('');
  const [interviewNumQuestions, setInterviewNumQuestions] = useState<string>('5');
  const [interviewQuestionCategory, setInterviewQuestionCategory] = useState<QuestionCategory>('any');
  const [generatedInterviewQuestions, setGeneratedInterviewQuestions] = useState<GenerateInterviewQuestionsOutput | null>(null);
  const [isGeneratingInterviewQuestions, setIsGeneratingInterviewQuestions] = useState<boolean>(false);

  const [resumeText, setResumeText] = useState<string>('');
  const [resumeTargetJobRole, setResumeTargetJobRole] = useState<string>('');
  const [resumeAdditionalInfo, setResumeAdditionalInfo] = useState<string>('');
  const [resumeFeedback, setResumeFeedback] = useState<ResumeFeedbackOutput | null>(null);
  const [isGeneratingResumeFeedback, setIsGeneratingResumeFeedback] = useState<boolean>(false);

  const [coverLetterJobDesc, setCoverLetterJobDesc] = useState<string>('');
  const [coverLetterUserInfo, setCoverLetterUserInfo] = useState<string>('');
  const [coverLetterTone, setCoverLetterTone] = useState<"professional" | "enthusiastic" | "formal" | "slightly-informal">("professional");
  const [generatedCoverLetter, setGeneratedCoverLetter] = useState<GenerateCoverLetterOutput | null>(null);
  const [isGeneratingCoverLetter, setIsGeneratingCoverLetter] = useState<boolean>(false);

  const [careerInterests, setCareerInterests] = useState<string>(''); 
  const [careerSkills, setCareerSkills] = useState<string>(''); 
  const [careerExperienceLevel, setCareerExperienceLevel] = useState<"entry-level" | "mid-level" | "senior-level" | "executive">("entry-level");
  const [careerCompetitiveExamScore, setCareerCompetitiveExamScore] = useState<string>('');
  const [generatedCareerPaths, setGeneratedCareerPaths] = useState<SuggestCareerPathsOutput | null>(null);
  const [isGeneratingCareerPaths, setIsGeneratingCareerPaths] = useState<boolean>(false);

  const [summarizerFile, setSummarizerFile] = useState<File | null>(null);
  const [summaryLength, setSummaryLength] = useState<"short" | "medium" | "long">("medium");
  const [summaryStyle, setSummaryStyle] = useState<"general" | "bullet_points" | "for_layperson" | "for_expert">("general");
  const [summaryCustomPrompt, setSummaryCustomPrompt] = useState<string>('');
  const [generatedSummary, setGeneratedSummary] = useState<SummarizeDocumentOutput | null>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState<boolean>(false);

  // Image Text Editor States
  const [imageEditorSrc, setImageEditorSrc] = useState<string | File | null>(null); // Can be File or base64 string
  const [imageEditorTextElements, setImageEditorTextElements] = useState<TextElement[]>([]);
  const [imageEditorCurrentText, setImageEditorCurrentText] = useState<string>('Hello Text');
  const [imageEditorTextColor, setImageEditorTextColor] = useState<string>('#007bff'); 
  const [imageEditorTextFontSize, setImageEditorTextFontSize] = useState<number>(40);
  const [imageEditorTextFontFamily, setImageEditorTextFontFamily] = useState<string>('Arial');
  const [isAddingTextMode, setIsAddingTextMode] = useState<boolean>(false);
  const [selectedTextElementId, setSelectedTextElementId] = useState<string | null>(null);
  const imageEditorCanvasRef = useRef<HTMLCanvasElement>(null);
  const [aiImageInstruction, setAiImageInstruction] = useState<string>('');
  const [isManipulatingImageAI, setIsManipulatingImageAI] = useState<boolean>(false);
  const [aiImageManipulationMessage, setAiImageManipulationMessage] = useState<string>('');
  const [isRemovingWatermark, setIsRemovingWatermark] = useState<boolean>(false);
  const [watermarkRemovalMessage, setWatermarkRemovalMessage] = useState<string>('');


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
        toast({ title: "AI Mentor Success!", description: "Insights generated successfully." });
      } else {
        toast({ title: "Search complete", description: selectedFile ? "Could not find a direct answer in the document." : "I couldn't find an answer to your question." });
      }
    } catch (err: any) {
      const errorMessage = err.message || 'An unexpected error occurred.';
      setError(errorMessage);
      toast({ title: "AI Mentor Error", description: errorMessage, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleResetScholarAI = () => {
    setSelectedFile(null); setQuestion(''); setSearchResult(null); setExplanation(null); setError(null); setIsLoading(false);
    const fileInput = document.getElementById('file-upload-input') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
    toast({ title: "Cleared", description: "Document Q&A inputs and results have been cleared." });
  };

  const handleGenerateCode = async () => {
    if (!codePrompt.trim()) { toast({ title: "Error", description: "Please enter a code description.", variant: "destructive" }); return; }
    setIsGeneratingCode(true); setGeneratedCode(null); setCodeAnalysis(null);
    try {
      const result = await generateCode({ description: codePrompt, language: codeLanguage || undefined });
      setGeneratedCode(result.generatedCode);
      toast({ title: "Code Generated!", description: "Code snippet has been generated." });
    } catch (err: any) { toast({ title: "Code Generation Error", description: err.message || "Failed to generate code.", variant: "destructive" }); }
    finally { setIsGeneratingCode(false); }
  };
  
  const handleAnalyzeCode = async () => {
    if (!generatedCode || !codePrompt) {
      toast({ title: "Error", description: "Please generate code first before analyzing.", variant: "destructive" });
      return;
    }
    setIsAnalyzingCode(true); setCodeAnalysis(null);
    try {
      const analysisResult = await analyzeGeneratedCode({
        generatedCode: generatedCode,
        originalDescription: codePrompt,
        language: codeLanguage || undefined
      });
      setCodeAnalysis(analysisResult);
      toast({ title: "Code Analysis Complete!", description: "AI has reviewed the code." });
    } catch (err: any) {
      toast({ title: "Code Analysis Error", description: err.message || "Failed to analyze code.", variant: "destructive" });
    } finally {
      setIsAnalyzingCode(false);
    }
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
        if (addNewPageIfNeeded(textBlockHeight + 5)) { 
            doc.setFont(theme.bodyFont, 'italic'); doc.setFontSize(10); doc.setTextColor(theme.bodyColor[0], theme.bodyColor[1], theme.bodyColor[2]); 
        }
        doc.text(lines, margin, currentY);
        currentY += textBlockHeight + 7; 
    }

    for (let i = 0; i < generatedPresentation.slides.length; i++) {
      const slide = generatedPresentation.slides[i];
      if (i > 0 || (i === 0 && (!generatedPresentation.title && !imageStylePrompt?.trim()))) { 
         if (i > 0) { doc.addPage(); currentY = margin; } 
         else if (currentY <= margin + 5 && !generatedPresentation.title && !imageStylePrompt?.trim() ) { /* no-op, likely first element on page */ } 
         else { if(!addNewPageIfNeeded(40) && currentY > margin + 20) { doc.addPage(); currentY = margin; } else { currentY +=8; } } 
      } else if (i === 0 && (generatedPresentation.title || imageStylePrompt?.trim())){ 
         if (pageHeight - currentY < pageHeight * 0.4) { doc.addPage(); currentY = margin; } else { currentY += 5; } 
      }
      
      doc.setFont(theme.bodyFont, 'normal'); doc.setFontSize(10); 
      if(theme.accentColor) doc.setTextColor(theme.accentColor[0], theme.accentColor[1], theme.accentColor[2]);
      else doc.setTextColor(pdfThemes.default.accentColor![0], pdfThemes.default.accentColor![1], pdfThemes.default.accentColor![2]);
      const slideNumberText = `Slide ${i + 1}`;
      doc.text(slideNumberText, pageWidth - margin - doc.getTextWidth(slideNumberText), currentY); 

      doc.setFont(theme.titleFont, theme.titleStyle); doc.setFontSize(18); doc.setTextColor(theme.titleColor[0], theme.titleColor[1], theme.titleColor[2]);
      let lines = doc.splitTextToSize(slide.title, maxTextWidth);
      let textBlockHeight = doc.getTextDimensions(lines).h;
      if(addNewPageIfNeeded(textBlockHeight + 8)) {
          doc.setFont(theme.titleFont, theme.titleStyle); doc.setFontSize(18); doc.setTextColor(theme.titleColor[0], theme.titleColor[1], theme.titleColor[2]);
      }
      doc.text(lines, margin, currentY);
      currentY += textBlockHeight + 8;

      doc.setFont(theme.bodyFont, theme.bodyStyle); doc.setFontSize(12); doc.setTextColor(theme.bodyColor[0], theme.bodyColor[1], theme.bodyColor[2]);
      for (const point of slide.bulletPoints) {
        lines = doc.splitTextToSize(`• ${point}`, maxTextWidth - 8); 
        textBlockHeight = doc.getTextDimensions(lines).h;
        if (addNewPageIfNeeded(textBlockHeight + 4)) { 
           doc.setFont(theme.bodyFont, theme.bodyStyle); doc.setFontSize(12); doc.setTextColor(theme.bulletColor[0], theme.bulletColor[1], theme.bulletColor[2]);
        } else { doc.setTextColor(theme.bulletColor[0], theme.bulletColor[1], theme.bulletColor[2]); } 
        doc.text(lines, margin + 5, currentY); 
        doc.setTextColor(theme.bodyColor[0], theme.bodyColor[1], theme.bodyColor[2]); 
        currentY += textBlockHeight + 4;
      }

      if (slide.imageUrl) {
        currentY += 6; 
        const IMAGE_MAX_WIDTH = maxTextWidth * 0.9; const IMAGE_MAX_HEIGHT = pageHeight * 0.45; 
        try {
            const imgProps = doc.getImageProperties(slide.imageUrl);
            let imgWidth = imgProps.width; let imgHeight = imgProps.height; const aspectRatio = imgWidth / imgHeight;
            if (imgWidth > IMAGE_MAX_WIDTH) { imgWidth = IMAGE_MAX_WIDTH; imgHeight = imgWidth / aspectRatio; }
            if (imgHeight > IMAGE_MAX_HEIGHT) { imgHeight = IMAGE_MAX_HEIGHT; imgWidth = imgHeight * aspectRatio; }
            if (imgWidth > IMAGE_MAX_WIDTH) { imgWidth = IMAGE_MAX_WIDTH; imgHeight = imgWidth / aspectRatio; } 

            if (addNewPageIfNeeded(imgHeight + 10)) { 
                doc.addImage(slide.imageUrl, 'PNG', margin + (maxTextWidth - imgWidth)/2 , currentY, imgWidth, imgHeight);
            } else { doc.addImage(slide.imageUrl, 'PNG', margin + (maxTextWidth - imgWidth)/2, currentY, imgWidth, imgHeight); } 
            currentY += imgHeight + 10; 
        } catch (e) {
          console.error("Error adding image to PDF:", e);
          doc.setFont(theme.bodyFont, 'italic'); doc.setFontSize(10); doc.setTextColor(theme.bodyColor[0], theme.bodyColor[1], theme.bodyColor[2]);
          lines = doc.splitTextToSize("[Image embedding failed or image format not supported by jsPDF]", maxTextWidth); textBlockHeight = doc.getTextDimensions(lines).h;
          addNewPageIfNeeded(textBlockHeight + 7); doc.text(lines, margin, currentY); currentY += textBlockHeight + 7;
        }
      } else if (slide.suggestedImageDescription) { 
        currentY += 4; doc.setFont(theme.bodyFont, 'italic'); doc.setFontSize(10); doc.setTextColor(theme.bodyColor[0], theme.bodyColor[1], theme.bodyColor[2]);
        lines = doc.splitTextToSize(`Suggested Image Idea: ${slide.suggestedImageDescription}`, maxTextWidth);
        textBlockHeight = doc.getTextDimensions(lines).h;
        addNewPageIfNeeded(textBlockHeight + 7); doc.text(lines, margin, currentY); currentY += textBlockHeight + 7;
      }
    }
    doc.save(`ai_mentor_presentation_${themeKey}.pdf`);
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
      const result = await getResumeFeedback({ 
        resumeText, 
        targetJobRole: resumeTargetJobRole || undefined,
        additionalInformation: resumeAdditionalInfo || undefined 
      });
      setResumeFeedback(result);
      toast({ title: "Resume Feedback Ready!", description: "Your improved resume and suggestions have been generated." });
    } catch (err: any) { toast({ title: "Resume Feedback Error", description: err.message || "Failed to get feedback.", variant: "destructive" }); }
    finally { setIsGeneratingResumeFeedback(false); }
  };

  const handleDownloadResumePdf = () => {
    if (!resumeFeedback?.modifiedResumeText) {
      toast({ title: "Error", description: "No modified resume text to download.", variant: "destructive" });
      return;
    }
    const doc = new jsPDF({ unit: "pt", format: "letter" });
    const text = resumeFeedback.modifiedResumeText;
    
    const FONT_FAMILY = "Helvetica"; 
    const NAME_SIZE = 20;
    const SECTION_TITLE_SIZE = 14;
    const HEADING_SIZE = 11; 
    const BODY_SIZE = 10;
    const CONTACT_SIZE = 9;
    
    const LINE_SPACING = 1.4;
    const SECTION_SPACING = 10; 
    const SUB_SECTION_SPACING = 5; 
    
    const MARGIN = 50; 
    const MAX_TEXT_WIDTH = doc.internal.pageSize.getWidth() - MARGIN * 2;
    const BULLET_INDENT = 15;
    const BULLET_CHAR = '•';

    let yPos = MARGIN;

    const addNewPageIfNeeded = (neededHeight: number) => {
      if (yPos + neededHeight > doc.internal.pageSize.getHeight() - MARGIN) {
        doc.addPage();
        yPos = MARGIN;
        return true;
      }
      return false;
    };

    const lines = text.split('\n');
    let isFirstLine = true; 

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i].trim();
      if (!line) continue; 

      let fontSize = BODY_SIZE;
      let fontStyle = 'normal';
      let indent = 0;
      let color: [number, number, number] = [0, 0, 0]; 

      if (isFirstLine && line.startsWith("### ")) { 
        line = line.substring(4).trim();
        fontSize = NAME_SIZE;
        fontStyle = 'bold';
        addNewPageIfNeeded(fontSize * LINE_SPACING * 2); 
        doc.setFont(FONT_FAMILY, fontStyle);
        doc.setFontSize(fontSize);
        doc.setTextColor(color[0], color[1], color[2]);
        const nameWidth = doc.getTextWidth(line);
        doc.text(line, (doc.internal.pageSize.getWidth() - nameWidth) / 2, yPos); 
        yPos += fontSize * LINE_SPACING;
        addNewPageIfNeeded(5);
        doc.setLineWidth(0.5);
        doc.line(MARGIN, yPos, doc.internal.pageSize.getWidth() - MARGIN, yPos);
        yPos += 5 * LINE_SPACING;
        isFirstLine = false;
        continue;
      } else if (isFirstLine) { 
        fontSize = NAME_SIZE;
        fontStyle = 'bold';
        addNewPageIfNeeded(fontSize * LINE_SPACING * 2);
        doc.setFont(FONT_FAMILY, fontStyle);
        doc.setFontSize(fontSize);
        doc.setTextColor(color[0], color[1], color[2]);
        const nameWidth = doc.getTextWidth(line);
        doc.text(line, (doc.internal.pageSize.getWidth() - nameWidth) / 2, yPos);
        yPos += fontSize * LINE_SPACING;
        isFirstLine = false;
        continue;
      }

      if (line.includes("Phone:") || line.includes("Email:") || line.includes("LinkedIn:") || line.includes("Location:")) {
        fontSize = CONTACT_SIZE;
        fontStyle = 'normal';
      } else if (line.startsWith("## ")) { 
        line = line.substring(3).trim();
        fontSize = SECTION_TITLE_SIZE;
        fontStyle = 'bold';
        color = [65, 105, 225]; 
        if (yPos > MARGIN + NAME_SIZE) { 
           yPos += SECTION_SPACING / 2;
           addNewPageIfNeeded(SECTION_SPACING / 2);
        }
      } else if (line.startsWith("**") && line.endsWith("**")) { 
        line = line.substring(2, line.length - 2).trim();
        fontSize = HEADING_SIZE;
        fontStyle = 'bold';
         yPos += SUB_SECTION_SPACING / 2;
         addNewPageIfNeeded(SUB_SECTION_SPACING /2);
      } else if (line.startsWith("• ")) { 
        line = line.substring(2).trim();
        indent = BULLET_INDENT;
        fontSize = BODY_SIZE;
        fontStyle = 'normal';
      } else { 
        fontSize = BODY_SIZE;
        fontStyle = 'normal';
      }
      
      doc.setFont(FONT_FAMILY, fontStyle);
      doc.setFontSize(fontSize);
      doc.setTextColor(color[0], color[1], color[2]);

      const splitText = doc.splitTextToSize(line, MAX_TEXT_WIDTH - indent);
      for (let j = 0; j < splitText.length; j++) {
        addNewPageIfNeeded(fontSize * LINE_SPACING);
        if (j === 0 && indent > 0) { 
           doc.text(BULLET_CHAR, MARGIN , yPos);
        }
        doc.text(splitText[j], MARGIN + indent, yPos);
        yPos += fontSize * LINE_SPACING;
      }
      if (line.startsWith("## ")) { 
         addNewPageIfNeeded(5);
         doc.setLineWidth(0.25);
         doc.line(MARGIN, yPos - (fontSize * LINE_SPACING / 2.5) , doc.internal.pageSize.getWidth() - MARGIN, yPos - (fontSize * LINE_SPACING / 2.5));
         yPos += SECTION_SPACING / 2;
      }
    }
    
    doc.save('ai_mentor_improved_resume.pdf');
    toast({ title: "Resume PDF Downloaded", description: "Your improved resume has been saved as a PDF." });
  };

  const handleResetResumeImprover = () => {
    setResumeText('');
    setResumeTargetJobRole('');
    setResumeAdditionalInfo('');
    setResumeFeedback(null);
    setIsGeneratingResumeFeedback(false);
    toast({ title: "Cleared", description: "Resume Improver form and results have been cleared." });
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
      const result = await suggestCareerPaths({ 
        interests: interestsArray, 
        skills: skillsArray, 
        experienceLevel: careerExperienceLevel,
        competitiveExamScore: careerCompetitiveExamScore || undefined,
      });
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

  // Image Text Editor Handlers
  const handleImageEditorFileChange = (file: File | null) => {
    setImageEditorSrc(file); 
    setImageEditorTextElements([]); 
    setSelectedTextElementId(null);
    setAiImageManipulationMessage('');
    setWatermarkRemovalMessage('');
    setAiImageInstruction('');
  };

  const handleImageEditorCanvasClick = (logicalX: number, logicalY: number) => {
    if (isAddingTextMode && imageEditorCurrentText.trim()) {
      setImageEditorTextElements(prev => [
        ...prev,
        {
          id: new Date().toISOString(),
          text: imageEditorCurrentText,
          x: logicalX,
          y: logicalY,
          color: imageEditorTextColor,
          fontSize: imageEditorTextFontSize,
          fontFamily: imageEditorTextFontFamily,
        },
      ]);
      setIsAddingTextMode(false);
      setSelectedTextElementId(null); // Deselect after adding new text
      toast({ title: "Text Added", description: "Text placed on image." });
    } else if (!isAddingTextMode) {
        handleSelectTextElement(logicalX, logicalY);
    } else {
        if (isAddingTextMode && !imageEditorCurrentText.trim()) {
            toast({ title: "Add Text", description: "Please enter some text before placing it.", variant: "default" });
        }
    }
  };
  
  const handleSelectTextElement = (clickX: number, clickY: number) => {
    const canvas = imageEditorCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let foundElement: TextElement | null = null;
    // Iterate in reverse to select topmost element if overlapping
    for (let i = imageEditorTextElements.length - 1; i >= 0; i--) {
        const el = imageEditorTextElements[i];
        
        // Apply canvas scaling for accurate measurement relative to logical coordinates
        ctx.font = `${el.fontSize}px ${el.fontFamily}`; 
        
        const textMetrics = ctx.measureText(el.text);
        const elWidth = textMetrics.width; 
        const elHeight = el.fontSize; 
        
        // Adjust hit box to be more generous, especially around the baseline
        // y is typically the baseline, so text extends upwards mostly
        if (
            clickX >= el.x &&
            clickX <= el.x + elWidth &&
            clickY >= el.y - elHeight * 0.8 && // Check from slightly above the text
            clickY <= el.y + elHeight * 0.2  // Check slightly below the baseline
        ) {
            foundElement = el;
            break;
        }
    }

    if (foundElement) {
        setSelectedTextElementId(foundElement.id);
        setImageEditorCurrentText(foundElement.text);
        setImageEditorTextColor(foundElement.color);
        setImageEditorTextFontSize(foundElement.fontSize);
        setImageEditorTextFontFamily(foundElement.fontFamily);
        setIsAddingTextMode(false); 
        toast({ title: "Text Selected", description: "You can now edit or delete the selected text."});
    } else {
        setSelectedTextElementId(null); 
    }
  };

  const handleUpdateSelectedText = () => {
    if (!selectedTextElementId || !imageEditorCurrentText.trim()) {
        if (!imageEditorCurrentText.trim()) {
            toast({ title: "Cannot Update", description: "Text content cannot be empty.", variant: "destructive" });
        }
        return;
    }
    setImageEditorTextElements(prev => 
        prev.map(el => 
            el.id === selectedTextElementId 
            ? { ...el, text: imageEditorCurrentText, color: imageEditorTextColor, fontSize: imageEditorTextFontSize, fontFamily: imageEditorTextFontFamily } 
            : el
        )
    );
    toast({ title: "Text Updated", description: "Selected text properties have been updated."});
  };

  const handleDeleteSelectedText = () => {
    if (!selectedTextElementId) return;
    setImageEditorTextElements(prev => prev.filter(el => el.id !== selectedTextElementId));
    setSelectedTextElementId(null);
    setImageEditorCurrentText('Hello Text'); // Reset to default
    setImageEditorTextColor('#007bff');
    setImageEditorTextFontSize(40);
    setImageEditorTextFontFamily('Arial');
    setIsAddingTextMode(false);
    toast({ title: "Text Deleted", description: "Selected text has been removed."});
  };
  
  const handlePrepareToAddText = () => {
    if (!imageEditorSrc) {
        toast({title: "No Image", description: "Please upload an image first to add text.", variant: "destructive"});
        return;
    }
    if (!imageEditorCurrentText.trim()) {
        toast({title: "No Text", description: "Please enter some text in the input field first.", variant: "destructive"});
        return;
    }
    setIsAddingTextMode(true);
    setSelectedTextElementId(null); // Ensure we are in "add" mode, not "edit" mode
    toast({title: "Add Text Mode", description: "Click on the image to place your text.", variant: "default"});
  }

  const handleImageEditorDownload = () => {
    const canvas = imageEditorCanvasRef.current;
    if (canvas) {
      const dataUrl = canvas.toDataURL('image/png'); 
      const link = document.createElement('a');
      link.download = 'edited-image.png';
      link.href = dataUrl;
      link.click();
      toast({ title: "Image Downloaded", description: "Your edited image has been saved." });
    } else {
      toast({ title: "Download Error", description: "Could not find canvas to download.", variant: "destructive" });
    }
  };
  
  const handleImageEditorReset = () => {
    setImageEditorSrc(null);
    setImageEditorTextElements([]);
    setSelectedTextElementId(null);
    setImageEditorCurrentText('Hello Text');
    setImageEditorTextColor('#007bff');
    setImageEditorTextFontSize(40);
    setImageEditorTextFontFamily('Arial');
    setIsAddingTextMode(false);
    setAiImageInstruction('');
    setAiImageManipulationMessage('');
    setWatermarkRemovalMessage('');
    const fileInput = document.getElementById('image-editor-file-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
    toast({ title: "Editor Reset", description: "Image text editor has been cleared." });
  };

  const handleAiImageManipulation = async () => {
    if (!imageEditorSrc || (!(imageEditorSrc instanceof File) && typeof imageEditorSrc !== 'string')) {
      toast({ title: "No Image", description: "Please upload an image first.", variant: "destructive" });
      return;
    }
    if (!aiImageInstruction.trim()) {
      toast({ title: "No Instruction", description: "Please provide an instruction for the AI.", variant: "destructive" });
      return;
    }
    setIsManipulatingImageAI(true);
    setAiImageManipulationMessage('AI is processing your image...');
    try {
      const imageDataUri = typeof imageEditorSrc === 'string' ? imageEditorSrc : await fileToDataUri(imageEditorSrc);
      const result = await manipulateImageText({ imageDataUri, instruction: aiImageInstruction });
      
      setAiImageManipulationMessage(result.statusMessage);
      if (result.processedImageUrl) {
        setImageEditorSrc(result.processedImageUrl); 
        setImageEditorTextElements([]); 
        setSelectedTextElementId(null);
        toast({ title: "AI Manipulation Complete", description: result.statusMessage });
      } else {
        toast({ title: "AI Manipulation Info", description: result.statusMessage, variant: "default" });
      }
    } catch (err: any) {
      const msg = err.message || "Failed to manipulate image with AI.";
      setAiImageManipulationMessage(msg);
      toast({ title: "AI Manipulation Error", description: msg, variant: "destructive" });
    } finally {
      setIsManipulatingImageAI(false);
    }
  };

  const handleAiWatermarkRemoval = async () => {
    if (!imageEditorSrc || (!(imageEditorSrc instanceof File) && typeof imageEditorSrc !== 'string')) {
      toast({ title: "No Image", description: "Please upload an image first.", variant: "destructive" });
      return;
    }
    setIsRemovingWatermark(true);
    setWatermarkRemovalMessage('AI is attempting to remove watermarks...');
    try {
      const imageDataUri = typeof imageEditorSrc === 'string' ? imageEditorSrc : await fileToDataUri(imageEditorSrc);
      const result = await removeWatermarkFromImage({ imageDataUri });
      
      setWatermarkRemovalMessage(result.statusMessage);
      if (result.processedImageUrl) {
        setImageEditorSrc(result.processedImageUrl); 
        setImageEditorTextElements([]); 
        setSelectedTextElementId(null);
        toast({ title: "AI Watermark Removal Complete", description: result.statusMessage });
      } else {
        toast({ title: "AI Watermark Removal Info", description: result.statusMessage, variant: "default" });
      }
    } catch (err: any) {
      const msg = err.message || "Failed to remove watermark with AI.";
      setWatermarkRemovalMessage(msg);
      toast({ title: "AI Watermark Removal Error", description: msg, variant: "destructive" });
    } finally {
      setIsRemovingWatermark(false);
    }
  };


  const activeToolData = tools.find(tool => tool.id === activeTool) || tools[0];
  const availableFonts = ['Arial', 'Verdana', 'Times New Roman', 'Courier New', 'Georgia', 'Comic Sans MS', 'Impact', 'Helvetica'];


  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header 
        selectedLanguage={selectedLanguage}
        onLanguageChange={setSelectedLanguage}
        currentTheme={theme}
        onThemeChange={setTheme}
      />
      <SidebarProvider defaultOpen={true}>
        <div className="flex flex-1">
          <Sidebar collapsible="icon">
            <ShadSidebarContent>
              <SidebarMenu>
                {tools.map(tool => (
                  <SidebarMenuItem key={tool.id}>
                    <SidebarMenuButton
                      onClick={() => setActiveTool(tool.id)}
                      isActive={activeTool === tool.id}
                      tooltip={tool.label}
                      className="w-full justify-start"
                    >
                      <tool.icon className="h-5 w-5 mr-3" />
                      <span>{tool.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </ShadSidebarContent>
            <SidebarFooter className="p-2">
              <SidebarTrigger className="w-full" />
            </SidebarFooter>
          </Sidebar>

          <SidebarInset className="container mx-auto p-4 md:p-8">
            <div className="mb-4 md:hidden"> 
              <SidebarTrigger />
            </div>
            
            <div className="space-y-8">
              {activeTool === 'document-qa' && (
                <Card className="shadow-xl bg-card">
                  <CardHeader>
                    <CardTitle className="font-headline text-2xl text-primary flex items-center"><Brain className="mr-2 h-7 w-7"/>Document Q&amp;A</CardTitle>
                    <CardDescription>Upload a document (PDF, TXT, DOC, DOCX) and ask questions, or ask general questions without a document. AI explanation language can be set in global Settings (gear icon in header).</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                      <div className="lg:col-span-1 space-y-6">
                        <FileUpload selectedFile={selectedFile} onFileChange={handleFileChange} isLoading={isLoading} inputId="file-upload-input"/>
                        <QuestionInput question={question} onQuestionChange={setQuestion} onSubmit={handleSubmitScholarAI} isLoading={isLoading} isSubmitDisabled={!question.trim()}/>
                        <Button variant="outline" onClick={handleResetScholarAI} disabled={isLoading} className="w-full"><RefreshCcw className="mr-2 h-4 w-4" /> Clear Q&amp;A</Button>
                      </div>
                      <div className="lg:col-span-2">
                        <ResultsDisplay searchResult={searchResult} explanation={explanation} isLoading={isLoading} error={error} language={selectedLanguage} hasDocument={!!selectedFile} question={question}/>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {activeTool === 'summarizer' && (
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
              )}

               {activeTool === 'image-text-editor' && (
                <Card className="shadow-xl bg-card">
                  <CardHeader>
                    <CardTitle className="font-headline text-2xl text-primary flex items-center"><Edit className="mr-2 h-7 w-7"/>Image Text Editor</CardTitle>
                    <CardDescription>Upload an image, add/edit text overlays, or use AI (experimental) to modify in-image text or remove watermarks. Download your creation.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="md:col-span-1 space-y-4">
                        <FileUpload 
                            selectedFile={imageEditorSrc instanceof File ? imageEditorSrc : null} 
                            onFileChange={handleImageEditorFileChange} 
                            isLoading={isManipulatingImageAI || isRemovingWatermark} 
                            inputId="image-editor-file-upload"
                            label="Upload Image"
                            acceptedFileTypes={COMMON_IMAGE_MIME_TYPES}
                            acceptedFileExtensionsString={COMMON_IMAGE_EXTENSIONS_STRING}
                        />
                        
                        <Separator />
                        <Label className="text-md font-semibold text-primary">Overlay Text Controls</Label>
                        <div>
                          <Label htmlFor="image-editor-text">Text Content</Label>
                          <Input id="image-editor-text" value={imageEditorCurrentText} onChange={(e) => setImageEditorCurrentText(e.target.value)} placeholder="Enter text"/>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="image-editor-font-size">Font Size</Label>
                                <Input id="image-editor-font-size" type="number" value={imageEditorTextFontSize} onChange={(e) => setImageEditorTextFontSize(Number(e.target.value))} placeholder="Size"/>
                            </div>
                            <div>
                                <Label htmlFor="image-editor-text-color">Color</Label>
                                <Input id="image-editor-text-color" type="color" value={imageEditorTextColor} onChange={(e) => setImageEditorTextColor(e.target.value)} className="h-10"/>
                            </div>
                        </div>
                        <div>
                          <Label htmlFor="image-editor-font-family">Font Family</Label>
                          <Select value={imageEditorTextFontFamily} onValueChange={setImageEditorTextFontFamily}>
                            <SelectTrigger id="image-editor-font-family"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {availableFonts.map(font => <SelectItem key={font} value={font}>{font}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="flex flex-col space-y-2">
                            <Button onClick={handlePrepareToAddText} disabled={!imageEditorSrc || !imageEditorCurrentText.trim() || isManipulatingImageAI || isRemovingWatermark} className="w-full">
                              <Type className="mr-2 h-4 w-4"/> {selectedTextElementId ? "Add New Text Instead" : "Prepare to Add Text"}
                            </Button>
                            {isAddingTextMode && <p className="text-sm text-accent text-center animate-pulse">Click on the image to place text.</p>}

                            {selectedTextElementId && (
                                <>
                                <Button onClick={handleUpdateSelectedText} variant="secondary" disabled={isManipulatingImageAI || isRemovingWatermark || !imageEditorCurrentText.trim()} className="w-full">
                                    <CheckCircle className="mr-2 h-4 w-4"/> Update Selected Text
                                </Button>
                                <Button onClick={handleDeleteSelectedText} variant="destructive" disabled={isManipulatingImageAI || isRemovingWatermark} className="w-full">
                                    <Trash2 className="mr-2 h-4 w-4"/> Delete Selected Text
                                </Button>
                                </>
                            )}
                        </div>
                        <Separator />
                        
                        <div className="space-y-3">
                            <Label className="text-md font-semibold text-primary flex items-center"><Sparkles className="mr-2 h-5 w-5"/>AI In-Image Text Manipulation (Experimental)</Label>
                             {!imageEditorSrc && <p className="text-xs text-muted-foreground">Upload an image to enable AI text manipulation.</p>}
                            <Input 
                                id="ai-image-instruction" 
                                value={aiImageInstruction} 
                                onChange={(e) => setAiImageInstruction(e.target.value)} 
                                placeholder={imageEditorSrc ? "e.g., Change 'Old Text' to 'New Text'" : "Upload an image first..."}
                                disabled={!imageEditorSrc || isManipulatingImageAI || isRemovingWatermark}
                            />
                            <Button onClick={handleAiImageManipulation} disabled={!imageEditorSrc || !aiImageInstruction.trim() || isManipulatingImageAI || isRemovingWatermark} className="w-full">
                                {isManipulatingImageAI && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>} Apply AI Manipulation
                            </Button>
                            {aiImageManipulationMessage && <p className="text-xs text-muted-foreground p-2 bg-muted/50 rounded-md">{aiImageManipulationMessage}</p>}
                        </div>
                        <Separator />
                        <div className="space-y-3">
                             <Label className="text-md font-semibold text-primary flex items-center"><Eraser className="mr-2 h-5 w-5"/>AI Watermark Remover (Experimental)</Label>
                             {!imageEditorSrc && <p className="text-xs text-muted-foreground">Upload an image to enable AI watermark removal.</p>}
                             <Button onClick={handleAiWatermarkRemoval} disabled={!imageEditorSrc || isManipulatingImageAI || isRemovingWatermark} className="w-full">
                                {isRemovingWatermark && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>} Attempt AI Watermark Removal
                             </Button>
                             {watermarkRemovalMessage && <p className="text-xs text-muted-foreground p-2 bg-muted/50 rounded-md">{watermarkRemovalMessage}</p>}
                        </div>

                      </div>

                      <div className="md:col-span-2">
                        <ImageEditorCanvas
                          ref={imageEditorCanvasRef}
                          imageSrc={imageEditorSrc}
                          textElements={imageEditorTextElements}
                          onCanvasClick={handleImageEditorCanvasClick}
                          selectedTextElementId={selectedTextElementId}
                        />
                         {!imageEditorSrc && (
                            <div className="mt-2 text-center text-muted-foreground py-4 border border-dashed rounded-md bg-muted/30 flex flex-col items-center justify-center aspect-[4/3]">
                                <ImageIconLucide className="mx-auto h-12 w-12 text-muted-foreground/50" />
                                <p>Upload an image to start editing.</p>
                            </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 justify-end pt-4 border-t">
                        <Button onClick={handleImageEditorDownload} variant="default" disabled={!imageEditorSrc || isManipulatingImageAI || isRemovingWatermark}>
                            <DownloadCloud className="mr-2 h-4 w-4"/> Download Image
                        </Button>
                        <Button onClick={handleImageEditorReset} variant="outline" disabled={isManipulatingImageAI || isRemovingWatermark}>
                            <Trash2 className="mr-2 h-4 w-4"/> Reset Editor
                        </Button>
                    </div>
                  </CardContent>
                </Card>
              )}


              {activeTool === 'interview-prep' && (
                <Card className="shadow-xl bg-card">
                    <CardHeader>
                        <CardTitle className="font-headline text-2xl text-primary flex items-center"><MessageSquareQuote className="mr-2 h-7 w-7"/>AI Interview Question Generator</CardTitle>
                        <CardDescription>Generate targeted interview questions based on job role, topic, and desired category (technical, behavioral, situational, or DSA).</CardDescription>
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
                                    <SelectItem value="dsa">DSA (Data Structures & Algorithms)</SelectItem>
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
                                            <span className={`mr-2 mt-1 h-2 w-2 rounded-full flex-shrink-0 ${
                                                q.category.toLowerCase().includes('technical') ? 'bg-blue-500' : 
                                                q.category.toLowerCase().includes('behavioral') ? 'bg-green-500' : 
                                                q.category.toLowerCase().includes('situational') ? 'bg-yellow-500' : 
                                                q.category.toLowerCase().includes('dsa') ? 'bg-purple-500' : 
                                                'bg-gray-500'
                                                }`}></span>
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
              )}

              {activeTool === 'resume-review' && (
                <Card className="shadow-xl bg-card">
                    <CardHeader>
                        <CardTitle className="font-headline text-2xl text-primary flex items-center"><Edit3 className="mr-2 h-7 w-7"/>AI Resume Improver (ATS Optimized)</CardTitle>
                        <CardDescription>Paste your resume text. Optionally, add your target job role/industry and specific projects or details you want the AI to include or highlight in the improved version.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Textarea placeholder="Paste your full resume text here..." value={resumeText} onChange={(e) => setResumeText(e.target.value)} disabled={isGeneratingResumeFeedback} className="min-h-[200px]"/>
                        <Input placeholder="Target Job Role or Industry (Optional, e.g., 'Data Analyst', 'Healthcare')" value={resumeTargetJobRole} onChange={(e) => setResumeTargetJobRole(e.target.value)} disabled={isGeneratingResumeFeedback} />
                        <Textarea 
                            placeholder="Optional: Describe projects, achievements, or other specific details you want the AI to add or highlight in your resume (e.g., 'Led a team of 5 in developing a mobile app that achieved 10k downloads. Technologies: React Native, Firebase.')"
                            value={resumeAdditionalInfo}
                            onChange={(e) => setResumeAdditionalInfo(e.target.value)}
                            disabled={isGeneratingResumeFeedback}
                            className="min-h-[100px]"
                        />
                        <div className="flex flex-wrap gap-2">
                            <Button onClick={handleGetResumeFeedback} disabled={isGeneratingResumeFeedback || !resumeText.trim()} className="w-auto">
                                {isGeneratingResumeFeedback && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Get Resume Feedback
                            </Button>
                            <Button variant="outline" onClick={handleResetResumeImprover} disabled={isGeneratingResumeFeedback} className="w-auto">
                                <RefreshCcw className="mr-2 h-4 w-4" /> Clear Form & Results
                            </Button>
                        </div>
                        
                        {resumeFeedback && (
                            <div className="mt-4 p-4 bg-muted rounded-md max-h-[600px] overflow-y-auto space-y-6">
                                <div>
                                    <div className="flex flex-wrap justify-between items-center mb-2 gap-2">
                                        <h4 className="font-semibold text-foreground">AI-Modified Resume:</h4>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                    navigator.clipboard.writeText(resumeFeedback.modifiedResumeText);
                                                    toast({ title: "Copied!", description: "Modified resume text copied to clipboard." });
                                                }}
                                            >
                                                <Copy className="mr-2 h-4 w-4" /> Copy Text
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={handleDownloadResumePdf}
                                                disabled={!resumeFeedback?.modifiedResumeText || isGeneratingResumeFeedback}
                                            >
                                                <Download className="mr-2 h-4 w-4" /> Download PDF
                                            </Button>
                                        </div>
                                    </div>
                                    <Textarea
                                        value={resumeFeedback.modifiedResumeText}
                                        readOnly
                                        className="min-h-[250px] bg-background/80 border-primary/30"
                                        aria-label="Modified Resume Text"
                                    />
                                </div>
                                
                                {resumeFeedback.talkingPoints && resumeFeedback.talkingPoints.length > 0 && (
                                  <div className="p-3 bg-primary/10 rounded-md">
                                    <h5 className="font-semibold text-primary flex items-center mb-2"><Mic className="mr-2 h-5 w-5"/>Key Talking Points from Your Resume:</h5>
                                    <ul className="list-disc list-inside text-sm text-primary-foreground space-y-1 pl-2">
                                      {resumeFeedback.talkingPoints.map((point, index) => (
                                        <li key={index} className="text-foreground">{point}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                <div>
                                    <h4 className="font-semibold mb-2 text-foreground">Feedback &amp; Analysis:</h4>
                                    <p className="text-sm mb-3 p-3 bg-background/50 rounded-md"><strong>Overall Assessment (Original):</strong> {resumeFeedback.overallAssessment}</p>
                                    {resumeFeedback.atsKeywordsSummary && <p className="text-sm mb-3 p-3 bg-primary/10 text-primary rounded-md"><strong>ATS Keywords Summary (for Rewritten Resume):</strong> {resumeFeedback.atsKeywordsSummary}</p>}
                                    <Accordion type="single" collapsible className="w-full">
                                        {resumeFeedback.feedbackItems.map((item, index) => (
                                        <AccordionItem value={`feedback-${index}`} key={index}>
                                            <AccordionTrigger className="text-sm hover:no-underline text-left">
                                            <div className="flex items-start">
                                                <CheckCircle className={`mr-2 mt-1 h-4 w-4 flex-shrink-0 ${item.importance === 'high' ? 'text-red-500' : item.importance === 'medium' ? 'text-yellow-600' : 'text-green-500'}`}/>
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
                            </div>
                        )}
                    </CardContent>
                </Card>
              )}

              {activeTool === 'cover-letter' && (
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
              )}

              {activeTool === 'career-paths' && (
                <Card className="shadow-xl bg-card">
                    <CardHeader>
                        <CardTitle className="font-headline text-2xl text-primary flex items-center"><Star className="mr-2 h-7 w-7"/>AI Career Path Suggester</CardTitle>
                        <CardDescription>Discover potential career paths. Input interests, skills, experience, and optionally competitive exam scores for personalized suggestions. If institutional examples are provided, they are illustrative and not admission guarantees; always verify with institutions.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Input placeholder="Your Interests (comma-separated, e.g., AI, healthcare, teaching)" value={careerInterests} onChange={(e) => setCareerInterests(e.target.value)} disabled={isGeneratingCareerPaths}/>
                        <Input placeholder="Your Skills (comma-separated, e.g., Python, project management, writing)" value={careerSkills} onChange={(e) => setCareerSkills(e.target.value)} disabled={isGeneratingCareerPaths}/>
                         <Input 
                            placeholder="Competitive Exam Score (Optional, e.g., '75 percentile SAT', 'Rank 5000 JEE')" 
                            value={careerCompetitiveExamScore} 
                            onChange={(e) => setCareerCompetitiveExamScore(e.target.value)} 
                            disabled={isGeneratingCareerPaths}
                        />
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
                            <div className="mt-4 p-4 bg-muted rounded-md max-h-[600px] overflow-y-auto">
                                <h4 className="font-semibold mb-3 text-foreground">Suggested Career Paths:</h4>
                                {generatedCareerPaths.suggestions.length > 0 ? (
                                    <Accordion type="single" collapsible className="w-full mb-6">
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
                                ) : (
                                    <p className="text-sm text-muted-foreground">No specific career paths generated. Check the general academic suggestions below.</p>
                                )}

                                {generatedCareerPaths.globallySuggestedStudyFields && generatedCareerPaths.globallySuggestedStudyFields.length > 0 && (
                                    <div className="mb-4">
                                        <h5 className="font-semibold text-foreground mb-2 flex items-center"><GraduationCap className="mr-2 h-5 w-5 text-primary"/>Generally Suggested Study Fields:</h5>
                                        <Accordion type="multiple" className="w-full">
                                            {generatedCareerPaths.globallySuggestedStudyFields.map((field, index) => (
                                                <AccordionItem value={`field-${index}`} key={`field-${index}`}>
                                                    <AccordionTrigger className="text-sm hover:no-underline text-left">{field.fieldName}</AccordionTrigger>
                                                    <AccordionContent className="text-xs pl-4">
                                                        {field.description || "No description provided."}
                                                    </AccordionContent>
                                                </AccordionItem>
                                            ))}
                                        </Accordion>
                                    </div>
                                )}

                                {generatedCareerPaths.globallySuggestedExampleInstitutions && generatedCareerPaths.globallySuggestedExampleInstitutions.length > 0 && (
                                  <div className="mt-2">
                                    <h5 className="font-semibold text-foreground mb-2 flex items-center"><BookOpen className="mr-2 h-5 w-5 text-primary"/>Generally Suggested Example Institutions & Outlook:</h5>
                                     <Accordion type="multiple" className="w-full">
                                        {generatedCareerPaths.globallySuggestedExampleInstitutions.map((inst, i) => (
                                            <AccordionItem value={`inst-${i}`} key={`inst-${i}`}>
                                                <AccordionTrigger className="text-sm hover:no-underline text-left">{inst.institutionName}</AccordionTrigger>
                                                <AccordionContent className="text-xs pl-4">
                                                    <p><strong>Outlook:</strong> {inst.admissionOutlook || "General outlook not specified."}</p>
                                                </AccordionContent>
                                            </AccordionItem>
                                        ))}
                                    </Accordion>
                                    <p className="text-xs italic text-muted-foreground mt-3 p-2 bg-background/50 rounded-md border border-dashed">
                                      <AlertTriangle className="inline h-4 w-4 mr-1 text-yellow-600"/>
                                      **Important Disclaimer:** Institutional examples and admission outlooks are illustrative and based on general information. Admission is highly competitive and depends on many factors beyond scores. Always research and verify current admission requirements directly with institutions. This information is not a guarantee of admission.
                                    </p>
                                  </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
              )}

             {activeTool === 'code-gen' && (
                <Card className="shadow-xl bg-card">
                    <CardHeader>
                        <CardTitle className="font-headline text-2xl text-primary flex items-center"><SearchCode className="mr-2 h-7 w-7"/>AI Code &amp; DSA Helper</CardTitle>
                        <CardDescription>Generate code snippets, get DSA help, and analyze your code for syntax, correctness, and improvements with AI.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Textarea placeholder="Describe the code you want to generate (e.g., 'a Python function for quicksort', 'Java code for a linked list node', 'solve fizzbuzz')..." value={codePrompt} onChange={(e) => { setCodePrompt(e.target.value); setCodeAnalysis(null); }} disabled={isGeneratingCode || isAnalyzingCode} className="min-h-[80px]"/>
                        <Input placeholder="Programming Language (e.g., Python, JavaScript, Java - optional)" value={codeLanguage} onChange={(e) => { setCodeLanguage(e.target.value); setCodeAnalysis(null); }} disabled={isGeneratingCode || isAnalyzingCode} />
                        <div className="flex flex-wrap gap-2">
                            <Button onClick={handleGenerateCode} disabled={isGeneratingCode || isAnalyzingCode || !codePrompt.trim()} className="flex-grow sm:flex-grow-0">
                                {isGeneratingCode ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />} Generate Code
                            </Button>
                            {generatedCode && (
                                <Button onClick={handleAnalyzeCode} variant="outline" disabled={isAnalyzingCode || isGeneratingCode} className="flex-grow sm:flex-grow-0">
                                    {isAnalyzingCode ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileSignature className="mr-2 h-4 w-4" />} Analyze Code
                                </Button>
                            )}
                        </div>
                        {generatedCode && (
                            <div className="mt-4 p-4 bg-muted rounded-md">
                                <div className="flex justify-between items-center mb-2">
                                    <h4 className="font-semibold text-foreground">Generated Code:</h4>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            navigator.clipboard.writeText(generatedCode);
                                            toast({ title: "Copied!", description: "Generated code copied to clipboard." });
                                        }}
                                        disabled={!generatedCode || isGeneratingCode || isAnalyzingCode}
                                    >
                                        <Copy className="mr-2 h-4 w-4" /> Copy Code
                                    </Button>
                                </div>
                                <pre className="text-sm whitespace-pre-wrap overflow-x-auto bg-background/50 p-3 rounded-md"><code>{generatedCode}</code></pre>
                            </div>
                        )}
                        {isAnalyzingCode && (
                            <div className="mt-4 p-4 bg-muted rounded-md flex items-center justify-center">
                                <Loader2 className="mr-2 h-5 w-5 animate-spin text-primary" />
                                <p className="text-primary">AI is analyzing your code...</p>
                            </div>
                        )}
                        {codeAnalysis && !isAnalyzingCode && (
                            <div className="mt-6 p-4 border border-primary/30 rounded-lg bg-card space-y-4">
                                <h4 className="text-lg font-semibold text-primary flex items-center"><FileSignature className="mr-2 h-6 w-6"/>AI Code Analysis:</h4>
                                <Accordion type="multiple" defaultValue={["syntax", "correctness"]} className="w-full">
                                    <AccordionItem value="syntax">
                                        <AccordionTrigger className="text-base hover:no-underline">Syntax Feedback</AccordionTrigger>
                                        <AccordionContent className="text-sm whitespace-pre-wrap">{codeAnalysis.syntaxFeedback}</AccordionContent>
                                    </AccordionItem>
                                    <AccordionItem value="correctness">
                                        <AccordionTrigger className="text-base hover:no-underline flex items-center">
                                            Correctness Assessment 
                                            {codeAnalysis.meetsRequirements ? <Check className="ml-2 h-5 w-5 text-green-600"/> : <X className="ml-2 h-5 w-5 text-red-600"/>}
                                        </AccordionTrigger>
                                        <AccordionContent className="text-sm whitespace-pre-wrap">{codeAnalysis.correctnessAssessment}</AccordionContent>
                                    </AccordionItem>
                                    <AccordionItem value="improvements">
                                        <AccordionTrigger className="text-base hover:no-underline">Improvement Suggestions</AccordionTrigger>
                                        <AccordionContent className="text-sm whitespace-pre-wrap">{codeAnalysis.improvementSuggestions}</AccordionContent>
                                    </AccordionItem>
                                    {codeAnalysis.styleAndBestPractices && (
                                        <AccordionItem value="style">
                                            <AccordionTrigger className="text-base hover:no-underline">Style & Best Practices</AccordionTrigger>
                                            <AccordionContent className="text-sm whitespace-pre-wrap">{codeAnalysis.styleAndBestPractices}</AccordionContent>
                                        </AccordionItem>
                                    )}
                                    {codeAnalysis.potentialBugsOrEdgeCases && (
                                        <AccordionItem value="bugs">
                                            <AccordionTrigger className="text-base hover:no-underline">Potential Bugs/Edge Cases</AccordionTrigger>
                                            <AccordionContent className="text-sm whitespace-pre-wrap">{codeAnalysis.potentialBugsOrEdgeCases}</AccordionContent>
                                        </AccordionItem>
                                    )}
                                </Accordion>
                            </div>
                        )}
                        {!generatedCode && !isGeneratingCode && !codeAnalysis && !isAnalyzingCode && (
                            <div className="text-center text-muted-foreground py-4">
                                <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
                                <p>Your generated code and AI analysis will appear here.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
              )}

              {activeTool === 'image-gen' && (
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
              )}

              {activeTool === 'diagram-gen' && (
                <Card className="shadow-xl bg-card">
                    <CardHeader>
                        <CardTitle className="font-headline text-2xl text-primary flex items-center"><Wand2 className="mr-2 h-7 w-7"/>AI Diagram Generator</CardTitle>
                        <CardDescription>Generate visual diagrams, including flowcharts, mind maps, basic engineering graphics, and technical drawings as images from your text descriptions.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Textarea placeholder="Describe the diagram (e.g., 'A flowchart for a login process', 'P&ID for a simple heat exchanger', 'Isometric view of a cube with rounded edges')..." value={diagramPrompt} onChange={(e) => setDiagramPrompt(e.target.value)} disabled={isGeneratingDiagram} className="min-h-[80px]"/>
                        <Button onClick={handleGenerateDiagram} disabled={isGeneratingDiagram || !diagramPrompt.trim()} className="w-full sm:w-auto">
                            {isGeneratingDiagram && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Generate Diagram
                        </Button>
                        {generatedDiagramUrl && <div className="mt-4"><h4 className="font-semibold mb-2">Generated Diagram:</h4><Image src={generatedDiagramUrl} alt="Diagram by AI" width={512} height={512} className="rounded-md border shadow-md object-contain" /></div>}
                        {!generatedDiagramUrl && !isGeneratingDiagram && <div className="text-center text-muted-foreground py-4"><Wand2 className="mx-auto h-12 w-12 text-muted-foreground/50" /><p>Your generated diagram will appear here.</p><img data-ai-hint="flowchart structure" src="https://placehold.co/300x200.png" alt="Placeholder" className="mx-auto mt-2 rounded-md opacity-50" /></div>}
                    </CardContent>
                </Card>
              )}

              {activeTool === 'presentations' && (
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
              )}
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
      <footer className="text-center p-4 text-muted-foreground text-sm border-t border-border/50 bg-card">
        © {new Date().getFullYear()} AI Mentor By AP. Empowering students, creators, and professionals with AI.
      </footer>
    </div>
  );
}

