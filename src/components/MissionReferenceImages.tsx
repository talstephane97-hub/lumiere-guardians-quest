import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Upload, Trash2, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Label } from '@/components/ui/label';

interface ReferenceImage {
  id: string;
  mission_id: string;
  image_url: string;
  tags: string[] | null;
  created_at: string;
}

interface Props {
  missionId: string;
}

const MissionReferenceImages = ({ missionId }: Props) => {
  const [images, setImages] = useState<ReferenceImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadImages();
  }, [missionId]);

  const loadImages = async () => {
    try {
      const { data, error } = await supabase
        .from('mission_reference_images')
        .select('*')
        .eq('mission_id', missionId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setImages(data || []);
    } catch (error) {
      console.error('Error loading images:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Erreur',
        description: 'Seules les images sont acceptées',
        variant: 'destructive'
      });
      return;
    }

    // Validate file size (max 8MB)
    if (file.size > 8 * 1024 * 1024) {
      toast({
        title: 'Erreur',
        description: 'Taille maximale : 8 MB',
        variant: 'destructive'
      });
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${missionId}/${Date.now()}.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('mission-references')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('mission-references')
        .getPublicUrl(fileName);

      // Save to database
      const { error: dbError } = await supabase
        .from('mission_reference_images')
        .insert({
          mission_id: missionId,
          image_url: publicUrl,
          tags: []
        });

      if (dbError) throw dbError;

      toast({
        title: 'Image ajoutée',
        description: 'L\'image de référence a été ajoutée avec succès'
      });

      loadImages();
      event.target.value = ''; // Reset input
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible d\'ajouter l\'image',
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (imageId: string, imageUrl: string) => {
    if (!confirm('Supprimer cette image de référence ?')) return;

    try {
      // Extract file path from URL
      const urlParts = imageUrl.split('/');
      const filePath = urlParts.slice(-2).join('/');

      // Delete from storage
      await supabase.storage
        .from('mission-references')
        .remove([filePath]);

      // Delete from database
      const { error } = await supabase
        .from('mission_reference_images')
        .delete()
        .eq('id', imageId);

      if (error) throw error;

      toast({
        title: 'Image supprimée',
        description: 'L\'image de référence a été supprimée'
      });

      loadImages();
    } catch (error: any) {
      console.error('Error deleting image:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de supprimer l\'image',
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return <div className="text-center py-4"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <ImageIcon className="w-5 h-5" />
          Images de Référence ({images.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor={`upload-${missionId}`} className="block mb-2">
            Ajouter une image de référence
          </Label>
          <div className="flex gap-2">
            <Input
              id={`upload-${missionId}`}
              type="file"
              accept="image/*"
              onChange={handleUpload}
              disabled={uploading}
              className="flex-1"
            />
            {uploading && <Loader2 className="w-6 h-6 animate-spin" />}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Formats acceptés : JPG, PNG, WEBP • Taille max : 8 MB
          </p>
        </div>

        {images.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {images.map((image) => (
              <div key={image.id} className="relative group">
                <img
                  src={image.image_url}
                  alt="Référence"
                  className="w-full h-32 object-cover rounded-lg border border-border"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleDelete(image.id, image.image_url)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8">
            Aucune image de référence. Ajoutez-en pour activer la reconnaissance automatique.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default MissionReferenceImages;
