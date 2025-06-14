import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function ResultsLoading() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <Skeleton className="h-10 w-56 mb-2 sm:mb-0 sm:mr-4" /> {/* Back button */}
          <Skeleton className="h-10 w-3/4 mt-2" /> {/* Title */}
          <Skeleton className="h-5 w-full mt-1" /> {/* Description */}
        </div>
        <Skeleton className="h-10 w-full sm:w-48" /> {/* Export Button */}
      </div>

      <Skeleton className="h-12 w-full md:w-1/2" /> {/* Tabs List */}

      {/* Placeholder for Tabs Content (e.g., charts or table) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {[1, 2].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-7 w-3/5" /> {/* Chart/Position Title */}
              <Skeleton className="h-4 w-4/5" /> {/* Chart Description */}
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" /> {/* Chart Area */}
            </CardContent>
          </Card>
        ))}
      </div>
       <Card>
            <CardHeader>
                <Skeleton className="h-7 w-2/5" /> {/* Table Title */}
                <Skeleton className="h-4 w-3/5" /> {/* Table Description */}
            </CardHeader>
            <CardContent>
                <Skeleton className="h-10 w-full mb-2" /> {/* Table Header */}
                <Skeleton className="h-16 w-full mb-1" /> {/* Table Row 1 */}
                <Skeleton className="h-16 w-full mb-1" /> {/* Table Row 2 */}
                <Skeleton className="h-16 w-full" /> {/* Table Row 3 */}
            </CardContent>
        </Card>
    </div>
  );
}
