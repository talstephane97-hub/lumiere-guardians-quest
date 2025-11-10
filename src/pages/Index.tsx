import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import heroImage from '@/assets/hero-paris.jpg';

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative h-screen overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImage})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background" />
        </div>
        
        <div className="relative z-10 flex flex-col items-center justify-center h-full px-6 text-center">
          <div className="animate-float">
            <Sparkles className="w-16 h-16 text-primary mb-6 mx-auto drop-shadow-[0_0_20px_hsl(43,96%,56%)]" />
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-pulse-glow">
            Les Gardiens de la<br />Lumière de Paris
          </h1>
          
          <p className="text-lg md:text-xl text-foreground/90 max-w-2xl mb-8 leading-relaxed">
            Embarquez dans une quête urbaine mystique à travers Paris.
            Collectez les 4 clés élémentaires et ravivez la Lumière de la Ville.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={() => navigate('/auth')}
              size="lg"
              className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_30px_hsl(43,96%,56%,0.3)] hover:shadow-[0_0_50px_hsl(43,96%,56%,0.5)] transition-all duration-300 text-lg px-8"
            >
              Commencer l'Aventure
            </Button>
            
            <Button
              onClick={() => navigate('/about')}
              size="lg"
              variant="outline"
              className="border-primary/50 text-primary hover:bg-primary/10 text-lg px-8"
            >
              En savoir plus
            </Button>
          </div>
        </div>
      </div>

      {/* Mission Preview */}
      <div className="container mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4 text-primary">Un Parcours Régénératif</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            3 jours. 4 clés élémentaires. Une ville à reconnecter.
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="bg-card rounded-xl p-8 border border-primary/20 hover:border-primary/40 transition-all hover:shadow-[0_0_20px_hsl(43,96%,56%,0.2)]">
            <div className="text-6xl mb-4">🌊</div>
            <h3 className="text-2xl font-bold mb-3 text-primary">Jour 1</h3>
            <p className="text-foreground/80">L'Éveil de la Terre</p>
            <p className="text-sm text-muted-foreground mt-2">
              Pont-Neuf, Panthéon - Collectez les clés de l'Eau et du Temps
            </p>
          </div>
          
          <div className="bg-card rounded-xl p-8 border border-accent/20 hover:border-accent/40 transition-all hover:shadow-[0_0_20px_hsl(217,91%,60%,0.2)]">
            <div className="text-6xl mb-4">💨</div>
            <h3 className="text-2xl font-bold mb-3 text-accent">Jour 2</h3>
            <p className="text-foreground/80">Les Mémoires de l'Air</p>
            <p className="text-sm text-muted-foreground mt-2">
              Musée d'Orsay, Tour Eiffel - Découvrez la clé de l'Air
            </p>
          </div>
          
          <div className="bg-card rounded-xl p-8 border border-secondary/20 hover:border-secondary/40 transition-all hover:shadow-[0_0_20px_hsl(162,63%,41%,0.2)]">
            <div className="text-6xl mb-4">🔥</div>
            <h3 className="text-2xl font-bold mb-3 text-secondary">Jour 3</h3>
            <p className="text-foreground/80">La Renaissance du Feu</p>
            <p className="text-sm text-muted-foreground mt-2">
              Place Vendôme, Arc de Triomphe - Rallumez la Lumière
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        
        @keyframes pulse-glow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        
        .animate-pulse-glow {
          animation: pulse-glow 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default Index;