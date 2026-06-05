
"use client"

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Shield, Briefcase, Mail, Phone, Globe, Twitter, Linkedin, Instagram, Share2, Edit2, Save, X, Loader2 } from "lucide-react";
import { UserProfile, UserRole } from "@/lib/types";
import { updateUserProfile } from "@/lib/services/user-service";
import { useToast } from "@/hooks/use-toast";
import { ALL_COUNTRIES } from "@/lib/data/countries";

interface ProfileViewProps {
  profile: UserProfile | null;
}

export function ProfileView({ profile }: ProfileViewProps) {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<UserProfile>>({});

  // Sincronizar formData cuando el perfil carga o cambia (por la suscripción en tiempo real)
  useEffect(() => {
    if (profile) {
      setFormData({
        displayName: profile.displayName || '',
        phoneNumber: profile.phoneNumber || '',
        nationality: profile.nationality || '',
        organization: profile.organization || '',
        socials: {
          twitter: profile.socials?.twitter || '',
          linkedin: profile.socials?.linkedin || '',
          instagram: profile.socials?.instagram || '',
        }
      });
    }
  }, [profile]);

  if (!profile) return null;

  const handleSave = () => {
    setLoading(true);
    // Siguiendo las directrices: actualización optimista sin await
    updateUserProfile(profile.uid, formData);
    
    // Asumimos éxito por la actualización de caché local de Firestore
    setTimeout(() => {
      setIsEditing(false);
      setLoading(false);
      toast({
        title: "Perfil actualizado",
        description: "Tus datos se están sincronizando con la red ScoutPro.",
      });
    }, 500);
  };

  const roleColors: Record<string, string> = {
    admin: "bg-red-500/20 text-red-500 border-red-500/30",
    analista: "bg-primary/20 text-primary border-primary/30",
    entrenador: "bg-green-500/20 text-green-500 border-green-500/30",
    director: "bg-purple-500/20 text-purple-500 border-purple-500/30",
    gestion: "bg-accent/20 text-accent border-accent/30",
    invitado: "bg-muted-foreground/20 text-muted-foreground border-muted-foreground/30"
  };

  const roleLabels: Record<string, string> = {
    admin: "Administrador",
    analista: "Analista",
    entrenador: "Entrenador",
    director: "Director Deportivo",
    gestion: "Gestión de Club",
    invitado: "Invitado"
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-headline font-bold text-foreground uppercase tracking-tight">Área Personal</h1>
          <p className="text-muted-foreground">Gestiona tu identidad profesional dentro de la organización.</p>
        </div>
        {!isEditing ? (
          <Button 
            onClick={() => setIsEditing(true)}
            className="bg-secondary/50 border border-primary/30 text-primary font-black uppercase tracking-widest text-[10px] h-10 px-6 rounded-xl hover:bg-primary/20"
          >
            <Edit2 className="h-3.5 w-3.5 mr-2" /> Editar Perfil
          </Button>
        ) : (
          <div className="flex gap-2 w-full sm:w-auto">
            <Button 
              variant="ghost"
              onClick={() => setIsEditing(false)}
              className="flex-1 sm:flex-none text-[10px] font-black uppercase tracking-widest text-muted-foreground"
            >
              <X className="h-3.5 w-3.5 mr-2" /> Cancelar
            </Button>
            <Button 
              onClick={handleSave}
              disabled={loading}
              className="flex-1 sm:flex-none bg-primary text-primary-foreground font-black uppercase tracking-widest text-[10px] h-10 px-8 rounded-xl shadow-lg shadow-primary/20"
            >
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><Save className="h-3.5 w-3.5 mr-2" /> Guardar Cambios</>}
            </Button>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-1 border-border/40 bg-card/40 backdrop-blur-md overflow-hidden rounded-2xl shadow-2xl">
          <CardHeader className="text-center p-8 bg-secondary/20 border-b border-border/10">
            <div className="relative inline-block mx-auto mb-4">
              <Avatar className="h-32 w-32 border-4 border-primary/30 shadow-2xl rounded-full">
                <AvatarImage src={`https://picsum.photos/seed/${profile.uid}/400`} />
                <AvatarFallback className="text-4xl font-black">{profile.displayName?.[0] || 'U'}</AvatarFallback>
              </Avatar>
            </div>
            {isEditing ? (
              <div className="space-y-2 max-w-[240px] mx-auto text-left">
                <Label className="text-[9px] font-black uppercase tracking-widest text-primary">Nombre y Apellidos</Label>
                <Input 
                  value={formData.displayName} 
                  onChange={(e) => setFormData({...formData, displayName: e.target.value})}
                  className="h-10 bg-background/50 border-primary/20 font-bold"
                  placeholder="Tu nombre completo"
                />
              </div>
            ) : (
              <CardTitle className="text-2xl font-black uppercase tracking-tight">{profile.displayName || 'Sin Nombre'}</CardTitle>
            )}
            <Badge className={`mt-3 uppercase tracking-[0.2em] font-black text-[10px] px-6 py-1.5 rounded-full ${roleColors[profile.role] || roleColors.invitado}`}>
              {roleLabels[profile.role] || profile.role}
            </Badge>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <ProfileInfoItem 
              icon={<Mail className="h-4 w-4" />} 
              label="Email" 
              value={profile.email} 
            />

            <div className="space-y-2">
              {isEditing ? (
                <div className="flex flex-col gap-2">
                  <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Organización</Label>
                  <Input 
                    value={formData.organization} 
                    onChange={(e) => setFormData({...formData, organization: e.target.value})}
                    className="h-10 bg-secondary/10 border-border/10"
                    placeholder="Club o Agencia"
                  />
                </div>
              ) : (
                <ProfileInfoItem 
                  icon={<Briefcase className="h-4 w-4" />} 
                  label="Organización" 
                  value={profile.organization || 'ScoutPro 360 Network'} 
                />
              )}
            </div>

            <div className="space-y-2">
              {isEditing ? (
                <div className="flex flex-col gap-2">
                  <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Teléfono</Label>
                  <Input 
                    value={formData.phoneNumber} 
                    onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                    className="h-10 bg-secondary/10 border-border/10"
                    placeholder="+34 600 000 000"
                  />
                </div>
              ) : (
                <ProfileInfoItem 
                  icon={<Phone className="h-4 w-4" />} 
                  label="Teléfono" 
                  value={profile.phoneNumber || 'No especificado'} 
                />
              )}
            </div>

            <div className="space-y-2">
              {isEditing ? (
                <div className="flex flex-col gap-2">
                  <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Nacionalidad</Label>
                  <Select 
                    value={formData.nationality} 
                    onValueChange={(v) => setFormData({...formData, nationality: v})}
                  >
                    <SelectTrigger className="h-10 bg-secondary/10 border-border/10">
                      <SelectValue placeholder="Seleccionar país..." />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px] bg-[#1b263b] border-border/20">
                      {ALL_COUNTRIES.map(country => (
                        <SelectItem key={country} value={country}>{country}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <ProfileInfoItem 
                  icon={<Globe className="h-4 w-4" />} 
                  label="Nacionalidad" 
                  value={profile.nationality || 'No especificada'} 
                />
              )}
            </div>

            <div className="pt-4 border-t border-border/10">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4">Redes Sociales</p>
              {isEditing ? (
                <div className="space-y-3">
                  <div className="relative">
                    <Twitter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Twitter URL" 
                      className="pl-10 h-10 bg-secondary/10 border-border/10 text-xs" 
                      value={formData.socials?.twitter}
                      onChange={(e) => setFormData({...formData, socials: {...formData.socials, twitter: e.target.value}})}
                    />
                  </div>
                  <div className="relative">
                    <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="LinkedIn URL" 
                      className="pl-10 h-10 bg-secondary/10 border-border/10 text-xs" 
                      value={formData.socials?.linkedin}
                      onChange={(e) => setFormData({...formData, socials: {...formData.socials, linkedin: e.target.value}})}
                    />
                  </div>
                  <div className="relative">
                    <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Instagram URL" 
                      className="pl-10 h-10 bg-secondary/10 border-border/10 text-xs" 
                      value={formData.socials?.instagram}
                      onChange={(e) => setFormData({...formData, socials: {...formData.socials, instagram: e.target.value}})}
                    />
                  </div>
                </div>
              ) : (
                <div className="flex gap-3">
                  <SocialIcon icon={<Twitter className="h-4 w-4" />} url={profile.socials?.twitter} />
                  <SocialIcon icon={<Linkedin className="h-4 w-4" />} url={profile.socials?.linkedin} />
                  <SocialIcon icon={<Instagram className="h-4 w-4" />} url={profile.socials?.instagram} />
                  <SocialIcon icon={<Share2 className="h-4 w-4" />} url="#" />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 border-border/40 bg-card/40 backdrop-blur-md rounded-2xl shadow-2xl h-fit">
          <CardHeader className="border-b border-border/10 p-8">
            <CardTitle className="text-lg font-black uppercase tracking-widest flex items-center gap-3">
              <Shield className="h-5 w-5 text-primary" /> Permisos y Accesos
            </CardTitle>
            <CardDescription className="text-xs uppercase tracking-widest font-bold text-muted-foreground">Resumen de tus capacidades según tu rol actual.</CardDescription>
          </CardHeader>
          <CardContent className="p-8">
             <div className="space-y-6">
               <PermissionItem 
                 title="Acceso Total" 
                 allowed={profile.role === 'admin'} 
                 desc="Capacidad para gestionar usuarios, roles y configuraciones críticas del sistema."
               />
               <PermissionItem 
                 title="Informes en Vivo" 
                 allowed={['admin', 'analista', 'entrenador', 'director'].includes(profile.role)} 
                 desc="Creación y edición de informes de scouting detallados con métricas IA."
               />
               <PermissionItem 
                 title="Base de Datos Global" 
                 allowed={['admin', 'analista', 'gestion', 'entrenador', 'director'].includes(profile.role)} 
                 desc="Consulta y filtrado de la base de datos completa de prospectos."
               />
               <PermissionItem 
                 title="Mapeo de Talento" 
                 allowed={true} 
                 desc="Visualización geoespacial de la red de captación."
               />
               <PermissionItem 
                 title="Analytics & Benchmarking" 
                 allowed={['admin', 'gestion'].includes(profile.role)} 
                 desc="Análisis estratégico y comparativa avanzada de prospectos contra plantilla."
               />
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ProfileInfoItem({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="flex items-center gap-4 text-sm group">
      <div className="h-10 w-10 rounded-xl bg-secondary/50 flex items-center justify-center shrink-0 border border-border/10 group-hover:bg-primary/10 group-hover:border-primary/20 transition-all">
        <div className="text-muted-foreground group-hover:text-primary transition-colors">
          {icon}
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{label}</p>
        <p className="truncate font-bold text-foreground text-sm tracking-tight">{value || 'No especificado'}</p>
      </div>
    </div>
  );
}

function SocialIcon({ icon, url }: { icon: React.ReactNode, url?: string }) {
  const isValidUrl = url && (url.startsWith('http') || url.startsWith('www'));
  return (
    <a 
      href={isValidUrl ? (url.startsWith('www') ? `https://${url}` : url) : '#'} 
      target="_blank" 
      rel="noopener noreferrer"
      className={`h-10 w-10 rounded-xl bg-secondary/30 flex items-center justify-center border border-border/10 hover:bg-primary/20 hover:border-primary/50 hover:text-primary transition-all cursor-pointer ${!isValidUrl ? 'opacity-30 cursor-not-allowed' : ''}`}
      onClick={(e) => !isValidUrl && e.preventDefault()}
    >
      {icon}
    </a>
  );
}

function PermissionItem({ title, allowed, desc }: { title: string, allowed: boolean, desc: string }) {
  return (
    <div className="flex items-start gap-4 p-5 rounded-2xl border border-border/20 bg-secondary/10 hover:border-primary/30 transition-all group">
      <div className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 shadow-lg ${allowed ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
        <Shield className="h-4 w-4" />
      </div>
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-black uppercase tracking-tight group-hover:text-primary transition-colors">{title}</p>
          <Badge variant={allowed ? "default" : "destructive"} className="text-[8px] h-4 py-0 font-black uppercase tracking-tighter rounded-sm">
            {allowed ? 'Habilitado' : 'Restringido'}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed font-medium">{desc}</p>
      </div>
    </div>
  );
}
