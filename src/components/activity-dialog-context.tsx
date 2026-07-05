"use client";

import { createContext, useContext, useState } from "react";

interface ActivityDialogContextValue {
  isOpen: boolean;
  openActivityDialog: () => void;
  onOpenChange: (open: boolean) => void;
}

const ActivityDialogContext = createContext<ActivityDialogContextValue>({
  isOpen: false,
  openActivityDialog: () => {},
  onOpenChange: () => {},
});

export function useActivityDialog() {
  return useContext(ActivityDialogContext);
}

export function ActivityDialogProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <ActivityDialogContext.Provider
      value={{
        isOpen,
        openActivityDialog: () => setIsOpen(true),
        onOpenChange: setIsOpen,
      }}
    >
      {children}
    </ActivityDialogContext.Provider>
  );
}
