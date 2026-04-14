"use client";

import { useRef, useCallback } from "react";
import { motion, useAnimate } from "framer-motion";
import { Checkbox } from "@/components/ui/checkbox";

export function AnimatedCheckbox({
  checked,
  onCheckedChange,
  className,
  "aria-label": ariaLabel,
}: {
  checked: boolean;
  onCheckedChange: () => void;
  className?: string;
  "aria-label"?: string;
}) {
  const [scope, animate] = useAnimate();
  const ringRef = useRef<HTMLDivElement>(null);

  const handleChange = useCallback(() => {
    if (!checked) {
      animate(scope.current, { scale: [1, 1.3, 1] }, { duration: 0.3 });
      if (ringRef.current) {
        animate(
          ringRef.current,
          { scale: [0.5, 1.5], opacity: [0.6, 0] },
          { duration: 0.4, ease: "easeOut" }
        );
      }
    }
    onCheckedChange();
  }, [checked, onCheckedChange, scope, animate]);

  return (
    <motion.div ref={scope} className="relative">
      <div
        ref={ringRef}
        className="pointer-events-none absolute inset-0 rounded-sm border-2 border-green-500 opacity-0"
      />
      <Checkbox
        checked={checked}
        onCheckedChange={handleChange}
        className={className}
        aria-label={ariaLabel}
      />
    </motion.div>
  );
}
