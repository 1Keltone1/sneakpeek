export interface ShoeConfig {
  id: string;
  name: string;
  brand: string;
  modelPath: string;
  image: string; 
  scale: number;
}

export const SHOES: ShoeConfig[] = [
  {
    id: 'nike',
    name: 'Sneakers',
    brand: 'Nike',
    modelPath: 'models/nike.glb',
    image: 'pictures/nike.png', 
    scale: 400, 
  },
  {
    id: 'boot',
    name: 'Classic Boot',
    brand: 'Timberland',
    modelPath: 'models/boot.glb',
    image: 'pictures/boot.png', 
    scale: 350, 
  },
  {
    id: 'harrison',
    name: 'Classic Boot',
    brand: 'Harrison',
    modelPath: 'models/harrison.glb',
    image: 'pictures/harrison.png', 
    scale: 350, 
  },
];