import { Badge } from "@/components/ui/badge";
import { appConfig } from "@/config/app";
import { Folder } from "lucide-react";
import Link from "next/link";

interface IntegrationCardProps {
  name: string;
  label: string;
  description: string;
  icon?: string;
  svgIcon?: string | null;
  iconColor: string;
  iconBg: string;
  category: string;
}

export function IntegrationCard({
  name,
  label,
  description,
  svgIcon,
  iconBg,
  category,
}: IntegrationCardProps) {
  return (
    <Link href={ `/marketplace/${ category }/${ name }` }
          className="group relative flex flex-col p-5 rounded-xl border border-border bg-card hover:border-primary/20 hover:shadow-lg transition-all duration-300">
      <div className="flex items-start justify-between mb-4">
        <div
          className={ `w-10 h-10 rounded-lg ${ iconBg } flex items-center justify-center border border-border group-hover:border-primary/20 transition-colors` }
        >
          { svgIcon ? (
            <div className="w-6 h-6 text-foreground" dangerouslySetInnerHTML={ { __html: svgIcon } }/>
          ) : (
            <Folder className="size-6 text-muted-foreground"/>
          ) }
        </div>
        { appConfig.officialPlugins.includes(name) && (
          <Badge className="bg-green-900/30 text-green-400 border-green-900 tracking-wide">
            Official
          </Badge>
        ) }
      </div>
      <div>
        <h3 className="text-foreground font-bold text-base group-hover:text-primary transition-colors">
          { label }
        </h3>
        <p className="text-muted-foreground text-xs mt-1 truncate">{ description }</p>
      </div>
    </Link>
  );
}
