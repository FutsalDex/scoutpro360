
"use client"
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Search, Download, Loader2, MoreVertical, FileText, 
  Calendar, Info, MapPin 
} from "lucide-react";
import { useTranslation } from '@/lib/i18n/context';
import { 
  subscribeToPlayers, subscribeToReports, subscribeToScheduledMatches, 
  saveScheduledMatch, subscribeToGlobalPlayers 
} from "@/lib/services/db-service";
import { Player, ScoutingReport, ScheduledMatch } from "@/lib/types";
import { auth } from "@/lib/firebase/config";
import { onAuthStateChanged } from "firebase/auth";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { format } from 'date-fns';

interface GlobalDatabaseProps {
  onEditPlayer: (id: string) => void;
  global?: boolean;
}

export function GlobalDatabase({ onEditPlayer, global = false }: GlobalDatabaseProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [players, setPlayers] = useState<Player[]>([]);
  const [reports, setReports] = useState<ScoutingReport[]>([]);
  const [matches, setMatches] = useState<ScheduledMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [authReady, setAuthReady] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        setUserId(null);
      }
      setAuthReady(!!user);
      if (!user) setLoading(false);
    });
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (!authReady || !userId) return;
    
    const unsubPlayers = global 
      ? subscribeToGlobalPlayers(setPlayers)
      : subscribeToPlayers(userId, setPlayers);
      
    const unsubReports = global
      ? subscribeToReports(null, setReports)
      : subscribeToReports(userId, setReports);

    const unsubMatches = subscribeToScheduledMatches(userId, setMatches);
    const timer = setTimeout(() => setLoading(false), 2000);
    return () => {
      unsubPlayers();
      unsubReports();
      unsubMatches();
      clearTimeout(timer);
    };
  }, [authReady, userId, global]);

  const filteredPlayers = players.filter(p => {
    const search = searchTerm.toLowerCase();
    const name = (p.name || "").toLowerCase();
    const club = (p.club || "").toLowerCase();
    const nationality = (p.nationality || "").toLowerCase();
    return name.includes(search) || club.includes(search) || nationality.includes(search);
  });

  const getPlayerStatus = (player: Player) => {
    if (reports.some(r => r.playerId === player.id)) return 'analizado';
    if (matches.some(m => m.playerId === player.id && m.status === 'scheduled')) return 'agendado';
    return 'detectado';
  };

  const getReportForPlayer = (playerId: string) => {
    return reports.find(r => r.playerId === playerId);
  };

  const calculateCompletion = (report: ScoutingReport | undefined): number => {
    if (!report) return 0;
    const criticalFields = [
      report.summary,
      report.rivalName,
      report.competition,
      report.matchDate,
      report.overallDescription,
      report.finalRecommendation,
      report.finalScoutRating
    ];
    const filled = criticalFields.filter(f => f !== undefined && f !== null && f !== '' && f !== 0).length;
    return Math.round((filled / criticalFields.length) * 100);
  };

  const generatePDF = (player: Player) => {
    const report = getReportForPlayer(player.id);
    const completion = calculateCompletion(report);

    if (!report || completion < 75) {
      toast({
        variant: "destructive",
        title: t.database.actions.pdfIncomplete,
        description: `Completitud actual: ${completion}% (Requerido: 75%)`,
      });
      return;
    }

    const doc = new jsPDF() as any;
    const primaryColor = [224, 176, 80];
    const navyColor = [27, 38, 59];

    doc.setFillColor(...navyColor);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("SCOUTPRO 360", 105, 20, { align: "center" });
    doc.setFontSize(10);
    doc.text(t.report.pdfHeader, 105, 28, { align: "center" });

    doc.autoTable({
      startY: 45,
      head: [[t.report.playerInfo.title, ""]],
      body: [
        [t.report.playerInfo.name, player.name.toUpperCase()],
        [t.report.playerInfo.club, player.club.toUpperCase()],
        [t.report.playerInfo.nationality, player.nationality || 'N/A'],
        [t.report.playerInfo.primaryPos, player.tacticalRole.toUpperCase()]
      ],
      theme: 'grid',
      headStyles: { fillColor: primaryColor, textColor: navyColor },
      styles: { fontSize: 9 }
    });

    doc.save(`ScoutPro_Report_${player.name.replace(/\s+/g, '_')}.pdf`);
    toast({ title: t.database.actions.pdfSuccess });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/60">Accediendo a la red de inteligencia...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-headline font-black text-white uppercase tracking-tight">
            {global ? t.database.globalTitle : t.database.title}
          </h1>
          <p className="text-muted-foreground text-sm font-medium">
            {global ? t.database.globalSubtitle : t.database.subtitle}
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="bg-secondary/20 border-border/40 text-foreground font-black text-[10px] uppercase tracking-widest h-11 px-6 rounded-xl hover:bg-secondary/40">
            <Download className="h-4 w-4 mr-2" /> {t.database.export}
          </Button>
        </div>
      </div>

      <div className="relative group">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
        <Input
          placeholder={t.database.search}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-14 h-14 bg-card/60 border-border/40 rounded-2xl text-base focus:ring-primary/20 focus:border-primary/40 transition-all placeholder:text-muted-foreground/50"
        />
      </div>

      <div className="overflow-hidden rounded-[2rem] border border-border/40 bg-card/20 backdrop-blur-xl shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-secondary/30 border-b border-border/20">
                <th className="px-6 py-5 text-left text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground">Jugador</th>
                <th className="px-6 py-5 text-center text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground">Pos</th>
                <th className="px-6 py-5 text-left text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground">Club</th>
                <th className="px-6 py-5 text-left text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground">Puntuación</th>
                <th className="px-6 py-5 text-left text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground">País</th>
                <th className="px-6 py-5 text-left text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground">Fecha</th>
                <th className="px-6 py-5 text-center text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground">Estado</th>
                <th className="px-6 py-5 w-16"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/10">
              {filteredPlayers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-20 text-center text-muted-foreground font-black text-[11px] uppercase tracking-widest opacity-40 italic">
                    {t.database.noRecords}
                  </td>
                </tr>
              ) : (
                filteredPlayers.map(player => {
                  const status = getPlayerStatus(player);
                  const report = getReportForPlayer(player.id);
                  const completion = calculateCompletion(report);
                  const rating = report?.finalScoutRating || 0;
                  // Escalar rating 1-5 a 0-100 para visualización
                  const score = rating > 0 ? rating * 20 : 0;
                  const dateStr = player.createdAt?.seconds 
                    ? format(new Date(player.createdAt.seconds * 1000), 'yyyy-MM-dd') 
                    : format(new Date(), 'yyyy-MM-dd');

                  return (
                    <tr key={player.id} className="hover:bg-primary/5 transition-all group cursor-default">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-10 w-10 rounded-xl bg-secondary/50 border border-border/40 shadow-inner group-hover:scale-105 transition-transform">
                            <AvatarFallback className="font-black text-muted-foreground text-sm uppercase">
                              {player.name ? player.name[0] : '?'}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-black text-sm text-white tracking-tight uppercase group-hover:text-primary transition-colors">
                            {player.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex justify-center">
                          <div className="h-8 min-w-10 px-2 rounded-lg bg-secondary/40 border border-border/20 flex items-center justify-center">
                            <span className="text-[10px] font-black text-muted-foreground uppercase">{player.tacticalRole}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className="text-sm font-medium text-muted-foreground/80">{player.club}</span>
                      </td>
                      <td className="px-6 py-5">
                        {rating > 0 ? (
                          <div className="flex items-center gap-4">
                            <span className="text-sm font-black text-primary w-6">{score}</span>
                            <div className="h-1.5 w-24 bg-secondary/50 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-primary shadow-[0_0_10px_rgba(224,176,80,0.5)] transition-all duration-1000" 
                                style={{ width: `${score}%` }} 
                              />
                            </div>
                          </div>
                        ) : (
                          <span className="text-[10px] font-bold text-muted-foreground/40 italic">Pendiente</span>
                        )}
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3 w-3 text-muted-foreground/50" />
                          <span className="text-sm font-medium text-muted-foreground/80 uppercase">{player.nationality || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className="text-sm font-medium text-muted-foreground/80 font-mono tracking-tight">{dateStr}</span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex justify-center">
                          <Badge variant="outline" className={cn(
                            "px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-lg border-2",
                            status === 'analizado' 
                              ? "bg-primary/10 text-primary border-primary/20" 
                              : "bg-muted-foreground/5 text-muted-foreground border-border/40"
                          )}>
                            {t.database.status[status as keyof typeof t.database.status]}
                          </Badge>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-secondary/50">
                              <MoreVertical className="h-5 w-5 text-muted-foreground" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-64 bg-[#1b263b] border-border/40 shadow-2xl p-2 rounded-2xl">
                            <DropdownMenuItem onClick={() => onEditPlayer(player.id)} className="flex items-center gap-3 p-4 rounded-xl cursor-pointer hover:bg-primary/10 text-foreground">
                              <FileText className="h-4 w-4 text-primary" />
                              <span className="text-[11px] font-black uppercase tracking-widest">{t.database.actions.editReport}</span>
                            </DropdownMenuItem>
                            
                            <DropdownMenuItem 
                              disabled={completion < 75}
                              onClick={() => generatePDF(player)} 
                              className={cn(
                                "flex items-center gap-3 p-4 rounded-xl cursor-pointer hover:bg-white/5",
                                completion < 75 && "opacity-50 grayscale cursor-not-allowed"
                              )}
                            >
                              <Download className="h-4 w-4 text-muted-foreground" />
                              <div className="flex flex-col">
                                <span className="text-[11px] font-black uppercase tracking-widest">{t.database.actions.createPdf}</span>
                                <span className="text-[8px] font-bold text-muted-foreground uppercase">{completion}% Completado</span>
                              </div>
                            </DropdownMenuItem>

                            <DropdownMenuItem onClick={() => {
                              const newMatch: Omit<ScheduledMatch, 'id'> = {
                                playerId: player.id,
                                homeTeam: player.club || "TBD",
                                awayTeam: "Rival",
                                category: "Pro",
                                dateTime: new Date().toISOString(),
                                scoutId: userId || "",
                                status: 'scheduled'
                              };
                              saveScheduledMatch(newMatch);
                              toast({ title: t.database.actions.matchSuccess });
                            }} className="flex items-center gap-3 p-4 rounded-xl cursor-pointer hover:bg-white/5 text-foreground">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span className="text-[11px] font-black uppercase tracking-widest">{t.database.actions.scheduleMatch}</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
