
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Check, Copy } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface ShareableLinkDisplayProps {
  voterLink: string;
}

export default function ShareableLinkDisplay({ voterLink }: ShareableLinkDisplayProps) {
  const [hasCopied, setHasCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = () => {
    navigator.clipboard.writeText(voterLink).then(() => {
      setHasCopied(true);
      toast({
        title: "Copied to clipboard!",
        description: "The shareable link has been copied.",
      });
      setTimeout(() => setHasCopied(false), 2000);
    }, (err) => {
      console.error('Could not copy text: ', err);
      toast({
        variant: "destructive",
        title: "Copy Failed",
        description: "Could not copy the link to your clipboard.",
      });
    });
  };

  return (
    <Alert>
      <AlertTitle>Shareable Link</AlertTitle>
      <AlertDescription>
        Provide this link to your voters or reviewers to allow them to participate.
      </AlertDescription>
      <div className="flex items-center space-x-2 pt-2">
        <Input value={voterLink} readOnly className="h-9" />
        <Button type="button" size="icon" className="h-9 w-9" onClick={handleCopy}>
          {hasCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          <span className="sr-only">Copy link</span>
        </Button>
      </div>
    </Alert>
  );
}
