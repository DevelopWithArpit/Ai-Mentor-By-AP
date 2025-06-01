
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
  description: z.string().describe("A brief description of what this career path entails. If a competitive exam score was provided, briefly weave in general academic guidance based on it within this description or the alignment reason, such as types of programs or general competitiveness levels that might be relevant. Do not mention specific college names or predict admission chances."),
  alignmentReason: z.string().describe("Explanation of why this path aligns with the user's interests and skills."),
  potentialSkillsToDevelop: z.array(z.string()).optional().describe("Key skills that might be beneficial to develop or strengthen for this path."),
  typicalIndustries: z.array(z.string()).optional().describe("Common industries where this role is found."),
  suggestedStudyFields: z.array(z.string()).optional().describe("Specific academic programs (e.g., 'Bachelor of Engineering in Computer Science', 'Diploma in Hospitality Management', 'Master of Public Health') or relevant fields of study (e.g., 'Physics', 'Literature'). If a competitive exam score was provided, these suggestions should be informed by it in general terms regarding program competitiveness or institutional tiers, without naming specific colleges."),
  suggestedCoursesOrCertifications: z.array(z.string()).optional().describe("Example courses, certifications, or specific learning areas beneficial for this path (e.g., 'Machine Learning Specialization', 'Certified Project Manager (PMP)', 'Digital Marketing Fundamentals')."),
  exampleInstitutions: z.array(z.string()).optional().describe("A list of example institutions that *might* offer relevant programs. These are illustrative suggestions based on general knowledge and should NOT be taken as admission guarantees or endorsements. Admission criteria are complex and vary widely; users must research specific institutions directly."),
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
When a competitive exam score is provided, you MUST use this information to offer more tailored general academic guidance. This guidance should be woven into the 'description', 'suggestedStudyFields', or 'exampleInstitutions' for each career path.
Your guidance MUST adhere to the following:
- For 'suggestedStudyFields' and 'description': Focus on general types of institutions or program competitiveness levels that might align with such a score range (e.g., "highly competitive research universities," "state universities with good engineering programs," "vocational diploma programs"). Do NOT suggest specific college names within these fields.
- You CAN indicate if certain highly competitive fields might require exceptionally high scores, or if the provided score is generally suitable for a range of programs in the suggested fields.
- Frame suggestions carefully, e.g., "With a score like X, you might explore programs in Y at institutions that generally have a range of entry requirements." or "Fields like Z are typically very competitive; your score could be a factor to consider alongside other application components when looking at suitable institutions."
{{/if}}

For each suggested career path, provide:
1.  **Path Title**: The common name for the career.
2.  **Description**: A concise overview of the role and its responsibilities. If a competitive exam score was provided, briefly weave in general academic guidance based on it here, such as types of programs or general competitiveness levels that might be relevant.
3.  **Alignment Reason**: Clearly explain how this career path aligns with the user's provided interests and skills.
4.  **Potential Skills to Develop (Optional)**: List 2-3 key skills that would be beneficial for the user to acquire or improve for this path.
5.  **Typical Industries (Optional)**: List 2-3 common industries where this role is prevalent.
6.  **Suggested College Programs (Degrees/Diplomas) (Optional)**: List 1-2 specific academic programs by name (e.g., 'Bachelor of Science in Computer Science', 'Diploma in Digital Marketing', 'Master of Business Administration', 'Associate of Applied Science in Cybersecurity'). If general fields of study are more appropriate (e.g., 'Fine Arts'), list those. If a competitive exam score was provided, your suggestions for these programs should be generally informed by the score, considering the types of institutions or program competitiveness that might align, without naming specific colleges in this section.
7.  **Suggested Courses/Certifications (Optional)**: List 1-3 specific example courses, certifications, or learning areas (e.g., 'Introduction to Python Programming', 'Google Digital Marketing Certificate', 'Agile Project Management').
{{#if competitiveExamScore}}
8.  **Example Institutions (Optional, use only if you can provide illustrative examples responsibly based on the competitive exam score and field):**
    *   You MAY suggest 1-2 example institutions (e.g., 'University of California - Berkeley for Computer Science', 'Massachusetts Institute of Technology for Engineering fields', 'Community College X for Associate Degrees') that are *illustrative* of places that *might* offer suitable programs and *could potentially* align with the user's general profile and score.
    *   **YOU MUST preface these suggestions with strong disclaimers.** For example: 'Institutions such as [Example Institution 1] or [Example Institution 2] are known for programs in [Field]. Given your score, these represent a *potential* tier to explore, but admission is highly competitive and depends on many factors beyond scores. Always check their official websites for current requirements and do not consider this a guarantee of admission.'
    *   **DO NOT present these as definitive recommendations or guarantees of admission.** Your suggestions are illustrative and for informational purposes only.
    *   If you cannot confidently provide even illustrative examples without overpromising or if the user's information is too vague, OMIT this section entirely or state that specific institutional recommendations require direct research by the user with university counselors or official sources.
    *   Your goal is to provide helpful pointers, not to make admissions predictions. Ensure this section is clearly marked as containing examples.
{{/if}}

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

