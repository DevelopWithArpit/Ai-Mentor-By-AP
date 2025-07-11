
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
}

interface ResumePreviewProps {
  data: ResumeData | null;
}

const Section: FC<{ title: string; children: React.ReactNode; className?: string }> = ({ title, children, className }) => (
    <div className={className}>
        <h3 className="text-sm font-bold tracking-widest text-gray-800 uppercase pb-1 border-b-2 border-black mb-3">{title}</h3>
        {children}
    </div>
);

const ResumePreview: FC<ResumePreviewProps> = ({ data }) => {
  if (!data) {
    return (
      <div id="resume-preview-content" className="bg-white p-8 w-[210mm] h-[297mm] mx-auto shadow-lg">
        <Skeleton className="h-20 w-full mb-4" />
        <div className="flex gap-8">
            <div className="w-2/3 space-y-4"><Skeleton className="h-24 w-full" /><Skeleton className="h-40 w-full" /><Skeleton className="h-32 w-full" /></div>
            <div className="w-1/3 space-y-4"><Skeleton className="h-24 w-full" /><Skeleton className="h-40 w-full" /><Skeleton className="h-32 w-full" /></div>
        </div>
      </div>
    );
  }

  const { personalInfo = {}, summary, keyAchievements, experience, education, projects, skills } = data;
  const contactInfo = [
    { icon: '📞', text: personalInfo.phone },
    { icon: '✉️', text: personalInfo.email },
    { icon: '🔗', text: personalInfo.linkedin ? `linkedin.com/in/${personalInfo.linkedin.replace(/^(https?:\/\/)?(www\.)?linkedin\.com\/in\//, '')}` : '' },
    { icon: '📍', text: personalInfo.location }
  ].filter(item => item.text);

  return (
    <div id="resume-preview-content" className="bg-white p-8 w-[210mm] h-[297mm] mx-auto shadow-lg text-[#333] font-sans text-[10px] leading-relaxed">
       <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap');
          #resume-preview-content * {
              font-family: 'Roboto', sans-serif;
              box-sizing: border-box;
          }
        `}
      </style>
        <header className="grid grid-cols-3 gap-8 items-center mb-4">
            <div className="col-span-2">
                <h1 className="text-4xl font-bold text-black tracking-tight">{personalInfo.name || 'Your Name'}</h1>
                <h2 className="text-lg font-semibold text-blue-600 mt-1">{personalInfo.title || 'Your Title'}</h2>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-gray-600 text-[9px]">
                  {contactInfo.map((item, index) => (
                    <div key={index} className="flex items-center gap-1">
                      <span>{item.icon}</span>
                      <span>{item.text}</span>
                    </div>
                  ))}
                </div>
            </div>
            <div className="col-span-1 flex justify-end">
                <div className="w-24 h-24 rounded-full bg-blue-600 flex items-center justify-center">
                    <span className="text-white text-4xl font-bold">{personalInfo.profile_image_initials || 'AP'}</span>
                </div>
            </div>
        </header>

        <div className="grid grid-cols-3 gap-x-8">
            {/* Left Column */}
            <div className="col-span-2 space-y-4">
                {summary && (
                    <Section title="Summary">
                        <p>{summary}</p>
                    </Section>
                )}
                {experience && experience.length > 0 && (
                    <Section title="Experience">
                        <div className="space-y-3">
                        {experience.map((job, index) => (
                            <div key={`exp-${index}`}>
                                <h4 className="text-sm font-bold text-black">{job.title}</h4>
                                <p className="text-xs font-semibold text-blue-600">{job.company}</p>
                                <p className="text-[9px] text-gray-500 my-0.5">
                                    <span>{job.date}</span>
                                    {job.location && <span className="ml-2">📍 {job.location}</span>}
                                </p>
                                {job.context && <p className="text-xs font-medium text-gray-700">{job.context}</p>}
                                <ul className="list-disc list-outside pl-4 space-y-1 mt-1">
                                    {job.details?.map((detail: string, i: number) => <li key={i}>{detail}</li>)}
                                </ul>
                            </div>
                        ))}
                        </div>
                    </Section>
                )}
                {education && education.length > 0 && (
                     <Section title="Education">
                         <div className="space-y-3">
                         {education.map((edu, index) => (
                            <div key={`edu-${index}`}>
                                <h4 className="text-sm font-bold text-black">{edu.degree}</h4>
                                <p className="text-xs font-semibold text-blue-600">{edu.institution}</p>
                                <p className="text-[9px] text-gray-500 my-0.5">
                                    <span>{edu.date}</span>
                                    {edu.location && <span className="ml-2">📍 {edu.location}</span>}
                                </p>
                            </div>
                         ))}
                         </div>
                     </Section>
                )}
            </div>

            {/* Right Column */}
            <div className="col-span-1 space-y-4">
                {keyAchievements && (keyAchievements.title || keyAchievements.details?.length > 0) && (
                    <Section title="Key Achievements">
                         <div>
                            <h4 className="text-xs font-bold text-black">{keyAchievements.title}</h4>
                            <ul className="list-disc list-outside pl-4 space-y-1 mt-1">
                                {keyAchievements.details?.map((detail: string, i: number) => <li key={i}>{detail}</li>)}
                            </ul>
                         </div>
                    </Section>
                )}
                {skills && skills.length > 0 && (
                    <Section title="Skills">
                        <div className="flex flex-wrap gap-1.5">
                            {skills.map((skill) => (
                                <span key={skill} className="bg-gray-100 text-gray-800 text-[9px] font-medium px-2 py-1 rounded-md border border-gray-300">{skill}</span>
                            ))}
                        </div>
                    </Section>
                )}
                {projects && projects.length > 0 && (
                    <Section title="Projects">
                        <div className="space-y-3">
                        {projects.map((proj, index) => (
                            <div key={`proj-${index}`}>
                                <h4 className="text-sm font-bold text-black">{proj.title}</h4>
                                <p className="text-[9px] text-gray-500 my-0.5">
                                    <span>{proj.date}</span>
                                </p>
                                {proj.context && <p className="text-xs font-medium text-gray-700">{proj.context}</p>}
                                <ul className="list-disc list-outside pl-4 space-y-1 mt-1">
                                    {proj.details?.map((detail: string, i: number) => <li key={i}>{detail}</li>)}
                                </ul>
                            </div>
                        ))}
                        </div>
                    </Section>
                )}
            </div>
        </div>
    </div>
  );
};

ResumePreview.displayName = "ResumePreview";
export default ResumePreview;
