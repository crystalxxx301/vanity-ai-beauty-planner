import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { BeautyPlanStep, BeautyProduct } from "@vanity/contracts/types";
import { MobileViewport } from "../components/layout/MobileViewport";
import { Button } from "../components/ui/Button";
import backIcon from "../assets/figma/icon-back.svg";
import { demoBeautyPlan } from "../fixtures/demo";
import { useAppStore } from "../stores/useAppStore";

const categoryLabels: Record<BeautyPlanStep["category"], string> = {
  "skin-prep": "妆前准备",
  base: "底妆",
  "eyes-brows": "眼妆与眉妆",
  "cheeks-lips": "腮红与唇妆",
  finish: "定妆",
};

function productLabel(product?: BeautyProduct, fallback?: string) {
  if (!product) return fallback ?? "按步骤选择合适产品";
  return [product.brand, product.name, product.shade].filter(Boolean).join(" · ");
}

export function BeautyPlanPage() {
  const navigate = useNavigate();
  const { planId } = useParams();
  const currentPlan = useAppStore((state) => state.currentPlan);
  const planHistory = useAppStore((state) => state.planHistory);
  const beautyBag = useAppStore((state) => state.beautyBag);
  const saveCurrentPlan = useAppStore((state) => state.saveCurrentPlan);
  const setCurrentPlan = useAppStore((state) => state.setCurrentPlan);
  const historyPlan = planHistory.find((entry) => entry.finalPlan.id === planId)?.finalPlan;
  const plan = currentPlan && currentPlan.id === planId ? currentPlan : historyPlan ?? (planId === "demo-plan" ? demoBeautyPlan : undefined);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [saved, setSaved] = useState(Boolean(historyPlan));
  const [detailsOpen, setDetailsOpen] = useState(false);
  const productById = useMemo(
    () => new Map(beautyBag.map((product) => [product.id, product])),
    [beautyBag],
  );
  if (!plan) {
    return <MobileViewport className="plan-page"><section className="plan-page__missing surface-card"><h1 className="editorial-title">找不到这份方案</h1><p className="body-small">方案可能尚未保存，或已从本机清除。</p><Button onClick={() => navigate("/plan/new")}>重新创建方案</Button></section></MobileViewport>;
  }
  const activeStep = plan.steps[activeStepIndex] ?? plan.steps[0];
  const activeProducts = activeStep.productIds.map((id) => productLabel(productById.get(id), id));
  const title = plan.title || `${plan.contextSummary[0] ?? "今日"}妆容`;
  const summary = plan.summary || plan.priorities[0] || "根据今天的条件，给你一套克制、可执行的妆容方案。";
  const attributes = [...plan.contextSummary.slice(0, 2), `${plan.totalEstimatedMinutes} MIN`];

  const save = () => {
    if (currentPlan?.id !== plan.id) setCurrentPlan(plan);
    saveCurrentPlan();
    setSaved(true);
  };

  const refine = () => {
    if (currentPlan?.id !== plan.id) setCurrentPlan(plan);
    navigate(`/plan/${plan.id}/refine?step=${encodeURIComponent(activeStep.category)}`);
  };

  return (
    <MobileViewport className="plan-page">
      <div className="plan-page__scroll">
      <header className="plan-page__header">
        <div className="plan-nav">
          <button type="button" onClick={() => navigate("/home")}><img src={backIcon} width="20" height="20" alt="返回" /></button>
          <p className="eyebrow">BEAUTY PLAN · TODAY</p>
          <button className="plan-nav__more" type="button" aria-label="展开方案详情" onClick={() => setDetailsOpen((open) => !open)}>•••</button>
        </div>
        <h1 className="brand-title">{title}</h1>
        <p className="body-small">{summary}</p>
      </header>

      <div className="plan-page__attributes" aria-label="本次方案条件">
        {attributes.map((attribute) => <span key={attribute}>{attribute}</span>)}
      </div>

      <section className="plan-page__note">
        <p className="eyebrow">AI EDITOR&apos;S NOTE</p>
        <p>{plan.priorities[0] ?? summary}</p>
      </section>

      {plan.outfitMatch?.observed?.trim() && plan.outfitMatch.makeupConnection?.trim() && (
        <section className="plan-page__outfit surface-card">
          <p className="eyebrow">OUTFIT × BEAUTY</p>
          <h2>穿搭如何影响这次妆容</h2>
          <p>穿搭依据：{plan.outfitMatch.observed}</p>
          <p>{plan.outfitMatch.makeupConnection}</p>
        </section>
      )}

      <nav className="plan-step-nav" aria-label="五阶段妆容步骤">
        {plan.steps.map((step, index) => (
          <button
            className={index === activeStepIndex ? "active" : ""}
            type="button"
            key={step.id}
            onClick={() => setActiveStepIndex(index)}
            aria-label={`${index + 1}. ${categoryLabels[step.category]}`}
          >
            <span>{String(index + 1).padStart(2, "0")}</span>
            <small>{categoryLabels[step.category]}</small>
          </button>
        ))}
      </nav>

      <section className="plan-card plan-card--do surface-card surface-card--soft">
        <p className="eyebrow">DO · {String(activeStepIndex + 1).padStart(2, "0")}　·　约 {activeStep.estimatedMinutes} 分钟</p>
        <h2>{activeStep.title}</h2>
        <p>{activeStep.do}</p>
      </section>
      <section className="plan-card plan-card--why">
        <p className="eyebrow">WHY</p>
        <h2>为什么这样做</h2>
        <p>{activeStep.why}</p>
      </section>
      <section className="plan-card plan-card--use">
        <p className="eyebrow">USE</p>
        <h2>{activeProducts.length ? "使用你的美妆包" : "这一步需要什么"}</h2>
        <p>{activeProducts.length
          ? activeProducts.join(" · ")
          : activeStep.missingProductCriteria?.join(" · ") || "无需指定产品，使用手边同类产品即可。"}</p>
      </section>

      <button className="plan-page__expand" type="button" onClick={() => setDetailsOpen((open) => !open)}>
        {detailsOpen ? "收起完整方案" : "查看完整方案与取舍"}
      </button>

      {detailsOpen && (
        <div className="plan-details">
          <section className="plan-details__section">
            <p className="eyebrow">FULL BEAUTY JOURNEY</p>
            <h2 className="editorial-title">五阶段方案</h2>
            <div className="plan-details__steps">
              {plan.steps.map((step, index) => (
                <article className="plan-detail-step" key={step.id}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <div>
                    <p className="eyebrow">{categoryLabels[step.category]} · {step.estimatedMinutes} MIN</p>
                    <h3>{step.title}</h3>
                    <p>{step.do}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>

          {plan.skipToday.length > 0 && (
            <section className="plan-details__section plan-details__section--soft">
              <p className="eyebrow">SKIP TODAY</p>
              {plan.skipToday.map((item) => <div className="plan-detail-line" key={item.title}><strong>{item.title}</strong><p>{item.reason}</p></div>)}
            </section>
          )}

          <section className="plan-details__section">
            <p className="eyebrow">FROM MY BEAUTY BAG</p>
            {plan.usedProductIds.length > 0
              ? plan.usedProductIds.map((id) => <p className="plan-product-line" key={id}>✓ {productLabel(productById.get(id), id)}</p>)
              : <p className="body-small">这次方案不依赖指定产品，可用手边同类产品完成。</p>}
          </section>

          {plan.missingNeeds.length > 0 && (
            <section className="plan-details__section plan-details__section--mist">
              <p className="eyebrow">WHAT YOU MAY NEED</p>
              {plan.missingNeeds.map((need, index) => (
                <div className="plan-detail-line" key={`${need.category}-${index}`}>
                  <strong>{need.criteria.join(" · ")}</strong>
                  {need.reason && <p>{need.reason}</p>}
                </div>
              ))}
            </section>
          )}

          <details className="plan-reasoning">
            <summary>Why This Plan?</summary>
            <ul>{plan.whyThisPlan.map((reason) => <li key={reason}>{reason}</li>)}</ul>
            {plan.assumptions.length > 0 && <p>合理假设：{plan.assumptions.join("；")}</p>}
          </details>
        </div>
      )}
      </div>

      <div className="plan-page__actions">
        <Button emphasis="secondary" onClick={save}>{saved ? "已保存" : "保存"}</Button>
        <Button onClick={refine}>局部调整</Button>
      </div>
    </MobileViewport>
  );
}
