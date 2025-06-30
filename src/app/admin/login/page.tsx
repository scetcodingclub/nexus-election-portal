
import LoginForm from '@/components/app/admin/LoginForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldCheckIcon, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function AdminLoginPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] py-12">
      <div className="w-full max-w-md">
         <Button variant="outline" asChild className="mb-4 w-full sm:w-auto">
            <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
            </Link>
        </Button>
        <Card className="w-full shadow-xl">
            <CardHeader className="text-center">
            <div className="mx-auto bg-primary/10 text-primary p-3 rounded-full w-fit mb-4">
                <ShieldCheckIcon className="h-10 w-10" />
            </div>
            <CardTitle className="text-3xl font-headline">Admin Login</CardTitle>
            <CardDescription>Access the N.E.X.U.S Election Board dashboard.</CardDescription>
            </CardHeader>
            <CardContent>
            <LoginForm />
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
