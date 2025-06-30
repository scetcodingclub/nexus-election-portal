
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, notFound } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebaseClient";
import { getElectionRoomById } from "@/lib/electionRoomService";
import type { ElectionRoom } from "@/lib/types";

import ElectionRoomForm from '@/components/app/admin/ElectionRoomForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, QrCode, BarChart3, Fingerprint, Users, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import ShareableLinkDisplay from '@/components/app/admin/ShareableLinkDisplay';
import Image from 'next/image'; 
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

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:9002');
  const voterLink = `${baseUrl}/vote/${room.id}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(voterLink)}`;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <Button variant="outline" asChild>
          <Link href="/admin/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Panel
          </Link>
        </Button>
        <Button variant="default" asChild>
          <Link href={`/admin/rooms/${room.id}/results`}>
            <BarChart3 className="mr-2 h-4 w-4" /> View Results
          </Link>
        </Button>
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

      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-headline">Access & Sharing</CardTitle>
          <CardDescription>
            Share this room with voters. For the link and QR code to work correctly when your app is deployed,
            ensure your <code className="font-mono bg-muted px-1 rounded">NEXT_PUBLIC_BASE_URL</code> environment variable is set to your app's public URL.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
           <Alert variant="default">
            <Fingerprint className="h-4 w-4" />
            <AlertTitle>Your Voting Room ID</AlertTitle>
            <AlertDescription>
              Voters will need this ID to access the voting room manually. It is also embedded in the shareable link and QR code.
              <div className="mt-2">
                <code className="text-sm bg-muted px-2 py-1 rounded font-mono break-all">
                  {room.id}
                </code>
              </div>
            </AlertDescription>
          </Alert>
          <ShareableLinkDisplay voterLink={voterLink} />
          <Alert variant="default" className="border-primary/30">
             <QrCode className="h-4 w-4" />
            <AlertTitle>QR Code for Voters</AlertTitle>
            <AlertDescription>
              Voters can scan this QR code with their mobile devices to directly access the voting page.
              <div className="mt-2 p-4 bg-muted rounded flex items-center justify-center">
                 <Image 
                    src={qrCodeUrl} 
                    alt={`QR Code for election: ${room.title}`} 
                    width={150} 
                    height={150} 
                    data-ai-hint="qr code election"
                    className="rounded-md"
                  />
              </div>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
