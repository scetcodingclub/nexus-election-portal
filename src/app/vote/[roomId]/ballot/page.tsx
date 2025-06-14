
import VotingBallot from '@/components/app/vote/VotingBallot';
import { getElectionRoomById } from '@/lib/electionRoomService'; // Updated import
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';


function BallotLoadingSkeleton() {
    return (
        <div className="space-y-8">
            <Skeleton className="h-10 w-3/4 mx-auto" /> {/* Title */}
            <Skeleton className="h-6 w-full mx-auto" /> {/* Description */}
            {[1, 2].map(posId => (
                <Card key={posId} className="shadow-lg">
                    <CardHeader>
                        <Skeleton className="h-8 w-1/2" /> {/* Position Title */}
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[1, 2, 3].map(candId => (
                            <div key={candId} className="border rounded-lg p-4 space-y-2">
                                <Skeleton className="h-24 w-24 rounded-full mx-auto" data-ai-hint="person portrait" />
                                <Skeleton className="h-6 w-3/4 mx-auto" /> {/* Candidate Name */}
                                <Skeleton className="h-10 w-full" /> {/* Vote Button */}
                            </div>
                        ))}
                    </CardContent>
                </Card>
            ))}
            <Skeleton className="h-12 w-1/3 mx-auto" /> {/* Submit All Votes Button */}
        </div>
    );
}


export default async function BallotPage({ params }: { params: { roomId: string } }) {
  const room = await getElectionRoomById(params.roomId);

  if (!room) {
    notFound();
  }
  
  // This check also happens in VotingBallot client-side for immediate feedback after email entry,
  // but good to have server-side check too.
  if (room.status === 'closed' || room.status === 'pending') {
    const message = room.status === 'closed' ? 'This election is closed and no longer accepting votes.' : 'This election has not started yet. Please check back later.';
     return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] py-12 text-center">
        <Card className="w-full max-w-md shadow-xl p-6">
            <CardHeader>
                <CardTitle className="text-2xl font-headline">{message}</CardTitle>
            </CardHeader>
            <CardContent>
                <Button asChild variant="outline">
                    <Link href={`/vote/${params.roomId}`}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back
                    </Link>
                </Button>
            </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-8">
      <Suspense fallback={<BallotLoadingSkeleton />}>
        <VotingBallot room={room} />
      </Suspense>
    </div>
  );
}
