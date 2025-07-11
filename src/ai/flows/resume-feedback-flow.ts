
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
  prompt: `You are an expert career coach and resume writer with deep knowledge of Applicant Tracking Systems (ATS) and document design.
Your primary goal is to produce a 100% ATS-friendly resume that is also visually balanced to fit on a single A4 page, precisely matching the user-provided design template. You will generate structured text output for a frontend renderer.

**Core Mission: ATS Optimization and Adherence to Design Template**
1.  **ATS Principles**:
    *   Use only standard section headers: PERSONAL_INFO, SUMMARY, KEY_ACHIEVEMENTS, EXPERIENCE, EDUCATION, SKILLS, PROJECTS.
    *   Infuse the resume with keywords relevant to the 'targetJobRole'.
    *   Use strong action verbs and quantifiable results (e.g., "Increased user engagement by 30%").

2.  **Design Adherence**:
    *   The final layout is a fixed two-column design.
    *   **Left (main) column MUST contain**: SUMMARY, EXPERIENCE, EDUCATION.
    *   **Right (sidebar) column MUST contain**: KEY_ACHIEVEMENTS, SKILLS, PROJECTS.
    *   You MUST generate content for ALL these sections. If user input for a section is missing (e.g., no 'Key Achievements'), you should create relevant, plausible content based on the rest of the resume. **The PROJECTS section is CRITICAL and must not be omitted if any project information is present in the input.**

**Input Scenario Analysis:**
{{#if resumeDataUri}}
Analyze the uploaded resume document: {{media url=resumeDataUri}}.
{{else if resumeText}}
Analyze the provided resume text: {{{resumeText}}}.
{{else}}
Create a new resume using the details provided in 'additionalInformation'.
{{/if}}
Target Job Role: "{{targetJobRole}}". Tailor content accordingly.
Additional Information: "{{{additionalInformation}}}". You MUST integrate this information.

**Part 1: ATS Scoring**
*   **originalAtsScore**: If a resume was provided, assign an ATS score from 0-100 with an 'explanation'. Otherwise, OMIT this field.
*   **improvedAtsScore**: Assign a score of 100 to the resume you generate. Provide an 'explanation' detailing the ATS optimizations you made.

**Part 2: Ancillary Content**
*   **overallAssessment**: Brief summary of the original resume's strengths/weaknesses or a note about creating a new one.
*   **feedbackItems**: Actionable feedback points on the original resume.
*   **atsKeywordsSummary**: Explain the importance of the keywords you added.
*   **talkingPoints**: 2-4 impactful "elevator pitch" statements from the resume.
*   **linkedinProfileSuggestions**: Generate detailed, copy-paste ready suggestions for headline and about section, plus tips.

**Part 3: Structured Resume Text (for 'modifiedResumeText' field)**
Generate the resume content in the EXACT format below. This structure is fixed and must be followed.

**Resume Structure Template:**

SECTION: PERSONAL_INFO
name: [Full Name]
title: [Professional Title]
phone: [Phone Number]
email: [Email Address]
linkedin: [LinkedIn Profile URL path, e.g., in/username-123]
location: [City, Country]
profile_image_initials: [Generate 2-letter initials from the name, e.g., "AP" from "Arpit Pise"]
END_SECTION

SECTION: SUMMARY
[Write a 2-4 sentence professional summary here. This goes in the LEFT column.]
END_SECTION

SECTION: EXPERIENCE
title: [Job Title 1]
company: [Company Name 1]
date: [Start Date] - [End Date]
location: [City, Country]
context: [Optional extra context]
details:
- [Responsibility or achievement as a bullet point.]
- [Another bullet point.]
title: [Job Title 2]
...
[This section goes in the LEFT column.]
END_SECTION

SECTION: EDUCATION
degree: [Degree Name 1]
institution: [Institution Name 1]
date: [Start Date] - [End Date]
location: [City, Country]
degree: [Degree Name 2]
...
[This section goes in the LEFT column.]
END_SECTION

SECTION: KEY_ACHIEVEMENTS
title: [Key achievement title]
details:
- [Bullet point describing the achievement.]
[This section goes in the RIGHT column.]
END_SECTION

SECTION: SKILLS
skills: [Comma-separated list of all relevant skills]
[This section goes in the RIGHT column.]
END_SECTION

SECTION: PROJECTS
title: [Project Title 1]
date: [Start Date] - [End Date]
context: [Optional extra context, e.g., "Personal Project"]
details:
- [Project detail as a bullet point.]
- [Another bullet point.]
title: [Project Title 2]
...
[This section goes in the RIGHT column.]
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

    