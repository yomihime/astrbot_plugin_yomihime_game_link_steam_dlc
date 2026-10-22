# 架构与公共合同

本文件的初版是调查入口；在当前主项目加载器、SDK 和 Host 公共 API 核实后冻结实现合同，之后才释放依赖任务。未冻结部分不作为已存在 API。

固定边界：独立 AstrBot 入口 + 一个完整 DLC package + 四模块；`steam` 唯一持有 USER 账号记录；游戏模块经显式 SDK 依赖读取当前主体的最小只读身份。`shared` 仅纯函数/不可变 DTO，禁止共享可变绑定表或模块实例。Core 改动限通用能力，在独立 worktree 完成。

模块只使用 canonical SDK；不复制 Core 或 vendoring 第二份 SDK。包目录服从当前安全捕获/导入规则。命令写操作不注册 Tool；Dota Tool 首期要求显式目标，默认身份只保证 COMMAND 闭环。CS2/Deadlock 首期只提供实际状态及帮助。

时间以 UTC 记录、展示按配置时区；SteamID64 以字符串传输；胜负 win/loss/unknown，缺失与 0 分开。公开查询缓存以源/操作/目标/参数区分，身份以 principal/绑定 revision 隔离。查询输出绑定其请求开始时的目标快照。
