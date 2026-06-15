
"use client"

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  FileText, Calendar, Clock, ChevronRight, 
  TrendingUp, Download, Loader2, ArrowLeft,
  Target, Shield, Activity, Brain, Star
} from "lucide-react";
import { useTranslation } from '@/lib/i18n/context';
import { subscribeToPlayerReports, getPlayer } from "@/lib/services/db-service";
import { Player, ScoutingReport, getLocalizedKPIs } from "@/lib/types";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ReportHistoryProps {
  playerId: string;
  onEditReport: (reportId: string) => void;
  onBack: () => void;
  onNewReport: () => void;
}

export function ReportHistory({ playerId, onEditReport, onBack, onNewReport }: ReportHistoryProps) {
  const { t } = useTranslation();
  const localizedKPIs = useMemo(() => getLocalizedKPIs(t), [t]);
  const [player, setPlayer] = useState<Player | null>(null);
  const [reports, setReports] = useState<ScoutingReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!playerId) return;
    
    getPlayer(playerId).then(setPlayer);
    const unsub = subscribeToPlayerReports(playerId, (data) => {
      setReports(data);
      setLoading(false);
    });
    return () => unsub();
  }, [playerId]);

  const calculateCategoryAverages = (report: ScoutingReport) => {
    const getAvg = (keys: string[]) => {
      const values = keys.map(k => report.ratings[k] || 0).filter(v => v > 0);
      return values.length > 0 ? (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1) : "0";
    };

    return {
      technical: getAvg([...localizedKPIs.technical.observation, ...localizedKPIs.technical.impact]),
      tactical: getAvg(localizedKPIs.tactical.observation),
      physical: getAvg(localizedKPIs.physical.observation),
      mental: getAvg(localizedKPIs.mental.observation)
    };
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Cargando cronología...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-6">
          <Button variant="ghost" onClick={onBack} className="h-12 w-12 rounded-2xl bg-secondary/20 hover:bg-secondary">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-headline font-black text-white uppercase tracking-tight">
              Historial de Scouting
            </h1>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-primary font-black uppercase text-[11px] tracking-widest">{player?.name}</span>
              <span className="text-muted-foreground opacity-30">|</span>
              <span className="text-muted-foreground font-bold text-[10px] uppercase">{player?.club}</span>
            </div>
          </div>
        </div>
        
        <div className="flex gap-3">
          {reports.length > 1 && (
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="h-12 px-6 border-accent/30 text-accent font-black text-xs uppercase tracking-widest rounded-xl hover:bg-accent hover:text-accent-foreground">
                  <TrendingUp className="h-4 w-4 mr-2" /> VER EVOLUCIÓN
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-[#1b263b] border-border/40 max-w-3xl max-h-[80vh] overflow-y-auto">
                <DialogHeader className="border-b border-white/10 pb-4">
                  <DialogTitle className="text-xl font-black uppercase tracking-widest text-primary flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" /> Evolución de Rendimiento Técnico
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-6 pt-6">
                  {reports.map((r, i) => {
                    const avgs = calculateCategoryAverages(r);
                    return (
                      <div key={i} className="p-6 bg-secondary/20 rounded-2xl border border-border/10 space-y-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-[10px] font-black uppercase text-primary mb-1">{r.matchDate ? format(new Date(r.matchDate), "dd MMM yyyy", { locale: es }) : "TBD"}</p>
                            <h4 className="text-lg font-black text-white uppercase">{r.rivalName ? `vs ${r.rivalName}` : "Análisis de Campo"}</h4>
                          </div>
                          <div className="text-right">
                             <p className="text-3xl font-black text-primary font-headline leading-none">{r.pimScore || 0}</p>
                             <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">PIM SCORE</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-white/5">
                           <EvolutionMetric label="TÉCNICO" value={avgs.technical} icon={<Activity className="h-3 w-3" />} />
                           <EvolutionMetric label="TÁCTICO" value={avgs.tactical} icon={<Target className="h-3 w-3" />} />
                           <EvolutionMetric label="FÍSICO" value={avgs.physical} icon={<Zap className="h-3 w-3" />} />
                           <EvolutionMetric label="MENTAL" value={avgs.mental} icon={<Brain className="h-3 w-3" />} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </DialogContent>
            </Dialog>
          )}
          <Button onClick={onNewReport} className="bg-primary text-primary-foreground font-black text-xs uppercase tracking-widest h-12 px-8 rounded-xl shadow-lg hover:scale-105 transition-all">
            <FileText className="h-4 w-4 mr-2" /> Nuevo Informe
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {reports.length === 0 ? (
          <Card className="border-dashed border-2 border-border/40 bg-card/20 py-20 text-center">
            <CardContent>
              <FileText className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
              <p className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">No hay informes registrados para este jugador</p>
            </CardContent>
          </Card>
        ) : (
          reports.map((report) => (
            <Card key={report.id} className="border-border/40 bg-card/40 backdrop-blur-xl hover:border-primary/30 transition-all group overflow-hidden">
              <CardContent className="p-0">
                <div className="flex flex-col lg:flex-row">
                  <div className="lg:w-64 bg-secondary/10 p-6 flex flex-col justify-center items-center border-b lg:border-b-0 lg:border-r border-border/10 gap-3">
                     <div className="relative">
                        <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
                        <div className="h-20 w-20 rounded-full border-4 border-primary/20 bg-background flex items-center justify-center relative">
                           <span className="text-3xl font-black text-primary font-headline">{report.pimScore || 0}</span>
                        </div>
                     </div>
                     <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">PIM SCORE</p>
                  </div>
                  
                  <div className="flex-1 p-6 space-y-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                           <Calendar className="h-3.5 w-3.5 text-accent" />
                           <span className="text-[11px] font-black text-white uppercase tracking-tight">
                             {report.matchDate ? format(new Date(report.matchDate), "dd 'de' MMMM, yyyy", { locale: es }) : 'Fecha desconocida'}
                           </span>
                        </div>
                        <h3 className="text-lg font-black uppercase text-foreground">
                          {report.rivalName ? `vs ${report.rivalName}` : 'Partido de Observación'}
                        </h3>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                          {report.competition || 'Competición No Registrada'}
                        </p>
                      </div>
                      <div className="flex gap-2">
                         <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-[9px] font-black py-1 px-3">
                            {report.minPlayed || '0'} MIN
                         </Badge>
                         <Badge variant="outline" className="bg-accent/5 text-accent border-accent/20 text-[9px] font-black py-1 px-3">
                            {(report.finalRecommendation || 'Seguimiento').toUpperCase()}
                         </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-border/10">
                       <div className="space-y-2">
                          <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                             <Target className="h-3 w-3" /> Resumen Ejecutivo
                          </p>
                          <p className="text-xs text-foreground/80 leading-relaxed font-medium line-clamp-2 italic">
                            "{report.summary || 'Sin resumen registrado.'}"
                          </p>
                       </div>
                       <div className="flex items-end justify-end gap-3">
                          <Button 
                            onClick={() => onEditReport(report.id!)}
                            className="h-10 bg-secondary/50 border border-border/20 text-foreground font-black text-[10px] uppercase tracking-widest px-6 rounded-xl hover:bg-primary hover:text-primary-foreground transition-all"
                          >
                             Acceder al Informe <ChevronRight className="ml-2 h-4 w-4" />
                          </Button>
                       </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

function EvolutionMetric({ label, value, icon }: { label: string, value: string, icon: React.ReactNode }) {
  const numValue = parseFloat(value);
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5 mb-1">
        <span className="text-muted-foreground">{icon}</span>
        <span className="text-[8px] font-black text-muted-foreground uppercase tracking-tighter">{label}</span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-xl font-black text-white font-headline">{value}</span>
        <span className="text-[8px] font-bold text-muted-foreground">/ 5.0</span>
      </div>
      <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
        <div 
          className="h-full bg-primary transition-all duration-1000" 
          style={{ width: `${(numValue / 5) * 100}%` }} 
        />
      </div>
    </div>
  );
}

function Zap({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}
