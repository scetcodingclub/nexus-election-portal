
"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ShareableLinkDisplayProps {
  voterLink: string;
}

export default function ShareableLinkDisplay({ voterLink }: ShareableLinkDisplayProps) {
  const [mounted, setMounted] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleCopy = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(voterLink).then(() => {
        toast({ title: "Link Copied!", description: "Voter link copied to clipboard." });
      }).catch(err => {
        console.error("Failed to copy link: ", err);
        toast({ variant: "destructive", title: "Copy Failed", description: "Could not copy link to clipboard." });
      });
    } else {
      toast({ variant: "destructive", title: "Copy Not Supported", description: "Clipboard API not available in this browser." });
    }
  };

  return (
    <Alert>
      <Share2 className="h-4 w-4" />
      <AlertTitle>Shareable Voter Link</AlertTitle>
      <AlertDescription className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <code className="text-sm bg-muted px-2 py-1 rounded font-mono break-all flex-grow">
          {voterLink}
        </code>
        {mounted && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleCopy} 
            className="mt-2 sm:mt-0 flex-shrink-0"
            disabled={!navigator.clipboard} // Disable if clipboard API is not available
          >
            Copy Link
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}
