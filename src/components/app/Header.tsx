import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { VoteIcon, ShieldCheckIcon } from 'lucide-react'; // VoteIcon might not exist, placeholder. Using ListChecks instead.

const NexusLogo = () => (
  <svg width="32" height="32" viewBox="0 0 100 100" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className="text-primary mr-2">
    <path d="M50 0L61.8 23.5L88.2 23.5L68.2 38.2L76.4 61.8L50 47.6L23.6 61.8L31.8 38.2L11.8 23.5L38.2 23.5L50 0Z" />
    <path d="M50 100L38.2 76.5L11.8 76.5L31.8 61.8L23.6 38.2L50 52.4L76.4 38.2L68.2 61.8L88.2 76.5L61.8 76.5L50 100Z" />
  </svg>
);


export default function Header() {
  return (
    <header className="bg-card shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link href="/" className="flex items-center text-2xl font-headline font-bold hover:opacity-80 transition-opacity">
          <NexusLogo />
          NEXUS Voting
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
