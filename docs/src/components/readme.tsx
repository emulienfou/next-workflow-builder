import { markdownToHtml } from "@/lib/markdown";

type Props = {
  source: string;
};

const Readme = async ({ source }: Props) => {
  const html = await markdownToHtml(source);

  return (
    <div
      className="markdown-body"
      dangerouslySetInnerHTML={ { __html: html } }
    />
  );
};

export default Readme;
