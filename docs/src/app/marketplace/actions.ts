"use cache";

import { cacheLife } from "next/cache";

const getPluginCategories = async (): Promise<string[]> => {
  cacheLife("hours");

  try {
    const response = await fetch(
      `${ process.env.GITHUB_API_REPO_BASE }/contents/plugins`,
      {
        headers: {
          Authorization: `token ${ process.env.GITHUB_TOKEN }`,
          Accept: "application/vnd.github.v3+json",
        },
        next: { revalidate: 3600 }, // Revalidate every hour
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch categories: ${ response.statusText }`);
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      console.error("Unexpected API response format:", data);
      return [];
    }

    return data
      .filter((item: any) => item.type === "dir")
      .map((item: any) => item.name);
  } catch (error) {
    console.error("Error fetching plugin categories:", error);
    return ["communication", "ai", "database", "social", "dev-tools"];
  }
};

const getAllPlugins = async (categories: string[]) => {
  cacheLife("hours");

  const allPluginsPromises = categories.map(async (category) => {
    try {
      const response = await fetch(
        `${ process.env.GITHUB_API_REPO_BASE }/contents/plugins/${ category }`,
        {
          headers: {
            Authorization: `token ${ process.env.GITHUB_TOKEN }`,
            Accept: "application/vnd.github.v3+json",
          },
          next: { revalidate: 3600 },
        },
      );
      if (!response.ok) return [];

      const plugins = await response.json();
      if (!Array.isArray(plugins)) return [];

      const categoryPluginsPromises = plugins
        .filter((item: any) => item.type === "dir")
        .map(async (item: any) => {
          const pluginName = item.name;
          let svgIcon: string | null = null;
          let label = pluginName;
          let description = `An integration for ${ pluginName }.`;

          // Fetch icon and index.ts in parallel
          const [iconResponse, indexResponse] = await Promise.all([
            fetch(
              `${ process.env.GITHUB_API_REPO_BASE }/contents/plugins/${ category }/${ pluginName }/icon.tsx`,
              {
                headers: {
                  Authorization: `token ${ process.env.GITHUB_TOKEN }`,
                  Accept: "application/vnd.github.v3+json",
                }, next: { revalidate: 3600 },
              },
            ),
            fetch(
              `${ process.env.GITHUB_API_REPO_BASE }/contents/plugins/${ category }/${ pluginName }/index.ts`,
              {
                headers: {
                  Authorization: `token ${ process.env.GITHUB_TOKEN }`,
                  Accept: "application/vnd.github.v3+json",
                }, next: { revalidate: 3600 },
              },
            ),
          ]);

          // Process icon
          if (iconResponse.ok) {
            const iconData = await iconResponse.json();
            if (iconData.content) {
              const iconContent = Buffer.from(iconData.content, "base64").toString("utf8");
              const svgMatch = iconContent.match(/<svg[^>]*>[\s\S]*?<\/svg>/);
              if (svgMatch) svgIcon = svgMatch[0];
            }
          }

          // Process index.ts
          if (indexResponse.ok) {
            const indexData = await indexResponse.json();
            if (indexData.content) {
              const indexContent = Buffer.from(indexData.content, "base64").toString("utf8");
              const labelMatch = indexContent.match(/label:\s*"([^"]+)"/);
              const descriptionMatch = indexContent.match(/description:\s*"([^"]+)"/);
              if (labelMatch?.[1]) label = labelMatch[1];
              if (descriptionMatch?.[1]) description = descriptionMatch[1];
            }
          }

          return {
            name: pluginName,
            label: label,
            description: description,
            svgIcon: svgIcon,
            icon: svgIcon ? undefined : "folder",
            iconColor: "text-foreground",
            iconBg: "bg-background",
            category: category,
          };
        });

      return Promise.all(categoryPluginsPromises);
    } catch (error) {
      console.error(`Error fetching plugins for category ${ category }:`, error);
      return [];
    }
  });

  const nestedPlugins = await Promise.all(allPluginsPromises);
  return nestedPlugins.flat();
};

const getPluginDetails = async (category: string, plugin: string) => {
  cacheLife("hours");

  const GITHUB_API_CATEGORY_PLUGIN_BASE = `${ process.env.GITHUB_API_REPO_BASE }/contents/plugins/${ category }/${ plugin }`;
  const headers = {
    Authorization: `token ${ process.env.GITHUB_TOKEN }`,
    Accept: "application/vnd.github.v3+json",
  };

  const [indexResponse, iconResponse, readmeResponse, commitsResponse] = await Promise.all([
    fetch(`${ GITHUB_API_CATEGORY_PLUGIN_BASE }/index.ts`, { headers, next: { revalidate: 3600 } }),
    fetch(`${ GITHUB_API_CATEGORY_PLUGIN_BASE }/icon.tsx`, { headers, next: { revalidate: 3600 } }),
    fetch(`${ GITHUB_API_CATEGORY_PLUGIN_BASE }/README.md`, { headers, next: { revalidate: 3600 } }),
    fetch(`${ process.env.GITHUB_API_REPO_BASE }/commits?path=plugins/${ category }/${ plugin }&per_page=1`, {
      headers,
      next: { revalidate: 3600 },
    }),
  ]);

  let label = plugin;
  let description = `An integration for ${ plugin }.`;
  let svgIcon: string | null = null;
  let readmeContent: string | null = null;
  let lastUpdated = "Unknown";

  if (indexResponse.ok) {
    const indexData = await indexResponse.json();
    if (indexData.content) {
      const indexContent = Buffer.from(indexData.content, "base64").toString("utf8");
      const labelMatch = indexContent.match(/label:\s*"([^"]+)"/);
      const descriptionMatch = indexContent.match(/description:\s*"([^"]+)"/);
      if (labelMatch?.[1]) label = labelMatch[1];
      if (descriptionMatch?.[1]) description = descriptionMatch[1];
    }
  }

  if (iconResponse.ok) {
    const iconData = await iconResponse.json();
    if (iconData.content) {
      const iconContent = Buffer.from(iconData.content, "base64").toString("utf8");
      const svgMatch = iconContent.match(/<svg[^>]*>[\s\S]*?<\/svg>/);
      if (svgMatch) svgIcon = svgMatch[0];
    }
  }

  if (readmeResponse.ok) {
    const readmeData = await readmeResponse.json();
    if (readmeData.content) {
      readmeContent = Buffer.from(readmeData.content, "base64").toString("utf8");
    }
  }

  if (commitsResponse.ok) {
    const commitsData = await commitsResponse.json();
    if (Array.isArray(commitsData) && commitsData.length > 0) {
      const date = new Date(commitsData[0].commit.committer.date);
      lastUpdated = date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
    }
  }

  return {
    name: plugin,
    label,
    description,
    svgIcon,
    readmeContent,
    category,
    lastUpdated,
  };
};

const getPluginsForCategory = async (category: string) => {
  try {
    const response = await fetch(
      `${ process.env.GITHUB_API_REPO_BASE }/contents/plugins/${ category }`,
      {
        headers: {
          Authorization: `token ${ process.env.GITHUB_TOKEN }`,
          Accept: "application/vnd.github.v3+json",
        },
        next: { revalidate: 3600 }, // Revalidate every hour
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch plugins for category ${ category }: ${ response.statusText }`);
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      console.error("Unexpected API response format:", data);
      return [];
    }

    const pluginsPromises = data
      .filter((item: any) => item.type === "dir")
      .map(async (item: any) => {
        const pluginName = item.name;
        let svgIcon: string | null = null;
        let label = pluginName;
        let description = `An integration for ${ pluginName }.`;

        // Fetch icon and index.ts in parallel
        const [iconResponse, indexResponse] = await Promise.all([
          fetch(
            `${ process.env.GITHUB_API_REPO_BASE }/contents/plugins/${ category }/${ pluginName }/icon.tsx`,
            {
              headers: {
                Authorization: `token ${ process.env.GITHUB_TOKEN }`,
                Accept: "application/vnd.github.v3+json",
              }, next: { revalidate: 3600 },
            },
          ),
          fetch(
            `${ process.env.GITHUB_API_REPO_BASE }/contents/plugins/${ category }/${ pluginName }/index.ts`,
            {
              headers: {
                Authorization: `token ${ process.env.GITHUB_TOKEN }`,
                Accept: "application/vnd.github.v3+json",
              }, next: { revalidate: 3600 },
            },
          ),
        ]);

        // Process icon
        if (iconResponse.ok) {
          const iconData = await iconResponse.json();
          if (iconData.content) {
            const iconContent = Buffer.from(iconData.content, "base64").toString("utf8");
            const svgMatch = iconContent.match(/<svg[^>]*>[\s\S]*?<\/svg>/);
            if (svgMatch) svgIcon = svgMatch[0];
          }
        }

        // Process index.ts
        if (indexResponse.ok) {
          const indexData = await indexResponse.json();
          if (indexData.content) {
            const indexContent = Buffer.from(indexData.content, "base64").toString("utf8");
            const labelMatch = indexContent.match(/label:\s*"([^"]+)"/);
            const descriptionMatch = indexContent.match(/description:\s*"([^"]+)"/);
            if (labelMatch?.[1]) label = labelMatch[1];
            if (descriptionMatch?.[1]) description = descriptionMatch[1];
          }
        }

        return {
          name: pluginName,
          label: label,
          description: description,
          svgIcon: svgIcon,
          icon: svgIcon ? undefined : "folder",
          iconColor: "text-foreground",
          iconBg: "bg-background",
          category: category,
        };
      });

    return Promise.all(pluginsPromises);
  } catch (error) {
    console.error(`Error fetching plugins for category ${ category }:`, error);
    return [];
  }
};

const pluginExists = async (category: string, plugin: string): Promise<boolean> => {
  cacheLife("hours");

  try {
    const response = await fetch(
      `${ process.env.GITHUB_API_REPO_BASE }/contents/plugins/${ category }/${ plugin }`,
      {
        headers: {
          Authorization: `token ${ process.env.GITHUB_TOKEN }`,
          Accept: "application/vnd.github.v3+json",
        },
        next: { revalidate: 3600 },
      },
    );

    return response.ok;
  } catch {
    return false;
  }
};

export { getPluginCategories, getAllPlugins, getPluginDetails, getPluginsForCategory, pluginExists };
