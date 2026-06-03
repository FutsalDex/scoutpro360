
"use client"

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { TacticalCanvas } from "./tactical-canvas";
import { Badge } from "@/components/ui/badge";
import { Mic, Sparkles, Database, FileText, ChevronRight, Activity } from "lucide-react";
import { TACTICAL_ROLES, type TacticalRoleConfig } from "@/lib/types";
import { processVoiceNote } from "@/ai/flows/process-voice-notes";
import { generateExecutiveSummary } from "@/ai/flows/generate-executive-summary";
import { calculatePlayerImpactMetric } from "@/ai/flows/calculate-player-impact-metric-flow";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from '@/lib/i18n/context';

export function ReportForm() {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [activeRole, setActiveRole] = useState<TacticalRoleConfig>(TACTICAL_ROLES[0]);
  const [playerName, setPlayerName] = useState("");
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [isCalculatingPIM, setIsCalculatingPIM] = useState(false);
  const [voiceInput, setVoiceInput] = useState("");
  const [summary, setSummary] = useState("");
  const [pimScore, setPimScore] = useState<number | null>(null);
  const [pimExplanation, setPimExplanation] = useState("");
  
  const [ratings, setRatings] = useState<Record<string, number>>({});

  const handleRoleChange = (roleId: string) => {
    const role = TACTICAL_ROLES.find(r => r.id === roleId);
    if (role) setActiveRole(role);
  };

  const handleRatingChange = (kpi: string, value: number) => {
    setRatings(prev => ({ ...prev, [kpi]: value }));
  };

  const handleVoiceProcess = async () => {
    if (!voiceInput) return;
    setIsProcessingVoice(true);
    try {
      const result = await processVoiceNote({ voiceNoteText: voiceInput });
      toast({ title: "Voice Note Processed", description: result.overallSummary });
    } catch (e) {
      toast({ variant: "destructive", title: "Processing Error" });
    } finally {
      setIsProcessingVoice(false);
    }
  };

  const handleGenerateSummary = async () => {
    setIsGeneratingSummary(true);
    try {
      const metrics: any = {
        technical: {}, tactical: {}, physical: {}, mental: {}
      };
      
      activeRole.kpis.technical.forEach(kpi => metrics.technical[kpi] = ratings[kpi] || 3);
      activeRole.kpis.tactical.forEach(kpi => metrics.tactical[kpi] = ratings[kpi] || 3);
      activeRole.kpis.physical.forEach(kpi => metrics.physical[kpi] = ratings[kpi] || 3);
      activeRole.kpis.mental.forEach(kpi => metrics.mental[kpi] = ratings[kpi] || 3);

      const result = await generateExecutiveSummary({
        playerName: playerName || "Prospect #1",
        tacticalRole: activeRole.name,
        metrics,
        scoutNotes: voiceInput
      });
      setSummary(result.summary);
    } catch (e) {
      toast({ variant: "destructive", title: "Summary Error" });
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const handleCalculatePIM = async () => {
    setIsCalculatingPIM(true);
    try {
      const metrics: any = { technical: {}, tactical: {}, physical: {}, mental: {} };
      activeRole.kpis.technical.forEach(kpi => metrics.technical[kpi] = ratings[kpi] || 3);
      activeRole.kpis.tactical.forEach(kpi => metrics.tactical[kpi] = ratings[kpi] || 3);
      activeRole.kpis.physical.forEach(kpi => metrics.physical[kpi] = ratings[kpi] || 3);
      activeRole.kpis.mental.forEach(kpi => metrics.mental[kpi] = ratings[kpi] || 3);

      const result = await calculatePlayerImpactMetric({
        playerId: "p1",
        currentEvaluation: {
          tacticalRole: activeRole.name,
          metrics
        },
        historicalClubData: JSON.stringify([{ tacticalRole: activeRole.name, avgPIM: 72 }])
      });
      setPimScore(result.playerImpactMetric);
      setPimExplanation(result.explanation);
    } catch (e) {
      toast({ variant: "destructive", title: "PIM Calculation Error" });
    } finally {
      setIsCalculatingPIM(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-20">
      <div className="lg:col-span-8 space-y-6">
        <Card className="border-border/40 shadow-xl overflow-hidden">
          <CardHeader className="bg-secondary/30 pb-8">
            <div className="flex flex-col md:flex-row justify-between gap-4">
              <div className="space-y-1">
                <CardTitle className="text-2xl font-headline flex items-center gap-2">
                  <FileText className="h-6 w-6 text-primary" />
                  {t.report.title}
                </CardTitle>
                <CardDescription>{t.report.subtitle}</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-accent border-accent/30 bg-accent/5">LIVE MODE</Badge>
                <Badge className="bg-primary text-primary-foreground font-bold">PRO VERSION</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="space-y-2">
                <Label htmlFor="playerName" className="text-xs uppercase tracking-widest text-muted-foreground">{t.report.playerName}</Label>
                <Input 
                  id="playerName" 
                  placeholder="Enter full name" 
                  value={playerName} 
                  onChange={(e) => setPlayerName(e.target.value)}
                  className="bg-background/50"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-widest text-muted-foreground">{t.report.tacticalRole}</Label>
                <Select onValueChange={handleRoleChange} defaultValue={activeRole.id}>
                  <SelectTrigger className="bg-background/50">
                    <SelectValue placeholder="Select tactical role" />
                  </SelectTrigger>
                  <SelectContent>
                    {TACTICAL_ROLES.map(role => (
                      <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Tabs defaultValue="kpis" className="w-full">
              <TabsList className="grid grid-cols-3 mb-6 bg-secondary h-12">
                <TabsTrigger value="kpis" className="data-[state=active]:bg-background">{t.report.tabs.metrics}</TabsTrigger>
                <TabsTrigger value="tactical" className="data-[state=active]:bg-background">{t.report.tabs.tactical}</TabsTrigger>
                <TabsTrigger value="voice" className="data-[state=active]:bg-background">{t.report.tabs.voice}</TabsTrigger>
              </TabsList>

              <TabsContent value="kpis" className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="grid md:grid-cols-2 gap-x-12 gap-y-8">
                  <section className="space-y-4">
                    <h3 className="text-sm font-bold text-accent uppercase tracking-tighter flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-accent" />
                      {t.report.sections.technical}
                    </h3>
                    {activeRole.kpis.technical.map(kpi => (
                      <div key={kpi} className="space-y-2">
                        <div className="flex justify-between text-xs font-medium">
                          <span>{kpi}</span>
                          <span className="text-primary font-bold">{ratings[kpi] || 3} / 5</span>
                        </div>
                        <Slider 
                          defaultValue={[3]} 
                          max={5} 
                          step={0.5} 
                          onValueChange={(v) => handleRatingChange(kpi, v[0])}
                        />
                      </div>
                    ))}
                  </section>
                  <section className="space-y-4">
                    <h3 className="text-sm font-bold text-primary uppercase tracking-tighter flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-primary" />
                      {t.report.sections.tactical}
                    </h3>
                    {activeRole.kpis.tactical.map(kpi => (
                      <div key={kpi} className="space-y-2">
                        <div className="flex justify-between text-xs font-medium">
                          <span>{kpi}</span>
                          <span className="text-primary font-bold">{ratings[kpi] || 3} / 5</span>
                        </div>
                        <Slider 
                          defaultValue={[3]} 
                          max={5} 
                          step={0.5} 
                          onValueChange={(v) => handleRatingChange(kpi, v[0])}
                        />
                      </div>
                    ))}
                  </section>
                  <section className="space-y-4">
                    <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-tighter flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-muted-foreground" />
                      {t.report.sections.physical}
                    </h3>
                    {activeRole.kpis.physical.map(kpi => (
                      <div key={kpi} className="space-y-2">
                        <div className="flex justify-between text-xs font-medium">
                          <span>{kpi}</span>
                          <span className="text-primary font-bold">{ratings[kpi] || 3} / 5</span>
                        </div>
                        <Slider 
                          defaultValue={[3]} 
                          max={5} 
                          step={0.5} 
                          onValueChange={(v) => handleRatingChange(kpi, v[0])}
                        />
                      </div>
                    ))}
                  </section>
                  <section className="space-y-4">
                    <h3 className="text-sm font-bold text-destructive uppercase tracking-tighter flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-destructive" />
                      {t.report.sections.mental}
                    </h3>
                    {activeRole.kpis.mental.map(kpi => (
                      <div key={kpi} className="space-y-2">
                        <div className="flex justify-between text-xs font-medium">
                          <span>{kpi}</span>
                          <span className="text-primary font-bold">{ratings[kpi] || 3} / 5</span>
                        </div>
                        <Slider 
                          defaultValue={[3]} 
                          max={5} 
                          step={0.5} 
                          onValueChange={(v) => handleRatingChange(kpi, v[0])}
                        />
                      </div>
                    ))}
                  </section>
                </div>
              </TabsContent>

              <TabsContent value="tactical">
                <TacticalCanvas />
              </TabsContent>

              <TabsContent value="voice">
                <div className="space-y-4">
                  <div className="relative group">
                    <Textarea 
                      placeholder={t.report.voice.placeholder}
                      className="min-h-[200px] bg-background/50 border-border group-hover:border-primary transition-colors pr-12"
                      value={voiceInput}
                      onChange={(e) => setVoiceInput(e.target.value)}
                    />
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="absolute bottom-4 right-4 h-10 w-10 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg"
                    >
                      <Mic className="h-5 w-5" />
                    </Button>
                  </div>
                  <Button 
                    className="w-full flex items-center gap-2" 
                    variant="outline"
                    onClick={handleVoiceProcess}
                    disabled={isProcessingVoice}
                  >
                    <Sparkles className="h-4 w-4 text-accent" />
                    {isProcessingVoice ? t.report.voice.processing : t.report.voice.process}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-4 space-y-6">
        <Card className="border-primary/20 bg-primary/5 shadow-inner">
          <CardHeader>
            <CardTitle className="text-lg font-headline flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              {t.report.pim.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {pimScore !== null ? (
              <div className="text-center space-y-4 animate-in zoom-in-95 duration-500">
                <div className="relative inline-flex items-center justify-center">
                  <svg className="w-24 h-24">
                    <circle cx="48" cy="48" r="44" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-secondary" />
                    <circle 
                      cx="48" cy="48" r="44" 
                      stroke="currentColor" strokeWidth="8" fill="transparent" 
                      strokeDasharray={276}
                      strokeDashoffset={276 - (276 * pimScore) / 100}
                      className="text-primary"
                    />
                  </svg>
                  <span className="absolute text-2xl font-bold font-headline">{pimScore}</span>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold">Player Impact Metric</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{pimExplanation}</p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center italic">{t.report.pim.placeholder}</p>
            )}
            <Button 
              className="w-full" 
              onClick={handleCalculatePIM}
              disabled={isCalculatingPIM}
            >
              <Database className="h-4 w-4 mr-2" />
              {isCalculatingPIM ? t.report.pim.calculating : t.report.pim.calculate}
            </Button>
          </CardContent>
        </Card>

        <Card className="border-accent/20 bg-accent/5">
          <CardHeader>
            <CardTitle className="text-lg font-headline flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-accent" />
              {t.report.summary.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {summary ? (
              <div className="space-y-2 animate-in fade-in slide-in-from-right-2 duration-500">
                <p className="text-sm leading-relaxed text-foreground/90 bg-background/40 p-3 rounded-lg border border-accent/20">
                  {summary}
                </p>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center italic">{t.report.summary.placeholder}</p>
            )}
            <Button 
              variant="secondary" 
              className="w-full" 
              onClick={handleGenerateSummary}
              disabled={isGeneratingSummary}
            >
              <ChevronRight className="h-4 w-4 mr-2" />
              {isGeneratingSummary ? t.report.summary.generating : t.report.summary.generate}
            </Button>
          </CardContent>
        </Card>

        <div className="pt-4 flex flex-col gap-3">
          <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-12">
            {t.report.actions.submit}
          </Button>
          <Button variant="outline" className="w-full h-12">
            {t.report.actions.export}
          </Button>
        </div>
      </div>
    </div>
  );
}
