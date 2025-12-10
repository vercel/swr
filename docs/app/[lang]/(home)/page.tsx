import DynamicLink from "fumadocs-core/dynamic-link";
import type { Metadata } from "next";
import { Installer } from "@/components/geistdocs/installer";
import { Button } from "@/components/ui/button";
import { CenteredSection } from "./components/centered-section";
import { CTA } from "./components/cta";
import { Hero } from "./components/hero";
import { OneTwoSection } from "./components/one-two-section";
import { Templates } from "./components/templates";
import { TextGridSection } from "./components/text-grid-section";

const title = "Geistdocs";
const description =
  "A Vercel documentation template built with Next.js and Fumadocs. Designed for spinning up documentation sites quickly and consistently.";

export const metadata: Metadata = {
  title,
  description,
};

const templates = [
  {
    title: "Template 1",
    description: "Description of template 1",
    link: "https://example.com/template-1",
    image: "https://placehold.co/600x400.png",
  },
  {
    title: "Template 2",
    description: "Description of template 2",
    link: "https://example.com/template-2",
    image: "https://placehold.co/600x400.png",
  },
  {
    title: "Template 3",
    description: "Description of template 3",
    link: "https://example.com/template-3",
    image: "https://placehold.co/600x400.png",
  },
];

const textGridSection = [
  {
    id: "1",
    title: "Text Grid Section",
    description: "Description of text grid section",
  },
  {
    id: "2",
    title: "Text Grid Section",
    description: "Description of text grid section",
  },
  {
    id: "3",
    title: "Text Grid Section",
    description: "Description of text grid section",
  },
];

const HomePage = () => (
  <div className="container mx-auto max-w-5xl">
    <Hero
      badge="Geistdocs is now in beta"
      description={description}
      title={title}
    >
      <div className="mx-auto inline-flex w-fit items-center gap-3">
        <Button asChild className="px-4" size="lg">
          <DynamicLink href="/[lang]/docs/getting-started">
            Get Started
          </DynamicLink>
        </Button>
        <Installer command="npx @vercel/geistdocs init" />
      </div>
    </Hero>
    <div className="grid divide-y border-y sm:border-x">
      <TextGridSection data={textGridSection} />
      <CenteredSection
        description="Description of centered section"
        title="Centered Section"
      >
        <div className="aspect-video rounded-lg border bg-background" />
      </CenteredSection>
      <OneTwoSection
        description="Description of one/two section"
        title="One/Two Section"
      >
        <div className="aspect-video rounded-lg border bg-background" />
      </OneTwoSection>
      <Templates
        data={templates}
        description="See Geistdocs in action with one of our templates."
        title="Get started quickly"
      />
      <CTA cta="Get started" href="/docs" title="Start your docs today" />
    </div>
  </div>
);

export default HomePage;
