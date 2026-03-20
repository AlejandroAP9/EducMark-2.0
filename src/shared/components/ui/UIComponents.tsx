'use client';

import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { motion, useInView, useAnimation, AnimatePresence } from 'framer-motion';
import { PixelCanvas } from './pixel-canvas';

// --- Fade In Up Wrapper ---
interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

export const FadeIn: React.FC<FadeInProps> = ({ children, delay = 0, className = "" }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const controls = useAnimation();

  useEffect(() => {
    if (isInView) {
      controls.start("visible");
    }
  }, [isInView, controls]);

  return (
    <motion.div
      ref={ref}
      variants={{
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0 },
      }}
      initial="hidden"
      animate={controls}
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// --- Buttons ---
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  fullWidth = false,
  className = '',
  ...props
}) => {
  const baseStyles = "relative overflow-hidden inline-flex items-center justify-center px-6 py-3 rounded-full font-semibold transition-all duration-300 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed group";

  const variants = {
    primary: "bg-primary text-white shadow-[0_0_30px_-5px_rgba(139,92,246,0.5)] hover:shadow-[0_0_50px_-5px_rgba(139,92,246,0.7)] hover:brightness-110",
    secondary: "bg-transparent border border-muted hover:border-primary text-foreground hover:text-primary",
    outline: "border border-white/10 hover:bg-white/5 backdrop-blur-sm"
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {variant === 'primary' && (
        <PixelCanvas
          gap={6}
          speed={40}
          colors={["#ffffff", "#e9d5ff", "#d8b4fe"]}
          variant="default"
          style={{ opacity: 0.4 }}
        />
      )}
      <span className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </span>
    </button>
  );
};

// --- Modal ---
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[#1a1a2e] border border-border rounded-2xl shadow-2xl"
      >
        <div className="sticky top-0 flex items-center justify-between p-6 border-b border-border bg-[#1a1a2e] z-10">
          <h2 className="text-xl font-bold font-heading">{title}</h2>
          <button onClick={onClose} className="p-2 text-muted-foreground hover:text-primary transition-colors">
            <X size={24} />
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </motion.div>
    </div>
  );
};

// --- Section Title ---
export const SectionTitle: React.FC<{ title: string; subtitle?: string; align?: 'center' | 'left' }> = ({
  title,
  subtitle,
  align = 'center'
}) => (
  <div className={`mb-12 ${align === 'center' ? 'text-center' : 'text-left'}`}>
    <h2 className="text-3xl md:text-5xl font-bold font-heading mb-4 bg-gradient-primary bg-clip-text text-transparent pb-1">
      {title}
    </h2>
    {subtitle && (
      <p className="text-muted-foreground text-lg max-w-2xl mx-auto font-light leading-relaxed">
        {subtitle}
      </p>
    )}
  </div>
);

// --- Tooltip ---
export const Tooltip: React.FC<{ children: React.ReactNode; content: string }> = ({ children, content }) => {
  const [isVisible, setIsVisible] = React.useState(false);

  return (
    <div
      className="relative flex items-center"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-black/90 backdrop-blur-md border border-white/10 text-white text-xs rounded-lg shadow-xl whitespace-nowrap z-50 pointer-events-none"
          >
            {content}
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-black/90"></div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
