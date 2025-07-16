
import ChangePasswordForm from '@/components/app/admin/ChangePasswordForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LockKeyhole } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function ChangePasswordPage() {
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
                <LockKeyhole className="h-10 w-10" />
            </div>
          <CardTitle className="text-3xl font-headline">Change Your Password</CardTitle>
          <CardDescription>Enter your current password and a new one to update.</CardDescription>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm />
        </CardContent>
      </Card>
    </div>
  );
}
