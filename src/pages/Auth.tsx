import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Sparkles, Loader2 } from 'lucide-react';

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [teamName, setTeamName] = useState('');

  useEffect(() => {
    // Vérifier si déjà connecté
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/dashboard');
      }
    });
  }, [navigate]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: {
              team_name: teamName,
            },
          },
        });

        if (error) throw error;

        toast({
          title: "Bienvenue, Gardien !",
          description: "Votre compte a été créé. Connectez-vous pour commencer.",
        });
        setIsSignUp(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        toast({
          title: "Bon retour, Gardien !",
          description: "La Lumière vous attend.",
        });
        navigate('/dashboard');
      }
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur s'est produite",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Sparkles className="w-12 h-12 text-primary mx-auto mb-4 drop-shadow-[0_0_20px_hsl(43,96%,56%)]" />
          <h1 className="text-3xl font-bold text-primary mb-2">
            {isSignUp ? "Devenir Gardien" : "Retour à la Lumière"}
          </h1>
          <p className="text-muted-foreground">
            {isSignUp 
              ? "Créez votre compte pour commencer l'aventure"
              : "Connectez-vous pour continuer votre quête"
            }
          </p>
        </div>

        <form onSubmit={handleAuth} className="bg-card rounded-xl p-8 border border-primary/20 shadow-[0_0_30px_hsl(43,96%,56%,0.1)]">
          {isSignUp && (
            <div className="mb-4">
              <Label htmlFor="teamName" className="text-foreground">
                Nom d'équipe
              </Label>
              <Input
                id="teamName"
                type="text"
                placeholder="Les Éclaireurs de Paris"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                className="mt-2 bg-background border-border"
                required
              />
            </div>
          )}

          <div className="mb-4">
            <Label htmlFor="email" className="text-foreground">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="gardien@paris.fr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 bg-background border-border"
              required
            />
          </div>

          <div className="mb-6">
            <Label htmlFor="password" className="text-foreground">
              Mot de passe
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 bg-background border-border"
              required
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_20px_hsl(43,96%,56%,0.3)]"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connexion en cours...
              </>
            ) : (
              isSignUp ? "Créer mon compte" : "Se connecter"
            )}
          </Button>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm text-primary hover:text-primary/80 transition-colors"
            >
              {isSignUp 
                ? "Déjà Gardien ? Connectez-vous" 
                : "Nouveau Gardien ? Créez un compte"
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Auth;