import ElectionRoomForm from '@/components/app/admin/ElectionRoomForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getMockElectionRoomById } from '@/lib/mock-data';
import { ArrowLeft, QrCode, Share2, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { notFound } from 'next/navigation';

export default function ManageElectionRoomPage({ params }: { params: { roomId: string } }) {
  const room = getMockElectionRoomById(params.roomId);

  if (!room) {
    // If you have a custom 404 page, you might redirect or render it.
    // For now, using Next.js built-in notFound.
    notFound(); 
  }

  const voterLink = typeof window !== 'undefined' ? `${window.location.origin}/vote/${room.id}` : `/vote/${room.id}`;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <Button variant="outline" asChild>
          <Link href="/admin/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
          </Link>
        </Button>
        <Button variant="default" asChild>
          <Link href={`/admin/rooms/${room.id}/results`}>
            <BarChart3 className="mr-2 h-4 w-4" /> View Results
          </Link>
        </Button>
      </div>
      
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-headline">Manage: {room.title}</CardTitle>
          <CardDescription>Edit details, positions, candidates, and manage access for this election room.</CardDescription>
        </CardHeader>
        <CardContent>
          <ElectionRoomForm initialData={room} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-headline">Access & Sharing</CardTitle>
          <CardDescription>Share this room with voters.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Share2 className="h-4 w-4" />
            <AlertTitle>Shareable Link</AlertTitle>
            <AlertDescription className="flex items-center justify-between">
              <code className="text-sm bg-muted px-2 py-1 rounded font-mono break-all">{voterLink}</code>
              <Button variant="ghost" size="sm" onClick={() => navigator.clipboard.writeText(voterLink)}>Copy</Button>
            </AlertDescription>
          </Alert>
          <Alert variant="default" className="border-primary/30">
             <QrCode className="h-4 w-4" />
            <AlertTitle>QR Code</AlertTitle>
            <AlertDescription>
              Display a QR code for easy voter access. (QR code generation component to be implemented)
              <div className="mt-2 p-4 bg-muted rounded flex items-center justify-center">
                 <img src={`https://placehold.co/150x150.png?text=QR+Code`} alt="QR Code Placeholder" data-ai-hint="qr code" />
              </div>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
