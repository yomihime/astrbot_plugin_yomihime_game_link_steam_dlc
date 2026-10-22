# 架构与公共合同

本文件的初版是调查入口；在当前主项目加载器、SDK 和 Host 公共 API 核实后冻结实现合同，之后才释放依赖任务。未冻结部分不作为已存在 API。

固定边界：独立 AstrBot 入口 + 一个完整 DLC package + 四模块；`steam` 唯一持有 USER 账号记录；游戏模块经显式 SDK 依赖读取当前主体的最小只读身份。`shared` 仅纯函数/不可变 DTO，禁止共享可变绑定表或模块实例。Core 改动限通用能力，在独立 worktree 完成。

模块只使用 canonical SDK；不复制 Core 或 vendoring 第二份 SDK。包目录服从当前安全捕获/导入规则。命令写操作不注册 Tool；Dota Tool 首期要求显式目标，默认身份只保证 COMMAND 闭环。CS2/Deadlock 首期只提供实际状态及帮助。

时间以 UTC 记录、展示按配置时区；SteamID64 以字符串传输；胜负 win/loss/unknown，缺失与 0 分开。公开查询缓存以源/操作/目标/参数区分，身份以 principal/绑定 revision 隔离。查询输出绑定其请求开始时的目标快照。

## 冻结的包与领域合同（A1）

根目录 `main.py`/`metadata.yaml` 为 AstrBot 外层；完整捕获根为 `packages/steam_dlc/`，含 `yomihime.manifest.json`、`shared/`、`steam/`、`dota2/`、`cs2/`、`deadlock/`。factory_entry 为 `steam.module:Factory` 等相对路径；运行时包内相对导入，不使用固定 `steam_dlc.*` 绝对路径或从 `__file__` 读未声明资源。测试位于仓库 `tests/`，构建脚本位于 `scripts/`。

纯 DTO 在 `shared/contracts.py`，root 唯一 owner。SteamID 纯函数合同：`parse_steam_id(value: str) -> str`（仅有效个人 SteamID64 或严格 steamcommunity.com/profiles URL）；`account_id32(steam_id64: str) -> int`；`steam_id64_from_account(account: str | int) -> str`；`parse_dota_account(value: str | int) -> int`（明确 Dota 查询参数，可接受 ID32/SteamID64）。错误为 ValueError，不联网验证。个人账号检查 universe/type/instance/account 位域与范围，拒绝 bool、浮点、非 canonical 数字、vanity。

Dota 纯规范化合同：`normalize_recent(payload: object, *, limit: int = 5) -> tuple[RecentMatch, ...]`；`normalize_profile(payload: object, account: int) -> PlayerProfile`；`normalize_match(payload: object, match_id: str) -> MatchSummary`。不猜缺失值，真实 0 保留；slot 0–4/128–132 才推胜负，radiant_win 非 bool 时 unknown；匿名 account 不猜；字符串有界，profile URL 只允许官方 Steam/OpenDota HTTPS 主页。不暴露上游巨大 JSON，最多20场/10选手。非法上游顶层形状抛 ValueError。

Steam capability `identity` 为 COMMAND-only、OWNER、read_only、无输入；成功 PRIVATE DisplayDocument 的唯一 FieldsBlock 固定为 `{identity: {steam_id64, account_id32, binding_revision, association}}`，无 model_facts（既有合同禁止 PRIVATE facts），未绑定为 UNBOUND。只有显式 required_capabilities 引用 `steam_dlc/steam:identity` 的消费者可调用；identity没有命令或Tool路由。`bind`/`unbind` 仅 root COMMAND；USER collection `binding` 中 key `default` 为唯一权威记录，以 SDK revision/CAS 更新，逻辑解绑保留 tombstone 以维持 revision 单调。Dota 无默认账号 Tool，显式账号 Tool 不调用 identity。

## 冻结的宿主与身份合同（A2）

AstrBot 4.29.1 固定源码 `dffe922773725e9c178392c423676ad65044748c` 的公共 `Context.get_registered_star`、`filter.on_plugin_loaded/on_plugin_unloaded` 提供实例发现与事件驱动重连。Core Star 公开 `get_game_link_extension_host()`；canonical SDK `host.ExtensionHost` bridge v1 暴露版本/generation、`register_package(plugin_name, plugin_instance, package_root)` 与 `unregister_package(lease)`。Core 检查公开注册表 exact Star 实例、activated、包根安装目录归属；不透明 lease 按对象身份验证，同实例同字节幂等，旧实例注销不能移除新实例。组合工厂与联合发现避免扫描一个根时清除其他包。配置/源策略按全模块ID隔离，普通管理仍走 Core 原权限；首期外部源无凭证、配置非敏感。

DLC 外层导入时不预加载 SDK，initialize 及公开 loaded/unloaded hooks 尝试连接；Core 缺失明确 waiting，不创建无限轮询。Core/DLC 重载后重新登记；旧lease/invocation/epoch失效。代码/SDK变更仍服从 restart_required，不承诺原地Python替换。

通用 OWNER 依赖仅允许已声明边的只读能力，由真实 root COMMAND actor 推导一次；禁止 Tool/Web/Scheduler、嵌套再次提升、跨模块grant及记录写入。Core 单独建立 child/parent exact admission 与 principal proof，跨 await 重验；这个数据读取 proof 不授予发送或绑定操作权限。root OWNER 命令仍沿现有私聊输出证明，Steam 管理命令在私聊执行；同群的 Dota 默认查询可用当前 actor 的只读身份，不能借别人绑定。

Dota能力输入：命令 raw-tail `command`；Tool `account` 显式账号（recent另有limit默认5，1–20），match为显式match_id。模块唯一工厂 `dota2.module:Factory`；capability IDs 为 `recent`/`profile`/`match`/`status`。recent/profile声明identity依赖，但显式账号路径不调用。来源 `opendota` 固定 `api.opendota.com`，GET `/api/players/{id}/matches?significant=0&limit=N`、`/api/players/{id}`、`/api/matches/{id}`；不允许任意URL、解析POST或后台任务。公开缓存与身份分离，输出含绑定快照目标。状态与帮助在现有通用页面展示，无新JS。
