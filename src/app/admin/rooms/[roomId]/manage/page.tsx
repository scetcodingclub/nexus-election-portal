
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, notFound } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebaseClient";
import { getElectionRoomById } from "@/lib/electionRoomService";
import type { ElectionRoom } from "@/lib/types";

import ElectionRoomForm from '@/components/app/admin/ElectionRoomForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, BarChart3, AlertTriangle, Users, Eye } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import Loading from './loading';


export default function ManageElectionRoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.roomId as string;

  const [room, setRoom] = useState<ElectionRoom | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!roomId) {
        setError("Room ID is missing from the URL.");
        setLoading(false);
        return;
    };
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const roomData = await getElectionRoomById(roomId);
          if (!roomData) {
            notFound();
            return;
          }
          setRoom(roomData);
        } catch (err: any) {
          console.error("Failed to fetch voting room:", err);
          if (err.code === 'permission-denied') {
             setError("You do not have permission to view this page. Please ensure you are logged in as an admin.");
          } else {
            setError("An unexpected error occurred while loading the page. Please try again later.");
          }
        } finally {
          setLoading(false);
        }
      } else {
        router.push('/admin/login');
      }
    });
    return () => unsubscribe();
  }, [roomId, router]);

  if (loading) {
    return <Loading />;
  }
  
  if (error) {
    return (
      <Card className="w-full max-w-2xl mx-auto mt-10 shadow-xl border-destructive">
        <CardHeader className="text-center">
          <div className="mx-auto bg-destructive/10 text-destructive p-3 rounded-full w-fit mb-4">
            <AlertTriangle className="h-10 w-10" />
          </div>
          <CardTitle className="text-2xl">Error Loading Page</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Button onClick={() => router.push('/admin/login')}>
            Go to Login Page
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!room) {
    return notFound(); 
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <Button variant="outline" asChild>
          <Link href="/admin/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Panel
          </Link>
        </Button>
        <div className="flex gap-2">
           <Button variant="outline" asChild>
              <Link href={`/admin/rooms/${room.id}/preview`} target="_blank">
                <Eye className="mr-2 h-4 w-4" /> Preview
              </Link>
            </Button>
            <Button variant="default" asChild>
              <Link href={`/admin/rooms/${room.id}/results`}>
                <BarChart3 className="mr-2 h-4 w-4" /> View Results
              </Link>
            </Button>
        </div>
      </div>
      
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-headline">Manage: {room.title}</CardTitle>
          <CardDescription>Edit details, positions, candidates, and manage access for this voting room.</CardDescription>
        </CardHeader>
        <CardContent>
          <ElectionRoomForm initialData={room} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-headline">Voter Participation</CardTitle>
          <CardDescription>
            View the list of emails for everyone who has cast a ballot in this election.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href={`/admin/rooms/${room.id}/voters`}>
              <Users className="mr-2 h-4 w-4" /> View Voter List
            </Link>
          </Button>
        </CardContent>
      </Card>

    </div>
  );
}
