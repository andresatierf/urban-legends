"use client";

import { useEffect, useRef, useState } from "react";
import { Button, type ButtonProps } from "./button";

export interface ConfirmButtonProps extends ButtonProps {
  onConfirm?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  confirmText?: string;
  confirmTimeout?: number;
}

export function ConfirmButton({
  children,
  onConfirm,
  confirmText = "Are you sure?",
  confirmTimeout = 3000,
  onClick,
  ...props
}: ConfirmButtonProps) {
  const [isConfirming, setIsConfirming] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (isConfirming) {
      // Second click - execute the action
      setIsConfirming(false);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      onClick?.(event);
    } else {
      // First click - enter confirmation state
      setIsConfirming(true);
      onConfirm?.(event);

      // Reset after timeout
      timeoutRef.current = setTimeout(() => {
        setIsConfirming(false);
      }, confirmTimeout);
    }
  };

  return (
    <Button {...props} onClick={handleClick}>
      {isConfirming ? confirmText : children}
    </Button>
  );
}
