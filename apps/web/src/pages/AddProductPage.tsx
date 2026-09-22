import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { ProductCandidate } from "@vanity/contracts/types";
import cameraIcon from "../assets/figma/icon-camera.svg";
import searchIcon from "../assets/figma/icon-search.svg";
import { MobileViewport } from "../components/layout/MobileViewport";
import { BackLink } from "../components/ui/BackLink";
import { Button } from "../components/ui/Button";
import { useAppStore } from "../stores/useAppStore";
import { aiClient } from "../services/aiClient";

export function AddProductPage() {
  const navigate = useNavigate();
  const addProduct = useAppStore((state) => state.addProduct);
  const beautyBag = useAppStore((state) => state.beautyBag);
  const [query, setQuery] = useState("");
  const [searched, setSearched] = useState(false);
  const [candidates, setCandidates] = useState<ProductCandidate[]>([]);
  const [selected, setSelected] = useState<ProductCandidate>();
  const [notes, setNotes] = useState("");
  const [experience, setExperience] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "searching" | "error">("idle");

  const search = async () => {
    const cleanQuery = query.trim();
    if (!cleanQuery) { setMessage("请输入品牌或完整产品名称。"); return; }
    setSearched(true); setStatus("searching"); setMessage(""); setSelected(undefined);
    try {
      const result = await aiClient.searchProducts(cleanQuery);
      setCandidates(result.candidates.slice(0, 3));
      setStatus("idle");
    } catch (error) {
      setCandidates([]);
      setMessage(error instanceof Error ? error.message : "商品搜索暂时没完成，请稍后重试。");
      setStatus("error");
    }
  };

  const confirmCandidate = () => {
    if (!selected) return;
    const duplicate = beautyBag.some((product) =>
      product.brand.toLocaleLowerCase() === selected.brand.toLocaleLowerCase()
      && product.name.toLocaleLowerCase() === selected.name.toLocaleLowerCase()
      && (product.shade ?? "").toLocaleLowerCase() === (selected.shade ?? "").toLocaleLowerCase());
    if (duplicate) { setMessage("这件产品已经在你的美妆包里了。"); return; }
    const timestamp = new Date().toISOString();
    addProduct({
      id: `product-${Date.now()}`,
      brand: selected.brand,
      name: selected.name,
      category: selected.category,
      shade: selected.shade,
      imageUrl: selected.imageUrl || undefined,
      tags: selected.tags,
      userNotes: notes.trim() || undefined,
      userExperience: experience.trim() || undefined,
      source: selected.evidence[0] ? { url: selected.evidence[0].url, title: selected.evidence[0].title, retrievedAt: timestamp } : undefined,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
    setMessage("已加入你的美妆包。");
    setSelected(undefined);
  };

  return (
    <MobileViewport className="add-product-page">
      <div className="add-product-page__scroll">
      <header className="flow-header add-product-page__header">
        <BackLink to="/beauty-bag" label="ADD TO BEAUTY BAG" />
        <h1 className="brand-title">添加你的产品</h1>
        <p className="body-small">MVP 使用品牌或产品名称搜索；包装识别暂为视觉入口。</p>
      </header>

      <section className="add-product-page__photo">
        <img src={cameraIcon} width="32" height="32" alt="" />
        <p>拍摄包装正面，AI 自动识别</p>
        <span className="eyebrow">暂未开放 · 请使用文字搜索</span>
        <div><Button size="medium" disabled>拍照识别</Button><Button size="medium" emphasis="secondary" disabled>从相册选择</Button></div>
      </section>

      <form className="add-product-page__search" onSubmit={(event) => { event.preventDefault(); void search(); }}>
        <img src={searchIcon} width="20" height="20" alt="" />
        <input aria-label="搜索品牌或产品名称" value={query} onChange={(event) => { setQuery(event.target.value); setMessage(""); }} placeholder="例如：NARS Light Reflecting" />
        <button type="submit" disabled={status === "searching"}>{status === "searching" ? "搜索中…" : "搜索"}</button>
      </form>

      <section className="add-product-page__results">
        <p className="eyebrow">{searched ? "SEARCH RESULTS" : "最近加入"}</p>
        {message && <p className="add-product-page__message" role="status">{message}</p>}
        {status === "error" && !message && <p className="body-small">商品搜索暂时没完成，请稍后重试。</p>}
        {status === "idle" && searched && candidates.length === 0 && <p className="body-small">没有找到可靠候选，请补充品牌、完整名称或色号。</p>}

        {!searched && beautyBag.length === 0 && <p className="body-small">输入品牌与完整产品名，AI 会联网核对并提供最多 3 个候选。</p>}
        {!searched && beautyBag.slice(0, 3).map((product) => (
          <article className="candidate-row" key={product.id}>
            <span className={`candidate-row__image candidate-row__image--${product.category}`} />
            <div><strong>{product.brand}</strong><span>{product.name}{product.shade ? ` · ${product.shade}` : ""}</span></div>
            <span className="candidate-row__saved">已加入</span>
          </article>
        ))}

        {searched && candidates.map((product, index) => {
          const candidateId = `${product.brand}-${product.name}-${product.shade ?? index}`;
          const lowConfidence = product.confidence === "low";
          const isSelected = selected === product;
          return (
            <article className={`candidate-row ${isSelected ? "candidate-row--selected" : ""}`} key={candidateId}>
              <span className={`candidate-row__image candidate-row__image--${product.category}`}>
                {product.imageUrl && <img src={product.imageUrl} alt="" onError={(event) => event.currentTarget.remove()} />}
              </span>
              <div><strong>{product.brand}</strong><span>{product.name}{product.shade ? ` · ${product.shade}` : ""} · {product.confidence}</span></div>
              <button type="button" disabled={lowConfidence} onClick={() => { setSelected(product); setNotes(""); setExperience(""); setMessage(""); }}>
                {lowConfidence ? "需重搜" : isSelected ? "已选择" : "选择"}
              </button>
              {product.evidence[0]?.url && <a className="candidate-row__source" href={product.evidence[0].url} target="_blank" rel="noreferrer">查看来源</a>}
            </article>
          );
        })}

        {selected && (
          <div className="candidate-confirmation">
            <p className="eyebrow">CONFIRM PRODUCT</p>
            <h2>{selected.brand} · {selected.name}</h2>
            <p>{[selected.shade, ...(selected.tags ?? [])].filter(Boolean).join(" · ")}</p>
            <label>我的备注<input value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="可选，例如：适合秋冬" /></label>
            <label>使用体验<textarea value={experience} onChange={(event) => setExperience(event.target.value)} placeholder="可选，例如：鼻翼需要少量使用" /></label>
            <Button size="medium" fullWidth onClick={confirmCandidate}>确认加入美妆包</Button>
            <button className="quiet-action" type="button" onClick={() => setSelected(undefined)}>都不是／重新选择</button>
          </div>
        )}
      </section>
      </div>

      <div className="fixed-action"><Button fullWidth onClick={() => navigate("/beauty-bag")}>查看我的美妆包</Button></div>
    </MobileViewport>
  );
}
