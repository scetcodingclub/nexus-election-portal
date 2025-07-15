

"use client";

import { useEffect, useState } from "react";
import { useParams, notFound, useRouter } from "next/navigation";
import { getElectionRoomById, submitBallot, submitReview, recordParticipantEntry } from "@/lib/electionRoomService";
import type { ElectionRoom, Position } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Check, Send, ArrowRight, ArrowLeft, ThumbsUp, ThumbsDown, Loader2, Info, ShieldCheck } from "lucide-react";
import StarRating from "@/components/app/StarRating";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

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

const GuidelinesScreen = ({
  room,
  onStart,
}: {
  room: ElectionRoom,
  onStart: (email: string) => void
}) => {
    const [email, setEmail] = useState("");
    const [isEmailValid, setIsEmailValid] = useState(false);
    const [rulesAcknowledged, setRulesAcknowledged] = useState(false);
    
    const canProceed = isEmailValid && rulesAcknowledged;

    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newEmail = e.target.value;
        setEmail(newEmail);
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        setIsEmailValid(emailRegex.test(newEmail));
    }

    const startButtonText = room.roomType === 'review' ? 'Start Review' : 'Start Voting';

    return (
        <Card className="max-w-2xl mx-auto shadow-lg">
            <CardHeader className="text-center">
                <CardTitle className="text-2xl sm:text-3xl font-headline">Welcome to {room.title}</CardTitle>
                <CardDescription>{room.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <Alert variant="default" className="border-primary/30">
                    <Info className="h-4 w-4" />
                    <AlertTitle>Please review the guidelines before proceeding</AlertTitle>
                    <AlertDescription>
                       <div className="space-y-4 mt-4 text-xs sm:text-sm">
                           <div>
                               <h4 className="font-semibold mb-2">General Rules (Applicable to All Rooms)</h4>
                               <ul className="list-disc pl-5 space-y-1">
                                  <li>Only authorized members are allowed. Your access is granted based on your email.</li>
                                  <li>You can enter the room only once. Refreshing or exiting after starting may lock your session.</li>
                                  <li>Maintain honesty and neutrality. Sharing or discussing your selections is prohibited.</li>
                                  <li>Once submitted, no changes can be made. Ensure you have a stable internet connection.</li>
                               </ul>
                           </div>
                           
                           {room.roomType === 'voting' && (
                             <div>
                               <h4 className="font-semibold mb-2">Voting Room – Specific Rules</h4>
                               <ul className="list-disc pl-5 space-y-1">
                                  <li>You are here to cast your vote — selecting who you support or oppose.</li>
                                  <li>Every vote is final and securely recorded in the election system.</li>
                               </ul>
                             </div>
                           )}

                           {room.roomType === 'review' && (
                             <div>
                               <h4 className="font-semibold mb-2">Reviewer Room – Specific Rules</h4>
                               <ul className="list-disc pl-5 space-y-1">
                                  <li>You are here to provide feedback on the candidates — not to elect.</li>
                                  <li>You will rate candidates using a star-based system (1–5).</li>
                                  <li>Honest, constructive written feedback is encouraged. Be respectful and specific.</li>
                                  <li>Your review is confidential and used only for evaluation purposes.</li>
                               </ul>
                             </div>
                           )}

                           <div>
                               <h4 className="font-semibold mb-2 flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-green-600" />Your Privacy is Protected</h4>
                               <p>
                                   To ensure fairness, we require your email to prevent multiple submissions. 
                                   However, your {room.roomType === 'review' ? 'review' : 'vote'} itself is **completely anonymous**. Your email will not be linked to your specific choices.
                               </p>
                           </div>
                       </div>
                    </AlertDescription>
                </Alert>

                <div className="space-y-2">
                    <Label htmlFor="voter-email">Enter Your Email to Proceed</Label>
                    <Input 
                        id="voter-email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={handleEmailChange}
                        autoFocus
                    />
                     {!isEmailValid && email.length > 0 && (
                        <p className="text-sm text-destructive">Please enter a valid email address.</p>
                    )}
                </div>

                <div className="flex items-start gap-3">
                    <Checkbox id="rules-ack" checked={rulesAcknowledged} onCheckedChange={(checked) => setRulesAcknowledged(!!checked)} className="mt-0.5" />
                    <label htmlFor="rules-ack" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                       I have read and understand the rules.
                    </label>
                </div>
                
                <Button size="lg" className="w-full" disabled={!canProceed} onClick={() => onStart(email)}>
                    <ArrowRight className="mr-2 h-5 w-5" />
                    {startButtonText}
                </Button>
            </CardContent>
        </Card>
    );
};


export default function VotingPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.roomId as string;
  const { toast } = useToast();

  const [room, setRoom] = useState<ElectionRoom | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [hasStarted, setHasStarted] = useState(false);
  const [voterEmail, setVoterEmail] = useState("");
  
  const [currentPositionIndex, setCurrentPositionIndex] = useState(0);
  const [selections, setSelections] = useState<Record<string, any>>({});
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

  const handleStart = async (email: string) => {
    if (!room) return;
    setVoterEmail(email);
    const result = await recordParticipantEntry(roomId, email);
    if (result.success) {
        setHasStarted(true);
    } else {
        toast({
            variant: "destructive",
            title: "Access Denied",
            description: result.message
        })
    }
  };
  
  const handleVoteSelection = (selectionValue: any) => {
    if (!room) return;
    const positionId = room.positions[currentPositionIndex].id;
    setSelections(prev => ({ ...prev, [positionId]: selectionValue }));

    if (room.roomType === 'voting' && room.positions[currentPositionIndex].candidates.length > 1) {
      setTimeout(() => {
        if (currentPositionIndex < room.positions.length - 1) {
          setCurrentPositionIndex(currentPositionIndex + 1);
        } else {
          // On last position, user must click submit
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
        toast({ variant: "destructive", title: "Missing Information", description: "Something went wrong, email not found." });
        return;
    }

    // Final validation for review rooms before submitting
    if (room.roomType === 'review') {
      const currentPositionId = room.positions[currentPositionIndex].id;
      const currentReview = selections[currentPositionId];
      if (!currentReview || currentReview.rating === 0 || !currentReview.feedback.trim()) {
        toast({ variant: "destructive", title: "Incomplete Final Step", description: "Please provide a rating and feedback for the last item." });
        return;
      }
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

  if (!hasStarted) {
      return <GuidelinesScreen room={room} onStart={handleStart} />;
  }

  if (submissionComplete) {
    return (
        <div className="max-w-2xl mx-auto text-center py-10">
            <Card>
                <CardHeader>
                    <div className="mx-auto w-fit mb-4">
                      <svg className="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                        <circle className="checkmark__circle" cx="26" cy="26" r="25" fill="none"/>
                        <path className="checkmark__check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
                      </svg>
                    </div>
                    <CardTitle className="text-2xl">Submission Successful!</CardTitle>
                    <CardDescription>
                        Thank you for your participation. Your {room.roomType === 'review' ? 'review' : 'ballot'} has been securely recorded. You may now close this window.
                    </CardDescription>
                </CardHeader>
            </Card>
            <style jsx>{`
              .checkmark {
                width: 56px;
                height: 56px;
                border-radius: 50%;
                display: block;
                stroke-width: 2;
                stroke: hsl(var(--primary));
                stroke-miterlimit: 10;
                margin: 10% auto;
                box-shadow: inset 0px 0px 0px hsl(var(--primary));
                animation: fill .4s ease-in-out .4s forwards, scale .3s ease-in-out .9s both;
              }
              .checkmark__circle {
                stroke-dasharray: 166;
                stroke-dashoffset: 166;
                stroke-width: 2;
                stroke-miterlimit: 10;
                stroke: hsl(var(--primary));
                fill: none;
                animation: stroke 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards;
              }
              .checkmark__check {
                transform-origin: 50% 50%;
                stroke-dasharray: 48;
                stroke-dashoffset: 48;
                animation: stroke 0.3s cubic-bezier(0.65, 0, 0.45, 1) 0.8s forwards;
              }
              @keyframes stroke {
                100% {
                  stroke-dashoffset: 0;
                }
              }
              @keyframes scale {
                0%, 100% {
                  transform: none;
                }
                50% {
                  transform: scale3d(1.1, 1.1, 1);
                }
              }
              @keyframes fill {
                100% {
                  box-shadow: inset 0px 0px 0px 30px hsl(var(--primary));
                }
              }
            `}</style>
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
            <Button size="lg" className="w-full" disabled={isSubmitting} onClick={handleSubmit}>
            {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : (room.roomType === 'review' ? <Send className="mr-2 h-5 w-5" /> : <Check className="mr-2 h-5 w-5" />)}
            Submit {room.roomType === 'review' ? 'Review' : 'Ballot'}
            </Button>
        )}
      </div>
    </div>
  );
}


