
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, notFound } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebaseClient";
import { getElectionRoomById, getVotersForRoom } from "@/lib/electionRoomService";
import type { ElectionRoom, Voter } from "@/lib/types";

import ElectionRoomForm from '@/components/app/admin/ElectionRoomForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, BarChart3, Fingerprint, Users, AlertTriangle, Mail, Send, Upload, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Loading from './loading';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { sendInvite } from "@/ai/flows/sendInviteFlow";


const inviteSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
});

type InviteFormValues = z.infer<typeof inviteSchema>;

export default function ManageElectionRoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.roomId as string;
  const { toast } = useToast();

  const [room, setRoom] = useState<ElectionRoom | null>(null);
  const [voters, setVoters] = useState<Voter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  
  const form = useForm<InviteFormValues>({
    resolver: zodResolver(inviteSchema),
  });
  const { formState: { isSubmitting: isSendingInvite } } = form;

  useEffect(() => {
    if (!roomId) {
        setError("Room ID is missing from the URL.");
        setLoading(false);
        return;
    };
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const [roomData, votersData] = await Promise.all([
            getElectionRoomById(roomId),
            getVotersForRoom(roomId)
          ]);

          if (!roomData) {
            notFound();
            return;
          }
          setRoom(roomData);
          setVoters(votersData);

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

  const refreshVoters = async () => {
    try {
      const votersData = await getVotersForRoom(roomId);
      setVoters(votersData);
    } catch (err) {
      console.error("Failed to refresh voter list:", err);
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: "Could not refresh the voter list. Please reload the page.",
      });
    }
  };

  const onInviteSubmit: SubmitHandler<InviteFormValues> = async (data) => {
    const voterEmail = data.email;
    if (voters.some(v => v.email === voterEmail)) {
      toast({
        variant: "destructive",
        title: "Voter Already Invited",
        description: `${voterEmail} is already in the voter pool for this election.`,
      });
      return;
    }

    try {
        const result = await sendInvite({ roomId, email: voterEmail });
        
        toast({
            title: "Invite Link Generated",
            description: `A unique link has been created for ${voterEmail}. Please send it to them manually.`,
            duration: 9000,
            action: (
              <textarea readOnly value={result.inviteLink} className="w-full h-20 bg-muted text-muted-foreground p-2 rounded-md text-xs" />
            )
        });
        
        await refreshVoters();
        setIsInviteDialogOpen(false);
        form.reset();

    } catch (error: any) {
        console.error("Error sending invite:", error);
        toast({
            variant: "destructive",
            title: "Invitation Failed",
            description: error.message || "Could not generate an invitation link. Please try again.",
        });
    }
  };


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

  const VoterStatusBadge = ({ status }: { status: string }) => {
    switch (status) {
      case 'invited':
        return <Badge variant="secondary">Invited</Badge>;
      case 'waiting':
        return <Badge variant="outline" className="text-amber-500 border-amber-500/50">Waiting</Badge>;
      case 'voting':
        return <Badge variant="default" className="bg-blue-600 hover:bg-blue-700">Voting</Badge>;
      case 'voted':
        return <Badge variant="default" className="bg-green-600 hover:bg-green-700">Voted</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <>
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
            <CardTitle className="text-xl font-headline flex items-center">
                <Fingerprint className="mr-2 h-5 w-5"/>
                Voting Room ID
            </CardTitle>
            <CardDescription>
              This is the unique identifier for your room. Voters will access it via unique email links.
            </CardDescription>
        </CardHeader>
        <CardContent>
             <code className="text-sm bg-muted px-2 py-1 rounded font-mono break-all w-full inline-block">
                {room.id}
             </code>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-headline flex items-center">
            <Users className="mr-2 h-5 w-5" />
            Voter Pool
          </CardTitle>
          <CardDescription>
            Manage the list of voters who are permitted to participate in this election. 
            Send invites to add voters to the pool.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-2 mb-4">
              <Button disabled><Upload className="mr-2 h-4 w-4" /> Upload CSV (Soon)</Button>
               <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
                <DialogTrigger asChild>
                  <Button><Send className="mr-2 h-4 w-4" /> Send Invite</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <form onSubmit={form.handleSubmit(onInviteSubmit)}>
                    <DialogHeader>
                      <DialogTitle>Send Invitation</DialogTitle>
                      <DialogDescription>
                        Enter the email of the voter to send them a unique and secure voting link.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="email" className="text-right">
                          Email
                        </Label>
                        <Input
                          id="email"
                          placeholder="voter@example.com"
                          className="col-span-3"
                          {...form.register("email")}
                        />
                      </div>
                       {form.formState.errors.email && <p className="col-span-4 text-center text-sm text-destructive">{form.formState.errors.email.message}</p>}
                    </div>
                    <DialogFooter>
                      <Button type="submit" disabled={isSendingInvite}>
                        {isSendingInvite && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Generate Invite Link
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
          </div>
          <div className="border rounded-lg">
             {voters.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Voter Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Last Activity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {voters.map((voter) => (
                    <TableRow key={voter.email}>
                      <TableCell className="font-medium">{voter.email}</TableCell>
                      <TableCell><VoterStatusBadge status={voter.status} /></TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">
                        {voter.votedAt ? `Voted: ${format(new Date(voter.votedAt), "PPP p")}` : voter.invitedAt ? `Invited: ${format(new Date(voter.invitedAt), "PPP p")}`: 'N/A'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
                <div className="text-center p-8 text-muted-foreground">
                    <p>No voters have been added to this voter pool yet.</p>
                </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
    </>
  );
}

    