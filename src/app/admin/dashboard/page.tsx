
"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebaseClient";
import { getElectionRooms, deleteElectionRoom } from "@/lib/electionRoomService";
import type { ElectionRoom } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { PlusCircle, Eye, Settings, BarChart3, Users, CalendarDays, LockKeyhole, CheckCircle, Clock, XCircle, AlertTriangle, PenSquare, Vote, Star, Trash2, Loader2 } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';
import { cn } from "@/lib/utils";

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

function RoomTypeBadge({ type }: { type: ElectionRoom['roomType'] }) {
  if (type === 'review') {
    return (
      <Badge variant="outline" className="text-purple-600 border-purple-500/50">
        <Star className="mr-1 h-3 w-3" /> REVIEW
      </Badge>
    );
  }
  // Default to voting for existing or unspecified rooms
  return (
    <Badge variant="outline" className="text-primary border-primary/50">
      <Vote className="mr-1 h-3 w-3" /> VOTING
    </Badge>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
        <Skeleton className="h-10 w-56" />
        <Skeleton className="h-10 w-56" />
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
  const { toast } = useToast();

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState<ElectionRoom | null>(null);
  const [deletePassword, setDeletePassword] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const rooms = await getElectionRooms();
          setElectionRooms(rooms);
        } catch (err: any) {
          console.error("Failed to fetch election rooms:", err);
          if (err.code === 'permission-denied') {
            setError("You do not have permission to view the panel. Please contact support if you believe this is an error.");
          } else {
            setError("An unexpected error occurred while loading the panel. Please try again later.");
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

  const openDeleteDialog = (room: ElectionRoom) => {
    if (!room.deletionPassword) {
        toast({
            variant: "destructive",
            title: "Deletion Not Set Up",
            description: "This room doesn't have a deletion password configured. Please set one in the 'Manage' page first.",
        });
        return;
    }
    setRoomToDelete(room);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async (e: FormEvent) => {
    e.preventDefault();
    if (!roomToDelete) return;

    setIsDeleting(true);
    const result = await deleteElectionRoom(roomToDelete.id, deletePassword);
    
    if (result.success) {
      toast({
        title: "Room Deleted",
        description: `"${roomToDelete.title}" has been successfully deleted.`,
      });
      setElectionRooms(rooms => rooms.filter(r => r.id !== roomToDelete.id));
      setIsDeleteDialogOpen(false);
      setRoomToDelete(null);
      setDeletePassword("");
    } else {
      toast({
        variant: "destructive",
        title: "Deletion Failed",
        description: result.message,
      });
    }
    setIsDeleting(false);
  };

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
          <CardTitle className="text-2xl">Error Loading Panel</CardTitle>
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
    <>
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
        <Button asChild variant="secondary">
          <Link href="/admin/rooms/create-review">
            <PenSquare className="mr-2 h-5 w-5" /> Create New Review Room
          </Link>
        </Button>
        <Button asChild>
          <Link href="/admin/rooms/create">
            <PlusCircle className="mr-2 h-5 w-5" /> Create New Voting Room
          </Link>
        </Button>
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
            <Card 
              key={room.id} 
              className={cn(
                "flex flex-col hover:shadow-xl transition-all duration-300 border-2",
                 room.roomType === 'review' 
                    ? "border-purple-500/40 hover:border-purple-500/60 bg-purple-500/5" 
                    : "border-primary/40 hover:border-primary/60 bg-primary/5"
              )}
            >
              <CardHeader>
                 <div className="flex justify-between items-start gap-2">
                  <CardTitle className="text-xl font-headline mb-1 flex-grow">{room.title}</CardTitle>
                  <div className="flex-shrink-0 flex flex-col items-end gap-2">
                    <div className="flex items-center gap-2">
                      <StatusBadge status={room.status} />
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => openDeleteDialog(room)}>
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete Room</span>
                      </Button>
                    </div>
                    <RoomTypeBadge type={room.roomType} />
                  </div>
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

    <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the room 
            <span className="font-bold"> "{roomToDelete?.title}" </span> 
            and all of its data. To proceed, please enter the deletion password.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <form onSubmit={handleConfirmDelete}>
          <div className="space-y-2 my-4">
              <Label htmlFor="delete-password">Deletion Password</Label>
              <Input
                  id="delete-password"
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="Enter deletion password"
                  autoFocus
              />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setRoomToDelete(null); setDeletePassword(""); }}>Cancel</AlertDialogCancel>
            <AlertDialogAction type="submit" disabled={isDeleting || !deletePassword}>
               {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
               Confirm Deletion
            </AlertDialogAction>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
