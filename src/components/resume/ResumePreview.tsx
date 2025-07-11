
"use client";

import React, { type FC } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export interface ResumeData {
  personalInfo?: { [key: string]: string };
  summary?: string;
  keyAchievements?: any[];
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
      <div id="resume-preview-content" className="bg-white p-6 w-[210mm] min-h-[297mm] mx-auto shadow-lg">
        <Skeleton className="h-20 w-full mb-4" />
        <div className="flex gap-6">
            <div className="w-2/3 space-y-4"><Skeleton className="h-24 w-full" /><Skeleton className="h-40 w-full" /><Skeleton className="h-32 w-full" /></div>
            <div className="w-1/3 space-y-4"><Skeleton className="h-24 w-full" /><Skeleton className="h-40 w-full" /><Skeleton className="h-32 w-full" /></div>
        </div>
      </div>
    );
  }

  const { personalInfo = {}, summary, keyAchievements = [], experience = [], education = [], projects = [], skills = [] } = data;
  
  const contactInfo = [
    { icon: '📞', text: personalInfo.phone },
    { icon: '✉️', text: personalInfo.email },
    { icon: '🔗', text: personalInfo.linkedin ? `linkedin.com/in/${personalInfo.linkedin.replace(/^(https?:\/\/)?(www\.)?linkedin\.com\/in\//, '')}` : '' },
    { icon: '📍', text: personalInfo.location }
  ].filter(item => item.text);
  
  const sidebarSections = [
    { title: "Key Achievements", items: keyAchievements, type: 'achievements' },
    { title: "Skills", items: skills, type: 'skills' },
    { title: "Projects", items: projects, type: 'projects' }
  ].filter(sec => sec.items && sec.items.length > 0);

  return (
    <div id="resume-preview-content" className="bg-white p-6 w-[210mm] min-h-[296mm] h-[296mm] mx-auto shadow-lg text-[#333] font-sans text-[9.5px] leading-snug">
       <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap');
          #resume-preview-content {
            font-family: 'Roboto', sans-serif !important;
          }
          #resume-preview-content * {
            box-sizing: border-box;
            font-family: inherit !important;
          }
        `}
      </style>
        <header className="flex items-start mb-4">
            <div className="flex-1">
                <h1 className="text-3xl font-bold text-black tracking-tight leading-none">{personalInfo.name || 'Your Name'}</h1>
                <h2 className="text-base font-semibold text-blue-600 mt-1">{personalInfo.title || 'Your Title'}</h2>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-gray-600 text-[9px]">
                  {contactInfo.map((item, index) => (
                    <div key={index} className="flex items-center gap-1">
                      <span>{item.icon}</span>
                      <span>{item.text}</span>
                    </div>
                  ))}
                </div>
            </div>
            {personalInfo.profile_image_initials && (
                <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center ml-4 flex-shrink-0">
                    <span className="text-white text-3xl font-bold">{personalInfo.profile_image_initials}</span>
                </div>
            )}
        </header>

        <div className="flex gap-x-6">
            <div className="w-[65%] space-y-3">
                {summary && (
                    <Section title="Summary">
                        <p>{summary}</p>
                    </Section>
                )}
                {experience.length > 0 && (
                    <Section title="Experience">
                        <div className="space-y-2.5">
                        {experience.map((job, index) => (
                            <div key={`exp-${index}`}>
                                <h4 className="text-[10.5px] font-bold text-black">{job.title}</h4>
                                <p className="text-[9.5px] font-semibold text-blue-600">{job.company}</p>
                                <p className="text-[8.5px] text-gray-500 my-0.5">
                                    <span>{job.date}</span>
                                    {job.location && <span className="ml-2">| {job.location}</span>}
                                </p>
                                {job.context && <p className="text-[9.5px] font-medium text-gray-700">{job.context}</p>}
                                <ul className="list-disc list-outside pl-3.5 space-y-0.5 mt-1">
                                    {job.details?.map((detail: string, i: number) => <li key={i}>{detail}</li>)}
                                </ul>
                            </div>
                        ))}
                        </div>
                    </Section>
                )}
                {education.length > 0 && (
                     <Section title="Education">
                         <div className="space-y-2.5">
                         {education.map((edu, index) => (
                            <div key={`edu-${index}`}>
                                <h4 className="text-[10.5px] font-bold text-black">{edu.degree}</h4>
                                <p className="text-[9.5px] font-semibold text-blue-600">{edu.institution}</p>
                                <p className="text-[8.5px] text-gray-500 my-0.5">
                                    <span>{edu.date}</span>
                                    {edu.location && <span className="ml-2">| {edu.location}</span>}
                                </p>
                            </div>
                         ))}
                         </div>
                     </Section>
                )}
            </div>

            <div className="w-[35%] space-y-3">
                {sidebarSections.map((section, index) => (
                    <Section key={index} title={section.title}>
                        {section.type === 'skills' && (
                            <div className="flex flex-wrap gap-1">
                                {(section.items as string[]).map((skill) => (
                                    <span key={skill} className="bg-gray-100 text-gray-800 text-[8.5px] font-medium px-1.5 py-0.5 rounded-md border border-gray-300">{skill}</span>
                                ))}
                            </div>
                        )}
                        {section.type === 'achievements' && (
                            <div className="space-y-2">
                                {(section.items as any[]).map((ach, i) => (
                                    <div key={`ach-${i}`}>
                                        <h4 className="text-[10px] font-bold text-black">{ach.title}</h4>
                                        <ul className="list-disc list-outside pl-3.5 space-y-0.5 mt-1">
                                            {ach.details?.map((detail: string, j: number) => <li key={j}>{detail}</li>)}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        )}
                        {section.type === 'projects' && (
                             <div className="space-y-2.5">
                                {(section.items as any[]).map((proj, i) => (
                                    <div key={`proj-${i}`}>
                                        <h4 className="text-[10.5px] font-bold text-black">{proj.title}</h4>
                                        <p className="text-[8.5px] text-gray-500 my-0.5">
                                            <span>{proj.date}</span>
                                        </p>
                                        {proj.context && <p className="text-[9.5px] font-medium text-gray-700">{proj.context}</p>}
                                        <ul className="list-disc list-outside pl-3.5 space-y-0.5 mt-1">
                                            {proj.details?.map((detail: string, j: number) => <li key={j}>{detail}</li>)}
                                        </ul>
                                    </div>
                                ))}
                             </div>
                        )}
                    </Section>
                ))}
            </div>
        </div>
    </div>
  );
};

ResumePreview.displayName = "ResumePreview";
export default ResumePreview;
