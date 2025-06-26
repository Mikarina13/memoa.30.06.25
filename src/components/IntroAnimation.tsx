import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ANIMATION_DURATION_INTRO, ANIMATION_DURATION_SHORT } from '../utils/constants';

export function IntroAnimation({ onComplete }: { onComplete: () => void }) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onComplete, ANIMATION_DURATION_SHORT);
    }, ANIMATION_DURATION_INTRO);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
        >
          <motion.img
            src="/20250601_1008_Neon Logo Design_remix_01jwn8g35desmb88t2c88mh7t0.png"
            alt="MEMOA"
            className="w-[800px]"
            initial={{ scale: 1, opacity: 0 }}
            animate={{ 
              scale: [1, 1, 3],
              opacity: [0, 1, 0]
            }}
            transition={{
              duration: 2,
              times: [0, 0.5, 1],
              ease: ["easeIn", "easeInOut"]
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}