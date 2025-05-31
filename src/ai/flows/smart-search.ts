
// src/ai/flows/smart-search.ts
'use server';
/**
 * @fileOverview A flow for smart searching within a document or answering general questions.
 *
 * - smartSearch - A function that handles the smart search process or general Q&A.
 * - SmartSearchInput - The input type for the smartSearch function.
 * - SmartSearchOutput - The return type for the smartSearch function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SmartSearchInputSchema = z.object({
  documentDataUri: z
    .string()
    .optional()
    .describe(
      "A document (e.g. syllabus) as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'. This is optional."
    ),
  question: z.string().describe('The question to search for within the document or to be answered generally.'),
});
export type SmartSearchInput = z.infer<typeof SmartSearchInputSchema>;

const SmartSearchOutputSchema = z.object({
  answer: z.string().describe('The answer to the question, either found in the document or generated from general knowledge.'),
  pageNumber: z.number().optional().describe('The page number where the answer was found in the document. Omit if the answer is from general knowledge or not found in the document.'),
});
export type SmartSearchOutput = z.infer<typeof SmartSearchOutputSchema>;

export async function smartSearch(input: SmartSearchInput): Promise<SmartSearchOutput> {
  return smartSearchFlow(input);
}

const prompt = ai.definePrompt({
  name: 'smartSearchPrompt',
  input: {schema: SmartSearchInputSchema},
  output: {schema: SmartSearchOutputSchema},
  prompt: `You are an AI academic assistant named ScholarAI.

{{#if documentDataUri}}
You have been provided with a document. Your task is to find the answer to the student's question within this document and identify the page number where the answer is located.

Document:
{{media url=documentDataUri}}

Question: {{{question}}}

Carefully read the document to answer the question.
If you find the answer in the document, provide the answer and the page number.
If you cannot find the answer in the document, state that the answer could not be found in the document and do not provide a page number.
{{else}}
A student has asked the following question. Please provide a helpful and accurate answer based on your general knowledge.

Question: {{{question}}}

Provide your answer to the question.
{{/if}}
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

