
export interface Candidate {
  id: string;
  name: string;
  imageUrl?: string;
  voteCount?: number; // Optional: for results
}

export interface Position {
  id: string;
  title: string;
  candidates: Candidate[];
}

export interface ElectionRoom {
  id:string;
  title: string;
  description: string;
  isAccessRestricted: boolean; // Example property
  accessCode?: string; // For joining the room
  deletionPassword?: string; // For authorizing deletion
  positions: Position[];
  createdAt: string;
  updatedAt?: string; // Added for Firestore timestamp
  status: 'pending' | 'active' | 'closed';
  roomType?: 'voting' | 'review';
}

export interface Vote {
  positionId: string;
  candidateId: string;
}

export interface Voter {
  email: string;
  status: 'invited' | 'waiting' | 'voting' | 'voted' | 'unknown';
  invitedAt?: string;
  votedAt?: string;
}

    