const setCookie = (name: string, value: string, options: { days?: number } = {}) => {
  const maxAge = options.days ? options.days * 24 * 60 * 60 : undefined;
  const cookieParts = [`${name}=${encodeURIComponent(value)}`, "path=/", "SameSite=Lax"];

  if (maxAge) {
    cookieParts.push(`Max-Age=${maxAge}`);
  }

  document.cookie = cookieParts.join("; ");
};

const getCookie = (name: string): string | null => {
  if (typeof document === "undefined") {
    return null;
  }

  const match = document.cookie.split("; ").find((entry) => entry.startsWith(`${name}=`));

  if (!match) {
    return null;
  }

  return decodeURIComponent(match.split("=").slice(1).join("="));
};

const eraseCookie = (name: string) => {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
};

export const sessionStorage = {
  get: getCookie,
  set: setCookie,
  remove: eraseCookie,
};
