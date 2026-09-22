import type { BeautyContext, WeatherContext } from "@vanity/contracts/types";

const locationLabels: Record<NonNullable<BeautyContext["locationType"]>, string> = {
  indoor: "主要室内",
  outdoor: "主要户外",
  mixed: "室内外都有",
  unknown: "",
};

const conditionLabels: Record<string, string> = {
  hot: "高温",
  warm: "温暖",
  cold: "低温",
  humid: "高湿",
  dry: "干燥",
  rain: "有雨",
  rain_possible: "可能下雨",
  high_uv: "高紫外线",
};

function weatherLabel(weather?: WeatherContext) {
  if (!weather) return "";
  const labels = (weather.interpretedConditions ?? [])
    .map((condition) => conditionLabels[condition] ?? condition)
    .filter(Boolean);

  if (!labels.length) {
    if ((weather.temperature ?? 0) >= 30) labels.push("高温");
    if ((weather.humidity ?? 0) >= 70) labels.push("高湿");
    if (weather.rain?.expected || (weather.rain?.probability ?? 0) >= 40) labels.push("可能下雨");
    if ((weather.uv ?? 0) >= 7) labels.push("高紫外线");
  }

  return [...new Set(labels)].slice(0, 2).join(" · ");
}

export function contextLabels(context?: BeautyContext, followUpAnswer?: string) {
  if (!context) return [];
  const location = followUpAnswer?.trim()
    || (context.locationType ? locationLabels[context.locationType] : "");

  return [
    context.occasion?.trim(),
    location,
    context.desiredEffect?.filter(Boolean).slice(0, 2).join(" · "),
    weatherLabel(context.weather),
    context.timeMinutes ? `${context.timeMinutes} 分钟` : "",
  ].filter((label): label is string => Boolean(label));
}
