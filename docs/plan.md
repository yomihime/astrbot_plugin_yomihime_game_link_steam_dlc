# Steam DLC alpha 执行与验收

任务书：`Steam_DLC_Codex_Taskbook.txt`。目标为独立 public AstrBot 插件，包含 `steam_dlc/{steam,dota2,cs2,deadlock}`。本文件由 root 维护。

| REQ | 可观察验收 | 当前状态 |
| --- | --- | --- |
| REQ-01 | public 建库、指定路径 clone、开发分支与基线可核实 | passed：main 初始 01457b2f80ab18ecf735109c76b9575ef7d34890 |
| REQ-02 | economy 规范、真实 agent、单 writer、独审与证据分层 | 规范建立；委派待合同冻结 |
| REQ-03 | 当前加载器下完整包、canonical SDK、版本与许可、非 editable 安装 | 调查中 |
| REQ-04 | 两插件真实接入，加载顺序、lease、重载、启停/卸载、FF14 共存 | 待实现/真实 Host 验证 |
| REQ-05 | SteamID 校验、字符串传输、self_asserted 单一 USER 记录及 CAS | 待实现 |
| REQ-06 | 显式只读身份依赖；主体/平台隔离、epoch、离线和换绑快照 | 待实现 |
| REQ-07 | recent/profile/match，经 SDK 固定 OpenDota 源，文本降级及有界 DTO | 待实现 |
| REQ-08 | CS2/Deadlock 真实生命周期、帮助/状态，不暴露虚构查询 | 待实现 |
| REQ-09 | 稳定通用管理页面识别四模块、状态与必要设置，保留 dots 边界 | 待验 |
| REQ-10 | lint/类型/测试/发行包、同修订独审、公开 API 与真实 Host 分层记录 | 待验 |
| REQ-11 | 推送代码、必要 Core/SDK 分支和 Draft PR、安装产物及验收表 | 待交付 |

阶段依赖：REQ-01 → REQ-02 规范提交 → 当前 Core/SDK 调查和架构/DTO 冻结 → 波次一（通用接入/纯领域规范）→ 波次二（Steam 身份/Dota2）→ root 装配及跨仓集成 → 冻结、独审和验证 → 可审查安装产物。

非目标：正式合并、Release、日常机器人改动；新视觉体系/完整账号 GUI；Steam OpenID/vanity、多账号、跨平台合并；AI 复盘、主动监听、解析提交/轮询、STRATZ、私有 LLM 客户端和旧数据自动迁移。

验证须记录 passed/failed/skipped/unrun、环境、完整修订和原始证据位置。离线测试、独立安装、真实 AstrBot、真实 API、浏览器和 IM 不互相代替。具体实现/提交与证据在相关 REQ 下补齐。
