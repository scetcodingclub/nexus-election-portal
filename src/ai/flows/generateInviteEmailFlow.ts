
'use server';
/**
 * @fileOverview A flow for generating a voter invitation email.
 *
 * - generateInviteEmail - A function that creates the email subject and body.
 * - GenerateInviteEmailInput - The input type for the function.
 * - GenerateInviteEmailOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const GenerateInviteEmailInputSchema = z.object({
  voterEmail: z.string().email().describe("The recipient's email address."),
  electionName: z.string().describe("The name of the election or voting room."),
  inviteLink: z.string().url().describe("The unique, secure link for the voter to click."),
});
export type GenerateInviteEmailInput = z.infer<typeof GenerateInviteEmailInputSchema>;

const GenerateInviteEmailOutputSchema = z.object({
  subject: z.string().describe("The subject line of the email."),
  body: z.string().describe("The full body content of the email in plain text. Use newlines for paragraphs."),
});
export type GenerateInviteEmailOutput = z.infer<typeof GenerateInviteEmailOutputSchema>;

export async function generateInviteEmail(input: GenerateInviteEmailInput): Promise<GenerateInviteEmailOutput> {
  return generateInviteEmailFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateInviteEmailPrompt',
  input: { schema: GenerateInviteEmailInputSchema },
  output: { schema: GenerateInviteEmailOutputSchema },
  prompt: `
    You are an assistant for an election management platform called N.E.X.U.S.
    Your task is to generate a professional and friendly email to invite a user to vote.

    The email should be addressed to the voter, mention the specific election they are invited to,
    and provide them with their unique, secure voting link.

    - The tone should be formal but welcoming.
    - Clearly state the purpose of the email.
    - Emphasize that the link is unique to them and should not be shared.
    - Do not include any placeholder brackets like [Your Name] in the signature. Sign off simply as "The N.E.X.U.S. Election Team".

    Here is the information to use:
    - Election Name: {{{electionName}}}
    - Voter's Email: {{{voterEmail}}}
    - Unique Voting Link: {{{inviteLink}}}
  `,
});

const generateInviteEmailFlow = ai.defineFlow(
  {
    name: 'generateInviteEmailFlow',
    inputSchema: GenerateInviteEmailInputSchema,
    outputSchema: GenerateInviteEmailOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
