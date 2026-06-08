"use client"

import React, { useState, useEffect, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { TacticalCanvas } from "./tactical-canvas";
import { 
  FileText, ChevronRight, ChevronLeft, Activity, User, Target, Shield, 
  Zap as ZapIcon, Heart, Save, Star, Plus, Loader2, Brain, Sparkles, 
  Trash2, Download, Sun, Cloud, CloudRain, Thermometer, Wind, Globe,
  ShieldAlert, LayoutGrid
} from "lucide-react";
import { TACTICAL_ROLES, getLocalizedKPIs, type KPISection, type UserProfile, type ScoutingReport, type Point, type ScoutingAction, type TacticalRoleConfig } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from '@/lib/i18n/context';
import { cn } from "@/lib/utils";
import { savePlayer, saveReport, getPlayer, getLatestReportForPlayer } from "@/lib/services/db-service";
import { auth } from "@/lib/firebase/config";
import { ALL_COUNTRIES } from "@/lib/data/countries";
import { serverTimestamp } from "firebase/firestore";
import { calculatePlayerImpactMetric } from "@/ai/flows/calculate-player-impact-metric-flow";
import { generateExecutiveSummary } from "@/ai/flows/generate-executive-summary";
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const RatingRow = ({ 
  kpi, 
  rating, 
  onRatingChange, 
  note, 
  onNoteChange 
}: { 
  kpi: string, 
  rating?: number, 
  onRatingChange: (value: number) => void,
  note?: string,
  onNoteChange?: (value: string) => void
}) => (
  <div className="flex flex-col sm:flex-row sm:items-center py-4 border-b border-border/10 last:border-0 px-4 w-full gap-4 group hover:bg-white/5 transition-colors">
    <Label className="text-[10px] font-black text-foreground uppercase tracking-wider w-full sm:w-1/3 truncate">{kpi}</Label>
    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-2/3">
      <div className="flex gap-1 shrink-0">
        {[1, 2, 3, 4, 5].map(num => (
          <button
            key={num}
            type="button"
            onClick={() => onRatingChange(num)}
            className={cn(
              "h-8 w-8 rounded-full border border-border/40 text-[9px] font-black flex items-center justify-center transition-all",
              rating === num ? "bg-primary text-primary-foreground border-primary shadow-md scale-110" : "bg-white/5 hover:border-primary/50 text-muted-foreground"
            )}
          >
            {num}
          </button>
        ))}
      </div>
      {onNoteChange && (
        <Input 
          className="h-8 text-[9px] bg-secondary/10 border-none rounded-md italic placeholder:opacity-40 w-full" 
          placeholder="Nota..." 
          value={note || ""}
          onChange={(e) => onNoteChange(e.target.value)}
        />
      )}
    </div>
  </div>
);

const EvaluationModule = ({ 
  icon: Icon, 
  kpiSection, 
  nextTab, 
  prevTab, 
  tabType,
  ratings,
  onRatingChange,
  notes,
  onNoteChange,
  setActiveTab,
  t
}: { 
  icon: any, 
  kpiSection: KPISection, 
  nextTab: string, 
  prevTab: string, 
  tabType: string,
  ratings: Record<string, number>,
  onRatingChange: (kpi: string, val: number) => void,
  notes: Record<string, string>,
  onNoteChange: (kpi: string, val: string) => void,
  setActiveTab: (tab: string) => void,
  t: any
}) => (
  <div className="space-y-6 w-full">
    <div className="flex flex-col gap-6 w-full">
      <Card className="border-border/40 shadow-xl overflow-hidden rounded-2xl bg-card/40 backdrop-blur-md w-full">
        <div className="bg-[#1b263b] px-6 py-4 flex items-center gap-3 border-b border-primary/20">
          <Icon className="h-5 w-5 text-primary" />
          <h2 className="text-[10px] font-black text-white uppercase tracking-widest">{t.report.sections[`${tabType}_obs`]}</h2>
        </div>
        <CardContent className="p-0">
          {kpiSection.observation.map(kpi => (
            <RatingRow 
              key={kpi} 
              kpi={kpi} 
              rating={ratings[kpi]} 
              onRatingChange={(val) => onRatingChange(kpi, val)}
              note={notes[kpi]}
              onNoteChange={(val) => onNoteChange(kpi, val)}
            />
          ))}
        </CardContent>
      </Card>

      {kpiSection.impact && kpiSection.impact.length > 0 && (
        <Card className="border-border/40 shadow-xl overflow-hidden rounded-2xl bg-card/40 backdrop-blur-md w-full">
          <div className="bg-[#1b263b] px-6 py-4 flex items-center gap-3 border-b border-accent/20">
            <Activity className="h-5 w-5 text-accent" />
            <h2 className="text-[10px] font-black text-white uppercase tracking-widest">{t.report.sections[`${tabType}_impact`]}</h2>
          </div>
          <CardContent className="p-0">
            {kpiSection.impact.map(kpi => (
              <RatingRow 
                key={kpi} 
                kpi={kpi} 
                rating={ratings[kpi]} 
                onRatingChange={(val) => onRatingChange(kpi, val)}
                note={notes[kpi]}
                onNoteChange={(val) => onNoteChange(kpi, val)}
              />
            ))}
          </CardContent>
        </Card>
      )}
    </div>

    <div className="flex flex-col sm:flex-row justify-between gap-4 pt-10">
      <Button type="button" variant="ghost" onClick={() => setActiveTab(prevTab)} className="h-12 px-8 font-black text-[11px] uppercase text-muted-foreground w-full sm:w-auto">
        <ChevronLeft className="mr-2 h-4 w-4" /> {t.report.actions.previous}
      </Button>
      <Button type="button" onClick={() => setActiveTab(nextTab)} className="h-12 px-12 bg-primary text-primary-foreground font-black rounded-xl text-[12px] uppercase tracking-widest w-full sm:w-auto">
        {t.report.actions.next} <ChevronRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  </div>
);

export function ReportForm({ userProfile, editingPlayerId }: { userProfile: UserProfile | null, editingPlayerId: string | null }) {
  const { toast } = useToast();
  const { t, language } = useTranslation();
  
  const localizedKPIs = useMemo(() => getLocalizedKPIs(t), [t]);

  const [activeTab, setActiveTab] = useState("player");
  const [activeRole, setActiveRole] = useState<TacticalRoleConfig>({ ...TACTICAL_ROLES[0], kpis: localizedKPIs });
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [observedFunctions, setObservedFunctions] = useState<string[]>([]);
  const [reportId, setReportId] = useState<string | null>(null);
  const [scoutingActions, setScoutingActions] = useState<ScoutingAction[]>([]);
  const [isCalculatingPIM, setIsCalculatingPIM] = useState(false);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [pitchMarker, setPitchMarker] = useState<Point>({ x: 200, y: 300 });
  const [heatmapPoints, setHeatmapPoints] = useState<Point[]>([]);

  const [playerName, setPlayerName] = useState("");
  const [dorsal, setDorsal] = useState("");
  const [clubName, setClubName] = useState("");
  const [rivalName, setRivalName] = useState("");
  const [competition, setCompetition] = useState("");
  const [matchDate, setMatchDate] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [nationality, setNationality] = useState("");
  const [marketValue, setMarketValue] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [minPlayed, setMinPlayed] = useState("90");
  const [secondaryPositions, setSecondaryPositions] = useState("");
  const [dominantFoot, setDominantFoot] = useState("");
  const [physicalCondition, setPhysicalCondition] = useState("");
  const [scoutName, setScoutName] = useState("");

  // Estados de Contexto
  const [matchStyle, setMatchStyle] = useState("");
  const [matchSystem, setMatchSystem] = useState("");
  const [matchPace, setMatchPace] = useState("");
  const [teamDominance, setTeamDominance] = useState("");
  const [observingScore, setObservingScore] = useState("");
  const [matchImportance, setMatchImportance] = useState("");
  const [weather, setWeather] = useState("");
  const [offBallTraits, setOffBallTraits] = useState<string[]>([]);
  const [bodyLanguageTraits, setBodyLanguageTraits] = useState<string[]>([]);
  const [specificMatchRole, setSpecificMatchRole] = useState("");

  useEffect(() => {
    setActiveRole(prev => ({ ...prev, kpis: localizedKPIs }));
  }, [localizedKPIs]);

  useEffect(() => {
    if (editingPlayerId) {
      const loadData = async () => {
        const player = await getPlayer(editingPlayerId);
        const report = await getLatestReportForPlayer(editingPlayerId);
        if (player) {
          setPlayerName(player.name || "");
          setClubName(player.club || "");
          setNationality(player.nationality || "");
          setMarketValue(player.marketValue || "");
          setBirthDate(player.birthDate || "");
          setHeight(player.height || "");
          setWeight(player.weight || "");
          setDominantFoot(player.dominantFoot || "");
          setSecondaryPositions(player.secondaryPositions || "");
          const role = TACTICAL_ROLES.find(r => r.id === player.tacticalRole);
          if (role) setActiveRole({ ...role, kpis: localizedKPIs });
        }
        if (report) {
          setReportId(report.id || null);
          setDorsal(report.dorsal || "");
          setRivalName(report.rivalName || "");
          setCompetition(report.competition || "");
          setMatchDate(report.matchDate || "");
          setMinPlayed(report.minPlayed || "90");
          setPhysicalCondition(report.physicalCondition || "");
          setSelectedRoles(report.selectedRoles || []);
          setObservedFunctions(report.observedFunctions || []);
          setRatings(report.ratings || {});
          setNotes(report.notes || {});
          setScoutingActions(report.actions || []);
          setScoutName(report.scoutName || "");
          setMatchStyle(report.matchStyle || "");
          setMatchSystem(report.matchSystem || "");
          setMatchPace(report.matchPace || "");
          setTeamDominance(report.teamDominance || "");
          setObservingScore(report.observingScore || "");
          setMatchImportance(report.matchImportance || "");
          setWeather(report.weather || "");
          setOffBallTraits(report.offBallTraits || []);
          setBodyLanguageTraits(report.bodyLanguageTraits || []);
          setSpecificMatchRole(report.specificMatchRole || "");
          if (report.pitchPosition) setPitchMarker(report.pitchPosition);
          if (report.heatmapPoints) setHeatmapPoints(report.heatmapPoints);
        }
      };
      loadData();
    }
  }, [editingPlayerId, localizedKPIs]);

  const handleRatingChange = (kpi: string, value: number) => setRatings(prev => ({ ...prev, [kpi]: value }));
  const handleNoteChange = (kpi: string, value: string) => setNotes(prev => ({ ...prev, [kpi]: value }));
  
  const handleTraitToggle = (trait: string, list: string[], setter: (val: string[]) => void) => {
    if (list.includes(trait)) {
      setter(list.filter(t => t !== trait));
    } else {
      setter([...list, trait]);
    }
  };

  const handleAddAction = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    setScoutingActions([...scoutingActions, { minute: "", action: "", result: "", notes: "" }]);
  };

  const handleUpdateAction = (index: number, field: keyof ScoutingAction, value: string) => {
    const updated = [...scoutingActions];
    updated[index] = { ...updated[index], [field]: value };
    setScoutingActions(updated);
  };

  const handleRemoveAction = (index: number) => setScoutingActions(scoutingActions.filter((_, i) => i !== index));

  const handleCalculatePIM = async (e: React.MouseEvent) => {
    e.preventDefault();
    setIsCalculatingPIM(true);
    try {
      const roleName = t.report.tacticalRoles[activeRole.id as keyof typeof t.report.tacticalRoles] || activeRole.name;
      const getSectionMetrics = (section: KPISection) => {
        const result: Record<string, number> = {};
        [...section.observation, ...section.impact].forEach(kpi => {
          if (ratings[kpi]) result[kpi] = ratings[kpi];
        });
        return result;
      };

      const result = await calculatePlayerImpactMetric({
        playerId: editingPlayerId || "temp-player",
        currentEvaluation: {
          tacticalRole: roleName,
          metrics: {
            technical: getSectionMetrics(activeRole.kpis.technical),
            tactical: getSectionMetrics(activeRole.kpis.tactical),
            physical: getSectionMetrics(activeRole.kpis.physical),
            mental: getSectionMetrics(activeRole.kpis.mental),
          }
        },
        historicalClubData: JSON.stringify({ avgPim: 75, topPim: 92, clubStyle: "Possession" }),
        language: language as 'en' | 'es'
      });
      
      handleRatingChange('pim', Math.round(result.playerImpactMetric));
      handleNoteChange('pim_explanation', result.explanation);
      toast({ title: t.report.pim.title, description: `${result.playerImpactMetric}%` });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setIsCalculatingPIM(false);
    }
  };

  const handleGenerateSummary = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!playerName) return toast({ variant: "destructive", title: "Error", description: "Name required" });
    setIsGeneratingSummary(true);
    try {
      const roleName = t.report.tacticalRoles[activeRole.id as keyof typeof t.report.tacticalRoles] || activeRole.name;
      const allScoutNotes = Object.entries(notes)
        .filter(([key]) => !['summary', 'pim_explanation'].includes(key))
        .map(([key, val]) => `${key}: ${val}`)
        .join('\n');
        
      const result = await generateExecutiveSummary({
        playerName,
        tacticalRole: roleName,
        scoutNotes: allScoutNotes || "No notes.",
        language: language as 'en' | 'es',
        metrics: { general: ratings }
      });
      
      handleNoteChange('summary', result.summary);
      toast({ title: t.report.summary.title });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const doc = new jsPDF('p', 'mm', 'a4');
      const primaryColor = [27, 38, 59];
      const accentColor = [224, 176, 80];
      
      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.rect(0, 0, 210, 45, 'F');
      doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
      doc.setFontSize(26);
      doc.setFont('helvetica', 'bold');
      doc.text("SCOUTPRO 360", 15, 25);
      doc.setFontSize(10);
      doc.text(t.report.pdfHeader, 15, 35);

      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setFontSize(18);
      doc.text(playerName.toUpperCase(), 15, 60);
      
      const roleName = t.report.tacticalRoles[activeRole.id as keyof typeof t.report.tacticalRoles] || activeRole.name;

      (doc as any).autoTable({
        startY: 65,
        head: [[t.report.pdfAttribute, t.report.pdfInformation, t.report.pdfAttribute, t.report.pdfInformation]],
        body: [
          [t.report.playerInfo.dorsal, dorsal || '-', t.report.playerInfo.club, clubName || '-'],
          [t.report.playerInfo.nationality, nationality || '-', t.report.playerInfo.birthDate, birthDate || '-'],
          [t.report.playerInfo.primaryPos, roleName, t.report.playerInfo.marketValue, marketValue || '-'],
        ],
        theme: 'grid',
        headStyles: { fillColor: primaryColor, textColor: [255, 255, 255] }
      });

      doc.save(`ScoutPro360_${playerName.replace(/\s+/g, '_')}.pdf`);

      // Marcar informe como exportado para métricas del dashboard
      if (reportId) {
        await saveReport({ pdfGenerated: true }, reportId);
      }

      toast({ title: t.report.actions.exported || "PDF Generado" });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error PDF" });
    } finally {
      setIsExporting(false);
    }
  };

  const handleSaveAll = async () => {
    if (!playerName) {
      toast({ variant: "destructive", title: "Name required" });
      setActiveTab("player");
      return;
    }
    const scoutId = auth.currentUser?.uid;
    if (!scoutId) {
      toast({ variant: "destructive", title: "Authentication required" });
      return;
    }

    setIsSaving(true);
    try {
      const playerId = await savePlayer({
        name: playerName,
        age: birthDate ? new Date().getFullYear() - new Date(birthDate).getFullYear() : 0,
        club: clubName || "No club",
        nationality: nationality || "Unknown",
        marketValue: marketValue || "€0",
        currentPIM: ratings['pim'] || 0,
        tacticalRole: activeRole.id,
        grade: (ratings['pim'] || 0) > 85 ? 'A' : ((ratings['pim'] || 0) > 70 ? 'B' : 'C'),
        scoutId,
        birthDate, height, weight, dominantFoot, secondaryPositions
      }, editingPlayerId || undefined);
      
      const newReportId = await saveReport({
        playerId, playerName, scoutId,
        scoutName: scoutName || userProfile?.displayName || "Scout",
        pimScore: ratings['pim'] || 0,
        summary: notes['summary'] || "",
        ratings: ratings, notes: notes, actions: scoutingActions,
        observedFunctions,
        dorsal, rivalName, competition, matchDate, minPlayed, physicalCondition, selectedRoles,
        matchStyle, matchSystem, matchPace, teamDominance, observingScore, matchImportance, weather,
        offBallTraits, bodyLanguageTraits, specificMatchRole,
        pitchPosition: pitchMarker, heatmapPoints,
        createdAt: serverTimestamp()
      }, reportId || undefined);
      
      if (newReportId) setReportId(newReportId);
      
      toast({ title: "Saved" });
    } catch (e) {
      toast({ variant: "destructive", title: "Error saving" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-32 w-full overflow-x-hidden">
      <div className="bg-card/90 backdrop-blur-xl p-4 sm:p-10 rounded-3xl border border-border/50 shadow-2xl z-40 w-full mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className="h-10 w-10 sm:h-16 sm:w-16 rounded-2xl bg-primary/20 flex items-center justify-center border border-primary/30 shrink-0">
              <FileText className="h-5 w-5 sm:h-8 sm:w-8 text-primary" />
            </div>
            <div className="space-y-0.5 min-w-0 overflow-hidden">
              <h1 className="text-base sm:text-2xl font-black font-headline uppercase tracking-tight text-foreground truncate">
                {playerName || t.report.title}
              </h1>
              <p className="text-[8px] sm:text-[10px] text-primary font-black uppercase tracking-[0.2em] truncate">EVALUACIÓN CONFIDENCIAL 360 SCOUTING</p>
            </div>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <Button 
              type="button" 
              variant="outline"
              onClick={handleExportPDF} 
              disabled={isExporting} 
              className="flex-1 md:flex-none h-10 px-6 border-primary/30 text-primary font-black text-[10px] uppercase tracking-widest rounded-xl"
            >
              {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
              {t.report.actions.export}
            </Button>
            <Button 
              type="button" 
              onClick={handleSaveAll} 
              disabled={isSaving} 
              className="flex-1 md:flex-none h-10 px-6 bg-primary text-primary-foreground font-black text-[10px] uppercase tracking-widest rounded-xl shadow-lg"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              {t.report.actions.save}
            </Button>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-4 sm:grid-cols-9 h-auto bg-secondary/20 p-1 border border-border/20 rounded-2xl w-full gap-1 mb-8">
          {Object.entries(t.report.tabs).map(([key, label]) => (
            <TabsTrigger 
              key={key} 
              value={key} 
              className="px-0.5 py-3 text-[7px] sm:text-[9px] font-black uppercase tracking-tighter data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-xl transition-all"
            >
              {label as string}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="player" className="space-y-8 animate-in fade-in">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 space-y-8">
              <Card className="border-border/40 shadow-xl rounded-2xl bg-card/40 backdrop-blur-md overflow-hidden">
                <div className="bg-[#1b263b] px-6 py-4 flex items-center gap-3 border-b border-primary/20">
                  <User className="h-5 w-5 text-primary" />
                  <h2 className="text-[10px] font-black text-white uppercase tracking-widest">{t.report.playerInfo.title}</h2>
                </div>
                <CardContent className="pt-6 grid grid-cols-1 sm:grid-cols-6 gap-6">
                  <div className="sm:col-span-4 space-y-1.5">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t.report.playerInfo.name}</Label>
                    <Input value={playerName} onChange={(e) => setPlayerName(e.target.value)} className="h-10 bg-secondary/10 border-border/20 text-sm font-bold rounded-xl" placeholder="Nombre del jugador" />
                  </div>
                  <div className="sm:col-span-2 space-y-1.5">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t.report.playerInfo.dorsal}</Label>
                    <Input value={dorsal} onChange={(e) => setDorsal(e.target.value)} className="h-10 bg-secondary/10 border-border/20 text-sm font-bold rounded-xl" placeholder="-" />
                  </div>
                  
                  <div className="sm:col-span-3 space-y-1.5">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t.report.playerInfo.club}</Label>
                    <Input value={clubName} onChange={(e) => setClubName(e.target.value)} className="h-10 bg-secondary/10 border-border/20 text-sm font-bold rounded-xl" placeholder="Club" />
                  </div>
                  <div className="sm:col-span-3 space-y-1.5">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t.report.playerInfo.rival}</Label>
                    <Input value={rivalName} onChange={(e) => setRivalName(e.target.value)} className="h-10 bg-secondary/10 border-border/20 text-sm font-bold rounded-xl" placeholder="vs" />
                  </div>

                  <div className="sm:col-span-3 space-y-1.5">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t.report.playerInfo.competition}</Label>
                    <Input value={competition} onChange={(e) => setCompetition(e.target.value)} className="h-10 bg-secondary/10 border-border/20 text-sm font-bold rounded-xl" placeholder="Liga / Copa" />
                  </div>
                  <div className="sm:col-span-3 space-y-1.5">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t.report.playerInfo.matchDate}</Label>
                    <Input type="date" value={matchDate} onChange={(e) => setMatchDate(e.target.value)} className="h-10 bg-secondary/10 border-border/20 text-sm font-bold rounded-xl" />
                  </div>

                  <div className="sm:col-span-3 space-y-1.5">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t.report.playerInfo.birthDate}</Label>
                    <Input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} className="h-10 bg-secondary/10 border-border/20 text-sm font-bold rounded-xl" />
                  </div>
                  <div className="sm:col-span-3 space-y-1.5">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t.report.playerInfo.nationality}</Label>
                    <Select value={nationality} onValueChange={setNationality}>
                      <SelectTrigger className="h-10 bg-secondary/10 border-border/20 rounded-xl">
                        <SelectValue placeholder="-" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px] bg-[#1b263b] border-border/20">
                        {ALL_COUNTRIES.map(country => (
                          <SelectItem key={country} value={country}>{country}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="sm:col-span-2 space-y-1.5">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t.report.playerInfo.height}</Label>
                    <Input value={height} onChange={(e) => setHeight(e.target.value)} className="h-10 bg-secondary/10 border-border/20 text-sm font-bold rounded-xl" placeholder="-" />
                  </div>
                  <div className="sm:col-span-2 space-y-1.5">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t.report.playerInfo.weight}</Label>
                    <Input value={weight} onChange={(e) => setWeight(e.target.value)} className="h-10 bg-secondary/10 border-border/20 text-sm font-bold rounded-xl" placeholder="-" />
                  </div>
                  <div className="sm:col-span-2 space-y-1.5">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t.report.playerInfo.minPlayed}</Label>
                    <Input value={minPlayed} onChange={(e) => setMinPlayed(e.target.value)} className="h-10 bg-secondary/10 border-border/20 text-sm font-bold rounded-xl" placeholder="90" />
                  </div>

                  <div className="sm:col-span-3 space-y-1.5">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t.report.playerInfo.primaryPos}</Label>
                    <Select 
                      value={activeRole.id} 
                      onValueChange={(v) => {
                        const role = TACTICAL_ROLES.find(r => r.id === v);
                        if (role) setActiveRole({ ...role, kpis: localizedKPIs });
                      }}
                    >
                      <SelectTrigger className="h-10 bg-secondary/10 border-border/20 rounded-xl text-xs font-bold">
                        <SelectValue placeholder="Seleccionar..." />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1b263b] border-border/20">
                        {TACTICAL_ROLES.map(role => (
                          <SelectItem key={role.id} value={role.id}>{t.report.tacticalRoles[role.id as keyof typeof t.report.tacticalRoles] || role.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="sm:col-span-3 space-y-1.5">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t.report.playerInfo.secondaryPos}</Label>
                    <Input value={secondaryPositions} onChange={(e) => setSecondaryPositions(e.target.value)} className="h-10 bg-secondary/10 border-border/20 text-sm font-bold rounded-xl" placeholder="Ej: ED, MCO" />
                  </div>

                  <div className="sm:col-span-full space-y-3">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t.report.playerInfo.dominantFoot}</Label>
                    <div className="flex gap-2">
                      {['right', 'left', 'both'].map((opt) => (
                        <Button
                          key={opt}
                          type="button"
                          variant="outline"
                          onClick={() => setDominantFoot(opt)}
                          className={cn(
                            "h-9 flex-1 rounded-xl text-[10px] font-black uppercase tracking-widest border-border/40",
                            dominantFoot === opt ? "bg-primary text-primary-foreground border-primary" : "bg-white/5"
                          )}
                        >
                          {t.report.dominantFootOptions[opt as keyof typeof t.report.dominantFootOptions]}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="sm:col-span-full space-y-3">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t.report.playerInfo.physicalCondition}</Label>
                    <div className="flex flex-wrap gap-2">
                      {['excellent', 'good', 'normal', 'low', 'injured'].map((opt) => (
                        <Button
                          key={opt}
                          type="button"
                          variant="outline"
                          onClick={() => setPhysicalCondition(opt)}
                          className={cn(
                            "h-9 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest border-border/40",
                            physicalCondition === opt ? "bg-primary text-primary-foreground border-primary" : "bg-white/5"
                          )}
                        >
                          {t.report.physicalConditionOptions[opt as keyof typeof t.report.physicalConditionOptions]}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="sm:col-span-full space-y-1.5">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t.report.playerInfo.scout}</Label>
                    <Input value={scoutName} onChange={(e) => setScoutName(e.target.value)} className="h-10 bg-secondary/10 border-border/20 text-sm font-bold rounded-xl" placeholder="Nombre del observador" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-4 space-y-6">
              <Card className="border-border/40 shadow-xl rounded-2xl bg-card/40 backdrop-blur-md">
                <div className="bg-[#1b263b] px-6 py-4 flex items-center gap-3 border-b border-primary/20">
                  <Target className="h-5 w-5 text-primary" />
                  <h2 className="text-[10px] font-black text-white uppercase tracking-widest">{t.report.pitch.title}</h2>
                </div>
                <CardContent className="p-4">
                  <TacticalCanvas marker={pitchMarker} onMarkerChange={setPitchMarker} heatmapPoints={heatmapPoints} onHeatmapChange={setHeatmapPoints} />
                </CardContent>
              </Card>

              {/* ROLES Y FUNCIONES OBSERVADAS */}
              <Card className="border-border/40 shadow-xl rounded-2xl bg-card/40 backdrop-blur-md overflow-hidden">
                <div className="bg-[#1b263b] px-6 py-4 flex items-center gap-3 border-b border-primary/20">
                  <LayoutGrid className="h-5 w-5 text-primary" />
                  <h2 className="text-[10px] font-black text-white uppercase tracking-widest">{t.report.observedFunctions.title}</h2>
                </div>
                <CardContent className="p-6">
                  <div className="flex flex-wrap gap-2">
                    {t.report.observedFunctions.options.map((func: string) => (
                      <button
                        key={func}
                        type="button"
                        onClick={() => handleTraitToggle(func, observedFunctions, setObservedFunctions)}
                        className={cn(
                          "px-4 py-1.5 rounded-full border text-[10px] font-medium transition-all",
                          observedFunctions.includes(func) 
                            ? "bg-primary text-primary-foreground border-primary shadow-lg scale-105" 
                            : "bg-white/5 border-border/40 text-muted-foreground hover:border-primary/50"
                        )}
                      >
                        {func}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* PERFIL GENERAL (IMPRESIÓN GLOBAL) - ANCHO COMPLETO */}
            <div className="col-span-full">
              <Card className="border-border/40 shadow-xl rounded-2xl bg-card/40 backdrop-blur-md overflow-hidden">
                <div className="bg-[#1b263b] px-6 py-4 flex items-center gap-3 border-b border-primary/20">
                  <Star className="h-5 w-5 text-primary fill-primary" />
                  <h2 className="text-[10px] font-black text-white uppercase tracking-widest">{t.report.generalProfile.title}</h2>
                </div>
                <CardContent className="p-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 px-2">
                    <RatingRow 
                      kpi={t.report.generalProfile.technical} 
                      rating={ratings['gen_technical']} 
                      onRatingChange={(val) => handleRatingChange('gen_technical', val)} 
                    />
                    <RatingRow 
                      kpi={t.report.generalProfile.tactical} 
                      rating={ratings['gen_tactical']} 
                      onRatingChange={(val) => handleRatingChange('gen_tactical', val)} 
                    />
                    <RatingRow 
                      kpi={t.report.generalProfile.physical} 
                      rating={ratings['gen_physical']} 
                      onRatingChange={(val) => handleRatingChange('gen_physical', val)} 
                    />
                    <RatingRow 
                      kpi={t.report.generalProfile.mental} 
                      rating={ratings['gen_mental']} 
                      onRatingChange={(val) => handleRatingChange('gen_mental', val)} 
                    />
                    <RatingRow 
                      kpi={t.report.generalProfile.competitive} 
                      rating={ratings['gen_competitive']} 
                      onRatingChange={(val) => handleRatingChange('gen_competitive', val)} 
                    />
                    <RatingRow 
                      kpi={t.report.generalProfile.potential} 
                      rating={ratings['gen_potential']} 
                      onRatingChange={(val) => handleRatingChange('gen_potential', val)} 
                    />
                    <RatingRow 
                      kpi={t.report.generalProfile.current} 
                      rating={ratings['gen_current']} 
                      onRatingChange={(val) => handleRatingChange('gen_current', val)} 
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="context" className="space-y-8 animate-in fade-in">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* CONTEXTO DEL PARTIDO */}
            <Card className="border-border/40 shadow-xl overflow-hidden rounded-2xl bg-card/40 backdrop-blur-md">
              <div className="bg-[#0f766e] px-6 py-4 flex items-center gap-3 border-b border-teal-500/20">
                <Globe className="h-5 w-5 text-white" />
                <h2 className="text-[11px] font-black text-white uppercase tracking-widest">{t.report.context.title}</h2>
              </div>
              <CardContent className="p-8 space-y-8">
                {/* Estilo de Juego */}
                <div className="space-y-3">
                  <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t.report.context.style}</Label>
                  <div className="flex flex-wrap gap-2">
                    {t.report.context.styles.map((style: string) => (
                      <Button
                        key={style}
                        variant="outline"
                        size="sm"
                        onClick={() => setMatchStyle(style)}
                        className={cn(
                          "h-9 px-4 rounded-full text-[10px] font-bold border-border/40",
                          matchStyle === style ? "bg-primary text-primary-foreground border-primary" : "bg-white/5"
                        )}
                      >
                        {style}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Sistema / Formación */}
                <div className="space-y-3">
                  <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t.report.context.system}</Label>
                  <Input 
                    value={matchSystem} 
                    onChange={(e) => setMatchSystem(e.target.value)} 
                    placeholder="Ej: 4-3-3, 4-2-3-1" 
                    className="h-10 bg-secondary/10 border-border/20 rounded-xl"
                  />
                </div>

                {/* Ritmo del Partido */}
                <div className="space-y-3">
                  <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t.report.context.pace}</Label>
                  <div className="flex gap-2">
                    {t.report.context.paces.map((pace: string) => (
                      <Button
                        key={pace}
                        variant="outline"
                        size="sm"
                        onClick={() => setMatchPace(pace)}
                        className={cn(
                          "h-9 flex-1 rounded-full text-[10px] font-bold border-border/40",
                          matchPace === pace ? "bg-primary text-primary-foreground border-primary" : "bg-white/5"
                        )}
                      >
                        {pace}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Dominio del Equipo */}
                <div className="space-y-3">
                  <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t.report.context.dominance}</Label>
                  <div className="flex gap-2">
                    {t.report.context.dominanceOpts.map((opt: string) => (
                      <Button
                        key={opt}
                        variant="outline"
                        size="sm"
                        onClick={() => setTeamDominance(opt)}
                        className={cn(
                          "h-9 flex-1 rounded-full text-[10px] font-bold border-border/40",
                          teamDominance === opt ? "bg-primary text-primary-foreground border-primary" : "bg-white/5"
                        )}
                      >
                        {opt}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Marcador al observar */}
                <div className="space-y-3">
                  <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t.report.context.score}</Label>
                  <div className="flex gap-2">
                    {t.report.context.scoreOpts.map((opt: string) => (
                      <Button
                        key={opt}
                        variant="outline"
                        size="sm"
                        onClick={() => setObservingScore(opt)}
                        className={cn(
                          "h-9 flex-1 rounded-full text-[10px] font-bold border-border/40",
                          observingScore === opt ? "bg-primary text-primary-foreground border-primary" : "bg-white/5"
                        )}
                      >
                        {opt}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Importancia del Partido */}
                <div className="space-y-3">
                  <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t.report.context.importance}</Label>
                  <div className="flex gap-2">
                    {t.report.context.importanceOpts.map((opt: string) => (
                      <Button
                        key={opt}
                        variant="outline"
                        size="sm"
                        onClick={() => setMatchImportance(opt)}
                        className={cn(
                          "h-9 flex-1 rounded-full text-[10px] font-bold border-border/40",
                          matchImportance === opt ? "bg-primary text-primary-foreground border-primary" : "bg-white/5"
                        )}
                      >
                        {opt}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Condiciones Meteorológicas */}
                <div className="space-y-3">
                  <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t.report.context.weather}</Label>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setWeather('sun')}
                      className={cn(
                        "h-9 px-4 rounded-full text-[10px] font-bold border-border/40 gap-2",
                        weather === 'sun' ? "bg-primary text-primary-foreground border-primary" : "bg-white/5"
                      )}
                    >
                      <Sun className="h-3 w-3" /> {t.report.context.weatherOpts.sun}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setWeather('cloudy')}
                      className={cn(
                        "h-9 px-4 rounded-full text-[10px] font-bold border-border/40 gap-2",
                        weather === 'cloudy' ? "bg-primary text-primary-foreground border-primary" : "bg-white/5"
                      )}
                    >
                      <Cloud className="h-3 w-3" /> {t.report.context.weatherOpts.cloudy}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setWeather('rain')}
                      className={cn(
                        "h-9 px-4 rounded-full text-[10px] font-bold border-border/40 gap-2",
                        weather === 'rain' ? "bg-primary text-primary-foreground border-primary" : "bg-white/5"
                      )}
                    >
                      <CloudRain className="h-3 w-3" /> {t.report.context.weatherOpts.rain}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setWeather('cold')}
                      className={cn(
                        "h-9 px-4 rounded-full text-[10px] font-bold border-border/40 gap-2",
                        weather === 'cold' ? "bg-primary text-primary-foreground border-primary" : "bg-white/5"
                      )}
                    >
                      <Thermometer className="h-3 w-3" /> {t.report.context.weatherOpts.cold}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setWeather('wind')}
                      className={cn(
                        "h-9 px-4 rounded-full text-[10px] font-bold border-border/40 gap-2",
                        weather === 'wind' ? "bg-primary text-primary-foreground border-primary" : "bg-white/5"
                      )}
                    >
                      <Wind className="h-3 w-3" /> {t.report.context.weatherOpts.wind}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* COMPORTAMIENTO SIN BALÓN */}
            <Card className="border-border/40 shadow-xl overflow-hidden rounded-2xl bg-card/40 backdrop-blur-md">
              <div className="bg-[#1e293b] px-6 py-4 flex items-center gap-3 border-b border-slate-500/20">
                <ShieldAlert className="h-5 w-5 text-white" />
                <h2 className="text-[11px] font-black text-white uppercase tracking-widest">{t.report.context.offBallTitle}</h2>
              </div>
              <CardContent className="p-8 space-y-8">
                {/* Sin Posesión */}
                <div className="space-y-3">
                  <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t.report.context.noPossession}</Label>
                  <div className="flex flex-wrap gap-2">
                    {t.report.context.offBallTraits.map((trait: string) => (
                      <Button
                        key={trait}
                        variant="outline"
                        size="sm"
                        onClick={() => handleTraitToggle(trait, offBallTraits, setOffBallTraits)}
                        className={cn(
                          "h-9 px-4 rounded-full text-[10px] font-bold border-border/40",
                          offBallTraits.includes(trait) ? "bg-primary text-primary-foreground border-primary" : "bg-white/5"
                        )}
                      >
                        {trait}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Lenguaje Corporal */}
                <div className="space-y-3">
                  <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t.report.context.bodyLanguage}</Label>
                  <div className="flex flex-wrap gap-2">
                    {t.report.context.bodyTraits.map((trait: string) => (
                      <Button
                        key={trait}
                        variant="outline"
                        size="sm"
                        onClick={() => handleTraitToggle(trait, bodyLanguageTraits, setBodyLanguageTraits)}
                        className={cn(
                          "h-9 px-4 rounded-full text-[10px] font-bold border-border/40",
                          bodyLanguageTraits.includes(trait) ? "bg-primary text-primary-foreground border-primary" : "bg-white/5"
                        )}
                      >
                        {trait}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Rol Táctico en este partido */}
                <div className="space-y-3">
                  <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t.report.context.roleInMatch}</Label>
                  <Textarea 
                    value={specificMatchRole} 
                    onChange={(e) => setSpecificMatchRole(e.target.value)} 
                    placeholder="Describe el rol táctico asignado al jugador..." 
                    className="min-h-[120px] bg-secondary/10 border-border/20 rounded-2xl p-4 text-[11px] italic"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-col sm:flex-row justify-between gap-4 pt-10">
            <Button type="button" variant="ghost" onClick={() => setActiveTab("player")} className="h-12 px-8 font-black text-[11px] uppercase text-muted-foreground w-full sm:w-auto">
              <ChevronLeft className="mr-2 h-4 w-4" /> {t.report.actions.previous}
            </Button>
            <Button type="button" onClick={() => setActiveTab("technical")} className="h-12 px-12 bg-primary text-primary-foreground font-black rounded-xl text-[12px] uppercase tracking-widest w-full sm:w-auto">
              {t.report.actions.next} <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="technical" className="animate-in fade-in">
           <EvaluationModule t={t} icon={Shield} kpiSection={activeRole.kpis.technical} nextTab="tactical" prevTab="context" tabType="technical" ratings={ratings} onRatingChange={handleRatingChange} notes={notes} onNoteChange={handleNoteChange} setActiveTab={setActiveTab} />
        </TabsContent>
        <TabsContent value="tactical" className="animate-in fade-in">
           <EvaluationModule t={t} icon={Shield} kpiSection={activeRole.kpis.tactical} nextTab="physical" prevTab="technical" tabType="tactical" ratings={ratings} onRatingChange={handleRatingChange} notes={notes} onNoteChange={handleNoteChange} setActiveTab={setActiveTab} />
        </TabsContent>
        <TabsContent value="physical" className="animate-in fade-in">
           <EvaluationModule t={t} icon={ZapIcon} kpiSection={activeRole.kpis.physical} nextTab="mental" prevTab="tactical" tabType="physical" ratings={ratings} onRatingChange={handleRatingChange} notes={notes} onNoteChange={handleNoteChange} setActiveTab={setActiveTab} />
        </TabsContent>
        <TabsContent value="mental" className="animate-in fade-in">
           <EvaluationModule t={t} icon={Heart} kpiSection={activeRole.kpis.mental} nextTab="actions" prevTab="physical" tabType="mental" ratings={ratings} onRatingChange={handleRatingChange} notes={notes} onNoteChange={handleNoteChange} setActiveTab={setActiveTab} />
        </TabsContent>

        <TabsContent value="actions" className="space-y-6 animate-in fade-in">
          <Card className="border-border/40 shadow-xl overflow-hidden rounded-3xl bg-card/40 backdrop-blur-md">
            <div className="bg-[#1b263b] px-6 py-4 flex items-center gap-3 border-b border-primary/20">
              <Star className="h-5 w-5 text-primary fill-primary" />
              <h2 className="text-[10px] font-black text-white uppercase tracking-widest">{t.report.sections.actions_title}</h2>
            </div>
            <CardContent className="p-4 space-y-4">
              {scoutingActions.map((action, idx) => (
                <div key={idx} className="p-4 bg-secondary/10 rounded-2xl border border-border/10 space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <Label className="text-[9px] font-black uppercase text-primary tracking-widest">MIN</Label>
                      <Input value={action.minute} onChange={(e) => handleUpdateAction(idx, 'minute', e.target.value)} className="h-8 w-14 bg-background/50 text-center font-black rounded-lg border-none" />
                    </div>
                    <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveAction(idx)} className="h-8 w-8 text-destructive"><Trash2 className="h-4 w-4" /></Button>
                  </div>
                  <Input placeholder="Acción" value={action.action} onChange={(e) => handleUpdateAction(idx, 'action', e.target.value)} className="h-9 bg-background/50 rounded-xl border-none font-bold text-[11px]" />
                </div>
              ))}
              <Button type="button" variant="outline" className="w-full h-12 border-dashed border-2 border-primary/30 text-primary font-black uppercase tracking-widest text-[9px] rounded-xl" onClick={handleAddAction}>
                <Plus className="h-4 w-4 mr-2" /> {t.report.actions.addEvent}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="evaluation" className="space-y-6 animate-in fade-in">
          <Card className="border-border/40 rounded-3xl overflow-hidden bg-card/40 shadow-xl">
            <div className="bg-[#1b263b] px-6 py-4 border-b border-primary/20 flex items-center gap-3">
              <Activity className="h-5 w-5 text-primary" />
              <h2 className="text-[10px] font-black text-white uppercase tracking-widest">{t.report.evaluation.finalSummary.title}</h2>
            </div>
            <CardContent className="p-6">
              <Textarea value={notes['player_general_desc'] || ""} onChange={(e) => handleNoteChange('player_general_desc', e.target.value)} className="min-h-[160px] bg-secondary/10 border-border/20 rounded-2xl p-4 text-[11px] italic" placeholder="Resumen general..." />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-8 animate-in fade-in">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-primary/30 bg-[#1b263b]/60 shadow-xl p-8 rounded-[2.5rem] border-2 flex flex-col justify-between">
              <div className="text-center space-y-6">
                <Brain className="h-10 w-10 text-primary mx-auto" />
                <h3 className="text-sm font-black uppercase tracking-[0.2em]">{t.report.pim.title}</h3>
                <div className="text-7xl font-black text-primary drop-shadow-xl">{ratings['pim'] || "0"}</div>
              </div>
              <Button type="button" onClick={handleCalculatePIM} disabled={isCalculatingPIM} className="h-12 bg-primary text-primary-foreground font-black uppercase text-[11px] rounded-xl mt-6">
                {isCalculatingPIM ? <Loader2 className="h-6 w-6 animate-spin" /> : t.report.pim.calculate}
              </Button>
            </Card>
            <Card className="border-accent/30 bg-[#1b263b]/60 shadow-xl p-8 rounded-[2.5rem] border-2 flex flex-col justify-between">
              <div className="text-center space-y-4">
                <Sparkles className="h-10 w-10 text-accent mx-auto" />
                <h3 className="text-sm font-black uppercase tracking-[0.2em]">{t.report.summary.title}</h3>
                {notes['summary'] && <div className="text-[10px] text-muted-foreground italic text-left p-4 bg-background/50 rounded-xl leading-relaxed">{notes['summary']}</div>}
              </div>
              <Button type="button" variant="secondary" onClick={handleGenerateSummary} disabled={isGeneratingSummary} className="h-12 font-black uppercase text-[10px] rounded-xl mt-6">
                {isGeneratingSummary ? <Loader2 className="h-6 w-6 animate-spin" /> : t.report.summary.generate}
              </Button>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}