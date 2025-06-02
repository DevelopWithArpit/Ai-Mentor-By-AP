
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
      "A document (e.g. syllabus, question bank) as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'. This is optional."
    ),
  question: z.string().describe('The question to search for within the document or to be answered generally.'),
});
export type SmartSearchInput = z.infer<typeof SmartSearchInputSchema>;

const SmartSearchOutputSchema = z.object({
  answer: z.string().describe('The answer to the question, either found in the document, generated from general knowledge, or obtained via a tool.'),
  pageNumber: z.number().nullable().optional().describe('The page number where the answer was found in the document. Omit if the answer is from general knowledge, from a tool, or not found in the document.'),
});
export type SmartSearchOutput = z.infer<typeof SmartSearchOutputSchema>;

export async function smartSearch(input: SmartSearchInput): Promise<SmartSearchOutput> {
  return smartSearchFlow(input);
}

const prompt = ai.definePrompt({
  name: 'smartSearchPrompt',
  tools: [getWeatherTool], // Register the weather tool with the prompt
  system: `You are an AI academic assistant named ScholarAI.
If the user's question is specifically about the current weather conditions in a particular city (e.g., "what's the weather in London?", "how is the weather in Tokyo now?"), you MUST use the 'getWeatherTool' to find this information. Present the weather information clearly. For all other questions, behave as instructed in the main prompt. When using a tool, the pageNumber field in your JSON output MUST be omitted.`, // System instruction for tool usage
  input: {schema: SmartSearchInputSchema},
  output: {schema: SmartSearchOutputSchema},
  prompt: `{{#if documentDataUri}}
You have been provided with a document (which might be a syllabus, a question bank, or other academic material).
Your primary task is to find the most direct and accurate answer to the student's question *within this document*.
If the document appears to be a question bank and the student's question matches or is very similar to a question in the bank, provide the answer given in the bank.
Identify the page number where the answer is located if possible.

Document: {{media url=documentDataUri}}
Question: {{{question}}}

Carefully read the document to locate and provide the specific answer to the question.
If you find a direct answer in the document, provide that answer and the page number (as a number).
If you cannot find a direct answer in the document, then attempt to answer the question based on your general knowledge. In this case, the pageNumber field in your JSON output MUST be omitted.
{{else}}
A student has asked the following question: "{{{question}}}"
Your goal is to provide a helpful and accurate answer based on your general knowledge.
If your system prompt provided instructions to use a specific tool for this type of question (like a weather query), please follow those tool-use instructions. In this case, **the pageNumber field in your JSON output MUST be omitted.**
Otherwise, formulate a comprehensive answer using your broad knowledge base. If you answer from general knowledge, **the pageNumber field in your JSON output MUST be omitted.**
If you cannot answer the question, clearly state that you don't have the information. **The pageNumber field in your JSON output MUST also be omitted in this case.**
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
    // Ensure pageNumber is truly omitted if it's null or not a number, or not provided by the model
    // The model should respect the prompt, but this is a safeguard.
    if (output && (output.pageNumber === null || typeof output.pageNumber !== 'number')) {
      // If we want to strictly enforce omission instead of allowing null to pass through to the UI logic:
      delete output.pageNumber; 
      // For now, allowing null as per schema change. UI already handles null/undefined correctly for display.
    }
    return output!;
  }
);

