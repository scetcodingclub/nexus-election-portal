
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, MailCheck, AlertTriangle, ArrowRight } from "lucide-react";
import { useRouter, useParams, useSearchParams, notFound } from 'next/navigation';
import { useEffect, useState, Suspense } from "react";
import { getVoter, updateUserStatus, getElectionRoomById } from "@/lib/electionRoomService";
import jwt from 'jsonwebtoken';
import Link from "next/link";

function WaitingRoomContent() {
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();

    const roomId = params.roomId as string;
    const token = searchParams.get('token');

    const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!token || !roomId) {
            setError("Missing required information in the link.");
            setStatus('error');
            return;
        }

        async function verifyVoter() {
            try {
                // In a real app, use an environment variable for the secret
                const decoded = jwt.verify(token, 'your-super-secret-key-that-is-long-and-secure') as { email: string, roomId: string };
                if (decoded.roomId !== roomId) {
                    throw new Error("This invitation is not valid for this election.");
                }

                const [voter, room] = await Promise.all([
                    getVoter(roomId, decoded.email),
                    getElectionRoomById(roomId)
                ]);

                if (!voter) throw new Error("You are not on the approved voter list for this election.");
                if (!room) throw new Error("This election room does not exist.");

                if (voter.status === 'voted') {
                    router.replace(`/vote/${roomId}/thank-you?status=already_voted`);
                    return; // Stop further processing
                }

                if (room.status !== 'active') {
                    const message = room.status === 'closed' ? 'This election is now closed.' : 'This election has not opened for voting yet.';
                    throw new Error(message);
                }
                
                // Set status to 'waiting' when they land on the page
                await updateUserStatus(roomId, decoded.email, 'waiting');
                setStatus('ready');

            } catch (err: any) {
                console.error("Waiting room error:", err);
                if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
                    setError("Your voting link is invalid or has expired. Please request a new one from the administrator.");
                } else {
                    setError(err.message || "An unexpected error occurred. Please try again.");
                }
                setStatus('error');
            }
        }
        
        verifyVoter();

    }, [token, roomId, router]);

    const handleStartVoting = () => {
        setIsSubmitting(true);
        // The token is passed along to the ballot page for final verification
        router.push(`/vote/${roomId}/ballot?token=${token}`);
    };

    const renderContent = () => {
        switch (status) {
            case 'loading':
                return (
                    <>
                        <CardTitle className="text-3xl font-headline">Verifying Your Invitation...</CardTitle>
                        <CardDescription>Please wait while we check your secure link.</CardDescription>
                        <CardContent className="flex justify-center items-center py-8">
                            <Loader2 className="h-12 w-12 animate-spin text-primary" />
                        </CardContent>
                    </>
                );
            case 'error':
                 return (
                    <>
                        <div className="mx-auto bg-destructive/10 text-destructive p-3 rounded-full w-fit mb-4">
                            <AlertTriangle className="h-10 w-10" />
                        </div>
                        <CardTitle className="text-3xl font-headline text-destructive">Access Denied</CardTitle>
                        <CardDescription>{error || "An unknown error occurred."}</CardDescription>
                         <CardContent className="flex justify-center items-center pt-8">
                             <Button asChild variant="outline">
                                <Link href="/vote">Return to Main Page</Link>
                            </Button>
                        </CardContent>
                    </>
                );
            case 'ready':
                return (
                    <>
                        <div className="mx-auto bg-primary/10 text-primary p-3 rounded-full w-fit mb-4">
                            <MailCheck className="h-10 w-10" />
                        </div>
                        <CardTitle className="text-3xl font-headline">Welcome to the Waiting Room</CardTitle>
                        <CardDescription>You are now in the NEXUS Election Waiting Room. Please click below to begin your voting.</CardDescription>
                        <CardContent className="flex justify-center items-center pt-8">
                            <Button size="lg" onClick={handleStartVoting} disabled={isSubmitting}>
                                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRight className="mr-2 h-4 w-4" />}
                                Start Voting
                            </Button>
                        </CardContent>
                    </>
                );
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] py-12">
            <Card className="w-full max-w-lg shadow-xl text-center">
                <CardHeader>
                    {renderContent()}
                </CardHeader>
            </Card>
        </div>
    );
}

export default function WaitingRoomPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <WaitingRoomContent />
        </Suspense>
    )
}
