
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getElectionRoomById, getVotersForRoom } from "@/lib/electionRoomService";
import { ArrowLeft, Users } from "lucide-react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { format } from 'date-fns';

export default async function VoterListPage({ params }: { params: { roomId: string } }) {
  const room = await getElectionRoomById(params.roomId);
  if (!room) {
    notFound();
  }

  const voters = await getVotersForRoom(params.roomId);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <Button variant="outline" asChild>
          <Link href={`/admin/rooms/${room.id}/manage`}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Manage Room
          </Link>
        </Button>
      </div>

      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-headline flex items-center">
            <Users className="mr-3 h-8 w-8 text-primary" />
            Voter List for: {room.title}
          </CardTitle>
          <CardDescription>
            This is a list of all individuals who have cast a ballot in this election. 
            A total of {voters.length} vote(s) have been submitted.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {voters.length > 0 ? (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">#</TableHead>
                    <TableHead>Voter Email</TableHead>
                    <TableHead className="text-right">Date Voted</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {voters.map((voter, index) => (
                    <TableRow key={voter.email}>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell>{voter.email}</TableCell>
                      <TableCell className="text-right">{format(new Date(voter.votedAt), "PPP p")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p>No votes have been submitted for this election yet.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
