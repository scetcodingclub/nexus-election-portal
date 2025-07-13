
"use client";

import VotingBallot from '@/components/app/vote/VotingBallot';
import { useParams, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

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
  const searchParams = useSearchParams();
  const roomId = params.roomId as string;
  const token = searchParams.get('token');

  return (
    <div className="max-w-5xl mx-auto py-8">
       <Suspense fallback={<BallotPageSkeleton />}>
        {roomId && token ? <VotingBallot roomId={roomId} token={token} /> : <BallotPageSkeleton />}
      </Suspense>
    </div>
  );
}
