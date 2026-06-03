
"use client"

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { TrendingUp, Users, ClipboardCheck, ArrowUpRight, Search } from "lucide-react";
import { Player } from "@/lib/types";
import { useTranslation } from '@/lib/i18n/context';

const MOCK_PLAYERS: Player[] = [
  { id: '1', name: 'Julian Alvarez', age: 24, club: 'Manchester City', nationality: 'ARG', marketValue: '€90M', currentPIM: 88, tacticalRole: 'False 9', grade: 'A' },
  { id: '2', name: 'Nicolo Barella', age: 27, club: 'Inter Milan', nationality: 'ITA', marketValue: '€75M', currentPIM: 84, tacticalRole: 'Mezzala', grade: 'A' },
  { id: '3', name: 'Trent Alexander-Arnold', age: 25, club: 'Liverpool', nationality: 'ENG', marketValue: '€70M', currentPIM: 91, tacticalRole: 'Inverted Fullback', grade: 'A' },
];

export function ScoutDashboard() {
  const { t } = useTranslation();

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-headline font-bold text-foreground">{t.dashboard.title}</h1>
          <p className="text-muted-foreground">{t.dashboard.subtitle}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="bg-background/50 backdrop-blur-sm border-border">
            <Search className="h-4 w-4 mr-2" /> {t.dashboard.search}
          </Button>
          <Button className="bg-primary text-primary-foreground shadow-lg shadow-primary/20">
            {t.dashboard.createReport}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard title={t.dashboard.stats.totalPlayers} value="1,284" icon={<Users className="text-primary" />} trend="+12% this month" />
        <StatsCard title={t.dashboard.stats.pendingReports} value="14" icon={<ClipboardCheck className="text-accent" />} trend="4 High Priority" />
        <StatsCard title={t.dashboard.stats.avgPim} value="76.4" icon={<TrendingUp className="text-primary" />} trend="Benchmark: 72.0" />
        <StatsCard title={t.dashboard.stats.recruitmentStatus} value="A+" icon={<ArrowUpRight className="text-accent" />} trend="3 Targets Identified" />
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 border-border/40 shadow-xl overflow-hidden">
          <CardHeader className="bg-secondary/20 pb-4">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg font-headline">{t.dashboard.topTargets}</CardTitle>
              <Button variant="ghost" size="sm" className="text-xs text-primary">View All</Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {MOCK_PLAYERS.map(player => (
                <div key={player.id} className="flex items-center justify-between p-4 hover:bg-secondary/30 transition-colors cursor-pointer group">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12 rounded-lg border-2 border-primary/20 bg-background">
                      <AvatarImage src={`https://picsum.photos/seed/${player.id}/100`} />
                      <AvatarFallback className="font-bold">{player.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="space-y-0.5">
                      <p className="font-bold text-foreground">{player.name}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] h-4 py-0 font-medium bg-primary/10 text-primary border-primary/30 uppercase tracking-tighter">
                          {player.tacticalRole}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{player.club} • {player.age} yrs</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right hidden sm:block">
                      <p className="text-xs uppercase tracking-widest text-muted-foreground font-bold">PIM Score</p>
                      <p className="text-lg font-headline font-bold text-accent">{player.currentPIM}</p>
                    </div>
                    <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center font-bold text-primary text-xl border border-primary/30 group-hover:scale-110 transition-transform">
                      {player.grade}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/40 shadow-xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-headline">{t.dashboard.recentActivity}</CardTitle>
            <CardDescription>Latest team updates and reports</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <ActivityItem time="2h ago" user="M. Scout" action="Finalized evaluation for" target="Nico Williams" color="text-primary" />
            <ActivityItem time="5h ago" user="D. Director" action="Set priority target for" target="Leny Yoro" color="text-accent" />
            <ActivityItem time="1d ago" user="J. Analyst" action="Updated PIM algorithm for" target="Holding Midfielders" color="text-muted-foreground" />
            <ActivityItem time="2d ago" user="M. Scout" action="Started live note for" target="Lamine Yamal" color="text-primary" />
            <Button variant="secondary" className="w-full mt-4">Load More Activity</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatsCard({ title, value, icon, trend }: { title: string, value: string, icon: React.ReactNode, trend: string }) {
  return (
    <Card className="border-border/40 hover:border-primary/40 transition-all group overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
        {React.cloneElement(icon as React.ReactElement, { size: 64 })}
      </div>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardDescription className="text-xs font-bold uppercase tracking-widest">{title}</CardDescription>
          {icon}
        </div>
        <CardTitle className="text-3xl font-headline font-bold mt-1">{value}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs font-medium text-accent">{trend}</p>
      </CardContent>
    </Card>
  );
}

function ActivityItem({ time, user, action, target, color }: { time: string, user: string, action: string, target: string, color: string }) {
  return (
    <div className="flex gap-4 items-start">
      <div className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${color.replace('text-', 'bg-')}`} />
      <div className="space-y-1">
        <p className="text-sm">
          <span className="font-bold">{user}</span> {action} <span className="text-primary font-bold">{target}</span>
        </p>
        <p className="text-xs text-muted-foreground">{time}</p>
      </div>
    </div>
  );
}
