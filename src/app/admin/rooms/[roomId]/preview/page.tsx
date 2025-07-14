
"use client";

import { useEffect, useState } from "react";
import { useParams, notFound } from "next/navigation";
import { getElectionRoomById } from "@/lib/electionRoomService";
import type { ElectionRoom, Position, Candidate } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Check, Send, ArrowRight, ArrowLeft, ThumbsUp, ThumbsDown } from "lucide-react";
import StarRating from "@/components/app/StarRating";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

function PreviewSkeleton() {
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
    // If already voted for, clicking again abstains (sets selection to null)
    // If not voted for, clicking votes for the candidate
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
        <Label htmlFor={`feedback-${position.id}`}>Feedback</Label>
        <Textarea 
          id={`feedback-${position.id}`}
          placeholder="Enter your detailed feedback here..." 
          className="mt-2"
          value={selection.feedback}
          onChange={(e) => onSelectionChange({ feedback: e.target.value })}
          rows={5} // More rows for better mobile experience
        />
      </div>
    </CardContent>
  </Card>
);

export default function RoomPreviewPage() {
  const params = useParams();
  const roomId = params.roomId as string;
  const { toast } = useToast();

  const [room, setRoom] = useState<ElectionRoom | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPositionIndex, setCurrentPositionIndex] = useState(0);
  const [selections, setSelections] = useState<Record<string, any>>({});

  useEffect(() => {
    if (roomId) {
      getElectionRoomById(roomId)
        .then(data => {
          if (!data) {
            notFound();
          } else {
            setRoom(data);
            // Initialize selections based on room type
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
          console.error("Failed to fetch room for preview:", err);
          notFound();
        })
        .finally(() => setLoading(false));
    }
  }, [roomId]);
  
  const handleVoteSelection = (selectionValue: any) => {
    if (!room) return;
    const positionId = room.positions[currentPositionIndex].id;
    setSelections(prev => ({ ...prev, [positionId]: selectionValue }));

    if(room.roomType === 'voting' && room.positions[currentPositionIndex].candidates.length > 1) {
        // Automatically move to next position if not on the last one for multi-candidate votes
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
        toast({ variant: "destructive", title: "Incomplete", description: "Please provide a star rating." });
        return;
      }
      if (!currentReview.feedback || currentReview.feedback.trim() === '') {
        toast({ variant: "destructive", title: "Incomplete", description: "Please provide written feedback." });
        return;
      }
    }

    setCurrentPositionIndex(currentPositionIndex + 1);
  };

  const handleBack = () => {
    if (currentPositionIndex <= 0) return;
    setCurrentPositionIndex(currentPositionIndex - 1);
  };


  if (loading) {
    return <PreviewSkeleton />;
  }

  if (!room) {
    return notFound();
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

    const isSingleCandidate = currentPosition.candidates.length === 1;
    return isSingleCandidate ? (
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
  
  const hasMadeSelection = () => {
    if (!currentPosition) return false;
    const selection = selections[currentPosition.id];
    if (selection === undefined) return false;
    
    if (room.roomType === 'review') {
      // For review, selection is considered made if there is a rating and feedback
      return selection?.rating > 0 && selection?.feedback.trim() !== '';
    }
    // For voting, any non-null selection is valid for multi-candidate.
    // For single candidate, a null selection is also valid (abstain).
    if (currentPosition.candidates.length === 1) {
        return true; // Always allow moving on from a single candidate position.
    }
    
    return selection !== null;
  };


  return (
    <div className="bg-muted/40 p-4 sm:p-6 lg:p-8 rounded-lg">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center">
            <p className="text-primary font-semibold mb-2">PREVIEW MODE</p>
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
            <span className="flex-shrink-0">
                {hasMadeSelection() && <Check className="h-6 w-6 text-green-500" />}
            </span>
            {!isLastPosition ? (
                <Button variant="default" onClick={handleNext}>
                    Next
                    <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            ) : (
                // Render a placeholder to maintain layout consistency
                <div className="w-[88px]"></div> 
            )}
        </div>
        
        {isLastPosition && (
            <Button size="lg" className="w-full">
            {room.roomType === 'review' ? (
                <Send className="mr-2 h-5 w-5" />
            ) : (
                <Check className="mr-2 h-5 w-5" />
            )}
            Submit {room.roomType === 'review' ? 'Review' : 'Ballot'}
            </Button>
        )}
      </div>
    </div>
  );
}
    

    
