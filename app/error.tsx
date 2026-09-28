"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/items/empty-state";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-xl px-4 py-20">
      <EmptyState
        icon={AlertTriangle}
        title="Something went wrong"
        description="We couldn't reach the database. Please try again in a moment."
        action={
          <Button variant="outline" onClick={reset}>
            <RotateCcw /> Try again
          </Button>
        }
      />
    </div>
  );
}
