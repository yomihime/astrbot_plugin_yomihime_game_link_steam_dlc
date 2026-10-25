# CS2 平台查询

来源参数 `platform` 支持 `perfect`（完美平台）、`official`（完美收录的官匹）和
`5e`。同一组 `profile`、`recent`、`stats`、`last`、`match` 能力使用来源参数，
不会自动切换到其他平台。官匹口径只覆盖完美实际收录的数据。

```text
/ygl cs2 status
/ygl cs2 profile [SteamID64] --platform perfect [--season S16]
/ygl cs2 recent [SteamID64] --platform official [--limit 5]
/ygl cs2 stats <5E-domain> --platform 5e [--season 2026S5]
/ygl cs2 last [SteamID64] --platform perfect
/ygl cs2 match <来源内比赛ID> --platform perfect [--focus SteamID64]
/ygl cs2 match <来源内比赛ID> --platform 5e --account <5E-domain>
```

只有用户直接发起的本人命令可以省略完美/官匹账号；此时通过公开 SDK 调用 Steam
模块的共享身份能力，结果按私有数据返回，不向模型发布默认账号事实。
模型、页面和嵌套能力调用必须明确提供账号。5E 使用独立 `domain`，不会把 SteamID64
或管理员登录主体推断为目标玩家。已有 Steam 绑定和 `reply_theme` 设置继续保留。
旧 Leetify UUID 需要替换为当前来源的比赛 ID。

完美平台需要管理员在可信管理页扫码；5E 可配置会话 Token。凭据字段分别为
`credential_perfect`、`credential_fivee`，模块只读取脱敏 metadata。
Core 按部署端已审查的 host/path/method 策略注入 Token 和授权主体，模块不会读取
真实 Token、登录票据或管理员的凭据配置值。登录主体只服务请求授权，不更改玩家绑定。
扫码 descriptor 在 `authorization.py`；它是协议数据，本身不授予执行权限。

完美 profile/stats 使用来源赛季聚合值，recent 限于上游当前一页最多 50 场，展示
1–20 场。完美单场返回已证实接口的基础信息、名单及可选焦点玩家。
官匹和 5E 单场从明确账号的来源近期样本筛选玩家摘要，返回
`detail_level=player_summary`、`coverage=recent_player_summary`；不伪造完整名单，
未命中会明确说明比赛不在当前样本中。5E stats 使用明确的年份/赛季汇总接口。

DTO schema 为 `cs2.platform.v1`，保留 provider、platform、来源内 ID、season、采样时间、
coverage、detail_level、unavailable_reason 和字段可用性。各平台段位/积分及 Rating
分别解释；来源缺项保留 null，真实 0 不被当成缺项。玩家或比赛响应身份不一致时拒绝输出。

适配参考 [Agnes4m/CS2UID](https://github.com/Agnes4m/CS2UID) 的
`ac46894dfb184bd27a81a9a5667aff49b8d0b226`，许可 GPL-3.0。
本项目独立实现 SDK 请求适配与最小 DTO，不引入 gsuid_core、其数据库、网络客户端、
共享随机 Token 池或关闭 TLS 验证的设置。无独立请求重试、轮询任务或持久数据缓存；
同一次调用内复用响应，调用结束即丢弃。

测试使用最小化合成响应。代码和离线测试通过不代表真实扫码、真实平台数据、出口变更
或 IPv6-only 验收通过；这些需在对应网络和用户授权账号上分别记录。
