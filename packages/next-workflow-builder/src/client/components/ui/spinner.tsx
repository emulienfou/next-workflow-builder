import { cn } from "@/lib/utils";
import { Loader2Icon } from "lucide-react";
import * as React from "react";

function Spinner({ className, ...props }: React.ComponentProps<"svg">) {
  const { ref, ...rest } = props;
  return (
    <Loader2Icon
      role="status"
      aria-label="Loading"
      className={ cn("size-4 animate-spin", className) }
      { ...rest }
    />
  );
}

export { Spinner };
