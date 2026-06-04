
"use client"

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, Download, TrendingUp, Loader2 } from "lucide-react";
import { useTranslation } from '@/lib/i18n/context';
import { subscribeToPlayers } from "@/lib/services/db-service";
import { Player } from "@/lib/types";

export function GlobalDatabase() {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToPlayers((data) => {
      setPlayers(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const filteredPlayers = players.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.club.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.nationality.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12 overflow-hidden px-1">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-headline font-bold text-foreground">{t.database.title}</h1>
          <p className="text-muted-foreground text-xs sm:text-sm">{t.database.subtitle}</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="outline" className="flex-1 sm:flex-none h-10 bg-secondary/20 border-border/50 text-[10px] font-bold uppercase tracking-widest">
            <Download className="h-4 w-4 mr-2" /> {t.database.export}
          </Button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 mb-6">
        <div className="relative w-full lg:w-[400px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder={t.database.search} 
            className="pl-10 h-11 bg-background/50 border-border/50 text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-10 w-10 text-primary animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredPlayers.length > 0 ? filteredPlayers.map(player => (
            <Card key={player.id} className="border-border/40 bg-card/40 hover:bg-primary/5 transition-all group cursor-pointer overflow-hidden">
              <CardContent className="p-5 space-y-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12 rounded-xl border border-border/50 shadow-inner">
                      <AvatarImage src={`https://picsum.photos/seed/${player.id}/100`} />
                      <AvatarFallback>{player.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="space-y-0.5">
                      <p className="font-bold text-sm text-foreground">{player.name}</p>
                      <p className="text-[10px] text-muted-foreground uppercase font-black">{player.tacticalRole}</p>
                    </div>
                  </div>
                  <div className="h-8 w-8 rounded-lg bg-secondary/50 border border-border/50 flex items-center justify-center font-black text-xs text-foreground">
                    {player.grade}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 py-3 border-y border-border/10">
                  <div className="space-y-1">
                    <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">{t.database.table.clubNat}</p>
                    <p className="text-[11px] font-bold text-foreground truncate">{player.club}</p>
                    <p className="text-[9px] text-muted-foreground">{player.nationality}</p>
                  </div>
                  <div className="space-y-1 text-right">
                    <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">{t.database.table.value}</p>
                    <p className="text-[13px] font-black text-accent">{player.marketValue}</p>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full bg-primary`} />
                    <span className="text-[10px] font-black uppercase tracking-tighter text-muted-foreground">{player.age} años</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-primary font-headline">{player.currentPIM}</span>
                    <TrendingUp className="h-3 w-3 text-accent" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )) : (
            <div className="col-span-full py-20 text-center text-muted-foreground italic">
              No se encontraron jugadores en la base de datos de Firestore.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
