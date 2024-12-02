import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface SpringProps {
  children: ReactNode;
  delay?: number;
  stiffness?: number;
  damping?: number;
}

export default function Spring({
  children,
  delay = 0,
  stiffness = 100,
  damping = 10
}: SpringProps) {
  return (
    <motion.div
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{
        type: 'spring',
        stiffness,
        damping,
        delay,
      }}
    >
      {children}
    </motion.div>
  );
} 