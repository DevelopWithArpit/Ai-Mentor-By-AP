
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

const LinkedInProfileSuggestionsSchema = z.object({
  suggestedHeadline: z.string().optional().describe("A suggested, impactful LinkedIn headline (around 120-220 characters) based on the rewritten/created resume and target job role. It should be concise, keyword-rich, and nearly ready for copy-paste."),
  suggestedAboutSection: z.string().optional().describe("A draft for the LinkedIn 'About' section (summary), written in a professional yet engaging tone (ideally 2-4 paragraphs), based on the rewritten/created resume. It should highlight key skills, experiences, and career aspirations. This should be comprehensive and suitable for immediate use/copy-paste."),
  experienceSectionTips: z.string().optional().describe("Actionable tips (2-3 concise bullet points or a short paragraph) on how to adapt the resume's experience bullet points for LinkedIn (e.g., writing in first-person, focusing on impact, using keywords, quantifying achievements, and potentially adding links to projects or media). If the resume has no experience section, these tips should be general or acknowledge this."),
  skillsSectionTips: z.string().optional().describe("Recommendations (2-3 concise bullet points or a short paragraph) for the LinkedIn skills section, including which key skills from the resume to highlight, the importance of getting endorsements, how to order them, and aligning with the target job role.")
}).optional();

const ResumeFeedbackOutputSchema = z.object({
  overallAssessment: z.string().describe('A brief overall assessment of the original resume (if provided) or a statement indicating a new resume was created from details.'),
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
*   If analyzing an existing resume (from upload or text): Thoughtfully integrate this additionalInformation into the rewritten resume.
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
**Crucially, ensure the final text output is EXTREMELY ATS-FRIENDLY and reflects the exact labeled format below.**

**IMPORTANT INSTRUCTIONS FOR FILLING THE TEMPLATE:**
*   When creating a new resume, meticulously parse 'additionalInformation' to extract the user's details and populate them into the corresponding placeholders. If a detail is not found, use a clear placeholder like "[Enter your...]" or "[Not Provided]".
*   For 'Responsibilities and Achievements', 'Key Achievements', and 'Skills', generate each point as a separate line formatted as a bullet point. Example: \`[List your key responsibilities and achievements in bullet points.]\`
*   **Experience & Projects Sections:** If your analysis of the user's provided information indicates that the user has NO work experience, then you MUST OMIT the entire "3. Experience" section. Similarly, if the user has NO projects, you MUST OMIT the entire "7. Projects" section.

**Resume Template to follow exactly:**

1. Personal Information:

Full Name: [Enter your full name]
Contact Number: [Enter your phone number]
Email Address: [Enter your email address]
LinkedIn Profile: [Enter your LinkedIn URL]
Location: [Enter your city, country]

2. Summary:

[Write a brief summary (2-3 sentences) highlighting your professional background, key skills, and career aspirations. Focus on your specialization and what you aim to achieve in your next role.]

3. Experience:

Position: [Enter your job title]
Company Name: [Enter the name of the company]
Location: [Enter the location of the company]
Start Date - End Date: [Enter the duration of your employment]
Responsibilities and Achievements:
[List your key responsibilities and achievements in bullet points. Use action verbs and quantify results where possible.]

4. Education:

Degree: [Enter your degree, e.g., Bachelor of Technology in Robotics and Artificial Intelligence]
Institution Name: [Enter the name of the institution]
Location: [Enter the location of the institution]
Start Date - End Date: [Enter the duration of your education]

5. Key Achievements:

[List any significant achievements or projects that demonstrate your skills and contributions. Use bullet points for clarity.]

6. Skills:

[List your technical and soft skills relevant to the job you are applying for. Use bullet points or a comma-separated format.]

7. Projects:

Project Title: [Enter the title of the project]
Description: [Provide a brief description of the project, your role, and the technologies used. Highlight the impact or results of the project.]

**Part 3: Detailed LinkedIn Profile Suggestions (for \`linkedinProfileSuggestions\` field and its sub-fields)**
*   Based on the \`modifiedResumeText\` (rewritten or created) and \`targetJobRole\`:
    *   **\`suggestedHeadline\`**: Impactful, keyword-rich LinkedIn headline (120-220 characters), nearly ready for copy-paste.
    *   **\`suggestedAboutSection\`**: Comprehensive, compelling "About" section (2-4 paragraphs), suitable for immediate use/copy-paste.
    *   **\`experienceSectionTips\`**: 2-3 concise bullet points/short paragraph of actionable tips for adapting resume experience to LinkedIn (e.g., using first-person, expanding on impact, incorporating media/links, keyword use). If the resume has no experience section, these tips should be general or acknowledge this (e.g., "Focus on projects and skills in your LinkedIn profile until you gain work experience.").
    *   **\`skillsSectionTips\`**: 2-3 concise bullet points/short paragraph of recommendations for LinkedIn skills section (e.g., which key skills from the resume to list, getting endorsements, ordering skills, aligning with job targets).
*   Ensure content for \`suggestedHeadline\` and \`suggestedAboutSection\` is well-written and almost ready for copy-paste. Tips should be actionable.

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
