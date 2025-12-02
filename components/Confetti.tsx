'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ConfettiPiece {
  id: number;
  x: number;
  delay: number;
  duration: number;
  color: string;
  rotation: number;
}

const colors = [
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#10b981', // green
  '#f59e0b', // yellow
  '#ef4444', // red
  '#ec4899', // pink
];

export default function Confetti({ show, onComplete }: { show: boolean; onComplete?: () => void }) {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);

  useEffect(() => {
    if (show) {
      // Generate confetti pieces
      const newPieces: ConfettiPiece[] = [];
      for (let i = 0; i < 50; i++) {
        newPieces.push({
          id: i,
          x: Math.random() * 100, // % position
          delay: Math.random() * 0.3,
          duration: 2 + Math.random() * 2,
          color: colors[Math.floor(Math.random() * colors.length)],
          rotation: Math.random() * 360,
        });
      }
      setPieces(newPieces);

      // Clear after animation
      const timer = setTimeout(() => {
        setPieces([]);
        onComplete?.();
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  return (
    <AnimatePresence>
      {show && (
        <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
          {pieces.map((piece) => (
            <motion.div
              key={piece.id}
              initial={{
                y: '100vh',
                x: `${piece.x}vw`,
                rotate: 0,
                opacity: 1,
              }}
              animate={{
                y: '-10vh',
                x: `${piece.x + (Math.random() - 0.5) * 20}vw`,
                rotate: piece.rotation * 3,
                opacity: 0,
              }}
              transition={{
                duration: piece.duration,
                delay: piece.delay,
                ease: 'easeOut',
              }}
              className="absolute"
              style={{
                width: 10 + Math.random() * 10,
                height: 10 + Math.random() * 10,
                backgroundColor: piece.color,
                borderRadius: Math.random() > 0.5 ? '50%' : '0',
              }}
            />
          ))}
        </div>
      )}
    </AnimatePresence>
  );
}
