
"use client";

import React, { useEffect, useState } from 'react';
import { ResumeData } from '@/components/resume/ResumePrint';
import ResumePreview from '@/components/resume/ResumePreview';

const PrintResumePage = () => {
    const [data, setData] = useState<ResumeData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        try {
            const savedData = sessionStorage.getItem('resumeDataForPrint');
            if (savedData) {
                setData(JSON.parse(savedData));
            }
        } catch (error) {
            console.error("Could not parse resume data from sessionStorage", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!isLoading && data) {
            // This ensures all content, images, and especially web fonts
            // have had a chance to render before printing is triggered.
            const handlePageLoadAndPrint = () => {
                window.print();
            };

            if (document.readyState === 'complete') {
                handlePageLoadAndPrint();
            } else {
                window.addEventListener('load', handlePageLoadAndPrint);
                return () => window.removeEventListener('load', handlePageLoadAndPrint);
            }
        }
    }, [isLoading, data]);

    if (isLoading) {
        return <div className="p-10">Loading resume for printing...</div>;
    }

    if (!data) {
        return (
            <div className="p-10">
                <h1 className="text-xl font-bold">Error: No Resume Data</h1>
                <p>Could not find resume data to print. Please return to the previous page and generate a resume first.</p>
            </div>
        );
    }
    
    // ResumePreview is used directly as it contains the desired visual layout.
    // The print-specific CSS will handle making it look correct on paper.
    return (
        <main>
            <ResumePreview data={data} />
        </main>
    );
};

export default PrintResumePage;

    