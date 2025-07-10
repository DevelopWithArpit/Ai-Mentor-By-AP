
"use client";

import { useState, useEffect } from 'react';
import ResumePreview, { type ResumeData } from '@/components/resume/ResumePreview';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Loader2 } from 'lucide-react';

export default function PrintResumePage() {
    const [resumeData, setResumeData] = useState<ResumeData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // This effect runs once on component mount.
        try {
            // Attempt to retrieve the resume data from session storage.
            const dataString = sessionStorage.getItem('resumeDataForPrint');
            if (dataString) {
                const data = JSON.parse(dataString);
                setResumeData(data);
                
                // Copy all stylesheets from the parent window to the print window.
                // This is crucial for matching the preview style.
                const parentStyles = Array.from(window.opener.document.styleSheets);
                parentStyles.forEach(sheet => {
                    try {
                        // For inline <style> tags, copy their rules.
                        const rules = Array.from(sheet.cssRules).map(rule => rule.cssText).join('\n');
                        if (rules) {
                            const styleEl = document.createElement('style');
                            styleEl.textContent = rules;
                            document.head.appendChild(styleEl);
                        }
                    } catch (e) {
                        // For external stylesheets (like Google Fonts), copy the <link> tag itself.
                        if (sheet.href) {
                            const linkEl = document.createElement('link');
                            linkEl.rel = 'stylesheet';
                            linkEl.href = sheet.href;
                            document.head.appendChild(linkEl);
                        }
                    }
                });
            } else {
                // If no data is found, set an error.
                setError("Could not find resume data to print. Please return to the previous page and generate a resume first.");
            }
        } catch (e) {
            console.error("Failed to parse or process resume data from session storage:", e);
            setError("Failed to load resume data. It might be corrupted or inaccessible.");
        } finally {
            // Data loading attempt is complete.
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        // This effect triggers the print dialog *after* the component has rendered
        // with the resume data and is no longer in a loading state.
        if (resumeData && !isLoading && !error) {
            // Using a timeout gives the browser a moment to render fonts and styles
            // before opening the print dialog, preventing blank pages.
            const timer = setTimeout(() => {
                window.print();
            }, 1000); // 1-second delay is generally safe.

            return () => clearTimeout(timer);
        }
    }, [resumeData, isLoading, error]);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gray-100">
                <div className="text-center p-6">
                    <Loader2 className="mx-auto h-12 w-12 animate-spin text-gray-500 mb-4" />
                    <p className="text-lg text-gray-600">Preparing resume for printing...</p>
                    <Skeleton className="h-96 w-[210mm] mt-4" />
                </div>
            </div>
        );
    }
    
    if (error) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gray-100 p-4">
                <div className="text-center text-red-600 bg-red-50 p-6 rounded-lg border border-red-200 shadow-md">
                    <AlertCircle className="mx-auto h-12 w-12 mb-4" />
                    <h1 className="text-2xl font-bold mb-2">Error: No Resume Data</h1>
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    if (!resumeData) {
        // This case should ideally not be reached if the error state is set correctly.
        return (
             <div className="flex justify-center items-center min-h-screen bg-gray-100 p-4">
                <div className="text-center text-gray-600">
                    <p>No data was loaded. Please close this window and try again.</p>
                </div>
            </div>
        );
    }

    // Render the resume preview which will be printed.
    return (
        <div className="bg-white">
            <ResumePreview data={resumeData} />
        </div>
    );
}
