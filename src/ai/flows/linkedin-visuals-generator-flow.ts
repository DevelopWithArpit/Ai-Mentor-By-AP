
'use server';
/**
 * @fileOverview An AI flow for generating suggestions for LinkedIn profile pictures and cover images.
 *
 * - generateLinkedInVisuals - A function that generates image suggestions.
 * - GenerateLinkedInVisualsInput - The input type for the generateLinkedInVisuals function.
 * - GenerateLinkedInVisualsOutput - The return type for the generateLinkedInVisuals function.
 */

import {ai} from '@/ai/genkit';
import {z}from 'genkit';

const GenerateLinkedInVisualsInputSchema = z.object({
  fullName: z.string().optional().describe("The user's full name. If not provided, AI will attempt to extract it from the resume content."),
  professionalTitle: z.string().optional().describe("The user's professional title or field. If not provided, AI will attempt to extract it from the resume content."),
  resumeContent: z.string().describe("The user's full resume content (text). This is the primary source of information for generating visuals."),
  stylePreference: z.enum(["professional-minimalist", "creative-abstract", "modern-tech", "elegant-corporate", "vibrant-energetic"]).optional().default("professional-minimalist").describe("The desired visual style for the generated images."),
});
export type GenerateLinkedInVisualsInput = z.infer<typeof GenerateLinkedInVisualsInputSchema>;

const GenerateLinkedInVisualsOutputSchema = z.object({
  suggestedProfilePictureUrl: z.string().optional().describe("The data URI of the AI-generated suggestion for a profile picture. Expected format: 'data:image/png;base64,<encoded_data>'. This will be an abstract design, pattern, or stylized initials, NOT a realistic human face."),
  suggestedCoverImageUrl: z.string().optional().describe("The data URI of the AI-generated suggestion for a LinkedIn cover image. Expected format: 'data:image/png;base64,<encoded_data>'. This image will be themed around the professional title."),
  profilePicturePromptUsed: z.string().optional().describe("The prompt used to generate the profile picture, for user reference."),
  coverImagePromptUsed: z.string().optional().describe("The prompt used to generate the cover image, for user reference."),
});
export type GenerateLinkedInVisualsOutput = z.infer<typeof GenerateLinkedInVisualsOutputSchema>;

export async function generateLinkedInVisuals(input: GenerateLinkedInVisualsInput): Promise<GenerateLinkedInVisualsOutput> {
  return generateLinkedInVisualsFlow(input);
}

const generateLinkedInVisualsFlow = ai.defineFlow(
  {
    name: 'generateLinkedInVisualsFlow',
    inputSchema: GenerateLinkedInVisualsInputSchema,
    outputSchema: GenerateLinkedInVisualsOutputSchema,
  },
  async (input): Promise<GenerateLinkedInVisualsOutput> => {
    let profilePictureUrl: string | undefined;
    let coverImageUrl: string | undefined;
    
    const nameHint = input.fullName ? `The user's name is likely "${input.fullName}".` : "The user's name needs to be identified from the resume.";
    const titleHint = input.professionalTitle ? `The user's title is likely "${input.professionalTitle}".` : "The user's professional title needs to be identified from the resume.";

    const profilePicPrompt = `Generate a professional LinkedIn profile picture. First, analyze the provided resume content to identify the person's full name and professional title. ${nameHint} ${titleHint} Use the identified information to create the image. Style: ${input.stylePreference}. Theme it subtly around the name and title. Consider an abstract design, a professional geometric pattern, elegant stylized initials based on the name, or a subtle visual metaphor for the profession. ABSOLUTELY DO NOT generate a realistic human face or any likeness of a person. The image should be square and suitable for a small circular crop. Resume Content: """${input.resumeContent}"""`;
    
    const coverImagePrompt = `Generate a professional LinkedIn cover image (banner) that acts as a visual portfolio based on the following resume content: "${input.resumeContent}". The image should artistically and abstractly represent the key skills, projects, and experiences mentioned. For example, if the resume mentions software development, data science, and cloud computing, the image could be an abstract collage of code snippets, charts, and network diagrams. The style should be: "${input.stylePreference}". It must be visually appealing as a background banner (approximately 1584x396 pixels aspect ratio, landscape) and subtle enough not to overpower profile content. Do not include any readable text in the image.`;

    try {
      console.log(`Generating LinkedIn Profile Picture with prompt: ${profilePicPrompt}`);
      const {media: profileMedia} = await ai.generate({
        model: 'googleai/gemini-2.0-flash-preview-image-generation',
        prompt: profilePicPrompt,
        config: { responseModalities: ['TEXT', 'IMAGE'] },
      });
      if (profileMedia?.url) {
        profilePictureUrl = profileMedia.url;
        console.log('Successfully generated LinkedIn Profile Picture.');
      } else {
        console.warn('LinkedIn Profile Picture generation did not return a URL.');
      }
    } catch (error) {
      console.error(`Failed to generate LinkedIn Profile Picture for resume:`, error);
    }

    try {
      console.log(`Generating LinkedIn Cover Image with prompt: ${coverImagePrompt}`);
      const {media: coverMedia} = await ai.generate({
        model: 'googleai/gemini-2.0-flash-preview-image-generation',
        prompt: coverImagePrompt,
        config: { responseModalities: ['TEXT', 'IMAGE'] },
      });
      if (coverMedia?.url) {
        coverImageUrl = coverMedia.url;
        console.log('Successfully generated LinkedIn Cover Image.');
      } else {
        console.warn('LinkedIn Cover Image generation did not return a URL.');
      }
    } catch (error) {
      console.error(`Failed to generate LinkedIn Cover Image for resume:`, error);
    }

    return {
      suggestedProfilePictureUrl: profilePictureUrl,
      suggestedCoverImageUrl: coverImageUrl,
      profilePicturePromptUsed: profilePicPrompt,
      coverImagePromptUsed: coverImagePrompt
    };
  }
);
