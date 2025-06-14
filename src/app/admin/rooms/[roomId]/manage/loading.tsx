import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

export default function Loading() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Skeleton className="h-10 w-48" /> {/* Back button */}
      
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-3/4 mb-2" /> {/* Title */}
          <Skeleton className="h-4 w-1/2" /> {/* Description */}
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Form Skeletons */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-1/4" /> {/* Label */}
            <Skeleton className="h-10 w-full" /> {/* Input */}
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-1/4" /> {/* Label */}
            <Skeleton className="h-24 w-full" /> {/* Textarea */}
          </div>
          <Skeleton className="h-10 w-full border p-4" /> {/* Checkbox item */}
          
          {/* Positions Skeletons */}
          <div>
            <Skeleton className="h-6 w-1/3 mb-4" /> {/* Positions Title */}
            <div className="space-y-4">
              {[1, 2].map(i => (
                <Card key={i}>
                  <CardHeader className="py-3 px-4 border-b">
                    <Skeleton className="h-5 w-1/4" />
                  </CardHeader>
                  <CardContent className="p-4 space-y-4">
                    <div className="space-y-2">
                       <Skeleton className="h-4 w-1/5" /> {/* Label */}
                       <Skeleton className="h-10 w-full" /> {/* Input */}
                    </div>
                     <div className="pl-4 border-l-2 space-y-3">
                        <Skeleton className="h-4 w-1/3" /> {/* Candidates sub-label */}
                        <Skeleton className="h-10 w-full" /> {/* Candidate Input */}
                        <Skeleton className="h-8 w-1/3" /> {/* Add candidate button */}
                     </div>
                  </CardContent>
                </Card>
              ))}
            </div>
             <Skeleton className="h-10 w-full mt-4" /> {/* Add position button */}
          </div>
          <Skeleton className="h-12 w-full" /> {/* Submit button */}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-1/2" /> {/* Access & Sharing Title */}
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" /> {/* Shareable Link Alert */}
          <Skeleton className="h-40 w-full" /> {/* QR Code Alert */}
        </CardContent>
      </Card>
    </div>
  );
}
