
'use server';
/**
 * @fileOverview A flow for summarizing uploaded documents.
 *
 * - summarizeDocument - A function that summarizes a document.
 * - SummarizeDocumentInput - The input type for the summarizeDocument function.
 * - SummarizeDocumentOutput - The return type for the summarizeDocument function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeDocumentInputSchema = z.object({
  documentDataUri: z
    .string()
    .describe(
      "The document to be summarized, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  summaryLength: z.enum(["short", "medium", "long"]).optional().default("medium").describe("Desired length of the summary."),
  summaryStyle: z.enum(["general", "bullet_points", "for_layperson", "for_expert"])
    .optional()
    .default("general")
    .describe("Desired style or format of the summary. 'bullet_points' for a list of key takeaways."),
  customPrompt: z.string().optional().describe("Optional custom instructions for the summarizer, e.g., 'Focus on the methodology and results'.")
});
export type SummarizeDocumentInput = z.infer<typeof SummarizeDocumentInputSchema>;

const SummarizeDocumentOutputSchema = z.object({
  summary: z.string().describe('The generated summary of the document.'),
  keyTakeaways: z.array(z.string()).optional().describe("Key takeaways or main points, especially if 'bullet_points' style was requested."),
});
export type SummarizeDocumentOutput = z.infer<typeof SummarizeDocumentOutputSchema>;

export async function summarizeDocument(input: SummarizeDocumentInput): Promise<SummarizeDocumentOutput> {
  return summarizeDocumentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeDocumentPrompt',
  input: {schema: SummarizeDocumentInputSchema},
  output: {schema: SummarizeDocumentOutputSchema},
  prompt: `You are an expert AI summarization assistant.
You have been provided with a document. Your task is to generate a summary based on the user's preferences.

Document:
{{media url=documentDataUri}}

Summary Preferences:
- Length: {{{summaryLength}}}
- Style: {{{summaryStyle}}}
{{#if customPrompt}}- Custom Instructions: {{{customPrompt}}}{{/if}}

Instructions:
1.  Carefully read and understand the provided document.
2.  Generate a summary according to the specified length and style.
    *   'short': A brief overview, a few sentences.
    *   'medium': A concise paragraph or two.
    *   'long': A more detailed summary, multiple paragraphs.
    *   'bullet_points': Extract the main points and present them as a list. The main 'summary' field can be a brief intro to these points. Populate 'keyTakeaways' with the bullet points.
    *   'for_layperson': Explain complex topics in simple terms.
    *   'for_expert': Maintain technical language and depth.
3.  If custom instructions are provided, adhere to them.
4.  If 'bullet_points' style is requested, ensure the 'keyTakeaways' field in the output is populated with an array of strings. The main 'summary' field can provide a brief introductory sentence if appropriate.
5.  Otherwise, the primary output should be in the 'summary' field.

Generate the summary now.
`,
});

const summarizeDocumentFlow = ai.defineFlow(
  {
    name: 'summarizeDocumentFlow',
    inputSchema: SummarizeDocumentInputSchema,
    outputSchema: SummarizeDocumentOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
