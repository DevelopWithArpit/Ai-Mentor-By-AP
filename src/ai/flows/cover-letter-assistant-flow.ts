
'use server';
/**
 * @fileOverview A flow for generating a draft cover letter.
 *
 * - generateCoverLetter - A function that generates a cover letter based on job description and user info.
 * - GenerateCoverLetterInput - The input type for the generateCoverLetter function.
 * - GenerateCoverLetterOutput - The return type for the generateCoverLetter function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateCoverLetterInputSchema = z.object({
  jobDescription: z.string().describe('The full text of the job description the user is applying for.'),
  userInformation: z.string().describe('User provided information: can be key achievements, relevant skills, resume text, or bullet points about their experience. This will be used to tailor the cover letter.'),
  tone: z.enum(["professional", "enthusiastic", "formal", "slightly-informal"]).optional().default("professional").describe("The desired tone for the cover letter."),
  companyName: z.string().optional().describe("The name of the company the user is applying to. If not extracted from job description."),
  jobTitle: z.string().optional().describe("The job title the user is applying for. If not extracted from job description."),
});
export type GenerateCoverLetterInput = z.infer<typeof GenerateCoverLetterInputSchema>;

const GenerateCoverLetterOutputSchema = z.object({
  draftCoverLetter: z.string().describe('The generated draft cover letter text. It should include placeholders like [Your Name], [Your Address], [Date], [Hiring Manager Name/Title] if not inferable.'),
  keyPointsCovered: z.array(z.string()).optional().describe('A list of key points from the user information or job description that were specifically addressed in the letter.'),
});
export type GenerateCoverLetterOutput = z.infer<typeof GenerateCoverLetterOutputSchema>;

export async function generateCoverLetter(input: GenerateCoverLetterInput): Promise<GenerateCoverLetterOutput> {
  return generateCoverLetterFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateCoverLetterPrompt',
  input: {schema: GenerateCoverLetterInputSchema},
  output: {schema: GenerateCoverLetterOutputSchema},
  prompt: `You are an expert career coach and professional writer specializing in crafting compelling cover letters.
A user wants to apply for a job. Generate a draft cover letter.

Job Description:
{{{jobDescription}}}

User's Information (Resume/Key Points/Achievements):
{{{userInformation}}}

Desired Tone: {{{tone}}}
{{#if companyName}}Company Name: {{{companyName}}}{{/if}}
{{#if jobTitle}}Job Title: {{{jobTitle}}}{{/if}}

Instructions:
1.  Analyze the job description to understand the key requirements, company culture (if discernible), and the role.
2.  Use the user's information to highlight their most relevant skills, experiences, and achievements that match the job description.
3.  Craft a cover letter in the specified tone.
4.  The letter should have a clear structure:
    *   Introduction: State the position being applied for and where it was seen (if known, otherwise a generic phrase). Express enthusiasm.
    *   Body Paragraphs (2-3): Connect the user's qualifications to the job requirements. Provide specific examples if possible from the user's info. Show, don't just tell.
    *   Closing Paragraph: Reiterate interest and call to action (e.g., express eagerness for an interview).
5.  Include placeholders like [Your Name], [Your Address], [Your Phone], [Your Email], [Date], and [Hiring Manager Name, Title, Company Address] at the top, as these are personal details.
6.  The output should be only the cover letter text.
7.  Optionally, list a few key points that were explicitly addressed or highlighted in the generated letter.

Begin the letter with placeholders for sender and recipient details, and the date.
Example for placeholders:
[Your Name]
[Your Address]
[Your City, Postal Code]
[Your Email]
[Your Phone Number]

[Date]

[Hiring Manager Name, if known, otherwise "Hiring Team"]
[Hiring Manager Title, if known]
[Company Name]
[Company Address]

Dear [Mr./Ms./Mx. Last Name or Hiring Team],

Focus on making the letter persuasive and tailored.
`,
});

const generateCoverLetterFlow = ai.defineFlow(
  {
    name: 'generateCoverLetterFlow',
    inputSchema: GenerateCoverLetterInputSchema,
    outputSchema: GenerateCoverLetterOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
