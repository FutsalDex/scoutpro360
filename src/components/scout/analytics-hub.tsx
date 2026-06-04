
"use client"

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Area, AreaChart } from "recharts";
import { TrendingUp, Activity, Target, Brain, ShieldCheck } from "lucide-react";
import { useTranslation } from '@/lib/i18n/context';

const PIM_TREND_DATA = [
  { month: 'Jan', avgPim: 68, topPim: 82 },
  { month: 'Feb', avgPim: 70, topPim: 85 },
  { month: 'Mar', avgPim: 72, topPim: 89 },
  { month: 'Apr', avgPim: 75, topPim: 92 },
  { month: 'May', avgPim: 74, topPim: 91 },
  { month: 'Jun', avgPim: 76, topPim: 94 },
];

const SCOUT_PRODUCTIVITY_DATA = [
  { name: 'M. Scout', reports: 45, impact: 82 },
  { name: 'J. Analyst', reports: 38, impact: 78 },
  { name: 'D. Director', reports: 22, impact: 91 },
  { name: 'L. Scout', reports: 52, impact: 74 },
];

export function AnalyticsHub() {
  const { t } = useTranslation();

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold text-foreground">{t.analytics.title}</h1>
          <p className="text-muted-foreground">{t.analytics.subtitle}</p>
        </div>
        <div className="flex gap-4">
          <div className="text-right">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t.analytics.index}</p>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black font-headline text-primary">76.4</span>
              <TrendingUp className="h-4 w-4 text-accent" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <Card className="border-border/40 bg-card/40 shadow-xl overflow-hidden">
          <CardHeader className="bg-secondary/10 pb-6 border-b border-border/10">
            <CardTitle className="text-lg font-headline flex items-center gap-3">
              <Activity className="text-primary h-5 w-5" /> {t.analytics.historical}
            </CardTitle>
            <CardDescription>{t.analytics.historicalDesc}</CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={PIM_TREND_DATA}>
                  <defs>
                    <linearGradient id="colorPim" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={10} axisLine={false} tickLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                    labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
                  />
                  <Area type="monotone" dataKey="avgPim" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorPim)" strokeWidth={3} />
                  <Area type="monotone" dataKey="topPim" stroke="hsl(var(--accent))" fill="transparent" strokeWidth={2} strokeDasharray="5 5" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/40 bg-card/40 shadow-xl overflow-hidden">
          <CardHeader className="bg-secondary/10 pb-6 border-b border-border/10">
            <CardTitle className="text-lg font-headline flex items-center gap-3">
              <Target className="text-accent h-5 w-5" /> {t.analytics.matrix}
            </CardTitle>
            <CardDescription>{t.analytics.matrixDesc}</CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={SCOUT_PRODUCTIVITY_DATA}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={10} axisLine={false} tickLine={false} />
                  <Tooltip 
                    cursor={{fill: 'hsl(var(--secondary))', opacity: 0.1}}
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                  />
                  <Bar dataKey="reports" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} barSize={40} />
                  <Bar dataKey="impact" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-8 mt-6">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 bg-primary rounded-sm" />
                <span className="text-[10px] font-black uppercase text-muted-foreground">{t.analytics.reportsGen}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 bg-accent rounded-sm" />
                <span className="text-[10px] font-black uppercase text-muted-foreground">{t.analytics.avgTargetPim}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <AnalyticsMetricCard title={t.analytics.decisionSpeed} value="4.2 Days" icon={<Brain className="text-primary" />} trend="Down from 6.8d" />
        <AnalyticsMetricCard title={t.analytics.roas} value="14.8x" icon={<ShieldCheck className="text-accent" />} trend="+3.2x this year" />
        <AnalyticsMetricCard title={t.analytics.marketValue} value="€240M" icon={<TrendingUp className="text-primary" />} trend="Across top 10 targets" />
      </div>
    </div>
  );
}

function AnalyticsMetricCard({ title, value, icon, trend }: { title: string, value: string, icon: React.ReactNode, trend: string }) {
  return (
    <Card className="border-border/40 bg-card/40 hover:border-primary/40 transition-all">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">{title}</p>
          <div className="h-8 w-8 rounded-lg bg-secondary/50 flex items-center justify-center">
            {icon}
          </div>
        </div>
        <CardTitle className="text-2xl font-black font-headline mt-2">{value}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-accent font-bold italic">{trend}</p>
      </CardContent>
    </Card>
  );
}
