
import VoterEmailForm from '@/components/app/vote/VoterEmailForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getElectionRoomById } from '@/lib/electionRoomService'; // Updated import
import { MailCheck, ArrowLeft } from 'lucide-react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default async function VoterEmailPromptPage({ params }: { params: { roomId: string } }) {
  const room = await getElectionRoomById(params.roomId);

  if (!room) {
    notFound();
  }
  
  if (room.status === 'closed') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] py-12 text-center">
        <Card className="w-full max-w-md shadow-xl p-6">
            <CardHeader>
                <CardTitle className="text-2xl font-headline">Election Closed</CardTitle>
                <CardDescription>The election "{room.title}" is no longer active.</CardDescription>
            </CardHeader>
            <CardContent>
                <Button asChild variant="outline">
                    <Link href="/vote">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Voter Access
                    </Link>
                </Button>
            </CardContent>
        </Card>
      </div>
    );
  }
  
  if (room.status === 'pending') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] py-12 text-center">
        <Card className="w-full max-w-md shadow-xl p-6">
            <CardHeader>
                <CardTitle className="text-2xl font-headline">Election Not Yet Started</CardTitle>
                <CardDescription>The election "{room.title}" has not started yet. Please check back later.</CardDescription>
            </CardHeader>
            <CardContent>
                <Button asChild variant="outline">
                    <Link href="/vote">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Voter Access
                    </Link>
                </Button>
            </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] py-12">
      <Card className="w-full max-w-lg shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto bg-primary/10 text-primary p-3 rounded-full w-fit mb-4">
            <MailCheck className="h-10 w-10" />
          </div>
          <CardTitle className="text-2xl font-headline">Welcome to: {room.title}</CardTitle>
          <CardDescription>
            {room.description}
            <br/>
            {room.isAccessRestricted ? "This room requires an access code. " : ""}
            Please enter your email {room.isAccessRestricted ? "and the access code " : ""}to proceed to the ballot. This helps ensure fair voting.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <VoterEmailForm roomId={room.id} roomAccessCode={room.isAccessRestricted ? room.accessCode : undefined} />
        </CardContent>
      </Card>
    </div>
  );
}
