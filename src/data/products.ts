export interface Product {
  id: string;
  name: string;
  description: string;
  price: string;
  image: string;
}

export const products: Product[] = [
  {
    id: 'aurora-bed',
    name: 'Aurora',
    description: 'Sculptural upholstered bed with flowing curves and whisper-soft linen.',
    price: '$4,200',
    image: '/images/product-1.jpg',
  },
  {
    id: 'serenity-bed',
    name: 'Serenity',
    description: 'Low-profile platform bed in hand-finished solid oak with woven details.',
    price: '$3,800',
    image: '/images/product-2.jpg',
  },
  {
    id: 'haven-bed',
    name: 'Haven',
    description: 'Canopy bed reimagined with minimalist steel frame and natural linen draping.',
    price: '$5,600',
    image: '/images/product-3.jpg',
  },
  {
    id: 'drift-bed',
    name: 'Drift',
    description: 'Floating bed frame with hidden storage and integrated ambient lighting.',
    price: '$4,900',
    image: '/images/product-4.jpg',
  },
  {
    id: 'terra-bed',
    name: 'Terra',
    description: 'Solid walnut bed with hand-carved headboard inspired by natural formations.',
    price: '$6,200',
    image: '/images/product-5.jpg',
  },
  {
    id: 'luna-bed',
    name: 'Luna',
    description: 'Boucle-wrapped bed with soft rounded edges and cloud-like cushioning.',
    price: '$3,500',
    image: '/images/product-6.jpg',
  },
];
