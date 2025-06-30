import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center">
      <Card className="w-full max-w-md p-8 shadow-xl">
        <CardHeader>
          <div className="mx-auto bg-destructive/10 text-destructive p-3 rounded-full w-fit mb-4">
            <AlertTriangle className="h-12 w-12" />
          </div>
          <CardTitle className="text-4xl font-bold">Voting Room Not Found</CardTitle>
          <CardDescription className="text-lg mt-2">
            The voting room ID you entered is invalid or the room does not exist. Please check the ID and try again.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/vote">Enter a different Voting Room ID</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
