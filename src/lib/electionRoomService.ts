
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
  // Convert Firestore Timestamps to ISO strings
  const createdAt = data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : new Date().toISOString();
  const updatedAt = data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : undefined;
  
  const positions = data.positions.map((p: any) => ({
    id: p.id || `pos-${Math.random().toString(36).substr(2, 9)}`,
    title: p.title,
    candidates: p.candidates.map((c: any) => ({
      id: c.id || `cand-${Math.random().toString(36).substr(2, 9)}`,
      name: c.name,
      imageUrl: c.imageUrl || '',
      voteCount: c.voteCount || 0,
    })),
  }));

  return {
    id: docSnap.id,
    title: data.title,
    description: data.description,
    isAccessRestricted: data.isAccessRestricted,
    accessCode: data.accessCode,
    positions: positions,
    createdAt: createdAt,
    updatedAt: updatedAt,
    status: data.status as ElectionRoom['status'],
  };
}

export async function checkUserHasVoted(roomId: string, userEmail: string): Promise<boolean> {
  const userVotesRef = collection(db, "userVotes");
  const q = query(userVotesRef, where("roomId", "==", roomId), where("userEmail", "==", userEmail));
  const querySnapshot = await getDocs(q);
  return !querySnapshot.empty;
}

export async function recordUserVote(roomId: string, userEmail: string, votes: Record<string, string>): Promise<void> {
  // This transaction does two things:
  // 1. Updates vote counts in the electionRoom document.
  // 2. Adds a record to userVotes to mark this user as voted.
  await runTransaction(db, async (transaction) => {
    const electionRoomRef = doc(db, "electionRooms", roomId);
    const electionRoomSnap = await transaction.get(electionRoomRef);

    if (!electionRoomSnap.exists()) {
      throw new Error("Election room not found!");
    }

    const roomData = electionRoomSnap.data() as DocumentData; // Use DocumentData for more flexibility with Firestore types
    const updatedPositions = roomData.positions.map((position: any) => {
      if (votes[position.id || position.title]) { // Check against position.id or title as fallback if id isn't there
        return {
          ...position,
          candidates: position.candidates.map((candidate: any) => {
            // Match candidate by id, or by name if id isn't reliable (though id should be preferred)
            const candidateIdentifier = candidate.id || candidate.name;
            const selectedCandidateIdentifier = votes[position.id || position.title];

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

    const userVoteRef = doc(collection(db, "userVotes")); // Auto-generate ID
    transaction.set(userVoteRef, {
      roomId,
      userEmail, // In a real app, hash this email
      votedAt: Timestamp.now(),
      votesCast: votes, // Optionally store what they voted for, for audit, if privacy allows
    });
  });
}
