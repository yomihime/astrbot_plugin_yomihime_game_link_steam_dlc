# 支持与验证矩阵

Steam DLC 通过 AstrBot 插件管理安装，依赖支持普通 ZIP 安装的游戏连结 Core。可按任意顺序安装两个插件。Core 就绪且通过兼容性检查后，Steam DLC 会自动接入。DLC 的 AstrBot 元数据下限为 4.29.1，具体环境的验证范围请看对应版本的记录。

| 类别 | 能力/环境 | 证据边界 |
| --- | --- | --- |
| 历史 CI | DLC `alpha.7` 自动化 | 仅适用于对应历史源码和工作流；不证明 `beta.1`、真实平台或 Host。 |
| 历史现场来源检查 | beta.1 时原 Host 保存的 Steam Key 完成真实只读完整库刷新；已有 Perfect 授权完成资料查询 | 历史记录只证明对应版本与当时来源；beta.2 的凭据状态预检不等于本轮下游业务已通过。秘密、账号和响应数据不公开。 |
| 隔离/合成 | 单元测试、去标识 fixture、合成双插件 harness、页面视口模拟 | 仅证明相应离线/隔离路径。它们不证明真实新比赛、IM、二维码、真实手机或线上 API。候选测试结果须看对应 CI。 |
| 模型工具模式 | Host `full` / 原生 `skills_like` | 主请求按当前 Host event 和权限生成聚合 `FunctionTool`，完整选择保留全部获准 action；legacy 子集只含对应 action。Host handoff 的 `tools=None` 或显式新 parent 路径沿用原生 full 对象。两者复用逐 action 旧权限、inactive、owner 与 epoch 检查；skills_like 参数阶段仍保留 action 用途。合法真实 Context/event 的直接 Python 调用沿用 Host 基线，SDK 伪造不获权。实际候选需分别验证，源码声明或 schema 快照不等于真实模型成功。 |
| 未验 | 5E 真实查询及头像 | 未提供 5E Token/domain；保持实验性/未验。不得推测图床或把缺少凭据写成空数据成功。 |
| 未验 | Dota 真实 IM 投递和自然新比赛 | 没有受信目标、允许发送条数、时间窗和消息授权，本轮测试出站数为 0。管理页或合成事件不替代真实会话身份。 |
| 未验 | 非空 CS2/Deadlock 样本、真实手机、OS 重启、生产磁盘恢复 | 外部条件未提供或未执行；390px 视口模拟不代表真实手机，备份校验不代表生产磁盘恢复。 |
| 来源限制 | Steam 私密库、OpenDota 收录范围、完美/官匹/5E摘要、Deadlock 社区数据 | 受上游可见性、收录和凭据限制；官匹是完美收录口径，官匹/5E近期摘要不等于完整历史或完整单场。可选 OpenDota Key 不扩大 RPH。 |
| 历史部署验证 | Core 动态页面资源 | PR17 的 Core 0.1.12 候选（`fd713227c00094974c82df969e7883880cbbc8b3`）验证过 LAN HTTP 环境的摘要校验回退、localhost 原生校验、页面和图标。Core 0.1.13 当时只更新元数据并构建。此行仅记录该批历史结果。 |
| Core 既有限制 | `CORE-K01` | 队列整批候选无法入场后，后续 queued 作业可能没有新唤醒；queued 仅查询或取消，不提示 retry。 |
| Core 既有限制 | `CORE-K02` | 同群同模块/类型/来源累计 101 条 active PUBLIC 订阅可能超过投影 100 上限，影响共享 observation 的其他目标。 |

使用完整插件 ZIP 安装和更新。GitHub 自动生成的 `Source code.zip` 缺少安装所需的生成文件。更新前请备份配置、数据库和现有密钥。回退前应核对目标版本与当前数据库的兼容性，保护最近的配置和数据。普通安装无需额外批准。

## 查阅验证结果

请在对应版本的发布说明和 CI 中查看使用的 AstrBot、Python、操作系统及验证结果。未列出可查证结果的项目仍按未验处理。

[历史 v0.2.0-beta.4 发布记录](https://github.com/yomihime/astrbot_plugin_yomihime_game_link_steam_dlc/releases/tag/v0.2.0-beta.4)对应旧版 Core 0.1.13 与 SDK a24 的安装方案。历史 beta.2 使用 a22。相关记录适用于各自版本。
