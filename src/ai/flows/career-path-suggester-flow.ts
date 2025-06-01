
'use server';
/**
 * @fileOverview A flow for suggesting potential career paths.
 *
 * - suggestCareerPaths - A function that suggests career paths based on user inputs.
 * - SuggestCareerPathsInput - The input type for the suggestCareerPaths function.
 * - SuggestCareerPathsOutput - The return type for the suggestCareerPaths function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestCareerPathsInputSchema = z.object({
  interests: z.array(z.string()).describe('A list of user\'s interests (e.g., "technology", "healthcare", "art", "sustainability").'),
  skills: z.array(z.string()).describe('A list of user\'s skills (e.g., "python programming", "project management", "graphic design", "data analysis").'),
  experienceLevel: z.enum(["entry-level", "mid-level", "senior-level", "executive"]).optional().describe("User's current general experience level."),
  educationLevel: z.string().optional().describe("User's highest education level (e.g., 'High School Diploma', 'Bachelor of Science in Computer Science', 'MBA')."),
  numSuggestions: z.number().optional().default(3).describe("The desired number of career path suggestions."),
});
export type SuggestCareerPathsInput = z.infer<typeof SuggestCareerPathsInputSchema>;

const CareerPathSuggestionSchema = z.object({
  pathTitle: z.string().describe("The title of the suggested career path (e.g., 'Data Scientist', 'UX/UI Designer', 'Environmental Consultant')."),
  description: z.string().describe("A brief description of what this career path entails."),
  alignmentReason: z.string().describe("Explanation of why this path aligns with the user's interests and skills."),
  potentialSkillsToDevelop: z.array(z.string()).optional().describe("Key skills that might be beneficial to develop or strengthen for this path."),
  typicalIndustries: z.array(z.string()).optional().describe("Common industries where this role is found."),
  suggestedStudyFields: z.array(z.string()).optional().describe("Relevant fields of study for this career path (e.g., 'Computer Science', 'Mechanical Engineering', 'Psychology')."),
  suggestedCoursesOrCertifications: z.array(z.string()).optional().describe("Example courses, certifications, or specific learning areas beneficial for this path (e.g., 'Machine Learning Specialization', 'Certified Project Manager (PMP)', 'Digital Marketing Fundamentals')."),
});

const SuggestCareerPathsOutputSchema = z.object({
  suggestions: z.array(CareerPathSuggestionSchema).describe('A list of suggested career paths.'),
});
export type SuggestCareerPathsOutput = z.infer<typeof SuggestCareerPathsOutputSchema>;

export async function suggestCareerPaths(input: SuggestCareerPathsInput): Promise<SuggestCareerPathsOutput> {
  return suggestCareerPathsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestCareerPathsPrompt',
  input: {schema: SuggestCareerPathsInputSchema},
  output: {schema: SuggestCareerPathsOutputSchema},
  prompt: `You are an expert career advisor AI.
A user has provided their interests, skills, and optionally their experience and education level.
Based on this information, suggest {{{numSuggestions}}} potential career paths.

User's Interests:
{{#each interests}}
- {{{this}}}
{{/each}}

User's Skills:
{{#each skills}}
- {{{this}}}
{{/each}}

{{#if experienceLevel}}
User's Experience Level: {{{experienceLevel}}}
{{/if}}

{{#if educationLevel}}
User's Education Level: {{{educationLevel}}}
{{/if}}

For each suggested career path, provide:
1.  **Path Title**: The common name for the career.
2.  **Description**: A concise overview of the role and its responsibilities.
3.  **Alignment Reason**: Clearly explain how this career path aligns with the user's provided interests and skills. Be specific.
4.  **Potential Skills to Develop (Optional)**: List 2-3 key skills that would be beneficial for the user to acquire or improve for this path.
5.  **Typical Industries (Optional)**: List 2-3 common industries where this role is prevalent.
6.  **Suggested Study Fields (Optional)**: List 1-2 relevant academic fields of study (e.g., 'Computer Science', 'Marketing', 'Environmental Science').
7.  **Suggested Courses/Certifications (Optional)**: List 1-3 specific example courses, certifications, or learning areas (e.g., 'Introduction to Python Programming', 'Google Digital Marketing Certificate', 'Agile Project Management').

Consider the combination of interests and skills. If experience level is provided, try to tailor suggestions accordingly (e.g., more strategic roles for senior levels).
Provide practical and actionable suggestions.
`,
});

const suggestCareerPathsFlow = ai.defineFlow(
  {
    name: 'suggestCareerPathsFlow',
    inputSchema: SuggestCareerPathsInputSchema,
    outputSchema: SuggestCareerPathsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

