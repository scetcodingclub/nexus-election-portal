
import { db } from "@/lib/firebaseClient";
import { doc, getDoc, collection, query, where, getDocs, runTransaction, Timestamp, DocumentData, orderBy, writeBatch, addDoc, deleteDoc, updateDoc, setDoc } from "firebase/firestore";
import type { ElectionRoom, Voter } from '@/lib/types';

export async function getElectionRooms(): Promise<ElectionRoom[]> {
  const electionRoomsCol = collection(db, "electionRooms");
  const q = query(electionRoomsCol, orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => {
    const data = doc.data();
    if (!data) {
      // This case should ideally not happen if a document exists
      return {
        id: doc.id,
        title: "Error: Missing Data",
        description: "Document data is unexpectedly missing.",
        isAccessRestricted: false,
        accessCode: undefined,
        positions: [],
        createdAt: new Date().toISOString(),
        status: 'pending' as ElectionRoom['status'],
        roomType: 'voting',
      };
    }

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
      id: doc.id,
      title: data.title || "Untitled Election",
      description: data.description || "No description provided.",
      isAccessRestricted: data.isAccessRestricted === true, // Ensure boolean
      accessCode: data.accessCode || undefined,
      deletionPassword: data.deletionPassword,
      positions: positions,
      createdAt: createdAt,
      updatedAt: updatedAt,
      status: (data.status as ElectionRoom['status']) || 'pending',
      roomType: data.roomType || 'voting',
    };
  });
}

export async function getElectionRoomById(roomId: string, options: { withVoteCounts?: boolean } = {}): Promise<ElectionRoom | null> {
  const { withVoteCounts = false } = options;
  const roomRef = doc(db, "electionRooms", roomId);

  let votesSnap = null;
  if(withVoteCounts) {
    if( (await getDoc(roomRef)).data()?.roomType === 'review' ) {
      votesSnap = await getDocs(collection(db, "electionRooms", roomId, "reviews"));
    } else {
       votesSnap = await getDocs(collection(db, "electionRooms", roomId, "votes"));
    }
  }
 
  const docSnap = await getDoc(roomRef);

  if (!docSnap.exists()) {
    return null;
  }
  
  const voteCounts = new Map<string, number>();
  if (votesSnap) {
     if(docSnap.data()?.roomType === 'review') {
        // Logic for reviews if needed in the future, e.g., counting reviews per candidate
     } else {
        votesSnap.forEach(voteDoc => {
            const voteData = voteDoc.data();
            const candidateId = voteData.candidateId;
            voteCounts.set(candidateId, (voteCounts.get(candidateId) || 0) + 1);
        });
     }
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
                voteCount: voteCounts.get(c.id) || 0,
              }))
            : [],
        };
      })
    : [];

  return {
    id: docSnap.id,
    title: data.title || "Untitled Voting Room",
    description: data.description || "No description.",
    isAccessRestricted: data.isAccessRestricted === true, // Ensure boolean
    accessCode: data.accessCode || undefined,
    deletionPassword: data.deletionPassword,
    positions: positions,
    createdAt: createdAt,
    updatedAt: updatedAt,
    status: (data.status as ElectionRoom['status']) || 'pending',
    roomType: data.roomType || 'voting',
  };
}

export async function getVotersForRoom(roomId: string): Promise<Voter[]> {
  const votersColRef = collection(db, "electionRooms", roomId, "voters");
  const votersSnap = await getDocs(query(votersColRef, orderBy("votedAt", "desc")));

  if (votersSnap.empty) {
    return [];
  }

  const voters = votersSnap.docs.map(doc => {
    const data = doc.data();
    return {
      email: doc.id,
      status: 'voted', // simplified status
      votedAt: (data.votedAt as Timestamp)?.toDate().toISOString(),
    };
  });
  
  return voters;
}

export async function deleteElectionRoom(roomId: string, passwordAttempt: string): Promise<{ success: boolean; message: string }> {
    const roomRef = doc(db, "electionRooms", roomId);
    
    try {
        const roomSnap = await getDoc(roomRef);
        if (!roomSnap.exists()) {
            return { success: false, message: "Room not found. It may have already been deleted." };
        }
        
        const roomData = roomSnap.data();
        if (roomData.deletionPassword !== passwordAttempt) {
            return { success: false, message: "Incorrect deletion password." };
        }
        
        await deleteDoc(roomRef);
        
        return { success: true, message: "Voting room successfully deleted." };

    } catch (error: any) {
        console.error("Error deleting room:", error);
        if (error.code === 'permission-denied') {
            return { success: false, message: "You do not have permission to delete this room." };
        }
        return { success: false, message: "An unexpected error occurred while deleting the room." };
    }
}

export async function submitBallot(
  roomId: string,
  voterEmail: string,
  selections: Record<string, string | null> // positionId -> candidateId | null
): Promise<{ success: boolean; message: string }> {
  try {
    await runTransaction(db, async (transaction) => {
      const voterRef = doc(db, "electionRooms", roomId, "voters", voterEmail);
      const voterSnap = await transaction.get(voterRef);
      if (voterSnap.exists()) {
        throw new Error("You have already voted in this election.");
      }

      const roomRef = doc(db, "electionRooms", roomId);
      const roomSnap = await transaction.get(roomRef);
      if (!roomSnap.exists() || roomSnap.data().status !== 'active') {
        throw new Error("This election is not currently active.");
      }

      const batch = writeBatch(db);

      // Record votes
      for (const positionId in selections) {
        const candidateId = selections[positionId];
        if (candidateId) { // Only record actual votes, not abstentions
          const voteRef = doc(collection(db, "electionRooms", roomId, "votes"));
          batch.set(voteRef, {
            positionId,
            candidateId,
            votedAt: serverTimestamp(),
          });
        }
      }

      // Mark voter as having voted
      batch.set(voterRef, {
        votedAt: serverTimestamp(),
      });

      await batch.commit();
    });

    return { success: true, message: "Your ballot has been successfully submitted." };
  } catch (error: any) {
    console.error("Error submitting ballot:", error);
    return { success: false, message: error.message || "An unexpected error occurred while submitting your ballot." };
  }
}

export async function submitReview(
  roomId: string,
  voterEmail: string,
  selections: Record<string, { rating: number; feedback: string }>
): Promise<{ success: boolean; message: string }> {
  try {
    await runTransaction(db, async (transaction) => {
      const voterRef = doc(db, "electionRooms", roomId, "voters", voterEmail);
      const voterSnap = await transaction.get(voterRef);
      if (voterSnap.exists()) {
        throw new Error("You have already submitted a review for this room.");
      }

      const roomRef = doc(db, "electionRooms", roomId);
      const roomSnap = await transaction.get(roomRef);
      if (!roomSnap.exists() || roomSnap.data().status !== 'active') {
        throw new Error("This review room is not currently active.");
      }

      const batch = writeBatch(db);

      // Record reviews
      const roomData = roomSnap.data();
      const positions = roomData.positions || [];

      for (const positionId in selections) {
        const reviewData = selections[positionId];
        const position = positions.find((p: any) => p.id === positionId);
        const candidateId = position?.candidates[0]?.id;

        if (candidateId) {
          const reviewRef = doc(collection(db, "electionRooms", roomId, "reviews"));
          batch.set(reviewRef, {
            positionId,
            candidateId,
            rating: reviewData.rating,
            feedback: reviewData.feedback,
            reviewedAt: serverTimestamp(),
          });
        }
      }

      // Mark voter as having reviewed
      batch.set(voterRef, {
        votedAt: serverTimestamp(), // Use 'votedAt' for consistency
      });

      await batch.commit();
    });
    
    return { success: true, message: "Your review has been successfully submitted." };
  } catch (error: any) {
    console.error("Error submitting review:", error);
    return { success: false, message: error.message || "An unexpected error occurred while submitting your review." };
  }
}
