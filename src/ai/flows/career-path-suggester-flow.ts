
'use server';
/**
 * @fileOverview A flow for suggesting potential career paths, with general academic guidance.
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
  // Removed suggestedStudyFields and exampleInstitutions from here
});

const SuggestCareerPathsOutputSchema = z.object({
  suggestions: z.array(CareerPathSuggestionSchema).describe('A list of suggested career paths.'),
  globallySuggestedStudyFields: z.array(z.string()).optional().describe("A list of general academic programs, degrees/diplomas, or fields of study suggested based on the user's overall profile (interests, skills, education, exam score), not tied to a specific career path. If a competitive exam score was provided, these suggestions should be generally informed by it."),
  globallySuggestedExampleInstitutions: z.array(z.string()).optional().describe("A list of example institutions suggested based on the user's overall profile. These are illustrative examples only, based on general knowledge, and should NOT be taken as admission guarantees or endorsements. Admission criteria are complex and vary widely; users must research specific institutions directly. If a competitive exam score was provided, these suggestions should be generally informed by it, accompanied by strong disclaimers."),
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
Based on this information:
1.  Suggest {{{numSuggestions}}} potential career paths.
2.  Provide a separate list of general academic programs/fields of study.
3.  Provide a separate list of example institutions, if applicable and with strong disclaimers.

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
This score should inform your general academic guidance (programs/institutions) if provided.
{{/if}}

**Part 1: Career Path Suggestions**
For each of the {{{numSuggestions}}} career paths, provide:
1.  **Path Title**: The common name for the career.
2.  **Description**: A concise overview of the role and its responsibilities.
3.  **Alignment Reason**: Clearly explain how this career path aligns with the user's provided interests and skills.
4.  **Potential Skills to Develop (Optional)**: List 2-3 key skills beneficial for this path.
5.  **Typical Industries (Optional)**: List 2-3 common industries for this role.
Do NOT include specific college programs or institutions within each career path suggestion.

**Part 2: General Academic Guidance (Separate from Career Paths)**
Provide these as top-level fields in your output: \`globallySuggestedStudyFields\` and \`globallySuggestedExampleInstitutions\`.

*   **Globally Suggested Study Fields**:
    *   Based on the user's overall profile (interests, skills, education level, and competitive exam score if available), list 2-4 general academic programs (e.g., 'Bachelor of Engineering in Computer Science', 'Diploma in Hospitality Management', 'Master of Public Health') or relevant fields of study (e.g., 'Physics', 'Literature').
    *   If a competitive exam score was provided, these suggestions should be generally informed by it. Focus on general types of institutions or program competitiveness levels that might align (e.g., "highly competitive research universities," "state universities with good engineering programs," "vocational diploma programs"). Do NOT suggest specific college names within this field itself.
    *   You CAN indicate if certain highly competitive fields might require exceptionally high scores, or if the provided score is generally suitable for a range of programs in the suggested fields. Frame suggestions carefully.

*   **Globally Suggested Example Institutions (Optional, use only if you can provide illustrative examples responsibly based on the competitive exam score and general profile)**:
    *   Based on the user's overall profile, you MAY suggest 1-3 example institutions (e.g., 'University of California - Berkeley', 'Massachusetts Institute of Technology', 'Community College X') that are *illustrative* of places that *might* offer suitable programs and *could potentially* align with the user's general profile and score.
    *   **YOU MUST preface these suggestions with strong disclaimers.** For example: 'Institutions such as [Example Institution 1] or [Example Institution 2] are known for programs in relevant fields. Given your profile, these represent a *potential* tier to explore, but admission is highly competitive and depends on many factors beyond scores. Always check their official websites for current requirements and do not consider this a guarantee of admission.'
    *   **DO NOT present these as definitive recommendations or guarantees of admission.** Your suggestions are illustrative and for informational purposes only.
    *   If you cannot confidently provide even illustrative examples without overpromising or if the user's information is too vague for this section, OMIT the \`globallySuggestedExampleInstitutions\` field entirely or provide an empty list.
    *   Your goal is to provide helpful pointers, not to make admissions predictions.

Consider the combination of interests and skills. If experience level is provided, try to tailor career path suggestions accordingly.
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

