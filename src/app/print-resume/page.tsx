
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
            } else {
                setError("Could not find resume data to print. Please return to the previous page and generate a resume first.");
            }
        } catch (e) {
            console.error("Failed to parse resume data from session storage:", e);
            setError("Failed to load resume data. It might be corrupted.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        // This effect triggers the print dialog once the data is loaded and rendered.
        if (resumeData && !isLoading && !error) {
            // A small timeout ensures the content is fully painted in the DOM before printing.
            const timer = setTimeout(() => {
                window.print();
            }, 500); // 500ms delay as a safeguard

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
        <div className="bg-gray-200 p-4">
            {/* The ResumePreview component is used directly to ensure a perfect match */}
            <ResumePreview data={resumeData} />
        </div>
    );
}
