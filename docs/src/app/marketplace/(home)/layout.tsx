import { getPluginCategories } from "@/app/marketplace/actions";
import { SidebarFilters } from "@/components/home/sidebar-filters";
import * as React from "react";

const Layout = async (props: LayoutProps<"/marketplace">) => {
  const categories = await getPluginCategories();

  return (
    <div className="relative flex flex-col min-h-screen w-full overflow-x-hidden bg-background">
      <main className="flex-1 flex flex-col z-10">
        { props.hero }
        <div className="max-w-7xl mx-auto w-full flex flex-col md:flex-row gap-10 px-6 md:px-10 py-16">
          <SidebarFilters categories={ categories }/>
          { props.children }
        </div>
      </main>
    </div>
  );
};

export default Layout;
