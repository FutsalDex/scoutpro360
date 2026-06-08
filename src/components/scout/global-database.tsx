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

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try { await user.getIdToken(true); } catch (_) {}
      }
      setAuthReady(!!user);
      if (!user) setLoading(false);
    });
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (!authReady) return;
    const unsubscribe = subscribeToPlayers((data) => {
      setPlayers(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [authReady]);

  const filteredPlayers = players.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.club.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.nationality.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
                  className="flex items-center justify-between p-4 hover:bg-secondary/20 transition-colors cursor-pointer"
                  onClick={() => onEditPlayer(player.id)}
                >
                  <div className="flex items-center gap-4">
                    <Avatar className="h-10 w-10 rounded-xl border border-primary/20">
                      <AvatarFallback className="font-bold text-sm">{player.name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-black text-sm uppercase tracking-tight">{player.name}</p>
                      <p className="text-[10px] text-muted-foreground">{player.club} · {player.nationality}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-[9px] uppercase tracking-widest text-muted-foreground">PIM</p>
                      <p className="text-lg font-black text-accent">{player.currentPIM}</p>
                    </div>
                    <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center font-black text-primary border border-primary/30">
                      {player.grade}
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