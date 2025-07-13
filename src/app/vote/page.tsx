
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail } from "lucide-react";
import Link from "next/link";

export default function VoterAccessPage() {
  
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] py-12">
      <div className="w-full max-w-lg">
        <Card className="w-full shadow-xl">
          <CardHeader className="text-center">
            <div className="mx-auto bg-primary/10 text-primary p-3 rounded-full w-fit mb-4">
                <Mail className="h-10 w-10"/>
            </div>
            <CardTitle className="text-3xl font-headline">Voter Access</CardTitle>
            <CardDescription>To vote, please use the unique link sent to your email address.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 text-center">
            <p className="text-muted-foreground">
              If you have not received an invitation email and believe you should be on the voter list, please contact the election administrator.
            </p>
             <Button asChild variant="secondary">
                <Link href="/">
                    Return to Home Page
                </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
