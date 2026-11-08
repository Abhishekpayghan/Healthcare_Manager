// One small helper that every page uses to talk to the Django API

function errorText(data) {
  if (!data) return "Something went wrong";
  const details = data.details;
  if (details && typeof details === "object") {
    // turn {"last_name": ["This field is required."]} into one readable line
    return Object.entries(details)
      .map(([field, msg]) => `${field}: ${[].concat(msg).join(" ")}`)
      .join(" | ");
  }
  return data.error || "Something went wrong";
}

export async function api(path, options = {}) {
  const headers = {};
  const token = localStorage.getItem("token");
  if (token) headers.Authorization = `Token ${token}`;
  // for file uploads the browser sets the content type itself
  if (!(options.body instanceof FormData)) headers["Content-Type"] = "application/json";

  const response = await fetch(`/api${path}`, { ...options, headers });
  if (response.status === 204) return null;

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    if (response.status === 401 && token) {
      // token is no longer valid, so log out
      localStorage.clear();
      window.location.href = "/login";
    }
    throw new Error(errorText(data));
  }
  return data;
}

export function getUser() {
  try {
    return JSON.parse(localStorage.getItem("user"));
  } catch {
    return null;
  }
}
