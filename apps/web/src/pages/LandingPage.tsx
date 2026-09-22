import { useNavigate } from "react-router-dom";
import landingImage from "../assets/figma/landing-hero.png";
import { MobileViewport } from "../components/layout/MobileViewport";
import { Button } from "../components/ui/Button";

export function LandingPage() {
  const navigate = useNavigate();

  return (
    <MobileViewport className="landing">
      <img className="landing__image" src={landingImage} alt="手绘梳妆台" />
      <div className="landing__overlay landing__overlay--top" />
      <div className="landing__overlay landing__overlay--bottom" />

      <header className="landing__brand">
        <p className="eyebrow eyebrow--wide">A PRIVATE BEAUTY SPACE</p>
        <h1 className="brand-title">VANITY</h1>
        <span className="editorial-rule" />
        <h2 className="ui-title">欢迎回到你的梳妆台。</h2>
        <p className="body-small">每一个今天，都有更适合你的妆容。</p>
      </header>

      <section className="landing__action surface-card surface-card--float">
        <p className="body-small body-small--primary">今天想以什么状态出门？</p>
        <Button fullWidth onClick={() => navigate("/home")}>开始今天的妆容</Button>
      </section>
    </MobileViewport>
  );
}
