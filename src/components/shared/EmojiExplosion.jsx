import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function EmojiExplosion({ emoji, trigger }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (trigger) {
      setShow(true);
      
      // Hide after animation completes
      setTimeout(() => setShow(false), 1500);
    }
  }, [trigger]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, scale: 0.3 }}
          animate={{ 
            opacity: [0, 1, 1, 0],
            scale: [0.3, 1.2, 1, 0.8]
          }}
          exit={{ opacity: 0 }}
          transition={{
            duration: 1.5,
            ease: "easeInOut"
          }}
          className="fixed inset-0 flex items-center justify-center pointer-events-none z-[9999]"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
          }}
        >
          <div className="text-[20rem] leading-none">
            {emoji}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}