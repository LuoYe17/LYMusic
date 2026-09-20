import { describe, expect, it } from 'vitest';

import { getImgUrl } from './imgUrl';

describe('getImgUrl', () => {
  it('returns empty string for missing url', () => {
    expect(getImgUrl(undefined)).toBe('');
    expect(getImgUrl('')).toBe('');
  });

  it('leaves data urls and local protocol untouched', () => {
    expect(getImgUrl('data:image/png;base64,AAA', '100y100')).toBe('data:image/png;base64,AAA');
    expect(getImgUrl('local://cover.png', '100y100')).toBe('local://cover.png');
  });

  it('appends param when the url has no query string', () => {
    expect(getImgUrl('https://cdn.example.com/a.jpg', '100y100')).toBe(
      'https://cdn.example.com/a.jpg?param=100y100'
    );
  });

  it('uses & when the url already has a query string', () => {
    expect(getImgUrl('https://cdn.example.com/a.jpg?x=1', '100y100')).toBe(
      'https://cdn.example.com/a.jpg?x=1&param=100y100'
    );
  });

  it('does not append anything when size is empty', () => {
    expect(getImgUrl('https://cdn.example.com/a.jpg')).toBe('https://cdn.example.com/a.jpg');
    expect(getImgUrl('https://cdn.example.com/a.jpg?x=1', '')).toBe(
      'https://cdn.example.com/a.jpg?x=1'
    );
  });

  it('never rewrites signed urls', () => {
    const signed =
      'https://p9-sign.douyinpic.com/aweme-avatar/a.jpeg?lk3s=93de098e&x-expires=1790053200&x-signature=abc%3D';
    expect(getImgUrl(signed, '100y100')).toBe(signed);
    expect(getImgUrl(signed)).toBe(signed);
  });

  it('replaces only the last thumbnail size', () => {
    expect(
      getImgUrl('https://cdn.example.com/a.jpg?thumbnail=50y50&thumbnail=60y60', '100y100')
    ).toBe('https://cdn.example.com/a.jpg?thumbnail=50y50&thumbnail=100y100');
  });
});
