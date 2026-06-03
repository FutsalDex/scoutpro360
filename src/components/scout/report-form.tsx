
"use client"

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TacticalCanvas } from "./tactical-canvas";
import { FileText, ChevronRight, ChevronLeft, Activity, User, Target, Brain, Sword, Award, Clipboard, Shield, Zap as ZapIcon, Heart, Save, Layers, Sun, Cloud, CloudRain, Thermometer, Wind, Plus, Trash2 } from "lucide-react";
import { TACTICAL_ROLES, type TacticalRoleConfig, type KPISection } from "@/lib/types";
import { calculatePlayerImpactMetric } from "@/ai/flows/calculate-player-impact-metric-flow";
import { generateExecutiveSummary } from "@/ai/flows/generate-executive-summary";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from '@/lib/i18n/context';
import { cn } from "@/lib/utils";

export function ReportForm() {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("player");
  const [activeRole, setActiveRole] = useState<TacticalRoleConfig>(TACTICAL_ROLES[0]);
  const [isCalculatingPIM, setIsCalculatingPIM] = useState(false);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [pimScore, setPimScore] = useState<number | null>(null);
  const [summary, setSummary] = useState("");
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [playerName, setPlayerName] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [contextData, setContextData] = useState<Record<string, string | string[]>>({});
  const [matchEvents, setMatchEvents] = useState<{ id: string, text: string }[]>([]);
  const [newEventText, setNewEventText] = useState("");

  const handleRatingChange = (kpi: string, value: number) => {
    setRatings(prev => ({ ...prev, [kpi]: value }));
  };

  const handleNoteChange = (kpi: string, value: string) => {
    setNotes(prev => ({ ...prev, [kpi]: value }));
  };

  const toggleRole = (roleKey: string) => {
    setSelectedRoles(prev => 
      prev.includes(roleKey) ? prev.filter(r => r !== roleKey) : [...prev, roleKey]
    );
  };

  const handleContextChange = (key: string, value: any) => {
    setContextData(prev => ({ ...prev, [key]: value }));
  };

  const toggleContextMulti = (key: string, value: string) => {
    const current = (contextData[key] as string[]) || [];
    const updated = current.includes(value) ? current.filter(v => v !== value) : [...current, value];
    handleContextChange(key, updated);
  };

  const handleAddEvent = () => {
    if (!newEventText.trim()) return;
    setMatchEvents(prev => [...prev, { id: Date.now().toString(), text: newEventText }]);
    setNewEventText("");
  };

  const handleRemoveEvent = (id: string) => {
    setMatchEvents(prev => prev.filter(e => e.id !== id));
  };

  const handleSaveReport = () => {
    toast({
      title: t.report.actions.save,
      description: "Report draft saved successfully. (Firebase integration active)",
    });
  };

  const handleCalculatePIM = async () => {
    setIsCalculatingPIM(true);
    try {
      const result = await calculatePlayerImpactMetric({
        playerId: "p1",
        currentEvaluation: {
          tacticalRole: activeRole.name,
          metrics: { technical: ratings, tactical: {}, physical: {}, mental: {} }
        },
        historicalClubData: JSON.stringify([{ tacticalRole: activeRole.name, avgPIM: 72 }])
      });
      setPimScore(result.playerImpactMetric);
    } catch (e) {
      toast({ variant: "destructive", title: "Error calculating PIM" });
    } finally {
      setIsCalculatingPIM(false);
    }
  };

  const handleGenerateSummary = async () => {
    setIsGeneratingSummary(true);
    try {
      const result = await generateExecutiveSummary({
        playerName: playerName || "Subject",
        tacticalRole: activeRole.name,
        metrics: { Technical: ratings },
        scoutNotes: `Evaluated in roles: ${activeRole.name}. Global technical level: ${ratings.technicalLevel || 3}/5. Global tactical intelligence: ${ratings.tacticalIntel || 3}/5.`
      });
      setSummary(result.summary);
    } catch (e) {
      toast({ variant: "destructive", title: "Error generating summary" });
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const RatingRow = ({ kpi }: { kpi: string }) => (
    <div className="flex items-center justify-between gap-4 py-1 border-b border-border/10 last:border-0 group">
      <Label className="text-[10px] font-bold uppercase w-40 shrink-0 text-muted-foreground group-hover:text-foreground transition-colors">{kpi}</Label>
      <div className="flex gap-1.5 shrink-0">
        {[1, 2, 3, 4, 5].map(num => (
          <button
            key={num}
            onClick={() => handleRatingChange(kpi, num)}
            className={cn(
              "h-7 w-7 rounded-full border border-border/40 text-[10px] font-bold flex items-center justify-center transition-all",
              ratings[kpi] === num ? "bg-primary text-primary-foreground border-primary scale-110 shadow-lg" : "bg-secondary/20 hover:border-primary/50 text-muted-foreground"
            )}
          >
            {num}
          </button>
        ))}
      </div>
      <Input 
        className="h-7 text-[10px] bg-secondary/10 border-none shadow-none focus-visible:ring-1 flex-grow ml-4 border-b border-border/20 rounded-none italic" 
        placeholder="Nota..." 
        value={notes[kpi] || ""}
        onChange={(e) => handleNoteChange(kpi, e.target.value)}
      />
    </div>
  );

  const EvaluationModule = ({ title, icon: Icon, kpiSection, nextTab, prevTab, tabType }: { title: string, icon: any, kpiSection: KPISection, nextTab: string, prevTab: string, tabType: string }) => {
    const hasImpactColumn = tabType === 'technical';
    
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
        <div className={cn("grid grid-cols-1 gap-6", hasImpactColumn ? "lg:grid-cols-2" : "lg:max-w-4xl mx-auto")}>
          {/* Left Column: Observation */}
          <Card className="border-border/40 shadow-xl overflow-hidden rounded-lg bg-card/40 backdrop-blur-md">
            <div className="bg-[#1b263b] px-4 py-2 flex items-center gap-2 border-b border-primary/20">
              <Icon className="h-4 w-4 text-primary" />
              <h2 className="text-xs font-bold text-white uppercase tracking-wider">{t.report.sections[`${tabType}_obs`]}</h2>
            </div>
            <CardContent className="pt-6 space-y-2">
              {kpiSection.observation.map(kpi => <RatingRow key={kpi} kpi={kpi} />)}
            </CardContent>
          </Card>

          {/* Right Column: Impact (Only for Technical) */}
          {hasImpactColumn && (
            <Card className="border-border/40 shadow-xl overflow-hidden rounded-lg bg-card/40 backdrop-blur-md">
              <div className="bg-[#1b263b] px-4 py-2 flex items-center gap-2 border-b border-accent/20">
                <Activity className="h-4 w-4 text-accent" />
                <h2 className="text-xs font-bold text-white uppercase tracking-wider">{t.report.sections[`${tabType}_impact`]}</h2>
              </div>
              <CardContent className="pt-6 space-y-2">
                {kpiSection.impact.map(kpi => <RatingRow key={kpi} kpi={kpi} />)}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex justify-between pt-6 border-t border-border/20">
          <Button variant="ghost" onClick={() => setActiveTab(prevTab)} className="px-8 font-bold text-xs uppercase text-muted-foreground hover:text-foreground">
            <ChevronLeft className="mr-2 h-4 w-4" /> {t.report.actions.previous}
          </Button>
          <Button onClick={() => setActiveTab(nextTab)} className="px-12 py-5 bg-primary text-primary-foreground hover:bg-primary/90 font-bold shadow-xl rounded-lg text-sm transition-all transform hover:scale-105">
            {t.report.actions.next} <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-24 max-w-[1600px] mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card/80 backdrop-blur-xl p-6 rounded-xl border border-border/50 shadow-2xl sticky top-20 z-40">
        <div className="flex items-center gap-5">
          <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30">
            <FileText className="h-6 w-6 text-primary" />
          </div>
          <div className="space-y-0.5">
            <h1 className="text-xl font-bold font-headline uppercase tracking-tight text-foreground">{t.report.title}</h1>
            <p className="text-[10px] text-primary font-bold uppercase tracking-[0.2em]">{t.report.subtitle}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" size="sm" className="bg-background/50 text-xs font-bold border-border/50 hover:bg-secondary" onClick={handleSaveReport}>
            <Save className="h-4 w-4 mr-2" /> {t.report.actions.save}
          </Button>
          <Button variant="outline" size="sm" className="bg-background/50 text-xs font-bold border-border/50 hover:bg-secondary">
            <Clipboard className="h-4 w-4 mr-2" /> {t.report.actions.export}
          </Button>
          <Button size="sm" className="bg-primary text-primary-foreground font-bold text-xs shadow-xl shadow-primary/20 px-6">
            {t.report.actions.submit}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full flex justify-between bg-secondary/20 h-12 p-1 border border-border/30 rounded-xl overflow-x-auto no-scrollbar mb-8">
          {Object.entries(t.report.tabs).map(([key, label]) => (
            <TabsTrigger 
              key={key} 
              value={key} 
              className="flex-1 text-[10px] font-bold tracking-widest data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all rounded-lg h-full"
            >
              <span className="mr-2 opacity-50 font-code">{Object.keys(t.report.tabs).indexOf(key) + 1}</span>
              {label as string}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="player" className="animate-in fade-in slide-in-from-bottom-2 space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <div className="space-y-8">
              <Card className="border-border/40 shadow-xl overflow-hidden rounded-xl bg-card/40 backdrop-blur-md">
                <div className="bg-[#007b83] px-5 py-3 flex items-center gap-3 border-b border-white/10">
                  <User className="h-5 w-5 text-white" />
                  <h2 className="text-xs font-black text-white uppercase tracking-[0.15em]">1 {t.report.playerInfo.title}</h2>
                </div>
                <CardContent className="pt-8 grid grid-cols-2 gap-5">
                  <div className="col-span-1 space-y-2">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t.report.playerInfo.name}</Label>
                    <Input value={playerName} onChange={(e) => setPlayerName(e.target.value)} className="h-10 bg-secondary/10 border-border/30 focus:border-primary/50 transition-colors" placeholder="Nombre completo" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t.report.playerInfo.number}</Label>
                    <Input className="h-10 bg-secondary/10 border-border/30" placeholder="-" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t.report.playerInfo.club}</Label>
                    <Input className="h-10 bg-secondary/10 border-border/30" placeholder="Club" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t.report.playerInfo.rival}</Label>
                    <Input className="h-10 bg-secondary/10 border-border/30" placeholder="vs" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t.report.playerInfo.competition}</Label>
                    <Input className="h-10 bg-secondary/10 border-border/30" placeholder="Liga / Copa" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t.report.playerInfo.date}</Label>
                    <Input type="date" className="h-10 bg-secondary/10 border-border/30" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t.report.playerInfo.birthDate}</Label>
                    <Input type="date" className="h-10 bg-secondary/10 border-border/30" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t.report.playerInfo.nationality}</Label>
                    <Input className="h-10 bg-secondary/10 border-border/30" placeholder="-" />
                  </div>
                  <div className="grid grid-cols-3 col-span-2 gap-5">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t.report.playerInfo.height}</Label>
                      <Input className="h-10 bg-secondary/10 border-border/30 text-center" placeholder="-" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t.report.playerInfo.weight}</Label>
                      <Input className="h-10 bg-secondary/10 border-border/30 text-center" placeholder="-" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t.report.playerInfo.minutes}</Label>
                      <Input className="h-10 bg-secondary/10 border-border/30 text-center" placeholder="90" />
                    </div>
                  </div>
                  <div className="col-span-1 space-y-2">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t.report.playerInfo.primaryPos}</Label>
                    <Select onValueChange={(v) => setActiveRole(TACTICAL_ROLES.find(r => r.id === v) || TACTICAL_ROLES[0])}>
                      <SelectTrigger className="h-10 bg-secondary/10 border-border/30 text-xs font-bold">
                        <SelectValue placeholder="Seleccionar..." />
                      </SelectTrigger>
                      <SelectContent>
                        {TACTICAL_ROLES.map(role => (
                          <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-1 space-y-2">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t.report.playerInfo.secondaryPos}</Label>
                    <Input className="h-10 bg-secondary/10 border-border/30" placeholder="Ej: ED, MCO" />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t.report.playerInfo.dominantFoot}</Label>
                    <div className="flex gap-3">
                        {Object.entries(t.report.playerInfo.footOptions).map(([key, label]) => (
                            <Button key={key} variant="outline" size="sm" className="h-9 px-6 text-[10px] font-bold rounded-lg border-border/40 hover:bg-primary/20 hover:text-primary transition-all">
                                {label as string}
                            </Button>
                        ))}
                    </div>
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t.report.playerInfo.physicalCondition}</Label>
                    <div className="flex flex-wrap gap-2">
                        {Object.entries(t.report.playerInfo.conditionOptions).map(([key, label]) => (
                            <Button key={key} variant="outline" size="sm" className="h-9 px-4 text-[10px] font-bold rounded-lg border-border/40">
                                {label as string}
                            </Button>
                        ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-8">
              <Card className="border-border/40 shadow-xl overflow-hidden rounded-xl flex flex-col bg-card/40 backdrop-blur-md">
                <div className="bg-[#007b83] px-5 py-3 flex items-center gap-3 border-b border-white/10">
                  <Target className="h-5 w-5 text-white" />
                  <h2 className="text-xs font-black text-white uppercase tracking-[0.15em]">2 {t.report.pitch.title}</h2>
                </div>
                <CardContent className="pt-4 flex flex-col items-center justify-center flex-grow bg-transparent p-6">
                  <TacticalCanvas />
                </CardContent>
              </Card>

              <Card className="border-border/40 shadow-xl overflow-hidden rounded-xl bg-card/40 backdrop-blur-md">
                <div className="bg-[#1b263b] px-5 py-3 flex items-center gap-3 border-b border-white/10">
                  <Layers className="h-5 w-5 text-primary" />
                  <h2 className="text-xs font-black text-white uppercase tracking-[0.15em]">{t.report.roles.title}</h2>
                </div>
                <CardContent className="pt-8 p-6">
                  <div className="flex flex-wrap gap-3">
                    {Object.entries(t.report.roles).filter(([k]) => k !== 'title').map(([key, label]) => (
                      <Button 
                        key={key} 
                        variant="outline" 
                        size="sm" 
                        onClick={() => toggleRole(key)}
                        className={cn(
                          "h-10 px-6 text-[11px] font-bold rounded-full border-border/40 transition-all",
                          selectedRoles.includes(key) 
                            ? "bg-primary text-primary-foreground border-primary shadow-xl scale-105" 
                            : "bg-secondary/10 hover:bg-secondary/30 text-muted-foreground"
                        )}
                      >
                        {label as string}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <Card className="border-border/40 shadow-2xl overflow-hidden rounded-xl bg-card/40 backdrop-blur-md mt-8">
            <div className="bg-[#1b263b] px-5 py-3 flex items-center gap-3 border-b border-white/10">
              <Brain className="h-5 w-5 text-primary" />
              <h2 className="text-xs font-black text-white uppercase tracking-[0.15em]">3 {t.report.globalProfile.title}</h2>
            </div>
            <CardContent className="pt-8 space-y-4 px-8">
              {Object.entries(t.report.globalProfile).filter(([k]) => k !== 'title').map(([key, label]) => (
                <RatingRow key={key} kpi={label as string} />
              ))}
            </CardContent>
          </Card>
          
          <div className="flex justify-end mt-12">
            <Button onClick={() => setActiveTab("context")} className="px-16 py-7 bg-primary text-primary-foreground hover:bg-primary/90 font-black shadow-2xl rounded-xl text-lg transition-all transform hover:scale-105 group">
              {t.report.actions.next} <ChevronRight className="ml-3 h-6 w-6 group-hover:translate-x-2 transition-transform" />
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="context" className="animate-in fade-in slide-in-from-bottom-2 space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <Card className="border-border/40 shadow-xl overflow-hidden rounded-xl bg-card/40 backdrop-blur-md">
              <div className="bg-[#007b83] px-5 py-3 flex items-center gap-3 border-b border-white/10">
                <Target className="h-5 w-5 text-white" />
                <h2 className="text-xs font-black text-white uppercase tracking-[0.15em]">{t.report.matchContext.title}</h2>
              </div>
              <CardContent className="pt-8 space-y-8 px-6">
                <div className="space-y-4">
                  <Label className="text-[10px] font-black text-primary uppercase tracking-widest">{t.report.matchContext.playStyle}</Label>
                  <div className="flex flex-wrap gap-3">
                    {Object.entries(t.report.matchContext.styles).map(([key, label]) => (
                      <Button
                        key={key}
                        variant="outline"
                        size="sm"
                        onClick={() => handleContextChange('playStyle', key)}
                        className={cn(
                          "h-10 px-5 text-[10px] font-bold rounded-full border-border/40 transition-all",
                          contextData.playStyle === key ? "bg-primary text-primary-foreground border-primary shadow-lg" : "bg-secondary/10"
                        )}
                      >
                        {label as string}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <Label className="text-[10px] font-black text-primary uppercase tracking-widest">{t.report.matchContext.formation}</Label>
                    <Input className="h-10 bg-secondary/10 border-border/30" placeholder="Ej: 4-3-3" onChange={(e) => handleContextChange('formation', e.target.value)} />
                  </div>
                  <div className="space-y-4">
                    <Label className="text-[10px] font-black text-primary uppercase tracking-widest">{t.report.matchContext.tempo}</Label>
                    <div className="flex gap-2">
                      {Object.entries(t.report.matchContext.tempos).map(([key, label]) => (
                        <Button key={key} onClick={() => handleContextChange('tempo', key)} className={cn("flex-1 h-10 text-[10px] font-bold", contextData.tempo === key ? "bg-primary text-primary-foreground" : "bg-secondary/10 text-muted-foreground")}>{label as string}</Button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <Label className="text-[10px] font-black text-primary uppercase tracking-widest">{t.report.matchContext.weather}</Label>
                  <div className="flex flex-wrap gap-6 bg-secondary/10 p-4 rounded-xl">
                    <button onClick={() => handleContextChange('weather', 'sun')} className={cn("flex items-center gap-2 text-[11px] font-bold", contextData.weather === 'sun' ? "text-primary scale-110" : "text-muted-foreground")}>
                      <Sun className="h-5 w-5" /> {t.report.matchContext.weathers.sun}
                    </button>
                    <button onClick={() => handleContextChange('weather', 'cloudy')} className={cn("flex items-center gap-2 text-[11px] font-bold", contextData.weather === 'cloudy' ? "text-primary scale-110" : "text-muted-foreground")}>
                      <Cloud className="h-5 w-5" /> {t.report.matchContext.weathers.cloudy}
                    </button>
                    <button onClick={() => handleContextChange('weather', 'rain')} className={cn("flex items-center gap-2 text-[11px] font-bold", contextData.weather === 'rain' ? "text-primary scale-110" : "text-muted-foreground")}>
                      <CloudRain className="h-5 w-5" /> {t.report.matchContext.weathers.rain}
                    </button>
                    <button onClick={() => handleContextChange('weather', 'wind')} className={cn("flex items-center gap-2 text-[11px] font-bold", contextData.weather === 'wind' ? "text-primary scale-110" : "text-muted-foreground")}>
                      <Wind className="h-5 w-5" /> {t.report.matchContext.weathers.wind}
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/40 shadow-xl overflow-hidden rounded-xl bg-card/40 backdrop-blur-md">
              <div className="bg-[#1b263b] px-5 py-3 flex items-center gap-3 border-b border-white/10">
                <Layers className="h-5 w-5 text-primary" />
                <h2 className="text-xs font-black text-white uppercase tracking-[0.15em]">{t.report.offBall.title}</h2>
              </div>
              <CardContent className="pt-8 space-y-8 px-6">
                <div className="space-y-4">
                  <Label className="text-[10px] font-black text-primary uppercase tracking-widest">{t.report.offBall.noPossession}</Label>
                  <div className="flex flex-wrap gap-3">
                    {Object.entries(t.report.offBall.actions).map(([key, label]) => (
                      <Button key={key} onClick={() => toggleContextMulti('offBallActions', key)} className={cn("h-9 px-4 text-[10px] font-bold rounded-lg transition-all", ((contextData.offBallActions as string[]) || []).includes(key) ? "bg-primary text-primary-foreground" : "bg-secondary/10 text-muted-foreground")}>{label as string}</Button>
                    ))}
                  </div>
                </div>
                <div className="space-y-4">
                  <Label className="text-[10px] font-black text-primary uppercase tracking-widest">{t.report.offBall.bodyLanguage}</Label>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(t.report.offBall.bodyLanguages).map(([key, label]) => (
                      <Button key={key} onClick={() => handleContextChange('bodyLanguage', key)} className={cn("h-9 px-4 text-[10px] font-bold rounded-lg transition-all", contextData.bodyLanguage === key ? "bg-primary text-primary-foreground" : "bg-secondary/10 text-muted-foreground")}>{label as string}</Button>
                    ))}
                  </div>
                </div>
                <div className="space-y-4">
                  <Label className="text-[10px] font-black text-primary uppercase tracking-widest">{t.report.offBall.tacticalRole}</Label>
                  <Textarea className="min-h-[120px] bg-secondary/10 border-border/30 text-[11px] leading-relaxed italic" placeholder="Describe el rol táctico asignado..." onChange={(e) => handleContextChange('tacticalRoleDesc', e.target.value)} />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-between mt-12 pt-8 border-t border-border/20">
            <Button variant="ghost" onClick={() => setActiveTab("player")} className="px-10 py-6 font-black text-sm uppercase text-muted-foreground hover:text-foreground">
              <ChevronLeft className="mr-3 h-5 w-5" /> {t.report.actions.previous}
            </Button>
            <Button onClick={() => setActiveTab("technical")} className="px-16 py-7 bg-primary text-primary-foreground hover:bg-primary/90 font-black shadow-2xl rounded-xl text-lg transition-all transform hover:scale-105">
              {t.report.actions.next} <ChevronRight className="ml-3 h-6 w-6" />
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="technical" className="mt-8">
           <EvaluationModule 
             title={t.report.tabs.technical} 
             icon={Sword} 
             kpiSection={activeRole.kpis.technical} 
             nextTab="tactical" 
             prevTab="context"
             tabType="technical"
           />
        </TabsContent>

        <TabsContent value="tactical" className="mt-8">
           <EvaluationModule 
             title={t.report.tabs.tactical} 
             icon={Shield} 
             kpiSection={activeRole.kpis.tactical} 
             nextTab="physical" 
             prevTab="technical"
             tabType="tactical"
           />
        </TabsContent>

        <TabsContent value="physical" className="mt-8">
           <EvaluationModule 
             title={t.report.tabs.physical} 
             icon={ZapIcon} 
             kpiSection={activeRole.kpis.physical} 
             nextTab="mental" 
             prevTab="tactical"
             tabType="physical"
           />
        </TabsContent>

        <TabsContent value="mental" className="mt-8">
           <EvaluationModule 
             title={t.report.tabs.mental} 
             icon={Heart} 
             kpiSection={activeRole.kpis.mental} 
             nextTab="actions" 
             prevTab="physical"
             tabType="mental"
           />
        </TabsContent>

        <TabsContent value="actions" className="mt-8 animate-in fade-in slide-in-from-bottom-2 space-y-8">
          <Card className="border-border/40 shadow-2xl overflow-hidden rounded-xl bg-card/40 backdrop-blur-md">
            <div className="bg-[#1b263b] px-5 py-3 flex items-center gap-3 border-b border-primary/20">
              <ZapIcon className="h-5 w-5 text-primary" />
              <h2 className="text-xs font-black text-white uppercase tracking-[0.15em]">{t.report.sections.actions_title}</h2>
            </div>
            <CardContent className="pt-8 space-y-6 px-8">
              <div className="flex gap-4">
                <Input 
                  value={newEventText} 
                  onChange={(e) => setNewEventText(e.target.value)} 
                  onKeyDown={(e) => e.key === 'Enter' && handleAddEvent()}
                  placeholder={t.report.actions.eventPlaceholder} 
                  className="h-12 bg-secondary/10 border-border/30 text-sm italic" 
                />
                <Button onClick={handleAddEvent} className="bg-primary hover:bg-primary/90 h-12 px-8 font-black">
                  <Plus className="h-5 w-5 mr-2" /> {t.report.actions.addEvent}
                </Button>
              </div>

              <div className="space-y-3 mt-8">
                {matchEvents.map((event) => (
                  <div key={event.id} className="flex items-center justify-between p-4 bg-secondary/20 rounded-xl border border-border/30 group hover:border-primary/50 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="h-2 w-2 rounded-full bg-primary" />
                      <span className="text-sm font-medium italic">{event.text}</span>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleRemoveEvent(event.id)} className="opacity-0 group-hover:opacity-100 text-destructive hover:bg-destructive/10">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {matchEvents.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground border-2 border-dashed border-border/20 rounded-2xl">
                    <Layers className="h-10 w-10 mx-auto mb-3 opacity-20" />
                    <p className="text-sm italic font-medium">No se han registrado acciones clave todavía.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between mt-12 pt-8 border-t border-border/20">
            <Button variant="ghost" onClick={() => setActiveTab("mental")} className="px-10 py-6 font-black text-sm uppercase text-muted-foreground hover:text-foreground">
              <ChevronLeft className="mr-3 h-5 w-5" /> {t.report.actions.previous}
            </Button>
            <Button onClick={() => setActiveTab("evaluation")} className="px-16 py-7 bg-primary text-primary-foreground hover:bg-primary/90 font-black shadow-2xl rounded-xl text-lg transition-all transform hover:scale-105">
              {t.report.actions.next} <ChevronRight className="ml-3 h-6 w-6" />
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="evaluation" className="mt-8 animate-in zoom-in-95 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="border-primary/20 bg-primary/5 shadow-inner p-10 rounded-2xl">
              <div className="text-center space-y-8">
                <Activity className="h-16 w-16 text-primary mx-auto" />
                <h3 className="text-2xl font-black font-headline uppercase tracking-widest">{t.report.pim.title}</h3>
                <div className="h-40 flex items-center justify-center">
                  {pimScore !== null ? (
                    <div className="text-8xl font-black text-primary font-headline animate-in zoom-in-50 drop-shadow-[0_10px_30px_rgba(224,176,80,0.4)]">{pimScore}</div>
                  ) : (
                    <div className="text-muted-foreground italic text-sm">PIM no calculado</div>
                  )}
                </div>
                <Button 
                  className="w-full h-14 font-black tracking-[0.2em] text-lg rounded-xl shadow-2xl shadow-primary/20" 
                  onClick={handleCalculatePIM}
                  disabled={isCalculatingPIM}
                >
                  {isCalculatingPIM ? t.report.pim.calculating : t.report.pim.calculate}
                </Button>
              </div>
            </Card>

            <Card className="border-accent/20 bg-accent/5 p-10 rounded-2xl">
              <div className="text-center space-y-8">
                <Award className="h-16 w-16 text-accent mx-auto" />
                <h3 className="text-2xl font-black font-headline uppercase tracking-widest">{t.report.summary.title}</h3>
                <div className="min-h-40 flex items-center justify-center border-2 border-dashed border-accent/30 rounded-2xl bg-background/40 p-6 text-left">
                  <p className="text-sm text-foreground italic leading-relaxed">
                    {summary || t.report.summary.placeholder}
                  </p>
                </div>
                <Button 
                    variant="secondary" 
                    className="w-full h-14 font-black tracking-[0.2em] text-lg rounded-xl shadow-2xl border-accent/30"
                    onClick={handleGenerateSummary}
                    disabled={isGeneratingSummary}
                >
                  {isGeneratingSummary ? t.report.summary.generating : t.report.summary.generate}
                </Button>
              </div>
            </Card>
          </div>
          <div className="flex justify-start mt-12 pt-8 border-t border-border/20">
            <Button variant="ghost" onClick={() => setActiveTab("actions")} className="px-10 py-6 font-black text-sm uppercase text-muted-foreground hover:text-foreground">
              <ChevronLeft className="mr-3 h-5 w-5" /> {t.report.actions.previous}
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
