
import { db } from "@/lib/firebaseClient";
import { doc, getDoc, collection, query, where, getDocs, runTransaction, Timestamp, DocumentData, orderBy, writeBatch, addDoc, deleteDoc, updateDoc, setDoc } from "firebase/firestore";
import type { ElectionRoom, Voter } from '@/lib/types';

export async function addUserToVoterPool(roomId: string, userEmail: string): Promise<void> {
    const voterRef = doc(db, "electionRooms", roomId, "voters", userEmail);
    const voterSnap = await getDoc(voterRef);

    if (!voterSnap.exists()) {
        await setDoc(voterRef, {
            email: userEmail,
            status: 'invited', // 'invited' is a good default status for someone joining this way
            invitedAt: Timestamp.now(),
        });
    }
    // If user already exists, we don't need to do anything.
    // The checkUserHasVoted function will prevent them from voting again.
}

export async function checkUserHasVoted(roomId: string, userEmail: string): Promise<boolean> {
  const userVoteRef = doc(db, "electionRooms", roomId, "voters", userEmail);
  const userVoteSnap = await getDoc(userVoteRef);
  
  if (userVoteSnap.exists() && userVoteSnap.data().status === 'voted') {
    return true;
  }
  
  return false;
}

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
    deletionPassword: data.deletionPassword,
    positions: positions,
    createdAt: createdAt,
    updatedAt: updatedAt,
    status: (data.status as ElectionRoom['status']) || 'pending',
    roomType: data.roomType || 'voting',
  };
}

export async function getVoter(roomId: string, userEmail: string): Promise<Voter | null> {
  const voterRef = doc(db, "electionRooms", roomId, "voters", userEmail);
  const voterSnap = await getDoc(voterRef);
  if (!voterSnap.exists()) {
    return null;
  }
  const data = voterSnap.data();
  return {
    email: voterSnap.id,
    status: data.status,
    invitedAt: (data.invitedAt as Timestamp)?.toDate().toISOString(),
    votedAt: (data.votedAt as Timestamp)?.toDate().toISOString(),
  };
}


export async function getVotersForRoom(roomId: string): Promise<Voter[]> {
  const votersColRef = collection(db, "electionRooms", roomId, "voters");
  const votersSnap = await getDocs(query(votersColRef, orderBy("invitedAt", "desc")));

  if (votersSnap.empty) {
    return [];
  }

  const voters = votersSnap.docs.map(doc => {
    const data = doc.data();
    return {
      email: doc.id,
      status: data.status || 'unknown',
      invitedAt: (data.invitedAt as Timestamp)?.toDate().toISOString(),
      votedAt: (data.votedAt as Timestamp)?.toDate().toISOString(),
    };
  });
  
  return voters;
}

export async function updateUserStatus(roomId: string, userEmail: string, status: 'waiting' | 'voting' | 'voted'): Promise<void> {
  const userVoteRef = doc(db, "electionRooms", roomId, "voters", userEmail);
  const payload: { status: string, [key: string]: any } = { status };
  
  if (status === 'voted') {
    payload.votedAt = Timestamp.now();
  }

  // Use updateDoc to avoid overwriting the entire document if it exists
  await setDoc(userVoteRef, payload, { merge: true });
}


export async function recordUserVote(roomId: string, userEmail: string, votes: Record<string, string>): Promise<void> {
  const userVoteRef = doc(db, "electionRooms", roomId, "voters", userEmail);
  const votesColRef = collection(db, "electionRooms", roomId, "votes");

  await runTransaction(db, async (transaction) => {
    const userVoteSnap = await transaction.get(userVoteRef);
    if (!userVoteSnap.exists() || userVoteSnap.data().status === 'voted') {
      throw new Error("User is not eligible to vote or has already voted.");
    }
    
    for (const positionId in votes) {
      if (Object.prototype.hasOwnProperty.call(votes, positionId)) {
        const candidateId = votes[positionId];
        const newVoteRef = doc(votesColRef); 
        transaction.set(newVoteRef, {
          positionId,
          candidateId,
          createdAt: Timestamp.now(),
        });
      }
    }
    
    transaction.set(userVoteRef, {
      status: 'voted',
      votedAt: Timestamp.now(),
      votesCast: votes,
    }, { merge: true });
  });
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
        
        // This is a simple deletion. For production, you might want to also delete subcollections (votes, voters) recursively.
        // This requires a Cloud Function for full recursive deletion. For now, we delete the main document.
        await deleteDoc(roomRef);
        
        return { success: true, message: "Voting room successfully deleted." };

    } catch (error: any) {
        console.error("Error deleting room:", error);
        // Check for permission errors specifically, though rules should allow it.
        if (error.code === 'permission-denied') {
            return { success: false, message: "You do not have permission to delete this room." };
        }
        return { success: false, message: "An unexpected error occurred while deleting the room." };
    }
}
