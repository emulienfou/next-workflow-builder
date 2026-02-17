"use client";

import { appConfig } from "@/config/app";
import { capitalize, cn } from "@/lib/utils";
import { FolderIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface SidebarFiltersProps {
  categories: string[];
}

const SidebarFilters = (props: SidebarFiltersProps) => {
  const pathname = usePathname();
  const activeCategory = pathname === "/" ? "all" : pathname.slice(1);

  return (
    <aside className="w-full md:w-64 flex flex-col gap-10 shrink-0">
      <div className="flex flex-col gap-4">
        <h3 className="text-muted-foreground text-xs font-bold uppercase tracking-widest pl-3">
          Explore
        </h3>
        <div className="flex flex-col gap-1">
          { ["all", ...props.categories].map((cat) => {
            const isActive = activeCategory === cat;
            const href = cat === "all" ? "/marketplace" : `/marketplace/${ cat }`;
            const Icon = appConfig.categories.filter((category) => category.slug === cat)[0]?.icon || FolderIcon;

            return (
              <Link
                key={ cat }
                href={ href }
                className={ cn(
                  "relative flex items-center gap-3 px-3 py-2 rounded-md group transition-all",
                  isActive
                    ? "bg-secondary text-foreground font-medium"
                    : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground",
                ) }
              >
                <Icon
                  className={ cn(
                    "size-5 transition-colors",
                    isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground",
                  ) }
                />
                <span
                  className="text-sm">{ appConfig.categories.filter((category) => category.slug === cat)[0]?.label || capitalize(cat) }</span>
              </Link>
            );
          }) }
        </div>
      </div>
    </aside>
  );
};

export { SidebarFilters };
