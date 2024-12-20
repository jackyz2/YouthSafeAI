"use client"

import React from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface RiskTypePieChartProps {
  data: { name: string; value: number }[];
}

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  'hsl(var(--chart-6))',
  'hsl(var(--chart-7))',
  'hsl(var(--chart-8))',
];

const CustomLegend: React.FC<{ data: { name: string; value: number }[] }> = ({ data }) => {
  const displayedData = data.slice(0, 5); // Limit to first 5 entries or fewer

  return (
    <ul className="space-y-2 list-none m-0 p-0">
      {displayedData.map((entry, index) => (
        <li key={`legend-${index}`} className="flex items-center gap-2">
          {/* Circle */}
          <div
            className="w-4 h-4 mr-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: COLORS[index % COLORS.length] }}
          />
          {/* Fixed Width Text */}
          <span className="text-sm" style={{ maxWidth: "150px" }}>
            {entry.name}
          </span>
        </li>
      ))}
    </ul>
  );
};


export default function RiskTypePieChart({ data }: RiskTypePieChartProps) {
  const pieData = data;

  return (
    <Card className="w-full max-h-[499px] shadow-lg">
      <CardHeader>
        <CardTitle>Risk Type Distribution</CardTitle>
        <CardDescription>Distribution of risk types based on count</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row items-center justify-between">
          {/* Pie Chart Section */}
          <div className="w-full md:w-2/3 h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={90}
                  outerRadius={120}
                  fill="#8884d8"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number, name: string) => [`${value}`, `${name}`]} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend Section */}
          <div className="w-full md:w-1/3 p-4">
            <CustomLegend data={pieData} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
