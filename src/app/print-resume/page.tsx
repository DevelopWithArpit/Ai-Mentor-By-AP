
"use client";

import { useState, useEffect } from 'react';
import ResumePreview, { type ResumeData } from '@/components/resume/ResumePreview';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';

export default function PrintResumePage() {
    const [resumeData, setResumeData] = useState<ResumeData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        try {
            const dataString = sessionStorage.getItem('resumeDataForPrint');
            if (dataString) {
                const data = JSON.parse(dataString);
                setResumeData(data);
                
                // Inject styles from parent window to ensure consistency
                const allStyleSheets: CSSStyleSheet[] = Array.from(window.opener.document.styleSheets);

                allStyleSheets.forEach(sheet => {
                    try {
                        const rules = Array.from(sheet.cssRules).map(rule => rule.cssText).join('\n');
                        if(rules) {
                            const styleEl = document.createElement('style');
                            styleEl.textContent = rules;
                            document.head.appendChild(styleEl);
                        }
                    } catch (e) {
                        // For external stylesheets (like Google Fonts), copy the link tag
                        if (sheet.href) {
                            const linkEl = document.createElement('link');
                            linkEl.rel = 'stylesheet';
                            linkEl.href = sheet.href;
                            document.head.appendChild(linkEl);
                        }
                    }
                });

            } else {
                setError("Could not find resume data to print. Please return to the previous page and generate a resume first.");
            }
        } catch (e) {
            console.error("Failed to parse or process resume data from session storage:", e);
            setError("Failed to load resume data. It might be corrupted or inaccessible.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (resumeData && !isLoading && !error) {
            // A timeout ensures all content, especially fonts, is painted before printing.
            const timer = setTimeout(() => {
                window.print();
            }, 1000); // Increased delay for more reliability with fonts

            return () => clearTimeout(timer);
        }
    }, [resumeData, isLoading, error]);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gray-100">
                <div className="text-center">
                    <p className="text-lg text-gray-600">Preparing resume for printing...</p>
                    <Skeleton className="h-96 w-[210mm] mt-4" />
                </div>
            </div>
        );
    }
    
    if (error) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gray-100 p-4">
                <div className="text-center text-red-600 bg-red-50 p-6 rounded-lg border border-red-200">
                    <AlertCircle className="mx-auto h-12 w-12 mb-4" />
                    <h1 className="text-2xl font-bold mb-2">Error: No Resume Data</h1>
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    if (!resumeData) {
        return (
             <div className="flex justify-center items-center min-h-screen bg-gray-100 p-4">
                <div className="text-center text-gray-600">
                    <p>No data was loaded.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white">
            <ResumePreview data={resumeData} />
        </div>
    );
}

    