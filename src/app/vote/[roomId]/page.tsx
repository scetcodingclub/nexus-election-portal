
"use client";

import { useEffect, useState } from "react";
import { useParams, notFound, useRouter } from "next/navigation";
import { getElectionRoomById, submitBallot, submitReview } from "@/lib/electionRoomService";
import type { ElectionRoom, Position } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Check, Send, ArrowRight, ArrowLeft, ThumbsUp, ThumbsDown, Loader2 } from "lucide-react";
import StarRating from "@/components/app/StarRating";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

function VotingSkeleton() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Skeleton className="h-10 w-1/3" />
      <Skeleton className="h-5 w-2/3" />
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent className="space-y-8">
          {[1, 2].map(i => (
            <div key={i}>
              <Skeleton className="h-5 w-1/4 mb-4" />
              <div className="space-y-4">
                <div className="flex items-center space-x-4 p-4 border rounded-md">
                  <Skeleton className="h-16 w-16 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
      <Skeleton className="h-12 w-full" />
    </div>
  );
}

const VotingPositionCard = ({
  position,
  onVote,
  selection,
}: {
  position: Position;
  onVote: (candidateId: string) => void;
  selection: string | null;
}) => (
  <Card key={position.id}>
    <CardHeader>
      <CardTitle className="text-xl sm:text-2xl">{position.title}</CardTitle>
      <CardDescription>Select one candidate for this position.</CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      {position.candidates.map((candidate) => {
        const isSelected = selection === candidate.id;
        return (
          <Button
            key={candidate.id}
            variant="outline"
            className={cn(
              "w-full h-auto p-3 sm:p-4 justify-start text-left flex items-center gap-4 transition-all",
              isSelected && "border-primary ring-2 ring-primary bg-primary/5"
            )}
            onClick={() => onVote(candidate.id)}
          >
            <div className="flex-shrink-0">
              {isSelected ? (
                <ThumbsUp className="h-6 w-6 text-primary" />
              ) : (
                <ThumbsDown className="h-6 w-6 text-muted-foreground" />
              )}
            </div>
            <Image
              src={candidate.imageUrl || `https://placehold.co/100x100.png?text=${candidate.name.charAt(0)}`}
              alt={candidate.name}
              width={56}
              height={56}
              className="rounded-full object-cover w-12 h-12 sm:w-14 sm:h-14"
              data-ai-hint="person portrait"
            />
            <span className="font-semibold text-base sm:text-lg flex-grow">{candidate.name}</span>
          </Button>
        );
      })}
    </CardContent>
  </Card>
);

const SingleCandidatePositionCard = ({
  position,
  onVote,
  selection,
}: {
  position: Position;
  onVote: (vote: string | null) => void;
  selection: string | null;
}) => {
  const candidate = position.candidates[0];
  const isVotedFor = selection === candidate.id;

  const handleToggleVote = () => {
    const newSelection = isVotedFor ? null : candidate.id;
    onVote(newSelection);
  };

  return (
    <Card key={position.id}>
      <CardHeader>
        <CardTitle className="text-xl sm:text-2xl">{position.title}</CardTitle>
        <CardDescription>Click the card to vote for this candidate, or click again to abstain.</CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          key={candidate.id}
          variant="outline"
          className={cn(
            "w-full h-auto p-3 sm:p-4 justify-start text-left flex items-center gap-4 transition-all",
            isVotedFor && "border-green-600 ring-2 ring-green-600 bg-green-600/5"
          )}
          onClick={handleToggleVote}
        >
          <div className="flex-shrink-0">
            {isVotedFor ? (
              <ThumbsUp className="h-6 w-6 text-green-600" />
            ) : (
              <ThumbsDown className="h-6 w-6 text-muted-foreground" />
            )}
          </div>
          <Image
              src={candidate.imageUrl || `https://placehold.co/100x100.png?text=${candidate.name.charAt(0)}`}
              alt={candidate.name}
              width={56}
              height={56}
              className="rounded-full object-cover w-12 h-12 sm:w-14 sm:h-14"
              data-ai-hint="person portrait"
          />
          <span className="font-semibold text-base sm:text-lg flex-grow">{candidate.name}</span>
        </Button>
      </CardContent>
    </Card>
  );
};


const ReviewPositionCard = ({ 
  position,
  onSelectionChange,
  selection,
}: { 
  position: Position,
  onSelectionChange: (update: { rating?: number; feedback?: string }) => void,
  selection: { rating: number, feedback: string },
}) => (
  <Card key={position.id}>
    <CardHeader>
      <CardTitle className="text-xl sm:text-2xl">{position.title}: {position.candidates[0]?.name}</CardTitle>
      <CardDescription>Provide your feedback and rating.</CardDescription>
    </CardHeader>
    <CardContent className="space-y-6">
      <div>
        <Label className="mb-2 block text-center sm:text-left">Rating</Label>
        <div className="flex flex-col items-center gap-2">
            <StarRating rating={selection.rating} onRatingChange={(rating) => onSelectionChange({ rating })} />
            <span className="font-bold text-lg w-24 text-center bg-muted rounded-md py-1">{selection.rating} / 5</span>
        </div>
      </div>
      <div>
        <Label htmlFor={`feedback-${position.id}`}>Feedback (Required)</Label>
        <Textarea 
          id={`feedback-${position.id}`}
          placeholder="Enter your detailed feedback here..." 
          className="mt-2"
          value={selection.feedback}
          onChange={(e) => onSelectionChange({ feedback: e.target.value })}
          rows={5}
          required
        />
      </div>
    </CardContent>
  </Card>
);

export default function VotingPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.roomId as string;
  const { toast } = useToast();

  const [room, setRoom] = useState<ElectionRoom | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPositionIndex, setCurrentPositionIndex] = useState(0);
  const [selections, setSelections] = useState<Record<string, any>>({});
  const [voterEmail, setVoterEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionComplete, setSubmissionComplete] = useState(false);

  useEffect(() => {
    if (roomId) {
      getElectionRoomById(roomId)
        .then(data => {
          if (!data) {
            setError("The room you are trying to access does not exist.");
          } else if (data.status !== 'active') {
             setError(`This room is currently ${data.status} and not open for participation.`);
          }
          else {
            setRoom(data);
            const initialSelections: Record<string, any> = {};
            if (data.roomType === 'review') {
              data.positions.forEach(p => {
                initialSelections[p.id] = { rating: 0, feedback: '' };
              });
            } else {
              data.positions.forEach(p => {
                  initialSelections[p.id] = null;
              });
            }
            setSelections(initialSelections);
          }
        })
        .catch(err => {
          console.error("Failed to fetch room:", err);
          setError("An error occurred while fetching the room details.");
        })
        .finally(() => setLoading(false));
    }
  }, [roomId]);
  
  const handleVoteSelection = (selectionValue: any) => {
    if (!room) return;
    const positionId = room.positions[currentPositionIndex].id;
    setSelections(prev => ({ ...prev, [positionId]: selectionValue }));

    if (room.roomType === 'voting' && room.positions[currentPositionIndex].candidates.length > 1) {
      setTimeout(() => {
        if (currentPositionIndex < room.positions.length - 1) {
          setCurrentPositionIndex(currentPositionIndex + 1);
        }
      }, 300);
    }
  };

  const handleReviewSelection = (update: { rating?: number; feedback?: string }) => {
    if (!room) return;
    const positionId = room.positions[currentPositionIndex].id;
    setSelections(prev => ({
      ...prev,
      [positionId]: { ...prev[positionId], ...update }
    }));
  };

  const handleNext = () => {
    if (!room || currentPositionIndex >= room.positions.length - 1) return;
    if (room.roomType === 'review') {
      const currentPositionId = room.positions[currentPositionIndex].id;
      const currentReview = selections[currentPositionId];
      if (!currentReview || currentReview.rating === 0) {
        toast({ variant: "destructive", title: "Incomplete", description: "Please provide a star rating before proceeding." });
        return;
      }
      if (!currentReview.feedback || currentReview.feedback.trim() === '') {
        toast({ variant: "destructive", title: "Incomplete", description: "Please provide written feedback before proceeding." });
        return;
      }
    }
    setCurrentPositionIndex(currentPositionIndex + 1);
  };

  const handleBack = () => {
    if (currentPositionIndex <= 0) return;
    setCurrentPositionIndex(currentPositionIndex - 1);
  };
  
  const handleSubmit = async () => {
    if (!room || !voterEmail) {
        toast({ variant: "destructive", title: "Missing Information", description: "Please enter your email to submit." });
        return;
    }
    setIsSubmitting(true);
    let result;
    if (room.roomType === 'review') {
      result = await submitReview(roomId, voterEmail, selections);
    } else {
      result = await submitBallot(roomId, voterEmail, selections);
    }

    if (result.success) {
      setSubmissionComplete(true);
    } else {
      toast({ variant: "destructive", title: "Submission Failed", description: result.message });
    }
    setIsSubmitting(false);
  };

  if (loading) return <VotingSkeleton />;
  if (error) {
    return (
        <div className="max-w-2xl mx-auto text-center py-10">
            <Card className="border-destructive">
                <CardHeader>
                    <CardTitle>Error</CardTitle>
                    <CardDescription>{error}</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button onClick={() => router.push('/vote')}>Go Back</Button>
                </CardContent>
            </Card>
        </div>
    );
  }
  if (!room) return notFound();

  if (submissionComplete) {
    return (
        <div className="max-w-2xl mx-auto text-center py-10">
            <Card>
                <CardHeader>
                    <div className="mx-auto bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300 p-3 rounded-full w-fit mb-4">
                        <Check className="h-10 w-10" />
                    </div>
                    <CardTitle>Submission Successful!</CardTitle>
                    <CardDescription>
                        Thank you for your participation. Your {room.roomType === 'review' ? 'review' : 'ballot'} has been recorded.
                    </CardDescription>
                </CardHeader>
                 <CardContent>
                    <Button onClick={() => router.push('/')}>Back to Home</Button>
                </CardContent>
            </Card>
        </div>
    )
  }
    
  const progress = ((currentPositionIndex + 1) / room.positions.length) * 100;
  const currentPosition = room.positions[currentPositionIndex];
  const currentSelection = selections[currentPosition?.id] || null;
  const isLastPosition = currentPositionIndex === room.positions.length - 1;

  const renderCurrentPositionCard = () => {
    if (!currentPosition) return null;
    if (room.roomType === 'review') {
      return (
        <ReviewPositionCard 
          key={currentPosition.id} 
          position={currentPosition}
          selection={currentSelection || { rating: 0, feedback: '' }}
          onSelectionChange={handleReviewSelection}
        />
      );
    }
    return currentPosition.candidates.length === 1 ? (
      <SingleCandidatePositionCard
        key={currentPosition.id}
        position={currentPosition}
        onVote={handleVoteSelection}
        selection={currentSelection}
      />
    ) : (
      <VotingPositionCard 
        key={currentPosition.id} 
        position={currentPosition}
        onVote={handleVoteSelection}
        selection={currentSelection}
      />
    );
  };

  return (
    <div className="bg-muted/40 p-4 sm:p-6 lg:p-8 rounded-lg">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center">
            <Badge variant="secondary" className="mb-2">
                {room.roomType === 'review' ? 'Review Mode' : 'Voting Mode'}
            </Badge>
            <h1 className="text-3xl sm:text-4xl font-bold font-headline">{room.title}</h1>
            <p className="text-muted-foreground mt-2 text-sm sm:text-base">{room.description}</p>
        </div>
        
        <div className="space-y-3">
            <Progress value={progress} className="w-full h-3" />
            <p className="text-center text-sm text-muted-foreground">
                Position {currentPositionIndex + 1} of {room.positions.length}
            </p>
        </div>

        <div className="space-y-8 min-h-[300px]">
            {renderCurrentPositionCard()}
        </div>
        
        <div className="flex justify-between items-center">
            <Button variant="outline" onClick={handleBack} disabled={currentPositionIndex === 0}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            
            {!isLastPosition ? (
                <Button variant="default" onClick={handleNext}>
                    Next
                    <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            ) : (
                <div className="w-[88px]"></div> 
            )}
        </div>
        
        {isLastPosition && (
            <Card>
                <CardHeader>
                    <CardTitle>Final Step: Submit</CardTitle>
                    <CardDescription>
                        To complete your submission, please enter your email address below. This is used to ensure one submission per person.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label htmlFor="voter-email">Your Email Address</Label>
                        <Input 
                            id="voter-email"
                            type="email"
                            placeholder="you@example.com"
                            value={voterEmail}
                            onChange={(e) => setVoterEmail(e.target.value)}
                            disabled={isSubmitting}
                        />
                    </div>
                    <Button size="lg" className="w-full" disabled={isSubmitting || !voterEmail} onClick={handleSubmit}>
                    {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : (room.roomType === 'review' ? <Send className="mr-2 h-5 w-5" /> : <Check className="mr-2 h-5 w-5" />)}
                    Submit {room.roomType === 'review' ? 'Review' : 'Ballot'}
                    </Button>
                </CardContent>
            </Card>
        )}
      </div>
    </div>
  );
}
