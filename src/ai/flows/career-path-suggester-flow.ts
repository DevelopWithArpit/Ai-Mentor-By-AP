
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
  competitiveExamScore: z.string().optional().describe("User's score or percentage in relevant competitive exams (e.g., '75 percentile in SAT', 'Rank 5000 in JEE Main', '85% in national entrance test for engineering'). This information, if provided, helps the AI offer more tailored general guidance on academic paths. The AI cannot predict admission to specific institutions or programs."),
  numSuggestions: z.number().optional().default(3).describe("The desired number of career path suggestions."),
});
export type SuggestCareerPathsInput = z.infer<typeof SuggestCareerPathsInputSchema>;

const CareerPathSuggestionSchema = z.object({
  pathTitle: z.string().describe("The title of the suggested career path (e.g., 'Data Scientist', 'UX/UI Designer', 'Environmental Consultant')."),
  description: z.string().describe("A brief description of what this career path entails."),
  alignmentReason: z.string().describe("Explanation of why this path aligns with the user's interests and skills."),
  potentialSkillsToDevelop: z.array(z.string()).optional().describe("Key skills that might be beneficial to develop or strengthen for this path."),
  typicalIndustries: z.array(z.string()).optional().describe("Common industries where this role is found."),
  suggestedStudyFields: z.array(z.string()).optional().describe("Relevant academic degrees, diplomas, or fields of study for this career path (e.g., 'Bachelor of Science in Computer Science', 'Diploma in Digital Marketing', 'Mechanical Engineering')."),
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
A user has provided their interests, skills, and optionally their experience, education level, and competitive exam scores.
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

{{#if competitiveExamScore}}
User's Competitive Exam Score: {{{competitiveExamScore}}}
If a competitive exam score is provided, consider it when suggesting study fields and courses. You should *not* make definitive statements about admission chances to specific universities or programs, as these vary widely. Instead, you can:
- Suggest general types of institutions or program competitiveness levels that might align with such a score range (e.g., "highly competitive research universities," "state universities with good engineering programs," "vocational diploma programs").
- Indicate if certain highly competitive fields might require exceptionally high scores, or if the provided score is generally suitable for a range of programs in the suggested fields.
- Frame suggestions carefully, e.g., "With a score like X, you might explore programs in Y, which often have a range of entry requirements." or "Fields like Z are typically very competitive; your score could be a factor to consider alongside other application components."
Focus on providing general guidance on how the score might influence their educational path within the suggested career areas.
{{/if}}

For each suggested career path, provide:
1.  **Path Title**: The common name for the career.
2.  **Description**: A concise overview of the role and its responsibilities.
3.  **Alignment Reason**: Clearly explain how this career path aligns with the user's provided interests and skills. Be specific.
4.  **Potential Skills to Develop (Optional)**: List 2-3 key skills that would be beneficial for the user to acquire or improve for this path.
5.  **Typical Industries (Optional)**: List 2-3 common industries where this role is prevalent.
6.  **Suggested Degrees, Diplomas, or Study Fields (Optional)**: List 1-2 relevant academic qualifications, such as specific degrees (e.g., 'Bachelor of Science in Computer Science'), diplomas (e.g., 'Diploma in Network Administration'), or general fields of study if specific qualifications are less common (e.g., 'Marketing', 'Environmental Science').
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

