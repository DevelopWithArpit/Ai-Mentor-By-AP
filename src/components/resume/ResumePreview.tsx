
"use client";

import React, { type FC } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export interface ResumeData {
  personalInfo?: { [key: string]: string };
  summary?: string;
  keyAchievements?: { title?: string, details?: string[] };
  experience?: any[];
  education?: any[];
  projects?: any[];
  skills?: string[];
  layout?: { main_content?: string, side_content?: string };
}

interface ResumePreviewProps {
  data: ResumeData | null;
}

const renderSection = (sectionName: string, data: ResumeData) => {
    switch (sectionName.trim().toUpperCase()) {
        case 'SUMMARY':
            return data.summary ? (
                <section>
                    <h3 className="text-sm font-bold text-gray-800 border-b-2 border-gray-200 pb-1 mb-2 tracking-wider uppercase">Summary</h3>
                    <p className="text-[11px] text-gray-600 leading-relaxed">{data.summary}</p>
                </section>
            ) : null;
        case 'EXPERIENCE':
            return data.experience && data.experience.length > 0 ? (
                <section>
                    <h3 className="text-sm font-bold text-gray-800 border-b-2 border-gray-200 pb-1 mb-2 tracking-wider uppercase">Experience</h3>
                    <div className="space-y-3">
                        {data.experience.map((job, index) => (
                            <div key={`exp-${index}`} className="break-inside-avoid">
                                <h4 className="font-bold text-base text-gray-900 leading-snug">{job.title || '[Job Title]'}</h4>
                                <p className="text-blue-600 font-semibold text-xs leading-snug">{job.company || '[Company Name]'}</p>
                                <p className="text-[10px] text-gray-500 mb-1 leading-snug">{job.date || '[Date]'} {job.location && `| ${job.location}`} {job.context && `- ${job.context}`}</p>
                                <ul className="list-disc list-inside text-gray-700 space-y-1 pl-1 text-[11px] leading-snug">
                                    {job.details?.map((detail: string, i: number) => <li key={i}>{detail}</li>)}
                                </ul>
                            </div>
                        ))}
                    </div>
                </section>
            ) : null;
        case 'PROJECTS':
            return data.projects && data.projects.length > 0 ? (
                <section>
                    <h3 className="text-sm font-bold text-gray-800 border-b-2 border-gray-200 pb-1 mb-2 tracking-wider uppercase">Projects</h3>
                    <div className="space-y-3">
                        {data.projects.map((proj, index) => (
                            <div key={`proj-${index}`} className="break-inside-avoid">
                                <h4 className="font-bold text-base text-gray-900 leading-snug">{proj.title || '[Project Title]'}</h4>
                                <p className="text-[10px] text-gray-500 mb-1 leading-snug">{proj.date || '[Date]'} {proj.context && `- ${proj.context}`}</p>
                                <ul className="list-disc list-inside text-gray-700 space-y-1 pl-1 text-[11px] leading-snug">
                                    {proj.details?.map((detail: string, i: number) => <li key={i}>{detail}</li>)}
                                </ul>
                            </div>
                        ))}
                    </div>
                </section>
            ) : null;
        case 'EDUCATION':
            return data.education && data.education.length > 0 ? (
                <section>
                    <h3 className="text-sm font-bold text-gray-800 border-b-2 border-gray-200 pb-1 mb-2 tracking-wider uppercase">Education</h3>
                    <div className="space-y-3">
                        {data.education.map((edu, index) => (
                            <div key={`edu-${index}`} className="break-inside-avoid">
                                <h4 className="font-bold text-base text-gray-900 leading-snug">{edu.degree || '[Degree]'}</h4>
                                <p className="text-blue-600 font-semibold text-xs leading-snug">{edu.institution || '[Institution]'}</p>
                                <p className="text-[10px] text-gray-500 leading-snug">{edu.date || '[Date]'} {edu.location && `| ${edu.location}`}</p>
                            </div>
                        ))}
                    </div>
                </section>
            ) : null;
        case 'KEY_ACHIEVEMENTS':
             return data.keyAchievements && (data.keyAchievements.title || data.keyAchievements.details?.length > 0) ? (
                 <section>
                    <h3 className="text-sm font-bold text-gray-800 border-b-2 border-gray-200 pb-1 mb-2 tracking-wider uppercase">Key Achievements</h3>
                     <h4 className="font-bold text-base text-gray-900 leading-snug">{data.keyAchievements.title}</h4>
                     <ul className="list-disc list-inside text-gray-700 space-y-1 mt-1 pl-1 text-[11px] leading-snug">
                        {data.keyAchievements.details?.map((detail: string, i: number) => <li key={i}>{detail}</li>)}
                      </ul>
                 </section>
            ) : null;
        case 'SKILLS':
            return data.skills && data.skills.length > 0 ? (
                <section>
                    <h3 className="text-sm font-bold text-gray-800 border-b-2 border-gray-200 pb-1 mb-2 tracking-wider uppercase">Skills</h3>
                    <div className="flex flex-wrap gap-1">
                        {data.skills.map((skill, index) => (
                            <span key={index} className="bg-gray-100 text-gray-800 text-[10px] font-medium px-2 py-1 rounded-md leading-snug">{skill}</span>
                        ))}
                    </div>
                </section>
            ) : null;
        default:
            return null;
    }
};


const ResumePreview: FC<ResumePreviewProps> = ({ data }) => {
  if (!data) {
    return (
      <div id="resume-preview-content" className="bg-white text-black p-8 font-sans text-sm shadow-lg max-w-4xl mx-auto my-4 rounded-lg">
        <div className="flex justify-between items-start mb-4 pb-3">
          <div>
            <Skeleton className="h-9 w-64 mb-2" />
            <Skeleton className="h-6 w-48" />
          </div>
        </div>
        <div className="flex gap-x-8">
          <div className="w-2/3 space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-11/12" />
            <Skeleton className="h-4 w-full" />
          </div>
          <div className="w-1/3 space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-10/12" />
          </div>
        </div>
      </div>
    );
  }

  const { personalInfo = {}, layout = {} } = data;
  const mainContentSections = layout.main_content?.split(',') || ['SUMMARY', 'EXPERIENCE', 'PROJECTS'];
  const sideContentSections = layout.side_content?.split(',') || ['EDUCATION', 'SKILLS', 'KEY_ACHIEVEMENTS'];

  const contactInfo = [
    { icon: "📞", text: personalInfo.phone },
    { icon: "📧", text: personalInfo.email },
    { icon: "💼", text: personalInfo.linkedin ? `linkedin.com/in/${personalInfo.linkedin.replace(/^(https?:\/\/)?(www\.)?linkedin\.com\/in\//, '')}` : '' },
    { icon: "📍", text: personalInfo.location }
  ].filter(item => item.text);

  return (
    <div id="resume-preview-content" className="bg-white text-[#1f2937] p-6 font-sans shadow-lg w-[210mm] min-h-[297mm] mx-auto box-border">
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=PT+Sans:wght@400;700&family=Space+Grotesk:wght@500;700&display=swap');
          #resume-preview-content { font-family: 'PT Sans', sans-serif; line-height: 1.4; }
          #resume-preview-content h1, #resume-preview-content h2, #resume-preview-content h3, #resume-preview-content h4 { font-family: 'Space Grotesk', sans-serif; }
        `}
      </style>
      <header className="text-center mb-4">
        <h1 className="text-3xl font-bold text-gray-800 tracking-tight leading-tight">{personalInfo.name || '[Full Name]'}</h1>
        <h2 className="text-base text-blue-600 font-semibold leading-normal">{personalInfo.title || '[Professional Title]'}</h2>
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 mt-2 text-[10px] text-gray-600">
          {contactInfo.map((item, index) => (
            <div key={index} className="flex items-center">
              <span>{item.icon}</span>
              <span className="ml-1">{item.text}</span>
            </div>
          ))}
        </div>
      </header>

      <div className="flex gap-x-4">
        {/* Main Content Column */}
        <div className="w-[65%] space-y-4">
          {mainContentSections.map(sectionName => (
            <React.Fragment key={`main-${sectionName}`}>
                {renderSection(sectionName, data)}
            </React.Fragment>
          ))}
        </div>

        {/* Side Content Column */}
        <div className="w-[35%] space-y-4">
          {sideContentSections.map(sectionName => (
             <React.Fragment key={`side-${sectionName}`}>
                {renderSection(sectionName, data)}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};

ResumePreview.displayName = "ResumePreview";
export default ResumePreview;

