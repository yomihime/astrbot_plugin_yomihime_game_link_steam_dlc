# 支持与验证矩阵

本表区分代码/隔离证据与真实环境验收。当前源码候选要求支持模块聚合工具的配对 Core、canonical SDK `0.1.0a23`、module ABI `2.0`、bridge `1`、schema `210`。DLC `0.2.0-beta.2` 的 AstrBot 元数据下限是 `>=4.29.1`，它不是对所有未来 Host 版本的兼容保证。历史 beta.2 Release 是 a22 配对；a23 源码和审核 CI 见 [Core PR #15](https://github.com/yomihime/astrbot_plugin_yomihime_game_link/pull/15) 与 [DLC PR #6](https://github.com/yomihime/astrbot_plugin_yomihime_game_link_steam_dlc/pull/6)；以最终合并提交及其 CI 为准。本次源码合并不发布或覆盖现有 Release，历史 a22 安装资产不能作为 a23 配对包。

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
| 部署条件 | Core 动态页面资源 | 使用 localhost/回环或可信 HTTPS。远程普通 HTTP 可能在父壳 hash 校验前置能力处失败；不关闭校验，也不承诺此部署方式。 |
| Core 既有限制 | `CORE-K01` | 队列整批候选无法入场后，后续 queued 作业可能没有新唤醒；queued 仅查询或取消，不提示 retry。 |
| Core 既有限制 | `CORE-K02` | 同群同模块/类型/来源累计 101 条 active PUBLIC 订阅可能超过投影 100 上限，影响共享 observation 的其他目标。 |

新安装只使用同一候选的 Core/DLC ZIP。备份代码、配置和数据后正常停止 Host，在停止状态先安装 Core、再安装 DLC，然后正常冷启动并核对 SDK、加载路径与哈希。GitHub 自动生成的 Source code.zip 是源码归档，不是插件安装包。回滚恢复同一次备份的配对代码并保留最新数据；不能混用 a22/a23。新增敏感权限仍需批准新的具体计划。

## 当前候选状态

此文档本身不把待执行或待复核工作标成通过。请以最终 beta Release 所附的公开摘要及对应提交 CI 查看候选的精确 Host、Python、操作系统和逐项结果；未列出可访问证据的项目仍按未验处理。
