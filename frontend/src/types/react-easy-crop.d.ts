declare module 'react-easy-crop' {
  import { ComponentType } from 'react';

  export interface Point {
    x: number;
    y: number;
  }

  export interface Area {
    width: number;
    height: number;
    x: number;
    y: number;
  }

  export interface CropperProps {
    image: string;
    crop: Point;
    zoom: number;
    aspect: number;
    onCropChange: (location: Point) => void;
    onZoomChange: (zoom: number) => void;
    onCropComplete?: (croppedArea: Area, croppedAreaPixels: Area) => void;
  }

  const Cropper: ComponentType<CropperProps>;
  export default Cropper;
} 