
import Link from 'next/link';
import Image from 'next/image';
// import { Button } from '@/components/ui/button'; // Button is no longer used
// import { ShieldCheckIcon } from 'lucide-react'; // ShieldCheckIcon is no longer used

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
        {/* Navigation removed as per request */}
      </div>
    </header>
  );
}

