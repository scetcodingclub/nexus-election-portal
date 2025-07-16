
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
  positions: Position[];
  createdAt: string;
  updatedAt?: string; // Added for Firestore timestamp
  status: 'pending' | 'active' | 'closed';
  roomType?: 'voting' | 'review';
}

export interface Voter {
  email: string;
  status: 'in_room' | 'completed';
  lastActivity?: string;
  votedAt?: string;
  ownPositionTitle?: string;
}

    
