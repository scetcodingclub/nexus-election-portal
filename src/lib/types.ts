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
  id: string;
  title: string;
  description: string;
  isAccessRestricted: boolean; // Example property
  accessCode?: string; // For joining the room
  positions: Position[];
  createdAt: string;
  status: 'pending' | 'active' | 'closed';
}

export interface Vote {
  positionId: string;
  candidateId: string;
}
