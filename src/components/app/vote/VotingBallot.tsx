"use client";

import type { ElectionRoom, Position, Candidate, Vote } from "@/lib/types";
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

interface VotingBallotProps {
  room: ElectionRoom;
}

export default function VotingBallot({ room }: VotingBallotProps) {
  const [selectedVotes, setSelectedVotes] = useState<Record<string, string>>({}); // positionId: candidateId
  const [isLoading, setIsLoading] = useState(false);
  const [lockedPositions, setLockedPositions] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const router = useRouter();
  const [voterEmail, setVoterEmail] = useState<string | null>(null);

  useEffect(() => {
    const email = localStorage.getItem(`voterEmail-${room.id}`);
    if (!email) {
      // Redirect if email not found, though ideally this is handled by middleware or page guard
      toast({ variant: "destructive", title: "Access Error", description: "Voter email not found. Please start over." });
      router.push(`/vote/${room.id}`);
    } else {
      setVoterEmail(email);
    }
    // Check if already voted (simple local storage check for scaffold)
    const alreadyVoted = localStorage.getItem(`voted-${room.id}-${email}`);
    if (alreadyVoted) {
       router.push(`/vote/${room.id}/thank-you?status=already_voted`);
    }

  }, [room.id, router, toast]);

  const handleVoteChange = (positionId: string, candidateId: string) => {
    if (lockedPositions.has(positionId)) return; // Prevent changing vote if position is locked

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
    
    // Ensure all positions are locked before submitting
    const allLocked = room.positions.every(p => lockedPositions.has(p.id));
    if (!allLocked) {
        toast({
            variant: "destructive",
            title: "Lock All Votes",
            description: "Please lock your selection for each position before submitting the ballot."
        });
        return;
    }


    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    console.log("Submitting votes:", selectedVotes, "for voter:", voterEmail);

    // Mark as voted (simple local storage for scaffold)
    if (voterEmail) {
      localStorage.setItem(`voted-${room.id}-${voterEmail}`, "true");
    }
    
    localStorage.removeItem(`voterEmail-${room.id}`); // Clear email after voting

    toast({
      title: "Votes Submitted!",
      description: "Thank you for participating in the election.",
      className: "bg-primary text-primary-foreground"
    });
    router.push(`/vote/${room.id}/thank-you`);
    setIsLoading(false);
  };

  if (!voterEmail) {
    // Could show a loading spinner or redirect message here
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg">Verifying voter information...</p>
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
                    src={candidate.imageUrl || `https://placehold.co/150x150.png?text=${candidate.name.charAt(0)}`}
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
          </CardContent>
        </Card>
      ))}

      <div className="flex justify-center mt-12">
        <Button
          size="lg"
          onClick={handleSubmitAllVotes}
          disabled={isLoading || room.positions.some(p => !lockedPositions.has(p.id))}
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
       {room.positions.some(p => !lockedPositions.has(p.id)) && (
           <p className="text-center text-sm text-muted-foreground mt-4">
               Please select and lock your vote for all positions before submitting.
           </p>
       )}
    </div>
  );
}
