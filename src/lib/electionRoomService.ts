
import { db, auth } from "@/lib/firebaseClient";
import { doc, getDoc, collection, query, where, getDocs, runTransaction, Timestamp, DocumentData, orderBy, writeBatch, addDoc, deleteDoc, updateDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import type { ElectionRoom, Voter, Review, Position } from '@/lib/types';

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
  const docSnap = await getDoc(roomRef);

  if (!docSnap.exists()) {
    return null;
  }
  
  const data = docSnap.data();
  if (!data) return null;

  let finalPositions: Position[] = (data.positions || []).map((p: any) => ({
    id: p?.id || `pos-${Math.random().toString(36).substr(2, 9)}`,
    title: p?.title || "Untitled Position",
    candidates: (p?.candidates || []).map((c: any) => ({
      id: c?.id || `cand-${Math.random().toString(36).substr(2, 9)}`,
      name: c?.name || "Unnamed Candidate",
      imageUrl: c?.imageUrl || '',
      voteCount: 0,
    })),
    averageRating: 0,
    reviews: [],
  }));

  if (withVoteCounts) {
    if (data.roomType === 'review') {
      const reviewsSnap = await getDocs(collection(db, "electionRooms", roomId, "reviews"));
      const reviewsByPosition = new Map<string, Review[]>();

      reviewsSnap.forEach(reviewDoc => {
        const reviewData = reviewDoc.data();
        const positionId = reviewData.positionId;
        const reviews = reviewsByPosition.get(positionId) || [];
        reviews.push({
          rating: reviewData.rating,
          feedback: reviewData.feedback,
          reviewerEmail: reviewData.reviewerEmail,
          reviewedAt: (reviewData.reviewedAt as Timestamp)?.toDate().toISOString() || new Date().toISOString(),
        });
        reviewsByPosition.set(positionId, reviews);
      });
      
      finalPositions = finalPositions.map(position => {
        const posReviews = reviewsByPosition.get(position.id) || [];
        const totalRating = posReviews.reduce((sum, r) => sum + r.rating, 0);
        const averageRating = posReviews.length > 0 ? totalRating / posReviews.length : 0;
        
        const ratingDistribution = [
          { name: '1 Star', count: 0 },
          { name: '2 Stars', count: 0 },
          { name: '3 Stars', count: 0 },
          { name: '4 Stars', count: 0 },
          { name: '5 Stars', count: 0 },
        ];
        posReviews.forEach(r => {
            const starIndex = Math.floor(r.rating) - 1;
            if(starIndex >= 0 && starIndex < 5) {
                ratingDistribution[starIndex].count++;
            }
        });

        return {
          ...position,
          averageRating: parseFloat(averageRating.toFixed(2)),
          reviews: posReviews.sort((a,b) => new Date(b.reviewedAt).getTime() - new Date(a.reviewedAt).getTime()),
          ratingDistribution: ratingDistribution
        }
      });

    } else { // 'voting' room type
      const votesSnap = await getDocs(collection(db, "electionRooms", roomId, "votes"));
      const voteCounts = new Map<string, number>();
      votesSnap.forEach(voteDoc => {
        const voteData = voteDoc.data();
        const candidateId = voteData.candidateId;
        voteCounts.set(candidateId, (voteCounts.get(candidateId) || 0) + 1);
      });
      
      finalPositions = finalPositions.map(position => ({
        ...position,
        candidates: position.candidates.map(candidate => ({
          ...candidate,
          voteCount: voteCounts.get(candidate.id) || 0,
        })),
      }));
    }
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

  return {
    id: docSnap.id,
    title: data.title || "Untitled Room",
    description: data.description || "No description.",
    isAccessRestricted: data.isAccessRestricted === true,
    accessCode: data.accessCode || undefined,
    positions: finalPositions,
    createdAt: createdAt,
    updatedAt: updatedAt,
    status: (data.status as ElectionRoom['status']) || 'pending',
    roomType: data.roomType || 'voting',
  };
}


export async function getVotersForRoom(roomId: string): Promise<Voter[]> {
  const votersColRef = collection(db, "electionRooms", roomId, "voters");
  const votersSnap = await getDocs(query(votersColRef, orderBy("lastActivity", "desc")));

  if (votersSnap.empty) {
    return [];
  }

  const voters = votersSnap.docs.map(doc => {
    const data = doc.data();
    const lastActivity = data.lastActivity instanceof Timestamp 
        ? data.lastActivity.toDate().toISOString() 
        : data.lastActivity;
    
    return {
      email: doc.id,
      status: data.status,
      lastActivity: lastActivity,
      votedAt: data.votedAt instanceof Timestamp ? data.votedAt.toDate().toISOString() : data.votedAt,
      ownPositionTitle: data.ownPositionTitle,
    };
  });
  
  return voters;
}


export async function deleteElectionRoom(roomId: string, adminPassword: string): Promise<{ success: boolean; message: string }> {
    const roomRef = doc(db, "electionRooms", roomId);
    const user = auth.currentUser;

    if (!user || !user.email) {
        return { success: false, message: "No authenticated user found. Please log in again." };
    }
    
    try {
        const credential = EmailAuthProvider.credential(user.email, adminPassword);
        await reauthenticateWithCredential(user, credential);
        
        await deleteDoc(roomRef);
        
        return { success: true, message: "Voting room successfully deleted." };

    } catch (error: any) {
        console.error("Error deleting room:", error);
        if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
            return { success: false, message: "Incorrect password. Deletion failed." };
        }
        if (error.code === 'auth/requires-recent-login') {
            return { success: false, message: "This action is sensitive and requires a recent login. Please log out and log back in." };
        }
        if (error.code === 'permission-denied') {
            return { success: false, message: "You do not have permission to delete this room." };
        }
        return { success: false, message: "An unexpected error occurred while deleting the room." };
    }
}

export async function recordParticipantEntry(
    roomId: string,
    voterEmail: string,
    ownPositionTitle: string
): Promise<{ success: boolean; message: string }> {
    const voterRef = doc(db, "electionRooms", roomId, "voters", voterEmail);

    try {
        await runTransaction(db, async (transaction) => {
            const voterDoc = await transaction.get(voterRef);
            if (voterDoc.exists()) {
                if (voterDoc.data().status === 'completed') {
                    throw new Error("You have already completed your submission for this room.");
                }
                 transaction.update(voterRef, {
                    ownPositionTitle,
                    lastActivity: serverTimestamp()
                });
            } else {
                transaction.set(voterRef, {
                    status: 'in_room',
                    ownPositionTitle,
                    lastActivity: serverTimestamp()
                });
            }
        });
        return { success: true, message: "Entry recorded." };
    } catch (error: any) {
        console.error("Error recording participant entry:", error);
        return { success: false, message: error.message || "Could not record your entry. Please try again." };
    }
}

export async function submitBallot(
  roomId: string,
  voterEmail: string,
  selections: Record<string, string | null> // positionId -> candidateId | null
): Promise<{ success: boolean; message: string }> {
  try {
    const voterRef = doc(db, "electionRooms", roomId, "voters", voterEmail);
    const voterSnap = await getDoc(voterRef);
    if (voterSnap.exists() && voterSnap.data().status === 'completed') {
      return { success: false, message: "You have already voted in this election." };
    }

    const roomRef = doc(db, "electionRooms", roomId);
    const roomSnap = await getDoc(roomRef);
    if (!roomSnap.exists() || roomSnap.data().status !== 'active') {
      return { success: false, message: "This election is not currently active." };
    }

    const votesPromises = [];
    for (const positionId in selections) {
      const candidateId = selections[positionId];
      if (candidateId) {
        const voteRef = collection(db, "electionRooms", roomId, "votes");
        votesPromises.push(addDoc(voteRef, {
          positionId,
          candidateId,
          voterEmail,
          votedAt: serverTimestamp(),
        }));
      }
    }
    await Promise.all(votesPromises);

    await setDoc(voterRef, {
      status: 'completed',
      lastActivity: serverTimestamp(),
      votedAt: serverTimestamp(),
    }, { merge: true });

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
    const voterRef = doc(db, "electionRooms", roomId, "voters", voterEmail);
    const voterSnap = await getDoc(voterRef);

    if (voterSnap.exists() && voterSnap.data().status === 'completed') {
      return { success: false, message: "You have already submitted a review for this room." };
    }

    const roomRef = doc(db, "electionRooms", roomId);
    const roomSnap = await getDoc(roomRef);
    if (!roomSnap.exists() || roomSnap.data().status !== 'active') {
      return { success: false, message: "This review room is not currently active." };
    }

    const roomData = roomSnap.data();
    const positions = roomData.positions || [];
    
    const reviewPromises = [];
    for (const positionId in selections) {
      const reviewData = selections[positionId];
      const position = positions.find((p: any) => p.id === positionId);
      const candidateId = position?.candidates[0]?.id;

      if (candidateId) {
        // Skip submissions if rating is 0 (which means it was skipped by coordinator)
        if (reviewData.rating === 0) continue;

        const reviewRef = collection(db, "electionRooms", roomId, "reviews");
        reviewPromises.push(addDoc(reviewRef, {
          positionId,
          candidateId,
          rating: reviewData.rating,
          feedback: reviewData.feedback,
          reviewerEmail: voterEmail,
          reviewedAt: serverTimestamp(),
        }));
      }
    }
    await Promise.all(reviewPromises);
    
    await setDoc(voterRef, {
      status: 'completed',
      lastActivity: serverTimestamp(),
      votedAt: serverTimestamp(),
    }, { merge: true });
    
    return { success: true, message: "Your review has been successfully submitted." };
  } catch (error: any) {
    console.error("Error submitting review:", error);
    return { success: false, message: error.message || "An unexpected error occurred while submitting your review." };
  }
}
