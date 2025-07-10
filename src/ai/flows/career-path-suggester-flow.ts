
'use server';
/**
 * @fileOverview A flow for suggesting potential career paths, with general academic guidance including program descriptions and cautious admission outlooks.
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
});

const GloballySuggestedStudyFieldSchema = z.object({
  fieldName: z.string().describe("The name of the general academic program, degree/diploma, or field of study."),
  description: z.string().optional().describe("A brief description of what this field of study typically entails or prepares students for.")
});

const GloballySuggestedExampleInstitutionSchema = z.object({
  institutionName: z.string().describe("The name of the example institution."),
  admissionOutlook: z.string().optional().describe("A general, cautious outlook or considerations regarding admission to this type of institution or for relevant programs, based on the user's profile. This is NOT a prediction or guarantee of admission. It should include disclaimers.")
});

const SuggestCareerPathsOutputSchema = z.object({
  suggestions: z.array(CareerPathSuggestionSchema).describe('A list of suggested career paths.'),
  globallySuggestedStudyFields: z.array(GloballySuggestedStudyFieldSchema).optional().describe("A list of general academic programs or fields of study suggested based on the user's overall profile, each with a brief description."),
  globallySuggestedExampleInstitutions: z.array(GloballySuggestedExampleInstitutionSchema).optional().describe("A list of example institutions, each with a general admission outlook/consideration. These are illustrative and heavily caveated."),
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
2.  Provide a separate list of general academic programs/fields of study, each with a brief description.
3.  Provide a separate list of example institutions, if applicable, each with a general admission outlook/consideration, and with strong disclaimers.

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
    *   Based on the user's overall profile (interests, skills, education level, and competitive exam score if available), list 2-4 general academic programs (e.g., 'Bachelor of Engineering in Computer Science', 'Diploma in Hospitality Management') or relevant fields of study (e.g., 'Physics', 'Literature').
    *   For each field, provide a brief 'description' (1-2 sentences) of what it generally entails or prepares students for.
    *   If a competitive exam score was provided, these suggestions should be generally informed by it. Focus on general types of institutions or program competitiveness levels that might align (e.g., "highly competitive research universities," "state universities with good engineering programs," "vocational diploma programs").
    *   You CAN indicate if certain highly competitive fields might require exceptionally high scores, or if the provided score is generally suitable for a range of programs in the suggested fields. Frame suggestions carefully.

*   **Globally Suggested Example Institutions (Optional, use only if you can provide illustrative examples responsibly)**:
    *   Based on the user's overall profile, you MAY suggest 1-3 example institutions (e.g., 'University of California - Berkeley', 'Massachusetts Institute of Technology', 'Community College X') that are *illustrative* of places that *might* offer suitable programs.
    *   For each institution, provide an 'admissionOutlook'. This should be a brief, general statement about admission considerations (e.g., "Highly competitive, typically requires top-tier scores and a strong overall profile. Research specific program requirements.", "Admission is generally competitive; a strong score in [Exam Name] would be beneficial for programs in [Field].", "Offers a range of programs; your profile might align with some. Check specific prerequisites.").
    *   **YOU MUST preface these suggestions with strong disclaimers within the 'admissionOutlook' or as a general note.** For example: 'The following are illustrative examples only. Admission is highly competitive and depends on many factors beyond scores. Always check their official websites for current requirements and do not consider this a guarantee of admission.'
    *   **DO NOT present these as definitive recommendations or guarantees of admission.** Your suggestions are illustrative and for informational purposes only.
    *   If you cannot confidently provide even illustrative examples with a responsible outlook, OMIT the \`globallySuggestedExampleInstitutions\` field entirely or provide an empty list.
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
