# 架构与合同

本文定义 Steam DLC alpha 的包边界、SDK 合同、模块能力与验收边界。目标兼容面是 Core 分支 `feat/steam-dlc-support` 提供的 canonical `yomihime_game_link_sdk 0.1.0a13`，模块 ABI `2.0`、bridge v1；DLC 候选分支为 `feat/steam-dlc-alpha`。截至本文编写，候选尚未合并或发布。[Core Draft PR #11](https://github.com/yomihime/astrbot_plugin_yomihime_game_link/pull/11) 仍待维护者合并；包内 `BUILD.json` 和正式验收记录才是具体构建版本的证据。

## 包与依赖边界

Core 提供通用基础设施；Steam、Dota 2、CS2、Deadlock 业务属于本 DLC。AstrBot 外层入口位于仓库根目录，完整捕获包位于 `packages/steam_dlc/`，由 `yomihime.manifest.json` 声明四个模块及其公开能力。Factory entry 使用包内相对模块路径，代码不依赖安装目录名称。

DLC 只使用 Core 安装的 canonical SDK、Python 标准库和捕获包内纯代码。DLC 不 vendoring SDK，也不导入 Core 私有服务、数据库、AstrBot event、凭据或其他插件的实现。HTTP、配置、USER records、缓存、模块依赖、输出和生命周期一律通过 SDK。业务层不自行创建网络客户端、不读写存储，也不接受任意 URL。

`steam` 是默认 Steam 账号关联的唯一 owner。其他模块只能使用 manifest 明确声明的 SDK 只读依赖。共享层仅包含不可变 DTO 和纯函数；它不保存可变关联表或模块实例。SDK / Core 的通用变更由 Core 独立维护，不在 DLC 中复制实现。

## A1：纯领域合同

`shared/steam_ids.py` 提供以下纯函数：

```python
parse_steam_id(value: str) -> str
account_id32(steam_id64: str) -> int
steam_id64_from_account(account: str | int) -> str
parse_dota_account(value: str | int) -> int
```

解析器验证 SteamID64 的 individual-account 位域和有效范围，不以 17 位数字长度作为唯一条件。个人资料 URL 只接受标准 `steamcommunity.com/profiles/<SteamID64>` HTTPS URL，不接受 userinfo、非默认端口、任意主机、额外路径或查询参数。Dota 账号可用 ID32 或由合法 individual SteamID64 推导；所有 JSON 账号标识在传输时使用字符串，避免大整数精度损失。非法输入以 `ValueError` 表示，不联网校验。

`shared/contracts.py` 中的 Dota DTO 保留缺失、`None`、零和 `False` 的区别。归一化函数不把未知值猜成零，也不把非布尔结果推断为胜负；阵营胜负只由合法 slot 范围和布尔值决定。匿名账号不臆造身份。结果有界为最多 20 场、最多 10 名选手及受限字符串；URL 只允许安全的 Steam/OpenDota HTTPS 页面。纯归一化入口为 `dota2/normalization.py` 的 `normalize_recent`、`normalize_profile`、`normalize_match`。

英雄名称映射位于 `shared/hero_names.py`，收录 127 条 Valve 官方简体中文 ID/名称映射；源 URL 为 `https://www.dota2.com/datafeed/herolist?language=schinese`，源响应 SHA-256 为 `c3d7e9ac5b145aa066857645dd89612f51643dd8b3354d2beccf41ddebb0f054`。未知英雄 ID 显示为 `英雄#<ID>`。映射只包含事实标签，不引入参考插件的数据。

## A2：Host、生命周期与身份合同

Host 目标为 AstrBot 4.29.1，固定源码修订 `dffe922773725e9c178392c423676ad65044748c`。Core 的公开扩展入口发现已注册的 Star 实例和 loaded/unloaded 事件；Core 提供 `get_game_link_extension_host()`。canonical SDK 的 `ExtensionHost` 使用 bridge v1，并公开版本/generation、`register_package(plugin_name, plugin_instance, package_root)` 与 `unregister_package(lease)`。Core 校验注册对象与实际 Star 实例、激活状态和包根目录归属；lease 按对象身份验证。旧实例注销不能移除新实例，重复注册保持幂等。插件加载顺序由注册协调处理，不通过扫描一个目录来清除其他包。

DLC 导入时不预加载 SDK。初始化和公开 loaded/unloaded hook 尝试连接 Core；Core 缺失时清楚报告等待状态，不启动无界轮询。Core/DLC 重载后重新注册，失效 lease、invocation 和 epoch 不跨代复用。更新 SDK 或模块 Python 代码需要 AstrBot 重启，并以 `restart_required` 表示；不支持任意 Python 热替换。

Steam `identity` 是 command-only、OWNER、read-only、无输入 capability。成功返回 PRIVATE `DisplayDocument`，唯一的 `FieldsBlock.fields` schema 为：

```python
{"identity": {
    "steam_id64": str,
    "account_id32": int,
    "binding_revision": int,
    "association": "self_asserted",
}}
```

它不返回 PRIVATE `model_facts`，不设 identity 命令或工具路由。未关联时返回 `UNBOUND`。只有在 manifest 声明依赖且当前调用具备授权时，消费者才能调用 `steam_dlc/steam:identity`。身份只证明用户曾主动关联，不证明账号所有权。

OWNER 依赖从真实 root COMMAND actor 推导一次，仅授权已声明的只读能力。禁止由 Tool、Web、Scheduler、嵌套依赖或其他模块提升权限；禁止跨模块 grant 和记录写入。Core 在父子调用边界验证精确准入与 principal，跨 await 再次检查。此身份读取不授予发送消息、关联账号或写 USER records 的权限。

Steam 关联数据保存在 SDK USER collection `binding`，其中 `default` 是唯一当前关联，按 SDK revision/CAS 更新。`bind`、`unbind` 是 root COMMAND 写操作；`unbind` 留下 tombstone 以维持 revision 单调。账号声明只能由真实主体明确发起的私聊命令创建；不提供多账号、vanity URL、登录态或所有权验证。停用、重启及卸载不会自动清除用户数据。

## Dota 2 能力

`dota2.module:Factory` 注册 `recent`、`profile`、`match`、`status` handlers，collector/evaluator 为空。模块具有真实 `start`、`stop`、`check_health` 生命周期。所有 Dota 能力结果均为 PUBLIC；PRIVATE identity 仅用于解析默认查询目标，不向模型 facts 输出 SteamID、关联信息或 binding revision。默认查询呈现本次公开 Dota 账号目标即可。

| 能力 | COMMAND 参数 | Tool 参数 | 默认身份 | 数据源 |
| --- | --- | --- | --- | --- |
| `recent` | raw-tail `command`：可选账号与 `--limit N`，默认 5，范围 1–20 | `account` 必填，`limit` 可选 | 省略账号时读取当前 COMMAND actor 的关联 | OpenDota |
| `profile` | raw-tail `command`：可选账号 | `account` 必填 | 省略账号时读取当前 COMMAND actor 的关联 | OpenDota |
| `match` | raw-tail `command`：显式 match ID | `match_id` 必填 | 不适用 | OpenDota |
| `status` | 无参数 | 无 Tool | 不适用 | 本地模块状态 |

默认 recent/profile 查询可在群聊中发起，但只使用当前发起者自己的账号关联。显式账号路径不调用 identity 依赖。Tool 路径必须给出显式 `account` 或 `match_id`，不能省略账号、推导 actor 或接受任意 URL。Dota 账号接受规范的 ID32 或 SteamID64。

OpenDota source id 为 `opendota`，host 固定为 `api.opendota.com`。唯一请求为：

- `GET /api/players/{id}/matches?significant=0&limit=N`
- `GET /api/players/{id}`
- `GET /api/matches/{id}`

没有 POST、无附加 win/loss 查询链、不受用户控制的主机或路径。响应读取有字节上限，仅投影必要字段；输出 facts 有界且不超过 512 节点，最近比赛最多 20 场、单场选手最多 10 人。缓存通过 SDK 的 PUBLIC `CacheQuery`，缓存键按 source、operation、目标和参数隔离；CacheUnavailable 可旁路，权限、取消、超时等其他失败不可当作缓存未命中吞掉。

日期以 UTC 解析和保存，展示时区由 `timezone` 配置控制，默认 `Asia/Shanghai`。HTTP 404、429、timeout、上游错误、无记录、identity 未绑定和 provider 离线均映射为稳定错误；安全的限流提示可显示等待秒数，不透传上游 headers/body，也不自动重试。

## CS2、Deadlock 与 UI 范围

CS2 和 Deadlock 当前只注册真实 `status`、生命周期与帮助。状态说明数据查询尚未实现；不提供虚构战绩或工具能力。Core 通用管理界面显示实际运行健康；DLC 帮助页另说明业务完成度，不把运行正常当作游戏数据已实现。

四模块各声明 `home` 帮助/状态页和 `settings` 普通设置页，使用 Core `8981ee2` 上已有的 `PageModule.mount`、`ModulePageServices.config`、scope 与样式 token，不导入主壳私有组件、不建立 HTTP 客户端。每个设置页只授权 `reply_theme`，Dota 另外授权 `timezone`。字段说明、当前值、版本和主题选项均来自配置服务；跟随 Core 的主题使用 `clear`，不持久化一个伪造默认值。账号关联与查询仍通过命令入口。

页面只读当前模块配置，并用 expected revision 保存；CAS 冲突后要求重新读取，未知写入结果不自动重试。异步回调同时检查 scope、owner/runtime/epoch/boundary，页面失效或销毁后不提交旧响应，销毁页面创建的监听和 DOM。未保存修改和待完成操作通过公开 `navigationImpact` 通知 shell。

普通设置草稿只缓存 set/clear 意图，按 owner/runtime/epoch/boundary 分区，最多 4 分区、key 最多 4096 字符、value 最多 256 字符。不缓存服务、DOM、秘密、账号或整份后端快照。正常切页保留，观察到身份/授权撤销时清除；同 owner 新身份驱逐旧分区，挂载 token 阻止旧异步回写。每次有效意图改变递增导航 version，撤销旧确认；相同意图不虚增。公开 scope v1 不提供 dispose 原因，仅 scope 撤销不能承诺即刻清所有物理分区；旧身份不可复用，fresh iframe 销毁原 realm。

Core `c11d5a54` 提供通用固定配对静态投影：维护者显式传入 `--external-page-package`，只捕获完整合法 manifest 原字节及已声明、摘要匹配的静态资源，不导入/复制 DLC Python，也不放宽内置 FF14 Python 白名单。Core 的封闭 loader/样式表与资源在独立 staging 一并生成，原 dots 页面只读。可选 `external-page-projection.json` 限定构建时 manifest；运行时必须匹配当前完整 active lease 的原 manifest 摘要和模块声明，否则 catalog 清空 pages/resources，现有页面会话/配置授权边界拒绝。资源路径含完整 manifest 摘要，保留资源相对布局；不接受任意 URL。

这组 alpha 必须同时安装匹配的 Core/DLC ZIP，manifest 或页面更新须重建配对资源并重新打开宿主页；不是任意外包动态页面装载。缺配对/失配只撤销外包 Web 页面，不扩大命令/Tool 权限。SDK a13、业务权限、既有公共前端合同均不变。具体冻结提交和完整包摘要见 plan。

页面规范源为 `packages/steam_dlc/pages/entry.js`、`style.css`。包 ABI 要求资源路径在四模块间唯一，`scripts/sync_page_resources.py` 因此生成四份同字节、独立授权路径并更新 manifest SHA-256；`--check` 检查副本与摘要漂移。ZIP 仅收集 manifest 明确声明且位于固定模块路径的 JS/CSS，不收集规范源、测试依赖或任意静态文件。本轮不改主项目 `pages/**` 或 `modules/ff14/pages/**` dots，不声称已同步 dots 新视觉。

## 构建、测试与验收证据

包构建脚本显式收集 AstrBot 外层入口、manifest、捕获 Python 文件及已声明的 JS/CSS，不包含 canonical SDK。最终构建要求已提交且干净的源码；脚本生成 `BUILD.json`，记录 SDK、ABI、提交和文件 SHA-256，并审计 ZIP 内容。`--allow-dirty` 只供本地临时 harness，不形成可发布构建证据。

建议验证入口：

```powershell
python -m unittest discover -s tests
ruff check packages/steam_dlc tests scripts
ruff format --check packages/steam_dlc tests scripts
python scripts/build_release.py
python scripts/smoke_two_plugins.py --core-zip <core.zip> --dlc-zip <steam-dlc.zip> --host-source <astrbot-4.29.1-source> --work-root <fresh-temp-dir> --order core-first
```

Host harness 应在独立进程、新工作目录下再以 `--order dlc-first` 运行。它安装实际 ZIP 并使用真实 AstrBot 4.29.1 Host、插件管理、生命周期和 Core；事件送达与 OpenDota HTTPS 响应为合成数据，因此不证明真实 IM、在线 API 或浏览器 UI。单测、静态检查、包审计、Host harness、在线 API、IM/UI 和发布记录是分层证据；不得用旧修订结果证明新候选通过，也不得把尚未执行的检查写成通过。
