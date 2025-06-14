"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Info } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function ThankYouPage() {
  const searchParams = useSearchParams();
  const status = searchParams.get('status');

  let title = "Thank You for Voting!";
  let description = "Your ballot has been successfully submitted. Your participation is valuable.";
  let icon = <CheckCircle2 className="h-16 w-16 text-primary" />;

  if (status === 'already_voted') {
    title = "Ballot Already Submitted";
    description = "Our records indicate you have already voted in this election. Each voter may only submit one ballot.";
    icon = <Info className="h-16 w-16 text-primary" />;
  }


  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] py-12">
      <Card className="w-full max-w-lg text-center shadow-xl p-8">
        <CardHeader>
          <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit mb-6">
            {icon}
          </div>
          <CardTitle className="text-3xl font-bold font-headline">{title}</CardTitle>
          <CardDescription className="text-lg mt-2">
            {description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild size="lg">
            <Link href="/">Return to Home</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
