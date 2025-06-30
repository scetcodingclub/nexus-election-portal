"use client";

import VotingBallot from '@/components/app/vote/VotingBallot';
import { useParams } from 'next/navigation';
import { Suspense } from 'react';

// A simple loading skeleton for the page itself before the main component mounts.
function BallotPageSkeleton() {
  return (
    <div className="max-w-5xl mx-auto py-8">
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <p className="text-lg mt-4">Loading Ballot...</p>
      </div>
    </div>
  )
}

export default function BallotPage() {
  const params = useParams();
  const roomId = params.roomId as string;

  return (
    <div className="max-w-5xl mx-auto py-8">
       <Suspense fallback={<BallotPageSkeleton />}>
        {/* All logic, including fetching and loading states, is now inside VotingBallot */}
        {roomId ? <VotingBallot roomId={roomId} /> : <BallotPageSkeleton />}
      </Suspense>
    </div>
  );
}
