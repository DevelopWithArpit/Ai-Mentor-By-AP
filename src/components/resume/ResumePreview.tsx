
"use client";

import React, { type FC } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Phone, Mail, Linkedin, MapPin, Lightbulb, Briefcase, Star } from 'lucide-react';

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

const Section: FC<{ title: string; children: React.ReactNode; className?: string, icon?: React.ReactNode }> = ({ title, icon, children, className }) => (
    <div className={className}>
        <h3 className="flex items-center text-sm font-bold tracking-wider text-black uppercase pb-1 border-b-2 border-black mb-3">
          {icon && <span className="mr-2">{icon}</span>}
          {title}
        </h3>
        <div className="space-y-3">
         {children}
        </div>
    </div>
);

const ResumePreview: FC<ResumePreviewProps> = ({ data }) => {
  if (!data) {
    return (
      <div id="resume-preview-content" className="bg-white p-8 w-[210mm] min-h-[297mm] mx-auto shadow-lg">
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
    { icon: <Phone size={12} className="text-blue-600"/>, text: personalInfo.phone },
    { icon: <Mail size={12} className="text-blue-600"/>, text: personalInfo.email },
    { icon: <Linkedin size={12} className="text-blue-600"/>, text: personalInfo.linkedin ? `linkedin.com/in/${personalInfo.linkedin.replace(/^(https?:\/\/)?(www\.)?linkedin\.com\/in\//, '')}` : '' },
    { icon: <MapPin size={12} className="text-blue-600"/>, text: personalInfo.location }
  ].filter(item => item.text);

  return (
    <div id="resume-preview-content" className="bg-white p-8 w-[210mm] h-[297mm] mx-auto shadow-lg text-gray-800 font-sans text-[10px] leading-normal flex flex-col">
       <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap');
          #resume-preview-content, #resume-preview-content * {
            font-family: 'Roboto', sans-serif !important;
            box-sizing: border-box;
          }
        `}
      </style>
        <header className="flex items-start justify-between mb-4 flex-shrink-0">
            <div className="flex-1">
                <h1 className="text-4xl font-bold text-black tracking-tighter leading-none">{personalInfo.name || 'Your Name'}</h1>
                <h2 className="text-md font-semibold text-blue-600 mt-1">{personalInfo.title || 'Your Title'}</h2>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-gray-600 text-[9px]">
                  {contactInfo.map((item, index) => (
                    <div key={index} className="flex items-center gap-1.5">
                      {item.icon}
                      <span>{item.text}</span>
                    </div>
                  ))}
                </div>
            </div>
            {personalInfo.profile_image_initials && (
                <div className="w-24 h-24 rounded-full bg-blue-500 flex items-center justify-center ml-6 flex-shrink-0">
                    <span className="text-white text-4xl font-bold">{personalInfo.profile_image_initials}</span>
                </div>
            )}
        </header>

        <div className="flex-grow flex gap-x-8">
            <div className="w-[63%] space-y-4">
                {summary && (
                    <Section title="Summary">
                        <p className="text-[10px]">{summary}</p>
                    </Section>
                )}
                {experience.length > 0 && (
                    <Section title="Experience">
                        {experience.map((job, index) => (
                            <div key={`exp-${index}`}>
                                <h4 className="text-[11px] font-bold text-black">{job.title}</h4>
                                <p className="text-[10px] font-semibold text-blue-600">{job.company}</p>
                                <p className="text-[9px] text-gray-500 my-0.5 flex items-center gap-x-3">
                                    <span className="flex items-center gap-1"><Briefcase size={10} /> {job.date}</span>
                                    {job.location && <span className="flex items-center gap-1"><MapPin size={10} /> {job.location}</span>}
                                </p>
                                {job.context && <p className="text-[10px] font-medium text-gray-700">{job.context}</p>}
                                <ul className="list-disc list-outside pl-3 space-y-1 mt-1 text-[10px]">
                                    {job.details?.map((detail: string, i: number) => <li key={i}>{detail}</li>)}
                                </ul>
                            </div>
                        ))}
                    </Section>
                )}
                {education.length > 0 && (
                     <Section title="Education">
                         {education.map((edu, index) => (
                            <div key={`edu-${index}`}>
                                <h4 className="text-[11px] font-bold text-black">{edu.degree}</h4>
                                <p className="text-[10px] font-semibold text-blue-600">{edu.institution}</p>
                                <p className="text-[9px] text-gray-500 my-0.5 flex items-center gap-1">
                                    <Briefcase size={10}/>
                                    <span>{edu.date}</span>
                                </p>
                            </div>
                         ))}
                     </Section>
                )}
            </div>

            <div className="w-[37%] space-y-4">
                {keyAchievements.length > 0 && (
                  <Section title="Key Achievements" icon={<Lightbulb size={12} />}>
                      {(keyAchievements as any[]).map((ach, i) => (
                          <div key={`ach-${i}`}>
                              <h4 className="text-[10.5px] font-bold text-black">{ach.title}</h4>
                              <ul className="list-disc list-outside pl-3 space-y-1 mt-1 text-[10px]">
                                  {ach.details?.map((detail: string, j: number) => <li key={j}>{detail}</li>)}
                              </ul>
                          </div>
                      ))}
                  </Section>
                )}
                {skills && skills.length > 0 && (
                  <Section title="Skills">
                      <div className="flex flex-wrap gap-1.5">
                          {skills.map((skill) => (
                              <span key={skill} className="bg-white text-gray-700 text-[9px] font-medium px-2 py-1 rounded-md border border-gray-300">{skill}</span>
                          ))}
                      </div>
                  </Section>
                )}
                {projects.length > 0 && (
                  <Section title="Projects" icon={<Star size={12} />}>
                      {(projects as any[]).map((proj, i) => (
                          <div key={`proj-${i}`}>
                              <h4 className="text-[10.5px] font-bold text-black">{proj.title}</h4>
                              <p className="text-[9px] text-gray-500 my-0.5 flex items-center gap-1">
                                <Briefcase size={10} />
                                <span>{proj.date}</span>
                              </p>
                              {proj.context && <p className="text-[10px] font-medium text-gray-700">{proj.context}</p>}
                              <ul className="list-disc list-outside pl-3 space-y-1 mt-1 text-[10px]">
                                  {proj.details?.map((detail: string, j: number) => <li key={j}>{detail}</li>)}
                              </ul>
                          </div>
                      ))}
                  </Section>
                )}
            </div>
        </div>
        <footer className="text-center text-gray-400 text-[8px] mt-auto pt-4 flex-shrink-0">
          Powered by AI Mentor by AP
        </footer>
    </div>
  );
};

ResumePreview.displayName = "ResumePreview";
export default ResumePreview;

    