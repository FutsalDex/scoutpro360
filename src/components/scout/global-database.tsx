"use client"
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Search, Download, Loader2, MoreVertical, FileText, 
  Calendar, Users, Clock, MapPin, FileDown, AlertCircle, Info 
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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

  // Modal State
  const [schedulingPlayer, setSchedulingPlayer] = useState<Player | null>(null);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [matchData, setMatchData] = useState({
    rival: '',
    date: '',
    time: '',
    venue: ''
  });

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
    const timer = setTimeout(() => setLoading(false), 3000);
    return () => {
      unsubPlayers();
      unsubReports();
      unsubMatches();
      clearTimeout(timer);
    };
  }, [authReady, userId, global]);

  useEffect(() => {
    if (players.length > 0) setLoading(false);
  }, [players]);

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
      report.pimScore,
      report.summary,
      report.rivalName,
      report.competition,
      report.matchDate,
      report.matchStyle,
      report.matchSystem,
      report.overallDescription,
      report.finalRecommendation,
      report.finalScoutRating,
      report.strengths?.length ? 1 : null,
      report.weaknesses?.length ? 1 : null,
      ...(report.ratings ? Object.values(report.ratings) : [])
    ];

    const filled = criticalFields.filter(f => f !== undefined && f !== null && f !== '' && f !== 0).length;
    const total = criticalFields.length;
    
    return Math.round((filled / total) * 100);
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
    const primaryColor = [224, 176, 80]; // Golden Harvest
    const navyColor = [27, 38, 59]; // Deep Navy

    // Header
    doc.setFillColor(...navyColor);
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("SCOUTPRO 360", 105, 20, { align: "center" });
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(t.report.pdfHeader, 105, 28, { align: "center" });

    // Player Basic Info Table
    doc.autoTable({
      startY: 45,
      head: [[t.report.playerInfo.title, ""]],
      body: [
        [t.report.playerInfo.name, player.name.toUpperCase()],
        [t.report.playerInfo.club, player.club.toUpperCase()],
        [t.report.playerInfo.nationality, player.nationality || 'N/A'],
        [t.report.playerInfo.primaryPos, player.tacticalRole.toUpperCase()],
        [t.report.playerInfo.birthDate, player.birthDate || 'N/A'],
        ["PIM IMPACT SCORE", `${report.pimScore || 0}%`]
      ],
      theme: 'grid',
      headStyles: { fillColor: primaryColor, textColor: navyColor },
      styles: { fontSize: 9, cellPadding: 3 }
    });

    // Match Context
    doc.autoTable({
      startY: doc.lastAutoTable.finalY + 10,
      head: [[t.report.pdfMatchContext, ""]],
      body: [
        [t.report.playerInfo.rival, report.rivalName || 'N/A'],
        [t.report.playerInfo.competition, report.competition || 'N/A'],
        [t.report.playerInfo.matchDate, report.matchDate || 'N/A'],
        [t.report.contextTab.gameStyle, report.matchStyle || 'N/A'],
        [t.report.contextTab.system, report.matchSystem || 'N/A']
      ],
      theme: 'striped',
      headStyles: { fillColor: primaryColor, textColor: navyColor },
      styles: { fontSize: 9 }
    });

    // AI Summary
    doc.setFillColor(245, 245, 245);
    doc.rect(14, doc.lastAutoTable.finalY + 10, 182, 30, 'F');
    doc.setTextColor(...navyColor);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(t.report.summary.title, 20, doc.lastAutoTable.finalY + 18);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    const summaryLines = doc.splitTextToSize(report.summary || "No summary available.", 170);
    doc.text(summaryLines, 20, doc.lastAutoTable.finalY + 25);

    // Final Recommendation
    doc.autoTable({
      startY: doc.lastAutoTable.finalY + 50,
      head: [[t.report.evaluationTab.recTitle.toUpperCase(), ""]],
      body: [
        [t.report.evaluationTab.finalRec, report.finalRecommendation?.toUpperCase() || 'N/A'],
        [t.report.evaluationTab.finalRatingTitle, `${report.finalScoutRating || 0} / 5`],
        [t.report.evaluationTab.signingTitle, report.fitsPhilosophy === 'si' ? 'POSITIVE' : 'NEGATIVE']
      ],
      theme: 'grid',
      headStyles: { fillColor: navyColor, textColor: [255, 255, 255] },
      styles: { fontSize: 9 }
    });

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for(let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`ScoutPro 360 Intelligence - Confidential Report - Page ${i}`, 105, 285, { align: "center" });
    }

    doc.save(`ScoutPro_Report_${player.name.replace(/\s+/g, '_')}.pdf`);
    toast({ title: t.database.actions.pdfSuccess });
  };

  const statusColors: Record<string, string> = {
    analizado: "bg-primary/20 text-primary border-primary/30",
    agendado: "bg-accent/20 text-accent border-accent/30",
    detectado: "bg-muted-foreground/20 text-muted-foreground border-muted-foreground/30"
  };

  const handleScheduleMatch = (player: Player) => {
    setSchedulingPlayer(player);
    setIsScheduleModalOpen(true);
  };

  const submitSchedule = () => {
    if (!userId || !schedulingPlayer) return;
    if (!matchData.date) {
      toast({ variant: "destructive", title: "Error", description: "La fecha es obligatoria para programar el partido." });
      return;
    }

    const dateTimeValue = matchData.time ? `${matchData.date}T${matchData.time}` : matchData.date;
    
    saveScheduledMatch({
      playerId: schedulingPlayer.id,
      homeTeam: schedulingPlayer.club || "TBD",
      awayTeam: matchData.rival || "Opponent",
      category: matchData.venue || "Pro",
      dateTime: dateTimeValue,
      scoutId: userId,
      status: 'scheduled'
    });

    toast({ title: t.database.actions.matchSuccess });
    setIsScheduleModalOpen(false);
    setMatchData({ rival: '', date: '', time: '', venue: '' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12 overflow-hidden px-1">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-headline font-black text-foreground uppercase tracking-tight">
            {global ? t.database.globalTitle : t.database.title}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {global ? t.database.globalSubtitle : t.database.subtitle}
          </p>
        </div>
        <Button variant="outline" className="border-primary/30 text-primary font-black text-[10px] uppercase tracking-widest h-10 rounded-xl">
          <Download className="h-4 w-4 mr-2" /> {t.database.export}
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t.database.search}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-12 h-12 bg-card/40 border-border/40 rounded-2xl"
        />
      </div>

      <Card className="border-border/40 bg-card/40 backdrop-blur-sm rounded-2xl overflow-hidden shadow-xl">
        <CardContent className="p-0">
          {filteredPlayers.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground text-xs uppercase tracking-widest opacity-50">
              {t.database.noRecords}
            </div>
          ) : (
            <div className="divide-y divide-border/20">
              {filteredPlayers.map(player => {
                const status = getPlayerStatus(player);
                const report = getReportForPlayer(player.id);
                const completion = calculateCompletion(report);
                const birthYear = player.birthDate ? new Date(player.birthDate).getFullYear() : null;

                return (
                  <div key={player.id} className="flex items-center justify-between p-5 hover:bg-secondary/10 transition-all group">
                    <div className="flex items-center gap-5">
                      <Avatar className="h-12 w-12 rounded-xl border border-primary/20 group-hover:scale-105 transition-transform shadow-lg">
                        <AvatarFallback className="font-black text-primary bg-primary/10 text-sm">
                          {player.name ? player.name[0].toUpperCase() : '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="space-y-1">
                        <p className="font-black text-sm uppercase tracking-tight text-foreground">{player.name || 'Sin nombre'}</p>
                        <div className="flex items-center gap-2">
                          <p className="text-[10px] text-muted-foreground font-medium">
                            {player.club || 'Sin club'} · {player.nationality || 'N/A'}
                            {birthYear && ` · ${t.database.birthYear} ${birthYear}`}
                          </p>
                          <Badge variant="outline" className={cn("px-2 py-0 h-4 text-[8px] font-black uppercase tracking-widest", statusColors[status])}>
                            {t.database.status[status as keyof typeof t.database.status]}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 sm:gap-10">
                      <div className="text-right hidden sm:block">
                        <p className="text-[9px] uppercase tracking-widest text-muted-foreground font-black">PIM</p>
                        <p className="text-xl font-black text-accent">{player.currentPIM || 0}</p>
                      </div>
                      <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center font-black text-primary border border-primary/30 shadow-sm hidden sm:flex">
                        {player.grade || 'C'}
                      </div>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-secondary/30">
                            <MoreVertical className="h-5 w-5 text-muted-foreground" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-72 bg-[#1b263b] border-border/40 shadow-2xl p-2 rounded-2xl flex flex-col gap-1">
                          <DropdownMenuItem onClick={() => onEditPlayer(player.id)} className="flex items-center gap-3 p-4 rounded-xl cursor-pointer hover:bg-primary/10 text-foreground transition-all">
                            <FileText className="h-4 w-4 text-primary" />
                            <span className="text-[11px] font-black uppercase tracking-widest">{t.database.actions.editReport}</span>
                          </DropdownMenuItem>
                          
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="w-full">
                                  <DropdownMenuItem 
                                    onClick={() => completion >= 75 && generatePDF(player)} 
                                    className={cn(
                                      "flex flex-col items-center justify-center p-4 rounded-xl transition-all h-20",
                                      completion >= 75 
                                        ? "bg-accent/10 hover:bg-accent/20 text-foreground cursor-pointer" 
                                        : "bg-muted/5 opacity-50 grayscale cursor-help"
                                    )}
                                  >
                                    <span className="text-[11px] font-black uppercase tracking-widest">{t.database.actions.createPdf}</span>
                                    <div className="flex items-center gap-2 mt-2">
                                      <span className={cn("text-[9px] font-black uppercase", completion >= 75 ? "text-accent" : "text-muted-foreground")}>
                                        {completion}% COMPLETADO
                                      </span>
                                      {completion < 75 && <Info className="h-3 w-3 text-muted-foreground" />}
                                    </div>
                                  </DropdownMenuItem>
                                </div>
                              </TooltipTrigger>
                              {completion < 75 && (
                                <TooltipContent side="left" className="bg-[#1b263b] border-border/40 text-[10px] font-bold uppercase tracking-widest text-primary p-3 max-w-[220px]">
                                  {t.database.actions.pdfRequirement}
                                </TooltipContent>
                              )}
                            </Tooltip>
                          </TooltipProvider>

                          <DropdownMenuItem onClick={() => handleScheduleMatch(player)} className="flex items-center gap-3 p-4 rounded-xl cursor-pointer hover:bg-white/5 text-foreground transition-all">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-[11px] font-black uppercase tracking-widest">{t.database.actions.scheduleMatch}</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isScheduleModalOpen} onOpenChange={setIsScheduleModalOpen}>
        <DialogContent className="bg-[#1b263b] border-border/40 text-foreground rounded-2xl sm:max-w-[450px] p-0 overflow-hidden shadow-2xl">
          <DialogHeader className="p-6 bg-secondary/10 border-b border-border/20">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-accent/20 flex items-center justify-center border border-accent/30">
                <Calendar className="h-5 w-5 text-accent" />
              </div>
              <div>
                <DialogTitle className="text-lg font-black uppercase tracking-widest">{t.database.scheduleModal.title}</DialogTitle>
                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mt-0.5">{schedulingPlayer?.name}</p>
              </div>
            </div>
          </DialogHeader>

          <div className="p-8 space-y-6">
            <div className="space-y-4">
              <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">{t.database.scheduleModal.matchDetails}</Label>
              <div className="grid gap-4">
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-50" />
                  <Input 
                    placeholder={t.database.scheduleModal.opponent} 
                    className="pl-10 h-12 bg-secondary/10 border-border/20 rounded-xl font-bold"
                    value={matchData.rival}
                    onChange={(e) => setMatchData({...matchData, rival: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-50" />
                    <Input 
                      type="date" 
                      className="pl-10 h-12 bg-secondary/10 border-border/20 rounded-xl font-bold"
                      value={matchData.date}
                      onChange={(e) => setMatchData({...matchData, date: e.target.value})}
                      required
                    />
                  </div>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-50" />
                    <Input 
                      type="time" 
                      className="pl-10 h-12 bg-secondary/10 border-border/20 rounded-xl font-bold"
                      value={matchData.time}
                      onChange={(e) => setMatchData({...matchData, time: e.target.value})}
                    />
                  </div>
                </div>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-50" />
                  <Input 
                    placeholder={t.database.scheduleModal.venue} 
                    className="pl-10 h-12 bg-secondary/10 border-border/20 rounded-xl font-bold"
                    value={matchData.venue}
                    onChange={(e) => setMatchData({...matchData, venue: e.target.value})}
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="p-6 bg-secondary/10 border-t border-border/20 flex gap-3">
            <Button variant="ghost" onClick={() => setIsScheduleModalOpen(false)} className="flex-1 h-12 font-black uppercase text-[10px] tracking-widest text-muted-foreground">
              {t.database.scheduleModal.cancel}
            </Button>
            <Button onClick={submitSchedule} className="flex-1 h-12 bg-accent text-accent-foreground font-black uppercase text-[10px] tracking-widest rounded-xl shadow-lg shadow-accent/20">
              {t.database.scheduleModal.confirm}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
