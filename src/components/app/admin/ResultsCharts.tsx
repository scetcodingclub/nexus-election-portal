
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
  PieChart,
  Pie,
  Cell,
  Legend,
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
            <CardDescription>Visual representation of votes for each candidate.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {candidatesData.length > 0 ? (
              <>
                <div>
                  <h4 className="text-md font-semibold mb-2 text-center">Bar Chart</h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={candidatesData} layout="vertical" margin={{ left: 20, right: 20, top:5, bottom:5 }}>
                      <XAxis type="number" stroke={mutedForegroundColor} tick={{ fill: mutedForegroundColor, fontSize: 12 }} />
                      <YAxis dataKey="name" type="category" stroke={mutedForegroundColor} width={100} tick={{ fill: foregroundColor, fontSize: 12, width:90 }} interval={0} style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}/>
                      <Tooltip
                        cursor={{ fill: 'hsl(var(--muted))' }}
                        contentStyle={{
                          backgroundColor: 'hsl(var(--background))',
                          borderColor: 'hsl(var(--border))',
                          borderRadius: 'var(--radius)',
                          color: 'hsl(var(--foreground))'
                        }}
                      />
                      <Bar dataKey="votes" barSize={20} radius={[0, 4, 4, 0]}>
                        {candidatesData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div>
                  <h4 className="text-md font-semibold mb-2 text-center">Pie Chart</h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={candidatesData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="votes"
                        nameKey="name"
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        stroke="hsl(var(--border))"
                      >
                        {candidatesData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'hsl(var(--background))',
                          borderColor: 'hsl(var(--border))',
                          borderRadius: 'var(--radius)',
                          color: 'hsl(var(--foreground))'
                        }}
                      />
                      <Legend wrapperStyle={{ color: foregroundColor, fontSize: '12px' }}/>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </>
            ) : (
              <p className="text-muted-foreground text-center py-4">No candidates or votes for this position to display charts.</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
