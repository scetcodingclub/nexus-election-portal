
"use client";

import type { ElectionRoom } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import StarRating from "@/components/app/StarRating";
import { formatDistanceToNow } from "date-fns";

interface ReviewResultsDisplayProps {
  room: ElectionRoom;
}

export default function ReviewResultsDisplay({ room }: ReviewResultsDisplayProps) {
  return (
    <div className="space-y-6">
      {room.positions.map(position => {
        const totalReviews = position.reviews?.length || 0;

        return (
            <Card key={position.id} className="shadow-lg">
                <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                        <div>
                            <CardTitle className="text-xl font-headline">
                                Reviews for: {position.title} - {position.candidates[0]?.name}
                            </CardTitle>
                             <CardDescription>
                                A total of {totalReviews} review(s) have been submitted.
                            </CardDescription>
                        </div>
                        <div className="flex flex-col items-start sm:items-end gap-2">
                            <div className="text-lg font-bold text-right">
                                Average Rating: {position.averageRating?.toFixed(2) || 'N/A'} / 5
                            </div>
                            <StarRating rating={position.averageRating || 0} onRatingChange={() => {}} disabled={true} />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="item-1">
                            <AccordionTrigger className="text-base">
                                {`View all ${totalReviews} feedback entries`}
                            </AccordionTrigger>
                            <AccordionContent>
                                {totalReviews > 0 ? (
                                     <div className="space-y-4 pt-4 max-h-[400px] overflow-y-auto pr-2">
                                        {position.reviews?.map((review, index) => (
                                            <div key={index} className="border-b pb-4">
                                                <div className="flex items-center justify-between mb-2">
                                                     <StarRating rating={review.rating} onRatingChange={() => {}} disabled={true} />
                                                     <p className="text-xs text-muted-foreground">
                                                        {formatDistanceToNow(new Date(review.reviewedAt), { addSuffix: true })}
                                                     </p>
                                                </div>
                                                <p className="text-sm bg-muted/50 p-3 rounded-md">{review.feedback}</p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-muted-foreground text-center py-4">No written feedback was provided.</p>
                                )}
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </CardContent>
            </Card>
        )
      })}
    </div>
  );
}
