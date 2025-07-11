
"use client";

import { useState, useEffect, useRef, type MouseEvent as ReactMouseEvent } from 'react';
import { Header } from '@/components/scholar-ai/Header';
import { FileUpload } from '@/components/scholar-ai/FileUpload';
import { QuestionInput } from '@/components/scholar-ai/QuestionInput';
import { ResultsDisplay } from '@/components/scholar-ai/ResultsDisplay';
import ResumePreview, { type ResumeData } from '@/components/resume/ResumePreview';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Progress } from "@/components/ui/progress";
import { RefreshCcw, Sparkles, Code, Image as ImageIconLucide, Presentation as PresentationIcon, Wand2, Brain, FileText, Loader2, Lightbulb, Download, Palette, Info, Briefcase, MessageSquareQuote, CheckCircle, Edit3, FileSearch2, GraduationCap, Copy, Share2, Send, FileType, Star, BookOpen, Users, SearchCode, PanelLeft, Mic, Check, X, FileSignature, Settings as SettingsIcon, Edit, Trash2, DownloadCloud, Type, AlertTriangle, Eraser, Linkedin, UploadCloud, Eye, AudioLines, Globe, ImageUp, UserSquare } from 'lucide-react';
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
import { useTheme, type Theme } from "@/components/theme-provider";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';


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
import { generateLinkedInVisuals, type GenerateLinkedInVisualsInput, type GenerateLinkedInVisualsOutput } from '@/ai/flows/linkedin-visuals-generator-flow';
import { textToSpeech, type TextToSpeechInput, type TextToSpeechOutput } from '@/ai/flows/text-to-speech-flow';
import { generatePortfolioSite, type GeneratePortfolioInput, type GeneratePortfolioOutput } from '@/ai/flows/portfolio-generator-flow';


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

const tools = [
  { id: 'document-qa', label: 'Document Q&A', icon: Brain, cardTitle: 'Document Q&A' },
  { id: 'summarizer', label: 'Summarizer', icon: FileType, cardTitle: 'AI Document Summarizer' },
  { id: 'interview-prep', label: 'Interview Prep', icon: MessageSquareQuote, cardTitle: 'AI Interview Question Generator' },
  { id: 'resume-review', label: 'Resume Assistant', icon: Edit3, cardTitle: 'AI Resume & LinkedIn Profile Assistant' },
  { id: 'portfolio-site', label: 'Portfolio Site', icon: Globe, cardTitle: 'AI Portfolio Site Generator' },
  { id: 'linkedin-visuals', label: 'LinkedIn Visuals', icon: UserSquare, cardTitle: 'AI LinkedIn Visuals Generator' },
  { id: 'cover-letter', label: 'Cover Letter', icon: Send, cardTitle: 'AI Cover Letter Assistant' },
  { id: 'career-paths', label: 'Career Paths', icon: Star, cardTitle: 'AI Career Path Suggester' },
  { id: 'code-gen', label: 'Code & DSA', icon: SearchCode, cardTitle: 'AI Code & DSA Helper' },
  { id: 'image-gen', label: 'Image Gen', icon: ImageIconLucide, cardTitle: 'AI Image Generator' },
  { id: 'image-text-editor', label: 'Image-Text Editor', icon: Edit, cardTitle: 'Image Text Editor' },
  { id: 'diagram-gen', label: 'Diagram Gen', icon: Wand2, cardTitle: 'AI Diagram Generator' },
  { id: 'presentations', label: 'Presentations', icon: PresentationIcon, cardTitle: 'AI Presentation Generator' },
  { id: 'text-to-speech', label: 'Text-to-Speech', icon: AudioLines, cardTitle: 'AI Text-to-Speech Converter' },
];

const COMMON_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/*'];
const COMMON_IMAGE_EXTENSIONS_STRING = ".jpg, .jpeg, .png, .gif, .webp, .bmp";
const COMMON_DOC_MIME_TYPES = ["application/pdf", "text/plain", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
const COMMON_DOC_EXTENSIONS_STRING = ".pdf, .txt, .doc, .docx";


// Map language codes (like 'en', 'mr') to full language names for AI prompts
const languageCodeToFullName: Record<string, string> = {
  'en': 'English',
  'es': 'Spanish',
  'fr': 'French',
  'de': 'German',
  'hi': 'Hindi',
  'mr': 'Marathi',
};


export default function MentorAiPage() {
  const [activeTool, setActiveTool] = useState<string>(tools[0].id);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
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

  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState<string>('');
  const [resumeTargetJobRole, setResumeTargetJobRole] = useState<string>('');
  const [resumeAdditionalInfo, setResumeAdditionalInfo] = useState<string>('');
  const [resumeFeedback, setResumeFeedback] = useState<ResumeFeedbackOutput | null>(null);
  const [isGeneratingResumeFeedback, setIsGeneratingResumeFeedback] = useState<boolean>(false);
  const [parsedResumeData, setParsedResumeData] = useState<ResumeData | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  
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
  const [textControlPanel, setTextControlPanel] = useState<{ visible: boolean; x: number; y: number }>({ visible: false, x: 0, y: 0 });
  const [imageEditorTextElements, setImageEditorTextElements] = useState<any[]>([]);
  const [selectedTextElementId, setSelectedTextElementId] = useState<string | null>(null);
  const imageEditorCanvasRef = useRef<HTMLCanvasElement>(null);
  const textInputRef = useRef<HTMLInputElement>(null);
  const [aiImageInstruction, setAiImageInstruction] = useState<string>('');
  const [isManipulatingImageAI, setIsManipulatingImageAI] = useState<boolean>(false);
  const [aiImageManipulationMessage, setAiImageManipulationMessage] = useState<string>('');
  const [isRemovingWatermark, setIsRemovingWatermark] = useState<boolean>(false);
  const [watermarkRemovalMessage, setWatermarkRemovalMessage] = useState<string>('');


  // LinkedIn Visuals Generator States
  const [linkedInUserPhoto, setLinkedInUserPhoto] = useState<File | null>(null);
  const [linkedInFullName, setLinkedInFullName] = useState<string>('');
  const [linkedInProfessionalTitle, setLinkedInProfessionalTitle] = useState<string>('');
  const [linkedInResumeContent, setLinkedInResumeContent] = useState<string>('');
  const [linkedInVisualStyle, setLinkedInVisualStyle] = useState<GenerateLinkedInVisualsInput['stylePreference']>('professional-minimalist');
  const [generatedLinkedInVisuals, setGeneratedLinkedInVisuals] = useState<GenerateLinkedInVisualsOutput | null>(null);
  const [isGeneratingLinkedInVisuals, setIsGeneratingLinkedInVisuals] = useState<boolean>(false);

  // Text-to-Speech States
  const [ttsInputText, setTtsInputText] = useState<string>('');
  const [generatedAudioUri, setGeneratedAudioUri] = useState<string | null>(null);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState<boolean>(false);

  // Portfolio Site Generator States
  const [portfolioProfilePic, setPortfolioProfilePic] = useState<File | null>(null);
  const [portfolioTheme, setPortfolioTheme] = useState<GeneratePortfolioInput['theme']>('professional-dark');
  const [generatedPortfolio, setGeneratedPortfolio] = useState<GeneratePortfolioOutput | null>(null);
  const [isGeneratingPortfolio, setIsGeneratingPortfolio] = useState<boolean>(false);
  const [isPortfolioPreviewOpen, setIsPortfolioPreviewOpen] = useState(false);

  const handleFileChange = (files: File[]) => {
    setSelectedFiles(files);
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
      const documentDataUris = selectedFiles.length > 0
        ? await Promise.all(selectedFiles.map(file => fileToDataUri(file)))
        : undefined;
        
      const searchInput: SmartSearchInput = { documentDataUris: documentDataUris, question };
      const result = await smartSearch(searchInput);
      setSearchResult(result);

      if (result?.answer) {
        const outputLangFullName = languageCodeToFullName[selectedLanguage] || 'English';
        const explainerInput: ExplainAnswerInput = { 
          question, 
          answer: result.answer, 
          outputLanguage: outputLangFullName 
        };
        const explainerResult = await explainAnswer(explainerInput);
        setExplanation(explainerResult.explanation);
        toast({ title: "AI Mentor Success!", description: "Insights generated successfully." });
      } else {
        toast({ title: "Search complete", description: selectedFiles.length > 0 ? "Could not find a direct answer in the document. AI attempted general response." : "I couldn't find an answer to your question." });
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
    setSelectedFiles([]); setQuestion(''); setSearchResult(null); setExplanation(null); setError(null); setIsLoading(false);
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

    const parseResumeData = (text: string): ResumeData => {
        const sections: { [key: string]: string[] } = {
            PERSONAL_INFO: [], SUMMARY: [], KEY_ACHIEVEMENTS: [],
            EXPERIENCE: [], EDUCATION: [], PROJECTS: [], SKILLS: [], ERROR: []
        };
        const sectionKeys = Object.keys(sections);
        let currentSection: string | null = null;
        let currentLines: string[] = [];

        const flushToSection = (sectionName: string, lines: string[]) => {
            if (sections.hasOwnProperty(sectionName)) {
                sections[sectionName].push(...lines);
            }
        };

        for (const line of text.split('\n')) {
            const trimmedLine = line.trim();
            let isSectionHeader = false;
            for (const key of sectionKeys) {
                if (trimmedLine === `SECTION: ${key}`) {
                    if (currentSection && currentLines.length > 0) {
                        flushToSection(currentSection, currentLines);
                    }
                    currentSection = key;
                    currentLines = [];
                    isSectionHeader = true;
                    break;
                }
            }

            if (isSectionHeader) continue;

            if (trimmedLine === 'END_SECTION') {
                if (currentSection && currentLines.length > 0) {
                    flushToSection(currentSection, currentLines);
                }
                currentSection = null;
                currentLines = [];
                continue;
            }

            if (currentSection) {
                currentLines.push(line);
            }
        }

        if (currentSection && currentLines.length > 0) {
            flushToSection(currentSection, currentLines);
        }

        const parseKeyValueSection = (lines: string[]) => {
            const data: { [key: string]: string } = {};
            lines.forEach(line => {
                const parts = line.match(/^([\w\s]+):\s*(.*)$/);
                if (parts) {
                    data[parts[1].trim().toLowerCase().replace(/\s+/g, '_')] = parts[2].trim();
                }
            });
            return data;
        };
        
        const parseMultiEntrySection = (sectionLines: string[], markers: string[]) => {
            if (!sectionLines || sectionLines.length === 0) return [];
            const entries: any[] = [];
            let currentEntry: any = {};
        
            for (const line of sectionLines) {
                const trimmedLine = line.trim();
                if (!trimmedLine) continue;

                const isNewEntryMarker = markers.some(marker => line.startsWith(marker + ':'));
                
                if (isNewEntryMarker && Object.keys(currentEntry).length > 0) {
                    entries.push(currentEntry);
                    currentEntry = {};
                }
        
                if (trimmedLine.startsWith('- ')) {
                    if (!currentEntry.details) currentEntry.details = [];
                    currentEntry.details.push(trimmedLine.substring(2).trim());
                } else if (trimmedLine.toLowerCase() === 'details:') {
                     if (!currentEntry.details) currentEntry.details = [];
                } else {
                    const parts = line.match(/^([\w\s]+):\s*(.*)$/);
                    if (parts) {
                        const key = parts[1].trim().toLowerCase().replace(/\s+/g, '_');
                        const value = parts[2].trim();
                        currentEntry[key] = value;
                    }
                }
            }
        
            if (Object.keys(currentEntry).length > 0) {
                entries.push(currentEntry);
            }
        
            return entries;
        };
        
        const personalInfo = parseKeyValueSection(sections.PERSONAL_INFO);
        const summary = sections.SUMMARY.join('\n').trim();
        const keyAchievements = parseMultiEntrySection(sections.KEY_ACHIEVEMENTS, ['title'])[0] || { details: [] };
        const experience = parseMultiEntrySection(sections.EXPERIENCE, ['title']);
        const education = parseMultiEntrySection(sections.EDUCATION, ['degree']);
        const projects = parseMultiEntrySection(sections.PROJECTS, ['title']);
        const skillsStr = (parseKeyValueSection(sections.SKILLS).skills as string) || '';
        const skills = skillsStr ? skillsStr.split(',').map(s => s.trim()).filter(Boolean) : [];

        return { personalInfo, summary, keyAchievements, experience, education, projects, skills };
    };

    const handleDownloadPdf = async () => {
        const resumeContent = document.getElementById('resume-preview-content');
        if (!resumeContent) {
            toast({ title: "Error", description: "Could not find resume content to print.", variant: "destructive" });
            return;
        }

        toast({ title: "Preparing PDF...", description: "Please wait, this may take a moment." });

        try {
            const canvas = await html2canvas(resumeContent, {
                scale: 2,
                useCORS: true, 
                logging: true,
                onclone: (document) => {
                  const style = document.createElement('style');
                  style.innerHTML = `
                      @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap');
                      #resume-preview-content * {
                          font-family: 'Roboto', sans-serif !important;
                      }
                  `;
                  document.head.appendChild(style);
                }
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const imgWidth = canvas.width;
            const imgHeight = canvas.height;
            const ratio = imgHeight / imgWidth;
            const finalImgHeight = pdfWidth * ratio;

            if (finalImgHeight > pdfHeight) {
              console.warn("Content might be too long for a single A4 page. Consider a more compact layout.");
            }

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, finalImgHeight);
            pdf.save('resume.pdf');
            toast({ title: "Download Started", description: "Your resume PDF is being downloaded." });
        } catch (e) {
            console.error(e);
            toast({ title: "PDF Generation Failed", description: "An error occurred while creating the PDF. Please try again.", variant: "destructive" });
        }
    };


  const handleGetResumeFeedback = async () => {
    const hasFile = !!resumeFile;
    const hasText = !!resumeText.trim();
    const hasAdditionalInfo = !!resumeAdditionalInfo.trim();

    if (!hasFile && !hasText && !hasAdditionalInfo) { 
      toast({ title: "Input Required", description: "Please upload/paste a resume OR provide details for AI to create one.", variant: "destructive" }); return; 
    }
    setIsGeneratingResumeFeedback(true); 
    setResumeFeedback(null);
    setParsedResumeData(null);
    try {
      const dataUriForFlow = resumeFile ? await fileToDataUri(resumeFile) : undefined;
      const result = await getResumeFeedback({ 
        resumeDataUri: dataUriForFlow,
        resumeText: resumeText || undefined, 
        targetJobRole: resumeTargetJobRole || undefined,
        additionalInformation: resumeAdditionalInfo || undefined 
      });
      setResumeFeedback(result);
      if (result?.modifiedResumeText && !result.modifiedResumeText.includes("SECTION: ERROR")) {
        const data = parseResumeData(result.modifiedResumeText);
        setParsedResumeData(data);
      }
      toast({ title: "Resume Assistant Complete!", description: "Your resume feedback/creation and LinkedIn suggestions are ready." });
    } catch (err: any) { toast({ title: "Resume Feedback Error", description: err.message || "Failed to get feedback.", variant: "destructive" }); }
    finally { setIsGeneratingResumeFeedback(false); }
  };

  const handleResetResumeImprover = () => {
    setResumeFile(null);
    const resumeFileInput = document.getElementById('resume-file-upload') as HTMLInputElement;
    if (resumeFileInput) resumeFileInput.value = '';
    setResumeText('');
    setResumeTargetJobRole('');
    setResumeAdditionalInfo('');
    setResumeFeedback(null);
    setIsGeneratingResumeFeedback(false);
    setParsedResumeData(null);
    toast({ title: "Cleared", description: "Resume Assistant form and results have been cleared." });
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
        setTextControlPanel({ visible: false, x: 0, y: 0 });
        setAiImageManipulationMessage('');
        setWatermarkRemovalMessage('');
        setAiImageInstruction('');
    };

    const handleCanvasClick = (e: ReactMouseEvent<HTMLCanvasElement>) => {
        const canvas = imageEditorCanvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;
        
        let clickedOnText = false;
        for (const el of imageEditorTextElements) {
            const ctx = canvas.getContext('2d');
            if (!ctx) continue;
            ctx.font = `${el.fontSize}px ${el.fontFamily}`;
            const textMetrics = ctx.measureText(el.text);
            const elWidth = textMetrics.width;
            const elHeight = el.fontSize; 
            if (x >= el.x && x <= el.x + elWidth && y >= el.y - elHeight && y <= el.y) {
                setSelectedTextElementId(el.id);
                setTextControlPanel({ visible: true, x: e.clientX, y: e.clientY });
                clickedOnText = true;
                break;
            }
        }

        if (!clickedOnText) {
            setSelectedTextElementId(null);
            setTextControlPanel({ visible: false, x: 0, y: 0 });
        }
    };

    const handleAddText = () => {
        const canvas = imageEditorCanvasRef.current;
        if (!canvas || !imageEditorSrc) {
            toast({ title: "No Image", description: "Please upload an image first.", variant: "destructive"});
            return;
        };
        const newId = new Date().toISOString();
        const newTextElement = {
            id: newId,
            text: "New Text",
            x: canvas.width / 4,
            y: canvas.height / 2,
            color: theme === 'dark' ? '#FFFFFF' : '#000000',
            fontSize: 40,
            fontFamily: 'Arial',
        };
        setImageEditorTextElements(prev => [...prev, newTextElement]);
        setSelectedTextElementId(newId);
        setTextControlPanel({ visible: true, x: 200, y: 200}); // Default position
        setTimeout(() => textInputRef.current?.focus(), 100);
    };

    const handleUpdateSelectedText = (prop: string, value: string | number) => {
        if (!selectedTextElementId) return;
        setImageEditorTextElements(prev =>
            prev.map(el =>
                el.id === selectedTextElementId ? { ...el, [prop]: value } : el
            )
        );
    };

    const handleDeleteSelectedText = () => {
        if (!selectedTextElementId) return;
        setImageEditorTextElements(prev => prev.filter(el => el.id !== selectedTextElementId));
        setSelectedTextElementId(null);
        setTextControlPanel({ visible: false, x: 0, y: 0 });
        toast({ title: "Text Deleted", description: "Selected text has been removed." });
    };

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
    setTextControlPanel({ visible: false, x: 0, y: 0 });
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

  const handleGenerateLinkedInVisuals = async () => {
    if (!linkedInResumeContent.trim() && !linkedInUserPhoto) {
      toast({ title: "Input Required", description: "Please paste resume content or upload a photo.", variant: "destructive" });
      return;
    }
    setIsGeneratingLinkedInVisuals(true);
    setGeneratedLinkedInVisuals(null);
    try {
      const userImageUri = linkedInUserPhoto ? await fileToDataUri(linkedInUserPhoto) : undefined;
      const result = await generateLinkedInVisuals({
        fullName: linkedInFullName || undefined,
        professionalTitle: linkedInProfessionalTitle || undefined,
        stylePreference: linkedInVisualStyle,
        resumeContent: linkedInResumeContent || undefined,
        userImageUri: userImageUri,
      });
      setGeneratedLinkedInVisuals(result);
      toast({ title: "LinkedIn Visuals Generated!", description: "AI has created suggestions for your profile." });
    } catch (err: any) {
      toast({ title: "LinkedIn Visuals Error", description: (err as Error).message || "Failed to generate LinkedIn visuals.", variant: "destructive" });
    } finally {
      setIsGeneratingLinkedInVisuals(false);
    }
  };

  const handleGenerateAudio = async () => {
    if (!ttsInputText.trim()) {
        toast({ title: "Error", description: "Please enter some text to convert to speech.", variant: "destructive" });
        return;
    }
    setIsGeneratingAudio(true);
    setGeneratedAudioUri(null);
    try {
        const result = await textToSpeech(ttsInputText);
        setGeneratedAudioUri(result.audioDataUri);
        toast({ title: "Audio Generated!", description: "Your text has been converted to speech." });
    } catch (err: any) {
        toast({ title: "Audio Generation Error", description: err.message || "Failed to generate audio.", variant: "destructive" });
    } finally {
        setIsGeneratingAudio(false);
    }
  };

  const handleGeneratePortfolio = async () => {
    if (!resumeFeedback?.modifiedResumeText) {
      toast({ title: "Resume Required", description: "Please generate or improve a resume first using the 'Resume Assistant' tool.", variant: "destructive" });
      return;
    }
    setIsGeneratingPortfolio(true);
    setGeneratedPortfolio(null);
    try {
      const profilePicDataUri = portfolioProfilePic ? await fileToDataUri(portfolioProfilePic) : undefined;
      const result = await generatePortfolioSite({
        resumeText: resumeFeedback.modifiedResumeText,
        theme: portfolioTheme,
        profilePictureDataUri: profilePicDataUri,
      });
      setGeneratedPortfolio(result);
      toast({ title: "Portfolio Site Generated!", description: "Your new portfolio is ready to preview and download." });
    } catch (err: any) {
      toast({ title: "Portfolio Generation Error", description: (err as Error).message || "Failed to generate portfolio.", variant: "destructive" });
    } finally {
      setIsGeneratingPortfolio(false);
    }
  };

  const handleDownloadPortfolio = () => {
    if (!generatedPortfolio) return;
    const { htmlContent, cssContent } = generatedPortfolio;
  
    const htmlBlob = new Blob([htmlContent], { type: 'text/html' });
    const htmlUrl = URL.createObjectURL(htmlBlob);
  
    const cssBlob = new Blob([cssContent], { type: 'text/css' });
    const cssUrl = URL.createObjectURL(cssBlob);
  
    const htmlLink = document.createElement('a');
    htmlLink.href = htmlUrl;
    htmlLink.download = 'index.html';
    document.body.appendChild(htmlLink);
    htmlLink.click();
    document.body.removeChild(htmlLink);
    URL.revokeObjectURL(htmlUrl);
  
    const cssLink = document.createElement('a');
    cssLink.href = cssUrl;
    cssLink.download = 'style.css';
    document.body.appendChild(cssLink);
    cssLink.click();
    document.body.removeChild(cssLink);
    URL.revokeObjectURL(cssUrl);

    toast({ title: "Portfolio Downloaded", description: "index.html and style.css have been saved. Place them in the same folder to view."});
  };
  
  const selectedTextElement = imageEditorTextElements.find(el => el.id === selectedTextElementId);
  const activeToolData = tools.find(tool => tool.id === activeTool) || tools[0];
  const availableFonts = ['Arial', 'Verdana', 'Times New Roman', 'Courier New', 'Georgia', 'Comic Sans MS', 'Impact', 'Helvetica'];
  
  const hasExistingResumeInput = !!(resumeFile || resumeText.trim());
  const canCreateNewResume = !!(resumeAdditionalInfo.trim() && !hasExistingResumeInput);
  let resumeButtonText = "Provide Input";
  if (hasExistingResumeInput) resumeButtonText = "Improve Resume";
  else if (canCreateNewResume) resumeButtonText = "Create Resume";


  return (
    <>
      <div id="app-wrapper" className={'flex flex-col min-h-screen bg-background'}>
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
                      <CardDescription>Upload one or more documents (PDF, TXT, DOC, DOCX) and ask questions, or ask general questions without a document. The AI will attempt to answer in the language of your question. Explanations will be in your selected global language.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                        <div className="lg:col-span-1 space-y-6">
                          <FileUpload 
                            selectedFiles={selectedFiles} 
                            onFileChange={handleFileChange} 
                            isLoading={isLoading} 
                            inputId="file-upload-input"
                            acceptedFileTypes={COMMON_DOC_MIME_TYPES}
                            acceptedFileExtensionsString={COMMON_DOC_EXTENSIONS_STRING}
                          />
                          <QuestionInput question={question} onQuestionChange={setQuestion} onSubmit={handleSubmitScholarAI} isLoading={isLoading} isSubmitDisabled={!question.trim()}/>
                          <Button variant="outline" onClick={handleResetScholarAI} disabled={isLoading} className="w-full"><RefreshCcw className="mr-2 h-4 w-4" /> Clear Q&amp;A</Button>
                        </div>
                        <div className="lg:col-span-2">
                          <ResultsDisplay searchResult={searchResult} explanation={explanation} isLoading={isLoading} error={error} language={selectedLanguage} hasDocument={selectedFiles.length > 0} question={question}/>
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
                          <FileUpload 
                            selectedFiles={summarizerFile ? [summarizerFile] : []} 
                            onFileChange={(files) => setSummarizerFile(files[0] || null)} 
                            isLoading={isGeneratingSummary} 
                            inputId="summarizer-file-upload"
                            acceptedFileTypes={COMMON_DOC_MIME_TYPES}
                            acceptedFileExtensionsString={COMMON_DOC_EXTENSIONS_STRING}
                            label="Upload Document"
                          />
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
                            <CardDescription>Upload an image, add text overlays, or use AI to modify in-image text or remove watermarks. Download your creation.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="md:col-span-1 space-y-4">
                                    <FileUpload 
                                        selectedFiles={imageEditorSrc instanceof File ? [imageEditorSrc] : []} 
                                        onFileChange={(files) => handleImageEditorFileChange(files[0] || null)} 
                                        isLoading={isManipulatingImageAI || isRemovingWatermark} 
                                        inputId="image-editor-file-upload"
                                        label="Upload Image"
                                        acceptedFileTypes={COMMON_IMAGE_MIME_TYPES}
                                        acceptedFileExtensionsString={COMMON_IMAGE_EXTENSIONS_STRING}
                                    />
                                    <Separator />
                                    <Button onClick={handleAddText} disabled={!imageEditorSrc} className="w-full">
                                        <Type className="mr-2 h-4 w-4"/> Add New Text
                                    </Button>

                                    <Accordion type="single" collapsible className="w-full">
                                      <AccordionItem value="ai-tools">
                                        <AccordionTrigger className="text-md font-semibold text-primary hover:no-underline"><Sparkles className="mr-2 h-5 w-5"/>AI Image Tools</AccordionTrigger>
                                        <AccordionContent className="space-y-4 pt-2">
                                          <div className="space-y-3">
                                              <Label className="flex items-center">In-Image Text Manipulation</Label>
                                              <Input 
                                                  id="ai-image-instruction" 
                                                  value={aiImageInstruction} 
                                                  onChange={(e) => setAiImageInstruction(e.target.value)} 
                                                  placeholder={imageEditorSrc ? "e.g., Change 'Hello' to 'Hi'" : "Upload an image first..."}
                                                  disabled={!imageEditorSrc || isManipulatingImageAI || isRemovingWatermark}
                                              />
                                              <Button onClick={handleAiImageManipulation} disabled={!imageEditorSrc || !aiImageInstruction.trim() || isManipulatingImageAI || isRemovingWatermark} className="w-full">
                                                  {isManipulatingImageAI && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>} Apply AI Edit
                                              </Button>
                                              {aiImageManipulationMessage && <p className="text-xs text-muted-foreground p-2 bg-muted/50 rounded-md">{aiImageManipulationMessage}</p>}
                                          </div>
                                          <div className="space-y-3">
                                              <Label className="flex items-center"><Eraser className="mr-2 h-4 w-4"/>Watermark Remover</Label>
                                              <Button onClick={handleAiWatermarkRemoval} disabled={!imageEditorSrc || isManipulatingImageAI || isRemovingWatermark} className="w-full">
                                                {isRemovingWatermark && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>} Attempt Removal
                                              </Button>
                                              {watermarkRemovalMessage && <p className="text-xs text-muted-foreground p-2 bg-muted/50 rounded-md">{watermarkRemovalMessage}</p>}
                                         </div>
                                        </AccordionContent>
                                      </AccordionItem>
                                    </Accordion>
                                </div>

                                <div className="md:col-span-2 relative">
                                    <div className="w-full h-full bg-muted/20 border border-dashed rounded-md flex items-center justify-center overflow-hidden">
                                      <canvas
                                          ref={imageEditorCanvasRef}
                                          onClick={handleCanvasClick}
                                          className="max-w-full max-h-full object-contain"
                                      />
                                      {!imageEditorSrc && (
                                          <div className="absolute text-center text-muted-foreground">
                                              <ImageIconLucide className="mx-auto h-12 w-12" />
                                              <p>Upload an image to start editing.</p>
                                          </div>
                                      )}
                                    </div>
                                    {textControlPanel.visible && selectedTextElement && (
                                        <div
                                          className="absolute z-10 bg-background/80 backdrop-blur-sm border rounded-lg shadow-xl p-3 space-y-3"
                                          style={{ top: textControlPanel.y + 10, left: textControlPanel.x + 10 }}
                                        >
                                          <Input ref={textInputRef} value={selectedTextElement.text} onChange={(e) => handleUpdateSelectedText('text', e.target.value)} placeholder="Text" className="w-48" />
                                          <div className="flex items-center gap-2">
                                            <Input type="number" value={selectedTextElement.fontSize} onChange={(e) => handleUpdateSelectedText('fontSize', Number(e.target.value))} placeholder="Size" className="w-20"/>
                                            <Input type="color" value={selectedTextElement.color} onChange={(e) => handleUpdateSelectedText('color', e.target.value)} className="w-10 h-10 p-1"/>
                                          </div>
                                          <Select value={selectedTextElement.fontFamily} onValueChange={(v) => handleUpdateSelectedText('fontFamily', v)}>
                                              <SelectTrigger><SelectValue /></SelectTrigger>
                                              <SelectContent>{availableFonts.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                                          </Select>
                                          <Button onClick={handleDeleteSelectedText} variant="destructive" size="sm" className="w-full"><Trash2 className="mr-2 h-4 w-4"/> Delete</Button>
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
                          <CardTitle className="font-headline text-2xl text-primary flex items-center"><Edit3 className="mr-2 h-7 w-7"/>AI Resume &amp; LinkedIn Profile Assistant</CardTitle>
                          <CardDescription>Improve your existing resume OR get help creating a new one! Provide details for AI to generate a professional resume and comprehensive LinkedIn profile suggestions.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                          <FileUpload
                              selectedFiles={resumeFile ? [resumeFile] : []}
                              onFileChange={(files) => setResumeFile(files[0] || null)}
                              isLoading={isGeneratingResumeFeedback}
                              inputId="resume-file-upload"
                              label="Upload Resume (PDF, DOC, DOCX, TXT - Optional)"
                              acceptedFileTypes={COMMON_DOC_MIME_TYPES}
                              acceptedFileExtensionsString={COMMON_DOC_EXTENSIONS_STRING}
                          />
                          <p className="text-xs text-muted-foreground text-center">- OR -</p>
                          <Textarea 
                              placeholder="PASTE your full resume text here (optional if creating new)..." 
                              value={resumeText} 
                              onChange={(e) => setResumeText(e.target.value)} 
                              disabled={isGeneratingResumeFeedback} 
                              className="min-h-[150px]"
                          />
                          <Input 
                              placeholder="Target Job Role or Industry (Optional, e.g., 'Data Analyst')" 
                              value={resumeTargetJobRole} 
                              onChange={(e) => setResumeTargetJobRole(e.target.value)} 
                              disabled={isGeneratingResumeFeedback} 
                          />
                          <Textarea 
                              placeholder="FOR NEW RESUME: Enter all your details (name, contact, experience, education, skills, projects, etc.). FOR EXISTING: Add specific details AI should include."
                              value={resumeAdditionalInfo}
                              onChange={(e) => setResumeAdditionalInfo(e.target.value)}
                              disabled={isGeneratingResumeFeedback}
                              className="min-h-[100px]"
                          />
                          <div className="flex flex-wrap gap-2">
                              <Button 
                                  onClick={handleGetResumeFeedback} 
                                  disabled={isGeneratingResumeFeedback || (!resumeFile && !resumeText.trim() && !resumeAdditionalInfo.trim())} 
                                  className="w-auto"
                              >
                                  {isGeneratingResumeFeedback && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} 
                                  {resumeButtonText}
                              </Button>
                               {parsedResumeData && (
                                <>
                                  <Button variant="secondary" onClick={() => setIsPreviewOpen(true)} disabled={isGeneratingResumeFeedback}>
                                      <Eye className="mr-2 h-4 w-4" /> Preview Resume
                                  </Button>
                                </>
                              )}
                              <Button variant="outline" onClick={handleResetResumeImprover} disabled={isGeneratingResumeFeedback} className="w-auto">
                                  <RefreshCcw className="mr-2 h-4 w-4" /> Clear Form & Results
                              </Button>
                          </div>
                          
                          {resumeFeedback && (
                              <div className="mt-4 p-4 bg-muted rounded-md max-h-[600px] overflow-y-auto space-y-6">
                                  
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                      {resumeFeedback.originalAtsScore && (
                                          <Card className="bg-background/50">
                                              <CardHeader className="pb-2">
                                                  <CardTitle className="text-base font-semibold text-muted-foreground">Original ATS Score</CardTitle>
                                              </CardHeader>
                                              <CardContent>
                                                  <div className="flex items-center gap-3">
                                                      <span className="font-bold text-2xl text-primary">{resumeFeedback.originalAtsScore.score}<span className="text-sm font-normal text-muted-foreground">/100</span></span>
                                                      <Progress value={resumeFeedback.originalAtsScore.score} className="w-full h-2" />
                                                  </div>
                                                  <p className="text-xs text-muted-foreground mt-2">{resumeFeedback.originalAtsScore.explanation}</p>
                                              </CardContent>
                                          </Card>
                                      )}
                                      {resumeFeedback.improvedAtsScore && (
                                          <Card className={`bg-background/50 ${!resumeFeedback.originalAtsScore ? 'md:col-span-2' : ''}`}>
                                              <CardHeader className="pb-2">
                                                  <CardTitle className="text-base font-semibold text-green-600 dark:text-green-500">Improved ATS Score</CardTitle>
                                              </CardHeader>
                                              <CardContent>
                                                  <div className="flex items-center gap-3">
                                                      <span className="font-bold text-2xl text-green-600 dark:text-green-500">{resumeFeedback.improvedAtsScore.score}<span className="text-sm font-normal text-muted-foreground">/100</span></span>
                                                      <Progress value={resumeFeedback.improvedAtsScore.score} indicatorClassName="bg-green-500" className="w-full h-2" />
                                                  </div>
                                                  <p className="text-xs text-muted-foreground mt-2">{resumeFeedback.improvedAtsScore.explanation}</p>
                                              </CardContent>
                                          </Card>
                                      )}
                                  </div>


                                  <div>
                                      <div className="flex flex-wrap justify-between items-center mb-2 gap-2">
                                          <h4 className="font-semibold text-foreground">{resumeFeedback.modifiedResumeText.includes("SECTION: ERROR") ? "Message:" : "AI-Generated/Modified Resume:"}</h4>
                                          {!resumeFeedback.modifiedResumeText.includes("SECTION: ERROR") && (
                                          <div className="flex gap-2">
                                              <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  onClick={() => {
                                                      navigator.clipboard.writeText(resumeFeedback.modifiedResumeText);
                                                      toast({ title: "Copied!", description: "Resume text copied to clipboard." });
                                                  }}
                                              >
                                                  <Copy className="mr-2 h-4 w-4" /> Copy Text
                                              </Button>
                                          </div>
                                          )}
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

                                  {resumeFeedback.feedbackItems && resumeFeedback.feedbackItems.length > 0 && !resumeFeedback.modifiedResumeText.includes("SECTION: ERROR") && (
                                  <div>
                                      <h4 className="font-semibold mb-2 text-foreground">Feedback &amp; Analysis:</h4>
                                      <p className="text-sm mb-3 p-3 bg-background/50 rounded-md"><strong>Overall Assessment:</strong> {resumeFeedback.overallAssessment}</p>
                                      {resumeFeedback.atsKeywordsSummary && resumeFeedback.atsKeywordsSummary !== "Not applicable." && <p className="text-sm mb-3 p-3 bg-primary/10 text-primary rounded-md"><strong>ATS Keywords Summary:</strong> {resumeFeedback.atsKeywordsSummary}</p>}
                                      <Accordion type="single" collapsible className="w-full">
                                          {resumeFeedback.feedbackItems.map((item, index) => (
                                          <AccordionItem value={`feedback-${index}`} key={index}>
                                              <AccordionTrigger className="text-sm hover:no-underline text-left">
                                              <div className="flex items-start">
                                                  <CheckCircle className={`mr-2 mt-1 h-4 w-4 flex-shrink-0 ${item.importance === 'high' ? 'text-red-500' : item.importance === 'medium' ? 'text-yellow-600' : 'text-green-500'}`}/>
                                                  <span><strong>{item.area}</strong> {item.importance && `(${item.importance})`}</span>
                                              </div>
                                              </AccordionTrigger>
                                              <AccordionContent className="text-xs pl-8 whitespace-pre-wrap">
                                              {item.suggestion}
                                              </AccordionContent>
                                          </AccordionItem>
                                          ))}
                                      </Accordion>
                                  </div>
                                  )}
                                  {resumeFeedback.linkedinProfileSuggestions && !resumeFeedback.modifiedResumeText.includes("SECTION: ERROR") && (
                                      <div className="mt-4">
                                          <h4 className="font-semibold text-foreground mb-2 flex items-center">
                                              <Linkedin className="mr-2 h-5 w-5 text-blue-700 dark:text-blue-500" />
                                              Detailed LinkedIn Profile Suggestions:
                                          </h4>
                                          <div className="space-y-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-700/30">
                                              {resumeFeedback.linkedinProfileSuggestions.suggestedHeadline && (
                                                  <div>
                                                      <Label className="text-blue-800 dark:text-blue-300 font-medium">Suggested Headline:</Label>
                                                      <div className="flex items-start gap-2">
                                                          <Textarea value={resumeFeedback.linkedinProfileSuggestions.suggestedHeadline} readOnly className="text-sm text-blue-900 dark:text-blue-200 bg-blue-100/50 dark:bg-blue-800/30 flex-1" rows={2} aria-label="Suggested LinkedIn Headline" />
                                                          <Button variant="ghost" size="sm" onClick={() => { navigator.clipboard.writeText(resumeFeedback.linkedinProfileSuggestions!.suggestedHeadline!); toast({ description: "Headline copied!" });}} aria-label="Copy headline"><Copy className="h-4 w-4" /></Button>
                                                      </div>
                                                  </div>
                                              )}
                                              {resumeFeedback.linkedinProfileSuggestions.suggestedAboutSection && (
                                                  <div>
                                                      <Label className="text-blue-800 dark:text-blue-300 font-medium">Suggested About Section:</Label>
                                                       <div className="flex items-start gap-2">
                                                          <Textarea value={resumeFeedback.linkedinProfileSuggestions.suggestedAboutSection} readOnly className="text-sm text-blue-900 dark:text-blue-200 bg-blue-100/50 dark:bg-blue-800/30 flex-1 min-h-[100px]" aria-label="Suggested LinkedIn About Section" />
                                                          <Button variant="ghost" size="sm" onClick={() => { navigator.clipboard.writeText(resumeFeedback.linkedinProfileSuggestions!.suggestedAboutSection!); toast({ description: "About section copied!" });}} aria-label="Copy about section"><Copy className="h-4 w-4" /></Button>
                                                      </div>
                                                  </div>
                                              )}
                                              
                                              <div>
                                                  <Label className="text-blue-800 dark:text-blue-300 font-medium">Experience Section Tips:</Label>
                                                  <div className="flex items-start gap-2">
                                                      <Textarea 
                                                      value={resumeFeedback.linkedinProfileSuggestions.experienceSectionTips || "No specific tips provided by AI."} 
                                                      readOnly 
                                                      className="text-xs text-blue-900 dark:text-blue-200 bg-blue-100/50 dark:bg-blue-800/30 flex-1" 
                                                      rows={3} 
                                                      aria-label="LinkedIn Experience Section Tips"
                                                      />
                                                      <Button 
                                                      variant="ghost" 
                                                      size="sm" 
                                                      onClick={() => { 
                                                          if (resumeFeedback.linkedinProfileSuggestions?.experienceSectionTips) {
                                                          navigator.clipboard.writeText(resumeFeedback.linkedinProfileSuggestions.experienceSectionTips); 
                                                          toast({ description: "Experience tips copied!" });
                                                          }
                                                      }}
                                                      disabled={!resumeFeedback.linkedinProfileSuggestions?.experienceSectionTips}
                                                      aria-label="Copy experience tips"
                                                      >
                                                      <Copy className="h-4 w-4" />
                                                      </Button>
                                                  </div>
                                              </div>

                                              <div>
                                                  <Label className="text-blue-800 dark:text-blue-300 font-medium">Skills Section Tips:</Label>
                                                  <div className="flex items-start gap-2">
                                                      <Textarea 
                                                      value={resumeFeedback.linkedinProfileSuggestions.skillsSectionTips || "No specific tips provided by AI."} 
                                                      readOnly 
                                                      className="text-xs text-blue-900 dark:text-blue-200 bg-blue-100/50 dark:bg-blue-800/30 flex-1" 
                                                      rows={3} 
                                                      aria-label="LinkedIn Skills Section Tips"
                                                      />
                                                      <Button 
                                                      variant="ghost" 
                                                      size="sm" 
                                                      onClick={() => { 
                                                          if (resumeFeedback.linkedinProfileSuggestions?.skillsSectionTips) {
                                                          navigator.clipboard.writeText(resumeFeedback.linkedinProfileSuggestions.skillsSectionTips); 
                                                          toast({ description: "Skills tips copied!" });
                                                          }
                                                      }}
                                                      disabled={!resumeFeedback.linkedinProfileSuggestions?.skillsSectionTips}
                                                      aria-label="Copy skills tips"
                                                      >
                                                      <Copy className="h-4 w-4" />
                                                      </Button>
                                                  </div>
                                              </div>
                                              
                                              <p className="text-xs text-blue-700/80 dark:text-blue-400/80 mt-2 italic">
                                                Note: These suggestions are generated based on your resume. The AI cannot directly access or modify your live LinkedIn profile.
                                              </p>
                                          </div>
                                      </div>
                                  )}
                              </div>
                          )}
                      </CardContent>
                  </Card>
                )}

                {activeTool === 'portfolio-site' && (
                  <Card className="shadow-xl bg-card">
                    <CardHeader>
                      <CardTitle className="font-headline text-2xl text-primary flex items-center"><Globe className="mr-2 h-7 w-7"/>AI Portfolio Site Generator</CardTitle>
                      <CardDescription>Generate a complete, single-page portfolio website from your improved resume. First, use the 'Resume Assistant' tool, then come back here, upload an optional profile picture, and generate your site.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {!resumeFeedback?.modifiedResumeText || resumeFeedback.modifiedResumeText.includes("SECTION: ERROR") ? (
                          <div className="p-4 text-center border border-dashed rounded-md bg-muted/50">
                            <Info className="mx-auto h-8 w-8 text-primary mb-2" />
                            <p className="font-semibold">Resume Data Required</p>
                            <p className="text-sm text-muted-foreground">Please use the "Resume Assistant" tool first to generate or improve your resume. The portfolio generator uses that data.</p>
                          </div>
                        ) : (
                          <>
                           <FileUpload 
                                selectedFiles={portfolioProfilePic ? [portfolioProfilePic] : []}
                                onFileChange={(files) => setPortfolioProfilePic(files[0] || null)}
                                isLoading={isGeneratingPortfolio}
                                inputId="portfolio-pic-upload"
                                label="Upload Profile Picture (Optional)"
                                acceptedFileTypes={COMMON_IMAGE_MIME_TYPES}
                                acceptedFileExtensionsString={COMMON_IMAGE_EXTENSIONS_STRING}
                            />
                           <div>
                              <Label htmlFor="portfolio-theme">Select a Theme</Label>
                              <Select value={portfolioTheme} onValueChange={(v) => setPortfolioTheme(v as any)} disabled={isGeneratingPortfolio}>
                                  <SelectTrigger id="portfolio-theme"><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                      <SelectItem value="professional-dark">Professional Dark</SelectItem>
                                      <SelectItem value="professional-light">Professional Light</SelectItem>
                                      <SelectItem value="creative-vibrant">Creative & Vibrant</SelectItem>
                                  </SelectContent>
                              </Select>
                          </div>
                          <Button onClick={handleGeneratePortfolio} disabled={isGeneratingPortfolio} className="w-full sm:w-auto">
                              {isGeneratingPortfolio && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>} Generate Portfolio Site
                          </Button>
                          </>
                        )}

                        {generatedPortfolio && (
                           <div className="mt-6 p-4 bg-muted rounded-md space-y-4">
                            <h4 className="font-semibold text-foreground">Portfolio Generated!</h4>
                            <p className="text-sm text-muted-foreground">Your single-page portfolio is ready. You can preview it or download the HTML and CSS files to host anywhere.</p>
                            <div className="flex flex-wrap gap-2">
                              <Button onClick={() => setIsPortfolioPreviewOpen(true)} variant="secondary">
                                <Eye className="mr-2 h-4 w-4"/> Preview Site
                              </Button>
                              <Button onClick={handleDownloadPortfolio} variant="default">
                                <DownloadCloud className="mr-2 h-4 w-4"/> Download Files (HTML+CSS)
                              </Button>
                            </div>
                           </div>
                        )}
                        {!generatedPortfolio && !isGeneratingPortfolio && resumeFeedback?.modifiedResumeText && !resumeFeedback.modifiedResumeText.includes("SECTION: ERROR") &&(
                           <div className="text-center text-muted-foreground py-4 border border-dashed rounded-md bg-muted/20">
                             <Globe className="mx-auto h-12 w-12 text-muted-foreground/50" />
                             <p className="mt-2 text-sm">Your generated portfolio preview will be available here.</p>
                           </div>
                        )}
                    </CardContent>
                  </Card>
                )}


               {activeTool === 'linkedin-visuals' && (
                  <Card className="shadow-xl bg-card">
                    <CardHeader>
                      <CardTitle className="font-headline text-2xl text-primary flex items-center"><UserSquare className="mr-2 h-7 w-7"/>AI LinkedIn Visuals Generator</CardTitle>
                      <CardDescription>
                        Generate AI suggestions for your LinkedIn profile. Upload your photo for a realistic, enhanced headshot, and/or paste your resume to create a portfolio-style cover image.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <FileUpload
                        selectedFiles={linkedInUserPhoto ? [linkedInUserPhoto] : []}
                        onFileChange={(files) => setLinkedInUserPhoto(files[0] || null)}
                        isLoading={isGeneratingLinkedInVisuals}
                        inputId="linkedin-photo-upload"
                        label="Upload Your Photo (Optional, for realistic headshot)"
                        acceptedFileTypes={COMMON_IMAGE_MIME_TYPES}
                        acceptedFileExtensionsString={COMMON_IMAGE_EXTENSIONS_STRING}
                      />
                      <Textarea
                          placeholder="Paste your full resume text here (Optional, for cover image and abstract profile pic)"
                          value={linkedInResumeContent}
                          onChange={(e) => setLinkedInResumeContent(e.target.value)}
                          disabled={isGeneratingLinkedInVisuals}
                          className="min-h-[150px]"
                      />
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input 
                            placeholder="Your Full Name (Optional, helps AI)" 
                            value={linkedInFullName} 
                            onChange={(e) => setLinkedInFullName(e.target.value)} 
                            disabled={isGeneratingLinkedInVisuals} 
                        />
                        <Input 
                            placeholder="Your Professional Title (Optional, helps AI)" 
                            value={linkedInProfessionalTitle} 
                            onChange={(e) => setLinkedInProfessionalTitle(e.target.value)} 
                            disabled={isGeneratingLinkedInVisuals} 
                        />
                       </div>
                      <div>
                          <Label htmlFor="linkedin-visual-style">Visual Style Preference</Label>
                          <Select value={linkedInVisualStyle} onValueChange={(v) => setLinkedInVisualStyle(v as any)} disabled={isGeneratingLinkedInVisuals}>
                              <SelectTrigger id="linkedin-visual-style"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                  <SelectItem value="professional-minimalist">Professional & Minimalist</SelectItem>
                                  <SelectItem value="creative-abstract">Creative & Abstract</SelectItem>
                                  <SelectItem value="modern-tech">Modern & Techy</SelectItem>
                                  <SelectItem value="elegant-corporate">Elegant & Corporate</SelectItem>
                                  <SelectItem value="vibrant-energetic">Vibrant & Energetic</SelectItem>
                              </SelectContent>
                          </Select>
                      </div>
                       <p className="text-xs text-muted-foreground p-2 bg-muted/30 rounded-md border border-dashed">
                          <Info className="inline h-4 w-4 mr-1 text-primary"/>
                          If you upload a photo, AI will generate a realistic headshot. If not, it generates an abstract image based on your resume. The cover image is always based on your resume content.
                      </p>
                      <Button onClick={handleGenerateLinkedInVisuals} disabled={isGeneratingLinkedInVisuals || (!linkedInResumeContent.trim() && !linkedInUserPhoto)} className="w-full sm:w-auto">
                          {isGeneratingLinkedInVisuals && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>} Generate Visuals
                      </Button>

                      {generatedLinkedInVisuals && (
                      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                          {generatedLinkedInVisuals.suggestedProfilePictureUrl && (
                          <div className="space-y-2">
                              <h4 className="font-semibold text-foreground flex items-center"><UserSquare className="mr-2 h-5 w-5 text-accent"/>Suggested Profile Picture:</h4>
                               <Image src={generatedLinkedInVisuals.suggestedProfilePictureUrl} alt="AI Generated Profile Picture Suggestion" width={200} height={200} className="rounded-full border-2 border-primary shadow-md object-cover aspect-square mx-auto md:mx-0" />
                               <Accordion type="single" collapsible className="w-full text-xs">
                                  <AccordionItem value="profile-prompt">
                                      <AccordionTrigger className="hover:no-underline text-muted-foreground">View Prompt Used</AccordionTrigger>
                                      <AccordionContent className="whitespace-pre-wrap bg-background/50 p-2 rounded-md">
                                      {generatedLinkedInVisuals.profilePicturePromptUsed || "Prompt not available."}
                                      </AccordionContent>
                                  </AccordionItem>
                              </Accordion>
                          </div>
                          )}
                          {generatedLinkedInVisuals.suggestedCoverImageUrl && (
                          <div className="space-y-2">
                              <h4 className="font-semibold text-foreground flex items-center"><ImageIconLucide className="mr-2 h-5 w-5 text-accent"/>Suggested Cover Image:</h4>
                              <Image src={generatedLinkedInVisuals.suggestedCoverImageUrl} alt="AI Generated Cover Image Suggestion" width={600} height={150} className="rounded-md border shadow-md object-cover aspect-[4/1] w-full" />
                              <Accordion type="single" collapsible className="w-full text-xs">
                                  <AccordionItem value="cover-prompt">
                                      <AccordionTrigger className="hover:no-underline text-muted-foreground">View Prompt Used</AccordionTrigger>
                                      <AccordionContent className="whitespace-pre-wrap bg-background/50 p-2 rounded-md">
                                      {generatedLinkedInVisuals.coverImagePromptUsed || "Prompt not available."}
                                      </AccordionContent>
                                  </AccordionItem>
                              </Accordion>
                          </div>
                          )}
                          {!generatedLinkedInVisuals.suggestedProfilePictureUrl && !generatedLinkedInVisuals.suggestedCoverImageUrl && !isGeneratingLinkedInVisuals && (
                              <p className="md:col-span-2 text-center text-muted-foreground">AI could not generate visuals for this input. Please try different terms or styles.</p>
                          )}
                      </div>
                      )}
                       {!generatedLinkedInVisuals && !isGeneratingLinkedInVisuals && (
                          <div className="text-center text-muted-foreground py-4 border border-dashed rounded-md bg-muted/20">
                              <UserSquare className="mx-auto h-10 w-10 text-muted-foreground/40 mb-1" />
                              <ImageIconLucide className="mx-auto h-10 w-10 text-muted-foreground/40" />
                              <p className="mt-2 text-sm">Your AI-generated LinkedIn visual suggestions will appear here.</p>
                              <img data-ai-hint="abstract professional" src="https://placehold.co/300x150.png" alt="Placeholder LinkedIn Visuals" className="mx-auto mt-3 rounded-md opacity-40"/>
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
                          <div className="flex flex-wrap gap-2">
                               <Button onClick={handleGenerateCoverLetter} disabled={isGeneratingCoverLetter || !coverLetterJobDesc.trim() || !coverLetterUserInfo.trim()} className="w-auto">
                                  {isGeneratingCoverLetter && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>} Generate Cover Letter
                              </Button>
                          </div>

                          {generatedCoverLetter && (
                              <div className="mt-4 p-4 bg-muted rounded-md max-h-[500px] overflow-y-auto">
                                  <div className="flex justify-between items-center mb-2">
                                      <h4 className="font-semibold text-foreground">Draft Cover Letter:</h4>
                                      <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => {
                                              navigator.clipboard.writeText(generatedCoverLetter.draftCoverLetter);
                                              toast({ title: "Copied!", description: "Cover letter text copied to clipboard." });
                                          }}
                                          disabled={!generatedCoverLetter.draftCoverLetter || isGeneratingCoverLetter}
                                      >
                                          <Copy className="mr-2 h-4 w-4" /> Copy Text
                                      </Button>
                                  </div>
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
                                          <Accordion type="multiple" className="w-full" defaultValue={generatedCareerPaths.globallySuggestedStudyFields.map((_,i) => `field-${i}`)}>
                                              {generatedCareerPaths.globallySuggestedStudyFields.map((field, index) => (
                                                  <AccordionItem value={`field-${index}`} key={`field-${index}`}>
                                                      <AccordionTrigger className="text-sm hover:no-underline text-left">{field.fieldName}</AccordionTrigger>
                                                      <AccordionContent className="text-xs pl-4 whitespace-pre-wrap">
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
                                       <Accordion type="multiple" className="w-full" defaultValue={generatedCareerPaths.globallySuggestedExampleInstitutions.map((_,i) => `inst-${i}`)}>
                                          {generatedCareerPaths.globallySuggestedExampleInstitutions.map((inst, i) => (
                                              <AccordionItem value={`inst-${i}`} key={`inst-${i}`}>
                                                  <AccordionTrigger className="text-sm hover:no-underline text-left">{inst.institutionName}</AccordionTrigger>
                                                  <AccordionContent className="text-xs pl-4 whitespace-pre-wrap">
                                                      <p><strong>Outlook:</strong> {inst.admissionOutlook || "General outlook not specified."}</p>
                                                  </AccordionContent>
                                              </AccordionItem>
                                          ))}
                                      </Accordion>
                                      <p className="text-xs italic text-muted-foreground mt-3 p-2 bg-background/50 rounded-md border border-dashed">
                                        <AlertTriangle className="inline h-4 w-4 mr-1 text-yellow-600"/>
                                        **Important Disclaimer:** Institutional examples and admission outlooks are illustrative and based on general information. Admission is highly competitive and depends on many factors beyond scores. Always research and verify current admission requirements directly with institutions. This is not a guarantee of admission.
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
                          <CardDescription>Create presentation outlines with AI-generated text and images. Customize image style and download as a PDF.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                          <Input placeholder="Presentation Topic" value={presentationTopic} onChange={(e) => setPresentationTopic(e.target.value)} disabled={isGeneratingPresentation} />
                          <Input type="number" placeholder="Number of Slides (e.g., 3)" value={numSlides} onChange={(e) => setNumSlides(e.target.value)} disabled={isGeneratingPresentation} min="1" max="7" />
                          <Input placeholder="Image Style Prompt (Optional, e.g., 'vintage art style', 'minimalist flat design')" value={imageStylePrompt} onChange={(e) => setImageStylePrompt(e.target.value)} disabled={isGeneratingPresentation} />
                          <p className="text-xs text-muted-foreground">Note: Generating presentations with images can be slow (2-3 slides recommended). Max 7 slides.</p>
                          <div className="flex items-center text-xs text-muted-foreground bg-muted/50 p-2 rounded-md"><Info className="mr-2 h-4 w-4 text-primary shrink-0" /><span>Slide transitions/animations are not included in PDF output.</span></div>
                          <div className="flex flex-wrap gap-2">
                              <Button onClick={handleGeneratePresentation} disabled={isGeneratingPresentation || !presentationTopic.trim()} className="flex-grow sm:flex-grow-0">
                                  {isGeneratingPresentation && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Generate Presentation
                              </Button>
                              {generatedPresentation && <Button onClick={() => {}} variant="outline" className="flex-grow sm:flex-grow-0" disabled={isGeneratingPresentation}><Download className="mr-2 h-4 w-4" /> Download PDF</Button>}
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

                {activeTool === 'text-to-speech' && (
                  <Card className="shadow-xl bg-card">
                    <CardHeader>
                      <CardTitle className="font-headline text-2xl text-primary flex items-center"><AudioLines className="mr-2 h-7 w-7"/>AI Text-to-Speech Converter</CardTitle>
                      <CardDescription>Convert written text into natural-sounding speech. Enter your text below and click generate.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Textarea
                        placeholder="Enter the text you want to convert to speech here..."
                        value={ttsInputText}
                        onChange={(e) => setTtsInputText(e.target.value)}
                        disabled={isGeneratingAudio}
                        className="min-h-[150px]"
                      />
                      <Button onClick={handleGenerateAudio} disabled={isGeneratingAudio || !ttsInputText.trim()} className="w-full sm:w-auto">
                        {isGeneratingAudio ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />} Generate Audio
                      </Button>
                      {generatedAudioUri && (
                        <div className="mt-4 p-4 bg-muted rounded-md">
                          <h4 className="font-semibold mb-2 text-foreground">Generated Audio:</h4>
                          <audio controls src={generatedAudioUri} className="w-full">
                            Your browser does not support the audio element.
                          </audio>
                        </div>
                      )}
                      {!generatedAudioUri && !isGeneratingAudio && (
                        <div className="text-center text-muted-foreground py-4 border border-dashed rounded-md bg-muted/20">
                          <AudioLines className="mx-auto h-12 w-12 text-muted-foreground/50" />
                          <p className="mt-2 text-sm">Your generated audio will appear here.</p>
                        </div>
                      )}
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
        <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
          <DialogContent id="resume-preview-dialog" className="max-w-4xl p-0 bg-background overflow-y-auto max-h-[90vh]">
            <DialogHeader className="p-4 border-b">
               <DialogTitle>Resume Preview</DialogTitle>
            </DialogHeader>
            <div className="p-6 bg-gray-200" id="pdf-render-area">
                <ResumePreview data={parsedResumeData} />
            </div>
            <DialogFooter className="p-4 border-t">
               <Button onClick={handleDownloadPdf}>
                 <Download className="mr-2 h-4 w-4" /> Download PDF
               </Button>
               <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        {generatedPortfolio && (
            <Dialog open={isPortfolioPreviewOpen} onOpenChange={setIsPortfolioPreviewOpen}>
              <DialogContent className="max-w-7xl h-[90vh] p-0">
                  <DialogHeader className="p-4 border-b">
                      <DialogTitle>Portfolio Preview</DialogTitle>
                  </DialogHeader>
                  <iframe 
                      srcDoc={`<html><head><style>${generatedPortfolio.cssContent}</style></head><body>${generatedPortfolio.htmlContent}</body></html>`}
                      title="Portfolio Preview"
                      className="w-full h-full border-0"
                  />
                  <DialogFooter className="p-4 border-t">
                      <Button onClick={handleDownloadPortfolio}>
                        <DownloadCloud className="mr-2 h-4 w-4" /> Download Files
                      </Button>
                      <Button variant="outline" onClick={() => setIsPortfolioPreviewOpen(false)}>Close</Button>
                  </DialogFooter>
              </DialogContent>
            </Dialog>
        )}
      </div>
    </>
  );
}
