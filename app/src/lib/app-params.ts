const isNode = typeof window === 'undefined';
const storage = isNode ? null : window.localStorage;

function getAppParamValue(
  paramName: string,
  { defaultValue, removeFromUrl = false }: { defaultValue?: string; removeFromUrl?: boolean } = {}
): string | null {
  if (isNode || !storage) {
    return defaultValue ?? null;
  }
  const urlParams = new URLSearchParams(window.location.search);
  const searchParam = urlParams.get(paramName);
  if (removeFromUrl && searchParam) {
    urlParams.delete(paramName);
    const newUrl = `${window.location.pathname}${urlParams.toString() ? `?${urlParams.toString()}` : ''}${window.location.hash}`;
    window.history.replaceState({}, document.title, newUrl);
  }
  return searchParam || defaultValue || null;
}

if (!isNode && storage && getAppParamValue('clear_access_token') === 'true') {
  storage.removeItem('app_access_token');
  storage.removeItem('token');
}

const accessTokenFromUrl = !isNode
  ? getAppParamValue('access_token', { removeFromUrl: true })
  : null;

if (!isNode && storage && accessTokenFromUrl) {
  storage.setItem('app_access_token', accessTokenFromUrl);
}

export const appParams = {
  token: !isNode && storage ? storage.getItem('app_access_token') : null,
  fromUrl: !isNode ? getAppParamValue('from_url', { defaultValue: window.location.href }) : null,
};
