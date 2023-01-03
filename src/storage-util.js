const localStorage = window.localStorage;

export function setUser(key, userInfo) {
  localStorage.setItem(`o3o.${key}`, JSON.stringify(userInfo));
}

export function getUser(key) {
  const userStr = localStorage.getItem(`o3o.${key}`);
  if (userStr === "") {
    return {};
  } else {
    return JSON.parse(userStr);
  }
}
