
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// This page is now deprecated. 
// We redirect immediately to the main vote page, as the flow is now handled there.
export default function VoterEmailPromptPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/vote');
  }, [router]);

  return (
     <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] py-12">
        <p>Redirecting...</p>
    </div>
  );
}
