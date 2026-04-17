export const BANNER_PRESETS = [
  {
    key: "bar",
    title: "Bar",
    description: "Narrow horizontally aligned timer. Best for the top or bottom of any page.",
    size: "bar",
    position: "top",
  },
  {
    key: "small",
    title: "Small",
    description: "Small compact banner with a tighter layout for product and utility pages.",
    size: "small",
    position: "top",
  },
  {
    key: "inline",
    title: "Inline",
    description: "Compact centered banner for focused sections and featured offers.",
    size: "inline",
    position: "top",
  },
  {
    key: "large",
    title: "Large",
    description: "Page-wide highlighted banner with more spacing for big campaigns.",
    size: "large",
    position: "top",
  },
];

export function getBannerPreset(value) {
  if (!value || value === "medium") {
    return BANNER_PRESETS[0];
  }

  return BANNER_PRESETS.find((preset) => preset.key === value || preset.size === value) || BANNER_PRESETS[0];
}

export function getBannerSize(value) {
  return getBannerPreset(value).size;
}

export function getBannerPreviewStyle(size) {
  switch (size) {
    case "small":
      return {
        container: {
          maxWidth: "320px",
          margin: "0 auto",
          padding: "14px 18px",
          borderRadius: "16px",
          minHeight: "140px",
        },
        titleSize: "1.15rem",
        contentSize: "0.84rem",
        countdownValueSize: "1rem",
      };
    case "inline":
      return {
        container: {
          maxWidth: "460px",
          margin: "0 auto",
          padding: "18px 22px",
          borderRadius: "18px",
          minHeight: "160px",
        },
        titleSize: "1.35rem",
        contentSize: "0.9rem",
        countdownValueSize: "1.08rem",
      };
    case "large":
      return {
        container: {
          maxWidth: "100%",
          margin: "0 auto",
          padding: "28px 30px",
          borderRadius: "20px",
          minHeight: "220px",
        },
        titleSize: "2rem",
        contentSize: "1.05rem",
        countdownValueSize: "1.35rem",
      };
    case "bar":
    default:
      return {
        container: {
          maxWidth: "100%",
          margin: "0 auto",
          padding: "12px 18px",
          borderRadius: "12px",
          minHeight: "120px",
        },
        titleSize: "1.2rem",
        contentSize: "0.86rem",
        countdownValueSize: "1rem",
      };
  }
}
