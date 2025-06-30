"use client";

import { useEffect, useState } from "react";
import { useParams, notFound, useRouter } from "next/navigation";
import type { ElectionRoom } from "@/lib/types";
import { getElectionRoomById } from "@/lib/electionRoomService";

import VoterEmailForm from '@/components/app/vote/VoterEmailForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from "@/components/ui/skeleton";
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { MailCheck, ArrowLeft } from 'lucide-react';

function VoterEmailPromptLoadingSkeleton() {
    return (
        <Card className="w-full max-w-lg shadow-xl">
            <CardHeader className="text-center">
                <Skeleton className="h-16 w-16 rounded-full mx-auto mb-4" />
                <Skeleton className="h-8 w-3/4 mx-auto" />
                <Skeleton className="h-4 w-full mt-2" />
                <Skeleton className="h-4 w-2/3 mt-1 mx-auto" />
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full mt-4" />
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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!roomId) {
      setError("No Room ID provided.");
      setLoading(false);
      return;
    }

    getElectionRoomById(roomId)
      .then(roomData => {
        if (!roomData) {
          // This will be caught by the error state and render notFound()
          setError("Room not found.");
        } else {
          setRoom(roomData);
        }
      })
      .catch(err => {
        console.error("Failed to fetch room:", err);
        setError("Could not load voting room details.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [roomId]);
  
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] py-12">
        <VoterEmailPromptLoadingSkeleton />
      </div>
    );
  }

  if (error || !room) {
    return notFound();
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
            Please enter your email to proceed to the ballot. This helps ensure fair voting.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <VoterEmailForm roomId={room.id} />
        </CardContent>
      </Card>
    </div>
  );
}
