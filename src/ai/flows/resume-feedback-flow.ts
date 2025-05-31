
'use server';
/**
 * @fileOverview A flow for providing feedback on resume text.
 *
 * - getResumeFeedback - A function that analyzes resume text and provides suggestions.
 * - ResumeFeedbackInput - The input type for the getResumeFeedback function.
 * - ResumeFeedbackOutput - The return type for the getResumeFeedback function.
 */

import {ai} from '@/ai/genkit';
import {z}from 'genkit';

const ResumeFeedbackInputSchema = z.object({
  resumeText: z.string().describe('The full text content of the resume to be analyzed.'),
  targetJobRole: z.string().optional().describe('The target job role or industry the resume is for. This helps tailor feedback.'),
});
export type ResumeFeedbackInput = z.infer<typeof ResumeFeedbackInputSchema>;

const FeedbackItemSchema = z.object({
    area: z.string().describe("The area of the resume the feedback pertains to (e.g., 'Summary', 'Experience Section', 'Overall Formatting', 'Keywords')."),
    suggestion: z.string().describe("The specific feedback or suggestion for improvement."),
    importance: z.enum(["high", "medium", "low"]).optional().describe("The perceived importance of addressing this feedback."),
});

const ResumeFeedbackOutputSchema = z.object({
  overallAssessment: z.string().describe('A brief overall assessment of the resume.'),
  feedbackItems: z.array(FeedbackItemSchema).describe('A list of specific feedback points and suggestions for the resume.'),
});
export type ResumeFeedbackOutput = z.infer<typeof ResumeFeedbackOutputSchema>;

export async function getResumeFeedback(input: ResumeFeedbackInput): Promise<ResumeFeedbackOutput> {
  return resumeFeedbackFlow(input);
}

const prompt = ai.definePrompt({
  name: 'resumeFeedbackPrompt',
  input: {schema: ResumeFeedbackInputSchema},
  output: {schema: ResumeFeedbackOutputSchema},
  prompt: `You are an expert career coach and resume reviewer.
Analyze the following resume text{{#if targetJobRole}} specifically for the target job role of "{{targetJobRole}}"{{/if}}.

Resume Text:
{{{resumeText}}}

Provide an overall assessment and a list of specific, actionable feedback items. For each feedback item, specify the area of the resume it applies to, the suggestion, and an optional importance level (high, medium, low).

Focus on:
- Clarity and conciseness.
- Impact and achievements (quantifiable results are good).
- Relevance to common job requirements{{#if targetJobRole}} and the role of "{{targetJobRole}}"{{/if}}.
- Keyword optimization (soft skills, hard skills, industry terms).
- Formatting and readability (though you are only seeing text, comment on what can be inferred).
- Action verbs.
- Grammar and professionalism.
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
