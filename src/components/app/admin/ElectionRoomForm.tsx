
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
import { PlusCircle, Trash2, Loader2, GripVertical, Image as ImageIcon } from "lucide-react";
import { useState, ChangeEvent, useEffect } from "react"; // Added useEffect
import Image from "next/image";
import { storage, db } from "@/lib/firebaseClient"; 
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, setDoc, addDoc, collection, serverTimestamp } from "firebase/firestore"; 
import { cn } from "@/lib/utils";


const candidateSchema = z.object({
  id: z.string().optional(), 
  name: z.string().min(1, "Candidate name is required."),
  imageUrl: z.string().url("Image URL must be a valid URL.").optional().or(z.literal('')),
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

type ElectionRoomFormValues = z.infer<typeof electionRoomFormSchema>;

interface ElectionRoomFormProps {
  initialData?: ElectionRoom; 
}

export default function ElectionRoomForm({ initialData }: ElectionRoomFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<ElectionRoomFormValues>({
    resolver: zodResolver(electionRoomFormSchema),
    defaultValues: initialData ? {
      ...initialData, // Use initialData directly
      status: initialData.status || "pending",
      // Ensure positions and candidates arrays are initialized if not present in initialData
      positions: (initialData.positions || []).map(p => ({
        ...p,
        id: p.id || `pos-${Math.random().toString(36).substr(2, 9)}`, // Fallback ID for client-side consistency if needed
        candidates: (p.candidates || []).map(c => ({
            ...c,
            id: c.id || `cand-${Math.random().toString(36).substr(2, 9)}`, // Fallback ID for client-side consistency
            imageUrl: c.imageUrl || ''
        }))
      }))
    } : {
      title: "",
      description: "",
      isAccessRestricted: false,
      accessCode: "",
      status: "pending",
      positions: [{ 
          id: `pos-${Math.random().toString(36).substr(2, 9)}`, 
          title: "", 
          candidates: [{ 
              id: `cand-${Math.random().toString(36).substr(2, 9)}`, 
              name: "", 
              imageUrl: "" 
            }] 
        }],
    },
  });

  const { fields: positionFields, append: appendPosition, remove: removePosition } = useFieldArray({
    control: form.control,
    name: "positions",
  });
  
  const watchIsAccessRestricted = form.watch("isAccessRestricted");

  const generateClientSideId = () => Math.random().toString(36).substr(2, 9);


  async function onSubmit(values: ElectionRoomFormValues) {
    setIsLoading(true);

    const firestoreReadyPositions = values.positions.map(p => ({
        title: p.title,
        // Ensure candidates always have an id; Firestore might not need it if we don't query by it
        // but it's good for consistency if we rebuild the form from Firestore data.
        // For saving, we care more about name and imageUrl.
        candidates: p.candidates.map(c => ({
            name: c.name,
            imageUrl: c.imageUrl,
            // id: c.id || `cand-${generateClientSideId()}`, // ID from form is fine, or generate if needed
            voteCount: c.voteCount || 0 // Persist voteCount if it exists
        })),
        id: p.id || `pos-${generateClientSideId()}` // Persist position id
    }));

    const dataToSave: any = { 
      title: values.title,
      description: values.description,
      isAccessRestricted: values.isAccessRestricted,
      positions: firestoreReadyPositions, // Use processed positions
    };

    if (values.isAccessRestricted) {
      dataToSave.accessCode = values.accessCode;
    } else {
      dataToSave.accessCode = null; 
    }
    
    if (initialData && values.status) {
        dataToSave.status = values.status;
    }


    try {
      if (initialData?.id) {
        const roomRef = doc(db, "electionRooms", initialData.id);
        await setDoc(roomRef, {
          ...dataToSave,
          updatedAt: serverTimestamp(),
          // Ensure createdAt is not overwritten if it exists
          createdAt: initialData.createdAt ? Timestamp.fromDate(new Date(initialData.createdAt)) : serverTimestamp(),
        }, { merge: true }); 
        toast({
          title: "Election Room Updated",
          description: `"${values.title}" has been successfully updated.`,
        });
      } else {
        await addDoc(collection(db, "electionRooms"), {
          ...dataToSave,
          createdAt: serverTimestamp(),
          status: "pending", 
        });
        toast({
          title: "Election Room Created",
          description: `"${values.title}" has been successfully created.`,
        });
      }
      router.push("/admin/dashboard");
      router.refresh(); 
    } catch (error) {
      console.error("Error saving election room: ", error);
      toast({
        variant: "destructive",
        title: "Save Failed",
        description: "Could not save election room. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Election Title</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Annual Student Body Election" {...field} />
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
                <Textarea placeholder="Provide a brief description of the election." {...field} rows={4} />
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
                <FormLabel>Election Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
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
                  Manage the current state of the election room.
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
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Restrict Access?</FormLabel>
                <FormDescription>
                  If checked, voters will need an access code to enter this election room.
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
                  <Input placeholder="e.g., VOTE2024" {...field} />
                </FormControl>
                <FormDescription>
                  A unique code for voters to access this room. Minimum 4 characters.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Positions and Candidates</h3>
          {positionFields.map((positionItem, positionIndex) => ( // positionItem.id is from RHF
            <Card key={positionItem.id} className="relative group/position">
              <CardHeader className="flex flex-row items-center justify-between py-3 px-4 border-b">
                <CardTitle className="text-md">Position #{positionIndex + 1}</CardTitle>
                <div className="flex items-center gap-2">
                   <Button type="button" variant="ghost" size="icon" className="h-7 w-7 cursor-grab active:cursor-grabbing opacity-50 group-hover/position:opacity-100 transition-opacity">
                     <GripVertical className="h-4 w-4" />
                   </Button>
                  {positionFields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removePosition(positionIndex)}
                      className="text-destructive hover:bg-destructive/10 h-7 w-7"
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
                        <Input placeholder="e.g., President" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <CandidateFields positionIndex={positionIndex} form={form} control={form.control} />
              </CardContent>
            </Card>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={() => appendPosition({ 
                id: `pos-${generateClientSideId()}`, 
                title: "", 
                candidates: [{ 
                    id: `cand-${generateClientSideId()}`, 
                    name: "", 
                    imageUrl:"" 
                }] 
            })}
            className="w-full"
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

        <Button type="submit" className="w-full" disabled={isLoading}>
           {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {initialData ? 'Updating Room...' : 'Creating Room...'}
            </>
          ) : (
            initialData ? 'Update Election Room' : 'Create Election Room'
          )}
        </Button>
      </form>
    </Form>
  );
}


interface CandidateFieldsProps {
  positionIndex: number;
  control: any; 
  form: any; 
}

function CandidateFields({ positionIndex, control, form }: CandidateFieldsProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `positions.${positionIndex}.candidates`,
  });

  const { toast } = useToast();
  const [uploadingStates, setUploadingStates] = useState<Record<string, boolean>>({});
  const [isClientMounted, setIsClientMounted] = useState(false); // For hydration fix

  useEffect(() => {
    setIsClientMounted(true); // Component has mounted on client
  }, []);

  const generateClientSideId = () => Math.random().toString(36).substr(2, 9);

  const handleFileChange = async (
    event: ChangeEvent<HTMLInputElement>,
    candidateInternalId: string, // This is the RHF field id
    candidateIndex: number
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingStates(prev => ({ ...prev, [candidateInternalId]: true }));

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
      setUploadingStates(prev => ({ ...prev, [candidateInternalId]: false }));
      if (event.target) {
        event.target.value = "";
      }
    }
  };
  
  const { formState: { errors } } = form; 
  const candidateErrors = errors.positions?.[positionIndex]?.candidates;


  return (
    <div className="space-y-6 pl-4 border-l-2 border-primary/20">
      <h4 className="text-sm font-medium text-muted-foreground">Candidates for this position:</h4>
      {fields.map((candidateItem, candidateIndex) => { // candidateItem.id IS the stable RHF field ID
        const currentImageUrl = form.watch(`positions.${positionIndex}.candidates.${candidateIndex}.imageUrl`);
        const uniqueFileId = isClientMounted ? `file-upload-${candidateItem.id}` : undefined;

        return (
          <div key={candidateItem.id} className="flex flex-col sm:flex-row items-start gap-4 group/candidate p-3 border rounded-md bg-background/50">
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
                    id={uniqueFileId} // Use client-side generated ID
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, candidateItem.id, candidateIndex)}
                    className="mt-2 text-xs h-8"
                    disabled={uploadingStates[candidateItem.id]}
                    // field.value and field.onChange are for the imageUrl string, not the file itself.
                    // File input is largely uncontrolled by RHF value for native file inputs.
                  />
                )}
              />
              <FormMessage>{form.formState.errors.positions?.[positionIndex]?.candidates?.[candidateIndex]?.imageUrl?.message}</FormMessage>
            </div>

            <div className="flex-grow space-y-3">
                <FormField
                control={control}
                name={`positions.${positionIndex}.candidates.${candidateIndex}.name`}
                render={({ field }) => (
                    <FormItem>
                    <FormLabel className="text-xs">Candidate Name</FormLabel>
                    <FormControl>
                        <Input placeholder={`Candidate ${candidateIndex + 1} Name`} {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>

            {fields.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => remove(candidateIndex)}
                className="text-destructive hover:bg-destructive/10 h-8 w-8 opacity-50 group-hover/candidate:opacity-100 transition-opacity self-start sm:self-center mt-2 sm:mt-0"
                disabled={uploadingStates[candidateItem.id]}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        );
      })}
      <Button
        type="button"
        variant="link"
        size="sm"
        onClick={() => append({ id: `cand-${generateClientSideId()}`, name: "", imageUrl: "" })}
        className="text-primary hover:text-primary/80 px-0"
      >
        <PlusCircle className="mr-1 h-4 w-4" /> Add Candidate
      </Button>
      {typeof candidateErrors === 'string' && <p className="text-sm font-medium text-destructive">{candidateErrors}</p>}
      {candidateErrors?.root && typeof candidateErrors.root === 'object' && 'message' in candidateErrors.root && (
        <p className="text-sm font-medium text-destructive">{String(candidateErrors.root.message)}</p>
      )}

    </div>
  );
}

