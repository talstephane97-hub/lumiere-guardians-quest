import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Camera, Upload, Loader2 } from 'lucide-react';
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
    instructions: 'Photographiez le mascaron près du Pont-Neuf.',
  },
  {
    id: 'pantheon',
    day: 1,
    title: 'Panthéon - Le Pendule de Foucault',
    location: 'Place du Panthéon, Paris 5e',
    description: 'Répondez au quiz sur les illustres personnages',
    keyReward: 'temps',
    instructions: 'Visitez le Panthéon et photographiez le Pendule.',
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
    instructions: 'Prenez une photo du mot "Paix" avec la Tour Eiffel.',
  },
  {
    id: 'place-vendome',
    day: 3,
    title: 'Place Vendôme - Le Cadran Solaire',
    location: 'Place Vendôme, Paris 1er',
    description: 'Notez le numéro indiqué par l\'ombre',
    keyReward: 'feu',
    instructions: 'Photographiez un reflet du soleil sur la colonne.',
  },
  {
    id: 'arc-triomphe',
    day: 3,
    title: 'Arc de Triomphe - La Flamme Éternelle',
    location: 'Place Charles de Gaulle, Paris 8e',
    description: 'Assemblez les 4 clés pour raviver la Lumière',
    keyReward: null,
    instructions: 'Flamme du Soldat inconnu. Rallumez la Lumière de Paris.',
  },
];

const MissionsList = ({ userId, onKeyCollected }: MissionsListProps) => {
  const { toast } = useToast();
  const [completedMissions, setCompletedMissions] = useState<string[]>([]);
  const [uploadingMission, setUploadingMission] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<Record<string, File>>({});
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

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

  const handleFileSelect = (missionId: string, file: File) => {
    setSelectedFiles((prev) => ({ ...prev, [missionId]: file }));
  };

  const handleUploadPhoto = async (missionId: string) => {
    const file = selectedFiles[missionId];
    if (!file) {
      toast({
        title: 'Aucune photo sélectionnée',
        description: 'Veuillez sélectionner une photo à envoyer.',
        variant: 'destructive',
      });
      return;
    }

    setUploadingMission(missionId);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${missionId}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('mission-proofs')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('mission-proofs')
        .getPublicUrl(fileName);

      const { error: submissionError } = await supabase
        .from('submissions')
        .insert({
          user_id: userId,
          mission_id: missionId,
          type: 'photo',
          photo_url: publicUrl,
        });

      if (submissionError) throw submissionError;

      toast({
        title: 'Photo envoyée !',
        description: 'Votre preuve a été soumise pour validation.',
      });

      setSelectedFiles((prev) => {
        const newFiles = { ...prev };
        delete newFiles[missionId];
        return newFiles;
      });

      if (fileInputRefs.current[missionId]) {
        fileInputRefs.current[missionId]!.value = '';
      }

    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: 'Erreur d\'envoi',
        description: error.message || 'Impossible d\'envoyer la photo',
        variant: 'destructive',
      });
    }

    setUploadingMission(null);
  };

  const isCompleted = (missionId: string) => completedMissions.includes(missionId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Vos Missions</h2>
        <Badge variant="outline" className="text-sm">
          {completedMissions.length}/{MISSIONS.length} terminées
        </Badge>
      </div>

      <div className="space-y-4">
        {MISSIONS.map((mission) => {
          const completed = isCompleted(mission.id);
          const uploading = uploadingMission === mission.id;
          const hasFile = !!selectedFiles[mission.id];

          return (
            <Card
              key={mission.id}
              className={`p-6 transition-all ${
                completed
                  ? 'bg-primary/5 border-primary/30'
                  : 'bg-card hover:border-primary/40'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-foreground">{mission.title}</h3>
                    {completed && <CheckCircle2 className="w-6 h-6 text-green-600" />}
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">{mission.location}</p>
                  <p className="text-foreground mb-3">{mission.description}</p>
                  <p className="text-sm text-muted-foreground italic">{mission.instructions}</p>
                </div>
                <Badge variant={completed ? 'default' : 'secondary'} className="ml-4 whitespace-nowrap">
                  Jour {mission.day}
                </Badge>
              </div>

              {mission.keyReward && (
                <div className="mb-4 p-3 bg-primary/10 rounded-lg border border-primary/30">
                  <p className="text-sm font-medium text-primary">
                    🔑 Récompense : Clé {mission.keyReward.charAt(0).toUpperCase() + mission.keyReward.slice(1)}
                  </p>
                </div>
              )}

              {!completed && (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <input
                      ref={(el) => (fileInputRefs.current[mission.id] = el)}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileSelect(mission.id, file);
                      }}
                      className="hidden"
                      id={`file-${mission.id}`}
                    />
                    <label htmlFor={`file-${mission.id}`} className="flex-1 cursor-pointer">
                      <div className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-primary/40 rounded-lg bg-background hover:bg-primary/5 transition-colors">
                        <Camera className="w-5 h-5 text-primary" />
                        <span className="text-sm font-medium text-foreground">
                          {hasFile ? selectedFiles[mission.id].name : 'Prendre une photo'}
                        </span>
                      </div>
                    </label>
                  </div>

                  <Button onClick={() => handleUploadPhoto(mission.id)} disabled={!hasFile || uploading} className="w-full">
                    {uploading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Envoi en cours...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Envoyer la preuve
                      </>
                    )}
                  </Button>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default MissionsList;
