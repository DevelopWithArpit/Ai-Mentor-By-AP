
'use server';
/**
 * @fileOverview A flow for providing feedback on resume text, with emphasis on ATS optimization.
 *
 * - getResumeFeedback - A function that analyzes resume text and provides suggestions.
 * - ResumeFeedbackInput - The input type for the getResumeFeedback function.
 * - ResumeFeedbackOutput - The return type for the getResumeFeedback function.
 */

import {ai} from '@/ai/genkit';
import {z}from 'genkit';

const ResumeFeedbackInputSchema = z.object({
  resumeText: z.string().describe('The full text content of the resume to be analyzed.'),
  targetJobRole: z.string().optional().describe('The target job role or industry the resume is for. This helps tailor feedback, especially for keyword optimization.'),
});
export type ResumeFeedbackInput = z.infer<typeof ResumeFeedbackInputSchema>;

const FeedbackItemSchema = z.object({
    area: z.string().describe("The area of the resume the feedback pertains to (e.g., 'Summary', 'Experience Section', 'Skills', 'ATS Keywords', 'Formatting for ATS')."),
    suggestion: z.string().describe("The specific feedback or suggestion for improvement."),
    importance: z.enum(["high", "medium", "low"]).optional().describe("The perceived importance of addressing this feedback."),
});

const ResumeFeedbackOutputSchema = z.object({
  overallAssessment: z.string().describe('A brief overall assessment of the resume, including its potential ATS compatibility.'),
  feedbackItems: z.array(FeedbackItemSchema).describe('A list of specific feedback points and suggestions for the resume.'),
  atsKeywordsSummary: z.string().optional().describe('A summary of relevant keywords identified or suggested for better ATS performance, tailored to the target job role if provided.'),
});
export type ResumeFeedbackOutput = z.infer<typeof ResumeFeedbackOutputSchema>;

export async function getResumeFeedback(input: ResumeFeedbackInput): Promise<ResumeFeedbackOutput> {
  return resumeFeedbackFlow(input);
}

const prompt = ai.definePrompt({
  name: 'resumeFeedbackPrompt',
  input: {schema: ResumeFeedbackInputSchema},
  output: {schema: ResumeFeedbackOutputSchema},
  prompt: `You are an expert career coach and resume reviewer, specializing in optimizing resumes for Applicant Tracking Systems (ATS).
Analyze the following resume text{{#if targetJobRole}} specifically for the target job role of "{{targetJobRole}}"{{/if}}.

Resume Text:
{{{resumeText}}}

Provide:
1.  An **overall assessment**: A brief summary of the resume's strengths and weaknesses, especially concerning ATS compatibility and general effectiveness.
2.  **Feedback Items**: A list of specific, actionable feedback items. For each item, specify:
    *   The **area** of the resume it applies to (e.g., 'Summary', 'Experience Section - Bullet Points', 'Skills Section', 'ATS Keywords', 'Formatting for ATS', 'Contact Information').
    *   The **suggestion** for improvement.
    *   An optional **importance** level (high, medium, low).
3.  An **ATS Keywords Summary**: If a target job role is provided, list relevant keywords that should be incorporated or are well-utilized. If no job role is provided, give general advice on finding and using keywords.

Focus on:
-   **ATS Friendliness**: Standard formatting, clear headings, keyword density, avoidance of tables/columns/graphics that confuse ATS.
-   **Clarity and Conciseness**: Easy to read and understand.
-   **Impact and Achievements**: Quantifiable results and action verbs.
-   **Relevance**: Tailoring to common job requirements{{#if targetJobRole}} and the specific role of "{{targetJobRole}}"{{/if}}.
-   **Keyword Optimization**: Presence of relevant hard skills, soft skills, industry terms, and job titles.
-   **Action Verbs**: Strong verbs to start bullet points.
-   **Grammar and Professionalism**: Error-free and professional tone.
-   **Contact Information**: Completeness and professionalism.
-   **Structure and Flow**: Logical organization.
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

