import { getPortfolioRepository } from "@/lib/database/repository";
import { IndonesianBootExperience } from "@/components/boot-experience/indonesian-boot-experience";
import { PublicNavbar } from "@/components/public/public-navbar";
import { PublicFooter } from "@/components/public/public-footer";

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
      <div className="flex min-h-screen flex-col">
        <PublicNavbar
          fullName={bundle.profile.fullName}
          professionalTitle={bundle.profile.professionalTitle}
        />
        <main id="main-content" className="flex-1">
          {children}
        </main>
        <PublicFooter profile={bundle.profile} />
      </div>
    </IndonesianBootExperience>
  );
}
