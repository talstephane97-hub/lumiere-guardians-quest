import keyWater from '@/assets/key-water.png';
import keyTime from '@/assets/key-time.png';
import keyAir from '@/assets/key-air.png';
import keyFire from '@/assets/key-fire.png';

interface KeysInventoryProps {
  keys: string[];
}

const KEYS_DATA = {
  eau: { name: 'Clé de l\'Eau', image: keyWater, color: 'from-blue-500 to-cyan-400' },
  temps: { name: 'Clé du Temps', image: keyTime, color: 'from-purple-500 to-pink-400' },
  air: { name: 'Clé de l\'Air', image: keyAir, color: 'from-sky-400 to-blue-300' },
  feu: { name: 'Clé du Feu', image: keyFire, color: 'from-orange-500 to-yellow-400' },
};

const KeysInventory = ({ keys }: KeysInventoryProps) => {
  return (
    <div className="bg-card rounded-xl p-6 border border-primary/20 shadow-[0_0_20px_hsl(43,96%,56%,0.1)]">
      <h2 className="text-2xl font-bold mb-6 text-primary">Clés Élémentaires</h2>
      
      <div className="space-y-4">
        {Object.entries(KEYS_DATA).map(([keyType, data]) => {
          const collected = keys.includes(keyType);
          
          return (
            <div
              key={keyType}
              className={`relative rounded-lg p-4 border transition-all duration-300 ${
                collected
                  ? 'border-primary/50 bg-gradient-to-br ' + data.color + ' shadow-[0_0_15px_hsl(43,96%,56%,0.3)]'
                  : 'border-muted/30 bg-muted/20 opacity-50'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                  collected ? 'bg-white/90' : 'bg-muted'
                }`}>
                  <img
                    src={data.image}
                    alt={data.name}
                    className={`w-12 h-12 ${collected ? '' : 'grayscale opacity-50'}`}
                  />
                </div>
                <div className="flex-1">
                  <h3 className={`font-bold ${collected ? 'text-white' : 'text-muted-foreground'}`}>
                    {data.name}
                  </h3>
                  <p className={`text-sm ${collected ? 'text-white/90' : 'text-muted-foreground'}`}>
                    {collected ? 'Collectée ✨' : 'Non collectée'}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 pt-6 border-t border-primary/20">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Progression</span>
          <span className="text-primary font-bold">{keys.length}/4</span>
        </div>
        <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
            style={{ width: `${(keys.length / 4) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default KeysInventory;