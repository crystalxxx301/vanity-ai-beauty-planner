import { useEffect, useRef, useState } from "react";
import type { BeautyContext, VisibleBeautyState } from "@vanity/contracts/types";
import { useNavigate } from "react-router-dom";
import photoIcon from "../assets/figma/icon-photo.svg";
import { MobileViewport } from "../components/layout/MobileViewport";
import { BackLink } from "../components/ui/BackLink";
import { Button } from "../components/ui/Button";
import { usePlanDraftStore } from "../stores/usePlanDraftStore";
import { useAppStore } from "../stores/useAppStore";
import { aiClient } from "../services/aiClient";

export function SceneInputPage() {
  const navigate = useNavigate();
  const faceInputRef = useRef<HTMLInputElement>(null);
  const outfitInputRef = useRef<HTMLInputElement>(null);
  const photoRequestRef = useRef({ face: 0, outfit: 0 });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [faceStatus, setFaceStatus] = useState<"idle" | "analyzing" | "success">(
    () => usePlanDraftStore.getState().faceAnalysisSource === "photo" ? "success" : "idle",
  );
  const [outfitStatus, setOutfitStatus] = useState<"idle" | "analyzing" | "success">(
    () => usePlanDraftStore.getState().outfitAnalysisSource === "photo" ? "success" : "idle",
  );
  const [facePreview, setFacePreview] = useState<{ name: string; url: string }>();
  const [outfitPreview, setOutfitPreview] = useState<{ name: string; url: string }>();
  const [speechStatus, setSpeechStatus] = useState<"ready" | "recording" | "transcribing">("ready");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const {
    description,
    quickContexts,
    setDescription,
    loadDemoScenario,
    setParsedContext,
    setFollowUp,
    weather,
    demoMode,
    setWeather,
    setVisibleBeautyState,
    setOutfit,
  } = usePlanDraftStore();
  const loadDemoBag = useAppStore((state) => state.loadDemoBag);

  useEffect(() => () => {
    const recorder = mediaRecorderRef.current;
    if (recorder?.state === "recording") recorder.stop();
    recorder?.stream.getTracks().forEach((track) => track.stop());
  }, []);

  useEffect(() => () => { if (facePreview) URL.revokeObjectURL(facePreview.url); }, [facePreview]);
  useEffect(() => () => { if (outfitPreview) URL.revokeObjectURL(outfitPreview.url); }, [outfitPreview]);

  const useLocation = () => {
    if (!navigator.geolocation) { setError("当前浏览器不支持定位，你可以直接在描述中补充天气。"); return; }
    setError("正在读取模糊位置天气…");
    navigator.geolocation.getCurrentPosition(async ({ coords }) => {
      try { setWeather(await aiClient.getWeather(coords.latitude, coords.longitude)); setError(""); }
      catch { setError("天气服务暂时不可用，你可以直接用文字补充天气。"); }
    }, () => setError("没有获得定位权限。你仍可直接用文字补充天气。"), { enableHighAccuracy: false, timeout: 8000, maximumAge: 900000 });
  };

  const toggleRecording = async () => {
    if (speechStatus === "recording") { mediaRecorderRef.current?.stop(); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const chunks: Blob[] = [];
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data); };
      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        setSpeechStatus("transcribing");
        try {
          const { text } = await aiClient.transcribeAudio(new Blob(chunks, { type: recorder.mimeType }));
          setDescription([description.trim(), text.trim()].filter(Boolean).join(" "));
          setError("");
        } catch { setError("语音转写失败，你可以重试或继续打字。"); }
        setSpeechStatus("ready");
      };
      recorder.start(); setSpeechStatus("recording"); setError("");
      window.setTimeout(() => { if (recorder.state === "recording") recorder.stop(); }, 45_000);
    } catch { setError("没有获得麦克风权限，你仍可继续打字。"); }
  };

  const selectPhoto = async (file: File | undefined, kind: "face" | "outfit") => {
    if (!file) return;
    if (!new Set(["image/jpeg", "image/png", "image/webp"]).has(file.type)) { setError("仅支持 JPG、PNG 或 WebP 图片。"); return; }
    if (file.size > 8 * 1024 * 1024) { setError("图片超过 8MB，请选择更小的 JPG、PNG 或 WebP。"); return; }
    const requestId = ++photoRequestRef.current[kind];
    const preview = { name: file.name, url: URL.createObjectURL(file) };
    if (kind === "face") { if (facePreview) URL.revokeObjectURL(facePreview.url); setFacePreview(preview); setVisibleBeautyState(undefined); setFaceStatus("analyzing"); }
    else { if (outfitPreview) URL.revokeObjectURL(outfitPreview.url); setOutfitPreview(preview); setOutfit(undefined); setOutfitStatus("analyzing"); }
    setError("");
    try {
      const result = await aiClient.analyzeImage(file, kind);
      if (photoRequestRef.current[kind] !== requestId) return;
      if (kind === "face") { setVisibleBeautyState(result as VisibleBeautyState); setFaceStatus("success"); }
      else { setOutfit(result as NonNullable<BeautyContext["outfit"]>); setOutfitStatus("success"); }
    } catch {
      if (photoRequestRef.current[kind] !== requestId) return;
      if (kind === "face") setFaceStatus("idle"); else setOutfitStatus("idle");
      setError(`${kind === "face" ? "面部" : "穿搭"}照片分析失败；这张照片不会用于方案，你可以重新选择。`);
    }
  };

  const removePhoto = (kind: "face" | "outfit") => {
    photoRequestRef.current[kind] += 1;
    if (kind === "face") {
      if (facePreview) URL.revokeObjectURL(facePreview.url);
      setFacePreview(undefined); setFaceStatus("idle"); setVisibleBeautyState(undefined);
      if (faceInputRef.current) faceInputRef.current.value = "";
    } else {
      if (outfitPreview) URL.revokeObjectURL(outfitPreview.url);
      setOutfitPreview(undefined); setOutfitStatus("idle"); setOutfit(undefined);
      if (outfitInputRef.current) outfitInputRef.current.value = "";
    }
  };

  const submit = async () => {
    if (faceStatus === "analyzing" || outfitStatus === "analyzing") {
      setError("请等照片分析完成后再继续。");
      return;
    }
    if (!description.trim()) {
      setError("请至少描述今天的场景、时间或想要呈现的状态。");
      return;
    }
    setSubmitting(true);
    try {
      const parsed = await aiClient.parseContext(description, quickContexts, demoMode);
      const current = usePlanDraftStore.getState();
      const context = { ...parsed, weather: current.weather ?? parsed.weather, visibleBeautyState: current.visibleBeautyState ?? parsed.visibleBeautyState, outfit: current.outfit ?? parsed.outfit };
      setParsedContext(context);
      const followUp = await aiClient.getFollowUp(context);
      setFollowUp(followUp);
      navigate(followUp.needed ? "/plan/follow-up" : "/plan/building");
    } catch {
      setError("AI 暂时无法理解本次输入。内容已保留，请稍后重试；示例场景也需要 AI 正常工作。");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <MobileViewport className="scene" scrollable>
      <header className="scene__header">
        <BackLink to="/home" label="CREATE BEAUTY PLAN · 01" />
        <h1 className="brand-title">今天会是怎样的一天？</h1>
        <p className="body-small">告诉我场合、时间，以及你想呈现的状态。</p>
      </header>

      <section className="scene__description surface-card surface-card--soft">
        <label className="eyebrow" htmlFor="day-description">DESCRIBE YOUR DAY</label>
        <textarea
          id="day-description"
          value={description}
          onChange={(event) => {
            if (demoMode) { if (!facePreview) setFaceStatus("idle"); if (!outfitPreview) setOutfitStatus("idle"); }
            setDescription(event.target.value);
            setError("");
          }}
          placeholder="例如：下午有一场客户提案，晚上和朋友吃饭。希望看起来专业、有精神，但不要显得太强势。"
        />
        <button className="scene__speech" type="button" onClick={toggleRecording} disabled={speechStatus === "transcribing"}>
          {speechStatus === "recording" ? "■ 停止录音" : speechStatus === "transcribing" ? "正在转写…" : "● 语音输入"}
        </button>
      </section>

      <section className="scene__photo">
        <span className="photo-icon"><img src={photoIcon} width="22" height="22" alt="" /></span>
        <div className="scene__photo-options">
          <div className="scene__photo-option">
            {facePreview && <img src={facePreview.url} alt="面部状态本地预览" />}
            <button type="button" disabled={submitting} onClick={() => faceInputRef.current?.click()}>{faceStatus === "analyzing" ? "分析面部状态…" : facePreview || faceStatus === "success" ? "重新选择面部照片" : "面部状态照片"}</button>
            {(facePreview || faceStatus === "success") && <button className="scene__photo-remove" type="button" disabled={submitting} onClick={() => removePhoto("face")}>移除</button>}
          </div>
          <div className="scene__photo-option">
            {outfitPreview && <img src={outfitPreview.url} alt="穿搭参考本地预览" />}
            <button type="button" disabled={submitting} onClick={() => outfitInputRef.current?.click()}>{outfitStatus === "analyzing" ? "分析穿搭…" : outfitPreview || outfitStatus === "success" ? "重新选择穿搭照片" : "穿搭参考照片"}</button>
            {(outfitPreview || outfitStatus === "success") && <button className="scene__photo-remove" type="button" disabled={submitting} onClick={() => removePhoto("outfit")}>移除</button>}
          </div>
          <small>{faceStatus === "analyzing" || outfitStatus === "analyzing" ? "正在分析，请稍候再继续" : `面部：${faceStatus === "success" ? "已分析" : "未分析"} · 穿搭：${outfitStatus === "success" ? "已分析" : "未分析"}；原图不长期保存`}</small>
        </div>
      </section>
      <input
        ref={faceInputRef}
        className="visually-hidden"
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={(event) => void selectPhoto(event.target.files?.[0], "face")}
      />
      <input ref={outfitInputRef} className="visually-hidden" type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => void selectPhoto(event.target.files?.[0], "outfit")} />

      <button className="scene__location" type="button" onClick={useLocation}>
        <span>{weather ? "✓ 已加入当地天气" : "Use my location"}</span>
        <small>{weather ? `${Math.round(weather.temperature ?? 0)}°C · 湿度 ${Math.round(weather.humidity ?? 0)}% · 降雨 ${Math.round(weather.rain?.probability ?? 0)}% · UV ${weather.uv ?? 0}` : "约 10 公里精度，仅用于本次方案"}</small>
      </button>

      {error && <p className="scene__message" role="status">{error}</p>}

      <button
        className="scene__demo"
        type="button"
        disabled={submitting}
        onClick={() => {
          photoRequestRef.current.face += 1; photoRequestRef.current.outfit += 1;
          if (facePreview) URL.revokeObjectURL(facePreview.url);
          if (outfitPreview) URL.revokeObjectURL(outfitPreview.url);
          setFacePreview(undefined); setOutfitPreview(undefined);
          if (faceInputRef.current) faceInputRef.current.value = "";
          if (outfitInputRef.current) outfitInputRef.current.value = "";
          loadDemoScenario(); loadDemoBag(); setFaceStatus("idle"); setOutfitStatus("idle"); setError("");
        }}
      >
        Try a demo scenario
      </button>

      <div className="scene__submit">
        <Button fullWidth onClick={submit} disabled={submitting || faceStatus === "analyzing" || outfitStatus === "analyzing"}>{submitting ? "正在理解你的场景…" : faceStatus === "analyzing" || outfitStatus === "analyzing" ? "等待照片分析完成…" : "继续，让 AI 追问"}</Button>
      </div>
    </MobileViewport>
  );
}
