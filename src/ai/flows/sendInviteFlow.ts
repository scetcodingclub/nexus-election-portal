
'use server';
/**
 * @fileOverview A flow for generating voter invitation links.
 *
 * - sendInvite - A function that generates a secure link and adds a voter to the voter pool.
 * - SendInviteInput - The input type for the sendInvite function.
 * - SendInviteOutput - The return type for the sendInvite function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { db } from '@/lib/firebaseClient';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import jwt from 'jsonwebtoken';

const SendInviteInputSchema = z.object({
  roomId: z.string().describe("The ID of the election room."),
  email: z.string().email().describe("The email address of the voter to invite."),
});
export type SendInviteInput = z.infer<typeof SendInviteInputSchema>;

const SendInviteOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  inviteLink: z.string().url(),
});
export type SendInviteOutput = z.infer<typeof SendInviteOutputSchema>;

// This is an exported wrapper function that calls the flow.
// The UI will interact with this function.
export async function sendInvite(input: SendInviteInput): Promise<SendInviteOutput> {
  return sendInviteFlow(input);
}

const sendInviteFlow = ai.defineFlow(
  {
    name: 'sendInviteFlow',
    inputSchema: SendInviteInputSchema,
    outputSchema: SendInviteOutputSchema,
  },
  async (input) => {
    const { roomId, email } = input;

    // In a real app, this secret should be stored securely as an environment variable.
    // It's hardcoded here for simplicity of the example.
    const JWT_SECRET = 'your-super-secret-key-that-is-long-and-secure';
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

    try {
      // 1. Add/update the voter in the Firestore subcollection
      const voterRef = doc(db, "electionRooms", roomId, "voters", email);
      await setDoc(voterRef, {
        email: email,
        status: 'invited',
        invitedAt: Timestamp.now(),
      }, { merge: true });

      // 2. Generate a secure token for the voter
      const token = jwt.sign({ email, roomId }, JWT_SECRET, { expiresIn: '7d' });

      // 3. Construct the unique invite link
      const inviteLink = `${baseUrl}/vote/${roomId}/waiting?token=${token}`;

      // In a real application, you would add a step here to send an email
      // to the user with this link using a service like SendGrid, Nodemailer, etc.
      // For this example, we will just return the link to the admin.

      return {
        success: true,
        message: `Successfully generated invite link for ${email}.`,
        inviteLink: inviteLink,
      };

    } catch (error: any) {
      console.error('Error in sendInviteFlow:', error);
      // Re-throw the error to be caught by the client-side caller
      throw new Error(`Failed to process invitation for ${email}. Reason: ${error.message}`);
    }
  }
);
    
