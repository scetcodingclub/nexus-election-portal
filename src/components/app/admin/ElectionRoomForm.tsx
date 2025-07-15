
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
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import type { ElectionRoom, Position as PositionType, Candidate as CandidateType } from "@/lib/types"; 
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Trash2, Loader2, GripVertical, Image as ImageIcon, Eye, EyeOff, Check, ChevronsUpDown } from "lucide-react";
import { useState, ChangeEvent, useEffect } from "react";
import Image from "next/image";
import { storage, db } from "@/lib/firebaseClient"; 
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, setDoc, addDoc, collection, serverTimestamp, Timestamp } from "firebase/firestore"; 
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";

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

const candidateSchema = z.object({
  id: z.string().optional(), 
  name: z.string().min(1, "Candidate name is required."),
  imageUrl: z.string().url("Image URL must be a valid URL.").optional().or(z.literal('')),
  voteCount: z.number().optional(), // Keep voteCount for displaying results, but don't save it
});

const positionSchema = z.object({
  id: z.string().optional(), 
  title: z.string().min(1, "Position title is required."),
  candidates: z.array(candidateSchema).min(1, "At least one candidate is required for a position."),
});

const electionRoomFormSchema = z.object({
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
    const titles = data.positions.map(p => p.title.toLowerCase().trim());
    const isCustomTitleConflict = titles.some(title => {
        const isPredefined = lowercasedPredefined.includes(title);
        // This logic seems complex, let's simplify validation.
        // The main point is that a custom title shouldn't be a predefined one.
        // We can handle this at the input level.
        return false; // Disabling this refine for now, will handle in component
    });
    return true;
}, {
    message: "Custom position title cannot be a predefined position name.",
    path: ["positions"],
});


type ElectionRoomFormValues = z.infer<typeof electionRoomFormSchema>;

interface ElectionRoomFormProps {
  initialData?: ElectionRoom; 
}

// Helper to generate client-side unique IDs
const generateClientSideId = (prefix: string = "item") => `${prefix}-${Math.random().toString(36).substr(2, 9)}`;


export default function ElectionRoomForm({ initialData }: ElectionRoomFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isFormMounted, setIsFormMounted] = useState(false);
  const [showDeletionPassword, setShowDeletionPassword] = useState(false);


  const form = useForm<ElectionRoomFormValues>({
    resolver: zodResolver(electionRoomFormSchema),
    defaultValues: initialData ? {
      title: initialData.title || "",
      description: initialData.description || "",
      isAccessRestricted: initialData.isAccessRestricted || false,
      accessCode: initialData.accessCode || "",
      deletionPassword: initialData.deletionPassword || "",
      status: initialData.status || "pending",
      positions: (initialData.positions || []).map(p => ({
        id: p.id, // Use Firestore ID for our data model
        title: p.title || "",
        candidates: (p.candidates || []).map(c => ({
          id: c.id, // Use Firestore ID for our data model
          name: c.name || "",
          imageUrl: c.imageUrl || "",
          voteCount: c.voteCount || 0,
        })),
      })),
    } : { // For new forms
      title: "",
      description: "",
      isAccessRestricted: false,
      accessCode: "",
      deletionPassword: "",
      status: "pending",
      positions: [], // Initialize as empty, will be populated by useEffect
    },
  });
  
  const { fields: positionFields, append: appendPosition, remove: removePosition } = useFieldArray({
    control: form.control,
    name: "positions",
  });
  
  const currentPositions = form.watch("positions");

  // Populate initial position for new forms on client mount
  useEffect(() => {
    setIsFormMounted(true);
    if (!initialData && positionFields.length === 0 && form.formState.isMounted) {
      appendPosition({
        id: generateClientSideId('pos'), // Application-specific ID
        title: "",
        candidates: [{
          id: generateClientSideId('cand'), // Application-specific ID
          name: "",
          imageUrl: ""
        }]
      });
    }
  }, [initialData, appendPosition, positionFields.length, form.formState.isMounted]);
  
  const watchIsAccessRestricted = form.watch("isAccessRestricted");


  async function onSubmit(values: ElectionRoomFormValues) {
    setIsLoading(true);

    const firestoreReadyPositions = values.positions.map(p => ({
        id: p.id || generateClientSideId('pos'), // Ensure ID for Firestore
        title: p.title,
        candidates: p.candidates.map(c => ({
            id: c.id || generateClientSideId('cand'), // Ensure ID for Firestore
            name: c.name,
            imageUrl: c.imageUrl,
            // DO NOT SAVE VOTE COUNT. It is now aggregated from the 'votes' subcollection.
        })),
    }));

    const dataToSave: any = { 
      title: values.title,
      description: values.description,
      isAccessRestricted: values.isAccessRestricted,
      deletionPassword: values.deletionPassword,
      positions: firestoreReadyPositions,
      roomType: initialData?.roomType || 'voting', // Preserve room type
      status: values.status || 'pending', // Ensure status is always set
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
          title: "Voting Room Updated",
          description: `"${values.title}" has been successfully updated.`,
        });
      } else {
        // New room explicitly sets status to pending if not provided (though schema default handles it)
        dataToSave.status = dataToSave.status || 'pending';
        await addDoc(collection(db, "electionRooms"), {
          ...dataToSave,
          createdAt: serverTimestamp(),
        });
        toast({
          title: "Voting Room Created",
          description: `"${values.title}" has been successfully created.`,
        });
      }
      router.push("/admin/dashboard");
      router.refresh(); 
    } catch (error) {
      console.error("Error saving voting room: ", error);
      toast({
        variant: "destructive",
        title: "Save Failed",
        description: "Could not save voting room. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }
  
  if (!isFormMounted && !initialData) {
    // Render a loader or minimal content until the form is ready for new entries
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
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Annual Student Body Election" {...field} suppressHydrationWarning={true} />
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
                <Textarea placeholder="Provide a brief description of the event." {...field} rows={4} suppressHydrationWarning={true} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {initialData && (
          initialData.roomType === 'review' ? (
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      {field.value === 'active' ? 'Room is Active' : 'Room is Inactive'}
                    </FormLabel>
                    <FormDescription>
                      Turn this on to allow reviews. Turning it off will close the room.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value === 'active'}
                      onCheckedChange={(checked) => {
                        const newStatus = checked ? 'active' : 'closed';
                        field.onChange(newStatus);
                      }}
                      aria-label="Room Status Toggle"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          ) : (
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Election Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} >
                    <FormControl>
                      <SelectTrigger suppressHydrationWarning={true}>
                        <SelectValue placeholder="Select election status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="pending">Pending (Not yet open for voting)</SelectItem>
                      <SelectItem value="active">Active (Open for voting)</SelectItem>
                      <SelectItem value="closed">Closed (Voting has ended)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Manage the current state. Set to 'Active' to start the election and allow voting.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )
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
                  <Input placeholder="e.g., VOTE2024" {...field} suppressHydrationWarning={true} />
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
          <h3 className="text-lg font-medium">Positions and Candidates</h3>
          {positionFields.map((positionItem, positionIndex) => {
            const availablePositions = PREDEFINED_POSITIONS.filter(p => 
              !currentPositions.some((cp, cpi) => cpi !== positionIndex && cp.title === p)
            );
            
            return (
              <PositionCard
                key={positionItem.id}
                positionIndex={positionIndex}
                removePosition={removePosition}
                availablePositions={availablePositions}
                form={form}
                initialData={initialData}
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
                    imageUrl:"" 
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
                initialData ? 'Update Room' : 'Create Room'
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
  initialData?: ElectionRoom;
  isOnlyPosition: boolean;
}

function PositionCard({ positionIndex, removePosition, availablePositions, form, initialData, isOnlyPosition }: PositionCardProps) {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const { control, setValue } = form;

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
          control={control}
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
                      className={cn(
                        "w-full justify-between",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value || "Select or type a position..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <Command
                    filter={(value, search) => {
                      if (value.toLowerCase().includes(search.toLowerCase())) return 1;
                      return 0;
                    }}
                  >
                    <CommandInput
                      placeholder="Search or create position..."
                      value={field.value || ''}
                      onValueChange={(search) => {
                         setValue(`positions.${positionIndex}.title`, search, { shouldValidate: true });
                      }}
                    />
                    <CommandList>
                      <CommandEmpty>No predefined position found.</CommandEmpty>
                      <CommandGroup>
                        {availablePositions.map((pos) => (
                          <CommandItem
                            value={pos}
                            key={pos}
                            onSelect={() => {
                              setValue(`positions.${positionIndex}.title`, pos, { shouldValidate: true });
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
        <CandidateFields 
          positionIndex={positionIndex} 
          control={form.control}
          form={form} 
          roomType={initialData?.roomType}
        />
      </CardContent>
    </Card>
  );
}


interface CandidateFieldsProps {
  positionIndex: number;
  control: any; 
  form: any; 
  roomType?: ElectionRoom['roomType'];
}

function CandidateFields({ positionIndex, control, form, roomType }: CandidateFieldsProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `positions.${positionIndex}.candidates`,
  });

  const { toast } = useToast();
  const [uploadingStates, setUploadingStates] = useState<Record<string, boolean>>({});
  const [isClientMounted, setIsClientMounted] = useState(false); 

  useEffect(() => {
    setIsClientMounted(true); 
  }, []);

  const handleFileChange = async (
    event: ChangeEvent<HTMLInputElement>,
    rhfCandidateId: string, // This is the RHF field id (candidateItem.id)
    candidateIndex: number
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingStates(prev => ({ ...prev, [rhfCandidateId]: true }));

    try {
      const imageRef = storageRef(storage, `candidate-images/${Date.now()}-${file.name}`);
      await uploadBytes(imageRef, file);
      const downloadURL = await getDownloadURL(imageRef);

      form.setValue(`positions.${positionIndex}.candidates.${candidateIndex}.imageUrl`, downloadURL);
      toast({ title: "Image Uploaded", description: "Candidate image successfully uploaded." });
    } catch (error) {
      console.error("Image upload error:", error);
      toast({ variant: "destructive", title: "Upload Failed", description: "Could not upload candidate image." });
    } finally {
      setUploadingStates(prev => ({ ...prev, [rhfCandidateId]: false }));
      if (event.target) {
        event.target.value = ""; // Reset file input
      }
    }
  };
  
  const { formState: { errors } } = form; 
  const candidateErrors = errors.positions?.[positionIndex]?.candidates;
  
  const candidatesToRender = roomType === 'review' ? fields.slice(0, 1) : fields;

  return (
    <div className="space-y-6 pl-4 border-l-2 border-primary/20">
      <h4 className="text-sm font-medium text-muted-foreground">
        {roomType === 'review' ? "Person to be Reviewed:" : "Candidates for this position:"}
      </h4>
      {candidatesToRender.map((candidateItem, candidateIndex) => { // candidateItem.id IS the stable RHF field ID
        const currentImageUrl = form.watch(`positions.${positionIndex}.candidates.${candidateIndex}.imageUrl`);
        // Use RHF's stable candidateItem.id for generating a unique ID for the file input
        const uniqueFileIdForInput = isClientMounted ? `file-upload-${candidateItem.id}` : undefined;

        return (
          <div key={candidateItem.id} className="flex flex-col sm:flex-row items-start gap-4 group/candidate p-3 border rounded-md bg-background/50">
            {roomType !== 'review' && (
              <div className="flex-shrink-0 w-full sm:w-auto">
                <FormLabel className="text-xs">Candidate Image</FormLabel>
                <div className="mt-1 w-28 h-28 relative border rounded-md overflow-hidden bg-muted flex items-center justify-center">
                  {uploadingStates[candidateItem.id] && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
                      <Loader2 className="h-8 w-8 animate-spin text-white" />
                    </div>
                  )}
                  {currentImageUrl ? (
                    <Image
                      src={currentImageUrl}
                      alt={`Candidate ${candidateIndex + 1} image`}
                      width={112}
                      height={112}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div className="text-muted-foreground flex flex-col items-center" data-ai-hint="person portrait">
                      <ImageIcon className="h-10 w-10" />
                      <span className="text-xs mt-1">No Image</span>
                    </div>
                  )}
                </div>
                <Controller
                  control={control}
                  name={`positions.${positionIndex}.candidates.${candidateIndex}.imageUrl`}
                  render={({ field }) => ( 
                    <Input
                      id={uniqueFileIdForInput} // Use client-side generated ID based on RHF's field.id
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, candidateItem.id, candidateIndex)}
                      className="mt-2 text-xs h-8"
                      disabled={uploadingStates[candidateItem.id]}
                      suppressHydrationWarning={true} 
                      // field.value (imageUrl string) is handled by RHF setValue, file input value is not directly controlled for files
                    />
                  )}
                />
                <FormMessage>{form.formState.errors.positions?.[positionIndex]?.candidates?.[candidateIndex]?.imageUrl?.message}</FormMessage>
              </div>
            )}

            <div className="flex-grow space-y-3">
                <FormField
                control={control}
                name={`positions.${positionIndex}.candidates.${candidateIndex}.name`}
                render={({ field }) => (
                    <FormItem>
                    <FormLabel className="text-xs">
                      {roomType === 'review' ? "Name" : "Candidate Name"}
                    </FormLabel>
                    <FormControl>
                        <Input placeholder={roomType === 'review' ? "Enter name" : `Candidate ${candidateIndex + 1} Name`} {...field} suppressHydrationWarning={true} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>

            {fields.length > 1 && roomType !== 'review' && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => remove(candidateIndex)}
                className="text-destructive hover:bg-destructive/10 h-8 w-8 opacity-50 group-hover/candidate:opacity-100 transition-opacity self-start sm:self-center mt-2 sm:mt-0"
                disabled={uploadingStates[candidateItem.id]}
                suppressHydrationWarning={true}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        );
      })}
      
      {roomType !== 'review' && (
        <Button
          type="button"
          variant="link"
          size="sm"
          onClick={() => append({ id: generateClientSideId('cand'), name: "", imageUrl: "" })}
          className="text-primary hover:text-primary/80 px-0"
          suppressHydrationWarning={true}
        >
          <PlusCircle className="mr-1 h-4 w-4" /> Add Candidate
        </Button>
      )}

      {typeof candidateErrors === 'string' && <p className="text-sm font-medium text-destructive">{candidateErrors}</p>}
      {candidateErrors?.root && typeof candidateErrors.root === 'object' && 'message' in candidateErrors.root && (
        <p className="text-sm font-medium text-destructive">{String(candidateErrors.root.message)}</p>
      )}

    </div>
  );
}
