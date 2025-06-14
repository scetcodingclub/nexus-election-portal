
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

async function getElectionRoomById(roomId: string): Promise<ElectionRoom | null> {
  const roomRef = doc(db, "electionRooms", roomId);
  const docSnap = await getDoc(roomRef);

  if (!docSnap.exists()) {
    return null;
  }

  const data = docSnap.data();
  if (!data) return null;

  // Convert Firestore Timestamps to ISO strings
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
  
  // Ensure positions and candidates have client-side IDs for RHF if they don't from Firestore
  // This matches the logic in AdminDashboardPage for consistency.
  const positionsRaw = data.positions;
  const positions = Array.isArray(positionsRaw)
    ? positionsRaw.map((p: any) => ({
        id: p?.id || `pos-${Math.random().toString(36).substr(2, 9)}`, // RHF key
        title: p?.title || "Untitled Position",
        candidates: Array.isArray(p?.candidates) ? p.candidates.map((c: any) => ({
          id: c?.id || `cand-${Math.random().toString(36).substr(2, 9)}`, // RHF key
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

  const voterLink = (process.env.NEXT_PUBLIC_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:9002')) + `/vote/${room.id}`;


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
          <CardDescription>Share this room with voters. Ensure your <code className="font-mono bg-muted px-1 rounded">NEXT_PUBLIC_BASE_URL</code> environment variable is set correctly for deployed environments.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ShareableLinkDisplay voterLink={voterLink} />
          <Alert variant="default" className="border-primary/30">
             <QrCode className="h-4 w-4" />
            <AlertTitle>QR Code</AlertTitle>
            <AlertDescription>
              Display a QR code for easy voter access. (A real QR code would replace the placeholder image below).
              <div className="mt-2 p-4 bg-muted rounded flex items-center justify-center">
                 <img src={`https://placehold.co/150x150.png?text=QR+Code`} alt="QR Code Placeholder" data-ai-hint="qr code" />
              </div>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
