"use client";

import * as React from "react";

export type PublicSectionId =
  | "hero"
  | "me"
  | "experience"
  | "showcase"
  | "certifications"
  | "contact";

export interface ActiveSectionContextValue {
  activeSectionId: PublicSectionId;
  setActiveSectionId: (id: PublicSectionId) => void;
  isFloatingControlVisible: boolean;
  isMobile: boolean;
}

const ActiveSectionContext = React.createContext<ActiveSectionContextValue>({
  activeSectionId: "hero",
  setActiveSectionId: () => {},
  isFloatingControlVisible: true,
  isMobile: false,
});

export interface ActiveSectionProviderProps {
  children: React.ReactNode;
  initialSection?: PublicSectionId;
  forceMobile?: boolean;
}

export function ActiveSectionProvider({
  children,
  initialSection = "hero",
  forceMobile,
}: ActiveSectionProviderProps) {
  const [activeSectionId, setActiveSectionId] =
    React.useState<PublicSectionId>(initialSection);
  const [isMobileState, setIsMobileState] = React.useState<boolean>(
    forceMobile ?? false,
  );

  React.useEffect(() => {
    if (forceMobile !== undefined) {
      setIsMobileState(forceMobile);
      return;
    }
    if (
      typeof window === "undefined" ||
      typeof window.matchMedia !== "function"
    ) {
      return;
    }
    const mq = window.matchMedia("(max-width: 767px)");
    const update = (e?: MediaQueryListEvent | MediaQueryList) =>
      setIsMobileState(e ? e.matches : mq.matches);
    update(mq);
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [forceMobile]);

  const isMobile = forceMobile !== undefined ? forceMobile : isMobileState;

  // Responsiveness rule:
  // DESKTOP: Dynamic Island and Download Resume must ALWAYS remain visible across all sections.
  // Section-based visibility is bypassed completely.
  // MOBILE: Section-based visibility applied.
  // - Hero: Visible
  // - Me: Hidden
  // - Experience: Hidden
  // - Showcase: Hidden
  // - Certifications: Hidden
  // - Contact: Visible
  const isFloatingControlVisible =
    !isMobile || activeSectionId === "hero" || activeSectionId === "contact";

  return (
    <ActiveSectionContext.Provider
      value={{
        activeSectionId,
        setActiveSectionId,
        isFloatingControlVisible,
        isMobile,
      }}
    >
      {children}
    </ActiveSectionContext.Provider>
  );
}

export function useActiveSection(): ActiveSectionContextValue {
  return React.useContext(ActiveSectionContext);
}
