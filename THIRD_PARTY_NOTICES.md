# 第三方来源与归属

本项目许可证见 LICENSE。canonical SDK是独立MIT合同包，不包含游戏适配器或其他项目的游戏实现。

| 项目 | 固定参考revision | 许可及采用方式 |
| --- | --- | --- |
| [CS2UID](https://github.com/Agnes4m/CS2UID) | ac46894dfb184bd27a81a9a5667aff49b8d0b226 | GPL-3.0；参考utils/api的接口路径、参数及二维码交互，DLC在公开SDK边界独立实现，无上游框架或SDK代码复制 |
| [astrbot-plugin-dota2matches](https://github.com/mml-hrb/astrbot-plugin-dota2matches) | 703a5dcf2d501a2a232fd44e4eaecf395ed293a6 | MIT，Copyright (c) 2026 马铭亮；参考watch/baseline/pending/合并/短评行为，使用现有Core状态机独立实现 |
| [playtime-panorama](https://github.com/obviyus/playtime-panorama) | 仅机制调研 | 调研时未见LICENSE；无源码复制，密排算法独立实现 |
| [astrbot_plugin_steamgame](https://github.com/bvzrays/astrbot_plugin_steamgame) | 仅机制调研 | LICENSE为AGPL-3.0，README标注不一致；无源码复制，未采用按库最大时长归一化规则 |

精确的参考路径、采用行为及本地实现见各模块README。Steam封面、头像、商店信息与游戏商标属于其各自权利人；它们在运行时按来源取得，玩家真实响应与附件不随安装包分发。Dota简中英雄名映射来自Valve官方公开英雄数据；未知ID按编号回退。

本轮采用协议及行为参考，不把公开仓库可见性当作任意复制授权。若未来直接复制上游实质代码或文本，必须保留其对应许可、版权与归属，并重新检查分发义务。
