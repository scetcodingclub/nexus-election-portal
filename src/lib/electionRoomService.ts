
import { db } from "@/lib/firebaseClient";
import { doc, getDoc, collection, query, where, getDocs, runTransaction, Timestamp, DocumentData, orderBy, writeBatch, addDoc } from "firebase/firestore";
import type { ElectionRoom } from '@/lib/types';


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

  // By default, we only fetch the main room document.
  // If `withVoteCounts` is true, we also fetch all vote documents to aggregate results.
  // This is a protected operation that should only be done by an admin.
  const [docSnap, votesSnap] = await Promise.all([
    getDoc(roomRef),
    withVoteCounts ? getDocs(collection(db, "electionRooms", roomId, "votes")) : Promise.resolve(null)
  ]);

  if (!docSnap.exists()) {
    return null;
  }
  
  const voteCounts = new Map<string, number>();
  if (votesSnap) {
    votesSnap.forEach(voteDoc => {
        const voteData = voteDoc.data();
        const candidateId = voteData.candidateId;
        voteCounts.set(candidateId, (voteCounts.get(candidateId) || 0) + 1);
    });
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
                // Overwrite voteCount with aggregated data if available.
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
    positions: positions,
    createdAt: createdAt,
    updatedAt: updatedAt,
    status: (data.status as ElectionRoom['status']) || 'pending',
    roomType: data.roomType || 'voting',
  };
}

export async function checkUserHasVoted(roomId: string, userEmail: string): Promise<boolean> {
  // Use a direct get() on a subcollection document, which is more secure and performant.
  const userVoteRef = doc(db, "electionRooms", roomId, "voters", userEmail);
  const userVoteSnap = await getDoc(userVoteRef);
  return userVoteSnap.exists();
}

export async function getVotersForRoom(roomId: string): Promise<{email: string; votedAt: string}[]> {
  const votersColRef = collection(db, "electionRooms", roomId, "voters");
  const votersSnap = await getDocs(votersColRef);

  if (votersSnap.empty) {
    return [];
  }

  const voters = votersSnap.docs.map(doc => {
    const data = doc.data();
    const votedAtRaw = data.votedAt;
    const votedAt = votedAtRaw instanceof Timestamp
      ? votedAtRaw.toDate().toISOString()
      : new Date().toISOString();

    return {
      email: doc.id,
      votedAt,
    };
  });

  // Sort by date, most recent first
  return voters.sort((a, b) => new Date(b.votedAt).getTime() - new Date(a.votedAt).getTime());
}

export async function recordUserVote(roomId: string, userEmail: string, votes: Record<string, string>): Promise<void> {
  const userVoteRef = doc(db, "electionRooms", roomId, "voters", userEmail);
  const votesColRef = collection(db, "electionRooms", roomId, "votes");

  await runTransaction(db, async (transaction) => {
    // 1. Check if user has already voted. This is the main guard against double voting.
    const userVoteSnap = await transaction.get(userVoteRef);
    if (userVoteSnap.exists()) {
      throw new Error("User has already voted.");
    }
    
    // 2. Add individual vote documents to the 'votes' subcollection
    for (const positionId in votes) {
      if (Object.prototype.hasOwnProperty.call(votes, positionId)) {
        const candidateId = votes[positionId];
        const newVoteRef = doc(votesColRef); // Create a reference for a new document with an auto-generated ID
        transaction.set(newVoteRef, {
          positionId,
          candidateId,
          createdAt: Timestamp.now(),
        });
      }
    }
    
    // 3. Create a document for the voter to prevent them from voting again.
    transaction.set(userVoteRef, {
      votedAt: Timestamp.now(),
      votesCast: votes, // Store what they voted for, just in case.
    });
  });
}


export async function verifyRoomAccess(formData: FormData): Promise<{ success: boolean; message: string; roomId?: string; }> {
  const roomId = formData.get('roomId') as string;
  const accessCode = formData.get('accessCode') as string;

  if (!roomId || roomId.trim() === '') {
      return { success: false, message: "Please enter a Voting Room ID." };
  }

  const room = await getElectionRoomById(roomId.trim());
  
  if (!room) {
      return { success: false, message: "The Voting Room ID you entered is invalid or the room does not exist." };
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
