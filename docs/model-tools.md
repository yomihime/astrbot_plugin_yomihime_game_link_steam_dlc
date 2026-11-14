# 模型工具入口迁移

本候选将 Steam DLC 的模型工具从逐操作入口收敛为每个启用模块一个入口。命令、管理页面、内部 capability、handler、候选续接和业务结果保持原语义。YQL 不属于本 DLC，也不在本轮改动范围内。

## 调用形状

聚合入口接收两个必填顶层字段：有限枚举 `action` 和对象 `arguments`。`arguments` 展示模块内可用参数的兼容并集；真正执行前，Core 按选中 action 原先绑定的 capability schema 校验必填字段、类型、范围及多余字段，拒绝其他 action 专有的参数；游戏特有的跨字段规则保留在模块原有校验中。模型不能提交任意 capability ID、URL 或自由指令。

`full` 与 AstrBot 原生 `skills_like` 使用同一 Host 工具发现流程。主请求按当前 Host event 和权限生成可调用的聚合 `FunctionTool`：完整选择保留全部获准 action；旧人格或 manager 显式选择 legacy 子集时，同名 limited 对象仅含对应 action。Host handoff 的 `tools=None` 或显式新 parent 路径沿用原生 full 对象。`skills_like` 第二阶段可能不保留工具顶层 description，所以 action 的用途、明确目标要求、来源口径和其他调用条件保留在参数说明中。启用或关闭模块、人格选择、插件过滤和子 agent 过滤仍由 Host 决定。

每次 action 调用都按对应旧 `tool.name` 复核 Host 权限与 inactive 状态，并复核 owner handle、module epoch 和当前生命周期。合法真实 `Context`/event 对当前 `FunctionTool` 的直接 Python 调用沿用 Host 基线；只构造 SDK 对象或伪造上下文不会取得调用权。

## 固定映射

| module | aggregate | action | legacy tool.name | capability_id |
| --- | --- | --- | --- | --- |
| Steam | `steam_dlc_steam` | `search` | `steam_dlc_steam_search` | `search` |
| Steam | `steam_dlc_steam` | `app` | `steam_dlc_steam_app` | `app` |
| Steam | `steam_dlc_steam` | `profile` | `steam_dlc_steam_profile` | `profile_explicit` |
| Steam | `steam_dlc_steam` | `recent` | `steam_dlc_steam_recent` | `recent_explicit` |
| Steam | `steam_dlc_steam` | `games` | `steam_dlc_steam_games` | `games_explicit` |
| Steam | `steam_dlc_steam` | `wall` | `steam_dlc_steam_wall` | `wall_explicit` |
| Steam | `steam_dlc_steam` | `wishlist` | `steam_dlc_steam_wishlist` | `wishlist_explicit` |
| Dota 2 | `steam_dlc_dota2` | `recent` | `steam_dlc_dota2_recent` | `recent_explicit` |
| Dota 2 | `steam_dlc_dota2` | `profile` | `steam_dlc_dota2_profile` | `profile_explicit` |
| Dota 2 | `steam_dlc_dota2` | `match` | `steam_dlc_dota2_match` | `match_explicit` |
| Dota 2 | `steam_dlc_dota2` | `stats` | `steam_dlc_dota2_stats` | `stats_explicit` |
| Dota 2 | `steam_dlc_dota2` | `last` | `steam_dlc_dota2_last` | `last_explicit` |
| Dota 2 | `steam_dlc_dota2` | `analyze` | `steam_dlc_dota2_analyze` | `analyze_explicit` |
| CS2 | `steam_dlc_cs2` | `profile` | `steam_dlc_cs2_profile` | `profile_explicit` |
| CS2 | `steam_dlc_cs2` | `recent` | `steam_dlc_cs2_recent` | `recent_explicit` |
| CS2 | `steam_dlc_cs2` | `stats` | `steam_dlc_cs2_stats` | `stats_explicit` |
| CS2 | `steam_dlc_cs2` | `last` | `steam_dlc_cs2_last` | `last_explicit` |
| CS2 | `steam_dlc_cs2` | `match` | `steam_dlc_cs2_match` | `match_explicit` |
| Deadlock | `steam_dlc_deadlock` | `profile` | `steam_dlc_deadlock_profile` | `profile_explicit` |
| Deadlock | `steam_dlc_deadlock` | `recent` | `steam_dlc_deadlock_recent` | `recent_explicit` |
| Deadlock | `steam_dlc_deadlock` | `stats` | `steam_dlc_deadlock_stats` | `stats_explicit` |
| Deadlock | `steam_dlc_deadlock` | `last` | `steam_dlc_deadlock_last` | `last_explicit` |
| Deadlock | `steam_dlc_deadlock` | `match` | `steam_dlc_deadlock_match` | `match_explicit` |

旧 `tool.name` 保留在模块声明中，作为 action 到原 capability 的固定映射和原有 persona/权限身份。迁移模块只发布 aggregate，不同时发布旧入口。每次调用仍按旧名执行 Host 权限检查；只允许部分旧名时，只得到对应 action，不扩大为整个模块。

## 安装、更新与恢复

Steam DLC 使用 Core 提供的 SDK 和模型工具接口。在 AstrBot 插件管理中使用完整 ZIP 安装或更新，Core 就绪后，Steam DLC 会重新检查兼容性并接入。更新前请备份配置、数据库和现有密钥，并用 `SHA256SUMS` 核对安装包。

回退前请确认目标版本能读取当前数据库，并保留最近的配置与数据备份。恢复代码后核对实际运行版本和模块状态，避免用旧数据库覆盖新数据。旧 beta 版本的安装说明见[支持矩阵](support-matrix.md)。
