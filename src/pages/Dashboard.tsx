import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Sparkles, LogOut, Shield } from 'lucide-react';
import KeysInventory from '@/components/KeysInventory';
import MissionsList from '@/components/MissionsList';
import GuardianChatbot from '@/components/GuardianChatbot';
import PlayerScoreDisplay from '@/components/PlayerScoreDisplay';
import type { User } from '@supabase/supabase-js';
import { uploadMissionProof } from '@/lib/missionSubmissions';
import { useGeolocation } from '@/hooks/use-geolocation';

// 🔹 Point cible exemple (à remplacer par tes vraies coordonnées plus tard)
const TARGET_LOCATION = {
  lat: 48.858370,
  lng: 2.294481,
};

const TARGET_RADIUS_METERS = 100;

function getDistanceFromLatLonInMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000;
  const toRad = (value: number) => (value * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [keysCollected, setKeysCollected] = useState<string[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);

  // Upload photo
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Géolocalisation
  const { coords, loading: geoLoading, error: geoError } = useGeolocation();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/auth');
        return;
      }

      setUser(session.user);

      // 💡 Pour le moment, on considère que tout utilisateur connecté est admin
      setIsAdmin(true);

      await loadKeys(session.user.id);
      setLoading(false);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_OUT') {
          navigate('/auth');
        }
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate]);

  const loadKeys = async (userId: string) => {
    const { data, error } = await supabase
      .from('keys_collected')
      .select('key_type')
      .eq('user_id', userId);

    if (!error && data) {
      setKeysCollected(data.map((k) => k.key_type));
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: "À bientôt, Gardien",
      description: "La Lumière vous attend pour votre retour.",
    });
  };

  const handleUploadMissionProof = async () => {
    if (!selectedFile) {
      setUploadError('Veuillez sélectionner une photo.');
      return;
    }

    if (!user) {
      setUploadError('Utilisateur non connecté.');
      return;
    }

    if (!coords) {
      setUploadError(
        "Impossible de récupérer ta position. Active la géolocalisation pour envoyer la photo."
      );
      return;
    }

    const distance = getDistanceFromLatLonInMeters(
      coords.lat,
      coords.lng,
      TARGET_LOCATION.lat,
      TARGET_LOCATION.lng
    );

    if (distance > TARGET_RADIUS_METERS) {
      setUploadError(
        `Tu es trop loin du lieu de la mission (~${Math.round(
          distance
        )} m). Rapproche-toi de la zone de mission.`
      );
      return;
    }

    try {
      setIsSubmitting(true);
      setUploadError(null);
      setUploadMessage(null);

      await uploadMissionProof({
        missionId: 'test-mission',
        userId: user.id,
        file: selectedFile,
      });

      setUploadMessage('Photo envoyée ! La mission est en attente de validation.');
      setSelectedFile(null);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setUploadError(err.message);
      } else {
        setUploadError("Une erreur est survenue pendant l'envoi.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-primary/20 sticky top-0 z-40 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-primary drop-shadow-[0_0_10px_hsl(43,96%,56%)]" />
            <h1 className="text-2xl font-bold text-primary">Tableau de Gardien</h1>
          </div>
          <div className="flex gap-2">
            {isAdmin && (
              <Button
                onClick={() => navigate('/admin')}
                variant="outline"
                className="border-primary/50 text-primary hover:bg-primary/10"
              >
                <Shield className="w-4 h-4 mr-2" />
                Admin
              </Button>
            )}
            <Button
              onClick={handleSignOut}
              variant="outline"
              className="border-primary/50 text-primary hover:bg-primary/10"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Déconnexion
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Keys Inventory */}
          <div className="lg:col-span-1">
            <KeysInventory keys={keysCollected} />
          </div>

          {/* Missions */}
          <div className="lg:col-span-2">
            <MissionsList
              userId={user?.id || ''}
              onKeyCollected={(key) => {
                setKeysCollected([...keysCollected, key]);
              }}
            />
          </div>
        </div>

        {/* Upload de preuve de mission */}
        <section className="mt-10 max-w-xl">
          <h2 className="text-lg font-semibold mb-2">
            Preuve de mission (photo)
          </h2>

          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0] ?? null;
              setSelectedFile(file);
              setUploadError(null);
              setUploadMessage(null);
            }}
            className="mb-3 block"
          />

          <Button
            onClick={handleUploadMissionProof}
            disabled={isSubmitting || !selectedFile}
            variant="outline"
          >
            {isSubmitting ? 'Envoi en cours...' : 'Envoyer la photo'}
          </Button>

          {uploadMessage && (
            <p className="text-sm text-green-600 mt-2">{uploadMessage}</p>
          )}
          {uploadError && (
            <p className="text-sm text-red-600 mt-2">{uploadError}</p>
          )}

          {geoLoading && (
            <p className="text-sm text-muted-foreground mt-2">
              Récupération de ta position...
            </p>
          )}

          {geoError && (
            <p className="text-sm text-red-600 mt-2">
              Géolocalisation désactivée : {geoError}
            </p>
          )}

          {coords && !geoError && (
            <p className="text-xs text-muted-foreground mt-2">
              Position détectée : {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
            </p>
          )}
        </section>
      </main>

      {/* Chatbot */}
      <GuardianChatbot 
        userId={user?.id || ''}
        userProgress={{
          currentDay: 1,
          keys: keysCollected,
        }}
      />
    </div>
  );
};

export default Dashboard;
