// src/ai/flows/smart-search.ts
'use server';
/**
 * @fileOverview A flow for smart searching within a document to locate answers and display relevant page numbers.
 *
 * - smartSearch - A function that handles the smart search process.
 * - SmartSearchInput - The input type for the smartSearch function.
 * - SmartSearchOutput - The return type for the smartSearch function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SmartSearchInputSchema = z.object({
  documentDataUri: z
    .string()
    .describe(
      "A document (e.g. syllabus) as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  question: z.string().describe('The question to search for within the document.'),
});
export type SmartSearchInput = z.infer<typeof SmartSearchInputSchema>;

const SmartSearchOutputSchema = z.object({
  answer: z.string().describe('The answer to the question found in the document.'),
  pageNumber: z.number().optional().describe('The page number where the answer was found.'),
});
export type SmartSearchOutput = z.infer<typeof SmartSearchOutputSchema>;

export async function smartSearch(input: SmartSearchInput): Promise<SmartSearchOutput> {
  return smartSearchFlow(input);
}

const prompt = ai.definePrompt({
  name: 'smartSearchPrompt',
  input: {schema: SmartSearchInputSchema},
  output: {schema: SmartSearchOutputSchema},
  prompt: `You are an AI academic assistant named ScholarAI. Your task is to locate potential answers within a document and display the relevant page number(s) to help students quickly find information.

  Document: {{media url=documentDataUri}}
  Question: {{{question}}}

  Provide the answer and the page number where you found the answer. If you cannot find the answer, respond that you cannot find the answer and do not include a page number.
`,
});

const smartSearchFlow = ai.defineFlow(
  {
    name: 'smartSearchFlow',
    inputSchema: SmartSearchInputSchema,
    outputSchema: SmartSearchOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
