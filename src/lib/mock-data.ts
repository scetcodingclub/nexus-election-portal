
import type { ElectionRoom, Position, Candidate } from './types';

// This file is now largely superseded by Firestore integration for live data.
// It can be kept for reference, testing, or initial data seeding if needed,
// but the application will primarily fetch from Firestore.

const generateCandidates = (positionTitle: string, count: number): Candidate[] => {
  const candidates: Candidate[] = [];
  for (let i = 1; i <= count; i++) {
    const candidateId = `${positionTitle.toLowerCase().replace(/\s+/g, '-')}-candidate-${i}-${Math.random().toString(36).substring(2, 7)}`;
    candidates.push({
      id: candidateId,
      name: `Candidate ${String.fromCharCode(64 + i)} for ${positionTitle}`,
      imageUrl: `https://placehold.co/100x100.png?text=${positionTitle[0]}${String.fromCharCode(64 + i)}`,
      voteCount: Math.floor(Math.random() * 100),
    });
  }
  return candidates;
};

const generatePositions = (): Position[] => {
  const positionTitles = ["President", "Vice President", "Secretary", "Treasurer"];
  return positionTitles.map((title, index) => ({
    id: `pos-${index + 1}-${Math.random().toString(36).substring(2, 7)}`, // Ensure unique-ish IDs for mock
    title: title,
    candidates: generateCandidates(title, Math.floor(Math.random() * 3) + 2), // 2 to 4 candidates
  }));
};

export const mockElectionRooms: ElectionRoom[] = [
  {
    id: 'room-123-mock', // Changed ID to avoid conflict with potential real data
    title: 'Annual Student Body Election 2024 (Mock)',
    description: 'Election for key student leadership positions for the academic year 2024-2025.',
    isAccessRestricted: false,
    accessCode: 'NEXUS2024',
    positions: generatePositions(),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(), // 5 days ago
    status: 'active',
  },
  {
    id: 'room-456-mock',
    title: 'Tech Club Committee Election (Mock)',
    description: 'Vote for the new committee members of the Tech Club.',
    isAccessRestricted: true,
    accessCode: 'TECHCLUBVOTE',
    positions: generatePositions().slice(0,2), 
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), 
    status: 'pending',
  },
  {
    id: 'room-789-mock',
    title: 'Project Alpha Team Lead Selection (Mock)',
    description: 'Internal team voting for the Project Alpha lead role.',
    isAccessRestricted: true,
    accessCode: 'ALPHA2LEAD',
    positions: [
      {
        id: `lead-pos-1-${Math.random().toString(36).substring(2, 7)}`,
        title: 'Team Lead',
        candidates: generateCandidates('Team Lead', 3),
      },
    ],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(), 
    status: 'closed',
  },
];

// This function is no longer the primary source for voter pages but can be used for testing.
export const getMockElectionRoomById = (id: string): ElectionRoom | undefined => {
  return mockElectionRooms.find(room => room.id === id);
};
