import { useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { MobileViewport } from "../components/layout/MobileViewport";
import { BackLink } from "../components/ui/BackLink";
import { Button } from "../components/ui/Button";
import { demoBeautyPlan } from "../fixtures/demo";
import { useAppStore } from "../stores/useAppStore";
import { aiClient } from "../services/aiClient";

const modules = [
  ["base", "底妆质感"],
  ["eyes-brows", "眼眉强度"],
  ["cheeks-lips", "唇颊色调"],
  ["finish", "定妆方式"],
  ["skin-prep", "妆前准备"],
  ["global", "整体方案"],
] as const;

const quickInstructions = ["更自然一点", "更精致一点", "只用我已有产品", "我现在时间更少"];

export function RefinementPage() {
  const navigate = useNavigate();
  const { planId } = useParams();
  const [searchParams] = useSearchParams();
  const currentPlan = useAppStore((state) => state.currentPlan);
  const historyPlan = useAppStore((state) => state.planHistory.find((entry) => entry.finalPlan.id === planId)?.finalPlan);
  const plan = currentPlan && currentPlan.id === planId ? currentPlan : historyPlan ?? (planId === "demo-plan" ? demoBeautyPlan : undefined);
  const setCurrentPlan = useAppStore((state) => state.setCurrentPlan);
  const save = useAppStore((state) => state.saveCurrentPlan);
  const [selectedKey, setSelectedKey] = useState<(typeof modules)[number][0]>(() => {
    const requested = searchParams.get("step");
    return modules.find(([key]) => key === requested)?.[0] ?? "cheeks-lips";
  });
  const [instruction, setInstruction] = useState("");
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");

  if (!plan) {
    return <MobileViewport className="refine-page"><section className="plan-page__missing surface-card"><h1 className="editorial-title">找不到这份方案</h1><p className="body-small">请返回重新创建方案。</p><Button onClick={() => navigate("/plan/new")}>创建方案</Button></section></MobileViewport>;
  }

  const apply = async () => {
    const cleanInstruction = instruction.trim();
    if (!cleanInstruction) { setError("请告诉 AI 你希望怎样调整。"); return; }
    const globalByMeaning = /时间|场合|天气|已有产品|全部|整体|重新/.test(cleanInstruction);
    const scope = selectedKey === "global" || globalByMeaning ? "global" : "local";
    const selectedStep = scope === "global" ? "__all__" : plan.steps.find((step) => step.category === selectedKey)?.id;
    if (!selectedStep) { setError("没有找到对应的方案步骤，请选择其他模块。"); return; }
    setUpdating(true); setError("");
    try {
      const result = await aiClient.refinePlan(plan, selectedStep, cleanInstruction, scope);
      setCurrentPlan(result.plan);
      save(cleanInstruction);
      navigate(`/plan/${result.plan.id}`);
    } catch {
      setError("这次调整没有完成。原方案没有改变，请稍后重试。");
      setUpdating(false);
    }
  };

  return (
    <MobileViewport className="refine-page" scrollable>
      <header className="flow-header refine-page__header">
        <BackLink to={`/plan/${plan.id}`} label="REFINE PLAN · 04" />
        <h1 className="brand-title">想调整哪一部分？</h1>
        <p className="body-small">局部反馈只改对应步骤；全局条件变化会重新平衡整套方案。</p>
      </header>

      <section className="refine-page__summary">
        <p className="eyebrow">CURRENT PLAN · V{plan.version}</p>
        <h2 className="editorial-title">{plan.title || plan.contextSummary[0] || "今日妆容"}</h2>
        <p className="eyebrow">{plan.contextSummary.slice(0, 2).join(" · ")} · {plan.totalEstimatedMinutes} MIN</p>
      </section>

      <section className="refine-page__choices">
        <p className="eyebrow">选择需要调整的模块</p>
        <div className="refine-grid">
          {modules.map(([key, label]) => {
            const active = selectedKey === key;
            return <button className={active ? "active" : ""} type="button" key={key} onClick={() => { setSelectedKey(key); setError(""); }}>{active ? "✓  " : ""}{label}</button>;
          })}
        </div>
      </section>

      <section className="refine-page__instruction surface-card">
        <label className="eyebrow" htmlFor="refine-instruction">告诉我怎么改</label>
        <textarea id="refine-instruction" value={instruction} onChange={(event) => { setInstruction(event.target.value); setError(""); }} placeholder="例如：腮红再淡一点，更偏灰粉，不要影响其他步骤。" />
        <div className="refine-quick-actions">
          {quickInstructions.map((item) => <button type="button" key={item} onClick={() => setInstruction(item)}>{item}</button>)}
        </div>
        {error ? <p className="refine-page__error" role="status">{error}</p> : <p className="input-hint">AI 会判断这是局部调整还是全局重算</p>}
      </section>

      <div className="fixed-action"><Button fullWidth disabled={updating} onClick={apply}>{updating ? "正在更新…" : "更新方案"}</Button></div>
    </MobileViewport>
  );
}
