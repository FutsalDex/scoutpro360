
"use client"
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, Download, Loader2 } from "lucide-react";
import { useTranslation } from '@/lib/i18n/context';
import { subscribeToPlayers } from "@/lib/services/db-service";
import { Player } from "@/lib/types";
import { auth } from "@/lib/firebase/config";
import { onAuthStateChanged } from "firebase/auth";

interface GlobalDatabaseProps {
  onEditPlayer: (id: string) => void;
}

export function GlobalDatabase({ onEditPlayer }: GlobalDatabaseProps) {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [authReady, setAuthReady] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try { 
          // Asegurar que el token esté fresco para evitar errores de permisos iniciales
          await user.getIdToken(true); 
        } catch (_) {}
        setUserId(user.uid);
      } else {
        setUserId(null);
      }
      setAuthReady(!!user);
      if (!user) setLoading(false);
    });
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (!authReady || !userId) return;
    
    // Suscripción a los jugadores del scout actual
    const unsubscribe = subscribeToPlayers(userId, (data) => {
      setPlayers(data);
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, [authReady, userId]);

  const filteredPlayers = players.filter(p => {
    const search = searchTerm.toLowerCase();
    const name = (p.name || "").toLowerCase();
    const club = (p.club || "").toLowerCase();
    const nationality = (p.nationality || "").toLowerCase();
    
    return name.includes(search) || club.includes(search) || nationality.includes(search);
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12 overflow-hidden px-1">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-headline font-black text-foreground uppercase tracking-tight">{t.database.title}</h1>
          <p className="text-muted-foreground text-sm mt-1">{t.database.subtitle}</p>
        </div>
        <Button variant="outline" className="border-primary/30 text-primary font-black text-[10px] uppercase tracking-widest">
          <Download className="h-4 w-4 mr-2" /> {t.database.export}
        </Button>
      </div>
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t.database.search}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-12 h-12 bg-card/40 border-border/40 rounded-2xl"
        />
      </div>
      <Card className="border-border/40 bg-card/40 backdrop-blur-sm rounded-2xl overflow-hidden shadow-xl">
        <CardContent className="p-0">
          {filteredPlayers.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground text-xs uppercase tracking-widest opacity-50">
              {t.database.noRecords}
            </div>
          ) : (
            <div className="divide-y divide-border/20">
              {filteredPlayers.map(player => (
                <div
                  key={player.id}
                  className="flex items-center justify-between p-4 hover:bg-secondary/20 transition-all cursor-pointer group"
                  onClick={() => onEditPlayer(player.id)}
                >
                  <div className="flex items-center gap-4">
                    <Avatar className="h-10 w-10 rounded-xl border border-primary/20 group-hover:scale-105 transition-transform">
                      <AvatarFallback className="font-black text-primary bg-primary/10 text-sm">
                        {player.name ? player.name[0].toUpperCase() : '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-black text-sm uppercase tracking-tight group-hover:text-primary transition-colors">{player.name || 'Sin nombre'}</p>
                      <p className="text-[10px] text-muted-foreground">{player.club || 'Sin club'} · {player.nationality || 'Nacionalidad N/A'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                      <p className="text-[9px] uppercase tracking-widest text-muted-foreground">PIM</p>
                      <p className="text-lg font-black text-accent">{player.currentPIM || 0}</p>
                    </div>
                    <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center font-black text-primary border border-primary/30 shadow-sm">
                      {player.grade || 'C'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
