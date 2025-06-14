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
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import type { ElectionRoom, Position, Candidate } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Trash2, Loader2, GripVertical } from "lucide-react";
import { useState } from "react";

const candidateSchema = z.object({
  name: z.string().min(1, "Candidate name is required."),
  // imageUrl: z.string().url("Must be a valid URL.").optional().or(z.literal('')), // Optional for now
});

const positionSchema = z.object({
  title: z.string().min(1, "Position title is required."),
  candidates: z.array(candidateSchema).min(1, "At least one candidate is required for a position."),
});

const electionRoomFormSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters." }),
  description: z.string().min(10, { message: "Description must be at least 10 characters." }),
  isAccessRestricted: z.boolean().default(false),
  accessCode: z.string().optional(),
  positions: z.array(positionSchema).min(1, "At least one position is required."),
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
  initialData?: ElectionRoom; // For editing
}

export default function ElectionRoomForm({ initialData }: ElectionRoomFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<ElectionRoomFormValues>({
    resolver: zodResolver(electionRoomFormSchema),
    defaultValues: initialData ? {
      ...initialData,
      positions: initialData.positions.map(p => ({
        ...p,
        candidates: p.candidates.map(c => ({ name: c.name /* imageUrl: c.imageUrl */ }))
      }))
    } : {
      title: "",
      description: "",
      isAccessRestricted: false,
      accessCode: "",
      positions: [{ title: "", candidates: [{ name: "" }] }],
    },
  });

  const { fields: positionFields, append: appendPosition, remove: removePosition } = useFieldArray({
    control: form.control,
    name: "positions",
  });
  
  const watchIsAccessRestricted = form.watch("isAccessRestricted");

  async function onSubmit(values: ElectionRoomFormValues) {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log("Form submitted:", values);

    toast({
      title: initialData ? "Election Room Updated" : "Election Room Created",
      description: `"${values.title}" has been successfully ${initialData ? 'updated' : 'created'}.`,
    });
    router.push("/admin/dashboard");
    setIsLoading(false);
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
          {positionFields.map((positionItem, positionIndex) => (
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
                <CandidateFields positionIndex={positionIndex} control={form.control} />
              </CardContent>
            </Card>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={() => appendPosition({ title: "", candidates: [{ name: "" }] })}
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


function CandidateFields({ positionIndex, control }: { positionIndex: number; control: any }) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `positions.${positionIndex}.candidates`,
  });

  const { formState: { errors } } = useForm({ control });
  const candidateErrors = errors.positions?.[positionIndex]?.candidates;

  return (
    <div className="space-y-3 pl-4 border-l-2 border-primary/20">
      <h4 className="text-sm font-medium text-muted-foreground">Candidates for this position:</h4>
      {fields.map((candidateItem, candidateIndex) => (
        <div key={candidateItem.id} className="flex items-end gap-2 group/candidate">
          <FormField
            control={control}
            name={`positions.${positionIndex}.candidates.${candidateIndex}.name`}
            render={({ field }) => (
              <FormItem className="flex-grow">
                 {candidateIndex === 0 && <FormLabel className="text-xs">Candidate Name</FormLabel>}
                <FormControl>
                  <Input placeholder={`Candidate ${candidateIndex + 1} Name`} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {/* Optional Image URL field - can be added later
          <FormField
            control={control}
            name={`positions.${positionIndex}.candidates.${candidateIndex}.imageUrl`}
            render={({ field }) => (
              <FormItem className="flex-grow">
                {candidateIndex === 0 && <FormLabel className="text-xs">Image URL (Optional)</FormLabel>}
                <FormControl>
                  <Input placeholder="https://example.com/image.png" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          */}
          {fields.length > 1 && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => remove(candidateIndex)}
              className="text-destructive hover:bg-destructive/10 h-9 w-9 mb-1 opacity-50 group-hover/candidate:opacity-100 transition-opacity"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      ))}
      <Button
        type="button"
        variant="link"
        size="sm"
        onClick={() => append({ name: "" })}
        className="text-primary hover:text-primary/80 px-0"
      >
        <PlusCircle className="mr-1 h-4 w-4" /> Add Candidate
      </Button>
      {typeof candidateErrors === 'string' && <p className="text-sm font-medium text-destructive">{candidateErrors}</p>}
      {typeof candidateErrors?.root === 'object' && <p className="text-sm font-medium text-destructive">{candidateErrors.root.message}</p>}

    </div>
  );
}

