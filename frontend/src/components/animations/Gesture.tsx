import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface GestureProps {
  children: ReactNode;
  whileTap?: {
    scale?: number;
    rotate?: number;
  };
  whileHover?: {
    scale?: number;
    rotate?: number;
  };
  drag?: boolean | 'x' | 'y';
  dragConstraints?: {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
  };
}

export default function Gesture({
  children,
  whileTap = { scale: 0.95 },
  whileHover = { scale: 1.05 },
  drag = false,
  dragConstraints
}: GestureProps) {
  return (
    <motion.div
      whileTap={whileTap}
      whileHover={whileHover}
      drag={drag}
      dragConstraints={dragConstraints}
      dragElastic={0.1}
    >
      {children}
    </motion.div>
  );
} 