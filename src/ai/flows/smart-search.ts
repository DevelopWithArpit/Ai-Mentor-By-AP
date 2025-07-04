
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
  documentDataUris: z
    .array(z.string())
    .optional()
    .describe(
      "An array of documents (e.g. syllabus, question bank, resume) as data URIs. Each must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'. This is optional."
    ),
  question: z.string().describe('The question to search for within the document or to be answered generally.'),
});
export type SmartSearchInput = z.infer<typeof SmartSearchInputSchema>;

const SmartSearchOutputSchema = z.object({
  answer: z.string().describe('The answer to the question, either found in the document, generated from general knowledge, or obtained via a tool. The answer should be in the same language as the input question.'),
  source: z.string().optional().describe('The source where the answer was found, e.g., "Document 1, Page 5". Omit if not found in a document.'),
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
If the user's question is specifically about the current weather conditions in a particular city (e.g., "what's the weather in London?", "how is the weather in Tokyo now?"), you MUST use the 'getWeatherTool' to find this information. Present the weather information clearly. For all other questions, behave as instructed in the main prompt. When using a tool, the source field in your JSON output MUST be omitted.`,
  input: {schema: SmartSearchInputSchema},
  output: {schema: SmartSearchOutputSchema},
  prompt: `{{#if documentDataUris}}
You have been provided with multiple documents.
Analyze the content of all provided documents to answer the question.

{{#each documentDataUris}}
Document {{@index}}:
{{media url=this}}

---
{{/each}}
Question: {{{question}}}

If any provided document seems to be a resume or curriculum vitae, briefly acknowledge this. You can state something like: "One of the documents appears to be a resume. For detailed resume feedback, improvement, or LinkedIn profile assistance, please consider using the 'AI Resume & LinkedIn Profile Assistant' tool available in the sidebar. For now, I will try to answer your question based on all provided documents."
After this acknowledgement (if applicable), proceed to answer the question.

**Special Instruction for Document Analysis:**
If the user's question is a general request to analyze the documents (e.g., "analyze these documents", "find common questions", "what can you tell me based on these files?"), AND the documents appear to contain a syllabus, a question bank, and/or previous year questions, you should perform a detailed analysis. Your primary goal is to find common questions across the question-providing documents and answer them using the syllabus.

To do this:
1.  Identify the documents: Determine which document is the syllabus and which ones contain lists of questions (like question banks or past papers).
2.  Extract Questions: Go through the question documents and list all the questions you find.
3.  Find Common Questions: Identify questions that appear in multiple source documents (e.g., in both the question bank and the previous year's paper).
4.  Answer from Syllabus: For each of these common questions, search the syllabus document for the answer.
5.  Format the Output: In the 'answer' field of your response, provide a clear, structured summary. List each common question you found, followed by the answer you located in the syllabus. If no answer is found for a question, state that clearly. Use markdown for formatting (e.g., headings for questions, bullet points for answers).

If the user asks a specific question, not a general analysis request, then follow the instructions below.

---

Your primary task is to find the most direct and accurate answer to the student's question *within these documents*.
If a document appears to be a question bank and the student's question matches or is very similar to a question in the bank, provide the answer given in the bank.
Identify the source where the answer is located if possible (e.g., "Document 0, Page 5" or "Document 1, section 'Introduction'").

Carefully read the documents to locate and provide the specific answer to the question.
If you find a direct answer in the documents, provide that answer and its 'source'.
If you cannot find a direct answer in the documents, then attempt to answer the question based on your general knowledge. In this case, the 'source' field in your JSON output MUST be omitted.
Remember to answer in the same language as the input '{{{question}}}'.
{{else}}
A student has asked the following question: "{{{question}}}"
Your goal is to provide a helpful and accurate answer based on your general knowledge, in the same language as the input question.
If your system prompt provided instructions to use a specific tool for this type of question (like a weather query), please follow those tool-use instructions. In this case, **the source field in your JSON output MUST be omitted.**
Otherwise, formulate a comprehensive answer using your broad knowledge base. If you answer from general knowledge, **the source field in your JSON output MUST be omitted.**
If you cannot answer the question, clearly state that you don't have the information, in the same language as the input question. **The source field in your JSON output MUST also be omitted in this case.**
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
    if (output && !output.source) {
      delete output.source;
    }
    return output!;
  }
);
