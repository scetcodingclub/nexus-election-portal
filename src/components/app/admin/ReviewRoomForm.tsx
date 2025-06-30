
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import type { ElectionRoom } from "@/lib/types"; 
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Trash2, Loader2, GripVertical } from "lucide-react";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebaseClient"; 
import { doc, setDoc, addDoc, collection, serverTimestamp, Timestamp } from "firebase/firestore"; 

// Simplified candidate schema without image
const candidateSchema = z.object({
  id: z.string().optional(), 
  name: z.string().min(1, "Candidate name is required."),
  voteCount: z.number().optional(),
});

const positionSchema = z.object({
  id: z.string().optional(), 
  title: z.string().min(1, "Position title is required."),
  candidates: z.array(candidateSchema).min(1, "At least one candidate is required for a position."),
});

const reviewRoomFormSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters." }),
  description: z.string().min(10, { message: "Description must be at least 10 characters." }),
  isAccessRestricted: z.boolean().default(false),
  accessCode: z.string().optional(),
  positions: z.array(positionSchema).min(1, "At least one position is required."),
  status: z.enum(["pending", "active", "closed"]).optional(),
}).refine(data => {
  if (data.isAccessRestricted && (!data.accessCode || data.accessCode.length < 4)) {
    return false;
  }
  return true;
}, {
  message: "Access code must be at least 4 characters if access is restricted.",
  path: ["accessCode"],
});

type ReviewRoomFormValues = z.infer<typeof reviewRoomFormSchema>;

interface ReviewRoomFormProps {
  initialData?: ElectionRoom; 
}

const generateClientSideId = (prefix: string = "item") => `${prefix}-${Math.random().toString(36).substr(2, 9)}`;

export default function ReviewRoomForm({ initialData }: ReviewRoomFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isFormMounted, setIsFormMounted] = useState(false);

  const form = useForm<ReviewRoomFormValues>({
    resolver: zodResolver(reviewRoomFormSchema),
    defaultValues: initialData ? {
      title: initialData.title || "",
      description: initialData.description || "",
      isAccessRestricted: initialData.isAccessRestricted || false,
      accessCode: initialData.accessCode || "",
      status: initialData.status || "pending",
      positions: (initialData.positions || []).map(p => ({
        id: p.id,
        title: p.title || "",
        candidates: (p.candidates || []).map(c => ({
          id: c.id,
          name: c.name || "",
          voteCount: c.voteCount || 0,
        })),
      })),
    } : {
      title: "",
      description: "",
      isAccessRestricted: false,
      accessCode: "",
      status: "pending",
      positions: [],
    },
  });
  
  const { fields: positionFields, append: appendPosition, remove: removePosition } = useFieldArray({
    control: form.control,
    name: "positions",
  });

  useEffect(() => {
    setIsFormMounted(true);
    if (!initialData && positionFields.length === 0 && form.formState.isMounted) {
      appendPosition({
        id: generateClientSideId('pos'),
        title: "",
        candidates: [{
          id: generateClientSideId('cand'),
          name: "",
        }]
      });
    }
  }, [initialData, appendPosition, positionFields.length, form.formState.isMounted]);
  
  const watchIsAccessRestricted = form.watch("isAccessRestricted");

  async function onSubmit(values: ReviewRoomFormValues) {
    setIsLoading(true);

    const firestoreReadyPositions = values.positions.map(p => ({
        id: p.id || generateClientSideId('pos'),
        title: p.title,
        candidates: p.candidates.map(c => ({
            id: c.id || generateClientSideId('cand'),
            name: c.name,
            voteCount: c.voteCount || 0 
        })),
    }));

    const dataToSave: any = { 
      title: values.title,
      description: values.description,
      isAccessRestricted: values.isAccessRestricted,
      positions: firestoreReadyPositions,
      status: values.status || 'pending',
      roomType: 'review', // Differentiate this from a voting room
    };

    if (values.isAccessRestricted) {
      dataToSave.accessCode = values.accessCode;
    } else {
      dataToSave.accessCode = null; 
    }
    
    try {
      if (initialData?.id) {
        const roomRef = doc(db, "electionRooms", initialData.id);
        await setDoc(roomRef, {
          ...dataToSave,
          updatedAt: serverTimestamp(),
          createdAt: initialData.createdAt ? Timestamp.fromDate(new Date(initialData.createdAt)) : serverTimestamp(),
        }, { merge: true }); 
        toast({
          title: "Review Room Updated",
          description: `"${values.title}" has been successfully updated.`,
        });
      } else {
        dataToSave.status = dataToSave.status || 'pending';
        await addDoc(collection(db, "electionRooms"), {
          ...dataToSave,
          createdAt: serverTimestamp(),
        });
        toast({
          title: "Review Room Created",
          description: `"${values.title}" has been successfully created.`,
        });
      }
      router.push("/admin/dashboard");
      router.refresh(); 
    } catch (error) {
      console.error("Error saving review room: ", error);
      toast({
        variant: "destructive",
        title: "Save Failed",
        description: "Could not save review room. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }
  
  if (!isFormMounted && !initialData) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Loading form...</p>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Room Title</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Q1 2024 Member Review" {...field} suppressHydrationWarning={true} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="Provide a brief description of the review/rating." {...field} rows={4} suppressHydrationWarning={true} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {initialData && ( 
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Room Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} >
                  <FormControl>
                    <SelectTrigger suppressHydrationWarning={true}>
                      <SelectValue placeholder="Select room status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  Manage the current state. Set to 'Active' to start the review.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="isAccessRestricted"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm">
              <FormControl>
                <Checkbox checked={field.value} onCheckedChange={field.onChange} suppressHydrationWarning={true}/>
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Restrict Access?</FormLabel>
                <FormDescription>
                  If checked, participants will need an access code to enter this room.
                </FormDescription>
              </div>
            </FormItem>
          )}
        />
        {watchIsAccessRestricted && (
          <FormField
            control={form.control}
            name="accessCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Access Code</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., REVIEW2024" {...field} suppressHydrationWarning={true} />
                </FormControl>
                <FormDescription>
                  A unique code for participants to access this room. Minimum 4 characters.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Positions</h3>
          {positionFields.map((positionItem, positionIndex) => ( 
            <Card key={positionItem.id} className="relative group/position">
              <CardHeader className="flex flex-row items-center justify-between py-3 px-4 border-b">
                <CardTitle className="text-md">Position #{positionIndex + 1}</CardTitle>
                <div className="flex items-center gap-2">
                   <Button type="button" variant="ghost" size="icon" className="h-7 w-7 cursor-grab active:cursor-grabbing opacity-50 group-hover/position:opacity-100 transition-opacity" suppressHydrationWarning={true}>
                     <GripVertical className="h-4 w-4" />
                   </Button>
                  {positionFields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removePosition(positionIndex)}
                      className="text-destructive hover:bg-destructive/10 h-7 w-7"
                      suppressHydrationWarning={true}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <FormField
                  control={form.control}
                  name={`positions.${positionIndex}.title`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Position Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., President" {...field} suppressHydrationWarning={true} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <SimpleCandidateFields positionIndex={positionIndex} control={form.control} form={form} />
              </CardContent>
            </Card>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={() => appendPosition({ 
                id: generateClientSideId('pos'), 
                title: "", 
                candidates: [{ 
                    id: generateClientSideId('cand'), 
                    name: "", 
                }] 
            })}
            className="w-full"
            suppressHydrationWarning={true}
          >
            <PlusCircle className="mr-2 h-4 w-4" /> Add Position
          </Button>
           {form.formState.errors.positions && !form.formState.errors.positions.root && (
             <p className="text-sm font-medium text-destructive">{form.formState.errors.positions.message}</p>
           )}
           {form.formState.errors.positions?.root && (
             <p className="text-sm font-medium text-destructive">{form.formState.errors.positions.root.message}</p>
           )}
        </div>

        <Button type="submit" className="w-full" disabled={isLoading} suppressHydrationWarning={true}>
           {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {initialData ? 'Updating Room...' : 'Creating Room...'}
            </>
          ) : (
            initialData ? 'Update Review Room' : 'Create Review Room'
          )}
        </Button>
      </form>
    </Form>
  );
}

interface SimpleCandidateFieldsProps {
  positionIndex: number;
  control: any; 
  form: any; 
}

function SimpleCandidateFields({ positionIndex, control, form }: SimpleCandidateFieldsProps) {
  const { fields } = useFieldArray({
    control,
    name: `positions.${positionIndex}.candidates`,
  });

  const { formState: { errors } } = form; 
  const candidateErrors = errors.positions?.[positionIndex]?.candidates;

  return (
    <div className="space-y-6 pl-4 border-l-2 border-primary/20">
      <h4 className="text-sm font-medium text-muted-foreground">Candidate for this position:</h4>
      {fields.map((candidateItem, candidateIndex) => {
        return (
          <div key={candidateItem.id} className="flex flex-row items-center gap-4">
            <div className="flex-grow">
                <FormField
                control={control}
                name={`positions.${positionIndex}.candidates.${candidateIndex}.name`}
                render={({ field }) => (
                    <FormItem>
                    <FormLabel className="text-xs sr-only">Candidate Name</FormLabel>
                    <FormControl>
                        <Input placeholder={`Candidate Name`} {...field} suppressHydrationWarning={true} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
          </div>
        );
      })}
      {typeof candidateErrors === 'string' && <p className="text-sm font-medium text-destructive">{candidateErrors}</p>}
      {candidateErrors?.root && typeof candidateErrors.root === 'object' && 'message' in candidateErrors.root && (
        <p className="text-sm font-medium text-destructive">{String(candidateErrors.root.message)}</p>
      )}
    </div>
  );
}
