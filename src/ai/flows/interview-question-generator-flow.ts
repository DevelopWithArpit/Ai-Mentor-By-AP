
'use server';
/**
 * @fileOverview A flow for generating interview questions.
 *
 * - generateInterviewQuestions - A function that generates interview questions based on a job role or topic.
 * - GenerateInterviewQuestionsInput - The input type for the generateInterviewQuestions function.
 * - GenerateInterviewQuestionsOutput - The return type for the generateInterviewQuestions function.
 * - QuestionCategory - The type for question categories.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const QuestionCategorySchema = z.enum(["technical", "behavioral", "situational", "dsa", "any"]);
export type QuestionCategory = z.infer<typeof QuestionCategorySchema>;

const GenerateInterviewQuestionsInputSchema = z.object({
  jobRoleOrTopic: z.string().describe('The job role (e.g., "Software Engineer", "Product Manager") or a specific topic (e.g., "data structures", "conflict resolution") for which to generate questions.'),
  numQuestions: z.number().optional().default(5).describe('The desired number of questions to generate.'),
  questionCategory: QuestionCategorySchema.optional().default("any").describe('The category of questions to generate (technical, behavioral, situational, dsa, or any).'),
});
export type GenerateInterviewQuestionsInput = z.infer<typeof GenerateInterviewQuestionsInputSchema>;

const InterviewQuestionSchema = z.object({
    question: z.string().describe("The interview question."),
    category: z.string().describe("The category of the question (e.g., Technical, Behavioral, Situational, DSA)."),
    suggestedApproach: z.string().optional().describe("A brief suggestion on how to approach answering this question."),
});

const GenerateInterviewQuestionsOutputSchema = z.object({
  questions: z.array(InterviewQuestionSchema).describe('A list of generated interview questions with their categories and suggested approaches.'),
});
export type GenerateInterviewQuestionsOutput = z.infer<typeof GenerateInterviewQuestionsOutputSchema>;

export async function generateInterviewQuestions(input: GenerateInterviewQuestionsInput): Promise<GenerateInterviewQuestionsOutput> {
  return generateInterviewQuestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateInterviewQuestionsPrompt',
  input: {schema: GenerateInterviewQuestionsInputSchema},
  output: {schema: GenerateInterviewQuestionsOutputSchema},
  prompt: `You are an expert interview coach.
Generate {{{numQuestions}}} interview questions for the job role or topic: "{{{jobRoleOrTopic}}}".

Focus on generating questions of the '{{{questionCategory}}}' category.
- If 'technical' is specified, focus on specific technical skills, tools, or concepts relevant to the role/topic.
- If 'behavioral' is specified, focus on past experiences and how the candidate handled situations (e.g., teamwork, conflict, failure).
- If 'situational' is specified, pose hypothetical scenarios to assess problem-solving and decision-making.
- If 'dsa' is specified, focus on Data Structures and Algorithms questions. This includes questions about specific data structures (arrays, linked lists, trees, graphs, hash tables), algorithms (sorting, searching, dynamic programming, graph traversal), time and space complexity analysis, and problem-solving with DSA concepts. Relate DSA questions to the job role if appropriate (e.g., DSA for game development if the role is Game Developer).
- If 'any' is specified, provide a mix of relevant categories.

For each question, provide:
1. The question itself.
2. Its category (Technical, Behavioral, Situational, or DSA).
3. A brief suggested approach or key points the candidate should consider when answering. For DSA questions, this might include mentioning expected time/space complexity or common approaches.

Example for one question:
{
  "question": "Tell me about a time you faced a conflict with a coworker.",
  "category": "Behavioral",
  "suggestedApproach": "Use the STAR method (Situation, Task, Action, Result). Focus on clear communication and positive resolution."
}
Example for a DSA question if 'Software Engineer' is the role and 'dsa' category:
{
  "question": "How would you find the k-th smallest element in an unsorted array? Discuss the time and space complexity of your approach.",
  "category": "DSA",
  "suggestedApproach": "Consider approaches like sorting (O(n log n) time), using a min-heap (O(n log k) time), or Quickselect (average O(n) time). Discuss trade-offs."
}
`,
});

const generateInterviewQuestionsFlow = ai.defineFlow(
  {
    name: 'generateInterviewQuestionsFlow',
    inputSchema: GenerateInterviewQuestionsInputSchema,
    outputSchema: GenerateInterviewQuestionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
