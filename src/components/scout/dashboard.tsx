"use client"

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { User, ShieldCheck, ClipboardCheck, TrendingUp, Loader2 } from "lucide-react";
import { Player, ScoutingReport } from "@/lib/types";
import { useTranslation } from '@/lib/i18n/context';
import { subscribeToPlayers, subscribeToReports } from "@/lib/services/db-service";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase/config";

export function ScoutDashboard() {
  const { t } = useTranslation();
  const [players, setPlayers] = useState<Player[]>([]);
  const [reports, setReports] = useState<ScoutingReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [scoutId, setScoutId] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);

  // 1. Manejo de Auth con Refresco de Token para evitar errores de permisos
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Fuerza el refresco del token para que Firestore lo reconozca inmediatamente
          await user.getIdToken(true);
          setScoutId(user.uid);
        } catch (error) {
          console.error("Token refresh failed", error);
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

  // 2. Suscripciones a Firestore solo cuando Auth está listo
  useEffect(() => {
    if (!authReady || !scoutId) return;

    const unsubPlayers = subscribeToPlayers((data) => {
      setPlayers(data);
    });

    const unsubReports = subscribeToReports(scoutId, (data) => {
      setReports(data);
      setLoading(false);
    });

    return () => {
      unsubPlayers();
      unsubReports();
    };
  }, [authReady, scoutId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground animate-pulse">
          {t.dashboard.stats.syncing}
        </p>
      </div>
    );
  }

  // Cálculos de métricas
  const detectedCount = players.length;
  const analyzedCount = players.filter(p => p.currentPIM > 0).length;
  const reportsCount = reports.length;
  const avgPim = players.length > 0 
    ? (players.reduce((acc, p) => acc + (p.currentPIM || 0), 0) / players.length).toFixed(1) 
    : "0.0";

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-headline font-black text-foreground uppercase tracking-tight">
          {t.dashboard.title}
        </h1>
        <p className="text-muted-foreground">{t.dashboard.subtitle}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardStatCard
          title={t.dashboard.stats.detected}
          value={detectedCount.toString()}
          icon={<User className="text-primary" />}
          color="border-primary/20"
        />
        <DashboardStatCard
          title={t.dashboard.stats.analyzed}
          value={analyzedCount.toString()}
          icon={<ShieldCheck className="text-accent" />}
          color="border-accent/20"
        />
        <DashboardStatCard
          title={t.dashboard.stats.reports}
          value={reportsCount.toString()}
          icon={<ClipboardCheck className="text-primary" />}
          color="border-primary/20"
        />
        <DashboardStatCard
          title={t.dashboard.stats.avgPim}
          value={avgPim}
          icon={<TrendingUp className="text-accent" />}
          color="border-accent/20"
          suffix="%"
        />
      </div>
    </div>
  );
}

function DashboardStatCard({
  title, value, icon, color, suffix = ""
}: {
  title: string, value: string, icon: React.ReactNode, color: string, suffix?: string
}) {
  return (
    <Card className={`border-2 ${color} bg-card/40 backdrop-blur-md rounded-2xl overflow-hidden hover:scale-[1.02] transition-transform cursor-default group shadow-xl`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground group-hover:text-primary transition-colors">
            {title}
          </p>
          <div className="h-10 w-10 rounded-xl bg-secondary/50 flex items-center justify-center border border-border/10">
            {icon}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-baseline gap-1">
          <p className="text-5xl font-black font-headline text-foreground">{value}</p>
          {suffix && <span className="text-xl font-bold text-muted-foreground">{suffix}</span>}
        </div>
      </CardContent>
    </Card>
  );
}