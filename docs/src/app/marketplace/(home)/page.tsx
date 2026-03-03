import { getAllPlugins, getPluginCategories } from "@/app/marketplace/actions";
import { IntegrationsGrid } from "@/components/home/integrations-grid";

const Page = async () => {
  const categories = await getPluginCategories();
  const allPlugins = await getAllPlugins(categories);

  return <IntegrationsGrid integrations={ allPlugins }/>;
};

export default Page;
