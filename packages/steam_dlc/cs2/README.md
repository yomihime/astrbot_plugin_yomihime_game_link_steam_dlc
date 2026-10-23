# CS2 / Leetify

当前版本的 `profile`、`recent`、`stats`、`last`、`match` 数据能力均为 **blocked**。
官方公开且已注册样本已通过零 Key 的 profile → recent → match 匿名验证，
但当前 AstrBot Host 会保存 Tool 结果日志、会话历史及 WebChat 图片附件。
Leetify 的[来源指南](https://leetify.com/blog/leetify-api-developer-guidelines/)要求不存储 API 数据；
因此产品在绑定 scope、读取默认绑定或发起 HTTP 之前返回明确阻塞。
本版本未完成 CS2 第一批数据功能的真实 Host 验收。

`provider.py` 是尚未接入生产 handler 的 canonical SDK 适配框架，
仅使用声明的 `leetify` HTTP source，不含独立网络客户端、Key、Cookie、重试或持久缓存。
每次 invocation 需创建独立实例；实例内复用响应，调用完成后丢弃。
测试仅使用人工合成数据，不得加入真实响应、标准化战绩或截图 fixture。
当前 SDK 隐去错误响应体，所以 403/404 无法进一步证明未注册、隐私或未收录，不能猜测细分原因。

数据合同明确为“Leetify已收录可见数据”，不代表全部官匹、完美或 5E。
SteamID64 始终为字符串，比赛 ID 为 Leetify UUID；焦点必须实际存在于该场名单。
Premier CS Rating、地图竞技段位、FACEIT level/ELO、Leetify 分析 rating 独立存放。
未知字段为 `None`，保留可用性元数据；不补零、不重算或重标分析指标单位。
stats 区分 Leetify profile 聚合指标与选定近期列表样本数。

未来启用必须先有按来源禁止日志、历史、附件和 provider 留存的可靠 Host 路径及验证。
不得通过关闭全局隐私门禁或把数据交给 Host 后再删本地副本规避此限制。
展示真实数据时还需原样使用官方 “Data Provided by Leetify” logo，链接至
[Leetify](https://leetify.com/)，并提供带明显链接样式的 “View on Leetify” 原始来源链接。
当前只显示来源状态说明，未分发数据卡片或 logo，尚未完成这项展示验收。
