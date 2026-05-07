"use client";

import { createContext, useContext, useState } from "react";

interface SubmissionDialogContextValue {
  isOpen: boolean;
  openSubmissionDialog: () => void;
  onOpenChange: (open: boolean) => void;
}

const SubmissionDialogContext = createContext<SubmissionDialogContextValue>({
  isOpen: false,
  openSubmissionDialog: () => {},
  onOpenChange: () => {},
});

export function useSubmissionDialog() {
  return useContext(SubmissionDialogContext);
}

export function SubmissionDialogProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <SubmissionDialogContext.Provider
      value={{
        isOpen,
        openSubmissionDialog: () => setIsOpen(true),
        onOpenChange: setIsOpen,
      }}
    >
      {children}
    </SubmissionDialogContext.Provider>
  );
}
