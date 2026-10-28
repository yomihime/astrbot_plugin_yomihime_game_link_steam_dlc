# 如月怜的游戏连结：Steam DLC

独立 AstrBot 插件，提供共享 Steam 身份、商店与完整库、游戏生涯拼图、Dota 2 比赛订阅、CS2 完美/官匹/5E 查询和 Deadlock 查询。当前版本 `0.2.0-beta.2` 的源码候选要求支持模块聚合工具的配对 Core、canonical SDK `0.1.0a23`、模块 ABI `2.0` 与外包桥接 `1`。已发布的同版本 beta.2 资产仍是历史 a22 配对，不包含本次模型工具入口改造，不能与此源码候选混装。Beta 表示部分外部来源和现场环境仍未验收。请安装审核后的插件 ZIP，不要用自动生成的 Source code.zip 代替。来源可用性见[支持矩阵](docs/support-matrix.md)。

## 安装与凭据

历史安装入口：[v0.2.0-beta.2 Release](https://github.com/yomihime/astrbot_plugin_yomihime_game_link_steam_dlc/releases/tag/v0.2.0-beta.2)。其中的 Core/DLC ZIP 与 `SHA256SUMS` 只适用于历史 a22 版本。a23 源码和审核 CI 见 [Core PR #15](https://github.com/yomihime/astrbot_plugin_yomihime_game_link/pull/15) 与 [DLC PR #6](https://github.com/yomihime/astrbot_plugin_yomihime_game_link_steam_dlc/pull/6)；以最终合并提交及其 CI 为准。本次源码合并不发布或覆盖现有 Release，历史 a22 安装资产不能作为 a23 配对包。

DLC 不包含第二份 SDK。a23 必须由匹配的 Core 提供，Core 与 DLC 作为一对更新：先核对两个包的来源提交、SDK/ABI 和 SHA256，备份现有 Core/DLC 插件目录以及配置和数据；通过宿主正常停止目标实例，在停止状态先安装 Core、再安装 DLC，随后正常冷启动一次，并核对实际加载路径、SDK 版本与候选哈希。不要热替换 SDK、只更新一侧、清空数据库或重建绑定。

回滚也必须使用匹配的一对包：正常停止同一实例，保留届时最新配置和数据，恢复同一次备份中的 Core/DLC 代码，再正常启动并核对 SDK 与插件来源。不要把旧数据库覆盖到新数据上，也不要将 a22 Core 与 a23 DLC（或反向组合）作为回滚。模块 ABI 仍为 2.0 不代表 Python SDK 单例可以跨版本混用。

新安装按匹配 Core → DLC 的顺序安装并启用宿主插件，再在 Core 可信管理页审阅并批准本次具体扩展安装计划。读取计划要求 DLC 宿主插件已启用；批准前 Core 会拒绝未授权的模块接入，启用插件本身不授予新来源权限。普通 DLC 更新沿用既有来源许可；扩大来源权限须批准新计划。使用 localhost/回环或可信 HTTPS 管理安装；远程普通 HTTP 可能在父壳资源摘要校验前失败，不要绕过校验。

首次来源授权可在 Core 模块管理的“独立扩展安装授权”读取并批准当前安装计划：宿主插件名 `astrbot_plugin_yomihime_game_link_steam_dlc`，包 ID `steam_dlc`。核对来源/注入规则后批准并正常重启；已有等价配对授权可审计迁移。普通 DLC 版本和页面更新沿用许可，使用同一份 Core ZIP；新增敏感权限须批准新计划，不自动信任扩展自己的策略文件，也不要求重填现有 Key。

在 Core 模块管理中打开相应模块的设置：

| 模块 | 可选或必需凭据 | 用途 |
| --- | --- | --- |
| Steam | 部署者 Steam Web API Key | 完整公开库与资料增强；一把受控部署 Key 可用于多个明确目标，不能穿透隐私 |
| Dota 2 | 可选 OpenDota Key | 不填继续匿名；填写无效 Key 明确报错；不自动提高请求额度 |
| CS2 | 完美二维码授权；5E App Token | 完美与完美收录的官匹共用受控凭据；5E 单独授权 |

凭据只在受信 Dashboard 管理页输入。完美扫码由用户亲自确认，支持取消、超时、重新登录和清除；临时票据和最终凭据由 Core 接收并加密保存，模块不读取明文。不要在聊天、普通配置、源码或问题日志中粘贴 Token/Key。平台授权账号和被查询玩家是两个独立身份，不覆盖用户 Steam 绑定。

## 命令

入口为 `/ygl`。账号支持范围内 ID32、SteamID64 或标准 Steam profiles URL；5E 使用独立平台标识。

| 命令 | 行为 |
| --- | --- |
| `steam bind <账号>` / `steam binding` / `steam unbind` | 私聊关联、查看、解除本人默认 Steam 身份 |
| `steam search <名字或AppID>` / `steam app <AppID>` | 官方商店搜索、当前地区价格与评价摘要 |
| `steam profile [账号]` / `steam recent [账号]` / `steam games [账号]` | 公开资料、主页近期样本、legacy XML 样本 |
| `steam wall [账号] [--source games\|recent\|full] [--mode dense\|legacy] [--preset single\|standard\|long] [--aspect 2:3\|9:16\|1:2] [--quality normal\|hd] [--fit cover\|contain] [--limit N] [--all-apps\|--games-only] [--refresh]` | 先返回本人持久作业回执；full 需要部署 Key |
| `steam wall status <作业ID>` / `result <作业ID> [--page N] [--image N]` / `cancel <作业ID>` / `retry <作业ID>` | 查询本人作业与分页索引；仅按需回复一张图，取消/重试使用当前CAS |
| `steam wishlist [账号] [--page N]` | 匿名公开愿望单，默认每页20项，仅当前页补商店信息 |
| `dota2 analyze <比赛ID> [--account <ID32/SteamID64/本局唯一昵称>] [--refresh]` | 只读已有解析，指定焦点的详细事实与Host托管分析；模型不可用时明确回退 |
| `dota2 profile [账号]` / `recent [账号] [--limit N]` / `stats [账号] [--limit N]` / `last [账号]` | OpenDota 已收录公开资料与最近最多20场样本 |
| `dota2 match <比赛ID> [--account <账号>]` | 比赛与可选玩家焦点，缺失指标明确显示 |
| `dota2 watch [账号]` / `watchlist` / `unwatch <账号或订阅ID>` | 当前群或私聊中创建、查看、取消自己的订阅 |
| `cs2 profile\|recent\|stats\|last [账号] [--platform perfect\|official\|5e]` | 对应平台资料、近期、赛季/样本统计和上一场 |
| `cs2 match <来源比赛ID> [--account <账号>] [--platform perfect\|official\|5e]` | 单场或近期摘要；不解释旧 Leetify UUID |
| `deadlock profile\|recent\|stats\|last [账号]` / `deadlock match <比赛ID> [--account <账号>]` | 社区 API 已收录数据与实际人数的比赛详情 |
| `dota2 status` / `cs2 status` / `deadlock status` | 来源和能力状态；不是凭据有效性证明 |

`bind` 是用户主动声明的账号关联，不是 Steam 所有权认证。本人默认身份仅在可信命令根调用中读取；模型和公开 Web 查询必须给明确目标，不推导私人绑定。默认身份路径整份 `model_facts=None`。商店默认 CN/schinese；时长与比赛数据保留来源、取数时间和缺项原因。

## 模型工具入口

每个启用的 DLC 模块只向模型发布一个聚合入口。该入口是 Host `ToolSet` 可正常选择和调用的原生 `FunctionTool`：`full` 使用完整 action 集；旧人格或 manager 显式只允许部分旧工具名时，同名 limited 对象只保留对应 action。`full` 与 AstrBot 原生 `skills_like` 都受支持，复用宿主同一两阶段流程；不要求用户开启 `skills_like`。模块顶层短说明在 `skills_like` 的参数阶段可能被移除，因此每个有限 `action` 的用途和必要条件仍写入 `action` 参数说明，选中模块后可以读取。Core 在服务端按所选 action 的原能力 schema 校验必填字段、类型、范围及多余字段，拒绝其他 action 专有的参数；游戏特有的跨字段规则仍由模块原有校验处理。每次调用逐 action 复核旧工具权限、inactive 状态、owner 与 module epoch。

| 模块入口 | action → 旧工具权限身份 |
| --- | --- |
| `steam_dlc_steam` | `search` → `steam_dlc_steam_search`；`app` → `steam_dlc_steam_app`；`profile` → `steam_dlc_steam_profile`；`recent` → `steam_dlc_steam_recent`；`games` → `steam_dlc_steam_games`；`wall` → `steam_dlc_steam_wall`；`wishlist` → `steam_dlc_steam_wishlist` |
| `steam_dlc_dota2` | `recent` → `steam_dlc_dota2_recent`；`profile` → `steam_dlc_dota2_profile`；`match` → `steam_dlc_dota2_match`；`stats` → `steam_dlc_dota2_stats`；`last` → `steam_dlc_dota2_last`；`analyze` → `steam_dlc_dota2_analyze` |
| `steam_dlc_cs2` | `profile` → `steam_dlc_cs2_profile`；`recent` → `steam_dlc_cs2_recent`；`stats` → `steam_dlc_cs2_stats`；`last` → `steam_dlc_cs2_last`；`match` → `steam_dlc_cs2_match` |
| `steam_dlc_deadlock` | `profile` → `steam_dlc_deadlock_profile`；`recent` → `steam_dlc_deadlock_recent`；`stats` → `steam_dlc_deadlock_stats`；`last` → `steam_dlc_deadlock_last`；`match` → `steam_dlc_deadlock_match` |

旧工具名不再作为同模块的第二套模型入口，但继续作为逐 action 的 persona、插件/子 agent 过滤及 Host 权限身份；迁移不会把原来只允许一个查询的配置扩大为整个模块。主请求按当前 Host event 与权限生成聚合 `FunctionTool`：完整选择保留全部获准 action，legacy 子集仅保留对应 action。Host handoff 的 `tools=None` 或显式新 parent 路径沿用原生 full 对象；合法真实 `Context`/event 对当前对象的直接 Python 调用沿用 Host 基线，构造 SDK 对象或伪造上下文不能取得调用权。命令、页面、候选续接、内部 capability 和结果语义不因入口聚合而改变。完整声明合同见[模型工具迁移说明](docs/model-tools.md)。

## 生涯拼图与缓存

默认 dense、20列、1080px 内容宽、原版2:3竖海报、标准时长预设、包含软件，默认数量500项。0时长排除，未知时长单独计数，不冒充0。`--games-only` 排除软件。有限数量至少20，快捷档位为20/50/100/200/500/1000/不限，手填可超过1000。完整有限数值先向零截断成整数，再校验；空值、布尔、混合文本、非有限数及精度溢出拒绝。不限使用独立模式，不将 Infinity 写入配置。新装默认500，旧1…19由明确批准的兼容迁移归一到20，1000仍是有限值；其他有效配置保持。旧 legacy 模式继续可选且限制200项。

| 倍率 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 单机 single 小时 | 1 | 5 | 15 | 30 | 60 | 100 | 200 | 500 |
| 标准 standard 小时 | 1 | 20 | 50 | 100 | 250 | 500 | 1000 | 2000 |
| 长玩 long 小时 | 1 | 50 | 200 | 500 | 1000 | 2000 | 4000 | 8000 |

锚点间按面积插值后量化为1–8倍，每张占 k列×k行；相同时长与规格不受库中其他作品影响。大图跨行、小图填空，物理密排顺序可不同于逻辑时长榜；同分逻辑榜按数值 AppID 排序。普通基元54×81/96/108，高质量为72×108/128/144。窄比例 cover 会裁剪，contain 等比留边，均不拉伸。无法容纳时明确说明预算与 omitted，不静默丢图。500是默认有限数量，1000是不限前最后一个快捷档位。密排作业按有界批次持续生成结果索引，1001、1500和更大集合不被静默截断。单图、单批、期限及缓存预算仍有限；限流或预算不足保留已完成页并明确失败/可重试，不把部分生成写成全部成功。

`games` 最多5款 mostPlayedGames，`recent` 是主页最多3款展示；都不代表完整库。`full` 使用 GetOwnedGames，明确包含玩过的免费游戏；私密库、缺 Key、上游错误分别报告。来源完整性与筛选后入图完整性分开显示 requested/eligible/included/omitted。页面可用明确账号生成和下载原始 PNG，不发送聊天消息。

公开原封面由 Core 持久资源缓存复用，切换预设/比例复用同源素材。本人的选择快照与命令成图保留 USER 隔离。热成图命中仍复核权限、epoch、过期与文件完整性；不能用缓存取得已撤销内容。性能与真实库数量应以具体候选实测为准。

作业状态和结果按当前身份隔离；命令与Dashboard的归属不按昵称关联。离开页面只停轮询，不取消已接受的作业。重启后运行中作业标记中断，可明确重试；不承诺自动断点续跑。

愿望单区分空单、私有/受限、429及来源失败；价格、币种、折扣和发售状态只按可得信息显示。来源返回范围不等于完整库。

## Dota 订阅

首次完整成功采样仅建立基线。订阅固定创建时的 ID32，换绑不会改变目标；重复创建原子复用，取消后重建产生新 generation。恢复采样最多保留24小时内最新3场候选，包含待详情项，较旧积压明确跳过。不同会话同玩家共享公共采集；同一完整受信目标同场只形成一份战报；Core封包前利用已取得的公开十人事实，对同来源、同订阅类型及同目标的当前有效成员受限重评。另一玩家 recent 错峰超过30秒也可纳入首份战报，敌对阵营分别显示胜负；以后个人 recent 到达不重复发送。新订阅仍先建立自己的基线。模板/语言版本变化不重发旧业务事件，取消与成员变化在发送前重新校验。

默认启用订阅、轮询300秒、OpenDota RPH100、模型短评关闭。每个唯一玩家每5分钟轮询约需12次列表请求/小时；8个唯一玩家约96次，尚未计比赛详情、手动查询与重试。这是预算示例，不是吞吐保证或硬上限；跨群同玩家共享采集。间隔可选60/300/900/3600/21600/43200/86400秒。RPH 是本机同源滚动60分钟的实际尝试，手动、模型、后台共用，重试计数、缓存命中不计；RPM 与429冷却同时生效并跨重启保留。空值恢复默认，0不代表无限。页面显示额度和恢复时间；CRUD 使用上述可信命令，不伪造 Web 聊天身份。

可选短评在持久化事件后、发送前调用 Host 模型，隔离会话、无历史/工具，严格超时；失败照常发送确定性事实战报。不@玩家、不解析 Demo、不保证绝对 exactly-once；发送结果不明保持 UNKNOWN，不自动重发。详见 [Dota 合同](packages/steam_dlc/dota2/README.md)。

## CS2 与页面

CS2 以 CS2UID 为行为和接口参考，退休旧 Leetify 主方案。perfect、official、5e 分别保留 provider、platform、来源ID、赛季、时间、覆盖与缺项。official 是完美收录的官匹，不能覆盖所有 Valve 历史。5E及官匹的单场能力在来源只提供近期摘要时明确显示 summary/partial，不伪造完整技术指标；实际接口字段和可用性需真实凭据验证。详见 [CS2 来源合同](packages/steam_dlc/cs2/README.md)。

页面复用 Core `@game-link/ui`、主题与生命周期，包含普通设置、受控凭据、CS2查询和Steam拼图下载。普通草稿按 scope 隔离，Token不留草稿；CAS冲突先重读，未知写入不自动重试，旧响应不覆盖新状态。桌面和390px移动视口模拟、真实手机、扫码与线上来源是不同验收层。

同一页面身份短暂不可用会暂停请求和轮询；恢复后可重新手动操作，不自动重放提交。切换身份、撤权或离开页面后，旧响应继续失效。CS2 的 rating、PW rating、ADR 等支持合法小数显示，缺失值仍显示未知。

## Core 的既有已知限制

- `CORE-K01`：任务队列取出的一整批候选都无法入场时，后续任务可能停在 queued。本版未修复该 Core 行为；queued 仅可查询或按权限取消，不能当作失败任务重试。
- `CORE-K02`：同群、同模块/类型/来源累计 101 条 active PUBLIC 订阅会超过冻结 Core 的候选投影上限，可能影响共享 observation 的其他群。本版保留公共事件聚合，不以 DLC 内存计数、私有数据库修改或关闭 projector 绕过该限制。

两项限制不属于本次模型入口改造；本次不更改数据库 schema，也不以 DLC 内部旁路规避。

## 构建与边界

所有业务仅使用公开 SDK；Core 不含游戏协议。SDK仅由 Core提供。正式许可与行为参考见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)，架构与来源见 [architecture.md](docs/architecture.md)、[providers.md](docs/providers.md)。

```powershell
npm ci --ignore-scripts
npm run build:pages
python scripts/sync_page_resources.py
python -m unittest discover -s tests -v
npm run test:pages
ruff check main.py packages tests scripts
ruff format --check main.py packages tests scripts
mypy packages/steam_dlc
python scripts/build_release.py
```

页面构建需要配对 Core 源码的锁定前端依赖，可通过 `YGL_CORE_ROOT` 指定只读源码位置。先构建页面/同步摘要，再在干净已提交源码生成正式 DLC 包。消费者验证使用同一 Core 源码生成的 canonical a23 wheel，仅安装在隔离环境；Core/DLC 必须共同构建和验收。CI 的 Python 消费者回归生成去标识 CS2 序列化结果，再由页面测试读取 `CS2_GATEWAY_FIXTURE` 验证真实跨层数字显示。独立扩展通过受信管理安装计划授权并在运行时发布当前页面；包声明不自动取得秘密权限。`--allow-dirty`仅供本地开发，正式包要求已提交源码和干净工作树。

双插件 harness 入口为 `scripts/smoke_two_plugins.py`，分别在新隔离目录运行 `--order core-first` 和 `--order dlc-first`，同时给 `--core-zip`、`--dlc-zip`、`--host-source`、`--work-root`。其事件与接口响应为合成数据；不证明真实新比赛、IM、扫码或线上平台通过。未配置凭据时先使用已有公开能力，实际Key、扫码、目标发送授权和IPv6-only测试应分别记录。安装前备份最新数据；不要把旧 schema 数据库覆盖到已升级实例。过程证据、账号、Key、附件、缓存均不进入公开仓库或安装包。
