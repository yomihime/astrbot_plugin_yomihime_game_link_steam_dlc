# 架构与配对合同

Core负责生命周期、权限、owner/epoch/CAS、存储、受控HTTP/秘密、资源、渲染与订阅投递。DLC只经canonical公开SDK提供游戏协议、归一化、时长规则及纯Evaluator/Composer，不导入Core私有代码或另开网络、数据库、发送通道。当前配对为Core0.1.11、DLC0.2.0-alpha.6、SDK0.1.0a22、ABI2.0、bridge1。

Steam统一管理USER身份关联；默认查询仅可信命令根使用，显式子能力保持结构化账号，即使origin来自COMMAND也不重新解析祖先命令。所有默认身份结果抑制model_facts。平台登录主体独立于目标玩家，不更改共享Steam绑定。

Core构建显式捕获完整DLC manifest及其摘要匹配的静态页。`external-page-projection.json`与`external-source-policies.json`均绑定同一原manifest；运行时当前active lease必须匹配，失配拒绝。受信来源策略还绑定精确module/source/host/credential alias/path/method，不由模块自授权。策略描述保存在产品中，实际Key/Token仅在Host加密配置存储内，经现有CAS原子更新。

授权协议是CS2纯数据descriptor，Core通用runner执行受控请求、有限轮询及一次凭据接收。会话绑定真实管理身份、页面lineage、runtime/epoch/revision；离页、取消、过期、owner失效阻止后到响应提交。普通HTTP拿不到授权专用响应或秘密。Web查询和图片预览使用WEB_PUBLIC真实权限，页面无可信聊天映射时不会伪造COMMAND或创建订阅。

公开页面能力的required_capabilities依赖仅在受信部署闭包中开放必要公共只读子调用，不额外发布可直接访问的Host路由。图片预览在同一当前public invocation中解析公共资源并返回PNG；不发送聊天消息，不写个人成图缓存。普通命令在最终发送前复核权限，成图准备完整后一次组合投递。

Dota复用Core PUBLIC CollectionKey共享采集与持久scheduler/outbox。订阅创建键绑定trusted owner、完整ConversationRef和规范目标；取消重建新generation。纯Evaluator每场独立事件，Core按完整目标路由和PUBLIC作用域合并、保持每成员fence和回执。可选模型在事件持久化后执行，失败确定性降级，UNKNOWN不自动重发。详细合同见Dota模块README及Core的subscription-events文档。

SDK DenseCollage是通用整数格资源文档，Core不识别Steam小时。模块先筛选、确定span与分页预算，再按有界批次补公共素材；逻辑顺序为tuple顺序，物理为大块优先稳定first-fit。旧WeightedCollage保持兼容。资源完整性快照在成图命中前复核授权、文件版本/过期，变更或未知证据重新hash；未命中同一源只全读一次。衍生物以源hash/尺寸/fit/渲染版本分区；权限撤销不能被快路径绕过。

页面复用Core公开UI、共享runtime与scope生命周期。普通草稿隔离；凭据立即清空、不持久化；CAS冲突重读，未知写入不重试，迟到响应必须重新检查当前scope。实际部署固定单一SDK身份；独立扩展安装许可与内容摘要分开，普通版本/页面更新不重建Core。SDK或已加载Python变化使用正常进程重启。包内排除测试过程、私有证据、Key、运行缓存及项目记忆。离线、包、隔离Host、浏览器、线上API和真实IM分别验收，不互相替代。

长作业采用Core持久Jobs与新JOB scope。DLC只提供规范参数、选集和声明文档；Core保存owner/CAS/期限/分页引用、渲染并保护RAW/DERIVED/OUTPUT缓存。命令结果按需单图，不自动刷群；页面轮询退出不取消作业。

详细分析采用独立match_analysis v1完整有界投影与512节点内的compact FactDocument。命令通过AnalysisRequest调用Host当前模型，Tool只提供相同口径事实；不传历史、工具、私人会话或模块模型Key。缓存区分焦点、事实、模板、模型配置与权限，缺解析和模型失败均明确说明。
