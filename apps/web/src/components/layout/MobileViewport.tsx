import { useEffect, useState, type CSSProperties, type PropsWithChildren } from "react";

type MobileViewportProps = PropsWithChildren<{
  className?: string;
  scrollable?: boolean;
}>;

export function MobileViewport({ children, className = "", scrollable = false }: MobileViewportProps) {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const updateScale = () => {
      const isNarrowScreen = window.innerWidth <= 477;
      const availableWidth = isNarrowScreen ? window.innerWidth : window.innerWidth - 48;
      const widthScale = availableWidth / 430;
      const heightScale = isNarrowScreen ? 1 : (window.innerHeight - 48) / 932;
      setScale(Math.min(1, widthScale, heightScale));
    };

    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, []);

  const stageStyle = {
    "--viewport-scale": scale,
    width: `${430 * scale}px`,
    height: `${932 * scale}px`,
  } as CSSProperties;

  return (
    <div className="mobile-stage" style={stageStyle}>
      <main className={`mobile-viewport ${scrollable ? "mobile-viewport--scrollable" : ""} ${className}`}>
        {children}
      </main>
    </div>
  );
}
