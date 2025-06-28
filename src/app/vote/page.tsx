
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, QrCode, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useToast } from "@/hooks/use-toast";
import { verifyRoomAccess } from "@/lib/electionRoomService";

export default function VoterAccessPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = await verifyRoomAccess(formData);

    if (result.success && result.roomId) {
      router.push(`/vote/${result.roomId}`);
    } else {
      toast({
        variant: "destructive",
        title: "Access Denied",
        description: result.message,
      });
      setIsLoading(false);
    }
    // On success, we navigate away, so no need to set loading to false.
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] py-12">
      <Card className="w-full max-w-lg shadow-xl">
        <CardHeader className="text-center">
           <div className="mx-auto bg-primary/10 text-primary p-3 rounded-full w-fit mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </div>
          <CardTitle className="text-3xl font-headline">Voter Access</CardTitle>
          <CardDescription>Enter the Election Room ID. If the room is private, you will also need an access code.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="roomId" className="text-base">Election Room ID</Label>
              <Input
                id="roomId"
                name="roomId"
                type="text"
                placeholder="Enter Room ID (e.g., NEXUS2024)"
                className="mt-1 text-base md:text-sm"
                required
                aria-label="Election Room ID"
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
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying...
                </>
              ) : (
                <>
                 Enter Room <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                Or
              </span>
            </div>
          </div>
          <Button variant="outline" className="w-full" disabled> {/* QR Scan functionality is complex */}
            <QrCode className="mr-2 h-4 w-4" /> Scan QR Code (Coming Soon)
          </Button>
           <p className="text-xs text-center text-muted-foreground pt-4">
            If you received a direct link to an election, please use that link.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
