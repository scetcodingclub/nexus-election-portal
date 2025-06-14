
"use client";

import type { ElectionRoom } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { CheckCircle, Loader2, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { checkUserHasVoted, recordUserVote } from "@/lib/electionRoomService";

interface VotingBallotProps {
  room: ElectionRoom;
}

export default function VotingBallot({ room }: VotingBallotProps) {
  const [selectedVotes, setSelectedVotes] = useState<Record<string, string>>({}); // positionId: candidateId
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [lockedPositions, setLockedPositions] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const router = useRouter();
  const [voterEmail, setVoterEmail] = useState<string | null>(null);

  useEffect(() => {
    const email = localStorage.getItem(`voterEmail-${room.id}`);
    if (!email) {
      toast({ variant: "destructive", title: "Access Error", description: "Voter email not found. Please start over by entering your email again." });
      router.push(`/vote/${room.id}`);
      return;
    }
    setVoterEmail(email);

    async function verifyVoter() {
      try {
        const hasVoted = await checkUserHasVoted(room.id, email!);
        if (hasVoted) {
          router.replace(`/vote/${room.id}/thank-you?status=already_voted`);
        } else if (room.status !== 'active') {
          const message = room.status === 'closed' ? 'This election is closed.' : 'This election has not started yet.';
          toast({ variant: "destructive", title: "Election Not Active", description: message });
          router.replace(`/vote/${room.id}`);
        }
      } catch (error) {
        console.error("Error checking voter status:", error);
        toast({ variant: "destructive", title: "Verification Error", description: "Could not verify your voting status. Please try again." });
        router.push(`/vote/${room.id}`);
      } finally {
        setIsVerifying(false);
      }
    }
    
    if (email) {
        verifyVoter();
    }

  }, [room.id, room.status, router, toast]);

  const handleVoteChange = (positionId: string, candidateId: string) => {
    if (lockedPositions.has(positionId)) return;

    setSelectedVotes((prev) => ({
      ...prev,
      [positionId]: candidateId,
    }));
  };

  const handleLockVote = (positionId: string) => {
    if (!selectedVotes[positionId]) {
      toast({ variant: "destructive", title: "No Selection", description: "Please select a candidate for this position before locking."});
      return;
    }
    setLockedPositions(prev => new Set(prev).add(positionId));
    toast({ title: "Vote Locked", description: `Your vote for ${room.positions.find(p=>p.id === positionId)?.title} is locked.`});
  };

  const handleSubmitAllVotes = async () => {
    if (Object.keys(selectedVotes).length !== room.positions.length) {
      toast({
        variant: "destructive",
        title: "Incomplete Ballot",
        description: `Please cast your vote for all ${room.positions.length} positions. You have voted for ${Object.keys(selectedVotes).length}.`,
      });
      return;
    }
    
    const allLocked = room.positions.every(p => lockedPositions.has(p.id));
    if (!allLocked) {
        toast({
            variant: "destructive",
            title: "Lock All Votes",
            description: "Please lock your selection for each position before submitting the ballot."
        });
        return;
    }

    if (!voterEmail) {
        toast({ variant: "destructive", title: "Error", description: "Voter identification missing. Please restart the voting process." });
        router.push(`/vote/${room.id}`);
        return;
    }

    setIsLoading(true);
    try {
      // Final check before recording vote
      const hasVoted = await checkUserHasVoted(room.id, voterEmail);
      if (hasVoted) {
        router.push(`/vote/${room.id}/thank-you?status=already_voted`);
        setIsLoading(false);
        return;
      }

      await recordUserVote(room.id, voterEmail, selectedVotes);
      
      localStorage.removeItem(`voterEmail-${room.id}`); 

      toast({
        title: "Votes Submitted!",
        description: "Thank you for participating in the election.",
        className: "bg-primary text-primary-foreground"
      });
      router.push(`/vote/${room.id}/thank-you`);
    } catch (error) {
      console.error("Error submitting votes:", error);
      toast({ variant: "destructive", title: "Submission Failed", description: "Could not submit your votes. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  if (isVerifying || !voterEmail) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg mt-4">Verifying voter information and election status...</p>
      </div>
    );
  }

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
                    value={candidate.id} // Use candidate.id from Firestore data
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
          disabled={isLoading || isVerifying || room.positions.some(p => !lockedPositions.has(p.id))}
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
       {room.positions.some(p => !lockedPositions.has(p.id)) && !isVerifying && (
           <p className="text-center text-sm text-muted-foreground mt-4">
               Please select and lock your vote for all positions before submitting.
           </p>
       )}
    </div>
  );
}
