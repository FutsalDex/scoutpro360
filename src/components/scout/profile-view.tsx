"use client"

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { User, Shield, Briefcase, Mail, Phone, Globe, Twitter, Linkedin, Instagram, Share2 } from "lucide-react";
import { UserProfile } from "@/lib/types";

interface ProfileViewProps {
  profile: UserProfile | null;
}

export function ProfileView({ profile }: ProfileViewProps) {
  if (!profile) return null;

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
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-headline font-bold text-foreground uppercase tracking-tight">Área Personal</h1>
        <p className="text-muted-foreground">Gestiona tu identidad profesional dentro de la organización.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-1 border-border/40 bg-card/40 backdrop-blur-md overflow-hidden rounded-2xl shadow-2xl">
          <CardHeader className="text-center p-8 bg-secondary/20 border-b border-border/10">
            <Avatar className="h-32 w-32 mx-auto border-4 border-primary/30 shadow-2xl mb-4 rounded-full">
              <AvatarImage src={`https://picsum.photos/seed/${profile.uid}/400`} />
              <AvatarFallback className="text-4xl font-black">{profile.displayName?.[0] || 'U'}</AvatarFallback>
            </Avatar>
            <CardTitle className="text-2xl font-black uppercase tracking-tight">{profile.displayName}</CardTitle>
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
            <ProfileInfoItem 
              icon={<Briefcase className="h-4 w-4" />} 
              label="Organización" 
              value={profile.organization || 'ScoutPro 360 Network'} 
            />
            <ProfileInfoItem 
              icon={<Phone className="h-4 w-4" />} 
              label="Teléfono" 
              value={profile.phoneNumber || 'No especificado'} 
            />
            <ProfileInfoItem 
              icon={<Globe className="h-4 w-4" />} 
              label="Nacionalidad" 
              value={profile.nationality || 'No especificada'} 
            />

            <div className="pt-4 border-t border-border/10">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4">Redes Sociales</p>
              <div className="flex gap-3">
                <SocialIcon icon={<Twitter className="h-4 w-4" />} url={profile.socials?.twitter} />
                <SocialIcon icon={<Linkedin className="h-4 w-4" />} url={profile.socials?.linkedin} />
                <SocialIcon icon={<Instagram className="h-4 w-4" />} url={profile.socials?.instagram} />
                <SocialIcon icon={<Share2 className="h-4 w-4" />} url="#" />
              </div>
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
        <p className="truncate font-bold text-foreground text-sm tracking-tight">{value}</p>
      </div>
    </div>
  );
}

function SocialIcon({ icon, url }: { icon: React.ReactNode, url?: string }) {
  return (
    <a 
      href={url || '#'} 
      target="_blank" 
      rel="noopener noreferrer"
      className={`h-10 w-10 rounded-xl bg-secondary/30 flex items-center justify-center border border-border/10 hover:bg-primary/20 hover:border-primary/50 hover:text-primary transition-all cursor-pointer ${!url ? 'opacity-30 cursor-not-allowed' : ''}`}
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
