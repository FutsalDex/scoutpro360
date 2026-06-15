
"use client"

import React, { useState, useEffect, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TacticalCanvas } from "./tactical-canvas";
import { 
  FileText, ChevronRight, Activity, User, Target, Shield, 
  Save, Star, LayoutGrid, ClipboardCheck, Plus, Trash2,
  CheckCircle2, AlertTriangle, Sun, Cloud, CloudRain, Thermometer, Wind,
  Brain, Sparkles, Database, Info, Loader2, TrendingUp, History
} from "lucide-react";
import { TACTICAL_ROLES, getLocalizedKPIs, type KPISection, type UserProfile, type Point, type ScoutingAction, type TacticalRoleConfig, type ScoutingReport } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from '@/lib/i18n/context';
import { cn } from "@/lib/utils";
import { savePlayer, saveReport, getPlayer, getReport, getLatestReportForPlayer, subscribeToPlayerReports } from "@/lib/services/db-service";
import { auth } from "@/lib/firebase/config";
import { ALL_COUNTRIES } from "@/lib/data/countries";
import { calculatePlayerImpactMetric } from "@/ai/flows/calculate-player-impact-metric-flow";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const RatingRow = ({ kpi, rating, onRatingChange, note, onNoteChange }: { kpi: string, rating?: number, onRatingChange: (v: number) => void, note?: string, onNoteChange?: (v: string) => void }) => (
  <div className="flex flex-col sm:flex-row sm:items-center py-4 border-b border-border/10 last:border-0 px-4 w-full gap-4 hover:bg-white/5 transition-colors">
    <Label className="text-[10px] font-black text-foreground uppercase tracking-wider w-full sm:w-1/3 truncate">{kpi}</Label>
    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-2/3">
      <div className="flex gap-1 shrink-0">
        {[1, 2, 3, 4, 5].map(num => (
          <button 
            key={num} 
            type="button" 
            onClick={() => onRatingChange(rating === num ? 0 : num)} 
            className={cn(
              "h-8 w-8 rounded-full border border-border/40 text-[9px] font-black flex items-center justify-center transition-all focus:outline-none", 
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
          const labelText = t.report?.contextTab?.[opt as keyof typeof t.report.contextTab] || 
                           t.report?.evaluationTab?.options?.[opt as keyof typeof t.report.evaluationTab.options] ||
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
          <h2 className="text-[10px] font-black text-white uppercase tracking-widest">{t.report?.sections?.[`${tabType}_obs`] || `${tabType.toUpperCase()} OBS`}</h2>
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
            <h2 className="text-[10px] font-black text-white uppercase tracking-widest">{t.report?.sections?.[`${tabType}_imp`] || `${tabType.toUpperCase()} IMP`}</h2>
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
      <Button type="button" variant="ghost" onClick={() => setActiveTab(prevTab)} className="h-12 px-8 font-black text-[11px] uppercase text-muted-foreground">← {t.report?.tabs?.[prevTab as keyof typeof t.report.tabs] || prevTab}</Button>
      <Button type="button" onClick={() => setActiveTab(nextTab)} className="h-12 px-12 bg-primary text-primary-foreground font-black rounded-xl text-[12px] uppercase tracking-widest">{t.report?.actions?.next || 'SIGUIENTE'} <ChevronRight className="ml-2 h-4 w-4" /></Button>
    </div>
  </div>
);

export function ReportForm({ userProfile, editingPlayerId, reportId: initialReportId }: { userProfile: UserProfile | null, editingPlayerId: string | null, reportId?: string | null }) {
  const { toast } = useToast();
  const { t } = useTranslation();
  const localizedKPIs = useMemo(() => getLocalizedKPIs(t), [t]);

  const [activeTab, setActiveTab] = useState("player");
  const [activeRole, setActiveRole] = useState<TacticalRoleConfig>({ ...TACTICAL_ROLES[0], kpis: localizedKPIs });
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [observedFunctions, setObservedFunctions] = useState<string[]>([]);
  const [reportId, setReportId] = useState<string | null>(initialReportId || null);
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

  const [strengths, setStrengths] = useState<string[]>(['', '', '', '']);
  const [weaknesses, setWeaknesses] = useState<string[]>(['', '', '', '']);
  const [overallDescription, setOverallDescription] = useState("");
  const [comparativePlayer, setComparativePlayer] = useState("");
  const [finalRecommendation, setFinalRecommendation] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [finalScoutRating, setFinalScoutRating] = useState<number>(0);
  const [pimScore, setPimScore] = useState<number>(0);

  const [isCalculatingPIM, setIsCalculatingPIM] = useState(false);
  const [pimResult, setPimResult] = useState<{ score: number, explanation: string } | null>(null);
  const [pastReports, setPastReports] = useState<ScoutingReport[]>([]);

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

      if (initialReportId) {
        getReport(initialReportId).then(r => loadReportData(r));
      } else {
        getLatestReportForPlayer(editingPlayerId).then(r => {
          if (r) {
            setMatchDate(format(new Date(), 'yyyy-MM-dd'));
            setCompetition(r.competition || "");
            setMatchSystem(r.matchSystem || "");
          }
        });
      }

      const unsub = subscribeToPlayerReports(editingPlayerId, setPastReports);
      return () => unsub();
    }
  }, [editingPlayerId, initialReportId, localizedKPIs]);

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

  const loadReportData = (r: ScoutingReport | null) => {
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
      setOverallDescription(r.overallDescription || "");
      setComparativePlayer(r.comparativePlayer || "");
      setFinalRecommendation(r.finalRecommendation || "");
      setAdditionalNotes(r.additionalNotes || "");
      setFinalScoutRating(r.finalScoutRating || 0);
      setPimScore(r.pimScore || (r.finalScoutRating ? r.finalScoutRating * 20 : 0));
      if (r.pimScore || r.finalScoutRating) {
        setPimResult({ 
          score: r.pimScore || (r.finalScoutRating! * 20), 
          explanation: r.summary || "" 
        });
      }
    }
  };

  const handleRatingChange = (kpi: string, value: number) => {
    setRatings(prev => {
      const newState = { ...prev };
      if (value === 0) {
        delete newState[kpi];
      } else {
        newState[kpi] = value;
      }
      return newState;
    });
  };

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

  const handleCalculatePIM = async () => {
    setIsCalculatingPIM(true);
    setPimResult(null);

    const getMetrics = (category: keyof typeof localizedKPIs) => {
      const allKpis = [...localizedKPIs[category].observation, ...localizedKPIs[category].impact];
      return allKpis
        .filter(k => ratings[k])
        .map(k => ({ name: k, value: ratings[k] }));
    };

    try {
      const result = await calculatePlayerImpactMetric({
        playerName,
        tacticalRole: activeRole.name,
        dominantFoot,
        minPlayed,
        physicalCondition,
        matchStyle,
        matchTempo: matchPace,
        teamDominance,
        score: observingScore,
        matchImportance,
        technicalMetrics: getMetrics('technical'),
        tacticalMetrics: getMetrics('tactical'),
        physicalMetrics: getMetrics('physical'),
        mentalMetrics: getMetrics('mental'),
        generalProfile: {
          technicalLevel: ratings['Nivel técnico'] || 0,
          tacticalIntelligence: ratings['Inteligencia táctica'] || 0,
          physicalQuality: ratings['Calidad física'] || 0,
          mentalStrength: ratings['Fortaleza mental'] || 0,
          competitiveLevel: ratings['Nivel competitivo'] || 0,
          potential: ratings['Potencial'] || 0,
          currentLevel: ratings['Nivel actual'] || 0,
        },
        qualitativeNotes: {
          strengths: strengths.filter(Boolean).join(", "),
          weaknesses: weaknesses.filter(Boolean).join(", "),
          description: overallDescription || "",
          recommendation: finalRecommendation || "",
        },
        language: 'es'
      });

      setPimResult({
        score: result.playerImpactMetric,
        explanation: result.explanation
      });
      
      setPimScore(result.playerImpactMetric);
      setFinalScoutRating(Math.round(result.playerImpactMetric / 20));
      handleNoteChange('summary', result.explanation);

      toast({
        title: "Métrica PIM Generada",
        description: "El motor de IA ha finalizado el análisis de impacto."
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error de IA",
        description: "No se pudo procesar la métrica en este momento."
      });
    } finally {
      setIsCalculatingPIM(false);
    }
  };

  const handleSaveAll = () => {
    const scoutId = auth.currentUser?.uid;
    if (!scoutId) return;

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
      tacticalRole: activeRole.id,
      grade: 'C',
      scoutId: scoutId,
      birthDate, height, weight, dominantFoot, secondaryPositions
    }, editingPlayerId || undefined);

    const finalReportId = saveReport({
      playerId,
      playerName,
      scoutId: scoutId,
      scoutName: scoutName || userProfile?.displayName || "Scout",
      summary: notes['summary'] || "",
      pimScore,
      ratings, notes, actions: scoutingActions,
      dorsal, rivalName, competition, matchDate, minPlayed, physicalCondition,
      pitchPosition: pitchMarker, heatmapPoints,
      observedFunctions: observedFunctions,
      matchStyle, matchSystem, matchPace, teamDominance, observingScore, matchImportance, weather,
      offBallTraits, bodyLanguageTraits, specificMatchRole,
      strengths, weaknesses, overallDescription, comparativePlayer,
      finalRecommendation, additionalNotes, finalScoutRating
    }, reportId || undefined);

    if (!reportId) {
      setReportId(finalReportId);
    }

    toast({ title: "Base de Datos Actualizada", description: "Datos guardados con éxito." });
  };

  const weatherIcons = { sun: Sun, cloudy: Cloud, rain: CloudRain, cold: Thermometer, wind: Wind };

  const getAuditStats = () => {
    const techCount = Object.keys(ratings).filter(k => localizedKPIs.technical.observation.includes(k) || localizedKPIs.technical.impact.includes(k)).length;
    const tacCount = Object.keys(ratings).filter(k => localizedKPIs.tactical.observation.includes(k)).length;
    const physCount = Object.keys(ratings).filter(k => localizedKPIs.physical.observation.includes(k)).length;
    const mentalCount = Object.keys(ratings).filter(k => localizedKPIs.mental.observation.includes(k)).length;
    const globalCount = Object.keys(ratings).filter(k => t.report?.generalProfile?.attributes?.includes(k)).length;
    
    return {
      tech: techCount,
      tac: tacCount,
      phys: physCount,
      mental: mentalCount,
      global: globalCount,
      hasContext: !!matchStyle && !!matchSystem && !!matchPace,
      hasSummary: !!overallDescription || !!notes['summary']
    };
  };

  const audit = getAuditStats();

  return (
    <div className="space-y-6 pb-32">
      <div className="bg-card/90 backdrop-blur-xl p-8 rounded-3xl border border-border/50 shadow-2xl flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-primary/20 flex items-center justify-center border border-primary/30">
            <FileText className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-black font-headline uppercase tracking-tight">{playerName || t.report?.title || 'Informe'}</h1>
            <div className="flex items-center gap-4">
              <p className="text-[10px] text-primary font-black uppercase tracking-widest">
                {reportId ? 'EDITANDO REGISTRO EXISTENTE' : 'REGISTRO DE NUEVA OBSERVACIÓN'}
              </p>
              {pastReports.length > 0 && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-6 px-3 bg-accent/10 text-accent font-black text-[8px] uppercase tracking-widest rounded-full hover:bg-accent hover:text-accent-foreground">
                      <History className="h-3 w-3 mr-1" /> {t.report.actions.viewHistory}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-[#1b263b] border-border/40 max-w-3xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader className="border-b border-white/10 pb-4">
                      <DialogTitle className="text-xl font-black uppercase tracking-widest text-primary flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" /> Evolución de Rendimiento Técnico
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6 pt-6">
                      {pastReports.filter(r => r.id !== reportId).map((r, i) => {
                        const avgs = calculateCategoryAverages(r);
                        return (
                          <div key={i} className="p-6 bg-secondary/20 rounded-2xl border border-border/10 space-y-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="text-[10px] font-black uppercase text-primary mb-1">{r.matchDate ? format(new Date(r.matchDate), "dd MMM yyyy", { locale: es }) : "TBD"}</p>
                                <h4 className="text-lg font-black text-white uppercase">{r.rivalName ? `vs ${r.rivalName}` : "Análisis previo"}</h4>
                              </div>
                              <div className="text-right">
                                 <p className="text-3xl font-black text-primary font-headline leading-none">{r.pimScore || 0}</p>
                                 <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">PIM SCORE</p>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-white/5">
                               <EvolutionMetric label="TÉCNICO" value={avgs.technical} icon={<Activity className="h-3 w-3" />} />
                               <EvolutionMetric label="TÁCTICO" value={avgs.tactical} icon={<Target className="h-3 w-3" />} />
                               <EvolutionMetric label="FÍSICO" value={avgs.physical} icon={<ZapIcon className="h-3 w-3" />} />
                               <EvolutionMetric label="MENTAL" value={avgs.mental} icon={<Brain className="h-3 w-3" />} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
        </div>
        <Button onClick={handleSaveAll} className="bg-primary text-primary-foreground font-black text-xs uppercase tracking-widest h-12 px-8 rounded-xl shadow-lg hover:scale-105 transition-all">
          <Save className="h-4 w-4 mr-2" /> {t.report?.actions?.save || 'GUARDAR'}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 sm:grid-cols-9 bg-secondary/20 p-1 border border-border/20 rounded-2xl gap-1 mb-8 h-auto">
          {Object.entries(t.report?.tabs || {}).map(([k, v]) => (
            <TabsTrigger key={k} value={k} className="py-3 text-[9px] font-black uppercase tracking-tighter rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">{v as string}</TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="player" className="space-y-8 animate-in fade-in">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-8">
              <Card className="border-border/40 bg-card/40 rounded-2xl overflow-hidden shadow-xl">
                <div className="bg-[#1b263b] px-6 py-4 flex items-center gap-3 border-b border-primary/20">
                  <User className="h-5 w-5 text-primary" />
                  <h2 className="text-[10px] font-black text-white uppercase tracking-widest">{t.report?.playerInfo?.title || 'INFO JUGADOR'}</h2>
                </div>
                <CardContent className="p-8 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6">
                    <div className="lg:col-span-9 space-y-1.5">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground">{t.report?.playerInfo?.name || 'NOMBRE'}</Label>
                      <Input value={playerName} onChange={(e) => setPlayerName(e.target.value)} className="h-10 bg-secondary/10 border-border/20 font-bold" />
                    </div>
                    <div className="lg:col-span-3 space-y-1.5">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground">{t.report?.playerInfo?.dorsal || 'DORSAL'}</Label>
                      <Input value={dorsal} onChange={(e) => setDorsal(e.target.value)} className="h-10 bg-secondary/10 border-border/20 font-bold text-center" />
                    </div>
                    <div className="lg:col-span-6 space-y-1.5">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground">{t.report?.playerInfo?.club || 'CLUB'}</Label>
                      <Input value={clubName} onChange={(e) => setClubName(e.target.value)} className="h-10 bg-secondary/10 border-border/20 font-bold" />
                    </div>
                    <div className="lg:col-span-6 space-y-1.5">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground">{t.report?.playerInfo?.rival || 'RIVAL'}</Label>
                      <Input value={rivalName} onChange={(e) => setRivalName(e.target.value)} className="h-10 bg-secondary/10 border-border/20 font-bold" />
                    </div>
                    <div className="lg:col-span-6 space-y-1.5">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground">{t.report?.playerInfo?.competition || 'COMPETICIÓN'}</Label>
                      <Input value={competition} onChange={(e) => setCompetition(e.target.value)} className="h-10 bg-secondary/10 border-border/20 font-bold" />
                    </div>
                    <div className="lg:col-span-6 space-y-1.5">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground">{t.report?.playerInfo?.matchDate || 'FECHA'}</Label>
                      <Input type="date" value={matchDate} onChange={(e) => setMatchDate(e.target.value)} className="h-10 bg-secondary/10 border-border/20 font-bold" />
                    </div>
                    <div className="lg:col-span-6 space-y-1.5">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground">{t.report?.playerInfo?.nationality || 'PAÍS'}</Label>
                      <Select value={nationality} onValueChange={setNationality}>
                        <SelectTrigger className="h-10 bg-secondary/10 border-border/20 font-bold">
                          <SelectValue placeholder="-" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px] bg-[#1b263b] border-border/20">
                          {ALL_COUNTRIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="lg:col-span-6 space-y-1.5">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground">{t.report?.playerInfo?.primaryPos || 'POSICIÓN'}</Label>
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
                              {t.report?.tacticalRoles?.[r.id as keyof typeof t.report.tacticalRoles] || r.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/40 bg-card/40 rounded-2xl overflow-hidden shadow-xl">
                <div className="bg-[#1b263b] px-6 py-4 flex items-center gap-3 border-b border-primary/20">
                  <Shield className="h-5 w-5 text-primary" />
                  <h2 className="text-[10px] font-black text-white uppercase tracking-widest">{t.report?.generalProfile?.title || 'PERFIL GENERAL'}</h2>
                </div>
                <CardContent className="p-0">
                  {(t.report?.generalProfile?.attributes || []).map((attr: string) => (
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
              <Card className="border-border/40 bg-card/40 rounded-2xl overflow-hidden shadow-xl">
                <div className="bg-[#1b263b] px-6 py-4 border-b border-primary/20">
                  <h2 className="text-[10px] font-black text-white uppercase tracking-widest">{t.report?.pitch?.title || 'UBICACIÓN'}</h2>
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
                  <h2 className="text-[10px] font-black text-white uppercase tracking-widest">{t.report?.observedFunctions?.title || 'ROLES OBSERVADOS'}</h2>
                </div>
                <CardContent className="p-6">
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(t.report?.observedFunctions || {}).filter(([k]) => k !== 'title').map(([k, v]) => (
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
            <Button type="button" onClick={() => setActiveTab("context")} className="h-12 px-12 bg-primary text-primary-foreground font-black rounded-xl text-[12px] uppercase tracking-widest">{t.report?.actions?.next || 'Siguiente'} <ChevronRight className="ml-2 h-4 w-4" /></Button>
          </div>
        </TabsContent>

        <TabsContent value="context" className="space-y-8 animate-in fade-in">
          <Card className="border-border/40 shadow-xl overflow-hidden rounded-2xl bg-card/40 backdrop-blur-md">
            <div className="bg-[#1b263b] px-6 py-4 flex items-center gap-3 border-b border-primary/20">
              <LayoutGrid className="h-5 w-5 text-primary" />
              <h2 className="text-[10px] font-black text-white uppercase tracking-widest">{t.report?.contextTab?.matchContextTitle || 'CONTEXTO PARTIDO'}</h2>
            </div>
            <CardContent className="p-8 space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground">{t.report?.contextTab?.system || 'SISTEMA'}</Label>
                  <Input value={matchSystem} onChange={(e) => setMatchSystem(e.target.value)} className="h-12 bg-secondary/10 border-border/20 font-bold" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground">{t.report?.contextTab?.matchRole || 'ROL'}</Label>
                  <Input value={specificMatchRole} onChange={(e) => setSpecificMatchRole(e.target.value)} className="h-12 bg-secondary/10 border-border/20 font-bold" />
                </div>
                <ChipGroup label={t.report?.contextTab?.gameStyle || 'ESTILO'} options={['possession', 'counter', 'highPress', 'direct', 'defensive']} selected={matchStyle} onSelect={setMatchStyle} t={t} />
                <ChipGroup label={t.report?.contextTab?.pace || 'RITMO'} options={['low', 'medium', 'high']} selected={matchPace} onSelect={setMatchPace} t={t} />
                <ChipGroup label={t.report?.contextTab?.teamDominance || 'DOMINIO'} options={['dominant', 'balanced', 'disadvantage']} selected={teamDominance} onSelect={setTeamDominance} t={t} />
                <ChipGroup label={t.report?.contextTab?.scoreAtObserving || 'MARCADOR'} options={['winning', 'drawing', 'losing']} selected={observingScore} onSelect={setObservingScore} t={t} />
                <ChipGroup label={t.report?.contextTab?.importance || 'IMPORTANCIA'} options={['low', 'medium', 'high', 'decisive']} selected={matchImportance} onSelect={setMatchImportance} t={t} />
                <ChipGroup label={t.report?.contextTab?.weather || 'CLIMA'} options={['sun', 'cloudy', 'rain', 'cold', 'wind']} selected={weather} onSelect={setWeather} t={t} icons={weatherIcons} />
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="border-border/40 shadow-xl overflow-hidden rounded-2xl bg-card/40 backdrop-blur-md">
              <div className="bg-[#1b263b] px-6 py-4 border-b border-primary/20">
                <h2 className="text-[10px] font-black text-white uppercase tracking-widest">{t.report?.contextTab?.offBallBehaviorTitle || 'SIN BALÓN'}</h2>
              </div>
              <CardContent className="p-6">
                <ChipGroup label="" options={['aggressive', 'central', 'lines', 'recovery', 'block', 'support', 'reading', 'shape']} selected={offBallTraits} onSelect={toggleOffBallTrait} t={t} multi />
              </CardContent>
            </Card>

            <Card className="border-border/40 shadow-xl overflow-hidden rounded-2xl bg-card/40 backdrop-blur-md">
              <div className="bg-[#1b263b] px-6 py-4 border-b border-primary/20">
                <h2 className="text-[10px] font-black text-white uppercase tracking-widest">{t.report?.contextTab?.bodyLanguage || 'LENGUAJE CORPORAL'}</h2>
              </div>
              <CardContent className="p-6">
                <ChipGroup label="" options={['positive', 'competitive', 'focused', 'frustrated', 'emotional', 'reactive', 'mature', 'indifferent']} selected={bodyLanguageTraits} onSelect={toggleBodyLanguageTrait} t={t} multi />
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-between gap-4 pt-10">
            <Button type="button" variant="ghost" onClick={() => setActiveTab("player")} className="h-12 px-8 font-black text-[11px] uppercase text-muted-foreground">← {t.report?.tabs?.player || 'Player'}</Button>
            <Button type="button" onClick={() => setActiveTab("technical")} className="h-12 px-12 bg-primary text-primary-foreground font-black rounded-xl text-[12px] uppercase tracking-widest">{t.report?.actions?.next || 'Siguiente'} <ChevronRight className="ml-2 h-4 w-4" /></Button>
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
                <h2 className="text-[10px] font-black text-white uppercase tracking-widest">{t.report?.actionsTab?.title || 'ACCIONES CLAVE'}</h2>
              </div>
              <Button onClick={addAction} size="sm" variant="outline" className="h-8 border-primary/30 text-primary font-black text-[9px] uppercase tracking-widest"><Plus className="h-3 w-3 mr-1" /> {t.report?.actionsTab?.add || 'Añadir'}</Button>
            </div>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-secondary/20 border-b border-border/10">
                      <th className="p-4 text-[9px] font-black uppercase text-muted-foreground w-20">{t.report?.actionsTab?.min || 'MIN'}</th>
                      <th className="p-4 text-[9px] font-black uppercase text-muted-foreground w-1/4">{t.report?.actionsTab?.action || 'ACCIÓN'}</th>
                      <th className="p-4 text-[9px] font-black uppercase text-muted-foreground w-1/4">{t.report?.actionsTab?.result || 'RESULTADO'}</th>
                      <th className="p-4 text-[9px] font-black uppercase text-muted-foreground">{t.report?.actionsTab?.notes || 'NOTAS'}</th>
                      <th className="p-4 w-12"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/10">
                    {scoutingActions.map((action, idx) => (
                      <tr key={idx} className="hover:bg-white/5 transition-colors">
                        <td className="p-2"><Input value={action.minute} onChange={(e) => updateAction(idx, 'minute', e.target.value)} className="h-9 bg-transparent border-none font-bold text-center" placeholder="00'" /></td>
                        <td className="p-2"><Input value={action.action} onChange={(e) => updateAction(idx, 'action', e.target.value)} className="h-9 bg-transparent border-none font-bold" /></td>
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
                        <td className="p-2"><Input value={action.notes} onChange={(e) => updateAction(idx, 'notes', e.target.value)} className="h-9 bg-transparent border-none text-xs italic" /></td>
                        <td className="p-2"><Button onClick={() => removeAction(idx)} variant="ghost" size="icon" className="h-8 w-8 text-destructive/50 hover:text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></Button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
          <div className="flex justify-between gap-4 pt-10">
            <Button type="button" variant="ghost" onClick={() => setActiveTab("mental")} className="h-12 px-8 font-black text-[11px] uppercase text-muted-foreground">← {t.report?.tabs?.mental || 'Mental'}</Button>
            <Button type="button" onClick={() => setActiveTab("evaluation")} className="h-12 px-12 bg-primary text-primary-foreground font-black rounded-xl text-[12px] uppercase tracking-widest">{t.report?.actions?.next || 'Siguiente'} <ChevronRight className="ml-2 h-4 w-4" /></Button>
          </div>
        </TabsContent>

        <TabsContent value="evaluation" className="space-y-8 animate-in fade-in">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="border-border/40 shadow-xl overflow-hidden rounded-2xl bg-card/40 backdrop-blur-md">
              <div className="bg-[#1b263b] px-6 py-4 flex items-center gap-3 border-b border-primary/20">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <h2 className="text-[10px] font-black text-white uppercase tracking-widest">{t.report?.evaluationTab?.mainStrengths || 'FORTALEZAS'}</h2>
              </div>
              <CardContent className="p-6 space-y-4">
                {strengths.map((s, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-[10px] font-black text-primary/40">{i+1}</span>
                    <Input value={s} onChange={(e) => {
                      const newS = [...strengths]; newS[i] = e.target.value; setStrengths(newS);
                    }} className="h-10 bg-secondary/10 border-none font-bold" />
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-border/40 shadow-xl overflow-hidden rounded-2xl bg-card/40 backdrop-blur-md">
              <div className="bg-[#1b263b] px-6 py-4 flex items-center gap-3 border-b border-primary/20">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                <h2 className="text-[10px] font-black text-white uppercase tracking-widest">{t.report?.evaluationTab?.areasToImprove || 'MEJORAS'}</h2>
              </div>
              <CardContent className="p-6 space-y-4">
                {weaknesses.map((w, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-[10px] font-black text-primary/40">{i+1}</span>
                    <Input value={w} onChange={(e) => {
                      const newW = [...weaknesses]; newW[i] = e.target.value; setWeaknesses(newW);
                    }} className="h-10 bg-secondary/10 border-none font-bold" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <Card className="border-border/40 shadow-xl overflow-hidden rounded-2xl bg-card/40 backdrop-blur-md">
            <div className="bg-[#1b263b] px-6 py-4 border-b border-primary/20">
              <h2 className="text-[10px] font-black text-white uppercase tracking-widest">{t.report?.evaluationTab?.recTitle || 'RESUMEN FINAL'}</h2>
            </div>
            <CardContent className="p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-1.5">
                   <Label className="text-[10px] font-black uppercase text-muted-foreground">{t.report?.evaluationTab?.playerDescription || 'DESCRIPCIÓN'}</Label>
                   <Textarea value={overallDescription} onChange={(e) => setOverallDescription(e.target.value)} className="min-h-[120px] bg-secondary/10 border-border/20 text-sm font-bold" />
                </div>
                <div className="space-y-1.5">
                   <Label className="text-[10px] font-black uppercase text-muted-foreground">{t.report?.evaluationTab?.comparative || 'COMPARATIVA'}</Label>
                   <Textarea value={comparativePlayer} onChange={(e) => setComparativePlayer(e.target.value)} className="min-h-[120px] bg-secondary/10 border-border/20 text-sm font-bold" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                 <div className="space-y-1.5">
                   <Label className="text-[10px] font-black uppercase text-muted-foreground">{t.report?.evaluationTab?.finalRec || 'RECOMENDACIÓN'}</Label>
                   <Select value={finalRecommendation} onValueChange={setFinalRecommendation}>
                      <SelectTrigger className="h-12 bg-secondary/10 border-border/20 font-bold">
                        <SelectValue placeholder="-" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1b263b] border-border/20">
                        {Object.entries(t.report?.evaluationTab?.recOptions || {}).map(([k,v]) => (
                          <SelectItem key={k} value={k}>{v as string}</SelectItem>
                        ))}
                      </SelectContent>
                   </Select>
                 </div>
                 <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground">{t.report?.evaluationTab?.finalRatingTitle || 'VALORACIÓN'}</Label>
                    <div className="flex gap-2 h-12 items-center px-4 bg-secondary/10 rounded-xl">
                      {[1,2,3,4,5].map(star => (
                        <button key={star} type="button" onClick={() => setFinalScoutRating(star === finalScoutRating ? 0 : star)} className="focus:outline-none">
                          <Star className={cn("h-6 w-6 transition-all", star <= finalScoutRating ? "fill-primary text-primary scale-110" : "text-muted-foreground opacity-30 hover:opacity-50")} />
                        </button>
                      ))}
                    </div>
                 </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-muted-foreground">{t.report?.summary?.title || 'RESUMEN EJECUTIVO'}</Label>
                <Textarea 
                  value={notes['summary'] || ""} 
                  onChange={(e) => handleNoteChange('summary', e.target.value)} 
                  className="min-h-[120px] bg-secondary/10 border-border/20 text-sm font-bold" 
                  placeholder={t.report?.summary?.placeholder || 'Escribe aquí...'}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between gap-4 pt-10">
            <Button type="button" variant="ghost" onClick={() => setActiveTab("actions")} className="h-12 px-8 font-black text-[11px] uppercase text-muted-foreground">← {t.report?.tabs?.actions || 'Actions'}</Button>
            <Button type="button" onClick={() => setActiveTab("analytics")} className="h-12 px-12 bg-primary text-primary-foreground font-black rounded-xl text-[12px] uppercase tracking-widest">{t.report?.tabs?.analytics || 'IA ANALYTICS'} <ChevronRight className="ml-2 h-4 w-4" /></Button>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-8 animate-in fade-in">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-8">
              <Card className="border-border/40 shadow-xl overflow-hidden rounded-2xl bg-card/40 backdrop-blur-md">
                <div className="bg-[#1b263b] px-6 py-4 flex items-center gap-3 border-b border-primary/20">
                  <Brain className="h-5 w-5 text-primary" />
                  <h2 className="text-[10px] font-black text-white uppercase tracking-widest">MOTOR DE INTELIGENCIA ARTIFICIAL</h2>
                </div>
                <CardContent className="p-12 text-center space-y-8">
                  {isCalculatingPIM ? (
                    <div className="space-y-6">
                      <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto border border-primary/20 animate-pulse">
                        <Loader2 className="h-12 w-12 text-primary animate-spin" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-xl font-black uppercase tracking-widest text-primary">Procesando Inteligencia Técnica...</h3>
                        <p className="text-sm text-muted-foreground max-w-md mx-auto italic font-medium">
                          Analizando métricas ponderadas por posición y ajustes contextuales de partido.
                        </p>
                      </div>
                    </div>
                  ) : pimResult ? (
                    <div className="space-y-8 animate-in zoom-in-95 duration-500">
                      <div className="flex flex-col items-center justify-center">
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/80 mb-2">PIM SCORE</span>
                        <div className="relative">
                          <div className="absolute inset-0 bg-primary/20 blur-[40px] rounded-full" />
                          <span className="text-8xl font-black text-primary font-headline relative leading-none">{pimResult.score}</span>
                        </div>
                        <Badge className="mt-6 bg-primary/20 text-primary px-8 py-2 text-xs font-black uppercase tracking-widest rounded-full border border-primary/30">
                          {pimResult.score >= 80 ? 'POTENCIAL ÉLITE' : pimResult.score >= 60 ? 'NIVEL COMPETITIVO' : 'SEGUIMIENTO REQUERIDO'}
                        </Badge>
                      </div>
                      <div className="p-6 bg-secondary/20 rounded-2xl border border-border/10 text-left">
                        <div className="flex items-center gap-2 mb-3">
                          <TrendingUp className="h-4 w-4 text-primary" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-white">Análisis del Motor Genkit</span>
                        </div>
                        <p className="text-sm text-foreground/90 leading-relaxed font-medium italic">"{pimResult.explanation}"</p>
                      </div>
                      <Button onClick={handleCalculatePIM} variant="outline" className="h-10 border-primary/30 text-primary font-black text-[10px] uppercase tracking-widest">RECALCULAR MÉTRICA</Button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto border border-primary/20">
                        <Sparkles className="h-10 w-10 text-primary animate-pulse" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-xl font-black uppercase tracking-widest text-white">Análisis de Impacto Profesional</h3>
                        <p className="text-sm text-muted-foreground max-w-md mx-auto italic font-medium">
                          El sistema está listo para procesar los datos recolectados y generar la métrica objetiva de rendimiento.
                        </p>
                      </div>
                      <Button onClick={handleCalculatePIM} className="h-14 px-12 bg-primary text-primary-foreground font-black text-sm uppercase tracking-[0.2em] rounded-2xl shadow-2xl hover:scale-105 transition-all">
                        <Database className="h-5 w-5 mr-2" /> GENERAR MÉTRICA PIM
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-border/40 shadow-xl overflow-hidden rounded-2xl bg-card/40 backdrop-blur-md">
                <div className="bg-[#1b263b] px-6 py-4 flex items-center gap-3 border-b border-primary/20">
                  <Info className="h-4 w-4 text-accent" />
                  <h2 className="text-[10px] font-black text-white uppercase tracking-widest">AUDITORÍA DE DATOS RECOLECTADOS</h2>
                </div>
                <CardContent className="p-8">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                    <AuditMetric label="TÉCNICOS" value={audit.tech} total={13+6} />
                    <AuditMetric label="TÁCTICOS" value={audit.tac} total={11} />
                    <AuditMetric label="FÍSICOS" value={audit.phys} total={11} />
                    <AuditMetric label="MENTALES" value={audit.mental} total={10} />
                  </div>
                  <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <AuditStatus label="Contexto de Partido" active={audit.hasContext} />
                    <AuditStatus label="Notas Cualitativas" active={audit.hasSummary} />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-4 space-y-8">
               <Card className="border-border/40 bg-primary/5 rounded-2xl p-6 border-dashed border-2">
                  <h4 className="text-[10px] font-black uppercase text-primary tracking-widest mb-4">RECOMENDACIÓN TÉCNICA</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Para una métrica precisa, asegúrate de haber evaluado al menos el <b>60%</b> de los campos técnicos y tácticos. Los datos cualitativos (fortalezas/debilidades) aportan el <b>30%</b> del peso en el resumen ejecutivo generado por la IA.
                  </p>
               </Card>
               {pimResult && (
                 <Card className="border-border/40 bg-card/40 rounded-2xl p-6">
                    <h4 className="text-[10px] font-black uppercase text-accent tracking-widest mb-4">PESOS APLICADOS</h4>
                    <div className="space-y-4">
                       <WeightItem label="Rendimiento Base" weight="85%" />
                       <WeightItem label="Perfil General" weight="15%" />
                       <div className="pt-4 border-t border-border/10">
                          <p className="text-[9px] font-bold text-muted-foreground uppercase">Ajustes context. aplicados</p>
                          <p className="text-xs font-black text-white mt-1">Simetría por posición ({activeRole.name})</p>
                       </div>
                    </div>
                 </Card>
               )}
               {Object.values(audit).some(v => typeof v === 'number' && v === 0) && (
                 <div className="bg-destructive/10 border border-destructive/30 p-4 rounded-xl flex items-start gap-3">
                   <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
                   <div>
                     <p className="text-[10px] font-black uppercase text-destructive">Alerta de Integridad</p>
                     <p className="text-[9px] text-destructive/80 font-medium">Faltan categorías completas. El PIM Score puede ser inexacto.</p>
                   </div>
                 </div>
               )}
            </div>
          </div>

          <div className="flex justify-start gap-4 pt-10">
            <Button type="button" variant="ghost" onClick={() => setActiveTab("evaluation")} className="h-12 px-8 font-black text-[11px] uppercase text-muted-foreground">← {t.report?.tabs?.evaluation || 'Evaluación'}</Button>
          </div>
        </TabsContent>
      </Tabs>
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

function ZapIcon({ className }: { className?: string }) {
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

function AuditMetric({ label, value, total }: { label: string, value: number, total: number }) {
  const percentage = (value / total) * 100;
  return (
    <div className="space-y-2">
      <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">{label}</p>
      <div className="flex items-baseline gap-1">
        <span className={cn("text-xl font-black", value > 0 ? "text-white" : "text-muted-foreground/30")}>{value}</span>
        <span className="text-[10px] text-muted-foreground/40">/ {total}</span>
      </div>
      <div className="h-1 w-full bg-secondary/50 rounded-full overflow-hidden">
        <div className="h-full bg-primary transition-all duration-1000" style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}

function AuditStatus({ label, active }: { label: string, active: boolean }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/20 border border-border/10">
      <div className={cn("h-2 w-2 rounded-full", active ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" : "bg-muted-foreground/30")} />
      <span className={cn("text-[10px] font-black uppercase tracking-tight", active ? "text-foreground" : "text-muted-foreground/40")}>{label}</span>
      {active && <CheckCircle2 className="h-3 w-3 text-green-500 ml-auto" />}
    </div>
  );
}

function WeightItem({ label, weight }: { label: string, weight: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-[10px] font-bold text-muted-foreground uppercase">{label}</span>
      <span className="text-xs font-black text-primary">{weight}</span>
    </div>
  );
}
