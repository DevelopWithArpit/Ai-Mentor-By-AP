
// src/ai/flows/smart-search.ts
'use server';
/**
 * @fileOverview A flow for smart searching within a document or answering general questions,
 * potentially using tools like a weather tool. It attempts to detect the question's language
 * and answer in the same language.
 *
 * - smartSearch - A function that handles the smart search process or general Q&A.
 * - SmartSearchInput - The input type for the smartSearch function.
 * - SmartSearchOutput - The return type for the smartSearch function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {getWeatherTool} from '@/ai/tools/get-weather-tool'; // Import the new tool

const SmartSearchInputSchema = z.object({
  documentDataUri: z
    .string()
    .optional()
    .describe(
      "A document (e.g. syllabus, question bank, resume) as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'. This is optional."
    ),
  question: z.string().describe('The question to search for within the document or to be answered generally.'),
});
export type SmartSearchInput = z.infer<typeof SmartSearchInputSchema>;

const SmartSearchOutputSchema = z.object({
  answer: z.string().describe('The answer to the question, either found in the document, generated from general knowledge, or obtained via a tool. The answer should be in the same language as the input question.'),
  pageNumber: z.number().nullable().optional().describe('The page number where the answer was found in the document. Omit if the answer is from general knowledge, from a tool, or not found in the document.'),
});
export type SmartSearchOutput = z.infer<typeof SmartSearchOutputSchema>;

export async function smartSearch(input: SmartSearchInput): Promise<SmartSearchOutput> {
  return smartSearchFlow(input);
}

const prompt = ai.definePrompt({
  name: 'smartSearchPrompt',
  tools: [getWeatherTool],
  system: `You are an AI academic assistant named ScholarAI.
Detect the language of the student's question. You MUST respond in the same language as the student's question. For example, if the question is in Spanish, your answer must also be in Spanish.
If the user's question is specifically about the current weather conditions in a particular city (e.g., "what's the weather in London?", "how is the weather in Tokyo now?"), you MUST use the 'getWeatherTool' to find this information. Present the weather information clearly. For all other questions, behave as instructed in the main prompt. When using a tool, the pageNumber field in your JSON output MUST be omitted.`,
  input: {schema: SmartSearchInputSchema},
  output: {schema: SmartSearchOutputSchema},
  prompt: `{{#if documentDataUri}}
You have been provided with a document.
Analyze the document content.

Document: {{media url=documentDataUri}}
Question: {{{question}}}

If the provided document seems to be a resume or curriculum vitae, briefly acknowledge this. You can state something like: "This document appears to be a resume. For detailed resume feedback, improvement, or LinkedIn profile assistance, please consider using the 'AI Resume & LinkedIn Profile Assistant' tool available in the sidebar. For now, I will try to answer your question based on this document."
After this acknowledgement (if applicable), proceed to answer the question.

Your primary task is to find the most direct and accurate answer to the student's question *within this document*.
If the document appears to be a question bank and the student's question matches or is very similar to a question in the bank, provide the answer given in the bank.
Identify the page number where the answer is located if possible.

Carefully read the document to locate and provide the specific answer to the question.
If you find a direct answer in the document, provide that answer and the page number (as a number).
If you cannot find a direct answer in the document, then attempt to answer the question based on your general knowledge. In this case, the pageNumber field in your JSON output MUST be omitted.
Remember to answer in the same language as the input '{{{question}}}'.
{{else}}
A student has asked the following question: "{{{question}}}"
Your goal is to provide a helpful and accurate answer based on your general knowledge, in the same language as the input question.
If your system prompt provided instructions to use a specific tool for this type of question (like a weather query), please follow those tool-use instructions. In this case, **the pageNumber field in your JSON output MUST be omitted.**
Otherwise, formulate a comprehensive answer using your broad knowledge base. If you answer from general knowledge, **the pageNumber field in your JSON output MUST be omitted.**
If you cannot answer the question, clearly state that you don't have the information, in the same language as the input question. **The pageNumber field in your JSON output MUST also be omitted in this case.**
Remember to answer in the same language as the input '{{{question}}}'.
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
    if (output && (output.pageNumber === null || typeof output.pageNumber !== 'number')) {
      delete output.pageNumber;
    }
    return output!;
  }
);

