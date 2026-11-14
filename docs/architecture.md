# 架构与兼容性

Core 负责生命周期、权限、owner/epoch/CAS、存储、受控 HTTP 和凭据、资源、渲染与订阅投递。DLC 通过公开 SDK 提供游戏协议、归一化、时长规则及纯 Evaluator/Composer。DLC 连接 Core 时检查控制协议、模块契约和所需功能，Core 在加载前检查包内容及数据兼容性。SDK 由当前 Core 提供。

每个迁移模块声明一个 `model_tool_name`、短说明和有限唯一 action；原 ToolDescriptor 名称、capability、参数映射与逐项说明继续作为权限和分发事实源。Core 向 Host 注册可正常选择和调用的原生 `FunctionTool` 聚合入口：主请求按当前 Host event 和权限投影为可调用的聚合 `FunctionTool`，完整选择保留全部获准 action；显式选择旧工具子集时，同名 limited 对象只保留对应 action。每次 action 调用仍按旧名复核 Host 权限与 inactive 状态，并由 Core/runtime/Gateway 复核 owner、module epoch、parent、action、descriptor、capability 与生命周期。Host handoff 的 `tools=None` 或显式新 parent 路径沿用原生 full 对象；合法真实 `Context`/event 对当前 `FunctionTool` 的直接 Python 调用沿用 Host 基线，构造 SDK 对象或伪造上下文不会取得调用权。full 与 skills_like 复用 Host 两阶段机制；action 必要说明位于参数 schema，顶层描述被移除时仍可读。

Steam统一管理USER身份关联；默认查询仅可信命令根使用，显式子能力保持结构化账号，即使origin来自COMMAND也不重新解析祖先命令。所有默认身份结果抑制model_facts。平台登录主体独立于目标玩家，不更改共享Steam绑定。

AstrBot 管理普通扩展的安装和启用。Core 按当前有效租约提供扩展声明的页面和资源，校验不通过时拒绝提供。来源策略绑定 module/source/host/credential alias/path/method，模块不能自行授权。实际 Key/Token 通过 Host 的加密存储与 CAS 更新。旧发布格式仍保留其安装计划与权限审批。

授权协议是CS2纯数据descriptor，Core通用runner执行受控请求、有限轮询及一次凭据接收。会话绑定真实管理身份、页面lineage、runtime/epoch/revision；离页、取消、过期、owner失效阻止后到响应提交。普通HTTP拿不到授权专用响应或秘密。Web查询和图片预览使用WEB_PUBLIC真实权限，页面无可信聊天映射时不会伪造COMMAND或创建订阅。

公开页面能力的required_capabilities依赖仅在受信部署闭包中开放必要公共只读子调用，不额外发布可直接访问的Host路由。图片预览在同一当前public invocation中解析公共资源并返回PNG；不发送聊天消息，不写个人成图缓存。普通命令在最终发送前复核权限，成图准备完整后一次组合投递。

Dota复用Core PUBLIC CollectionKey共享采集与持久scheduler/outbox。订阅创建键绑定trusted owner、完整ConversationRef和规范目标；取消重建新generation。纯Evaluator每场独立事件，Core按完整目标路由和PUBLIC作用域合并、保持每成员fence和回执。可选模型在事件持久化后执行，失败确定性降级，UNKNOWN不自动重发。详细合同见Dota模块README及Core的subscription-events文档。

SDK DenseCollage是通用整数格资源文档，Core不识别Steam小时。模块先筛选、确定span与分页预算，再按有界批次补公共素材；逻辑顺序为tuple顺序，物理为大块优先稳定first-fit。旧WeightedCollage保持兼容。资源完整性快照在成图命中前复核授权、文件版本/过期，变更或未知证据重新hash；未命中同一源只全读一次。衍生物以源hash/尺寸/fit/渲染版本分区；权限撤销不能被快路径绕过。

页面复用Core公开UI、共享runtime与scope生命周期。普通草稿隔离；凭据立即清空、不持久化；CAS冲突重读，未知写入不重试，迟到响应必须重新检查当前scope。Core 管理运行中的 SDK。兼容更新可经 AstrBot 插件管理独立进行，Core 就绪后 DLC 会重新检查兼容性并接入。原生依赖或运行环境变更须按发布说明维护。回退前核对目标版本与现有数据库的兼容性，保留最新配置和数据。动态页面优先使用原生 WebCrypto；仅 API 缺失时使用随包 SHA-256 fallback，原生异常继续 fail closed，摘要、MIME、大小与声明检查保持。PR17 的 LAN HTTP 与 localhost 页面验收属于当时的历史版本。LAN 状态接口仍受原 localhost 单来源策略限制，不放宽授权或关闭校验。包内排除测试过程、私有证据、Key、运行缓存及项目记忆。离线、包、隔离Host、浏览器、线上API和真实IM分别验收，不互相替代。

长作业采用Core持久Jobs与新JOB scope。DLC只提供规范参数、选集和声明文档；Core保存owner/CAS/期限/分页引用、渲染并保护RAW/DERIVED/OUTPUT缓存。页面操作标识只进入幂等元数据；命令无可靠重试身份时省略该键，仍由Core按规范输入合并活跃任务。完成后新动作重新检查业务来源与内容缓存，不永久绑定旧任务。命令结果按需单图，不自动刷群；页面轮询退出不取消作业。

详细分析采用独立match_analysis v1完整有界投影与512节点内的compact FactDocument v2。原始比赛缓存沿用v1，提示模板单独升版。证据选取覆盖早中后期及重要优势变化，未提供的时间线、团战和视野保持未知。命令通过AnalysisRequest调用Host当前模型，显式55秒分析上限仍受Core剩余总期限约束；Tool只提供相同口径事实。不传历史、工具、私人会话或模块模型Key。缓存区分焦点、事实、模板、模型配置与权限，缺解析和模型失败均明确说明。
