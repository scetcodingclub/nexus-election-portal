
"use client";

import { useEffect, useState } from "react";
import { useParams, notFound } from "next/navigation";
import { getElectionRoomById } from "@/lib/electionRoomService";
import type { ElectionRoom, Position, Candidate } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Check, Send, ArrowRight, ArrowLeft } from "lucide-react";
import StarRating from "@/components/app/StarRating";
import { Progress } from "@/components/ui/progress";

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
  selection
}: { 
  position: Position,
  onVote: (candidateId: string) => void,
  selection: string | null
}) => (
  <Card key={position.id}>
    <CardHeader>
      <CardTitle>{position.title}</CardTitle>
      <CardDescription>Select one candidate for this position.</CardDescription>
    </CardHeader>
    <CardContent>
      <RadioGroup onValueChange={onVote} value={selection || undefined} >
        {position.candidates.map((candidate) => (
          <div key={candidate.id} className="flex items-center space-x-4 p-4 border rounded-md has-[:checked]:bg-primary/5 has-[:checked]:border-primary transition-colors">
            <RadioGroupItem value={candidate.id} id={`${position.id}-${candidate.id}`} />
            <Label htmlFor={`${position.id}-${candidate.id}`} className="flex-1 flex items-center gap-4 cursor-pointer">
              <Image
                src={candidate.imageUrl || `https://placehold.co/100x100.png?text=${candidate.name.charAt(0)}`}
                alt={candidate.name}
                width={56}
                height={56}
                className="rounded-full object-cover w-14 h-14"
                data-ai-hint="person portrait"
              />
              <span className="font-semibold text-lg">{candidate.name}</span>
            </Label>
          </div>
        ))}
      </RadioGroup>
    </CardContent>
  </Card>
);

const ReviewPositionCard = ({ position }: { position: Position }) => (
  <Card key={position.id}>
    <CardHeader>
      <CardTitle>{position.title}: {position.candidates[0]?.name}</CardTitle>
      <CardDescription>Provide your feedback and rating.</CardDescription>
    </CardHeader>
    <CardContent className="space-y-6">
      <div>
        <Label className="mb-2 block">Rating</Label>
        <div className="flex flex-col items-center gap-2">
            <StarRating rating={3.5} onRatingChange={() => {}} disabled />
            <span className="font-bold text-lg w-20 text-center bg-muted rounded-md py-1">3.5 / 5</span>
        </div>
      </div>
      <div>
        <Label>Feedback</Label>
        <Textarea placeholder="Enter your detailed feedback here..." className="mt-2" disabled />
      </div>
    </CardContent>
  </Card>
);

export default function RoomPreviewPage() {
  const params = useParams();
  const roomId = params.roomId as string;

  const [room, setRoom] = useState<ElectionRoom | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPositionIndex, setCurrentPositionIndex] = useState(0);
  const [selections, setSelections] = useState<Record<string, string | null>>({});

  useEffect(() => {
    if (roomId) {
      getElectionRoomById(roomId)
        .then(data => {
          if (!data) {
            notFound();
          } else {
            setRoom(data);
          }
        })
        .catch(err => {
          console.error("Failed to fetch room for preview:", err);
          notFound();
        })
        .finally(() => setLoading(false));
    }
  }, [roomId]);
  
  const handleVote = (candidateId: string) => {
    if (!room) return;
    const positionId = room.positions[currentPositionIndex].id;
    setSelections(prev => ({...prev, [positionId]: candidateId }));
    
    // Automatically move to next position
    setTimeout(() => {
        if(currentPositionIndex < room.positions.length - 1) {
            setCurrentPositionIndex(currentPositionIndex + 1);
        }
    }, 300);
  };

  const handleNext = () => {
    if (!room || currentPositionIndex >= room.positions.length - 1) return;
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
    
  const isVotingRoom = room.roomType !== 'review';
  const progress = isVotingRoom ? ((currentPositionIndex + 1) / room.positions.length) * 100 : 100;
  const currentPosition = room.positions[currentPositionIndex];
  const currentSelection = selections[currentPosition?.id] || null;

  return (
    <div className="bg-muted/40 p-4 sm:p-8 rounded-lg">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center">
            <p className="text-primary font-semibold mb-2">PREVIEW MODE</p>
            <h1 className="text-4xl font-bold font-headline">{room.title}</h1>
            <p className="text-muted-foreground mt-2">{room.description}</p>
        </div>
        
        {isVotingRoom && (
            <div className="space-y-3">
                <Progress value={progress} className="w-full h-3" />
                <p className="text-center text-sm text-muted-foreground">
                    Position {currentPositionIndex + 1} of {room.positions.length}
                </p>
            </div>
        )}

        <div className="space-y-8">
            {isVotingRoom ? (
                <VotingPositionCard 
                    key={currentPosition.id} 
                    position={currentPosition}
                    onVote={handleVote}
                    selection={currentSelection}
                />
            ) : (
                room.positions.map(position => <ReviewPositionCard key={position.id} position={position} />)
            )}
        </div>
        
        {isVotingRoom && (
             <div className="flex justify-between items-center">
                <Button variant="outline" onClick={handleBack} disabled={currentPositionIndex === 0}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <span>
                    {currentSelection && <Check className="h-6 w-6 text-green-500" />}
                </span>
                <Button variant="default" onClick={handleNext} disabled={currentPositionIndex === room.positions.length - 1}>
                    Next <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            </div>
        )}

        <Button size="lg" className="w-full" disabled>
          {room.roomType === 'review' ? (
             <Send className="mr-2 h-5 w-5" />
          ) : (
             <Check className="mr-2 h-5 w-5" />
          )}
          Submit {room.roomType === 'review' ? 'Review' : 'Ballot'}
        </Button>
      </div>
    </div>
  );
}
