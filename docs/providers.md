# 数据来源与可用性

所有生产请求经过 canonical SDK 的固定来源声明。普通模块不持有明文凭据、不直连网络或数据库。缺失与未知不补零，私密、未收录、空历史、限流、登录墙、格式变化和凭据错误分别处理。

| 模块 | 来源和覆盖 | 凭据与留存 |
| --- | --- | --- |
| Steam 商店 | 官方 storesearch、appdetails与实际商店页 | 无 Key；保留国家/语言/币种及采样时间，不推断历史低价 |
| Steam 网页 | Community主页资料、最多3款recent、legacy XML最多5款mostPlayedGames | 匿名样本；网页小时精度，不称完整库 |
| Steam API | GetPlayerSummaries、GetSteamLevel、GetRecentlyPlayedGames、GetOwnedGames | Core以x-webapi-key注入部署Key；完整公开库包含玩过的免费游戏，不能穿透隐私 |
| Dota 2 | OpenDota公开GET资料、最多20条近期窗口与比赛结算 | 可选Bearer Key；无Key匿名、已填错误Key不静默降级；公共投影缓存及订阅持久回执 |
| CS2 完美/官匹 | api.wmpvp.com；官匹为完美收录口径 | 完美二维码通过passport.pwesports.cn受控授权；Core按精确path/method注入header或顶层JSON |
| CS2 5E | ya-api-app.5eplay.com；账号标识与SteamID分开 | 受控App Token；近期摘要不当完整单场/完整历史 |
| Deadlock | 社区Deadlock API已收录资料、近期及metadata | 不承诺Valve官方全历史；实际人数、未知段位与有效统计分母分开 |

Steam主页最多两次匿名同源GET跳转，仅允许profiles/id路径；最终路径和嵌入身份需核对，不接受用户任意URL。头像仅接受受限hash路径及声明的avatars.steamstatic.com、avatars.fastly.steamstatic.com。公共封面缓存只保存公开素材；个人列表/时长与成图保持USER或现有授权分区。

CS2数据保留provider/platform/target/season/fetched_at/coverage/detail_level/field_availability。官方与5E单场可能只覆盖近期摘要；缺项不从其他平台拼凑。旧Leetify DTO/UUID/gate已退休，旧配置和绑定不清空，不通过其他来源绕过旧供应方限制。正常家庭出站、切换出口后的会话、IPv6-only须分别实测，不给统一线上保证。

CS2资料头像为可选公开素材，仅使用已观察并限制到指定 CDN host/path 的 Perfect 图片来源，不发送 Perfect 或 5E 凭据；缺失、来源拒绝或图片无效时仍显示文字资料。未验证 5E 头像来源，不猜测其图床。

OpenDota滚动RPH由Core按受信host共享并持久化，默认100，可配置正整数；空值恢复默认、0非法。以每个唯一玩家每5分钟轮询一次估算，约12次列表请求/小时；8个唯一玩家约96次，尚未包括详情、手动查询与重试。跨群同玩家共享采集。这只是预算示例，不是吞吐保证或硬上限。RPM与429 Retry-After同时生效，缓存命中不计、实际重试计数。Key配置不自动放大额度。源码默认不代表线上商业套餐承诺。

来源合同：

- [Steam认证](https://partner.steamgames.com/doc/webapi_overview/auth)、[ISteamUser](https://partner.steamgames.com/doc/webapi/ISteamUser)、[IPlayerService](https://partner.steamgames.com/doc/webapi/IPlayerService)、[Library Capsule](https://partner.steamgames.com/doc/store/assets/libraryassets)。
- [Steam legacy XML](https://partner.steamgames.com/documentation/community_data?l=english)。
- [OpenDota服务端](https://github.com/odota/core/blob/master/svc/web.ts)。
- [CS2UID固定参考](https://github.com/Agnes4m/CS2UID/tree/ac46894dfb184bd27a81a9a5667aff49b8d0b226)。
- [Dota订阅固定参考](https://github.com/mml-hrb/astrbot-plugin-dota2matches/tree/703a5dcf2d501a2a232fd44e4eaecf395ed293a6)。
- [Deadlock API](https://docs.deadlock-api.com/)。

单元fixture、隔离Host、真实平台、原实例浏览器、WebChat、第三方IM与真实新比赛是不同证据层。实现代码及接口协议测试不保证生产接口当前有效；具体结果以相同配对revision的交付记录为准。
