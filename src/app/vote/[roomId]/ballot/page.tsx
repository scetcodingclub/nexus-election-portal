
"use client";

import VotingBallot from '@/components/app/vote/VotingBallot';
import { useParams } from 'next/navigation';

export default function BallotPage() {
  const params = useParams();
  const roomId = params.roomId as string;

  return (
    <div className="max-w-5xl mx-auto py-8">
      {roomId ? <VotingBallot roomId={roomId} /> : <p>Loading...</p>}
    </div>
  );
}
