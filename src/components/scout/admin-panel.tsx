"use client"

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Shield, Users, FileText, Activity, Clock, Search, Briefcase } from "lucide-react";
import { useTranslation } from '@/lib/i18n/context';
import { subscribeToUsers } from "@/lib/services/user-service";
import { subscribeToPlayers } from "@/lib/services/db-service";
import { UserProfile } from "@/lib/types";
import { Input } from "@/components/ui/input";

export function AdminPanel() {
  const { t } = useTranslation();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [playersCount, setPlayersCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
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
  }, []);

  const filteredUsers = users.filter(u => 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.displayName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const roleLabels: Record<string, string> = {
    admin: "Admin",
    analista: "Analista",
    entrenador: "Entrenador",
    director: "Director",
    gestion: "Gestión",
    invitado: "Invitado"
  };

  const roleColors: Record<string, string> = {
    admin: "bg-red-500/10 text-red-500 border-red-500/20",
    analista: "bg-primary/10 text-primary border-primary/20",
    entrenador: "bg-green-500/10 text-green-500 border-green-500/20",
    director: "bg-purple-500/10 text-purple-500 border-purple-500/20",
    gestion: "bg-accent/10 text-accent border-accent/20",
    invitado: "bg-muted-foreground/10 text-muted-foreground border-muted-foreground/20"
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-headline font-black text-foreground uppercase tracking-tight">
            {t.admin.title}
          </h1>
          <p className="text-muted-foreground">{t.admin.subtitle}</p>
        </div>
        <Badge className="bg-primary/20 text-primary border-primary/30 font-black uppercase tracking-widest px-4 py-1.5">
          Master Node: Active
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <AdminStatCard 
          title={t.admin.stats.totalUsers} 
          value={users.length.toString()} 
          icon={<Users className="text-primary" />} 
          subtitle="Real-time access"
        />
        <AdminStatCard 
          title={t.admin.stats.activeReports} 
          value="--" 
          icon={<FileText className="text-accent" />} 
          subtitle="Reports collection"
        />
        <AdminStatCard 
          title={t.admin.stats.globalPlayers} 
          value={playersCount.toString()} 
          icon={<Activity className="text-primary" />} 
          subtitle="Aggregated data"
        />
      </div>

      <Card className="border-border/40 bg-card/40 backdrop-blur-md rounded-2xl overflow-hidden shadow-2xl">
        <CardHeader className="bg-secondary/20 p-8 border-b border-border/10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="space-y-1">
              <CardTitle className="text-lg font-black uppercase tracking-[0.15em] font-headline flex items-center gap-3">
                <Shield className="h-5 w-5 text-primary" /> Gestión de Red ScoutPro
              </CardTitle>
              <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Control de acceso granular y monitoreo de roles
              </CardDescription>
            </div>
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar scout..." 
                className="pl-10 h-10 bg-background/50 border-border/20 text-xs"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary/10 border-b border-border/10">
                <tr>
                  <th className="text-left p-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t.admin.userTable.user}</th>
                  <th className="text-left p-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t.admin.userTable.role}</th>
                  <th className="text-left p-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t.admin.userTable.org}</th>
                  <th className="text-left p-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t.admin.userTable.joined}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/10">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="p-12 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <Clock className="h-8 w-8 text-primary animate-spin" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground animate-pulse">Sincronizando Usuarios...</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredUsers.map((user, idx) => (
                  <tr key={idx} className="hover:bg-secondary/20 transition-colors group">
                    <td className="p-6">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-10 w-10 border-2 border-primary/20 rounded-xl">
                          <AvatarImage src={`https://picsum.photos/seed/${user.uid}/100`} />
                          <AvatarFallback className="font-bold">{user.displayName?.[0] || 'U'}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="font-black text-sm text-foreground uppercase tracking-tight truncate">{user.displayName}</p>
                          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-6">
                      <Badge className={`uppercase tracking-widest font-black text-[9px] px-3 py-1 border shadow-sm ${roleColors[user.role]}`}>
                        {roleLabels[user.role] || user.role}
                      </Badge>
                    </td>
                    <td className="p-6">
                      <div className="flex items-center gap-2">
                        <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-xs font-medium text-foreground">{user.organization || 'ScoutPro Network'}</span>
                      </div>
                    </td>
                    <td className="p-6">
                      <span className="text-xs text-muted-foreground">
                        {user.createdAt ? new Date(user.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}
                      </span>
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

function AdminStatCard({ title, value, icon, subtitle }: { title: string, value: string, icon: any, subtitle: string }) {
  return (
    <Card className="border-border/40 bg-card/40 backdrop-blur-sm p-6 hover:border-primary/40 transition-all rounded-2xl relative overflow-hidden">
      <div className="absolute top-4 right-4 opacity-10">{React.cloneElement(icon, { size: 32 })}</div>
      <div className="space-y-4">
        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">{title}</p>
        <div className="space-y-0.5">
          <p className="text-4xl font-black font-headline text-foreground">{value}</p>
          <p className="text-[10px] font-bold text-accent uppercase tracking-widest">{subtitle}</p>
        </div>
      </div>
    </Card>
  );
}
