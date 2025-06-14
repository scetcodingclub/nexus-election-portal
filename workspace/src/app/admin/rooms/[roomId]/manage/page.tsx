
import ElectionRoomForm from '@/components/app/admin/ElectionRoomForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, QrCode, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { notFound } from 'next/navigation';
import { db } from "@/lib/firebaseClient";
import { doc, getDoc, Timestamp } from "firebase/firestore";
import type { ElectionRoom } from '@/lib/types';
import ShareableLinkDisplay from '@/components/app/admin/ShareableLinkDisplay';
import Image from 'next/image'; 

async function getElectionRoomById(roomId: string): Promise<ElectionRoom | null> {
  const roomRef = doc(db, "electionRooms", roomId);
  const docSnap = await getDoc(roomRef);

  if (!docSnap.exists()) {
    return null;
  }

  const data = docSnap.data();
  if (!data) return null;

  const createdAtRaw = data.createdAt;
  const updatedAtRaw = data.updatedAt;

  const createdAt = createdAtRaw instanceof Timestamp
    ? createdAtRaw.toDate().toISOString()
    : typeof createdAtRaw === 'string'
    ? createdAtRaw 
    : new Date().toISOString(); 

  const updatedAt = updatedAtRaw instanceof Timestamp
    ? updatedAtRaw.toDate().toISOString()
    : typeof updatedAtRaw === 'string'
    ? updatedAtRaw
    : undefined;
  
  const positionsRaw = data.positions;
  const positions = Array.isArray(positionsRaw)
    ? positionsRaw.map((p: any) => ({
        id: p?.id || `pos-${Math.random().toString(36).substr(2, 9)}`,
        title: p?.title || "Untitled Position",
        candidates: Array.isArray(p?.candidates) ? p.candidates.map((c: any) => ({
          id: c?.id || `cand-${Math.random().toString(36).substr(2, 9)}`,
          name: c?.name || "Unnamed Candidate",
          imageUrl: c?.imageUrl || '',
          voteCount: c?.voteCount || 0,
        })) : [],
      }))
    : [];


  return {
    id: docSnap.id,
    title: data.title || "Untitled Election Room",
    description: data.description || "No description.",
    isAccessRestricted: data.isAccessRestricted === true,
    accessCode: data.accessCode || undefined,
    positions: positions,
    createdAt: createdAt,
    updatedAt: updatedAt,
    status: (data.status as ElectionRoom['status']) || 'pending',
  };
}


export default async function ManageElectionRoomPage({ params }: { params: { roomId: string } }) {
  const room = await getElectionRoomById(params.roomId);

  if (!room) {
    notFound(); 
  }

  // Determine base URL:
  // 1. Use NEXT_PUBLIC_BASE_URL if set (ideal for deployed environments)
  // 2. Fallback to window.location.origin if on client-side (covers cases where NEXT_PUBLIC_BASE_URL might not be set during dev client navigation)
  // 3. Final fallback to localhost:9002 for SSR in dev if NEXT_PUBLIC_BASE_URL is not set (e.g. initial .env not present)
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:9002');
  const voterLink = `${baseUrl}/vote/${room.id}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(voterLink)}`;


  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <Button variant="outline" asChild>
          <Link href="/admin/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
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
          <CardDescription>Edit details, positions, candidates, and manage access for this election room.</CardDescription>
        </CardHeader>
        <CardContent>
          <ElectionRoomForm initialData={room} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-headline">Access & Sharing</CardTitle>
          <CardDescription>
            Share this room with voters. For the link and QR code to work correctly when your app is deployed and accessible to others on the internet, 
            ensure your <code className="font-mono bg-muted px-1 rounded">NEXT_PUBLIC_BASE_URL</code> environment variable is set to your app's public URL in your hosting environment.
            For local development, this is typically <code className="font-mono bg-muted px-1 rounded">http://localhost:9002</code>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
