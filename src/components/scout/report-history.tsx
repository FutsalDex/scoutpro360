"use client"

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  FileText, Calendar, Clock, ChevronRight, 
  TrendingUp, Download, Loader2, ArrowLeft,
  Target, Shield
} from "lucide-react";
import { useTranslation } from '@/lib/i18n/context';
import { subscribeToPlayerReports, getPlayer } from "@/lib/services/db-service";
import { Player, ScoutingReport } from "@/lib/types";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ReportHistoryProps {
  playerId: string;
  onEditReport: (reportId: string) => void;
  onBack: () => void;
  onNewReport: () => void;
}

export function ReportHistory({ playerId, onEditReport, onBack, onNewReport }: ReportHistoryProps) {
  const { t } = useTranslation();
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
        <Button onClick={onNewReport} className="bg-primary text-primary-foreground font-black text-xs uppercase tracking-widest h-12 px-8 rounded-xl shadow-lg hover:scale-105 transition-all">
          <FileText className="h-4 w-4 mr-2" /> Nuevo Informe
        </Button>
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
