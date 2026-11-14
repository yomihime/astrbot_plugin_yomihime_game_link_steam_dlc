import { createApp as e, h as t, shallowRef as n } from "../../../../../../../runtime.js";
import * as r from "../../../../../../../runtime.js";
//#region packages/steam_dlc/pages/src/appearance.js
var i = {
	steam: ["#3478aa", "#72b8e8"],
	dota2: ["#b63d34", "#ed776c"],
	cs2: ["#b46b1d", "#f0af61"],
	deadlock: ["#76599d", "#b99bdd"]
};
function a(e) {
	if (!Object.hasOwn(i, e)) return;
	let [t, n] = i[e];
	return {
		light: { logo: t },
		dark: { logo: n }
	};
}
//#endregion
//#region packages/steam_dlc/pages/src/locales/steam/zh-CN.json
var o = {
	"availability.thisPageContextExpiredOpenThe": "页面已失效，请重新进入本模块。",
	"availability.thisPageIsAvailableCheckRuntime": "页面可以打开。模块运行状态请在模块管理中查看。本页不检测外部数据来源。",
	"availability.thisPageIsUnavailableRefreshIts": "此页面暂不可用。请在模块管理中刷新状态，再重新打开。",
	"cache.cacheStatusIsTemporarilyUnavailable": "缓存状态暂不可用。",
	"cache.cacheStatusRefreshedThisOnlyReads": "缓存状态已刷新。此操作只读取统计；普通刷新游戏库会继续复用有效原图。",
	"cache.couldNotReadCacheStatusTry": "读取缓存状态失败，请稍后重试。",
	"cache.summary": "缓存：{items} 项 / {bytes} 字节；上限 {maxItems} 项 / {maxBytes} 字节；已淘汰 {evictions} 项。",
	"choice.cropToFill": "等比裁切填充",
	"choice.followCore": "跟随核心",
	"choice.fullLibraryKeyRequired": "完整游戏库（需要 Key）",
	"choice.highDefinition": "高清",
	"choice.itemCountMode": "作品数量模式",
	"choice.legacyLayout": "兼容旧布局",
	"choice.longPlay": "长玩",
	"choice.publicProfileSample": "公开主页样本",
	"choice.recentPublicSample": "近期公开样本",
	"choice.showFullCover": "保留完整封面",
	"choice.singlePlayer": "单机",
	"choice.standard": "标准",
	"choice.topNByPlaytime": "按时长取前 N 项",
	"choice.unlimitedAsReturnedByTheSource": "不限（来源实际返回范围）",
	"configHint.poster_aspect": "默认使用 2:3 封面比例。选择更窄的比例时，可裁切铺满或保留完整封面并填充背景。",
	"configHint.poster_fit": "等比裁剪铺满，或保留全图并填背景。",
	"configHint.poster_include_apps": "生涯默认包括软件；只看游戏时汇总与筛选使用相同口径。",
	"configHint.poster_limit": "有限选集至少20项，可手填超过1000；不限使用独立模式。",
	"configHint.poster_limit_mode": "前N项或不限实际来源选集；1000仍为有限数量。",
	"configHint.poster_mode": "生涯密排或兼容旧海报；旧模式最多200项。",
	"configHint.poster_preset": "单机/标准/长玩时长锚点；倍率不依赖库内最大时长。",
	"configHint.poster_quality": "高清整体等比4/3放大；过预算需降低数量或分辨率。",
	"configHint.poster_source": "来源：games/recent为公开样本；full需要部署者Steam Key且遵守资料隐私。",
	"configHint.reply_theme": "图片主题",
	"credential.authorizationExpired": "管理授权或页面上下文已失效，请重新进入。",
	"credential.clearCredentials": "清除凭据",
	"credential.configConflict": "设置已被其他操作修改。凭据输入已清除，请刷新状态后重新操作。",
	"credential.configuredUpstreamValidityIsUnverified": "已配置；上游有效性尚未验证。",
	"credential.credentialsCleared": "凭据已清除。",
	"credential.decryptionFailed": "已配置，但当前无法解密，请检查服务密钥后重新设置。",
	"credential.enterAValidKeyOrToken": "请输入 1 到 4096 字符的有效 Key 或 Token。",
	"credential.mutationUnverified": "操作未完成或结果未确认。凭据输入已清除，请刷新并核对状态。",
	"credential.notConfigured": "未配置。",
	"credential.operationCancelled": "已取消操作。",
	"credential.refreshToCheckStatus": "状态待刷新。",
	"credential.saveCredentials": "保存凭据",
	"credential.savedUnverifiedUpstream": "凭据已保存；有效性会在来源请求时验证。",
	"credential.sourceCredentialsAreNeverKeptAs": "来源凭据不会作为普通草稿保留。",
	"credential.submitCredentialsOnlyThroughTrustedAdministration": "凭据只在可信管理入口提交。输入仅在当前页面保留；上游有效性在查询时验证。",
	"credential.theQrCodeExpiredSignIn": "二维码已过期，请重新登录。",
	"help.aboutGameHistoryCollages": "游戏生涯拼图说明",
	"help.cacheStatus": "缓存状态",
	"help.cacheStatusHasNotBeenRead": "尚未读取缓存状态。",
	"help.checkYourJobStatusOrResults": "查看本人任务状态、逐图结果、取消或重试。result支持 --page N --image N，每次只返回选中一张，不自动刷屏。",
	"help.commandHelp": "命令帮助",
	"help.createAGameHistoryCollageSaved": "生成游戏生涯拼图。来源、时间预设、比例与数量受已保存设置及输出预算约束；完整库需要可选 Key。",
	"help.linkYourSteamAccountInA": "在私聊中关联当前用户的 Steam 账号。",
	"help.publicProfileAndRecentActivityHave": "公开主页与近期记录各有其样本范围；完整游戏库需要可选 Steam Key，完整性以本次来源返回为准。默认纵向 2:3，可切换 9:16 或 1:2；作品数量和输出预算共同约束分页，兼容旧布局最多 200 项。包含全部应用会纳入软件，旧设置中的关闭值继续保留。",
	"help.refreshCacheStatus": "刷新缓存状态",
	"help.theCollageMapsPlaytimeToEach": "拼图按累计游玩时间分配封面面积，有单机、标准和长玩三种预设。大封面可跨行，封面保持纵向比例，也可选用旧布局。未知时长单独显示。",
	"help.theStoreDefaultsAreCnAnd": "商店默认 CN / schinese；展示本次地区、币种和来源时间对应的当前价格。",
	"help.unlinkYourAccountInADirect": "在私聊中解除当前用户关联。",
	"help.viewAPublicProfileWithSeparate": "查看公开资料；昵称、头像、等级逐项标明可用性。",
	"help.viewAPublicWishlistAnonymously20": "匿名查看公开愿望单，每页20项；模型与页面必须提供明确账号。",
	"help.viewStoreDetailsAndCurrentPrices": "查看商店详情与当前可用价格；图片失败时保留文字结果。",
	"help.viewTheAvailablePublicSampleFull": "查看来源可用的公开样本；完整游戏库增强需要可选 Steam Key。",
	"help.viewTheRecentPublicSampleShown": "查看主页最近展示的公开样本，范围以本次来源返回为准。",
	"help.viewUsageHelp": "查看使用说明。",
	"help.viewYourLinkedAccountInA": "在私聊中查看当前用户关联。",
	"job.account": "SteamID64 / Dota ID32（明确账号）",
	"job.accountRequired": "请提供明确账号。",
	"job.activeNextSteps": "可刷新状态或取消任务；排队或执行中不能重试。",
	"job.all_apps": "应用筛选",
	"job.apps.false": "仅游戏",
	"job.apps.true": "全部应用",
	"job.aspect": "比例",
	"job.authorityChanged": "页面授权或运行上下文已变化，请重新进入页面。",
	"job.authorityLost": "任务页面授权或运行上下文已失效，请重新进入页面。",
	"job.available": "页面已恢复，请手动恢复 / 刷新任务，或提交新任务。",
	"job.cancel": "取消任务",
	"job.coverage": "已检查{examined}项 · 未检查{unexamined}项 · 已检查中类型未知{unknown}项",
	"job.create": "创建拼图任务",
	"job.description": "不限覆盖来源实际返回范围。每批有资源预算，已完成页保留；关闭页面只停止轮询，取消需明确点击。",
	"job.disposed": "任务页面上下文已变化，请重新进入。",
	"job.download": "下载原始 PNG",
	"job.eligible": "符合",
	"job.eligibleConfirmed": "已确认符合",
	"job.fit": "封面适配",
	"job.imageAlt": "批次{batch} · 图片{image}",
	"job.incompleteSource": "来源覆盖不完整",
	"job.invalidImage": "图片资源无法验证。",
	"job.invalidResource": "任务资源无法验证。",
	"job.invalidResults": "任务结果范围无法验证。",
	"job.invalidStatus": "任务状态无法验证。",
	"job.jobId": "任务ID（刷新后自动恢复）",
	"job.legacyLimit": "兼容旧布局最多200项。",
	"job.legacyUnknown": "类型尚未验证{count}项（未区分未检查与已检查但类型未知）",
	"job.limit": "数量（至少20，可手填超过1000）",
	"job.limit_mode": "数量模式",
	"job.metadataFailures": "元数据请求失败{count}次",
	"job.metrics": "来源{source} · {eligibleLabel}{eligible} · 已选{selected} · 已生成{generated} · 待处理{pending} · 缺图{missing}",
	"job.mode": "布局",
	"job.next": "下一页结果",
	"job.noResults": "当前没有已完成结果页。",
	"job.notSubmitted": "尚未提交任务。",
	"job.operationFailed": "任务操作未完成，请刷新任务并核对。",
	"job.preset": "时长预设",
	"job.published": "已发布图片资源{count}项，可点击“{resultsLabel}”或使用 {command} 查看。",
	"job.quality": "清晰度",
	"job.reason.metadata_incomplete": "部分作品类型尚未验证，无法完成仅游戏筛选；未视为空库。",
	"job.reason.rate_limited": "来源限流，已停止后续批次；请等待来源恢复。",
	"job.reason.resource_budget": "资源预算不足，已停止后续批次；可减少数量或降低清晰度后重新提交。",
	"job.reason.steam_key_required": "完整库需要在可信管理页配置Steam Key，可改选公开样本。",
	"job.reason.steam_source_access_denied": "Steam来源拒绝访问，请检查可信管理页的Steam配置、来源授权与目标公开或访问范围；未视为空库。",
	"job.reason.steam_source_not_public": "Steam库未公开或当前来源授权受限，请核对公开设置与来源授权；未视为空库。",
	"job.reason.steam_source_unavailable": "Steam来源暂不可用，请核对来源状态；未用其他来源替代。",
	"job.recovery": "任务状态与恢复",
	"job.refresh": "恢复 / 刷新任务",
	"job.results": "查询结果页",
	"job.retry": "重新执行（复用有效缓存）",
	"job.retryNextSteps": "核对后可稍后手动重试。任务会从头开始，并复用有效缓存。",
	"job.retryWait": "来源建议等待{seconds}秒后再试（非自动重试或倒计时）。",
	"job.source": "来源",
	"job.state.cancelled": "已取消",
	"job.state.failed": "失败",
	"job.state.interrupted": "已中断",
	"job.state.queued": "排队中",
	"job.state.running": "执行中",
	"job.state.succeeded": "已完成",
	"job.statusSummary": "任务 {id} · {state}",
	"job.submit": "提交拼图任务",
	"job.submitted": "任务已提交，关闭页面只停止轮询。",
	"job.unavailable": "任务页面暂不可用，已停止轮询；任务ID保留供恢复后查询。",
	"job.unavailableService": "任务服务暂不可用，请刷新模块。",
	"job.unconfirmed": "待确认",
	"job.unknownFailure": "任务未完成，原因暂不可确认；请刷新状态并核对来源与设置。",
	"job.unlimited": "不限",
	"job.verifiedSelection": "选集排序已验证",
	"job.verifiedSelectionRemaining": "选集排序已验证，剩余未检查",
	"metric.unknown": "未知",
	"module.steam.source": "Steam 商店和社区提供公开样本。查询完整游戏库需要配置 Steam Key，结果范围以本次来源为准。游戏库未公开、缺少 Key 或请求失败时会分别说明。",
	"module.steam.summary": "商店搜索、游戏详情与公开账号资料。共享关联是用户自行声明的账号信息，所有权尚未验证。",
	"page.accountScope": "默认账号只在已授权的命令路径使用。自然语言工具必须提供明确账号或比赛编号。",
	"page.homeNavigation": "从模块导航选择查询或设置。",
	"page.moduleEyebrow": "{module} / 模块",
	"page.moduleMissing": "找不到此模块的页面。",
	"page.moduleRuntimeContextChangedOpenThe": "模块运行状态已变化，请重新打开页面。",
	"page.moduleUnavailable": "模块页面不可用",
	"page.pageAvailabilityChangedReviewTheRefreshed": "页面可用状态已变化，请核对刷新后的配置。",
	"page.saveVerification": "保存后会重新读取并核对结果；冲突或未确认结果需要手动刷新。",
	"page.settings.steam": "选择公开样本或完整库、布局、时长预设、比例和输出预算。完整库需要可选 Steam Key；是否完整以来源实际返回为准。",
	"page.settingsTitle": "{module} 设置",
	"page.sourceAccess": "来源授权",
	"page.thisPageIsNotDeclaredReturn": "此页面暂不可用。请返回模块列表重新进入。",
	"route.collage": "游戏生涯拼图",
	"route.home": "帮助与状态",
	"route.settings": "设置",
	"route.wishlist": "愿望单",
	"section.createCollage": "创建拼图任务",
	"section.dataAndAccounts": "数据与账号",
	"section.queryAndReply": "查询与回复",
	"section.settingsHelp": "设置说明",
	"section.sourceCredentials": "来源凭据与授权",
	"section.sourceScope": "数据来源与范围",
	"section.statusAndHelp": "状态与帮助",
	"setting.collageLayout": "拼图布局",
	"setting.coverFit": "封面适配",
	"setting.gameLibrarySource": "游戏库来源",
	"setting.includeAllAppsIncludingSoftware": "包含软件等全部应用",
	"setting.itemLimit": "作品数量上限",
	"setting.outputAspectRatio": "输出比例",
	"setting.outputQuality": "输出清晰度",
	"setting.playtimePreset": "时长预设",
	"setting.replyTheme": "回复主题",
	"settings.allApps": "全部应用",
	"settings.authorizationExpired": "管理授权或模块上下文已失效，请重新进入页面。",
	"settings.chooseAnAvailableOption": "请选择当前可用的选项。",
	"settings.configConflict": "配置已被其他操作修改。草稿已保留，请手动刷新、核对后再保存。",
	"settings.discardModuleChanges": "放弃本模块修改",
	"settings.draftTooLong": "输入超过草稿保留上限，请先修正再切页。",
	"settings.enterAValidIanaTimeZone": "请输入有效的 IANA 时区，例如 Asia/Shanghai。",
	"settings.enterAnIanaTimeZoneWithin": "请输入符合长度要求的 IANA 时区。",
	"settings.followCoreClearsTheModulesReply": "回复主题中的“跟随核心”清除模块覆盖值。恢复默认先形成草稿，保存后生效。",
	"settings.gamesOnly": "仅游戏",
	"settings.integerRange": "请输入 {minimum} 到 {maximum} 之间的整数。",
	"settings.invalidConfig": "配置未被接受。请检查字段，手动刷新并核对后再保存。",
	"settings.invalidCurrentValue": "当前配置无效，请修改或恢复默认后保存。",
	"settings.legacyLimit": "兼容旧布局最多支持 200 项，请调整数量或选择游戏生涯拼图。",
	"settings.moduleChangesDiscarded": "已放弃本模块修改。",
	"settings.off": "关闭",
	"settings.on": "开启",
	"settings.partialWriteUnverified": "部分或全部修改已提交，状态暂未核实。请手动刷新并核对，不要重复提交。",
	"settings.readWithUnconfirmedCredentials": "普通配置已读取；来源凭据状态未确认，请单独刷新凭据。",
	"settings.refreshSettings": "刷新配置",
	"settings.refreshed": "已刷新。",
	"settings.refreshedWithDraft": "已刷新；草稿已保留，请核对后保存。",
	"settings.restoreDefault": "恢复默认",
	"settings.saveChanges": "保存修改",
	"settings.saveUnverified": "保存结果尚未确认。草稿已保留，请手动刷新并核对，不要重复提交。",
	"settings.saved": "已保存。",
	"settings.savedWithNewerDraft": "已保存本次提交；仍有新的未保存修改。",
	"settings.savedWithUnconfirmedCredentials": "普通配置已保存并核对；来源凭据状态未确认，请单独刷新凭据。",
	"settings.savingPleaseWaitForConfirmation": "正在保存…",
	"settings.settingsCouldNotBeReadCheck": "配置读取未完成。请检查 Dashboard 授权与模块状态，再手动刷新。",
	"settings.unlimited": "不限",
	"settings.unlimitedModeUnavailable": "当前配置尚未提供不限模式，请刷新模块版本。",
	"settings.youHaveUnsavedChanges": "有未保存的修改。",
	"status.couldNotReadSourceStatusRefresh": "来源状态读取失败，请稍后刷新。",
	"status.refreshSourceStatus": "刷新来源状态",
	"status.searchResults": "查询结果",
	"status.sourceStatus": "来源状态",
	"validation.enterACompleteFiniteNumber": "数量必须是完整有限数值。",
	"validation.enterACompleteFiniteNumberWithout": "数量必须是完整有限数值，不能包含其他文字。",
	"validation.theCountExceedsTheSafeRange": "数量超过安全数值范围，请选择不限。",
	"validation.theCountMustBeAtLeast": "数量向零截断后至少为20。",
	"validation.theImageCouldNotBeVerified": "图片内容无法验证。",
	"wishlist.account": "SteamID64 / Dota ID32（明确账号）",
	"wishlist.accountRequired": "请提供明确账号。",
	"wishlist.description": "匿名读取第一方公开愿望单，每页20项，仅补全当前页商店资料。私有、空单、限流与请求失败分别报告。",
	"wishlist.empty": "来源返回的本次公开愿望单为空。",
	"wishlist.enrichmentFailed": "愿望单已读取；当前页商店补全失败，未将缺失价格视为免费。",
	"wishlist.error.module_unavailable": "愿望单服务或本次授权暂不可用。",
	"wishlist.error.not_public": "愿望单未公开或来源受限，请确认公开设置后重试。",
	"wishlist.error.parameter_error": "请检查账号、地区、语言或页码。",
	"wishlist.error.rate_limited": "愿望单来源限流，请稍后重试。",
	"wishlist.error.unparsed": "愿望单来源结构无法验证，请稍后重试。",
	"wishlist.error.upstream_error": "愿望单来源请求失败，请稍后重试。",
	"wishlist.filters": "查询条件",
	"wishlist.itemDetails": "添加：{addedAt} · {price} · 币种{currency} · 折扣{discount} · {release}",
	"wishlist.itemTitle": "{name} · AppID {appId}",
	"wishlist.language": "Steam语言",
	"wishlist.nameUnavailable": "名称未提供",
	"wishlist.next": "下一页",
	"wishlist.notFetched": "未取得",
	"wishlist.notProvided": "未提供",
	"wishlist.previous": "上一页",
	"wishlist.price.fetch_failed": "商店补全失败",
	"wishlist.price.free": "免费",
	"wishlist.price.no_local_price": "本地区未提供价格",
	"wishlist.price.region_locked": "来源明确标记地区受限",
	"wishlist.price.region_or_store_unavailable": "商店或地区不可用",
	"wishlist.price.unknown": "价格未知",
	"wishlist.price.unreleased": "未发售",
	"wishlist.query": "读取愿望单",
	"wishlist.queryFailed": "愿望单查询未完成。",
	"wishlist.region": "地区",
	"wishlist.release.released": "已发售",
	"wishlist.release.unknown": "发售状态未知",
	"wishlist.release.unreleased": "未发售",
	"wishlist.requestFailed": "愿望单请求未完成，请稍后重试。",
	"wishlist.results": "愿望单结果",
	"wishlist.sourceUnavailable": "愿望单来源暂不可用，请稍后重试。",
	"wishlist.summary": "共{total}项 · 第{page}/{pages}页 · 地区{region} · 愿望单来源时间{fetchedAt} · 商店补全时间{storeFetchedAt}",
	"wishlist.unknown": "未知",
	"workspace.wishlist": "公开愿望单"
}, s = {
	"availability.thisPageContextExpiredOpenThe": "頁面上下文已失效，請重新進入本模組。",
	"availability.thisPageIsAvailableCheckRuntime": "目前頁面入口可用。請前往模組管理頁面查看執行狀態。這裡不會檢查上游服務。",
	"availability.thisPageIsUnavailableRefreshIts": "目前頁面入口不可用，請在模組管理頁面重新整理狀態後重新進入。",
	"cache.cacheStatusIsTemporarilyUnavailable": "快取狀態暫不可用。",
	"cache.cacheStatusRefreshedThisOnlyReads": "快取狀態已重新整理。此操作只讀取統計；普通重新整理遊戲庫會繼續重複使用有效原圖。",
	"cache.couldNotReadCacheStatusTry": "讀取快取狀態失敗，請稍後重試。",
	"cache.summary": "快取：{items} 項 / {bytes} 位元組；上限 {maxItems} 項 / {maxBytes} 位元組；已淘汰 {evictions} 項。",
	"choice.cropToFill": "等比裁切填充",
	"choice.followCore": "跟隨核心",
	"choice.fullLibraryKeyRequired": "完整遊戲庫（需要 Key）",
	"choice.highDefinition": "高清",
	"choice.itemCountMode": "作品數量模式",
	"choice.legacyLayout": "相容舊版面",
	"choice.longPlay": "長玩",
	"choice.publicProfileSample": "公開首頁樣本",
	"choice.recentPublicSample": "近期公開樣本",
	"choice.showFullCover": "保留完整封面",
	"choice.singlePlayer": "單機",
	"choice.standard": "標準",
	"choice.topNByPlaytime": "按時長取前 N 項",
	"choice.unlimitedAsReturnedByTheSource": "不限（來源實際回傳範圍）",
	"configHint.poster_aspect": "預設原生2:3；窄比例cover會等比裁剪，contain會填背景。",
	"configHint.poster_fit": "等比裁剪鋪滿，或保留全圖並填背景。",
	"configHint.poster_include_apps": "生涯預設包括軟體；只看遊戲時彙總與篩選使用相同計算方式。",
	"configHint.poster_limit": "有限選集至少20項，可手填超過1000；不限使用獨立模式。",
	"configHint.poster_limit_mode": "前N項或不限實際來源選集；1000仍為有限數量。",
	"configHint.poster_mode": "生涯密排或相容舊海報；舊模式最多200項。",
	"configHint.poster_preset": "單機/標準/長玩時長錨點；倍率不依賴庫內最大時長。",
	"configHint.poster_quality": "高清整體等比4/3放大；過預算需降低數量或解析度。",
	"configHint.poster_source": "來源：games/recent為公開樣本；full需要部署者Steam Key且遵守資料隱私。",
	"configHint.reply_theme": "圖片主題",
	"credential.authorizationExpired": "管理授權或頁面上下文已失效，請重新進入。",
	"credential.clearCredentials": "清除憑證",
	"credential.configConflict": "設定已被其他操作修改。憑證輸入已清除，請重新整理狀態後重新操作。",
	"credential.configuredUpstreamValidityIsUnverified": "已設定；上游有效性尚未驗證。",
	"credential.credentialsCleared": "憑證已清除。",
	"credential.decryptionFailed": "已設定，但目前無法解密，請檢查服務金鑰後重新設定。",
	"credential.enterAValidKeyOrToken": "請輸入 1 到 4096 字符的有效 Key 或 Token。",
	"credential.mutationUnverified": "操作未完成或結果未確認。憑證輸入已清除，請重新整理並核對狀態。",
	"credential.notConfigured": "未設定。",
	"credential.operationCancelled": "已取消操作。",
	"credential.refreshToCheckStatus": "狀態待重新整理。",
	"credential.saveCredentials": "儲存憑證",
	"credential.savedUnverifiedUpstream": "憑證已儲存；有效性會在來源請求時驗證。",
	"credential.sourceCredentialsAreNeverKeptAs": "來源憑證不會作為普通草稿保留。",
	"credential.submitCredentialsOnlyThroughTrustedAdministration": "憑證只在可信管理入口送出。輸入僅在目前頁面保留；上游有效性在查詢時驗證。",
	"credential.theQrCodeExpiredSignIn": "二維碼已過期，請重新登入。",
	"help.aboutGameHistoryCollages": "遊戲生涯拼圖說明",
	"help.cacheStatus": "快取狀態",
	"help.cacheStatusHasNotBeenRead": "尚未讀取快取狀態。",
	"help.checkYourJobStatusOrResults": "查看本人任務狀態、逐圖結果、取消或重試。result支援 --page N --image N，每次只回傳選中一張，不自動洗版。",
	"help.commandHelp": "指令幫助",
	"help.createAGameHistoryCollageSaved": "生成遊戲生涯拼圖。來源、時間預設、比例與數量受已儲存設定及輸出預算約束；完整庫需要可選 Key。",
	"help.linkYourSteamAccountInA": "在私訊中關聯目前用戶的 Steam 帳號。",
	"help.publicProfileAndRecentActivityHave": "公開首頁與近期記錄各有其樣本範圍；完整遊戲庫需要可選 Steam Key，完整性以本次來源回傳為準。預設縱向 2:3，可切換 9:16 或 1:2；作品數量和輸出預算共同約束分頁，相容舊版面最多 200 項。包含全部應用程式會納入軟體，舊設定中的關閉值繼續保留。",
	"help.refreshCacheStatus": "重新整理快取狀態",
	"help.theCollageMapsPlaytimeToEach": "遊戲生涯拼圖用累計小時映射每張作品的目標面積，提供單機、標準和長玩預設。大圖跨行、小圖填空，封面保持縱向比例；舊版面可以顯式選擇。未知時長不補零。",
	"help.theStoreDefaultsAreCnAnd": "商店預設 CN / schinese；展示本次地區、幣種和來源時間對應的目前價格。",
	"help.unlinkYourAccountInADirect": "在私訊中解除目前用戶關聯。",
	"help.viewAPublicProfileWithSeparate": "查看公開資料；昵稱、頭像、等級逐項標明可用性。",
	"help.viewAPublicWishlistAnonymously20": "匿名查看公開愿望單，每頁20項；模型與頁面必須提供明確帳號。",
	"help.viewStoreDetailsAndCurrentPrices": "查看商店詳細資料與目前可用價格；圖片失敗時保留文字結果。",
	"help.viewTheAvailablePublicSampleFull": "查看來源可用的公開樣本；完整遊戲庫增強需要可選 Steam Key。",
	"help.viewTheRecentPublicSampleShown": "查看首頁最近展示的公開樣本，範圍以本次來源回傳為準。",
	"help.viewUsageHelp": "查看使用說明。",
	"help.viewYourLinkedAccountInA": "在私訊中查看目前用戶關聯。",
	"job.account": "SteamID64 / Dota ID32（指定帳號）",
	"job.accountRequired": "請提供指定帳號。",
	"job.activeNextSteps": "可重新整理狀態或取消任務。排隊或執行期間無法重試。",
	"job.all_apps": "應用程式篩選",
	"job.apps.false": "僅遊戲",
	"job.apps.true": "所有應用程式",
	"job.aspect": "比例",
	"job.authorityChanged": "頁面授權或執行環境已變更，請重新開啟頁面。",
	"job.authorityLost": "任務頁面的授權或執行環境已失效，請重新開啟頁面。",
	"job.available": "頁面已恢復，請手動恢復或重新整理任務，也可提交新任務。",
	"job.cancel": "取消任務",
	"job.coverage": "已檢查 {examined} 項 · 未檢查 {unexamined} 項 · 已檢查但類型未知 {unknown} 項",
	"job.create": "建立拼圖任務",
	"job.description": "不限模式以來源實際回傳的範圍為準。每批有資源上限，已完成頁面會保留。關閉頁面只會停止輪詢，如要取消請點選取消任務。",
	"job.disposed": "任務頁面的執行環境已變更，請重新開啟頁面。",
	"job.download": "下載原始 PNG",
	"job.eligible": "符合",
	"job.eligibleConfirmed": "已確認符合",
	"job.fit": "封面縮放",
	"job.imageAlt": "第 {batch} 批 · 圖片 {image}",
	"job.incompleteSource": "來源涵蓋範圍不完整",
	"job.invalidImage": "無法驗證圖片資源。",
	"job.invalidResource": "無法驗證任務資源。",
	"job.invalidResults": "無法驗證任務結果範圍。",
	"job.invalidStatus": "無法驗證任務狀態。",
	"job.jobId": "任務 ID（重新整理後自動恢復）",
	"job.legacyLimit": "舊版相容版面最多支援 200 項。",
	"job.legacyUnknown": "尚有 {count} 項類型未驗證（未區分未檢查與已檢查但類型未知）",
	"job.limit": "數量（至少 20，可手動輸入超過 1000）",
	"job.limit_mode": "數量模式",
	"job.metadataFailures": "中繼資料請求失敗 {count} 次",
	"job.metrics": "來源 {source} · {eligibleLabel} {eligible} · 已選 {selected} · 已產生 {generated} · 待處理 {pending} · 缺圖 {missing}",
	"job.mode": "版面配置",
	"job.next": "下一頁結果",
	"job.noResults": "目前沒有已完成的結果頁。",
	"job.notSubmitted": "尚未提交任務。",
	"job.operationFailed": "任務操作未完成，請重新整理並確認任務狀態。",
	"job.preset": "時長預設",
	"job.published": "已發布 {count} 項圖片，可點選「{resultsLabel}」或使用 {command} 查看。",
	"job.quality": "畫質",
	"job.reason.metadata_incomplete": "部分作品類型尚未驗證，無法完成僅遊戲的篩選。本次未視為空收藏庫。",
	"job.reason.rate_limited": "來源已達速率限制，後續批次已停止。請等待來源恢復。",
	"job.reason.resource_budget": "資源不足，後續批次已停止。可減少數量或降低畫質後重新提交。",
	"job.reason.steam_key_required": "完整收藏庫需要在可信任的管理頁設定 Steam Key，也可改選公開樣本。",
	"job.reason.steam_source_access_denied": "Steam 來源拒絕存取，請檢查可信任管理頁的 Steam 設定、來源授權與目標的公開或存取範圍。本次未視為空收藏庫。",
	"job.reason.steam_source_not_public": "Steam 收藏庫未公開或目前來源授權受限，請檢查公開設定與來源授權。本次未視為空收藏庫。",
	"job.reason.steam_source_unavailable": "Steam 來源暫時無法使用，請確認來源狀態。本次未改用其他來源。",
	"job.recovery": "任務狀態與恢復",
	"job.refresh": "恢復／重新整理任務",
	"job.results": "查詢結果頁",
	"job.retry": "重新執行（沿用有效快取）",
	"job.retryNextSteps": "確認條件後可稍後手動重新執行，並沿用有效快取。任務不會自動從上次中斷處繼續。",
	"job.retryWait": "來源建議等待 {seconds} 秒後再試（不會自動重試或倒數）。",
	"job.source": "來源",
	"job.state.cancelled": "已取消",
	"job.state.failed": "失敗",
	"job.state.interrupted": "已中斷",
	"job.state.queued": "排隊中",
	"job.state.running": "執行中",
	"job.state.succeeded": "已完成",
	"job.statusSummary": "任務 {id} · {state}",
	"job.submit": "提交拼圖任務",
	"job.submitted": "任務已提交。關閉頁面只會停止輪詢。",
	"job.unavailable": "任務頁面暫時無法使用，已停止輪詢。任務 ID 已保留，可在恢復後查詢。",
	"job.unavailableService": "任務服務暫時無法使用，請重新整理模組。",
	"job.unconfirmed": "待確認",
	"job.unknownFailure": "任務未完成，暫時無法確認原因。請重新整理狀態並檢查來源與設定。",
	"job.unlimited": "不限",
	"job.verifiedSelection": "選取項目的排序已驗證",
	"job.verifiedSelectionRemaining": "選取項目的排序已驗證，其餘尚未檢查",
	"metric.unknown": "未知",
	"module.steam.source": "Steam 商店和 Community 提供公開樣本；完整庫 full 使用可選 Steam Key。是否完整以本次來源回傳為準，私人遊戲庫、缺少 Key 與上游失敗會分別說明。",
	"module.steam.summary": "商店搜索、遊戲詳細資料與公開帳號資料。共享關聯是用戶自行聲明的帳號資訊，所有權尚未驗證。",
	"page.accountScope": "預設帳號只在已授權的指令流程使用。自然語言工具必須提供明確帳號或比賽編號。",
	"page.homeNavigation": "請從模組導覽選擇查詢，或前往功能設定調整選項。",
	"page.moduleEyebrow": "{module} / 模組",
	"page.moduleMissing": "目前頁面沒有可用的模組宣告。",
	"page.moduleRuntimeContextChangedOpenThe": "模組執行上下文已變化，請重新進入頁面。",
	"page.moduleUnavailable": "模組頁面無法使用",
	"page.pageAvailabilityChangedReviewTheRefreshed": "頁面可用狀態已變化，請核對重新整理後的設定。",
	"page.saveVerification": "儲存後會重新讀取並核對結果。如有衝突或結果未確認，請手動重新整理。",
	"page.settings.steam": "選擇公開樣本或完整遊戲庫、版面、遊玩時數預設、比例及輸出預算。完整遊戲庫需要選用的 Steam Key，是否完整取決於來源實際回傳的資料。",
	"page.settingsTitle": "{module} 功能設定",
	"page.sourceAccess": "來源授權",
	"page.thisPageIsNotDeclaredReturn": "該頁面入口未聲明，請回傳模組列表重新進入。",
	"route.collage": "遊戲生涯拼圖",
	"route.home": "說明與狀態",
	"route.settings": "設定",
	"route.wishlist": "願望清單",
	"section.createCollage": "建立拼圖任務",
	"section.dataAndAccounts": "資料與帳號",
	"section.queryAndReply": "查詢與回覆",
	"section.settingsHelp": "設定說明",
	"section.sourceCredentials": "來源憑證與授權",
	"section.sourceScope": "資料來源與範圍",
	"section.statusAndHelp": "狀態與說明",
	"setting.collageLayout": "拼圖版面",
	"setting.coverFit": "封面適配",
	"setting.gameLibrarySource": "遊戲庫來源",
	"setting.includeAllAppsIncludingSoftware": "包含軟體等全部應用程式",
	"setting.itemLimit": "作品數量上限",
	"setting.outputAspectRatio": "輸出比例",
	"setting.outputQuality": "輸出清晰度",
	"setting.playtimePreset": "時長預設",
	"setting.replyTheme": "回覆主題",
	"settings.allApps": "全部應用程式",
	"settings.authorizationExpired": "管理授權或模組上下文已失效，請重新進入頁面。",
	"settings.chooseAnAvailableOption": "請選擇目前可用的選項。",
	"settings.configConflict": "設定已被其他操作修改。草稿已保留，請手動重新整理、核對後再儲存。",
	"settings.discardModuleChanges": "放棄本模組修改",
	"settings.draftTooLong": "輸入超過草稿保留上限，請先修正再切頁。",
	"settings.enterAValidIanaTimeZone": "請輸入有效的 IANA 時區，例如 Asia/Shanghai。",
	"settings.enterAnIanaTimeZoneWithin": "請輸入符合長度要求的 IANA 時區。",
	"settings.followCoreClearsTheModulesReply": "回覆主題中的“跟隨核心”清除模組覆蓋值。還原預設先形成草稿，儲存後生效。",
	"settings.gamesOnly": "僅遊戲",
	"settings.integerRange": "請輸入 {minimum} 到 {maximum} 之間的整數。",
	"settings.invalidConfig": "設定未被接受。請檢查欄位，手動重新整理並核對後再儲存。",
	"settings.invalidCurrentValue": "目前設定無效，請修改或還原預設後儲存。",
	"settings.legacyLimit": "相容舊版面最多支援 200 項，請調整數量或選擇遊戲生涯拼圖。",
	"settings.moduleChangesDiscarded": "已放棄本模組修改。",
	"settings.off": "關閉",
	"settings.on": "開啟",
	"settings.partialWriteUnverified": "部分或全部修改已送出，狀態暫未核實。請手動重新整理並核對，不要重複送出。",
	"settings.readWithUnconfirmedCredentials": "普通設定已讀取；來源憑證狀態未確認，請單獨重新整理憑證。",
	"settings.refreshSettings": "重新整理設定",
	"settings.refreshed": "已重新整理。",
	"settings.refreshedWithDraft": "已重新整理；草稿已保留，請核對後儲存。",
	"settings.restoreDefault": "還原預設",
	"settings.saveChanges": "儲存修改",
	"settings.saveUnverified": "儲存結果尚未確認。草稿已保留，請手動重新整理並核對，不要重複送出。",
	"settings.saved": "已儲存。",
	"settings.savedWithNewerDraft": "已儲存本次送出；仍有新的未儲存修改。",
	"settings.savedWithUnconfirmedCredentials": "普通設定已儲存並核對；來源憑證狀態未確認，請單獨重新整理憑證。",
	"settings.savingPleaseWaitForConfirmation": "正在儲存，請等待確認。",
	"settings.settingsCouldNotBeReadCheck": "設定讀取未完成。請檢查 Dashboard 授權與模組狀態，再手動重新整理。",
	"settings.unlimited": "不限",
	"settings.unlimitedModeUnavailable": "目前設定尚未提供不限模式，請重新整理模組版本。",
	"settings.youHaveUnsavedChanges": "有未儲存的修改。",
	"status.couldNotReadSourceStatusRefresh": "來源狀態讀取失敗，請稍後重新整理。",
	"status.refreshSourceStatus": "重新整理來源狀態",
	"status.searchResults": "查詢結果",
	"status.sourceStatus": "來源狀態",
	"validation.enterACompleteFiniteNumber": "數量必須是完整有限數值。",
	"validation.enterACompleteFiniteNumberWithout": "數量必須是完整有限數值，不能包含其他文字。",
	"validation.theCountExceedsTheSafeRange": "數量超過安全數值範圍，請選擇不限。",
	"validation.theCountMustBeAtLeast": "數量捨去小數部分後至少為 20。",
	"validation.theImageCouldNotBeVerified": "圖片內容無法驗證。",
	"wishlist.account": "SteamID64 / Dota ID32（指定帳號）",
	"wishlist.accountRequired": "請提供指定帳號。",
	"wishlist.description": "匿名讀取第一方公開願望清單，每頁 20 項，只補充目前頁面的商店資料。未公開、清單為空、速率限制及請求失敗會分別顯示。",
	"wishlist.empty": "來源本次回傳的公開願望清單是空的。",
	"wishlist.enrichmentFailed": "願望清單已讀取；此頁未能取得商店資料，缺少價格的項目未視為免費。",
	"wishlist.error.module_unavailable": "願望清單服務或本次授權暫時無法使用。",
	"wishlist.error.not_public": "願望清單未公開或來源受限，請確認公開設定後重試。",
	"wishlist.error.parameter_error": "請檢查帳號、地區、語言或頁碼。",
	"wishlist.error.rate_limited": "願望清單來源已達速率限制，請稍後重試。",
	"wishlist.error.unparsed": "無法驗證願望清單的來源格式，請稍後重試。",
	"wishlist.error.upstream_error": "願望清單來源請求失敗，請稍後重試。",
	"wishlist.filters": "查詢條件",
	"wishlist.itemDetails": "加入時間 {addedAt} · {price} · 幣別 {currency} · 折扣 {discount} · {release}",
	"wishlist.itemTitle": "{name} · AppID {appId}",
	"wishlist.language": "Steam 語言",
	"wishlist.nameUnavailable": "未提供名稱",
	"wishlist.next": "下一頁",
	"wishlist.notFetched": "未取得",
	"wishlist.notProvided": "未提供",
	"wishlist.previous": "上一頁",
	"wishlist.price.fetch_failed": "無法取得商店資料",
	"wishlist.price.free": "免費",
	"wishlist.price.no_local_price": "此地區未提供價格",
	"wishlist.price.region_locked": "來源明確標示地區受限",
	"wishlist.price.region_or_store_unavailable": "商店或地區無法使用",
	"wishlist.price.unknown": "價格未知",
	"wishlist.price.unreleased": "尚未發售",
	"wishlist.query": "讀取願望清單",
	"wishlist.queryFailed": "願望清單查詢未完成。",
	"wishlist.region": "地區",
	"wishlist.release.released": "已發售",
	"wishlist.release.unknown": "發售狀態未知",
	"wishlist.release.unreleased": "尚未發售",
	"wishlist.requestFailed": "願望清單請求未完成，請稍後重試。",
	"wishlist.results": "願望清單結果",
	"wishlist.sourceUnavailable": "願望清單來源暫時無法使用，請稍後重試。",
	"wishlist.summary": "共 {total} 項 · 第 {page}/{pages} 頁 · 地區 {region} · 願望清單取得時間 {fetchedAt} · 商店資料取得時間 {storeFetchedAt}",
	"wishlist.unknown": "未知",
	"workspace.wishlist": "公開願望清單"
}, c = {
	"availability.thisPageContextExpiredOpenThe": "ページのコンテキストが無効になりました。モジュールを開き直してください。",
	"availability.thisPageIsAvailableCheckRuntime": "このページは利用できます。実行状態はモジュール管理で確認してください。このページでは接続先サービスの状態を確認しません。",
	"availability.thisPageIsUnavailableRefreshIts": "このページは利用できません。モジュール管理で状態を更新してから開き直してください。",
	"cache.cacheStatusIsTemporarilyUnavailable": "キャッシュの状態を取得できません。",
	"cache.cacheStatusRefreshedThisOnlyReads": "キャッシュの状態を更新しました。この操作は統計を読むだけです。通常のライブラリ更新では有効な元画像を引き続き再利用します。",
	"cache.couldNotReadCacheStatusTry": "キャッシュの状態を読み込めませんでした。しばらくしてからもう一度お試しください。",
	"cache.summary": "キャッシュ：{items} 件 / {bytes} バイト。上限：{maxItems} 件 / {maxBytes} バイト。削除済み：{evictions} 件。",
	"choice.cropToFill": "比率を保って切り抜く",
	"choice.followCore": "Core に従う",
	"choice.fullLibraryKeyRequired": "全ライブラリ（キーが必要）",
	"choice.highDefinition": "高画質",
	"choice.itemCountMode": "作品数の指定方法",
	"choice.legacyLayout": "旧レイアウト",
	"choice.longPlay": "長時間プレイ",
	"choice.publicProfileSample": "公開プロフィールのサンプル",
	"choice.recentPublicSample": "直近の公開サンプル",
	"choice.showFullCover": "カバー画像全体を表示",
	"choice.singlePlayer": "シングルプレイ",
	"choice.standard": "標準",
	"choice.topNByPlaytime": "プレイ時間の上位 N 件",
	"choice.unlimitedAsReturnedByTheSource": "上限なし（ソースの取得範囲内）",
	"configHint.poster_aspect": "既定の比率は 2:3 です。より細い比率では cover が縦横比を保って切り抜き、contain が背景の余白を埋めます。",
	"configHint.poster_fit": "縦横比を保って切り抜くか、背景を埋めてカバー画像全体を表示します。",
	"configHint.poster_include_apps": "コラージュには既定でソフトウェアも含まれます。「ゲームのみ」では集計と絞り込みに同じ範囲を使います。",
	"configHint.poster_limit": "件数を指定する場合は 20 件以上にしてください。1000 件を超える数値も手入力できます。件数を制限しない場合は「上限なし」を選びます。",
	"configHint.poster_limit_mode": "上位 N 件か、ソースで取得できるすべての項目を選びます。1000 件は上限付きです。",
	"configHint.poster_mode": "密に配置するコラージュか旧ポスターを選べます。旧レイアウトの上限は 200 件です。",
	"configHint.poster_preset": "シングルプレイ、標準、長時間プレイの基準時間です。倍率はライブラリ内の最長プレイ時間に依存しません。",
	"configHint.poster_quality": "高画質では全体を 4/3 倍に拡大します。出力上限を超える場合は件数や解像度を下げてください。",
	"configHint.poster_source": "games と recent は公開サンプルです。full には管理者の Steam キーが必要で、ライブラリの公開設定に従います。",
	"configHint.reply_theme": "画像テーマ",
	"credential.authorizationExpired": "管理認可またはページのコンテキストが無効になりました。ページを開き直してください。",
	"credential.clearCredentials": "認証情報を消去",
	"credential.configConflict": "別の操作で設定が変更されました。認証情報の入力は消去されました。状態を更新してからやり直してください。",
	"credential.configuredUpstreamValidityIsUnverified": "設定済みです。接続先での有効性は未確認です。",
	"credential.credentialsCleared": "認証情報を消去しました。",
	"credential.decryptionFailed": "設定済みですが復号できません。サービスのキーを確認してから設定し直してください。",
	"credential.enterAValidKeyOrToken": "1〜4096 文字の有効なキーまたはトークンを入力してください。",
	"credential.mutationUnverified": "操作が完了していないか、結果が未確認です。認証情報の入力は消去されました。更新して状態を確認してください。",
	"credential.notConfigured": "未設定です。",
	"credential.operationCancelled": "操作をキャンセルしました。",
	"credential.refreshToCheckStatus": "更新して状態を確認してください。",
	"credential.saveCredentials": "認証情報を保存",
	"credential.savedUnverifiedUpstream": "認証情報を保存しました。有効性はソースへのリクエスト時に確認します。",
	"credential.sourceCredentialsAreNeverKeptAs": "ソースの認証情報は通常の下書きに保存されません。",
	"credential.submitCredentialsOnlyThroughTrustedAdministration": "認証情報は信頼済みの管理画面でのみ送信してください。入力は現在のページだけに保持されます。接続先での有効性は検索時に確認します。",
	"credential.theQrCodeExpiredSignIn": "QR コードの期限が切れました。ログインし直してください。",
	"help.aboutGameHistoryCollages": "ゲーム履歴コラージュについて",
	"help.cacheStatus": "キャッシュの状態",
	"help.cacheStatusHasNotBeenRead": "キャッシュの状態はまだ読み込まれていません。",
	"help.checkYourJobStatusOrResults": "自分のジョブの状態や結果を確認し、キャンセルや再試行を行います。result は --page N --image N に対応し、選んだ画像を 1 枚ずつ返します。",
	"help.commandHelp": "コマンドヘルプ",
	"help.createAGameHistoryCollageSaved": "ゲーム履歴コラージュを作成します。ソース、プレイ時間のプリセット、比率、件数は保存済み設定と出力上限に従います。全ライブラリには任意のキーが必要です。",
	"help.linkYourSteamAccountInA": "個別チャットで自分の Steam アカウントを連携します。",
	"help.publicProfileAndRecentActivityHave": "公開プロフィールと最近の活動では取得範囲が異なります。全ライブラリには任意の Steam キーが必要で、完全性はソースの応答によります。既定は縦長の 2:3 で、9:16 と 1:2 に切り替えられます。ページ数は作品数と出力上限に従い、旧レイアウトは最大 200 件です。「全アプリ」にはソフトウェアも含まれます。既存のオフ設定は維持されます。",
	"help.refreshCacheStatus": "キャッシュの状態を更新",
	"help.theCollageMapsPlaytimeToEach": "コラージュは累計プレイ時間から作品ごとの表示面積を決めます。シングルプレイ、標準、長時間プレイから選べます。大きな画像は複数行にまたがり、小さな画像が空きを埋め、カバーの縦長比率を保ちます。旧レイアウトも選べます。不明なプレイ時間は 0 にしません。",
	"help.theStoreDefaultsAreCnAnd": "ストアの既定値は CN と schinese です。指定地域・通貨と取得時刻に対応する価格を表示します。",
	"help.unlinkYourAccountInADirect": "個別チャットで自分のアカウントの連携を解除します。",
	"help.viewAPublicProfileWithSeparate": "公開プロフィールを表示し、ニックネーム、アバター、レベルの取得状況を個別に示します。",
	"help.viewAPublicWishlistAnonymously20": "公開ウィッシュリストを匿名で確認します。1 ページは 20 件です。モデルとウェブからの検索ではアカウントを明示してください。",
	"help.viewStoreDetailsAndCurrentPrices": "ストアの詳細と取得できた現在価格を表示します。画像を取得できない場合もテキストは残ります。",
	"help.viewTheAvailablePublicSampleFull": "取得できる公開サンプルを表示します。全ライブラリには任意の Steam キーが必要です。",
	"help.viewTheRecentPublicSampleShown": "プロフィールに最近表示された公開サンプルを確認します。対象範囲はソースの応答によります。",
	"help.viewUsageHelp": "使い方を確認します。",
	"help.viewYourLinkedAccountInA": "個別チャットで自分の連携アカウントを確認します。",
	"job.account": "SteamID64 / Dota ID32（対象アカウント）",
	"job.accountRequired": "対象アカウントを入力してください。",
	"job.activeNextSteps": "状態の更新やタスクのキャンセルができます。待機中または実行中は再試行できません。",
	"job.all_apps": "アプリの絞り込み",
	"job.apps.false": "ゲームのみ",
	"job.apps.true": "すべてのアプリ",
	"job.aspect": "縦横比",
	"job.authorityChanged": "ページのアクセス権または実行状態が変わりました。ページを開き直してください。",
	"job.authorityLost": "このページのアクセス権または実行状態が無効になりました。ページを開き直してください。",
	"job.available": "ページを利用できるようになりました。手動でタスクを再表示・更新するか、新しいタスクを送信してください。",
	"job.cancel": "タスクをキャンセル",
	"job.coverage": "確認済み {examined}件 · 未確認 {unexamined}件 · 確認済みで種類不明 {unknown}件",
	"job.create": "コラージュ作成タスク",
	"job.description": "上限なしの場合も、取得元が返した範囲が対象です。バッチごとにリソースの上限があり、完了済みページは保持されます。ページを閉じると状態の自動確認のみ停止します。中止するにはキャンセルを選んでください。",
	"job.disposed": "タスクページの実行状態が変わりました。ページを開き直してください。",
	"job.download": "元のPNGをダウンロード",
	"job.eligible": "条件に一致",
	"job.eligibleConfirmed": "一致を確認済み",
	"job.fit": "カバー画像の表示",
	"job.imageAlt": "バッチ{batch} · 画像{image}",
	"job.incompleteSource": "取得元のデータ範囲は一部のみ",
	"job.invalidImage": "画像を確認できませんでした。",
	"job.invalidResource": "タスクのリソースを確認できませんでした。",
	"job.invalidResults": "タスク結果の範囲を確認できませんでした。",
	"job.invalidStatus": "タスクの状態を確認できませんでした。",
	"job.jobId": "タスクID（ページ更新後に自動で再表示）",
	"job.legacyLimit": "旧レイアウトは最大200件まで対応しています。",
	"job.legacyUnknown": "種類未確認 {count}件（未確認と、確認済みで種類不明の項目を区別していません）",
	"job.limit": "件数（20件以上。1000件を超える値も入力可）",
	"job.limit_mode": "件数の指定",
	"job.metadataFailures": "メタデータの取得に {count} 回失敗",
	"job.metrics": "取得 {source}件 · {eligibleLabel} {eligible}件 · 選択済み {selected}件 · 作成済み {generated}件 · 処理待ち {pending}件 · 画像なし {missing}件",
	"job.mode": "レイアウト",
	"job.next": "次の結果ページ",
	"job.noResults": "完了済みの結果ページはまだありません。",
	"job.notSubmitted": "タスクはまだ送信されていません。",
	"job.operationFailed": "タスクの操作が完了しませんでした。タスクを更新して状態を確認してください。",
	"job.preset": "プレイ時間のプリセット",
	"job.published": "画像 {count} 件を公開済みです。「{resultsLabel}」を選ぶか、{command} で確認できます。",
	"job.quality": "画質",
	"job.reason.metadata_incomplete": "一部の作品の種類を確認できなかったため、ゲームのみの絞り込みを完了できませんでした。空のライブラリとしては扱っていません。",
	"job.reason.rate_limited": "取得元のリクエスト制限に達したため、後続のバッチを停止しました。取得元の制限が解除されるまでお待ちください。",
	"job.reason.resource_budget": "リソースの上限に達したため、後続のバッチを停止しました。件数や画質を下げて送信し直せます。",
	"job.reason.steam_key_required": "ライブラリ全体を取得するには、信頼できる管理ページでSteam Keyを設定してください。公開サンプルも選べます。",
	"job.reason.steam_source_access_denied": "Steamの取得元がアクセスを拒否しました。信頼できる管理ページのSteam設定、取得元の権限、対象の公開・アクセス範囲を確認してください。空のライブラリとしては扱っていません。",
	"job.reason.steam_source_not_public": "Steamライブラリが非公開か、現在の取得元の権限が制限されています。公開設定と取得元の権限を確認してください。空のライブラリとしては扱っていません。",
	"job.reason.steam_source_unavailable": "Steamの取得元を現在利用できません。取得元の状態を確認してください。別の取得元には切り替えていません。",
	"job.recovery": "タスクの状態と再表示",
	"job.refresh": "タスクを再表示・更新",
	"job.results": "結果ページを表示",
	"job.retry": "再実行（有効なキャッシュを再利用）",
	"job.retryNextSteps": "条件を確認したら、時間をおいて手動で再実行できます。有効なキャッシュは再利用しますが、中断した項目から自動で再開することはありません。",
	"job.retryWait": "取得元は {seconds} 秒待ってからの再試行を推奨しています。自動再試行やカウントダウンは行いません。",
	"job.source": "取得元",
	"job.state.cancelled": "キャンセル済み",
	"job.state.failed": "失敗",
	"job.state.interrupted": "中断",
	"job.state.queued": "待機中",
	"job.state.running": "実行中",
	"job.state.succeeded": "完了",
	"job.statusSummary": "タスク {id} · {state}",
	"job.submit": "コラージュ作成を依頼",
	"job.submitted": "タスクを送信しました。ページを閉じると状態の自動確認のみ停止します。",
	"job.unavailable": "タスクページを現在利用できないため、状態の自動確認を停止しました。復旧後に確認できるよう、タスクIDは保持しています。",
	"job.unavailableService": "タスクサービスを現在利用できません。モジュールを更新してください。",
	"job.unconfirmed": "未確認",
	"job.unknownFailure": "タスクが完了しませんでした。原因はまだ確認できません。状態を更新し、取得元と設定を確認してください。",
	"job.unlimited": "上限なし",
	"job.verifiedSelection": "選択した項目の並び順を確認済み",
	"job.verifiedSelectionRemaining": "選択した項目の並び順を確認済み。残りは未確認",
	"metric.unknown": "不明",
	"module.steam.source": "Steam ストアとコミュニティから公開サンプルを取得します。全ライブラリには任意の Steam キーが必要です。取得範囲は実際の応答によります。非公開、キー未設定、接続先の障害は区別して表示します。",
	"module.steam.summary": "ストア検索、ゲームの詳細、公開プロフィールを確認できます。連携アカウントは本人の申告に基づき、所有権は確認していません。",
	"page.accountScope": "既定のアカウントは認可されたコマンドでのみ使われます。自然言語ツールではアカウントまたは試合 ID を明示してください。",
	"page.homeNavigation": "モジュールのメニューから検索を選ぶか、機能設定で項目を調整してください。",
	"page.moduleEyebrow": "{module} / モジュール",
	"page.moduleMissing": "このページで使えるモジュール定義がありません。",
	"page.moduleRuntimeContextChangedOpenThe": "モジュールの実行コンテキストが変わりました。ページを開き直してください。",
	"page.moduleUnavailable": "モジュールページを利用できません",
	"page.pageAvailabilityChangedReviewTheRefreshed": "ページの利用状態が変わりました。更新後の設定を確認してください。",
	"page.saveVerification": "保存後は設定を読み直して結果を確認します。競合した場合や結果が未確認の場合は、手動で更新してください。",
	"page.settings.steam": "公開サンプルと全ライブラリのいずれかを選び、レイアウト、プレイ時間のプリセット、比率、出力上限を設定します。全ライブラリの取得には任意の Steam キーが必要です。実際の取得範囲はソースの応答によって異なります。",
	"page.settingsTitle": "{module} の機能設定",
	"page.sourceAccess": "ソースの認可",
	"page.thisPageIsNotDeclaredReturn": "このページは宣言されていません。モジュール一覧に戻り、開き直してください。",
	"route.collage": "ゲーム履歴コラージュ",
	"route.home": "ヘルプと状態",
	"route.settings": "設定",
	"route.wishlist": "ウィッシュリスト",
	"section.createCollage": "コラージュジョブの作成",
	"section.dataAndAccounts": "データとアカウント",
	"section.queryAndReply": "検索と返信",
	"section.settingsHelp": "設定について",
	"section.sourceCredentials": "ソースの認証情報と認可",
	"section.sourceScope": "データソースと対象範囲",
	"section.statusAndHelp": "状態とヘルプ",
	"setting.collageLayout": "コラージュのレイアウト",
	"setting.coverFit": "カバー画像の配置",
	"setting.gameLibrarySource": "ゲームライブラリのソース",
	"setting.includeAllAppsIncludingSoftware": "ソフトウェアを含む全アプリを対象にする",
	"setting.itemLimit": "作品数の上限",
	"setting.outputAspectRatio": "出力の縦横比",
	"setting.outputQuality": "出力画質",
	"setting.playtimePreset": "プレイ時間のプリセット",
	"setting.replyTheme": "返信テーマ",
	"settings.allApps": "全アプリ",
	"settings.authorizationExpired": "管理認可またはモジュールのコンテキストが無効になりました。ページを開き直してください。",
	"settings.chooseAnAvailableOption": "利用できる項目を選んでください。",
	"settings.configConflict": "別の操作で設定が変更されました。下書きは保持されています。手動で更新し、内容を確認してから保存してください。",
	"settings.discardModuleChanges": "モジュールの変更を破棄",
	"settings.draftTooLong": "入力が下書きの上限を超えています。ページを移動する前に修正してください。",
	"settings.enterAValidIanaTimeZone": "Asia/Shanghai のような有効な IANA タイムゾーンを入力してください。",
	"settings.enterAnIanaTimeZoneWithin": "許容文字数内で IANA タイムゾーンを入力してください。",
	"settings.followCoreClearsTheModulesReply": "返信テーマの「Core に従う」を選ぶとモジュール独自の設定を解除します。既定値に戻す操作は下書きに入り、保存後に反映されます。",
	"settings.gamesOnly": "ゲームのみ",
	"settings.integerRange": "{minimum} から {maximum} までの整数を入力してください。",
	"settings.invalidConfig": "設定が受け付けられませんでした。項目を確認し、手動で更新して内容を確認してから保存してください。",
	"settings.invalidCurrentValue": "現在の設定は無効です。変更するか既定値に戻してから保存してください。",
	"settings.legacyLimit": "旧レイアウトの上限は 200 件です。件数を変更するか、ゲーム履歴コラージュを選んでください。",
	"settings.moduleChangesDiscarded": "モジュールの変更を破棄しました。",
	"settings.off": "オフ",
	"settings.on": "オン",
	"settings.partialWriteUnverified": "変更の一部または全部を送信しましたが、結果は未確認です。手動で更新して結果を確認してください。繰り返し送信しないでください。",
	"settings.readWithUnconfirmedCredentials": "通常設定を読み込みました。認証情報の状態は未確認です。認証情報を個別に更新してください。",
	"settings.refreshSettings": "設定を更新",
	"settings.refreshed": "更新しました。",
	"settings.refreshedWithDraft": "更新しました。下書きは保持されています。内容を確認してから保存してください。",
	"settings.restoreDefault": "既定値に戻す",
	"settings.saveChanges": "変更を保存",
	"settings.saveUnverified": "保存結果は未確認です。下書きは保持されています。手動で更新して確認してください。繰り返し送信しないでください。",
	"settings.saved": "保存しました。",
	"settings.savedWithNewerDraft": "今回の内容は保存しました。新しい未保存の変更があります。",
	"settings.savedWithUnconfirmedCredentials": "通常設定を保存し確認しました。認証情報の状態は未確認です。認証情報を個別に更新してください。",
	"settings.savingPleaseWaitForConfirmation": "保存しています。確認が終わるまでお待ちください。",
	"settings.settingsCouldNotBeReadCheck": "設定を読み込めませんでした。ダッシュボードの認可とモジュールの状態を確認し、手動で更新してください。",
	"settings.unlimited": "上限なし",
	"settings.unlimitedModeUnavailable": "現在の設定では上限なしを選べません。モジュールのバージョンを更新してください。",
	"settings.youHaveUnsavedChanges": "未保存の変更があります。",
	"status.couldNotReadSourceStatusRefresh": "ソースの状態を読み込めませんでした。しばらくしてから更新してください。",
	"status.refreshSourceStatus": "ソースの状態を更新",
	"status.searchResults": "検索結果",
	"status.sourceStatus": "ソースの状態",
	"validation.enterACompleteFiniteNumber": "有限の数値を入力してください。",
	"validation.enterACompleteFiniteNumberWithout": "ほかの文字を含まない有限の数値を入力してください。",
	"validation.theCountExceedsTheSafeRange": "件数が安全に扱える範囲を超えています。「上限なし」を選んでください。",
	"validation.theCountMustBeAtLeast": "小数部を切り捨てた件数は 20 以上にしてください。",
	"validation.theImageCouldNotBeVerified": "画像を検証できませんでした。",
	"wishlist.account": "SteamID64 / Dota ID32（対象アカウント）",
	"wishlist.accountRequired": "対象アカウントを入力してください。",
	"wishlist.description": "公式の公開ウィッシュリストを匿名で取得します。1ページ20件で、ストア情報は表示中のページだけ取得します。非公開、空のリスト、レート制限、取得失敗は区別して表示します。",
	"wishlist.empty": "取得元が返した公開ウィッシュリストは空でした。",
	"wishlist.enrichmentFailed": "ウィッシュリストを取得しました。このページのストア情報を取得できなかったため、価格がない項目は無料として扱っていません。",
	"wishlist.error.module_unavailable": "ウィッシュリストのサービスまたは今回のアクセス権を現在利用できません。",
	"wishlist.error.not_public": "ウィッシュリストが非公開か、取得元でアクセスが制限されています。公開設定を確認してから再試行してください。",
	"wishlist.error.parameter_error": "アカウント、地域、言語、ページ番号を確認してください。",
	"wishlist.error.rate_limited": "取得元でリクエスト数が制限されています。時間をおいて再試行してください。",
	"wishlist.error.unparsed": "取得元のデータ形式を確認できませんでした。時間をおいて再試行してください。",
	"wishlist.error.upstream_error": "ウィッシュリストの取得に失敗しました。時間をおいて再試行してください。",
	"wishlist.filters": "検索条件",
	"wishlist.itemDetails": "追加 {addedAt} · {price} · 通貨 {currency} · 割引 {discount} · {release}",
	"wishlist.itemTitle": "{name} · AppID {appId}",
	"wishlist.language": "Steamの言語",
	"wishlist.nameUnavailable": "名前なし",
	"wishlist.next": "次のページ",
	"wishlist.notFetched": "未取得",
	"wishlist.notProvided": "記載なし",
	"wishlist.previous": "前のページ",
	"wishlist.price.fetch_failed": "ストア情報の取得に失敗",
	"wishlist.price.free": "無料",
	"wishlist.price.no_local_price": "この地域の価格なし",
	"wishlist.price.region_locked": "取得元による地域制限あり",
	"wishlist.price.region_or_store_unavailable": "ストアまたは地域を利用できません",
	"wishlist.price.unknown": "価格不明",
	"wishlist.price.unreleased": "未発売",
	"wishlist.query": "ウィッシュリストを取得",
	"wishlist.queryFailed": "ウィッシュリストを取得できませんでした。",
	"wishlist.region": "地域",
	"wishlist.release.released": "発売済み",
	"wishlist.release.unknown": "発売状況不明",
	"wishlist.release.unreleased": "未発売",
	"wishlist.requestFailed": "ウィッシュリストを取得できませんでした。時間をおいて再試行してください。",
	"wishlist.results": "ウィッシュリストの結果",
	"wishlist.sourceUnavailable": "取得元を現在利用できません。時間をおいて再試行してください。",
	"wishlist.summary": "全{total}件 · {page}/{pages}ページ · 地域 {region} · リスト取得 {fetchedAt} · ストア情報取得 {storeFetchedAt}",
	"wishlist.unknown": "不明",
	"workspace.wishlist": "公開ウィッシュリスト"
}, l = {
	"availability.thisPageContextExpiredOpenThe": "This page context expired. Open the module again.",
	"availability.thisPageIsAvailableCheckRuntime": "This page is available. Check runtime health in Module Management. Upstream services are not checked here.",
	"availability.thisPageIsUnavailableRefreshIts": "This page is unavailable. Refresh its status in Module Management, then open it again.",
	"cache.cacheStatusIsTemporarilyUnavailable": "Cache status is temporarily unavailable.",
	"cache.cacheStatusRefreshedThisOnlyReads": "Cache status refreshed. This only reads statistics. A normal library refresh still reuses valid original images.",
	"cache.couldNotReadCacheStatusTry": "Could not read cache status. Try again later.",
	"cache.summary": "Cache: {items} items / {bytes} bytes. Limit: {maxItems} items / {maxBytes} bytes. Evicted: {evictions}.",
	"choice.cropToFill": "Crop to fill",
	"choice.followCore": "Follow Core",
	"choice.fullLibraryKeyRequired": "Full library (Key required)",
	"choice.highDefinition": "High definition",
	"choice.itemCountMode": "Item count mode",
	"choice.legacyLayout": "Legacy layout",
	"choice.longPlay": "Long play",
	"choice.publicProfileSample": "Public profile sample",
	"choice.recentPublicSample": "Recent public sample",
	"choice.showFullCover": "Show full cover",
	"choice.singlePlayer": "Single-player",
	"choice.standard": "Standard",
	"choice.topNByPlaytime": "Top N by playtime",
	"choice.unlimitedAsReturnedByTheSource": "Unlimited (as returned by the source)",
	"configHint.poster_aspect": "The default aspect ratio is 2:3. At narrower ratios, cover crops proportionally and contain fills the background.",
	"configHint.poster_fit": "Crop proportionally to fill, or show the full cover with a filled background.",
	"configHint.poster_include_apps": "The collage includes software by default. When Games only is selected, totals and filtering use the same scope.",
	"configHint.poster_limit": "A finite selection must include at least 20 items. Values over 1000 can be entered manually. Use the separate Unlimited mode to remove the count limit.",
	"configHint.poster_limit_mode": "Select the top N or all items available from the source. 1000 is still a finite limit.",
	"configHint.poster_mode": "Choose the dense collage or the legacy poster. The legacy layout supports up to 200 items.",
	"configHint.poster_preset": "Playtime anchors for Single-player, Standard, and Long play. Scaling does not depend on the longest playtime in the library.",
	"configHint.poster_quality": "High definition scales the full output by 4/3. If this exceeds the budget, reduce the item count or resolution.",
	"configHint.poster_source": "games and recent provide public samples. full requires the administrator’s Steam Key and respects library privacy.",
	"configHint.reply_theme": "Image theme",
	"credential.authorizationExpired": "Administrative authorization or this page context expired. Open the page again.",
	"credential.clearCredentials": "Clear credentials",
	"credential.configConflict": "Another operation changed the settings. Credential inputs were cleared. Refresh status before trying again.",
	"credential.configuredUpstreamValidityIsUnverified": "Configured. Upstream validity is unverified.",
	"credential.credentialsCleared": "Credentials cleared.",
	"credential.decryptionFailed": "Configured, but decryption failed. Check the service key before configuring again.",
	"credential.enterAValidKeyOrToken": "Enter a valid key or token of 1 to 4096 characters.",
	"credential.mutationUnverified": "The operation did not complete or its result is unconfirmed. Credential inputs were cleared. Refresh and verify the status.",
	"credential.notConfigured": "Not configured.",
	"credential.operationCancelled": "Operation cancelled.",
	"credential.refreshToCheckStatus": "Refresh to check status.",
	"credential.saveCredentials": "Save credentials",
	"credential.savedUnverifiedUpstream": "Credentials saved. Validity is checked when requesting the source.",
	"credential.sourceCredentialsAreNeverKeptAs": "Source credentials are never kept as ordinary drafts.",
	"credential.submitCredentialsOnlyThroughTrustedAdministration": "Submit credentials only through trusted administration. Inputs are kept only on this page. Upstream validity is checked during lookup.",
	"credential.theQrCodeExpiredSignIn": "The QR code expired. Sign in again.",
	"help.aboutGameHistoryCollages": "About game history collages",
	"help.cacheStatus": "Cache status",
	"help.cacheStatusHasNotBeenRead": "Cache status has not been read yet.",
	"help.checkYourJobStatusOrResults": "Check your job status or results, cancel, or retry. The result command accepts --page N --image N and returns one selected image per request.",
	"help.commandHelp": "Command help",
	"help.createAGameHistoryCollageSaved": "Create a game history collage. Saved settings and the output budget constrain the source, playtime preset, aspect ratio, and count. The full library requires the optional key.",
	"help.linkYourSteamAccountInA": "Link your Steam account in a direct message.",
	"help.publicProfileAndRecentActivityHave": "Public profile and recent activity have separate sample scopes. The full library requires the optional Steam Key, and completeness depends on the source response. The default portrait ratio is 2:3, with 9:16 and 1:2 available. Item count and output budget constrain pagination. The legacy layout supports up to 200 items. All apps includes software, and existing off settings are preserved.",
	"help.refreshCacheStatus": "Refresh cache status",
	"help.theCollageMapsPlaytimeToEach": "The collage maps playtime to each title’s target size using Single-player, Standard, or Long play presets. Large images span rows and smaller images fill gaps, while covers keep their portrait ratio. You can select the legacy layout explicitly. Unknown playtime is never treated as zero.",
	"help.theStoreDefaultsAreCnAnd": "The store defaults are CN and schinese. The current price reflects the requested region, currency, and source timestamp.",
	"help.unlinkYourAccountInADirect": "Unlink your account in a direct message.",
	"help.viewAPublicProfileWithSeparate": "View a public profile with separate availability for nickname, avatar, and level.",
	"help.viewAPublicWishlistAnonymously20": "View a public wishlist anonymously, 20 items per page. Model and web queries require an explicit account.",
	"help.viewStoreDetailsAndCurrentPrices": "View store details and current prices where available. Text remains available if images fail.",
	"help.viewTheAvailablePublicSampleFull": "View the available public sample. Full-library access requires the optional Steam Key.",
	"help.viewTheRecentPublicSampleShown": "View the recent public sample shown on the profile. Coverage depends on the source response.",
	"help.viewUsageHelp": "View usage help.",
	"help.viewYourLinkedAccountInA": "View your linked account in a direct message.",
	"job.account": "SteamID64 / Dota ID32 (target account)",
	"job.accountRequired": "Enter the target account.",
	"job.activeNextSteps": "You can refresh the status or cancel the job. Queued or running jobs cannot be retried.",
	"job.all_apps": "App filter",
	"job.apps.false": "Games only",
	"job.apps.true": "All apps",
	"job.aspect": "Aspect ratio",
	"job.authorityChanged": "Page authorization or runtime context has changed. Reopen the page.",
	"job.authorityLost": "Authorization or runtime context for this job page has expired. Reopen the page.",
	"job.available": "The page is available again. Restore or refresh a job manually, or submit a new one.",
	"job.cancel": "Cancel job",
	"job.coverage": "Examined {examined} · Unexamined {unexamined} · Examined with unknown type {unknown}",
	"job.create": "Create collage job",
	"job.description": "No limit covers the items actually returned by the source. Each batch has a resource budget, and completed pages are retained. Closing the page only stops status polling. To stop the job, select Cancel job.",
	"job.disposed": "The job page context has changed. Reopen the page.",
	"job.download": "Download original PNG",
	"job.eligible": "Eligible",
	"job.eligibleConfirmed": "Confirmed eligible",
	"job.fit": "Cover fit",
	"job.imageAlt": "Batch {batch} · Image {image}",
	"job.incompleteSource": "Source coverage is incomplete",
	"job.invalidImage": "The image resource could not be verified.",
	"job.invalidResource": "The job resource could not be verified.",
	"job.invalidResults": "The job result range could not be verified.",
	"job.invalidStatus": "Job status could not be verified.",
	"job.jobId": "Job ID (restored after page refresh)",
	"job.legacyLimit": "The legacy layout supports up to 200 items.",
	"job.legacyUnknown": "Type unverified for {count} items (unexamined items and examined items with unknown types are grouped together)",
	"job.limit": "Item count (minimum 20, values above 1,000 allowed)",
	"job.limit_mode": "Item count mode",
	"job.metadataFailures": "Metadata requests failed {count} times",
	"job.metrics": "Returned {source} · {eligibleLabel} {eligible} · Selected {selected} · Generated {generated} · Pending {pending} · Missing images {missing}",
	"job.mode": "Layout",
	"job.next": "Next results page",
	"job.noResults": "There are no completed result pages yet.",
	"job.notSubmitted": "No job submitted yet.",
	"job.operationFailed": "The job operation did not complete. Refresh the job and check its status.",
	"job.preset": "Playtime preset",
	"job.published": "{count} images published. Select “{resultsLabel}” or run {command} to view them.",
	"job.quality": "Image quality",
	"job.reason.metadata_incomplete": "Some item types could not be verified, so the games-only filter could not complete. This was not treated as an empty library.",
	"job.reason.rate_limited": "The source is rate-limited, so later batches were stopped. Wait for the source to recover.",
	"job.reason.resource_budget": "The resource budget was exhausted, so later batches were stopped. Reduce the item count or image quality before resubmitting.",
	"job.reason.steam_key_required": "The full library requires a Steam Key configured on the trusted admin page. You can use a public sample instead.",
	"job.reason.steam_source_access_denied": "The Steam source denied access. Check Steam settings on the trusted admin page, source authorization, and the target’s visibility or access scope. This was not treated as an empty library.",
	"job.reason.steam_source_not_public": "The Steam library is private or source authorization is restricted. Check visibility settings and source authorization. This was not treated as an empty library.",
	"job.reason.steam_source_unavailable": "The Steam source is unavailable. Check its status. No other source was used.",
	"job.recovery": "Job status and recovery",
	"job.refresh": "Restore or refresh job",
	"job.results": "View results",
	"job.retry": "Run again (reuse valid cache)",
	"job.retryNextSteps": "Check the settings before retrying manually. A retry reuses valid cache entries and does not automatically resume from the last item.",
	"job.retryWait": "The source recommends waiting {seconds} seconds before retrying. There is no automatic retry or countdown.",
	"job.source": "Source",
	"job.state.cancelled": "Cancelled",
	"job.state.failed": "Failed",
	"job.state.interrupted": "Interrupted",
	"job.state.queued": "Queued",
	"job.state.running": "Running",
	"job.state.succeeded": "Completed",
	"job.statusSummary": "Job {id} · {state}",
	"job.submit": "Submit collage job",
	"job.submitted": "Job submitted. Closing the page only stops status polling.",
	"job.unavailable": "The job page is unavailable and polling has stopped. The job ID is retained so you can check it after recovery.",
	"job.unavailableService": "The job service is unavailable. Refresh the module.",
	"job.unconfirmed": "Unconfirmed",
	"job.unknownFailure": "The job did not complete, and the reason is unconfirmed. Refresh the status and check the source and settings.",
	"job.unlimited": "No limit",
	"job.verifiedSelection": "Order of selected items verified",
	"job.verifiedSelectionRemaining": "Order of selected items verified, with remaining items unexamined",
	"metric.unknown": "Unknown",
	"module.steam.source": "Steam Store and Community provide public samples. The full library uses the optional Steam Key. Coverage depends on the source response. A private library, missing key, and upstream failure are reported separately.",
	"module.steam.summary": "Search the store, view game details and public profiles. Linked accounts are self-reported and ownership is unverified.",
	"page.accountScope": "Default accounts are used only for authorized commands. Natural-language tools require an explicit account or match ID.",
	"page.homeNavigation": "Choose a lookup from the module menu, or open feature settings to adjust your options.",
	"page.moduleEyebrow": "{module} / Module",
	"page.moduleMissing": "There is no available module declaration for this page.",
	"page.moduleRuntimeContextChangedOpenThe": "Module runtime context changed. Open the page again.",
	"page.moduleUnavailable": "Module page unavailable",
	"page.pageAvailabilityChangedReviewTheRefreshed": "Page availability changed. Review the refreshed settings.",
	"page.saveVerification": "Settings are read back and checked after saving. If there is a conflict or the result is unconfirmed, refresh manually.",
	"page.settings.steam": "Choose a public sample or the full library, along with the layout, playtime preset, aspect ratio, and output budget. Full-library access requires the optional Steam Key. Actual coverage depends on the source response.",
	"page.settingsTitle": "{module} feature settings",
	"page.sourceAccess": "Source access",
	"page.thisPageIsNotDeclaredReturn": "This page is not declared. Return to the module list and open it again.",
	"route.collage": "Game history collage",
	"route.home": "Help and status",
	"route.settings": "Settings",
	"route.wishlist": "Wishlist",
	"section.createCollage": "Create a collage job",
	"section.dataAndAccounts": "Data and accounts",
	"section.queryAndReply": "Search and replies",
	"section.settingsHelp": "About settings",
	"section.sourceCredentials": "Source credentials and authorization",
	"section.sourceScope": "Data sources and coverage",
	"section.statusAndHelp": "Status and help",
	"setting.collageLayout": "Collage layout",
	"setting.coverFit": "Cover fit",
	"setting.gameLibrarySource": "Game library source",
	"setting.includeAllAppsIncludingSoftware": "Include all apps, including software",
	"setting.itemLimit": "Item limit",
	"setting.outputAspectRatio": "Output aspect ratio",
	"setting.outputQuality": "Output quality",
	"setting.playtimePreset": "Playtime preset",
	"setting.replyTheme": "Reply theme",
	"settings.allApps": "All apps",
	"settings.authorizationExpired": "Administrative authorization or the module context expired. Open the page again.",
	"settings.chooseAnAvailableOption": "Choose an available option.",
	"settings.configConflict": "Another operation changed the settings. Your draft was kept. Refresh manually and review before saving.",
	"settings.discardModuleChanges": "Discard module changes",
	"settings.draftTooLong": "This input exceeds the draft size limit. Shorten it before leaving the page.",
	"settings.enterAValidIanaTimeZone": "Enter a valid IANA time zone, such as Asia/Shanghai.",
	"settings.enterAnIanaTimeZoneWithin": "Enter an IANA time zone within the allowed length.",
	"settings.followCoreClearsTheModulesReply": "Follow Core clears the module’s reply theme override. Restoring defaults creates a draft that takes effect after saving.",
	"settings.gamesOnly": "Games only",
	"settings.integerRange": "Enter an integer from {minimum} to {maximum}.",
	"settings.invalidConfig": "The settings were rejected. Check the fields, then refresh manually and review before saving.",
	"settings.invalidCurrentValue": "The current setting is invalid. Edit it or restore the default before saving.",
	"settings.legacyLimit": "The legacy layout supports up to 200 items. Change the count or select Game history collage.",
	"settings.moduleChangesDiscarded": "Module changes discarded.",
	"settings.off": "Off",
	"settings.on": "On",
	"settings.partialWriteUnverified": "Some or all changes were submitted, but the outcome is unverified. Refresh manually and check before taking further action. Do not submit again.",
	"settings.readWithUnconfirmedCredentials": "Ordinary settings were read. Credential status is unconfirmed. Refresh credentials separately.",
	"settings.refreshSettings": "Refresh settings",
	"settings.refreshed": "Refreshed.",
	"settings.refreshedWithDraft": "Refreshed. Your draft was kept. Review it before saving.",
	"settings.restoreDefault": "Restore default",
	"settings.saveChanges": "Save changes",
	"settings.saveUnverified": "The save result is unconfirmed. Your draft was kept. Refresh manually and check the result. Do not submit again.",
	"settings.saved": "Saved.",
	"settings.savedWithNewerDraft": "This submission was saved. You have newer unsaved changes.",
	"settings.savedWithUnconfirmedCredentials": "Ordinary settings were saved and verified. Credential status is unconfirmed. Refresh credentials separately.",
	"settings.savingPleaseWaitForConfirmation": "Saving. Please wait for confirmation.",
	"settings.settingsCouldNotBeReadCheck": "Settings could not be read. Check Dashboard authorization and module status, then refresh manually.",
	"settings.unlimited": "Unlimited",
	"settings.unlimitedModeUnavailable": "Unlimited mode is unavailable in this configuration. Refresh the module version.",
	"settings.youHaveUnsavedChanges": "You have unsaved changes.",
	"status.couldNotReadSourceStatusRefresh": "Could not read source status. Refresh again later.",
	"status.refreshSourceStatus": "Refresh source status",
	"status.searchResults": "Search results",
	"status.sourceStatus": "Source status",
	"validation.enterACompleteFiniteNumber": "Enter a complete, finite number.",
	"validation.enterACompleteFiniteNumberWithout": "Enter a complete, finite number without other text.",
	"validation.theCountExceedsTheSafeRange": "The count exceeds the safe range. Select Unlimited.",
	"validation.theCountMustBeAtLeast": "The count must be at least 20 after truncation toward zero.",
	"validation.theImageCouldNotBeVerified": "The image could not be verified.",
	"wishlist.account": "SteamID64 / Dota ID32 (target account)",
	"wishlist.accountRequired": "Enter the target account.",
	"wishlist.description": "Read the official public wishlist anonymously. Each page shows 20 items, with store details for the current page only. Private and empty wishlists, rate limits, and request failures are reported separately.",
	"wishlist.empty": "The source returned an empty public wishlist for this request.",
	"wishlist.enrichmentFailed": "The wishlist was retrieved. Store details could not be loaded for this page, so missing prices were not treated as free.",
	"wishlist.error.module_unavailable": "The wishlist service or the current authorization is unavailable.",
	"wishlist.error.not_public": "The wishlist is private or access is restricted. Check the visibility settings and try again.",
	"wishlist.error.parameter_error": "Check the account, region, language, or page number.",
	"wishlist.error.rate_limited": "The wishlist source is rate-limited. Try again later.",
	"wishlist.error.unparsed": "The wishlist source format could not be verified. Try again later.",
	"wishlist.error.upstream_error": "The wishlist source request failed. Try again later.",
	"wishlist.filters": "Search criteria",
	"wishlist.itemDetails": "Added {addedAt} · {price} · Currency {currency} · Discount {discount} · {release}",
	"wishlist.itemTitle": "{name} · AppID {appId}",
	"wishlist.language": "Steam language",
	"wishlist.nameUnavailable": "Name unavailable",
	"wishlist.next": "Next page",
	"wishlist.notFetched": "Unavailable",
	"wishlist.notProvided": "Unspecified",
	"wishlist.previous": "Previous page",
	"wishlist.price.fetch_failed": "Store details unavailable",
	"wishlist.price.free": "Free",
	"wishlist.price.no_local_price": "No price for this region",
	"wishlist.price.region_locked": "Region restriction confirmed by source",
	"wishlist.price.region_or_store_unavailable": "Store or region unavailable",
	"wishlist.price.unknown": "Price unknown",
	"wishlist.price.unreleased": "Unreleased",
	"wishlist.query": "Read wishlist",
	"wishlist.queryFailed": "The wishlist query could not be completed.",
	"wishlist.region": "Region",
	"wishlist.release.released": "Released",
	"wishlist.release.unknown": "Release status unknown",
	"wishlist.release.unreleased": "Unreleased",
	"wishlist.requestFailed": "The wishlist request could not be completed. Try again later.",
	"wishlist.results": "Wishlist results",
	"wishlist.sourceUnavailable": "The wishlist source is temporarily unavailable. Try again later.",
	"wishlist.summary": "{total} items · Page {page}/{pages} · Region {region} · Wishlist fetched {fetchedAt} · Store details fetched {storeFetchedAt}",
	"wishlist.unknown": "Unknown",
	"workspace.wishlist": "Public wishlist"
}, u = "steam", d = (e) => e === "steam" ? {
	"zh-CN": o,
	"zh-TW": s,
	"ja-JP": c,
	"en-US": l
} : {}, f = d(u);
function p(e) {
	let t = typeof e == "string" ? e.replaceAll("_", "-").toLowerCase() : "";
	return /^zh-(?:hant(?:-|$)|tw(?:-|$)|hk(?:-|$)|mo(?:-|$))/.test(t) ? "zh-TW" : /^ja(?:-|$)/.test(t) ? "ja-JP" : /^en(?:-|$)/.test(t) ? "en-US" : "zh-CN";
}
function m(e, t, n, r = {}) {
	let i = e?.[p(t)], a = e?.["zh-CN"];
	return (i && Object.hasOwn(i, n) ? i[n] : a && Object.hasOwn(a, n) ? a[n] : n).replace(/\{([A-Za-z][A-Za-z0-9_]*)\}/g, (e, t) => Object.hasOwn(r, t) ? String(r[t]) : e);
}
function h(e) {
	return u;
}
function g(e, t, n = "zh-CN", r = u) {
	return m(f || d(h(r)), n, e, t);
}
function _(e, t = m, n = u) {
	let r = f || d(h(n)), i = /* @__PURE__ */ new Map(), a = 0, o = () => {
		for (let e of i.keys()) e.isConnected === !1 && i.delete(e);
	}, s = (e, n, i) => t(r, e, n, i);
	return {
		text: (t, n) => s(e(), t, n),
		textAt: s,
		bind(e, t, n = "textContent") {
			e[n] = t();
			let r = i.get(e);
			return r || (++a % 256 == 0 && queueMicrotask(o), i.set(e, r = /* @__PURE__ */ new Map())), r.set(n, t), () => {
				r.get(n) === t && r.delete(n), r.size || i.delete(e);
			};
		},
		renderer(e, t = "textContent") {
			return i.get(e)?.get(t) || (() => e[t]);
		},
		refresh() {
			o();
			for (let [e, t] of i) for (let [n, r] of t) e[n] = r();
		},
		clear() {
			i.clear();
		}
	};
}
//#endregion
//#region packages/steam_dlc/pages/src/template-adapter.js
function v(e, { presentation: t, copy: n }, { id: r, label: i, className: a = "", legacyLabel: o = i }) {
	let s = t?.template, c = e.ownerDocument.createElement(s ? "div" : "form");
	c.className = a;
	let l = e.ownerDocument.createElement("div");
	l.className = "steam-dlc-actions";
	let u;
	return s || (u = e.ownerDocument.createElement("button"), u.type = "submit", u.className = "ui-button", u.dataset.action = r, u.dataset.variant = "primary", typeof o == "function" ? n.bind(u, o) : u.textContent = o, l.append(u)), {
		body: c,
		actions: l,
		bind(e) {
			if (s) return s.bind("query", e, {
				type: "submit",
				label: i
			}), () => {};
			let t = (t) => {
				t.preventDefault(), e();
			};
			return c.addEventListener("submit", t), () => c.removeEventListener("submit", t);
		},
		sync(e, t) {
			c.setAttribute("aria-busy", String(t)), s ? s.actionState("query", {
				disabled: e,
				busy: t
			}) : u.disabled = e || t;
		},
		result(...n) {
			(t?.resultHost || e).append(...n);
		}
	};
}
//#endregion
//#region packages/steam_dlc/pages/src/job-controller.js
function y(e, { options: t, active: n, field: r, parseLimit: i, validatePNG: a, say: o }) {
	let s = e.ownerDocument, c = [], l = [], u = !1, d = !1, f = null, p = 0, m = 0, h = null, g = null, _ = !1, y = null, b = 0, x = () => !u && !d && n(), S = (e) => x() && e === p, ee = /* @__PURE__ */ new Set([
		"admin_authorization_denied",
		"page_revoked",
		"page_unavailable",
		"stale_context"
	]), { text: C, bind: te } = t.copy, w = (e, t) => () => C(`job.${e}`, t), T = Symbol(), E = (e, t = w(e)) => Object.assign(Error(e), { [T]: t }), D = (e, t) => {
		let n = s.createElement(e);
		return typeof t == "function" ? te(n, t) : t !== void 0 && (n.textContent = t), n;
	}, O = (e, t, n) => {
		e.addEventListener(t, n), l.push(() => e.removeEventListener(t, n));
	}, k = () => {
		f !== null && (clearTimeout(f), f = null);
	}, ne = () => {
		for (let e of c.splice(0)) s.defaultView.URL.revokeObjectURL(e);
	}, re = () => {
		if (!t.services.jobs) throw E("unavailableService");
		return t.services.jobs;
	}, ie = v(e, t, {
		id: "generate",
		label: w("submit"),
		className: "steam-dlc-public-form"
	}), { body: A, actions: ae } = ie, j = t.presentation?.grid(A) || A, oe = r(j, "account", w("account")), M = {};
	for (let [e, t, n, i] of [
		[
			"source",
			w("source"),
			[
				"games",
				"recent",
				"full"
			],
			"games"
		],
		[
			"mode",
			w("mode"),
			["dense", "legacy"],
			"dense"
		],
		[
			"preset",
			w("preset"),
			[
				"single",
				"standard",
				"long"
			],
			"standard"
		],
		[
			"aspect",
			w("aspect"),
			[
				"2:3",
				"9:16",
				"1:2"
			],
			"2:3"
		],
		[
			"quality",
			w("quality"),
			["normal", "hd"],
			"normal"
		],
		[
			"fit",
			w("fit"),
			["cover", "contain"],
			"cover"
		],
		[
			"limit_mode",
			w("limit_mode"),
			["top", "all"],
			"top"
		],
		[
			"all_apps",
			w("all_apps"),
			["true", "false"],
			"true"
		]
	]) M[e] = r(j, e, t, n, i);
	te(M.all_apps.options[0], w("apps.true")), te(M.all_apps.options[1], w("apps.false"));
	let se = r(j, "limit", w("limit"), null, "500");
	se.inputMode = "decimal";
	let ce = D("div");
	ce.className = "steam-dlc-actions";
	let N = (e, t, n, r = ae) => {
		let i = D("button", t);
		return i.type = "button", i.className = "ui-button", i.dataset.action = e, O(i, "click", () => {
			if (!x() || _) return;
			let e = p, t = (t) => me(t, e);
			try {
				let r = n();
				e = p, r && typeof r.then == "function" && (_ = !0, V(), r.catch(t).finally(() => {
					S(e) && (_ = !1, V());
				}));
			} catch (e) {
				t(e);
			}
		}), r.append(i), i;
	};
	for (let e of [
		20,
		50,
		100,
		200,
		500,
		1e3,
		"all"
	]) N(`limit-${e}`, e === "all" ? w("unlimited") : String(e), () => {
		M.limit_mode.value = e === "all" ? "all" : "top", se.disabled = e === "all", e !== "all" && (se.value = String(e));
	});
	O(M.limit_mode, "change", () => {
		se.disabled = M.limit_mode.value === "all";
	});
	let P = D("h3", w("recovery")), le = t.presentation?.grid(A) || A, F = le === A ? null : A.lastElementChild, I = r(le, "job_id", w("jobId")), L = D("div");
	L.className = "steam-dlc-job-status", L.setAttribute("role", "status");
	let R, z = (e) => {
		R?.(), R = te(L, w(e));
	};
	z("notSubmitted");
	let B = D("section");
	B.className = "steam-dlc-public-result";
	let V = () => {
		let e = !x();
		ie.sync(e, _);
		for (let t of A.querySelectorAll("button")) t.disabled = e || _;
		for (let t of A.querySelectorAll("input,select")) t.disabled = e;
		se.disabled = e || M.limit_mode.value === "all", fe.disabled = e || _ || !["queued", "running"].includes(h?.status), W.disabled = e || _ || ![
			"failed",
			"cancelled",
			"interrupted"
		].includes(h?.status), W.hidden = ![
			"failed",
			"cancelled",
			"interrupted"
		].includes(h?.status), fe.hidden = !["queued", "running"].includes(h?.status), he.disabled = e || _ || !g;
	}, H = `ygl:job:${t.context.owner}:${t.routeId}`, U = (e) => {
		if (!e || typeof e.job_id != "string" || !Number.isSafeInteger(e.revision) || ![
			"queued",
			"running",
			"succeeded",
			"failed",
			"cancelled",
			"interrupted"
		].includes(e.status)) throw E("invalidStatus");
		h = e, I.value = h.job_id;
		try {
			s.defaultView.sessionStorage.setItem(H, h.job_id);
		} catch {}
		let t = h.progress || {}, n = h.summary || {}, r = [
			"steam_key_required",
			"steam_source_unavailable",
			"steam_source_access_denied",
			"steam_source_not_public",
			"rate_limited",
			"resource_budget",
			"metadata_incomplete"
		], i = n.reason ?? t.reason ?? h.error_code, a = r.includes(i) ? `reason.${i}` : i || h.status === "failed" ? "unknownFailure" : null, o = n.retry_after ?? t.retry_after, c = Number.isSafeInteger(o) && o >= 0 && o <= 86400, l = n.result_entries ?? t.result_entries;
		Number.isSafeInteger(l) && l >= 0 && (b = Math.max(b, l));
		let u = (e) => Number.isSafeInteger(e) && e >= 0 ? String(e) : C("job.unconfirmed"), d = h.status, f = h.job_id, p = b, m = [], g = n.metadata_unexamined ?? t.metadata_unexamined, _ = [
			"examined",
			"unexamined",
			"classification_unknown"
		].map((e) => n[e] ?? t[e]), v = n.metadata_failures ?? n.counters?.metadata_failed ?? t.counters?.metadata_failed ?? 0;
		(n.complete_source ?? t.complete_source) === !1 && m.push(w("incompleteSource")), _.some((e) => e !== void 0) ? m.push(() => C("job.coverage", {
			examined: u(_[0]),
			unexamined: u(_[1]),
			unknown: u(_[2])
		})) : g && m.push(w("legacyUnknown", { count: g })), n.selection_exact === !0 && n.all_apps === !1 && m.push(w(Number.isSafeInteger(_[1]) && _[1] > 0 ? "verifiedSelectionRemaining" : "verifiedSelection")), v && m.push(w("metadataFailures", { count: v }));
		let y = [];
		["queued", "running"].includes(d) ? y.push(w("activeNextSteps")) : [
			"failed",
			"cancelled",
			"interrupted"
		].includes(d) && y.push(w("retryNextSteps")), p > 0 && y.push(() => C("job.published", {
			count: p,
			resultsLabel: C("job.results"),
			command: `/ygl steam wall result ${f}`
		}));
		let x = [D("p", () => C("job.statusSummary", {
			id: f,
			state: C(`job.state.${d}`)
		})), D("p", () => C("job.metrics", {
			source: u(n.source_returned ?? t.source_returned),
			eligible: u(n.eligible ?? t.eligible),
			eligibleLabel: C((n.eligible_complete ?? t.eligible_complete) === !1 ? "job.eligibleConfirmed" : "job.eligible"),
			selected: u(n.selected ?? t.selected),
			generated: u(n.generated ?? t.generated),
			pending: u(n.pending ?? t.pending),
			missing: u(n.missing_images ?? t.missing_images)
		}))];
		a && x.push(D("p", w(a))), i === "rate_limited" && c && x.push(D("p", w("retryWait", { seconds: o }))), m.length && x.push(D("p", () => m.map((e) => e()).join(" · "))), y.length && x.push(D("p", () => y.map((e) => e()).join(" "))), R?.(), R = null, L.replaceChildren(...x), V();
	}, ue = async (e) => {
		if (!h || !x()) return;
		let t = p, n = ++m, r = h.job_id, i = await re().result(r, {
			cursor: e,
			page_size: 20
		});
		if (S(t) && n === m && h?.job_id === r) {
			if (!Array.isArray(i.entries) || i.entries.length > 20) throw E("invalidResults");
			if (i.entries.some((e) => e?.resource?.media_type !== "image/png" || typeof e.resource.asset_id != "string" || !e.resource.asset_id)) throw E("invalidResource");
			i.entries.length && (b = Math.max(b, i.entries.length), U(h)), ne(), B.replaceChildren(), g = i.next_cursor || null;
			for (let [e, o] of i.entries.entries()) {
				let i = await re().resource(r, o.resource.asset_id);
				if (!S(t) || n !== m || h?.job_id !== r) return;
				if (i?.type !== "image/png" || typeof i.arrayBuffer != "function" || i.size > 16777216) throw E("invalidImage");
				if (a(new Uint8Array(await i.arrayBuffer())), !S(t) || n !== m || h?.job_id !== r) return;
				let l = s.defaultView.URL.createObjectURL(i);
				c.push(l);
				let u = D("figure"), d = D("img"), f = D("a", w("download"));
				u.className = "steam-dlc-preview", d.src = l, te(d, w("imageAlt", {
					batch: Number(o.metadata?.batch_index ?? 0) + 1,
					image: e + 1
				}), "alt"), f.href = l, f.className = "ui-button", f.download = `steam-career-${o.metadata?.batch_index ?? 0}-${e + 1}.png`, u.append(d, f), B.append(u);
			}
			i.entries.length || B.append(D("p", w("noResults"))), V();
		}
	}, de = async () => {
		if (k(), !h || !x()) return;
		let e = p, t = h.job_id;
		try {
			let n = await re().status(t);
			if (!S(e) || h?.job_id !== t) return;
			U(n), ["queued", "running"].includes(h.status) ? f = setTimeout(() => {
				de();
			}, 1500) : await ue(null);
		} catch (t) {
			me(t, e);
		}
	}, fe = N("job-cancel", w("cancel"), async () => {
		if (!h || !["queued", "running"].includes(h.status)) return;
		k();
		let e = ++p, t = await re().cancel(h.job_id, h.revision);
		S(e) && (U(t), await de());
	}, ce), pe = () => {
		m += 1, b = 0, g = null, ne(), B.replaceChildren();
	}, me = (e, t) => {
		if (S(t)) {
			if (!ee.has(e?.message)) {
				o(e?.[T] || w("operationFailed"), "error");
				return;
			}
			d = !0, p += 1, k(), pe(), _ = !1, y = null, h = null, I.value = "", oe.value = "";
			try {
				s.defaultView.sessionStorage.removeItem(H);
			} catch {}
			z("authorityLost"), o(w("authorityChanged"), "error"), V();
		}
	}, W = N("job-retry", w("retry"), async () => {
		if (!h || ![
			"failed",
			"cancelled",
			"interrupted"
		].includes(h.status)) return;
		k(), pe();
		let e = ++p, t = await re().retry(h.job_id, h.revision);
		S(e) && (U(t), await de());
	}, ce), he = N("job-next", w("next"), async () => {
		g && await ue(g);
	}, ce);
	he.disabled = !0, N("job-results", w("results"), async () => {
		await ue(null);
	}, ce), N("job-refresh", w("refresh"), async () => {
		I.value.trim() && (k(), pe(), p += 1, h = { job_id: I.value.trim() }, await de());
	}, ce), fe.disabled = !0, W.disabled = !0, l.push(ie.bind(() => {
		x() && !_ && (async () => {
			let e = ++p;
			k(), pe();
			try {
				let t = Object.fromEntries(Object.entries(M).map(([e, t]) => [e, e === "all_apps" ? t.value === "true" : t.value]));
				if (t.account = oe.value.trim(), !t.account) throw E("accountRequired");
				if (/^[0-9]+$/u.test(t.account)) {
					let e = BigInt(t.account);
					t.account = String(e < 4294967296n ? e + 76561197960265728n : e);
				}
				try {
					t.limit = t.limit_mode === "all" ? 500 : i(se.value, (e) => e);
				} catch (e) {
					throw E("invalidLimit", () => C(e.message));
				}
				if (t.mode === "legacy" && (t.limit > 200 || t.limit_mode === "all")) throw E("legacyLimit");
				_ = !0, V();
				let n = JSON.stringify(t);
				(!y || y.fingerprint !== n) && (y = {
					fingerprint: n,
					key: s.defaultView.crypto.randomUUID()
				});
				let r = await re().submit({
					handler_id: "steam_wall",
					parameters: t,
					idempotency_key: y.key
				});
				if (!S(e)) return;
				U(r), y = null, o(w("submitted"), "success"), await de();
			} catch (t) {
				me(t, e);
			} finally {
				S(e) && (_ = !1, V());
			}
		})();
	})), A.insertBefore(ae, F), A.insertBefore(P, F), A.append(ce), e.append(D("p", w("description")), ...t.presentation?.template ? [] : [D("h3", w("create"))], A), ie.result(L, B), t.presentation?.actions(ae), t.presentation?.actions(ce), V();
	try {
		let e = s.defaultView.sessionStorage.getItem(H);
		e && (I.value = e, h = { job_id: e }, de());
	} catch {}
	return {
		setAvailable(e) {
			u || d || (p += 1, pe(), k(), _ = !1, y = null, h = null, g = null, z(e ? "available" : "unavailable"), V());
		},
		dispose() {
			u || (u = !0, p += 1, m += 1, _ = !1, y = null, k(), ne(), B.replaceChildren(), z("disposed"), V(), R?.(), l.splice(0).forEach((e) => e()));
		}
	};
}
//#endregion
//#region packages/steam_dlc/pages/src/wishlist-controller.js
function b(e, { options: t, active: n, field: r, say: i }) {
	let a = e.ownerDocument, o = [], s = 0, c = !1, l = !1, u = 1, d = 1, { text: f, bind: p } = t.copy, m = (e, t) => () => f(`wishlist.${e}`, t), h = Symbol(), g = (e) => Object.assign(Error(e), { [h]: e }), _ = (e, t) => {
		let n = a.createElement(e);
		return t && p(n, t), n;
	}, y = (e, t, n) => {
		e.addEventListener(t, n), o.push(() => e.removeEventListener(t, n));
	}, b = v(e, t, {
		id: "wishlist-query",
		label: m("query")
	}), { body: x, actions: S } = b, ee = t.presentation?.grid(x) || x, C = r(ee, "account", m("account")), te = r(ee, "country", m("region"), null, "CN"), w = r(ee, "language", m("language"), null, "schinese"), T = _("button", m("previous")), E = _("button", m("next"));
	for (let [e, t] of [[T, "wishlist-previous"], [E, "wishlist-next"]]) e.type = "button", e.className = "ui-button", e.dataset.action = t, e.disabled = !0;
	S.append(T, E), x.append(S);
	let D = _("section");
	D.className = "steam-dlc-public-result", D.setAttribute("aria-live", "polite");
	let O = () => {
		let e = c || !n();
		b.sync(e, l), T.disabled = e || l || u <= 1, E.disabled = e || l || u >= d;
		for (let e of x.querySelectorAll("input,select")) e.disabled = c || !n();
	}, k = async (e) => {
		if (!n() || c || l) return;
		let r = {
			account: C.value.trim(),
			country: te.value.trim().toUpperCase(),
			language: w.value.trim(),
			page: e
		};
		if (!r.account) {
			i(m("accountRequired"), "error");
			return;
		}
		let a = ++s;
		l = !0, O();
		try {
			let i = await t.services.invoke("wishlist_explicit", r);
			if (c || !n() || a !== s) return;
			if (i?.status === "error") {
				let e = [
					"not_public",
					"rate_limited",
					"upstream_error",
					"unparsed",
					"parameter_error",
					"module_unavailable"
				], t = i.error?.code;
				throw g(e.includes(t) ? `error.${t}` : "sourceUnavailable");
			}
			let o = i?.document?.blocks?.find((e) => e?.kind === "fields" && e.fields?.wishlist)?.fields.wishlist;
			if (!o || !Array.isArray(o.items) || o.items.length > 20 || !Number.isSafeInteger(o.pages) || o.page !== e) throw Error("wishlist_result_invalid");
			u = o.page, d = o.pages, D.replaceChildren(_("p", () => f("wishlist.summary", {
				total: o.total,
				page: o.page,
				pages: o.pages,
				region: o.region,
				fetchedAt: o.fetched_at,
				storeFetchedAt: o.store_fetched_at || f("wishlist.notFetched")
			})));
			for (let e of o.items) {
				let t = _("article"), n = _("a", () => f("wishlist.itemTitle", {
					name: e.name || f("wishlist.nameUnavailable"),
					appId: e.app_id
				}));
				if (!/^[1-9][0-9]*$/u.test(e.app_id)) throw Error("wishlist_app_id_invalid");
				n.href = `https://store.steampowered.com/app/${e.app_id}/`, n.target = "_blank", n.rel = "noopener noreferrer";
				let r = (/* @__PURE__ */ new Date(e.date_added * 1e3)).toISOString(), i = [
					"free",
					"unreleased",
					"no_local_price",
					"region_locked",
					"region_or_store_unavailable",
					"fetch_failed"
				], a = ["unreleased", "released"];
				t.append(n, _("p", () => f("wishlist.itemDetails", {
					addedAt: r,
					price: e.price || f(`wishlist.price.${i.includes(e.price_state) ? e.price_state : "unknown"}`),
					currency: e.currency || f("wishlist.notProvided"),
					discount: e.discount_percent == null ? f("wishlist.unknown") : `${e.discount_percent}%`,
					release: f(`wishlist.release.${a.includes(e.release_state) ? e.release_state : "unknown"}`)
				}))), D.append(t);
			}
			o.state === "empty" && D.append(_("p", m("empty"))), o.enrichment_failed && D.append(_("p", m("enrichmentFailed"))), T.disabled = u <= 1, E.disabled = u >= d;
		} catch (e) {
			!c && n() && a === s && (D.replaceChildren(_("p", m(e?.[h] || "requestFailed"))), i(m("queryFailed"), "error"));
		} finally {
			!c && a === s && (l = !1, O());
		}
	};
	return o.push(b.bind(() => k(1))), y(T, "click", () => {
		u > 1 && k(u - 1);
	}), y(E, "click", () => {
		u < d && k(u + 1);
	}), e.append(_("p", m("description")), ...t.presentation?.template ? [] : [_("h3", m("filters"))], x), b.result(_("h3", m("results")), D), t.presentation?.actions(S), O(), {
		setAvailable() {
			c || (s += 1, l = !1, u = 1, d = 1, D.replaceChildren(), O());
		},
		dispose() {
			c || (c = !0, s += 1, l = !1, D.replaceChildren(), O(), o.splice(0).forEach((e) => e()));
		}
	};
}
//#endregion
//#region packages/steam_dlc/pages/src/controller.js
var x = "steam", S = (e) => Object.freeze({ steam: ((e) => ({
	title: "Steam",
	summary: e("module.steam.summary"),
	source: e("module.steam.source"),
	commands: [
		["/ygl steam bind <Dota ID32、SteamID64 或 profiles URL>", e("help.linkYourSteamAccountInA")],
		["/ygl steam binding", e("help.viewYourLinkedAccountInA")],
		["/ygl steam unbind", e("help.unlinkYourAccountInADirect")],
		["/ygl steam search <游戏名或 AppID> [--country CC] [--language english]", e("help.theStoreDefaultsAreCnAnd")],
		["/ygl steam app <AppID> [--country CC] [--language english]", e("help.viewStoreDetailsAndCurrentPrices")],
		["/ygl steam profile [账号]", e("help.viewAPublicProfileWithSeparate")],
		["/ygl steam recent [账号]", e("help.viewTheRecentPublicSampleShown")],
		["/ygl steam games [账号]", e("help.viewTheAvailablePublicSampleFull")],
		["/ygl steam wall [账号] [--source games|recent|full] [--all-apps] [--limit N] [--refresh]", e("help.createAGameHistoryCollageSaved")],
		["/ygl steam wall status|result|cancel|retry <任务ID>", e("help.checkYourJobStatusOrResults")],
		["/ygl steam status", e("help.viewUsageHelp")],
		["/ygl steam wishlist [账号] [--page N] [--country CN]", e("help.viewAPublicWishlistAnonymously20")]
	]
}))((t) => e(t, "steam")) }), ee = S((e, t) => e), C = (e, t = (e, t) => g(e, t, "zh-CN", "cs2")) => te({
	waiting: t("authorization.waitingForScanConfirmation"),
	authorized: t("authorization.authorized"),
	completed: t("authorization.authorizationComplete"),
	cancelled: t("authorization.cancelled"),
	expired: t("authorization.expired"),
	failed: t("authorization.authorizationFailed")
}, e, t("authorization.statusUnknown")), te = (e, t, n) => Object.hasOwn(e, t) ? e[t] : n, w = (e, t) => JSON.stringify(e) === JSON.stringify(t), T = (e) => JSON.stringify([
	e.owner,
	e.runtimeId,
	e.epoch,
	e.boundary
]), E = (e) => typeof e?.message == "string" ? e.message : "", D = /* @__PURE__ */ new Set([
	"admin_authorization_denied",
	"page_revoked",
	"page_unavailable",
	"stale_context"
]), O = Object.freeze({
	steam: [
		"reply_theme",
		"poster_source",
		"poster_mode",
		"poster_preset",
		"poster_aspect",
		"poster_quality",
		"poster_fit",
		"poster_include_apps",
		"poster_limit_mode",
		"poster_limit"
	],
	dota2: [
		"timezone",
		"reply_theme",
		"subscription_enabled",
		"poll_interval_seconds",
		"opendota_rph",
		"commentary_enabled"
	],
	cs2: ["reply_theme", "default_platform"],
	deadlock: ["reply_theme"]
}), k = (e, t) => {
	let n = { reply_theme: e("setting.replyTheme") };
	return t === "steam" && Object.assign(n, {
		poster_source: e("setting.gameLibrarySource"),
		poster_mode: e("setting.collageLayout"),
		poster_preset: e("setting.playtimePreset"),
		poster_aspect: e("setting.outputAspectRatio"),
		poster_quality: e("setting.outputQuality"),
		poster_fit: e("setting.coverFit"),
		poster_include_apps: e("setting.includeAllAppsIncludingSoftware"),
		poster_limit: e("setting.itemLimit"),
		poster_limit_mode: e("choice.itemCountMode")
	}), t === "dota2" && Object.assign(n, {
		timezone: e("setting.outputTimeZone"),
		subscription_enabled: e("setting.enableMatchSubscriptions"),
		poll_interval_seconds: e("setting.subscriptionCheckIntervalSeconds"),
		opendota_rph: e("setting.hourlyRequestLimit"),
		commentary_enabled: e("setting.enableModelCommentary")
	}), t === "cs2" && (n.default_platform = e("setting.defaultCs2Source")), n;
}, ne = (e, t) => {
	let n = { standard: e("choice.standard") };
	return t === "steam" && Object.assign(n, {
		games: e("choice.publicProfileSample"),
		recent: e("choice.recentPublicSample"),
		full: e("choice.fullLibraryKeyRequired"),
		dense: e("route.collage"),
		legacy: e("choice.legacyLayout"),
		single: e("choice.singlePlayer"),
		long: e("choice.longPlay"),
		normal: e("choice.standard"),
		hd: e("choice.highDefinition"),
		cover: e("choice.cropToFill"),
		contain: e("choice.showFullCover"),
		top: e("choice.topNByPlaytime"),
		all: e("choice.unlimitedAsReturnedByTheSource")
	}), [
		"dota2",
		"cs2",
		"deadlock"
	].includes(t) && Object.assign(n, {
		profile: e("choice.playerProfile"),
		stats: e("choice.playerStats"),
		last: e("choice.latestMatch"),
		match: e("choice.matchDetails")
	}), t === "dota2" && (n.opendota = e("choice.opendotaKeyOptional")), t === "cs2" && Object.assign(n, {
		perfect: e("choice.perfectWorld"),
		official: e("choice.officialMatchesRecordedByPerfectWorld"),
		"5e": "5E"
	}), n;
}, re = (e, t) => t === "steam" ? { steam: [["credential_steam_key", "Steam Web API Key"]] } : t === "dota2" ? { dota2: [["credential_opendota_key", e("choice.opendotaKeyOptional")]] } : t === "cs2" ? { cs2: [["credential_perfect", e("choice.perfectWorldQrAuthorization")], ["credential_fivee", e("choice.5eSessionToken")]] } : {};
function ie(e, t = g) {
	if (typeof e != "string" || e.length > 128) throw Error(t("validation.enterACompleteFiniteNumber"));
	let n = e.trim(), r = /^([+-]?)(?:(\d+)(?:\.(\d*))?|\.(\d+))(?:[eE]([+-]?\d+))?$/u.exec(n);
	if (!r) throw Error(t("validation.enterACompleteFiniteNumberWithout"));
	let i = r[3] ?? r[4] ?? "", a = (r[2] || "0") + i, o = Number(r[5] || 0) - i.length;
	if (!Number.isSafeInteger(o) || o > 128) throw Error(t("validation.theCountExceedsTheSafeRange"));
	let s = BigInt(a);
	if (s = o < -256 ? 0n : o >= 0 ? s * 10n ** BigInt(o) : s / 10n ** BigInt(-o), r[1] === "-" && (s = -s), s > BigInt(2 ** 53 - 1)) throw Error(t("validation.theCountExceedsTheSafeRange"));
	if (s < 20n) throw Error(t("validation.theCountMustBeAtLeast"));
	return Number(s);
}
var A = Uint32Array.from({ length: 256 }, (e, t) => {
	let n = t;
	for (let e = 0; e < 8; e++) n = n & 1 ? 3988292384 ^ n >>> 1 : n >>> 1;
	return n >>> 0;
});
function ae(e, t, n = g) {
	let r = e instanceof Uint8Array;
	if (!r && (typeof e != "string" || !e.length || e.length > 24e6 || e.length % 4 || !/^[A-Za-z0-9+/]*={0,2}$/u.test(e))) throw Error(n("validation.theImageCouldNotBeVerified"));
	let i = r ? Array.from({ length: Math.ceil(e.length / 32768) }, (t, n) => String.fromCharCode(...e.subarray(n * 32768, (n + 1) * 32768))).join("") : t.atob(e);
	if (!i.startsWith("PNG\r\n\n")) throw Error("invalid_images");
	let a = r ? e : Uint8Array.from(i, (e) => e.charCodeAt(0)), o = (e) => (a[e] << 24 | a[e + 1] << 16 | a[e + 2] << 8 | a[e + 3]) >>> 0, s = 8, c = !1, l = !1, u = !1, d = !1, f = 0, p = !1;
	for (; s + 12 <= a.length;) {
		let e = o(s), t = s + e + 12;
		if (t > a.length) throw Error("invalid_images");
		let n = i.slice(s + 4, s + 8);
		if (!/^[A-Za-z]{4}$/u.test(n) || !c && n !== "IHDR") throw Error("invalid_images");
		let r = 4294967295;
		for (let e = s + 4; e < t - 4; e++) r = A[(r ^ a[e]) & 255] ^ r >>> 8;
		if ((r ^ 4294967295) >>> 0 !== o(t - 4)) throw Error("invalid_images");
		if (n === "IHDR") {
			let t = a[s + 16], n = a[s + 17];
			if (c || e !== 13 || !o(s + 8) || !o(s + 12) || !{
				0: [
					1,
					2,
					4,
					8,
					16
				],
				2: [8, 16],
				3: [
					1,
					2,
					4,
					8
				],
				4: [8, 16],
				6: [8, 16]
			}[n]?.includes(t) || a[s + 18] !== 0 || a[s + 19] !== 0 || a[s + 20] > 1) throw Error("invalid_images");
			c = !0, p = n === 3;
		} else if (n === "PLTE") {
			if (l || u || !e || e > 768 || e % 3) throw Error("invalid_images");
			l = !0;
		} else if (n === "IDAT") {
			if (d || p && !l) throw Error("invalid_images");
			u = !0, f += e;
		} else if (n === "IEND") {
			if (e || !f || t !== a.length) throw Error("invalid_images");
			return a;
		} else {
			if (n[0] === n[0].toUpperCase()) throw Error("invalid_images");
			u && (d = !0);
		}
		s = t;
	}
	throw Error("invalid_images");
}
var j = /* @__PURE__ */ new Map(), oe = 4, M = 4096, se = 256;
function ce(e, t, n) {
	for (let [n, r] of j) r.owner === e.owner && n !== t && j.delete(n);
	if (!n || t.length > M) return null;
	let r = j.get(t) || {
		owner: e.owner,
		drafts: /* @__PURE__ */ new Map(),
		token: null
	};
	for (r.token = Symbol("ordinary-draft-mount"), j.delete(t), j.set(t, r); j.size > oe;) j.delete(j.keys().next().value);
	return r;
}
function N(e, t) {
	let n = e.ownerDocument, r = { ...t.context }, i = x, a = t.presentation?.template, o = t.copy || _(() => r.locale, void 0, i), s = o.text, c = t.themeLabel || ((e, t) => e === null && t === o.textAt("zh-CN", "choice.followCore") ? s("choice.followCore") : t), l = (e, t) => {
		let n = "configHint." + e;
		return o.textAt("zh-CN", n) === t ? s(n) : t;
	}, u = (e, t, n) => te(e(s), t, n), d = T(t.context), f = ee[i], p = () => k(s, i), m = () => ne(s, i), h = re(s, i), g = f ? ce(t.context, d, t.routeId === "settings") : null, v = g?.token, A = !1, oe = !1, M = !1, N = 0, P = !1, le = !1, F = null, I = !1, L = !1, R = null, z = 0, B, V = null, H = null, U = !1, ue = 0, de = () => {}, fe = () => {}, pe = [], me = [], W = /* @__PURE__ */ new Map(), he = () => {}, ge = 0, _e = "", ve = 0, ye = null, be = () => {}, G = new Map(g?.drafts), K = /* @__PURE__ */ new Map(), xe = [], q = (e, t, r) => {
		let i = n.createElement(e);
		return typeof t == "function" ? o.bind(i, t) : t !== void 0 && (i.textContent = t), r && (i.className = r), i;
	}, Se = (e, t, n) => {
		e.addEventListener(t, n), xe.push(() => e.removeEventListener(t, n));
	}, J = q("section", void 0, "steam-dlc-page"), Ce = q("p", "", "steam-dlc-hint");
	Ce.setAttribute("role", "status");
	let we = q("p", "", "steam-dlc-message");
	we.setAttribute("role", "status"), we.setAttribute("aria-live", "polite"), a || J.append(Ce), e.replaceChildren(J);
	let Y = () => ((t.scope.signal.aborted || !t.scope.isCurrent()) && (M = !0), !A && !oe && !M && T(r) === d && (!g || j.get(d) === g && g.token === v)), X = () => Y() && r.available, Te = () => Object.freeze({
		ordinary: G.size > 0,
		credentials: Y() && ([...W.values()].some((e) => !!e.input?.value) || V?.state === "waiting"),
		pending: P || I,
		version: ge
	}), Ee = () => {
		let e = JSON.stringify([
			G.size > 0,
			P,
			ve,
			Te().credentials,
			I
		]);
		e !== _e && (_e = e, ge += 1, t.onNavigationStateChange?.());
	}, De, Oe = () => {
		let e = typeof De?.text == "function" ? De.text() : De?.text;
		a ? a.publish({ notice: e ? {
			key: "custom",
			text: e,
			tone: De.tone,
			role: "status"
		} : void 0 }) : we.textContent = e || "";
	}, Z = (e, t = "warning") => {
		ye !== null && (clearTimeout(ye), ye = null), De = {
			text: e,
			tone: t
		}, Oe(), we.dataset.tone = t, e && t === "success" && (ye = setTimeout(() => {
			ye = null, Y() && (De = void 0, Oe());
		}, 3500));
	}, ke = () => {
		J.dataset.theme = r.theme, Ce.textContent = Y() ? r.available ? s("availability.thisPageIsAvailableCheckRuntime") : s("availability.thisPageIsUnavailableRefreshIts") : s("availability.thisPageContextExpiredOpenThe");
	}, Q, Ae, je, Me, Ne, Pe = () => {
		g && Y() && (g.drafts = new Map([...G].filter(([e, t]) => {
			let n = O[i]?.includes(e), r = t.rawValue ?? t.value;
			return n && (t.kind === "clear" || t.kind === "set" && [
				"string",
				"boolean",
				"number"
			].includes(typeof r) && !(typeof r == "number" && !Number.isFinite(r)) && !(typeof r == "string" && r.length > se));
		})));
	}, Fe = () => {
		(g ? j.get(d) === g && g.token === v : t.routeId === "home") && j.delete(d), oe = !0, N += 1, P = !1, le = !1, G.size && (ve += 1), G.clear(), F = null, a?.publish({
			themeField: void 0,
			themeValue: "",
			themeError: void 0
		});
		for (let { control: e } of K.values()) e.value = "";
		z += 1, rt(), nt(), R = null, V = null, I = !1, L = !1;
	}, $ = () => {
		if (Pe(), ke(), J.setAttribute("aria-busy", String(P || I)), a && (a.publish({
			availability: Ce.textContent,
			pending: P || I
		}), t.routeId === "home" && a.actionState("refresh", {
			disabled: !X(),
			busy: P
		}), Q && (a.actionState("save", {
			disabled: !X() || V?.state === "waiting" || !P && (!le || !G.size),
			busy: P || I
		}), a.actionState("refresh", { disabled: !X() }), a.actionState("discard", { disabled: !X() || !G.size }), a.publish({ themeReadonly: !X() || !F }), Ne?.setAttribute("aria-disabled", String(!X() || !F)))), Q) {
			Ae?.setAttribute("aria-disabled", String(!X() || P || I || V?.state === "waiting" || !le || !G.size)), je?.setAttribute("aria-disabled", String(!X() || P || I)), Me?.setAttribute("aria-disabled", String(!X() || P || I || !G.size));
			for (let { control: e, reset: t } of K.values()) e.disabled = !X() || !F, t.setAttribute("aria-disabled", String(!X() || !F));
		}
		Ze && Ze.setAttribute("aria-disabled", String(!X() || P)), he(), Ee();
	}, Ie = [], Le = (e) => {
		if (!e || !Number.isSafeInteger(e.revision) || e.revision < 1 || !e.fields || !e.descriptors || (Ie = (O[i] || []).filter((t) => e.fields[t] && e.descriptors[t]), !Ie.includes("reply_theme"))) throw Error("invalid_snapshot");
		for (let t of Ie) {
			let n = e.fields[t], r = e.descriptors[t];
			if (!n || !r || typeof r.description != "string" || t === "reply_theme" && (!Array.isArray(r.choices) || !r.choices.length || !r.choices.some((e) => e.value === null) || r.choices.some((e) => typeof e.label != "string" || e.value !== null && typeof e.value != "string")) || t === "timezone" && r.value_schema?.type !== "string" || t === "poster_include_apps" && (r.value_schema?.type !== "boolean" || typeof r.default != "boolean" || typeof n.value != "boolean") || t === "poster_limit" && (r.value_schema?.type !== "integer" || ![1, 20].includes(r.value_schema.minimum) || !Number.isInteger(r.default) || !Number.isInteger(n.value))) throw Error("invalid_snapshot");
		}
		return e;
	}, Re = (e) => {
		let t = G.get(e);
		return t ? t.kind === "clear" ? F.descriptors[e].default : t.value : F.fields[e].value;
	}, ze = (e) => e === "reply_theme" ? F.descriptors[e].choices.map(({ value: e, label: t }) => ({
		value: e,
		label: c(e, t)
	})) : e === "poster_include_apps" ? [{
		value: !1,
		label: s("settings.gamesOnly")
	}, {
		value: !0,
		label: s("settings.allApps")
	}] : F.descriptors[e].value_schema?.type === "boolean" ? [{
		value: !1,
		label: s("settings.off")
	}, {
		value: !0,
		label: s("settings.on")
	}] : F.descriptors[e].choices || F.descriptors[e].value_schema?.enum?.map((e) => ({
		value: e,
		label: u(m, e, String(e))
	})), Be = (e) => !!ze(e), Ve = (e, t) => {
		if (!X() || !F) return;
		let n = F.fields[e], r = !P && (t.kind === "clear" ? !n.present : n.state === "valid" && w(n.value, t.value)) ? void 0 : t;
		if (w(G.get(e), r)) return;
		r === void 0 ? G.delete(e) : G.set(e, r), ve += 1, a && e === "reply_theme" ? a.publish({ themeError: void 0 }) : o.bind(K.get(e).error, () => ""), K.get(e)?.control.setAttribute("aria-invalid", "false");
		let i = G.size && (!g || [...G.values()].some((e) => e.kind === "set" && typeof (e.rawValue ?? e.value) == "string" && (e.rawValue ?? e.value).length > se));
		Z(i ? () => s("settings.draftTooLong") : G.size ? () => s("settings.youHaveUnsavedChanges") : "", "warning"), $();
	}, He = () => {
		if (a) {
			let e = "reply_theme", t = F.descriptors[e], n = ze(e);
			a.publish({
				themeField: {
					id: e,
					label: u(p, e, e),
					control: "select",
					hint: l(e, t.description),
					choices: n.map(({ label: e }, t) => ({
						value: String(t),
						label: e
					}))
				},
				themeValue: String(n.findIndex((t) => w(t.value, Re(e)))),
				themeError: F.fields[e].state !== "valid" && !G.has(e) ? s("settings.invalidCurrentValue") : void 0
			});
		}
	}, Ue = () => {
		He();
		for (let [e, { control: t }] of K) Be(e) && ze(e).forEach(({ label: e }, n) => {
			t.options[n] && (t.options[n].textContent = e);
		});
	}, We = () => {
		He();
		for (let [e, { control: t, error: n, hint: r }] of K) {
			o.bind(r, () => l(e, F?.descriptors[e]?.description || ""));
			let i = Re(e);
			if (Be(e)) {
				let n = ze(e);
				t.replaceChildren(...n.map((e, t) => {
					let n = q("option", e.label);
					return n.value = String(t), n;
				})), t.value = String(n.findIndex((e) => w(e.value, i)));
			} else t.value = G.get(e)?.rawValue === void 0 ? typeof i == "string" || typeof i == "number" ? String(i) : "" : G.get(e).rawValue;
			let a = F.fields[e].state !== "valid" && !G.has(e);
			o.bind(n, a ? () => s("settings.invalidCurrentValue") : () => ""), t.setAttribute("aria-invalid", String(!!n.textContent));
		}
	}, Ge = !1, Ke = () => {
		let e = /* @__PURE__ */ new Map(), n = (e) => e.startsWith("poster_") ? "poster" : "workspace", r = {
			poster: "route.collage",
			subscriptions: "section.subscriptions",
			workspace: "section.queryAndReply"
		};
		for (let o of Ie) {
			if (a && o === "reply_theme") {
				a.bind(o, (e) => {
					if (!X() || !F) return;
					let t = ze(o)[Number(e)];
					t && Ve(o, t.value === null ? { kind: "clear" } : {
						kind: "set",
						value: t.value
					}), We();
				});
				let e = q("button", () => a.text("resetDefault"), "ui-button");
				Ne = e, e.type = "button", e.dataset.action = "reset-reply_theme", Se(e, "click", () => {
					X() && F && (Ve(o, { kind: "clear" }), We());
				}), Q.append(e);
				continue;
			}
			let c = n(o);
			if (!e.has(c)) {
				let n = q("section", void 0, "steam-dlc-config-group");
				a ? (a.groupHost(c) || Q).append(n) : (n.append(q("h3", () => s(r[c]))), Q.insertBefore(n, Q.querySelector(":scope > .steam-dlc-actions"))), e.set(c, {
					section: n,
					grid: t.presentation?.grid(n)
				});
			}
			let { section: d, grid: f } = e.get(c), m = F.descriptors[o], h = q("div", void 0, "steam-dlc-field"), g = q("label", () => u(p, o, o)), _ = q(Be(o) ? "select" : "input");
			_.className = "ui-control", _.id = `steam-dlc-${i}-${o}`, g.htmlFor = _.id, _.name = o;
			let v = q("p", () => l(o, m.description), "steam-dlc-hint");
			v.id = `${_.id}-hint`;
			let y = q("p", "", "steam-dlc-field-error");
			y.id = `${_.id}-error`, _.setAttribute("aria-describedby", `${v.id} ${y.id}`), o === "timezone" && (_.type = "text", _.autocomplete = "off", _.maxLength = Math.min(m.value_schema.maxLength ?? se, se)), !Be(o) && m.value_schema?.type === "integer" && (_.type = "number", _.min = String(m.value_schema.minimum), m.value_schema.maximum !== void 0 && (_.max = String(m.value_schema.maximum)), _.step = "1", o === "poster_limit" && (_.type = "text", _.inputMode = "decimal", _.removeAttribute("min"), _.removeAttribute("max")));
			let b = q("button", () => a?.text("resetDefault") || s("settings.restoreDefault"));
			b.className = "ui-button", b.type = "button", b.dataset.action = `reset-${o}`, Se(b, "click", () => {
				X() && F && (Ve(o, { kind: "clear" }), We());
			});
			let x = q("div", void 0, "steam-dlc-actions");
			if (x.append(b), o === "poster_limit") for (let e of [
				20,
				50,
				100,
				200,
				500,
				1e3,
				"all"
			]) {
				let t = q("button", () => e === "all" ? s("settings.unlimited") : String(e), "ui-button");
				t.type = "button", Se(t, "click", () => {
					if (X() && F) {
						if (K.has("poster_limit_mode") && Ve("poster_limit_mode", {
							kind: "set",
							value: e === "all" ? "all" : "top"
						}), e !== "all") Ve(o, {
							kind: "set",
							value: e
						});
						else if (!K.has("poster_limit_mode")) {
							Z(() => s("settings.unlimitedModeUnavailable"), "warning");
							return;
						}
						We();
					}
				}), x.append(t);
			}
			Se(_, Be(o) ? "change" : "input", () => {
				if (X() && F) {
					if (Be(o)) {
						let e = ze(o)[Number(_.value)];
						if (!e) return;
						Ve(o, e.value === null ? { kind: "clear" } : {
							kind: "set",
							value: e.value
						});
					} else if (m.value_schema?.type === "integer") {
						let e = _.value;
						if (o === "poster_limit") {
							try {
								Ve(o, {
									kind: "set",
									value: ie(e, s)
								});
							} catch {
								Ve(o, {
									kind: "set",
									value: null,
									rawValue: e
								});
							}
							return;
						}
						Ve(o, o === "opendota_rph" && e === "" ? { kind: "clear" } : _.validity.valid && e !== "" ? {
							kind: "set",
							value: Number(e)
						} : {
							kind: "set",
							value: null,
							rawValue: e
						});
					} else Ve(o, {
						kind: "set",
						value: _.value
					});
				}
			});
			let S = f && t.presentation.field(f, {
				control: _,
				reset: x,
				label: g,
				hint: v,
				error: y
			});
			K.set(o, {
				control: _,
				reset: b,
				error: S?.error || y,
				hint: S?.hint || v
			}), S || (h.append(g, _, x, v, y), d.append(h));
		}
	}, qe = (e) => {
		F = Le(e);
		for (let [e, t] of G) {
			let n = F.fields[e];
			(t.kind === "clear" ? !n.present : n.state === "valid" && w(n.value, t.value)) && (G.delete(e), ve += 1);
		}
		Ge ||= (Ke(), !0), We(), le = !0;
	}, Je = async (e = !1) => {
		if (!X() || P || I) return;
		e && nt();
		let n = ++N;
		P = !0, $();
		try {
			if (!X() || n !== N) return;
			let r = await t.services.config.current();
			if (!X() || n !== N) return;
			qe(r);
			try {
				await at();
			} catch (e) {
				if (!X() || n !== N) return;
				it(e), X() && Z(() => s("settings.readWithUnconfirmedCredentials"), "warning");
				return;
			}
			if (!X() || n !== N) return;
			Z(G.size ? () => s("settings.refreshedWithDraft") : e ? () => s("settings.refreshed") : "", G.size ? "warning" : "success");
		} catch (e) {
			if (!X() || n !== N) return;
			if (D.has(E(e))) {
				Fe(), Z(() => s("settings.authorizationExpired"), "error"), $();
				return;
			}
			le = !1, Z(() => s("settings.settingsCouldNotBeReadCheck"), "error");
		} finally {
			Y() && n === N && (P = !1, $());
		}
	}, Ye = () => {
		let e = !0;
		for (let [t, n] of G) {
			if (n.kind === "clear") continue;
			let r = F.descriptors[t], i;
			if (t === "timezone") {
				let e = r.value_schema;
				if (typeof n.value != "string" || n.value.length < (e.minLength ?? 0) || n.value.length > (e.maxLength ?? Infinity)) i = () => s("settings.enterAnIanaTimeZoneWithin");
				else try {
					new Intl.DateTimeFormat("zh-CN", { timeZone: n.value }).format();
				} catch {
					i = () => s("settings.enterAValidIanaTimeZone");
				}
			} else if (r.value_schema?.type === "integer") {
				let e = r.value_schema;
				if ((n.rawValue !== void 0 || !Number.isSafeInteger(n.value) || n.value < e.minimum || n.value > e.maximum) && (i = () => s("settings.integerRange", {
					minimum: e.minimum,
					maximum: e.maximum
				})), t === "poster_limit") {
					let e = n.rawValue ?? String(n.value);
					try {
						ie(e, s);
					} catch {
						i = () => {
							try {
								ie(e, s);
							} catch (e) {
								return e.message;
							}
						};
					}
				}
			} else Be(t) && !ze(t).some((e) => w(e.value, n.value)) && (i = () => s("settings.chooseAnAvailableOption"));
			a && t === "reply_theme" ? a.publish({ themeError: i?.() }) : (o.bind(K.get(t).error, i || (() => "")), K.get(t).control.setAttribute("aria-invalid", String(!!i))), i && (e = !1);
		}
		return K.has("poster_mode") && Re("poster_mode") === "legacy" && Re("poster_limit") > 200 && (o.bind(K.get("poster_limit").error, () => s("settings.legacyLimit")), K.get("poster_limit").control.setAttribute("aria-invalid", "true"), e = !1), e;
	}, Xe = async () => {
		if (!X() || P || I || V?.state === "waiting" || !le || !G.size || !Ye()) return;
		let e = new Map(G), n = {}, r = [];
		for (let [t, i] of e) i.kind === "clear" ? r.push(t) : n[t] = i.value;
		let i = F.revision, a = !1, o = ++N;
		P = !0, le = !1, Z(() => s("settings.savingPleaseWaitForConfirmation")), $();
		let c = (e) => {
			if (!e || !Number.isSafeInteger(e.revision) || e.revision <= i) throw Error("invalid_receipt");
			i = e.revision, a = !0;
		};
		try {
			if (!X() || o !== N) return;
			if (Object.keys(n).length) {
				let e = await t.services.config.save(i, n);
				if (!X() || o !== N) return;
				c(e);
			}
			if (r.length) {
				let e = await t.services.config.clear(i, r);
				if (!X() || o !== N) return;
				c(e);
			}
			let a = await t.services.config.current();
			if (!X() || o !== N) return;
			if (Le(a), a.revision < i) throw Error("unverified_snapshot");
			for (let [t, n] of e) {
				let e = a.fields[t];
				if (n.kind === "clear" ? e.present : e.state !== "valid" || !w(e.value, n.value)) throw Error("unverified_snapshot");
			}
			for (let [t, n] of e) G.get(t) === n && (G.delete(t), ve += 1);
			qe(a);
			try {
				await at();
			} catch (e) {
				if (!X() || o !== N) return;
				it(e), X() && Z(() => s("settings.savedWithUnconfirmedCredentials"), "warning");
				return;
			}
			if (!X() || o !== N) return;
			Z(G.size ? () => s("settings.savedWithNewerDraft") : () => s("settings.saved"), G.size ? "warning" : "success");
		} catch (e) {
			if (!X() || o !== N) return;
			if (D.has(E(e))) {
				Fe(), Z(() => s("settings.authorizationExpired"), "error"), $();
				return;
			}
			let t = E(e) === "revision_conflict";
			Z(a ? () => s("settings.partialWriteUnverified") : t ? () => s("settings.configConflict") : E(e) === "invalid_config" ? () => s("settings.invalidConfig") : () => s("settings.saveUnverified"), "error");
		} finally {
			Y() && o === N && (P = !1, $());
		}
	}, Ze, Qe, $e = 0, et = (e) => {
		let t = e;
		if (!t || t.schema_version !== 1 || !["success", "partial_success"].includes(t.status) || t.privacy !== "public" || !t.document || !Array.isArray(t.document.blocks)) throw Error("invalid_cache_status");
		for (let e of t.document.blocks) {
			if (e?.kind !== "fields" || !e.fields || typeof e.fields != "object") continue;
			let t = e.fields.cache;
			if (t && Object.keys(t).sort().join(",") === "bytes,evictions,items,max_bytes,max_items" && !Object.values(t).some((e) => !Number.isSafeInteger(e) || e < 0)) return t;
		}
		throw Error("invalid_cache_status");
	}, tt = async () => {
		if (!X() || P || !Ze) return;
		let e = ++$e;
		P = !0, $();
		try {
			let n = await t.services.invoke("wall_cache_status", {});
			if (!X() || e !== $e) return;
			let r = et(n);
			o.bind(Qe, () => s("cache.summary", {
				items: r.items,
				bytes: r.bytes,
				maxItems: r.max_items,
				maxBytes: r.max_bytes,
				evictions: r.evictions
			})), Z(() => s("cache.cacheStatusRefreshedThisOnlyReads"), "success");
		} catch {
			if (!X() || e !== $e) return;
			o.bind(Qe, () => s("cache.cacheStatusIsTemporarilyUnavailable")), Z(() => s("cache.couldNotReadCacheStatusTry"), "error");
		} finally {
			Y() && e === $e && (P = !1, $());
		}
	}, nt = () => {
		for (let e of W.values()) e.input && (e.input.value = "");
	}, rt = () => {
		H !== null && (clearTimeout(H), H = null), W.get("credential_perfect")?.qr?.removeAttribute("src");
	}, it = (e) => {
		D.has(E(e)) ? (Fe(), Z(() => s("credential.authorizationExpired"), "error")) : E(e) === "operation_cancelled" ? Z(() => s("credential.operationCancelled")) : (R = null, Z(E(e) === "revision_conflict" ? () => s("credential.configConflict") : () => s("credential.mutationUnverified"), "error"));
	}, at = async () => {
		if (!X() || !h[i] || !t.services.credentials?.status) return;
		let e = z, n = N, r = await t.services.credentials.status();
		if (X() && e === z && n === N) {
			if (!r || !Number.isSafeInteger(r.revision) || r.revision < 1 || !r.fields) throw Error("invalid_credential_status");
			for (let [e] of h[i]) {
				let t = r.fields[e];
				if (t && (typeof t.configured != "boolean" || typeof t.decryptable != "boolean" || t.upstream !== "unverified")) throw Error("invalid_credential_status");
			}
			R = r, dt(), he();
		}
	}, ot = async (e) => {
		let n = z;
		if (!e || !Number.isSafeInteger(e.revision) || e.revision <= R.revision) throw Error("invalid_receipt");
		let r = await t.services.config.current();
		if (X() && n === z) {
			if (r.revision < e.revision) throw Error("unverified_snapshot");
			qe(r), await at();
		}
	}, st = async (e, n) => {
		if (!X() || P || I || !R || V?.state === "waiting") return;
		let r = W.get(e).input?.value.trim();
		if (!n && (!r || r.length > 4096 || /[\x00-\x1f\x7f-\x9f]/u.test(r))) {
			Z(() => s("credential.enterAValidKeyOrToken"), "error");
			return;
		}
		let i = ++z;
		nt(), I = !0, $();
		try {
			let a = n ? await t.services.credentials.clear(R.revision, e) : await t.services.credentials.replace(R.revision, e, { token: r });
			if (!X() || i !== z || (await ot(a), !X() || i !== z)) return;
			let o = R.fields[e];
			if (!o || o.configured === n) throw Error("unverified_snapshot");
			Z(n ? () => s("credential.credentialsCleared") : () => s("credential.savedUnverifiedUpstream"), "success");
		} catch (e) {
			X() && i === z && it(e);
		} finally {
			Y() && i === z && (I = !1, $());
		}
	}, ct = (e) => {
		if (!e || typeof e.session_id != "string" || !e.session_id || e.session_id.length > 256 || ![
			"waiting",
			"authorized",
			"expired",
			"cancelled",
			"revoked",
			"error",
			"closed"
		].includes(e.state) || !Number.isFinite(e.expires_at) || !(e.next_poll_at === null || Number.isFinite(e.next_poll_at)) || !Number.isSafeInteger(e.polls) || e.polls < 0 || e.authorized_subject !== null && typeof e.authorized_subject != "string") throw Error("invalid_authorization_session");
		return e;
	}, lt = () => {
		if (!X() || V?.state !== "waiting" || U) return;
		H !== null && clearTimeout(H);
		let e = V.expires_at * 1e3 - Date.now();
		if (e <= 0) {
			rt(), V = {
				...V,
				state: "expired"
			}, Z(() => s("credential.theQrCodeTimedOutSign")), $();
			return;
		}
		let t = Math.min(e, Math.max(250, V.next_poll_at * 1e3 - Date.now()));
		H = setTimeout(() => {
			H = null, ut("poll");
		}, t);
	}, ut = async (e) => {
		if (!X() || !R || e === "cancel" && (U = !0, rt(), $(), I) || P || I) return;
		e === "begin" && (rt(), V = null, U = !1);
		let n = ++z, r = V?.session_id || "", i = null;
		I = !0, L = !0, nt(), $();
		try {
			let a = await t.services.credentials.authorize(R.revision, "perfect_qr", e, r);
			if (!X() || n !== z) return;
			if (e === "qr") {
				if (typeof a.qr_png != "string" || a.qr_png.length > 5e5 || !/^iVBORw0KGgo[A-Za-z0-9+/=]*$/u.test(a.qr_png)) throw Error("invalid_qr_png");
				U || (W.get("credential_perfect").qr.src = `data:image/png;base64,${a.qr_png}`);
			} else {
				if (e === "revoke") {
					if (!a || Object.keys(a).sort().join(",") !== "receipt,revoked" || a.revoked !== !0 || !a.receipt) throw Error("invalid_revocation_receipt");
					V = null;
				} else V = ct(a.session);
				if (a.receipt && await ot(a.receipt), !X() || n !== z) return;
				if (e === "revoke" && R?.fields.credential_perfect?.configured !== !1) throw Error("unverified_revocation");
				if (V?.state === "waiting") Z(U ? () => s("credential.cancellingTheQrSession") : () => s("credential.scanWithThePerfectWorldApp")), e === "begin" && (i = "qr");
				else {
					rt();
					let t = V?.state;
					Z(t === "authorized" ? () => s("credential.perfectWorldAuthorizationWasSavedThe") : e === "revoke" ? () => s("credential.perfectWorldAuthorizationWasRevoked") : t === "expired" ? () => s("credential.theQrCodeExpiredSignIn") : t === "cancelled" ? () => s("credential.theQrSessionWasCancelled") : () => s("credential.theAuthorizationSessionEndedRefreshThe"), t === "authorized" || e === "revoke" ? "success" : "warning"), U = !1;
				}
			}
		} catch (e) {
			X() && n === z && (rt(), V = null, U = !1, it(e));
		} finally {
			Y() && n === z && (I = !1, L = !1, $(), U && V?.state === "waiting" ? ut("cancel") : i ? ut(i) : V?.state === "waiting" && lt());
		}
	}, dt = () => {
		let e = (h[i] || []).filter(([e]) => R.fields[e]);
		if (e.length) {
			B || (B = q("section", void 0, "steam-dlc-credentials"), t.presentation?.credentialHost || B.append(q("h3", () => s("section.sourceCredentials"))), B.append(q("p", () => s("credential.submitCredentialsOnlyThroughTrustedAdministration"), "steam-dlc-hint")), t.presentation?.credentialHost ? t.presentation.credentialHost.append(B) : J.insertBefore(B, we));
			for (let [n] of e) {
				if (W.has(n)) continue;
				let e = q("section", void 0, "steam-dlc-credential"), r = q("p", "", "steam-dlc-credential-status");
				r.setAttribute("role", "status");
				let a = q("div", void 0, "steam-dlc-actions"), c = {
					status: r,
					actions: a,
					buttons: []
				}, l = () => h[i].find(([e]) => e === n)[1];
				e.append(q("h4", l), r);
				let u = (e, t, n) => {
					let r = q("button", t, "ui-button");
					return r.type = "button", r.dataset.action = e, Se(r, "click", () => {
						r.getAttribute("aria-disabled") !== "true" && n();
					}), a.append(r), c.buttons.push(r), r;
				};
				if (n === "credential_perfect") c.qr = q("img", void 0, "steam-dlc-qr"), o.bind(c.qr, () => s("credential.perfectWorldSignInQrCode"), "alt"), c.qr.setAttribute("referrerpolicy", "no-referrer"), e.append(c.qr), u("perfect-begin", () => s("credential.signInSignInAgainBy"), () => {
					ut("begin");
				}), u("perfect-cancel", () => s("credential.cancelQrSignIn"), () => {
					ut("cancel");
				}), u("perfect-poll", () => s("credential.checkQrSignInStatus"), () => {
					ut("poll");
				}), u("perfect-revoke", () => s("credential.revokePerfectWorldAuthorization"), () => {
					ut("revoke");
				});
				else {
					let r = q("input");
					if (r.type = "password", r.className = "ui-control", r.id = `steam-dlc-${n}`, r.name = n, r.maxLength = 4096, r.autocomplete = "new-password", r.spellcheck = !1, o.bind(r, l, "ariaLabel"), c.input = r, t.presentation) {
						let n = q("label", l), i = q("p", () => s("credential.sourceCredentialsAreNeverKeptAs")), a = q("p");
						i.id = `${r.id}-hint`, a.id = `${r.id}-error`, t.presentation.field(e, {
							control: r,
							label: n,
							hint: i,
							error: a
						});
					} else e.append(r);
					Se(r, "input", $), u(`replace-${n}`, () => s("credential.saveCredentials"), () => {
						st(n, !1);
					}), u(`clear-${n}`, () => s("credential.clearCredentials"), () => {
						st(n, !0);
					});
				}
				e.append(a), W.set(n, c), B.append(e);
			}
			he = () => {
				for (let [e, t] of W) {
					let n = R?.fields[e];
					t.status.textContent = n ? n.configured ? n.decryptable ? s("credential.configuredUpstreamValidityIsUnverified") : s("credential.decryptionFailed") : s("credential.notConfigured") : s("credential.refreshToCheckStatus"), e === "credential_perfect" && V && (t.status.textContent += s("credential.qrSignInStatus", { status: C(V.state, s) })), t.input && (t.input.disabled = !X() || P || I || V?.state === "waiting");
					for (let e of t.buttons) {
						let t = e.dataset.action, n = t === "perfect-cancel", r = !X() || !R || (n ? V?.state !== "waiting" && !L : P || I || t === "perfect-poll" && V?.state !== "waiting" || V?.state === "waiting" && !t.startsWith("perfect-"));
						e.setAttribute("aria-disabled", String(r));
					}
				}
			};
		}
	}, ft = () => {
		let e = n.defaultView?.URL || URL;
		for (let t of pe.splice(0)) e.revokeObjectURL(t);
	}, pt = (e, n, r, a, o = "") => {
		let c = q("div", void 0, "steam-dlc-public-field"), l = q("label", r), d = q(a ? "select" : "input");
		d.id = `steam-dlc-${i}-${t.routeId}-${n}`, d.name = n, d.className = "ui-control", l.htmlFor = d.id, a ? d.append(...a.map((e) => {
			let t = q("option", () => (n === "action" && e === "recent" ? s("query.recentMatches") : u(m, e, String(e))) || s("query.unknownOption"));
			return t.value = e, t;
		})) : (d.type = "text", d.maxLength = 128, d.autocomplete = "off"), d.value = o;
		let f = q("p", "", "steam-dlc-hint"), p = q("p", "", "steam-dlc-field-error");
		return f.id = `${d.id}-hint`, p.id = `${d.id}-error`, t.presentation ? t.presentation.field(e, {
			control: d,
			label: l,
			hint: f,
			error: p
		}) : (c.append(l, d), e.append(c)), me.push(d), d;
	};
	if (f && t.routeId === "home") {
		let e = q("details", void 0, "steam-dlc-disclosure");
		e.append(q("summary", () => s("help.commandHelp")));
		let t = q("dl", void 0, "steam-dlc-help");
		for (let [e, [n]] of f.commands.entries()) {
			let r = q("dt");
			r.append(q("code", n)), t.append(r, q("dd", () => S(s)[i].commands[e][1]));
		}
		e.append(t), J.append(e);
		{
			let e = q("details", void 0, "steam-dlc-disclosure");
			e.append(q("summary", () => s("help.aboutGameHistoryCollages"))), e.append(q("p", () => s("help.theCollageMapsPlaytimeToEach"), "steam-dlc-hint")), e.append(q("p", () => s("help.publicProfileAndRecentActivityHave"), "steam-dlc-hint")), J.append(e, q("h3", () => s("help.cacheStatus"))), Qe = q("p", () => s("help.cacheStatusHasNotBeenRead"), "steam-dlc-cache-value"), Ze = q("button", () => s("help.refreshCacheStatus")), Ze.className = "ui-button", Ze.type = "button", Ze.dataset.action = "refresh-cache", a ? (a.bind("refresh", tt, { label: () => s("help.refreshCacheStatus") }), J.append(Qe)) : (Se(Ze, "click", () => {
				tt();
			}), J.append(Qe, Ze));
		}
	} else if (f && t.routeId === "settings") {
		let e = () => {
			X() && !P && F && (G.size && (ve += 1), G.clear(), We(), Z(() => s("settings.moduleChangesDiscarded"), "success"), $());
		};
		if (a) Q = q("div"), J.append(Q), a.bind("save", Xe, {
			type: "submit",
			disabled: !0
		}), a.bind("refresh", () => Je(!0), {}), a.bind("discard", e, {});
		else {
			Q = q("form"), Se(Q, "submit", (e) => {
				e.preventDefault(), Xe();
			});
			let n = q("div", void 0, "steam-dlc-actions");
			Ae = q("button", () => s("settings.saveChanges")), Ae.className = "ui-button", Ae.dataset.variant = "primary", Ae.type = "submit", Ae.dataset.action = "save", je = q("button", () => s("settings.refreshSettings")), je.className = "ui-button", je.type = "button", je.dataset.action = "refresh", Me = q("button", () => s("settings.discardModuleChanges")), Me.className = "ui-button", Me.type = "button", Me.dataset.action = "discard", Se(je, "click", () => {
				Je(!0);
			}), Se(Me, "click", e), n.append(Ae, je, Me), t.presentation?.actions(n), J.append(Q), Q.append(n);
		}
		J.append(q("p", () => s("settings.followCoreClearsTheModulesReply"), "steam-dlc-hint"));
	} else if (t.routeId === "collage") {
		let e = y(J, {
			options: {
				...t,
				copy: o
			},
			active: X,
			field: pt,
			parseLimit: (e, t = s) => ie(e, t),
			validatePNG: (e) => ae(e, n.defaultView, s),
			say: Z
		});
		de = e.dispose, fe = e.setAvailable, xe.push(e.dispose);
	} else if (t.routeId === "wishlist") {
		let e = b(J, {
			options: {
				...t,
				copy: o
			},
			active: X,
			field: pt,
			say: Z
		});
		de = e.dispose, fe = e.setAvailable, xe.push(e.dispose);
	} else J.append(q("p", () => s("page.thisPageIsNotDeclaredReturn")));
	a || J.append(we);
	let mt = () => {
		A || (A = !0, N += 1, $e += 1, z += 1, ue += 1, P = !1, ft(), me.forEach((e) => {
			e.value = "";
		}), rt(), nt(), V = null, R = null, I = !1, L = !1, ye !== null && (clearTimeout(ye), ye = null), G.clear(), F = null, xe.splice(0).forEach((e) => e()), be(), B?.remove(), J.remove());
	};
	return t.scope.signal.addEventListener("abort", mt, { once: !0 }), xe.push(() => t.scope.signal.removeEventListener("abort", mt)), be = t.scope.onDispose(mt), $(), Q && Je(), Ze && tt(), {
		update(e) {
			if (A || oe) return;
			let n = r.available, i = e.locale !== r.locale;
			r = { ...e }, T(r) !== d || !Y() ? (de(), ue += 1, ft(), me.forEach((e) => {
				e.value = "";
			}), Fe(), Z(() => s("page.moduleRuntimeContextChangedOpenThe"), "error")) : n !== r.available && (fe(r.available), ue += 1, ft(), z += 1, rt(), nt(), V = null, I = !1, L = !1, $e += 1, N += 1, P = !1, le = !1, Z(() => s("page.pageAvailabilityChangedReviewTheRefreshed"))), $(), i && (Oe(), F && Y() && Ue(), t.copy || o.refresh());
		},
		dispose: mt,
		navigationImpact: Te
	};
}
//#endregion
//#region packages/steam_dlc/steam/assets/steam.svg?raw
var P = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\" fill=\"currentColor\" role=\"img\" aria-label=\"steam module\"><title>steam module</title><desc>Adapted monochrome mark from Valve artwork. Source: https://cdn.fastly.steamstatic.com/apps/csgo/images/csgo_react/global/steam_icon.svg. Valve retains its rights.</desc><g transform=\"translate(1.47059 0.00000) scale(2.94117647)\"><path d=\"M16.4728 0C7.7888 0 0.677759 6.69423 0 15.2043L8.85799 18.8685C9.60824 18.3539 10.5143 18.0567 11.4929 18.0567C11.5799 18.0567 11.6669 18.0603 11.7539 18.0639L15.6936 12.3483C15.6936 12.3229 15.6936 12.2939 15.6936 12.2685C15.6936 8.83262 18.4916 6.0346 21.9275 6.0346C25.3634 6.0346 28.1614 8.83262 28.1614 12.2685C28.1614 15.7044 25.3634 18.5025 21.9275 18.5025C21.8804 18.5025 21.8333 18.5025 21.7862 18.4988L16.1647 22.511C16.1684 22.5835 16.1684 22.6596 16.1684 22.7321C16.1684 25.3127 14.0699 27.4112 11.4893 27.4112C9.22405 27.4112 7.33213 25.7947 6.90082 23.6527L0.569028 21.0323C2.52982 27.9694 8.90511 33.058 16.4728 33.058C25.6026 33.058 33 25.657 33 16.5308C33 7.40099 25.599 0 16.4728 0Z\" fill=\"currentColor\" />\n<path d=\"M10.358 25.0806L8.32837 24.2434C8.68718 24.9936 9.31058 25.6206 10.1369 25.965C11.9238 26.708 13.9824 25.8599 14.729 24.073C15.0878 23.2068 15.0915 22.2536 14.7327 21.3874C14.3775 20.5211 13.7033 19.8434 12.8371 19.4846C11.9781 19.1258 11.0575 19.1403 10.2493 19.4447L12.3478 20.3109C13.6671 20.8618 14.2905 22.3732 13.7396 23.6925C13.1887 25.0045 11.6773 25.6279 10.358 25.0806Z\" fill=\"currentColor\" />\n<path d=\"M26.0813 12.2684C26.0813 9.9778 24.2183 8.11487 21.9277 8.11487C19.6371 8.11487 17.7742 9.9778 17.7742 12.2684C17.7742 14.559 19.6371 16.422 21.9277 16.422C24.2183 16.422 26.0813 14.559 26.0813 12.2684ZM18.8144 12.2612C18.8144 10.5396 20.2134 9.14057 21.935 9.14057C23.6565 9.14057 25.0556 10.536 25.0556 12.2612C25.0556 13.9827 23.6602 15.3818 21.935 15.3818C20.2098 15.3818 18.8144 13.9864 18.8144 12.2612Z\" fill=\"currentColor\" />\n</g></svg>\n", le = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\" fill=\"currentColor\" role=\"img\" aria-label=\"dota2 module\"><title>dota2 module</title><desc>Adapted monochrome mark from Valve artwork. Source: https://cdn.steamstatic.com/apps/dota2/images/dota_react/global/dota2_logo_symbol.png. Valve retains its rights.</desc><g transform=\"translate(0.00000 3.32031) scale(0.39062500)\"><path fill-rule=\"evenodd\" d=\"M103.5,0 L104,-0.5 L104.5,0 L105,0.5 L106,0.5 L107,0.5 L107.5,1 L108,1.5 L109,1.5 L110,1.5 L111,1.5 L112,1.5 L113,1.5 L114,1.5 L115,1.5 L116,1.5 L117,1.5 L117.5,1 L118,0.5 L119,0.5 L119.5,0 L120,-0.5 L120.5,0 L121,0.5 L121.5,1 L122,1.5 L123,1.5 L124,1.5 L125,1.5 L126,1.5 L127,1.5 L128,1.5 L129,1.5 L130,1.5 L131,1.5 L132,1.5 L132.5,2 L133,2.5 L134,2.5 L134.5,3 L135,3.5 L135.5,4 L135,4.5 L134,4.5 L133,4.5 L132,4.5 L131,4.5 L130.5,5 L131,5.5 L132,5.5 L133,5.5 L134,5.5 L135,5.5 L135.5,5 L136,4.5 L137,4.5 L137.5,5 L138,5.5 L139,5.5 L139.5,6 L139.5,7 L140,7.5 L140.5,8 L141,8.5 L141.5,9 L141.5,10 L141.5,11 L141.5,12 L142,12.5 L143,12.5 L143.5,12 L144,11.5 L145,11.5 L146,11.5 L147,11.5 L148,11.5 L149,11.5 L150,11.5 L151,11.5 L152,11.5 L152.5,11 L152.5,10 L153,9.5 L153.5,9 L153.5,8 L153.5,7 L153.5,6 L153.5,5 L153.5,4 L154,3.5 L154.5,3 L155,2.5 L156,2.5 L157,2.5 L158,2.5 L159,2.5 L160,2.5 L161,2.5 L162,2.5 L163,2.5 L164,2.5 L165,2.5 L166,2.5 L167,2.5 L168,2.5 L169,2.5 L170,2.5 L171,2.5 L172,2.5 L173,2.5 L173.5,3 L174,3.5 L175,3.5 L176,3.5 L177,3.5 L178,3.5 L179,3.5 L180,3.5 L181,3.5 L182,3.5 L183,3.5 L184,3.5 L184.5,4 L185,4.5 L186,4.5 L187,4.5 L188,4.5 L189,4.5 L190,4.5 L191,4.5 L192,4.5 L193,4.5 L194,4.5 L195,4.5 L196,4.5 L196.5,5 L197,5.5 L197.5,5 L198,4.5 L198.5,4 L198.5,3 L198.5,2 L198.5,1 L199,0.5 L199.5,1 L199.5,2 L200,2.5 L200.5,3 L200.5,4 L201,4.5 L201.5,5 L202,5.5 L203,5.5 L204,5.5 L204.5,5 L205,4.5 L205.5,4 L206,3.5 L207,3.5 L207.5,4 L208,4.5 L209,4.5 L209.5,5 L210,5.5 L211,5.5 L212,5.5 L212.5,6 L213,6.5 L214,6.5 L215,6.5 L216,6.5 L216.5,6 L217,5.5 L217.5,5 L218,4.5 L219,4.5 L219.5,5 L220,5.5 L221,5.5 L222,5.5 L223,5.5 L224,5.5 L225,5.5 L226,5.5 L226.5,6 L226.5,7 L227,7.5 L227.5,8 L228,8.5 L229,8.5 L229.5,9 L230,9.5 L231,9.5 L232,9.5 L232.5,10 L233,10.5 L233.5,11 L233.5,12 L233.5,13 L233.5,14 L233.5,15 L233.5,16 L233.5,17 L234,17.5 L234.5,18 L234.5,19 L234,19.5 L233.5,20 L233.5,21 L233.5,22 L233,22.5 L232.5,23 L232.5,24 L232.5,25 L232.5,26 L232.5,27 L232.5,28 L233,28.5 L233.5,29 L233.5,30 L233.5,31 L233.5,32 L233.5,33 L233.5,34 L233.5,35 L234,35.5 L234.5,36 L234.5,37 L234.5,38 L234.5,39 L234.5,40 L234.5,41 L234.5,42 L234.5,43 L234.5,44 L234.5,45 L234.5,46 L234.5,47 L234.5,48 L234.5,49 L234.5,50 L234.5,51 L234.5,52 L234.5,53 L234.5,54 L234.5,55 L234.5,56 L234.5,57 L234.5,58 L234.5,59 L234.5,60 L234.5,61 L234.5,62 L234.5,63 L234.5,64 L234.5,65 L234.5,66 L234.5,67 L234.5,68 L234.5,69 L234.5,70 L234.5,71 L234.5,72 L234.5,73 L234,73.5 L233.5,74 L233.5,75 L233.5,76 L233.5,77 L233.5,78 L233.5,79 L233.5,80 L233.5,81 L233.5,82 L233,82.5 L232,82.5 L231,82.5 L230,82.5 L229,82.5 L228,82.5 L227,82.5 L226.5,83 L226.5,84 L227,84.5 L227.5,85 L227.5,86 L227.5,87 L228,87.5 L228.5,88 L228.5,89 L228.5,90 L228,90.5 L227,90.5 L226.5,91 L226,91.5 L225.5,92 L225.5,93 L225,93.5 L224.5,94 L224.5,95 L224.5,96 L225,96.5 L225.5,97 L225.5,98 L226,98.5 L227,98.5 L228,98.5 L228.5,99 L228,99.5 L227.5,100 L227.5,101 L228,101.5 L228.5,102 L229,102.5 L229.5,103 L230,103.5 L230.5,104 L230.5,105 L230.5,106 L230.5,107 L230.5,108 L230.5,109 L230.5,110 L230.5,111 L231,111.5 L231.5,112 L232,112.5 L232.5,113 L232.5,114 L232.5,115 L232,115.5 L231.5,116 L231.5,117 L231.5,118 L231.5,119 L231.5,120 L231.5,121 L231.5,122 L232,122.5 L232.5,123 L232,123.5 L231.5,124 L231,124.5 L230.5,125 L230.5,126 L230.5,127 L230.5,128 L230.5,129 L230.5,130 L230.5,131 L230.5,132 L230.5,133 L230,133.5 L229,133.5 L228.5,133 L228,132.5 L227.5,133 L227,133.5 L226.5,134 L227,134.5 L227.5,135 L228,135.5 L229,135.5 L230,135.5 L231,135.5 L232,135.5 L233,135.5 L234,135.5 L234.5,136 L234.5,137 L234.5,138 L234.5,139 L234.5,140 L234.5,141 L234.5,142 L234.5,143 L234.5,144 L234.5,145 L234.5,146 L234.5,147 L234.5,148 L234.5,149 L234.5,150 L234.5,151 L234.5,152 L234.5,153 L234.5,154 L234.5,155 L234.5,156 L234.5,157 L234.5,158 L234.5,159 L234.5,160 L234.5,161 L234.5,162 L234.5,163 L234.5,164 L234.5,165 L234.5,166 L234.5,167 L234.5,168 L234.5,169 L234.5,170 L234.5,171 L234.5,172 L234.5,173 L234.5,174 L234.5,175 L234.5,176 L234.5,177 L234.5,178 L234.5,179 L234.5,180 L234.5,181 L234.5,182 L234.5,183 L234.5,184 L234.5,185 L234.5,186 L234.5,187 L234.5,188 L234.5,189 L234.5,190 L234.5,191 L234.5,192 L234.5,193 L234.5,194 L234.5,195 L234.5,196 L234.5,197 L234.5,198 L234.5,199 L234.5,200 L234.5,201 L234.5,202 L234.5,203 L234.5,204 L234.5,205 L234.5,206 L234.5,207 L234.5,208 L234.5,209 L234.5,210 L234.5,211 L234.5,212 L234.5,213 L234.5,214 L234.5,215 L234.5,216 L234.5,217 L234.5,218 L234.5,219 L234.5,220 L234.5,221 L234.5,222 L234.5,223 L234.5,224 L234.5,225 L234.5,226 L234.5,227 L234.5,228 L234.5,229 L234.5,230 L234.5,231 L234,231.5 L233,231.5 L232,231.5 L231.5,231 L231,230.5 L230,230.5 L229.5,230 L229,229.5 L228,229.5 L227.5,229 L227,228.5 L226,228.5 L225.5,228 L225,227.5 L224,227.5 L223,227.5 L222.5,227 L222,226.5 L221,226.5 L220,226.5 L219,226.5 L218.5,226 L218,225.5 L217,225.5 L216,225.5 L215,225.5 L214,225.5 L213.5,226 L213,226.5 L212,226.5 L211,226.5 L210,226.5 L209.5,227 L209,227.5 L208.5,228 L209,228.5 L210,228.5 L211,228.5 L212,228.5 L213,228.5 L214,228.5 L215,228.5 L216,228.5 L216.5,229 L216.5,230 L216,230.5 L215,230.5 L214,230.5 L213,230.5 L212.5,231 L212,231.5 L211,231.5 L210.5,231 L210,230.5 L209.5,231 L209,231.5 L208.5,232 L208,232.5 L207,232.5 L206,232.5 L205.5,233 L205,233.5 L204,233.5 L203,233.5 L202,233.5 L201,233.5 L200,233.5 L199,233.5 L198,233.5 L197,233.5 L196,233.5 L195.5,233 L195,232.5 L194,232.5 L193,232.5 L192.5,232 L192,231.5 L191,231.5 L190.5,231 L190,230.5 L189,230.5 L188.5,231 L188,231.5 L187,231.5 L186,231.5 L185,231.5 L184,231.5 L183,231.5 L182,231.5 L181,231.5 L180.5,231 L180,230.5 L179.5,230 L179,229.5 L178,229.5 L177,229.5 L176,229.5 L175.5,230 L175,230.5 L174.5,231 L174,231.5 L173,231.5 L172,231.5 L171,231.5 L170,231.5 L169,231.5 L168,231.5 L167.5,232 L167,232.5 L166,232.5 L165,232.5 L164,232.5 L163.5,233 L163,233.5 L162,233.5 L161,233.5 L160.5,233 L160.5,232 L160,231.5 L159.5,232 L159.5,233 L159.5,234 L159,234.5 L158,234.5 L157,234.5 L156.5,234 L157,233.5 L157.5,233 L157.5,232 L157.5,231 L157,230.5 L156,230.5 L155.5,231 L155,231.5 L154,231.5 L153.5,232 L154,232.5 L155,232.5 L156,232.5 L156.5,233 L156,233.5 L155.5,234 L155.5,235 L155,235.5 L154,235.5 L153.5,236 L153,236.5 L152,236.5 L151,236.5 L150,236.5 L149,236.5 L148,236.5 L147,236.5 L146.5,236 L147,235.5 L148,235.5 L149,235.5 L150,235.5 L151,235.5 L151.5,235 L152,234.5 L152.5,234 L152,233.5 L151.5,233 L151,232.5 L150.5,233 L150,233.5 L149,233.5 L148,233.5 L147,233.5 L146,233.5 L145,233.5 L144,233.5 L143,233.5 L142,233.5 L141,233.5 L140,233.5 L139,233.5 L138,233.5 L137,233.5 L136,233.5 L135,233.5 L134,233.5 L133,233.5 L132,233.5 L131.5,234 L131,234.5 L130,234.5 L129.5,235 L130,235.5 L130.5,236 L130,236.5 L129,236.5 L128,236.5 L127,236.5 L126.5,237 L126,237.5 L125,237.5 L124,237.5 L123,237.5 L122.5,237 L122,236.5 L121.5,236 L121,235.5 L120.5,235 L120,234.5 L119.5,235 L119,235.5 L118.5,236 L118,236.5 L117,236.5 L116.5,236 L116,235.5 L115,235.5 L114.5,235 L114,234.5 L113,234.5 L112.5,234 L112,233.5 L111,233.5 L110,233.5 L109,233.5 L108,233.5 L107,233.5 L106.5,234 L106,234.5 L105,234.5 L104,234.5 L103.5,235 L104,235.5 L104.5,236 L104.5,237 L104,237.5 L103,237.5 L102,237.5 L101.5,238 L101,238.5 L100,238.5 L99.5,238 L99.5,237 L99,236.5 L98.5,236 L98,235.5 L97.5,235 L97.5,234 L97,233.5 L96.5,233 L96,232.5 L95.5,232 L95,231.5 L94.5,231 L94.5,230 L94,229.5 L93,229.5 L92,229.5 L91.5,230 L91,230.5 L90,230.5 L89,230.5 L88,230.5 L87,230.5 L86,230.5 L85,230.5 L84.5,230 L84,229.5 L83,229.5 L82.5,229 L82,228.5 L81.5,229 L81,229.5 L80.5,230 L80,230.5 L79,230.5 L78.5,230 L78,229.5 L77.5,229 L77,228.5 L76.5,228 L76.5,227 L76,226.5 L75.5,226 L75,225.5 L74.5,226 L74,226.5 L73.5,227 L73.5,228 L73.5,229 L73,229.5 L72.5,229 L72,228.5 L71.5,228 L71.5,227 L71.5,226 L71,225.5 L70.5,226 L70,226.5 L69.5,227 L69,227.5 L68.5,228 L68.5,229 L68,229.5 L67.5,229 L67,228.5 L66,228.5 L65,228.5 L64.5,229 L64.5,230 L64,230.5 L63.5,230 L63.5,229 L63,228.5 L62,228.5 L61,228.5 L60.5,229 L60,229.5 L59,229.5 L58.5,230 L58,230.5 L57.5,230 L57.5,229 L57,228.5 L56.5,228 L56.5,227 L56,226.5 L55.5,227 L55.5,228 L55,228.5 L54,228.5 L53,228.5 L52.5,228 L52,227.5 L51,227.5 L50.5,228 L50,228.5 L49,228.5 L48,228.5 L47.5,229 L47,229.5 L46.5,230 L46,230.5 L45.5,230 L45,229.5 L44.5,229 L44.5,228 L44.5,227 L44.5,226 L44,225.5 L43,225.5 L42.5,226 L42,226.5 L41.5,227 L41.5,228 L41,228.5 L40,228.5 L39.5,228 L39.5,227 L39,226.5 L38.5,227 L38,227.5 L37.5,228 L37.5,229 L37,229.5 L36,229.5 L35.5,229 L35,228.5 L34,228.5 L33,228.5 L32,228.5 L31,228.5 L30,228.5 L29,228.5 L28,228.5 L27,228.5 L26,228.5 L25,228.5 L24.5,228 L24,227.5 L23.5,227 L23,226.5 L22.5,227 L22.5,228 L22.5,229 L22,229.5 L21,229.5 L20.5,229 L20,228.5 L19.5,229 L19,229.5 L18,229.5 L17,229.5 L16.5,230 L16,230.5 L15,230.5 L14.5,230 L14.5,229 L14,228.5 L13.5,229 L13.5,230 L13.5,231 L13,231.5 L12.5,231 L12.5,230 L12.5,229 L12,228.5 L11.5,228 L11,227.5 L10.5,228 L10,228.5 L9.5,229 L9.5,230 L9,230.5 L8,230.5 L7.5,230 L7.5,229 L7.5,228 L7.5,227 L7,226.5 L6,226.5 L5,226.5 L4,226.5 L3,226.5 L2,226.5 L1.5,226 L1,225.5 L0.5,225 L1,224.5 L1.5,224 L1.5,223 L1.5,222 L1.5,221 L2,220.5 L2.5,220 L2.5,219 L2.5,218 L2.5,217 L2.5,216 L2.5,215 L2.5,214 L2.5,213 L2.5,212 L2.5,211 L2.5,210 L2.5,209 L2.5,208 L2.5,207 L2.5,206 L2.5,205 L2.5,204 L2.5,203 L2.5,202 L2.5,201 L2.5,200 L2.5,199 L2,198.5 L1.5,198 L1.5,197 L1.5,196 L1.5,195 L1.5,194 L1.5,193 L1.5,192 L1.5,191 L1.5,190 L1.5,189 L1.5,188 L1.5,187 L2,186.5 L2.5,186 L2.5,185 L2.5,184 L2.5,183 L2.5,182 L2.5,181 L3,180.5 L3.5,180 L4,179.5 L5,179.5 L6,179.5 L7,179.5 L7.5,179 L7,178.5 L6.5,178 L6.5,177 L6.5,176 L6.5,175 L6.5,174 L6.5,173 L6.5,172 L7,171.5 L7.5,171 L7.5,170 L7.5,169 L7.5,168 L7.5,167 L7.5,166 L7.5,165 L7.5,164 L7.5,163 L7.5,162 L7.5,161 L7.5,160 L7.5,159 L7.5,158 L7.5,157 L7.5,156 L8,155.5 L8.5,155 L8.5,154 L8,153.5 L7,153.5 L6,153.5 L5,153.5 L4.5,153 L4,152.5 L3.5,152 L3,151.5 L2.5,151 L2.5,150 L2.5,149 L2.5,148 L2.5,147 L2.5,146 L2.5,145 L2.5,144 L2.5,143 L2.5,142 L2.5,141 L2.5,140 L2.5,139 L2.5,138 L2.5,137 L2.5,136 L2.5,135 L2.5,134 L2.5,133 L2.5,132 L2.5,131 L2.5,130 L2.5,129 L2.5,128 L2.5,127 L2.5,126 L2.5,125 L2.5,124 L2.5,123 L3,122.5 L3.5,123 L4,123.5 L4.5,124 L5,124.5 L5.5,124 L5.5,123 L5,122.5 L4.5,122 L4,121.5 L3.5,121 L3.5,120 L4,119.5 L4.5,120 L5,120.5 L5.5,121 L6,121.5 L7,121.5 L7.5,122 L8,122.5 L8.5,122 L8.5,121 L8.5,120 L8.5,119 L8.5,118 L8.5,117 L8.5,116 L8.5,115 L8.5,114 L8.5,113 L8,112.5 L7.5,112 L7,111.5 L6.5,111 L6,110.5 L5.5,110 L5,109.5 L4.5,109 L4.5,108 L4.5,107 L4,106.5 L3.5,106 L3.5,105 L3.5,104 L3.5,103 L3.5,102 L3.5,101 L3.5,100 L3.5,99 L4,98.5 L4.5,98 L4.5,97 L5,96.5 L5.5,96 L5.5,95 L5.5,94 L5,93.5 L4.5,93 L4.5,92 L4.5,91 L4.5,90 L4,89.5 L3.5,89 L3.5,88 L3.5,87 L3.5,86 L3.5,85 L3.5,84 L3,83.5 L2.5,83 L2.5,82 L2.5,81 L2.5,80 L2.5,79 L2.5,78 L2.5,77 L2,76.5 L1,76.5 L0.5,76 L0,75.5 L-0.5,75 L-0.5,74 L0,73.5 L1,73.5 L1.5,73 L1,72.5 L0,72.5 L-0.5,72 L-0.5,71 L0,70.5 L0.5,71 L1,71.5 L1.5,71 L1.5,70 L1.5,69 L1,68.5 L0.5,69 L0,69.5 L-0.5,69 L-0.5,68 L-0.5,67 L-0.5,66 L-0.5,65 L-0.5,64 L0,63.5 L1,63.5 L1.5,63 L1.5,62 L1,61.5 L0,61.5 L-0.5,61 L-0.5,60 L-0.5,59 L-0.5,58 L-0.5,57 L-0.5,56 L-0.5,55 L0,54.5 L1,54.5 L1.5,54 L1.5,53 L1.5,52 L1.5,51 L1.5,50 L1.5,49 L1.5,48 L2,47.5 L2.5,47 L2.5,46 L2.5,45 L2.5,44 L2.5,43 L2.5,42 L2.5,41 L2.5,40 L2.5,39 L2.5,38 L2.5,37 L2.5,36 L2.5,35 L2.5,34 L2.5,33 L2.5,32 L2.5,31 L2.5,30 L2.5,29 L2.5,28 L3,27.5 L3.5,27 L3.5,26 L3.5,25 L3.5,24 L3.5,23 L3.5,22 L3.5,21 L3.5,20 L3.5,19 L3,18.5 L2,18.5 L1.5,19 L1,19.5 L0,19.5 L-0.5,19 L-0.5,18 L-0.5,17 L-0.5,16 L-0.5,15 L-0.5,14 L-0.5,13 L-0.5,12 L-0.5,11 L-0.5,10 L-0.5,9 L0,8.5 L0.5,9 L0.5,10 L0.5,11 L0.5,12 L0.5,13 L1,13.5 L1.5,13 L2,12.5 L2.5,12 L2.5,11 L2.5,10 L2.5,9 L2.5,8 L2.5,7 L2.5,6 L3,5.5 L3.5,5 L4,4.5 L4.5,5 L5,5.5 L5.5,6 L6,6.5 L7,6.5 L8,6.5 L9,6.5 L10,6.5 L11,6.5 L12,6.5 L13,6.5 L14,6.5 L14.5,6 L15,5.5 L16,5.5 L16.5,5 L17,4.5 L18,4.5 L18.5,4 L19,3.5 L19.5,4 L20,4.5 L20.5,5 L21,5.5 L22,5.5 L23,5.5 L24,5.5 L25,5.5 L26,5.5 L27,5.5 L27.5,6 L28,6.5 L29,6.5 L29.5,6 L29.5,5 L30,4.5 L31,4.5 L31.5,5 L31.5,6 L32,6.5 L32.5,6 L33,5.5 L34,5.5 L35,5.5 L36,5.5 L36.5,6 L36.5,7 L37,7.5 L37.5,7 L38,6.5 L39,6.5 L40,6.5 L40.5,6 L41,5.5 L42,5.5 L42.5,6 L43,6.5 L44,6.5 L45,6.5 L46,6.5 L47,6.5 L48,6.5 L49,6.5 L49.5,6 L50,5.5 L51,5.5 L51.5,6 L52,6.5 L53,6.5 L54,6.5 L55,6.5 L56,6.5 L56.5,7 L57,7.5 L57.5,7 L58,6.5 L58.5,6 L58.5,5 L59,4.5 L59.5,5 L60,5.5 L60.5,6 L61,6.5 L61.5,7 L62,7.5 L63,7.5 L63.5,8 L64,8.5 L65,8.5 L66,8.5 L67,8.5 L68,8.5 L69,8.5 L70,8.5 L71,8.5 L72,8.5 L73,8.5 L74,8.5 L75,8.5 L76,8.5 L77,8.5 L78,8.5 L79,8.5 L80,8.5 L81,8.5 L82,8.5 L83,8.5 L83.5,9 L84,9.5 L85,9.5 L85.5,9 L86,8.5 L86.5,8 L86.5,7 L87,6.5 L88,6.5 L89,6.5 L90,6.5 L90.5,6 L91,5.5 L91.5,5 L92,4.5 L92.5,4 L92.5,3 L92.5,2 L93,1.5 L93.5,2 L94,2.5 L94.5,3 L95,3.5 L95.5,3 L95.5,2 L96,1.5 L97,1.5 L98,1.5 L99,1.5 L100,1.5 L101,1.5 L102,1.5 L102.5,1 L103,0.5 L103.5,0ZM137.5,0 L138,-0.5 L138.5,0 L138.5,1 L138,1.5 L137.5,1 L137.5,0ZM140.5,1 L141,0.5 L142,0.5 L143,0.5 L144,0.5 L145,0.5 L146,0.5 L147,0.5 L147.5,1 L147.5,2 L147,2.5 L146.5,3 L146.5,4 L146.5,5 L146.5,6 L146.5,7 L146,7.5 L145.5,7 L145,6.5 L144.5,6 L144,5.5 L143.5,5 L143.5,4 L143,3.5 L142.5,3 L142,2.5 L141.5,2 L141,1.5 L140.5,1ZM100,3.5 L99.5,4 L99.5,5 L100,5.5 L101,5.5 L101.5,5 L101.5,4 L101,3.5 L100,3.5ZM108,3.5 L107.5,4 L108,4.5 L108.5,4 L108,3.5ZM113,3.5 L112.5,4 L112.5,5 L113,5.5 L114,5.5 L115,5.5 L115.5,5 L115.5,4 L115,3.5 L114,3.5 L113,3.5ZM125,4.5 L124.5,5 L125,5.5 L125.5,5 L125,4.5ZM128,4.5 L127.5,5 L128,5.5 L128.5,5 L128,4.5ZM160,5.5 L159.5,6 L160,6.5 L160.5,6 L160,5.5ZM169,5.5 L168.5,6 L169,6.5 L169.5,6 L169,5.5ZM179,5.5 L178.5,6 L178.5,7 L179,7.5 L179.5,7 L179.5,6 L179,5.5ZM183,5.5 L182.5,6 L182,6.5 L181.5,7 L181.5,8 L182,8.5 L182.5,8 L183,7.5 L183.5,7 L183.5,6 L183,5.5ZM-0.5,7 L0,6.5 L1,6.5 L1.5,7 L1,7.5 L0,7.5 L-0.5,7ZM187,6.5 L186.5,7 L187,7.5 L188,7.5 L189,7.5 L190,7.5 L191,7.5 L191.5,7 L191,6.5 L190,6.5 L189,6.5 L188,6.5 L187,6.5ZM22,7.5 L21.5,8 L21.5,9 L22,9.5 L23,9.5 L23.5,9 L23.5,8 L23,7.5 L22,7.5ZM115,7.5 L114.5,8 L115,8.5 L115.5,8 L115,7.5ZM202,7.5 L201.5,8 L202,8.5 L203,8.5 L203.5,8 L203,7.5 L202,7.5ZM15,8.5 L14.5,9 L15,9.5 L16,9.5 L16.5,9 L16,8.5 L15,8.5ZM38,8.5 L37.5,9 L37,9.5 L36.5,10 L37,10.5 L38,10.5 L38.5,10 L38.5,9 L38,8.5ZM47,8.5 L46.5,9 L46.5,10 L47,10.5 L47.5,10 L47.5,9 L47,8.5ZM66,9.5 L65.5,10 L66,10.5 L66.5,10 L66,9.5ZM78,10.5 L77.5,11 L78,11.5 L78.5,11 L78,10.5ZM92,10.5 L91.5,11 L92,11.5 L92.5,11 L92,10.5ZM78,14.5 L77.5,15 L78,15.5 L78.5,15 L78,14.5ZM231,14.5 L230.5,15 L231,15.5 L231.5,15 L231,14.5ZM0.5,23 L1,22.5 L1.5,23 L1.5,24 L1,24.5 L0.5,25 L0,25.5 L-0.5,25 L-0.5,24 L0,23.5 L0.5,23ZM-0.5,29 L0,28.5 L0.5,29 L0,29.5 L-0.5,29ZM-0.5,31 L0,30.5 L0.5,31 L0,31.5 L-0.5,31ZM-0.5,34 L0,33.5 L0.5,34 L0.5,35 L0.5,36 L0.5,37 L0.5,38 L0.5,39 L0.5,40 L0.5,41 L0.5,42 L0.5,43 L0.5,44 L0.5,45 L0,45.5 L-0.5,45 L-0.5,44 L-0.5,43 L-0.5,42 L-0.5,41 L-0.5,40 L-0.5,39 L-0.5,38 L-0.5,37 L-0.5,36 L-0.5,35 L-0.5,34ZM38,42.5 L37.5,43 L37,43.5 L36,43.5 L35,43.5 L34.5,44 L34,44.5 L33,44.5 L32,44.5 L31.5,45 L31,45.5 L30,45.5 L29.5,46 L29,46.5 L28,46.5 L27,46.5 L26.5,47 L26.5,48 L27,48.5 L27.5,49 L28,49.5 L28.5,50 L29,50.5 L29.5,51 L30,51.5 L30.5,52 L31,52.5 L31.5,53 L32,53.5 L32.5,54 L32.5,55 L33,55.5 L33.5,56 L34,56.5 L34.5,57 L35,57.5 L35.5,58 L36,58.5 L36.5,59 L37,59.5 L37.5,60 L38,60.5 L38.5,61 L39,61.5 L39.5,62 L40,62.5 L40.5,63 L41,63.5 L41.5,64 L42,64.5 L42.5,65 L43,65.5 L43.5,66 L44,66.5 L44.5,67 L45,67.5 L45.5,68 L46,68.5 L46.5,69 L47,69.5 L47.5,70 L48,70.5 L48.5,71 L49,71.5 L49.5,72 L50,72.5 L50.5,73 L51,73.5 L51.5,74 L51.5,75 L52,75.5 L52.5,76 L53,76.5 L53.5,77 L54,77.5 L54.5,78 L55,78.5 L55.5,79 L56,79.5 L56.5,80 L57,80.5 L57.5,81 L58,81.5 L58.5,82 L59,82.5 L59.5,83 L60,83.5 L60.5,84 L61,84.5 L61.5,85 L62,85.5 L62.5,86 L63,86.5 L63.5,87 L64,87.5 L64.5,88 L65,88.5 L65.5,89 L66,89.5 L66.5,90 L67,90.5 L67.5,91 L68,91.5 L68.5,92 L69,92.5 L69.5,93 L69.5,94 L70,94.5 L70.5,95 L71,95.5 L71.5,96 L72,96.5 L72.5,97 L73,97.5 L73.5,98 L74,98.5 L74.5,99 L75,99.5 L75.5,100 L76,100.5 L76.5,101 L77,101.5 L77.5,102 L78,102.5 L78.5,103 L79,103.5 L79.5,104 L80,104.5 L80.5,105 L81,105.5 L81.5,106 L82,106.5 L82.5,107 L83,107.5 L83.5,108 L84,108.5 L85,108.5 L85.5,109 L86,109.5 L87,109.5 L87.5,110 L87,110.5 L86.5,111 L87,111.5 L87.5,112 L88,112.5 L88.5,113 L88.5,114 L89,114.5 L89.5,115 L90,115.5 L90.5,116 L91,116.5 L91.5,117 L92,117.5 L93,117.5 L93.5,118 L93.5,119 L94,119.5 L94.5,120 L95,120.5 L95.5,121 L96,121.5 L96.5,122 L97,122.5 L97.5,123 L98,123.5 L98.5,124 L99,124.5 L99.5,125 L100,125.5 L100.5,126 L101,126.5 L101.5,127 L102,127.5 L102.5,128 L103,128.5 L103.5,129 L104,129.5 L104.5,130 L105,130.5 L105.5,131 L106,131.5 L106.5,132 L106.5,133 L107,133.5 L107.5,134 L108,134.5 L108.5,135 L109,135.5 L109.5,135 L109.5,134 L110,133.5 L110.5,134 L110.5,135 L111,135.5 L111.5,136 L111.5,137 L112,137.5 L112.5,138 L113,138.5 L113.5,139 L113.5,140 L114,140.5 L114.5,141 L115,141.5 L115.5,142 L116,142.5 L116.5,143 L117,143.5 L117.5,144 L118,144.5 L118.5,145 L119,145.5 L119.5,146 L120,146.5 L120.5,147 L121,147.5 L121.5,147 L121.5,146 L122,145.5 L122.5,146 L123,146.5 L123.5,147 L123.5,148 L123.5,149 L123.5,150 L124,150.5 L124.5,151 L124.5,152 L125,152.5 L125.5,153 L126,153.5 L126.5,153 L127,152.5 L127.5,153 L128,153.5 L128.5,154 L129,154.5 L129.5,155 L129.5,156 L130,156.5 L131,156.5 L132,156.5 L132.5,157 L132.5,158 L132.5,159 L132.5,160 L133,160.5 L133.5,161 L134,161.5 L134.5,162 L135,162.5 L135.5,163 L136,163.5 L136.5,164 L137,164.5 L137.5,165 L138,165.5 L138.5,166 L139,166.5 L139.5,167 L140,167.5 L140.5,168 L141,168.5 L141.5,169 L142,169.5 L142.5,170 L142.5,171 L143,171.5 L143.5,172 L144,172.5 L144.5,173 L145,173.5 L145.5,174 L146,174.5 L146.5,175 L147,175.5 L147.5,176 L148,176.5 L148.5,177 L149,177.5 L149.5,178 L150,178.5 L150.5,179 L151,179.5 L151.5,180 L152,180.5 L152.5,181 L153,181.5 L153.5,182 L154,182.5 L154.5,183 L155,183.5 L155.5,184 L155.5,185 L156,185.5 L156.5,186 L157,186.5 L157.5,187 L158,187.5 L158.5,188 L159,188.5 L159.5,189 L160,189.5 L160.5,190 L161,190.5 L161.5,191 L162,191.5 L162.5,192 L163,192.5 L163.5,193 L164,193.5 L165,193.5 L165.5,194 L166,194.5 L167,194.5 L168,194.5 L169,194.5 L169.5,195 L170,195.5 L171,195.5 L172,195.5 L173,195.5 L174,195.5 L175,195.5 L176,195.5 L177,195.5 L178,195.5 L179,195.5 L179.5,196 L180,196.5 L181,196.5 L182,196.5 L183,196.5 L184,196.5 L185,196.5 L186,196.5 L187,196.5 L188,196.5 L189,196.5 L190,196.5 L190.5,196 L191,195.5 L192,195.5 L193,195.5 L193.5,195 L194,194.5 L194.5,194 L194.5,193 L195,192.5 L195.5,192 L195.5,191 L196,190.5 L196.5,190 L196.5,189 L197,188.5 L197.5,188 L197.5,187 L198,186.5 L198.5,186 L198.5,185 L199,184.5 L199.5,184 L199.5,183 L199.5,182 L200,181.5 L200.5,181 L200.5,180 L200.5,179 L201,178.5 L201.5,178 L201.5,177 L201.5,176 L202,175.5 L202.5,175 L202.5,174 L202.5,173 L203,172.5 L203.5,172 L203.5,171 L203.5,170 L204,169.5 L204.5,169 L204.5,168 L204.5,167 L205,166.5 L205.5,166 L205.5,165 L205.5,164 L205.5,163 L205.5,162 L206,161.5 L206.5,161 L206.5,160 L206.5,159 L206.5,158 L206.5,157 L207,156.5 L207.5,156 L207.5,155 L207.5,154 L207.5,153 L207.5,152 L207,151.5 L206.5,151 L206,150.5 L205.5,150 L205,149.5 L204.5,149 L204,148.5 L203,148.5 L202.5,148 L202,147.5 L201.5,147 L201,146.5 L200,146.5 L199.5,146 L199,145.5 L198.5,145 L198,144.5 L197,144.5 L196.5,144 L196,143.5 L195.5,143 L195,142.5 L194,142.5 L193.5,142 L193,141.5 L192.5,141 L192,140.5 L191.5,140 L191,139.5 L190,139.5 L189.5,139 L189,138.5 L188.5,138 L188,137.5 L187,137.5 L186.5,137 L186,136.5 L185.5,136 L185,135.5 L184,135.5 L183.5,135 L183,134.5 L182.5,134 L182,133.5 L181.5,134 L181.5,135 L181,135.5 L180.5,135 L180.5,134 L180.5,133 L180,132.5 L179.5,132 L179,131.5 L178,131.5 L177.5,131 L177,130.5 L176.5,130 L176,129.5 L175,129.5 L174.5,129 L174,128.5 L173.5,128 L173,127.5 L172,127.5 L171.5,127 L171,126.5 L170.5,126 L170,125.5 L169,125.5 L168.5,125 L168,124.5 L167.5,124 L167,123.5 L166,123.5 L165.5,123 L165,122.5 L164.5,122 L164,121.5 L163.5,121 L163,120.5 L162,120.5 L161.5,120 L161,119.5 L160.5,119 L160,118.5 L159,118.5 L158.5,118 L158,117.5 L157.5,117 L157,116.5 L156,116.5 L155.5,116 L155,115.5 L154.5,115 L154,114.5 L153,114.5 L152.5,114 L152,113.5 L151.5,113 L151,112.5 L150,112.5 L149.5,112 L149,111.5 L148.5,111 L148,110.5 L147,110.5 L146.5,110 L146,109.5 L145.5,109 L145,108.5 L144,108.5 L143.5,108 L143,107.5 L142.5,107 L142,106.5 L141,106.5 L140.5,106 L140,105.5 L139.5,105 L139,104.5 L138,104.5 L137.5,104 L137,103.5 L136.5,103 L136,102.5 L135,102.5 L134.5,102 L134,101.5 L133.5,101 L133,100.5 L132.5,100 L132,99.5 L131,99.5 L130.5,99 L130,98.5 L129.5,98 L129,97.5 L128,97.5 L127.5,97 L127,96.5 L126.5,96 L126,95.5 L125,95.5 L124.5,95 L124,94.5 L123.5,94 L123,93.5 L122,93.5 L121.5,93 L121,92.5 L120.5,92 L120,91.5 L119,91.5 L118.5,91 L118,90.5 L117.5,90 L117,89.5 L116,89.5 L115.5,89 L115,88.5 L114.5,88 L114,87.5 L113,87.5 L112.5,87 L112,86.5 L111.5,86 L111,85.5 L110,85.5 L109.5,85 L109,84.5 L108.5,84 L108,83.5 L107.5,83 L107,82.5 L106,82.5 L105.5,82 L105,81.5 L104.5,81 L104,80.5 L103,80.5 L102.5,80 L102,79.5 L101.5,79 L101,78.5 L100,78.5 L99.5,78 L99,77.5 L98.5,77 L98,76.5 L97,76.5 L96.5,76 L96,75.5 L95.5,75 L95,74.5 L94,74.5 L93.5,74 L93,73.5 L92.5,73 L92,72.5 L91,72.5 L90.5,72 L90,71.5 L89.5,71 L89,70.5 L88,70.5 L87.5,70 L87,69.5 L86.5,69 L86,68.5 L85,68.5 L84.5,68 L84,67.5 L83,67.5 L82,67.5 L81,67.5 L80.5,67 L80.5,66 L80,65.5 L79.5,65 L79,64.5 L78,64.5 L77,64.5 L76.5,64 L76,63.5 L75.5,64 L75,64.5 L74.5,64 L74.5,63 L74.5,62 L74,61.5 L73.5,61 L73,60.5 L72,60.5 L71.5,61 L71,61.5 L70.5,61 L70,60.5 L69.5,60 L69,59.5 L68.5,59 L69,58.5 L69.5,58 L69,57.5 L68.5,57 L68,56.5 L67.5,56 L67,55.5 L66,55.5 L65.5,55 L65,54.5 L64.5,54 L64,53.5 L63,53.5 L62.5,53 L62,52.5 L61.5,52 L61,51.5 L60,51.5 L59.5,51 L59,50.5 L58.5,50 L58,49.5 L57,49.5 L56.5,49 L56,48.5 L55.5,48 L55,47.5 L54,47.5 L53.5,47 L53,46.5 L52.5,46 L52,45.5 L51,45.5 L50.5,45 L50,44.5 L49.5,44 L49,43.5 L48,43.5 L47.5,43 L47,42.5 L46,42.5 L45,42.5 L44,42.5 L43,42.5 L42,42.5 L41,42.5 L40,42.5 L39,42.5 L38,42.5ZM171,43.5 L170.5,44 L170,44.5 L169,44.5 L168,44.5 L167.5,45 L167,45.5 L166,45.5 L165,45.5 L164,45.5 L163.5,46 L163,46.5 L162,46.5 L161,46.5 L160,46.5 L159.5,47 L159,47.5 L158,47.5 L157,47.5 L156,47.5 L155.5,48 L155,48.5 L154,48.5 L153,48.5 L152,48.5 L151.5,49 L151,49.5 L150,49.5 L149,49.5 L148,49.5 L147.5,50 L147,50.5 L146,50.5 L145,50.5 L144,50.5 L143.5,51 L143,51.5 L142,51.5 L141,51.5 L140,51.5 L139.5,52 L139.5,53 L140,53.5 L140.5,54 L141,54.5 L142,54.5 L142.5,55 L143,55.5 L143.5,56 L144,56.5 L144.5,57 L145,57.5 L146,57.5 L146.5,58 L147,58.5 L147.5,59 L148,59.5 L148.5,60 L149,60.5 L150,60.5 L150.5,61 L151,61.5 L151.5,62 L152,62.5 L152.5,63 L153,63.5 L153.5,64 L154,64.5 L155,64.5 L155.5,65 L156,65.5 L156.5,66 L157,66.5 L157.5,67 L158,67.5 L159,67.5 L159.5,68 L160,68.5 L160.5,69 L161,69.5 L161.5,70 L162,70.5 L162.5,71 L163,71.5 L164,71.5 L164.5,72 L165,72.5 L165.5,73 L166,73.5 L166.5,74 L167,74.5 L168,74.5 L168.5,75 L169,75.5 L169.5,76 L170,76.5 L170.5,77 L171,77.5 L172,77.5 L172.5,78 L173,78.5 L173.5,79 L174,79.5 L174.5,80 L175,80.5 L175.5,81 L176,81.5 L177,81.5 L177.5,82 L178,82.5 L178.5,82 L179,81.5 L180,81.5 L180.5,82 L180,82.5 L179.5,83 L179.5,84 L180,84.5 L181,84.5 L182,84.5 L182.5,85 L183,85.5 L184,85.5 L185,85.5 L185.5,85 L185.5,84 L185.5,83 L185.5,82 L186,81.5 L186.5,81 L186.5,80 L186.5,79 L186.5,78 L186.5,77 L187,76.5 L187.5,76 L187.5,75 L187.5,74 L187.5,73 L187.5,72 L187.5,71 L188,70.5 L188.5,70 L188.5,69 L188.5,68 L188.5,67 L188.5,66 L188.5,65 L189,64.5 L189.5,64 L189.5,63 L189.5,62 L189.5,61 L189.5,60 L190,59.5 L190.5,59 L190.5,58 L190.5,57 L190.5,56 L190.5,55 L190,54.5 L189,54.5 L188.5,54 L189,53.5 L190,53.5 L190.5,53 L190,52.5 L189.5,52 L189,51.5 L188.5,51 L188,50.5 L187.5,50 L187,49.5 L186.5,49 L186,48.5 L185,48.5 L184.5,48 L184,47.5 L183.5,47 L183,46.5 L182,46.5 L181.5,46 L181,45.5 L180,45.5 L179.5,45 L179,44.5 L178,44.5 L177.5,44 L177,43.5 L176,43.5 L175,43.5 L174,43.5 L173,43.5 L172,43.5 L171,43.5ZM-0.5,50 L0,49.5 L0.5,50 L0,50.5 L-0.5,50ZM-0.5,52 L0,51.5 L0.5,52 L0,52.5 L-0.5,52ZM187.5,55 L188,54.5 L188.5,55 L188.5,56 L188,56.5 L187.5,56 L187.5,55ZM1,57.5 L0.5,58 L1,58.5 L1.5,58 L1,57.5ZM71.5,62 L72,61.5 L72.5,62 L72,62.5 L71.5,62ZM-0.5,79 L0,78.5 L0.5,79 L1,79.5 L1.5,80 L1.5,81 L1.5,82 L1,82.5 L0.5,82 L0.5,81 L0,80.5 L-0.5,80 L-0.5,79ZM176.5,80 L177,79.5 L178,79.5 L178.5,80 L178.5,81 L178,81.5 L177.5,81 L177,80.5 L176.5,80ZM0.5,86 L1,85.5 L2,85.5 L2.5,86 L2,86.5 L1,86.5 L0.5,86ZM-0.5,88 L0,87.5 L0.5,88 L1,88.5 L1.5,89 L1.5,90 L1.5,91 L1.5,92 L1,92.5 L0,92.5 L-0.5,92 L-0.5,91 L-0.5,90 L-0.5,89 L-0.5,88ZM-0.5,96 L0,95.5 L1,95.5 L1.5,96 L1,96.5 L0.5,97 L0,97.5 L-0.5,97 L-0.5,96ZM-0.5,99 L0,98.5 L0.5,99 L0,99.5 L-0.5,99ZM0.5,108 L1,107.5 L1.5,108 L1.5,109 L1,109.5 L0.5,109 L0.5,108ZM87.5,111 L88,110.5 L88.5,111 L88,111.5 L87.5,111ZM-0.5,117 L0,116.5 L0.5,117 L0.5,118 L0.5,119 L0.5,120 L0,120.5 L-0.5,120 L-0.5,119 L-0.5,118 L-0.5,117ZM-0.5,124 L0,123.5 L1,123.5 L1.5,124 L1.5,125 L1,125.5 L0,125.5 L-0.5,125 L-0.5,124ZM176.5,136 L177,135.5 L178,135.5 L179,135.5 L179.5,136 L179,136.5 L178,136.5 L177,136.5 L176.5,136ZM181.5,136 L182,135.5 L183,135.5 L183.5,136 L184,136.5 L184.5,137 L184,137.5 L183,137.5 L182.5,137 L182,136.5 L181.5,136ZM117.5,141 L118,140.5 L118.5,141 L119,141.5 L119.5,142 L120,142.5 L120.5,143 L120.5,144 L120,144.5 L119.5,144 L119,143.5 L118.5,143 L118,142.5 L117.5,142 L117.5,141ZM44,143.5 L43.5,144 L43.5,145 L43.5,146 L43,146.5 L42.5,147 L42.5,148 L42,148.5 L41.5,149 L41.5,150 L41.5,151 L41,151.5 L40.5,152 L40.5,153 L40,153.5 L39.5,154 L39.5,155 L39,155.5 L38.5,156 L38.5,157 L38.5,158 L38,158.5 L37.5,159 L37.5,160 L37,160.5 L36.5,161 L36.5,162 L36,162.5 L35.5,163 L35.5,164 L35.5,165 L35,165.5 L34.5,166 L34.5,167 L34,167.5 L33.5,168 L33.5,169 L33.5,170 L33,170.5 L32.5,171 L32.5,172 L32,172.5 L31.5,173 L31.5,174 L31,174.5 L30.5,175 L30.5,176 L30.5,177 L30,177.5 L29.5,178 L29.5,179 L29.5,180 L29.5,181 L29.5,182 L29.5,183 L30,183.5 L30.5,184 L31,184.5 L31.5,185 L32,185.5 L33,185.5 L33.5,186 L34,186.5 L34.5,187 L35,187.5 L35.5,188 L36,188.5 L37,188.5 L37.5,189 L38,189.5 L38.5,190 L39,190.5 L39.5,191 L40,191.5 L41,191.5 L41.5,192 L42,192.5 L42.5,193 L43,193.5 L43.5,194 L44,194.5 L44.5,195 L45,195.5 L46,195.5 L46.5,196 L47,196.5 L47.5,197 L48,197.5 L49,197.5 L49.5,198 L50,198.5 L50.5,198 L51,197.5 L52,197.5 L53,197.5 L53.5,198 L53,198.5 L52.5,199 L53,199.5 L54,199.5 L55,199.5 L55.5,199 L56,198.5 L57,198.5 L57.5,199 L58,199.5 L59,199.5 L59.5,199 L60,198.5 L61,198.5 L62,198.5 L62.5,198 L63,197.5 L64,197.5 L65,197.5 L65.5,197 L66,196.5 L67,196.5 L68,196.5 L68.5,196 L69,195.5 L70,195.5 L71,195.5 L71.5,195 L72,194.5 L73,194.5 L74,194.5 L74.5,194 L75,193.5 L76,193.5 L77,193.5 L77.5,193 L78,192.5 L79,192.5 L80,192.5 L81,192.5 L81.5,192 L82,191.5 L83,191.5 L84,191.5 L84.5,191 L85,190.5 L86,190.5 L87,190.5 L87.5,190 L88,189.5 L89,189.5 L90,189.5 L90.5,189 L90.5,188 L90,187.5 L89.5,187 L89,186.5 L88.5,186 L88,185.5 L87.5,185 L87,184.5 L86.5,184 L86,183.5 L85.5,183 L85,182.5 L84.5,182 L84,181.5 L83.5,181 L83,180.5 L82.5,180 L82,179.5 L81.5,179 L81,178.5 L80.5,178 L80,177.5 L79.5,177 L79,176.5 L78.5,176 L78,175.5 L77.5,175 L77,174.5 L76.5,174 L76,173.5 L75.5,173 L75,172.5 L74.5,172 L74,171.5 L73.5,171 L73,170.5 L72.5,170 L72,169.5 L71.5,169 L71,168.5 L70.5,168 L70,167.5 L69.5,167 L69,166.5 L68.5,166 L68,165.5 L67.5,165 L67,164.5 L66.5,164 L66,163.5 L65.5,163 L65,162.5 L64.5,162 L64,161.5 L63.5,161 L63,160.5 L62.5,160 L62,159.5 L61.5,159 L61,158.5 L60.5,158 L60,157.5 L59.5,157 L59,156.5 L58.5,156 L58,155.5 L57,155.5 L56.5,155 L56,154.5 L55.5,154 L55,153.5 L54.5,153 L54,152.5 L53.5,152 L53,151.5 L52.5,151 L52,150.5 L51.5,150 L51,149.5 L50.5,149 L50,148.5 L49.5,148 L49,147.5 L48.5,147 L48,146.5 L47.5,146 L47,145.5 L46.5,145 L46,144.5 L45.5,144 L45,143.5 L44,143.5ZM3.5,177 L4,176.5 L4.5,177 L4.5,178 L4,178.5 L3.5,178 L3.5,177ZM50.5,195 L51,194.5 L51.5,195 L51,195.5 L50.5,195ZM51.5,196 L52,195.5 L52.5,196 L52,196.5 L51.5,196ZM248.5,223 L249,222.5 L250,222.5 L251,222.5 L251.5,223 L251,223.5 L250,223.5 L249,223.5 L248.5,223ZM246.5,224 L247,223.5 L248,223.5 L248.5,224 L248,224.5 L247,224.5 L246.5,224ZM251.5,224 L252,223.5 L253,223.5 L253.5,224 L253,224.5 L252,224.5 L251.5,224ZM245.5,225 L246,224.5 L246.5,225 L246.5,226 L246,226.5 L245.5,226 L245.5,225ZM253.5,225 L254,224.5 L254.5,225 L254.5,226 L254,226.5 L253.5,226 L253.5,225ZM248.5,226 L249,225.5 L249.5,226 L249.5,227 L250,227.5 L250.5,228 L250,228.5 L249.5,229 L249.5,230 L249,230.5 L248.5,230 L248.5,229 L248.5,228 L248.5,227 L248.5,226ZM250.5,226 L251,225.5 L251.5,226 L251.5,227 L251,227.5 L250.5,227 L250.5,226ZM33,226.5 L32.5,227 L33,227.5 L33.5,227 L33,226.5ZM244.5,227 L245,226.5 L245.5,227 L245.5,228 L245.5,229 L245,229.5 L244.5,229 L244.5,228 L244.5,227ZM254.5,227 L255,226.5 L255.5,227 L255.5,228 L255.5,229 L255,229.5 L254.5,229 L254.5,228 L254.5,227ZM92,227.5 L91.5,228 L92,228.5 L92.5,228 L92,227.5ZM245.5,230 L246,229.5 L246.5,230 L246.5,231 L246,231.5 L245.5,231 L245.5,230ZM250.5,230 L251,229.5 L251.5,230 L251,230.5 L250.5,230ZM253.5,230 L254,229.5 L254.5,230 L254.5,231 L254,231.5 L253.5,231 L253.5,230ZM246.5,232 L247,231.5 L248,231.5 L248.5,232 L248,232.5 L247,232.5 L246.5,232ZM251.5,232 L252,231.5 L253,231.5 L253.5,232 L253,232.5 L252,232.5 L251.5,232ZM248.5,233 L249,232.5 L250,232.5 L251,232.5 L251.5,233 L251,233.5 L250,233.5 L249,233.5 L248.5,233ZM125,233.5 L124.5,234 L124.5,235 L125,235.5 L126,235.5 L127,235.5 L128,235.5 L128.5,235 L128,234.5 L127.5,234 L127,233.5 L126,233.5 L125,233.5ZM108.5,236 L109,235.5 L110,235.5 L111,235.5 L112,235.5 L113,235.5 L113.5,236 L113,236.5 L112,236.5 L111,236.5 L110,236.5 L109,236.5 L108.5,236Z\" /></g></svg>\n", F = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\" fill=\"currentColor\" role=\"img\" aria-label=\"cs2 module\"><title>cs2 module</title><desc>Adapted monochrome mark from Valve artwork. Source: https://cdn.fastly.steamstatic.com/apps/csgo/images/csgo_react/global/cs2_icon_color_512x512.png. Valve retains its rights.</desc><g transform=\"translate(0.00000 0.00000) scale(0.39062500)\"><path fill-rule=\"evenodd\" d=\"M120.5,0 L121,-0.5 L122,-0.5 L123,-0.5 L124,-0.5 L125,-0.5 L126,-0.5 L127,-0.5 L128,-0.5 L129,-0.5 L130,-0.5 L131,-0.5 L132,-0.5 L133,-0.5 L134,-0.5 L135,-0.5 L136,-0.5 L137,-0.5 L137.5,0 L138,0.5 L139,0.5 L139.5,1 L140,1.5 L141,1.5 L141.5,2 L142,2.5 L143,2.5 L143.5,3 L144,3.5 L144.5,4 L145,4.5 L146,4.5 L146.5,5 L147,5.5 L147.5,6 L148,6.5 L148.5,7 L148.5,8 L149,8.5 L149.5,9 L150,9.5 L150.5,10 L150.5,11 L151,11.5 L151.5,12 L151.5,13 L152,13.5 L152.5,14 L152.5,15 L153,15.5 L153.5,16 L154,16.5 L155,16.5 L155.5,17 L155.5,18 L155.5,19 L155.5,20 L155,20.5 L154.5,21 L154.5,22 L154.5,23 L154.5,24 L154,24.5 L153.5,25 L153.5,26 L153.5,27 L153.5,28 L153,28.5 L152,28.5 L151,28.5 L150,28.5 L149,28.5 L148.5,29 L148.5,30 L148.5,31 L149,31.5 L150,31.5 L151,31.5 L152,31.5 L153,31.5 L154,31.5 L155,31.5 L156,31.5 L157,31.5 L158,31.5 L159,31.5 L160,31.5 L161,31.5 L162,31.5 L163,31.5 L164,31.5 L165,31.5 L166,31.5 L167,31.5 L168,31.5 L169,31.5 L170,31.5 L171,31.5 L172,31.5 L173,31.5 L174,31.5 L175,31.5 L176,31.5 L177,31.5 L178,31.5 L179,31.5 L180,31.5 L181,31.5 L182,31.5 L183,31.5 L184,31.5 L185,31.5 L186,31.5 L187,31.5 L188,31.5 L189,31.5 L190,31.5 L191,31.5 L192,31.5 L193,31.5 L194,31.5 L195,31.5 L196,31.5 L197,31.5 L198,31.5 L199,31.5 L200,31.5 L201,31.5 L202,31.5 L203,31.5 L204,31.5 L205,31.5 L206,31.5 L207,31.5 L208,31.5 L209,31.5 L210,31.5 L211,31.5 L212,31.5 L213,31.5 L214,31.5 L215,31.5 L216,31.5 L217,31.5 L218,31.5 L219,31.5 L219.5,31 L220,30.5 L220.5,30 L221,29.5 L221.5,29 L221.5,28 L222,27.5 L223,27.5 L223.5,28 L223.5,29 L223.5,30 L223.5,31 L223.5,32 L223.5,33 L224,33.5 L225,33.5 L226,33.5 L227,33.5 L228,33.5 L229,33.5 L230,33.5 L231,33.5 L232,33.5 L233,33.5 L234,33.5 L235,33.5 L236,33.5 L237,33.5 L238,33.5 L239,33.5 L239.5,34 L239.5,35 L239.5,36 L239.5,37 L239,37.5 L238,37.5 L237,37.5 L236,37.5 L235,37.5 L234,37.5 L233,37.5 L232,37.5 L231,37.5 L230,37.5 L229,37.5 L228,37.5 L227,37.5 L226,37.5 L225,37.5 L224,37.5 L223.5,38 L223.5,39 L223.5,40 L223.5,41 L223.5,42 L223.5,43 L223.5,44 L223.5,45 L223,45.5 L222,45.5 L221,45.5 L220,45.5 L219,45.5 L218,45.5 L217,45.5 L216,45.5 L215,45.5 L214,45.5 L213,45.5 L212,45.5 L211,45.5 L210,45.5 L209,45.5 L208,45.5 L207,45.5 L206,45.5 L205,45.5 L204,45.5 L203,45.5 L202,45.5 L201,45.5 L200,45.5 L199,45.5 L198,45.5 L197,45.5 L196,45.5 L195,45.5 L194,45.5 L193,45.5 L192,45.5 L191,45.5 L190,45.5 L189,45.5 L188,45.5 L187,45.5 L186,45.5 L185,45.5 L184,45.5 L183,45.5 L182.5,46 L182.5,47 L182,47.5 L181.5,48 L181.5,49 L181.5,50 L181.5,51 L181.5,52 L181,52.5 L180.5,53 L180.5,54 L180.5,55 L180,55.5 L179.5,56 L179,56.5 L178.5,57 L178.5,58 L179,58.5 L179.5,59 L179.5,60 L179.5,61 L179.5,62 L180,62.5 L180.5,63 L180.5,64 L180.5,65 L180.5,66 L180.5,67 L181,67.5 L181.5,68 L181.5,69 L181.5,70 L181.5,71 L182,71.5 L182.5,72 L182,72.5 L181.5,73 L181,73.5 L180,73.5 L179,73.5 L178,73.5 L177.5,74 L177,74.5 L176,74.5 L175,74.5 L174,74.5 L173,74.5 L172.5,75 L172,75.5 L171,75.5 L170,75.5 L169,75.5 L168.5,76 L168,76.5 L167.5,76 L167.5,75 L167,74.5 L166.5,74 L166.5,73 L166.5,72 L166.5,71 L166,70.5 L165.5,70 L165,69.5 L164.5,70 L164.5,71 L164,71.5 L163.5,72 L163.5,73 L163,73.5 L162.5,74 L162.5,75 L162.5,76 L162,76.5 L161.5,77 L161.5,78 L161,78.5 L160.5,79 L160.5,80 L160.5,81 L160,81.5 L159.5,82 L159,82.5 L158,82.5 L157.5,83 L157,83.5 L156,83.5 L155.5,84 L155,84.5 L154,84.5 L153,84.5 L152.5,85 L152,85.5 L151,85.5 L150,85.5 L149,85.5 L148,85.5 L147.5,85 L147,84.5 L146,84.5 L145.5,84 L145,83.5 L144,83.5 L143.5,83 L143,82.5 L142.5,82 L142,81.5 L141,81.5 L140.5,81 L140,80.5 L139,80.5 L138.5,80 L138,79.5 L137,79.5 L136.5,80 L136,80.5 L135.5,81 L135,81.5 L134.5,82 L134,82.5 L133.5,83 L133,83.5 L132.5,84 L132.5,85 L133,85.5 L133.5,86 L133.5,87 L134,87.5 L134.5,88 L135,88.5 L135.5,89 L135,89.5 L134.5,90 L134.5,91 L134,91.5 L133.5,92 L133.5,93 L133,93.5 L132.5,94 L132.5,95 L132,95.5 L131.5,96 L131,96.5 L130.5,97 L130.5,98 L130,98.5 L129.5,99 L129.5,100 L129,100.5 L128.5,101 L128.5,102 L128,102.5 L127.5,103 L127.5,104 L127,104.5 L126.5,105 L126.5,106 L126,106.5 L125.5,107 L125.5,108 L125,108.5 L124.5,109 L124.5,110 L124,110.5 L123.5,111 L123.5,112 L123,112.5 L122.5,113 L122,113.5 L121,113.5 L120,113.5 L119,113.5 L118.5,114 L118.5,115 L118.5,116 L118.5,117 L118.5,118 L118.5,119 L118.5,120 L118.5,121 L118.5,122 L118.5,123 L118.5,124 L118.5,125 L118.5,126 L119,126.5 L119.5,127 L119.5,128 L120,128.5 L120.5,129 L121,129.5 L121.5,130 L122,130.5 L122.5,131 L122.5,132 L123,132.5 L123.5,133 L123.5,134 L124,134.5 L124.5,135 L124.5,136 L125,136.5 L125.5,137 L125.5,138 L126,138.5 L126.5,139 L127,139.5 L127.5,140 L127.5,141 L128,141.5 L128.5,142 L128.5,143 L129,143.5 L129.5,144 L129.5,145 L130,145.5 L130.5,146 L130.5,147 L131,147.5 L131.5,148 L132,148.5 L132.5,149 L132.5,150 L133,150.5 L133.5,151 L133.5,152 L134,152.5 L134.5,153 L134.5,154 L135,154.5 L135.5,155 L135.5,156 L136,156.5 L136.5,157 L136.5,158 L137,158.5 L137.5,159 L138,159.5 L138.5,160 L138.5,161 L139,161.5 L139.5,162 L139.5,163 L140,163.5 L140.5,164 L140.5,165 L141,165.5 L141.5,166 L141.5,167 L142,167.5 L142.5,168 L142.5,169 L143,169.5 L143.5,170 L143.5,171 L143.5,172 L144,172.5 L144.5,173 L144.5,174 L144.5,175 L144.5,176 L144.5,177 L144.5,178 L144.5,179 L144.5,180 L144.5,181 L144.5,182 L144,182.5 L143.5,183 L143.5,184 L143,184.5 L142.5,185 L142.5,186 L142.5,187 L142,187.5 L141.5,188 L141.5,189 L141,189.5 L140.5,190 L140.5,191 L140.5,192 L140,192.5 L139.5,193 L139.5,194 L139,194.5 L138.5,195 L138.5,196 L138.5,197 L138,197.5 L137.5,198 L137.5,199 L137,199.5 L136.5,200 L136.5,201 L136,201.5 L135.5,202 L135.5,203 L135.5,204 L135,204.5 L134.5,205 L134.5,206 L134,206.5 L133.5,207 L133.5,208 L133.5,209 L133,209.5 L132.5,210 L132.5,211 L132,211.5 L131.5,212 L131.5,213 L131.5,214 L131,214.5 L130.5,215 L130.5,216 L130,216.5 L129.5,217 L129.5,218 L129.5,219 L129,219.5 L128.5,220 L128.5,221 L128,221.5 L127.5,222 L127.5,223 L127,223.5 L126.5,224 L126.5,225 L126.5,226 L126,226.5 L125.5,227 L125.5,228 L125,228.5 L124.5,229 L124.5,230 L124.5,231 L124,231.5 L123.5,232 L123,232.5 L122.5,233 L122,233.5 L121.5,234 L121,234.5 L120.5,235 L120,235.5 L119.5,236 L119,236.5 L118.5,237 L118,237.5 L117.5,238 L117,238.5 L116.5,239 L116.5,240 L116.5,241 L117,241.5 L117.5,242 L118,242.5 L118.5,243 L118.5,244 L119,244.5 L119.5,245 L120,245.5 L120.5,246 L121,246.5 L121.5,247 L122,247.5 L123,247.5 L124,247.5 L124.5,248 L125,248.5 L126,248.5 L127,248.5 L127.5,249 L128,249.5 L129,249.5 L130,249.5 L131,249.5 L131.5,250 L132,250.5 L133,250.5 L134,250.5 L134.5,251 L135,251.5 L135.5,252 L135.5,253 L135.5,254 L135,254.5 L134.5,255 L134,255.5 L133,255.5 L132,255.5 L131,255.5 L130,255.5 L129,255.5 L128,255.5 L127,255.5 L126,255.5 L125,255.5 L124,255.5 L123,255.5 L122,255.5 L121,255.5 L120,255.5 L119,255.5 L118,255.5 L117,255.5 L116,255.5 L115,255.5 L114,255.5 L113,255.5 L112,255.5 L111,255.5 L110,255.5 L109,255.5 L108,255.5 L107,255.5 L106,255.5 L105,255.5 L104,255.5 L103,255.5 L102,255.5 L101,255.5 L100,255.5 L99,255.5 L98,255.5 L97,255.5 L96,255.5 L95,255.5 L94,255.5 L93,255.5 L92.5,255 L92.5,254 L93,253.5 L93.5,253 L93.5,252 L93.5,251 L93.5,250 L93.5,249 L93.5,248 L93.5,247 L94,246.5 L94.5,246 L94.5,245 L94.5,244 L95,243.5 L95.5,243 L95.5,242 L95.5,241 L95.5,240 L96,239.5 L96.5,239 L96.5,238 L96.5,237 L97,236.5 L97.5,236 L97.5,235 L97.5,234 L97.5,233 L98,232.5 L98.5,232 L98.5,231 L98.5,230 L99,229.5 L99.5,229 L99.5,228 L99.5,227 L99.5,226 L100,225.5 L100.5,225 L100.5,224 L100.5,223 L100.5,222 L101,221.5 L101.5,221 L101.5,220 L101.5,219 L101.5,218 L101.5,217 L102,216.5 L102.5,216 L102.5,215 L102.5,214 L102.5,213 L102.5,212 L102.5,211 L103,210.5 L103.5,210 L103.5,209 L103.5,208 L103.5,207 L103.5,206 L104,205.5 L104.5,205 L104.5,204 L104.5,203 L104.5,202 L104.5,201 L105,200.5 L105.5,200 L105.5,199 L106,198.5 L106.5,198 L106.5,197 L107,196.5 L107.5,196 L108,195.5 L108.5,195 L108.5,194 L109,193.5 L109.5,193 L109.5,192 L110,191.5 L110.5,191 L110.5,190 L111,189.5 L111.5,189 L111.5,188 L112,187.5 L112.5,187 L113,186.5 L113.5,186 L113.5,185 L114,184.5 L114.5,184 L114.5,183 L115,182.5 L115.5,182 L115.5,181 L115.5,180 L115.5,179 L115,178.5 L114,178.5 L113.5,178 L113,177.5 L112,177.5 L111.5,177 L111,176.5 L110.5,176 L110,175.5 L109.5,175 L109,174.5 L108.5,174 L108,173.5 L107.5,173 L107.5,172 L107,171.5 L106.5,171 L106,170.5 L105.5,170 L105,169.5 L104.5,169 L104.5,168 L104,167.5 L103.5,167 L103,166.5 L102.5,166 L102.5,165 L102,164.5 L101.5,164 L101,163.5 L100.5,163 L100.5,162 L100,161.5 L99.5,161 L99.5,160 L99,159.5 L98.5,159 L98,158.5 L97.5,158 L97.5,157 L97,156.5 L96.5,156 L96,155.5 L95.5,155 L95.5,154 L95,153.5 L94.5,153 L94.5,152 L94,151.5 L93.5,151 L93,150.5 L92.5,150 L92.5,149 L92,148.5 L91.5,148 L91,147.5 L90.5,147 L90,146.5 L89,146.5 L88.5,147 L88,147.5 L87,147.5 L86.5,148 L86.5,149 L86,149.5 L85.5,150 L85.5,151 L85,151.5 L84.5,152 L84.5,153 L84,153.5 L83.5,154 L83.5,155 L83,155.5 L82.5,156 L82.5,157 L82.5,158 L82,158.5 L81.5,159 L81.5,160 L81,160.5 L80.5,161 L80.5,162 L80,162.5 L79.5,163 L79.5,164 L79.5,165 L79,165.5 L78.5,166 L78.5,167 L78,167.5 L77.5,168 L77.5,169 L77,169.5 L76.5,170 L76.5,171 L76,171.5 L75.5,172 L75.5,173 L75.5,174 L75,174.5 L74.5,175 L74.5,176 L74,176.5 L73.5,177 L73.5,178 L73,178.5 L72.5,179 L72.5,180 L72.5,181 L72,181.5 L71.5,182 L71.5,183 L71,183.5 L70.5,184 L70.5,185 L70,185.5 L69.5,186 L69.5,187 L69,187.5 L68.5,188 L68.5,189 L68.5,190 L68,190.5 L67.5,191 L67,191.5 L66.5,192 L66.5,193 L66,193.5 L65.5,194 L65,194.5 L64.5,195 L64.5,196 L64,196.5 L63.5,197 L63,197.5 L62.5,198 L62,198.5 L61.5,199 L61.5,200 L61,200.5 L60.5,201 L60,201.5 L59.5,202 L59,202.5 L58.5,203 L58.5,204 L58,204.5 L57.5,205 L57,205.5 L56.5,206 L56,206.5 L55.5,207 L55,207.5 L54.5,208 L54.5,209 L54,209.5 L53.5,210 L53,210.5 L52.5,211 L52,211.5 L51.5,212 L51.5,213 L51,213.5 L50.5,214 L50,214.5 L49.5,215 L49,215.5 L48.5,216 L48.5,217 L48,217.5 L47.5,218 L47,218.5 L46.5,219 L46,219.5 L45.5,220 L45,220.5 L44.5,221 L44.5,222 L44,222.5 L43.5,223 L43,223.5 L42.5,224 L42,224.5 L41.5,225 L41.5,226 L41,226.5 L40.5,227 L40,227.5 L39.5,228 L39,228.5 L38.5,229 L38,229.5 L37.5,230 L37.5,231 L37,231.5 L36.5,232 L36,232.5 L35.5,233 L35,233.5 L34.5,234 L34.5,235 L34,235.5 L33.5,236 L33,236.5 L32.5,237 L32,237.5 L31.5,238 L31.5,239 L31,239.5 L30.5,240 L30,240.5 L29.5,241 L29.5,242 L29,242.5 L28.5,243 L28.5,244 L28.5,245 L28.5,246 L28.5,247 L28.5,248 L28.5,249 L28.5,250 L28.5,251 L28,251.5 L27.5,252 L27.5,253 L27.5,254 L27.5,255 L27,255.5 L26,255.5 L25,255.5 L24,255.5 L23,255.5 L22,255.5 L21,255.5 L20,255.5 L19,255.5 L18,255.5 L17,255.5 L16,255.5 L15,255.5 L14,255.5 L13,255.5 L12,255.5 L11,255.5 L10,255.5 L9,255.5 L8,255.5 L7,255.5 L6,255.5 L5,255.5 L4.5,255 L4.5,254 L5,253.5 L5.5,253 L5.5,252 L6,251.5 L6.5,251 L6.5,250 L7,249.5 L7.5,249 L7.5,248 L8,247.5 L8.5,247 L9,246.5 L9.5,246 L9.5,245 L10,244.5 L10.5,244 L10.5,243 L10.5,242 L10.5,241 L10.5,240 L10.5,239 L10.5,238 L10.5,237 L10.5,236 L10.5,235 L10.5,234 L11,233.5 L11.5,233 L11.5,232 L11.5,231 L12,230.5 L12.5,230 L12.5,229 L13,228.5 L13.5,228 L13.5,227 L14,226.5 L14.5,226 L14.5,225 L14.5,224 L15,223.5 L15.5,223 L15.5,222 L16,221.5 L16.5,221 L16.5,220 L17,219.5 L17.5,219 L17.5,218 L17.5,217 L18,216.5 L18.5,216 L18.5,215 L19,214.5 L19.5,214 L19.5,213 L20,212.5 L20.5,212 L20.5,211 L20.5,210 L21,209.5 L21.5,209 L21.5,208 L22,207.5 L22.5,207 L22.5,206 L23,205.5 L23.5,205 L23.5,204 L23.5,203 L24,202.5 L24.5,202 L24.5,201 L25,200.5 L25.5,200 L25.5,199 L26,198.5 L26.5,198 L26.5,197 L26.5,196 L27,195.5 L27.5,195 L27.5,194 L28,193.5 L28.5,193 L28.5,192 L29,191.5 L29.5,191 L29.5,190 L29.5,189 L30,188.5 L30.5,188 L30.5,187 L31,186.5 L31.5,186 L31.5,185 L32,184.5 L32.5,184 L33,183.5 L33.5,183 L34,182.5 L34.5,182 L35,181.5 L35.5,181 L36,180.5 L36.5,180 L37,179.5 L38,179.5 L38.5,179 L39,178.5 L39.5,178 L40,177.5 L40.5,177 L41,176.5 L42,176.5 L42.5,176 L43,175.5 L43.5,175 L43.5,174 L43.5,173 L44,172.5 L44.5,172 L44.5,171 L44.5,170 L44.5,169 L44.5,168 L44.5,167 L45,166.5 L45.5,166 L45.5,165 L45.5,164 L45.5,163 L45.5,162 L45.5,161 L45.5,160 L45.5,159 L45.5,158 L46,157.5 L46.5,157 L46.5,156 L46.5,155 L46.5,154 L46.5,153 L46.5,152 L46.5,151 L46.5,150 L46.5,149 L46.5,148 L46.5,147 L46.5,146 L47,145.5 L47.5,145 L47.5,144 L47.5,143 L47.5,142 L47.5,141 L47.5,140 L47.5,139 L47.5,138 L48,137.5 L48.5,137 L49,136.5 L50,136.5 L51,136.5 L52,136.5 L53,136.5 L53.5,136 L53.5,135 L54,134.5 L54.5,134 L54.5,133 L54.5,132 L55,131.5 L55.5,131 L55.5,130 L56,129.5 L56.5,129 L56.5,128 L56.5,127 L57,126.5 L57.5,126 L57.5,125 L57.5,124 L58,123.5 L58.5,123 L58.5,122 L59,121.5 L59.5,121 L59.5,120 L59.5,119 L60,118.5 L60.5,118 L61,117.5 L61.5,117 L62,116.5 L62.5,116 L63,115.5 L64,115.5 L64.5,115 L64.5,114 L65,113.5 L65.5,113 L65.5,112 L65.5,111 L66,110.5 L66.5,110 L66.5,109 L66.5,108 L67,107.5 L67.5,107 L67.5,106 L67.5,105 L68,104.5 L68.5,104 L68.5,103 L68.5,102 L68,101.5 L67,101.5 L66.5,101 L66,100.5 L65.5,100 L65,99.5 L64,99.5 L63.5,99 L63,98.5 L62.5,98 L62,97.5 L61.5,97 L61.5,96 L62,95.5 L62.5,95 L62.5,94 L62.5,93 L63,92.5 L63.5,92 L63.5,91 L63.5,90 L64,89.5 L64.5,89 L64.5,88 L64.5,87 L65,86.5 L65.5,86 L65.5,85 L65.5,84 L66,83.5 L66.5,83 L66.5,82 L66.5,81 L67,80.5 L67.5,80 L67.5,79 L67.5,78 L68,77.5 L68.5,77 L68.5,76 L68.5,75 L69,74.5 L69.5,74 L69.5,73 L70,72.5 L70.5,72 L70.5,71 L70.5,70 L71,69.5 L71.5,69 L72,68.5 L73,68.5 L74,68.5 L75,68.5 L76,68.5 L77,68.5 L78,68.5 L78.5,68 L79,67.5 L79.5,67 L79.5,66 L80,65.5 L80.5,65 L80.5,64 L81,63.5 L81.5,63 L81.5,62 L81.5,61 L82,60.5 L82.5,60 L82.5,59 L83,58.5 L83.5,58 L83.5,57 L84,56.5 L84.5,56 L84.5,55 L85,54.5 L85.5,54 L85.5,53 L85.5,52 L86,51.5 L86.5,51 L86.5,50 L87,49.5 L87.5,49 L87.5,48 L88,47.5 L88.5,47 L88.5,46 L89,45.5 L89.5,45 L90,44.5 L90.5,44 L90.5,43 L91,42.5 L91.5,42 L92,41.5 L92.5,41 L92.5,40 L93,39.5 L93.5,39 L94,38.5 L94.5,38 L95,37.5 L95.5,37 L96,36.5 L96.5,36 L97,35.5 L97.5,35 L98,34.5 L99,34.5 L99.5,34 L100,33.5 L100.5,33 L101,32.5 L102,32.5 L102.5,32 L103,31.5 L104,31.5 L105,31.5 L105.5,31 L106,30.5 L107,30.5 L108,30.5 L109,30.5 L110,30.5 L111,30.5 L112,30.5 L113,30.5 L113.5,30 L114,29.5 L114.5,29 L114.5,28 L115,27.5 L115.5,27 L115.5,26 L115,25.5 L114,25.5 L113.5,25 L113,24.5 L112,24.5 L111.5,24 L111.5,23 L111.5,22 L111.5,21 L111.5,20 L111.5,19 L111.5,18 L111.5,17 L111.5,16 L111.5,15 L111.5,14 L111.5,13 L111.5,12 L111.5,11 L111.5,10 L112,9.5 L112.5,9 L112.5,8 L113,7.5 L113.5,7 L113.5,6 L114,5.5 L114.5,5 L115,4.5 L115.5,4 L116,3.5 L116.5,3 L117,2.5 L117.5,2 L118,1.5 L119,1.5 L119.5,1 L120,0.5 L120.5,0Z\" /></g></svg>\n", I = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\" fill=\"currentColor\" role=\"img\" aria-label=\"deadlock module\"><title>deadlock module</title><desc>Adapted monochrome mark from Valve artwork. Source: https://cdn.fastly.steamstatic.com/apps/deadlock/images/react/deadlock_logo_dark.svg. Valve retains its rights.</desc><g transform=\"translate(0.00000 0.14577) scale(0.14577259)\"><path d=\"M114.464 120.969C114.464 120.969 114.614 123.215 115.512 124.113C118.656 127.856 123.147 129.652 121.5 135.341C120.602 138.485 113.117 142.676 111.47 146.269C95.6016 181.15 75.0921 214.235 61.3194 250.015C59.0738 256.003 51.2892 275.015 50.2413 279.207C49.1934 284.147 50.391 289.537 49.9419 294.627C48.7443 304.956 41.1094 339.837 43.2052 346.874C43.6543 348.67 46.0496 349.568 46.4987 352.413C50.0916 378.012 53.6845 401.965 60.8703 427.115C69.7028 458.104 87.0685 486.997 103.236 514.094C108.027 522.178 123.896 527.268 117.309 540.442C116.86 541.34 103.386 554.813 102.488 555.262C92.3081 560.352 89.0146 545.681 81.3797 541.041C78.9844 539.544 76.8886 542.837 74.3436 541.19C58.0259 531.31 27.9354 474.123 22.2467 454.96C10.1207 413.342 -3.20295 344.029 0.689351 301.513C1.13846 296.872 3.68343 294.626 4.28224 291.034C5.03076 286.093 3.83313 280.554 4.28224 275.315C8.62365 232.05 28.8337 201.51 49.9419 165.431C55.6307 155.85 59.5229 146.269 67.1578 137.137C72.5472 130.7 82.2779 121.718 90.811 120.67C96.6495 119.921 100.691 121.718 105.033 122.017C107.278 122.017 112.818 119.173 114.165 120.819L114.464 120.969Z\" fill=\"currentColor\" />\n<path d=\"M570.911 599.575C567.767 602.719 552.048 616.192 548.455 618.139C545.611 619.636 542.018 619.785 539.323 621.133C501.149 639.995 455.489 669.188 412.973 674.876C408.482 675.475 403.692 674.427 399.051 674.876C393.063 675.625 385.727 679.368 379.739 679.967C373.002 680.715 365.517 679.517 358.78 679.967C353.092 680.416 345.157 683.11 339.618 683.41C320.606 684.907 304.138 675.326 285.575 674.577C276.892 671.433 266.263 671.433 257.73 669.188C254.137 668.14 255.485 663.349 253.988 660.655C253.239 659.307 250.994 658.259 249.946 656.014C248.299 652.72 247.85 644.337 243.359 643.289C242.311 643.139 235.125 646.582 233.927 647.481C231.083 649.876 230.784 654.966 230.484 655.415C229.137 656.762 226.442 650.175 225.245 649.277C221.053 646.283 209.975 644.487 204.735 641.792C199.496 639.097 188.717 633.858 184.375 631.013C180.034 628.169 181.681 627.271 172.699 623.079C162.668 618.438 143.506 605.114 135.123 597.629C128.536 591.791 126.44 588.347 125.542 579.215C124.195 564.694 128.237 556.011 141.86 550.472C150.243 557.807 159.674 564.245 168.357 571.281C171.351 573.826 174.046 577.569 177.04 580.114C200.394 598.976 234.377 613.348 263.12 623.528C287.372 632.061 319.558 637.75 344.858 639.696C356.385 640.594 364.02 636.103 374.799 634.456C390.069 632.061 410.428 631.462 425.249 627.121C427.045 626.522 428.542 623.677 431.087 622.48C438.423 618.737 450.549 615.893 459.082 612.001C485.58 599.874 515.071 585.802 537.377 567.838C545.012 561.85 551.449 557.059 560.881 563.496C562.827 564.844 577.947 579.964 578.246 581.161C579.444 585.503 574.504 587.299 572.707 591.192C571.659 593.287 572.857 597.329 571.06 599.126L570.911 599.575ZM464.471 622.779C461.477 619.785 452.196 626.223 455.788 629.815C456.836 630.863 463.423 630.863 464.471 629.815C464.621 629.516 464.771 623.079 464.471 622.779ZM420.758 638.349C420.758 638.349 423.303 638.798 425.099 639.995C426.297 640.894 427.045 642.84 428.842 643.289C439.77 646.582 444.411 632.36 435.728 631.163C433.333 630.863 427.644 630.863 425.399 631.462C423.303 632.061 419.261 637.151 420.758 638.199V638.349Z\" fill=\"currentColor\" />\n<path d=\"M562.228 70.219C563.276 71.2669 561.779 79.8001 562.677 82.9439C564.324 88.483 572.857 86.5368 565.971 95.5191C561.779 101.058 550.851 111.537 543.964 112.136C537.078 112.735 535.132 104.501 530.94 102.406C528.245 101.058 525.85 101.956 523.305 101.358C516.868 99.4114 499.502 87.4351 490.67 83.2434C476.148 76.2073 460.729 67.3746 445.759 61.8355C412.375 49.41 369.41 44.6196 334.229 42.0746C318.81 41.0267 315.965 47.1645 303.989 48.8113C263.719 54.3504 244.108 59.8895 207.879 78.6026C189.016 88.3334 174.196 95.519 154.884 104.352C151.89 105.699 137.668 116.777 135.722 113.933C135.572 113.633 135.722 110.639 134.824 108.693C132.428 104.052 120.302 97.0162 119.853 92.0759C119.404 87.5848 126.889 80.9977 130.482 78.1533C161.022 53.7514 212.52 22.9124 250.545 14.6786C253.539 14.0798 256.383 14.6787 258.778 14.2296C277.641 10.3372 303.241 3.45071 321.654 1.95366C336.774 0.756023 353.541 2.70218 369.11 1.95366C372.703 1.95366 375.547 -0.14205 379.589 0.00765488C387.224 0.307064 395.757 5.54668 402.644 6.74432C430.938 11.8343 452.495 20.6667 479.592 29.4993C486.777 31.8945 496.808 32.6432 503.245 35.4876C523.904 44.4699 541.419 55.0989 558.785 69.1711C559.833 69.9197 561.48 69.7698 561.929 70.219H562.228Z\" fill=\"currentColor\" />\n<path d=\"M600.554 112.436C603.398 118.125 608.338 123.364 611.033 129.053C614.626 136.688 626.902 161.389 628.548 167.377C629.596 171.27 627.65 181.899 633.339 183.546C640.076 185.492 640.525 181.3 647.112 189.085C657.142 200.911 668.519 238.936 672.262 254.955C678.549 283.099 689.029 333.699 684.987 361.245C684.538 364.239 680.346 392.683 679.597 403.162C679.298 408.552 680.795 417.833 679.597 422.325C678.549 425.768 665.675 426.965 663.13 432.055C659.836 438.493 665.376 455.26 664.028 464.392C663.579 467.236 658.938 476.967 657.441 480.56C651.753 493.434 639.626 515.441 630.794 525.621C627.051 529.962 622.71 532.956 619.566 536.998C616.722 540.741 611.931 552.418 607.29 552.867C603.099 553.166 600.554 549.723 596.811 549.274C587.829 547.927 581.392 554.663 575.703 545.831C573.607 542.388 581.841 534.154 583.937 529.513C589.326 517.836 592.919 503.614 599.057 492.087C602.051 486.398 619.716 464.242 620.165 462.445C620.914 459.901 620.165 456.906 620.614 454.212C623.458 442.086 628.099 427.414 631.243 414.091C634.686 399.42 640.375 387.294 641.273 371.874C641.872 363.341 641.722 352.263 641.273 343.73C640.525 327.412 637.231 312.741 635.884 296.573C635.435 291.034 636.483 284.746 635.884 279.057C633.189 254.955 611.482 209.444 598.907 188.336C593.069 178.306 579.146 164.383 576.751 154.503C576.002 151.808 576.751 148.814 576.152 146.419C574.805 141.479 567.619 142.826 569.415 130.4C570.613 121.718 582.14 118.274 586.781 111.089C590.973 108.993 596.512 110.34 600.404 112.286L600.554 112.436Z\" fill=\"currentColor\" />\n<path d=\"M434.68 453.014C435.429 453.912 433.483 460.799 435.429 463.643C436.327 464.99 439.321 465.589 440.818 467.086C452.794 477.716 470.01 497.327 484.232 504.213C489.023 506.459 496.658 507.207 500.4 510.8C503.843 514.243 504.143 521.28 507.287 524.873C508.784 526.669 512.826 527.417 513.275 529.214C514.922 534.454 511.778 532.957 509.981 534.454C482.286 556.909 452.345 575.772 417.764 585.653C403.093 589.844 380.637 595.084 365.517 596.431C348.601 597.928 355.337 595.833 356.086 585.203C356.834 573.227 355.038 560.203 356.086 548.376C356.685 539.394 360.427 529.962 359.529 520.531C358.331 507.058 359.08 501.818 359.529 489.093C359.679 484.452 358.481 461.098 359.529 460.2C360.727 459.152 371.356 458.703 374.05 458.104C381.236 456.457 391.116 453.314 398.003 450.619C401.296 449.272 407.135 445.08 409.68 444.631C414.47 443.882 422.854 456.158 428.692 456.158C430.339 456.158 434.231 452.415 434.83 453.164L434.68 453.014Z\" fill=\"currentColor\" />\n<path d=\"M286.325 452.715C290.965 457.356 307.882 457.056 314.619 460.35C319.708 462.895 317.014 470.23 317.463 475.021C319.708 497.327 326.295 529.364 324.499 550.173C323.601 560.353 328.391 572.928 327.643 581.311C327.493 583.407 325.397 586.401 324.798 588.946C324.349 591.042 324.798 596.132 324.499 596.431C322.852 598.228 308.181 593.437 304.439 594.635C255.935 583.557 211.772 569.335 175.843 534.304C173.148 531.759 164.765 529.513 170.603 523.824C173.747 520.681 180.185 517.237 183.777 514.243C205.634 495.381 227.79 476.667 250.246 458.254C254.737 454.661 259.827 446.277 265.965 445.978C268.659 445.978 274.199 449.122 275.396 447.774C276.145 447.026 276.145 441.487 279.887 442.685C283.63 443.732 284.977 451.517 286.325 452.865V452.715ZM224.946 545.681C224.946 545.681 231.533 547.777 232.731 547.478C238.719 545.831 233.928 535.352 227.641 536.998C224.796 537.747 224.197 544.933 225.096 545.681H224.946Z\" fill=\"currentColor\" />\n<path d=\"M319.26 211.541C317.015 213.786 308.182 212.888 304.889 213.636C296.655 215.583 285.727 219.924 277.493 222.918C273.301 224.415 269.559 228.607 264.619 227.11C262.523 226.511 258.032 220.523 255.636 218.577C236.474 201.81 212.671 185.342 195.156 167.078C193.509 165.282 192.91 162.737 190.964 160.941C185.725 156.15 176.892 156.898 174.647 147.617C172.85 140.581 175.395 142.826 177.641 140.88C221.504 105.55 262.223 89.5312 318.512 83.9921C320.308 83.8424 322.404 82.0462 323.752 82.3456C327.644 83.0941 326.746 93.5733 326.446 97.1662C324.051 130.251 322.704 165.132 319.56 198.666C319.26 201.51 320.009 210.942 319.56 211.69L319.26 211.541Z\" fill=\"currentColor\" />\n<path d=\"M433.035 99.8609C435.281 97.6153 449.502 107.346 452.796 108.993C472.407 118.873 485.132 130.101 502.348 139.832C507.288 142.527 513.426 140.281 509.234 148.814C507.887 151.659 500.551 153.904 498.755 157.497C496.21 155.701 501.3 150.611 499.653 148.665C499.653 148.665 495.462 147.467 495.312 147.467C490.821 147.317 472.707 160.641 480.341 165.431C481.24 166.03 489.773 166.629 485.581 169.773C485.282 169.923 483.036 169.923 481.24 171.42C476.898 174.863 477.946 177.557 476.15 180.402C474.653 182.498 470.91 181.749 468.215 182.947C459.982 186.689 455.491 196.42 445.46 200.462C442.616 201.51 437.826 200.462 436.778 204.055C436.179 206.45 437.227 209.594 435.73 211.84C434.832 213.038 428.245 216.481 426.149 217.978C423.753 219.625 418.813 226.661 415.52 223.966C415.22 223.816 419.412 219.026 414.621 216.93C410.729 215.283 411.178 222.918 410.28 223.816C408.633 225.613 388.423 217.229 384.082 215.882C379.142 214.385 367.465 213.337 364.77 210.792C361.626 207.798 363.423 199.864 362.974 195.073C359.98 163.934 356.087 132.047 354.141 100.609C354.141 97.7648 353.542 82.7944 354.141 82.1956C355.339 80.9979 360.279 83.6926 362.075 83.8423C372.854 84.8903 382.285 85.6389 393.064 87.8844C398.154 88.9324 431.089 97.3157 431.089 100.609C431.089 101.208 422.855 109.592 430.191 111.987C437.676 114.382 432.287 100.31 432.885 99.711L433.035 99.8609Z\" fill=\"currentColor\" />\n<path d=\"M599.205 349.868C600.703 351.215 597.559 360.047 597.409 362.892C597.11 366.485 596.96 373.671 597.409 376.815C597.559 378.461 599.954 377.413 600.553 378.012C605.044 382.204 598.457 387.443 596.511 391.635C587.08 413.043 582.289 439.541 572.558 461.248C566.271 463.793 562.678 471.727 560.432 477.865C556.54 481.907 544.564 506.309 540.671 506.459C540.072 506.459 533.785 504.812 532.587 504.363C518.515 498.524 499.353 472.625 489.024 460.499C481.688 451.966 482.437 454.212 477.796 443.882C471.508 430.109 465.221 435.05 459.682 429.66C458.933 428.912 458.783 426.816 457.735 425.618C456.089 423.822 452.346 421.127 451.448 419.63C448.454 413.941 451.747 414.839 455.041 412.594C469.113 402.713 482.287 392.084 496.209 382.054C503.245 376.964 528.545 356.904 534.084 355.107C545.162 351.514 559.983 351.365 572.409 350.317C574.205 350.317 581.091 349.718 582.888 349.568C585.582 349.568 598.906 348.969 599.505 349.568L599.205 349.868Z\" fill=\"currentColor\" />\n<path d=\"M265.366 360.047C261.773 355.556 260.875 330.855 261.474 324.418C267.163 261.991 350.847 231.151 393.662 278.159C416.866 303.608 421.807 326.064 413.872 359.598C413.423 361.544 414.172 364.089 413.573 366.335C412.974 368.58 408.483 371.275 406.836 373.521C400.998 381.455 396.507 388.94 388.572 395.377C373.153 407.653 360.428 410.198 341.416 411.096C339.32 411.096 337.374 413.043 334.38 412.893C313.421 411.246 281.983 394.03 272.552 374.868C270.606 370.976 271.055 363.79 269.707 361.993C268.809 360.646 266.115 360.796 265.516 360.047H265.366ZM328.99 262.44L324.649 266.781L328.092 270.224L332.433 265.883L328.99 262.44ZM355.787 294.177C354.739 293.129 340.517 290.435 337.673 290.285C324.05 289.387 306.385 302.71 300.846 314.837C296.355 324.418 295.007 339.987 299.049 349.867C302.343 357.951 307.283 355.706 308.63 356.903C309.08 357.353 308.032 361.544 310.427 364.688C319.559 377.263 342.464 378.611 355.937 373.371C373.153 366.634 384.231 346.274 382.135 328.01C381.686 323.519 377.494 310.794 373.452 308.699C368.961 306.453 362.374 305.106 358.033 300.614C356.685 299.267 356.835 295.375 355.637 294.177H355.787ZM391.117 320.226C388.423 322.921 396.357 327.711 396.357 322.92C396.357 321.873 392.165 319.328 391.117 320.226ZM394.56 327.112C391.117 323.519 384.68 332.951 387.524 335.795C387.824 336.094 394.261 336.094 394.56 335.795C394.86 335.496 394.86 327.412 394.56 326.963V327.112Z\" fill=\"currentColor\" />\n<path d=\"M151.293 505.261C151.293 505.261 145.155 505.71 144.706 505.261C144.257 504.812 144.406 503.165 143.658 502.117C117.46 465.29 91.7106 427.414 86.9201 380.407C86.1715 372.623 88.5668 366.634 88.7165 361.245C88.7165 358.55 86.0218 357.652 85.423 355.856C82.4289 346.125 89.465 351.514 94.7047 351.814C105.783 352.562 137.37 351.514 145.155 355.556C149.796 357.952 156.682 365.736 161.173 365.736C163.269 365.736 165.664 362.592 167.161 366.934C167.91 369.179 166.862 371.125 169.107 373.82C171.054 376.215 177.491 379.21 180.635 381.605C184.377 384.599 200.845 399.12 203.39 399.27C210.575 399.57 206.384 397.024 214.767 401.665C217.013 402.863 220.755 402.713 221.504 405.408C222.103 407.354 221.504 409.899 221.953 411.995C223.6 417.983 231.384 414.54 221.803 426.217C212.222 438.043 199.946 448.373 190.216 459.451C177.79 473.374 165.664 487.446 153.389 501.369C152.041 502.866 152.041 505.111 151.442 505.56L151.293 505.261Z\" fill=\"currentColor\" />\n<path d=\"M532.737 166.33C533.635 167.228 531.988 181.3 532.737 182.049C535.132 184.444 540.372 178.007 542.318 178.606C556.54 198.666 569.713 218.726 579.145 241.481C584.085 253.308 588.876 267.081 591.87 279.507C594.864 291.932 595.612 304.507 598.457 316.633C599.654 317.831 597.409 319.777 596.511 319.927C593.666 320.825 582.887 320.376 579.145 320.076C576.151 319.927 573.606 318.28 570.612 318.13C563.875 317.681 541.12 319.178 537.228 314.837C534.234 311.394 536.03 306.304 528.395 306.004C525.401 306.004 523.006 308.549 520.611 307.052L452.346 254.506C459.082 246.721 466.568 239.386 473.304 231.751C488.275 214.684 503.694 198.067 518.814 181.001C520.461 179.055 529.892 163.036 532.737 166.03V166.33ZM502.347 215.583C500.401 216.032 494.263 220.223 494.263 221.421C494.263 223.966 503.544 228.457 507.287 227.409C511.479 226.361 512.676 213.187 502.347 215.433V215.583Z\" fill=\"currentColor\" />\n<path d=\"M84.9721 320.226C83.6247 318.879 89.4632 292.98 88.8644 288.189C99.9424 247.919 116.26 205.852 144.404 174.114C145.902 172.468 150.243 167.378 152.339 167.976C153.686 168.426 159.974 178.905 161.92 181.151C177.04 198.516 193.807 214.385 209.226 231.751C212.669 235.643 216.262 241.931 219.706 245.823C222.849 249.266 229.885 251.362 228.388 256.152C227.79 258.398 221.951 259.895 219.706 261.542C195.603 278.608 172.848 297.771 148.446 314.388C134.823 317.382 120.751 317.082 106.979 318.28C105.182 318.28 103.386 319.777 101.589 319.927C98.8945 320.077 85.5709 320.526 84.9721 319.927V320.226ZM99.0442 290.585C96.3496 293.13 100.99 303.16 105.332 304.357C109.523 305.555 115.661 300.315 116.41 296.423C117.158 292.381 108.775 288.339 105.332 288.788C104.583 288.788 99.4933 290.435 99.3436 290.734L99.0442 290.585Z\" fill=\"currentColor\" />\n<path d=\"M240.665 384.899C240.665 384.899 240.665 388.641 239.767 390.138C237.97 392.983 237.372 390.587 235.874 390.438C234.228 390.438 230.335 390.288 230.036 390.138C229.138 389.539 230.036 383.851 232.731 383.102C233.779 382.803 240.216 384.599 240.515 384.899H240.665Z\" fill=\"currentColor\" />\n<path d=\"M83.1751 573.676C82.5763 576.221 86.3189 578.018 83.1751 579.814C81.5283 580.862 76.7378 581.162 76.139 580.712C75.8396 580.413 77.636 574.125 77.9354 573.676C78.2348 573.377 81.678 573.676 83.1751 573.676Z\" fill=\"currentColor\" />\n<path d=\"M663.877 132.945C665.823 134.892 658.787 141.778 656.841 139.982C656.692 139.832 656.991 138.485 656.841 137.437C656.242 135.94 653.847 135.64 656.841 133.844C658.488 132.945 663.428 132.496 663.877 132.945Z\" fill=\"currentColor\" />\n</g></svg>\n", { UiProvider: L, PageHeader: R, SettingsLayout: z, Surface: B, SettingsGroup: V, StatusHint: H, FormField: U, FormGrid: ue, ActionBar: de } = r, fe = 0, pe = "steam", me = {
	steam: P,
	dota2: le,
	cs2: F,
	deadlock: I
};
function W(e, n) {
	let r = me[e];
	if (!r) return null;
	let i = new n.defaultView.DOMParser().parseFromString(r, "image/svg+xml").documentElement, a = {
		svg: ["viewBox", "fill"],
		g: ["transform"],
		path: [
			"d",
			"fill",
			"fill-rule",
			"clip-rule"
		]
	};
	function o(n) {
		let r = n.localName;
		if (!Object.hasOwn(a, r)) return null;
		let i = Object.fromEntries(a[r].filter((e) => n.hasAttribute(e)).map((e) => [e, n.getAttribute(e)]));
		return r === "svg" && Object.assign(i, {
			class: `steam-dlc-module-mark steam-dlc-module-mark--${e}`,
			"aria-hidden": "true",
			focusable: "false"
		}), t(r, i, [...n.children].map(o).filter(Boolean));
	}
	return i.localName === "svg" ? o(i) : null;
}
function he(i, o) {
	let s = n({ ...o.context });
	if ((o.context.owner.startsWith("steam_dlc/") ? o.context.owner.slice(10) : "") !== pe) throw Error("module_owner_mismatch");
	let c = pe, l = _(() => s.value.locale, r.translateUi, c), u = l.text, d = (e, t) => e === null && t !== l.textAt("zh-CN", "choice.followCore") ? t : r.uiThemeLabel?.(e, t, s.value.locale) ?? (e === null ? u("choice.followCore") : t), f = ee[c], p = o.routeId === "settings", m = o.routeId === "home", h = p && [
		"steam",
		"dota2",
		"cs2"
	].includes(c), g = {
		collage: "route.collage",
		wishlist: "workspace.wishlist",
		analysis: "workspace.analysis",
		query: "route.query"
	}[o.routeId], v = {
		collage: "section.createCollage",
		wishlist: "section.queryCriteria",
		analysis: "section.analysisCriteria",
		query: "section.queryCriteria"
	}[o.routeId], y = () => u(f ? "module.steam.summary" : "page.moduleMissing"), b = () => f ? u("module.steam.source") : "", x = !!(f && r.PageTemplate && r.uiText), S = `steam-dlc-${++fe}`, C, te, w, T, E = !1, D = () => {}, O = [], k = {
		actions(n) {
			if (x) {
				n.classList.add("ui-action-bar");
				return;
			}
			let r = [...n.childNodes], i = e({ setup: () => () => t(de, {}, { default: () => t("div", {
				style: { display: "contents" },
				ref: (e) => {
					if (e) for (let t of r) t.parentNode !== e && e.append(t);
				}
			}) }) });
			i.mount(n), O.push(i);
		},
		grid(n, r) {
			let a = i.ownerDocument.createElement("div");
			if (n.insertBefore(a, r || null), x) return a.className = "ui-form-grid", a.dataset.columns = p ? "1" : "2", a;
			let o, s = e({ setup: () => () => t(ue, { columns: p ? 1 : 2 }, { default: () => t("div", {
				style: { display: "contents" },
				ref: (e) => {
					o = e;
				}
			}) }) });
			return s.mount(a), O.push(s), o;
		},
		field(r, { control: a, reset: o, label: s, hint: c, error: u }) {
			let d = i.ownerDocument.createElement("div");
			if (r.append(d), x) return d.className = p ? "steam-dlc-field ui-settings-row" : "steam-dlc-public-field", a.name === "poster_limit" && d.classList.add("steam-dlc-limit-field"), s.htmlFor = a.id, s.id = a.id + "-label", a.setAttribute("aria-labelledby", s.id), a.setAttribute("aria-describedby", `${c.id} ${u.id}`), a.setAttribute("aria-invalid", String(!!u.textContent)), d.append(s, a, ...o ? [o] : [], c, u), {
				hint: c,
				error: u
			};
			let f = l.renderer(s), m = l.renderer(c), h = n(), g = n(u.textContent), _ = e({ setup: () => () => t(U, {
				controlId: a.id,
				label: f(),
				hint: h.value ?? m(),
				error: g.value,
				layout: p ? "row" : "stacked",
				class: a.name === "poster_limit" ? "steam-dlc-limit-field" : void 0,
				hintId: c.id,
				errorId: u.id
			}, {
				default: ({ controlAttrs: e }) => {
					for (let [t, n] of Object.entries(e)) n === void 0 ? a.removeAttribute(t) : a.setAttribute(t, String(n));
					return t("div", { ref: (e) => {
						e && a.parentNode !== e && e.append(a);
					} });
				},
				actions: () => o ? t("div", { ref: (e) => {
					e && o.parentNode !== e && e.append(o);
				} }) : null
			}) });
			return _.mount(d), O.push(_), {
				hint: {
					get textContent() {
						return h.value ?? m();
					},
					set textContent(e) {
						h.value = e;
					}
				},
				error: {
					get textContent() {
						return g.value;
					},
					set textContent(e) {
						g.value = e;
					}
				}
			};
		}
	}, ne = () => t("details", { class: "steam-dlc-disclosure" }, [
		t("summary", u("section.sourceScope")),
		t("p", { class: "steam-dlc-hint" }, b()),
		t("p", { class: "steam-dlc-hint" }, u("page.accountScope"))
	]), re = /* @__PURE__ */ new Map(), ie = n({}), A = /* @__PURE__ */ new Map(), ae = /* @__PURE__ */ new Map();
	if (p || g) {
		let e = p ? "save" : "query";
		ae.set(e, {
			id: e,
			type: "submit",
			disabled: !0
		});
	}
	let j = (e) => {
		ie.value = {
			...ie.value,
			...e
		};
	}, oe = {
		bind(e, t, n) {
			A.set(e, t), n && ae.set(e, {
				id: e,
				...n
			}), j({});
		},
		actionState(e, t) {
			let n = ae.get(e);
			n && ae.set(e, {
				...n,
				...t
			}), (e === "query" || e === "save") && C?.closest("form")?.setAttribute("aria-busy", String(!!t.busy)), j({});
		},
		publish: j,
		groupHost(e) {
			return re.get(e);
		},
		text(e) {
			return r.uiText(e, s.value.locale);
		}
	}, M = () => t(B, {
		title: u(h ? "section.sourceCredentials" : p ? "section.settingsHelp" : "section.dataAndAccounts"),
		eyebrow: h ? u("page.sourceAccess") : void 0
	}, { default: () => [
		t(H, {}, { default: () => p ? u("page.settings.steam") : b() || u("page.moduleMissing") }),
		h ? t("div", { ref: (e) => {
			te = e;
		} }) : null,
		t("p", { class: "steam-dlc-hint" }, u(p ? "page.saveVerification" : "page.accountScope"))
	] }), se = () => {
		let { themeField: e, themeValue: n, themeError: o, themeReadonly: l, notice: d, pending: h, availability: _ } = ie.value;
		return t(r.PageTemplate, {
			idPrefix: S,
			class: "steam-dlc-view",
			lang: s.value.locale,
			context: s.value,
			styleMountTarget: i,
			appearance: a(c),
			content: {
				title: m ? f.title : p ? u("page.settingsTitle", { module: f.title }) : `${f.title} ${u(g)}`,
				eyebrow: m ? u("page.moduleEyebrow", { module: f.title.toUpperCase() }) : "YOMIHIME GAME LINK / STEAM DLC",
				intro: y(),
				sections: [{
					id: "workspace",
					title: u(p ? "section.queryAndReply" : v || "section.statusAndHelp"),
					fields: e ? [e] : []
				}, ...p ? [{
					id: "poster",
					title: u("route.collage")
				}] : []],
				actions: [...ae.values()].map((e) => typeof e.label == "function" ? {
					...e,
					label: e.label()
				} : e),
				notes: m ? [u("page.homeNavigation")] : void 0
			},
			state: {
				values: { reply_theme: n ?? "" },
				errors: { reply_theme: o },
				readonly: l,
				pending: h,
				notice: d
			},
			onFieldChange: ({ id: e, value: t }) => A.get(e)?.(t),
			onAction: (e) => A.get(e)?.()
		}, {
			...m ? { logo: () => W(c, i.ownerDocument) } : {},
			sectionExtra: ({ section: e }) => t("div", { ref: (t) => {
				e.id === "workspace" ? C = t : re.set(e.id, t);
			} }),
			aside: M,
			results: () => t("div", { ref: (e) => {
				w = e;
			} }),
			footer: () => [t(H, {}, { default: () => _ }), m ? ne() : null]
		});
	}, ce = e({ setup: () => () => x ? se() : t(L, {
		theme: s.value.theme,
		locale: s.value.locale,
		styleMountTarget: i
	}, { default: () => t("section", {
		class: "steam-dlc-view",
		lang: s.value.locale
	}, [m ? t(B, {
		title: f?.title || u("page.moduleUnavailable"),
		eyebrow: u("page.moduleEyebrow", { module: f?.title?.toUpperCase() || "STEAM DLC" })
	}, { default: () => [
		W(c, i.ownerDocument),
		t("p", y()),
		t(H, {}, { default: () => u("page.homeNavigation") }),
		t("div", { ref: (e) => {
			C = e;
		} }),
		ne()
	] }) : [p ? null : t(R, {
		title: f ? `${f.title}${g ? ` ${u(g)}` : ""}` : u("page.moduleUnavailable"),
		eyebrow: "YOMIHIME GAME LINK / STEAM DLC",
		subtitle: y()
	}), t(z, {}, {
		default: () => p ? t("div", { ref: (e) => {
			C = e;
		} }) : t(V, {
			title: u(g || "section.statusAndHelp"),
			number: "01"
		}, { default: () => t("div", { ref: (e) => {
			C = e;
		} }) }),
		aside: M
	})]]) }) });
	ce.mount(i), k.credentialHost = te, x && (k.template = oe, k.resultHost = w), T = N(C, {
		...o,
		copy: l,
		themeLabel: d,
		presentation: k,
		scope: {
			signal: o.scope.signal,
			isCurrent: () => o.scope.isCurrent(),
			onDispose: () => () => {}
		}
	});
	let P = () => {
		E || (E = !0, T.dispose(), l.clear(), O.splice(0).reverse().forEach((e) => e.unmount()), ce.unmount(), o.scope.signal.removeEventListener("abort", P), D());
	};
	return o.scope.signal.addEventListener("abort", P, { once: !0 }), D = o.scope.onDispose(P), {
		update(e) {
			if (E) return;
			let t = s.value.locale !== e.locale;
			s.value = { ...e }, T.update(e), t && l.refresh();
		},
		dispose: P,
		navigationImpact: T.navigationImpact
	};
}
//#endregion
export { he as mount };
