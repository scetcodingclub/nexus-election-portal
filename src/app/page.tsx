
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import Link from "next/link";
import { ArrowRight, ShieldCheckIcon, Vote } from "lucide-react";
import TypingAnimation from "@/components/app/TypingAnimation";

export default function Home() {
  const welcomeTexts = [
    "Welcome to N.E.X.U.S Election Board",
    "Secure & Transparent Admin Panel",
    "Manage Your Elections & Reviews"
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] py-12">
      <div className="text-center mb-12 h-24">
        <h1 className="text-4xl md:text-5xl font-bold font-headline mb-4 animate-fade-in-up">
          <TypingAnimation texts={welcomeTexts} />
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
          Securely manage elections and gather feedback with ease. Our platform ensures transparency and integrity for all your administrative needs.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
        {/* Admin Panel Card */}
        <Card className="hover:shadow-xl transition-shadow duration-300 flex flex-col">
           <CardHeader>
            <CardTitle className="flex items-center text-2xl font-headline">
                <ShieldCheckIcon className="mr-2 h-8 w-8 text-primary" />
                Admin Panel
            </CardTitle>
            <CardDescription>
              Administrators create and manage voting rooms from the panel.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-grow">
             <p className="mb-4">
              Login to access the administrator tools for creating, managing, and viewing results for all rooms.
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
                <Link href="/admin/login">
                    Admin Login <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
            </Button>
          </CardFooter>
        </Card>
        
        {/* Voter Access Card */}
        <Card className="hover:shadow-xl transition-shadow duration-300 flex flex-col">
           <CardHeader>
            <CardTitle className="flex items-center text-2xl font-headline">
                <Vote className="mr-2 h-8 w-8 text-primary" />
                Participant Access
            </CardTitle>
            <CardDescription>
              Cast your vote or submit your review here.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-grow">
             <p className="mb-4">
              If you have a Room ID, you can access the voting or review page to make your submission.
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
                <Link href="/vote">
                    Enter a Room <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
