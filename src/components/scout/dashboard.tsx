
"use client"

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { TrendingUp, Users, ClipboardCheck, ArrowUpRight, Search, Loader2 } from "lucide-react";
import { Player } from "@/lib/types";
import { useTranslation } from '@/lib/i18n/context';
import { subscribeToPlayers } from "@/lib/services/db-service";

export function ScoutDashboard() {
  const { t } = useTranslation();
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToPlayers((data) => {
      setPlayers(data.slice(0, 5));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const avgPim = players.length > 0 
    ? (players.reduce((acc, p) => acc + p.currentPIM, 0) / players.length).toFixed(1) 
    : "0.0";

  return (
    <div className="space-y-6 sm:space-y-8 pb-12 w-full overflow-hidden">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-4xl font-headline font-black text-foreground uppercase tracking-tight">ScoutPro 360 Dashboard</h1>
          <p className="text-sm text-muted-foreground font-medium">Welcome back, Head Scout. Centralized intelligence for organizational talent acquisition.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          <Button className="flex-1 md:flex-none bg-primary text-primary-foreground shadow-lg shadow-primary/30 text-xs font-bold uppercase tracking-widest h-12 px-8 rounded-xl">
            Create New Report
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatsCard 
          title="TOTAL PLAYERS OBSERVED" 
          value={loading ? "..." : players.length.toString()} 
          icon={<Users className="text-primary" />} 
          subtitle="Datos de Firestore" 
        />
        <StatsCard 
          title="AVG. SQUAD PIM" 
          value={loading ? "..." : avgPim} 
          icon={<TrendingUp className="text-primary" />} 
          subtitle="Promedio Real" 
        />
        <StatsCard 
          title="RECRUITMENT STATUS" 
          value="ACTIVO" 
          icon={<ArrowUpRight className="text-accent" />} 
          subtitle="Temporada 2026" 
          accent 
        />
        <StatsCard 
          title="RECLUTADOS" 
          value="3" 
          icon={<ClipboardCheck className="text-accent" />} 
          subtitle="Q1 Progress" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        <Card className="lg:col-span-2 border-border/40 bg-card/40 backdrop-blur-sm shadow-2xl overflow-hidden rounded-2xl">
          <CardHeader className="bg-secondary/20 p-4 sm:p-8 border-b border-border/10">
            <div className="flex justify-between items-center">
              <CardTitle className="text-base sm:text-lg font-black uppercase tracking-[0.15em] font-headline">ÚLTIMOS PROSPECTOS (REAL-TIME)</CardTitle>
              <Button variant="ghost" size="sm" className="text-[10px] sm:text-xs text-primary font-bold uppercase tracking-widest">View All</Button>
            </div>
          </CardHeader>
          <CardContent className="p-0 min-h-[400px] flex flex-col">
            {loading ? (
              <div className="flex-1 flex flex-col items-center justify-center p-20 gap-4">
                <div className="h-12 w-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground animate-pulse">Sincronizando Firestore...</p>
              </div>
            ) : (
              <div className="divide-y divide-border/20 min-w-full">
                {players.length > 0 ? players.map(player => (
                  <div key={player.id} className="flex items-center justify-between p-6 hover:bg-secondary/30 transition-colors cursor-pointer group min-w-max sm:min-w-0">
                    <div className="flex items-center gap-3 sm:gap-6 overflow-hidden mr-4">
                      <Avatar className="h-12 w-12 sm:h-14 sm:w-14 rounded-2xl border-2 border-primary/20 bg-background shrink-0 shadow-lg">
                        <AvatarImage src={`https://picsum.photos/seed/${player.id}/100`} />
                        <AvatarFallback className="font-bold">{player.name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="space-y-1 truncate">
                        <p className="font-black text-sm sm:text-lg text-foreground truncate uppercase tracking-tight">{player.name}</p>
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                          <Badge variant="outline" className="text-[9px] sm:text-[10px] h-5 py-0 font-black bg-primary/10 text-primary border-primary/30 uppercase tracking-widest px-2">
                            {player.tacticalRole}
                          </Badge>
                          <span className="text-[10px] sm:text-xs text-muted-foreground font-medium">{player.club}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 sm:gap-8 shrink-0">
                      <div className="text-right">
                        <p className="text-[8px] sm:text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-black leading-none mb-1">PIM</p>
                        <p className="text-lg sm:text-2xl font-headline font-black text-accent">{player.currentPIM}</p>
                      </div>
                      <div className="h-10 w-10 sm:h-14 sm:w-14 rounded-2xl bg-primary/20 flex items-center justify-center font-black text-primary text-lg sm:text-2xl border border-primary/30 group-hover:scale-110 transition-transform shadow-lg">
                        {player.grade}
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="flex-1 flex items-center justify-center p-20 text-muted-foreground italic text-sm font-medium uppercase tracking-widest opacity-50">
                    No records found in Firestore
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/40 bg-card/40 backdrop-blur-sm shadow-2xl rounded-2xl">
          <CardHeader className="p-4 sm:p-8 border-b border-border/10">
            <CardTitle className="text-base sm:text-lg font-black uppercase tracking-[0.15em] font-headline">{t.dashboard.recentActivity}</CardTitle>
            <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Latest team updates and reports</CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-8 space-y-8">
            <ActivityItem 
              time="Justo ahora" 
              user="Scout AI" 
              action="Sincronizado con" 
              target="Firestore DB" 
              color="text-primary" 
              isBold 
            />
            <ActivityItem 
              time="2h ago" 
              user="M. Scout" 
              action="Finalized evaluation for" 
              target="Nico Williams" 
              color="text-primary" 
            />
            <Button variant="secondary" className="w-full mt-6 text-[10px] font-black uppercase tracking-widest h-10 rounded-xl bg-secondary/50 border border-border/20">
              Load More Activity
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatsCard({ title, value, icon, subtitle, accent }: { title: string, value: string, icon: React.ReactNode, subtitle: string, accent?: boolean }) {
  return (
    <Card className="border-border/40 bg-card/40 backdrop-blur-sm hover:border-primary/40 transition-all group overflow-hidden relative rounded-2xl p-6 shadow-xl">
      <div className="absolute top-4 right-4 opacity-20 group-hover:opacity-40 group-hover:scale-110 transition-all pointer-events-none">
        {React.cloneElement(icon as React.ReactElement, { size: 24 })}
      </div>
      <div className="space-y-4">
        <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mr-8">{title}</p>
        <div className="flex flex-col gap-1">
          <p className={`text-2xl sm:text-4xl font-black font-headline tracking-tight ${accent ? 'text-foreground' : 'text-foreground'}`}>
            {value}
          </p>
          <p className="text-[10px] font-bold text-accent uppercase tracking-widest">{subtitle}</p>
        </div>
      </div>
    </Card>
  );
}

function ActivityItem({ time, user, action, target, color, isBold }: { time: string, user: string, action: string, target: string, color: string, isBold?: boolean }) {
  return (
    <div className="flex gap-4 items-start overflow-hidden">
      <div className={`mt-2 h-2 w-2 rounded-full shrink-0 ${color.replace('text-', 'bg-')} shadow-[0_0_10px_rgba(var(--primary),0.5)]`} />
      <div className="space-y-1 min-w-0">
        <p className={`text-[11px] sm:text-sm leading-tight text-foreground ${isBold ? 'font-medium' : ''}`}>
          <span className="font-black uppercase tracking-tight">{user}</span> {action} <span className="text-primary font-black uppercase tracking-tight">{target}</span>
        </p>
        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{time}</p>
      </div>
    </div>
  );
}
