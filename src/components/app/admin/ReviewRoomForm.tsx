
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray, Controller } from "react-hook-form";
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
import { PlusCircle, Trash2, Loader2, GripVertical, Eye, EyeOff, ChevronsUpDown, Check } from "lucide-react";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebaseClient"; 
import { doc, setDoc, addDoc, collection, serverTimestamp, Timestamp } from "firebase/firestore";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";

const PREDEFINED_POSITIONS = [
  "President",
  "Vice-President",
  "Secretary",
  "Secretary (Boy)",
  "Secretary (Girl)",
  "Treasurer",
  "Technical Lead",
  "Event Manager",
  "Workshop Manager",
  "Project Manager",
  "Publicity Manager",
  "Convo Manager (Boy)",
  "Convo Manager (Girl)",
];


// Simplified candidate schema without image
const candidateSchema = z.object({
  id: z.string().optional(), 
  name: z.string().min(1, "Candidate name is required."),
  voteCount: z.number().optional(), // Kept for type consistency, but not saved.
});

const positionSchema = z.object({
  id: z.string().optional(), 
  title: z.string().min(1, "Position title is required."),
  candidates: z.array(candidateSchema).min(1).max(1, "Only one candidate is allowed per position in a review room."),
});

const reviewRoomFormSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters." }),
  description: z.string().min(10, { message: "Description must be at least 10 characters." }),
  isAccessRestricted: z.boolean().default(false),
  accessCode: z.string().optional(),
  deletionPassword: z.string().min(6, { message: "Deletion password must be at least 6 characters." }),
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
}).refine(data => {
    const titles = data.positions.map(p => p.title.toLowerCase().trim());
    const uniqueTitles = new Set(titles);
    return uniqueTitles.size === titles.length;
}, {
    message: "Each position must be unique.",
    path: ["positions"],
}).refine(data => {
    const lowercasedPredefined = PREDEFINED_POSITIONS.map(p => p.toLowerCase());
    return !data.positions.some(p => p.title.toLowerCase().trim() === 'custom' && lowercasedPredefined.includes(p.title.toLowerCase().trim()));
}, {
    message: "Custom position title cannot be a predefined position name.",
    path: ["positions"],
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
  const [showDeletionPassword, setShowDeletionPassword] = useState(false);


  const form = useForm<ReviewRoomFormValues>({
    resolver: zodResolver(reviewRoomFormSchema),
    defaultValues: initialData ? {
      title: initialData.title || "",
      description: initialData.description || "",
      isAccessRestricted: initialData.isAccessRestricted || false,
      accessCode: initialData.accessCode || "",
      deletionPassword: initialData.deletionPassword || "",
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
      deletionPassword: "",
      status: "pending",
      positions: [],
    },
  });
  
  const { fields: positionFields, append: appendPosition, remove: removePosition } = useFieldArray({
    control: form.control,
    name: "positions",
  });
  
  const currentPositions = form.watch("positions");

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
            // DO NOT SAVE VOTE COUNT. It is now aggregated from the 'votes' subcollection.
        })),
    }));

    const dataToSave: any = { 
      title: values.title,
      description: values.description,
      isAccessRestricted: values.isAccessRestricted,
      deletionPassword: values.deletionPassword,
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
        
        <FormField
          control={form.control}
          name="deletionPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Deletion Password</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    type={showDeletionPassword ? "text" : "password"}
                    placeholder="Enter a secure password for deletion"
                    {...field}
                    suppressHydrationWarning={true}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowDeletionPassword((prev) => !prev)}
                    aria-label={showDeletionPassword ? "Hide password" : "Show password"}
                  >
                    {showDeletionPassword ? (
                      <EyeOff className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <Eye className="h-5 w-5 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </FormControl>
              <FormDescription>
                This password will be required to delete the room. Minimum 6 characters.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />


        <div className="space-y-4">
          <h3 className="text-lg font-medium">Positions</h3>
          {positionFields.map((positionItem, positionIndex) => {
             const availablePositions = PREDEFINED_POSITIONS.filter(p => 
               !currentPositions.some((cp, cpi) => cpi !== positionIndex && cp.title === p)
             );

            return(
              <PositionCard
                key={positionItem.id}
                positionIndex={positionIndex}
                removePosition={removePosition}
                availablePositions={availablePositions}
                form={form}
                isOnlyPosition={positionFields.length <= 1}
              />
            )
          })}
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

        <Button type="submit" className="w-full flex-grow" disabled={isLoading} suppressHydrationWarning={true}>
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

interface PositionCardProps {
  positionIndex: number;
  removePosition: (index: number) => void;
  availablePositions: string[];
  form: any; // React Hook Form's form object
  isOnlyPosition: boolean;
}

function PositionCard({ positionIndex, removePosition, availablePositions, form, isOnlyPosition }: PositionCardProps) {
  const [popoverOpen, setPopoverOpen] = useState(false);

  return (
    <Card className="relative group/position">
      <CardHeader className="flex flex-row items-center justify-between py-3 px-4 border-b">
        <CardTitle className="text-md">Position #{positionIndex + 1}</CardTitle>
        <div className="flex items-center gap-2">
          <Button type="button" variant="ghost" size="icon" className="h-7 w-7 cursor-grab active:cursor-grabbing opacity-50 group-hover/position:opacity-100 transition-opacity" suppressHydrationWarning={true}>
            <GripVertical className="h-4 w-4" />
          </Button>
          {!isOnlyPosition && (
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
            <FormItem className="flex flex-col">
              <FormLabel>Position Title</FormLabel>
              <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={popoverOpen}
                      className={cn(
                        "w-full justify-between",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value
                        ? PREDEFINED_POSITIONS.find(
                            (pos) => pos === field.value
                          ) || field.value
                        : "Select or type a position..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <Command shouldFilter={false}>
                    <CommandInput 
                      placeholder="Search or create position..."
                      value={field.value || ''}
                      onValueChange={field.onChange}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          setPopoverOpen(false);
                        }
                      }}
                    />
                    <CommandList>
                      <CommandEmpty>No predefined position found.</CommandEmpty>
                      <CommandGroup>
                        {availablePositions
                          .filter(pos => pos.toLowerCase().includes((field.value || '').toLowerCase()))
                          .map((pos) => (
                          <CommandItem
                            value={pos}
                            key={pos}
                            onSelect={() => {
                              form.setValue(`positions.${positionIndex}.title`, pos, { shouldValidate: true });
                              setPopoverOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                pos === field.value ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {pos}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <FormDescription>
                Select a predefined position or type to create a new one.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <SimpleCandidateFields positionIndex={positionIndex} control={form.control} form={form} />
      </CardContent>
    </Card>
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
      <h4 className="text-sm font-medium text-muted-foreground">Person to be Reviewed:</h4>
      {fields.slice(0, 1).map((candidateItem, candidateIndex) => { // Only show one candidate
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
      
      {/* Do not render "Add Candidate" button */}
      
      {typeof candidateErrors === 'string' && <p className="text-sm font-medium text-destructive">{candidateErrors}</p>}
      {candidateErrors?.root && typeof candidateErrors.root === 'object' && 'message' in candidateErrors.root && (
        <p className="text-sm font-medium text-destructive">{String(candidateErrors.root.message)}</p>
      )}
    </div>
  );
}
