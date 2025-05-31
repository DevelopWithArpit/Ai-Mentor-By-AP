
'use server';
/**
 * @fileOverview A flow for providing feedback on resume text, with emphasis on ATS optimization and generating an improved version.
 *
 * - getResumeFeedback - A function that analyzes resume text, provides suggestions, and rewrites the resume.
 * - ResumeFeedbackInput - The input type for the getResumeFeedback function.
 * - ResumeFeedbackOutput - The return type for the getResumeFeedback function.
 */

import {ai} from '@/ai/genkit';
import {z}from 'genkit';

const ResumeFeedbackInputSchema = z.object({
  resumeText: z.string().describe('The full text content of the resume to be analyzed and rewritten.'),
  targetJobRole: z.string().optional().describe('The target job role or industry the resume is for. This helps tailor feedback and the rewritten resume, especially for keyword optimization.'),
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
  modifiedResumeText: z.string().describe('The rewritten resume text, incorporating the feedback and optimizations. This version should be ready to use or further refine.'),
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
1.  **Analyze and Provide Feedback**: Analyze the provided resume text. Then, generate a detailed list of feedback items, an overall assessment, and an ATS keywords summary based on the original text.
2.  **Rewrite the Resume**: Based on your analysis and feedback, rewrite the entire resume text to incorporate these improvements. The rewritten resume should be well-structured, ATS-friendly, impactful, and professional.

Resume Text to Analyze and Rewrite:
{{{resumeText}}}

{{#if targetJobRole}}
The resume is being targeted for the job role of "{{targetJobRole}}". Tailor your feedback and the rewritten resume accordingly.
{{/if}}

**Output Requirements:**

**Part 1: Feedback (for \`overallAssessment\`, \`feedbackItems\`, \`atsKeywordsSummary\` fields)**
*   **Overall Assessment**: A brief summary of the original resume's strengths and weaknesses, especially concerning ATS compatibility and general effectiveness.
*   **Feedback Items**: A list of specific, actionable feedback items on the original resume. For each item, specify:
    *   The **area** it applies to (e.g., 'Summary', 'Experience Section - Bullet Points', 'Skills Section', 'ATS Keywords', 'Formatting for ATS', 'Contact Information').
    *   The **suggestion** for improvement.
    *   An optional **importance** level (high, medium, low).
*   **ATS Keywords Summary**: If a target job role is provided, list relevant keywords that are well-utilized in, or should be incorporated into, the *rewritten* resume for better ATS performance. If no job role is provided, give general advice on finding and using keywords.

**Part 2: Rewritten Resume (for \`modifiedResumeText\` field)**
*   Provide the **full, rewritten resume text**.
*   This rewritten version should directly implement the suggestions you've identified.
*   Focus on:
    *   **ATS Friendliness**: Standard formatting (avoid tables, columns, images if they hinder parsing), clear headings, optimal keyword density. Use common resume section titles.
    *   **Clarity and Conciseness**: Easy to read and understand, using professional language.
    *   **Impact and Achievements**: Use strong action verbs (e.g., "Managed," "Developed," "Achieved") and quantify achievements with numbers or specific outcomes wherever possible.
    *   **Relevance**: Tailor to common job requirements{{#if targetJobRole}} and the specific role of "{{targetJobRole}}"{{/if}}.
    *   **Keyword Optimization**: Naturally integrate relevant hard skills, soft skills, industry terms, and job titles from the target job role or general best practices.
    *   **Grammar and Professionalism**: Ensure it's error-free and maintains a consistent professional tone.
    *   **Structure and Flow**: Improve logical organization if needed. Ensure essential contact information (like name, phone, email, LinkedIn if provided) is present and correctly formatted. Avoid overly dense blocks of text; use bullet points effectively in experience sections.

The \`modifiedResumeText\` should be a complete, well-formatted, ready-to-use version of the resume.
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

