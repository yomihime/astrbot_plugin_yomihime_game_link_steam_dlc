# Steam DLC 工程入口

先读 `docs/plan.md`、`docs/architecture.md`、`docs/collaboration.md`。需求以当前任务书及用户指示为准，历史证据不增加操作权限。

- Core 提供通用基础设施；Steam/Dota2/CS2/Deadlock 业务属于本 DLC。模块仅使用 canonical `yomihime_game_link_sdk`、标准库及完整捕获包内的纯代码。
- HTTP、配置、USER records、缓存、依赖、输出及生命周期均经 SDK；模块不读主项目私有服务、数据库、AstrBot event，不自行建立网络客户端。
- `steam` 是唯一账号关联 owner；跨模块访问仅走声明的 SDK 只读依赖。写绑定只接受当前真实主体的明确命令。
- 每个文件/公共合同同时只有一个 writer；由主协调者分配。最多两个活跃子任务，不能自行派生子 agent。
- 主项目 `pages/**`、`modules/ff14/pages/**` 属于 dots，只读。主项目改动在独立 worktree，不操作日常机器人。
- 使用 `multi-agent-engineering`（来源 `yomihime/yomihime-pouch/skills/multi-agent-engineering`），按任务风险选模型，独立审查使用新上下文。
- 临时日志、任务卡、模型快照只存本地 `.work/steam-dlc-alpha/`，经 `.git/info/exclude` 隐藏，不进入 public 提交或安装包。
- 验证入口与安装说明见 README；真实 Host、公开 API、离线 fixture、发行包证据分别记录。禁止以旧修订结果证明新修订通过。
