
'use server';
/**
 * @fileOverview A flow for providing feedback on resume text, with emphasis on ATS optimization and generating an improved version.
 *
 * - getResumeFeedback - A function that analyzes resume text, provides suggestions, and rewrites the resume.
 * - ResumeFeedbackInput - The input type for the getResumeFeedback function.
 * - ResumeFeedbackOutput - The return type for the getResumeFeedback function.
 */

import {ai}from '@/ai/genkit';
import {z}from 'genkit';

const ResumeFeedbackInputSchema = z.object({
  resumeText: z.string().describe('The full text content of the resume to be analyzed and rewritten.'),
  targetJobRole: z.string().optional().describe('The target job role or industry the resume is for. This helps tailor feedback and the rewritten resume, especially for keyword optimization.'),
  additionalInformation: z.string().optional().describe('Optional: Specific projects, achievements, skills, or other information the user wants to ensure is included or highlighted in the rewritten resume. The AI should attempt to integrate this information naturally into the resume structure, potentially creating a new "Projects" section if appropriate or weaving details into existing sections.'),
});
export type ResumeFeedbackInput = z.infer<typeof ResumeFeedbackInputSchema>;

const FeedbackItemSchema = z.object({
    area: z.string().describe("The area of the resume the feedback pertains to (e.g., 'Summary', 'Experience Section', 'Skills', 'ATS Keywords', 'Formatting for ATS')."),
    suggestion: z.string().describe("The specific feedback or suggestion for improvement on the original resume."),
    importance: z.enum(["high", "medium", "low"]).optional().describe("The perceived importance of addressing this feedback."),
});

const ResumeFeedbackOutputSchema = z.object({
  overallAssessment: z.string().describe('A brief overall assessment of the original resume, including its potential ATS compatibility.'),
  feedbackItems: z.array(FeedbackItemSchema).describe('A list of specific feedback points and suggestions for the original resume.'),
  atsKeywordsSummary: z.string().optional().describe('A summary of relevant keywords identified or suggested for better ATS performance, tailored to the target job role if provided, applicable to the rewritten resume.'),
  talkingPoints: z.array(z.string()).optional().describe("A list of 2-4 concise and impactful statements derived from the resume, highlighting key achievements or value propositions. Useful for quick self-introductions or elevator pitches."),
  modifiedResumeText: z.string().describe('The rewritten resume text, incorporating the feedback and optimizations. This version should be ready to use or further refine, structured with clear headings and formatting for professional PDF output.'),
});
export type ResumeFeedbackOutput = z.infer<typeof ResumeFeedbackOutputSchema>;

export async function getResumeFeedback(input: ResumeFeedbackInput): Promise<ResumeFeedbackOutput> {
  return resumeFeedbackFlow(input);
}

const prompt = ai.definePrompt({
  name: 'resumeFeedbackPrompt',
  input: {schema: ResumeFeedbackInputSchema},
  output: {schema: ResumeFeedbackOutputSchema},
  prompt: `You are an expert career coach and resume reviewer, specializing in optimizing resumes for Applicant Tracking Systems (ATS) and improving overall resume effectiveness.
You will perform two main tasks:
1.  **Analyze and Provide Feedback**: Analyze the provided resume text. Then, generate a detailed list of feedback items, an overall assessment, an ATS keywords summary, and key talking points based on the original text.
2.  **Rewrite the Resume**: Based on your analysis and feedback, rewrite the entire resume text to incorporate these improvements. If 'additionalInformation' is provided, thoughtfully integrate it into the rewritten resume.

Resume Text to Analyze and Rewrite:
{{{resumeText}}}

{{#if targetJobRole}}
The resume is being targeted for the job role of "{{targetJobRole}}". Tailor your feedback and the rewritten resume accordingly. Focus on incorporating relevant keywords and highlighting skills and experiences pertinent to this role/industry.
{{/if}}

{{#if additionalInformation}}
Additional Information to Incorporate:
"{{{additionalInformation}}}"
When rewriting the resume, please thoughtfully integrate this additional information. This might involve creating a new "Projects" section (if not already present and relevant), adding detailed bullet points under existing experience, or highlighting specific skills mentioned. Ensure the integration is seamless, uses strong action verbs, quantifies achievements where possible, and maintains a professional resume format. Prioritize incorporating this information where it adds the most value.
{{/if}}

**Output Requirements:**

**Part 1: Feedback (for \`overallAssessment\`, \`feedbackItems\`, \`atsKeywordsSummary\`, \`talkingPoints\` fields)**
*   **Overall Assessment**: A brief summary of the original resume's strengths and weaknesses, especially concerning ATS compatibility and general effectiveness. {{#if targetJobRole}}Comment on its suitability for "{{targetJobRole}}".{{/if}}
*   **Feedback Items**: A list of specific, actionable feedback items on the original resume. For each item, specify:
    *   The **area** it applies to (e.g., 'Summary', 'Experience Section - Bullet Points', 'Skills Section', 'ATS Keywords', 'Formatting for ATS', 'Contact Information').
    *   The **suggestion** for improvement.
    *   An optional **importance** level (high, medium, low).
*   **ATS Keywords Summary**: If a target job role is provided, list relevant keywords that are well-utilized in, or should be incorporated into, the *rewritten* resume for better ATS performance, tailored to "{{targetJobRole}}". If no job role is provided, give general advice on finding and using keywords.
*   **Talking Points**: A list of 2-4 concise and impactful statements derived from the resume (including any added information), highlighting key achievements or value propositions. These should be useful for quick self-introductions or elevator pitches.

**Part 2: Rewritten Resume (for \`modifiedResumeText\` field)**
*   Provide the **full, rewritten resume text**. This text MUST be structured for easy parsing and professional PDF generation. Use the following conventions:
    *   **Name**: Start with the candidate's full name on its own line, ideally prefixed with "### ". Example: "### JOHN DOE".
    *   **Contact Information**: Immediately follow the name. Each piece of contact info (Phone, Email, LinkedIn URL, Location) on its own line. Example: "Phone: (555) 123-4567\\nEmail: john.doe@email.com\\nLinkedIn: linkedin.com/in/johndoe\\nLocation: City, ST".
    *   **Section Headings**: Use markdown H2 style headings (e.g., "## Summary", "## Professional Experience", "## Education", "## Skills", "## Projects"). Each section heading MUST be on its own line.
    *   **Experience Entries**:
        *   Job Title: On its own line, ideally bolded with markdown (e.g., "**Senior Software Engineer**").
        *   Company Name & Location: On the next line (e.g., "Tech Solutions Inc. - Anytown, USA").
        *   Dates: On the next line (e.g., "05/2020 - Present" or "May 2020 - Present").
        *   Bullet Points: Each achievement/responsibility as a bullet point starting with "• " (a bullet symbol followed by a space) on its own line. Indent bullet points slightly if possible in the text representation.
    *   **Education Entries**: Similar structure for Degree, University, Dates.
    *   **Skills Section**: Can be a comma-separated list under the "## Skills" heading, or categorized subheadings (e.g., "Programming Languages:", "Tools:").
    *   **Projects Section**: If projects are included (either from original resume or additionalInformation), use a clear heading like "## Projects". Each project should have a title, optionally dates or technologies used, and bullet points describing the project and your role/achievements.
*   This rewritten version should directly implement the suggestions you've identified and incorporate the 'additionalInformation' if provided.
*   Focus on:
    *   **ATS Friendliness**: Standard formatting, clear headings, optimal keyword density.
    *   **Clarity and Conciseness**: Easy to read and understand, using professional language.
    *   **Impact and Achievements**: Use strong action verbs and quantify achievements.
    *   **Relevance**: Tailor to common job requirements{{#if targetJobRole}} and the specific role of "{{targetJobRole}}"{{/if}}.
    *   **Grammar and Professionalism**: Ensure it's error-free.
    *   **Structure and Flow**: Improve logical organization.

The \`modifiedResumeText\` should be a complete, well-formatted, ready-to-use version of the resume adhering to the specified structure.
`,
});

const resumeFeedbackFlow = ai.defineFlow(
  {
    name: 'resumeFeedbackFlow',
    inputSchema: ResumeFeedbackInputSchema,
    outputSchema: ResumeFeedbackOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

