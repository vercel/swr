import "./global.css";
import { CommandIcon } from "lucide-react";
import { Navbar } from "@/components/geistdocs/navbar";
import { GeistdocsProvider } from "@/components/geistdocs/provider";
import { mono, sans } from "@/lib/geistdocs/fonts";
import { cn } from "@/lib/utils";

const Logo = () => <CommandIcon className="size-5" />;

const links = [
  {
    label: "Docs",
    href: "/docs",
  },
];

const suggestions = [
  "What is Vercel?",
  "What can I deploy with Vercel?",
  "What is Fluid Compute?",
  "How much does Vercel cost?",
];

const Layout = ({ children }: LayoutProps<"/">) => (
  <html
    className={cn(sans.variable, mono.variable, "scroll-smooth antialiased")}
    lang="en"
    suppressHydrationWarning
  >
    <body>
      <GeistdocsProvider>
        <Navbar items={links} suggestions={suggestions}>
          <Logo />
        </Navbar>
        {children}
      </GeistdocsProvider>
    </body>
  </html>
);

export default Layout;
