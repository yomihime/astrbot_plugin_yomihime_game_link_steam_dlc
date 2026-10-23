# 数据来源与可用性

默认零 Key，不使用登录 Cookie、借用 token 或客户端采集。来源返回字段缺失时保留未知；真实零值、无记录、私密/未收录、限流、登录墙及格式变化分开处理。所有生产请求经过 canonical SDK，图片从已声明且验证的来源取得 bytes 后提交受限 cards.Asset；图片失败保留文字。没有海报墙生产功能。

| 模块 | 来源与覆盖 | 留存和降级 |
| --- | --- | --- |
| Steam 商店 | 官方 storesearch、appdetails；普通商店页评价摘要保留其原始语言/时间范围 | SDK 公开投影缓存包含 AppID、国家、语言与版本；无历史最低价推断 |
| Steam 账号 | 正常 Community HTML 的昵称、头像、真实等级与最多 3 款 recent_game | 按字段可用性报告；来源时长是网页小时字符串，非 API 分钟精度 |
| Steam games | 已弃用 Community XML 的最多 5 项 mostPlayedGames | 明确 legacy 样本，不称完整库或完整两周列表；登录墙不当空库 |
| Dota 2 | OpenDota 公开基础 GET；最多 20 条原始窗口，不提交解析 | PUBLIC SDK 缓存；stats/last 共享带版本和获取时间的规范列表，损坏投影重新取数 |
| Deadlock | 社区 Deadlock API；最近已收录段位、有界历史及单场 metadata | PUBLIC SDK 缓存；无记录不当零胜场，429 不读错误 body、不假刷新 |
| CS2 | Leetify Public API，字段及指标保持 provider 含义 | 当前生产查询 blocked；无数据 Tool、持久缓存或真实响应 fixtures |

Steam 主页允许 SDK 声明的最多两次匿名 HTTPS GET 同源跳转，仅 `/profiles/` 与 `/id/` 路径。请求仍只接受明确 ID32/SteamID64；自定义 vanity URL 不是用户输入入口。最终路径、内容类型、登录墙与嵌入账号身份均需核对。其他来源保持默认拒绝跳转。

Steam 完整数据增强对应 GetPlayerSummaries、GetSteamLevel、GetRecentlyPlayedGames 与 GetOwnedGames。OwnedGames 请求明确 `include_played_free_games=true`，避免漏掉免费游戏；Key 不能穿透私密库。四接口的请求/规范化已做合成合同验证，但当前外包桥接未提供安全静态 Key 注入，未声明普通秘密配置或启用该来源。完整库增强 blocked，真实 Key 路径 unrun；不能把 Key 填进普通 config、USER records、源码或 JSON cache。

Leetify 指南要求来源署名并不存 API 数据。适配器保留 `Data Provided by Leetify` 与来源链接，Premier Rating、地图竞技段位、FACEIT level/ELO 和 Leetify 分析评分各自独立。当前 Host 会持久化工具日志、对话历史及消息附件，因而生产能力在 scope/HTTP 前停用；不靠关闭全局隐私保护或引入其他平台登录来解除限制。独立 Steam 素材不受该 provider 的缓存策略影响。

来源依据：

- [Steam Web API 认证](https://partner.steamgames.com/doc/webapi_overview/auth)、[ISteamUser](https://partner.steamgames.com/doc/webapi/ISteamUser)、[IPlayerService](https://partner.steamgames.com/doc/webapi/IPlayerService)。
- [Steam Community legacy XML](https://partner.steamgames.com/documentation/community_data?l=english)。商店公开页/端点的可用性不构成永久稳定 API 承诺。
- [Deadlock API](https://docs.deadlock-api.com/)。
- [Leetify Public API](https://api-public-docs.cs-prod.leetify.com/)、[开发者指南](https://leetify.com/blog/leetify-api-developer-guidelines/)。

离线合成合同、匿名 API 探测、实际 SDK/Host 命令、模型工具、页面视觉与真实 IM 分别验收；任一层通过不代表其他层通过。实际候选的分层结果以配对交付记录为准。
