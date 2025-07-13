
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ArrowRight, QrCode, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useToast } from "@/hooks/use-toast";
import { verifyRoomAccess, checkUserHasVoted } from "@/lib/electionRoomService";
import Link from "next/link";

export default function VoterAccessPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const roomId = formData.get('roomId') as string;
    const email = formData.get('email') as string;

    // First, verify the room and access code
    const accessResult = await verifyRoomAccess(formData);

    if (!accessResult.success || !accessResult.roomId) {
      toast({
        variant: "destructive",
        title: "Access Denied",
        description: accessResult.message,
      });
      setIsLoading(false);
      return;
    }
    
    // If room access is granted, check if the user has already voted
    try {
        const hasVoted = await checkUserHasVoted(accessResult.roomId, email);
        if (hasVoted) {
             router.push(`/vote/${accessResult.roomId}/thank-you?status=already_voted`);
             return;
        }

        // If not voted, store email and proceed to the ballot page
        localStorage.setItem(`voterEmail-${accessResult.roomId}`, email);
        router.push(`/vote/${accessResult.roomId}/ballot`);

    } catch(error) {
        console.error("Error checking voter status:", error);
        toast({
            variant: "destructive",
            title: "Verification Failed",
            description: "Could not verify your voting status. Please try again.",
        });
        setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] py-12">
      <div className="w-full max-w-lg">
         <Button variant="outline" asChild className="mb-4 w-full sm:w-auto">
            <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
            </Link>
        </Button>
        <Card className="w-full shadow-xl">
          <CardHeader className="text-center">
            <div className="mx-auto bg-primary/10 text-primary p-3 rounded-full w-fit mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </div>
            <CardTitle className="text-3xl font-headline">Voter Access</CardTitle>
            <CardDescription>Enter your details and the Room ID to cast your vote.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
               <div>
                <Label htmlFor="email" className="text-base">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your email address"
                  className="mt-1 text-base md:text-sm"
                  required
                  aria-label="Email Address"
                  suppressHydrationWarning={true}
                />
              </div>
              <div>
                <Label htmlFor="roomId" className="text-base">Room Id</Label>
                <Input
                  id="roomId"
                  name="roomId"
                  type="text"
                  placeholder="Enter Voting Room ID (e.g., NEXUS2024)"
                  className="mt-1 text-base md:text-sm"
                  required
                  aria-label="Room Id"
                  suppressHydrationWarning={true}
                />
              </div>
              <div>
                <Label htmlFor="accessCode" className="text-base">Access Code (if required)</Label>
                <Input
                  id="accessCode"
                  name="accessCode"
                  type="password"
                  placeholder="Enter code for a private room"
                  className="mt-1 text-base md:text-sm"
                  aria-label="Access Code"
                  suppressHydrationWarning={true}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading} suppressHydrationWarning={true}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying...
                  </>
                ) : (
                  <>
                  Enter Voting Room <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
            <p className="text-xs text-center text-muted-foreground pt-4">
              If you received a direct link to an election, please use that link.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
