
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
  { id: '5', name: 'Leny Yoro', age: 18, club: 'Lille OSC', nationality: 'FRA', value: '€45M', pim: 79, role: 'Ball-winning CB', grade: 'B+', status: 'Watchlist' },
  { id: '6', name: 'Warren Zaïre-Emery', age: 18, club: 'PSG', nationality: 'FRA', value: '€60M', pim: 82, role: 'Box-to-Box', grade: 'A', status: 'Elite' },
];

export function GlobalDatabase() {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold text-foreground">{t.sidebar.globalDatabase}</h1>
          <p className="text-muted-foreground text-sm">Access to our repository of 15,000+ evaluated players worldwide.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="h-11 bg-secondary/20 border-border/50">
            <Download className="h-4 w-4 mr-2" /> Export CSV
          </Button>
          <Button className="h-11 bg-primary text-primary-foreground font-bold px-6 shadow-lg shadow-primary/20">
            Add Prospect
          </Button>
        </div>
      </div>

      <Card className="border-border/40 bg-card/40 backdrop-blur-xl shadow-2xl">
        <CardHeader className="p-6 border-b border-border/20">
          <div className="flex flex-col lg:flex-row gap-4 justify-between">
            <div className="relative w-full lg:w-[400px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search name, club or nationality..." 
                className="pl-10 h-11 bg-background/50 border-border/50"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <Select defaultValue="all">
                <SelectTrigger className="w-[140px] h-11 bg-background/50">
                  <SelectValue placeholder="Position" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Positions</SelectItem>
                  <SelectItem value="fw">Forwards</SelectItem>
                  <SelectItem value="mf">Midfielders</SelectItem>
                  <SelectItem value="df">Defenders</SelectItem>
                </SelectContent>
              </Select>
              <Select defaultValue="pim">
                <SelectTrigger className="w-[140px] h-11 bg-background/50">
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pim">PIM Score</SelectItem>
                  <SelectItem value="value">Market Value</SelectItem>
                  <SelectItem value="age">Age</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="ghost" className="h-11 px-4 gap-2 text-primary font-bold">
                <Filter className="h-4 w-4" /> Filters
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border/20 bg-secondary/10">
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Player Details</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Position</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center">Age</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Club / Nat</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Value</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center">PIM</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center">Grade</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Status</th>
                  <th className="px-6 py-4 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/10">
                {MOCK_EXTENDED_PLAYERS.map(player => (
                  <tr key={player.id} className="hover:bg-primary/5 transition-colors group cursor-pointer">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 rounded-lg border border-border/50">
                          <AvatarImage src={`https://picsum.photos/seed/${player.id}/100`} />
                          <AvatarFallback>{player.name[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-bold text-sm text-foreground">{player.name}</p>
                          <p className="text-[10px] text-muted-foreground uppercase font-black">{player.role}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className="text-[10px] font-bold border-primary/30 text-primary bg-primary/10">
                        {player.role.split(' ').pop()}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-center text-sm font-medium">{player.age}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-foreground">{player.club}</span>
                        <span className="text-[10px] text-muted-foreground font-black">{player.nationality}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-black text-accent">{player.value}</td>
                    <td className="px-6 py-4 text-center">
                      <div className="inline-flex flex-col items-center">
                        <span className="text-base font-black text-primary font-headline leading-none">{player.pim}</span>
                        <TrendingUp className="h-2.5 w-2.5 text-accent mt-1" />
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="h-9 w-9 rounded-lg bg-secondary/50 border border-border/50 flex items-center justify-center font-black text-foreground">
                        {player.grade}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className={`h-1.5 w-1.5 rounded-full ${player.status === 'Priority' ? 'bg-primary' : 'bg-muted-foreground'}`} />
                        <span className="text-[10px] font-black uppercase tracking-tighter text-muted-foreground">{player.status}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
