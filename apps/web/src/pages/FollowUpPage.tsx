import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MobileViewport } from "../components/layout/MobileViewport";
import { BackLink } from "../components/ui/BackLink";
import { Button } from "../components/ui/Button";
import { usePlanDraftStore } from "../stores/usePlanDraftStore";
import { contextLabels } from "../utils/contextLabels";

const defaultChoices = ["主要室内", "主要户外", "不确定"];

export function FollowUpPage() {
  const navigate = useNavigate();
  const followUp = usePlanDraftStore((state) => state.followUp);
  const savedAnswer = usePlanDraftStore((state) => state.followUpAnswer);
  const setFollowUpAnswer = usePlanDraftStore((state) => state.setFollowUpAnswer);
  const parsedContext = usePlanDraftStore((state) => state.parsedContext);
  const choices = followUp?.options?.length ? followUp.options : defaultChoices;
  const [answer, setAnswer] = useState(savedAnswer ?? choices[0]);
  const continueFlow = () => { setFollowUpAnswer(answer); navigate("/plan/building"); };

  return (
    <MobileViewport className="follow-up">
      <header className="flow-header follow-up__header">
        <BackLink to="/plan/new" label="AI FOLLOW-UP · 02" />
        <h1 className="brand-title">再确认一件事</h1>
        <p className="body-small">我已经理解你的场景。这个选择会影响接下来的妆容取舍。</p>
      </header>

      <section className="follow-up__question surface-card surface-card--soft">
        <p className="eyebrow">QUESTION 01</p>
        <h2>{followUp?.question ?? "这个场景主要在室内，还是在户外？"}</h2>
        <div className="choice-list">
          {choices.map((choice) => (
            <button
              className={`choice-row ${answer === choice ? "choice-row--selected" : ""}`}
              type="button"
              key={choice}
              onClick={() => setAnswer(choice)}
            >
              {answer === choice ? "✓  " : ""}{choice}
            </button>
          ))}
        </div>
      </section>

      <section className="follow-up__understanding">
        <p className="eyebrow">AI 已理解</p>
        <p>{contextLabels(parsedContext, answer).join(" · ") || "将根据你的输入生成个性化方案"}</p>
      </section>

      <button className="quiet-action follow-up__skip" type="button" onClick={() => { setFollowUpAnswer(undefined); navigate("/plan/building"); }}>跳过，让 AI 做合理假设</button>
      <div className="fixed-action"><Button fullWidth onClick={continueFlow}>生成我的 Beauty Plan</Button></div>
    </MobileViewport>
  );
}
