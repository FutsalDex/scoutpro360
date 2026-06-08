"use client"

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, ShieldCheck, ClipboardCheck, TrendingUp, ChevronRight, MapPin, Star } from "lucide-react";
import { Player, ScoutingReport } from "@/lib/types";
import { useTranslation } from '@/lib/i18n/context';
import { subscribeToPlayers, subscribeToReports } from "@/lib/services/db-service";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ScoutDashboardProps {
  userProfile: any;
  onEditPlayer: (id: string) => void;
}

export function ScoutDashboard({ userProfile, onEditPlayer }: ScoutDashboardProps) {
  const { t } = useTranslation();
  const [players, setPlayers] = useState<Player[]>([]);
  const [reports, setReports] = useState<ScoutingReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [authReady, setAuthReady] = useState(false);
  const [scoutId, setScoutId] = useState<string | null>(null);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          await user.getIdToken(true);
          setScoutId(user.uid);
        } catch (error) {
          console.error("Auth sync error:", error);
          setScoutId(user.uid);
        }
      } else {
        setScoutId(null);
        setLoading(false);
      }
      setAuthReady(true);
    });
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (!authReady || !scoutId) return;

    let playersLoaded = false;
    let reportsLoaded = false;

    const checkLoading = () => {
      if (playersLoaded && reportsLoaded) {
        setLoading(false);
      }
    };

    const unsubPlayers = subscribeToPlayers(scoutId, (data) => {
      setPlayers(data);
      playersLoaded = true;
      checkLoading();
    });

    const unsubReports = subscribeToReports(scoutId, (data) => {
      setReports(data);
      reportsLoaded = true;
      checkLoading();
    });

    const timer = setTimeout(() => setLoading(false), 5000);

    return () => {
      unsubPlayers();
      unsubReports();
      clearTimeout(timer);
    };
  }, [authReady, scoutId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 animate-in fade-in duration-700">
        <div className="relative">
          <div className="h-20 w-20 rounded-2xl border-2 border-primary/20 animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <ShieldCheck className="h-8 w-8 text-primary animate-pulse" />
          </div>
        </div>
        <div className="text-center space-y-2">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-primary animate-pulse">
            {t.dashboard.stats.syncing}
          </p>
        </div>
      </div>
    );
  }

  const detectedCount = players.length;
  const analyzedCount = players.filter(p => (p.currentPIM || 0) > 0).length;
  const reportsCount = reports.length;
  const avgPim = players.length > 0 
    ? (players.reduce((acc, p) => acc + (p.currentPIM || 0), 0) / players.length).toFixed(1) 
    : "0.0";

  const recentPlayers = [...players]
    .sort((a, b) => {
      const dateA = a.createdAt?.seconds || 0;
      const dateB = b.createdAt?.seconds || 0;
      return dateB - dateA;
    })
    .slice(0, 5);

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <div className="flex flex-col gap-2">
        <div className="h-1 w-12 bg-primary rounded-full mb-2" />
        <h1 className="text-4xl font-headline font-black text-foreground uppercase tracking-tight">
          {t.dashboard.title}
        </h1>
        <p className="text-muted-foreground font-medium">{t.dashboard.subtitle}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardStatCard
          title={t.dashboard.stats.detected}
          value={detectedCount.toString()}
          icon={<User className="text-primary" />}
          color="border-primary/20"
          delay="0"
        />
        <DashboardStatCard
          title={t.dashboard.stats.analyzed}
          value={analyzedCount.toString()}
          icon={<ShieldCheck className="text-accent" />}
          color="border-accent/20"
          delay="100"
        />
        <DashboardStatCard
          title={t.dashboard.stats.reports}
          value={reportsCount.toString()}
          icon={<ClipboardCheck className="text-primary" />}
          color="border-primary/20"
          delay="200"
        />
        <DashboardStatCard
          title={t.dashboard.stats.avgPim}
          value={avgPim}
          icon={<TrendingUp className="text-accent" />}
          color="border-accent/20"
          suffix="%"
          delay="300"
        />
      </div>

      <div className="grid grid-cols-1 gap-8">
        <Card className="border-border/40 bg-card/40 backdrop-blur-md rounded-[2rem] overflow-hidden shadow-2xl">
          <CardHeader className="p-8 border-b border-border/10 flex flex-row items-center justify-between bg-secondary/10">
            <div className="space-y-1">
              <CardTitle className="text-lg font-black uppercase tracking-widest flex items-center gap-2">
                <Star className="h-5 w-5 text-primary fill-primary" />
                {t.dashboard.recentProspects.title}
              </CardTitle>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                {t.dashboard.recentProspects.subtitle}
              </p>
            </div>
            <Badge variant="outline" className="border-primary/30 text-primary font-black text-[9px] uppercase tracking-widest px-3 py-1">
              {recentPlayers.length} {t.dashboard.recentProspects.new}
            </Badge>
          </CardHeader>
          <CardContent className="p-0">
            {recentPlayers.length > 0 ? (
              <div className="divide-y divide-border/10">
                {recentPlayers.map((player) => (
                  <div 
                    key={player.id} 
                    className="p-6 flex items-center justify-between hover:bg-primary/5 transition-all group cursor-pointer"
                    onClick={() => onEditPlayer(player.id)}
                  >
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12 rounded-xl border border-primary/20 shadow-lg group-hover:scale-105 transition-transform">
                        <AvatarFallback className="font-black text-primary bg-primary/10">
                          {player.name[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="space-y-1">
                        <p className="font-black text-sm uppercase tracking-tight group-hover:text-primary transition-colors">
                          {player.name}
                        </p>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] text-muted-foreground font-bold flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> {player.club}
                          </span>
                          <span className="h-1 w-1 rounded-full bg-border" />
                          <span className="text-[10px] text-primary font-black uppercase tracking-widest">
                            {player.tacticalRole}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right hidden sm:block">
                        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">PIM IMPACT</p>
                        <p className="text-xl font-black text-accent">{player.currentPIM}%</p>
                      </div>
                      <div className={cn(
                        "h-10 w-10 rounded-xl bg-secondary/50 flex items-center justify-center border border-border/10 group-hover:bg-primary group-hover:text-primary-foreground transition-all shadow-lg",
                        player.grade === 'A' ? "border-primary/50" : ""
                      )}>
                        <ChevronRight className="h-5 w-5" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-20 text-center space-y-4 opacity-40">
                <div className="h-12 w-12 rounded-full bg-secondary/50 flex items-center justify-center mx-auto">
                  <User className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  {t.dashboard.recentProspects.noData}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function DashboardStatCard({
  title, value, icon, color, suffix = "", delay = "0"
}: {
  title: string, value: string, icon: React.ReactNode, color: string, suffix?: string, delay?: string
}) {
  return (
    <Card 
      className={`border-2 ${color} bg-card/40 backdrop-blur-md rounded-[2rem] overflow-hidden hover:scale-[1.03] transition-all cursor-default group shadow-2xl animate-in zoom-in-95 duration-500`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground group-hover:text-primary transition-colors">
            {title}
          </p>
          <div className="h-12 w-12 rounded-2xl bg-secondary/50 flex items-center justify-center border border-border/10 group-hover:bg-primary/10 transition-colors">
            {icon}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-2 pb-8">
        <div className="flex items-baseline gap-1">
          <p className="text-6xl font-black font-headline text-foreground tracking-tighter">{value}</p>
          {suffix && <span className="text-2xl font-black text-primary/60">{suffix}</span>}
        </div>
      </CardContent>
    </Card>
  );
}