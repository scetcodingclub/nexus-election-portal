
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// This page is now deprecated. 
// The logic has been moved to /vote/page.tsx for a more streamlined user experience.
// We redirect immediately to the ballot to avoid asking for email twice.
export default function VoterEmailPromptPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect logic can be more sophisticated, but for now, we'll push to the root voter page
    // assuming the new flow handles everything.
    router.replace('/vote');
  }, [router]);

  return (
     <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] py-12">
        <p>Redirecting...</p>
    </div>
  );
}
