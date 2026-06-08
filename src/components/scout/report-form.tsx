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
  FileText, ChevronRight, Activity, User, Target, Shield, 
  Zap as ZapIcon, Save, Star, Loader2, Brain, Sparkles, 
  Sun, Cloud, CloudRain, Thermometer, Wind, LayoutGrid, ClipboardCheck, Plus, Trash2,
  CheckCircle2, AlertTriangle, Info, Calendar as CalendarIcon
} from "lucide-react";
import { TACTICAL_ROLES, getLocalizedKPIs, type KPISection, type UserProfile, type Point, type ScoutingAction, type TacticalRoleConfig } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from '@/lib/i18n/context';
import { cn } from "@/lib/utils";
import { savePlayer, saveReport, getPlayer, getLatestReportForPlayer } from "@/lib/services/db-service";
import { auth } from "@/lib/firebase/config";
import { ALL_COUNTRIES } from "@/lib/data/countries";
import { calculatePlayerImpactMetric } from "@/ai/flows/calculate-player-impact-metric-flow";
import { generateExecutiveSummary } from "@/ai/flows/generate-executive-summary";

const RatingRow = ({ kpi, rating, onRatingChange, note, onNoteChange }: { kpi: string, rating?: number, onRatingChange: (v: number) => void, note?: string, onNoteChange?: (v: string) => void }) => (
  <div className="flex flex-col sm:flex-row sm:items-center py-4 border-b border-border/10 last:border-0 px-4 w-full gap-4 hover:bg-white/5 transition-colors">
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
              rating === num 
                ? "bg-primary text-primary-foreground border-primary shadow-md scale-110" 
                : "bg-white/5 hover:border-primary/50 text-muted-foreground"
            )}
          >
            {num}
          </button>
        ))}
      </div>
      {onNoteChange && (
        <Input 
          className="h-8 text-[9px] bg-secondary/10 border-none rounded-md italic" 
          placeholder="Nota..." 
          value={note || ""} 
          onChange={(e) => onNoteChange(e.target.value)} 
        />
      )}
    </div>
  </div>
);

const ChipGroup = ({ label, options, selected, onSelect, t, multi = false, icons = {} }: { label: string, options: string[], selected: string | string[], onSelect: (v: string) => void, t: any, multi?: boolean, icons?: Record<string, any> }) => {
  const isSelected = (opt: string) => multi ? (selected as string[]).includes(opt) : selected === opt;
  
  return (
    <div className="space-y-2">
      {label && <Label className="text-[10px] font-black uppercase text-muted-foreground">{label}</Label>}
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const Icon = icons[opt];
          const labelText = t.report.contextTab[opt as keyof typeof t.report.contextTab] || 
                           t.report.evaluationTab.options[opt as keyof typeof t.report.evaluationTab.options] ||
                           opt;

          return (
            <button
              key={opt}
              type="button"
              onClick={() => onSelect(opt)}
              className={cn(
                "px-4 py-2 rounded-full border text-[10px] font-bold transition-all flex items-center gap-2",
                isSelected(opt) 
                  ? "bg-secondary text-foreground border-primary shadow-lg" 
                  : "bg-white/5 border-border/40 text-muted-foreground hover:bg-white/10"
              )}
            >
              {Icon && <Icon className="h-3 w-3" />}
              {labelText}
            </button>
          );
        })}
      </div>
    </div>
  );
};

const EvaluationModule = ({ icon: Icon, kpiSection, nextTab, prevTab, tabType, ratings, onRatingChange, notes, onNoteChange, setActiveTab, t }: { icon: any, kpiSection: KPISection, nextTab: string, prevTab: string, tabType: string, ratings: Record<string, number>, onRatingChange: (k: string, v: number) => void, notes: Record<string, string>, onNoteChange: (k: string, v: string) => void, setActiveTab: (t: string) => void, t: any }) => (
  <div className="space-y-6">
    <div className={cn("grid grid-cols-1 gap-8", kpiSection.impact.length > 0 ? "lg:grid-cols-2" : "")}>
      <Card className="border-border/40 shadow-xl overflow-hidden rounded-2xl bg-card/40 backdrop-blur-md">
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

      {kpiSection.impact.length > 0 && (
        <Card className="border-border/40 shadow-xl overflow-hidden rounded-2xl bg-card/40 backdrop-blur-md">
          <div className="bg-[#1b263b] px-6 py-4 flex items-center gap-3 border-b border-primary/20">
            <ZapIcon className="h-5 w-5 text-primary" />
            <h2 className="text-[10px] font-black text-white uppercase tracking-widest">{t.report.sections[`${tabType}_imp`]}</h2>
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
    
    <div className="flex justify-between gap-4 pt-10">
      <Button type="button" variant="ghost" onClick={() => setActiveTab(prevTab)} className="h-12 px-8 font-black text-[11px] uppercase text-muted-foreground">← {t.report.tabs[prevTab as keyof typeof t.report.tabs]}</Button>
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

  // Player Info Fields
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

  // Context Fields
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

  // Evaluation Fields
  const [strengths, setStrengths] = useState<string[]>(['', '', '', '']);
  const [weaknesses, setWeaknesses] = useState<string[]>(['', '', '', '']);
  const [shortTerm, setShortTerm] = useState("");
  const [longTerm, setLongTerm] = useState("");
  const [overallDescription, setOverallDescription] = useState("");
  const [comparativePlayer, setComparativePlayer] = useState("");
  const [finalRecommendation, setFinalRecommendation] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [fitsModel, setFitsModel] = useState("");
  const [immediateImpact, setImmediateImpact] = useState("");
  const [futurePotential, setFuturePotential] = useState("");
  const [adaptationRisk, setAdaptationRisk] = useState("");
  const [fitsPhilosophy, setFitsPhilosophy] = useState("");
  const [finalScoutRating, setFinalScoutRating] = useState<number>(0);
  const [nextSteps, setNextSteps] = useState<string[]>([]);
  const [scoutingCommittee, setScoutingCommittee] = useState("");
  const [decisionDate, setDecisionDate] = useState("");

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
          setMinPlayed(r.minPlayed || "90"); setPhysicalCondition(r.physicalCondition || "");
          setScoutName(r.scoutName || ""); setObservedFunctions(r.observedFunctions || []);
          setMatchStyle(r.matchStyle || ""); setMatchSystem(r.matchSystem || "");
          setMatchPace(r.matchPace || ""); setTeamDominance(r.teamDominance || "");
          setObservingScore(r.observingScore || ""); setMatchImportance(r.matchImportance || "");
          setWeather(r.weather || ""); setOffBallTraits(r.offBallTraits || []);
          setBodyLanguageTraits(r.bodyLanguageTraits || []); setSpecificMatchRole(r.specificMatchRole || "");
          if (r.pitchPosition) setPitchMarker(r.pitchPosition);
          if (r.heatmapPoints) setHeatmapPoints(r.heatmapPoints);
          
          if (r.strengths) setStrengths(r.strengths);
          if (r.weaknesses) setWeaknesses(r.weaknesses);
          setShortTerm(r.shortTerm || "");
          setLongTerm(r.longTerm || "");
          setOverallDescription(r.overallDescription || "");
          setComparativePlayer(r.comparativePlayer || "");
          setFinalRecommendation(r.finalRecommendation || "");
          setAdditionalNotes(r.additionalNotes || "");
          setFitsModel(r.fitsModel || "");
          setImmediateImpact(r.immediateImpact || "");
          setFuturePotential(r.futurePotential || "");
          setAdaptationRisk(r.adaptationRisk || "");
          setFitsPhilosophy(r.fitsPhilosophy || "");
          setFinalScoutRating(r.finalScoutRating || 0);
          setNextSteps(r.nextSteps || []);
          setScoutingCommittee(r.scoutingCommittee || "");
          setDecisionDate(r.decisionDate || "");
        }
      });
    }
  }, [editingPlayerId, localizedKPIs]);

  const handleRatingChange = (kpi: string, value: number) => setRatings(prev => ({ ...prev, [kpi]: value }));
  const handleNoteChange = (kpi: string, value: string) => setNotes(prev => ({ ...prev, [kpi]: value }));

  const toggleObservedFunction = (func: string) => {
    setObservedFunctions(prev => 
      prev.includes(func) ? prev.filter(f => f !== func) : [...prev, func]
    );
  };

  const toggleOffBallTrait = (trait: string) => {
    setOffBallTraits(prev => 
      prev.includes(trait) ? prev.filter(t => t !== trait) : [...prev, trait]
    );
  };

  const toggleBodyLanguageTrait = (trait: string) => {
    setBodyLanguageTraits(prev => 
      prev.includes(trait) ? prev.filter(t => t !== trait) : [...prev, trait]
    );
  };

  const addAction = () => {
    setScoutingActions([...scoutingActions, { minute: '', action: '', result: '', notes: '' }]);
  };

  const updateAction = (index: number, field: keyof ScoutingAction, value: string) => {
    const newActions = [...scoutingActions];
    newActions[index] = { ...newActions[index], [field]: value };
    setScoutingActions(newActions);
  };

  const removeAction = (index: number) => {
    setScoutingActions(scoutingActions.filter((_, i) => i !== index));
  };

  const toggleNextStep = (step: string) => {
    setNextSteps(prev => prev.includes(step) ? prev.filter(s => s !== step) : [...prev, step]);
  };

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

    const finalReportId = saveReport({
      playerId,
      playerName,
      scoutId: scoutId,
      scoutName: scoutName || userProfile?.displayName || "Scout",
      pimScore: ratings['pim'] || 0,
      summary: notes['summary'] || "",
      ratings, notes, actions: scoutingActions,
      dorsal, rivalName, competition, matchDate, minPlayed, physicalCondition,
      pitchPosition: pitchMarker, heatmapPoints,
      observedFunctions: observedFunctions,
      matchStyle, matchSystem, matchPace, teamDominance, observingScore, matchImportance, weather,
      offBallTraits, bodyLanguageTraits, specificMatchRole,
      strengths, weaknesses, shortTerm, longTerm, overallDescription, comparativePlayer,
      finalRecommendation, additionalNotes, fitsModel, immediateImpact, futurePotential,
      adaptationRisk, fitsPhilosophy, finalScoutRating, nextSteps, scoutingCommittee, decisionDate
    }, reportId || undefined);

    if (!reportId) {
      setReportId(finalReportId);
    }

    toast({ title: "Base de Datos Actualizada", description: "Datos guardados con éxito." });
  };

  const handleCalculatePIM = async () => {
    if (Object.keys(ratings).length === 0) {
      toast({ variant: "destructive", title: "Datos insuficientes", description: "Por favor, valora algunos atributos antes de calcular el PIM." });
      return;
    }

    setIsCalculatingPIM(true);
    try {
      const getMetricsArray = (list: string[]) => 
        list.map(name => ({ name, value: ratings[name] || 0 }));

      const result = await calculatePlayerImpactMetric({
        playerInfo: {
          name: playerName,
          tacticalRole: activeRole.name,
          minPlayed,
          physicalCondition,
          dominantFoot,
        },
        matchContext: {
          matchStyle,
          matchTempo: matchPace,
          teamDominance,
          score: observingScore,
          matchImportance,
          weather,
        },
        technicalMetrics: getMetricsArray([...activeRole.kpis.technical.observation, ...activeRole.kpis.technical.impact]),
        tacticalMetrics: getMetricsArray([...activeRole.kpis.tactical.observation, ...activeRole.kpis.tactical.impact]),
        physicalMetrics: getMetricsArray([...activeRole.kpis.physical.observation, ...activeRole.kpis.physical.impact]),
        mentalMetrics: getMetricsArray([...activeRole.kpis.mental.observation, ...activeRole.kpis.mental.impact]),
        generalProfile: {
          technicalLevel: ratings['Nivel técnico'] || 0,
          tacticalIntelligence: ratings['Inteligencia táctica'] || 0,
          physicalQuality: ratings['Calidad física'] || 0,
          mentalStrength: ratings['Fortaleza mental'] || 0,
          competitiveLevel: ratings['Nivel competitivo'] || 0,
          potential: ratings['Potencial'] || 0,
          currentLevel: ratings['Nivel actual'] || 0,
        },
        language: 'es'
      });

      if (result) {
        const clampedPim = Math.max(0, Math.min(100, Math.round(result.playerImpactMetric)));
        handleRatingChange('pim', clampedPim);
        handleNoteChange('pim_explanation', result.explanation);
        toast({ title: "Cálculo Finalizado", description: "Métrica PIM actualizada (Máx: 100)." });
      }
    } catch (e: any) {
      console.error("AI Error (PIM):", e);
      toast({ variant: "destructive", title: "Error IA", description: "No se pudo calcular el PIM." });
    } finally { setIsCalculatingPIM(false); }
  };

  const handleGenerateSummary = async () => {
    setIsGeneratingSummary(true);
    try {
      const result = await generateExecutiveSummary({
        playerName: playerName || "Prospecto",
        tacticalRole: activeRole.name,
        metrics: ratings,
        scoutNotes: JSON.stringify({ notes, strengths, weaknesses, overallDescription }),
        language: 'es'
      });
      handleNoteChange('summary', result.summary);
      toast({ title: "Resumen Generado", description: "El informe ha sido sintetizado con éxito." });
    } catch (e) {
      console.error("AI Error (Summary):", e);
      toast({ variant: "destructive", title: "Error IA", description: "Fallo al generar el resumen ejecutivo." });
    } finally { setIsGeneratingSummary(false); }
  };

  const weatherIcons = { sun: Sun, cloudy: Cloud, rain: CloudRain, cold: Thermometer, wind: Wind };

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
        <Button onClick={handleSaveAll} className="bg-primary text-primary-foreground font-black text-xs uppercase tracking-widest h-12 px-8 rounded-xl shadow-lg hover:scale-105 transition-all">
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
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-8">
              <Card className="border-border/40 bg-card/40 rounded-2xl overflow-hidden shadow-xl">
                <div className="bg-[#1b263b] px-6 py-4 flex items-center gap-3 border-b border-primary/20">
                  <User className="h-5 w-5 text-primary" />
                  <h2 className="text-[10px] font-black text-white uppercase tracking-widest">{t.report.playerInfo.title}</h2>
                </div>
                <CardContent className="p-8 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6">
                    <div className="lg:col-span-9 space-y-1.5">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground">{t.report.playerInfo.name}</Label>
                      <Input value={playerName} onChange={(e) => setPlayerName(e.target.value)} className="h-10 bg-secondary/10 border-border/20 font-bold" placeholder="Nombre del jugador" />
                    </div>
                    <div className="lg:col-span-3 space-y-1.5">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground">{t.report.playerInfo.dorsal}</Label>
                      <Input value={dorsal} onChange={(e) => setDorsal(e.target.value)} className="h-10 bg-secondary/10 border-border/20 font-bold text-center" placeholder="-" />
                    </div>
                    <div className="lg:col-span-6 space-y-1.5">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground">{t.report.playerInfo.club}</Label>
                      <Input value={clubName} onChange={(e) => setClubName(e.target.value)} className="h-10 bg-secondary/10 border-border/20 font-bold" placeholder="Club" />
                    </div>
                    <div className="lg:col-span-6 space-y-1.5">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground">{t.report.playerInfo.rival}</Label>
                      <Input value={rivalName} onChange={(e) => setRivalName(e.target.value)} className="h-10 bg-secondary/10 border-border/20 font-bold" placeholder="vs" />
                    </div>
                    <div className="lg:col-span-6 space-y-1.5">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground">{t.report.playerInfo.competition}</Label>
                      <Input value={competition} onChange={(e) => setCompetition(e.target.value)} className="h-10 bg-secondary/10 border-border/20 font-bold" placeholder="Liga / Copa" />
                    </div>
                    <div className="lg:col-span-6 space-y-1.5">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground">{t.report.playerInfo.matchDate}</Label>
                      <Input type="date" value={matchDate} onChange={(e) => setMatchDate(e.target.value)} className="h-10 bg-secondary/10 border-border/20 font-bold" />
                    </div>
                    <div className="lg:col-span-6 space-y-1.5">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground">{t.report.playerInfo.birthDate}</Label>
                      <Input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} className="h-10 bg-secondary/10 border-border/20 font-bold" />
                    </div>
                    <div className="lg:col-span-6 space-y-1.5">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground">{t.report.playerInfo.nationality}</Label>
                      <Select value={nationality} onValueChange={setNationality}>
                        <SelectTrigger className="h-10 bg-secondary/10 border-border/20 font-bold">
                          <SelectValue placeholder="-" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px] bg-[#1b263b] border-border/20">
                          {ALL_COUNTRIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="lg:col-span-4 space-y-1.5">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground">{t.report.playerInfo.height}</Label>
                      <Input value={height} onChange={(e) => setHeight(e.target.value)} className="h-10 bg-secondary/10 border-border/20 font-bold text-center" placeholder="-" />
                    </div>
                    <div className="lg:col-span-4 space-y-1.5">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground">{t.report.playerInfo.weight}</Label>
                      <Input value={weight} onChange={(e) => setWeight(e.target.value)} className="h-10 bg-secondary/10 border-border/20 font-bold text-center" placeholder="-" />
                    </div>
                    <div className="lg:col-span-4 space-y-1.5">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground">{t.report.playerInfo.minPlayed}</Label>
                      <Input value={minPlayed} onChange={(e) => setMinPlayed(e.target.value)} className="h-10 bg-secondary/10 border-border/20 font-bold text-center" placeholder="90" />
                    </div>
                    <div className="lg:col-span-6 space-y-1.5">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground">{t.report.playerInfo.primaryPos}</Label>
                      <Select value={activeRole.id} onValueChange={(v) => {
                        const role = TACTICAL_ROLES.find(r => r.id === v);
                        if (role) setActiveRole({ ...role, kpis: localizedKPIs });
                      }}>
                        <SelectTrigger className="h-10 bg-secondary/10 border-border/20 font-bold">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1b263b] border-border/20">
                          {TACTICAL_ROLES.map(r => (
                            <SelectItem key={r.id} value={r.id}>
                              {t.report.tacticalRoles[r.id as keyof typeof t.report.tacticalRoles] || r.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="lg:col-span-6 space-y-1.5">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground">{t.report.playerInfo.secondaryPos}</Label>
                      <Input value={secondaryPositions} onChange={(e) => setSecondaryPositions(e.target.value)} className="h-10 bg-secondary/10 border-border/20 font-bold" placeholder="Ej: ED, MCO" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/40 bg-card/40 rounded-2xl overflow-hidden shadow-xl">
                <div className="bg-[#1b263b] px-6 py-4 flex items-center gap-3 border-b border-primary/20">
                  <LayoutGrid className="h-5 w-5 text-primary" />
                  <h2 className="text-[10px] font-black text-white uppercase tracking-widest">{t.report.generalProfile.title}</h2>
                </div>
                <CardContent className="p-0">
                  {t.report.generalProfile.attributes.map((attr: string) => (
                    <RatingRow 
                      key={attr} 
                      kpi={attr} 
                      rating={ratings[attr]} 
                      onRatingChange={(v) => handleRatingChange(attr, v)} 
                      note={notes[attr]} 
                      onNoteChange={(v) => handleNoteChange(attr, v)} 
                    />
                  ))}
                </CardContent>
              </Card>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground">{t.report.playerInfo.dominantFoot}</Label>
                  <ChipGroup label="" options={['right', 'left', 'both']} selected={dominantFoot} onSelect={setDominantFoot} t={t} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground">{t.report.playerInfo.physicalCondition}</Label>
                  <ChipGroup label="" options={['excellent', 'good', 'normal', 'low', 'injured']} selected={physicalCondition} onSelect={setPhysicalCondition} t={t} />
                </div>
              </div>
            </div>
            
            <div className="lg:col-span-4 space-y-8">
              <Card className="border-border/40 bg-card/40 rounded-2xl overflow-hidden shadow-xl sticky top-24">
                <div className="bg-[#1b263b] px-6 py-4 border-b border-primary/20">
                  <h2 className="text-[10px] font-black text-white uppercase tracking-widest">{t.report.pitch.title}</h2>
                </div>
                <CardContent className="p-4">
                  <TacticalCanvas marker={pitchMarker} onMarkerChange={setPitchMarker} heatmapPoints={heatmapPoints} onHeatmapChange={setHeatmapPoints} />
                </CardContent>
              </Card>

              <Card className="border-border/40 bg-card/40 rounded-2xl overflow-hidden shadow-xl">
                <div className="bg-[#1b263b] px-6 py-4 border-b border-primary/20">
                  <h2 className="text-[10px] font-black text-white uppercase tracking-widest">{t.report.observedFunctions.title}</h2>
                </div>
                <CardContent className="p-6">
                  <ChipGroup 
                    label="" 
                    options={Object.keys(t.report.observedFunctions).filter(k => k !== 'title')} 
                    selected={observedFunctions} 
                    onSelect={toggleObservedFunction} 
                    t={{ report: { contextTab: t.report.observedFunctions, evaluationTab: { options: {} } } }}
                    multi={true}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
          <div className="flex justify-end gap-4 pt-10">
            <Button type="button" onClick={() => setActiveTab("context")} className="h-12 px-12 bg-primary text-primary-foreground font-black rounded-xl text-[12px] uppercase tracking-widest">{t.report.actions.next} <ChevronRight className="ml-2 h-4 w-4" /></Button>
          </div>
        </TabsContent>

        <TabsContent value="context" className="space-y-8 animate-in fade-in">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="border-border/40 bg-card/40 rounded-2xl overflow-hidden shadow-xl">
              <div className="bg-[#1b263b] px-6 py-4 flex items-center gap-3 border-b border-primary/20">
                <ClipboardCheck className="h-5 w-5 text-primary" />
                <h2 className="text-[10px] font-black text-white uppercase tracking-widest">{t.report.contextTab.matchContextTitle}</h2>
              </div>
              <CardContent className="p-8 space-y-6">
                <ChipGroup label={t.report.contextTab.gameStyle} options={['possession', 'counter', 'highPress', 'direct', 'defensive']} selected={matchStyle} onSelect={setMatchStyle} t={t} />
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground">{t.report.contextTab.system}</Label>
                  <Input value={matchSystem} onChange={(e) => setMatchSystem(e.target.value)} className="h-10 bg-secondary/10 border-border/20 font-bold" placeholder="Ej: 4-3-3, 4-2-3-1" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <ChipGroup label={t.report.contextTab.pace} options={['low', 'medium', 'high']} selected={matchPace} onSelect={setMatchPace} t={t} />
                  <ChipGroup label={t.report.contextTab.teamDominance} options={['dominant', 'balanced', 'disadvantage']} selected={teamDominance} onSelect={setTeamDominance} t={t} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <ChipGroup label={t.report.contextTab.scoreAtObserving} options={['winning', 'drawing', 'losing']} selected={observingScore} onSelect={setObservingScore} t={t} />
                  <ChipGroup label={t.report.contextTab.importance} options={['low', 'medium', 'high', 'decisive']} selected={matchImportance} onSelect={setMatchImportance} t={t} />
                </div>
                <ChipGroup label={t.report.contextTab.weather} options={['sun', 'cloudy', 'rain', 'cold', 'wind']} selected={weather} onSelect={setWeather} t={t} icons={weatherIcons} />
              </CardContent>
            </Card>
            <Card className="border-border/40 bg-card/40 rounded-2xl overflow-hidden shadow-xl">
              <div className="bg-[#0f172a] px-6 py-4 flex items-center gap-3 border-b border-primary/20">
                <Brain className="h-5 w-5 text-accent" />
                <h2 className="text-[10px] font-black text-white uppercase tracking-widest">{t.report.contextTab.offBallBehaviorTitle}</h2>
              </div>
              <CardContent className="p-8 space-y-8">
                <ChipGroup label={t.report.contextTab.noPossession} options={['aggressive', 'central', 'lines', 'recovery', 'block', 'support', 'reading', 'shape']} selected={offBallTraits} onSelect={(v) => toggleOffBallTrait(v)} multi={true} t={t} />
                <ChipGroup label={t.report.contextTab.bodyLanguage} options={['positive', 'competitive', 'focused', 'frustrated', 'emotional', 'reactive', 'mature', 'indifferent']} selected={bodyLanguageTraits} onSelect={(v) => toggleBodyLanguageTrait(v)} multi={true} t={t} />
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground">{t.report.contextTab.matchRole}</Label>
                  <Textarea value={specificMatchRole} onChange={(e) => setSpecificMatchRole(e.target.value)} className="min-h-[100px] bg-secondary/10 border-border/20 text-xs italic" placeholder={t.report.contextTab.matchRolePlaceholder} />
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="flex justify-between gap-4 pt-10">
            <Button type="button" variant="ghost" onClick={() => setActiveTab("player")} className="h-12 px-8 font-black text-[11px] uppercase text-muted-foreground">← {t.report.tabs.player}</Button>
            <Button type="button" onClick={() => setActiveTab("technical")} className="h-12 px-12 bg-primary text-primary-foreground font-black rounded-xl text-[12px] uppercase tracking-widest">{t.report.tabs.technical} →</Button>
          </div>
        </TabsContent>

        <TabsContent value="technical" className="animate-in fade-in">
          <EvaluationModule t={t} icon={Shield} kpiSection={activeRole.kpis.technical} nextTab="tactical" prevTab="context" tabType="technical" ratings={ratings} onRatingChange={handleRatingChange} notes={notes} onNoteChange={handleNoteChange} setActiveTab={setActiveTab} />
        </TabsContent>

        <TabsContent value="tactical" className="animate-in fade-in">
          <EvaluationModule t={t} icon={Target} kpiSection={activeRole.kpis.tactical} nextTab="physical" prevTab="technical" tabType="tactical" ratings={ratings} onRatingChange={handleRatingChange} notes={notes} onNoteChange={handleNoteChange} setActiveTab={setActiveTab} />
        </TabsContent>

        <TabsContent value="physical" className="animate-in fade-in">
          <EvaluationModule t={t} icon={Activity} kpiSection={activeRole.kpis.physical} nextTab="mental" prevTab="tactical" tabType="physical" ratings={ratings} onRatingChange={handleRatingChange} notes={notes} onNoteChange={handleNoteChange} setActiveTab={setActiveTab} />
        </TabsContent>

        <TabsContent value="mental" className="animate-in fade-in">
          <EvaluationModule t={t} icon={Brain} kpiSection={activeRole.kpis.mental} nextTab="actions" prevTab="physical" tabType="mental" ratings={ratings} onRatingChange={handleRatingChange} notes={notes} onNoteChange={handleNoteChange} setActiveTab={setActiveTab} />
        </TabsContent>

        <TabsContent value="actions" className="animate-in fade-in space-y-6">
          <Card className="border-border/40 shadow-xl overflow-hidden rounded-2xl bg-card/40 backdrop-blur-md">
            <div className="bg-[#1b263b] px-6 py-4 flex items-center gap-3 border-b border-primary/20">
              <Star className="h-5 w-5 text-primary fill-primary" />
              <h2 className="text-[10px] font-black text-white uppercase tracking-widest">{t.report.actionsTab.title}</h2>
            </div>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="bg-[#1b263b]/50 border-b border-border/10">
                      <th className="px-4 py-3 text-[10px] font-black uppercase text-muted-foreground w-20">{t.report.actionsTab.min}</th>
                      <th className="px-4 py-3 text-[10px] font-black uppercase text-muted-foreground">{t.report.actionsTab.action}</th>
                      <th className="px-4 py-3 text-[10px] font-black uppercase text-muted-foreground">{t.report.actionsTab.result}</th>
                      <th className="px-4 py-3 text-[10px] font-black uppercase text-muted-foreground">{t.report.actionsTab.notes}</th>
                      <th className="px-4 py-3 text-[10px] font-black uppercase text-muted-foreground w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/10">
                    {scoutingActions.map((action, idx) => (
                      <tr key={idx} className="hover:bg-white/5 transition-colors">
                        <td className="px-2 py-2"><Input value={action.minute} onChange={(e) => updateAction(idx, 'minute', e.target.value)} className="h-9 bg-secondary/10 border-none text-[11px] font-bold text-center" /></td>
                        <td className="px-2 py-2"><Input value={action.action} onChange={(e) => updateAction(idx, 'action', e.target.value)} className="h-9 bg-secondary/10 border-none text-[11px] font-bold" /></td>
                        <td className="px-2 py-2"><Input value={action.result} onChange={(e) => updateAction(idx, 'result', e.target.value)} className="h-9 bg-secondary/10 border-none text-[11px] font-bold" /></td>
                        <td className="px-2 py-2"><Input value={action.notes} onChange={(e) => updateAction(idx, 'notes', e.target.value)} className="h-9 bg-secondary/10 border-none text-[11px] italic" /></td>
                        <td className="px-2 py-2"><Button variant="ghost" size="icon" onClick={() => removeAction(idx)} className="h-8 w-8 text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></Button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button type="button" onClick={addAction} className="w-full py-4 bg-secondary/20 hover:bg-secondary/30 text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center justify-center gap-2 border-t border-dashed border-border/20"><Plus className="h-3 w-3" /> {t.report.actionsTab.add}</button>
            </CardContent>
          </Card>
          <div className="flex justify-between gap-4 pt-10">
            <Button type="button" variant="ghost" onClick={() => setActiveTab("mental")} className="h-12 px-8 font-black text-[11px] uppercase text-muted-foreground">← {t.report.tabs.mental}</Button>
            <Button type="button" onClick={() => setActiveTab("evaluation")} className="h-12 px-12 bg-primary text-primary-foreground font-black rounded-xl text-[12px] uppercase tracking-widest">{t.report.tabs.evaluation} →</Button>
          </div>
        </TabsContent>

        <TabsContent value="evaluation" className="animate-in fade-in space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="border-border/40 bg-card/40 rounded-2xl overflow-hidden shadow-xl">
              <div className="bg-[#2e7d32] px-6 py-4 flex items-center gap-3 border-b border-primary/20">
                <CheckCircle2 className="h-5 w-5 text-white" />
                <h2 className="text-[10px] font-black text-white uppercase tracking-widest">{t.report.evaluationTab.strengthsTitle}</h2>
              </div>
              <CardContent className="p-8 space-y-6">
                <div className="space-y-4">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground">{t.report.evaluationTab.mainStrengths}</Label>
                  {strengths.map((s, i) => (
                    <Input key={i} value={s} onChange={(e) => { const n = [...strengths]; n[i] = e.target.value; setStrengths(n); }} className="h-10 bg-secondary/10 border-border/20 text-xs font-bold" placeholder={`${i+1}. Fortaleza...`} />
                  ))}
                </div>
                <div className="space-y-4">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground">{t.report.evaluationTab.areasToImprove}</Label>
                  {weaknesses.map((w, i) => (
                    <Input key={i} value={w} onChange={(e) => { const n = [...weaknesses]; n[i] = e.target.value; setWeaknesses(n); }} className="h-10 bg-secondary/10 border-border/20 text-xs font-bold" placeholder={`${i+1}. Área a mejorar...`} />
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground">{t.report.evaluationTab.shortTerm}</Label>
                    <Input value={shortTerm} onChange={(e) => setShortTerm(e.target.value)} className="h-10 bg-secondary/10 border-border/20 text-xs font-bold" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground">{t.report.evaluationTab.longTerm}</Label>
                    <Input value={longTerm} onChange={(e) => setLongTerm(e.target.value)} className="h-10 bg-secondary/10 border-border/20 text-xs font-bold" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/40 bg-card/40 rounded-2xl overflow-hidden shadow-xl">
              <div className="bg-[#00695c] px-6 py-4 flex items-center gap-3 border-b border-primary/20">
                <Sparkles className="h-5 w-5 text-white" />
                <h2 className="text-[10px] font-black text-white uppercase tracking-widest">{t.report.evaluationTab.recTitle}</h2>
              </div>
              <CardContent className="p-8 space-y-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground">{t.report.evaluationTab.playerDescription}</Label>
                  <Textarea value={overallDescription} onChange={(e) => setOverallDescription(e.target.value)} className="min-h-[100px] bg-secondary/10 border-border/20 text-xs" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground">{t.report.evaluationTab.comparative}</Label>
                  <Input value={comparativePlayer} onChange={(e) => setComparativePlayer(e.target.value)} className="h-10 bg-secondary/10 border-border/20 text-xs font-bold" />
                </div>
                <div className="space-y-4">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground">{t.report.evaluationTab.finalRec}</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button type="button" onClick={() => setFinalRecommendation('immediate')} className={cn("p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-1", finalRecommendation === 'immediate' ? "bg-green-600 border-green-400 shadow-lg scale-105" : "bg-green-900/20 border-green-800/40 opacity-60")}>
                      <span className="text-[10px] font-black text-white uppercase">{t.report.evaluationTab.recOptions.immediate}</span>
                      <span className="text-[8px] font-bold text-green-200">6 - ÉLITE</span>
                    </button>
                    <button type="button" onClick={() => setFinalRecommendation('scouting')} className={cn("p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-1", finalRecommendation === 'scouting' ? "bg-green-500 border-green-300 shadow-lg scale-105" : "bg-green-800/10 border-green-700/30 opacity-60")}>
                      <span className="text-[10px] font-black text-white uppercase">{t.report.evaluationTab.recOptions.scouting}</span>
                      <span className="text-[8px] font-bold text-green-100">4 - ALTO</span>
                    </button>
                    <button type="button" onClick={() => setFinalRecommendation('priority')} className={cn("p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-1", finalRecommendation === 'priority' ? "bg-orange-600 border-orange-400 shadow-lg scale-105" : "bg-orange-900/20 border-orange-800/40 opacity-60")}>
                      <span className="text-[10px] font-black text-white uppercase">{t.report.evaluationTab.recOptions.priority}</span>
                      <span className="text-[8px] font-bold text-orange-100">3 - BUENO</span>
                    </button>
                    <button type="button" onClick={() => setFinalRecommendation('reevaluate')} className={cn("p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-1 w-full sm:col-span-2", finalRecommendation === 'reevaluate' ? "bg-red-600 border-red-400 shadow-lg scale-105" : "bg-red-900/20 border-red-800/40 opacity-60")}>
                      <span className="text-[10px] font-black text-white uppercase">{t.report.evaluationTab.recOptions.reevaluate}</span>
                      <span className="text-[8px] font-bold text-red-100">2 - LIMITADO</span>
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground">{t.report.evaluationTab.additionalNotes}</Label>
                  <Textarea value={additionalNotes} onChange={(e) => setAdditionalNotes(e.target.value)} className="min-h-[80px] bg-secondary/10 border-border/20 text-xs italic" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/40 bg-card/40 rounded-2xl overflow-hidden shadow-xl">
              <div className="bg-[#00796b] px-6 py-4 flex items-center gap-3 border-b border-primary/20">
                <ClipboardCheck className="h-5 w-5 text-white" />
                <h2 className="text-[10px] font-black text-white uppercase tracking-widest">{t.report.evaluationTab.signingTitle}</h2>
              </div>
              <CardContent className="p-8 space-y-8">
                <ChipGroup label={t.report.evaluationTab.fitsModel} options={['si', 'no', 'maybe']} selected={fitsModel} onSelect={setFitsModel} t={t} />
                <ChipGroup label={t.report.evaluationTab.immediateImpact} options={['alto', 'medio', 'bajo']} selected={immediateImpact} onSelect={setImmediateImpact} t={t} />
                <ChipGroup label={t.report.evaluationTab.futurePotential} options={['elite', 'alto', 'medio', 'bajo']} selected={futurePotential} onSelect={setFuturePotential} t={t} />
                <ChipGroup label={t.report.evaluationTab.adaptationRisk} options={['alto', 'medio', 'bajo']} selected={adaptationRisk} onSelect={setAdaptationRisk} t={t} />
                <ChipGroup label={t.report.evaluationTab.fitsPhilosophy} options={['si', 'no']} selected={fitsPhilosophy} onSelect={setFitsPhilosophy} t={t} />
              </CardContent>
            </Card>

            <div className="space-y-8">
              <Card className="border-border/40 bg-card/40 rounded-2xl overflow-hidden shadow-xl">
                <div className="bg-[#d4af37] px-6 py-4 flex items-center gap-3 border-b border-primary/20">
                  <Star className="h-5 w-5 text-white" />
                  <h2 className="text-[10px] font-black text-white uppercase tracking-widest">{t.report.evaluationTab.finalRatingTitle}</h2>
                </div>
                <CardContent className="p-8">
                  <div className="flex justify-between items-center gap-2">
                    {[1, 2, 3, 4, 5].map((val) => (
                      <button key={val} type="button" onClick={() => setFinalScoutRating(val)} className={cn("flex-1 h-24 rounded-xl border-2 flex flex-col items-center justify-center transition-all", finalScoutRating === val ? "bg-primary border-white scale-110 shadow-xl" : "bg-white/5 border-border/20 opacity-50")}>
                        <span className="text-4xl font-black text-white">{val}</span>
                        <span className="text-[7px] font-black uppercase text-white/80 mt-1">{Object.values(t.report.evaluationTab.options)[val+2] as string}</span>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/40 bg-card/40 rounded-2xl overflow-hidden shadow-xl">
                <div className="bg-[#1a237e] px-6 py-4 flex items-center gap-3 border-b border-primary/20">
                  <Shield className="h-5 w-5 text-white" />
                  <h2 className="text-[10px] font-black text-white uppercase tracking-widest">{t.report.evaluationTab.decisionTitle}</h2>
                </div>
                <CardContent className="p-8 space-y-6">
                  <ChipGroup label={t.report.evaluationTab.nextSteps} options={['Informe completo', 'Análisis de vídeo', '2ª observación', 'Contactar referencias', 'Validación estadística', 'Revisión médica']} selected={nextSteps} onSelect={toggleNextStep} multi={true} t={t} />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground">{t.report.evaluationTab.committee}</Label>
                      <Input value={scoutingCommittee} onChange={(e) => setScoutingCommittee(e.target.value)} className="h-10 bg-secondary/10 border-border/20 text-xs" placeholder="Nombres..." />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground">{t.report.evaluationTab.decisionDate}</Label>
                      <Input type="date" value={decisionDate} onChange={(e) => setDecisionDate(e.target.value)} className="h-10 bg-secondary/10 border-border/20 text-xs" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
          <div className="flex justify-between gap-4 pt-10">
            <Button type="button" variant="ghost" onClick={() => setActiveTab("actions")} className="h-12 px-8 font-black text-[11px] uppercase text-muted-foreground">← {t.report.tabs.actions}</Button>
            <Button type="button" onClick={() => setActiveTab("analytics")} className="h-12 px-12 bg-primary text-primary-foreground font-black rounded-xl text-[12px] uppercase tracking-widest">{t.report.tabs.analytics} →</Button>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="animate-in fade-in space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="p-10 border-2 border-primary/30 bg-[#1b263b]/60 rounded-[2.5rem] flex flex-col items-center justify-between text-center">
              <Brain className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-sm font-black uppercase tracking-[0.2em]">{t.report.pim.title}</h3>
              <div className="text-8xl font-black text-primary my-6">{ratings['pim'] || "0"}</div>
              <Button onClick={handleCalculatePIM} disabled={isCalculatingPIM} className="w-full h-12 bg-primary font-black uppercase text-[10px] rounded-xl shadow-lg shadow-primary/20">
                {isCalculatingPIM ? <Loader2 className="h-5 w-5 animate-spin" /> : t.report.pim.calculate}
              </Button>
            </Card>
            <Card className="p-10 border-2 border-accent/30 bg-[#1b263b]/60 rounded-[2.5rem] flex flex-col items-center justify-between text-center">
              <Sparkles className="h-12 w-12 text-accent mb-4" />
              <h3 className="text-sm font-black uppercase tracking-[0.2em]">{t.report.summary.title}</h3>
              <div className="text-xs italic text-muted-foreground text-left p-4 bg-background/40 rounded-xl my-6 line-clamp-6 min-h-[120px]">{notes['summary'] || t.report.summary.placeholder}</div>
              <Button variant="secondary" onClick={handleGenerateSummary} disabled={isGeneratingSummary} className="w-full h-12 font-black uppercase text-[10px] rounded-xl shadow-lg shadow-accent/20">
                {isGeneratingSummary ? <Loader2 className="h-5 w-5 animate-spin" /> : t.report.summary.generate}
              </Button>
            </Card>
          </div>
          <div className="flex justify-start gap-4 pt-10">
            <Button type="button" variant="ghost" onClick={() => setActiveTab("evaluation")} className="h-12 px-8 font-black text-[11px] uppercase text-muted-foreground">← {t.report.tabs.evaluation}</Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
