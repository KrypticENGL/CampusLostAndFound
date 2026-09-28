import Link from "next/link";
import { PackageSearch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/items/empty-state";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-20">
      <EmptyState
        icon={PackageSearch}
        title="We couldn't find that item"
        description="The listing may have been removed, or the link is incorrect."
        action={
          <Button asChild>
            <Link href="/">Browse all listings</Link>
          </Button>
        }
      />
    </div>
  );
}
