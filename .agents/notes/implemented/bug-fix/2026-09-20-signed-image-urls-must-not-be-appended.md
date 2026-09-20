# Agent Note: 头像 403：别给带签名的图片地址拼查询串

Status: implemented

## 背景

扫码登录成功后，部分位置的头像显示成坏图，控制台是一串 403：

```text
GET https://p9-sign.douyinpic.com/aweme-avatar/tos-cn-avt-….jpeg?lk3s=…&x-signature=…&l=…?param= 403 (Forbidden)
```

注意结尾那个空的 `?param=`。`getImgUrl` 对任何非 `data:` / `local://` 的地址一律拼 `${url}?param=${size}`：对已经带查询串的地址会拼出**第二个 `?`**，`size` 为空时还会留下一个空参数。

同一张汽水头像实测（URL 带 `x-signature`）：

| 请求                  | 结果                                     |
| --------------------- | ---------------------------------------- |
| 原样                  | 200，85 KB                               |
| `&param=280y280`      | 200（该 CDN 忽略 `param`，返回同一张图） |
| `?param=`（代码现状） | **403**                                  |

## 决策

`getImgUrl` 从 `utils/index.ts` 移到 [`utils/imgUrl.ts`](../../../../src/renderer/utils/imgUrl.ts)（与 `coverChrome` / `qualityClamp` 一致的「单职责工具 + 同目录测试」），并加三条边界：

- 含 `x-signature=` 的地址原样返回：签名地址不该被追加参数。
- 已有查询串用 `&` 连接，而不是再拼一个 `?`。
- `size` 为空就不拼任何参数。

`@/utils` 的导出保持不变，调用方无需改动。

## 放弃的方案

**只在出问题的调用点去掉空 `size`。** 治标：其它调用点仍可能拼坏带查询串的地址，下次换个入口又会踩。

**统一改成用 `&` 连接，但不识别签名。** 实测这一家 CDN 忽略 `param`，但换成签名覆盖整个查询串的图床就会 403——等于把风险留给未来。

**保持函数留在 `utils/index.ts`。** 那个文件 import 了 Pinia store，测试不再 hermetic；拆出来才能测。

## 影响

- 头像与封面正常加载；带查询串的图片地址不再被拼坏。
- 这个函数此前没有测试，现在有 7 条（`imgUrl.test.ts`）。
- 后续给图片加尺寸参数时，走 `getImgUrl` 即可，边界已经在里面处理。

## 验证

```bash
npx vitest run src/renderer/utils/imgUrl.test.ts   # 7 passed
npm test                                           # 19 文件 / 87 用例
```
