"use client"
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Shield, Users, FileText, Loader2 } from "lucide-react";
import { useTranslation } from '@/lib/i18n/context';
import { subscribeToUsers } from "@/lib/services/user-service";
import { subscribeToPlayers } from "@/lib/services/db-service";
import { UserProfile } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { auth } from "@/lib/firebase/config";
import { onAuthStateChanged } from "firebase/auth";

export function AdminPanel() {
  const { t } = useTranslation();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [playersCount, setPlayersCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
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
    const unsubUsers = subscribeToUsers((data) => {
      setUsers(data);
      setLoading(false);
    });
    const unsubPlayers = subscribeToPlayers((data) => {
      setPlayersCount(data.length);
    });
    return () => {
      unsubUsers();
      unsubPlayers();
    };
  }, [authReady]);

  const filteredUsers = users.filter(u =>
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.displayName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div>
        <h1 className="text-3xl font-headline font-black text-foreground uppercase tracking-tight">{t.admin.title}</h1>
        <p className="text-muted-foreground text-sm mt-1">{t.admin.subtitle}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-primary/20 bg-card/40 rounded-2xl">
          <CardContent className="p-6 flex items-center gap-4">
            <Users className="h-8 w-8 text-primary" />
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t.admin.stats.totalUsers}</p>
              <p className="text-4xl font-black">{users.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-accent/20 bg-card/40 rounded-2xl">
          <CardContent className="p-6 flex items-center gap-4">
            <FileText className="h-8 w-8 text-accent" />
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t.admin.stats.globalPlayers}</p>
              <p className="text-4xl font-black">{playersCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-primary/20 bg-card/40 rounded-2xl">
          <CardContent className="p-6 flex items-center gap-4">
            <Shield className="h-8 w-8 text-primary" />
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t.admin.stats.activeReports}</p>
              <p className="text-4xl font-black">{users.filter(u => u.role === 'admin').length}</p>
            </div>
          </CardContent>
        </Card>
      </div>
      <Card className="border-border/40 bg-card/40 rounded-2xl overflow-hidden">
        <CardHeader className="border-b border-border/20 p-6">
          <CardTitle className="text-sm font-black uppercase tracking-widest">{t.admin.userTable.user}</CardTitle>
          <Input
            placeholder="Buscar usuario..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mt-3 bg-secondary/10 border-border/20 rounded-xl"
          />
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border/20">
            {filteredUsers.map(user => (
              <div key={user.uid} className="flex items-center justify-between p-4 hover:bg-secondary/20 transition-colors">
                <div className="flex items-center gap-4">
                  <Avatar className="h-10 w-10 rounded-xl border border-primary/20">
                    <AvatarFallback className="font-bold">{user.displayName?.[0] || '?'}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-black text-sm">{user.displayName || 'Sin nombre'}</p>
                    <p className="text-[10px] text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                <Badge variant="outline" className="font-black text-[9px] uppercase tracking-widest border-primary/30 text-primary">
                  {user.role}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}