import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, CheckCircle2, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MissionsListProps {
  userId: string;
  onKeyCollected: (key: string) => void;
}

const MISSIONS = [
  {
    id: 'pont-neuf',
    day: 1,
    title: 'Pont-Neuf - Le Mascaron Soufflant',
    location: 'Pont-Neuf, Paris 1er',
    description: 'Trouvez le mascaron qui souffle sur la Seine',
    keyReward: 'eau',
    instructions: 'Scannez le QR code près du mascaron ou entrez le code trouvé.',
  },
  {
    id: 'pantheon',
    day: 1,
    title: 'Panthéon - Le Pendule de Foucault',
    location: 'Place du Panthéon, Paris 5e',
    description: 'Répondez au quiz sur les illustres personnages',
    keyReward: 'temps',
    instructions: 'Visitez le Panthéon et répondez aux questions sur Marie Curie et Voltaire.',
  },
  {
    id: 'musee-orsay',
    day: 2,
    title: 'Musée d\'Orsay - Renaissance Étoilée',
    location: '1 Rue de la Légion d\'Honneur, Paris 7e',
    description: 'Trouvez l\'œuvre de Van Gogh liée à la renaissance',
    keyReward: null,
    instructions: 'Cherchez "La Nuit étoilée" ou une œuvre similaire.',
  },
  {
    id: 'tour-eiffel',
    day: 2,
    title: 'Tour Eiffel - Le Mur pour la Paix',
    location: 'Champ de Mars, Paris 7e',
    description: 'Photo avec "Paix" + Tour Eiffel en reflet',
    keyReward: 'air',
    instructions: 'Prenez une photo du mot "Paix" dans votre langue avec la Tour Eiffel en arrière-plan.',
  },
  {
    id: 'place-vendome',
    day: 3,
    title: 'Place Vendôme - Le Cadran Solaire',
    location: 'Place Vendôme, Paris 1er',
    description: 'Notez le numéro indiqué par l\'ombre à l\'heure précise',
    keyReward: 'feu',
    instructions: 'Observez la colonne comme cadran solaire et photographiez un reflet du soleil.',
  },
  {
    id: 'arc-triomphe',
    day: 3,
    title: 'Arc de Triomphe - La Flamme Éternelle',
    location: 'Place Charles de Gaulle, Paris 8e',
    description: 'Assemblez les 4 clés pour raviver la Lumière',
    keyReward: null,
    instructions: 'Flamme du Soldat inconnu + dalle de l\'Appel du 18 juin. Rallumez la Lumière de Paris.',
  },
];

const MissionsList = ({ userId, onKeyCollected }: MissionsListProps) => {
  const { toast } = useToast();
  const [completedMissions, setCompletedMissions] = useState<string[]>([]);

  useEffect(() => {
    loadProgress();
  }, [userId]);

  const loadProgress = async () => {
    const { data } = await supabase
      .from('missions_progress')
      .select('mission_id, completed')
      .eq('user_id', userId)
      .eq('completed', true);

    if (data) {
      setCompletedMissions(data.map((m) => m.mission_id));
    }
  };

  const handleCompleteMission = async (missionId: string, keyReward: string | null) => {
    const { error } = await supabase
      .from('missions_progress')
      .upsert({
        user_id: userId,
        mission_id: missionId,
        day: MISSIONS.find((m) => m.id === missionId)?.day || 1,
        completed: true,
        validated_at: new Date().toISOString(),
      });

    if (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de valider la mission',
        variant: 'destructive',
      });
      return;
    }

    // Collecter la clé si applicable
    if (keyReward) {
      const { error: keyError } = await supabase
        .from('keys_collected')
        .insert({
          user_id: userId,
          key_type: keyReward,
        });

      if (!keyError) {
        onKeyCollected(keyReward);
        toast({
          title: '✨ Clé collectée !',
          description: `La clé de ${keyReward} brille désormais dans votre inventaire.`,
        });
      }
    }

    setCompletedMissions([...completedMissions, missionId]);
    toast({
      title: 'Mission accomplie !',
      description: 'La Lumière grandit grâce à vous.',
    });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-primary mb-4">Missions</h2>

      {[1, 2, 3].map((day) => (
        <div key={day}>
          <div className="flex items-center gap-3 mb-4">
            <Badge variant="outline" className="text-lg px-4 py-1 border-primary/50 text-primary">
              Jour {day}
            </Badge>
          </div>

          <div className="space-y-4">
            {MISSIONS.filter((m) => m.day === day).map((mission) => {
              const completed = completedMissions.includes(mission.id);

              return (
                <Card
                  key={mission.id}
                  className={`p-6 border transition-all ${
                    completed
                      ? 'border-secondary/50 bg-secondary/10'
                      : 'border-primary/20 hover:border-primary/40 hover:shadow-[0_0_15px_hsl(43,96%,56%,0.1)]'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-foreground mb-1">
                        {mission.title}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        {mission.location}
                      </div>
                    </div>
                    {completed && <CheckCircle2 className="w-6 h-6 text-secondary" />}
                  </div>

                  <p className="text-foreground/80 mb-3">{mission.description}</p>
                  <p className="text-sm text-muted-foreground mb-4">{mission.instructions}</p>

                  {mission.keyReward && (
                    <Badge className="mb-4 bg-primary/20 text-primary border-primary/30">
                      Récompense : Clé de {mission.keyReward}
                    </Badge>
                  )}

                  {!completed && (
                    <Button
                      onClick={() => handleCompleteMission(mission.id, mission.keyReward)}
                      className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      Valider la mission
                    </Button>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default MissionsList;