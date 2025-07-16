
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebaseClient";
import { verifyBeforeUpdateEmail, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";

const changeEmailSchema = z.object({
  newEmail: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(1, { message: "Password is required to make this change." }),
});

type ChangeEmailFormValues = z.infer<typeof changeEmailSchema>;

export default function ChangeEmailForm() {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<ChangeEmailFormValues>({
    resolver: zodResolver(changeEmailSchema),
    defaultValues: { newEmail: "", password: "" },
  });

  async function onSubmit(values: ChangeEmailFormValues) {
    setIsLoading(true);
    const user = auth.currentUser;

    if (!user || !user.email) {
      toast({ variant: "destructive", title: "Not Authenticated", description: "You must be logged in to change your email." });
      setIsLoading(false);
      return;
    }

    const credential = EmailAuthProvider.credential(user.email, values.password);

    try {
      await reauthenticateWithCredential(user, credential);
      await verifyBeforeUpdateEmail(user, values.newEmail);
      
      toast({
        title: "Verification Email Sent",
        description: `A verification link has been sent to ${values.newEmail}. Please click the link to finalize your email change.`,
      });
      router.push("/admin/dashboard");
    } catch (error: any) {
      console.error("Email change error:", error);
      let errorMessage = "An unexpected error occurred.";
      if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        errorMessage = "The password you entered is incorrect. Please try again.";
      } else if (error.code === 'auth/email-already-in-use') {
        errorMessage = "This email address is already in use by another account.";
      } else if (error.code === 'auth/requires-recent-login') {
          errorMessage = "This action is sensitive and requires recent authentication. Please log out and log back in before trying again.";
      } else if (error.code === 'auth/operation-not-allowed') {
          errorMessage = "This operation is not allowed. Your Firebase project may require email verification to be enabled for this feature to work.";
      }
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: errorMessage,
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
          name="newEmail"
          render={({ field }) => (
            <FormItem>
              <FormLabel>New Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="new.admin@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Current Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Updating...
            </>
          ) : (
            "Update Email"
          )}
        </Button>
      </form>
    </Form>
  );
}
