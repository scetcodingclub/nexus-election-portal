
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebaseClient";
import { getElectionRooms } from "@/lib/electionRoomService";
import type { ElectionRoom } from "@/lib/types";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PlusCircle, Eye, Settings, BarChart3, Users, CalendarDays, LockKeyhole, CheckCircle, Clock, XCircle, AlertTriangle, PenSquare } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';

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

function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <Skeleton className="h-10 w-72" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-56" />
          <Skeleton className="h-10 w-56" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <Skeleton className="h-6 w-3/4 mb-1" />
                <Skeleton className="h-5 w-1/4" />
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </CardHeader>
            <CardContent className="flex-grow space-y-2 text-sm">
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-full" />
            </CardContent>
            <CardFooter className="grid grid-cols-2 gap-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-9 w-full col-span-2 mt-2" />
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const [electionRooms, setElectionRooms] = useState<ElectionRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const rooms = await getElectionRooms();
          setElectionRooms(rooms);
        } catch (err: any) {
          console.error("Failed to fetch election rooms:", err);
          if (err.code === 'permission-denied') {
            setError("You do not have permission to view the dashboard. Please contact support if you believe this is an error.");
          } else {
            setError("An unexpected error occurred while loading the dashboard. Please try again later.");
          }
        } finally {
          setLoading(false);
        }
      } else {
        router.push('/admin/login');
      }
    });
    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return <DashboardSkeleton />;
  }
  
  if (error) {
    return (
      <Card className="w-full max-w-2xl mx-auto mt-10 shadow-xl border-destructive">
        <CardHeader className="text-center">
          <div className="mx-auto bg-destructive/10 text-destructive p-3 rounded-full w-fit mb-4">
            <AlertTriangle className="h-10 w-10" />
          </div>
          <CardTitle className="text-2xl">Error Loading Dashboard</CardTitle>
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

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold font-headline">Voting Panel</h1>
        <div className="flex gap-2">
          <Button asChild variant="secondary">
            <Link href="/admin/rooms/create">
              <PenSquare className="mr-2 h-5 w-5" /> Create New Review Voting Room
            </Link>
          </Button>
          <Button asChild>
            <Link href="/admin/rooms/create">
              <PlusCircle className="mr-2 h-5 w-5" /> Create New Voting Room
            </Link>
          </Button>
        </div>
      </div>

      {electionRooms.length === 0 ? (
        <Card className="text-center py-12">
          <CardHeader>
            <CardTitle className="text-2xl">No Voting Rooms Yet</CardTitle>
            <CardDescription>Get started by creating your first voting room.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild size="lg">
              <Link href="/admin/rooms/create">
                <PlusCircle className="mr-2 h-5 w-5" /> Create Voting Room
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
