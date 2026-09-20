/**
 * 图片地址拼接尺寸参数。
 *
 * 三条边界都是踩过的坑：
 * - 空 url、base64 Data URL、`local://` 原样返回；
 * - 带签名的地址（含 `x-signature`）不能动：多一个参数就可能让签名失效，
 *   而且这类 CDN 本来也不吃 `param`（实测加不加都返回同一张图）；
 * - 已有查询串要接 `&`，`size` 为空就干脆不拼——`?param=` 这种空值会把地址
 *   变成非法 URL，服务端直接 403（抖音头像就是这么坏的）。
 */
export const getImgUrl = (url: string | undefined, size: string = ''): string => {
  if (!url) return '';
  if (url.startsWith('data:') || url.startsWith('local://')) return url;
  if (url.includes('x-signature=')) return url;
  if (!size) return url;

  if (url.includes('thumbnail')) {
    // 只替换最后一个 thumbnail 参数的尺寸
    return url.replace(/thumbnail=\d+y\d+(?!.*thumbnail)/, `thumbnail=${size}`);
  }

  return `${url}${url.includes('?') ? '&' : '?'}param=${size}`;
};
