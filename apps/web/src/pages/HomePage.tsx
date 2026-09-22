import { Link, useNavigate } from "react-router-dom";
import homeVignette from "../assets/figma/home-vignette.png";
import profileDot from "../assets/figma/profile-dot.svg";
import { MobileViewport } from "../components/layout/MobileViewport";
import { Button } from "../components/ui/Button";
import { useAppStore } from "../stores/useAppStore";

const shelfStyles = ["shelf-item--surface", "shelf-item--mauve", "shelf-item--sage", "shelf-item--mist"];
const categoryLabels: Record<string, string> = {
  skincare: "SKIN", base: "BASE", eyes: "EYES", brows: "BROWS", cheeks: "CHEEK", lips: "LIP", finish: "FINISH",
};

export function HomePage() {
  const navigate = useNavigate();
  const beautyBag = useAppStore((state) => state.beautyBag);
  const planHistory = useAppStore((state) => state.planHistory);
  const latestPlan = planHistory[0]?.finalPlan;
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "GOOD MORNING" : hour < 18 ? "GOOD AFTERNOON" : "GOOD EVENING";
  const time = now.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", hour12: false });
  const shelf = Array.from({ length: 4 }, (_, index) => beautyBag[index]);

  return (
    <MobileViewport className="home">
      <header className="home__header">
        <div className="home__brand-row">
          <h1 className="brand-title"><Link className="home__cover-link" to="/" title="返回封面">VANITY</Link></h1>
          <button className="profile-pill" type="button" onClick={() => navigate("/beauty-bag")}>
            <img src={profileDot} width="8" height="8" alt="" />
            MY VANITY
          </button>
        </div>
        <p className="eyebrow">{greeting} · {time}</p>
        <h2 className="ui-title">今天想以什么状态出门？</h2>
      </header>

      <img className="home__vignette" src={homeVignette} alt="梳妆台上的美妆产品" />

      <section className="home__today surface-card surface-card--soft">
        <p className="eyebrow">TODAY&apos;S BEAUTY</p>
        <h2 className="editorial-title">今天怎么安排？</h2>
        {latestPlan ? (
          <button className="home__recent-plan" type="button" onClick={() => navigate(`/plan/${latestPlan.id}`)}>
            最近：{latestPlan.title || latestPlan.contextSummary[0] || "今日方案"}　→
          </button>
        ) : <p className="body-small">告诉我场合、时间与想要的感觉。</p>}
        <Button size="medium" fullWidth onClick={() => navigate("/plan/new")}>Create Beauty Plan</Button>
      </section>

      <section className="home__bag">
        <div className="home__bag-heading">
          <h2 className="editorial-title">我的美妆包</h2>
          <button className="text-action" type="button" onClick={() => navigate("/beauty-bag/add")}>+ 添加产品</button>
        </div>
        <div className="product-shelf" role="button" tabIndex={0} onClick={() => navigate("/beauty-bag")} onKeyDown={(event) => { if (event.key === "Enter") navigate("/beauty-bag"); }}>
          {shelf.map((product, index) => (
            <div className={`shelf-item ${shelfStyles[index]}`} key={product?.id ?? `empty-${index}`} title={product ? `${product.brand} ${product.name}` : "空位置"}>
              <span>{product ? categoryLabels[product.category] : "EMPTY"}</span>
            </div>
          ))}
        </div>
      </section>

      <nav className="bottom-nav" aria-label="主要导航">
        <button type="button" onClick={() => navigate("/")} title="返回梳妆台封面">HOME</button>
        <button type="button" onClick={() => navigate(planHistory[0] ? `/plan/${planHistory[0].finalPlan.id}` : "/plan/new")}>PLAN</button>
        <button type="button" onClick={() => navigate("/beauty-bag")}>BEAUTY BAG{beautyBag.length ? ` · ${beautyBag.length}` : ""}</button>
      </nav>
    </MobileViewport>
  );
}
