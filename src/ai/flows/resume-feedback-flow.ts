
'use server';
/**
 * @fileOverview A flow for providing feedback on resume text or an uploaded resume document, generating an improved version,
 *               offering LinkedIn profile suggestions, OR creating a new resume if only details are provided.
 *
 * - getResumeFeedback - A function that analyzes resume text/document or details, provides suggestions/creates a resume,
 *                       rewrites/formats it, and suggests LinkedIn improvements.
 * - ResumeFeedbackInput - The input type for the getResumeFeedback function.
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

const LinkedInProfileSuggestionsSchema = z.object({
  suggestedHeadline: z.string().optional().describe("A suggested, impactful LinkedIn headline (around 120-220 characters) based on the rewritten/created resume and target job role. It should be concise, keyword-rich, and nearly ready for copy-paste."),
  suggestedAboutSection: z.string().optional().describe("A draft for the LinkedIn 'About' section (summary), written in a professional yet engaging tone (ideally 2-4 paragraphs), based on the rewritten/created resume. It should highlight key skills, experiences, and career aspirations. This should be comprehensive and suitable for immediate use/copy-paste."),
  experienceSectionTips: z.string().optional().describe("Actionable tips (2-3 concise bullet points or a short paragraph) on how to adapt the resume's experience bullet points for LinkedIn (e.g., writing in first-person, focusing on impact, using keywords, quantifying achievements, and potentially adding links to projects or media). If the resume has no experience section, these tips should be general or acknowledge this."),
  skillsSectionTips: z.string().optional().describe("Recommendations (2-3 concise bullet points or a short paragraph) for the LinkedIn skills section, including which key skills from the resume to highlight, the importance of getting endorsements, how to order them, and aligning with the target job role.")
}).optional();

const ResumeFeedbackOutputSchema = z.object({
  overallAssessment: z.string().describe('A brief overall assessment of the original resume (if provided) or a statement indicating a new resume was created from provided details.'),
  feedbackItems: z.array(FeedbackItemSchema).describe('A list of specific feedback points and suggestions for the original resume, or general comments if a new resume was created.'),
  atsKeywordsSummary: z.string().optional().describe('A summary of relevant keywords identified or suggested for better ATS performance, tailored to the target job role if provided, applicable to the rewritten/created resume. Explain how these improve ATS chances.'),
  talkingPoints: z.array(z.string()).optional().describe("A list of 2-4 concise and impactful statements derived from the resume, highlighting key achievements or value propositions. Useful for quick self-introductions or elevator pitches."),
  modifiedResumeText: z.string().describe('The rewritten or newly created resume text, incorporating the feedback and optimizations. This version should be ready to use or further refine, structured with clear headings and formatting for professional PDF output. It should be highly ATS-friendly, following a traditional professional format.'),
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
  prompt: `You are an expert career coach, resume reviewer, and resume writer, specializing in optimizing resumes for Applicant Tracking Systems (ATS), improving overall resume effectiveness, and enhancing LinkedIn profiles.
Your goal is to produce output that adheres to a traditional professional format often preferred by large multinational companies, ensuring it is EXTREMELY ATS-FRIENDLY.

You will perform actions based on the provided input:

{{#if resumeDataUri}}
**Scenario A: Existing Resume from Uploaded Document**
The user has uploaded their resume document.
Resume Document (extract text from this): {{media url=resumeDataUri}}
Analyze this document. Then perform the tasks: Provide Feedback, Rewrite the Resume, Provide LinkedIn Suggestions. If the document is an image or unreadable, state that in the 'overallAssessment' and 'modifiedResumeText', and then proceed as if creating a new resume if 'additionalInformation' is available.
{{else if resumeText}}
**Scenario B: Existing Resume from Text Input**
The user has pasted their resume text.
Resume Text to Analyze and Rewrite:
{{{resumeText}}}
Analyze this text. Then perform the tasks: Provide Feedback, Rewrite the Resume, Provide LinkedIn Suggestions.
{{else}}
**Scenario C: Create New Resume from Details**
The user wants to create a new resume using the details below.
Perform the tasks: Create a New Resume, Generate Supporting Content (ATS, Talking Points, LinkedIn).
{{/if}}

{{#if targetJobRole}}
Target Job Role/Industry: "{{targetJobRole}}".
Tailor your feedback, the rewritten/created resume, and LinkedIn suggestions accordingly. Focus on incorporating relevant keywords and highlighting skills and experiences pertinent to this role/industry. Ensure keyword optimization for ATS.
{{/if}}

{{#if additionalInformation}}
User's Details / Additional Information to Incorporate/Use for Creation:
"{{{additionalInformation}}}"
*   If analyzing an existing resume (from upload or text): Thoughtfully integrate this additional information into the rewritten resume.
*   If creating a new resume (Scenario C, or if uploaded document was unreadable and additionalInformation exists): This field is the *primary source* for creating the new resume. Parse all details (name, contact, experience, education, skills, projects) from here.
{{/if}}

**Task Details (Applicable to the Determined Scenario):**

**Part 1: Feedback/Creation Context (for \`overallAssessment\`, \`feedbackItems\`, \`atsKeywordsSummary\`, \`talkingPoints\` fields)**
*   **Overall Assessment**:
    *   If improving an existing resume (Scenario A or B): Brief summary of the original resume's strengths/weaknesses, ATS compatibility. {{#if targetJobRole}}Comment on suitability for "{{targetJobRole}}".{{/if}} If uploaded document was unreadable, state that.
    *   If creating a new resume (Scenario C or fallback): Statement like "New resume draft created based on the details you provided, following a traditional professional format."
*   **Feedback Items**:
    *   If improving: List of specific, actionable feedback items on the original resume (area, suggestion, importance). Include feedback on ATS-friendliness.
    *   If creating: A single general feedback item like: { area: "General", suggestion: "Review the generated resume for accuracy and customize it further to perfectly match your profile and the jobs you're applying for. It has been structured for ATS-friendliness and a traditional professional appearance.", importance: "high" }.
*   **ATS Keywords Summary**: List relevant keywords (tailored to \`targetJobRole\` if provided) for the *final* resume (rewritten or created). Explain how these improve ATS chances.
*   **Talking Points**: 2-4 concise, impactful statements derived from the *final* resume.

**Part 2: Final Resume (for \`modifiedResumeText\` field)**
Generate a professional resume. Take the user's input (from uploaded document, pasted text, or additional details for creation) and improve/structure it.
**Crucially, ensure the final text output is EXTREMELY ATS-FRIENDLY and reflects a traditional professional format often preferred by large multinational companies.** This means:
- Use standard, universally recognized section headings.
- Avoid tables, columns, or complex graphical elements *in the text itself*. The formatting will be applied later (e.g., by PDF generator). Your output should be a single stream of structured text.
- Ensure dates are consistently formatted (e.g., MM/YYYY – MM/YYYY or Month YYYY – Month YYYY).
- Use standard bullet points for lists.
- Incorporate keywords relevant to the job role naturally within the text.
- Ensure a clear, logical flow of information, with experience and education typically in reverse chronological order.
- Use simple, clean, professional language. Ensure the resume is free of grammatical errors and typos.
- Emphasize quantifiable achievements using specific numbers and metrics.

Maintain consistency with layout, font (implied by structure for the text output), and section structure. The goal is to produce a \`modifiedResumeText\` that is highly organized and clearly sectioned, ready for professional PDF conversion, and has the highest chance of being parsed correctly by various ATS.

*Improve (if existing content is provided):*
– Grammar, tone, and phrasing for professionalism.
– Quantify achievements where possible using strong action verbs.
– Reorganize content for logical flow and ATS readability.
– Format consistently (dates, bullet points, spacing).

*Include the following structured sections using Markdown H2 (e.g., "## Summary") for main section titles. Use Markdown Bold for sub-headings like job titles or degree names.*

### [User's Full Name - Extract or use placeholder if not found]
[User's Desired Role/Title - Extract or use placeholder if not found, place below name]
Phone: [User's Phone Number] | Email: [User's Email] | LinkedIn: [User's LinkedIn Profile URL] | Location: [User's Location]

## SUMMARY
[Provide a brief professional summary (3-5 lines max) highlighting key skills, expertise, and career goals. Keep it impactful, concise, and keyword-rich for ATS.]

## EXPERIENCE
(List in reverse chronological order)
**[Job Title]** | [Company Name] | [Start Date] – [End Date] | [Location]
*   [Bullet points outlining responsibilities and achievements, quantifying impact where possible with numbers and metrics. Start each bullet with a strong action verb. Use clear, concise language.]
*   [Another bullet point...]

**IMPORTANT INSTRUCTION FOR 'EXPERIENCE' SECTION:** If your analysis of the user's provided information (from resumeDataUri, resumeText, OR additionalInformation when creating a new resume) indicates that the user has NO work experience, then you MUST OMIT the entire "## EXPERIENCE" section (including the heading and any content) from the \`modifiedResumeText\` output. Only include this section if there is actual experience content to populate.

## EDUCATION
(List in reverse chronological order)
**[Degree Name]** ([Major/Concentration if applicable]) | [University Name] | [Graduation Date or Expected Graduation Date] | [Location]
*   [Optional: Relevant coursework, GPA if high, honors, or academic achievements as bullet points.]

## SKILLS
(Group skills logically, e.g., Programming Languages, Software & Tools, Methodologies, Certifications. Use clear, common skill names for ATS. Present as a comma-separated list or categorized bullet points as appropriate for clarity and ATS-friendliness.)
*   **Category 1:** Skill A, Skill B, Skill C
*   **Category 2:** Skill D, Skill E

## PROJECTS
(Optional, but recommended if relevant; for each project)
**[Project Name]** | [Date or Duration, e.g., Fall 2023 or 3 months] (Optional)
*   [Description of the project, your role, key contributions, its impact/results, and technologies used. e.g., Tech Stack: Python, React, AWS. Quantify results.]
*   [Bullet points highlighting your role and impact, if any.]

## KEY ACHIEVEMENTS
(Optional section, include if distinct major achievements can be highlighted separately from experience bullets. Make them quantifiable and impactful.)
*   [Highlight major accomplishments, projects, or recognitions that reinforce expertise. E.g., "Increased sales by 15% in Q3 2023 by implementing..."]
*   [Another key achievement...]

If creating a new resume from \`additionalInformation\` (Scenario C), use these same content and structure guidelines, prioritizing ATS-friendliness and a traditional professional format.
If an uploaded document was unreadable and no \`additionalInformation\` was sufficient for creation, output a message like "The uploaded document could not be read, and insufficient details were provided in 'Additional Information' to create a resume." in this field.

**Part 3: Detailed LinkedIn Profile Suggestions (for \`linkedinProfileSuggestions\` field and its sub-fields)**
*   Based on the \`modifiedResumeText\` (rewritten or created) and \`targetJobRole\`:
    *   **\`suggestedHeadline\`**: Impactful, keyword-rich LinkedIn headline (120-220 characters), nearly ready for copy-paste.
    *   **\`suggestedAboutSection\`**: Comprehensive, compelling "About" section (2-4 paragraphs), suitable for immediate use/copy-paste.
    *   **\`experienceSectionTips\`**: 2-3 concise bullet points/short paragraph of actionable tips for adapting resume experience to LinkedIn (e.g., using first-person, expanding on impact, incorporating media/links, keyword use). If the resume has no experience section, these tips should be general or acknowledge this (e.g., "Focus on projects and skills in your LinkedIn profile until you gain work experience.").
    *   **\`skillsSectionTips\`**: 2-3 concise bullet points/short paragraph of recommendations for LinkedIn skills section (e.g., which key skills from the resume to list, getting endorsements, ordering skills, aligning with job targets).
*   Ensure content for \`suggestedHeadline\` and \`suggestedAboutSection\` is well-written and almost ready for copy-paste. Tips should be actionable.

The \`modifiedResumeText\` must be a complete, well-formatted resume text optimized for ATS, or an error message if applicable.
The \`linkedinProfileSuggestions\` must provide clear, practical, detailed advice for key LinkedIn sections.
If no resume source (\`resumeDataUri\` or \`resumeText\`) is provided, and \`additionalInformation\` is also insufficient to create a meaningful resume (e.g., just a few words), then for \`modifiedResumeText\` you should output a message like "Insufficient details provided to create a resume. Please provide more comprehensive information in the 'Additional Information' field, including your work experience, education, skills, and projects." and other fields should be minimal or indicate that creation was not possible.
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
            modifiedResumeText: "Insufficient details provided. To improve an existing resume, please upload it or paste its text. To create a new resume, provide comprehensive information in the 'Additional Information' field (experience, education, skills, projects, contact info).",
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

