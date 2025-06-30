
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, notFound } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebaseClient";
import { getElectionRoomById } from "@/lib/electionRoomService";
import type { ElectionRoom } from "@/lib/types";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Download, BarChartHorizontalBig, PieChartIcon, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import ResultsTable from "@/components/app/admin/ResultsTable";
import ResultsCharts from "@/components/app/admin/ResultsCharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ResultsLoading from "./loading";


export default function ElectionResultsPage() {
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
          const roomData = await getElectionRoomById(roomId, { withVoteCounts: true });
          if (!roomData) {
            notFound();
            return;
          }
          setRoom(roomData);
        } catch (err: any) {
          console.error("Failed to fetch results:", err);
           if (err.code === 'permission-denied') {
             setError("You do not have permission to view this page. Please ensure you are logged in as an admin.");
          } else {
            setError("An unexpected error occurred while loading the results. Please try again later.");
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
    return <ResultsLoading />;
  }

  if (error) {
    return (
      <Card className="w-full max-w-2xl mx-auto mt-10 shadow-xl border-destructive">
        <CardHeader className="text-center">
          <div className="mx-auto bg-destructive/10 text-destructive p-3 rounded-full w-fit mb-4">
            <AlertTriangle className="h-10 w-10" />
          </div>
          <CardTitle className="text-2xl">Error Loading Results</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Button asChild>
              <Link href={`/admin/rooms/${roomId}/manage`}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Manage
              </Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!room) {
    return notFound();
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
            <Button variant="outline" asChild className="mb-2 sm:mb-0 sm:mr-4">
            <Link href={`/admin/rooms/${room.id}/manage`}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Manage Voting Room
            </Link>
            </Button>
            <h1 className="text-3xl font-bold font-headline mt-2">Results: {room.title}</h1>
            <p className="text-muted-foreground">{room.description}</p>
        </div>
        <Button disabled className="w-full sm:w-auto">
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
