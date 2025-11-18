import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, CheckCircle, Clock, MapPin } from 'lucide-react';

interface DashboardStats {
  totalPlayers: number;
  totalSubmissions: number;
  pendingSubmissions: number;
  completedMissions: number;
  keysCollected: {
    eau: number;
    temps: number;
    air: number;
    feu: number;
  };
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalPlayers: 0,
    totalSubmissions: 0,
    pendingSubmissions: 0,
    completedMissions: 0,
    keysCollected: { eau: 0, temps: 0, air: 0, feu: 0 }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      // Total players
      const { count: playersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Total submissions
      const { count: submissionsCount } = await supabase
        .from('submissions')
        .select('*', { count: 'exact', head: true });

      // Pending submissions
      const { count: pendingCount } = await supabase
        .from('submissions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      // Completed missions
      const { count: completedCount } = await supabase
        .from('missions_progress')
        .select('*', { count: 'exact', head: true })
        .eq('completed', true);

      // Keys collected by type
      const { data: keysData } = await supabase
        .from('keys_collected')
        .select('key_type');

      const keysCounts = {
        eau: keysData?.filter(k => k.key_type === 'eau').length || 0,
        temps: keysData?.filter(k => k.key_type === 'temps').length || 0,
        air: keysData?.filter(k => k.key_type === 'air').length || 0,
        feu: keysData?.filter(k => k.key_type === 'feu').length || 0
      };

      setStats({
        totalPlayers: playersCount || 0,
        totalSubmissions: submissionsCount || 0,
        pendingSubmissions: pendingCount || 0,
        completedMissions: completedCount || 0,
        keysCollected: keysCounts
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Chargement des statistiques...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Joueurs Total</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPlayers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Soumissions en attente</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingSubmissions}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Missions complétées</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedMissions}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Soumissions</CardTitle>
            <MapPin className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSubmissions}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Clés Collectées</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-3xl mb-1">💧</div>
              <div className="text-sm text-muted-foreground">Eau</div>
              <div className="text-xl font-bold">{stats.keysCollected.eau}</div>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-1">⏰</div>
              <div className="text-sm text-muted-foreground">Temps</div>
              <div className="text-xl font-bold">{stats.keysCollected.temps}</div>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-1">🌬️</div>
              <div className="text-sm text-muted-foreground">Air</div>
              <div className="text-xl font-bold">{stats.keysCollected.air}</div>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-1">🔥</div>
              <div className="text-sm text-muted-foreground">Feu</div>
              <div className="text-xl font-bold">{stats.keysCollected.feu}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
