import { describe, expect, it } from "vitest";
import { contextLabels } from "./contextLabels";

describe("contextLabels", () => {
  it("uses the current parsed context instead of demo wedding labels", () => {
    const labels = contextLabels({
      rawInput: "下午做客户提案，希望专业有精神",
      occasion: "客户提案",
      locationType: "indoor",
      desiredEffect: ["专业", "有精神"],
      timeMinutes: 15,
      weather: { temperature: 32, humidity: 76, rain: { probability: 20 }, uv: 8 },
    });

    expect(labels).toEqual(["客户提案", "主要室内", "专业 · 有精神", "高温 · 高湿", "15 分钟"]);
    expect(labels.join(" ")).not.toContain("婚礼");
  });

  it("lets the follow-up answer override a parsed location label", () => {
    const labels = contextLabels({ rawInput: "周末聚会", locationType: "unknown" }, "会长时间待在户外");
    expect(labels).toContain("会长时间待在户外");
  });
});
