import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Map, Plus, Save, Trash2 } from 'lucide-react';
import { Label } from '@/components/ui/label';

interface Mission {
  mission_id: string;
  day: number;
  order_index: number;
  title: string;
  ai_validation_prompt: string | null;
  location_lat: number | null;
  location_lng: number | null;
  radius_meters: number | null;
  code_verb: string | null;
}

const MissionManagement = () => {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [editingMission, setEditingMission] = useState<Mission | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadMissions();
  }, []);

  const loadMissions = async () => {
    try {
      const { data, error } = await supabase
        .from('mission_configs')
        .select('*')
        .order('day', { ascending: true })
        .order('order_index', { ascending: true });

      if (error) throw error;
      setMissions(data || []);
    } catch (error) {
      console.error('Error loading missions:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les missions',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const saveMission = async () => {
    if (!editingMission) return;

    try {
      const { error } = await supabase
        .from('mission_configs')
        .update({
          title: editingMission.title,
          ai_validation_prompt: editingMission.ai_validation_prompt,
          location_lat: editingMission.location_lat,
          location_lng: editingMission.location_lng,
          radius_meters: editingMission.radius_meters,
          code_verb: editingMission.code_verb
        })
        .eq('mission_id', editingMission.mission_id);

      if (error) throw error;

      toast({
        title: 'Mission sauvegardée',
        description: 'Les modifications ont été enregistrées'
      });

      setEditingMission(null);
      loadMissions();
    } catch (error) {
      console.error('Error saving mission:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de sauvegarder la mission',
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return <div className="text-center py-8">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Map className="w-5 h-5" />
            Gestion des Missions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {missions.map((mission) => (
            <Card key={mission.mission_id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">
                      Jour {mission.day} - Mission {mission.order_index + 1}
                    </h3>
                    <p className="text-sm text-muted-foreground">{mission.title}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingMission(editingMission?.mission_id === mission.mission_id ? null : mission)}
                  >
                    {editingMission?.mission_id === mission.mission_id ? 'Annuler' : 'Modifier'}
                  </Button>
                </div>
              </CardHeader>
              
              {editingMission?.mission_id === mission.mission_id && (
                <CardContent className="space-y-4">
                  <div>
                    <Label>Titre de la mission</Label>
                    <Input
                      value={editingMission.title}
                      onChange={(e) => setEditingMission({ ...editingMission, title: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label>Code-verbe</Label>
                    <Input
                      value={editingMission.code_verb || ''}
                      onChange={(e) => setEditingMission({ ...editingMission, code_verb: e.target.value })}
                      placeholder="Mot ou phrase narratif"
                    />
                  </div>

                  <div>
                    <Label>Prompt de validation IA (description photo attendue)</Label>
                    <Textarea
                      value={editingMission.ai_validation_prompt || ''}
                      onChange={(e) => setEditingMission({ ...editingMission, ai_validation_prompt: e.target.value })}
                      rows={3}
                      placeholder="Décrivez ce que la photo doit montrer..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Latitude</Label>
                      <Input
                        type="number"
                        step="0.000001"
                        value={editingMission.location_lat || ''}
                        onChange={(e) => setEditingMission({ ...editingMission, location_lat: parseFloat(e.target.value) })}
                      />
                    </div>
                    <div>
                      <Label>Longitude</Label>
                      <Input
                        type="number"
                        step="0.000001"
                        value={editingMission.location_lng || ''}
                        onChange={(e) => setEditingMission({ ...editingMission, location_lng: parseFloat(e.target.value) })}
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Rayon de validation (mètres)</Label>
                    <Input
                      type="number"
                      value={editingMission.radius_meters || 100}
                      onChange={(e) => setEditingMission({ ...editingMission, radius_meters: parseInt(e.target.value) })}
                    />
                  </div>

                  <Button onClick={saveMission} className="w-full">
                    <Save className="w-4 h-4 mr-2" />
                    Sauvegarder les modifications
                  </Button>
                </CardContent>
              )}
            </Card>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default MissionManagement;
