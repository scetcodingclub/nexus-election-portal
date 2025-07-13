
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import Link from "next/link";
import { ArrowRight, ShieldCheckIcon } from "lucide-react";
import TypingAnimation from "@/components/app/TypingAnimation";

export default function Home() {
  const welcomeTexts = [
    "Welcome to N.E.X.U.S Election Board",
    "Secure & Transparent Voting",
    "Your Voice, Your Vote"
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] py-12">
      <div className="text-center mb-12 h-24">
        <h1 className="text-5xl font-bold font-headline mb-4 animate-fade-in-up">
          <TypingAnimation texts={welcomeTexts} />
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Securely manage elections and cast your votes with ease. Our platform ensures transparency and integrity for all your voting needs.
        </p>
      </div>

      <div className="flex flex-col md:flex-row justify-center items-stretch gap-8 max-w-4xl w-full">
        {/* Voter Access Card */}
        <Card className="hover:shadow-xl transition-shadow duration-300 w-full md:w-1/2 flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center text-2xl font-headline">
               <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-8 w-8 text-primary"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              Voter Access
            </CardTitle>
            <CardDescription>
              Participate in elections by casting your vote anonymously and securely.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-grow">
            <p className="mb-4">
              Enter an election using a shared link or QR code to cast your ballot.
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href="/vote">
                Access Voting Room <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>

        {/* Election Panel Card */}
        <Card className="hover:shadow-xl transition-shadow duration-300 w-full md:w-1/2 flex flex-col">
           <CardHeader>
            <CardTitle className="flex items-center text-2xl font-headline">
                <ShieldCheckIcon className="mr-2 h-8 w-8 text-primary" />
                Election Panel
            </CardTitle>
            <CardDescription>
              Administrators can create and manage voting rooms from the panel.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-grow">
             <p className="mb-4">
              Login to access the administrator tools and settings.
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild variant="secondary" className="w-full">
                <Link href="/admin/login">
                    Admin Login <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
