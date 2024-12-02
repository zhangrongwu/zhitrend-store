import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface HoverProps {
  children: ReactNode;
  scale?: number;
  rotate?: number;
  duration?: number;
}

export default function Hover({
  children,
  scale = 1.05,
  rotate = 0,
  duration = 0.3
}: HoverProps) {
  return (
    <motion.div
      whileHover={{
        scale,
        rotate,
        transition: { duration },
      }}
    >
      {children}
    </motion.div>
  );
} 