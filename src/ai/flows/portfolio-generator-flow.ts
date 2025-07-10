
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
  prompt: `You are an expert full-stack web developer specializing in creating clean, modern, and responsive single-page portfolio websites with professional animations, inspired by the provided design example.
Your task is to generate the complete HTML and CSS for a portfolio site based on the provided resume text and a selected theme.

**Design Inspiration:**
A modern, dark-themed portfolio with a prominent hero section featuring a circular profile image with an accent ring. The layout is clean with clear sections for "About Me," "Projects," etc. Sections should have subtle scroll-in animations.

**Input Resume Text:**
\`\`\`
{{{resumeText}}}
\`\`\`

**Selected Theme:** {{{theme}}}

**Instructions:**
1.  **Parse the Resume**: Carefully parse the provided resume text, which is structured with "SECTION: [NAME]" and "END_SECTION" delimiters, to extract all relevant information (Personal Info, Summary, Experience, Education, Skills, Projects, Key Achievements).
2.  **Generate HTML**: Create a single, complete HTML5 document ('htmlContent').
    *   The HTML must be well-structured and semantic (using tags like <header>, <nav>, <main>, <section>, <footer>).
    *   It must include a <head> section with a proper title (using the person's name from Personal Info), meta tags for viewport and character set, and a link to an external stylesheet named "style.css".
    *   Create a `<nav>` bar with links that smooth-scroll to sections: Home, About, Projects, Experience, Contact.
    *   **Hero Section**: Create a prominent hero section. It should display "Hello.", the user's name, and their professional title. It MUST include a circular profile picture area.
    *   Create distinct sections for 'About Me' (from Summary), 'Projects', 'Experience', and a 'Contact' section in the footer. Use the 'animate-on-scroll' class for these sections to enable animations.
    *   The contact information (email, phone, LinkedIn) should be in the footer.
    *   Include a script at the end of the \`<body>\` for handling smooth scrolling and the scroll animations.
3.  **Generate CSS**: Create the corresponding CSS styling in a single string ('cssContent').
    *   **Theme 'professional-dark' (Primary focus)**: Use a very dark background (e.g., #111827), off-white text (e.g., #E5E7EB), and a professional accent color (e.g., a shade of vibrant orange or red like #F97316) for highlights, links, and the ring around the profile picture. Fonts should be clean and sans-serif (e.g., 'Inter' or system-ui).
    *   **Profile Picture**: Style the hero image as a circle with a colorful gradient border/ring, similar to the design inspiration.
    *   **Layout**: The layout MUST be responsive. Use flexbox or grid and media queries to ensure it looks great on desktop and mobile, matching the two-column inspiration.
    *   **Animations**: Implement a fade-in-up animation for elements with the 'animate-on-scroll' class. The animation should trigger when the element scrolls into view. Use an 'is-visible' class added by JavaScript to trigger the animation. Define keyframes for this.
    *   **Styling**: Style all elements, including cards for projects/experience, buttons, and navigation links with hover effects.
4.  **Content Integration**: Populate the HTML sections with the parsed resume data.
5.  **Output Format**: Return the generated HTML and CSS as two separate, complete strings in the specified JSON output format. Do not include any markdown formatting like 'html' or 'css' code fences.

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
