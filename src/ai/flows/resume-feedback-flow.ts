
'use server';
/**
 * @fileOverview A flow for providing feedback on resume text, generating an improved version, offering LinkedIn profile suggestions,
 *               OR creating a new resume if only details are provided.
 *
 * - getResumeFeedback - A function that analyzes resume text or details, provides suggestions/creates a resume, rewrites/formats it, and suggests LinkedIn improvements.
 * - ResumeFeedbackInput - The input type for the getResumeFeedback function.
 * - ResumeFeedbackOutput - The return type for the getResumeFeedback function.
 */

import {ai}from '@/ai/genkit';
import {z}from 'genkit';

const ResumeFeedbackInputSchema = z.object({
  resumeText: z.string().optional().describe('The full text content of the resume to be analyzed and rewritten. If this is empty, the AI will attempt to CREATE a new resume based on the additionalInformation field.'),
  targetJobRole: z.string().optional().describe('The target job role or industry the resume is for. This helps tailor feedback, the rewritten/created resume, and LinkedIn suggestions, especially for keyword optimization.'),
  additionalInformation: z.string().optional().describe('Optional: For an existing resume, specific projects, achievements, or skills the user wants to ensure is included or highlighted. For CREATING a new resume, this field should contain all user details like work experience, education, skills, projects, contact info, etc., in natural language or bullet points.'),
});
export type ResumeFeedbackInput = z.infer<typeof ResumeFeedbackInputSchema>;

const FeedbackItemSchema = z.object({
    area: z.string().describe("The area of the resume the feedback pertains to (e.g., 'Summary', 'Experience Section', 'Skills', 'ATS Keywords', 'Formatting for ATS'). If creating a new resume, this might be a general note."),
    suggestion: z.string().describe("The specific feedback or suggestion for improvement on the original resume, or a comment if a new resume was created."),
    importance: z.enum(["high", "medium", "low"]).optional().describe("The perceived importance of addressing this feedback."),
});

const LinkedInProfileSuggestionsSchema = z.object({
  suggestedHeadline: z.string().optional().describe("A suggested, impactful LinkedIn headline (around 120-220 characters) based on the rewritten/created resume and target job role. It should be concise and keyword-rich."),
  suggestedAboutSection: z.string().optional().describe("A draft for the LinkedIn 'About' section (summary), written in a professional yet engaging tone (ideally 2-4 paragraphs), based on the rewritten/created resume. It should highlight key skills, experiences, and career aspirations. This should be suitable for immediate use."),
  experienceSectionTips: z.string().optional().describe("Actionable tips on how to adapt the resume's experience bullet points for LinkedIn (e.g., writing in first-person, focusing on impact, using keywords, and potentially adding links to projects or media). Provide 2-3 concise bullet points or a short paragraph."),
  skillsSectionTips: z.string().optional().describe("Recommendations for the LinkedIn skills section, including which key skills from the resume to highlight, the importance of getting endorsements, and how to order them. Provide 2-3 concise bullet points or a short paragraph.")
}).optional();

const ResumeFeedbackOutputSchema = z.object({
  overallAssessment: z.string().describe('A brief overall assessment of the original resume or a statement indicating a new resume was created from provided details.'),
  feedbackItems: z.array(FeedbackItemSchema).describe('A list of specific feedback points and suggestions for the original resume, or general comments if a new resume was created.'),
  atsKeywordsSummary: z.string().optional().describe('A summary of relevant keywords identified or suggested for better ATS performance, tailored to the target job role if provided, applicable to the rewritten/created resume.'),
  talkingPoints: z.array(z.string()).optional().describe("A list of 2-4 concise and impactful statements derived from the resume, highlighting key achievements or value propositions. Useful for quick self-introductions or elevator pitches."),
  modifiedResumeText: z.string().describe('The rewritten or newly created resume text, incorporating the feedback and optimizations. This version should be ready to use or further refine, structured with clear headings and formatting for professional PDF output.'),
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

You will perform actions based on the provided input:

**Scenario 1: Existing Resume Provided (\`resumeText\` is present)**
1.  **Analyze and Provide Feedback**: Analyze the provided \`resumeText\`. Generate a detailed list of feedback items, an overall assessment, an ATS keywords summary, and key talking points based on the original text.
2.  **Rewrite the Resume**: Based on your analysis and feedback, rewrite the entire \`resumeText\` to incorporate these improvements. If \`additionalInformation\` is provided, thoughtfully integrate it into the rewritten resume.
3.  **Provide Detailed LinkedIn Profile Suggestions**: Based on the rewritten resume, offer specific, actionable, and copy-paste-friendly advice for improving the user's LinkedIn profile for key sections.

Resume Text to Analyze and Rewrite:
{{{resumeText}}}

**Scenario 2: No Existing Resume Provided (\`resumeText\` is empty or missing)**
1.  **Create a New Resume**: The user wants to create a new resume. Use the details provided in the \`additionalInformation\` field (this will contain their raw details like work experience, education, skills, projects, contact information, full name, etc.) and the \`targetJobRole\` (if provided) to construct a complete, professional resume from scratch.
    *   The output resume must be placed in the \`modifiedResumeText\` field.
    *   Structure the resume with standard sections: Name, Contact Information, Summary/Objective (tailored to \`targetJobRole\` if possible), Professional Experience, Education, Skills, Projects (if applicable).
    *   For the \`overallAssessment\` field, provide a statement like "New resume draft created based on the details you provided."
    *   For \`feedbackItems\`, provide a single general item like: { area: "General", suggestion: "Review the generated resume for accuracy and customize it further to perfectly match your profile and the jobs you're applying for.", importance: "high" }.
2.  **Generate Supporting Content**: Based on the *newly created resume*:
    *   Generate an \`atsKeywordsSummary\`.
    *   Generate \`talkingPoints\`.
    *   Generate comprehensive \`linkedinProfileSuggestions\`.

{{#if targetJobRole}}
Target Job Role/Industry: "{{targetJobRole}}".
Tailor your feedback, the rewritten/created resume, and LinkedIn suggestions accordingly. Focus on incorporating relevant keywords and highlighting skills and experiences pertinent to this role/industry.
{{/if}}

{{#if additionalInformation}}
User's Details / Additional Information to Incorporate/Use for Creation:
"{{{additionalInformation}}}"
*   If \`resumeText\` was provided, thoughtfully integrate this additional information into the rewritten resume. This might involve creating a new "Projects" section, adding bullet points, or highlighting skills. Ensure seamless integration, strong action verbs, and quantified achievements.
*   If \`resumeText\` was NOT provided, this field is the *primary source* for creating the new resume. Parse all details (name, contact, experience, education, skills, projects) from here. If specific details are missing (e.g., dates for a job), make a note or use a placeholder if absolutely necessary, but try to build a complete resume.
{{/if}}

**Output Requirements (Applicable to Both Scenarios):**

**Part 1: Feedback/Creation Context (for \`overallAssessment\`, \`feedbackItems\`, \`atsKeywordsSummary\`, \`talkingPoints\` fields)**
*   **Overall Assessment**:
    *   If improving: Brief summary of the original resume's strengths/weaknesses, ATS compatibility. {{#if targetJobRole}}Comment on suitability for "{{targetJobRole}}".{{/if}}
    *   If creating: Statement like "New resume draft created based on the details you provided."
*   **Feedback Items**:
    *   If improving: List of specific, actionable feedback items on the original resume (area, suggestion, importance).
    *   If creating: A single general feedback item as described in Scenario 2.
*   **ATS Keywords Summary**: List relevant keywords (tailored to \`targetJobRole\` if provided) for the *final* resume (rewritten or created).
*   **Talking Points**: 2-4 concise, impactful statements derived from the *final* resume.

**Part 2: Final Resume (for \`modifiedResumeText\` field)**
*   Provide the **full, final resume text (either rewritten or newly created)**. This text MUST be structured for easy parsing and professional PDF generation. Use the following conventions:
    *   **Name**: Start with the candidate's full name on its own line, ideally prefixed with "### ". Example: "### JOHN DOE". If creating, extract name from \`additionalInformation\`.
    *   **Contact Information**: Immediately follow the name. Each piece of contact info (Phone, Email, LinkedIn URL, Location) on its own line. Example: "Phone: (555) 123-4567\\nEmail: john.doe@email.com\\nLinkedIn: linkedin.com/in/johndoe\\nLocation: City, ST". If creating, extract from \`additionalInformation\`.
    *   **Section Headings**: Use markdown H2 style headings (e.g., "## Summary", "## Professional Experience", "## Education", "## Skills", "## Projects"). Each section heading MUST be on its own line.
    *   **Experience Entries**:
        *   Job Title: On its own line, ideally bolded with markdown (e.g., "**Senior Software Engineer**").
        *   Company Name & Location: On the next line (e.g., "Tech Solutions Inc. - Anytown, USA").
        *   Dates: On the next line (e.g., "05/2020 - Present" or "May 2020 - Present").
        *   Bullet Points: Each achievement/responsibility as a bullet point starting with "• " (a bullet symbol followed by a space) on its own line. Indent bullet points slightly.
    *   **Education Entries**: Similar structure for Degree, University, Dates.
    *   **Skills Section**: Can be a comma-separated list under "## Skills", or categorized.
    *   **Projects Section**: If projects are included, use "## Projects". Title, dates/tech, and bullet points.
*   Focus on: ATS Friendliness, Clarity, Impact, Relevance{{#if targetJobRole}} to "{{targetJobRole}}"{{/if}}, Grammar, Structure.

**Part 3: Detailed LinkedIn Profile Suggestions (for \`linkedinProfileSuggestions\` field and its sub-fields)**
*   Based on the \`modifiedResumeText\` (rewritten or created) and \`targetJobRole\`:
    *   **\`suggestedHeadline\`**: Impactful, keyword-rich LinkedIn headline (120-220 characters).
    *   **\`suggestedAboutSection\`**: Comprehensive, compelling "About" section (2-4 paragraphs), suitable for immediate use.
    *   **\`experienceSectionTips\`**: 2-3 concise bullet points/short paragraph of actionable tips for adapting resume experience to LinkedIn.
    *   **\`skillsSectionTips\`**: 2-3 concise bullet points/short paragraph of recommendations for LinkedIn skills section.
*   Ensure content for \`suggestedHeadline\` and \`suggestedAboutSection\` is well-written and almost ready for copy-paste. Tips should be actionable.

The \`modifiedResumeText\` must be a complete, well-formatted resume.
The \`linkedinProfileSuggestions\` must provide clear, practical, detailed advice.
If \`resumeText\` is empty, and \`additionalInformation\` is also insufficient to create a meaningful resume (e.g., just a few words), then for \`modifiedResumeText\` you should output a message like "Insufficient details provided to create a resume. Please provide more comprehensive information in the 'Additional Information' field, including your work experience, education, skills, and projects." and other fields should be minimal or indicate that creation was not possible.
`,
});

const resumeFeedbackFlow = ai.defineFlow(
  {
    name: 'resumeFeedbackFlow',
    inputSchema: ResumeFeedbackInputSchema,
    outputSchema: ResumeFeedbackOutputSchema,
  },
  async input => {
    // Basic check: if creating, additionalInformation must be somewhat substantial
    if (!input.resumeText && (!input.additionalInformation || input.additionalInformation.length < 50)) {
        return {
            overallAssessment: "Insufficient details provided to create a resume.",
            feedbackItems: [{
                area: "General",
                suggestion: "Please provide comprehensive details in the 'Additional Information' field (experience, education, skills, projects, contact info) for the AI to create your resume.",
                importance: "high"
            }],
            modifiedResumeText: "Insufficient details provided to create a resume. Please provide more comprehensive information in the 'Additional Information' field, including your work experience, education, skills, and projects.",
            atsKeywordsSummary: "Not applicable.",
            talkingPoints: [],
            linkedinProfileSuggestions: {
                suggestedHeadline: "Update once resume is created.",
                suggestedAboutSection: "Provide resume details to generate this section.",
                experienceSectionTips: "Detail your experiences once your resume is drafted.",
                skillsSectionTips: "List relevant skills after your resume is complete."
            }
        };
    }

    const {output} = await prompt(input);
    return output!;
  }
);

