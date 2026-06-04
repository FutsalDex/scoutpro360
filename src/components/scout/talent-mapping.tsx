
"use client"

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Globe, MapPin, Users, TrendingUp, Compass } from "lucide-react";

export function TalentMapping() {
  return (
    <div className="space-y-8 animate-in slide-in-from-right duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-headline font-bold text-foreground">Talent Mapping</h1>
          <p className="text-muted-foreground">Geospatial distribution and hot-spot analysis of identified talent.</p>
        </div>
        <div className="flex gap-2">
          <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px] font-black py-1.5 px-4 tracking-widest uppercase">
            Global Live Feed
          </Badge>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 border-border/40 bg-card/40 backdrop-blur-xl shadow-2xl relative overflow-hidden min-h-[500px]">
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <svg viewBox="0 0 1000 500" className="w-full h-full">
              <path d="M150,200 Q300,50 500,200 T850,200" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="5,5" />
              <circle cx="200" cy="150" r="10" className="fill-primary" />
              <circle cx="450" cy="300" r="15" className="fill-accent" />
              <circle cx="700" cy="200" r="12" className="fill-primary" />
            </svg>
          </div>
          <CardHeader>
            <CardTitle className="flex items-center gap-3 font-headline text-xl">
              <Globe className="text-primary h-6 w-6" /> Talent Hotspots
            </CardTitle>
            <CardDescription>Real-time visual map of scout assignments and findings.</CardDescription>
          </CardHeader>
          <CardContent className="h-[400px] flex items-center justify-center border-2 border-dashed border-border/20 m-6 rounded-2xl bg-secondary/5">
            <div className="text-center space-y-6">
              <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto border border-primary/20">
                <Compass className="h-8 w-8 text-primary animate-spin-slow" />
              </div>
              <p className="text-muted-foreground max-w-sm font-medium italic">
                Interactive Map Module rendering... <br /> 
                <span className="text-[10px] font-black uppercase tracking-widest text-primary mt-2 block">Overlaying 450 active nodes</span>
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-border/40 bg-card/40 backdrop-blur-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" /> Priority Regions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <RegionItem name="Brazil (Serie A/B)" count={124} growth="+12%" pim={74} />
              <RegionItem name="France (Ligue 1/2)" count={86} growth="+5%" pim={78} />
              <RegionItem name="Argentina (LFP)" count={62} growth="+18%" pim={72} />
              <RegionItem name="Germany (3. Liga)" count={45} growth="+2%" pim={69} />
              <RegionItem name="Portugal (Liga Nos)" count={38} growth="+9%" pim={76} />
            </CardContent>
          </Card>

          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-lg font-headline">Scouting Logistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Active Scouts</span>
                <span className="font-black text-foreground">24</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Flight Hours YTD</span>
                <span className="font-black text-foreground">1,240 hrs</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Reports Generated</span>
                <span className="font-black text-foreground">3,450</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function RegionItem({ name, count, growth, pim }: { name: string, count: number, growth: string, pim: number }) {
  return (
    <div className="space-y-2 group">
      <div className="flex justify-between items-end">
        <div>
          <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">{name}</p>
          <p className="text-[10px] text-muted-foreground font-black uppercase tracking-tighter">{count} Identified • <span className="text-accent">{growth}</span></p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground font-bold">AVG PIM</p>
          <p className="text-lg font-black font-headline text-primary">{pim}</p>
        </div>
      </div>
      <Progress value={pim} className="h-1 bg-secondary/30" />
    </div>
  );
}
