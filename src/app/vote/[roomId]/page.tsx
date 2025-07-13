
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import VoterEmailForm from "@/components/app/vote/VoterEmailForm";
import { useParams, useRouter, notFound } from "next/navigation";
import { useEffect, useState } from "react";
import { getElectionRoomById } from "@/lib/electionRoomService";
import { Skeleton } from "@/components/ui/skeleton";
import type { ElectionRoom } from "@/lib/types";

function VoterEmailPromptSkeleton() {
    return (
        <Card className="w-full max-w-lg shadow-xl">
            <CardHeader className="text-center">
                 <Skeleton className="h-10 w-10 rounded-full mx-auto mb-4" />
                 <Skeleton className="h-8 w-3/4 mx-auto" />
                 <Skeleton className="h-4 w-full mx-auto mt-2" />
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                </div>
            </CardContent>
        </Card>
    );
}

export default function VoterEmailPromptPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.roomId as string;
  const [room, setRoom] = useState<ElectionRoom | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRoomDetails = async () => {
      if (!roomId) return;
      try {
        const roomData = await getElectionRoomById(roomId);
        if (!roomData) {
          notFound();
          return;
        }
        if (roomData.status !== 'active') {
          // Handle cases where the election is not active
          alert(`This election is currently ${roomData.status} and not open for voting.`);
          router.push('/');
          return;
        }
        setRoom(roomData);
      } catch (error) {
        console.error("Failed to fetch room details:", error);
        alert("Could not load election details. Please try again later.");
        router.push('/');
      } finally {
        setLoading(false);
      }
    };
    fetchRoomDetails();
  }, [roomId, router]);

  if (loading) {
    return (
       <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] py-12">
           <VoterEmailPromptSkeleton />
       </div>
    );
  }

  if (!room) {
    return notFound();
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] py-12">
      <Card className="w-full max-w-lg shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-headline">Join Election: {room.title}</CardTitle>
          <CardDescription>
            {room.description}
            <br />
            Please enter your email to cast your vote.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <VoterEmailForm roomId={roomId} />
        </CardContent>
      </Card>
    </div>
  );
}
