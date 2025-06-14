
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ShieldCheckIcon } from 'lucide-react';

export default function Header() {
  return (
    <header className="bg-card shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
          {/* 
            Ensure 'NexusLogoFinalSquare.png' is placed directly in the 'public' folder 
            for this path (src="/NexusLogoFinalSquare.png") to work correctly.
            The filename is case-sensitive.
          */}
          <Image 
            src="/NexusLogoFinalSquare.png" 
            alt="NEXUS: Next-Gen Coders United Society Logo" 
            width={150} 
            height={42} 
            priority 
          />
        </Link>
        <nav className="space-x-2">
          <Button variant="ghost" asChild>
            <Link href="/vote" className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1 h-4 w-4"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              Voter Access
            </Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/admin/login" className="flex items-center">
              <ShieldCheckIcon className="mr-1 h-4 w-4" />
              Admin Panel
            </Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
