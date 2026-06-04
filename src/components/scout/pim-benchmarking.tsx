
"use client"

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Plus, ArrowRightLeft, Target, Activity, Zap, Heart } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useTranslation } from '@/lib/i18n/context';

export function PIMBenchmarking() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6 sm:space-y-8 animate-in zoom-in-95 duration-500 pb-12 px-1 w-full overflow-hidden">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-headline font-bold text-foreground">{t.benchmarking.title}</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">{t.benchmarking.subtitle}</p>
        </div>
        <Button className="w-full md:w-auto bg-primary text-primary-foreground font-black tracking-widest uppercase text-[10px] px-6 h-10 rounded-xl">
          <Plus className="h-4 w-4 mr-2" /> {t.benchmarking.new}
        </Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Player 1 Card */}
        <div className="xl:col-span-4">
          <ComparisonPlayerCard 
            name="Florian Wirtz" 
            role="Classic 10" 
            pim={94} 
            color="border-primary" 
            image="https://picsum.photos/seed/wirtz/200"
          />
        </div>

        {/* VS Indicator & Metrics */}
        <div className="xl:col-span-4 flex flex-col items-center justify-center space-y-8 py-4 px-2">
          <div className="h-16 w-16 rounded-full border-4 border-primary/20 bg-secondary/30 flex items-center justify-center shadow-2xl">
            <span className="text-2xl font-black font-headline text-foreground italic">{t.benchmarking.vs}</span>
          </div>
          <div className="w-full space-y-6">
            <BenchMarkRow label={t.benchmarking.tactical} p1={92} p2={84} />
            <BenchMarkRow label={t.benchmarking.technical} p1={96} p2={88} />
            <BenchMarkRow label={t.benchmarking.physical} p1={74} p2={82} />
            <BenchMarkRow label={t.benchmarking.mental} p1={88} p2={91} />
            <BenchMarkRow label={t.benchmarking.fit} p1={95} p2={78} />
          </div>
        </div>

        {/* Player 2 Card */}
        <div className="xl:col-span-4">
          <ComparisonPlayerCard 
            name="Squad Benchmark" 
            role="Avg. Att. Midfielder" 
            pim={82} 
            color="border-accent" 
            image="https://picsum.photos/seed/benchmark/200"
            isBenchmark
          />
        </div>
      </div>

      <Card className="border-border/40 bg-secondary/5 overflow-hidden rounded-2xl">
        <CardContent className="p-6 sm:p-10">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center divide-y sm:divide-y-0 sm:divide-x divide-border/20">
            <div className="space-y-1 pb-6 sm:pb-0">
              <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">{t.benchmarking.delta}</p>
              <p className="text-3xl sm:text-4xl font-black font-headline text-primary">+12.0</p>
              <p className="text-[10px] text-accent font-bold">{t.benchmarking.territory}</p>
            </div>
            <div className="space-y-1 py-6 sm:py-0">
              <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">{t.benchmarking.upside}</p>
              <p className="text-3xl sm:text-4xl font-black font-headline text-foreground">€65M</p>
              <p className="text-[10px] text-muted-foreground font-bold">{t.benchmarking.projected}</p>
            </div>
            <div className="space-y-1 pt-6 sm:pt-0">
              <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">{t.benchmarking.compatibility}</p>
              <p className="text-3xl sm:text-4xl font-black font-headline text-accent">95%</p>
              <p className="text-[10px] text-muted-foreground font-bold">{t.benchmarking.squadProfile}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ComparisonPlayerCard({ name, role, pim, color, image, isBenchmark }: { name: string, role: string, pim: number, color: string, image: string, isBenchmark?: boolean }) {
  return (
    <Card className={`border-2 ${color} bg-card/60 backdrop-blur-md overflow-hidden rounded-2xl shadow-xl`}>
      <div className="p-6 text-center space-y-6">
        <Avatar className="h-28 w-28 mx-auto border-4 border-background shadow-2xl rounded-2xl">
          <AvatarImage src={image} />
          <AvatarFallback>{name[0]}</AvatarFallback>
        </Avatar>
        <div>
          <h3 className="text-xl font-black font-headline text-foreground truncate">{name}</h3>
          <Badge variant="outline" className="mt-2 text-[9px] font-black uppercase tracking-widest border-primary/30 text-primary">
            {role}
          </Badge>
        </div>
        <div className="py-6 border-y border-border/10">
          <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-2">Impact Metric</p>
          <p className={`text-6xl font-black font-headline ${isBenchmark ? 'text-accent' : 'text-primary'} leading-none`}>{pim}</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <MetricSmall icon={<Zap className="h-4 w-4" />} label="ATK" value={92} />
          <MetricSmall icon={<ShieldCheck className="h-4 w-4" />} label="DEF" value={64} />
        </div>
      </div>
    </Card>
  );
}

function BenchMarkRow({ label, p1, p2 }: { label: string, p1: number, p2: number }) {
  return (
    <div className="w-full space-y-2">
      <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
        <span className="text-primary">{p1}</span>
        <span className="text-muted-foreground truncate px-2 text-center flex-1">{label}</span>
        <span className="text-accent">{p2}</span>
      </div>
      <div className="h-1.5 w-full bg-secondary/30 rounded-full overflow-hidden flex">
        <div className="h-full bg-primary" style={{ width: `${(p1 / (p1 + p2)) * 100}%` }} />
        <div className="h-full bg-accent" style={{ width: `${(p2 / (p1 + p2)) * 100}%` }} />
      </div>
    </div>
  );
}

function MetricSmall({ icon, label, value }: { icon: any, label: string, value: number }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="text-muted-foreground">{icon}</div>
      <span className="text-[9px] font-black text-muted-foreground uppercase">{label}</span>
      <span className="text-sm font-black text-foreground">{value}</span>
    </div>
  );
}
