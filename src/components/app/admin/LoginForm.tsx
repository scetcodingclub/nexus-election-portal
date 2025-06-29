
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
import { useState, useEffect } from "react";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { signInWithEmailAndPassword, AuthError } from "firebase/auth";
import { auth } from "@/lib/firebaseClient";

const loginFormSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

export default function LoginForm() {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: "",
      password: "",
    },
    shouldFocusError: false,
  });

  async function onSubmit(values: LoginFormValues) {
    setIsLoading(true);
    try {
      // Log values for debugging.
      console.log("Attempting login with:", { email: values.email, password: "REDACTED_FOR_SECURITY_IN_FINAL_LOG" });
      // For local debugging only to see the actual password, uncomment the line below. Be sure to remove it before committing or deploying.
      // console.log("Attempting login with:", { email: values.email, password: values.password }); 
      await signInWithEmailAndPassword(auth, values.email, values.password);
      toast({
        title: "Login Successful",
        description: "Redirecting to panel...",
      });
      router.push("/admin/dashboard");
    } catch (error) {
      const authError = error as AuthError;
      let errorMessage = "An unexpected error occurred. Please try again.";
      switch (authError.code) {
        case "auth/user-not-found":
        case "auth/wrong-password":
        case "auth/invalid-credential":
          errorMessage = "Invalid email or password. Please check your credentials. Ensure the user account exists, is enabled, and the password is correct.";
          break;
        case "auth/invalid-email":
          errorMessage = "The email address is not valid.";
          break;
        case "auth/user-disabled":
          errorMessage = "This user account has been disabled. Please enable it in the Firebase Console.";
          break;
        case "auth/api-key-not-valid":
             errorMessage = "Firebase API Key is not valid. Please check your Firebase project configuration in src/lib/firebaseClient.ts.";
             break;
        case "auth/configuration-not-found":
             errorMessage = "Firebase Authentication configuration not found. Please ensure Authentication is enabled in your Firebase console (Build > Authentication > Sign-in method) and the Email/Password provider is active.";
             break;
        default:
          errorMessage = `Login failed: ${authError.message}. Please try again. (Code: ${authError.code})`;
          break;
      }
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: errorMessage,
      });
      console.error("Firebase Auth Error:", authError);
    }
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
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="admin@example.com"
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
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    {...field}
                    className="text-base md:text-sm pr-10"
                    aria-required="true"
                    suppressHydrationWarning={true}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={mounted && showPassword ? "Hide password" : "Show password"}
                    suppressHydrationWarning={true}
                  >
                    {mounted && (
                      showPassword ? (
                        <EyeOff className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <Eye className="h-5 w-5 text-muted-foreground" />
                      )
                    )}
                  </Button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isLoading} suppressHydrationWarning={true}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Logging in...
            </>
          ) : (
            "Login"
          )}
        </Button>
      </form>
    </Form>
  );
}
