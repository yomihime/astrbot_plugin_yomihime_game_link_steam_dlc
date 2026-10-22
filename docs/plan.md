# Steam DLC alpha 执行与验收

当前结论：**本轮可安装 alpha 交付完成**。正式配对包、真实 Host 两种加载顺序及重启、真实 Core 页浏览器、资源失配拒绝和同提交完整 CI 均已验收；R6 新上下文独立审查及最终证据补核为 **0 Blocker / 0 Important / 0 Polish**。真实 IM、模型、完整 Dashboard 父壳及 Host SDK 在线调用仍待验，具体边界与历史失败按下文保留。

## 修订、产物与权限

任务依据为 `Steam_DLC_Codex_Taskbook.txt` 及用户的三次范围追加。独立 public [DLC 仓库](https://github.com/yomihime/astrbot_plugin_yomihime_game_link_steam_dlc)，指定本地 checkout `E:\AI\Dev\AstrBot\astrbot_plugin_yomihime_game_link_steam_dlc`。开发分支 `feat/steam-dlc-alpha`；main 保留建库初始提交 `01457b2f80ab18ecf735109c76b9575ef7d34890`，安装使用审计 ZIP。

正式配对源码冻结：DLC `a9a2a362dab2b0ffaac3414b702b24fd6b026270`；Core 独立 worktree `worktrees/game-link-dlc-support`、分支 `feat/steam-dlc-support`、`c11d5a54b3977327729b4b8d38d1f66331fb2e50`，基线 `11cf85e31391453ab5140dba8181089469db5487`；[Core Draft PR #11](https://github.com/yomihime/astrbot_plugin_yomihime_game_link/pull/11)。canonical SDK `0.1.0a13`、模块 ABI `2.0`、Host bridge `1`。后续只含文档的提交不冒充这两个已验安装包的构建来源。

| 正式候选 | bytes / members | 完整 SHA-256 |
| --- | --- | --- |
| DLC ZIP，源 `a9a2a362` | 70,507 / 32 | `e8bae989c7f4f3fdc08056e8d31e3a5a98dd9a6b8592306fc0251bdf07bff985` |
| 配对 Core ZIP，源 `c11d5a54` | 1,264,438 / 268 | `f60a72ea15e81781f04aaa786136f60605e6d540304010d5bee0c28850ae0a81` |
| 复用 canonical a13 wheel | 48,137 / 24 | `3ea9366bfd937875066d74f764f6635ea845507ac2ee054a92f3bae38f531015` |

候选内容、CRC、安全路径、资源摘要、源码逐字节匹配及 SDK 单一来源审计通过。Core 只带显式配对的 DLC manifest/静态资源，不带 DLC Python。完整 manifest 配对摘要为 `d1da50c079d02f275cf7243c6f4a9015b322b849e38bcc2a16f0f5675042e0ef`。完全匹配的已验包直接复用，不重复构建。这组精确字节已直接复用到本地 `dist/`，完整收据为 `dist/delivery.json`、摘要清单为 `dist/SHA256SUMS`；旧候选及原交付收据先逐字节归档到本地证据区。SDK 完全匹配，直接复用已有文件，没有重建。

建库、clone、提交、推送与 Draft PR 已获任务书授权。合并、Release、日常机器人安装不在本轮执行范围。原 Core checkout、dots 的 `pages/**` 与 `modules/ff14/pages/**` 均保持只读；前端仅在自有 staging 使用同一固定基线构建产物，没有拼接未完成 UI 分支。

## REQ 验收链

| REQ | 实现 / 提交 | 验证 / 当前状态 |
| --- | --- | --- |
| REQ-01 建库 | public 仓库、指定路径 clone；规范 `ccba87d` | owner、remote、基线、开发分支核实 passed |
| REQ-02 协作 | economy、真实 agents、最多两活跃子任务、单 writer | 初审及历史失败保留；第 4 轮修复复审已闭合，获准总上限 5 |
| REQ-03 包与 SDK | DLC 完整捕获四模块/shared；AGPL-3.0；a13/ABI2/bridge1 | 非 editable canonical wheel、正式包来源及 Host SDK origin passed；DLC 无 SDK vendoring |
| REQ-04 生命周期 | Core 通用 Star 发现、实例 lease/generation、服务与准入 | 正式配对两顺序、幂等、旧 lease、Core/DLC 重载、启停、卸载、重启数据保留、FF14 共存 passed |
| REQ-05 Steam | 唯一 USER records owner、个人 SteamID 位域/URL、字符串、self_asserted、CAS/tombstone | 离线领域/模块及真实 Host 换绑/解绑/重启保留 passed；绑定不依赖 OpenDota 收录 |
| REQ-06 主体依赖 | OWNER 只读 proof、最小 PRIVATE DTO、声明依赖；群查询仅当前 COMMAND actor | A/B、跨平台、未绑定、私聊写约束、换绑快照、provider 停用、旧 Tool epoch、worker 写拒绝 passed |
| REQ-07 Dota | 三查询、固定 GET、PUBLIC 缓存、有界 DTO、127 中文英雄、时区、限流/故障反馈 | 当前 Python 28、真实 Host 三查询与显式目标 Tool passed；独立匿名 API 三 GET 200；在线 SDK/IM 未验 |
| REQ-08 CS2/Deadlock | 真实 factory、status/help、生命周期 | 加载、状态、管理启停/卸载与浏览器帮助 passed；游戏数据待实现，无虚构查询 Tool |
| REQ-09 管理与 UI | DLC `a9a2a362` home/config；Core `c11d5a54` 通用固定配对投影 | 正式浏览器四模块帮助/设置、UTC 保存/恢复、CAS、普通草稿保留、旧确认撤销、停用403/清草稿、新 iframe 恢复 passed；dots 新 UI 未同步 |
| REQ-10 门禁与独审 | 冻结同修订审计，R6 新上下文 | R6 代码/包与最终正式证据补核 0B/0I/0P；Core/DLC 同产品修订 CI success；所有历史失败/skip/unrun 保留 |
| REQ-11 交付 | 两分支推送、Core Draft PR、精确配对 ZIP/SDK | 正式配对 ZIP/SDK 已审计、复用并提升到 dist；完整收据保存源提交/bytes/members/SHA；分支与 Draft PR 待维护者合并发布 |

## 当前验证账本

原始日志、JSON、截图、临时 Host 与调度快照只在本地 exclude 的 `.work/steam-dlc-alpha/`，不进入 public 提交或安装包。下列证据路径相对此目录。公共 README、harness 和 CI 是复现入口。

| 层级 / 环境 / 修订 | passed / failed / skipped / unrun | 原始证据 |
| --- | --- | --- |
| DLC `a9a2a362` / Python 3.13 / 安装 a13 wheel | Python 28 / 0 / 0 / 0；Ruff、format、mypy、资源同步 passed；Node 53 / 0 / 0 / 0 | `dlc-p4-gates.json`、`dlc-p4-gate-*.log` |
| Core `c11d5a54` / 静态配对与已有单页投影 | 6 / 0 / 0 / 0 | `p4-core-initial.log` |
| Core 当前受影响 75 项 / 两次环境失败 | 各 4 setup errors + 1 symlink 权限 skipped；其余 70 passed，不能合并为 75 全绿 | `p4-core-affected.log` 为重复复制 dist；`p4-core-affected-corrected.log` 为缺固定字体 fixture |
| 修正自有 staging 后 Core 定向原生 HTTP + 投影 | 10 / 0 / 0 / 0；lint、479 文件 format、文档链接 passed | `p4-core-targeted-final.log/json` |
| 正式配对 / AstrBot 4.29.1、Python 3.12.10 / Core 先装 | 19 / 0 / 0 / 4 | `host-acceptance-p4-final-core-first/two-plugins.json` |
| 同上 / DLC 先装 | 20 / 0 / 0 / 4 | `host-acceptance-p4-final-dlc-first/two-plugins.json` |
| 两个独立新进程 / 各自原数据重启 | 各 2 / 0 / 0 / 3；精确合成私有目录清理 passed | 上述目录 `two-plugins-restart.json`、`host-acceptance-p4-final-receipt.json` |
| 正式配对 / 实际 Host/Core view + Chromium | 所列浏览器门禁 passed；完整父壳、IM、模型、在线 SDK 请求 unrun | `p4-browser-receipt.json`、`host-browser-p4-final/` 原始 API/快照/截图 |
| 配对失配反例 / 实际 Host、独立 TCP HTTP | 29 / 0 / 0 / 1 optional unrun；仅改变 manifest 空白，四业务模块仍 active、页面资源空，8 个 DLC 页面会话 403，同认证 FF14 正向 200 | `u3-negative-pair-receipt.json`、`u3-negative-pair-http-r3.json`；前两次 client 307 适配失败及 shell wrapper exit 1 / Python exit 未单独捕获均保留；正常停服/私有目录与 JWT 清理及端口释放已核实 |
| 独立 reviewer / 正式包与 SDK / 当前源 | JS 53、静态 6、原生 HTTP 4 passed；独立包/资源/源码/SDK 审计 passed | `review-r6.md`、`review-r6-artifact-audit.json`、`review-r6-http-native-final.log` |
| DLC 当前 CI / Ubuntu Python 3.11、3.13 | 两 job success；各 Python 28，3.13 Node 53；CI ZIP 非本地字节等价证明 | [39777897718](https://github.com/yomihime/astrbot_plugin_yomihime_game_link_steam_dlc/actions/runs/39777897718) |
| Core 当前 CI / `c11d5a54` | success；unit 2520 = 2433 passed +87 skipped，0 failures/errors；Windows Python16+Node3 passed；build 附加132 passed/0 skipped；lint/format passed | [39777889597](https://github.com/yomihime/astrbot_plugin_yomihime_game_link/actions/runs/39777889597) |
| 独立公开 OpenDota / 匿名 GET | 3 / 0 / 0 / 0 | `live-opendota/receipt.json` 与三个原始 body；不是 Host SDK 在线调用证明 |

Host 的 install 阶段 restart-unrun 已由后续新进程覆盖，最终 IM、模型、在线 SDK 项仍 unrun。真实 PluginManager 安装 ZIP、公共生命周期、canonical SDK、命令、published FunctionTool 和认证管理 HTTP 均实际执行；事件、IM 接收器与 HTTPS body 为 fixture。浏览器使用真实 Core 静态页、资源授权和 Dashboard ASGI/API，父容器是显式注入的同源合成桥，没有加载 AstrBot 整壳前端。截图只补充实际保存/版本/授权逻辑证据，不代替它。

当前 Core CI 的实际 PR checkout 为 `995ec0c2fa2901943517e471b3a44a8a95932807`，tree `eb36fb21fcef5dc92c604938359a29d4a9a1dd69` 与 `c11d5a54` 完全相同。87 个 skip 的 17 种原始原因均属平台、Windows/NTFS 或私有布局条件，不计作 passed。CI 默认没有传外包页面输入，其通用 Core ZIP 与正式配对 ZIP 分别逐成员审计；预期投影差异不等于两个 archive 字节相同。完整原件见 `ci-final-39777889597/closeout.json`、`verify-final.log`、build 日志及产物审计；独立最终收据为 `review-r6-final-acceptance.json`。DLC 后续仅文档提交的 CI 单列，不改正式 ZIP 的 `a9a2a362` 来源。

正常浏览器离页保留普通字段意图，后续有效编辑递增导航版本并撤销旧非模态确认。公开 scope v1 不提供 dispose 原因，无法将普通切页与仅 scope 撤销即时区分；此时仅保留有界普通意图，旧 owner/runtime/epoch/boundary 分区不可用于新身份，观察到身份/授权失效便清除。fresh iframe 销毁原 JS realm。不得声称任意卸载通知即刻清除所有物理缓存。

## 独立审查与失败历史

| 记录 | 结论 / 后续 |
| --- | --- |
| R1 初审 | 1B+3I：默认本人查询、缓存、限流/错误反馈、中文英雄；第 1 轮 Core `be5b43d` / DLC `32e2419` / a13 修复 |
| R2 首次复审 | 原四项关闭，新增 Gateway 前拒绝无反馈；诊断 18 passed / 2 同根因 failed / 4 unrun；第 2 轮 Core `8981ee2` 修复 |
| R3 第二次复审 | 当时范围 0B/0I；浏览器当时未验，旧结论不关闭后续浏览器问题 |
| R4 浏览器补验 | Important：DLC `pages=[]`，Dota 设置为空；用户追加第 3 轮，仅 DLC 页面，后再明确扩入 Core 夹具导入及两处旧异常捕获 |
| 第 3 轮 / R5 | DLC `77dc921` 28 Python +31 JS passed；Core `dd6b753` 夹具定向12 passed。实际页路由修正，但 Core loader/样式未装配外包；R5 为 1B+2I：固定资源缺失、普通草稿丢失、dirty 后编辑未撤销旧确认 |
| 第 4 轮 / R6 当前 | 用户再追加最多两轮；先用真实资源授权探针证明路径，再实现 Core 通用固定配对与 DLC 导航修复。冻结 `c11d5a54/a9a2a362`；代码/正式包及 Host/browser/失配/当前 CI 的独立证据补核均通过，0B/0I/0P；本轮闭合 |

获准修复复审总额为原 2 + 追加 1 + 再追加最多 2 = **最多 5 轮**，第 4 轮已闭合；更换 agent 或拆片不重置。若第 5 轮仍有 B/I，停止产品返修并给出有边界根因与新计划。新高风险实现由未参与设计/实现的新上下文 R6 审查。

历史 Core `8981ee2` [CI 39760759331](https://github.com/yomihime/astrbot_plugin_yomihime_game_link/actions/runs/39760759331) 的 2515 项含 3 errors、87 skipped，源于夹具只捕获旧异常。`dd6b753` [CI 39771788497](https://github.com/yomihime/astrbot_plugin_yomihime_game_link/actions/runs/39771788497) 已 success：2428 passed +87 skipped，build 附加132 passed，Windows16 Python+3 Node；它是历史同 runtime 夹具证据，不证明当前 `c11d5a54`。早期 a12 全量因候选变化中止为 interrupted/incomplete；所有旧权限、包装、字体、SDK 审计及浏览器断言错误原始日志保留，不合成为全绿。

## agents 与后续

| 切片 / 角色 | 请求模型 / effort | 实际生效 / 产物 |
| --- | --- | --- |
| A / 通用 Host、身份与后续 CI | gpt-6.1-sol / high | unknown；外包生命周期/只读身份合同，复用原 agent 收集 CI |
| B / 纯领域与 Dota | gpt-6-luna / high | unknown；SteamID、DTO/规范化、三查询；原 agent 补证 |
| H / 真实 Host、DLC 页面 U2 | gpt-6.1-sol / high | unknown；harness、生命周期/重启、页面草稿及实际 shell 确认器合同；每次 writer 限定 |
| R / R1–R5 独立审查与补证 | gpt-6.1-sol / high | unknown；各冻结修订的审查记录，失败不抹除 |
| R6 / 新上下文独审 | gpt-6.1-sol / high | unknown；当前正式包、投影/授权/导航源码与独立验证；未参与方案 |
| root / 公共合同与集成 | 继承运行时 | 通用固定配对、跨仓 staging、浏览器、文档与交付；独占共享写入面 |

最多两活跃子任务；无额外收费加速，无全局 Codex 配置改动。可见 CLI `0.162.0-alpha.17.2`；模型、effort、speed、token 和费用无实测时均记 unknown，不从 API 价格估算订阅消耗。技能来自 `yomihime/yomihime-pouch@e848b3308a3094b2ed663735824f28c3095c05f9` 加本地 goal-directed 规则；快照、任务卡、SHA 和实际阶段耗时只存本地证据。

已知阶段开销：本次两种 Host 安装顺序并行，每种约 58 秒，各自新进程重启约 15 秒；最终 Core CI unit 为 4652.239 秒，build 附加 132 项为 280.064 秒。这些是独立阶段，不相加冒充全任务耗时；token、费用及实际模型开销仍 unknown。

安装匹配的 Core ZIP、DLC ZIP，启用并重启，从宿主插件详情重新打开页面；命令与构建方法见 README。Core metadata 仍为 v0.1.2，必须用提交及完整摘要区分。页面或 manifest 升级须重建配对资源，不宣称通用动态外包页面或任意 Python 热替换。合并 Core 与 dots 后应从最终统一源码重建发行资源。

当前稳定 UI 已实际可用，dots 新 UI 尚未同步。真实 IM、模型、AstrBot 整壳视觉与 Host SDK 在线 OpenDota 仍待真实环境验证；独立匿名 API 冒烟不替代这些。CS2/Deadlock 游戏数据、完整账号 GUI、新视觉主题、Steam OpenID/vanity、多账号/跨平台合并、解析提交/后台复盘及 STRATZ 按范围延期。最终门禁已闭合，建议维护者审核合并 Core Draft PR #11，并在后续合入 dots 后从统一源码重建发行资源；本轮保留 Draft，不执行合并、Release 或日常机器人安装。
