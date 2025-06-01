
// src/ai/flows/smart-search.ts
'use server';
/**
 * @fileOverview A flow for smart searching within a document or answering general questions,
 * potentially using tools like a weather tool.
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
      "A document (e.g. syllabus) as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'. This is optional."
    ),
  question: z.string().describe('The question to search for within the document or to be answered generally.'),
});
export type SmartSearchInput = z.infer<typeof SmartSearchInputSchema>;

const SmartSearchOutputSchema = z.object({
  answer: z.string().describe('The answer to the question, either found in the document, generated from general knowledge, or obtained via a tool.'),
  pageNumber: z.number().optional().describe('The page number where the answer was found in the document. Omit if the answer is from general knowledge, from a tool, or not found in the document.'),
});
export type SmartSearchOutput = z.infer<typeof SmartSearchOutputSchema>;

export async function smartSearch(input: SmartSearchInput): Promise<SmartSearchOutput> {
  return smartSearchFlow(input);
}

const prompt = ai.definePrompt({
  name: 'smartSearchPrompt',
  tools: [getWeatherTool], // Register the weather tool with the prompt
  system: `You are an AI academic assistant named ScholarAI.
If the user's question is specifically about the current weather conditions in a particular city (e.g., "what's the weather in London?", "how is the weather in Tokyo now?"), you MUST use the 'getWeatherTool' to find this information. Present the weather information clearly.
For all other questions, behave as instructed in the main prompt.`, // System instruction for tool usage
  input: {schema: SmartSearchInputSchema},
  output: {schema: SmartSearchOutputSchema},
  prompt: `{{#if documentDataUri}}
You have been provided with a document. Your task is to find the answer to the student's question within this document and identify the page number where the answer is located.
Document: {{media url=documentDataUri}}
Question: {{{question}}}
Carefully read the document to answer the question.
If you find the answer in the document, provide the answer and the page number.
If you cannot find the answer in the document, state that the answer could not be found in the document and do not provide a page number.
{{else}}
A student has asked the following question: "{{{question}}}"
Please provide a helpful and accurate answer. If your system prompt gave you instructions to use a tool for this type of question, follow those instructions. Otherwise, answer based on your general knowledge.
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
