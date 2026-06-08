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
import { calculatePlayerImpactMetric } from "@/ai/flows/calculate-player-impact-metric-flow";
import { generateExecutiveSummary } from "@/ai/flows/generate-executive-summary";
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const RatingRow = ({ kpi, rating, onRatingChange, note, onNoteChange }: { kpi: string, rating?: number, onRatingChange: (v: number) => void, note?: string, onNoteChange?: (v: string) => void }) => (
  <div className="flex flex-col sm:flex-row sm:items-center py-4 border-b border-border/10 last:border-0 px-4 w-full gap-4 hover:bg-white/5 transition-colors">
    <Label className="text-[10px] font-black text-foreground uppercase tracking-wider w-full sm:w-1/3 truncate">{kpi}</Label>
    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-2/3">
      <div className="flex gap-1 shrink-0">
        {[1, 2, 3, 4, 5].map(num => (
          <button key={num} type="button" onClick={() => onRatingChange(num)} className={cn("h-8 w-8 rounded-full border border-border/40 text-[9px] font-black flex items-center justify-center transition-all", rating === num ? "bg-primary text-primary-foreground border-primary shadow-md scale-110" : "bg-white/5 hover:border-primary/50 text-muted-foreground")}>{num}</button>
        ))}
      </div>
      {onNoteChange && <Input className="h-8 text-[9px] bg-secondary/10 border-none rounded-md italic" placeholder="Nota..." value={note || ""} onChange={(e) => onNoteChange(e.target.value)} />}
    </div>
  </div>
);

const EvaluationModule = ({ icon: Icon, kpiSection, nextTab, prevTab, tabType, ratings, onRatingChange, notes, onNoteChange, setActiveTab, t }: { icon: any, kpiSection: KPISection, nextTab: string, prevTab: string, tabType: string, ratings: Record<string, number>, onRatingChange: (k: string, v: number) => void, notes: Record<string, string>, onNoteChange: (k: string, v: string) => void, setActiveTab: (t: string) => void, t: any }) => (
  <div className="space-y-6">
    <Card className="border-border/40 shadow-xl overflow-hidden rounded-2xl bg-card/40 backdrop-blur-md">
      <div className="bg-[#1b263b] px-6 py-4 flex items-center gap-3 border-b border-primary/20">
        <Icon className="h-5 w-5 text-primary" />
        <h2 className="text-[10px] font-black text-white uppercase tracking-widest">{t.report.sections[`${tabType}_obs`]}</h2>
      </div>
      <CardContent className="p-0">
        {kpiSection.observation.map(kpi => <RatingRow key={kpi} kpi={kpi} rating={ratings[kpi]} onRatingChange={(val) => onRatingChange(kpi, val)} note={notes[kpi]} onNoteChange={(val) => onNoteChange(kpi, val)} />)}
      </CardContent>
    </Card>
    <div className="flex justify-between gap-4 pt-10">
      <Button type="button" variant="ghost" onClick={() => setActiveTab(prevTab)} className="h-12 px-8 font-black text-[11px] uppercase text-muted-foreground">{t.report.actions.previous}</Button>
      <Button type="button" onClick={() => setActiveTab(nextTab)} className="h-12 px-12 bg-primary text-primary-foreground font-black rounded-xl text-[12px] uppercase tracking-widest">{t.report.actions.next} <ChevronRight className="ml-2 h-4 w-4" /></Button>
    </div>
  </div>
);

export function ReportForm({ userProfile, editingPlayerId }: { userProfile: UserProfile | null, editingPlayerId: string | null }) {
  const { toast } = useToast();
  const { t, language } = useTranslation();
  const localizedKPIs = useMemo(() => getLocalizedKPIs(t), [t]);

  const [activeTab, setActiveTab] = useState("player");
  const [activeRole, setActiveRole] = useState<TacticalRoleConfig>({ ...TACTICAL_ROLES[0], kpis: localizedKPIs });
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [observedFunctions, setObservedFunctions] = useState<string[]>([]);
  const [reportId, setReportId] = useState<string | null>(null);
  const [scoutingActions, setScoutingActions] = useState<ScoutingAction[]>([]);
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

  const [isCalculatingPIM, setIsCalculatingPIM] = useState(false);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

  useEffect(() => {
    if (editingPlayerId) {
      getPlayer(editingPlayerId).then(p => {
        if (p) {
          setPlayerName(p.name); setClubName(p.club); setNationality(p.nationality); setMarketValue(p.marketValue);
          setBirthDate(p.birthDate || ""); setHeight(p.height || ""); setWeight(p.weight || "");
          setDominantFoot(p.dominantFoot || ""); setSecondaryPositions(p.secondaryPositions || "");
          const role = TACTICAL_ROLES.find(r => r.id === p.tacticalRole);
          if (role) setActiveRole({ ...role, kpis: localizedKPIs });
        }
      });
      getLatestReportForPlayer(editingPlayerId).then(r => {
        if (r) {
          setReportId(r.id || null); setDorsal(r.dorsal || ""); setRivalName(r.rivalName || "");
          setCompetition(r.competition || ""); setMatchDate(r.matchDate || "");
          setRatings(r.ratings || {}); setNotes(r.notes || {}); setScoutingActions(r.actions || []);
          if (r.pitchPosition) setPitchMarker(r.pitchPosition);
          if (r.heatmapPoints) setHeatmapPoints(r.heatmapPoints);
        }
      });
    }
  }, [editingPlayerId, localizedKPIs]);

  const handleRatingChange = (kpi: string, value: number) => setRatings(prev => ({ ...prev, [kpi]: value }));
  const handleNoteChange = (kpi: string, value: string) => setNotes(prev => ({ ...prev, [kpi]: value }));

  const handleSaveAll = () => {
    const scoutId = auth.currentUser?.uid;
    if (!scoutId) {
      toast({ variant: "destructive", title: "Error", description: "Inicia sesión para guardar." });
      return;
    }

    if (!playerName) {
      toast({ variant: "destructive", title: "Error", description: "Nombre del jugador requerido." });
      setActiveTab("player");
      return;
    }

    // 1. Guardar Jugador (Sincronizado con scoutId)
    const playerId = savePlayer({
      name: playerName,
      age: birthDate ? new Date().getFullYear() - new Date(birthDate).getFullYear() : 0,
      club: clubName || "No club",
      nationality: nationality || "Unknown",
      marketValue: marketValue || "€0",
      currentPIM: ratings['pim'] || 0,
      tacticalRole: activeRole.id,
      grade: (ratings['pim'] || 0) > 85 ? 'A' : ((ratings['pim'] || 0) > 70 ? 'B' : 'C'),
      scoutId: scoutId,
      birthDate, height, weight, dominantFoot, secondaryPositions
    }, editingPlayerId || undefined);

    // 2. Guardar Informe Vinculado
    const newReportId = saveReport({
      playerId,
      playerName,
      scoutId: scoutId,
      scoutName: scoutName || userProfile?.displayName || "Scout",
      pimScore: ratings['pim'] || 0,
      summary: notes['summary'] || "",
      ratings, notes, actions: scoutingActions,
      dorsal, rivalName, competition, matchDate, minPlayed, physicalCondition,
      matchStyle, matchSystem, matchPace, teamDominance, observingScore, matchImportance, weather,
      offBallTraits, bodyLanguageTraits, specificMatchRole,
      pitchPosition: pitchMarker, heatmapPoints
    }, reportId || undefined);

    setReportId(newReportId);
    toast({ title: "Base de Datos Actualizada", description: "Jugador e Informe sincronizados con éxito." });
  };

  const handleCalculatePIM = async () => {
    setIsCalculatingPIM(true);
    try {
      const result = await calculatePlayerImpactMetric({
        playerId: editingPlayerId || "temp",
        currentEvaluation: {
          tacticalRole: activeRole.name,
          metrics: { technical: ratings, tactical: ratings, physical: ratings, mental: ratings }
        },
        historicalClubData: "Avg PIM: 75",
        language: language as 'en' | 'es'
      });
      handleRatingChange('pim', Math.round(result.playerImpactMetric));
      handleNoteChange('pim_explanation', result.explanation);
    } catch (e) {
      toast({ variant: "destructive", title: "Error IA" });
    } finally { setIsCalculatingPIM(false); }
  };

  const handleGenerateSummary = async () => {
    setIsGeneratingSummary(true);
    try {
      const result = await generateExecutiveSummary({
        playerName, tacticalRole: activeRole.name, scoutNotes: JSON.stringify(notes), language: language as 'en' | 'es'
      });
      handleNoteChange('summary', result.summary);
    } catch (e) {
      toast({ variant: "destructive", title: "Error IA" });
    } finally { setIsGeneratingSummary(false); }
  };

  return (
    <div className="space-y-6 pb-32">
      <div className="bg-card/90 backdrop-blur-xl p-8 rounded-3xl border border-border/50 shadow-2xl flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-primary/20 flex items-center justify-center border border-primary/30">
            <FileText className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-black font-headline uppercase tracking-tight">{playerName || t.report.title}</h1>
            <p className="text-[10px] text-primary font-black uppercase tracking-widest">REGISTRO DE INTELIGENCIA DE SCOUTING</p>
          </div>
        </div>
        <Button onClick={handleSaveAll} className="bg-primary text-primary-foreground font-black text-xs uppercase tracking-widest h-12 px-8 rounded-xl shadow-lg">
          <Save className="h-4 w-4 mr-2" /> {t.report.actions.save}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-4 sm:grid-cols-9 bg-secondary/20 p-1 border border-border/20 rounded-2xl gap-1 mb-8 h-auto">
          {Object.entries(t.report.tabs).map(([k, v]) => (
            <TabsTrigger key={k} value={k} className="py-3 text-[9px] font-black uppercase tracking-tighter rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">{v as string}</TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="player" className="space-y-8 animate-in fade-in">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <Card className="lg:col-span-8 border-border/40 bg-card/40 rounded-2xl overflow-hidden">
              <div className="bg-[#1b263b] px-6 py-4 flex items-center gap-3 border-b border-primary/20">
                <User className="h-5 w-5 text-primary" />
                <h2 className="text-[10px] font-black text-white uppercase tracking-widest">{t.report.playerInfo.title}</h2>
              </div>
              <CardContent className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground">{t.report.playerInfo.name}</Label>
                  <Input value={playerName} onChange={(e) => setPlayerName(e.target.value)} className="h-10 bg-secondary/10 border-border/20 font-bold" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground">{t.report.playerInfo.club}</Label>
                  <Input value={clubName} onChange={(e) => setClubName(e.target.value)} className="h-10 bg-secondary/10 border-border/20 font-bold" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground">{t.report.playerInfo.primaryPos}</Label>
                  <Select value={activeRole.id} onValueChange={(v) => {
                    const role = TACTICAL_ROLES.find(r => r.id === v);
                    if (role) setActiveRole({ ...role, kpis: localizedKPIs });
                  }}>
                    <SelectTrigger className="h-10 bg-secondary/10 border-border/20 font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1b263b] border-border/20">
                      {TACTICAL_ROLES.map(r => <SelectItem key={r.id} value={r.id}>{t.report.tacticalRoles[r.id as keyof typeof t.report.tacticalRoles] || r.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground">{t.report.playerInfo.matchDate}</Label>
                  <Input type="date" value={matchDate} onChange={(e) => setMatchDate(e.target.value)} className="h-10 bg-secondary/10 border-border/20 font-bold" />
                </div>
              </CardContent>
            </Card>
            <Card className="lg:col-span-4 border-border/40 bg-card/40 rounded-2xl overflow-hidden">
              <div className="bg-[#1b263b] px-6 py-4 border-b border-primary/20">
                <h2 className="text-[10px] font-black text-white uppercase tracking-widest">{t.report.pitch.title}</h2>
              </div>
              <CardContent className="p-4">
                <TacticalCanvas marker={pitchMarker} onMarkerChange={setPitchMarker} heatmapPoints={heatmapPoints} onHeatmapChange={setHeatmapPoints} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="technical" className="animate-in fade-in">
          <EvaluationModule t={t} icon={Shield} kpiSection={activeRole.kpis.technical} nextTab="tactical" prevTab="player" tabType="technical" ratings={ratings} onRatingChange={handleRatingChange} notes={notes} onNoteChange={handleNoteChange} setActiveTab={setActiveTab} />
        </TabsContent>
        
        <TabsContent value="analytics" className="animate-in fade-in space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="p-10 border-2 border-primary/30 bg-[#1b263b]/60 rounded-[2.5rem] flex flex-col items-center justify-between text-center">
              <Brain className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-sm font-black uppercase tracking-[0.2em]">{t.report.pim.title}</h3>
              <div className="text-8xl font-black text-primary my-6">{ratings['pim'] || "0"}</div>
              <Button onClick={handleCalculatePIM} disabled={isCalculatingPIM} className="w-full h-12 bg-primary font-black uppercase text-[10px] rounded-xl">
                {isCalculatingPIM ? <Loader2 className="h-5 w-5 animate-spin" /> : t.report.pim.calculate}
              </Button>
            </Card>
            <Card className="p-10 border-2 border-accent/30 bg-[#1b263b]/60 rounded-[2.5rem] flex flex-col items-center justify-between text-center">
              <Sparkles className="h-12 w-12 text-accent mb-4" />
              <h3 className="text-sm font-black uppercase tracking-[0.2em]">{t.report.summary.title}</h3>
              <div className="text-xs italic text-muted-foreground text-left p-4 bg-background/40 rounded-xl my-6 line-clamp-6">{notes['summary'] || t.report.summary.placeholder}</div>
              <Button variant="secondary" onClick={handleGenerateSummary} disabled={isGeneratingSummary} className="w-full h-12 font-black uppercase text-[10px] rounded-xl">
                {isGeneratingSummary ? <Loader2 className="h-5 w-5 animate-spin" /> : t.report.summary.generate}
              </Button>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}