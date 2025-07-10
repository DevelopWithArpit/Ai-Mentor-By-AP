
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
        try {
            const dataString = sessionStorage.getItem('resumeDataForPrint');
            if (dataString) {
                const data = JSON.parse(dataString);
                setResumeData(data);
                
                // This is the crucial part for styling. It copies all style-related links
                // from the main application window into this print window's head.
                if (window.opener) {
                  const parentStyles = Array.from(window.opener.document.head.querySelectorAll('link[rel="stylesheet"], style'));
                  parentStyles.forEach(styleNode => {
                      document.head.appendChild(styleNode.cloneNode(true));
                  });
                }
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
            // Using a timeout gives the browser a moment to render fonts and styles
            // from the newly added stylesheets before opening the print dialog.
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
