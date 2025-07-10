
'use server';
/**
 * @fileOverview A flow for generating a single-page portfolio website from structured resume text.
 *
 * - generatePortfolioSite - A function that generates HTML and CSS for a portfolio site.
 * - GeneratePortfolioInput - The input type for the generatePortfolioSite function.
 * - GeneratePortfolioOutput - The return type for the generatePortfolioSite function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GeneratePortfolioInputSchema = z.object({
  resumeText: z.string().describe("The structured text of the user's resume, formatted with SECTION delimiters. This is the primary source of content."),
  theme: z.enum(["professional-dark", "professional-light", "creative-vibrant"]).optional().default("professional-dark").describe("The desired visual theme for the portfolio website."),
});
export type GeneratePortfolioInput = z.infer<typeof GeneratePortfolioInputSchema>;

const GeneratePortfolioOutputSchema = z.object({
  htmlContent: z.string().describe("The complete HTML content for the single-page portfolio as a single string. This should be a full HTML5 document."),
  cssContent: z.string().describe("The complete CSS content for styling the portfolio as a single string. This should be linked from the HTML."),
});
export type GeneratePortfolioOutput = z.infer<typeof GeneratePortfolioOutputSchema>;

export async function generatePortfolioSite(input: GeneratePortfolioInput): Promise<GeneratePortfolioOutput> {
  return generatePortfolioFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generatePortfolioPrompt',
  input: {schema: GeneratePortfolioInputSchema},
  output: {schema: GeneratePortfolioOutputSchema},
  prompt: `You are an expert full-stack web developer specializing in creating clean, modern, and responsive single-page portfolio websites.
Your task is to generate the complete HTML and CSS for a portfolio site based on the provided resume text and a selected theme.

**Input Resume Text:**
\`\`\`
{{{resumeText}}}
\`\`\`

**Selected Theme:** {{{theme}}}

**Instructions:**
1.  **Parse the Resume**: Carefully parse the provided resume text, which is structured with "SECTION: [NAME]" and "END_SECTION" delimiters, to extract all relevant information (Personal Info, Summary, Experience, Education, Skills, Projects, Key Achievements).
2.  **Generate HTML**: Create a single, complete HTML5 document ('htmlContent').
    *   The HTML must be well-structured and semantic (using tags like <header>, <nav>, <main>, <section>, <footer>).
    *   It must include a <head> section with a proper title (using the person's name), meta tags for viewport and character set, and a link to an external stylesheet named "style.css".
    *   Create distinct sections for 'About Me' (from Summary), 'Experience', 'Projects', 'Education', and 'Skills'.
    *   The contact information (email, phone, LinkedIn) should be prominently displayed, likely in the header or footer.
    *   The site should be a single page with smooth-scrolling navigation links if possible.
3.  **Generate CSS**: Create the corresponding CSS styling in a single string ('cssContent').
    *   **Theme 'professional-dark'**: Use a dark background (e.g., #1a202c), light text (e.g., #e2e8f0), and a professional accent color (e.g., a shade of blue or teal). Fonts should be clean and sans-serif (e.g., 'Inter', 'Lato', or system-ui).
    *   **Theme 'professional-light'**: Use a light background (e.g., #f7fafc), dark text (e.g., #2d3748), and a professional accent color. Fonts should be clean and sans-serif.
    *   **Theme 'creative-vibrant'**: Use more expressive colors, possibly gradients, and a more creative font pairing (e.g., a serif for headings and sans-serif for body). Feel free to add subtle animations or hover effects.
    *   The layout MUST be responsive. Use flexbox or grid for layout and media queries to ensure it looks great on desktop, tablet, and mobile devices.
    *   Style all elements, including cards for projects/experience, skill tags, and contact links.
4.  **Content Integration**: Populate the HTML sections with the parsed resume data. For example, the 'Skills' section should display the list of skills as styled tags or badges. The 'Experience' section should list each job with its title, company, date, and details.
5.  **Output Format**: Return the generated HTML and CSS as two separate, complete strings in the specified JSON output format. Do not include any markdown formatting like 'html' or 'css' code fences in the output strings.

Generate the portfolio website code now.`,
});

const generatePortfolioFlow = ai.defineFlow(
  {
    name: 'generatePortfolioFlow',
    inputSchema: GeneratePortfolioInputSchema,
    outputSchema: GeneratePortfolioOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
