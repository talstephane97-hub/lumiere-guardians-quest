import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MapPin } from 'lucide-react';

interface MapboxConfigProps {
  onTokenSet: (token: string) => void;
}

const MapboxConfig = ({ onTokenSet }: MapboxConfigProps) => {
  const [token, setToken] = useState('');

  return (
    <Card className="p-6 max-w-md mx-auto mt-8">
      <div className="flex items-center gap-3 mb-4">
        <MapPin className="w-6 h-6 text-primary" />
        <h3 className="text-lg font-bold text-foreground">Configuration Mapbox</h3>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Pour activer la carte interactive, veuillez entrer votre token Mapbox public.
        Vous pouvez l'obtenir sur{' '}
        <a
          href="https://mapbox.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          mapbox.com
        </a>
      </p>
      <div className="space-y-3">
        <Input
          type="text"
          placeholder="pk.eyJ1Ijoi..."
          value={token}
          onChange={(e) => setToken(e.target.value)}
          className="font-mono text-sm"
        />
        <Button
          onClick={() => token && onTokenSet(token)}
          disabled={!token}
          className="w-full"
        >
          Activer la carte
        </Button>
      </div>
    </Card>
  );
};

export default MapboxConfig;
