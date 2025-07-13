
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, ArrowRight } from "lucide-react";
import { checkUserHasVoted, addUserToVoterPool } from "@/lib/electionRoomService";

const emailFormSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
});

type EmailFormValues = z.infer<typeof emailFormSchema>;

interface VoterEmailFormProps {
  roomId: string;
}

export default function VoterEmailForm({ roomId }: VoterEmailFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<EmailFormValues>({
    resolver: zodResolver(emailFormSchema),
    defaultValues: {
      email: "",
    },
  });

  async function onSubmit(values: EmailFormValues) {
    setIsLoading(true);

    try {
      const hasVoted = await checkUserHasVoted(roomId, values.email);
      if (hasVoted) {
        router.push(`/vote/${roomId}/thank-you?status=already_voted`);
        setIsLoading(false);
        return;
      }
      
      // Add user to the voter pool if they don't exist
      await addUserToVoterPool(roomId, values.email);

      // Store email in local storage to pass to the ballot page
      localStorage.setItem(`voterEmail-${roomId}`, values.email);

      toast({
        title: "Email Verified",
        description: "Proceeding to ballot...",
      });
      router.push(`/vote/${roomId}/ballot`);
    } catch (error: any) {
      console.error("Error checking voter status or proceeding:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Could not verify your status. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Your Email Address</FormLabel>
              <FormControl>
                <Input 
                  type="email" 
                  placeholder="you@example.com" 
                  {...field} 
                  className="text-base md:text-sm"
                  aria-required="true"
                  suppressHydrationWarning={true}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isLoading} suppressHydrationWarning={true}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Verifying...
            </>
          ) : (
            <>
              Proceed to Ballot <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </form>
    </Form>
  );
}
