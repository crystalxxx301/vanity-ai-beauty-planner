import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { BeautyProduct, ProductCategory } from "@vanity/contracts/types";
import { MobileViewport } from "../components/layout/MobileViewport";
import { BackLink } from "../components/ui/BackLink";
import { Button } from "../components/ui/Button";
import { useAppStore } from "../stores/useAppStore";

const categoryOrder: ProductCategory[] = ["skincare", "base", "eyes", "brows", "cheeks", "lips", "finish"];
const categoryNames: Record<ProductCategory, string> = {
  skincare: "护肤", base: "底妆", eyes: "眼妆", brows: "眉妆", cheeks: "腮红", lips: "唇妆", finish: "定妆",
};

export function BeautyBagPage() {
  const navigate = useNavigate();
  const products = useAppStore((state) => state.beautyBag);
  const loadDemoBag = useAppStore((state) => state.loadDemoBag);
  const updateProduct = useAppStore((state) => state.updateProduct);
  const removeProduct = useAppStore((state) => state.removeProduct);
  const removeDemoProducts = useAppStore((state) => state.removeDemoProducts);
  const [editingId, setEditingId] = useState<string>();
  const [notes, setNotes] = useState("");
  const [experience, setExperience] = useState("");
  const grouped = categoryOrder
    .map((category) => ({ category, products: products.filter((product) => product.category === category) }))
    .filter((group) => group.products.length > 0);

  const startEditing = (product: BeautyProduct) => {
    setEditingId(product.id);
    setNotes(product.userNotes ?? "");
    setExperience(product.userExperience ?? "");
  };

  const saveEditing = () => {
    if (!editingId) return;
    updateProduct(editingId, { userNotes: notes.trim() || undefined, userExperience: experience.trim() || undefined });
    setEditingId(undefined);
  };

  const confirmDelete = (product: BeautyProduct) => {
    if (window.confirm(`确定从美妆包删除“${product.brand} ${product.name}”吗？`)) removeProduct(product.id);
  };

  return (
    <MobileViewport className="bag-page">
      <div className="bag-page__scroll">
      <header className="flow-header bag-page__header">
        <BackLink to="/home" label="MY BEAUTY BAG" />
        <h1 className="brand-title">我的美妆包</h1>
        <p className="body-small">优先用好你已经拥有的产品。</p>
      </header>

      <section className="bag-page__count">
        <p className="eyebrow">YOUR COLLECTION</p>
        <strong>{products.length}</strong>
        <span>件产品保存在本机</span>
      </section>

      <section className="bag-page__list">
        {products.length === 0 ? (
          <div className="bag-empty surface-card">
            <h2 className="editorial-title">从你的第一件产品开始</h2>
            <p className="body-small">美妆包为空也可以生成方案；添加产品后，AI 会优先使用已有物品。</p>
            <Button size="medium" fullWidth onClick={() => navigate("/beauty-bag/add")}>添加第一件产品</Button>
            <button className="quiet-action" type="button" onClick={loadDemoBag}>使用示例美妆包</button>
            <button className="quiet-action" type="button" onClick={() => navigate("/plan/new")}>暂时跳过</button>
          </div>
        ) : grouped.map((group) => (
          <div className="bag-category" key={group.category}>
            <p className="eyebrow">{categoryNames[group.category]} · {group.products.length}</p>
            {group.products.map((product) => (
              <article className="bag-product" key={product.id}>
                <span className={`bag-product__swatch bag-product__swatch--${product.category}`}>
                  {product.imageUrl && <img src={product.imageUrl} alt="" onError={(event) => event.currentTarget.remove()} />}
                </span>
                <div>
                  <p className="eyebrow">{product.category.toUpperCase()}{product.isDemo ? " · DEMO" : ""}</p>
                  <h2>{product.brand} · {product.name}</h2>
                  <p>{[product.shade, ...(product.tags ?? []).slice(0, 3)].filter(Boolean).join(" · ") || "尚未添加标签"}</p>
                </div>
                <div className="bag-product__menu">
                  <button type="button" onClick={() => startEditing(product)}>编辑</button>
                  <button type="button" aria-label={`删除 ${product.name}`} onClick={() => confirmDelete(product)}>×</button>
                </div>
                {editingId === product.id && (
                  <div className="bag-product__editor">
                    <label>备注<input value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="例如：更适合秋冬" /></label>
                    <label>使用体验<textarea value={experience} onChange={(event) => setExperience(event.target.value)} placeholder="例如：持妆约 6 小时，鼻翼需少量使用" /></label>
                    <div><button type="button" onClick={() => setEditingId(undefined)}>取消</button><button type="button" onClick={saveEditing}>保存修改</button></div>
                  </div>
                )}
              </article>
            ))}
          </div>
        ))}
        {products.some((product) => product.isDemo) && (
          <button className="quiet-action bag-page__remove-demo" type="button" onClick={() => { if (window.confirm("确定移除全部示例产品吗？")) removeDemoProducts(); }}>移除全部示例产品</button>
        )}
      </section>
      </div>

      {products.length > 0 && (
        <div className="bag-page__actions">
          <Button emphasis="secondary" onClick={() => navigate("/beauty-bag/add")}>+ 添加产品</Button>
          <Button onClick={() => navigate("/plan/new")}>Create Beauty Plan</Button>
        </div>
      )}
    </MobileViewport>
  );
}
