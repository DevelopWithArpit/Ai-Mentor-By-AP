
"use client";

import React, { type FC, useEffect, useState } from 'react';
import { Phone, Mail, Linkedin as LinkedinIcon, MapPin } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

// Define a type for the parsed resume data to ensure type safety
export interface ResumeData {
  personalInfo?: { [key: string]: string };
  summary?: string;
  keyAchievements?: { title?: string, details?: string[] };
  experience?: any[];
  education?: any[];
  projects?: any[];
  skills?: string[];
}

const ResumePrintContent: FC<{ data: ResumeData }> = ({ data }) => {
    const { personalInfo = {}, summary = '', keyAchievements = {}, experience = [], education = [], projects = [], skills = [] } = data;
    const initials = (personalInfo.name || "N A").split(" ").map((n:string)=>n[0]).join("").substring(0,2).toUpperCase();
  
    const contactInfo = [
      { icon: Phone, text: personalInfo.phone },
      { icon: Mail, text: personalInfo.email },
      { icon: LinkedinIcon, text: personalInfo.linkedin ? `linkedin.com/in/${personalInfo.linkedin.replace(/^(https?:\/\/)?(www\.)?linkedin\.com\/in\//, '')}` : '' },
      { icon: MapPin, text: personalInfo.location }
    ].filter(item => item.text);
  
    return (
      <div className="bg-white text-black p-6 font-sans text-sm" style={{ width: '210mm', minHeight: '297mm', margin: 'auto' }}>
        <header className="flex flex-row justify-between items-start mb-4 border-b-2 border-gray-200 pb-3">
          <div className="mb-0">
            <h1 className="text-3xl font-bold text-gray-800 tracking-tight">{personalInfo.name || ''}</h1>
            <h2 className="text-lg text-blue-600 font-semibold">{personalInfo.title || ''}</h2>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-gray-600">
              {contactInfo.map((item, index) => (
                <div key={index} className="flex items-center">
                  <item.icon className="mr-1.5 h-3 w-3 text-blue-600"/>
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex-shrink-0 self-start">
              <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-4xl font-bold tracking-wider">{initials}</span>
              </div>
          </div>
        </header>
        <div className="grid grid-cols-3 gap-x-6">
          <div className="col-span-2 space-y-4">
            {summary && (
              <section>
                <h3 className="text-base font-bold text-gray-800 border-b-2 border-gray-700 pb-1 mb-2 tracking-wide uppercase">Summary</h3>
                <p className="text-gray-700 leading-relaxed text-xs">{summary}</p>
              </section>
            )}
            {experience.length > 0 && (
              <section>
                <h3 className="text-base font-bold text-gray-800 border-b-2 border-gray-700 pb-1 mb-2 tracking-wide uppercase">Experience</h3>
                <div className="space-y-3">
                  {experience.map((job, index) => (
                    <div key={`exp-${index}`}>
                      <h4 className="font-bold text-gray-900">{job.title || ''}</h4>
                      <p className="text-blue-600 font-semibold text-sm">{job.company || ''}</p>
                      <p className="text-xs text-gray-500 mb-1">{job.date || ''} {job.location && `| ${job.location}`} {job.context && `- ${job.context}`}</p>
                      <ul className="list-disc list-inside text-gray-700 space-y-1 pl-2 text-xs">
                        {job.details?.map((detail: string, i: number) => <li key={i}>{detail}</li>)}
                      </ul>
                    </div>
                  ))}
                </div>
              </section>
            )}
            {education.length > 0 && (
              <section>
                <h3 className="text-base font-bold text-gray-800 border-b-2 border-gray-700 pb-1 mb-2 tracking-wide uppercase">Education</h3>
                <div className="space-y-3">
                  {education.map((edu, index) => (
                    <div key={`edu-${index}`}>
                      <h4 className="font-bold text-gray-900">{edu.degree || ''}</h4>
                      <p className="text-blue-600 font-semibold text-sm">{edu.institution || ''}</p>
                      <p className="text-xs text-gray-500">{edu.date || ''} {edu.location && `| ${edu.location}`}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
          <div className="col-span-1 space-y-4">
            {keyAchievements && (keyAchievements.title || keyAchievements.details?.length > 0) && (
              <section>
                  <h3 className="text-base font-bold text-gray-800 border-b-2 border-gray-700 pb-1 mb-2 tracking-wide uppercase">Key Achievements</h3>
                  <h4 className="font-bold text-gray-900">{keyAchievements.title}</h4>
                  <ul className="list-disc list-inside text-gray-700 space-y-1 mt-1 pl-2 text-xs">
                      {keyAchievements.details?.map((detail: string, i: number) => <li key={i}>{detail}</li>)}
                    </ul>
              </section>
            )}
            {skills.length > 0 && (
              <section>
                <h3 className="text-base font-bold text-gray-800 border-b-2 border-gray-700 pb-1 mb-2 tracking-wide uppercase">Skills</h3>
                <div className="flex flex-wrap gap-1">
                  {skills.map((skill, index) => (
                    <span key={index} className="bg-gray-200 text-gray-800 text-xs font-medium px-2 py-0.5 rounded-md">{skill}</span>
                  ))}
                </div>
              </section>
            )}
            {projects.length > 0 && (
              <section>
                <h3 className="text-base font-bold text-gray-800 border-b-2 border-gray-700 pb-1 mb-2 tracking-wide uppercase">Projects</h3>
                <div className="space-y-3">
                  {projects.map((proj, index) => (
                    <div key={`proj-${index}`}>
                      <h4 className="font-bold text-gray-900">{proj.title || ''}</h4>
                      <p className="text-xs text-gray-500 mb-1">{proj.date || ''} {proj.context && `- ${proj.context}`}</p>
                      <ul className="list-disc list-inside text-gray-700 space-y-1 pl-2 text-xs">
                        {proj.details?.map((detail: string, i: number) => <li key={i}>{detail}</li>)}
                      </ul>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    );
};


const PrintPage = () => {
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
            // Give the browser a moment to render everything, including fonts
            const timer = setTimeout(() => {
                window.print();
            }, 500); // A 500ms delay should be sufficient for rendering
            return () => clearTimeout(timer);
        }
    }, [isLoading, data]);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <p>Loading preview...</p>
            </div>
        );
    }
    
    if (!data) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="text-center">
                    <h1 className="text-xl font-bold">No Resume Data Found</h1>
                    <p>Please go back and generate a resume first.</p>
                </div>
            </div>
        );
    }

    return <ResumePrintContent data={data} />;
};

export default PrintPage;

    