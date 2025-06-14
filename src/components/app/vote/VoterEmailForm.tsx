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

const emailFormSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  accessCode: z.string().optional(), // Optional field for access code
});

type EmailFormValues = z.infer<typeof emailFormSchema>;

interface VoterEmailFormProps {
  roomId: string;
  roomAccessCode?: string; // Actual access code if room is restricted
}

export default function VoterEmailForm({ roomId, roomAccessCode }: VoterEmailFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<EmailFormValues>({
    resolver: zodResolver(emailFormSchema),
    defaultValues: {
      email: "",
      accessCode: "",
    },
  });

  async function onSubmit(values: EmailFormValues) {
    setIsLoading(true);
    // Simulate API call for email validation / access code check
    await new Promise(resolve => setTimeout(resolve, 1000));

    if (roomAccessCode && values.accessCode !== roomAccessCode) {
      toast({
        variant: "destructive",
        title: "Access Denied",
        description: "The access code provided is incorrect.",
      });
      setIsLoading(false);
      return;
    }

    // Store email in local storage conceptually, or pass via query param (less secure for email)
    // For this scaffold, we'll just navigate.
    // In a real app, this email might be used to generate a unique token or mark as voted.
    localStorage.setItem(`voterEmail-${roomId}`, values.email);

    toast({
      title: "Email Verified",
      description: "Proceeding to ballot...",
    });
    router.push(`/vote/${roomId}/ballot`);
    setIsLoading(false);
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
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {roomAccessCode && (
          <FormField
            control={form.control}
            name="accessCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Room Access Code</FormLabel>
                <FormControl>
                  <Input 
                    type="text" 
                    placeholder="Enter access code" 
                    {...field} 
                    className="text-base md:text-sm"
                    aria-required="true"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        <Button type="submit" className="w-full" disabled={isLoading}>
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
