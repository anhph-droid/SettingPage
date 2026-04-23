export function isBannerExpired(timeEndValue, now = new Date()) {
  if (!timeEndValue) return false;
  return new Date(timeEndValue).getTime() <= now.getTime();
}

export function getBannerStatusMeta(banner, now = new Date()) {
  if (isBannerExpired(banner.timeEnd, now)) {
    return { tone: "attention", label: "End time" };
  }

  return banner.status
    ? { tone: "success", label: "Enabled" }
    : { tone: "critical", label: "Disabled" };
}

export function getPersistedBannerStatus(requestedStatus, timeEndValue, now = new Date()) {
  return isBannerExpired(timeEndValue, now) ? false : requestedStatus;
}

export function hasTimeEndChanged(previousTimeEndValue, nextTimeEndValue) {
  if (!previousTimeEndValue && !nextTimeEndValue) return false;
  if (!previousTimeEndValue || !nextTimeEndValue) return true;

  return new Date(previousTimeEndValue).getTime() !== new Date(nextTimeEndValue).getTime();
}

function padDatePart(value) {
  return String(value).padStart(2, "0");
}

export function formatDateTimeForInput(dateValue) {
  if (!dateValue) return "";

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "";

  return `${date.getFullYear()}-${padDatePart(date.getMonth() + 1)}-${padDatePart(date.getDate())}T${padDatePart(date.getHours())}:${padDatePart(date.getMinutes())}`;
}

export function formatDateTimeForShopify(dateValue, locale = "en-US") {
  if (!dateValue) return "";

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "";

  const formatted = new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);

  return formatted.replace(",", " at");
}
