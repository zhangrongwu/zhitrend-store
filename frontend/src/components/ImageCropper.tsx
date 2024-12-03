import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';

interface Point {
  x: number;
  y: number;
}

interface Area {
  width: number;
  height: number;
  x: number;
  y: number;
}

interface ImageCropperProps {
  image: string;
  onCropComplete?: (croppedArea: Area, croppedAreaPixels: Area) => void;
  aspect?: number;
}

export default function ImageCropper({ image, onCropComplete, aspect = 1 }: ImageCropperProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);

  const handleCropComplete = useCallback(
    (croppedArea: Area, croppedAreaPixels: Area) => {
      onCropComplete?.(croppedArea, croppedAreaPixels);
    },
    [onCropComplete]
  );

  return (
    <div className="relative h-96">
      <Cropper
        image={image}
        crop={crop}
        zoom={zoom}
        aspect={aspect}
        onCropChange={setCrop}
        onZoomChange={setZoom}
        onCropComplete={handleCropComplete}
      />
    </div>
  );
} 