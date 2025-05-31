
'use server';
/**
 * @fileOverview A flow for analyzing generated code for syntax, correctness, and improvements.
 *
 * - analyzeGeneratedCode - A function that analyzes code based on its description, language, and the code itself.
 * - AnalyzeCodeInput - The input type for the analyzeGeneratedCode function.
 * - AnalyzeCodeOutput - The return type for the analyzeGeneratedCode function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeCodeInputSchema = z.object({
  generatedCode: z.string().describe('The code snippet that was generated.'),
  originalDescription: z.string().describe('The original problem description or prompt that led to the code generation.'),
  language: z.string().optional().describe('The programming language of the code (e.g., javascript, python).'),
});
export type AnalyzeCodeInput = z.infer<typeof AnalyzeCodeInputSchema>;

const AnalyzeCodeOutputSchema = z.object({
  syntaxFeedback: z.string().describe("Feedback on the code's syntax, pointing out any obvious errors or common mistakes based on the language. If no issues, state that."),
  correctnessAssessment: z.string().describe("Assessment of whether the code correctly and completely solves the problem stated in the original description. Explain reasoning."),
  meetsRequirements: z.boolean().describe("A boolean indicating if the AI assesses the code as largely meeting the core requirements of the original description."),
  improvementSuggestions: z.string().describe("Suggestions for improving the code's clarity, efficiency, error handling, or adherence to best practices. Provide specific examples if possible."),
  styleAndBestPractices: z.string().optional().describe("Comments on code style, naming conventions, and use of language-specific best practices."),
  potentialBugsOrEdgeCases: z.string().optional().describe("Identification of potential bugs, logical flaws, or unhandled edge cases."),
});
export type AnalyzeCodeOutput = z.infer<typeof AnalyzeCodeOutputSchema>;

export async function analyzeGeneratedCode(input: AnalyzeCodeInput): Promise<AnalyzeCodeOutput> {
  return analyzeCodeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeCodePrompt',
  input: {schema: AnalyzeCodeInputSchema},
  output: {schema: AnalyzeCodeOutputSchema},
  prompt: `You are an expert code reviewer and debugging assistant.
A user has provided a code snippet, the original problem description it was meant to solve, and the programming language.
Your task is to thoroughly analyze the code and provide structured feedback.

Original Problem Description:
"{{{originalDescription}}}"

Programming Language: {{#if language}}{{language}}{{else}}Not specified, infer if possible{{/if}}

Generated Code to Analyze:
\`\`\`{{#if language}}{{language}}{{/if}}
{{{generatedCode}}}
\`\`\`

Please provide the following analysis:
1.  **Syntax Feedback**: Check for any obvious syntax errors, typos, or common mistakes specific to the '{{language}}' language. If the syntax appears correct, state that.
2.  **Correctness Assessment**: Evaluate if the 'generatedCode' logically and effectively solves the 'originalDescription'. Explain your reasoning. Does it handle common cases?
3.  **Meets Requirements**: Based on your assessment, does the code substantially meet the core requirements of the original problem description? (True/False)
4.  **Improvement Suggestions**: Offer specific, actionable suggestions to improve the code. This could include:
    *   Clarity (e.g., better variable names, comments for complex logic).
    *   Efficiency (e.g., alternative algorithms, better data structures if applicable).
    *   Error handling (e.g., try-catch blocks, input validation).
    *   Adherence to language best practices or idioms.
5.  **Style and Best Practices (Optional)**: Comment on coding style, naming conventions, and general best practices for the given language.
6.  **Potential Bugs or Edge Cases (Optional)**: Identify any potential bugs, logical flaws, or important edge cases that might not be handled by the current code.

Focus on providing constructive and detailed feedback.
If the language is not specified, try to infer it from the code or description, but mention if the inference is uncertain.
`,
});

const analyzeCodeFlow = ai.defineFlow(
  {
    name: 'analyzeCodeFlow',
    inputSchema: AnalyzeCodeInputSchema,
    outputSchema: AnalyzeCodeOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
