import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import constellation from "../assets/figma/decision-constellation.svg";
import core from "../assets/figma/ai-decision-core.svg";
import { MobileViewport } from "../components/layout/MobileViewport";
import { Button } from "../components/ui/Button";
import { aiClient } from "../services/aiClient";
import { usePlanDraftStore } from "../stores/usePlanDraftStore";
import { useAppStore } from "../stores/useAppStore";
import { contextLabels } from "../utils/contextLabels";

const tagPositions = ["one", "two", "three", "four", "five"];

function visibleFaceNotes(state: NonNullable<ReturnType<typeof usePlanDraftStore.getState>["visibleBeautyState"]>) {
  const notes: string[] = [];
  if (state.redness === "mild" || state.redness === "visible") notes.push("可见泛红");
  if (state.dryness === "mild" || state.dryness === "visible") notes.push("可见干燥");
  if (state.oiliness === "mild" || state.oiliness === "visible") notes.push("可见出油");
  if (state.browsDefined === true) notes.push("眉形已有修饰");
  if (state.makeupAlreadyPresent === true) notes.push("已有妆容");
  if (state.visibleIrritationOrWound === true) notes.push("可见刺激或破损区域，需谨慎避开");
  return notes;
}

export function LoadingPage() {
  const navigate = useNavigate();
  const parsedContext = usePlanDraftStore((state) => state.parsedContext);
  const followUpAnswer = usePlanDraftStore((state) => state.followUpAnswer);
  const faceAnalysisSource = usePlanDraftStore((state) => state.faceAnalysisSource);
  const outfitAnalysisSource = usePlanDraftStore((state) => state.outfitAnalysisSource);
  const beautyBag = useAppStore((state) => state.beautyBag);
  const setCurrentPlan = useAppStore((state) => state.setCurrentPlan);
  const saveCurrentPlan = useAppStore((state) => state.saveCurrentPlan);
  const tags = contextLabels(parsedContext, followUpAnswer);
  const [phase, setPhase] = useState<"review" | "generating">("review");
  const [attempt, setAttempt] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!parsedContext) {
      navigate("/plan/new", { replace: true });
    }
  }, [navigate, parsedContext]);

  useEffect(() => {
    if (phase !== "generating" || !parsedContext) return;
    let active = true;
    const startedAt = Date.now();
    setError("");
    void aiClient.generatePlan({ context: parsedContext, followUpAnswer, beautyBag })
      .then((plan) => {
        const remaining = Math.max(0, 1200 - (Date.now() - startedAt));
        window.setTimeout(() => {
          if (!active) return;
          setCurrentPlan(plan);
          saveCurrentPlan();
          navigate(`/plan/${plan.id}`, { replace: true });
        }, remaining);
      })
      .catch((cause: unknown) => {
        if (!active) return;
        const detail = cause instanceof Error && cause.message.includes("穿搭") ? `${cause.message}。` : "";
        setError(`${detail}这次生成没有完成。你的输入还在，可以直接重试或返回修改。`);
      });
    return () => { active = false; };
  }, [attempt, beautyBag, followUpAnswer, navigate, parsedContext, phase, saveCurrentPlan, setCurrentPlan]);

  if (phase === "review") {
    const face = parsedContext?.visibleBeautyState;
    const faceNotes = face ? visibleFaceNotes(face) : [];
    const outfit = parsedContext?.outfit;
    const outfitClear = outfit?.visibility === "clear";
    return (
      <MobileViewport className="loading-page loading-page--review">
        <div className="loading-review__scroll">
          <header className="loading-review__header">
            <p className="eyebrow">AI BEAUTY DECISION · 03</p>
            <h1 className="brand-title">先确认，我看到了什么</h1>
            <p className="body-small">确认本次照片与场景分析后，再生成妆容方案。</p>
          </header>
          <div className="loading-review__visual" aria-hidden="true">
            <img className="loading-review__constellation" src={constellation} alt="" />
            <img className="loading-review__core" src={core} alt="" />
            <span>AI</span>
          </div>
          <div className="loading-review__tags">
            {tags.map((tag, index) => <span key={`${tag}-${index}`}>{tag}</span>)}
          </div>
          <section className="loading-review__card surface-card">
            <p className="eyebrow">PHOTO & CONTEXT CHECK</p>
            <div className="loading-review__item">
              <h2>面部状态</h2>
              <p>{face
                ? `${faceAnalysisSource === "demo" ? "示例场景：" : ""}${faceNotes.length ? faceNotes.join(" · ") : "照片中没有足够明确、需要特别调整的可见线索。"}`
                : "未提供面部照片；不会推测皮肤状态。"}</p>
            </div>
            <div className="loading-review__item">
              <h2>穿搭参考</h2>
              <p>{outfitClear
                ? `${outfitAnalysisSource === "demo" ? "示例场景：" : ""}${[outfit.description, outfit.dominantColor && `主色：${outfit.dominantColor}`].filter(Boolean).join(" · ")}`
                : outfit ? "照片里没有清晰可识别的服装；本次不会据此推断颜色或风格。" : "未提供穿搭照片；本次不按照片推断穿搭。"}</p>
            </div>
            <p className="loading-review__notice">仅使用上述可确认的信息。照片原图不会保存在方案历史中。</p>
          </section>
        </div>
        <div className="loading-review__actions">
          <button type="button" onClick={() => navigate("/plan/new")}>返回修改</button>
          <Button onClick={() => setPhase("generating")}>确认分析，生成方案</Button>
        </div>
      </MobileViewport>
    );
  }

  return (
    <MobileViewport className="loading-page">
      <header className="loading-page__header">
        <p className="eyebrow">AI BEAUTY DECISION · 03</p>
        <h1 className="brand-title">正在整理今天的妆容</h1>
        <p className="body-small">把你的日程、状态与美妆包放在一起考虑</p>
      </header>

      <img className="loading-page__constellation" src={constellation} alt="" />
      <img className="loading-page__core" src={core} alt="" />
      <span className="loading-page__ai">AI</span>
      {tags.map((tag, index) => (
        <span className={`loading-tag loading-tag--${tagPositions[index]}`} key={`${tag}-${index}`}>{tag}</span>
      ))}

      <section className={`loading-page__progress surface-card ${error ? "loading-page__progress--error" : ""}`}>
        <p className="eyebrow">DECISION CHECK</p>
        {error ? (
          <>
            <p>{error}</p>
            <button className="loading-page__retry" type="button" onClick={() => setAttempt((value) => value + 1)}>重新生成</button>
          </>
        ) : (
          <>
            <p>✓　日程与场合</p>
            <p>✓　希望呈现的状态</p>
            <p className="loading-page__active">•　正在匹配 · 美妆包与持妆策略</p>
            <div className="progress-track"><span /></div>
          </>
        )}
      </section>
      <button className="quiet-action loading-page__cancel" type="button" onClick={() => navigate("/plan/new")}>取消并修改</button>
    </MobileViewport>
  );
}
