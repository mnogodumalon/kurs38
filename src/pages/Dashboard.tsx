import { useState, useEffect, useMemo } from 'react';
import { BookOpen, GraduationCap, Users, Building2, ClipboardList, Euro, Check } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatCard } from '@/components/StatCard';
import { DozentenTab } from '@/components/tabs/DozentenTab';
import { RaeumeTab } from '@/components/tabs/RaeumeTab';
import { TeilnehmerTab } from '@/components/tabs/TeilnehmerTab';
import { KurseTab } from '@/components/tabs/KurseTab';
import { AnmeldungenTab } from '@/components/tabs/AnmeldungenTab';
import { LivingAppsService } from '@/services/livingAppsService';
import type { Dozenten, Raeume, Teilnehmer, Kurse, Anmeldungen } from '@/types/app';

export default function Dashboard() {
  const [dozenten, setDozenten] = useState<Dozenten[]>([]);
  const [raeume, setRaeume] = useState<Raeume[]>([]);
  const [teilnehmer, setTeilnehmer] = useState<Teilnehmer[]>([]);
  const [kurse, setKurse] = useState<Kurse[]>([]);
  const [anmeldungen, setAnmeldungen] = useState<Anmeldungen[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('kurse');

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [d, r, t, k, a] = await Promise.all([
        LivingAppsService.getDozenten(),
        LivingAppsService.getRaeume(),
        LivingAppsService.getTeilnehmer(),
        LivingAppsService.getKurse(),
        LivingAppsService.getAnmeldungen(),
      ]);
      setDozenten(d);
      setRaeume(r);
      setTeilnehmer(t);
      setKurse(k);
      setAnmeldungen(a);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const stats = useMemo(() => {
    const totalRevenue = anmeldungen.reduce((sum, a) => {
      if (!a.fields.bezahlt) return sum;
      const kursId = a.fields.kurs?.match(/([a-f0-9]{24})$/i)?.[1];
      const kurs = kurse.find(k => k.record_id === kursId);
      return sum + (kurs?.fields.preis || 0);
    }, 0);

    const paidCount = anmeldungen.filter(a => a.fields.bezahlt).length;

    return {
      totalRevenue,
      paidCount,
    };
  }, [anmeldungen, kurse]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="size-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Lade Daten...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="page-header">
          <h1 className="page-title">Kursverwaltung</h1>
          <p className="page-subtitle">Verwalten Sie Kurse, Dozenten, Teilnehmer und Anmeldungen</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <StatCard
            label="Einnahmen (bezahlt)"
            value={`${stats.totalRevenue.toFixed(0)} €`}
            icon={<Euro className="size-5 text-primary-foreground" />}
            hero
          />
          <StatCard
            label="Kurse"
            value={kurse.length}
            icon={<BookOpen className="size-5 text-primary" />}
          />
          <StatCard
            label="Dozenten"
            value={dozenten.length}
            icon={<GraduationCap className="size-5 text-primary" />}
          />
          <StatCard
            label="Teilnehmer"
            value={teilnehmer.length}
            icon={<Users className="size-5 text-primary" />}
          />
          <StatCard
            label="Räume"
            value={raeume.length}
            icon={<Building2 className="size-5 text-primary" />}
          />
          <StatCard
            label="Anmeldungen"
            value={`${stats.paidCount}/${anmeldungen.length}`}
            icon={<Check className="size-5 text-primary" />}
          />
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="kurse" className="gap-1.5">
              <BookOpen className="size-4" />
              Kurse
            </TabsTrigger>
            <TabsTrigger value="dozenten" className="gap-1.5">
              <GraduationCap className="size-4" />
              Dozenten
            </TabsTrigger>
            <TabsTrigger value="teilnehmer" className="gap-1.5">
              <Users className="size-4" />
              Teilnehmer
            </TabsTrigger>
            <TabsTrigger value="raeume" className="gap-1.5">
              <Building2 className="size-4" />
              Räume
            </TabsTrigger>
            <TabsTrigger value="anmeldungen" className="gap-1.5">
              <ClipboardList className="size-4" />
              Anmeldungen
            </TabsTrigger>
          </TabsList>

          <TabsContent value="kurse">
            <KurseTab
              kurse={kurse}
              dozenten={dozenten}
              raeume={raeume}
              onRefresh={fetchAll}
            />
          </TabsContent>

          <TabsContent value="dozenten">
            <DozentenTab dozenten={dozenten} onRefresh={fetchAll} />
          </TabsContent>

          <TabsContent value="teilnehmer">
            <TeilnehmerTab teilnehmer={teilnehmer} onRefresh={fetchAll} />
          </TabsContent>

          <TabsContent value="raeume">
            <RaeumeTab raeume={raeume} onRefresh={fetchAll} />
          </TabsContent>

          <TabsContent value="anmeldungen">
            <AnmeldungenTab
              anmeldungen={anmeldungen}
              teilnehmer={teilnehmer}
              kurse={kurse}
              onRefresh={fetchAll}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
