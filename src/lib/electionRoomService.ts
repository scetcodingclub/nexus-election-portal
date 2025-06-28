
'use server';

import { db } from "@/lib/firebaseClient";
import { doc, getDoc, collection, query, where, getDocs, runTransaction, Timestamp, DocumentData } from "firebase/firestore";
import type { ElectionRoom } from '@/lib/types';

export async function getElectionRoomById(roomId: string): Promise<ElectionRoom | null> {
  const roomRef = doc(db, "electionRooms", roomId);
  const docSnap = await getDoc(roomRef);

  if (!docSnap.exists()) {
    return null;
  }

  const data = docSnap.data();
  if (!data) return null; 

  const createdAtRaw = data.createdAt;
  const updatedAtRaw = data.updatedAt;

  const createdAt = createdAtRaw instanceof Timestamp
    ? createdAtRaw.toDate().toISOString()
    : typeof createdAtRaw === 'string'
    ? createdAtRaw
    : new Date().toISOString();

  const updatedAt = updatedAtRaw instanceof Timestamp
    ? updatedAtRaw.toDate().toISOString()
    : typeof updatedAtRaw === 'string'
    ? updatedAtRaw
    : undefined;

  const positionsRaw = data.positions;
  const positions = Array.isArray(positionsRaw)
    ? positionsRaw.map((p: any) => {
        const candidatesRaw = p?.candidates;
        return {
          id: p?.id || `pos-${Math.random().toString(36).substr(2, 9)}`,
          title: p?.title || "Untitled Position",
          candidates: Array.isArray(candidatesRaw)
            ? candidatesRaw.map((c: any) => ({
                id: c?.id || `cand-${Math.random().toString(36).substr(2, 9)}`,
                name: c?.name || "Unnamed Candidate",
                imageUrl: c?.imageUrl || '',
                voteCount: c?.voteCount || 0,
              }))
            : [],
        };
      })
    : [];

  return {
    id: docSnap.id,
    title: data.title || "Untitled Election Room",
    description: data.description || "No description.",
    isAccessRestricted: data.isAccessRestricted === true, // Ensure boolean
    accessCode: data.accessCode || undefined,
    positions: positions,
    createdAt: createdAt,
    updatedAt: updatedAt,
    status: (data.status as ElectionRoom['status']) || 'pending',
  };
}

export async function checkUserHasVoted(roomId: string, userEmail: string): Promise<boolean> {
  // Use a direct get() on a subcollection document, which is more secure and performant.
  const userVoteRef = doc(db, "electionRooms", roomId, "voters", userEmail);
  const userVoteSnap = await getDoc(userVoteRef);
  return userVoteSnap.exists();
}

export async function recordUserVote(roomId: string, userEmail: string, votes: Record<string, string>): Promise<void> {
  const electionRoomRef = doc(db, "electionRooms", roomId);
  const userVoteRef = doc(db, "electionRooms", roomId, "voters", userEmail);

  await runTransaction(db, async (transaction) => {
    // This is a server-side check to prevent double voting, even if client-side checks fail.
    const userVoteSnap = await transaction.get(userVoteRef);
    if (userVoteSnap.exists()) {
      throw new Error("User has already voted.");
    }

    const electionRoomSnap = await transaction.get(electionRoomRef);

    if (!electionRoomSnap.exists()) {
      throw new Error("Election room not found!");
    }

    const roomData = electionRoomSnap.data() as DocumentData;
    const updatedPositions = roomData.positions.map((position: any) => {
      const positionIdentifier = position.id || position.title;
      if (votes[positionIdentifier]) {
        return {
          ...position,
          candidates: position.candidates.map((candidate: any) => {
            const candidateIdentifier = candidate.id || candidate.name;
            const selectedCandidateIdentifier = votes[positionIdentifier];

            if (candidateIdentifier === selectedCandidateIdentifier) {
              return {
                ...candidate,
                voteCount: (candidate.voteCount || 0) + 1,
              };
            }
            return candidate;
          }),
        };
      }
      return position;
    });

    transaction.update(electionRoomRef, { positions: updatedPositions, updatedAt: Timestamp.now() });

    // Record the user's vote in the subcollection to prevent future votes.
    transaction.set(userVoteRef, {
      votedAt: Timestamp.now(),
      votesCast: votes,
    });
  });
}


export async function verifyRoomAccess(formData: FormData): Promise<{ success: boolean; message: string; roomId?: string; }> {
  const roomId = formData.get('roomId') as string;
  const accessCode = formData.get('accessCode') as string;

  if (!roomId || roomId.trim() === '') {
      return { success: false, message: "Please enter an Election Room ID." };
  }

  const room = await getElectionRoomById(roomId.trim());
  
  if (!room) {
      return { success: false, message: "The Election Room ID you entered is invalid or the room does not exist." };
  }

  if (room.isAccessRestricted) {
      if (!accessCode || accessCode.trim() === '') {
          return { success: false, message: "This room is private and requires an access code." };
      }
      if (room.accessCode !== accessCode.trim()) {
          return { success: false, message: "The access code provided is incorrect." };
      }
  }
  
  return { success: true, message: "Access granted.", roomId: room.id };
}
