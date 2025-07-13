
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import Link from "next/link";
import { ArrowRight, ShieldCheckIcon } from "lucide-react";
import TypingAnimation from "@/components/app/TypingAnimation";

export default function Home() {
  const welcomeTexts = [
    "Welcome to N.E.X.U.S Election Board",
    "Secure & Transparent Admin Panel",
    "Manage Your Elections"
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] py-12">
      <div className="text-center mb-12 h-24">
        <h1 className="text-5xl font-bold font-headline mb-4 animate-fade-in-up">
          <TypingAnimation texts={welcomeTexts} />
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Securely manage elections with ease. Our platform ensures transparency and integrity for all your administrative needs.
        </p>
      </div>

      <div className="flex justify-center items-stretch w-full">
        {/* Election Panel Card */}
        <Card className="hover:shadow-xl transition-shadow duration-300 w-full md:w-2/3 lg:w-1/2 flex flex-col">
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
              Login to access the administrator tools for creating, managing, and viewing results for all election rooms.
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
      </div>
    </div>
  );
}
