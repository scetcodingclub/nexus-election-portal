
import ChangeEmailForm from '@/components/app/admin/ChangeEmailForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function ChangeEmailPage() {
  return (
    <div className="max-w-md mx-auto space-y-6">
       <Button variant="outline" asChild>
        <Link href="/admin/dashboard">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Panel
        </Link>
      </Button>
      <Card className="shadow-xl">
        <CardHeader className="text-center">
            <div className="mx-auto bg-primary/10 text-primary p-3 rounded-full w-fit mb-4">
                <Mail className="h-10 w-10" />
            </div>
            <CardTitle className="text-3xl font-headline">Change Your Email</CardTitle>
            <CardDescription>Enter your new email and current password to update.</CardDescription>
        </CardHeader>
        <CardContent>
          <ChangeEmailForm />
        </CardContent>
      </Card>
    </div>
  );
}
