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
      currentPIM: Math.round(ratings['pim'] || 0),
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
      pimScore: Math.round(ratings['pim'] || 0),
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
    const essentialKeys = ['Nivel técnico', 'Inteligencia táctica', 'Calidad física', 'Fortaleza mental'];
    const hasData = essentialKeys.some(key => (ratings[key] || 0) > 0);

    if (!hasData) {
      toast({ variant: "destructive", title: "Perfil Incompleto", description: "Por favor, valora al menos los atributos básicos del Perfil General antes de calcular." });
      return;
    }

    setIsCalculatingPIM(true);
    try {
      const getMetricsArray = (list: string[]) => 
        list.map(name => ({ name, value: ratings[name] || 0 }));

      const result = await calculatePlayerImpactMetric({
        playerName: playerName || "Prospecto",
        tacticalRole: activeRole.name,
        minPlayed: minPlayed || "90",
        physicalCondition: physicalCondition || "normal",
        dominantFoot: dominantFoot || "right",
        matchStyle: matchStyle || "possession",
        matchTempo: matchPace || "medium",
        teamDominance: teamDominance || "balanced",
        score: observingScore || "drawing",
        matchImportance: matchImportance || "medium",
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

      if (result && result.playerImpactMetric >= 0) {
        const finalPim = Math.max(0, Math.min(100, Math.round(result.playerImpactMetric)));
        handleRatingChange('pim', finalPim);
        handleNoteChange('pim_explanation', result.explanation);
        toast({ title: "Motor IA Sincronizado", description: `Nueva métrica PIM calculada: ${finalPim}` });
      }
    } catch (e: any) {
      console.error("AI Error (PIM):", e);
      toast({ variant: "destructive", title: "Fallo de Motor", description: "No se pudo establecer conexión con el motor de cálculo." });
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
      toast({ title: "Análisis Sintetizado", description: "El resumen ejecutivo ha sido generado por la IA." });
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
                  <Shield className="h-5 w-5 text-primary" />
                  <h2 className="text-[10px] font-black text-white uppercase tracking-widest">{t.report.generalProfile.title}</h2>
                </div>
                <CardContent className="p-0">
                  {t.report.generalProfile.attributes.map((attr: string) => (
                    <RatingRow 
                      key={attr} 
                      kpi={attr} 
                      rating={ratings[attr]} 
                      onRatingChange={(val) => handleRatingChange(attr, val)} 
                    />
                  ))}
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-4 space-y-8">
              <Card className="border-border/40 bg-card/40 rounded-2xl overflow-hidden shadow-xl sticky top-24">
                <div className="bg-[#1b263b] px-6 py-4 border-b border-primary/20">
                  <h2 className="text-[10px] font-black text-white uppercase tracking-widest">{t.report.pitch.title}</h2>
                </div>
                <CardContent className="p-4">
                  <TacticalCanvas 
                    marker={pitchMarker} 
                    onMarkerChange={setPitchMarker}
                    heatmapPoints={heatmapPoints}
                    onHeatmapChange={setHeatmapPoints}
                  />
                </CardContent>
              </Card>

              <Card className="border-border/40 bg-card/40 rounded-2xl overflow-hidden shadow-xl">
                <div className="bg-[#1b263b] px-6 py-4 border-b border-primary/20">
                  <h2 className="text-[10px] font-black text-white uppercase tracking-widest">{t.report.observedFunctions.title}</h2>
                </div>
                <CardContent className="p-6">
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(t.report.observedFunctions).filter(([k]) => k !== 'title').map(([k, v]) => (
                      <button
                        key={k}
                        type="button"
                        onClick={() => toggleObservedFunction(k)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg border text-[9px] font-bold transition-all",
                          observedFunctions.includes(k) 
                            ? "bg-primary text-primary-foreground border-primary" 
                            : "bg-white/5 border-border/40 text-muted-foreground hover:bg-white/10"
                        )}
                      >
                        {v as string}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
          <div className="flex justify-end gap-4 pt-10">
            <Button type="button" onClick={() => setActiveTab("context")} className="h-12 px-12 bg-primary text-primary-foreground font-black rounded-xl text-[12px] uppercase tracking-widest">{t.report.actions.next} <ChevronRight className="ml-2 h-4 w-4" /></Button>
          </div>
        </TabsContent>

        <TabsContent value="context" className="space-y-8 animate-in fade-in">
          <Card className="border-border/40 shadow-xl overflow-hidden rounded-2xl bg-card/40 backdrop-blur-md">
            <div className="bg-[#1b263b] px-6 py-4 flex items-center gap-3 border-b border-primary/20">
              <LayoutGrid className="h-5 w-5 text-primary" />
              <h2 className="text-[10px] font-black text-white uppercase tracking-widest">{t.report.contextTab.matchContextTitle}</h2>
            </div>
            <CardContent className="p-8 space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground">{t.report.contextTab.system}</Label>
                  <Input value={matchSystem} onChange={(e) => setMatchSystem(e.target.value)} className="h-12 bg-secondary/10 border-border/20 font-bold" placeholder="Ej: 4-3-3" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground">{t.report.contextTab.matchRole}</Label>
                  <Input value={specificMatchRole} onChange={(e) => setSpecificMatchRole(e.target.value)} className="h-12 bg-secondary/10 border-border/20 font-bold" placeholder="Ej: Pivote único" />
                </div>
                
                <ChipGroup label={t.report.contextTab.gameStyle} options={['possession', 'counter', 'highPress', 'direct', 'defensive']} selected={matchStyle} onSelect={setMatchStyle} t={t} />
                <ChipGroup label={t.report.contextTab.pace} options={['low', 'medium', 'high']} selected={matchPace} onSelect={setMatchPace} t={t} />
                <ChipGroup label={t.report.contextTab.teamDominance} options={['dominant', 'balanced', 'disadvantage']} selected={teamDominance} onSelect={setTeamDominance} t={t} />
                <ChipGroup label={t.report.contextTab.scoreAtObserving} options={['winning', 'drawing', 'losing']} selected={observingScore} onSelect={setObservingScore} t={t} />
                <ChipGroup label={t.report.contextTab.importance} options={['low', 'medium', 'high', 'decisive']} selected={matchImportance} onSelect={setMatchImportance} t={t} />
                <ChipGroup label={t.report.contextTab.weather} options={['sun', 'cloudy', 'rain', 'cold', 'wind']} selected={weather} onSelect={setWeather} t={t} icons={weatherIcons} />
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="border-border/40 shadow-xl overflow-hidden rounded-2xl bg-card/40 backdrop-blur-md">
              <div className="bg-[#1b263b] px-6 py-4 border-b border-primary/20">
                <h2 className="text-[10px] font-black text-white uppercase tracking-widest">{t.report.contextTab.offBallBehaviorTitle}</h2>
              </div>
              <CardContent className="p-6">
                <ChipGroup label="" options={['aggressive', 'central', 'lines', 'recovery', 'block', 'support', 'reading', 'shape']} selected={offBallTraits} onSelect={toggleOffBallTrait} t={t} multi />
              </CardContent>
            </Card>

            <Card className="border-border/40 shadow-xl overflow-hidden rounded-2xl bg-card/40 backdrop-blur-md">
              <div className="bg-[#1b263b] px-6 py-4 border-b border-primary/20">
                <h2 className="text-[10px] font-black text-white uppercase tracking-widest">{t.report.contextTab.bodyLanguage}</h2>
              </div>
              <CardContent className="p-6">
                <ChipGroup label="" options={['positive', 'competitive', 'focused', 'frustrated', 'emotional', 'reactive', 'mature', 'indifferent']} selected={bodyLanguageTraits} onSelect={toggleBodyLanguageTrait} t={t} multi />
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-between gap-4 pt-10">
            <Button type="button" variant="ghost" onClick={() => setActiveTab("player")} className="h-12 px-8 font-black text-[11px] uppercase text-muted-foreground">← {t.report.tabs.player}</Button>
            <Button type="button" onClick={() => setActiveTab("technical")} className="h-12 px-12 bg-primary text-primary-foreground font-black rounded-xl text-[12px] uppercase tracking-widest">{t.report.actions.next} <ChevronRight className="ml-2 h-4 w-4" /></Button>
          </div>
        </TabsContent>

        <TabsContent value="technical">
          <EvaluationModule icon={Activity} kpiSection={activeRole.kpis.technical} nextTab="tactical" prevTab="context" tabType="technical" ratings={ratings} onRatingChange={handleRatingChange} notes={notes} onNoteChange={handleNoteChange} setActiveTab={setActiveTab} t={t} />
        </TabsContent>

        <TabsContent value="tactical">
          <EvaluationModule icon={Target} kpiSection={activeRole.kpis.tactical} nextTab="physical" prevTab="technical" tabType="tactical" ratings={ratings} onRatingChange={handleRatingChange} notes={notes} onNoteChange={handleNoteChange} setActiveTab={setActiveTab} t={t} />
        </TabsContent>

        <TabsContent value="physical">
          <EvaluationModule icon={Activity} kpiSection={activeRole.kpis.physical} nextTab="mental" prevTab="tactical" tabType="physical" ratings={ratings} onRatingChange={handleRatingChange} notes={notes} onNoteChange={handleNoteChange} setActiveTab={setActiveTab} t={t} />
        </TabsContent>

        <TabsContent value="mental">
          <EvaluationModule icon={Shield} kpiSection={activeRole.kpis.mental} nextTab="actions" prevTab="physical" tabType="mental" ratings={ratings} onRatingChange={handleRatingChange} notes={notes} onNoteChange={handleNoteChange} setActiveTab={setActiveTab} t={t} />
        </TabsContent>

        <TabsContent value="actions" className="space-y-6 animate-in fade-in">
          <Card className="border-border/40 shadow-xl overflow-hidden rounded-2xl bg-card/40 backdrop-blur-md">
            <div className="bg-[#1b263b] px-6 py-4 flex items-center justify-between border-b border-primary/20">
              <div className="flex items-center gap-3">
                <ClipboardCheck className="h-5 w-5 text-primary" />
                <h2 className="text-[10px] font-black text-white uppercase tracking-widest">{t.report.actionsTab.title}</h2>
              </div>
              <Button onClick={addAction} size="sm" variant="outline" className="h-8 border-primary/30 text-primary font-black text-[9px] uppercase tracking-widest"><Plus className="h-3 w-3 mr-1" /> {t.report.actionsTab.add}</Button>
            </div>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-secondary/20 border-b border-border/10">
                      <th className="p-4 text-[9px] font-black uppercase text-muted-foreground w-20">{t.report.actionsTab.min}</th>
                      <th className="p-4 text-[9px] font-black uppercase text-muted-foreground w-1/4">{t.report.actionsTab.action}</th>
                      <th className="p-4 text-[9px] font-black uppercase text-muted-foreground w-1/4">{t.report.actionsTab.result}</th>
                      <th className="p-4 text-[9px] font-black uppercase text-muted-foreground">{t.report.actionsTab.notes}</th>
                      <th className="p-4 w-12"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/10">
                    {scoutingActions.map((action, idx) => (
                      <tr key={idx} className="hover:bg-white/5 transition-colors">
                        <td className="p-2"><Input value={action.minute} onChange={(e) => updateAction(idx, 'minute', e.target.value)} className="h-9 bg-transparent border-none font-bold text-center" placeholder="00'" /></td>
                        <td className="p-2"><Input value={action.action} onChange={(e) => updateAction(idx, 'action', e.target.value)} className="h-9 bg-transparent border-none font-bold" placeholder="Acción..." /></td>
                        <td className="p-2">
                           <Select value={action.result} onValueChange={(v) => updateAction(idx, 'result', v)}>
                              <SelectTrigger className="h-9 bg-transparent border-none font-bold">
                                 <SelectValue placeholder="-" />
                              </SelectTrigger>
                              <SelectContent className="bg-[#1b263b] border-border/20">
                                 <SelectItem value="positivo">Exitoso</SelectItem>
                                 <SelectItem value="neutro">Neutro</SelectItem>
                                 <SelectItem value="negativo">Fallido</SelectItem>
                              </SelectContent>
                           </Select>
                        </td>
                        <td className="p-2"><Input value={action.notes} onChange={(e) => updateAction(idx, 'notes', e.target.value)} className="h-9 bg-transparent border-none text-xs italic" placeholder="Notas adicionales..." /></td>
                        <td className="p-2"><Button onClick={() => removeAction(idx)} variant="ghost" size="icon" className="h-8 w-8 text-destructive/50 hover:text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></Button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {scoutingActions.length === 0 && (
                <div className="p-12 text-center opacity-30 italic text-xs uppercase tracking-widest">No hay acciones registradas todavía.</div>
              )}
            </CardContent>
          </Card>
          <div className="flex justify-between gap-4 pt-10">
            <Button type="button" variant="ghost" onClick={() => setActiveTab("mental")} className="h-12 px-8 font-black text-[11px] uppercase text-muted-foreground">← {t.report.tabs.mental}</Button>
            <Button type="button" onClick={() => setActiveTab("evaluation")} className="h-12 px-12 bg-primary text-primary-foreground font-black rounded-xl text-[12px] uppercase tracking-widest">{t.report.actions.next} <ChevronRight className="ml-2 h-4 w-4" /></Button>
          </div>
        </TabsContent>

        <TabsContent value="evaluation" className="space-y-8 animate-in fade-in">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="border-border/40 shadow-xl overflow-hidden rounded-2xl bg-card/40 backdrop-blur-md">
              <div className="bg-[#1b263b] px-6 py-4 flex items-center gap-3 border-b border-primary/20">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <h2 className="text-[10px] font-black text-white uppercase tracking-widest">{t.report.evaluationTab.mainStrengths}</h2>
              </div>
              <CardContent className="p-6 space-y-4">
                {strengths.map((s, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-[10px] font-black text-primary/40">{i+1}</span>
                    <Input value={s} onChange={(e) => {
                      const newS = [...strengths]; newS[i] = e.target.value; setStrengths(newS);
                    }} className="h-10 bg-secondary/10 border-none font-bold" placeholder="..." />
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-border/40 shadow-xl overflow-hidden rounded-2xl bg-card/40 backdrop-blur-md">
              <div className="bg-[#1b263b] px-6 py-4 flex items-center gap-3 border-b border-primary/20">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                <h2 className="text-[10px] font-black text-white uppercase tracking-widest">{t.report.evaluationTab.areasToImprove}</h2>
              </div>
              <CardContent className="p-6 space-y-4">
                {weaknesses.map((w, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-[10px] font-black text-primary/40">{i+1}</span>
                    <Input value={w} onChange={(e) => {
                      const newW = [...weaknesses]; newW[i] = e.target.value; setWeaknesses(newW);
                    }} className="h-10 bg-secondary/10 border-none font-bold" placeholder="..." />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <Card className="border-border/40 shadow-xl overflow-hidden rounded-2xl bg-card/40 backdrop-blur-md">
            <div className="bg-[#1b263b] px-6 py-4 border-b border-primary/20">
              <h2 className="text-[10px] font-black text-white uppercase tracking-widest">{t.report.evaluationTab.recTitle}</h2>
            </div>
            <CardContent className="p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-1.5">
                   <Label className="text-[10px] font-black uppercase text-muted-foreground">{t.report.evaluationTab.playerDescription}</Label>
                   <Textarea value={overallDescription} onChange={(e) => setOverallDescription(e.target.value)} className="min-h-[120px] bg-secondary/10 border-border/20 text-sm font-bold" />
                </div>
                <div className="space-y-1.5">
                   <Label className="text-[10px] font-black uppercase text-muted-foreground">{t.report.evaluationTab.comparative}</Label>
                   <Textarea value={comparativePlayer} onChange={(e) => setComparativePlayer(e.target.value)} className="min-h-[120px] bg-secondary/10 border-border/20 text-sm font-bold" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                 <div className="space-y-1.5">
                   <Label className="text-[10px] font-black uppercase text-muted-foreground">{t.report.evaluationTab.finalRec}</Label>
                   <Select value={finalRecommendation} onValueChange={setFinalRecommendation}>
                      <SelectTrigger className="h-12 bg-secondary/10 border-border/20 font-bold">
                        <SelectValue placeholder="-" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1b263b] border-border/20">
                        {Object.entries(t.report.evaluationTab.recOptions).map(([k,v]) => (
                          <SelectItem key={k} value={k}>{v as string}</SelectItem>
                        ))}
                      </SelectContent>
                   </Select>
                 </div>
                 <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground">{t.report.evaluationTab.finalRatingTitle}</Label>
                    <div className="flex gap-2 h-12 items-center px-4 bg-secondary/10 rounded-xl">
                      {[1,2,3,4,5].map(star => (
                        <button key={star} type="button" onClick={() => setFinalScoutRating(star)} className="focus:outline-none">
                          <Star className={cn("h-6 w-6 transition-all", star <= finalScoutRating ? "fill-primary text-primary scale-110" : "text-muted-foreground opacity-30 hover:opacity-50")} />
                        </button>
                      ))}
                    </div>
                 </div>
                 <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground">{t.report.evaluationTab.fitsPhilosophy}</Label>
                    <ChipGroup label="" options={['si', 'no', 'maybe']} selected={fitsPhilosophy} onSelect={setFitsPhilosophy} t={t} />
                 </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between gap-4 pt-10">
            <Button type="button" variant="ghost" onClick={() => setActiveTab("actions")} className="h-12 px-8 font-black text-[11px] uppercase text-muted-foreground">← {t.report.tabs.actions}</Button>
            <Button type="button" onClick={() => setActiveTab("analytics")} className="h-12 px-12 bg-accent text-accent-foreground font-black rounded-xl text-[12px] uppercase tracking-widest">{t.report.actions.next} <Sparkles className="ml-2 h-4 w-4" /></Button>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="animate-in fade-in space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="p-10 border-2 border-primary/30 bg-[#1b263b]/60 rounded-[2.5rem] flex flex-col items-center justify-between text-center">
              <Brain className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-sm font-black uppercase tracking-[0.2em]">{t.report.pim.title}</h3>
              <div className="text-8xl font-black text-primary my-6">{Math.round(ratings['pim'] || 0)}</div>
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
