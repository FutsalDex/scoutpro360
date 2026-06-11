"use client"
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Search, Download, Loader2, MoreVertical, FileText, 
  Calendar, MapPin, User
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
  global?: boolean;
  mode?: 'analyzed' | 'pending' | 'all';
}

export function GlobalDatabase({ onEditPlayer, onViewFicha, onScheduleMatch, global = false, mode = 'all' }: GlobalDatabaseProps) {
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
    const timer = setTimeout(() => setLoading(false), 1500);
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
    return reports.find(r => r.playerId === playerId);
  };

  const generatePDF = (player: Player) => {
    const report = getReportForPlayer(player.id);
    if (!report) return;

    const doc = new jsPDF();
    const primaryColor = [224, 176, 80];
    const navyColor = [27, 38, 59];
    const grayColor = [100, 116, 139];

    // Header
    doc.setFillColor(navyColor[0], navyColor[1], navyColor[2]);
    doc.rect(0, 0, 210, 45, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("SCOUTPRO 360", 105, 20, { align: "center" });
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("INFORME TÉCNICO PROFESIONAL DE SCOUTING", 105, 28, { align: "center" });
    doc.setFontSize(8);
    doc.text(`ID INFORME: ${report.id || 'N/A'} | FECHA EXPORTACIÓN: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 105, 36, { align: "center" });

    // Section 1: JUGADOR
    doc.setTextColor(navyColor[0], navyColor[1], navyColor[2]);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("1. IDENTIDAD DEL JUGADOR", 14, 55);
    
    autoTable(doc, {
      startY: 58,
      head: [["CAMPO", "VALOR"]],
      body: [
        ["NOMBRE COMPLETO", player.name.toUpperCase()],
        ["CLUB ACTUAL", player.club.toUpperCase()],
        ["NACIONALIDAD", player.nationality || 'N/A'],
        ["POSICIÓN PRINCIPAL", (t.report?.tacticalRoles?.[player.tacticalRole as keyof typeof t.report.tacticalRoles] || player.tacticalRole).toUpperCase()],
        ["DORSAL", report.dorsal || 'N/A'],
        ["VALOR DE MERCADO", player.marketValue || 'N/A'],
        ["PIE DOMINANTE", (player.dominantFoot || 'N/A').toUpperCase()],
        ["TELÉFONO / EMAIL", `${player.phone || '-'} / ${player.email || '-'}`]
      ],
      theme: 'grid',
      headStyles: { fillColor: primaryColor as any, textColor: navyColor as any },
      styles: { fontSize: 9 },
      columnStyles: { 0: { fontStyle: 'bold', width: 50 } }
    });

    // Section 2: CONTEXTO
    const nextY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.text("2. CONTEXTO DEL PARTIDO", 14, nextY);
    
    autoTable(doc, {
      startY: nextY + 3,
      head: [["CATEGORÍA", "DETALLES TÁCTICOS / ENTORNO"]],
      body: [
        ["COMPETICIÓN", report.competition || 'N/A'],
        ["RIVAL", report.rivalName || 'N/A'],
        ["SISTEMA / ROL", `${report.matchSystem || '-'} / ${report.specificMatchRole || '-'}`],
        ["ESTILO / RITMO", `${t.report?.contextTab?.[report.matchStyle as keyof typeof t.report.contextTab] || '-'} / ${t.report?.contextTab?.[report.matchPace as keyof typeof t.report.contextTab] || '-'}`],
        ["DOMINIO / MARCADOR", `${t.report?.contextTab?.[report.teamDominance as keyof typeof t.report.contextTab] || '-'} / ${t.report?.contextTab?.[report.observingScore as keyof typeof t.report.contextTab] || '-'}`],
        ["CLIMA", t.report?.contextTab?.[report.weather as keyof typeof t.report.contextTab] || '-']
      ],
      theme: 'grid',
      headStyles: { fillColor: primaryColor as any, textColor: navyColor as any },
      styles: { fontSize: 9 },
      columnStyles: { 0: { fontStyle: 'bold', width: 50 } }
    });

    // New Page for KPIs
    doc.addPage();
    doc.setTextColor(navyColor[0], navyColor[1], navyColor[2]);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("3. MATRIZ DE RENDIMIENTO (KPIs)", 14, 20);

    const renderKPITable = (title: string, category: string, startY: number) => {
      const kpis = t.report.kpis[category].obs || [];
      const data = kpis.map((k: string) => [
        k.toUpperCase(),
        report.ratings[k] ? `${report.ratings[k]} / 5` : 'N/E',
        report.notes[k] || '-'
      ]);

      doc.setFontSize(10);
      doc.setTextColor(navyColor[0], navyColor[1], navyColor[2]);
      doc.text(title, 14, startY);
      
      autoTable(doc, {
        startY: startY + 2,
        head: [["KPI", "PUNTUACIÓN", "OBSERVACIONES"]],
        body: data,
        theme: 'striped',
        headStyles: { fillColor: navyColor as any, textColor: [255, 255, 255], halign: 'center' },
        styles: { fontSize: 8, cellPadding: 3 },
        columnStyles: { 
          0: { fontStyle: 'bold', width: 50 }, 
          1: { halign: 'center', width: 30, fontStyle: 'bold' },
          2: { cellWidth: 'auto' }
        }
      });
      return (doc as any).lastAutoTable.finalY + 10;
    };

    let kpiY = 25;
    kpiY = renderKPITable("BLOQUE TÉCNICO", "technical", kpiY);
    kpiY = renderKPITable("BLOQUE TÁCTICO", "tactical", kpiY);
    
    doc.addPage();
    kpiY = 20;
    kpiY = renderKPITable("BLOQUE FÍSICO", "physical", kpiY);
    kpiY = renderKPITable("BLOQUE MENTAL", "mental", kpiY);

    // Section 7: ACCIONES
    if (report.actions && report.actions.length > 0) {
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("4. REGISTRO DE ACCIONES CLAVE", 14, kpiY);
      autoTable(doc, {
        startY: kpiY + 3,
        head: [["MIN", "ACCIÓN", "RESULTADO", "NOTAS"]],
        body: report.actions.map(a => [a.minute, a.action, a.result.toUpperCase(), a.notes]),
        theme: 'grid',
        headStyles: { fillColor: primaryColor as any, textColor: navyColor as any },
        styles: { fontSize: 8 }
      });
      kpiY = (doc as any).lastAutoTable.finalY + 10;
    }

    // Section 8: EVALUACIÓN
    if (kpiY > 230) { doc.addPage(); kpiY = 20; }
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("5. CONCLUSIONES Y EVALUACIÓN", 14, kpiY);
    
    autoTable(doc, {
      startY: kpiY + 3,
      body: [
        ["FORTALEZAS", (report.strengths || []).filter(Boolean).join(" | ")],
        ["MEJORAS", (report.weaknesses || []).filter(Boolean).join(" | ")],
        ["DESCRIPCIÓN", report.overallDescription || '-'],
        ["RECOMENDACIÓN", (t.report?.evaluationTab?.recOptions?.[report.finalRecommendation as keyof typeof t.report.evaluationTab.recOptions] || report.finalRecommendation || '-').toUpperCase()]
      ],
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 4 },
      columnStyles: { 0: { fontStyle: 'bold', width: 40, fillColor: [240, 240, 240] } }
    });

    // Section 9: IA ANALYTICS - Rediseño con altura dinámica
    let finalY = (doc as any).lastAutoTable.finalY + 12;
    const summaryText = report.summary || "Sin análisis de IA disponible.";
    const splitExplanation = doc.splitTextToSize(summaryText, 170);
    
    // Cálculo de altura: Padding(10) + Título(8) + Score(12) + Padding(5) + Texto(Líneas * 5) + Padding(10)
    const requiredHeight = 45 + (splitExplanation.length * 4.5);

    // Verificar si cabe en la página actual
    if (finalY + requiredHeight > 280) {
      doc.addPage();
      finalY = 20;
    }

    // Fondo IA
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(14, finalY, 182, requiredHeight, 'F');
    
    // Contenido IA
    doc.setTextColor(navyColor[0], navyColor[1], navyColor[2]);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text("IA ANALYTICS - PIM SCORE", 105, finalY + 10, { align: "center" });
    
    const pim = report.pimScore || (report.finalScoutRating ? report.finalScoutRating * 20 : 0);
    doc.setFontSize(28);
    doc.text(`${pim}`, 105, finalY + 22, { align: "center" });
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    // Dibujar el texto centrado con un line-height adecuado
    doc.text(splitExplanation, 105, finalY + 32, { align: "center", lineHeightFactor: 1.4 });

    // Footer on all pages
    const pageCount = (doc as any).internal.getNumberOfPages();
    for(let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(7);
        doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
        doc.text(`ScoutPro 360 Football Intelligence - Confidencial - Página ${i} de ${pageCount}`, 105, 290, { align: "center" });
    }

    doc.save(`INFORME_360_${player.name.replace(/\s+/g, '_')}_${format(new Date(), 'yyyyMMdd')}.pdf`);
    toast({ title: t.database.actions.pdfSuccess });
  };

  const getPageTitle = () => {
    if (global) return t.database.globalTitle;
    if (mode === 'analyzed') return t.database.titleScout;
    if (mode === 'pending') return t.database.titleTalentos;
    return t.database.titleScout;
  };

  const getPageSubtitle = () => {
    if (global) return t.database.globalSubtitle;
    if (mode === 'analyzed') return t.database.subtitleScout;
    if (mode === 'pending') return t.database.subtitleTalentos;
    return t.database.subtitleScout;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/60">Sincronizando patrimonio de inteligencia...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-headline font-black text-white uppercase tracking-tight">
            {getPageTitle()}
          </h1>
          <p className="text-muted-foreground text-sm font-medium">
            {getPageSubtitle()}
          </p>
        </div>
        <Button variant="outline" className="bg-secondary/20 border-border/40 text-foreground font-black text-[10px] uppercase tracking-widest h-11 px-6 rounded-xl hover:bg-secondary/40">
          <Download className="h-4 w-4 mr-2" /> {t.database.export}
        </Button>
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

      <div className="overflow-hidden rounded-[1.5rem] border border-border/40 bg-card/20 backdrop-blur-xl shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-secondary/30 border-b border-border/20">
                <th className="px-6 py-5 text-left text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground">{t.database.table.player}</th>
                <th className="px-6 py-5 text-center text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground">{t.database.table.pos}</th>
                <th className="px-6 py-5 text-left text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground">{t.database.table.club}</th>
                <th className="px-6 py-5 text-left text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground">{t.database.table.score}</th>
                <th className="px-6 py-5 text-left text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground">{t.database.table.country}</th>
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
                        {score > 0 ? (
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
                      <td className="px-6 py-5 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-secondary/50">
                              <MoreVertical className="h-5 w-5 text-muted-foreground" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-64 bg-[#1b263b] border-border/40 shadow-2xl p-2 rounded-2xl">
                            <DropdownMenuItem onClick={() => onViewFicha(player.id)} className="flex items-center gap-3 p-4 rounded-xl cursor-pointer hover:bg-white/5 text-foreground">
                              <User className="h-4 w-4 text-accent" />
                              <span className="text-[11px] font-black uppercase tracking-widest">{t.database.actions.viewFicha}</span>
                            </DropdownMenuItem>

                            <DropdownMenuItem onClick={() => onEditPlayer(player.id)} className="flex items-center gap-3 p-4 rounded-xl cursor-pointer hover:bg-primary/10 text-foreground">
                              <FileText className="h-4 w-4 text-primary" />
                              <span className="text-[11px] font-black uppercase tracking-widest">
                                {mode === 'pending' ? t.database.actions.createReport : t.database.actions.editReport}
                              </span>
                            </DropdownMenuItem>
                            
                            {score > 0 && (
                              <DropdownMenuItem 
                                onClick={() => generatePDF(player)} 
                                className="flex items-center gap-3 p-4 rounded-xl cursor-pointer hover:bg-white/5"
                              >
                                <Download className="h-4 w-4 text-muted-foreground" />
                                <span className="text-[11px] font-black uppercase tracking-widest">{t.database.actions.createPdf}</span>
                              </DropdownMenuItem>
                            )}

                            {(mode === 'pending' || global) && (
                              <DropdownMenuItem onClick={() => onScheduleMatch(player.id)} className="flex items-center gap-3 p-4 rounded-xl cursor-pointer hover:bg-white/5 text-foreground">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span className="text-[11px] font-black uppercase tracking-widest">{t.database.actions.scheduleMatch}</span>
                              </DropdownMenuItem>
                            )}
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