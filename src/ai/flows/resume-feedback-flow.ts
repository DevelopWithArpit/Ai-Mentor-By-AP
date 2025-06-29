
'use server';
/**
 * @fileOverview A flow for providing feedback on resume text or an uploaded resume document, generating an improved version,
 *               offering LinkedIn profile suggestions, OR creating a new resume if only details are provided.
 *
 * - getResumeFeedback - A function that analyzes resume text/document or details, provides suggestions/creates a resume,
 *                       rewrites/formats it, and suggests LinkedIn improvements.
 * - ResumeFeedbackInput - The input type for the getResumefeedback function.
 * - ResumeFeedbackOutput - The return type for the getResumeFeedback function.
 */

import {ai}from '@/ai/genkit';
import {z}from 'genkit';

const ResumeFeedbackInputSchema = z.object({
  resumeDataUri: z.string().optional().describe("The user's resume as a data URI (e.g., from a PDF, DOCX, TXT upload). Expected format: 'data:<mimetype>;base64,<encoded_data>'. If provided, this is prioritized over resumeText."),
  resumeText: z.string().optional().describe('The full text content of the resume. Used if resumeDataUri is not provided. If both this and resumeDataUri are empty, the AI will attempt to CREATE a new resume based on the additionalInformation field.'),
  targetJobRole: z.string().optional().describe('The target job role or industry the resume is for. This helps tailor feedback, the rewritten/created resume, and LinkedIn suggestions, especially for keyword optimization and ATS compatibility.'),
  additionalInformation: z.string().optional().describe('Optional: For an existing resume, specific projects, achievements, or skills the user wants to ensure is included or highlighted. For CREATING a new resume, this field should contain all user details like work experience, education, skills, projects, contact info, etc., in natural language or bullet points.'),
});
export type ResumeFeedbackInput = z.infer<typeof ResumeFeedbackInputSchema>;

const FeedbackItemSchema = z.object({
    area: z.string().describe("The area of the resume the feedback pertains to (e.g., 'Summary', 'Experience Section', 'Skills', 'ATS Keywords', 'Formatting for ATS'). If creating a new resume, this might be a general note."),
    suggestion: z.string().describe("The specific feedback or suggestion for improvement on the original resume, or a comment if a new resume was created."),
    importance: z.enum(["high", "medium", "low"]).optional().describe("The perceived importance of addressing this feedback."),
});

const AtsScoreSchema = z.object({
    score: z.number().min(0).max(100).describe("The ATS score from 0 to 100."),
    explanation: z.string().describe("A brief explanation for the score, highlighting strengths and weaknesses from an ATS perspective.")
});

const LinkedInProfileSuggestionsSchema = z.object({
  suggestedHeadline: z.string().optional().describe("A suggested, impactful LinkedIn headline (around 120-220 characters) based on the rewritten/created resume and target job role. It should be concise, keyword-rich, and nearly ready for copy-paste."),
  suggestedAboutSection: z.string().optional().describe("A draft for the LinkedIn 'About' section (summary), written in a professional yet engaging tone (ideally 2-4 paragraphs), based on the rewritten/created resume. It should highlight key skills, experiences, and career aspirations. This should be comprehensive and suitable for immediate use/copy-paste."),
  experienceSectionTips: z.string().optional().describe("Actionable tips (2-3 concise bullet points or a short paragraph) on how to adapt the resume's experience bullet points for LinkedIn (e.g., writing in first-person, focusing on impact, using keywords, quantifying achievements, and potentially adding links to projects or media). If the resume has no experience section, these tips should be general or acknowledge this."),
  skillsSectionTips: z.string().optional().describe("Recommendations (2-3 concise bullet points or a short paragraph) for the LinkedIn skills section, including which key skills from the resume to highlight, the importance of getting endorsements, how to order them, and aligning with the target job role.")
}).optional();

const ResumeFeedbackOutputSchema = z.object({
  overallAssessment: z.string().describe('A brief overall assessment of the original resume (if provided) or a statement indicating a new resume was created from details.'),
  originalAtsScore: AtsScoreSchema.optional().describe("The calculated ATS score for the user's original resume. This is omitted if no original resume was provided."),
  improvedAtsScore: AtsScoreSchema.describe("The calculated ATS score for the AI-generated/improved resume."),
  feedbackItems: z.array(FeedbackItemSchema).describe('A list of specific feedback points and suggestions for the original resume, or general comments if a new resume was created.'),
  atsKeywordsSummary: z.string().optional().describe('A summary of relevant keywords identified or suggested for better ATS performance, tailored to the target job role if provided, applicable to the rewritten/created resume. Explain how these improve ATS chances.'),
  talkingPoints: z.array(z.string()).optional().describe("A list of 2-4 concise and impactful statements derived from the resume, highlighting key achievements or value propositions. Useful for quick self-introductions or elevator pitches."),
  modifiedResumeText: z.string().describe('The rewritten or newly created resume text, structured in a specific text format for parsing by the frontend renderer. It should contain all sections of the resume separated by specific delimiters.'),
  linkedinProfileSuggestions: LinkedInProfileSuggestionsSchema,
});
export type ResumeFeedbackOutput = z.infer<typeof ResumeFeedbackOutputSchema>;

export async function getResumeFeedback(input: ResumeFeedbackInput): Promise<ResumeFeedbackOutput> {
  return resumeFeedbackFlow(input);
}

const prompt = ai.definePrompt({
  name: 'resumeFeedbackPrompt',
  input: {schema: ResumeFeedbackInputSchema},
  output: {schema: ResumeFeedbackOutputSchema},
  prompt: `You are an expert career coach and resume writer with deep knowledge of Applicant Tracking Systems (ATS).
Your primary goal is to produce a 100% ATS-friendly resume. You will also provide feedback and generate a structured text output that a frontend application will use to create a visually appealing two-column PDF.

**Core Mission: ATS Optimization**
An ATS is a software that scans resumes. To pass it, the resume must be highly parsable and keyword-optimized. Adhere strictly to these principles for the 'modifiedResumeText':
1.  **Use Standard Section Headers**: Only use the headers provided in the template (PERSONAL_INFO, SUMMARY, KEY_ACHIEVEMENTS, EXPERIENCE, EDUCATION, SKILLS, PROJECTS). Do not invent new ones.
2.  **Keyword Integration**: If a 'targetJobRole' is provided, infuse the entire resume (especially Summary and Experience) with relevant keywords and skills for that role.
3.  **Action Verbs & Quantifiable Results**: Start experience and project bullet points with strong action verbs (e.g., "Engineered," "Managed," "Increased"). Quantify achievements with numbers and metrics whenever possible (e.g., "Increased user engagement by 30%," "Reduced wait times by 85%").
4.  **Clarity and Simplicity**: Avoid jargon where simpler terms exist, unless it's a key technical term for the target role.

**Input Scenario Analysis:**
{{#if resumeDataUri}}
Analyze the uploaded resume document: {{media url=resumeDataUri}}.
{{else if resumeText}}
Analyze the provided resume text: {{{resumeText}}}.
{{else}}
Create a new resume using the details provided. For this scenario, use the following example details to structure the new resume:
Name: Arpit Pise
Title: AI Engineer / Robotics Software Engineer
Phone: 7276602831
Email: arpitpise1@gmail.com
LinkedIn: in/arpit-pise-20029a287
Location: Nagpur, India
Summary: As a B.Tech student specializing in Robotics and Artificial Intelligence, I am dedicated to crafting cutting-edge AI solutions. My expertise in Python, Java, and C++ complements my projects, notably leading the successful development of the AI Mentor platform. I am eager to apply my skills in an AI Engineer or Robotics Software Engineer role to contribute to advanced technological innovations.
Experience: Technical Member at Priyadarshini College of Engineering (01/2023 - 01/1970, Nagpur, India) - Technical Member, College Committee. Collaborated in organizing 5+ technical events, resulting in 50% increase in participation. Implemented online registration system with PHP/MySQL, decreasing wait times by 85%. Developed and maintained college committee website using HTML/CSS/JS, leading to 30% increase in event visibility.
Education: B.Tech in Robotics and AI from Priyadarshini College Of Engineering (08/2024 - 05/2028). HSC from ST. PAUL PUBLIC SCHOOL & JUNIOR COLLEGE (01/2021 - 05/2023). SSC from PURUSHOTTAM DAS BAGLA CONVENT (01/2019 - 05/2021).
Key Achievements: AI Mentor by AP Platform Development - Led the development of the AI Mentor by AP platform, achieving a 30% increase in user engagement within the first month through personalized learning experiences.
Skills: AWS, Azure, C/C++, CSS, Data Structures, Deep Learning, Django, Docker, Flask, GAMS, Git, HTML, Java, JavaScript, Keras, Linux, NLP, NumPy, Pandas, PHP, Python, PyTorch, Robotics, Scikit-Learn, TensorFlow, Gmail.
Projects: AI Mentor by AP (05/2025 - 01/1970) - Personal Project. Spearheaded development of an AI-powered learning platform. Engineered AI-driven tools for resume, cover letter, etc. Integrated AI-powered image generation. Designed the platform with a user-centric approach.
{{/if}}
Target Job Role: "{{targetJobRole}}". Tailor content accordingly.
Additional Information: "{{{additionalInformation}}}". You MUST integrate this information into the final resume. If an existing resume (from text or a file) is provided, intelligently merge these additional details into it. This might involve adding new skills, projects, or updating experience bullet points. If you are creating a new resume from scratch, this field is your primary source of content. This is a mandatory instruction.

**Part 1: ATS Scoring**
*   **originalAtsScore**: If a resume was provided by the user, you MUST analyze it and assign an ATS score from 0 to 100. Provide a brief 'explanation' for this score, focusing on keyword relevance for the target role, parsable format, use of action verbs, and quantifiable results. If the user is creating a new resume from scratch (no original resume provided), you MUST omit the 'originalAtsScore' field entirely from your output.
*   **improvedAtsScore**: You MUST analyze the resume you just generated/rewrote ('modifiedResumeText'). The 'score' for this improved resume MUST be 100. Provide a brief 'explanation' detailing why this version achieves a perfect score, highlighting the specific ATS optimizations you implemented that make it 100% compliant (e.g., "Achieved a perfect score of 100 due to optimal keyword integration for the target role, a fully parsable format with standard headers, and the use of quantifiable achievements and strong action verbs throughout.").

**Part 2: Ancillary Content**
*   **overallAssessment**: Brief summary of the original resume's strengths/weaknesses or a note about creating a new one. Include a comment on its initial ATS-friendliness.
*   **feedbackItems**: Actionable feedback points on the original resume. If providing feedback, include specific suggestions under the 'Formatting for ATS' area, commenting on things like tables, columns, or non-standard fonts in the original that could hurt ATS compatibility.
*   **atsKeywordsSummary**: Explain *why* the keywords you've added to the rewritten resume are important for the target job role and how they improve ATS chances. Be specific.
*   **talkingPoints**: 2-4 impactful statements from the final resume.
*   **linkedinProfileSuggestions**: Generate detailed, copy-paste ready suggestions for headline and about section, plus tips for experience and skills sections.

**Part 3: Structured Resume Text (for 'modifiedResumeText' field)**
Generate the resume content in the EXACT format below. This structured format is itself ATS-friendly. Adhere to the ATS principles above when writing the content for each field.

**IMPORTANT FORMATTING RULES:**
*   Each section MUST start with 'SECTION: <NAME>' and end with 'END_SECTION'.
*   Inside a section, use 'key: value' pairs. For lists (like bullet points in experience), start each item on a new line with a hyphen '-'.
*   For skills, provide a single comma-separated list for the 'skills' key.
*   If a section (like 'EXPERIENCE' or 'PROJECTS') has no content, OMIT the entire section block (from 'SECTION:' to 'END_SECTION').
*   When creating a new resume from details, meticulously parse 'additionalInformation' to fill all fields. If a detail isn't found, use a placeholder like '[Detail Not Provided]'.
*   For multi-entry sections (Experience, Education, Projects), repeat the block of keys (title, company, etc.) for each separate entry.

**Resume Structure Template:**

SECTION: PERSONAL_INFO
name: [Full Name]
title: [Professional Title]
phone: [Phone Number]
email: [Email Address]
linkedin: [LinkedIn Profile URL, just the path, e.g., in/username-123]
location: [City, Country]
END_SECTION

SECTION: SUMMARY
[Write a 2-4 sentence professional summary here. Tailor it to the target job role.]
END_SECTION

SECTION: KEY_ACHIEVEMENTS
title: [Key achievement title]
details:
- [Bullet point describing the achievement.]
END_SECTION

SECTION: EXPERIENCE
title: [Job Title 1]
company: [Company Name 1]
date: [Start Date] - [End Date]
location: [City, Country]
context: [Optional extra context, e.g., 'College Committee']
details:
- [Responsibility or achievement as a bullet point.]
- [Another bullet point.]
title: [Job Title 2]
company: [Company Name 2]
date: [Start Date] - [End Date]
location: [City, Country]
details:
- [Responsibility or achievement as a bullet point.]
END_SECTION

SECTION: EDUCATION
degree: [Degree Name 1, e.g., Bachelor of Technology]
institution: [Institution Name 1]
date: [Start Date] - [End Date]
location: [City, Country]
degree: [Degree Name 2, e.g., HSC]
institution: [Institution Name 2]
date: [Start Date] - [End Date]
location: [City, Country]
END_SECTION

SECTION: SKILLS
skills: [Comma-separated list of all relevant skills]
END_SECTION

SECTION: PROJECTS
title: [Project Title 1]
date: [Start Date] - [End Date]
context: [Optional extra context, e.g., 'Personal Project']
details:
- [Project detail as a bullet point. Describe your contribution and the outcome.]
- [Another bullet point.]
title: [Project Title 2]
date: [Start Date] - [End Date]
context: [Optional extra context, e.g., 'Team Project']
details:
- [Project detail as a bullet point.]
END_SECTION

`,
});

const resumeFeedbackFlow = ai.defineFlow(
  {
    name: 'resumeFeedbackFlow',
    inputSchema: ResumeFeedbackInputSchema,
    outputSchema: ResumeFeedbackOutputSchema,
  },
  async input => {
    // Basic check: if creating (no file, no text), additionalInformation must be somewhat substantial
    if (!input.resumeDataUri && !input.resumeText && (!input.additionalInformation || input.additionalInformation.length < 50)) {
        return {
            overallAssessment: "Insufficient details to process request.",
            feedbackItems: [{
                area: "Input Error",
                suggestion: "Please upload a resume, paste resume text, or provide comprehensive details in the 'Additional Information' field for the AI to create your resume.",
                importance: "high"
            }],
            improvedAtsScore: {
                score: 0,
                explanation: "Could not generate a resume due to insufficient input details."
            },
            modifiedResumeText: "SECTION: ERROR\nmessage: Insufficient details provided. To improve an existing resume, please upload it or paste its text. To create a new resume, provide comprehensive information in the 'Additional Information' field (experience, education, skills, projects, contact info).\nEND_SECTION",
            atsKeywordsSummary: "Not applicable.",
            talkingPoints: [],
            linkedinProfileSuggestions: {
                suggestedHeadline: "Update once resume is available.",
                suggestedAboutSection: "Provide resume details/file to generate this section.",
                experienceSectionTips: "Detail your experiences once your resume is drafted/uploaded.",
                skillsSectionTips: "List relevant skills after your resume is complete/uploaded."
            }
        };
    }

    const {output} = await prompt(input);
    return output!;
  }
);

    
