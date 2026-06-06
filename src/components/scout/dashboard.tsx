"use client"

import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { LayoutDashboard } from "lucide-react";
import { UserProfile } from "@/lib/types";

interface ScoutDashboardProps {
  userProfile: UserProfile | null;
  onEditPlayer: (id: string) => void;
}

export function ScoutDashboard({ userProfile }: ScoutDashboardProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 animate-in fade-in duration-500">
      <div className="h-20 w-20 rounded-3xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-2xl">
        <LayoutDashboard className="h-10 w-10 text-primary" />
      </div>
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-headline font-black text-foreground uppercase tracking-tight">Panel en Reconstrucción</h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          Estamos optimizando la sincronización de datos en tiempo real para ofrecerte una experiencia más fluida y segura.
        </p>
      </div>
      <Card className="border-dashed border-2 border-border/40 bg-secondary/5">
        <CardContent className="p-6">
          <p className="text-[10px] font-black uppercase tracking-widest text-primary">Estado del Nodo: Operativo</p>
        </CardContent>
      </Card>
    </div>
  );
}
