
"use client";

import type { FC } from 'react';
import { Phone, Mail, Linkedin as LinkedinIcon, MapPin } from 'lucide-react';

// Define a type for the parsed resume data to ensure type safety
interface ResumeData {
  personalInfo: { [key: string]: string };
  summary: string;
  keyAchievements: { title?: string, details?: string[] };
  experience: any[];
  education: any[];
  projects: any[];
  skills: string[];
}

interface ResumePreviewProps {
  data: ResumeData;
}

const ResumePreview: FC<ResumePreviewProps> = ({ data }) => {
  const { personalInfo, summary, keyAchievements, experience, education, projects, skills } = data;
  const initials = (personalInfo.name || "N A").split(" ").map((n:string)=>n[0]).join("").substring(0,2).toUpperCase();

  return (
    <div className="bg-white text-black p-8 font-sans text-sm shadow-lg max-w-4xl mx-auto my-4 rounded-lg">
      {/* Header */}
      <header className="flex justify-between items-start mb-6 border-b-4 border-gray-100 pb-4">
        <div>
          <h1 className="text-4xl font-bold text-gray-800">{personalInfo.name || '[Full Name]'}</h1>
          <h2 className="text-lg text-blue-600 font-semibold">{personalInfo.title || '[Professional Title]'}</h2>
        </div>
        <div className="flex-shrink-0">
            <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white text-4xl font-bold">{initials}</span>
            </div>
        </div>
      </header>

      {/* Main Content: Two Columns */}
      <div className="grid grid-cols-3 gap-8">
        {/* Left Column (Main Content) */}
        <div className="col-span-2">
          {summary && (
            <section className="mb-6">
              <h3 className="text-xl font-bold text-gray-800 border-b-2 border-gray-700 pb-1 mb-3">SUMMARY</h3>
              <p className="text-gray-700 leading-relaxed">{summary}</p>
            </section>
          )}

          {experience.length > 0 && (
            <section className="mb-6">
              <h3 className="text-xl font-bold text-gray-800 border-b-2 border-gray-700 pb-1 mb-3">EXPERIENCE</h3>
              {experience.map((job, index) => (
                <div key={`exp-${index}`} className="mb-4">
                  <h4 className="text-md font-bold text-gray-900">{job.title || '[Job Title]'}</h4>
                  <p className="text-blue-600 font-semibold">{job.company || '[Company Name]'}</p>
                  <p className="text-xs text-gray-500 mb-1">{job.date || '[Date]'} {job.location && `| ${job.location}`}</p>
                  <ul className="list-disc list-inside text-gray-700 space-y-1 pl-2">
                    {job.details?.map((detail: string, i: number) => <li key={i}>{detail}</li>)}
                  </ul>
                </div>
              ))}
            </section>
          )}

          {projects.length > 0 && (
            <section>
              <h3 className="text-xl font-bold text-gray-800 border-b-2 border-gray-700 pb-1 mb-3">PROJECTS</h3>
              {projects.map((proj, index) => (
                <div key={`proj-${index}`} className="mb-4">
                  <h4 className="text-md font-bold text-gray-900">{proj.title || '[Project Title]'}</h4>
                   <p className="text-xs text-gray-500 mb-1">{proj.date || '[Date]'}</p>
                  <ul className="list-disc list-inside text-gray-700 space-y-1 pl-2">
                    {proj.details?.map((detail: string, i: number) => <li key={i}>{detail}</li>)}
                  </ul>
                </div>
              ))}
            </section>
          )}
        </div>

        {/* Right Column (Sidebar) */}
        <div className="col-span-1">
          <section className="mb-6">
            <h3 className="text-xl font-bold text-gray-800 border-b-2 border-gray-700 pb-1 mb-3">CONTACT</h3>
            <div className="space-y-2 text-gray-700">
                {personalInfo.phone && <p className="flex items-center"><Phone className="mr-2 h-4 w-4 text-blue-600"/>{personalInfo.phone}</p>}
                {personalInfo.email && <p className="flex items-center break-all"><Mail className="mr-2 h-4 w-4 text-blue-600 flex-shrink-0"/>{personalInfo.email}</p>}
                {personalInfo.linkedin && <p className="flex items-center"><LinkedinIcon className="mr-2 h-4 w-4 text-blue-600"/>{`linkedin.com/${personalInfo.linkedin}`}</p>}
                {personalInfo.location && <p className="flex items-center"><MapPin className="mr-2 h-4 w-4 text-blue-600"/>{personalInfo.location}</p>}
            </div>
          </section>

          {education.length > 0 && (
             <section className="mb-6">
              <h3 className="text-xl font-bold text-gray-800 border-b-2 border-gray-700 pb-1 mb-3">EDUCATION</h3>
              {education.map((edu, index) => (
                <div key={`edu-${index}`} className="mb-3">
                  <h4 className="text-md font-bold text-gray-900">{edu.degree || '[Degree]'}</h4>
                  <p className="text-blue-600 font-semibold">{edu.institution || '[Institution]'}</p>
                  <p className="text-xs text-gray-500">{edu.date || '[Date]'}</p>
                   <ul className="list-disc list-inside text-gray-700 space-y-1 mt-1 pl-2">
                    {edu.details?.map((detail: string, i: number) => <li key={i} className="text-xs">{detail}</li>)}
                  </ul>
                </div>
              ))}
            </section>
          )}
          
          {keyAchievements && (keyAchievements.title || keyAchievements.details?.length > 0) && (
             <section className="mb-6">
                <h3 className="text-xl font-bold text-gray-800 border-b-2 border-gray-700 pb-1 mb-3">KEY ACHIEVEMENTS</h3>
                 <h4 className="text-md font-bold text-gray-900">{keyAchievements.title}</h4>
                 <ul className="list-disc list-inside text-gray-700 space-y-1 mt-1 pl-2">
                    {keyAchievements.details?.map((detail: string, i: number) => <li key={i}>{detail}</li>)}
                  </ul>
             </section>
          )}

          {skills.length > 0 && (
            <section>
              <h3 className="text-xl font-bold text-gray-800 border-b-2 border-gray-700 pb-1 mb-3">SKILLS</h3>
              <div className="flex flex-wrap gap-2">
                {skills.map((skill, index) => (
                  <span key={index} className="bg-gray-200 text-gray-700 text-xs font-medium px-2.5 py-1 rounded-full">{skill}</span>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResumePreview;
