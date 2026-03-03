import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { IntegrationCard } from "./integration-card";

interface Integration {
  name: string;
  label: string;
  description: string;
  icon?: string;
  svgIcon?: string | null;
  iconColor: string;
  iconBg: string;
  category: string;
}

interface IntegrationsGridProps {
  integrations: Integration[];
}

export const IntegrationsGrid = ({ integrations }: IntegrationsGridProps) => (
  <div className="flex-1">
    <div className="flex items-center justify-between mb-8">
      <h2 className="text-foreground text-xl font-semibold tracking-tight">
        { integrations.length } { integrations.length === 1 ? "Plugin" : "Plugins" }
      </h2>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      { integrations.map((integration) => (
        <IntegrationCard key={ integration.name } { ...integration } />
      )) }
    </div>

    { integrations.length > 9 && (
      <div className="mt-12 flex items-center justify-center gap-2">
        <Button variant="outline" size="icon" className="h-9 w-9">
          <ChevronLeft className="size-4"/>
        </Button>
        <Button variant="default" size="icon" className="h-9 w-9 font-bold">
          1
        </Button>
        <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground">
          2
        </Button>
        <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground">
          3
        </Button>
        <span className="mx-2 text-muted-foreground">...</span>
        <Button variant="outline" size="icon" className="h-9 w-9">
          <ChevronRight className="size-4"/>
        </Button>
      </div>
    ) }
  </div>
);
