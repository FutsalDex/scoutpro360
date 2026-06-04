
"use client"

import React, { useState, useRef } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { TacticalCanvas } from "./tactical-canvas";
import { FileText, ChevronRight, ChevronLeft, Activity, User, Target, Brain, Shield, Zap as ZapIcon, Heart, Save, Layers, Star, Award, Plus, Camera, Video, Upload, CheckCircle2, Loader2 } from "lucide-react";
import { TACTICAL_ROLES, type TacticalRoleConfig, type KPISection, type Player } from "@/lib/types";
import { calculatePlayerImpactMetric } from "@/ai/flows/calculate-player-impact-metric-flow";
import { generateExecutiveSummary } from "@/ai/flows/generate-executive-summary";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from '@/lib/i18n/context';
import { cn } from "@/lib/utils";
import { uploadFile } from "@/lib/services/storage-service";
import { savePlayer, saveReport } from "@/lib/services/db-service";
import { Progress } from "@/components/ui/progress";
import { auth } from "@/lib/firebase/config";

interface ActionRow {
  id: string;
  min: string;
  action: string;
  result: string;
  notes: string;
}

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
  onNoteChange: (value: string) => void
}) => (
  <div className="flex flex-col gap-3 py-4 border-b border-border/10 last:border-0 group">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <Label className="text-[10px] font-bold uppercase sm:w-44 shrink-0 text-muted-foreground group-hover:text-foreground transition-colors">{kpi}</Label>
      <div className="flex gap-1.5 shrink-0 justify-between sm:justify-start w-full sm:w-auto">
        {[1, 2, 3, 4, 5].map(num => (
          <button
            key={num}
            type="button"
            onClick={() => onRatingChange(num)}
            className={cn(
              "h-9 w-9 sm:h-8 sm:w-8 rounded-full border border-border/40 text-[11px] font-bold flex items-center justify-center transition-all shrink-0",
              rating === num ? "bg-primary text-primary-foreground border-primary scale-110 shadow-lg" : "bg-secondary/20 hover:border-primary/50 text-muted-foreground"
            )}
          >
            {num}
          </button>
        ))}
      </div>
    </div>
    <Input 
      className="h-9 text-[11px] bg-secondary/5 border-none shadow-none focus-visible:ring-1 border-b border-border/20 rounded-none italic placeholder:opacity-40" 
      placeholder="Observación / contexto..." 
      value={note || ""}
      onChange={(e) => onNoteChange(e.target.value)}
    />
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
}) => {
  const hasImpactColumn = tabType === 'technical';
  
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
      <div className="flex flex-col gap-6">
        <Card className="border-border/40 shadow-xl overflow-hidden rounded-xl bg-card/40 backdrop-blur-md">
          <div className="bg-[#1b263b] px-4 sm:px-5 py-3 flex items-center gap-2 border-b border-primary/20">
            <Icon className="h-4 w-4 text-primary" />
            <h2 className="text-[10px] sm:text-[11px] font-bold text-white uppercase tracking-wider">{t.report.sections[`${tabType}_obs`]}</h2>
          </div>
          <CardContent className="pt-4 sm:pt-6 space-y-1.5 px-4 sm:px-6">
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

        {hasImpactColumn && (
          <Card className="border-border/40 shadow-xl overflow-hidden rounded-xl bg-card/40 backdrop-blur-md">
            <div className="bg-[#1b263b] px-4 sm:px-5 py-3 flex items-center gap-2 border-b border-accent/20">
              <Activity className="h-4 w-4 text-accent" />
              <h2 className="text-[10px] sm:text-[11px] font-bold text-white uppercase tracking-wider">{t.report.sections[`${tabType}_impact`]}</h2>
            </div>
            <CardContent className="pt-4 sm:pt-6 space-y-1.5 px-4 sm:px-6">
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

      <div className="flex flex-col sm:flex-row justify-between gap-4 pt-6 sm:pt-10 max-w-5xl mx-auto">
        <Button variant="ghost" onClick={() => setActiveTab(prevTab)} className="px-6 py-5 sm:px-10 sm:py-6 font-bold text-[11px] uppercase text-muted-foreground hover:text-foreground">
          <ChevronLeft className="mr-3 h-4 w-4" /> {t.report.actions.previous}
        </Button>
        <Button onClick={() => setActiveTab(nextTab)} className="px-10 py-5 sm:px-16 sm:py-6 bg-primary text-primary-foreground hover:bg-primary/90 font-bold shadow-2xl rounded-xl text-[12px] sm:text-[13px] transition-all transform hover:scale-105">
          {t.report.actions.next} <ChevronRight className="ml-3 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export function ReportForm() {
  const { toast } = useToast();
  const { t, language } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [activeTab, setActiveTab] = useState("player");
  const [activeRole, setActiveRole] = useState<TacticalRoleConfig>(TACTICAL_ROLES[0]);
  const [isCalculatingPIM, setIsCalculatingPIM] = useState(false);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [pimScore, setPimScore] = useState<number | null>(null);
  const [summary, setSummary] = useState("");
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [playerName, setPlayerName] = useState("");
  const [clubName, setClubName] = useState("");
  const [nationality, setNationality] = useState("");
  const [age, setAge] = useState<number>(20);
  const [marketValue, setMarketValue] = useState("€1M");

  const [contextData, setContextData] = useState<Record<string, string | string[]>>({});
  const [actionRows, setActionRows] = useState<ActionRow[]>([
    { id: '1', min: '', action: '', result: '', notes: '' },
    { id: '2', min: '', action: '', result: '', notes: '' },
  ]);

  // Multimedia state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [playerPhotoUrl, setPlayerPhotoUrl] = useState<string | null>(null);

  const handleRatingChange = (kpi: string, value: number) => {
    setRatings(prev => ({ ...prev, [kpi]: value }));
  };

  const handleNoteChange = (kpi: string, value: string) => {
    setNotes(prev => ({ ...prev, [kpi]: value }));
  };

  const handleContextChange = (key: string, value: any) => {
    setContextData(prev => ({ ...prev, [key]: value }));
  };

  const handleActionChange = (id: string, field: keyof ActionRow, value: string) => {
    setActionRows(prev => prev.map(row => row.id === id ? { ...row, [field]: value } : row));
  };

  const handleAddActionRow = () => {
    setActionRows(prev => [...prev, { id: Date.now().toString(), min: '', action: '', result: '', notes: '' }]);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const fileName = `${Date.now()}_${file.name}`;
      const path = `reports/multimedia/${fileName}`;
      const url = await uploadFile(file, path, (progress) => {
        setUploadProgress(progress);
      });
      setPlayerPhotoUrl(url);
      toast({
        title: "Multimedia cargada",
        description: "El archivo se ha subido correctamente.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error de carga",
        description: "No se pudo subir el archivo.",
      });
    } finally {
      setIsUploading(false);
    }
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
        scoutNotes: `Evaluated in roles: ${activeRole.name}. Global technical level: ${ratings.technicalLevel || 3}/5.`,
        language: language as 'en' | 'es'
      });
      setSummary(result.summary);
    } catch (e) {
      toast({ variant: "destructive", title: "Error generating summary" });
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const handleSaveAll = async () => {
    if (!playerName) {
      toast({ variant: "destructive", title: "Nombre requerido", description: "Debes introducir el nombre del jugador." });
      setActiveTab("player");
      return;
    }

    setIsSaving(true);
    try {
      // 1. Guardar Jugador
      const playerId = await savePlayer({
        name: playerName,
        age: age,
        club: clubName || "Sin club",
        nationality: nationality || "Desconocida",
        marketValue: marketValue || "€0",
        currentPIM: pimScore || 0,
        tacticalRole: activeRole.name,
        grade: (pimScore || 0) > 85 ? 'A' : (pimScore || 0) > 70 ? 'B' : 'C'
      });

      // 2. Guardar Informe
      await saveReport({
        playerId,
        playerName,
        scoutId: auth.currentUser?.uid || "guest",
        scoutName: auth.currentUser?.email || "Invitado",
        pimScore: pimScore || 0,
        summary: summary,
        ratings: ratings,
        notes: notes,
        createdAt: null
      });

      toast({ title: "¡Éxito!", description: "El jugador y el informe han sido guardados en Firestore." });
      // Reset form if needed or redirect
    } catch (e) {
      console.error(e);
      toast({ variant: "destructive", title: "Error al guardar", description: "Ocurrió un error al persistir los datos." });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 pb-32 max-w-[1400px] mx-auto w-full px-1">
      <div className="flex flex-col gap-4 bg-card/80 backdrop-blur-xl p-4 sm:p-8 rounded-2xl border border-border/50 shadow-2xl sticky top-0 sm:top-20 z-40">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3 sm:gap-6">
            <div className="h-10 w-10 sm:h-14 sm:w-14 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30 shrink-0">
              <FileText className="h-5 w-5 sm:h-7 sm:w-7 text-primary" />
            </div>
            <div className="space-y-0.5 sm:space-y-1">
              <h1 className="text-xl sm:text-3xl font-black font-headline uppercase tracking-tight text-foreground leading-tight">{t.report.title}</h1>
              <p className="text-[9px] sm:text-[11px] text-primary font-bold uppercase tracking-[0.15em] sm:tracking-[0.25em]">{t.report.subtitle}</p>
            </div>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button 
              variant="outline" 
              className="flex-1 sm:flex-none h-10 px-3 bg-background/50 text-[9px] sm:text-[10px] font-bold border-border/50 uppercase tracking-widest"
              onClick={handleSaveAll}
              disabled={isSaving}
            >
              {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Save className="h-3.5 w-3.5 mr-1.5" />}
              <span className="hidden xs:inline">{t.report.actions.save}</span>
              <span className="xs:hidden">Guardar</span>
            </Button>
          </div>
        </div>
        <Button 
          onClick={handleSaveAll} 
          disabled={isSaving}
          className="h-11 sm:h-12 w-full bg-primary text-primary-foreground font-black text-[11px] sm:text-[12px] uppercase tracking-[0.2em] shadow-2xl shadow-primary/20 rounded-xl"
        >
          {isSaving ? "GUARDANDO..." : t.report.actions.submit}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full flex bg-secondary/15 h-auto p-1.5 border border-border/20 rounded-2xl mb-6 shadow-inner flex-wrap justify-center">
          {Object.entries(t.report.tabs).map(([key, label], idx) => (
            <TabsTrigger 
              key={key} 
              value={key} 
              className="flex-none sm:flex-1 text-[9px] sm:text-[11px] font-black tracking-widest data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all rounded-lg h-9 sm:h-11 border border-transparent m-1 px-3"
            >
              <span className="mr-1 opacity-40 font-code">{idx + 1}</span>
              {label as string}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="player" className="animate-in fade-in slide-in-from-bottom-2 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card className="border-border/40 shadow-xl overflow-hidden rounded-2xl bg-card/40 backdrop-blur-md">
                <div className="bg-[#007b83] px-4 py-3 flex items-center gap-3 border-b border-white/10">
                  <User className="h-4 w-4 text-white" />
                  <h2 className="text-[10px] sm:text-[12px] font-black text-white uppercase tracking-[0.15em]">1 {t.report.playerInfo.title}</h2>
                </div>
                <CardContent className="pt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 px-4 sm:px-6">
                  <div className="col-span-1 sm:col-span-2 space-y-2">
                    <Label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{t.report.playerInfo.name}</Label>
                    <Input value={playerName} onChange={(e) => setPlayerName(e.target.value)} className="h-10 bg-secondary/10 border-border/20 font-medium" placeholder="Nombre completo" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{t.report.playerInfo.club}</Label>
                    <Input value={clubName} onChange={(e) => setClubName(e.target.value)} className="h-10 bg-secondary/10 border-border/20 font-medium" placeholder="Club" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">NACIONALIDAD</Label>
                    <Input value={nationality} onChange={(e) => setNationality(e.target.value)} className="h-10 bg-secondary/10 border-border/20 font-medium" placeholder="País" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{t.report.playerInfo.primaryPos}</Label>
                    <Select onValueChange={(v) => setActiveRole(TACTICAL_ROLES.find(r => r.id === v) || TACTICAL_ROLES[0])}>
                      <SelectTrigger className="h-10 bg-secondary/10 border-border/20 text-[10px] font-black uppercase">
                        <SelectValue placeholder="Seleccionar..." />
                      </SelectTrigger>
                      <SelectContent>
                        {TACTICAL_ROLES.map(role => (
                          <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">EDAD</Label>
                      <Input type="number" value={age} onChange={(e) => setAge(parseInt(e.target.value))} className="h-10 bg-secondary/10 border-border/20 font-medium" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">VALOR MERCADO</Label>
                      <Input value={marketValue} onChange={(e) => setMarketValue(e.target.value)} className="h-10 bg-secondary/10 border-border/20 font-medium" placeholder="€10M" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/40 shadow-xl overflow-hidden rounded-2xl bg-card/40 backdrop-blur-md">
                <div className="bg-[#1b263b] px-4 py-3 flex items-center gap-3 border-b border-white/10">
                  <Camera className="h-4 w-4 text-primary" />
                  <h2 className="text-[10px] sm:text-[12px] font-black text-white uppercase tracking-[0.15em]">MULTIMEDIA (STORAGE)</h2>
                </div>
                <CardContent className="pt-6 space-y-6 px-4 sm:px-8">
                  <div className="flex flex-col items-center justify-center border-2 border-dashed border-border/20 rounded-2xl p-8 bg-secondary/5 hover:bg-secondary/10 transition-colors cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*,video/*" />
                    {isUploading ? (
                      <div className="w-full space-y-4 text-center">
                        <Activity className="h-10 w-10 text-primary animate-spin mx-auto" />
                        <p className="text-xs font-black uppercase tracking-widest text-primary">Subiendo... {Math.round(uploadProgress)}%</p>
                        <Progress value={uploadProgress} className="h-2" />
                      </div>
                    ) : playerPhotoUrl ? (
                      <div className="text-center space-y-3">
                        <div className="relative h-32 w-32 mx-auto rounded-xl overflow-hidden border-2 border-primary shadow-2xl">
                          <img src={playerPhotoUrl} alt="Player" className="h-full w-full object-cover" />
                          <div className="absolute top-1 right-1 bg-primary rounded-full p-1">
                            <CheckCircle2 className="h-4 w-4 text-primary-foreground" />
                          </div>
                        </div>
                        <p className="text-[10px] font-black text-primary uppercase">¡Archivo subido con éxito!</p>
                      </div>
                    ) : (
                      <div className="text-center space-y-2">
                        <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm font-bold text-foreground">Subir Foto o Vídeo del Jugador</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Formatos: JPG, PNG, MP4 (Max 50MB)</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="border-border/40 shadow-xl overflow-hidden rounded-2xl flex flex-col bg-card/40 backdrop-blur-md h-full">
                <div className="bg-[#007b83] px-4 py-3 flex items-center gap-3 border-b border-white/10">
                  <Target className="h-4 w-4 text-white" />
                  <h2 className="text-[10px] sm:text-[12px] font-black text-white uppercase tracking-[0.15em]">2 {t.report.pitch.title}</h2>
                </div>
                <CardContent className="pt-4 flex flex-col items-center justify-center p-4">
                  <TacticalCanvas />
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="flex justify-end mt-10">
            <Button onClick={() => setActiveTab("context")} className="w-full sm:w-auto px-12 py-7 bg-primary text-primary-foreground hover:bg-primary/90 font-black shadow-2xl rounded-2xl text-[14px] transition-all transform hover:scale-105 group">
              {t.report.actions.next} <ChevronRight className="ml-3 h-5 group-hover:translate-x-3 transition-transform" />
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="context" className="animate-in fade-in slide-in-from-bottom-2 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-border/40 shadow-xl overflow-hidden rounded-2xl bg-card/40 backdrop-blur-md">
              <div className="bg-[#007b83] px-4 py-3 flex items-center gap-3 border-b border-white/10">
                <Target className="h-4 w-4 text-white" />
                <h2 className="text-[10px] sm:text-[12px] font-black text-white uppercase tracking-[0.15em]">{t.report.matchContext.title}</h2>
              </div>
              <CardContent className="pt-6 space-y-8 px-4 sm:px-8">
                <div className="space-y-4">
                  <Label className="text-[9px] font-black text-primary uppercase tracking-widest">{t.report.matchContext.playStyle}</Label>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(t.report.matchContext.styles).map(([key, label]) => (
                      <Button
                        key={key}
                        variant="outline"
                        size="sm"
                        type="button"
                        onClick={() => handleContextChange('playStyle', key)}
                        className={cn(
                          "h-10 px-4 text-[9px] font-black uppercase rounded-full border-border/30",
                          contextData.playStyle === key ? "bg-primary text-primary-foreground border-primary" : "bg-secondary/15"
                        )}
                      >
                        {label as string}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-col sm:flex-row justify-between gap-4 mt-10 pt-6 border-t border-border/20">
            <Button variant="ghost" onClick={() => setActiveTab("player")} className="order-2 sm:order-1 px-8 py-5 font-black text-xs uppercase text-muted-foreground hover:text-foreground">
              <ChevronLeft className="mr-3 h-4" /> {t.report.actions.previous}
            </Button>
            <Button onClick={() => setActiveTab("technical")} className="order-1 sm:order-2 px-12 py-7 bg-primary text-primary-foreground hover:bg-primary/90 font-black shadow-2xl rounded-2xl text-[14px] transition-all transform hover:scale-105">
              {t.report.actions.next} <ChevronRight className="ml-3 h-5" />
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="technical" className="mt-6">
           <EvaluationModule 
             t={t} icon={Shield} kpiSection={activeRole.kpis.technical} nextTab="tactical" prevTab="context" tabType="technical" ratings={ratings} onRatingChange={handleRatingChange} notes={notes} onNoteChange={handleNoteChange} setActiveTab={setActiveTab}
           />
        </TabsContent>

        <TabsContent value="tactical" className="mt-6">
           <EvaluationModule 
             t={t} icon={Shield} kpiSection={activeRole.kpis.tactical} nextTab="physical" prevTab="technical" tabType="tactical" ratings={ratings} onRatingChange={handleRatingChange} notes={notes} onNoteChange={handleNoteChange} setActiveTab={setActiveTab}
           />
        </TabsContent>

        <TabsContent value="physical" className="mt-6">
           <EvaluationModule 
             t={t} icon={ZapIcon} kpiSection={activeRole.kpis.physical} nextTab="mental" prevTab="tactical" tabType="physical" ratings={ratings} onRatingChange={handleRatingChange} notes={notes} onNoteChange={handleNoteChange} setActiveTab={setActiveTab}
           />
        </TabsContent>

        <TabsContent value="mental" className="mt-6">
           <EvaluationModule 
             t={t} icon={Heart} kpiSection={activeRole.kpis.mental} nextTab="actions" prevTab="physical" tabType="mental" ratings={ratings} onRatingChange={handleRatingChange} notes={notes} onNoteChange={handleNoteChange} setActiveTab={setActiveTab}
           />
        </TabsContent>

        <TabsContent value="actions" className="mt-6 animate-in fade-in slide-in-from-bottom-2 space-y-6">
          <Card className="border-border/40 shadow-2xl overflow-hidden rounded-2xl bg-card/40 backdrop-blur-md">
            <div className="bg-[#1b263b] px-4 py-3 flex items-center gap-3 border-b border-primary/20">
              <Star className="h-4 w-4 text-primary fill-primary" />
              <h2 className="text-[10px] sm:text-[12px] font-black text-white uppercase tracking-[0.15em]">{t.report.sections.actions_title}</h2>
            </div>
            <CardContent className="p-4 space-y-4">
              {actionRows.map((row, idx) => (
                <div key={row.id} className="p-4 bg-secondary/10 rounded-xl border border-border/10 space-y-4 animate-in slide-in-from-right-2" style={{ animationDelay: `${idx * 100}ms` }}>
                  <div className="flex justify-between items-center border-b border-border/5 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black text-primary">#{idx + 1}</span>
                      <Input 
                        value={row.min} 
                        onChange={(e) => handleActionChange(row.id, 'min', e.target.value)} 
                        className="h-8 w-16 bg-background/50 border-border/20 text-[11px] font-bold text-center"
                        placeholder="MIN."
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-[9px] font-black text-muted-foreground uppercase">{t.report.actions.action}</Label>
                      <Input 
                        value={row.action} 
                        onChange={(e) => handleActionChange(row.id, 'action', e.target.value)} 
                        className="h-9 bg-background/50 border-border/20 text-[11px]"
                        placeholder="Tipo de acción..."
                      />
                    </div>
                  </div>
                </div>
              ))}
              <Button 
                onClick={handleAddActionRow} 
                variant="ghost" 
                className="w-full h-12 text-[10px] font-black uppercase tracking-widest text-muted-foreground border-2 border-dashed border-border/20 hover:border-primary/50"
              >
                <Plus className="h-4 w-4 mr-2" /> {t.report.actions.addEvent}
              </Button>
            </CardContent>
          </Card>

          <div className="flex flex-col sm:flex-row justify-between gap-4 mt-10 pt-6 border-t border-border/20">
            <Button variant="ghost" onClick={() => setActiveTab("mental")} className="order-2 sm:order-1 px-8 py-5 font-black text-xs uppercase text-muted-foreground hover:text-foreground">
              <ChevronLeft className="mr-3 h-4" /> {t.report.actions.previous}
            </Button>
            <Button onClick={() => setActiveTab("evaluation")} className="order-1 sm:order-2 px-12 py-7 bg-primary text-primary-foreground hover:bg-primary/90 font-black shadow-2xl rounded-2xl text-[14px] transition-all transform hover:scale-105">
              {t.report.actions.next}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="evaluation" className="mt-6 animate-in fade-in slide-in-from-bottom-2 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-border/40 shadow-xl overflow-hidden rounded-2xl bg-card/40 backdrop-blur-md">
              <div className="bg-[#2e7d32] px-4 py-3 flex items-center gap-3 border-b border-white/10">
                <Star className="h-4 w-4 text-white" />
                <h2 className="text-[10px] sm:text-[12px] font-black text-white uppercase tracking-[0.15em]">{t.report.final_evaluation.strengths.title}</h2>
              </div>
              <CardContent className="pt-6 space-y-6 px-4 sm:px-8">
                <div className="space-y-3">
                  <Label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{t.report.final_evaluation.strengths.strengths_title}</Label>
                  {[1,2,3].map(i => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-[9px] font-bold text-muted-foreground w-4">{i}.</span>
                      <Input className="h-10 bg-secondary/10 border-border/20 text-[11px]" placeholder="Fortaleza..." />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="flex flex-col sm:flex-row justify-between gap-4 mt-10 pt-6 border-t border-border/20">
            <Button variant="ghost" onClick={() => setActiveTab("actions")} className="order-2 sm:order-1 px-8 py-5 font-black text-xs uppercase text-muted-foreground hover:text-foreground">
              <ChevronLeft className="mr-3 h-4" /> {t.report.actions.previous}
            </Button>
            <Button onClick={() => setActiveTab("analytics")} className="order-1 sm:order-2 px-12 py-7 bg-primary text-primary-foreground hover:bg-primary/90 font-black shadow-2xl rounded-2xl text-[14px] transition-all transform hover:scale-105">
              {t.report.actions.next}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="mt-6 animate-in zoom-in-95 space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-primary/20 bg-primary/5 shadow-inner p-6 sm:p-10 rounded-3xl border-2">
              <div className="text-center space-y-8">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto border border-primary/20 shadow-xl">
                  <Activity className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl sm:text-2xl font-black font-headline uppercase tracking-[0.15em] text-foreground">{t.report.pim.title}</h3>
                <div className="h-32 flex items-center justify-center">
                  {pimScore !== null ? (
                    <div className="text-[70px] sm:text-[90px] font-black text-primary font-headline animate-in zoom-in-50 drop-shadow-[0_15px_40px_rgba(224,176,80,0.5)] leading-none">{pimScore}</div>
                  ) : (
                    <div className="text-muted-foreground/60 italic text-[12px] font-medium uppercase tracking-widest border border-dashed border-border/40 px-8 py-10 rounded-2xl">PIM no calculado</div>
                  )}
                </div>
                <Button 
                  className="w-full h-14 bg-primary text-primary-foreground font-black tracking-[0.2em] text-[14px] rounded-2xl shadow-2xl shadow-primary/30 uppercase transition-all hover:scale-[1.02]" 
                  onClick={handleCalculatePIM}
                  disabled={isCalculatingPIM}
                >
                  {isCalculatingPIM ? t.report.pim.calculating : t.report.pim.calculate}
                </Button>
              </div>
            </Card>

            <Card className="border-accent/20 bg-accent/5 shadow-inner p-6 sm:p-10 rounded-3xl border-2">
              <div className="text-center space-y-8">
                <div className="h-16 w-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto border border-accent/20 shadow-xl">
                  <Award className="h-8 w-8 text-accent" />
                </div>
                <h3 className="text-xl sm:text-2xl font-black font-headline uppercase tracking-[0.15em] text-foreground">{t.report.summary.title}</h3>
                <div className="min-h-[140px] flex items-center justify-center border-2 border-dashed border-accent/30 rounded-2xl bg-background/50 p-6 text-left shadow-inner">
                  <p className="text-[12px] text-foreground/90 italic leading-relaxed font-medium">
                    {summary || t.report.summary.placeholder}
                  </p>
                </div>
                <Button 
                    variant="secondary" 
                    className="w-full h-14 font-black tracking-[0.2em] text-[12px] rounded-2xl shadow-2xl border-accent/30 uppercase transition-all hover:scale-[1.02]"
                    onClick={handleGenerateSummary}
                    disabled={isGeneratingSummary}
                >
                  {isGeneratingSummary ? t.report.summary.generating : t.report.summary.generate}
                </Button>
              </div>
            </Card>
          </div>
          <div className="flex justify-start mt-10">
            <Button variant="ghost" onClick={() => setActiveTab("evaluation")} className="px-8 py-5 font-black text-xs uppercase text-muted-foreground hover:text-foreground group">
              <ChevronLeft className="mr-3 h-4 group-hover:-translate-x-2 transition-transform" /> {t.report.actions.previous}
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
