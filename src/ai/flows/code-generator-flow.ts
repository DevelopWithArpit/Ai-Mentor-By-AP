
'use server';
/**
 * @fileOverview A flow for generating code snippets, including solutions for Data Structures and Algorithms (DSA) problems.
 *
 * - generateCode - A function that generates code based on a description and optional language.
 * - GenerateCodeInput - The input type for the generateCode function.
 * - GenerateCodeOutput - The return type for the generateCode function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateCodeInputSchema = z.object({
  description: z.string().describe('A description of the code to be generated, or a DSA problem statement.'),
  language: z.string().optional().describe('The programming language for the code (e.g., javascript, python). If not specified, the AI will choose.'),
});
export type GenerateCodeInput = z.infer<typeof GenerateCodeInputSchema>;

const GenerateCodeOutputSchema = z.object({
  generatedCode: z.string().describe('The generated code snippet or DSA solution.'),
});
export type GenerateCodeOutput = z.infer<typeof GenerateCodeOutputSchema>;

export async function generateCode(input: GenerateCodeInput): Promise<GenerateCodeOutput> {
  return generateCodeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateCodePrompt',
  input: {schema: GenerateCodeInputSchema},
  output: {schema: GenerateCodeOutputSchema},
  prompt: `You are an expert coding assistant. You can generate code snippets, functions, or help solve problems related to Data Structures and Algorithms (DSA) if described.
Generate code in {{#if language}}{{language}}{{else}}the most appropriate language based on the description{{/if}} for the following request:
"{{{description}}}"

If the request is for a DSA problem, provide the code solution.
Only output the raw code block. Do not include any explanatory text or markdown formatting like \`\`\` around the code.
`,
});

const generateCodeFlow = ai.defineFlow(
  {
    name: 'generateCodeFlow',
    inputSchema: GenerateCodeInputSchema,
    outputSchema: GenerateCodeOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
