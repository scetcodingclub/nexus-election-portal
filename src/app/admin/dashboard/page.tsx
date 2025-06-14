
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { ElectionRoom } from "@/lib/types";
import { PlusCircle, Eye, Settings, BarChart3, Users, CalendarDays, LockKeyhole, CheckCircle, Clock, XCircle } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';
import { db } from "@/lib/firebaseClient";
import { collection, getDocs, query, orderBy, Timestamp } from "firebase/firestore";

function StatusBadge({ status }: { status: ElectionRoom['status'] }) {
  switch (status) {
    case 'active':
      return <Badge variant="default" className="bg-green-600 hover:bg-green-700"><CheckCircle className="mr-1 h-3 w-3" /> Active</Badge>;
    case 'pending':
      return <Badge variant="secondary"><Clock className="mr-1 h-3 w-3" /> Pending</Badge>;
    case 'closed':
      return <Badge variant="outline"><XCircle className="mr-1 h-3 w-3" /> Closed</Badge>;
    default:
      return <Badge variant="outline">Unknown</Badge>;
  }
}

async function getElectionRooms(): Promise<ElectionRoom[]> {
  const electionRoomsCol = collection(db, "electionRooms");
  const q = query(electionRoomsCol, orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => {
    const data = doc.data();
    if (!data) {
      // This case should ideally not happen if a document exists
      return {
        id: doc.id,
        title: "Error: Missing Data",
        description: "Document data is unexpectedly missing.",
        isAccessRestricted: false,
        accessCode: undefined,
        positions: [],
        createdAt: new Date().toISOString(),
        status: 'pending' as ElectionRoom['status'],
      };
    }

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
      ? positionsRaw.map((p: any) => {
          const candidatesRaw = p?.candidates;
          return {
            id: p?.id || `pos-${Math.random().toString(36).substr(2, 9)}`,
            title: p?.title || "Untitled Position",
            candidates: Array.isArray(candidatesRaw)
              ? candidatesRaw.map((c: any) => ({
                  id: c?.id || `cand-${Math.random().toString(36).substr(2, 9)}`,
                  name: c?.name || "Unnamed Candidate",
                  imageUrl: c?.imageUrl || '',
                  voteCount: c?.voteCount || 0,
                }))
              : [],
          };
        })
      : [];

    return {
      id: doc.id,
      title: data.title || "Untitled Election",
      description: data.description || "No description provided.",
      isAccessRestricted: data.isAccessRestricted === true, // Ensure boolean
      accessCode: data.accessCode || undefined,
      positions: positions,
      createdAt: createdAt,
      updatedAt: updatedAt,
      status: (data.status as ElectionRoom['status']) || 'pending',
    };
  });
}


export default async function AdminDashboardPage() {
  const electionRooms = await getElectionRooms();

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold font-headline">Admin Dashboard</h1>
        <Button asChild>
          <Link href="/admin/rooms/create">
            <PlusCircle className="mr-2 h-5 w-5" /> Create New Election Room
          </Link>
        </Button>
      </div>

      {electionRooms.length === 0 ? (
        <Card className="text-center py-12">
          <CardHeader>
            <CardTitle className="text-2xl">No Election Rooms Yet</CardTitle>
            <CardDescription>Get started by creating your first election room.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild size="lg">
              <Link href="/admin/rooms/create">
                <PlusCircle className="mr-2 h-5 w-5" /> Create Election Room
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {electionRooms.map((room) => (
            <Card key={room.id} className="flex flex-col hover:shadow-lg transition-shadow duration-300">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xl font-headline mb-1">{room.title}</CardTitle>
                  <StatusBadge status={room.status} />
                </div>
                <CardDescription className="text-sm line-clamp-2">{room.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center">
                  <Users className="mr-2 h-4 w-4 text-primary" /> {room.positions.reduce((acc, p) => acc + p.candidates.length, 0)} Candidates across {room.positions.length} Positions
                </div>
                <div className="flex items-center">
                  <CalendarDays className="mr-2 h-4 w-4 text-primary" /> Created: {format(new Date(room.createdAt), "PPP")}
                </div>
                {room.isAccessRestricted && (
                  <div className="flex items-center">
                    <LockKeyhole className="mr-2 h-4 w-4 text-primary" /> Access Restricted
                  </div>
                )}
              </CardContent>
              <CardFooter className="grid grid-cols-2 gap-2">
                <Button variant="outline" asChild className="w-full">
                  <Link href={`/admin/rooms/${room.id}/manage`}>
                    <Settings className="mr-2 h-4 w-4" /> Manage
                  </Link>
                </Button>
                <Button variant="default" asChild className="w-full">
                  <Link href={`/admin/rooms/${room.id}/results`}>
                    <BarChart3 className="mr-2 h-4 w-4" /> Results
                  </Link>
                </Button>
                 <Button variant="ghost" asChild className="w-full col-span-2 mt-2">
                  <Link href={`/vote/${room.id}`} target="_blank" rel="noopener noreferrer">
                    <Eye className="mr-2 h-4 w-4" /> Voter View
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
