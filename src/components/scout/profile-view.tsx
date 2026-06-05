
"use client"

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { User, Shield, Briefcase, Mail, Calendar } from "lucide-react";
import { UserProfile } from "@/lib/types";

interface ProfileViewProps {
  profile: UserProfile | null;
}

export function ProfileView({ profile }: ProfileViewProps) {
  if (!profile) return null;

  const roleColors: Record<string, string> = {
    admin: "bg-red-500/20 text-red-500 border-red-500/30",
    analyst: "bg-primary/20 text-primary border-primary/30",
    coach: "bg-green-500/20 text-green-500 border-green-500/30",
    director: "bg-purple-500/20 text-purple-500 border-purple-500/30",
    club: "bg-accent/20 text-accent border-accent/30",
    guest: "bg-muted-foreground/20 text-muted-foreground border-muted-foreground/30"
  };

  const roleLabels: Record<string, string> = {
    admin: "Administrador",
    analyst: "Analista",
    coach: "Entrenador",
    director: "Director Deportivo",
    club: "Gestión de Club",
    guest: "Invitado"
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-headline font-bold text-foreground uppercase tracking-tight">Área Personal</h1>
        <p className="text-muted-foreground">Gestiona tu identidad profesional dentro de la organización.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-1 border-border/40 bg-card/40 backdrop-blur-md overflow-hidden rounded-2xl">
          <CardHeader className="text-center p-8 bg-secondary/20">
            <Avatar className="h-24 w-24 mx-auto border-4 border-primary/30 shadow-2xl mb-4">
              <AvatarImage src={`https://picsum.photos/seed/${profile.uid}/200`} />
              <AvatarFallback className="text-2xl font-bold">{profile.displayName?.[0] || 'U'}</AvatarFallback>
            </Avatar>
            <CardTitle className="text-xl font-bold">{profile.displayName}</CardTitle>
            <Badge className={`mt-2 uppercase tracking-widest font-black text-[10px] px-4 py-1 ${roleColors[profile.role] || roleColors.guest}`}>
              {roleLabels[profile.role] || profile.role}
            </Badge>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <div className="flex items-center gap-4 text-sm">
              <div className="h-8 w-8 rounded-lg bg-secondary/50 flex items-center justify-center shrink-0">
                <Mail className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Email</p>
                <p className="truncate font-medium">{profile.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="h-8 w-8 rounded-lg bg-secondary/50 flex items-center justify-center shrink-0">
                <Briefcase className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Organización</p>
                <p className="font-medium">{profile.organization || 'ScoutPro 360 Network'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 border-border/40 bg-card/40 backdrop-blur-md rounded-2xl">
          <CardHeader className="border-b border-border/10 p-8">
            <CardTitle className="text-lg font-black uppercase tracking-widest flex items-center gap-3">
              <Shield className="h-5 w-5 text-primary" /> Permisos y Accesos
            </CardTitle>
            <CardDescription>Resumen de tus capacidades según tu rol actual.</CardDescription>
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
                 allowed={['admin', 'analyst', 'coach', 'director'].includes(profile.role)} 
                 desc="Creación y edición de informes de scouting detallados con métricas IA."
               />
               <PermissionItem 
                 title="Base de Datos Global" 
                 allowed={['admin', 'analyst', 'club', 'coach', 'director'].includes(profile.role)} 
                 desc="Consulta y filtrado de la base de datos completa de prospectos."
               />
               <PermissionItem 
                 title="Mapeo de Talento" 
                 allowed={true} 
                 desc="Visualización geoespacial de la red de captación."
               />
               <PermissionItem 
                 title="Analytics & Benchmarking" 
                 allowed={['admin', 'club'].includes(profile.role)} 
                 desc="Análisis estratégico y comparativa avanzada de prospectos contra plantilla."
               />
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function PermissionItem({ title, allowed, desc }: { title: string, allowed: boolean, desc: string }) {
  return (
    <div className="flex items-start gap-4 p-4 rounded-xl border border-border/20 bg-secondary/10">
      <div className={`h-6 w-6 rounded-full flex items-center justify-center shrink-0 mt-1 ${allowed ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
        <Shield className="h-3 w-3" />
      </div>
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-bold uppercase tracking-tight">{title}</p>
          <Badge variant={allowed ? "default" : "destructive"} className="text-[8px] h-4 py-0 font-black uppercase tracking-tighter">
            {allowed ? 'Habilitado' : 'Restringido'}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}
