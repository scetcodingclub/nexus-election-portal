
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight, Loader2, QrCode } from "lucide-react";
import { getElectionRoomById } from "@/lib/electionRoomService";

export default function VoterAccessPage() {
  const [roomId, setRoomId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleEnterRoom = async () => {
    if (!roomId) {
      toast({
        variant: "destructive",
        title: "Room ID Required",
        description: "Please enter a valid voting Room ID.",
      });
      return;
    }
    setIsLoading(true);
    try {
      const room = await getElectionRoomById(roomId);
      if (room) {
        if (room.isAccessRestricted) {
           router.push(`/vote?roomId=${roomId}&requireCode=true`); // Redirect to handle access code
        } else {
           router.push(`/vote/${roomId}`);
        }
      } else {
        toast({
          variant: "destructive",
          title: "Invalid Room ID",
          description: "The voting Room ID you entered was not found.",
        });
      }
    } catch (error) {
      console.error("Error finding room:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] py-12">
      <div className="w-full max-w-md">
        <Card className="w-full shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-headline">Voter Access</CardTitle>
            <CardDescription>Enter the Room ID provided by the administrator to access the election.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="room-id">Room ID</Label>
              <Input
                id="room-id"
                placeholder="Enter Room ID here"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleEnterRoom()}
              />
            </div>
            <Button
              onClick={handleEnterRoom}
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  Enter Room <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
            <Button variant="outline" className="w-full" disabled>
              <QrCode className="mr-2 h-4 w-4" /> Scan QR Code (Coming Soon)
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
