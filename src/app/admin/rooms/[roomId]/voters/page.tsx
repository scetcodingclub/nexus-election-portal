
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getElectionRoomById, getVotersForRoom } from "@/lib/electionRoomService";
import { ArrowLeft, Users } from "lucide-react";
import { notFound, useParams } from "next/navigation";
import Link from "next/link";
import { format } from 'date-fns';
import { useEffect, useState } from "react";
import type { ElectionRoom } from "@/lib/types";
import { auth } from "@/lib/firebaseClient";
import { onAuthStateChanged } from "firebase/auth";
import { Skeleton } from "@/components/ui/skeleton";

function VoterListSkeleton() {
    return (
        <Card className="shadow-xl">
            <CardHeader>
                <CardTitle className="text-3xl font-headline flex items-center">
                    <Users className="mr-3 h-8 w-8 text-primary" />
                    <Skeleton className="h-8 w-[400px]" />
                </CardTitle>
                <Skeleton className="h-4 w-[300px]" />
            </CardHeader>
            <CardContent>
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
                            {[...Array(3)].map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-5 w-5" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-[250px]" /></TableCell>
                                    <TableCell className="text-right"><Skeleton className="h-5 w-[120px] ml-auto" /></TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    )
}

export default function VoterListPage() {
  const params = useParams();
  const roomId = params.roomId as string;
  
  const [room, setRoom] = useState<ElectionRoom | null>(null);
  const [voters, setVoters] = useState<{email: string; votedAt: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!roomId) return;
    
    // Authenticate first, then fetch data
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const roomData = await getElectionRoomById(roomId);
          if (!roomData) {
            notFound();
            return;
          }
          setRoom(roomData);

          const votersData = await getVotersForRoom(roomId);
          setVoters(votersData);
        } catch (err: any) {
          console.error("Firebase Error:", err);
          if (err.code === 'permission-denied') {
            setError("You do not have permission to view this page. Please ensure you are logged in as an admin.");
          } else {
            setError("Failed to load voter data. Please try again later.");
          }
        } finally {
          setLoading(false);
        }
      } else {
        // Not logged in, show error
        setError("You must be logged in to view this page.");
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [roomId]);


  if (loading) {
    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <Button variant="outline" asChild>
                <Link href={`/admin/rooms/${roomId}/manage`}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Manage Room
                </Link>
            </Button>
            <VoterListSkeleton />
        </div>
    );
  }

  if (error) {
     return (
        <div className="max-w-4xl mx-auto space-y-6">
             <Button variant="outline" asChild>
                <Link href={`/admin/rooms/${roomId}/manage`}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Manage Room
                </Link>
            </Button>
            <Card className="shadow-xl border-destructive">
                <CardHeader>
                    <CardTitle className="text-destructive">Access Denied</CardTitle>
                    <CardDescription>{error}</CardDescription>
                </CardHeader>
                 <CardContent>
                    <Button asChild>
                        <Link href="/admin/login">Go to Login</Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
  }

  if (!room) {
    // This case should be handled by the loading/error states, but as a fallback
    return notFound();
  }

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
