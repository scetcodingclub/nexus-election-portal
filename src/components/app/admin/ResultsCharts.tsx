
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
} from "recharts"; // Shadcn/ui charts use recharts
import { useMemo } from "react";

interface ResultsChartsProps {
  positions: Position[];
}

const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(174 100% 20%)",
  "hsl(174 100% 28%)",
  "hsl(174 100% 32%)",
];


export default function ResultsCharts({ positions }: ResultsChartsProps) {
  const foregroundColor = "hsl(var(--foreground))"; // From globals.css
  const mutedForegroundColor = "hsl(var(--muted-foreground))";

  const chartDataByPosition = useMemo(() => {
    return positions.map(position => ({
      positionTitle: position.title,
      candidatesData: position.candidates.map((candidate, index) => ({
        name: candidate.name,
        votes: candidate.voteCount || 0,
        fill: CHART_COLORS[index % CHART_COLORS.length],
      })).sort((a,b) => b.votes - a.votes), // Sort for bar chart
    }));
  }, [positions]);

  if (!positions || positions.length === 0) {
    return <p className="text-muted-foreground text-center py-8">No positions or results to display charts for.</p>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {chartDataByPosition.map(({ positionTitle, candidatesData }) => (
        <Card key={positionTitle} className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-headline">{positionTitle} - Vote Distribution</CardTitle>
            <CardDescription>A visual representation of votes for each candidate in this position.</CardDescription>
          </CardHeader>
          <CardContent>
            {candidatesData.length > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={candidatesData} layout="vertical" margin={{ left: 30, right: 30, top:5, bottom:5 }}>
                  <XAxis type="number" stroke={mutedForegroundColor} tick={{ fill: mutedForegroundColor, fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    stroke={foregroundColor} 
                    tick={{ fill: foregroundColor, fontSize: 14 }} 
                    width={120} 
                    interval={0} 
                    tickLine={false}
                    axisLine={false}
                    style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                  />
                  <Tooltip
                    cursor={{ fill: 'hsl(var(--muted))' }}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      borderColor: 'hsl(var(--border))',
                      borderRadius: 'var(--radius)',
                      color: 'hsl(var(--foreground))'
                    }}
                  />
                  <Bar dataKey="votes" barSize={30} radius={[0, 8, 8, 0]}>
                    <LabelList dataKey="votes" position="right" offset={10} className="fill-foreground font-semibold" />
                    {candidatesData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-center py-4">No candidates or votes for this position to display charts.</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
