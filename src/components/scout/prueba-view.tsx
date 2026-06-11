"use client"

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listFolderFiles } from "@/lib/services/storage-service";
import { Loader2, ImageIcon, Copy, ExternalLink, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export function PruebaView() {
  const [files, setFiles] = useState<{ name: string, url: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchFiles = async () => {
    setLoading(true);
    const data = await listFolderFiles("RECURSOS");
    setFiles(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "URL Copiada",
      description: "La ruta de la imagen se ha guardado en el portapapeles.",
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-headline font-black text-white uppercase tracking-tight">Módulo de Prueba</h1>
          <p className="text-muted-foreground text-sm font-medium">Visualización de activos en carpeta /RECURSOS (Storage)</p>
        </div>
        <Button onClick={fetchFiles} variant="outline" className="bg-secondary/20 border-border/40 gap-2 h-11 px-6 rounded-xl">
          <RefreshCw className={loading ? "animate-spin h-4 w-4" : "h-4 w-4"} /> ACTUALIZAR
        </Button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
          <Loader2 className="h-10 w-10 text-primary animate-spin" />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/60">Escaneando Storage...</p>
        </div>
      ) : files.length === 0 ? (
        <Card className="border-dashed border-2 border-border/40 bg-card/20 py-20 text-center rounded-[2rem]">
          <CardContent>
            <ImageIcon className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
            <p className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest italic">
              No se encontraron archivos en la carpeta /RECURSOS
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {files.map((file, idx) => (
            <Card key={idx} className="border-border/40 bg-card/40 backdrop-blur-xl overflow-hidden rounded-[1.5rem] group hover:border-primary/50 transition-all shadow-xl">
              <div className="aspect-video relative overflow-hidden bg-black/40 flex items-center justify-center">
                <img 
                  src={file.url} 
                  alt={file.name} 
                  className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button size="icon" variant="secondary" onClick={() => copyToClipboard(file.url)} title="Copiar URL">
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="secondary" asChild title="Abrir en pestaña nueva">
                    <a href={file.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </div>
              <CardHeader className="p-5 border-t border-border/10 bg-secondary/5">
                <CardTitle className="text-xs font-black text-white uppercase truncate">{file.name}</CardTitle>
                <p className="text-[8px] text-muted-foreground uppercase font-bold tracking-widest">FIREBASE STORAGE RESOURCE</p>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
