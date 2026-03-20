'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

interface RegisterModalContextType {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

const RegisterModalContext = createContext<RegisterModalContextType>({
  isOpen: false,
  open: () => {},
  close: () => {},
});

export const useRegisterModal = () => useContext(RegisterModalContext);

export const RegisterModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  return (
    <RegisterModalContext.Provider value={{ isOpen, open, close }}>
      {children}
    </RegisterModalContext.Provider>
  );
};
