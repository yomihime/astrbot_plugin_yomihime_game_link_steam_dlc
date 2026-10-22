# Steam DLC alpha 执行与验收

当前结论：候选尚未完整通过验收。用户已批准追加 1 轮，仅修 R4-I1 的 DLC 页面适配及其验收。既有 API、业务、生命周期与包审计通过记录保留。Core `8981ee2` 完整 CI 随后结束为 failure：2515 项中 3 errors、87 skipped，均在安装样例状态调用；Windows 检查通过，build skipped，正在单独诊断。页面修复与 Core CI 分别记录，不能由局部门禁宣布完整 alpha 交付通过。

任务书：`Steam_DLC_Codex_Taskbook.txt`。[public alpha 分支](https://github.com/yomihime/astrbot_plugin_yomihime_game_link_steam_dlc/tree/feat/steam-dlc-alpha)位于指定的 `astrbot_plugin_yomihime_game_link_steam_dlc` checkout。main 保留建库初始提交 `01457b2f80ab18ecf735109c76b9575ef7d34890`；安装使用已审计 ZIP。

DLC 运行源冻结于 `32e24195b96b6e7a901172736eba2093f24c48f0`；最终验收脚本与已验安装包来源为 `4645f80f99eb7d107bcbb578291fd7acf0eb86b1`。后续文档提交不改变已验包。Core 独立 worktree 分支 `feat/steam-dlc-support`，提交 `8981ee2b2c6d0a447728f3b257bb5d09380154c8`，基线 `11cf85e31391453ab5140dba8181089469db5487`；[Draft PR #11](https://github.com/yomihime/astrbot_plugin_yomihime_game_link/pull/11)。canonical SDK `0.1.0a13`、模块 ABI `2.0`、Host bridge `1`。

| REQ | 实现 / 提交 | 验证 / 当前状态 |
| --- | --- | --- |
| REQ-01 建库 | public 建库、指定路径 clone；规范 `ccba87d` | 远端、本地 owner/基线/分支核对 passed |
| REQ-02 协作 | economy 文档、真实 agent、最多两子任务、单 writer | 新上下文初审与两轮修复复审完成 |
| REQ-03 包与 SDK | `f45e8c3`、`32e2419`；完整捕获四模块/shared、AGPL-3.0、单 canonical SDK | ZIP/CRC/摘要审计、非 editable wheel 安装及真实 SDK origin passed |
| REQ-04 生命周期 | Core `2f88b99`、`be5b43d`、`8981ee2` 通用桥接/lease/分包服务 | 两顺序、幂等、旧 lease、Core/DLC 重载、启停、真实卸载、FF14 共存 passed |
| REQ-05 Steam | `f45e8c3`；个人 SteamID 位域/URL、字符串、self_asserted、唯一 USER record、CAS/tombstone | 纯函数/模块测试及真实换绑/解绑/重启保留 passed；不依赖 OpenDota 收录 |
| REQ-06 主体依赖 | Core `be5b43d` 只读 collection 与 OWNER proof；最小 PRIVATE DTO | 同群 A/B、跨平台、未绑定、群管理拒绝、换绑快照、provider 停用、旧 Tool epoch passed；worker 写拒绝通过 |
| REQ-07 Dota | `32e2419`；三查询、固定 GET、PUBLIC 缓存、有界 DTO、中文英雄/时区 | 23 项 DLC 测试、Core 缓存/HTTP 提示合同、Host 三查询 passed；匿名 API 三 GET 均 200 |
| REQ-08 CS2/Deadlock | `f45e8c3`；实际 factory/生命周期/help/status | 实际加载/状态/管理启停/卸载 passed；游戏数据待实现，无虚构 Tool |
| REQ-09 管理与 UI | 通用目录、状态、普通设置、公开 catalog | 真实认证 Dashboard API 与 timezone CAS passed；浏览器模块列表 passed、Dota 配置路由 failed（R4-I1）；dots 未同步 |
| REQ-10 门禁与独审 | 冻结产物、离线 CI、真实 Host 分层记录 | 受影响门禁与 R3 范围内独审 passed；新增 R4-I1 待闭合；完整 Core CI 另记；真实 IM/模型未验 |
| REQ-11 候选产物 | 两开发分支已推送、Core Draft PR、已验 ZIP 和 a13 wheel | 保存精确候选；因 R4-I1 不宣称完整验收通过；本地 `dist/delivery.json` 标注当前状态，不自动合并或 Release |

## 验证账本

本地原始日志、API body、调度快照及合成 Host 数据在 git 本地 exclude 的 `.work/steam-dlc-alpha/`，不推送 public。下列证据路径均相对此目录；README、公共 harness 和 CI 提供复现入口。

| 层级 / 环境 | passed / failed / skipped / unrun | 原始证据 |
| --- | --- | --- |
| DLC / Python 3.13、实际安装 a13 wheel | 23 / 0 / 0 / 0；Ruff、format、mypy passed | `dlc-a13-gate-*.log`、`dlc-a13-gates.json` |
| Core `8981ee2` / 原生 Windows、Python 3.13、隔离 staging | 144 / 0 / 0 / 0；含非 editable SDK 安装、缓存/输出/HTTP/版本/只读记录/外包生命周期 | `core-affected-a13.log`、`core-affected-a13-result.json` |
| AstrBot 4.29.1 / Python 3.12.10 / Core 先装 | 19 / 0 / 0 / 4 | `host-acceptance-a13-r3-core-first/two-plugins.json` |
| 同上 / DLC 先装 | 20 / 0 / 0 / 4 | `host-acceptance-a13-r3-dlc-first/two-plugins.json` |
| 两个独立新进程重启 / 各自原数据 | 各 2 / 0 / 0 / 3 | 上述目录 `two-plugins-restart.json` |
| 独立公开 OpenDota / 匿名 GET | 3 / 0 / 0 / 0 | `live-opendota/receipt.json`、三个原始 body |
| DLC CI / Ubuntu、Python 3.11 与 3.13 / `4645f80` 固定 Core `8981ee2` | 两 matrix job success | [Actions 39760750701](https://github.com/yomihime/astrbot_plugin_yomihime_game_link_steam_dlc/actions/runs/39760750701) |

Host 安装阶段的 restart-unrun 已由后续新进程覆盖。Host 最终仍未执行 live API、真实 IM 与浏览器视觉；live API 由独立冒烟验证。正常验收使用真实 PluginManager、ZIP、公共生命周期、canonical SDK、命令、published FunctionTool 与 Dashboard 认证 HTTP；事件、IM 接收器和 HTTPS body 是 fixture，未调用实际模型。各层不能合成为“真实 IM 端到端通过”。

随后补做 H2 浏览器检查：真实 Core 稳定 view、真实 Dashboard ASGI/认证 API，加一个遵循已核实 Host postMessage 合同的合成父容器；未加载 AstrBot 整壳前端。四模块及 FF14 的列表/实际状态可见，但 Dota2 设置路由失败。证据 `host-browser-a13-02/modules-snapshot.yml`、`modules.png`、`dota-empty-snapshot.yml`、`dota-empty.png`、`browser-finding.json`。仅 favicon 404 的控制台错误与本问题无关。此前表中的 browser-unrun 不应覆盖这次实际 failed。

公开 API 当次 observed remaining-minute 为 59/58/57、remaining-day 为 2999/2998/2997，不作为永久配额。产品 30 requests/minute 是本地保守上限。未使用 Steam/OpenDota Key、STRATZ 或解析 POST。

Core 同 HEAD 完整 CI 为 [Actions 39760759331](https://github.com/yomihime/astrbot_plugin_yomihime_game_link/actions/runs/39760759331)，最终状态在交付收据核对。另一个本地完整回归针对旧 `2f88b99/a12`，因候选已更新主动中止，状态 interrupted/incomplete；日志 `core-full-native-r1.log` 与 `core-full-result.json` 保留，自有空私密测试目录已清理。不冒充最终 a13 全量结果。

## 独立审查与历史失败

| 轮次 | 结论与修复 |
| --- | --- |
| R1 初审 | 1 Blocker、3 Important：默认本人查询、缓存合同、Retry-After/故障分类、中文英雄。第 1 轮集中修复 Core `be5b43d` / DLC `32e2419` / a13；保留 `review-r1.md` |
| R2 第一次复审 | 原四项关闭；新增 1 Important：依赖停用在 Gateway 前拒绝后无反馈。有界根因诊断 18 passed / 2 同根因 failed / 4 unrun。第 2 轮只修通用早期拒绝反馈；保留 `review-r2.md` |
| R3 第二次复审 | 0 Blocker / 0 Important，通过。独立核验最终源码/ZIP、43 项 Host 检查、144 项 Core 门禁，另自跑 11 定向项；报告 `review-r3.md` |
| R4 后续浏览器补验 | 新增 R4-I1 Important：字段存在但未声明 config page，设置按钮退到无页面主页。R3 当时明确未覆盖浏览器，不能据其旧结论关闭新问题 |

早期 a12 默认查询失败、旧文案 harness 断言失败、a13-r2 provider 停用失败、诊断运行与环境失败均保留原始 failed/unrun，没有覆盖为通过。两轮修复已经用完，不以更换 agent 重置。

## agents 执行记录

| 切片 / 角色 | 请求模型 / effort | 实际生效 | 独立产物与复用 |
| --- | --- | --- | --- |
| A / 通用 Host、身份合同 | gpt-6.1-sol / high | unknown | 外包桥接、生命周期、只读存储修复；原 agent 补证 |
| B / 纯领域与 Dota | gpt-6-luna / high | unknown | SteamID、DTO/规范化、三查询及测试；原 agent 修复和补使用文档 |
| H / 真实 Host 验收 | gpt-6.1-sol / high | unknown | 公共 harness、双顺序安装/重载/管理/Tool/重启证据与合成数据清理 receipt |
| R / 独立审查 | gpt-6.1-sol / high | unknown | 未参与实现的新上下文初审，原 reviewer 两次复审；三份报告 |

root 串行维护公共合同及共享文件，未修改全局 Codex 配置或请求额外收费加速。可见运行时 Codex CLI `0.162.0-alpha.17.2`；请求型号不冒充生效型号。token 与费用无可用实测，记 unknown。最终四个 Host 阶段约 119 秒、Core 定向 128.842 秒，不能相加当作全任务耗时。技能来源 `yomihime/yomihime-pouch@e848b3308a3094b2ed663735824f28c3095c05f9` 加本地 goal-directed 规则。

## 安装、后续与边界

先装匹配 SDK a13 的 Core 候选 ZIP，再装 DLC ZIP、启用并重启；具体命令见 README。完全匹配的已验候选直接复用。Core metadata 仍为 `v0.1.2`，须以提交、SDK pin 和完整 SHA256 区分，不能拿旧正式同版本 ZIP 替代。

真实 IM、实际模型对话、AstrBot 整壳视觉仍 unrun；H2 稳定 Core 页的浏览器结果按上列 passed/failed 保留。默认账号 Tool 按本轮范围不开放，模型须明确指定账号。CS2/Deadlock 游戏数据、完整账号 GUI、新视觉主题、Steam OpenID/vanity、多账号/跨平台合并、解析提交/后台复盘及 STRATZ 延期。

当前四模块通用管理 API 可用，尚未同步 dots 新 UI。主 checkout 的 `pages/**` 与 `modules/ff14/pages/**` 未改。发行资源只在独立 staging 按固定基线构建，没有拼接未完成分支的生成物。合并、Release、日常机器人安装不在本轮自动执行范围。

合并建议：Core 通用变更的 R3 审查通过，仍须等待同提交完整 CI，由维护者决定 PR #11；DLC 整体因新增 R4-I1 尚不可宣布验收通过。DLC 严格要求 SDK a13，不能混用旧同版本 Core ZIP。

## 已批准的追加修复

用户已明确选择“追加 1 轮，仅修 DLC 页面适配”。原两轮修复与历史失败保留，追加额度仅为 1 轮；当前继续实施下述 DLC 页面适配、浏览器验收及独立复审，不扩大 Core/dots 页面或业务权限范围。

根因已收敛：manifest 的 `pages=[]`，后端普通配置字段仍存在；管理列表依据字段显示“进入设置”，稳定 shell 的 `selectSettings(owner)` 只找 `role=config` 的已声明页面，找不到便退回模块主页。全局设置只显示 Core owner，不能替代 DLC 配置页。父桥、JWT、管理 API 与数据库 CAS 均不是根因。

建议追加 1 轮修复与独立复审，继续最多两个活跃子任务、单 writer、实际模型/费用 unknown、无额外收费加速。实现限 DLC：按已有 `PageModule.mount` / `ModulePageServices.config` 公共合同提供最小首页帮助/状态与普通配置页，声明各模块 home/config 页面及固定资源摘要，更新显式 ZIP 资源清单。四模块共享最小页面代码但不共享可变业务状态；不新增账号 GUI、不改 Core/dots 页面、SDK 或 Steam/Dota 业务权限。

新增门禁为真实浏览器导航、Dota 时区读取/保存 UTC 后恢复、CAS 冲突、页面 owner/epoch 失效与卸载清理；重新冻结 ZIP、运行受影响包/页面/Host 检查并独立复审。无需因纯 DLC 页面改动重跑未改 Core 的全套；Core 现有完整 CI 另记。若这一追加轮仍有 Blocker/Important，再报告剩余问题，不重置预算或降低标准。

## Core 完整 CI 的新增测试合同问题

[Core run 39760759331](https://github.com/yomihime/astrbot_plugin_yomihime_game_link/actions/runs/39760759331) 最终 2515 项、3 errors、87 skipped。三个失败共用 `tests/fixtures/core_hardening.py:672` 前置流程：先启用样例，主动停用 source，验证依赖拒绝。Core `8981ee2` 将这一准入拒绝精确表示为 `HostIngressUnavailable`；夹具仍仅捕获 `PermissionError`，因此新信号逃逸。初始启用与独立 status 发送已通过，无证据表明产品错误放行或错误禁用。

用户随后明确选择“扩展本轮，仅适配 Core 测试夹具”。本轮追加额度仍为 1 轮，新增范围仅是导入现有 `HostIngressUnavailable`，让依赖拒绝和缺配置拒绝两处精确捕获该类型，保留原权限/状态/输出断言。运行时代码、SDK、业务权限和 dots 页面不变。补跑三个安装样例场景及相关准入测试，再提交推送同一 Core Draft PR、执行 CI 并独立复审。补丁保存在本地证据目录 `core-ci-fixture-proposal.patch`，不修改未声明 Tool 权限拒绝的原 `PermissionError` 检查。
