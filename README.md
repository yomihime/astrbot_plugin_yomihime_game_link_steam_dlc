# 如月怜的游戏连结：Steam DLC

Steam DLC 是 AstrBot 游戏连结的独立 alpha 插件，包含 Steam 账号关联、Dota 2 查询，以及 CS2 和 Deadlock 的状态模块。候选兼容面为 Core 分支 `feat/steam-dlc-support`、canonical SDK `0.1.0a13`、模块 ABI `2.0`；DLC 分支为 `feat/steam-dlc-alpha`。这些分支尚未合并或发布，候选 ZIP 和验收记录以最终构建产物为准。

## 安装

1. 从 Core 候选构建取得 Core ZIP。它包含 canonical `yomihime_game_link_sdk`。
2. 在 AstrBot 插件管理中安装 Core ZIP，再安装本 DLC ZIP，并启用两者。
3. 首次装载后按需重启 AstrBot。Core/DLC 或 SDK 的 Python 代码更新需要重启；运行时不做任意 Python 热替换，模块会报告 `restart_required`。

插件注册设计允许两种加载顺序，但推荐先装 Core、再装 DLC。单独安装 DLC 不会带入第二份 SDK。候选包面向 AstrBot 4.29.1；正式 ZIP 生成后请核对包内 `BUILD.json` 的 SDK、ABI、提交和文件摘要。

## 命令

下列示例使用游戏连结命令入口 `/ygl`：

| 命令 | 用途 |
| --- | --- |
| `/ygl steam bind <SteamID64 或标准 profiles URL>` | 私聊中关联默认 Steam 账号 |
| `/ygl steam binding` | 私聊查看当前关联状态 |
| `/ygl steam unbind` | 私聊解除当前关联 |
| `/ygl dota2 recent [账号] [--limit N]` | 查询最近战绩；默认 5 场，最多 20 场 |
| `/ygl dota2 profile [账号]` | 查询精简玩家资料 |
| `/ygl dota2 match <match_id>` | 查询单场基础摘要 |
| `/ygl dota2 status` | 查看 Dota 2 能力状态 |
| `/ygl cs2 status` | 查看 CS2 模块状态 |
| `/ygl deadlock status` | 查看 Deadlock 模块状态 |

Steam 的 `bind`、`binding`、`unbind` 仅允许私聊。关联是用户主动声明（`self_asserted`），插件不验证账号所有权，也不提供 Steam 登录或 OpenID 验证。

Dota 2 `recent` 和 `profile` 省略账号时，会读取发起命令的当前用户默认关联；因此可在群聊中使用，但只查询发起者自己的关联。指定账号可用 Dota ID32 或 SteamID64。最近场次的 `--limit` 范围是 1–20。命令参数不接受任意 URL。模型工具 `steam_dlc_dota2_recent`、`steam_dlc_dota2_profile` 必须显式提供 `account`；`steam_dlc_dota2_match` 必须显式提供 `match_id`，工具不会代用户读取默认关联。

CS2 和 Deadlock 当前只有模块接入、生命周期、帮助和真实状态报告，没有游戏数据查询能力。

## 数据与隐私边界

- Steam 是唯一账号关联 owner。关联数据由 SDK USER records 保存；停用、重启或卸载 DLC 不触发自动删除。`unbind` 保留版本记录所需的 tombstone。
- Steam 身份依赖只向 Dota 2 模块提供私有 identity 文档。Dota 查询结果保持 PUBLIC，只呈现本次查询所需的 Dota 账号，不输出 SteamID、关联状态或绑定 revision，也不生成默认身份模型 facts。
- Dota 2 通过 SDK HTTP、配置和缓存接口访问固定 OpenDota 主机 `api.opendota.com`，仅使用固定 GET 查询路径，不提交 POST、不调用任意 URL。接口不可用、限流、超时或无记录时返回稳定错误；不自动重试。
- 时间戳按 UTC 处理；展示时区由 Dota 配置 `timezone` 控制，默认 `Asia/Shanghai`。
- Valve 官方简体中文英雄名称映射收录于源码 [hero_names.py](packages/steam_dlc/shared/hero_names.py)，共 127 条。来源为 [Dota 2 官方英雄数据接口](https://www.dota2.com/datafeed/herolist?language=schinese)，源响应 SHA-256 为 `c3d7e9ac5b145aa066857645dd89612f51643dd8b3354d2beccf41ddebb0f054`；未知 ID 使用显式编号回退。
- 本 alpha 沿用 Core 的通用管理 UI 合同，没有同步主项目 dots 的页面与视觉资源。

## 构建与验证

在已安装兼容 canonical SDK 的开发环境中，可运行：

```powershell
python -m unittest discover -s tests
ruff check packages/steam_dlc tests scripts
ruff format --check packages/steam_dlc tests scripts
python scripts/build_release.py
```

最终构建要求源码已提交且工作区干净；构建脚本会审计 ZIP 内容并输出构建收据。开发中的脏工作区仅供本地临时 harness 使用 `--allow-dirty`，不得作为最终安装包证据。

双插件离线 Host harness 需要 Core ZIP、DLC ZIP、AstrBot 4.29.1 源码和新的隔离工作目录：

```powershell
python scripts/smoke_two_plugins.py `
  --core-zip <core.zip> `
  --dlc-zip <steam-dlc.zip> `
  --host-source <astrbot-4.29.1-source> `
  --work-root <fresh-temp-dir> `
  --order core-first
```

另以新的工作目录和独立进程将 `--order` 设为 `dlc-first`，覆盖另一注册顺序。该 harness 使用真实 Host 插件管理与生命周期，但消息投递和 OpenDota HTTPS 响应为合成数据；它不证明真实 IM、浏览器 UI 或在线 OpenDota 验收。离线单测、包审计、Host harness、在线 API、真实 IM/UI 与发布是不同证据层，分别记录，不互相替代。

当前 README 与架构合同是候选使用说明，不表示 Core/DLC 已合并、Release 已发布或真实 Host/IM/API 验收已通过。执行入口见[验收计划](docs/plan.md)、[架构合同](docs/architecture.md)和[协作约定](docs/collaboration.md)。
