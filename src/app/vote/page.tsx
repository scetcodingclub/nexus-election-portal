
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getElectionRoomById } from "@/lib/electionRoomService";
import type { ElectionRoom } from "@/lib/types";

function VoterAccessPage() {
  const [roomId, setRoomId] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [roomData, setRoomData] = useState<ElectionRoom | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  const handleFindRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomId) return;
    setIsLoading(true);

    try {
      const room = await getElectionRoomById(roomId);
      if (!room) {
        toast({
          variant: "destructive",
          title: "Room Not Found",
          description: "Please check the Room ID and try again.",
        });
        setRoomData(null);
      } else if (room.status !== 'active') {
        toast({
            variant: "destructive",
            title: "Room Not Active",
            description: "This room is not currently open for participation.",
        });
        setRoomData(null);
      } else {
        setRoomData(room);
        if (!room.isAccessRestricted) {
          router.push(`/vote/${room.id}`);
        }
      }
    } catch (error) {
      console.error("Error finding room:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
      });
      setRoomData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyAccessCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomData) return;
    
    if (roomData.accessCode === accessCode) {
      router.push(`/vote/${roomData.id}`);
    } else {
      toast({
        variant: "destructive",
        title: "Invalid Access Code",
        description: "The access code you entered is incorrect.",
      });
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] py-12">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-headline">Enter Room</CardTitle>
          <CardDescription>
            {
              !roomData || !roomData.isAccessRestricted 
              ? "Please enter the Room ID to participate." 
              : "This room requires an access code."
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!roomData || !roomData.isAccessRestricted ? (
            <form onSubmit={handleFindRoom} className="space-y-4">
              <div>
                <Label htmlFor="room-id">Room ID</Label>
                <Input
                  id="room-id"
                  placeholder="Enter Room ID here"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  disabled={isLoading}
                  autoFocus
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading || !roomId}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRight className="mr-2 h-4 w-4" />}
                Find Room
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyAccessCode} className="space-y-4">
               <div className="text-center p-2 border rounded-md bg-muted">
                    <p className="text-sm font-medium">Room Found:</p>
                    <p className="font-bold text-lg">{roomData.title}</p>
                </div>
              <div>
                <Label htmlFor="access-code">Access Code</Label>
                <Input
                  id="access-code"
                  placeholder="Enter access code"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  disabled={isLoading}
                  autoFocus
                />
              </div>
              <Button type="submit" className="w-full" disabled={!accessCode}>
                <ArrowRight className="mr-2 h-4 w-4" />
                Enter
              </Button>
               <Button variant="link" onClick={() => setRoomData(null)} className="w-full">
                Enter a different Room ID
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Wrapper component to prevent SSR and hydration errors
export default function VoterAccessClientPage() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    // Render nothing or a loading skeleton on the server and initial client render
    return null; 
  }

  return <VoterAccessPage />;
}
