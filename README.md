# 如月怜的游戏连结：Steam DLC

独立 AstrBot 插件，提供共享 Steam 身份、商店与完整库、游戏生涯拼图、Dota 2 比赛订阅、CS2 完美/官匹/5E 查询和 Deadlock 查询。当前版本 `0.2.0-alpha.1`，需要精确配对的 Core `0.1.5`、canonical SDK `0.1.0a16`、模块 ABI `2.0`、外包桥接 `1`。这些是候选功能分支，安装与线上实测结果以配对交付记录为准。

## 安装与凭据

先安装配对 Core ZIP，再安装 DLC ZIP，启用两者后正常重启 AstrBot。DLC 不包含第二份 SDK。Python/SDK 更新需要重启，运行时不热替换代码。页面、完整 manifest 和受信来源策略均与 Core 构建配对；失配时管理页及凭据接入会拒绝工作，应安装同一交付的两包。

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
| `steam wall [账号] [--source games\|recent\|full] [--mode dense\|legacy] [--preset single\|standard\|long] [--aspect 2:3\|9:16\|1:2] [--quality normal\|hd] [--fit cover\|contain] [--limit N] [--all-apps\|--games-only] [--refresh]` | 私聊输出有界多页生涯拼图；full 需要部署 Key |
| `dota2 profile [账号]` / `recent [账号] [--limit N]` / `stats [账号] [--limit N]` / `last [账号]` | OpenDota 已收录公开资料与最近最多20场样本 |
| `dota2 match <比赛ID> [--account <账号>]` | 比赛与可选玩家焦点，缺失指标明确显示 |
| `dota2 watch [账号]` / `watchlist` / `unwatch <账号或订阅ID>` | 当前群或私聊中创建、查看、取消自己的订阅 |
| `cs2 profile\|recent\|stats\|last [账号] [--platform perfect\|official\|5e]` | 对应平台资料、近期、赛季/样本统计和上一场 |
| `cs2 match <来源比赛ID> [--account <账号>] [--platform perfect\|official\|5e]` | 单场或近期摘要；不解释旧 Leetify UUID |
| `deadlock profile\|recent\|stats\|last [账号]` / `deadlock match <比赛ID> [--account <账号>]` | 社区 API 已收录数据与实际人数的比赛详情 |
| `dota2 status` / `cs2 status` / `deadlock status` | 来源和能力状态；不是凭据有效性证明 |

`bind` 是用户主动声明的账号关联，不是 Steam 所有权认证。本人默认身份仅在可信命令根调用中读取；模型和公开 Web 查询必须给明确目标，不推导私人绑定。默认身份路径整份 `model_facts=None`。商店默认 CN/schinese；时长与比赛数据保留来源、取数时间和缺项原因。

## 生涯拼图与缓存

默认 dense、20列、1080px 内容宽、原版2:3竖海报、标准时长预设、包含软件、最多500项。0时长排除，未知时长单独计数，不冒充0。`--games-only` 排除软件。已有显式配置保持原值，旧 legacy 模式继续可选且上限200项。

| 倍率 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 单机 single 小时 | 1 | 5 | 15 | 30 | 60 | 100 | 200 | 500 |
| 标准 standard 小时 | 1 | 20 | 50 | 100 | 250 | 500 | 1000 | 2000 |
| 长玩 long 小时 | 1 | 50 | 200 | 500 | 1000 | 2000 | 4000 | 8000 |

锚点间按面积插值后量化为1–8倍，每张占 k列×k行；相同时长与规格不受库中其他作品影响。大图跨行、小图填空，物理密排顺序可不同于逻辑时长榜；同分逻辑榜按数值 AppID 排序。普通基元54×81/96/108，高质量为72×108/128/144。窄比例 cover 会裁剪，contain 等比留边，均不拉伸。无法容纳时明确说明预算与 omitted，不静默丢图。500是默认选择上限，1000是有界压力上限，不承诺任意1000张最大倍率都能输出。

`games` 最多5款 mostPlayedGames，`recent` 是主页最多3款展示；都不代表完整库。`full` 使用 GetOwnedGames，明确包含玩过的免费游戏；私密库、缺 Key、上游错误分别报告。来源完整性与筛选后入图完整性分开显示 requested/eligible/included/omitted。页面可用明确账号生成和下载原始 PNG，不发送聊天消息。

公开原封面由 Core 持久资源缓存复用，切换预设/比例复用同源素材。本人的选择快照与命令成图保留 USER 隔离。热成图命中仍复核权限、epoch、过期与文件完整性；不能用缓存取得已撤销内容。性能与真实库数量应以具体候选实测为准。

## Dota 订阅

首次完整成功采样仅建立基线。订阅固定创建时的 ID32，换绑不会改变目标；重复创建原子复用，取消后重建产生新 generation。恢复采样最多保留24小时内最新3场候选，包含待详情项，较旧积压明确跳过。不同会话同玩家共享公共采集；同一目标会话同场的多个玩家在30秒收集窗口内合并通知，保留每个原事件回执。已封口后的晚到成员留下 suppressed 诊断，不伪称已发送。

默认启用订阅、轮询300秒、OpenDota RPH100、模型短评关闭。间隔可选60/300/900/3600/21600/43200/86400秒。RPH 是本机同源滚动60分钟的实际尝试，手动、模型、后台共用，重试计数、缓存命中不计；RPM 与429冷却同时生效并跨重启保留。空值恢复默认，0不代表无限。页面显示额度和恢复时间；CRUD 使用上述可信命令，不伪造 Web 聊天身份。

可选短评在持久化事件后、发送前调用 Host 模型，隔离会话、无历史/工具，严格超时；失败照常发送确定性事实战报。不@玩家、不解析 Demo、不保证绝对 exactly-once；发送结果不明保持 UNKNOWN，不自动重发。详见 [Dota 合同](packages/steam_dlc/dota2/README.md)。

## CS2 与页面

CS2 以 CS2UID 为行为和接口参考，退休旧 Leetify 主方案。perfect、official、5e 分别保留 provider、platform、来源ID、赛季、时间、覆盖与缺项。official 是完美收录的官匹，不能覆盖所有 Valve 历史。5E及官匹的单场能力在来源只提供近期摘要时明确显示 summary/partial，不伪造完整技术指标；实际接口字段和可用性需真实凭据验证。详见 [CS2 来源合同](packages/steam_dlc/cs2/README.md)。

页面复用 Core `@game-link/ui`、主题与生命周期，包含普通设置、受控凭据、CS2查询和Steam拼图下载。普通草稿按 scope 隔离，Token不留草稿；CAS冲突先重读，未知写入不自动重试，旧响应不覆盖新状态。桌面和390px移动视口模拟、真实手机、扫码与线上来源是不同验收层。

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

页面构建需要配对 Core 的锁定前端依赖。先构建页面/同步摘要，再在干净已提交源码生成正式包。Core配对构建同时传 `--sdk-wheel <a16.whl> --external-page-package <本仓库/packages/steam_dlc> --external-source-policy-package <同一路径> --output-dir <新目录>`。策略显式绑定完整原 manifest，不从模块声明自动获得秘密权限。`--allow-dirty`仅供本地开发。

双插件 harness 入口为 `scripts/smoke_two_plugins.py`，分别在新隔离目录运行 `--order core-first` 和 `--order dlc-first`，同时给 `--core-zip`、`--dlc-zip`、`--host-source`、`--work-root`。其事件与接口响应为合成数据；不证明真实新比赛、IM、扫码或线上平台通过。未配置凭据时先使用已有公开能力，实际Key、扫码、目标发送授权和IPv6-only测试应分别记录。安装前备份最新数据；不要把旧 schema 数据库覆盖到已升级实例。过程证据、账号、Key、附件、缓存均不进入公开仓库或安装包。
