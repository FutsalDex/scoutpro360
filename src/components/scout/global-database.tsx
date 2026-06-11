"use client"
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Search, Download, Loader2, MoreVertical, FileText, 
  Calendar, MapPin, User, History
} from "lucide-react";
import { useTranslation } from '@/lib/i18n/context';
import { 
  subscribeToPlayers, subscribeToReports, subscribeToScheduledMatches, 
  subscribeToGlobalPlayers 
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
import autoTable from "jspdf-autotable";
import { format } from 'date-fns';
import { Input } from "@/components/ui/input";

interface GlobalDatabaseProps {
  onEditPlayer: (id: string) => void;
  onViewFicha: (id: string) => void;
  onScheduleMatch: (id: string) => void;
  onViewHistory: (id: string) => void;
  global?: boolean;
  mode?: 'analyzed' | 'pending' | 'all';
}

export function GlobalDatabase({ onEditPlayer, onViewFicha, onScheduleMatch, onViewHistory, global = false, mode = 'all' }: GlobalDatabaseProps) {
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
    const timer = setTimeout(() => setLoading(false), 1000);
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
    const matchesSearch = name.includes(search) || club.includes(search) || nationality.includes(search);
    
    if (!matchesSearch) return false;

    const hasReport = reports.some(r => r.playerId === p.id);
    if (mode === 'analyzed') return hasReport;
    if (mode === 'pending') return !hasReport;
    
    return true;
  });

  const getReportForPlayer = (playerId: string) => {
    const playerReports = reports.filter(r => r.playerId === playerId);
    return playerReports.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))[0];
  };

  const handleExportCSV = () => {
    if (filteredPlayers.length === 0) {
      toast({ variant: "destructive", title: "Sin datos", description: "No hay registros para exportar." });
      return;
    }

    const headers = ["Nombre", "Club", "Posicion", "Nacionalidad", "PIM Score", "Fecha Registro"];
    const rows = filteredPlayers.map(player => {
      const report = getReportForPlayer(player.id);
      const score = report?.pimScore || (report?.finalScoutRating ? report.finalScoutRating * 20 : 0);
      const dateStr = player.createdAt?.seconds 
        ? format(new Date(player.createdAt.seconds * 1000), 'yyyy-MM-dd') 
        : 'N/A';
      
      return [
        player.name,
        player.club,
        player.tacticalRole,
        player.nationality || 'N/A',
        score > 0 ? score : 'Pendiente',
        dateStr
      ];
    });

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    link.setAttribute("href", url);
    link.setAttribute("download", `ScoutPro_Export_${format(new Date(), 'yyyy-MM-dd_HHmm')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({ title: "Exportación Exitosa", description: "El archivo CSV ha sido generado correctamente." });
  };

  const generatePDF = (player: Player) => {
    const report = getReportForPlayer(player.id);
    if (!report) return;

    const doc = new jsPDF();
    const primaryColor = [224, 176, 80];
    const navyColor = [27, 38, 59];

    doc.setFillColor(navyColor[0], navyColor[1], navyColor[2]);
    doc.rect(0, 0, 210, 45, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text("SCOUTPRO 360", 105, 20, { align: "center" });
    doc.setFontSize(10);
    doc.text("INFORME TÉCNICO PROFESIONAL DE SCOUTING", 105, 28, { align: "center" });

    doc.setTextColor(navyColor[0], navyColor[1], navyColor[2]);
    doc.setFontSize(12);
    doc.text("1. IDENTIDAD DEL JUGADOR", 14, 55);
    
    autoTable(doc, {
      startY: 58,
      head: [["CAMPO", "VALOR"]],
      body: [
        ["NOMBRE COMPLETO", player.name.toUpperCase()],
        ["CLUB ACTUAL", player.club.toUpperCase()],
        ["NACIONALIDAD", player.nationality || 'N/A'],
        ["POSICIÓN", (player.tacticalRole).toUpperCase()]
      ],
      theme: 'grid',
      headStyles: { fillColor: primaryColor as any, textColor: navyColor as any },
    });

    doc.save(`INFORME_${player.name.replace(/\s+/g, '_')}.pdf`);
    toast({ title: t.database.actions.pdfSuccess });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/60">Sincronizando patrimonio...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-headline font-black text-white uppercase tracking-tight">
            {global ? t.database.globalTitle : (mode === 'analyzed' ? t.database.titleScout : t.database.titleTalentos)}
          </h1>
          <p className="text-muted-foreground text-sm font-medium">
            {global ? t.database.globalSubtitle : (mode === 'analyzed' ? t.database.subtitleScout : t.database.subtitleTalentos)}
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={handleExportCSV}
          className="bg-secondary/20 border-border/40 text-foreground font-black text-[10px] uppercase tracking-widest h-11 px-6 rounded-xl hover:bg-secondary/40"
        >
          <Download className="h-4 w-4 mr-2" /> EXPORTAR CSV
        </Button>
      </div>

      <div className="relative group">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
        <Input
          placeholder={t.database.search}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-14 h-14 bg-card/60 border-border/40 rounded-2xl text-base"
        />
      </div>

      <div className="overflow-hidden rounded-[1.5rem] border border-border/40 bg-card/20 backdrop-blur-xl shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-secondary/30 border-b border-border/20">
                <th className="px-6 py-5 text-left text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground">{t.database.table.player}</th>
                <th className="px-6 py-5 text-center text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground">{t.database.table.pos}</th>
                <th className="px-6 py-5 text-left text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground">{t.database.table.club}</th>
                <th className="px-6 py-5 text-left text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground">{t.database.table.score}</th>
                <th className="px-6 py-5 text-left text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground">{t.database.table.date}</th>
                <th className="px-6 py-5 w-16"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/10">
              {filteredPlayers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center text-muted-foreground font-black text-[11px] uppercase tracking-widest opacity-40 italic">
                    {t.database.noRecords}
                  </td>
                </tr>
              ) : (
                filteredPlayers.map(player => {
                  const report = getReportForPlayer(player.id);
                  const score = report?.pimScore || (report?.finalScoutRating ? report.finalScoutRating * 20 : 0);
                  const dateStr = player.createdAt?.seconds 
                    ? format(new Date(player.createdAt.seconds * 1000), 'yyyy-MM-dd') 
                    : '---';

                  return (
                    <tr key={player.id} className="hover:bg-primary/5 transition-all group">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-10 w-10 rounded-xl bg-secondary/50 border border-border/40">
                            <AvatarFallback className="font-black text-sm uppercase">
                              {player.name ? player.name[0] : '?'}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-black text-sm text-white tracking-tight uppercase group-hover:text-primary transition-colors">
                            {player.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <Badge variant="outline" className="text-[9px] font-black">{player.tacticalRole}</Badge>
                      </td>
                      <td className="px-6 py-5">
                        <span className="text-sm font-medium text-muted-foreground/80">{player.club}</span>
                      </td>
                      <td className="px-6 py-5">
                        {score > 0 ? (
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-black text-primary">{score}</span>
                            <div className="h-1.5 w-16 bg-secondary/50 rounded-full overflow-hidden">
                              <div className="h-full bg-primary" style={{ width: `${score}%` }} />
                            </div>
                          </div>
                        ) : <span className="text-[10px] italic text-muted-foreground/40">Pendiente</span>}
                      </td>
                      <td className="px-6 py-5">
                        <span className="text-sm font-mono text-muted-foreground/80">{dateStr}</span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-secondary/50">
                              <MoreVertical className="h-5 w-5 text-muted-foreground" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-64 bg-[#1b263b] border-border/40 shadow-2xl p-2 rounded-2xl">
                            <DropdownMenuItem onClick={() => onViewFicha(player.id)} className="flex items-center gap-3 p-4 rounded-xl cursor-pointer hover:bg-white/5">
                              <User className="h-4 w-4 text-accent" />
                              <span className="text-[11px] font-black uppercase tracking-widest">{t.database.actions.viewFicha}</span>
                            </DropdownMenuItem>

                            <DropdownMenuItem onClick={() => onViewHistory(player.id)} className="flex items-center gap-3 p-4 rounded-xl cursor-pointer hover:bg-primary/10 text-primary">
                              <History className="h-4 w-4" />
                              <span className="text-[11px] font-black uppercase tracking-widest">VER HISTORIAL</span>
                            </DropdownMenuItem>

                            <DropdownMenuItem onClick={() => onEditPlayer(player.id)} className="flex items-center gap-3 p-4 rounded-xl cursor-pointer hover:bg-white/5">
                              <FileText className="h-4 w-4 text-accent" />
                              <span className="text-[11px] font-black uppercase tracking-widest">NUEVO INFORME</span>
                            </DropdownMenuItem>
                            
                            {score > 0 && (
                              <DropdownMenuItem onClick={() => generatePDF(player)} className="flex items-center gap-3 p-4 rounded-xl cursor-pointer hover:bg-white/5">
                                <Download className="h-4 w-4 text-muted-foreground" />
                                <span className="text-[11px] font-black uppercase tracking-widest">{t.database.actions.createPdf}</span>
                              </DropdownMenuItem>
                            )}

                            <DropdownMenuItem onClick={() => onScheduleMatch(player.id)} className="flex items-center gap-3 p-4 rounded-xl cursor-pointer hover:bg-white/5">
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