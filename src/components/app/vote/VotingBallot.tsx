
"use client";

import type { ElectionRoom, Voter } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useRouter, notFound } from "next/navigation";
import { CheckCircle, Loader2, Lock, AlertTriangle, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { recordUserVote, getElectionRoomById, getVoter, updateUserStatus } from "@/lib/electionRoomService";
import { Skeleton } from "@/components/ui/skeleton";
import jwt from 'jsonwebtoken';


interface VotingBallotProps {
  roomId: string;
  token: string;
}

function BallotLoadingSkeleton() {
    return (
        <div className="space-y-8">
            <Skeleton className="h-10 w-3/4 mx-auto" /> {/* Title */}
            <Skeleton className="h-6 w-full mx-auto" /> {/* Description */}
            {[1, 2].map(posId => (
                <Card key={posId} className="shadow-lg">
                    <CardHeader>
                        <Skeleton className="h-8 w-1/2" /> {/* Position Title */}
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[1, 2, 3].map(candId => (
                            <div key={candId} className="border rounded-lg p-4 space-y-2">
                                <Skeleton className="h-24 w-24 rounded-full mx-auto" data-ai-hint="person portrait" />
                                <Skeleton className="h-6 w-3/4 mx-auto" /> {/* Candidate Name */}
                                <Skeleton className="h-10 w-full" /> {/* Vote Button */}
                            </div>
                        ))}
                    </CardContent>
                </Card>
            ))}
            <Skeleton className="h-12 w-1/3 mx-auto" /> {/* Submit All Votes Button */}
        </div>
    );
}

export default function VotingBallot({ roomId, token }: VotingBallotProps) {
  const [room, setRoom] = useState<ElectionRoom | null>(null);
  const [voter, setVoter] = useState<Voter | null>(null);
  const [selectedVotes, setSelectedVotes] = useState<Record<string, string>>({}); // positionId: candidateId
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lockedPositions, setLockedPositions] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const router = useRouter();
  
  useEffect(() => {
    async function initializeBallot() {
      try {
        // 1. Verify Token and get voter email
        // In a real app, the secret should be in an environment variable
        const decoded = jwt.verify(token, 'your-super-secret-key-that-is-long-and-secure') as { email: string, roomId: string };
        if (decoded.roomId !== roomId) {
            throw new Error("Token is not valid for this election room.");
        }
        const voterEmail = decoded.email;

        // 2. Fetch voter and room data
        const [voterData, roomData] = await Promise.all([
          getVoter(roomId, voterEmail),
          getElectionRoomById(roomId)
        ]);
        
        if (!voterData) throw new Error("Voter not found in the voter pool.");
        if (!roomData) throw new Error("This voting room could not be found.");

        if (voterData.status === 'voted') {
          router.replace(`/vote/${roomId}/thank-you?status=already_voted`);
          return;
        }

        if (roomData.status !== 'active') {
          const message = roomData.status === 'closed' ? 'This election is closed.' : 'This election has not started yet.';
          throw new Error(message);
        }

        setVoter(voterData);
        setRoom(roomData);
        
        // 3. Update voter status to "voting"
        if (voterData.status !== 'voting') {
            await updateUserStatus(roomId, voterEmail, 'voting');
        }

      } catch (err: any) {
        console.error("Error initializing ballot:", err);
        if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
             setError("Your voting link is invalid or has expired. Please request a new one.");
        } else {
            setError(err.message || "An unexpected error occurred while loading the ballot.");
        }
      } finally {
        setIsInitializing(false);
      }
    }
    
    initializeBallot();

  }, [roomId, token, router]);

  const handleVoteChange = (positionId: string, candidateId: string) => {
    if (lockedPositions.has(positionId)) return;
    setSelectedVotes((prev) => ({ ...prev, [positionId]: candidateId }));
  };

  const handleLockVote = (positionId: string) => {
    if (!selectedVotes[positionId]) {
      toast({ variant: "destructive", title: "No Selection", description: "Please select a candidate for this position before locking."});
      return;
    }
    setLockedPositions(prev => new Set(prev).add(positionId));
    toast({ title: "Vote Locked", description: `Your vote for ${room?.positions.find(p=>p.id === positionId)?.title} is locked.`});
  };

  const handleSubmitAllVotes = async () => {
    if (!room || !voter) return;
    if (Object.keys(selectedVotes).length !== room.positions.length) {
      toast({ variant: "destructive", title: "Incomplete Ballot", description: `Please cast your vote for all ${room.positions.length} positions. You have voted for ${Object.keys(selectedVotes).length}.` });
      return;
    }
    
    const allLocked = room.positions.every(p => lockedPositions.has(p.id));
    if (!allLocked) {
      toast({ variant: "destructive", title: "Lock All Votes", description: "Please lock your selection for each position before submitting the ballot." });
      return;
    }

    setIsLoading(true);
    try {
      await recordUserVote(roomId, voter.email, selectedVotes);
      toast({ title: "Votes Submitted!", description: "Thank you for participating in the election.", className: "bg-primary text-primary-foreground" });
      router.push(`/vote/${roomId}/thank-you`);
    } catch (error) {
      console.error("Error submitting votes:", error);
      toast({ variant: "destructive", title: "Submission Failed", description: "Could not submit your votes. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  if (isInitializing) {
    return <BallotLoadingSkeleton />;
  }
  
  if (error) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] py-12 text-center">
            <Card className="w-full max-w-md shadow-xl p-6 border-destructive">
                <CardHeader>
                    <div className="mx-auto bg-destructive/10 text-destructive p-3 rounded-full w-fit mb-4">
                        <AlertTriangle className="h-10 w-10" />
                    </div>
                    <CardTitle className="text-2xl font-headline">Access Issue</CardTitle>
                    <CardDescription>{error}</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button asChild variant="outline" onClick={() => router.push('/vote')}>
                        <>
                          <ArrowLeft className="mr-2 h-4 w-4" />
                          Return to Voter Access
                        </>
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
  }

  if (!room) return notFound();

  return (
    <div className="space-y-10">
      <div className="text-center">
        <h1 className="text-4xl font-bold font-headline mb-2">{room.title} - Ballot</h1>
        <p className="text-lg text-muted-foreground">{room.description}</p>
      </div>

      {room.positions.map((position) => (
        <Card key={position.id} className={cn("shadow-xl transition-all duration-300", lockedPositions.has(position.id) ? "border-primary ring-2 ring-primary" : "")}>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-2xl font-headline">{position.title}</CardTitle>
              {!lockedPositions.has(position.id) && selectedVotes[position.id] && (
                 <Button onClick={() => handleLockVote(position.id)} size="sm" variant="outline">
                    <Lock className="mr-2 h-4 w-4"/> Lock Vote
                </Button>
              )}
              {lockedPositions.has(position.id) && (
                <div className="flex items-center text-primary text-sm font-medium">
                  <CheckCircle className="mr-2 h-5 w-5"/> Locked
                </div>
              )}
            </div>
            <CardDescription>Select one candidate for this position.</CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={selectedVotes[position.id]}
              onValueChange={(candidateId) => handleVoteChange(position.id, candidateId)}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
              aria-label={`Candidates for ${position.title}`}
              disabled={lockedPositions.has(position.id)}
            >
              {position.candidates.map((candidate) => (
                <Label
                  key={candidate.id}
                  htmlFor={`${position.id}-${candidate.id}`}
                  className={cn(
                    "border rounded-lg p-4 flex flex-col items-center space-y-3 cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary/50",
                    selectedVotes[position.id] === candidate.id && "ring-2 ring-primary border-primary shadow-lg",
                    lockedPositions.has(position.id) && selectedVotes[position.id] !== candidate.id && "opacity-60 cursor-not-allowed",
                    lockedPositions.has(position.id) && selectedVotes[position.id] === candidate.id && "bg-primary/5"
                  )}
                >
                  <Image
                    src={candidate.imageUrl || `https://placehold.co/100x100.png?text=${candidate.name.charAt(0)}`}
                    alt={candidate.name}
                    width={100}
                    height={100}
                    className="rounded-full object-cover aspect-square mb-2 shadow-md"
                    data-ai-hint="person portrait"
                  />
                  <RadioGroupItem
                    value={candidate.id}
                    id={`${position.id}-${candidate.id}`}
                    className="sr-only"
                    aria-label={candidate.name}
                    disabled={lockedPositions.has(position.id)}
                  />
                  <span className="font-medium text-center text-lg">{candidate.name}</span>
                  {selectedVotes[position.id] === candidate.id && !lockedPositions.has(position.id) && (
                     <span className="text-xs text-primary font-semibold">(Selected)</span>
                  )}
                   {selectedVotes[position.id] === candidate.id && lockedPositions.has(position.id) && (
                     <span className="text-xs text-primary font-semibold flex items-center"><Lock className="h-3 w-3 mr-1"/> Voted</span>
                  )}
                </Label>
              ))}
            </RadioGroup>
             {position.candidates.length === 0 && (
                <p className="text-muted-foreground text-center py-4">No candidates available for this position.</p>
            )}
          </CardContent>
        </Card>
      ))}

      <div className="flex justify-center mt-12">
        <Button
          size="lg"
          onClick={handleSubmitAllVotes}
          disabled={isLoading || isInitializing || room.positions.some(p => !lockedPositions.has(p.id))}
          className="min-w-[200px] text-lg py-3 px-6 transition-transform duration-200 hover:scale-105 active:scale-95"
          aria-live="polite"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Submitting...
            </>
          ) : (
            "Submit All Votes"
          )}
        </Button>
      </div>
       {room.positions.some(p => !lockedPositions.has(p.id)) && !isInitializing && (
           <p className="text-center text-sm text-muted-foreground mt-4">
               Please select and lock your vote for all positions before submitting.
           </p>
       )}
    </div>
  );
}
