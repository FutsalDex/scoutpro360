
"use client"

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, Download, MoreVertical, Star, TrendingUp } from "lucide-react";
import { useTranslation } from '@/lib/i18n/context';

const MOCK_EXTENDED_PLAYERS = [
  { id: '1', name: 'Julian Alvarez', age: 24, club: 'Manchester City', nationality: 'ARG', value: '€90M', pim: 88, role: 'False 9', grade: 'A', status: 'Priority' },
  { id: '2', name: 'Nicolo Barella', age: 27, club: 'Inter Milan', nationality: 'ITA', value: '€75M', pim: 84, role: 'Mezzala', grade: 'A', status: 'Monitored' },
  { id: '3', name: 'Trent Alexander-Arnold', age: 25, club: 'Liverpool', nationality: 'ENG', value: '€70M', pim: 91, role: 'Inverted FB', grade: 'A', status: 'Target' },
  { id: '4', name: 'Florian Wirtz', age: 20, club: 'Bayer Leverkusen', nationality: 'GER', value: '€110M', pim: 94, role: 'Classic 10', grade: 'A+', status: 'Elite' },
];

export function GlobalDatabase() {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');

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
          <Button className="flex-1 sm:flex-none h-10 bg-primary text-primary-foreground font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20">
            {t.database.add}
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
        <div className="flex gap-2 flex-wrap sm:flex-nowrap">
          <Select defaultValue="all">
            <SelectTrigger className="flex-1 sm:w-[140px] h-11 bg-background/50 text-[10px] font-bold uppercase">
              <SelectValue placeholder="Position" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Positions</SelectItem>
              <SelectItem value="fw">Forwards</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="ghost" className="h-11 px-4 gap-2 text-primary font-bold text-[10px] uppercase tracking-widest">
            <Filter className="h-4 w-4" /> {t.database.filters}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {MOCK_EXTENDED_PLAYERS.map(player => (
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
                    <p className="text-[10px] text-muted-foreground uppercase font-black">{player.role}</p>
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
                  <p className="text-[13px] font-black text-accent">{player.value}</p>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${player.status === 'Priority' || player.status === 'Elite' ? 'bg-primary' : 'bg-muted-foreground'}`} />
                  <span className="text-[10px] font-black uppercase tracking-tighter text-muted-foreground">{player.status}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-primary font-headline">{player.pim}</span>
                  <TrendingUp className="h-3 w-3 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
