"use client"

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { 
  User, Save, Sparkles, Calendar, Phone, Mail, Globe, 
  Hash, Share2, Loader2, MapPin, Image as ImageIcon, 
  Youtube, Plus, Trash2, Camera, ExternalLink, ShieldAlert,
  Eye
} from "lucide-react";
import { useTranslation } from '@/lib/i18n/context';
import { useToast } from "@/hooks/use-toast";
import { auth } from "@/lib/firebase/config";
import { savePlayer, getPlayer } from "@/lib/services/db-service";
import { uploadFile } from "@/lib/services/storage-service";
import { TACTICAL_ROLES, UserProfile } from "@/lib/types";
import { ALL_COUNTRIES } from "@/lib/data/countries";
import { cn } from "@/lib/utils";

interface TalentIdentificationProps {
  onComplete: () => void;
  editingPlayerId: string | null;
  userProfile: UserProfile | null;
}

export function TalentIdentification({ onComplete, editingPlayerId, userProfile }: TalentIdentificationProps) {
  const { t } = useTranslation();
  const { toast } = useToast();

  const [playerName, setPlayerName] = useState("");
  const [currentTeam, setCurrentTeam] = useState("");
  const [position, setPosition] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [nationality, setNationality] = useState("");
  const [dorsal, setDorsal] = useState("");
  const [socials, setSocials] = useState("");
  const [showOnMap, setShowOnMap] = useState(true);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Multimedia Gallery States
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [videoLinks, setVideoLinks] = useState<string[]>([]);
  const [newVideoUrl, setNewVideoUrl] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Subscription Limits
  const isBasicPlan = userProfile?.subscriptionPlan === 'básico';
  const MAX_ITEMS = isBasicPlan ? 3 : 6;

  useEffect(() => {
    if (editingPlayerId) {
      setLoading(true);
      getPlayer(editingPlayerId).then(p => {
        if (p) {
          setPlayerName(p.name || "");
          setCurrentTeam(p.club || "");
          setPosition(p.tacticalRole || "");
          setBirthDate(p.birthDate || "");
          setPhone(p.phone || "");
          setEmail(p.email || "");
          setNationality(p.nationality || "");
          setDorsal(p.dorsal || "");
          setSocials(p.socials || "");
          setShowOnMap(p.showOnMap !== undefined ? p.showOnMap : true);
          setGalleryImages(p.galleryImages || []);
          setVideoLinks(p.videoLinks || []);
        }
        setLoading(false);
      });
    }
  }, [editingPlayerId]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const scoutId = auth.currentUser?.uid;
    if (!scoutId) {
      toast({ variant: "destructive", title: "Error", description: "Debes iniciar sesión para registrar talento." });
      return;
    }

    if (!playerName || !currentTeam) {
      toast({ variant: "destructive", title: "Campos Requeridos", description: "Nombre y club son obligatorios." });
      return;
    }

    savePlayer({
      name: playerName,
      club: currentTeam,
      tacticalRole: position || 'mc',
      nationality: nationality || "N/A",
      age: birthDate ? new Date().getFullYear() - new Date(birthDate).getFullYear() : 0,
      marketValue: "€0",
      grade: 'C',
      scoutId: scoutId,
      birthDate: birthDate,
      phone: phone,
      email: email,
      dorsal: dorsal,
      socials: socials,
      showOnMap: showOnMap,
      galleryImages: galleryImages,
      videoLinks: videoLinks
    }, editingPlayerId || undefined);

    toast({ title: t.talentId.success });
    onComplete();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !playerName) {
      if (!playerName) toast({ variant: "destructive", title: "Identidad Requerida", description: "Introduce el nombre del jugador antes de subir imágenes." });
      return;
    }

    if (galleryImages.length >= MAX_ITEMS) {
      toast({ 
        variant: "destructive", 
        title: "Límite alcanzado", 
        description: `Tu plan permite un máximo de ${MAX_ITEMS} imágenes por jugador.` 
      });
      return;
    }

    setUploading(true);
    try {
      const folderName = playerName.trim().replace(/\s+/g, '_');
      const timestamp = new Date().getTime();
      const path = `players/${folderName}/img_${timestamp}`;
      
      const downloadUrl = await uploadFile(file, path);
      setGalleryImages(prev => [...prev, downloadUrl]);
      toast({ title: "Imagen añadida", description: "El recurso se ha guardado en la galería." });
    } catch (error) {
      toast({ variant: "destructive", title: "Error de subida", description: "No se pudo guardar la imagen en Storage." });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeImage = (index: number) => {
    setGalleryImages(prev => prev.filter((_, i) => i !== index));
  };

  const addVideoLink = () => {
    if (!newVideoUrl) return;
    if (videoLinks.length >= MAX_ITEMS) {
      toast({ 
        variant: "destructive", 
        title: "Límite alcanzado", 
        description: `Tu plan permite un máximo de ${MAX_ITEMS} videos por jugador.` 
      });
      return;
    }

    if (!newVideoUrl.includes("youtube.com") && !newVideoUrl.includes("youtu.be")) {
      toast({ variant: "destructive", title: "URL no válida", description: "Por favor introduce un enlace de YouTube válido." });
      return;
    }

    setVideoLinks(prev => [...prev, newVideoUrl]);
    setNewVideoUrl("");
  };

  const removeVideo = (index: number) => {
    setVideoLinks(prev => prev.filter((_, i) => i !== index));
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/60">Cargando perfil del jugador...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-col gap-2">
          <div className="h-1 w-12 bg-accent rounded-full mb-2" />
          <h1 className="text-4xl font-headline font-black text-foreground uppercase tracking-tight">
            {t.talentId.title}
          </h1>
          <p className="text-muted-foreground font-medium">{t.talentId.subtitle}</p>
        </div>
        <div className="flex items-center gap-3 px-4 py-2 bg-secondary/20 border border-border/20 rounded-2xl">
          <ShieldAlert className={cn("h-4 w-4", isBasicPlan ? "text-muted-foreground" : "text-primary")} />
          <div className="flex flex-col">
            <span className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">Capacidad Multimedia</span>
            <span className="text-[10px] font-bold text-foreground">Plan {(userProfile?.subscriptionPlan || 'básico').toUpperCase()} – Límite: {MAX_ITEMS}</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleRegister} className="space-y-8">
        {/* IDENTIDAD PRO SECTION */}
        <Card className="border-border/40 bg-card/40 backdrop-blur-md rounded-[2rem] overflow-hidden shadow-2xl">
          <CardHeader className="bg-[#1b263b] px-8 py-5 border-b border-accent/20">
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-accent" />
              <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-white">
                {t.talentId.playerSection}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t.talentId.playerName}</Label>
                <Input value={playerName} onChange={(e) => setPlayerName(e.target.value)} className="h-12 bg-secondary/10 border-border/20 text-sm font-bold rounded-xl" placeholder="Ej: Lamine Yamal" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t.talentId.currentTeam}</Label>
                <Input value={currentTeam} onChange={(e) => setCurrentTeam(e.target.value)} className="h-12 bg-secondary/10 border-border/20 text-sm font-bold rounded-xl" placeholder="Club Actual" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t.talentId.position}</Label>
                <Select value={position} onValueChange={setPosition}>
                  <SelectTrigger className="h-12 bg-secondary/10 border-border/20 rounded-xl font-bold">
                    <SelectValue placeholder="-" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1b263b] border-border/20">
                    {TACTICAL_ROLES.map(role => (
                      <SelectItem key={role.id} value={role.id}>{t.report.tacticalRoles[role.id as keyof typeof t.report.tacticalRoles] || role.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t.talentId.category}</Label>
                <div className="relative">
                  <Input 
                    type="date" 
                    value={birthDate} 
                    onChange={(e) => setBirthDate(e.target.value)} 
                    className="h-12 bg-secondary/10 border-border/20 text-sm font-bold rounded-xl pl-10" 
                  />
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-50" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t.talentId.phone}</Label>
                <div className="relative">
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="h-12 bg-secondary/10 border-border/20 text-sm font-bold rounded-xl pl-10" placeholder="+34 600 000 000" />
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-50" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t.talentId.email}</Label>
                <div className="relative">
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 bg-secondary/10 border-border/20 text-sm font-bold rounded-xl pl-10" placeholder="jugador@ejemplo.com" />
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-50" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t.talentId.nationality}</Label>
                <div className="relative">
                  <Select value={nationality} onValueChange={setNationality}>
                    <SelectTrigger className="h-12 bg-secondary/10 border-border/20 rounded-xl font-bold pl-10">
                      <SelectValue placeholder="-" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px] bg-[#1b263b] border-border/20">
                      {ALL_COUNTRIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-50 z-10" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t.talentId.dorsal}</Label>
                <div className="relative">
                  <Input value={dorsal} onChange={(e) => setDorsal(e.target.value)} className="h-12 bg-secondary/10 border-border/20 text-sm font-bold rounded-xl pl-10" placeholder="10" />
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-50" />
                </div>
              </div>
              <div className="md:col-span-2 space-y-1.5">
                <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t.talentId.socials}</Label>
                <div className="relative">
                  <Input value={socials} onChange={(e) => setSocials(e.target.value)} className="h-12 bg-secondary/10 border-border/20 text-sm font-bold rounded-xl pl-10" placeholder="@usuario_ig / @twitter_handle" />
                  <Share2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-50" />
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-border/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-white tracking-widest">VISIBILIDAD CARTOGRÁFICA</p>
                  <p className="text-[9px] text-muted-foreground font-medium">¿Mostrar este prospecto en el Mapa de Talentos?</p>
                </div>
              </div>
              <Switch checked={showOnMap} onCheckedChange={setShowOnMap} />
            </div>
          </CardContent>
        </Card>

        {/* MULTIMEDIA GALLERY SECTION */}
        <Card className="border-border/40 bg-card/40 backdrop-blur-md rounded-[2rem] overflow-hidden shadow-2xl">
          <CardHeader className="bg-[#1b263b] px-8 py-5 border-b border-primary/20">
            <div className="flex items-center gap-3">
              <ImageIcon className="h-5 w-5 text-primary" />
              <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-white">
                GALERÍA GRÁFICA Y VIDEO
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-8 space-y-10">
            {/* Image Section */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h4 className="text-sm font-black uppercase tracking-widest">Fotografías del Jugador</h4>
                </div>
                <Button 
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading || galleryImages.length >= MAX_ITEMS}
                  className="bg-primary/20 text-primary border border-primary/30 h-10 px-6 rounded-xl hover:bg-primary hover:text-primary-foreground transition-all"
                >
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Camera className="h-4 w-4 mr-2" /> Añadir Foto</>}
                </Button>
                <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                {galleryImages.map((url, idx) => (
                  <div key={idx} className="aspect-square relative rounded-2xl overflow-hidden border border-border/40 group bg-black/40">
                    <img src={url} alt={`Gallery ${idx}`} className="h-full w-full object-cover transition-transform group-hover:scale-110" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <button 
                        type="button" 
                        onClick={() => window.open(url, '_blank')} 
                        className="h-9 w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:scale-110 transition-transform shadow-lg"
                        title="Ver Imagen"
                      >
                        <Eye className="h-5 w-5" />
                      </button>
                      <button 
                        type="button" 
                        onClick={() => removeImage(idx)} 
                        className="h-9 w-9 rounded-full bg-destructive text-white flex items-center justify-center hover:scale-110 transition-transform shadow-lg"
                        title="Eliminar"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                ))}
                {[...Array(MAX_ITEMS - galleryImages.length)].map((_, i) => (
                  <div key={`empty-img-${i}`} className="aspect-square rounded-2xl border-2 border-dashed border-border/20 flex flex-col items-center justify-center gap-2 opacity-30">
                    <ImageIcon className="h-6 w-6" />
                    <span className="text-[8px] font-black">VACÍO</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Video Section */}
            <div className="space-y-6 pt-10 border-t border-border/10">
              <div className="space-y-4">
                <div className="space-y-1">
                  <h4 className="text-sm font-black uppercase tracking-widest">Análisis de Video (YouTube)</h4>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold italic">Enlaces externos a plataformas de scouting o highlights</p>
                </div>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Youtube className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      value={newVideoUrl} 
                      onChange={(e) => setNewVideoUrl(e.target.value)} 
                      placeholder="Pega la URL de YouTube aquí..." 
                      className="h-12 bg-secondary/10 border-border/20 pl-10 rounded-xl font-bold"
                    />
                  </div>
                  <Button 
                    type="button" 
                    onClick={addVideoLink} 
                    disabled={!newVideoUrl || videoLinks.length >= MAX_ITEMS}
                    className="h-12 px-6 bg-accent text-accent-foreground font-black rounded-xl"
                  >
                    <Plus className="h-4 w-4 mr-2" /> AÑADIR
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                {videoLinks.map((url, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-secondary/20 border border-border/10 rounded-2xl group hover:border-accent/40 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                        <Youtube className="h-5 w-5 text-red-500" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Video Análisis #{idx + 1}</span>
                        <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-foreground hover:text-accent transition-colors flex items-center gap-2">
                          {url.substring(0, 45)}... <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                    <button type="button" onClick={() => removeVideo(idx)} className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                {videoLinks.length === 0 && (
                  <div className="py-10 text-center border-2 border-dashed border-border/20 rounded-2xl opacity-20">
                    <Youtube className="h-8 w-8 mx-auto mb-2" />
                    <p className="text-[10px] font-black uppercase tracking-widest italic">Sin videos vinculados</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {!editingPlayerId && (
          <Card className="border-border/40 bg-card/40 backdrop-blur-md rounded-3xl overflow-hidden shadow-2xl">
            <CardContent className="p-8 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t.talentId.notes}</Label>
              </div>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="min-h-[120px] bg-secondary/10 border-border/20 rounded-2xl p-4 text-sm italic font-medium" placeholder="Describe brevemente el potencial observado..." />
            </CardContent>
          </Card>
        )}

        <Button type="submit" className="w-full h-16 bg-primary text-primary-foreground font-black text-sm uppercase tracking-[0.3em] rounded-3xl shadow-2xl shadow-primary/30 hover:scale-[1.02] transition-all">
          <Save className="mr-3 h-5 w-5" /> {t.talentId.submit}
        </Button>
      </form>
    </div>
  );
}