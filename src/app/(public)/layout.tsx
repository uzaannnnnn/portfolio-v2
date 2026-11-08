import { getPortfolioRepository } from "@/lib/database/repository";
import { IndonesianBootExperience } from "@/components/boot-experience/indonesian-boot-experience";
import { ActiveSectionProvider } from "@/components/public/active-section-context";
import { FloatingControlsWrapper } from "@/components/theme/floating-controls-wrapper";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const repository = getPortfolioRepository();
  const bundle = await repository.getPublicPortfolioBundle();

  return (
    <IndonesianBootExperience
      greetings={bundle.bootGreetings}
      config={bundle.siteSettings.bootWelcome}
    >
      <ActiveSectionProvider>
        <div className="relative min-h-[100svh] w-full bg-background text-foreground md:h-[100svh] md:overflow-hidden overscroll-y-contain">
          <FloatingControlsWrapper activeResume={bundle.activeResume} />
          <main id="main-content" className="w-full min-h-full md:h-full md:overflow-hidden">
            {children}
          </main>
        </div>
      </ActiveSectionProvider>
    </IndonesianBootExperience>
  );
}
