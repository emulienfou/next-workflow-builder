import { getPluginCategories, getPluginsForCategory } from "@/app/marketplace/actions";
import { IntegrationsGrid } from "@/components/home/integrations-grid";
import { appConfig } from "@/config/app";
import { capitalize } from "@/lib/utils";
import { Metadata } from "next";
import React from "react";

export const generateMetadata = async (props: PageProps<"/marketplace/[category]">): Promise<Metadata> => {
  const { category } = await props.params;

  return {
    title: appConfig.categories.filter((cat) => cat.slug === category)[0]?.label || capitalize(category),
  };
};

const Page = async (props: PageProps<"/marketplace/[category]">) => {
  const { category } = await props.params;

  const categories = await getPluginCategories();
  if (!categories.includes(category)) {
    return <p className="text-muted-foreground">No plugins found for this category.</p>;
  }


  const plugins = await getPluginsForCategory(category);

  return <IntegrationsGrid integrations={ plugins }/>;
};

export default Page;
