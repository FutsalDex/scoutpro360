"use client"

import React, { useEffect, useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { listFolderFiles } from "@/lib/services/storage-service";
import { Loader2, AlertCircle } from "lucide-react";

export function TalentMapping() {
  const [mapUrl, setMapUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMap() {
      try {
        const files = await listFolderFiles("RECURSOS");
        // Buscamos el archivo mapamundi ignorando mayúsculas/minúsculas
        const mapFile = files.find(f => f.name.toLowerCase() === 'mapamundi.png');
        if (mapFile) {
          setMapUrl(mapFile.url);
        }
      } catch (error) {
        console.error("Error fetching map from storage:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchMap();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/60">Cargando Cartografía Táctica...</p>
      </div>
    );
  }

  return (
    <div className="w-full animate-in fade-in duration-1000 space-y-6">
      <div className="flex flex-col gap-2 mb-4 px-1">
        <div className="h-1 w-12 bg-primary rounded-full mb-2" />
        <h1 className="text-4xl font-headline font-black text-foreground uppercase tracking-tight">Mapa de Talentos</h1>
        <p className="text-muted-foreground font-medium uppercase text-[10px] tracking-widest">Base de Datos Geográfica Oficial</p>
      </div>

      <Card className="border-none bg-transparent overflow-hidden relative min-h-[600px] w-full shadow-[0_0_50px_rgba(0,0,0,0.5)] rounded-[2.5rem] border border-white/5">
        <CardContent className="p-0 h-full relative flex items-center justify-center bg-black/20">
          {mapUrl ? (
            <div className="relative w-full h-full flex items-center justify-center p-4">
              <img 
                src={mapUrl} 
                alt="Tactical World Map" 
                className="w-full h-auto max-h-[85vh] object-contain block opacity-100 drop-shadow-[0_0_30px_rgba(224,176,80,0.1)]"
                loading="eager"
              />
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 text-muted-foreground/40 py-40">
              <AlertCircle className="h-12 w-12" />
              <p className="text-[10px] font-black uppercase tracking-widest italic">Recurso 'mapamundi.png' no encontrado en /RECURSOS</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
