
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ElectionRoom } from "@/lib/types";
import { ArrowLeft, Download, BarChartHorizontalBig, PieChartIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { notFound } from 'next/navigation';
import ResultsTable from "@/components/app/admin/ResultsTable";
import ResultsCharts from "@/components/app/admin/ResultsCharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { db } from "@/lib/firebaseClient";
import { doc, getDoc, Timestamp } from "firebase/firestore";

async function getElectionRoomById(roomId: string): Promise<ElectionRoom | null> {
  const roomRef = doc(db, "electionRooms", roomId);
  const docSnap = await getDoc(roomRef);

  if (!docSnap.exists()) {
    return null;
  }

  const data = docSnap.data();
  // Convert Firestore Timestamps to ISO strings
  const createdAt = data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : new Date().toISOString();
  const updatedAt = data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : undefined;
  
  const positions = data.positions.map((p: any) => ({
    id: p.id || `pos-${Math.random().toString(36).substr(2, 9)}`,
    title: p.title,
    candidates: p.candidates.map((c: any) => ({
      id: c.id || `cand-${Math.random().toString(36).substr(2, 9)}`,
      name: c.name,
      imageUrl: c.imageUrl || '',
      voteCount: c.voteCount || 0, // Ensure voteCount is present
    })),
  }));

  return {
    id: docSnap.id,
    title: data.title,
    description: data.description,
    isAccessRestricted: data.isAccessRestricted,
    accessCode: data.accessCode,
    positions: positions,
    createdAt: createdAt,
    updatedAt: updatedAt,
    status: data.status as ElectionRoom['status'],
  };
}


export default async function ElectionResultsPage({ params }: { params: { roomId: string } }) {
  const room = await getElectionRoomById(params.roomId);

  if (!room) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
            <Button variant="outline" asChild className="mb-2 sm:mb-0 sm:mr-4">
            <Link href={`/admin/rooms/${room.id}/manage`}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Manage Room
            </Link>
            </Button>
            <h1 className="text-3xl font-bold font-headline mt-2">Results: {room.title}</h1>
            <p className="text-muted-foreground">{room.description}</p>
        </div>
        <Button disabled className="w-full sm:w-auto"> {/* PDF Export is complex */}
          <Download className="mr-2 h-4 w-4" /> Export as PDF (Coming Soon)
        </Button>
      </div>

      {room.status !== 'closed' && (
        <Card className="border-primary bg-primary/5">
            <CardHeader>
                <CardTitle>Election In Progress or Pending</CardTitle>
                <CardDescription>
                    This election is currently '{room.status}'. Results shown are based on current votes and may change.
                    Final results will be available once the election is closed.
                </CardDescription>
            </CardHeader>
        </Card>
      )}
      
      <Tabs defaultValue="charts" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:w-auto md:inline-flex mb-4">
          <TabsTrigger value="charts" className="text-sm md:text-base"><PieChartIcon className="mr-2 h-4 w-4"/> Charts View</TabsTrigger>
          <TabsTrigger value="table" className="text-sm md:text-base"><BarChartHorizontalBig className="mr-2 h-4 w-4"/>Table View</TabsTrigger>
        </TabsList>
        <TabsContent value="charts">
          <ResultsCharts positions={room.positions} />
        </TabsContent>
        <TabsContent value="table">
            <Card>
                <CardHeader>
                    <CardTitle>Detailed Results Table</CardTitle>
                    <CardDescription>Comprehensive breakdown of votes for each candidate and position.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ResultsTable positions={room.positions} />
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>

    </div>
  );
}
