
"use client";

import type { Position } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from "recharts";
import { useMemo } from "react";

interface ReviewChartsProps {
  positions: Position[];
}

const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export default function ReviewCharts({ positions }: ReviewChartsProps) {
  const foregroundColor = "hsl(var(--foreground))";
  const mutedForegroundColor = "hsl(var(--muted-foreground))";

  if (!positions || positions.length === 0) {
    return <p className="text-muted-foreground text-center py-8">No positions or results to display charts for.</p>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {positions.map(position => {
        const chartData = position.ratingDistribution?.map((item, index) => ({
            name: item.name,
            count: item.count,
            fill: CHART_COLORS[index % CHART_COLORS.length],
        })) || [];
        
        const totalRatings = chartData.reduce((sum, item) => sum + item.count, 0);

        return (
          <Card key={position.id} className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl font-headline">Rating Distribution for: {position.candidates[0]?.name}</CardTitle>
              <CardDescription>Position: {position.title} | Average Rating: {position.averageRating?.toFixed(2) ?? 'N/A'}</CardDescription>
            </CardHeader>
            <CardContent>
              {totalRatings > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 30 }}>
                    <XAxis type="number" stroke={mutedForegroundColor} tick={{ fill: mutedForegroundColor, fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      stroke={foregroundColor} 
                      tick={{ fill: foregroundColor, fontSize: 14 }} 
                      width={80} 
                      interval={0} 
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      cursor={{ fill: 'hsl(var(--muted))' }}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        borderColor: 'hsl(var(--border))',
                        borderRadius: 'var(--radius)',
                        color: 'hsl(var(--foreground))'
                      }}
                      formatter={(value: number, name: string) => [`${value} review(s)`, 'Count']}
                    />
                    <Bar dataKey="count" barSize={35} radius={[0, 8, 8, 0]}>
                       <LabelList dataKey="count" position="right" offset={10} className="fill-foreground font-semibold" />
                        {chartData.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-muted-foreground text-center py-4 h-[350px] flex items-center justify-center">No ratings submitted for this position yet.</p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
