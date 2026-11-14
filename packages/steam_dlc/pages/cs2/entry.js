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
//#region packages/steam_dlc/pages/src/locales/cs2/zh-CN.json
var o = {
	"authorization.authorizationComplete": "授权完成",
	"authorization.authorizationFailed": "授权失败",
	"authorization.authorized": "授权成功",
	"authorization.cancelled": "已取消",
	"authorization.expired": "已过期",
	"authorization.statusUnknown": "状态未知",
	"authorization.waitingForScanConfirmation": "等待扫码确认",
	"availability.thisPageContextExpiredOpenThe": "页面已失效，请重新进入本模块。",
	"availability.thisPageIsAvailableCheckRuntime": "页面可以打开。模块运行状态请在模块管理中查看。本页不检测外部数据来源。",
	"availability.thisPageIsUnavailableRefreshIts": "此页面暂不可用。请在模块管理中刷新状态，再重新打开。",
	"choice.5eSessionToken": "5E 会话 Token",
	"choice.followCore": "跟随核心",
	"choice.latestMatch": "上一场比赛",
	"choice.matchDetails": "比赛详情",
	"choice.officialMatchesRecordedByPerfectWorld": "完美收录官匹",
	"choice.perfectWorld": "完美平台",
	"choice.perfectWorldQrAuthorization": "完美扫码授权",
	"choice.playerProfile": "玩家资料",
	"choice.playerStats": "玩家统计",
	"choice.standard": "标准",
	"configHint.default_platform": "完美、完美收录官匹或5E；各平台段位与赛季分别说明。",
	"configHint.reply_theme": "图片主题",
	"credential.authorizationExpired": "管理授权或页面上下文已失效，请重新进入。",
	"credential.cancelQrSignIn": "取消扫码",
	"credential.cancellingTheQrSession": "正在取消扫码。",
	"credential.checkQrSignInStatus": "检查扫码状态",
	"credential.clearCredentials": "清除凭据",
	"credential.configConflict": "设置已被其他操作修改。凭据输入已清除，请刷新状态后重新操作。",
	"credential.configuredUpstreamValidityIsUnverified": "已配置；上游有效性尚未验证。",
	"credential.credentialsCleared": "凭据已清除。",
	"credential.decryptionFailed": "已配置，但当前无法解密，请检查服务密钥后重新设置。",
	"credential.enterAValidKeyOrToken": "请输入 1 到 4096 字符的有效 Key 或 Token。",
	"credential.mutationUnverified": "操作未完成或结果未确认。凭据输入已清除，请刷新并核对状态。",
	"credential.notConfigured": "未配置。",
	"credential.operationCancelled": "已取消操作。",
	"credential.perfectWorldAuthorizationWasRevoked": "完美授权已撤销。",
	"credential.perfectWorldAuthorizationWasSavedThe": "完美授权已保存，玩家 Steam 绑定保持独立。",
	"credential.perfectWorldSignInQrCode": "完美登录二维码，仅供本次管理员授权",
	"credential.qrSignInStatus": " 当前扫码：{status}。",
	"credential.refreshToCheckStatus": "状态待刷新。",
	"credential.revokePerfectWorldAuthorization": "撤销完美授权",
	"credential.saveCredentials": "保存凭据",
	"credential.savedUnverifiedUpstream": "凭据已保存；有效性会在来源请求时验证。",
	"credential.scanWithThePerfectWorldApp": "请使用完美 App 扫码并亲自确认授权；留在本页等待结果。",
	"credential.signInSignInAgainBy": "扫码登录 / 重新登录",
	"credential.sourceCredentialsAreNeverKeptAs": "来源凭据不会作为普通草稿保留。",
	"credential.submitCredentialsOnlyThroughTrustedAdministration": "凭据只在可信管理入口提交。输入仅在当前页面保留；上游有效性在查询时验证。",
	"credential.theAuthorizationSessionEndedRefreshThe": "授权会话已结束，请刷新状态。",
	"credential.theQrCodeExpiredSignIn": "二维码已过期，请重新登录。",
	"credential.theQrCodeTimedOutSign": "二维码已超时，请重新登录。",
	"credential.theQrSessionWasCancelled": "扫码已取消。",
	"help.a5eDomainIsSeparateFrom": "5E domain 与 SteamID 分开；统计注明来源赛季口径。",
	"help.commandHelp": "命令帮助",
	"help.officialMatchResultsAreLimitedTo": "官匹展示完美平台已收录的比赛。",
	"help.perfectWorldAndOfficialLookupsCan": "完美/官匹可复用本人 Steam 绑定；模型查询必须明确账号。",
	"help.perfectWorldCanReturnAFull": "完美可返回完整名单及焦点；官匹/5E 另需 --account，限定在该玩家近期样本。",
	"help.viewSourceAndCredentialStatusUpstream": "查看来源和凭据配置状态；上游有效性在查询时验证。",
	"help.viewTheLatestMatchFromThe": "查看来源收录的最近一场比赛。官匹与 5E 提供近期样本中的玩家摘要。",
	"metric.unknown": "未知",
	"module.cs2.source": "完美扫码与 5E Token 在可信管理页设置。登录主体只用于请求授权，不替换玩家绑定。官匹与 5E 单场只提供来源近期样本中的玩家摘要。",
	"module.cs2.summary": "完美平台、完美收录官匹与 5E 玩家资料、近期战绩、赛季统计和来源单场查询。",
	"page.accountScope": "默认账号只在已授权的命令路径使用。自然语言工具必须提供明确账号或比赛编号。",
	"page.homeNavigation": "从模块导航选择查询或设置。",
	"page.moduleEyebrow": "{module} / 模块",
	"page.moduleMissing": "找不到此模块的页面。",
	"page.moduleRuntimeContextChangedOpenThe": "模块运行状态已变化，请重新打开页面。",
	"page.moduleUnavailable": "模块页面不可用",
	"page.pageAvailabilityChangedReviewTheRefreshed": "页面可用状态已变化，请核对刷新后的配置。",
	"page.saveVerification": "保存后会重新读取并核对结果；冲突或未确认结果需要手动刷新。",
	"page.settings.cs2": "完美授权与 5E Token 仅用于来源请求，玩家查询目标保持独立。二维码需由账号本人亲自确认；离页将停止轮询。",
	"page.settingsTitle": "{module} 设置",
	"page.sourceAccess": "来源授权",
	"page.thisPageIsNotDeclaredReturn": "此页面暂不可用。请返回模块列表重新进入。",
	"query.aSelectionIsRequiredFollowThe": "需要补充选择，请按来源提示配置或改选。",
	"query.account": "账号",
	"query.authorizationIsRequiredInTrustedSettings": "需要在可信设置页授权。",
	"query.cardPreviewDidNotFinishNo": "资料卡预览未完成，未取得可确认的文字或图片。可主动重试预览，或仅查询文字资料；每次操作会重新查询来源。",
	"query.coverageUnknown": "范围未知",
	"query.credentialsConfiguredUpstreamValidityIsChecked": "凭据已配置；查询时验证上游有效性。",
	"query.detailCoverageUnknown": "详情范围未知",
	"query.durationSeconds": "时长（秒）",
	"query.enterAnExplicitAccountAndCheck": "请填写明确账号并检查输入范围。",
	"query.error.authExpired": "所选来源的授权已过期。请在可信设置页重新授权后查询。",
	"query.error.authRequired": "所选来源需要授权。请在可信设置页完成完美扫码授权或配置 5E Token，核对来源后重新查询。",
	"query.error.invalidParameters": "查询参数不符合要求，请核对玩家账号、所选来源、赛季和比赛 ID 后重新查询。",
	"query.error.noRecords": "来源当前暂无可用记录，可稍后重新查询已收录比赛。",
	"query.error.notFound": "来源未找到对应玩家或记录，请核对玩家账号与所选来源后重新查询。",
	"query.error.notPublic": "玩家资料未公开或来源访问受限，请核对公开设置与来源授权后重新查询。",
	"query.error.rateLimited": "来源请求限流，请稍后再查询；页面不会自动重试。",
	"query.error.unparsed": "来源尚未解析对应记录，请等待来源解析后再查询。",
	"query.error.upstreamUnavailable": "所选来源暂时不可用，请稍后再查询。",
	"query.firstBatchOfRecentSamples": "近期首批样本",
	"query.focusAccount": "焦点账号",
	"query.focusMetrics": "焦点：{player} · {account} · K/D/A：{kda} · rating：{rating} · PW rating：{pwRating} · ADR：{adr}",
	"query.focusName": "焦点名称",
	"query.focusOutcome": "焦点胜负",
	"query.fullMatch": "完整比赛",
	"query.heroId": "英雄ID",
	"query.limitedRecentPlayerSummary": "近期玩家摘要",
	"query.map": "地图",
	"query.match": "比赛",
	"query.matchFocusAccountOptional": "单场焦点账号（可选）",
	"query.matchId": "比赛ID",
	"query.matchSummary": "比赛：{match} · 地图：{map} · 比分：{score}",
	"query.matches": "场次",
	"query.missingValuesStayUnknown": "未知表示来源未提供，不按 0 计算。",
	"query.noMatchesInSample": "来源当前样本没有可展示的比赛。",
	"query.noProfileCardWasReturnedText": "本次未提供资料卡，文字资料仍可查看。",
	"query.noUsableRoster": "来源未提供可用玩家名单。",
	"query.noVerifiedResultWasObtained": "未取得可确认结果。",
	"query.notProvided": "未提供",
	"query.pageAuthorizationOrRuntimeContextChanged": "页面授权或运行上下文已变化，请重新进入页面。",
	"query.player": "玩家",
	"query.playerAccountSteamid645eDomain": "玩家账号（SteamID64 / 5E domain）",
	"query.playerMetrics": "玩家：{player} · K/D/A：{kda} · rating：{rating} · PW rating：{pwRating} · ADR：{adr}",
	"query.playerRank": "玩家：{player} · 账号：{account} · 段位：{rank} · 积分：{score}",
	"query.playerSummary": "玩家摘要",
	"query.profileCardAlt": "CS2 资料卡 {index}",
	"query.queryingTheSource": "正在查询来源。",
	"query.recentMatches": "近期战绩",
	"query.recentMatchesToShow": "近期展示数量",
	"query.recordedByPlatform": "平台收录",
	"query.retryCardPreview": "重试资料卡预览",
	"query.sampleTimestamp": "数据获取时间 {time}{season}",
	"query.score": "比分",
	"query.search": "查询",
	"query.searchForTextDetailsOnly": "仅查询文字资料",
	"query.searchType": "查询类型",
	"query.seasonOptional": "赛季（可选）",
	"query.seasonSuffix": " · 赛季 {season}",
	"query.someDetailsAreUnavailable": "部分详情暂不可用。",
	"query.source": "来源",
	"query.sourceCoverage": "来源：{source} · 范围：{coverage}",
	"query.sourceCoverageDetail": "来源：{source} · 范围：{coverage} · 详情：{detail}",
	"query.sourceMatchId": "来源比赛 ID",
	"query.sourceResultsUpdated": "来源结果已更新。",
	"query.sourceUnknown": "来源未知",
	"query.team": "队伍",
	"query.theLookupDidNotFinishCheck": "查询未完成，请查看来源反馈。",
	"query.theLookupDidNotFinishFollow": "查询未完成，请按来源提示处理后重新查询。",
	"query.theProfileCardImageCouldNot": "资料卡图片无法验证，已保留文字资料。",
	"query.theRequestDidNotFinishOr": "请求未完成，或返回内容不完整。请核对当前账号与来源后重新查询。",
	"query.theSourceReturnedNoUsableResult": "来源未返回可用结果。",
	"query.thisSourceProvidesASummaryOf": "该来源提供该玩家的近期样本摘要。",
	"query.unknown": "未知",
	"query.unknownOption": "未知选项",
	"query.webLookupsAlwaysRequireAnExplicit": "页面查询始终需要明确账号，不读取本人默认绑定。5E 使用 domain；官匹与 5E 单场仅限来源近期玩家摘要。",
	"query.winRate": "胜率",
	"route.home": "帮助与状态",
	"route.query": "平台查询",
	"route.settings": "设置",
	"section.dataAndAccounts": "数据与账号",
	"section.queryAndReply": "查询与回复",
	"section.queryCriteria": "查询条件",
	"section.settingsHelp": "设置说明",
	"section.sourceCredentials": "来源凭据与授权",
	"section.sourceScope": "数据来源与范围",
	"section.statusAndHelp": "状态与帮助",
	"setting.defaultCs2Source": "默认 CS2 来源",
	"setting.replyTheme": "回复主题",
	"settings.authorizationExpired": "管理授权或模块上下文已失效，请重新进入页面。",
	"settings.chooseAnAvailableOption": "请选择当前可用的选项。",
	"settings.configConflict": "配置已被其他操作修改。草稿已保留，请手动刷新、核对后再保存。",
	"settings.discardModuleChanges": "放弃本模块修改",
	"settings.draftTooLong": "输入超过草稿保留上限，请先修正再切页。",
	"settings.enterAValidIanaTimeZone": "请输入有效的 IANA 时区，例如 Asia/Shanghai。",
	"settings.enterAnIanaTimeZoneWithin": "请输入符合长度要求的 IANA 时区。",
	"settings.followCoreClearsTheModulesReply": "回复主题中的“跟随核心”清除模块覆盖值。恢复默认先形成草稿，保存后生效。",
	"settings.integerRange": "请输入 {minimum} 到 {maximum} 之间的整数。",
	"settings.invalidConfig": "配置未被接受。请检查字段，手动刷新并核对后再保存。",
	"settings.invalidCurrentValue": "当前配置无效，请修改或恢复默认后保存。",
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
	"settings.youHaveUnsavedChanges": "有未保存的修改。",
	"status.couldNotReadSourceStatusRefresh": "来源状态读取失败，请稍后刷新。",
	"status.refreshSourceStatus": "刷新来源状态",
	"status.searchResults": "查询结果",
	"status.sourceStatus": "来源状态"
}, s = {
	"authorization.authorizationComplete": "授權完成",
	"authorization.authorizationFailed": "授權失敗",
	"authorization.authorized": "授權成功",
	"authorization.cancelled": "已取消",
	"authorization.expired": "已過期",
	"authorization.statusUnknown": "狀態未知",
	"authorization.waitingForScanConfirmation": "等待掃描 QR 碼確認",
	"availability.thisPageContextExpiredOpenThe": "頁面上下文已失效，請重新進入本模組。",
	"availability.thisPageIsAvailableCheckRuntime": "目前頁面入口可用。請前往模組管理頁面查看執行狀態。這裡不會檢查上游服務。",
	"availability.thisPageIsUnavailableRefreshIts": "目前頁面入口不可用，請在模組管理頁面重新整理狀態後重新進入。",
	"choice.5eSessionToken": "5E 工作階段 Token",
	"choice.followCore": "跟隨核心",
	"choice.latestMatch": "上一場比賽",
	"choice.matchDetails": "比賽詳細資料",
	"choice.officialMatchesRecordedByPerfectWorld": "完美收錄官匹",
	"choice.perfectWorld": "完美平臺",
	"choice.perfectWorldQrAuthorization": "完美掃描 QR 碼授權",
	"choice.playerProfile": "玩家資料",
	"choice.playerStats": "玩家統計",
	"choice.standard": "標準",
	"configHint.default_platform": "完美、完美收錄官匹或5E；各平臺段位與賽季分別說明。",
	"configHint.reply_theme": "圖片主題",
	"credential.authorizationExpired": "管理授權或頁面上下文已失效，請重新進入。",
	"credential.cancelQrSignIn": "取消掃描 QR 碼",
	"credential.cancellingTheQrSession": "正在取消掃描 QR 碼。",
	"credential.checkQrSignInStatus": "檢查掃描 QR 碼狀態",
	"credential.clearCredentials": "清除憑證",
	"credential.configConflict": "設定已被其他操作修改。憑證輸入已清除，請重新整理狀態後重新操作。",
	"credential.configuredUpstreamValidityIsUnverified": "已設定；上游有效性尚未驗證。",
	"credential.credentialsCleared": "憑證已清除。",
	"credential.decryptionFailed": "已設定，但目前無法解密，請檢查服務金鑰後重新設定。",
	"credential.enterAValidKeyOrToken": "請輸入 1 到 4096 字符的有效 Key 或 Token。",
	"credential.mutationUnverified": "操作未完成或結果未確認。憑證輸入已清除，請重新整理並核對狀態。",
	"credential.notConfigured": "未設定。",
	"credential.operationCancelled": "已取消操作。",
	"credential.perfectWorldAuthorizationWasRevoked": "完美授權已撤銷。",
	"credential.perfectWorldAuthorizationWasSavedThe": "完美授權已儲存，玩家 Steam 綁定保持獨立。",
	"credential.perfectWorldSignInQrCode": "完美登入二維碼，僅供本次管理員授權",
	"credential.qrSignInStatus": " 目前掃描 QR 碼：{status}。",
	"credential.refreshToCheckStatus": "狀態待重新整理。",
	"credential.revokePerfectWorldAuthorization": "撤銷完美授權",
	"credential.saveCredentials": "儲存憑證",
	"credential.savedUnverifiedUpstream": "憑證已儲存；有效性會在來源請求時驗證。",
	"credential.scanWithThePerfectWorldApp": "請使用完美 App 掃描 QR 碼並親自確認授權；留在本頁等待結果。",
	"credential.signInSignInAgainBy": "掃描 QR 碼登入 / 重新登入",
	"credential.sourceCredentialsAreNeverKeptAs": "來源憑證不會作為普通草稿保留。",
	"credential.submitCredentialsOnlyThroughTrustedAdministration": "憑證只在可信管理入口送出。輸入僅在目前頁面保留；上游有效性在查詢時驗證。",
	"credential.theAuthorizationSessionEndedRefreshThe": "授權工作階段已結束，請重新整理狀態。",
	"credential.theQrCodeExpiredSignIn": "二維碼已過期，請重新登入。",
	"credential.theQrCodeTimedOutSign": "二維碼已超時，請重新登入。",
	"credential.theQrSessionWasCancelled": "掃描 QR 碼已取消。",
	"help.a5eDomainIsSeparateFrom": "5E domain 與 SteamID 分開；統計注明來源賽季計算方式。",
	"help.commandHelp": "指令幫助",
	"help.officialMatchResultsAreLimitedTo": "官匹展示完美平臺已收錄的比賽。",
	"help.perfectWorldAndOfficialLookupsCan": "完美/官匹可重複使用本人 Steam 綁定；模型查詢必須明確帳號。",
	"help.perfectWorldCanReturnAFull": "完美可回傳完整名單及焦點；官匹/5E 另需 --account，限定在該玩家近期樣本。",
	"help.viewSourceAndCredentialStatusUpstream": "查看來源和憑證設定狀態；上游有效性在查詢時驗證。",
	"help.viewTheLatestMatchFromThe": "查看來源最近一場；官匹與 5E 回傳有界玩家摘要。",
	"metric.unknown": "未知",
	"module.cs2.source": "完美掃描 QR 碼與 5E Token 在可信管理頁設定。登入主體只用於請求授權，不替換玩家綁定。官匹與 5E 單場只提供來源近期樣本中的玩家摘要。",
	"module.cs2.summary": "完美平臺、完美收錄官匹與 5E 玩家資料、近期戰績、賽季統計和來源單場查詢。",
	"page.accountScope": "預設帳號只在已授權的指令流程使用。自然語言工具必須提供明確帳號或比賽編號。",
	"page.homeNavigation": "請從模組導覽選擇查詢，或前往功能設定調整選項。",
	"page.moduleEyebrow": "{module} / 模組",
	"page.moduleMissing": "目前頁面沒有可用的模組宣告。",
	"page.moduleRuntimeContextChangedOpenThe": "模組執行上下文已變化，請重新進入頁面。",
	"page.moduleUnavailable": "模組頁面無法使用",
	"page.pageAvailabilityChangedReviewTheRefreshed": "頁面可用狀態已變化，請核對重新整理後的設定。",
	"page.saveVerification": "儲存後會重新讀取並核對結果。如有衝突或結果未確認，請手動重新整理。",
	"page.settings.cs2": "完美授權與 5E Token 僅用於來源請求，玩家查詢目標維持獨立。QR 碼須由帳號本人確認，離開頁面就會停止輪詢。",
	"page.settingsTitle": "{module} 功能設定",
	"page.sourceAccess": "來源授權",
	"page.thisPageIsNotDeclaredReturn": "該頁面入口未聲明，請回傳模組列表重新進入。",
	"query.aSelectionIsRequiredFollowThe": "需要補充選擇，請按來源提示設定或改選。",
	"query.account": "帳號",
	"query.authorizationIsRequiredInTrustedSettings": "需要在可信設定頁授權。",
	"query.cardPreviewDidNotFinishNo": "資料卡預覽未完成，未取得可確認的文字或圖片。可主動重試預覽，或僅查詢文字資料；每次操作會重新查詢來源。",
	"query.coverageUnknown": "範圍未知",
	"query.credentialsConfiguredUpstreamValidityIsChecked": "憑證已設定；查詢時驗證上游有效性。",
	"query.detailCoverageUnknown": "詳細資料範圍未知",
	"query.durationSeconds": "時長（秒）",
	"query.enterAnExplicitAccountAndCheck": "請填寫明確帳號並檢查輸入範圍。",
	"query.error.authExpired": "所選來源的授權已過期。請在可信設定頁重新授權後查詢。",
	"query.error.authRequired": "所選來源需要授權。請在可信設定頁完成完美掃描 QR 碼授權或設定 5E Token，核對來源後重新查詢。",
	"query.error.invalidParameters": "查詢參數不符合要求，請核對玩家帳號、所選來源、賽季和比賽 ID 後重新查詢。",
	"query.error.noRecords": "來源目前暫無可用記錄，可稍後重新查詢已收錄比賽。",
	"query.error.notFound": "來源未找到對應玩家或記錄，請核對玩家帳號與所選來源後重新查詢。",
	"query.error.notPublic": "玩家資料未公開或來源存取受限，請核對公開設定與來源授權後重新查詢。",
	"query.error.rateLimited": "來源請求限流，請稍後再查詢；頁面不會自動重試。",
	"query.error.unparsed": "來源尚未解析對應記錄，請等待來源解析後再查詢。",
	"query.error.upstreamUnavailable": "所選來源暫時不可用，請稍後再查詢。",
	"query.firstBatchOfRecentSamples": "近期首批樣本",
	"query.focusAccount": "焦點帳號",
	"query.focusMetrics": "焦點：{player} · {account} · K/D/A：{kda} · rating：{rating} · PW rating：{pwRating} · ADR：{adr}",
	"query.focusName": "焦點名稱",
	"query.focusOutcome": "焦點勝負",
	"query.fullMatch": "完整比賽",
	"query.heroId": "英雄ID",
	"query.limitedRecentPlayerSummary": "有界近期玩家摘要",
	"query.map": "地圖",
	"query.match": "比賽",
	"query.matchFocusAccountOptional": "單場焦點帳號（可選）",
	"query.matchId": "比賽ID",
	"query.matchSummary": "比賽：{match} · 地圖：{map} · 比分：{score}",
	"query.matches": "場次",
	"query.missingValuesStayUnknown": "未知表示來源未提供，不按 0 計算。",
	"query.noMatchesInSample": "來源目前樣本沒有可展示的比賽。",
	"query.noProfileCardWasReturnedText": "本次未提供資料卡，文字資料仍可查看。",
	"query.noUsableRoster": "來源未提供可用玩家名單。",
	"query.noVerifiedResultWasObtained": "未取得可確認結果。",
	"query.notProvided": "未提供",
	"query.pageAuthorizationOrRuntimeContextChanged": "頁面授權或執行上下文已變化，請重新進入頁面。",
	"query.player": "玩家",
	"query.playerAccountSteamid645eDomain": "玩家帳號（SteamID64 / 5E domain）",
	"query.playerMetrics": "玩家：{player} · K/D/A：{kda} · rating：{rating} · PW rating：{pwRating} · ADR：{adr}",
	"query.playerRank": "玩家：{player} · 帳號：{account} · 段位：{rank} · 積分：{score}",
	"query.playerSummary": "玩家摘要",
	"query.profileCardAlt": "CS2 資料卡 {index}",
	"query.queryingTheSource": "正在查詢來源。",
	"query.recentMatches": "近期戰績",
	"query.recentMatchesToShow": "近期展示數量",
	"query.recordedByPlatform": "平臺收錄",
	"query.retryCardPreview": "重試資料卡預覽",
	"query.sampleTimestamp": "采樣：{time}{season}",
	"query.score": "比分",
	"query.search": "查詢",
	"query.searchForTextDetailsOnly": "僅查詢文字資料",
	"query.searchType": "查詢類型",
	"query.seasonOptional": "賽季（可選）",
	"query.seasonSuffix": " · 賽季 {season}",
	"query.someDetailsAreUnavailable": "部分詳細資料暫不可用。",
	"query.source": "來源",
	"query.sourceCoverage": "來源：{source} · 範圍：{coverage}",
	"query.sourceCoverageDetail": "來源：{source} · 範圍：{coverage} · 詳細資料：{detail}",
	"query.sourceMatchId": "來源比賽 ID",
	"query.sourceResultsUpdated": "來源結果已更新。",
	"query.sourceUnknown": "來源未知",
	"query.team": "隊伍",
	"query.theLookupDidNotFinishCheck": "查詢未完成，請查看來源反饋。",
	"query.theLookupDidNotFinishFollow": "查詢未完成，請按來源提示處理後重新查詢。",
	"query.theProfileCardImageCouldNot": "資料卡圖片無法驗證，已保留文字資料。",
	"query.theRequestDidNotFinishOr": "請求未完成，或回傳內容不完整。請核對目前帳號與來源後重新查詢。",
	"query.theSourceReturnedNoUsableResult": "來源未回傳可用結果。",
	"query.thisSourceProvidesASummaryOf": "該來源提供該玩家的近期樣本摘要。",
	"query.unknown": "未知",
	"query.unknownOption": "未知選項",
	"query.webLookupsAlwaysRequireAnExplicit": "頁面查詢始終需要明確帳號，不讀取本人預設綁定。5E 使用 domain；官匹與 5E 單場僅限來源近期玩家摘要。",
	"query.winRate": "勝率",
	"route.home": "說明與狀態",
	"route.query": "平台查詢",
	"route.settings": "設定",
	"section.dataAndAccounts": "資料與帳號",
	"section.queryAndReply": "查詢與回覆",
	"section.queryCriteria": "查詢條件",
	"section.settingsHelp": "設定說明",
	"section.sourceCredentials": "來源憑證與授權",
	"section.sourceScope": "資料來源與範圍",
	"section.statusAndHelp": "狀態與說明",
	"setting.defaultCs2Source": "預設 CS2 來源",
	"setting.replyTheme": "回覆主題",
	"settings.authorizationExpired": "管理授權或模組上下文已失效，請重新進入頁面。",
	"settings.chooseAnAvailableOption": "請選擇目前可用的選項。",
	"settings.configConflict": "設定已被其他操作修改。草稿已保留，請手動重新整理、核對後再儲存。",
	"settings.discardModuleChanges": "放棄本模組修改",
	"settings.draftTooLong": "輸入超過草稿保留上限，請先修正再切頁。",
	"settings.enterAValidIanaTimeZone": "請輸入有效的 IANA 時區，例如 Asia/Shanghai。",
	"settings.enterAnIanaTimeZoneWithin": "請輸入符合長度要求的 IANA 時區。",
	"settings.followCoreClearsTheModulesReply": "回覆主題中的“跟隨核心”清除模組覆蓋值。還原預設先形成草稿，儲存後生效。",
	"settings.integerRange": "請輸入 {minimum} 到 {maximum} 之間的整數。",
	"settings.invalidConfig": "設定未被接受。請檢查欄位，手動重新整理並核對後再儲存。",
	"settings.invalidCurrentValue": "目前設定無效，請修改或還原預設後儲存。",
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
	"settings.youHaveUnsavedChanges": "有未儲存的修改。",
	"status.couldNotReadSourceStatusRefresh": "來源狀態讀取失敗，請稍後重新整理。",
	"status.refreshSourceStatus": "重新整理來源狀態",
	"status.searchResults": "查詢結果",
	"status.sourceStatus": "來源狀態"
}, c = {
	"authorization.authorizationComplete": "認可完了",
	"authorization.authorizationFailed": "認可失敗",
	"authorization.authorized": "認可済み",
	"authorization.cancelled": "キャンセル済み",
	"authorization.expired": "期限切れ",
	"authorization.statusUnknown": "状態不明",
	"authorization.waitingForScanConfirmation": "QR コードの確認待ち",
	"availability.thisPageContextExpiredOpenThe": "ページのコンテキストが無効になりました。モジュールを開き直してください。",
	"availability.thisPageIsAvailableCheckRuntime": "このページは利用できます。実行状態はモジュール管理で確認してください。このページでは接続先サービスの状態を確認しません。",
	"availability.thisPageIsUnavailableRefreshIts": "このページは利用できません。モジュール管理で状態を更新してから開き直してください。",
	"choice.5eSessionToken": "5E セッショントークン",
	"choice.followCore": "Core に従う",
	"choice.latestMatch": "直近の試合",
	"choice.matchDetails": "試合詳細",
	"choice.officialMatchesRecordedByPerfectWorld": "Perfect World 収録の公式マッチ",
	"choice.perfectWorld": "Perfect World",
	"choice.perfectWorldQrAuthorization": "Perfect World の QR 認可",
	"choice.playerProfile": "プレイヤープロフィール",
	"choice.playerStats": "プレイヤー統計",
	"choice.standard": "標準",
	"configHint.default_platform": "Perfect World、同サービスに収録された公式マッチ、5E から選びます。ランクとシーズンはプラットフォームごとに表示します。",
	"configHint.reply_theme": "画像テーマ",
	"credential.authorizationExpired": "管理認可またはページのコンテキストが無効になりました。ページを開き直してください。",
	"credential.cancelQrSignIn": "QR ログインをキャンセル",
	"credential.cancellingTheQrSession": "QR セッションをキャンセルしています。",
	"credential.checkQrSignInStatus": "QR ログインの状態を確認",
	"credential.clearCredentials": "認証情報を消去",
	"credential.configConflict": "別の操作で設定が変更されました。認証情報の入力は消去されました。状態を更新してからやり直してください。",
	"credential.configuredUpstreamValidityIsUnverified": "設定済みです。接続先での有効性は未確認です。",
	"credential.credentialsCleared": "認証情報を消去しました。",
	"credential.decryptionFailed": "設定済みですが復号できません。サービスのキーを確認してから設定し直してください。",
	"credential.enterAValidKeyOrToken": "1〜4096 文字の有効なキーまたはトークンを入力してください。",
	"credential.mutationUnverified": "操作が完了していないか、結果が未確認です。認証情報の入力は消去されました。更新して状態を確認してください。",
	"credential.notConfigured": "未設定です。",
	"credential.operationCancelled": "操作をキャンセルしました。",
	"credential.perfectWorldAuthorizationWasRevoked": "Perfect World の認可を取り消しました。",
	"credential.perfectWorldAuthorizationWasSavedThe": "Perfect World の認可を保存しました。プレイヤーの Steam 連携は別に管理されます。",
	"credential.perfectWorldSignInQrCode": "Perfect World ログイン用 QR コード。今回の管理者認可専用です",
	"credential.qrSignInStatus": " QR ログイン：{status}。",
	"credential.refreshToCheckStatus": "更新して状態を確認してください。",
	"credential.revokePerfectWorldAuthorization": "Perfect World の認可を取り消す",
	"credential.saveCredentials": "認証情報を保存",
	"credential.savedUnverifiedUpstream": "認証情報を保存しました。有効性はソースへのリクエスト時に確認します。",
	"credential.scanWithThePerfectWorldApp": "Perfect World アプリで読み取り、アカウント本人が認可を確認してください。結果が出るまでページを開いたままにしてください。",
	"credential.signInSignInAgainBy": "QR コードでログイン／再ログイン",
	"credential.sourceCredentialsAreNeverKeptAs": "ソースの認証情報は通常の下書きに保存されません。",
	"credential.submitCredentialsOnlyThroughTrustedAdministration": "認証情報は信頼済みの管理画面でのみ送信してください。入力は現在のページだけに保持されます。接続先での有効性は検索時に確認します。",
	"credential.theAuthorizationSessionEndedRefreshThe": "認可セッションが終了しました。状態を更新してください。",
	"credential.theQrCodeExpiredSignIn": "QR コードの期限が切れました。ログインし直してください。",
	"credential.theQrCodeTimedOutSign": "QR コードの待ち時間が切れました。ログインし直してください。",
	"credential.theQrSessionWasCancelled": "QR セッションをキャンセルしました。",
	"help.a5eDomainIsSeparateFrom": "5E domain と SteamID は別の識別子です。統計にはソースのシーズンを明記します。",
	"help.commandHelp": "コマンドヘルプ",
	"help.officialMatchResultsAreLimitedTo": "Perfect World が収録した公式マッチを表示します。",
	"help.perfectWorldAndOfficialLookupsCan": "Perfect World と公式マッチの検索では自分の Steam 連携を使えます。モデル検索ではアカウントを明示してください。",
	"help.perfectWorldCanReturnAFull": "Perfect World は全選手一覧と注目プレイヤーを返せます。公式マッチと 5E では --account が必要で、そのプレイヤーの直近サンプルに限ります。",
	"help.viewSourceAndCredentialStatusUpstream": "ソースと認証情報の状態を確認します。接続先での有効性は検索時に確認します。",
	"help.viewTheLatestMatchFromThe": "ソースで最新の試合を表示します。公式マッチと 5E は対象範囲内のプレイヤー概要を返します。",
	"metric.unknown": "不明",
	"module.cs2.source": "Perfect World の QR 認可と 5E トークンは信頼済みの設定画面で登録します。ログイン主体はリクエストの認可専用で、プレイヤーの連携とは別です。公式マッチと 5E の詳細は、ソースの直近サンプル内のプレイヤー概要です。",
	"module.cs2.summary": "Perfect World、同サービスに収録された公式マッチ、5E のプロフィール、直近の試合、シーズン統計、試合詳細を確認できます。",
	"page.accountScope": "既定のアカウントは認可されたコマンドでのみ使われます。自然言語ツールではアカウントまたは試合 ID を明示してください。",
	"page.homeNavigation": "モジュールのメニューから検索を選ぶか、機能設定で項目を調整してください。",
	"page.moduleEyebrow": "{module} / モジュール",
	"page.moduleMissing": "このページで使えるモジュール定義がありません。",
	"page.moduleRuntimeContextChangedOpenThe": "モジュールの実行コンテキストが変わりました。ページを開き直してください。",
	"page.moduleUnavailable": "モジュールページを利用できません",
	"page.pageAvailabilityChangedReviewTheRefreshed": "ページの利用状態が変わりました。更新後の設定を確認してください。",
	"page.saveVerification": "保存後は設定を読み直して結果を確認します。競合した場合や結果が未確認の場合は、手動で更新してください。",
	"page.settings.cs2": "Perfect World の認可と 5E トークンはソースへのリクエストにのみ使われます。検索対象のプレイヤーは別に指定します。QR コードはアカウント本人が確認してください。ページを離れると確認の繰り返しが止まります。",
	"page.settingsTitle": "{module} の機能設定",
	"page.sourceAccess": "ソースの認可",
	"page.thisPageIsNotDeclaredReturn": "このページは宣言されていません。モジュール一覧に戻り、開き直してください。",
	"query.aSelectionIsRequiredFollowThe": "追加の選択が必要です。ソースの案内に従って設定するか、別の項目を選んでください。",
	"query.account": "アカウント",
	"query.authorizationIsRequiredInTrustedSettings": "信頼済みの設定画面で認可が必要です。",
	"query.cardPreviewDidNotFinishNo": "カードのプレビューが完了せず、確認できたテキストや画像はありません。プレビューを再試行するかテキストだけ検索できます。どちらもソースに再度問い合わせます。",
	"query.coverageUnknown": "対象範囲不明",
	"query.credentialsConfiguredUpstreamValidityIsChecked": "認証情報は設定済みです。接続先での有効性は検索時に確認します。",
	"query.detailCoverageUnknown": "詳細の対象範囲不明",
	"query.durationSeconds": "試合時間（秒）",
	"query.enterAnExplicitAccountAndCheck": "アカウントを明示し、入力範囲を確認してください。",
	"query.error.authExpired": "選択したソースの認可が期限切れです。信頼済みの設定画面で認可し直してから検索してください。",
	"query.error.authRequired": "選択したソースには認可が必要です。信頼済みの設定画面で Perfect World の QR 認可を完了するか、5E トークンを設定してください。ソースを確認してから検索し直してください。",
	"query.error.invalidParameters": "プレイヤーのアカウント、選択したソース、シーズン、試合 ID を確認してから検索し直してください。",
	"query.error.noRecords": "ソースに利用できる記録がありません。しばらくしてから収録済みの試合を再検索してください。",
	"query.error.notFound": "ソースに該当するプレイヤーまたは記録が見つかりません。アカウントとソースを確認してから検索し直してください。",
	"query.error.notPublic": "プレイヤープロフィールが非公開か、ソースへのアクセスが制限されています。公開設定とソースの認可を確認してから検索し直してください。",
	"query.error.rateLimited": "ソースのリクエスト制限に達しました。しばらくしてから再検索してください。このページは自動では再試行しません。",
	"query.error.unparsed": "ソースで対象の記録が未解析です。解析を待ってから検索し直してください。",
	"query.error.upstreamUnavailable": "選択したソースを現在利用できません。しばらくしてからお試しください。",
	"query.firstBatchOfRecentSamples": "直近サンプルの最初の一部",
	"query.focusAccount": "対象アカウント",
	"query.focusMetrics": "注目：{player} · {account} · K/D/A：{kda} · rating：{rating} · PW rating：{pwRating} · ADR：{adr}",
	"query.focusName": "対象プレイヤー名",
	"query.focusOutcome": "対象プレイヤーの勝敗",
	"query.fullMatch": "試合全体",
	"query.heroId": "ヒーロー ID",
	"query.limitedRecentPlayerSummary": "対象範囲内の直近プレイヤー概要",
	"query.map": "マップ",
	"query.match": "試合",
	"query.matchFocusAccountOptional": "試合で注目するアカウント（任意）",
	"query.matchId": "試合 ID",
	"query.matchSummary": "試合：{match} · マップ：{map} · スコア：{score}",
	"query.matches": "試合数",
	"query.missingValuesStayUnknown": "不明はソースに値がないことを示し、0 として集計しません。",
	"query.noMatchesInSample": "現在のソースサンプルには表示できる試合がありません。",
	"query.noProfileCardWasReturnedText": "プロフィールカードは取得できませんでした。テキストの詳細は表示できます。",
	"query.noUsableRoster": "ソースから利用できるプレイヤー一覧を取得できませんでした。",
	"query.noVerifiedResultWasObtained": "確認できる結果がありませんでした。",
	"query.notProvided": "未提供",
	"query.pageAuthorizationOrRuntimeContextChanged": "ページの認可または実行コンテキストが変わりました。ページを開き直してください。",
	"query.player": "プレイヤー",
	"query.playerAccountSteamid645eDomain": "プレイヤーのアカウント（SteamID64 / 5E domain）",
	"query.playerMetrics": "プレイヤー：{player} · K/D/A：{kda} · rating：{rating} · PW rating：{pwRating} · ADR：{adr}",
	"query.playerRank": "プレイヤー：{player} · アカウント：{account} · ランク：{rank} · スコア：{score}",
	"query.playerSummary": "プレイヤー概要",
	"query.profileCardAlt": "CS2 プロフィールカード {index}",
	"query.queryingTheSource": "ソースに問い合わせています。",
	"query.recentMatches": "直近の試合",
	"query.recentMatchesToShow": "表示する直近試合数",
	"query.recordedByPlatform": "プラットフォーム収録",
	"query.retryCardPreview": "カードのプレビューを再試行",
	"query.sampleTimestamp": "サンプル時刻：{time}{season}",
	"query.score": "スコア",
	"query.search": "検索",
	"query.searchForTextDetailsOnly": "テキストの詳細だけ検索",
	"query.searchType": "検索の種類",
	"query.seasonOptional": "シーズン（任意）",
	"query.seasonSuffix": " · シーズン {season}",
	"query.someDetailsAreUnavailable": "一部の詳細を取得できません。",
	"query.source": "ソース",
	"query.sourceCoverage": "ソース：{source} · 対象範囲：{coverage}",
	"query.sourceCoverageDetail": "ソース：{source} · 対象範囲：{coverage} · 詳細：{detail}",
	"query.sourceMatchId": "ソースの試合 ID",
	"query.sourceResultsUpdated": "ソースの結果を更新しました。",
	"query.sourceUnknown": "ソース不明",
	"query.team": "チーム",
	"query.theLookupDidNotFinishCheck": "検索が完了しませんでした。ソースの応答を確認してください。",
	"query.theLookupDidNotFinishFollow": "検索が完了しませんでした。ソースの案内に従って検索し直してください。",
	"query.theProfileCardImageCouldNot": "プロフィールカード画像を検証できませんでした。テキストの詳細は残っています。",
	"query.theRequestDidNotFinishOr": "リクエストが完了していないか、応答が不完全です。アカウントとソースを確認してから検索し直してください。",
	"query.theSourceReturnedNoUsableResult": "ソースから利用できる結果を取得できませんでした。",
	"query.thisSourceProvidesASummaryOf": "このソースはプレイヤーの直近サンプルの概要を返します。",
	"query.unknown": "不明",
	"query.unknownOption": "不明な選択肢",
	"query.webLookupsAlwaysRequireAnExplicit": "ウェブ検索ではアカウントを明示してください。既定の連携は参照しません。5E では domain を使います。公式マッチと 5E の試合検索は、ソースの直近プレイヤー概要に限ります。",
	"query.winRate": "勝率",
	"route.home": "ヘルプと状態",
	"route.query": "プラットフォーム検索",
	"route.settings": "設定",
	"section.dataAndAccounts": "データとアカウント",
	"section.queryAndReply": "検索と返信",
	"section.queryCriteria": "検索条件",
	"section.settingsHelp": "設定について",
	"section.sourceCredentials": "ソースの認証情報と認可",
	"section.sourceScope": "データソースと対象範囲",
	"section.statusAndHelp": "状態とヘルプ",
	"setting.defaultCs2Source": "CS2 の既定のソース",
	"setting.replyTheme": "返信テーマ",
	"settings.authorizationExpired": "管理認可またはモジュールのコンテキストが無効になりました。ページを開き直してください。",
	"settings.chooseAnAvailableOption": "利用できる項目を選んでください。",
	"settings.configConflict": "別の操作で設定が変更されました。下書きは保持されています。手動で更新し、内容を確認してから保存してください。",
	"settings.discardModuleChanges": "モジュールの変更を破棄",
	"settings.draftTooLong": "入力が下書きの上限を超えています。ページを移動する前に修正してください。",
	"settings.enterAValidIanaTimeZone": "Asia/Shanghai のような有効な IANA タイムゾーンを入力してください。",
	"settings.enterAnIanaTimeZoneWithin": "許容文字数内で IANA タイムゾーンを入力してください。",
	"settings.followCoreClearsTheModulesReply": "返信テーマの「Core に従う」を選ぶとモジュール独自の設定を解除します。既定値に戻す操作は下書きに入り、保存後に反映されます。",
	"settings.integerRange": "{minimum} から {maximum} までの整数を入力してください。",
	"settings.invalidConfig": "設定が受け付けられませんでした。項目を確認し、手動で更新して内容を確認してから保存してください。",
	"settings.invalidCurrentValue": "現在の設定は無効です。変更するか既定値に戻してから保存してください。",
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
	"settings.youHaveUnsavedChanges": "未保存の変更があります。",
	"status.couldNotReadSourceStatusRefresh": "ソースの状態を読み込めませんでした。しばらくしてから更新してください。",
	"status.refreshSourceStatus": "ソースの状態を更新",
	"status.searchResults": "検索結果",
	"status.sourceStatus": "ソースの状態"
}, l = {
	"authorization.authorizationComplete": "Authorization complete",
	"authorization.authorizationFailed": "Authorization failed",
	"authorization.authorized": "Authorized",
	"authorization.cancelled": "Cancelled",
	"authorization.expired": "Expired",
	"authorization.statusUnknown": "Status unknown",
	"authorization.waitingForScanConfirmation": "Waiting for scan confirmation",
	"availability.thisPageContextExpiredOpenThe": "This page context expired. Open the module again.",
	"availability.thisPageIsAvailableCheckRuntime": "This page is available. Check runtime health in Module Management. Upstream services are not checked here.",
	"availability.thisPageIsUnavailableRefreshIts": "This page is unavailable. Refresh its status in Module Management, then open it again.",
	"choice.5eSessionToken": "5E session token",
	"choice.followCore": "Follow Core",
	"choice.latestMatch": "Latest match",
	"choice.matchDetails": "Match details",
	"choice.officialMatchesRecordedByPerfectWorld": "Official matches recorded by Perfect World",
	"choice.perfectWorld": "Perfect World",
	"choice.perfectWorldQrAuthorization": "Perfect World QR authorization",
	"choice.playerProfile": "Player profile",
	"choice.playerStats": "Player stats",
	"choice.standard": "Standard",
	"configHint.default_platform": "Perfect World, its recorded official matches, or 5E. Ranks and seasons are reported separately for each platform.",
	"configHint.reply_theme": "Image theme",
	"credential.authorizationExpired": "Administrative authorization or this page context expired. Open the page again.",
	"credential.cancelQrSignIn": "Cancel QR sign-in",
	"credential.cancellingTheQrSession": "Cancelling the QR session.",
	"credential.checkQrSignInStatus": "Check QR sign-in status",
	"credential.clearCredentials": "Clear credentials",
	"credential.configConflict": "Another operation changed the settings. Credential inputs were cleared. Refresh status before trying again.",
	"credential.configuredUpstreamValidityIsUnverified": "Configured. Upstream validity is unverified.",
	"credential.credentialsCleared": "Credentials cleared.",
	"credential.decryptionFailed": "Configured, but decryption failed. Check the service key before configuring again.",
	"credential.enterAValidKeyOrToken": "Enter a valid key or token of 1 to 4096 characters.",
	"credential.mutationUnverified": "The operation did not complete or its result is unconfirmed. Credential inputs were cleared. Refresh and verify the status.",
	"credential.notConfigured": "Not configured.",
	"credential.operationCancelled": "Operation cancelled.",
	"credential.perfectWorldAuthorizationWasRevoked": "Perfect World authorization was revoked.",
	"credential.perfectWorldAuthorizationWasSavedThe": "Perfect World authorization was saved. The player’s Steam link stays separate.",
	"credential.perfectWorldSignInQrCode": "Perfect World sign-in QR code for this administrative authorization only",
	"credential.qrSignInStatus": " QR sign-in: {status}.",
	"credential.refreshToCheckStatus": "Refresh to check status.",
	"credential.revokePerfectWorldAuthorization": "Revoke Perfect World authorization",
	"credential.saveCredentials": "Save credentials",
	"credential.savedUnverifiedUpstream": "Credentials saved. Validity is checked when requesting the source.",
	"credential.scanWithThePerfectWorldApp": "Scan with the Perfect World app and confirm authorization yourself. Keep this page open while waiting.",
	"credential.signInSignInAgainBy": "Sign in / sign in again by QR code",
	"credential.sourceCredentialsAreNeverKeptAs": "Source credentials are never kept as ordinary drafts.",
	"credential.submitCredentialsOnlyThroughTrustedAdministration": "Submit credentials only through trusted administration. Inputs are kept only on this page. Upstream validity is checked during lookup.",
	"credential.theAuthorizationSessionEndedRefreshThe": "The authorization session ended. Refresh the status.",
	"credential.theQrCodeExpiredSignIn": "The QR code expired. Sign in again.",
	"credential.theQrCodeTimedOutSign": "The QR code timed out. Sign in again.",
	"credential.theQrSessionWasCancelled": "The QR session was cancelled.",
	"help.a5eDomainIsSeparateFrom": "A 5E domain is separate from a SteamID. Stats indicate the source season.",
	"help.commandHelp": "Command help",
	"help.officialMatchResultsAreLimitedTo": "Official match results are limited to matches recorded by Perfect World.",
	"help.perfectWorldAndOfficialLookupsCan": "Perfect World and official lookups can use your Steam link. Model queries require an explicit account.",
	"help.perfectWorldCanReturnAFull": "Perfect World can return a full roster and player focus. Official and 5E lookups also require --account and use that player’s recent sample.",
	"help.viewSourceAndCredentialStatusUpstream": "View source and credential status. Upstream validity is checked during lookup.",
	"help.viewTheLatestMatchFromThe": "View the latest match from the source. Official and 5E results provide a limited player summary.",
	"metric.unknown": "Unknown",
	"module.cs2.source": "Set up Perfect World QR authorization and the 5E Token in trusted settings. Login identities authorize requests and do not replace player links. Official and 5E match details cover player summaries from recent source samples.",
	"module.cs2.summary": "View profiles, recent matches, season stats, and match details from Perfect World, its recorded official matches, and 5E.",
	"page.accountScope": "Default accounts are used only for authorized commands. Natural-language tools require an explicit account or match ID.",
	"page.homeNavigation": "Choose a lookup from the module menu, or open feature settings to adjust your options.",
	"page.moduleEyebrow": "{module} / Module",
	"page.moduleMissing": "There is no available module declaration for this page.",
	"page.moduleRuntimeContextChangedOpenThe": "Module runtime context changed. Open the page again.",
	"page.moduleUnavailable": "Module page unavailable",
	"page.pageAvailabilityChangedReviewTheRefreshed": "Page availability changed. Review the refreshed settings.",
	"page.saveVerification": "Settings are read back and checked after saving. If there is a conflict or the result is unconfirmed, refresh manually.",
	"page.settings.cs2": "Perfect World authorization and the 5E Token are used only for source requests. The player being looked up is selected separately. The account owner must confirm the QR code in person. Leaving the page stops polling.",
	"page.settingsTitle": "{module} feature settings",
	"page.sourceAccess": "Source access",
	"page.thisPageIsNotDeclaredReturn": "This page is not declared. Return to the module list and open it again.",
	"query.aSelectionIsRequiredFollowThe": "A selection is required. Follow the source guidance to configure or choose an alternative.",
	"query.account": "Account",
	"query.authorizationIsRequiredInTrustedSettings": "Authorization is required in trusted settings.",
	"query.cardPreviewDidNotFinishNo": "Card preview did not finish. No verified text or images were obtained. Retry preview or search for text only. Each action queries the source again.",
	"query.coverageUnknown": "Coverage unknown",
	"query.credentialsConfiguredUpstreamValidityIsChecked": "Credentials configured. Upstream validity is checked during lookup.",
	"query.detailCoverageUnknown": "Detail coverage unknown",
	"query.durationSeconds": "Duration (seconds)",
	"query.enterAnExplicitAccountAndCheck": "Enter an explicit account and check the allowed input ranges.",
	"query.error.authExpired": "Authorization for the selected source expired. Authorize again in trusted settings before searching.",
	"query.error.authRequired": "The selected source requires authorization. In trusted settings, complete Perfect World QR authorization or configure a 5E Token. Check the source before searching again.",
	"query.error.invalidParameters": "Check the player account, selected source, season, and match ID before searching again.",
	"query.error.noRecords": "No usable records are available from the source. Check the recorded matches again later.",
	"query.error.notFound": "The source could not find the player or record. Check the account and selected source, then search again.",
	"query.error.notPublic": "The player profile is private or source access is restricted. Check visibility and source authorization, then search again.",
	"query.error.rateLimited": "The source rate-limited this request. Try again later. The page will not retry automatically.",
	"query.error.unparsed": "The source has not parsed the record yet. Wait for parsing to complete before searching again.",
	"query.error.upstreamUnavailable": "The selected source is temporarily unavailable. Try again later.",
	"query.firstBatchOfRecentSamples": "First batch of recent samples",
	"query.focusAccount": "Focus account",
	"query.focusMetrics": "Focus: {player} · {account} · K/D/A: {kda} · rating: {rating} · PW rating: {pwRating} · ADR: {adr}",
	"query.focusName": "Focus name",
	"query.focusOutcome": "Focus outcome",
	"query.fullMatch": "Full match",
	"query.heroId": "Hero ID",
	"query.limitedRecentPlayerSummary": "Limited recent player summary",
	"query.map": "Map",
	"query.match": "Match",
	"query.matchFocusAccountOptional": "Match focus account (optional)",
	"query.matchId": "Match ID",
	"query.matchSummary": "Match: {match} · Map: {map} · Score: {score}",
	"query.matches": "Matches",
	"query.missingValuesStayUnknown": "Unknown means the source did not provide a value. It is not counted as zero.",
	"query.noMatchesInSample": "The current source sample has no matches to show.",
	"query.noProfileCardWasReturnedText": "No profile card was returned. Text details are available.",
	"query.noUsableRoster": "The source did not provide a usable player roster.",
	"query.noVerifiedResultWasObtained": "No verified result was obtained.",
	"query.notProvided": "Not provided",
	"query.pageAuthorizationOrRuntimeContextChanged": "Page authorization or runtime context changed. Open the page again.",
	"query.player": "Player",
	"query.playerAccountSteamid645eDomain": "Player account (SteamID64 / 5E domain)",
	"query.playerMetrics": "Player: {player} · K/D/A: {kda} · rating: {rating} · PW rating: {pwRating} · ADR: {adr}",
	"query.playerRank": "Player: {player} · Account: {account} · Rank: {rank} · Score: {score}",
	"query.playerSummary": "Player summary",
	"query.profileCardAlt": "CS2 profile card {index}",
	"query.queryingTheSource": "Querying the source.",
	"query.recentMatches": "Recent matches",
	"query.recentMatchesToShow": "Recent matches to show",
	"query.recordedByPlatform": "Recorded by platform",
	"query.retryCardPreview": "Retry card preview",
	"query.sampleTimestamp": "Sample time: {time}{season}",
	"query.score": "Score",
	"query.search": "Search",
	"query.searchForTextDetailsOnly": "Search for text details only",
	"query.searchType": "Search type",
	"query.seasonOptional": "Season (optional)",
	"query.seasonSuffix": " · Season {season}",
	"query.someDetailsAreUnavailable": "Some details are unavailable.",
	"query.source": "Source",
	"query.sourceCoverage": "Source: {source} · Coverage: {coverage}",
	"query.sourceCoverageDetail": "Source: {source} · Coverage: {coverage} · Detail: {detail}",
	"query.sourceMatchId": "Source match ID",
	"query.sourceResultsUpdated": "Source results updated.",
	"query.sourceUnknown": "Source unknown",
	"query.team": "Team",
	"query.theLookupDidNotFinishCheck": "The lookup did not finish. Check the source response.",
	"query.theLookupDidNotFinishFollow": "The lookup did not finish. Follow the source guidance and search again.",
	"query.theProfileCardImageCouldNot": "The profile card image could not be verified. Text details are still available.",
	"query.theRequestDidNotFinishOr": "The request did not finish or the response was incomplete. Check the account and source before searching again.",
	"query.theSourceReturnedNoUsableResult": "The source returned no usable result.",
	"query.thisSourceProvidesASummaryOf": "This source provides a summary of the player’s recent sample.",
	"query.unknown": "Unknown",
	"query.unknownOption": "Unknown option",
	"query.webLookupsAlwaysRequireAnExplicit": "Web lookups always require an explicit account and do not read your default link. 5E uses a domain. Official and 5E match lookups only cover recent player summaries from the source.",
	"query.winRate": "Win rate",
	"route.home": "Help and status",
	"route.query": "Platform lookup",
	"route.settings": "Settings",
	"section.dataAndAccounts": "Data and accounts",
	"section.queryAndReply": "Search and replies",
	"section.queryCriteria": "Search criteria",
	"section.settingsHelp": "About settings",
	"section.sourceCredentials": "Source credentials and authorization",
	"section.sourceScope": "Data sources and coverage",
	"section.statusAndHelp": "Status and help",
	"setting.defaultCs2Source": "Default CS2 source",
	"setting.replyTheme": "Reply theme",
	"settings.authorizationExpired": "Administrative authorization or the module context expired. Open the page again.",
	"settings.chooseAnAvailableOption": "Choose an available option.",
	"settings.configConflict": "Another operation changed the settings. Your draft was kept. Refresh manually and review before saving.",
	"settings.discardModuleChanges": "Discard module changes",
	"settings.draftTooLong": "This input exceeds the draft size limit. Shorten it before leaving the page.",
	"settings.enterAValidIanaTimeZone": "Enter a valid IANA time zone, such as Asia/Shanghai.",
	"settings.enterAnIanaTimeZoneWithin": "Enter an IANA time zone within the allowed length.",
	"settings.followCoreClearsTheModulesReply": "Follow Core clears the module’s reply theme override. Restoring defaults creates a draft that takes effect after saving.",
	"settings.integerRange": "Enter an integer from {minimum} to {maximum}.",
	"settings.invalidConfig": "The settings were rejected. Check the fields, then refresh manually and review before saving.",
	"settings.invalidCurrentValue": "The current setting is invalid. Edit it or restore the default before saving.",
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
	"settings.youHaveUnsavedChanges": "You have unsaved changes.",
	"status.couldNotReadSourceStatusRefresh": "Could not read source status. Refresh again later.",
	"status.refreshSourceStatus": "Refresh source status",
	"status.searchResults": "Search results",
	"status.sourceStatus": "Source status"
}, u = "cs2", d = (e) => e === "cs2" ? {
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
//#region packages/steam_dlc/pages/src/metric.js
function y(e, t = g) {
	return typeof e == "number" ? Number.isFinite(e) ? String(e) : t("metric.unknown") : typeof e == "string" && /^-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?$/u.test(e) && Number.isFinite(Number(e)) ? e : t("metric.unknown");
}
//#endregion
//#region packages/steam_dlc/pages/src/controller.js
var b = "cs2", x = (e) => Object.freeze({ cs2: ((e) => ({
	title: "CS2",
	summary: e("module.cs2.summary"),
	source: e("module.cs2.source"),
	commands: [
		["/ygl cs2 status", e("help.viewSourceAndCredentialStatusUpstream")],
		["/ygl cs2 profile [SteamID64] --platform perfect [--season S16]", e("help.perfectWorldAndOfficialLookupsCan")],
		["/ygl cs2 recent [SteamID64] --platform official [--limit 5]", e("help.officialMatchResultsAreLimitedTo")],
		["/ygl cs2 stats <5E-domain> --platform 5e [--season 2026S5]", e("help.a5eDomainIsSeparateFrom")],
		["/ygl cs2 last [SteamID64] --platform perfect", e("help.viewTheLatestMatchFromThe")],
		["/ygl cs2 match <来源比赛ID> --platform perfect [--focus SteamID64]", e("help.perfectWorldCanReturnAFull")]
	]
}))((t) => e(t, "cs2")) }), S = x((e, t) => e), ee = (e, t = (e, t) => g(e, t, "zh-CN", "cs2")) => C({
	waiting: t("authorization.waitingForScanConfirmation"),
	authorized: t("authorization.authorized"),
	completed: t("authorization.authorizationComplete"),
	cancelled: t("authorization.cancelled"),
	expired: t("authorization.expired"),
	failed: t("authorization.authorizationFailed")
}, e, t("authorization.statusUnknown")), C = (e, t, n) => Object.hasOwn(e, t) ? e[t] : n, w = (e, t) => JSON.stringify(e) === JSON.stringify(t), T = (e) => JSON.stringify([
	e.owner,
	e.runtimeId,
	e.epoch,
	e.boundary
]), E = (e) => typeof e?.message == "string" ? e.message : "", te = /* @__PURE__ */ new Set([
	"admin_authorization_denied",
	"page_revoked",
	"page_unavailable",
	"stale_context"
]), D = Object.freeze({
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
}), ne = (e, t) => {
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
}, re = (e, t) => {
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
}, ie = (e, t) => t === "steam" ? { steam: [["credential_steam_key", "Steam Web API Key"]] } : t === "dota2" ? { dota2: [["credential_opendota_key", e("choice.opendotaKeyOptional")]] } : t === "cs2" ? { cs2: [["credential_perfect", e("choice.perfectWorldQrAuthorization")], ["credential_fivee", e("choice.5eSessionToken")]] } : {};
function ae(e, t = g) {
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
var O = Uint32Array.from({ length: 256 }, (e, t) => {
	let n = t;
	for (let e = 0; e < 8; e++) n = n & 1 ? 3988292384 ^ n >>> 1 : n >>> 1;
	return n >>> 0;
});
function oe(e, t, n = g) {
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
		for (let e = s + 4; e < t - 4; e++) r = O[(r ^ a[e]) & 255] ^ r >>> 8;
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
var k = /* @__PURE__ */ new Map(), se = 4, ce = 4096, le = 256;
function ue(e, t, n) {
	for (let [n, r] of k) r.owner === e.owner && n !== t && k.delete(n);
	if (!n || t.length > ce) return null;
	let r = k.get(t) || {
		owner: e.owner,
		drafts: /* @__PURE__ */ new Map(),
		token: null
	};
	for (r.token = Symbol("ordinary-draft-mount"), k.delete(t), k.set(t, r); k.size > se;) k.delete(k.keys().next().value);
	return r;
}
function de(e, t) {
	let n = e.ownerDocument, r = { ...t.context }, i = b, a = t.presentation?.template, o = t.copy || _(() => r.locale, void 0, i), s = o.text, c = (e) => y(e, s), l = t.themeLabel || ((e, t) => e === null && t === o.textAt("zh-CN", "choice.followCore") ? s("choice.followCore") : t), u = (e, t) => {
		let n = "configHint." + e;
		return o.textAt("zh-CN", n) === t ? s(n) : t;
	}, d = (e, t, n) => C(e(s), t, n), f = T(t.context), p = S[i], m = () => ne(s, i), h = () => re(s, i), g = ie(s, i), O = p ? ue(t.context, f, t.routeId === "settings") : null, se = O?.token, ce = !1, de = !1, fe = !1, A = 0, j = !1, M = !1, N = null, P = !1, pe = !1, F = null, I = 0, L, R = null, me = null, z = !1, B = 0, he = () => {}, ge = () => {}, _e = [], ve = [], V = /* @__PURE__ */ new Map(), ye = () => {}, be = 0, xe = "", Se = 0, H = null, Ce = () => {}, U = new Map(O?.drafts), W = /* @__PURE__ */ new Map(), we = [], G = (e, t, r) => {
		let i = n.createElement(e);
		return typeof t == "function" ? o.bind(i, t) : t !== void 0 && (i.textContent = t), r && (i.className = r), i;
	}, K = (e, t, n) => {
		e.addEventListener(t, n), we.push(() => e.removeEventListener(t, n));
	}, q = G("section", void 0, "steam-dlc-page"), Te = G("p", "", "steam-dlc-hint");
	Te.setAttribute("role", "status");
	let Ee = G("p", "", "steam-dlc-message");
	Ee.setAttribute("role", "status"), Ee.setAttribute("aria-live", "polite"), a || q.append(Te), e.replaceChildren(q);
	let J = () => ((t.scope.signal.aborted || !t.scope.isCurrent()) && (fe = !0), !ce && !de && !fe && T(r) === f && (!O || k.get(f) === O && O.token === se)), Y = () => J() && r.available, De = () => Object.freeze({
		ordinary: U.size > 0,
		credentials: J() && ([...V.values()].some((e) => !!e.input?.value) || R?.state === "waiting"),
		pending: j || P,
		version: be
	}), Oe = () => {
		let e = JSON.stringify([
			U.size > 0,
			j,
			Se,
			De().credentials,
			P
		]);
		e !== xe && (xe = e, be += 1, t.onNavigationStateChange?.());
	}, ke, Ae = () => {
		let e = typeof ke?.text == "function" ? ke.text() : ke?.text;
		a ? a.publish({ notice: e ? {
			key: "custom",
			text: e,
			tone: ke.tone,
			role: "status"
		} : void 0 }) : Ee.textContent = e || "";
	}, X = (e, t = "warning") => {
		H !== null && (clearTimeout(H), H = null), ke = {
			text: e,
			tone: t
		}, Ae(), Ee.dataset.tone = t, e && t === "success" && (H = setTimeout(() => {
			H = null, J() && (ke = void 0, Ae());
		}, 3500));
	}, je = () => {
		q.dataset.theme = r.theme, Te.textContent = J() ? r.available ? s("availability.thisPageIsAvailableCheckRuntime") : s("availability.thisPageIsUnavailableRefreshIts") : s("availability.thisPageContextExpiredOpenThe");
	}, Z, Me, Ne, Pe, Fe, Ie = () => {
		O && J() && (O.drafts = new Map([...U].filter(([e, t]) => {
			let n = D[i]?.includes(e), r = t.rawValue ?? t.value;
			return n && (t.kind === "clear" || t.kind === "set" && [
				"string",
				"boolean",
				"number"
			].includes(typeof r) && !(typeof r == "number" && !Number.isFinite(r)) && !(typeof r == "string" && r.length > le));
		})));
	}, Le = () => {
		(O ? k.get(f) === O && O.token === se : t.routeId === "home") && k.delete(f), de = !0, A += 1, j = !1, M = !1, U.size && (Se += 1), U.clear(), N = null, a?.publish({
			themeField: void 0,
			themeValue: "",
			themeError: void 0
		});
		for (let { control: e } of W.values()) e.value = "";
		I += 1, tt(), et(), F = null, R = null, P = !1, pe = !1;
	}, Q = () => {
		if (Ie(), je(), q.setAttribute("aria-busy", String(j || P)), a && (a.publish({
			availability: Te.textContent,
			pending: j || P
		}), t.routeId === "home" && a.actionState("refresh", {
			disabled: !Y(),
			busy: j
		}), Z && (a.actionState("save", {
			disabled: !Y() || R?.state === "waiting" || !j && (!M || !U.size),
			busy: j || P
		}), a.actionState("refresh", { disabled: !Y() }), a.actionState("discard", { disabled: !Y() || !U.size }), a.publish({ themeReadonly: !Y() || !N }), Fe?.setAttribute("aria-disabled", String(!Y() || !N)))), Z) {
			Me?.setAttribute("aria-disabled", String(!Y() || j || P || R?.state === "waiting" || !M || !U.size)), Ne?.setAttribute("aria-disabled", String(!Y() || j || P)), Pe?.setAttribute("aria-disabled", String(!Y() || j || P || !U.size));
			for (let { control: e, reset: t } of W.values()) e.disabled = !Y() || !N, t.setAttribute("aria-disabled", String(!Y() || !N));
		}
		Qe && Qe.setAttribute("aria-disabled", String(!Y() || j)), ye(), Oe();
	}, Re = [], ze = (e) => {
		if (!e || !Number.isSafeInteger(e.revision) || e.revision < 1 || !e.fields || !e.descriptors || (Re = (D[i] || []).filter((t) => e.fields[t] && e.descriptors[t]), !Re.includes("reply_theme"))) throw Error("invalid_snapshot");
		for (let t of Re) {
			let n = e.fields[t], r = e.descriptors[t];
			if (!n || !r || typeof r.description != "string" || t === "reply_theme" && (!Array.isArray(r.choices) || !r.choices.length || !r.choices.some((e) => e.value === null) || r.choices.some((e) => typeof e.label != "string" || e.value !== null && typeof e.value != "string")) || t === "timezone" && r.value_schema?.type !== "string" || t === "poster_include_apps" && (r.value_schema?.type !== "boolean" || typeof r.default != "boolean" || typeof n.value != "boolean") || t === "poster_limit" && (r.value_schema?.type !== "integer" || ![1, 20].includes(r.value_schema.minimum) || !Number.isInteger(r.default) || !Number.isInteger(n.value))) throw Error("invalid_snapshot");
		}
		return e;
	}, Be = (e) => {
		let t = U.get(e);
		return t ? t.kind === "clear" ? N.descriptors[e].default : t.value : N.fields[e].value;
	}, Ve = (e) => e === "reply_theme" ? N.descriptors[e].choices.map(({ value: e, label: t }) => ({
		value: e,
		label: l(e, t)
	})) : e === "poster_include_apps" ? [{
		value: !1,
		label: s("settings.gamesOnly")
	}, {
		value: !0,
		label: s("settings.allApps")
	}] : N.descriptors[e].value_schema?.type === "boolean" ? [{
		value: !1,
		label: s("settings.off")
	}, {
		value: !0,
		label: s("settings.on")
	}] : N.descriptors[e].choices || N.descriptors[e].value_schema?.enum?.map((e) => ({
		value: e,
		label: d(h, e, String(e))
	})), He = (e) => !!Ve(e), $ = (e, t) => {
		if (!Y() || !N) return;
		let n = N.fields[e], r = !j && (t.kind === "clear" ? !n.present : n.state === "valid" && w(n.value, t.value)) ? void 0 : t;
		if (w(U.get(e), r)) return;
		r === void 0 ? U.delete(e) : U.set(e, r), Se += 1, a && e === "reply_theme" ? a.publish({ themeError: void 0 }) : o.bind(W.get(e).error, () => ""), W.get(e)?.control.setAttribute("aria-invalid", "false");
		let i = U.size && (!O || [...U.values()].some((e) => e.kind === "set" && typeof (e.rawValue ?? e.value) == "string" && (e.rawValue ?? e.value).length > le));
		X(i ? () => s("settings.draftTooLong") : U.size ? () => s("settings.youHaveUnsavedChanges") : "", "warning"), Q();
	}, Ue = () => {
		if (a) {
			let e = "reply_theme", t = N.descriptors[e], n = Ve(e);
			a.publish({
				themeField: {
					id: e,
					label: d(m, e, e),
					control: "select",
					hint: u(e, t.description),
					choices: n.map(({ label: e }, t) => ({
						value: String(t),
						label: e
					}))
				},
				themeValue: String(n.findIndex((t) => w(t.value, Be(e)))),
				themeError: N.fields[e].state !== "valid" && !U.has(e) ? s("settings.invalidCurrentValue") : void 0
			});
		}
	}, We = () => {
		Ue();
		for (let [e, { control: t }] of W) He(e) && Ve(e).forEach(({ label: e }, n) => {
			t.options[n] && (t.options[n].textContent = e);
		});
	}, Ge = () => {
		Ue();
		for (let [e, { control: t, error: n, hint: r }] of W) {
			o.bind(r, () => u(e, N?.descriptors[e]?.description || ""));
			let i = Be(e);
			if (He(e)) {
				let n = Ve(e);
				t.replaceChildren(...n.map((e, t) => {
					let n = G("option", e.label);
					return n.value = String(t), n;
				})), t.value = String(n.findIndex((e) => w(e.value, i)));
			} else t.value = U.get(e)?.rawValue === void 0 ? typeof i == "string" || typeof i == "number" ? String(i) : "" : U.get(e).rawValue;
			let a = N.fields[e].state !== "valid" && !U.has(e);
			o.bind(n, a ? () => s("settings.invalidCurrentValue") : () => ""), t.setAttribute("aria-invalid", String(!!n.textContent));
		}
	}, Ke = !1, qe = () => {
		let e = /* @__PURE__ */ new Map(), n = (e) => "workspace", r = {
			poster: "route.collage",
			subscriptions: "section.subscriptions",
			workspace: "section.queryAndReply"
		};
		for (let o of Re) {
			if (a && o === "reply_theme") {
				a.bind(o, (e) => {
					if (!Y() || !N) return;
					let t = Ve(o)[Number(e)];
					t && $(o, t.value === null ? { kind: "clear" } : {
						kind: "set",
						value: t.value
					}), Ge();
				});
				let e = G("button", () => a.text("resetDefault"), "ui-button");
				Fe = e, e.type = "button", e.dataset.action = "reset-reply_theme", K(e, "click", () => {
					Y() && N && ($(o, { kind: "clear" }), Ge());
				}), Z.append(e);
				continue;
			}
			let c = n(o);
			if (!e.has(c)) {
				let n = G("section", void 0, "steam-dlc-config-group");
				a ? (a.groupHost(c) || Z).append(n) : (n.append(G("h3", () => s(r[c]))), Z.insertBefore(n, Z.querySelector(":scope > .steam-dlc-actions"))), e.set(c, {
					section: n,
					grid: t.presentation?.grid(n)
				});
			}
			let { section: l, grid: f } = e.get(c), p = N.descriptors[o], h = G("div", void 0, "steam-dlc-field"), g = G("label", () => d(m, o, o)), _ = G(He(o) ? "select" : "input");
			_.className = "ui-control", _.id = `steam-dlc-${i}-${o}`, g.htmlFor = _.id, _.name = o;
			let v = G("p", () => u(o, p.description), "steam-dlc-hint");
			v.id = `${_.id}-hint`;
			let y = G("p", "", "steam-dlc-field-error");
			y.id = `${_.id}-error`, _.setAttribute("aria-describedby", `${v.id} ${y.id}`), o === "timezone" && (_.type = "text", _.autocomplete = "off", _.maxLength = Math.min(p.value_schema.maxLength ?? le, le)), !He(o) && p.value_schema?.type === "integer" && (_.type = "number", _.min = String(p.value_schema.minimum), p.value_schema.maximum !== void 0 && (_.max = String(p.value_schema.maximum)), _.step = "1", o === "poster_limit" && (_.type = "text", _.inputMode = "decimal", _.removeAttribute("min"), _.removeAttribute("max")));
			let b = G("button", () => a?.text("resetDefault") || s("settings.restoreDefault"));
			b.className = "ui-button", b.type = "button", b.dataset.action = `reset-${o}`, K(b, "click", () => {
				Y() && N && ($(o, { kind: "clear" }), Ge());
			});
			let x = G("div", void 0, "steam-dlc-actions");
			if (x.append(b), o === "poster_limit") for (let e of [
				20,
				50,
				100,
				200,
				500,
				1e3,
				"all"
			]) {
				let t = G("button", () => e === "all" ? s("settings.unlimited") : String(e), "ui-button");
				t.type = "button", K(t, "click", () => {
					if (Y() && N) {
						if (W.has("poster_limit_mode") && $("poster_limit_mode", {
							kind: "set",
							value: e === "all" ? "all" : "top"
						}), e !== "all") $(o, {
							kind: "set",
							value: e
						});
						else if (!W.has("poster_limit_mode")) {
							X(() => s("settings.unlimitedModeUnavailable"), "warning");
							return;
						}
						Ge();
					}
				}), x.append(t);
			}
			K(_, He(o) ? "change" : "input", () => {
				if (Y() && N) {
					if (He(o)) {
						let e = Ve(o)[Number(_.value)];
						if (!e) return;
						$(o, e.value === null ? { kind: "clear" } : {
							kind: "set",
							value: e.value
						});
					} else if (p.value_schema?.type === "integer") {
						let e = _.value;
						if (o === "poster_limit") {
							try {
								$(o, {
									kind: "set",
									value: ae(e, s)
								});
							} catch {
								$(o, {
									kind: "set",
									value: null,
									rawValue: e
								});
							}
							return;
						}
						$(o, o === "opendota_rph" && e === "" ? { kind: "clear" } : _.validity.valid && e !== "" ? {
							kind: "set",
							value: Number(e)
						} : {
							kind: "set",
							value: null,
							rawValue: e
						});
					} else $(o, {
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
			W.set(o, {
				control: _,
				reset: b,
				error: S?.error || y,
				hint: S?.hint || v
			}), S || (h.append(g, _, x, v, y), l.append(h));
		}
	}, Je = (e) => {
		N = ze(e);
		for (let [e, t] of U) {
			let n = N.fields[e];
			(t.kind === "clear" ? !n.present : n.state === "valid" && w(n.value, t.value)) && (U.delete(e), Se += 1);
		}
		Ke ||= (qe(), !0), Ge(), M = !0;
	}, Ye = async (e = !1) => {
		if (!Y() || j || P) return;
		e && et();
		let n = ++A;
		j = !0, Q();
		try {
			if (!Y() || n !== A) return;
			let r = await t.services.config.current();
			if (!Y() || n !== A) return;
			Je(r);
			try {
				await rt();
			} catch (e) {
				if (!Y() || n !== A) return;
				nt(e), Y() && X(() => s("settings.readWithUnconfirmedCredentials"), "warning");
				return;
			}
			if (!Y() || n !== A) return;
			X(U.size ? () => s("settings.refreshedWithDraft") : e ? () => s("settings.refreshed") : "", U.size ? "warning" : "success");
		} catch (e) {
			if (!Y() || n !== A) return;
			if (te.has(E(e))) {
				Le(), X(() => s("settings.authorizationExpired"), "error"), Q();
				return;
			}
			M = !1, X(() => s("settings.settingsCouldNotBeReadCheck"), "error");
		} finally {
			J() && n === A && (j = !1, Q());
		}
	}, Xe = () => {
		let e = !0;
		for (let [t, n] of U) {
			if (n.kind === "clear") continue;
			let r = N.descriptors[t], i;
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
						ae(e, s);
					} catch {
						i = () => {
							try {
								ae(e, s);
							} catch (e) {
								return e.message;
							}
						};
					}
				}
			} else He(t) && !Ve(t).some((e) => w(e.value, n.value)) && (i = () => s("settings.chooseAnAvailableOption"));
			a && t === "reply_theme" ? a.publish({ themeError: i?.() }) : (o.bind(W.get(t).error, i || (() => "")), W.get(t).control.setAttribute("aria-invalid", String(!!i))), i && (e = !1);
		}
		return W.has("poster_mode") && Be("poster_mode") === "legacy" && Be("poster_limit") > 200 && (o.bind(W.get("poster_limit").error, () => s("settings.legacyLimit")), W.get("poster_limit").control.setAttribute("aria-invalid", "true"), e = !1), e;
	}, Ze = async () => {
		if (!Y() || j || P || R?.state === "waiting" || !M || !U.size || !Xe()) return;
		let e = new Map(U), n = {}, r = [];
		for (let [t, i] of e) i.kind === "clear" ? r.push(t) : n[t] = i.value;
		let i = N.revision, a = !1, o = ++A;
		j = !0, M = !1, X(() => s("settings.savingPleaseWaitForConfirmation")), Q();
		let c = (e) => {
			if (!e || !Number.isSafeInteger(e.revision) || e.revision <= i) throw Error("invalid_receipt");
			i = e.revision, a = !0;
		};
		try {
			if (!Y() || o !== A) return;
			if (Object.keys(n).length) {
				let e = await t.services.config.save(i, n);
				if (!Y() || o !== A) return;
				c(e);
			}
			if (r.length) {
				let e = await t.services.config.clear(i, r);
				if (!Y() || o !== A) return;
				c(e);
			}
			let a = await t.services.config.current();
			if (!Y() || o !== A) return;
			if (ze(a), a.revision < i) throw Error("unverified_snapshot");
			for (let [t, n] of e) {
				let e = a.fields[t];
				if (n.kind === "clear" ? e.present : e.state !== "valid" || !w(e.value, n.value)) throw Error("unverified_snapshot");
			}
			for (let [t, n] of e) U.get(t) === n && (U.delete(t), Se += 1);
			Je(a);
			try {
				await rt();
			} catch (e) {
				if (!Y() || o !== A) return;
				nt(e), Y() && X(() => s("settings.savedWithUnconfirmedCredentials"), "warning");
				return;
			}
			if (!Y() || o !== A) return;
			X(U.size ? () => s("settings.savedWithNewerDraft") : () => s("settings.saved"), U.size ? "warning" : "success");
		} catch (e) {
			if (!Y() || o !== A) return;
			if (te.has(E(e))) {
				Le(), X(() => s("settings.authorizationExpired"), "error"), Q();
				return;
			}
			let t = E(e) === "revision_conflict";
			X(a ? () => s("settings.partialWriteUnverified") : t ? () => s("settings.configConflict") : E(e) === "invalid_config" ? () => s("settings.invalidConfig") : () => s("settings.saveUnverified"), "error");
		} finally {
			J() && o === A && (j = !1, Q());
		}
	}, Qe, $e = 0, et = () => {
		for (let e of V.values()) e.input && (e.input.value = "");
	}, tt = () => {
		me !== null && (clearTimeout(me), me = null), V.get("credential_perfect")?.qr?.removeAttribute("src");
	}, nt = (e) => {
		te.has(E(e)) ? (Le(), X(() => s("credential.authorizationExpired"), "error")) : E(e) === "operation_cancelled" ? X(() => s("credential.operationCancelled")) : (F = null, X(E(e) === "revision_conflict" ? () => s("credential.configConflict") : () => s("credential.mutationUnverified"), "error"));
	}, rt = async () => {
		if (!Y() || !g[i] || !t.services.credentials?.status) return;
		let e = I, n = A, r = await t.services.credentials.status();
		if (Y() && e === I && n === A) {
			if (!r || !Number.isSafeInteger(r.revision) || r.revision < 1 || !r.fields) throw Error("invalid_credential_status");
			for (let [e] of g[i]) {
				let t = r.fields[e];
				if (t && (typeof t.configured != "boolean" || typeof t.decryptable != "boolean" || t.upstream !== "unverified")) throw Error("invalid_credential_status");
			}
			F = r, lt(), ye();
		}
	}, it = async (e) => {
		let n = I;
		if (!e || !Number.isSafeInteger(e.revision) || e.revision <= F.revision) throw Error("invalid_receipt");
		let r = await t.services.config.current();
		if (Y() && n === I) {
			if (r.revision < e.revision) throw Error("unverified_snapshot");
			Je(r), await rt();
		}
	}, at = async (e, n) => {
		if (!Y() || j || P || !F || R?.state === "waiting") return;
		let r = V.get(e).input?.value.trim();
		if (!n && (!r || r.length > 4096 || /[\x00-\x1f\x7f-\x9f]/u.test(r))) {
			X(() => s("credential.enterAValidKeyOrToken"), "error");
			return;
		}
		let i = ++I;
		et(), P = !0, Q();
		try {
			let a = n ? await t.services.credentials.clear(F.revision, e) : await t.services.credentials.replace(F.revision, e, { token: r });
			if (!Y() || i !== I || (await it(a), !Y() || i !== I)) return;
			let o = F.fields[e];
			if (!o || o.configured === n) throw Error("unverified_snapshot");
			X(n ? () => s("credential.credentialsCleared") : () => s("credential.savedUnverifiedUpstream"), "success");
		} catch (e) {
			Y() && i === I && nt(e);
		} finally {
			J() && i === I && (P = !1, Q());
		}
	}, ot = (e) => {
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
	}, st = () => {
		if (!Y() || R?.state !== "waiting" || z) return;
		me !== null && clearTimeout(me);
		let e = R.expires_at * 1e3 - Date.now();
		if (e <= 0) {
			tt(), R = {
				...R,
				state: "expired"
			}, X(() => s("credential.theQrCodeTimedOutSign")), Q();
			return;
		}
		let t = Math.min(e, Math.max(250, R.next_poll_at * 1e3 - Date.now()));
		me = setTimeout(() => {
			me = null, ct("poll");
		}, t);
	}, ct = async (e) => {
		if (!Y() || !F || e === "cancel" && (z = !0, tt(), Q(), P) || j || P) return;
		e === "begin" && (tt(), R = null, z = !1);
		let n = ++I, r = R?.session_id || "", i = null;
		P = !0, pe = !0, et(), Q();
		try {
			let a = await t.services.credentials.authorize(F.revision, "perfect_qr", e, r);
			if (!Y() || n !== I) return;
			if (e === "qr") {
				if (typeof a.qr_png != "string" || a.qr_png.length > 5e5 || !/^iVBORw0KGgo[A-Za-z0-9+/=]*$/u.test(a.qr_png)) throw Error("invalid_qr_png");
				z || (V.get("credential_perfect").qr.src = `data:image/png;base64,${a.qr_png}`);
			} else {
				if (e === "revoke") {
					if (!a || Object.keys(a).sort().join(",") !== "receipt,revoked" || a.revoked !== !0 || !a.receipt) throw Error("invalid_revocation_receipt");
					R = null;
				} else R = ot(a.session);
				if (a.receipt && await it(a.receipt), !Y() || n !== I) return;
				if (e === "revoke" && F?.fields.credential_perfect?.configured !== !1) throw Error("unverified_revocation");
				if (R?.state === "waiting") X(z ? () => s("credential.cancellingTheQrSession") : () => s("credential.scanWithThePerfectWorldApp")), e === "begin" && (i = "qr");
				else {
					tt();
					let t = R?.state;
					X(t === "authorized" ? () => s("credential.perfectWorldAuthorizationWasSavedThe") : e === "revoke" ? () => s("credential.perfectWorldAuthorizationWasRevoked") : t === "expired" ? () => s("credential.theQrCodeExpiredSignIn") : t === "cancelled" ? () => s("credential.theQrSessionWasCancelled") : () => s("credential.theAuthorizationSessionEndedRefreshThe"), t === "authorized" || e === "revoke" ? "success" : "warning"), z = !1;
				}
			}
		} catch (e) {
			Y() && n === I && (tt(), R = null, z = !1, nt(e));
		} finally {
			J() && n === I && (P = !1, pe = !1, Q(), z && R?.state === "waiting" ? ct("cancel") : i ? ct(i) : R?.state === "waiting" && st());
		}
	}, lt = () => {
		let e = (g[i] || []).filter(([e]) => F.fields[e]);
		if (e.length) {
			L || (L = G("section", void 0, "steam-dlc-credentials"), t.presentation?.credentialHost || L.append(G("h3", () => s("section.sourceCredentials"))), L.append(G("p", () => s("credential.submitCredentialsOnlyThroughTrustedAdministration"), "steam-dlc-hint")), t.presentation?.credentialHost ? t.presentation.credentialHost.append(L) : q.insertBefore(L, Ee));
			for (let [n] of e) {
				if (V.has(n)) continue;
				let e = G("section", void 0, "steam-dlc-credential"), r = G("p", "", "steam-dlc-credential-status");
				r.setAttribute("role", "status");
				let a = G("div", void 0, "steam-dlc-actions"), c = {
					status: r,
					actions: a,
					buttons: []
				}, l = () => g[i].find(([e]) => e === n)[1];
				e.append(G("h4", l), r);
				let u = (e, t, n) => {
					let r = G("button", t, "ui-button");
					return r.type = "button", r.dataset.action = e, K(r, "click", () => {
						r.getAttribute("aria-disabled") !== "true" && n();
					}), a.append(r), c.buttons.push(r), r;
				};
				if (n === "credential_perfect") c.qr = G("img", void 0, "steam-dlc-qr"), o.bind(c.qr, () => s("credential.perfectWorldSignInQrCode"), "alt"), c.qr.setAttribute("referrerpolicy", "no-referrer"), e.append(c.qr), u("perfect-begin", () => s("credential.signInSignInAgainBy"), () => {
					ct("begin");
				}), u("perfect-cancel", () => s("credential.cancelQrSignIn"), () => {
					ct("cancel");
				}), u("perfect-poll", () => s("credential.checkQrSignInStatus"), () => {
					ct("poll");
				}), u("perfect-revoke", () => s("credential.revokePerfectWorldAuthorization"), () => {
					ct("revoke");
				});
				else {
					let r = G("input");
					if (r.type = "password", r.className = "ui-control", r.id = `steam-dlc-${n}`, r.name = n, r.maxLength = 4096, r.autocomplete = "new-password", r.spellcheck = !1, o.bind(r, l, "ariaLabel"), c.input = r, t.presentation) {
						let n = G("label", l), i = G("p", () => s("credential.sourceCredentialsAreNeverKeptAs")), a = G("p");
						i.id = `${r.id}-hint`, a.id = `${r.id}-error`, t.presentation.field(e, {
							control: r,
							label: n,
							hint: i,
							error: a
						});
					} else e.append(r);
					K(r, "input", Q), u(`replace-${n}`, () => s("credential.saveCredentials"), () => {
						at(n, !1);
					}), u(`clear-${n}`, () => s("credential.clearCredentials"), () => {
						at(n, !0);
					});
				}
				e.append(a), V.set(n, c), L.append(e);
			}
			ye = () => {
				for (let [e, t] of V) {
					let n = F?.fields[e];
					t.status.textContent = n ? n.configured ? n.decryptable ? s("credential.configuredUpstreamValidityIsUnverified") : s("credential.decryptionFailed") : s("credential.notConfigured") : s("credential.refreshToCheckStatus"), e === "credential_perfect" && R && (t.status.textContent += s("credential.qrSignInStatus", { status: ee(R.state, s) })), t.input && (t.input.disabled = !Y() || j || P || R?.state === "waiting");
					for (let e of t.buttons) {
						let t = e.dataset.action, n = t === "perfect-cancel", r = !Y() || !F || (n ? R?.state !== "waiting" && !pe : j || P || t === "perfect-poll" && R?.state !== "waiting" || R?.state === "waiting" && !t.startsWith("perfect-"));
						e.setAttribute("aria-disabled", String(r));
					}
				}
			};
		}
	}, ut = () => {
		let e = n.defaultView?.URL || URL;
		for (let t of _e.splice(0)) e.revokeObjectURL(t);
	}, dt = (e, n, r, a, o = "") => {
		let c = G("div", void 0, "steam-dlc-public-field"), l = G("label", r), u = G(a ? "select" : "input");
		u.id = `steam-dlc-${i}-${t.routeId}-${n}`, u.name = n, u.className = "ui-control", l.htmlFor = u.id, a ? u.append(...a.map((e) => {
			let t = G("option", () => (n === "action" && e === "recent" ? s("query.recentMatches") : d(h, e, String(e))) || s("query.unknownOption"));
			return t.value = e, t;
		})) : (u.type = "text", u.maxLength = 128, u.autocomplete = "off"), u.value = o;
		let f = G("p", "", "steam-dlc-hint"), p = G("p", "", "steam-dlc-field-error");
		return f.id = `${u.id}-hint`, p.id = `${u.id}-error`, t.presentation ? t.presentation.field(e, {
			control: u,
			label: l,
			hint: f,
			error: p
		}) : (c.append(l, u), e.append(c)), ve.push(u), u;
	}, ft = (e, t) => {
		if (![
			"profile",
			"stats",
			"match",
			"recent"
		].includes(e.kind)) return;
		let n = e.data, r = (e) => typeof e == "string" && e ? e : s("query.unknown"), i = (e) => `${c(e?.scores?.[0])} : ${c(e?.scores?.[1])}`, a = (e) => `${c(e?.kills)}/${c(e?.deaths)}/${c(e?.assists)}`, o = (e, n) => {
			let r = G("div", void 0, "steam-dlc-table"), i = G("table"), a = G("tr");
			a.append(...e.map((e) => G("th", e))), i.append(a);
			for (let e of n) {
				let t = G("tr");
				t.append(...e.map((e) => G("td", e))), i.append(t);
			}
			r.append(i), t.append(r);
		}, l = () => C({
			platform_recorded: s("query.recordedByPlatform"),
			recorded_official: s("choice.officialMatchesRecordedByPerfectWorld"),
			recent_first_page: s("query.firstBatchOfRecentSamples"),
			recent_player_summary: s("query.limitedRecentPlayerSummary")
		}, e.coverage, s("query.coverageUnknown")), u = e.detail_level === "full_match";
		if (["profile", "stats"].includes(e.kind)) {
			if (t.append(G("p", () => s("query.sourceCoverage", {
				source: d(h, e.platform, s("query.sourceUnknown")),
				coverage: l()
			}), "steam-dlc-hint")), e.kind === "profile") {
				let i = n.rank || {}, a = () => typeof i.value == "string" && i.value.trim() && !/^[+-]?[\d.]+$/u.test(i.value) ? i.value : c(i.value);
				t.append(G("p", () => s("query.playerRank", {
					player: r(n.nickname),
					account: r(n.account_id || e.target?.id),
					rank: a(),
					score: c(i.score)
				})));
			}
			let i = n.metrics || {};
			o([
				() => s("query.matches"),
				"K/D",
				"rating",
				"PW rating",
				"ADR",
				"RWS",
				() => s("query.winRate")
			], [[...[
				"matches",
				"kd",
				"rating",
				"pw_rating",
				"adr",
				"rws",
				"win_rate"
			].map((e) => () => c(i[e]))]]), t.append(G("p", () => s("query.missingValuesStayUnknown"), "steam-dlc-hint"));
			return;
		}
		if (t.append(G("p", () => s("query.sourceCoverageDetail", {
			source: d(h, e.platform, s("query.sourceUnknown")),
			coverage: l(),
			detail: C({
				full_match: s("query.fullMatch"),
				player_summary: s("query.playerSummary")
			}, e.detail_level, s("query.detailCoverageUnknown"))
		}), "steam-dlc-hint")), e.detail_level === "player_summary" && t.append(G("p", () => s("query.thisSourceProvidesASummaryOf"), "steam-dlc-hint")), e.unavailable_reason && e.unavailable_reason !== "full_match_detail_unavailable" && t.append(G("p", () => s("query.someDetailsAreUnavailable"), "steam-dlc-hint")), t.append(G("p", () => s("query.missingValuesStayUnknown"), "steam-dlc-hint")), e.kind === "recent") {
			if (!Array.isArray(n.matches) || !n.matches.length) {
				t.append(G("p", () => s("query.noMatchesInSample")));
				return;
			}
			o([
				() => s("query.match"),
				() => s("query.map"),
				() => s("query.score"),
				"K/D/A",
				"rating",
				"PW rating",
				"ADR"
			], n.matches.map((e) => [
				() => r(e?.match_id),
				() => r(e?.map),
				() => i(e),
				() => a(e),
				() => c(e?.rating),
				() => c(e?.pw_rating),
				() => c(e?.adr)
			]));
			return;
		}
		if (t.append(G("p", () => s("query.matchSummary", {
			match: r(n.match_id),
			map: r(n.map),
			score: i(n)
		}))), !u) {
			t.append(G("p", () => s("query.playerMetrics", {
				player: r(n.focus?.id || e.target?.id),
				kda: a(n),
				rating: c(n.rating),
				pwRating: c(n.pw_rating),
				adr: c(n.adr)
			})));
			return;
		}
		if (n.focus && typeof n.focus == "object" && t.append(G("p", () => s("query.focusMetrics", {
			player: r(n.focus.nickname),
			account: r(n.focus.account_id),
			kda: a(n.focus),
			rating: c(n.focus.rating),
			pwRating: c(n.focus.pw_rating),
			adr: c(n.focus.adr)
		}))), !Array.isArray(n.players) || !n.players.length) {
			t.append(G("p", () => s("query.noUsableRoster")));
			return;
		}
		o([
			() => s("query.player"),
			() => s("query.account"),
			() => s("query.team"),
			"K/D/A",
			"rating",
			"PW rating",
			"ADR"
		], n.players.map((e) => [
			() => r(e?.nickname),
			() => r(e?.account_id),
			() => c(e?.team),
			() => a(e),
			() => c(e?.rating),
			() => c(e?.pw_rating),
			() => c(e?.adr)
		]));
	}, pt = (e, t) => {
		if (!e || e.schema_version !== 1 || ![
			"success",
			"partial_success",
			"needs_selection",
			"error"
		].includes(e.status)) throw Error("invalid_result");
		if (t.replaceChildren(), e.status === "error") return t.append(G("p", () => typeof e.error?.message == "string" ? e.error.message : s("query.theSourceReturnedNoUsableResult"), "steam-dlc-field-error")), !1;
		if (!e.document || !Array.isArray(e.document.blocks)) throw Error("invalid_result");
		for (let n of e.document.blocks) {
			if (n?.kind === "text" && typeof n.text == "string" && t.append(G("p", n.text)), n?.kind === "table" && Array.isArray(n.columns) && Array.isArray(n.rows)) {
				let e = G("div", void 0, "steam-dlc-table"), r = G("table"), i = G("tr");
				i.append(...n.columns.map((e) => G("th", String(e)))), r.append(i);
				for (let e of n.rows) {
					if (!Array.isArray(e)) continue;
					let t = G("tr");
					t.append(...e.map((e) => G("td", () => e === null ? s("query.unknown") : String(typeof e == "object" ? e.value ?? "" : e)))), r.append(t);
				}
				e.append(r), t.append(e);
			}
			let e = n?.kind === "fields" ? n.fields?.cs2 : null;
			if (n?.kind === "fields" && !e) {
				let e = G("dl");
				for (let [t, r] of [
					["比赛ID", "query.matchId"],
					["焦点账号", "query.focusAccount"],
					["焦点名称", "query.focusName"],
					["英雄ID", "query.heroId"],
					["焦点胜负", "query.focusOutcome"],
					["时长（秒）", "query.durationSeconds"]
				]) {
					if (!(t in (n.fields || {}))) continue;
					let i = n.fields[t];
					e.append(G("dt", () => s(r)), G("dd", () => i === null ? s("query.unknown") : typeof i == "string" || typeof i == "number" || typeof i == "boolean" ? String(i) : s("query.notProvided")));
				}
				e.childNodes.length && t.append(e);
			}
			if (Array.isArray(e?.sources)) {
				let n = G("dl", void 0, "steam-dlc-source-status");
				for (let t of e.sources) n.append(G("dt", () => d(h, t.platform, s("query.sourceUnknown"))), G("dd", () => t.credential_state === "configured" ? s("query.credentialsConfiguredUpstreamValidityIsChecked") : s("query.authorizationIsRequiredInTrustedSettings")));
				t.append(n);
			} else e?.data && (typeof e.fetched_at == "string" && t.append(G("p", () => s("query.sampleTimestamp", {
				time: e.fetched_at,
				season: e.season ? s("query.seasonSuffix", { season: e.season }) : ""
			}), "steam-dlc-hint")), ft(e, t));
		}
		for (let n of e.warnings || []) typeof n == "string" && t.append(G("p", n, "steam-dlc-hint"));
		return e.status !== "needs_selection";
	}, mt = (e, t) => {
		let r = pt(e, t);
		if (!r) return !1;
		try {
			if (!Array.isArray(e.images) || e.images.length > 8 || !["ready", "none"].includes(e.image_state) || e.image_state === "ready" != !!e.images.length || e.images.reduce((e, t) => e + (typeof t?.base64 == "string" ? t.base64.length : Infinity), 0) > 22369656) throw Error("invalid_images");
			let r = e.images.map((e) => {
				if (e?.media_type !== "image/png") throw Error("invalid_images");
				return oe(e.base64, n.defaultView, s);
			});
			if (r.reduce((e, t) => e + t.length, 0) > 16777216) throw Error("invalid_images");
			for (let [e, i] of r.entries()) {
				let r = n.defaultView.URL.createObjectURL(new n.defaultView.Blob([i], { type: "image/png" }));
				_e.push(r);
				let a = G("figure", void 0, "steam-dlc-preview"), c = G("img");
				c.src = r, o.bind(c, () => s("query.profileCardAlt", { index: e + 1 }), "alt"), a.append(c), t.append(a);
			}
			r.length || t.append(G("p", () => s("query.noProfileCardWasReturnedText"), "steam-dlc-hint"));
		} catch {
			ut(), t.querySelectorAll("figure.steam-dlc-preview").forEach((e) => e.remove()), t.append(G("p", () => s("query.theProfileCardImageCouldNot"), "steam-dlc-hint"));
		}
		return r;
	}, ht = () => {
		let e = v(q, {
			...t,
			copy: o
		}, {
			id: "query",
			legacyLabel: () => s("query.search"),
			className: "steam-dlc-public-form"
		}), { body: n, actions: r } = e, i = G("section", void 0, "steam-dlc-public-result");
		i.setAttribute("aria-live", "polite");
		let c = t.presentation?.grid(n) || n, l = dt(c, "account", () => s("query.playerAccountSteamid645eDomain"));
		l.required = !0;
		let u, d, f, p, m, h;
		u = dt(c, "action", () => s("query.searchType"), [
			"profile",
			"recent",
			"stats",
			"last",
			"match"
		], "profile"), d = dt(c, "platform", () => s("query.source"), [
			"perfect",
			"official",
			"5e"
		], "perfect"), p = dt(c, "season", () => s("query.seasonOptional")), f = dt(c, "limit", () => s("query.recentMatchesToShow"), null, "5"), f.type = "number", f.min = "1", f.max = "20", f.step = "1", m = dt(c, "match_id", () => s("query.sourceMatchId")), h = dt(c, "focus", () => s("query.matchFocusAccountOptional"));
		let g = () => {
			p.disabled = !["profile", "stats"].includes(u.value), f.disabled = u.value !== "recent", m.disabled = u.value !== "match", h.disabled = u.value !== "match", m.required = u.value === "match";
		};
		K(u, "change", g), g(), q.append(G("p", () => s("query.webLookupsAlwaysRequireAnExplicit"), "steam-dlc-hint")), a || q.append(G("h3", () => s("section.queryCriteria"))), n.append(r);
		let _ = null, y = 0, b = G("div", void 0, "steam-dlc-actions");
		b.hidden = !0;
		let x = G("button", () => s("query.retryCardPreview"), "ui-button");
		x.type = "button", x.dataset.action = "query-preview-retry";
		let S = G("button", () => s("query.searchForTextDetailsOnly"), "ui-button");
		S.type = "button", S.dataset.action = "query-text-only", b.append(x, S);
		let ee = () => {
			y += 1, _ = null, b.hidden = !0;
		};
		K(n, "input", ee), K(n, "change", ee);
		let C = () => {
			e.sync(!Y(), j);
			for (let e of [
				...r.querySelectorAll("button"),
				x,
				S
			]) e.setAttribute("aria-disabled", String(!Y() || j));
			for (let e of n.querySelectorAll("input,select")) e.disabled = !Y();
			Y() && g();
		}, w = () => {
			ee(), j = !1, B += 1, ut(), i.replaceChildren(), C();
		};
		he = w, ge = w;
		let T = async (e, r = "normal") => {
			if (!Y() || j) return;
			let a = r !== "normal";
			if (a && (!_ || _.formRevision !== y)) return;
			let o = a ? { ..._.parameters } : e ? {} : { account: l.value.trim() };
			if (!e && !a && (!o.account || ![...n.querySelectorAll("input,select")].every((e) => e.checkValidity()))) {
				X(() => s("query.enterAnExplicitAccountAndCheck"), "error");
				return;
			}
			!e && !a && (Object.assign(o, {
				action: u.value,
				platform: d.value
			}), !p.disabled && p.value.trim() && (o.season = p.value.trim()), f.disabled || (o.limit = Number(f.value)), m.disabled || (o.match_id = m.value.trim()), !h.disabled && h.value.trim() && (o.focus = h.value.trim()));
			let c = o.action === "profile" && r !== "text", g = y, v = ++B;
			j = !0, b.hidden = !0, ut(), i.replaceChildren(G("p", () => s("query.queryingTheSource"))), Q(), C();
			try {
				let e = await t.services[c ? "preview" : "invoke"]("query", o);
				if (!Y() || v !== B) return;
				if (c && e?.status === "error") {
					let t = (/* @__PURE__ */ new Map([
						["auth_required", () => s("query.error.authRequired")],
						["auth_expired", () => s("query.error.authExpired")],
						["rate_limited", () => s("query.error.rateLimited")],
						["parameter_error", () => s("query.error.invalidParameters")],
						["not_public", () => s("query.error.notPublic")],
						["not_found", () => s("query.error.notFound")],
						["no_records", () => s("query.error.noRecords")],
						["unparsed", () => s("query.error.unparsed")],
						["upstream_error", () => s("query.error.upstreamUnavailable")]
					])).get(e.schema_version === 1 ? e.error?.code : null);
					if (!t) throw Error("preview_unavailable");
					_ = null, i.replaceChildren(G("p", t, "steam-dlc-field-error")), X(() => s("query.theLookupDidNotFinishFollow"), "warning");
					return;
				}
				let n = c ? mt(e, i) : pt(e, i);
				_ = null, e.status === "needs_selection" ? X(() => s("query.aSelectionIsRequiredFollowThe"), "warning") : X(n ? () => s("query.sourceResultsUpdated") : () => s("query.theLookupDidNotFinishCheck"), n ? "success" : "warning");
			} catch (e) {
				if (!Y() || v !== B) return;
				if (ut(), te.has(E(e))) {
					w(), Le(), Q(), ve.forEach((e) => {
						e.value = "";
					}), C(), X(() => s("query.pageAuthorizationOrRuntimeContextChanged"), "error");
					return;
				}
				let t = c && g === y;
				_ = t ? {
					parameters: { ...o },
					formRevision: g
				} : null, b.hidden = !t, i.replaceChildren(G("p", () => s(t ? "query.cardPreviewDidNotFinishNo" : "query.theRequestDidNotFinishOr"), "steam-dlc-field-error")), X(() => s("query.noVerifiedResultWasObtained"), "error");
			} finally {
				J() && v === B && (j = !1, Q(), C());
			}
		};
		K(x, "click", () => {
			T(!1, "preview");
		}), K(S, "click", () => {
			T(!1, "text");
		}), we.push(e.bind(() => T(!1)));
		let D = G("button", () => s("status.refreshSourceStatus"), "ui-button");
		D.type = "button", D.dataset.action = "query-status", K(D, "click", () => {
			T(!0);
		}), r.append(D), q.append(n), e.result(b, G("h3", () => s("status.searchResults")), i), t.presentation?.actions(r), T(!0);
	};
	if (p && t.routeId === "home") {
		{
			let e = G("section", void 0, "steam-dlc-source-panel");
			q.append(G("h3", () => s("status.sourceStatus")));
			let n = G("button", () => s("status.refreshSourceStatus"), "ui-button");
			n.type = "button", n.dataset.action = "refresh-status";
			let r = async () => {
				if (!Y() || j) return;
				let r = ++B;
				j = !0, Q(), n.setAttribute("aria-disabled", "true");
				try {
					let n = await t.services.invoke("status", {});
					if (!Y() || r !== B) return;
					pt(n, e);
				} catch {
					Y() && r === B && e.replaceChildren(G("p", () => s("status.couldNotReadSourceStatusRefresh"), "steam-dlc-field-error"));
				} finally {
					J() && r === B && (j = !1, n.setAttribute("aria-disabled", String(!Y())), Q());
				}
			};
			a ? (a.bind("refresh", r, { label: () => s("status.refreshSourceStatus") }), q.append(e)) : (K(n, "click", () => {
				r();
			}), q.append(e, n)), r();
		}
		let e = G("details", void 0, "steam-dlc-disclosure");
		e.append(G("summary", () => s("help.commandHelp")));
		let n = G("dl", void 0, "steam-dlc-help");
		for (let [e, [t]] of p.commands.entries()) {
			let r = G("dt");
			r.append(G("code", t)), n.append(r, G("dd", () => x(s)[i].commands[e][1]));
		}
		e.append(n), q.append(e);
	} else if (p && t.routeId === "settings") {
		let e = () => {
			Y() && !j && N && (U.size && (Se += 1), U.clear(), Ge(), X(() => s("settings.moduleChangesDiscarded"), "success"), Q());
		};
		if (a) Z = G("div"), q.append(Z), a.bind("save", Ze, {
			type: "submit",
			disabled: !0
		}), a.bind("refresh", () => Ye(!0), {}), a.bind("discard", e, {});
		else {
			Z = G("form"), K(Z, "submit", (e) => {
				e.preventDefault(), Ze();
			});
			let n = G("div", void 0, "steam-dlc-actions");
			Me = G("button", () => s("settings.saveChanges")), Me.className = "ui-button", Me.dataset.variant = "primary", Me.type = "submit", Me.dataset.action = "save", Ne = G("button", () => s("settings.refreshSettings")), Ne.className = "ui-button", Ne.type = "button", Ne.dataset.action = "refresh", Pe = G("button", () => s("settings.discardModuleChanges")), Pe.className = "ui-button", Pe.type = "button", Pe.dataset.action = "discard", K(Ne, "click", () => {
				Ye(!0);
			}), K(Pe, "click", e), n.append(Me, Ne, Pe), t.presentation?.actions(n), q.append(Z), Z.append(n);
		}
		q.append(G("p", () => s("settings.followCoreClearsTheModulesReply"), "steam-dlc-hint"));
	} else t.routeId === "query" ? ht(!1) : q.append(G("p", () => s("page.thisPageIsNotDeclaredReturn")));
	a || q.append(Ee);
	let gt = () => {
		ce || (ce = !0, A += 1, $e += 1, I += 1, B += 1, j = !1, ut(), ve.forEach((e) => {
			e.value = "";
		}), tt(), et(), R = null, F = null, P = !1, pe = !1, H !== null && (clearTimeout(H), H = null), U.clear(), N = null, we.splice(0).forEach((e) => e()), Ce(), L?.remove(), q.remove());
	};
	return t.scope.signal.addEventListener("abort", gt, { once: !0 }), we.push(() => t.scope.signal.removeEventListener("abort", gt)), Ce = t.scope.onDispose(gt), Q(), Z && Ye(), {
		update(e) {
			if (ce || de) return;
			let n = r.available, i = e.locale !== r.locale;
			r = { ...e }, T(r) !== f || !J() ? (he(), B += 1, ut(), ve.forEach((e) => {
				e.value = "";
			}), Le(), X(() => s("page.moduleRuntimeContextChangedOpenThe"), "error")) : n !== r.available && (ge(r.available), B += 1, ut(), I += 1, tt(), et(), R = null, P = !1, pe = !1, $e += 1, A += 1, j = !1, M = !1, X(() => s("page.pageAvailabilityChangedReviewTheRefreshed"))), Q(), i && (Ae(), N && J() && We(), t.copy || o.refresh());
		},
		dispose: gt,
		navigationImpact: De
	};
}
//#endregion
//#region packages/steam_dlc/steam/assets/steam.svg?raw
var fe = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\" fill=\"currentColor\" role=\"img\" aria-label=\"steam module\"><title>steam module</title><desc>Adapted monochrome mark from Valve artwork. Source: https://cdn.fastly.steamstatic.com/apps/csgo/images/csgo_react/global/steam_icon.svg. Valve retains its rights.</desc><g transform=\"translate(1.47059 0.00000) scale(2.94117647)\"><path d=\"M16.4728 0C7.7888 0 0.677759 6.69423 0 15.2043L8.85799 18.8685C9.60824 18.3539 10.5143 18.0567 11.4929 18.0567C11.5799 18.0567 11.6669 18.0603 11.7539 18.0639L15.6936 12.3483C15.6936 12.3229 15.6936 12.2939 15.6936 12.2685C15.6936 8.83262 18.4916 6.0346 21.9275 6.0346C25.3634 6.0346 28.1614 8.83262 28.1614 12.2685C28.1614 15.7044 25.3634 18.5025 21.9275 18.5025C21.8804 18.5025 21.8333 18.5025 21.7862 18.4988L16.1647 22.511C16.1684 22.5835 16.1684 22.6596 16.1684 22.7321C16.1684 25.3127 14.0699 27.4112 11.4893 27.4112C9.22405 27.4112 7.33213 25.7947 6.90082 23.6527L0.569028 21.0323C2.52982 27.9694 8.90511 33.058 16.4728 33.058C25.6026 33.058 33 25.657 33 16.5308C33 7.40099 25.599 0 16.4728 0Z\" fill=\"currentColor\" />\n<path d=\"M10.358 25.0806L8.32837 24.2434C8.68718 24.9936 9.31058 25.6206 10.1369 25.965C11.9238 26.708 13.9824 25.8599 14.729 24.073C15.0878 23.2068 15.0915 22.2536 14.7327 21.3874C14.3775 20.5211 13.7033 19.8434 12.8371 19.4846C11.9781 19.1258 11.0575 19.1403 10.2493 19.4447L12.3478 20.3109C13.6671 20.8618 14.2905 22.3732 13.7396 23.6925C13.1887 25.0045 11.6773 25.6279 10.358 25.0806Z\" fill=\"currentColor\" />\n<path d=\"M26.0813 12.2684C26.0813 9.9778 24.2183 8.11487 21.9277 8.11487C19.6371 8.11487 17.7742 9.9778 17.7742 12.2684C17.7742 14.559 19.6371 16.422 21.9277 16.422C24.2183 16.422 26.0813 14.559 26.0813 12.2684ZM18.8144 12.2612C18.8144 10.5396 20.2134 9.14057 21.935 9.14057C23.6565 9.14057 25.0556 10.536 25.0556 12.2612C25.0556 13.9827 23.6602 15.3818 21.935 15.3818C20.2098 15.3818 18.8144 13.9864 18.8144 12.2612Z\" fill=\"currentColor\" />\n</g></svg>\n", A = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\" fill=\"currentColor\" role=\"img\" aria-label=\"dota2 module\"><title>dota2 module</title><desc>Adapted monochrome mark from Valve artwork. Source: https://cdn.steamstatic.com/apps/dota2/images/dota_react/global/dota2_logo_symbol.png. Valve retains its rights.</desc><g transform=\"translate(0.00000 3.32031) scale(0.39062500)\"><path fill-rule=\"evenodd\" d=\"M103.5,0 L104,-0.5 L104.5,0 L105,0.5 L106,0.5 L107,0.5 L107.5,1 L108,1.5 L109,1.5 L110,1.5 L111,1.5 L112,1.5 L113,1.5 L114,1.5 L115,1.5 L116,1.5 L117,1.5 L117.5,1 L118,0.5 L119,0.5 L119.5,0 L120,-0.5 L120.5,0 L121,0.5 L121.5,1 L122,1.5 L123,1.5 L124,1.5 L125,1.5 L126,1.5 L127,1.5 L128,1.5 L129,1.5 L130,1.5 L131,1.5 L132,1.5 L132.5,2 L133,2.5 L134,2.5 L134.5,3 L135,3.5 L135.5,4 L135,4.5 L134,4.5 L133,4.5 L132,4.5 L131,4.5 L130.5,5 L131,5.5 L132,5.5 L133,5.5 L134,5.5 L135,5.5 L135.5,5 L136,4.5 L137,4.5 L137.5,5 L138,5.5 L139,5.5 L139.5,6 L139.5,7 L140,7.5 L140.5,8 L141,8.5 L141.5,9 L141.5,10 L141.5,11 L141.5,12 L142,12.5 L143,12.5 L143.5,12 L144,11.5 L145,11.5 L146,11.5 L147,11.5 L148,11.5 L149,11.5 L150,11.5 L151,11.5 L152,11.5 L152.5,11 L152.5,10 L153,9.5 L153.5,9 L153.5,8 L153.5,7 L153.5,6 L153.5,5 L153.5,4 L154,3.5 L154.5,3 L155,2.5 L156,2.5 L157,2.5 L158,2.5 L159,2.5 L160,2.5 L161,2.5 L162,2.5 L163,2.5 L164,2.5 L165,2.5 L166,2.5 L167,2.5 L168,2.5 L169,2.5 L170,2.5 L171,2.5 L172,2.5 L173,2.5 L173.5,3 L174,3.5 L175,3.5 L176,3.5 L177,3.5 L178,3.5 L179,3.5 L180,3.5 L181,3.5 L182,3.5 L183,3.5 L184,3.5 L184.5,4 L185,4.5 L186,4.5 L187,4.5 L188,4.5 L189,4.5 L190,4.5 L191,4.5 L192,4.5 L193,4.5 L194,4.5 L195,4.5 L196,4.5 L196.5,5 L197,5.5 L197.5,5 L198,4.5 L198.5,4 L198.5,3 L198.5,2 L198.5,1 L199,0.5 L199.5,1 L199.5,2 L200,2.5 L200.5,3 L200.5,4 L201,4.5 L201.5,5 L202,5.5 L203,5.5 L204,5.5 L204.5,5 L205,4.5 L205.5,4 L206,3.5 L207,3.5 L207.5,4 L208,4.5 L209,4.5 L209.5,5 L210,5.5 L211,5.5 L212,5.5 L212.5,6 L213,6.5 L214,6.5 L215,6.5 L216,6.5 L216.5,6 L217,5.5 L217.5,5 L218,4.5 L219,4.5 L219.5,5 L220,5.5 L221,5.5 L222,5.5 L223,5.5 L224,5.5 L225,5.5 L226,5.5 L226.5,6 L226.5,7 L227,7.5 L227.5,8 L228,8.5 L229,8.5 L229.5,9 L230,9.5 L231,9.5 L232,9.5 L232.5,10 L233,10.5 L233.5,11 L233.5,12 L233.5,13 L233.5,14 L233.5,15 L233.5,16 L233.5,17 L234,17.5 L234.5,18 L234.5,19 L234,19.5 L233.5,20 L233.5,21 L233.5,22 L233,22.5 L232.5,23 L232.5,24 L232.5,25 L232.5,26 L232.5,27 L232.5,28 L233,28.5 L233.5,29 L233.5,30 L233.5,31 L233.5,32 L233.5,33 L233.5,34 L233.5,35 L234,35.5 L234.5,36 L234.5,37 L234.5,38 L234.5,39 L234.5,40 L234.5,41 L234.5,42 L234.5,43 L234.5,44 L234.5,45 L234.5,46 L234.5,47 L234.5,48 L234.5,49 L234.5,50 L234.5,51 L234.5,52 L234.5,53 L234.5,54 L234.5,55 L234.5,56 L234.5,57 L234.5,58 L234.5,59 L234.5,60 L234.5,61 L234.5,62 L234.5,63 L234.5,64 L234.5,65 L234.5,66 L234.5,67 L234.5,68 L234.5,69 L234.5,70 L234.5,71 L234.5,72 L234.5,73 L234,73.5 L233.5,74 L233.5,75 L233.5,76 L233.5,77 L233.5,78 L233.5,79 L233.5,80 L233.5,81 L233.5,82 L233,82.5 L232,82.5 L231,82.5 L230,82.5 L229,82.5 L228,82.5 L227,82.5 L226.5,83 L226.5,84 L227,84.5 L227.5,85 L227.5,86 L227.5,87 L228,87.5 L228.5,88 L228.5,89 L228.5,90 L228,90.5 L227,90.5 L226.5,91 L226,91.5 L225.5,92 L225.5,93 L225,93.5 L224.5,94 L224.5,95 L224.5,96 L225,96.5 L225.5,97 L225.5,98 L226,98.5 L227,98.5 L228,98.5 L228.5,99 L228,99.5 L227.5,100 L227.5,101 L228,101.5 L228.5,102 L229,102.5 L229.5,103 L230,103.5 L230.5,104 L230.5,105 L230.5,106 L230.5,107 L230.5,108 L230.5,109 L230.5,110 L230.5,111 L231,111.5 L231.5,112 L232,112.5 L232.5,113 L232.5,114 L232.5,115 L232,115.5 L231.5,116 L231.5,117 L231.5,118 L231.5,119 L231.5,120 L231.5,121 L231.5,122 L232,122.5 L232.5,123 L232,123.5 L231.5,124 L231,124.5 L230.5,125 L230.5,126 L230.5,127 L230.5,128 L230.5,129 L230.5,130 L230.5,131 L230.5,132 L230.5,133 L230,133.5 L229,133.5 L228.5,133 L228,132.5 L227.5,133 L227,133.5 L226.5,134 L227,134.5 L227.5,135 L228,135.5 L229,135.5 L230,135.5 L231,135.5 L232,135.5 L233,135.5 L234,135.5 L234.5,136 L234.5,137 L234.5,138 L234.5,139 L234.5,140 L234.5,141 L234.5,142 L234.5,143 L234.5,144 L234.5,145 L234.5,146 L234.5,147 L234.5,148 L234.5,149 L234.5,150 L234.5,151 L234.5,152 L234.5,153 L234.5,154 L234.5,155 L234.5,156 L234.5,157 L234.5,158 L234.5,159 L234.5,160 L234.5,161 L234.5,162 L234.5,163 L234.5,164 L234.5,165 L234.5,166 L234.5,167 L234.5,168 L234.5,169 L234.5,170 L234.5,171 L234.5,172 L234.5,173 L234.5,174 L234.5,175 L234.5,176 L234.5,177 L234.5,178 L234.5,179 L234.5,180 L234.5,181 L234.5,182 L234.5,183 L234.5,184 L234.5,185 L234.5,186 L234.5,187 L234.5,188 L234.5,189 L234.5,190 L234.5,191 L234.5,192 L234.5,193 L234.5,194 L234.5,195 L234.5,196 L234.5,197 L234.5,198 L234.5,199 L234.5,200 L234.5,201 L234.5,202 L234.5,203 L234.5,204 L234.5,205 L234.5,206 L234.5,207 L234.5,208 L234.5,209 L234.5,210 L234.5,211 L234.5,212 L234.5,213 L234.5,214 L234.5,215 L234.5,216 L234.5,217 L234.5,218 L234.5,219 L234.5,220 L234.5,221 L234.5,222 L234.5,223 L234.5,224 L234.5,225 L234.5,226 L234.5,227 L234.5,228 L234.5,229 L234.5,230 L234.5,231 L234,231.5 L233,231.5 L232,231.5 L231.5,231 L231,230.5 L230,230.5 L229.5,230 L229,229.5 L228,229.5 L227.5,229 L227,228.5 L226,228.5 L225.5,228 L225,227.5 L224,227.5 L223,227.5 L222.5,227 L222,226.5 L221,226.5 L220,226.5 L219,226.5 L218.5,226 L218,225.5 L217,225.5 L216,225.5 L215,225.5 L214,225.5 L213.5,226 L213,226.5 L212,226.5 L211,226.5 L210,226.5 L209.5,227 L209,227.5 L208.5,228 L209,228.5 L210,228.5 L211,228.5 L212,228.5 L213,228.5 L214,228.5 L215,228.5 L216,228.5 L216.5,229 L216.5,230 L216,230.5 L215,230.5 L214,230.5 L213,230.5 L212.5,231 L212,231.5 L211,231.5 L210.5,231 L210,230.5 L209.5,231 L209,231.5 L208.5,232 L208,232.5 L207,232.5 L206,232.5 L205.5,233 L205,233.5 L204,233.5 L203,233.5 L202,233.5 L201,233.5 L200,233.5 L199,233.5 L198,233.5 L197,233.5 L196,233.5 L195.5,233 L195,232.5 L194,232.5 L193,232.5 L192.5,232 L192,231.5 L191,231.5 L190.5,231 L190,230.5 L189,230.5 L188.5,231 L188,231.5 L187,231.5 L186,231.5 L185,231.5 L184,231.5 L183,231.5 L182,231.5 L181,231.5 L180.5,231 L180,230.5 L179.5,230 L179,229.5 L178,229.5 L177,229.5 L176,229.5 L175.5,230 L175,230.5 L174.5,231 L174,231.5 L173,231.5 L172,231.5 L171,231.5 L170,231.5 L169,231.5 L168,231.5 L167.5,232 L167,232.5 L166,232.5 L165,232.5 L164,232.5 L163.5,233 L163,233.5 L162,233.5 L161,233.5 L160.5,233 L160.5,232 L160,231.5 L159.5,232 L159.5,233 L159.5,234 L159,234.5 L158,234.5 L157,234.5 L156.5,234 L157,233.5 L157.5,233 L157.5,232 L157.5,231 L157,230.5 L156,230.5 L155.5,231 L155,231.5 L154,231.5 L153.5,232 L154,232.5 L155,232.5 L156,232.5 L156.5,233 L156,233.5 L155.5,234 L155.5,235 L155,235.5 L154,235.5 L153.5,236 L153,236.5 L152,236.5 L151,236.5 L150,236.5 L149,236.5 L148,236.5 L147,236.5 L146.5,236 L147,235.5 L148,235.5 L149,235.5 L150,235.5 L151,235.5 L151.5,235 L152,234.5 L152.5,234 L152,233.5 L151.5,233 L151,232.5 L150.5,233 L150,233.5 L149,233.5 L148,233.5 L147,233.5 L146,233.5 L145,233.5 L144,233.5 L143,233.5 L142,233.5 L141,233.5 L140,233.5 L139,233.5 L138,233.5 L137,233.5 L136,233.5 L135,233.5 L134,233.5 L133,233.5 L132,233.5 L131.5,234 L131,234.5 L130,234.5 L129.5,235 L130,235.5 L130.5,236 L130,236.5 L129,236.5 L128,236.5 L127,236.5 L126.5,237 L126,237.5 L125,237.5 L124,237.5 L123,237.5 L122.5,237 L122,236.5 L121.5,236 L121,235.5 L120.5,235 L120,234.5 L119.5,235 L119,235.5 L118.5,236 L118,236.5 L117,236.5 L116.5,236 L116,235.5 L115,235.5 L114.5,235 L114,234.5 L113,234.5 L112.5,234 L112,233.5 L111,233.5 L110,233.5 L109,233.5 L108,233.5 L107,233.5 L106.5,234 L106,234.5 L105,234.5 L104,234.5 L103.5,235 L104,235.5 L104.5,236 L104.5,237 L104,237.5 L103,237.5 L102,237.5 L101.5,238 L101,238.5 L100,238.5 L99.5,238 L99.5,237 L99,236.5 L98.5,236 L98,235.5 L97.5,235 L97.5,234 L97,233.5 L96.5,233 L96,232.5 L95.5,232 L95,231.5 L94.5,231 L94.5,230 L94,229.5 L93,229.5 L92,229.5 L91.5,230 L91,230.5 L90,230.5 L89,230.5 L88,230.5 L87,230.5 L86,230.5 L85,230.5 L84.5,230 L84,229.5 L83,229.5 L82.5,229 L82,228.5 L81.5,229 L81,229.5 L80.5,230 L80,230.5 L79,230.5 L78.5,230 L78,229.5 L77.5,229 L77,228.5 L76.5,228 L76.5,227 L76,226.5 L75.5,226 L75,225.5 L74.5,226 L74,226.5 L73.5,227 L73.5,228 L73.5,229 L73,229.5 L72.5,229 L72,228.5 L71.5,228 L71.5,227 L71.5,226 L71,225.5 L70.5,226 L70,226.5 L69.5,227 L69,227.5 L68.5,228 L68.5,229 L68,229.5 L67.5,229 L67,228.5 L66,228.5 L65,228.5 L64.5,229 L64.5,230 L64,230.5 L63.5,230 L63.5,229 L63,228.5 L62,228.5 L61,228.5 L60.5,229 L60,229.5 L59,229.5 L58.5,230 L58,230.5 L57.5,230 L57.5,229 L57,228.5 L56.5,228 L56.5,227 L56,226.5 L55.5,227 L55.5,228 L55,228.5 L54,228.5 L53,228.5 L52.5,228 L52,227.5 L51,227.5 L50.5,228 L50,228.5 L49,228.5 L48,228.5 L47.5,229 L47,229.5 L46.5,230 L46,230.5 L45.5,230 L45,229.5 L44.5,229 L44.5,228 L44.5,227 L44.5,226 L44,225.5 L43,225.5 L42.5,226 L42,226.5 L41.5,227 L41.5,228 L41,228.5 L40,228.5 L39.5,228 L39.5,227 L39,226.5 L38.5,227 L38,227.5 L37.5,228 L37.5,229 L37,229.5 L36,229.5 L35.5,229 L35,228.5 L34,228.5 L33,228.5 L32,228.5 L31,228.5 L30,228.5 L29,228.5 L28,228.5 L27,228.5 L26,228.5 L25,228.5 L24.5,228 L24,227.5 L23.5,227 L23,226.5 L22.5,227 L22.5,228 L22.5,229 L22,229.5 L21,229.5 L20.5,229 L20,228.5 L19.5,229 L19,229.5 L18,229.5 L17,229.5 L16.5,230 L16,230.5 L15,230.5 L14.5,230 L14.5,229 L14,228.5 L13.5,229 L13.5,230 L13.5,231 L13,231.5 L12.5,231 L12.5,230 L12.5,229 L12,228.5 L11.5,228 L11,227.5 L10.5,228 L10,228.5 L9.5,229 L9.5,230 L9,230.5 L8,230.5 L7.5,230 L7.5,229 L7.5,228 L7.5,227 L7,226.5 L6,226.5 L5,226.5 L4,226.5 L3,226.5 L2,226.5 L1.5,226 L1,225.5 L0.5,225 L1,224.5 L1.5,224 L1.5,223 L1.5,222 L1.5,221 L2,220.5 L2.5,220 L2.5,219 L2.5,218 L2.5,217 L2.5,216 L2.5,215 L2.5,214 L2.5,213 L2.5,212 L2.5,211 L2.5,210 L2.5,209 L2.5,208 L2.5,207 L2.5,206 L2.5,205 L2.5,204 L2.5,203 L2.5,202 L2.5,201 L2.5,200 L2.5,199 L2,198.5 L1.5,198 L1.5,197 L1.5,196 L1.5,195 L1.5,194 L1.5,193 L1.5,192 L1.5,191 L1.5,190 L1.5,189 L1.5,188 L1.5,187 L2,186.5 L2.5,186 L2.5,185 L2.5,184 L2.5,183 L2.5,182 L2.5,181 L3,180.5 L3.5,180 L4,179.5 L5,179.5 L6,179.5 L7,179.5 L7.5,179 L7,178.5 L6.5,178 L6.5,177 L6.5,176 L6.5,175 L6.5,174 L6.5,173 L6.5,172 L7,171.5 L7.5,171 L7.5,170 L7.5,169 L7.5,168 L7.5,167 L7.5,166 L7.5,165 L7.5,164 L7.5,163 L7.5,162 L7.5,161 L7.5,160 L7.5,159 L7.5,158 L7.5,157 L7.5,156 L8,155.5 L8.5,155 L8.5,154 L8,153.5 L7,153.5 L6,153.5 L5,153.5 L4.5,153 L4,152.5 L3.5,152 L3,151.5 L2.5,151 L2.5,150 L2.5,149 L2.5,148 L2.5,147 L2.5,146 L2.5,145 L2.5,144 L2.5,143 L2.5,142 L2.5,141 L2.5,140 L2.5,139 L2.5,138 L2.5,137 L2.5,136 L2.5,135 L2.5,134 L2.5,133 L2.5,132 L2.5,131 L2.5,130 L2.5,129 L2.5,128 L2.5,127 L2.5,126 L2.5,125 L2.5,124 L2.5,123 L3,122.5 L3.5,123 L4,123.5 L4.5,124 L5,124.5 L5.5,124 L5.5,123 L5,122.5 L4.5,122 L4,121.5 L3.5,121 L3.5,120 L4,119.5 L4.5,120 L5,120.5 L5.5,121 L6,121.5 L7,121.5 L7.5,122 L8,122.5 L8.5,122 L8.5,121 L8.5,120 L8.5,119 L8.5,118 L8.5,117 L8.5,116 L8.5,115 L8.5,114 L8.5,113 L8,112.5 L7.5,112 L7,111.5 L6.5,111 L6,110.5 L5.5,110 L5,109.5 L4.5,109 L4.5,108 L4.5,107 L4,106.5 L3.5,106 L3.5,105 L3.5,104 L3.5,103 L3.5,102 L3.5,101 L3.5,100 L3.5,99 L4,98.5 L4.5,98 L4.5,97 L5,96.5 L5.5,96 L5.5,95 L5.5,94 L5,93.5 L4.5,93 L4.5,92 L4.5,91 L4.5,90 L4,89.5 L3.5,89 L3.5,88 L3.5,87 L3.5,86 L3.5,85 L3.5,84 L3,83.5 L2.5,83 L2.5,82 L2.5,81 L2.5,80 L2.5,79 L2.5,78 L2.5,77 L2,76.5 L1,76.5 L0.5,76 L0,75.5 L-0.5,75 L-0.5,74 L0,73.5 L1,73.5 L1.5,73 L1,72.5 L0,72.5 L-0.5,72 L-0.5,71 L0,70.5 L0.5,71 L1,71.5 L1.5,71 L1.5,70 L1.5,69 L1,68.5 L0.5,69 L0,69.5 L-0.5,69 L-0.5,68 L-0.5,67 L-0.5,66 L-0.5,65 L-0.5,64 L0,63.5 L1,63.5 L1.5,63 L1.5,62 L1,61.5 L0,61.5 L-0.5,61 L-0.5,60 L-0.5,59 L-0.5,58 L-0.5,57 L-0.5,56 L-0.5,55 L0,54.5 L1,54.5 L1.5,54 L1.5,53 L1.5,52 L1.5,51 L1.5,50 L1.5,49 L1.5,48 L2,47.5 L2.5,47 L2.5,46 L2.5,45 L2.5,44 L2.5,43 L2.5,42 L2.5,41 L2.5,40 L2.5,39 L2.5,38 L2.5,37 L2.5,36 L2.5,35 L2.5,34 L2.5,33 L2.5,32 L2.5,31 L2.5,30 L2.5,29 L2.5,28 L3,27.5 L3.5,27 L3.5,26 L3.5,25 L3.5,24 L3.5,23 L3.5,22 L3.5,21 L3.5,20 L3.5,19 L3,18.5 L2,18.5 L1.5,19 L1,19.5 L0,19.5 L-0.5,19 L-0.5,18 L-0.5,17 L-0.5,16 L-0.5,15 L-0.5,14 L-0.5,13 L-0.5,12 L-0.5,11 L-0.5,10 L-0.5,9 L0,8.5 L0.5,9 L0.5,10 L0.5,11 L0.5,12 L0.5,13 L1,13.5 L1.5,13 L2,12.5 L2.5,12 L2.5,11 L2.5,10 L2.5,9 L2.5,8 L2.5,7 L2.5,6 L3,5.5 L3.5,5 L4,4.5 L4.5,5 L5,5.5 L5.5,6 L6,6.5 L7,6.5 L8,6.5 L9,6.5 L10,6.5 L11,6.5 L12,6.5 L13,6.5 L14,6.5 L14.5,6 L15,5.5 L16,5.5 L16.5,5 L17,4.5 L18,4.5 L18.5,4 L19,3.5 L19.5,4 L20,4.5 L20.5,5 L21,5.5 L22,5.5 L23,5.5 L24,5.5 L25,5.5 L26,5.5 L27,5.5 L27.5,6 L28,6.5 L29,6.5 L29.5,6 L29.5,5 L30,4.5 L31,4.5 L31.5,5 L31.5,6 L32,6.5 L32.5,6 L33,5.5 L34,5.5 L35,5.5 L36,5.5 L36.5,6 L36.5,7 L37,7.5 L37.5,7 L38,6.5 L39,6.5 L40,6.5 L40.5,6 L41,5.5 L42,5.5 L42.5,6 L43,6.5 L44,6.5 L45,6.5 L46,6.5 L47,6.5 L48,6.5 L49,6.5 L49.5,6 L50,5.5 L51,5.5 L51.5,6 L52,6.5 L53,6.5 L54,6.5 L55,6.5 L56,6.5 L56.5,7 L57,7.5 L57.5,7 L58,6.5 L58.5,6 L58.5,5 L59,4.5 L59.5,5 L60,5.5 L60.5,6 L61,6.5 L61.5,7 L62,7.5 L63,7.5 L63.5,8 L64,8.5 L65,8.5 L66,8.5 L67,8.5 L68,8.5 L69,8.5 L70,8.5 L71,8.5 L72,8.5 L73,8.5 L74,8.5 L75,8.5 L76,8.5 L77,8.5 L78,8.5 L79,8.5 L80,8.5 L81,8.5 L82,8.5 L83,8.5 L83.5,9 L84,9.5 L85,9.5 L85.5,9 L86,8.5 L86.5,8 L86.5,7 L87,6.5 L88,6.5 L89,6.5 L90,6.5 L90.5,6 L91,5.5 L91.5,5 L92,4.5 L92.5,4 L92.5,3 L92.5,2 L93,1.5 L93.5,2 L94,2.5 L94.5,3 L95,3.5 L95.5,3 L95.5,2 L96,1.5 L97,1.5 L98,1.5 L99,1.5 L100,1.5 L101,1.5 L102,1.5 L102.5,1 L103,0.5 L103.5,0ZM137.5,0 L138,-0.5 L138.5,0 L138.5,1 L138,1.5 L137.5,1 L137.5,0ZM140.5,1 L141,0.5 L142,0.5 L143,0.5 L144,0.5 L145,0.5 L146,0.5 L147,0.5 L147.5,1 L147.5,2 L147,2.5 L146.5,3 L146.5,4 L146.5,5 L146.5,6 L146.5,7 L146,7.5 L145.5,7 L145,6.5 L144.5,6 L144,5.5 L143.5,5 L143.5,4 L143,3.5 L142.5,3 L142,2.5 L141.5,2 L141,1.5 L140.5,1ZM100,3.5 L99.5,4 L99.5,5 L100,5.5 L101,5.5 L101.5,5 L101.5,4 L101,3.5 L100,3.5ZM108,3.5 L107.5,4 L108,4.5 L108.5,4 L108,3.5ZM113,3.5 L112.5,4 L112.5,5 L113,5.5 L114,5.5 L115,5.5 L115.5,5 L115.5,4 L115,3.5 L114,3.5 L113,3.5ZM125,4.5 L124.5,5 L125,5.5 L125.5,5 L125,4.5ZM128,4.5 L127.5,5 L128,5.5 L128.5,5 L128,4.5ZM160,5.5 L159.5,6 L160,6.5 L160.5,6 L160,5.5ZM169,5.5 L168.5,6 L169,6.5 L169.5,6 L169,5.5ZM179,5.5 L178.5,6 L178.5,7 L179,7.5 L179.5,7 L179.5,6 L179,5.5ZM183,5.5 L182.5,6 L182,6.5 L181.5,7 L181.5,8 L182,8.5 L182.5,8 L183,7.5 L183.5,7 L183.5,6 L183,5.5ZM-0.5,7 L0,6.5 L1,6.5 L1.5,7 L1,7.5 L0,7.5 L-0.5,7ZM187,6.5 L186.5,7 L187,7.5 L188,7.5 L189,7.5 L190,7.5 L191,7.5 L191.5,7 L191,6.5 L190,6.5 L189,6.5 L188,6.5 L187,6.5ZM22,7.5 L21.5,8 L21.5,9 L22,9.5 L23,9.5 L23.5,9 L23.5,8 L23,7.5 L22,7.5ZM115,7.5 L114.5,8 L115,8.5 L115.5,8 L115,7.5ZM202,7.5 L201.5,8 L202,8.5 L203,8.5 L203.5,8 L203,7.5 L202,7.5ZM15,8.5 L14.5,9 L15,9.5 L16,9.5 L16.5,9 L16,8.5 L15,8.5ZM38,8.5 L37.5,9 L37,9.5 L36.5,10 L37,10.5 L38,10.5 L38.5,10 L38.5,9 L38,8.5ZM47,8.5 L46.5,9 L46.5,10 L47,10.5 L47.5,10 L47.5,9 L47,8.5ZM66,9.5 L65.5,10 L66,10.5 L66.5,10 L66,9.5ZM78,10.5 L77.5,11 L78,11.5 L78.5,11 L78,10.5ZM92,10.5 L91.5,11 L92,11.5 L92.5,11 L92,10.5ZM78,14.5 L77.5,15 L78,15.5 L78.5,15 L78,14.5ZM231,14.5 L230.5,15 L231,15.5 L231.5,15 L231,14.5ZM0.5,23 L1,22.5 L1.5,23 L1.5,24 L1,24.5 L0.5,25 L0,25.5 L-0.5,25 L-0.5,24 L0,23.5 L0.5,23ZM-0.5,29 L0,28.5 L0.5,29 L0,29.5 L-0.5,29ZM-0.5,31 L0,30.5 L0.5,31 L0,31.5 L-0.5,31ZM-0.5,34 L0,33.5 L0.5,34 L0.5,35 L0.5,36 L0.5,37 L0.5,38 L0.5,39 L0.5,40 L0.5,41 L0.5,42 L0.5,43 L0.5,44 L0.5,45 L0,45.5 L-0.5,45 L-0.5,44 L-0.5,43 L-0.5,42 L-0.5,41 L-0.5,40 L-0.5,39 L-0.5,38 L-0.5,37 L-0.5,36 L-0.5,35 L-0.5,34ZM38,42.5 L37.5,43 L37,43.5 L36,43.5 L35,43.5 L34.5,44 L34,44.5 L33,44.5 L32,44.5 L31.5,45 L31,45.5 L30,45.5 L29.5,46 L29,46.5 L28,46.5 L27,46.5 L26.5,47 L26.5,48 L27,48.5 L27.5,49 L28,49.5 L28.5,50 L29,50.5 L29.5,51 L30,51.5 L30.5,52 L31,52.5 L31.5,53 L32,53.5 L32.5,54 L32.5,55 L33,55.5 L33.5,56 L34,56.5 L34.5,57 L35,57.5 L35.5,58 L36,58.5 L36.5,59 L37,59.5 L37.5,60 L38,60.5 L38.5,61 L39,61.5 L39.5,62 L40,62.5 L40.5,63 L41,63.5 L41.5,64 L42,64.5 L42.5,65 L43,65.5 L43.5,66 L44,66.5 L44.5,67 L45,67.5 L45.5,68 L46,68.5 L46.5,69 L47,69.5 L47.5,70 L48,70.5 L48.5,71 L49,71.5 L49.5,72 L50,72.5 L50.5,73 L51,73.5 L51.5,74 L51.5,75 L52,75.5 L52.5,76 L53,76.5 L53.5,77 L54,77.5 L54.5,78 L55,78.5 L55.5,79 L56,79.5 L56.5,80 L57,80.5 L57.5,81 L58,81.5 L58.5,82 L59,82.5 L59.5,83 L60,83.5 L60.5,84 L61,84.5 L61.5,85 L62,85.5 L62.5,86 L63,86.5 L63.5,87 L64,87.5 L64.5,88 L65,88.5 L65.5,89 L66,89.5 L66.5,90 L67,90.5 L67.5,91 L68,91.5 L68.5,92 L69,92.5 L69.5,93 L69.5,94 L70,94.5 L70.5,95 L71,95.5 L71.5,96 L72,96.5 L72.5,97 L73,97.5 L73.5,98 L74,98.5 L74.5,99 L75,99.5 L75.5,100 L76,100.5 L76.5,101 L77,101.5 L77.5,102 L78,102.5 L78.5,103 L79,103.5 L79.5,104 L80,104.5 L80.5,105 L81,105.5 L81.5,106 L82,106.5 L82.5,107 L83,107.5 L83.5,108 L84,108.5 L85,108.5 L85.5,109 L86,109.5 L87,109.5 L87.5,110 L87,110.5 L86.5,111 L87,111.5 L87.5,112 L88,112.5 L88.5,113 L88.5,114 L89,114.5 L89.5,115 L90,115.5 L90.5,116 L91,116.5 L91.5,117 L92,117.5 L93,117.5 L93.5,118 L93.5,119 L94,119.5 L94.5,120 L95,120.5 L95.5,121 L96,121.5 L96.5,122 L97,122.5 L97.5,123 L98,123.5 L98.5,124 L99,124.5 L99.5,125 L100,125.5 L100.5,126 L101,126.5 L101.5,127 L102,127.5 L102.5,128 L103,128.5 L103.5,129 L104,129.5 L104.5,130 L105,130.5 L105.5,131 L106,131.5 L106.5,132 L106.5,133 L107,133.5 L107.5,134 L108,134.5 L108.5,135 L109,135.5 L109.5,135 L109.5,134 L110,133.5 L110.5,134 L110.5,135 L111,135.5 L111.5,136 L111.5,137 L112,137.5 L112.5,138 L113,138.5 L113.5,139 L113.5,140 L114,140.5 L114.5,141 L115,141.5 L115.5,142 L116,142.5 L116.5,143 L117,143.5 L117.5,144 L118,144.5 L118.5,145 L119,145.5 L119.5,146 L120,146.5 L120.5,147 L121,147.5 L121.5,147 L121.5,146 L122,145.5 L122.5,146 L123,146.5 L123.5,147 L123.5,148 L123.5,149 L123.5,150 L124,150.5 L124.5,151 L124.5,152 L125,152.5 L125.5,153 L126,153.5 L126.5,153 L127,152.5 L127.5,153 L128,153.5 L128.5,154 L129,154.5 L129.5,155 L129.5,156 L130,156.5 L131,156.5 L132,156.5 L132.5,157 L132.5,158 L132.5,159 L132.5,160 L133,160.5 L133.5,161 L134,161.5 L134.5,162 L135,162.5 L135.5,163 L136,163.5 L136.5,164 L137,164.5 L137.5,165 L138,165.5 L138.5,166 L139,166.5 L139.5,167 L140,167.5 L140.5,168 L141,168.5 L141.5,169 L142,169.5 L142.5,170 L142.5,171 L143,171.5 L143.5,172 L144,172.5 L144.5,173 L145,173.5 L145.5,174 L146,174.5 L146.5,175 L147,175.5 L147.5,176 L148,176.5 L148.5,177 L149,177.5 L149.5,178 L150,178.5 L150.5,179 L151,179.5 L151.5,180 L152,180.5 L152.5,181 L153,181.5 L153.5,182 L154,182.5 L154.5,183 L155,183.5 L155.5,184 L155.5,185 L156,185.5 L156.5,186 L157,186.5 L157.5,187 L158,187.5 L158.5,188 L159,188.5 L159.5,189 L160,189.5 L160.5,190 L161,190.5 L161.5,191 L162,191.5 L162.5,192 L163,192.5 L163.5,193 L164,193.5 L165,193.5 L165.5,194 L166,194.5 L167,194.5 L168,194.5 L169,194.5 L169.5,195 L170,195.5 L171,195.5 L172,195.5 L173,195.5 L174,195.5 L175,195.5 L176,195.5 L177,195.5 L178,195.5 L179,195.5 L179.5,196 L180,196.5 L181,196.5 L182,196.5 L183,196.5 L184,196.5 L185,196.5 L186,196.5 L187,196.5 L188,196.5 L189,196.5 L190,196.5 L190.5,196 L191,195.5 L192,195.5 L193,195.5 L193.5,195 L194,194.5 L194.5,194 L194.5,193 L195,192.5 L195.5,192 L195.5,191 L196,190.5 L196.5,190 L196.5,189 L197,188.5 L197.5,188 L197.5,187 L198,186.5 L198.5,186 L198.5,185 L199,184.5 L199.5,184 L199.5,183 L199.5,182 L200,181.5 L200.5,181 L200.5,180 L200.5,179 L201,178.5 L201.5,178 L201.5,177 L201.5,176 L202,175.5 L202.5,175 L202.5,174 L202.5,173 L203,172.5 L203.5,172 L203.5,171 L203.5,170 L204,169.5 L204.5,169 L204.5,168 L204.5,167 L205,166.5 L205.5,166 L205.5,165 L205.5,164 L205.5,163 L205.5,162 L206,161.5 L206.5,161 L206.5,160 L206.5,159 L206.5,158 L206.5,157 L207,156.5 L207.5,156 L207.5,155 L207.5,154 L207.5,153 L207.5,152 L207,151.5 L206.5,151 L206,150.5 L205.5,150 L205,149.5 L204.5,149 L204,148.5 L203,148.5 L202.5,148 L202,147.5 L201.5,147 L201,146.5 L200,146.5 L199.5,146 L199,145.5 L198.5,145 L198,144.5 L197,144.5 L196.5,144 L196,143.5 L195.5,143 L195,142.5 L194,142.5 L193.5,142 L193,141.5 L192.5,141 L192,140.5 L191.5,140 L191,139.5 L190,139.5 L189.5,139 L189,138.5 L188.5,138 L188,137.5 L187,137.5 L186.5,137 L186,136.5 L185.5,136 L185,135.5 L184,135.5 L183.5,135 L183,134.5 L182.5,134 L182,133.5 L181.5,134 L181.5,135 L181,135.5 L180.5,135 L180.5,134 L180.5,133 L180,132.5 L179.5,132 L179,131.5 L178,131.5 L177.5,131 L177,130.5 L176.5,130 L176,129.5 L175,129.5 L174.5,129 L174,128.5 L173.5,128 L173,127.5 L172,127.5 L171.5,127 L171,126.5 L170.5,126 L170,125.5 L169,125.5 L168.5,125 L168,124.5 L167.5,124 L167,123.5 L166,123.5 L165.5,123 L165,122.5 L164.5,122 L164,121.5 L163.5,121 L163,120.5 L162,120.5 L161.5,120 L161,119.5 L160.5,119 L160,118.5 L159,118.5 L158.5,118 L158,117.5 L157.5,117 L157,116.5 L156,116.5 L155.5,116 L155,115.5 L154.5,115 L154,114.5 L153,114.5 L152.5,114 L152,113.5 L151.5,113 L151,112.5 L150,112.5 L149.5,112 L149,111.5 L148.5,111 L148,110.5 L147,110.5 L146.5,110 L146,109.5 L145.5,109 L145,108.5 L144,108.5 L143.5,108 L143,107.5 L142.5,107 L142,106.5 L141,106.5 L140.5,106 L140,105.5 L139.5,105 L139,104.5 L138,104.5 L137.5,104 L137,103.5 L136.5,103 L136,102.5 L135,102.5 L134.5,102 L134,101.5 L133.5,101 L133,100.5 L132.5,100 L132,99.5 L131,99.5 L130.5,99 L130,98.5 L129.5,98 L129,97.5 L128,97.5 L127.5,97 L127,96.5 L126.5,96 L126,95.5 L125,95.5 L124.5,95 L124,94.5 L123.5,94 L123,93.5 L122,93.5 L121.5,93 L121,92.5 L120.5,92 L120,91.5 L119,91.5 L118.5,91 L118,90.5 L117.5,90 L117,89.5 L116,89.5 L115.5,89 L115,88.5 L114.5,88 L114,87.5 L113,87.5 L112.5,87 L112,86.5 L111.5,86 L111,85.5 L110,85.5 L109.5,85 L109,84.5 L108.5,84 L108,83.5 L107.5,83 L107,82.5 L106,82.5 L105.5,82 L105,81.5 L104.5,81 L104,80.5 L103,80.5 L102.5,80 L102,79.5 L101.5,79 L101,78.5 L100,78.5 L99.5,78 L99,77.5 L98.5,77 L98,76.5 L97,76.5 L96.5,76 L96,75.5 L95.5,75 L95,74.5 L94,74.5 L93.5,74 L93,73.5 L92.5,73 L92,72.5 L91,72.5 L90.5,72 L90,71.5 L89.5,71 L89,70.5 L88,70.5 L87.5,70 L87,69.5 L86.5,69 L86,68.5 L85,68.5 L84.5,68 L84,67.5 L83,67.5 L82,67.5 L81,67.5 L80.5,67 L80.5,66 L80,65.5 L79.5,65 L79,64.5 L78,64.5 L77,64.5 L76.5,64 L76,63.5 L75.5,64 L75,64.5 L74.5,64 L74.5,63 L74.5,62 L74,61.5 L73.5,61 L73,60.5 L72,60.5 L71.5,61 L71,61.5 L70.5,61 L70,60.5 L69.5,60 L69,59.5 L68.5,59 L69,58.5 L69.5,58 L69,57.5 L68.5,57 L68,56.5 L67.5,56 L67,55.5 L66,55.5 L65.5,55 L65,54.5 L64.5,54 L64,53.5 L63,53.5 L62.5,53 L62,52.5 L61.5,52 L61,51.5 L60,51.5 L59.5,51 L59,50.5 L58.5,50 L58,49.5 L57,49.5 L56.5,49 L56,48.5 L55.5,48 L55,47.5 L54,47.5 L53.5,47 L53,46.5 L52.5,46 L52,45.5 L51,45.5 L50.5,45 L50,44.5 L49.5,44 L49,43.5 L48,43.5 L47.5,43 L47,42.5 L46,42.5 L45,42.5 L44,42.5 L43,42.5 L42,42.5 L41,42.5 L40,42.5 L39,42.5 L38,42.5ZM171,43.5 L170.5,44 L170,44.5 L169,44.5 L168,44.5 L167.5,45 L167,45.5 L166,45.5 L165,45.5 L164,45.5 L163.5,46 L163,46.5 L162,46.5 L161,46.5 L160,46.5 L159.5,47 L159,47.5 L158,47.5 L157,47.5 L156,47.5 L155.5,48 L155,48.5 L154,48.5 L153,48.5 L152,48.5 L151.5,49 L151,49.5 L150,49.5 L149,49.5 L148,49.5 L147.5,50 L147,50.5 L146,50.5 L145,50.5 L144,50.5 L143.5,51 L143,51.5 L142,51.5 L141,51.5 L140,51.5 L139.5,52 L139.5,53 L140,53.5 L140.5,54 L141,54.5 L142,54.5 L142.5,55 L143,55.5 L143.5,56 L144,56.5 L144.5,57 L145,57.5 L146,57.5 L146.5,58 L147,58.5 L147.5,59 L148,59.5 L148.5,60 L149,60.5 L150,60.5 L150.5,61 L151,61.5 L151.5,62 L152,62.5 L152.5,63 L153,63.5 L153.5,64 L154,64.5 L155,64.5 L155.5,65 L156,65.5 L156.5,66 L157,66.5 L157.5,67 L158,67.5 L159,67.5 L159.5,68 L160,68.5 L160.5,69 L161,69.5 L161.5,70 L162,70.5 L162.5,71 L163,71.5 L164,71.5 L164.5,72 L165,72.5 L165.5,73 L166,73.5 L166.5,74 L167,74.5 L168,74.5 L168.5,75 L169,75.5 L169.5,76 L170,76.5 L170.5,77 L171,77.5 L172,77.5 L172.5,78 L173,78.5 L173.5,79 L174,79.5 L174.5,80 L175,80.5 L175.5,81 L176,81.5 L177,81.5 L177.5,82 L178,82.5 L178.5,82 L179,81.5 L180,81.5 L180.5,82 L180,82.5 L179.5,83 L179.5,84 L180,84.5 L181,84.5 L182,84.5 L182.5,85 L183,85.5 L184,85.5 L185,85.5 L185.5,85 L185.5,84 L185.5,83 L185.5,82 L186,81.5 L186.5,81 L186.5,80 L186.5,79 L186.5,78 L186.5,77 L187,76.5 L187.5,76 L187.5,75 L187.5,74 L187.5,73 L187.5,72 L187.5,71 L188,70.5 L188.5,70 L188.5,69 L188.5,68 L188.5,67 L188.5,66 L188.5,65 L189,64.5 L189.5,64 L189.5,63 L189.5,62 L189.5,61 L189.5,60 L190,59.5 L190.5,59 L190.5,58 L190.5,57 L190.5,56 L190.5,55 L190,54.5 L189,54.5 L188.5,54 L189,53.5 L190,53.5 L190.5,53 L190,52.5 L189.5,52 L189,51.5 L188.5,51 L188,50.5 L187.5,50 L187,49.5 L186.5,49 L186,48.5 L185,48.5 L184.5,48 L184,47.5 L183.5,47 L183,46.5 L182,46.5 L181.5,46 L181,45.5 L180,45.5 L179.5,45 L179,44.5 L178,44.5 L177.5,44 L177,43.5 L176,43.5 L175,43.5 L174,43.5 L173,43.5 L172,43.5 L171,43.5ZM-0.5,50 L0,49.5 L0.5,50 L0,50.5 L-0.5,50ZM-0.5,52 L0,51.5 L0.5,52 L0,52.5 L-0.5,52ZM187.5,55 L188,54.5 L188.5,55 L188.5,56 L188,56.5 L187.5,56 L187.5,55ZM1,57.5 L0.5,58 L1,58.5 L1.5,58 L1,57.5ZM71.5,62 L72,61.5 L72.5,62 L72,62.5 L71.5,62ZM-0.5,79 L0,78.5 L0.5,79 L1,79.5 L1.5,80 L1.5,81 L1.5,82 L1,82.5 L0.5,82 L0.5,81 L0,80.5 L-0.5,80 L-0.5,79ZM176.5,80 L177,79.5 L178,79.5 L178.5,80 L178.5,81 L178,81.5 L177.5,81 L177,80.5 L176.5,80ZM0.5,86 L1,85.5 L2,85.5 L2.5,86 L2,86.5 L1,86.5 L0.5,86ZM-0.5,88 L0,87.5 L0.5,88 L1,88.5 L1.5,89 L1.5,90 L1.5,91 L1.5,92 L1,92.5 L0,92.5 L-0.5,92 L-0.5,91 L-0.5,90 L-0.5,89 L-0.5,88ZM-0.5,96 L0,95.5 L1,95.5 L1.5,96 L1,96.5 L0.5,97 L0,97.5 L-0.5,97 L-0.5,96ZM-0.5,99 L0,98.5 L0.5,99 L0,99.5 L-0.5,99ZM0.5,108 L1,107.5 L1.5,108 L1.5,109 L1,109.5 L0.5,109 L0.5,108ZM87.5,111 L88,110.5 L88.5,111 L88,111.5 L87.5,111ZM-0.5,117 L0,116.5 L0.5,117 L0.5,118 L0.5,119 L0.5,120 L0,120.5 L-0.5,120 L-0.5,119 L-0.5,118 L-0.5,117ZM-0.5,124 L0,123.5 L1,123.5 L1.5,124 L1.5,125 L1,125.5 L0,125.5 L-0.5,125 L-0.5,124ZM176.5,136 L177,135.5 L178,135.5 L179,135.5 L179.5,136 L179,136.5 L178,136.5 L177,136.5 L176.5,136ZM181.5,136 L182,135.5 L183,135.5 L183.5,136 L184,136.5 L184.5,137 L184,137.5 L183,137.5 L182.5,137 L182,136.5 L181.5,136ZM117.5,141 L118,140.5 L118.5,141 L119,141.5 L119.5,142 L120,142.5 L120.5,143 L120.5,144 L120,144.5 L119.5,144 L119,143.5 L118.5,143 L118,142.5 L117.5,142 L117.5,141ZM44,143.5 L43.5,144 L43.5,145 L43.5,146 L43,146.5 L42.5,147 L42.5,148 L42,148.5 L41.5,149 L41.5,150 L41.5,151 L41,151.5 L40.5,152 L40.5,153 L40,153.5 L39.5,154 L39.5,155 L39,155.5 L38.5,156 L38.5,157 L38.5,158 L38,158.5 L37.5,159 L37.5,160 L37,160.5 L36.5,161 L36.5,162 L36,162.5 L35.5,163 L35.5,164 L35.5,165 L35,165.5 L34.5,166 L34.5,167 L34,167.5 L33.5,168 L33.5,169 L33.5,170 L33,170.5 L32.5,171 L32.5,172 L32,172.5 L31.5,173 L31.5,174 L31,174.5 L30.5,175 L30.5,176 L30.5,177 L30,177.5 L29.5,178 L29.5,179 L29.5,180 L29.5,181 L29.5,182 L29.5,183 L30,183.5 L30.5,184 L31,184.5 L31.5,185 L32,185.5 L33,185.5 L33.5,186 L34,186.5 L34.5,187 L35,187.5 L35.5,188 L36,188.5 L37,188.5 L37.5,189 L38,189.5 L38.5,190 L39,190.5 L39.5,191 L40,191.5 L41,191.5 L41.5,192 L42,192.5 L42.5,193 L43,193.5 L43.5,194 L44,194.5 L44.5,195 L45,195.5 L46,195.5 L46.5,196 L47,196.5 L47.5,197 L48,197.5 L49,197.5 L49.5,198 L50,198.5 L50.5,198 L51,197.5 L52,197.5 L53,197.5 L53.5,198 L53,198.5 L52.5,199 L53,199.5 L54,199.5 L55,199.5 L55.5,199 L56,198.5 L57,198.5 L57.5,199 L58,199.5 L59,199.5 L59.5,199 L60,198.5 L61,198.5 L62,198.5 L62.5,198 L63,197.5 L64,197.5 L65,197.5 L65.5,197 L66,196.5 L67,196.5 L68,196.5 L68.5,196 L69,195.5 L70,195.5 L71,195.5 L71.5,195 L72,194.5 L73,194.5 L74,194.5 L74.5,194 L75,193.5 L76,193.5 L77,193.5 L77.5,193 L78,192.5 L79,192.5 L80,192.5 L81,192.5 L81.5,192 L82,191.5 L83,191.5 L84,191.5 L84.5,191 L85,190.5 L86,190.5 L87,190.5 L87.5,190 L88,189.5 L89,189.5 L90,189.5 L90.5,189 L90.5,188 L90,187.5 L89.5,187 L89,186.5 L88.5,186 L88,185.5 L87.5,185 L87,184.5 L86.5,184 L86,183.5 L85.5,183 L85,182.5 L84.5,182 L84,181.5 L83.5,181 L83,180.5 L82.5,180 L82,179.5 L81.5,179 L81,178.5 L80.5,178 L80,177.5 L79.5,177 L79,176.5 L78.5,176 L78,175.5 L77.5,175 L77,174.5 L76.5,174 L76,173.5 L75.5,173 L75,172.5 L74.5,172 L74,171.5 L73.5,171 L73,170.5 L72.5,170 L72,169.5 L71.5,169 L71,168.5 L70.5,168 L70,167.5 L69.5,167 L69,166.5 L68.5,166 L68,165.5 L67.5,165 L67,164.5 L66.5,164 L66,163.5 L65.5,163 L65,162.5 L64.5,162 L64,161.5 L63.5,161 L63,160.5 L62.5,160 L62,159.5 L61.5,159 L61,158.5 L60.5,158 L60,157.5 L59.5,157 L59,156.5 L58.5,156 L58,155.5 L57,155.5 L56.5,155 L56,154.5 L55.5,154 L55,153.5 L54.5,153 L54,152.5 L53.5,152 L53,151.5 L52.5,151 L52,150.5 L51.5,150 L51,149.5 L50.5,149 L50,148.5 L49.5,148 L49,147.5 L48.5,147 L48,146.5 L47.5,146 L47,145.5 L46.5,145 L46,144.5 L45.5,144 L45,143.5 L44,143.5ZM3.5,177 L4,176.5 L4.5,177 L4.5,178 L4,178.5 L3.5,178 L3.5,177ZM50.5,195 L51,194.5 L51.5,195 L51,195.5 L50.5,195ZM51.5,196 L52,195.5 L52.5,196 L52,196.5 L51.5,196ZM248.5,223 L249,222.5 L250,222.5 L251,222.5 L251.5,223 L251,223.5 L250,223.5 L249,223.5 L248.5,223ZM246.5,224 L247,223.5 L248,223.5 L248.5,224 L248,224.5 L247,224.5 L246.5,224ZM251.5,224 L252,223.5 L253,223.5 L253.5,224 L253,224.5 L252,224.5 L251.5,224ZM245.5,225 L246,224.5 L246.5,225 L246.5,226 L246,226.5 L245.5,226 L245.5,225ZM253.5,225 L254,224.5 L254.5,225 L254.5,226 L254,226.5 L253.5,226 L253.5,225ZM248.5,226 L249,225.5 L249.5,226 L249.5,227 L250,227.5 L250.5,228 L250,228.5 L249.5,229 L249.5,230 L249,230.5 L248.5,230 L248.5,229 L248.5,228 L248.5,227 L248.5,226ZM250.5,226 L251,225.5 L251.5,226 L251.5,227 L251,227.5 L250.5,227 L250.5,226ZM33,226.5 L32.5,227 L33,227.5 L33.5,227 L33,226.5ZM244.5,227 L245,226.5 L245.5,227 L245.5,228 L245.5,229 L245,229.5 L244.5,229 L244.5,228 L244.5,227ZM254.5,227 L255,226.5 L255.5,227 L255.5,228 L255.5,229 L255,229.5 L254.5,229 L254.5,228 L254.5,227ZM92,227.5 L91.5,228 L92,228.5 L92.5,228 L92,227.5ZM245.5,230 L246,229.5 L246.5,230 L246.5,231 L246,231.5 L245.5,231 L245.5,230ZM250.5,230 L251,229.5 L251.5,230 L251,230.5 L250.5,230ZM253.5,230 L254,229.5 L254.5,230 L254.5,231 L254,231.5 L253.5,231 L253.5,230ZM246.5,232 L247,231.5 L248,231.5 L248.5,232 L248,232.5 L247,232.5 L246.5,232ZM251.5,232 L252,231.5 L253,231.5 L253.5,232 L253,232.5 L252,232.5 L251.5,232ZM248.5,233 L249,232.5 L250,232.5 L251,232.5 L251.5,233 L251,233.5 L250,233.5 L249,233.5 L248.5,233ZM125,233.5 L124.5,234 L124.5,235 L125,235.5 L126,235.5 L127,235.5 L128,235.5 L128.5,235 L128,234.5 L127.5,234 L127,233.5 L126,233.5 L125,233.5ZM108.5,236 L109,235.5 L110,235.5 L111,235.5 L112,235.5 L113,235.5 L113.5,236 L113,236.5 L112,236.5 L111,236.5 L110,236.5 L109,236.5 L108.5,236Z\" /></g></svg>\n", j = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\" fill=\"currentColor\" role=\"img\" aria-label=\"cs2 module\"><title>cs2 module</title><desc>Adapted monochrome mark from Valve artwork. Source: https://cdn.fastly.steamstatic.com/apps/csgo/images/csgo_react/global/cs2_icon_color_512x512.png. Valve retains its rights.</desc><g transform=\"translate(0.00000 0.00000) scale(0.39062500)\"><path fill-rule=\"evenodd\" d=\"M120.5,0 L121,-0.5 L122,-0.5 L123,-0.5 L124,-0.5 L125,-0.5 L126,-0.5 L127,-0.5 L128,-0.5 L129,-0.5 L130,-0.5 L131,-0.5 L132,-0.5 L133,-0.5 L134,-0.5 L135,-0.5 L136,-0.5 L137,-0.5 L137.5,0 L138,0.5 L139,0.5 L139.5,1 L140,1.5 L141,1.5 L141.5,2 L142,2.5 L143,2.5 L143.5,3 L144,3.5 L144.5,4 L145,4.5 L146,4.5 L146.5,5 L147,5.5 L147.5,6 L148,6.5 L148.5,7 L148.5,8 L149,8.5 L149.5,9 L150,9.5 L150.5,10 L150.5,11 L151,11.5 L151.5,12 L151.5,13 L152,13.5 L152.5,14 L152.5,15 L153,15.5 L153.5,16 L154,16.5 L155,16.5 L155.5,17 L155.5,18 L155.5,19 L155.5,20 L155,20.5 L154.5,21 L154.5,22 L154.5,23 L154.5,24 L154,24.5 L153.5,25 L153.5,26 L153.5,27 L153.5,28 L153,28.5 L152,28.5 L151,28.5 L150,28.5 L149,28.5 L148.5,29 L148.5,30 L148.5,31 L149,31.5 L150,31.5 L151,31.5 L152,31.5 L153,31.5 L154,31.5 L155,31.5 L156,31.5 L157,31.5 L158,31.5 L159,31.5 L160,31.5 L161,31.5 L162,31.5 L163,31.5 L164,31.5 L165,31.5 L166,31.5 L167,31.5 L168,31.5 L169,31.5 L170,31.5 L171,31.5 L172,31.5 L173,31.5 L174,31.5 L175,31.5 L176,31.5 L177,31.5 L178,31.5 L179,31.5 L180,31.5 L181,31.5 L182,31.5 L183,31.5 L184,31.5 L185,31.5 L186,31.5 L187,31.5 L188,31.5 L189,31.5 L190,31.5 L191,31.5 L192,31.5 L193,31.5 L194,31.5 L195,31.5 L196,31.5 L197,31.5 L198,31.5 L199,31.5 L200,31.5 L201,31.5 L202,31.5 L203,31.5 L204,31.5 L205,31.5 L206,31.5 L207,31.5 L208,31.5 L209,31.5 L210,31.5 L211,31.5 L212,31.5 L213,31.5 L214,31.5 L215,31.5 L216,31.5 L217,31.5 L218,31.5 L219,31.5 L219.5,31 L220,30.5 L220.5,30 L221,29.5 L221.5,29 L221.5,28 L222,27.5 L223,27.5 L223.5,28 L223.5,29 L223.5,30 L223.5,31 L223.5,32 L223.5,33 L224,33.5 L225,33.5 L226,33.5 L227,33.5 L228,33.5 L229,33.5 L230,33.5 L231,33.5 L232,33.5 L233,33.5 L234,33.5 L235,33.5 L236,33.5 L237,33.5 L238,33.5 L239,33.5 L239.5,34 L239.5,35 L239.5,36 L239.5,37 L239,37.5 L238,37.5 L237,37.5 L236,37.5 L235,37.5 L234,37.5 L233,37.5 L232,37.5 L231,37.5 L230,37.5 L229,37.5 L228,37.5 L227,37.5 L226,37.5 L225,37.5 L224,37.5 L223.5,38 L223.5,39 L223.5,40 L223.5,41 L223.5,42 L223.5,43 L223.5,44 L223.5,45 L223,45.5 L222,45.5 L221,45.5 L220,45.5 L219,45.5 L218,45.5 L217,45.5 L216,45.5 L215,45.5 L214,45.5 L213,45.5 L212,45.5 L211,45.5 L210,45.5 L209,45.5 L208,45.5 L207,45.5 L206,45.5 L205,45.5 L204,45.5 L203,45.5 L202,45.5 L201,45.5 L200,45.5 L199,45.5 L198,45.5 L197,45.5 L196,45.5 L195,45.5 L194,45.5 L193,45.5 L192,45.5 L191,45.5 L190,45.5 L189,45.5 L188,45.5 L187,45.5 L186,45.5 L185,45.5 L184,45.5 L183,45.5 L182.5,46 L182.5,47 L182,47.5 L181.5,48 L181.5,49 L181.5,50 L181.5,51 L181.5,52 L181,52.5 L180.5,53 L180.5,54 L180.5,55 L180,55.5 L179.5,56 L179,56.5 L178.5,57 L178.5,58 L179,58.5 L179.5,59 L179.5,60 L179.5,61 L179.5,62 L180,62.5 L180.5,63 L180.5,64 L180.5,65 L180.5,66 L180.5,67 L181,67.5 L181.5,68 L181.5,69 L181.5,70 L181.5,71 L182,71.5 L182.5,72 L182,72.5 L181.5,73 L181,73.5 L180,73.5 L179,73.5 L178,73.5 L177.5,74 L177,74.5 L176,74.5 L175,74.5 L174,74.5 L173,74.5 L172.5,75 L172,75.5 L171,75.5 L170,75.5 L169,75.5 L168.5,76 L168,76.5 L167.5,76 L167.5,75 L167,74.5 L166.5,74 L166.5,73 L166.5,72 L166.5,71 L166,70.5 L165.5,70 L165,69.5 L164.5,70 L164.5,71 L164,71.5 L163.5,72 L163.5,73 L163,73.5 L162.5,74 L162.5,75 L162.5,76 L162,76.5 L161.5,77 L161.5,78 L161,78.5 L160.5,79 L160.5,80 L160.5,81 L160,81.5 L159.5,82 L159,82.5 L158,82.5 L157.5,83 L157,83.5 L156,83.5 L155.5,84 L155,84.5 L154,84.5 L153,84.5 L152.5,85 L152,85.5 L151,85.5 L150,85.5 L149,85.5 L148,85.5 L147.5,85 L147,84.5 L146,84.5 L145.5,84 L145,83.5 L144,83.5 L143.5,83 L143,82.5 L142.5,82 L142,81.5 L141,81.5 L140.5,81 L140,80.5 L139,80.5 L138.5,80 L138,79.5 L137,79.5 L136.5,80 L136,80.5 L135.5,81 L135,81.5 L134.5,82 L134,82.5 L133.5,83 L133,83.5 L132.5,84 L132.5,85 L133,85.5 L133.5,86 L133.5,87 L134,87.5 L134.5,88 L135,88.5 L135.5,89 L135,89.5 L134.5,90 L134.5,91 L134,91.5 L133.5,92 L133.5,93 L133,93.5 L132.5,94 L132.5,95 L132,95.5 L131.5,96 L131,96.5 L130.5,97 L130.5,98 L130,98.5 L129.5,99 L129.5,100 L129,100.5 L128.5,101 L128.5,102 L128,102.5 L127.5,103 L127.5,104 L127,104.5 L126.5,105 L126.5,106 L126,106.5 L125.5,107 L125.5,108 L125,108.5 L124.5,109 L124.5,110 L124,110.5 L123.5,111 L123.5,112 L123,112.5 L122.5,113 L122,113.5 L121,113.5 L120,113.5 L119,113.5 L118.5,114 L118.5,115 L118.5,116 L118.5,117 L118.5,118 L118.5,119 L118.5,120 L118.5,121 L118.5,122 L118.5,123 L118.5,124 L118.5,125 L118.5,126 L119,126.5 L119.5,127 L119.5,128 L120,128.5 L120.5,129 L121,129.5 L121.5,130 L122,130.5 L122.5,131 L122.5,132 L123,132.5 L123.5,133 L123.5,134 L124,134.5 L124.5,135 L124.5,136 L125,136.5 L125.5,137 L125.5,138 L126,138.5 L126.5,139 L127,139.5 L127.5,140 L127.5,141 L128,141.5 L128.5,142 L128.5,143 L129,143.5 L129.5,144 L129.5,145 L130,145.5 L130.5,146 L130.5,147 L131,147.5 L131.5,148 L132,148.5 L132.5,149 L132.5,150 L133,150.5 L133.5,151 L133.5,152 L134,152.5 L134.5,153 L134.5,154 L135,154.5 L135.5,155 L135.5,156 L136,156.5 L136.5,157 L136.5,158 L137,158.5 L137.5,159 L138,159.5 L138.5,160 L138.5,161 L139,161.5 L139.5,162 L139.5,163 L140,163.5 L140.5,164 L140.5,165 L141,165.5 L141.5,166 L141.5,167 L142,167.5 L142.5,168 L142.5,169 L143,169.5 L143.5,170 L143.5,171 L143.5,172 L144,172.5 L144.5,173 L144.5,174 L144.5,175 L144.5,176 L144.5,177 L144.5,178 L144.5,179 L144.5,180 L144.5,181 L144.5,182 L144,182.5 L143.5,183 L143.5,184 L143,184.5 L142.5,185 L142.5,186 L142.5,187 L142,187.5 L141.5,188 L141.5,189 L141,189.5 L140.5,190 L140.5,191 L140.5,192 L140,192.5 L139.5,193 L139.5,194 L139,194.5 L138.5,195 L138.5,196 L138.5,197 L138,197.5 L137.5,198 L137.5,199 L137,199.5 L136.5,200 L136.5,201 L136,201.5 L135.5,202 L135.5,203 L135.5,204 L135,204.5 L134.5,205 L134.5,206 L134,206.5 L133.5,207 L133.5,208 L133.5,209 L133,209.5 L132.5,210 L132.5,211 L132,211.5 L131.5,212 L131.5,213 L131.5,214 L131,214.5 L130.5,215 L130.5,216 L130,216.5 L129.5,217 L129.5,218 L129.5,219 L129,219.5 L128.5,220 L128.5,221 L128,221.5 L127.5,222 L127.5,223 L127,223.5 L126.5,224 L126.5,225 L126.5,226 L126,226.5 L125.5,227 L125.5,228 L125,228.5 L124.5,229 L124.5,230 L124.5,231 L124,231.5 L123.5,232 L123,232.5 L122.5,233 L122,233.5 L121.5,234 L121,234.5 L120.5,235 L120,235.5 L119.5,236 L119,236.5 L118.5,237 L118,237.5 L117.5,238 L117,238.5 L116.5,239 L116.5,240 L116.5,241 L117,241.5 L117.5,242 L118,242.5 L118.5,243 L118.5,244 L119,244.5 L119.5,245 L120,245.5 L120.5,246 L121,246.5 L121.5,247 L122,247.5 L123,247.5 L124,247.5 L124.5,248 L125,248.5 L126,248.5 L127,248.5 L127.5,249 L128,249.5 L129,249.5 L130,249.5 L131,249.5 L131.5,250 L132,250.5 L133,250.5 L134,250.5 L134.5,251 L135,251.5 L135.5,252 L135.5,253 L135.5,254 L135,254.5 L134.5,255 L134,255.5 L133,255.5 L132,255.5 L131,255.5 L130,255.5 L129,255.5 L128,255.5 L127,255.5 L126,255.5 L125,255.5 L124,255.5 L123,255.5 L122,255.5 L121,255.5 L120,255.5 L119,255.5 L118,255.5 L117,255.5 L116,255.5 L115,255.5 L114,255.5 L113,255.5 L112,255.5 L111,255.5 L110,255.5 L109,255.5 L108,255.5 L107,255.5 L106,255.5 L105,255.5 L104,255.5 L103,255.5 L102,255.5 L101,255.5 L100,255.5 L99,255.5 L98,255.5 L97,255.5 L96,255.5 L95,255.5 L94,255.5 L93,255.5 L92.5,255 L92.5,254 L93,253.5 L93.5,253 L93.5,252 L93.5,251 L93.5,250 L93.5,249 L93.5,248 L93.5,247 L94,246.5 L94.5,246 L94.5,245 L94.5,244 L95,243.5 L95.5,243 L95.5,242 L95.5,241 L95.5,240 L96,239.5 L96.5,239 L96.5,238 L96.5,237 L97,236.5 L97.5,236 L97.5,235 L97.5,234 L97.5,233 L98,232.5 L98.5,232 L98.5,231 L98.5,230 L99,229.5 L99.5,229 L99.5,228 L99.5,227 L99.5,226 L100,225.5 L100.5,225 L100.5,224 L100.5,223 L100.5,222 L101,221.5 L101.5,221 L101.5,220 L101.5,219 L101.5,218 L101.5,217 L102,216.5 L102.5,216 L102.5,215 L102.5,214 L102.5,213 L102.5,212 L102.5,211 L103,210.5 L103.5,210 L103.5,209 L103.5,208 L103.5,207 L103.5,206 L104,205.5 L104.5,205 L104.5,204 L104.5,203 L104.5,202 L104.5,201 L105,200.5 L105.5,200 L105.5,199 L106,198.5 L106.5,198 L106.5,197 L107,196.5 L107.5,196 L108,195.5 L108.5,195 L108.5,194 L109,193.5 L109.5,193 L109.5,192 L110,191.5 L110.5,191 L110.5,190 L111,189.5 L111.5,189 L111.5,188 L112,187.5 L112.5,187 L113,186.5 L113.5,186 L113.5,185 L114,184.5 L114.5,184 L114.5,183 L115,182.5 L115.5,182 L115.5,181 L115.5,180 L115.5,179 L115,178.5 L114,178.5 L113.5,178 L113,177.5 L112,177.5 L111.5,177 L111,176.5 L110.5,176 L110,175.5 L109.5,175 L109,174.5 L108.5,174 L108,173.5 L107.5,173 L107.5,172 L107,171.5 L106.5,171 L106,170.5 L105.5,170 L105,169.5 L104.5,169 L104.5,168 L104,167.5 L103.5,167 L103,166.5 L102.5,166 L102.5,165 L102,164.5 L101.5,164 L101,163.5 L100.5,163 L100.5,162 L100,161.5 L99.5,161 L99.5,160 L99,159.5 L98.5,159 L98,158.5 L97.5,158 L97.5,157 L97,156.5 L96.5,156 L96,155.5 L95.5,155 L95.5,154 L95,153.5 L94.5,153 L94.5,152 L94,151.5 L93.5,151 L93,150.5 L92.5,150 L92.5,149 L92,148.5 L91.5,148 L91,147.5 L90.5,147 L90,146.5 L89,146.5 L88.5,147 L88,147.5 L87,147.5 L86.5,148 L86.5,149 L86,149.5 L85.5,150 L85.5,151 L85,151.5 L84.5,152 L84.5,153 L84,153.5 L83.5,154 L83.5,155 L83,155.5 L82.5,156 L82.5,157 L82.5,158 L82,158.5 L81.5,159 L81.5,160 L81,160.5 L80.5,161 L80.5,162 L80,162.5 L79.5,163 L79.5,164 L79.5,165 L79,165.5 L78.5,166 L78.5,167 L78,167.5 L77.5,168 L77.5,169 L77,169.5 L76.5,170 L76.5,171 L76,171.5 L75.5,172 L75.5,173 L75.5,174 L75,174.5 L74.5,175 L74.5,176 L74,176.5 L73.5,177 L73.5,178 L73,178.5 L72.5,179 L72.5,180 L72.5,181 L72,181.5 L71.5,182 L71.5,183 L71,183.5 L70.5,184 L70.5,185 L70,185.5 L69.5,186 L69.5,187 L69,187.5 L68.5,188 L68.5,189 L68.5,190 L68,190.5 L67.5,191 L67,191.5 L66.5,192 L66.5,193 L66,193.5 L65.5,194 L65,194.5 L64.5,195 L64.5,196 L64,196.5 L63.5,197 L63,197.5 L62.5,198 L62,198.5 L61.5,199 L61.5,200 L61,200.5 L60.5,201 L60,201.5 L59.5,202 L59,202.5 L58.5,203 L58.5,204 L58,204.5 L57.5,205 L57,205.5 L56.5,206 L56,206.5 L55.5,207 L55,207.5 L54.5,208 L54.5,209 L54,209.5 L53.5,210 L53,210.5 L52.5,211 L52,211.5 L51.5,212 L51.5,213 L51,213.5 L50.5,214 L50,214.5 L49.5,215 L49,215.5 L48.5,216 L48.5,217 L48,217.5 L47.5,218 L47,218.5 L46.5,219 L46,219.5 L45.5,220 L45,220.5 L44.5,221 L44.5,222 L44,222.5 L43.5,223 L43,223.5 L42.5,224 L42,224.5 L41.5,225 L41.5,226 L41,226.5 L40.5,227 L40,227.5 L39.5,228 L39,228.5 L38.5,229 L38,229.5 L37.5,230 L37.5,231 L37,231.5 L36.5,232 L36,232.5 L35.5,233 L35,233.5 L34.5,234 L34.5,235 L34,235.5 L33.5,236 L33,236.5 L32.5,237 L32,237.5 L31.5,238 L31.5,239 L31,239.5 L30.5,240 L30,240.5 L29.5,241 L29.5,242 L29,242.5 L28.5,243 L28.5,244 L28.5,245 L28.5,246 L28.5,247 L28.5,248 L28.5,249 L28.5,250 L28.5,251 L28,251.5 L27.5,252 L27.5,253 L27.5,254 L27.5,255 L27,255.5 L26,255.5 L25,255.5 L24,255.5 L23,255.5 L22,255.5 L21,255.5 L20,255.5 L19,255.5 L18,255.5 L17,255.5 L16,255.5 L15,255.5 L14,255.5 L13,255.5 L12,255.5 L11,255.5 L10,255.5 L9,255.5 L8,255.5 L7,255.5 L6,255.5 L5,255.5 L4.5,255 L4.5,254 L5,253.5 L5.5,253 L5.5,252 L6,251.5 L6.5,251 L6.5,250 L7,249.5 L7.5,249 L7.5,248 L8,247.5 L8.5,247 L9,246.5 L9.5,246 L9.5,245 L10,244.5 L10.5,244 L10.5,243 L10.5,242 L10.5,241 L10.5,240 L10.5,239 L10.5,238 L10.5,237 L10.5,236 L10.5,235 L10.5,234 L11,233.5 L11.5,233 L11.5,232 L11.5,231 L12,230.5 L12.5,230 L12.5,229 L13,228.5 L13.5,228 L13.5,227 L14,226.5 L14.5,226 L14.5,225 L14.5,224 L15,223.5 L15.5,223 L15.5,222 L16,221.5 L16.5,221 L16.5,220 L17,219.5 L17.5,219 L17.5,218 L17.5,217 L18,216.5 L18.5,216 L18.5,215 L19,214.5 L19.5,214 L19.5,213 L20,212.5 L20.5,212 L20.5,211 L20.5,210 L21,209.5 L21.5,209 L21.5,208 L22,207.5 L22.5,207 L22.5,206 L23,205.5 L23.5,205 L23.5,204 L23.5,203 L24,202.5 L24.5,202 L24.5,201 L25,200.5 L25.5,200 L25.5,199 L26,198.5 L26.5,198 L26.5,197 L26.5,196 L27,195.5 L27.5,195 L27.5,194 L28,193.5 L28.5,193 L28.5,192 L29,191.5 L29.5,191 L29.5,190 L29.5,189 L30,188.5 L30.5,188 L30.5,187 L31,186.5 L31.5,186 L31.5,185 L32,184.5 L32.5,184 L33,183.5 L33.5,183 L34,182.5 L34.5,182 L35,181.5 L35.5,181 L36,180.5 L36.5,180 L37,179.5 L38,179.5 L38.5,179 L39,178.5 L39.5,178 L40,177.5 L40.5,177 L41,176.5 L42,176.5 L42.5,176 L43,175.5 L43.5,175 L43.5,174 L43.5,173 L44,172.5 L44.5,172 L44.5,171 L44.5,170 L44.5,169 L44.5,168 L44.5,167 L45,166.5 L45.5,166 L45.5,165 L45.5,164 L45.5,163 L45.5,162 L45.5,161 L45.5,160 L45.5,159 L45.5,158 L46,157.5 L46.5,157 L46.5,156 L46.5,155 L46.5,154 L46.5,153 L46.5,152 L46.5,151 L46.5,150 L46.5,149 L46.5,148 L46.5,147 L46.5,146 L47,145.5 L47.5,145 L47.5,144 L47.5,143 L47.5,142 L47.5,141 L47.5,140 L47.5,139 L47.5,138 L48,137.5 L48.5,137 L49,136.5 L50,136.5 L51,136.5 L52,136.5 L53,136.5 L53.5,136 L53.5,135 L54,134.5 L54.5,134 L54.5,133 L54.5,132 L55,131.5 L55.5,131 L55.5,130 L56,129.5 L56.5,129 L56.5,128 L56.5,127 L57,126.5 L57.5,126 L57.5,125 L57.5,124 L58,123.5 L58.5,123 L58.5,122 L59,121.5 L59.5,121 L59.5,120 L59.5,119 L60,118.5 L60.5,118 L61,117.5 L61.5,117 L62,116.5 L62.5,116 L63,115.5 L64,115.5 L64.5,115 L64.5,114 L65,113.5 L65.5,113 L65.5,112 L65.5,111 L66,110.5 L66.5,110 L66.5,109 L66.5,108 L67,107.5 L67.5,107 L67.5,106 L67.5,105 L68,104.5 L68.5,104 L68.5,103 L68.5,102 L68,101.5 L67,101.5 L66.5,101 L66,100.5 L65.5,100 L65,99.5 L64,99.5 L63.5,99 L63,98.5 L62.5,98 L62,97.5 L61.5,97 L61.5,96 L62,95.5 L62.5,95 L62.5,94 L62.5,93 L63,92.5 L63.5,92 L63.5,91 L63.5,90 L64,89.5 L64.5,89 L64.5,88 L64.5,87 L65,86.5 L65.5,86 L65.5,85 L65.5,84 L66,83.5 L66.5,83 L66.5,82 L66.5,81 L67,80.5 L67.5,80 L67.5,79 L67.5,78 L68,77.5 L68.5,77 L68.5,76 L68.5,75 L69,74.5 L69.5,74 L69.5,73 L70,72.5 L70.5,72 L70.5,71 L70.5,70 L71,69.5 L71.5,69 L72,68.5 L73,68.5 L74,68.5 L75,68.5 L76,68.5 L77,68.5 L78,68.5 L78.5,68 L79,67.5 L79.5,67 L79.5,66 L80,65.5 L80.5,65 L80.5,64 L81,63.5 L81.5,63 L81.5,62 L81.5,61 L82,60.5 L82.5,60 L82.5,59 L83,58.5 L83.5,58 L83.5,57 L84,56.5 L84.5,56 L84.5,55 L85,54.5 L85.5,54 L85.5,53 L85.5,52 L86,51.5 L86.5,51 L86.5,50 L87,49.5 L87.5,49 L87.5,48 L88,47.5 L88.5,47 L88.5,46 L89,45.5 L89.5,45 L90,44.5 L90.5,44 L90.5,43 L91,42.5 L91.5,42 L92,41.5 L92.5,41 L92.5,40 L93,39.5 L93.5,39 L94,38.5 L94.5,38 L95,37.5 L95.5,37 L96,36.5 L96.5,36 L97,35.5 L97.5,35 L98,34.5 L99,34.5 L99.5,34 L100,33.5 L100.5,33 L101,32.5 L102,32.5 L102.5,32 L103,31.5 L104,31.5 L105,31.5 L105.5,31 L106,30.5 L107,30.5 L108,30.5 L109,30.5 L110,30.5 L111,30.5 L112,30.5 L113,30.5 L113.5,30 L114,29.5 L114.5,29 L114.5,28 L115,27.5 L115.5,27 L115.5,26 L115,25.5 L114,25.5 L113.5,25 L113,24.5 L112,24.5 L111.5,24 L111.5,23 L111.5,22 L111.5,21 L111.5,20 L111.5,19 L111.5,18 L111.5,17 L111.5,16 L111.5,15 L111.5,14 L111.5,13 L111.5,12 L111.5,11 L111.5,10 L112,9.5 L112.5,9 L112.5,8 L113,7.5 L113.5,7 L113.5,6 L114,5.5 L114.5,5 L115,4.5 L115.5,4 L116,3.5 L116.5,3 L117,2.5 L117.5,2 L118,1.5 L119,1.5 L119.5,1 L120,0.5 L120.5,0Z\" /></g></svg>\n", M = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\" fill=\"currentColor\" role=\"img\" aria-label=\"deadlock module\"><title>deadlock module</title><desc>Adapted monochrome mark from Valve artwork. Source: https://cdn.fastly.steamstatic.com/apps/deadlock/images/react/deadlock_logo_dark.svg. Valve retains its rights.</desc><g transform=\"translate(0.00000 0.14577) scale(0.14577259)\"><path d=\"M114.464 120.969C114.464 120.969 114.614 123.215 115.512 124.113C118.656 127.856 123.147 129.652 121.5 135.341C120.602 138.485 113.117 142.676 111.47 146.269C95.6016 181.15 75.0921 214.235 61.3194 250.015C59.0738 256.003 51.2892 275.015 50.2413 279.207C49.1934 284.147 50.391 289.537 49.9419 294.627C48.7443 304.956 41.1094 339.837 43.2052 346.874C43.6543 348.67 46.0496 349.568 46.4987 352.413C50.0916 378.012 53.6845 401.965 60.8703 427.115C69.7028 458.104 87.0685 486.997 103.236 514.094C108.027 522.178 123.896 527.268 117.309 540.442C116.86 541.34 103.386 554.813 102.488 555.262C92.3081 560.352 89.0146 545.681 81.3797 541.041C78.9844 539.544 76.8886 542.837 74.3436 541.19C58.0259 531.31 27.9354 474.123 22.2467 454.96C10.1207 413.342 -3.20295 344.029 0.689351 301.513C1.13846 296.872 3.68343 294.626 4.28224 291.034C5.03076 286.093 3.83313 280.554 4.28224 275.315C8.62365 232.05 28.8337 201.51 49.9419 165.431C55.6307 155.85 59.5229 146.269 67.1578 137.137C72.5472 130.7 82.2779 121.718 90.811 120.67C96.6495 119.921 100.691 121.718 105.033 122.017C107.278 122.017 112.818 119.173 114.165 120.819L114.464 120.969Z\" fill=\"currentColor\" />\n<path d=\"M570.911 599.575C567.767 602.719 552.048 616.192 548.455 618.139C545.611 619.636 542.018 619.785 539.323 621.133C501.149 639.995 455.489 669.188 412.973 674.876C408.482 675.475 403.692 674.427 399.051 674.876C393.063 675.625 385.727 679.368 379.739 679.967C373.002 680.715 365.517 679.517 358.78 679.967C353.092 680.416 345.157 683.11 339.618 683.41C320.606 684.907 304.138 675.326 285.575 674.577C276.892 671.433 266.263 671.433 257.73 669.188C254.137 668.14 255.485 663.349 253.988 660.655C253.239 659.307 250.994 658.259 249.946 656.014C248.299 652.72 247.85 644.337 243.359 643.289C242.311 643.139 235.125 646.582 233.927 647.481C231.083 649.876 230.784 654.966 230.484 655.415C229.137 656.762 226.442 650.175 225.245 649.277C221.053 646.283 209.975 644.487 204.735 641.792C199.496 639.097 188.717 633.858 184.375 631.013C180.034 628.169 181.681 627.271 172.699 623.079C162.668 618.438 143.506 605.114 135.123 597.629C128.536 591.791 126.44 588.347 125.542 579.215C124.195 564.694 128.237 556.011 141.86 550.472C150.243 557.807 159.674 564.245 168.357 571.281C171.351 573.826 174.046 577.569 177.04 580.114C200.394 598.976 234.377 613.348 263.12 623.528C287.372 632.061 319.558 637.75 344.858 639.696C356.385 640.594 364.02 636.103 374.799 634.456C390.069 632.061 410.428 631.462 425.249 627.121C427.045 626.522 428.542 623.677 431.087 622.48C438.423 618.737 450.549 615.893 459.082 612.001C485.58 599.874 515.071 585.802 537.377 567.838C545.012 561.85 551.449 557.059 560.881 563.496C562.827 564.844 577.947 579.964 578.246 581.161C579.444 585.503 574.504 587.299 572.707 591.192C571.659 593.287 572.857 597.329 571.06 599.126L570.911 599.575ZM464.471 622.779C461.477 619.785 452.196 626.223 455.788 629.815C456.836 630.863 463.423 630.863 464.471 629.815C464.621 629.516 464.771 623.079 464.471 622.779ZM420.758 638.349C420.758 638.349 423.303 638.798 425.099 639.995C426.297 640.894 427.045 642.84 428.842 643.289C439.77 646.582 444.411 632.36 435.728 631.163C433.333 630.863 427.644 630.863 425.399 631.462C423.303 632.061 419.261 637.151 420.758 638.199V638.349Z\" fill=\"currentColor\" />\n<path d=\"M562.228 70.219C563.276 71.2669 561.779 79.8001 562.677 82.9439C564.324 88.483 572.857 86.5368 565.971 95.5191C561.779 101.058 550.851 111.537 543.964 112.136C537.078 112.735 535.132 104.501 530.94 102.406C528.245 101.058 525.85 101.956 523.305 101.358C516.868 99.4114 499.502 87.4351 490.67 83.2434C476.148 76.2073 460.729 67.3746 445.759 61.8355C412.375 49.41 369.41 44.6196 334.229 42.0746C318.81 41.0267 315.965 47.1645 303.989 48.8113C263.719 54.3504 244.108 59.8895 207.879 78.6026C189.016 88.3334 174.196 95.519 154.884 104.352C151.89 105.699 137.668 116.777 135.722 113.933C135.572 113.633 135.722 110.639 134.824 108.693C132.428 104.052 120.302 97.0162 119.853 92.0759C119.404 87.5848 126.889 80.9977 130.482 78.1533C161.022 53.7514 212.52 22.9124 250.545 14.6786C253.539 14.0798 256.383 14.6787 258.778 14.2296C277.641 10.3372 303.241 3.45071 321.654 1.95366C336.774 0.756023 353.541 2.70218 369.11 1.95366C372.703 1.95366 375.547 -0.14205 379.589 0.00765488C387.224 0.307064 395.757 5.54668 402.644 6.74432C430.938 11.8343 452.495 20.6667 479.592 29.4993C486.777 31.8945 496.808 32.6432 503.245 35.4876C523.904 44.4699 541.419 55.0989 558.785 69.1711C559.833 69.9197 561.48 69.7698 561.929 70.219H562.228Z\" fill=\"currentColor\" />\n<path d=\"M600.554 112.436C603.398 118.125 608.338 123.364 611.033 129.053C614.626 136.688 626.902 161.389 628.548 167.377C629.596 171.27 627.65 181.899 633.339 183.546C640.076 185.492 640.525 181.3 647.112 189.085C657.142 200.911 668.519 238.936 672.262 254.955C678.549 283.099 689.029 333.699 684.987 361.245C684.538 364.239 680.346 392.683 679.597 403.162C679.298 408.552 680.795 417.833 679.597 422.325C678.549 425.768 665.675 426.965 663.13 432.055C659.836 438.493 665.376 455.26 664.028 464.392C663.579 467.236 658.938 476.967 657.441 480.56C651.753 493.434 639.626 515.441 630.794 525.621C627.051 529.962 622.71 532.956 619.566 536.998C616.722 540.741 611.931 552.418 607.29 552.867C603.099 553.166 600.554 549.723 596.811 549.274C587.829 547.927 581.392 554.663 575.703 545.831C573.607 542.388 581.841 534.154 583.937 529.513C589.326 517.836 592.919 503.614 599.057 492.087C602.051 486.398 619.716 464.242 620.165 462.445C620.914 459.901 620.165 456.906 620.614 454.212C623.458 442.086 628.099 427.414 631.243 414.091C634.686 399.42 640.375 387.294 641.273 371.874C641.872 363.341 641.722 352.263 641.273 343.73C640.525 327.412 637.231 312.741 635.884 296.573C635.435 291.034 636.483 284.746 635.884 279.057C633.189 254.955 611.482 209.444 598.907 188.336C593.069 178.306 579.146 164.383 576.751 154.503C576.002 151.808 576.751 148.814 576.152 146.419C574.805 141.479 567.619 142.826 569.415 130.4C570.613 121.718 582.14 118.274 586.781 111.089C590.973 108.993 596.512 110.34 600.404 112.286L600.554 112.436Z\" fill=\"currentColor\" />\n<path d=\"M434.68 453.014C435.429 453.912 433.483 460.799 435.429 463.643C436.327 464.99 439.321 465.589 440.818 467.086C452.794 477.716 470.01 497.327 484.232 504.213C489.023 506.459 496.658 507.207 500.4 510.8C503.843 514.243 504.143 521.28 507.287 524.873C508.784 526.669 512.826 527.417 513.275 529.214C514.922 534.454 511.778 532.957 509.981 534.454C482.286 556.909 452.345 575.772 417.764 585.653C403.093 589.844 380.637 595.084 365.517 596.431C348.601 597.928 355.337 595.833 356.086 585.203C356.834 573.227 355.038 560.203 356.086 548.376C356.685 539.394 360.427 529.962 359.529 520.531C358.331 507.058 359.08 501.818 359.529 489.093C359.679 484.452 358.481 461.098 359.529 460.2C360.727 459.152 371.356 458.703 374.05 458.104C381.236 456.457 391.116 453.314 398.003 450.619C401.296 449.272 407.135 445.08 409.68 444.631C414.47 443.882 422.854 456.158 428.692 456.158C430.339 456.158 434.231 452.415 434.83 453.164L434.68 453.014Z\" fill=\"currentColor\" />\n<path d=\"M286.325 452.715C290.965 457.356 307.882 457.056 314.619 460.35C319.708 462.895 317.014 470.23 317.463 475.021C319.708 497.327 326.295 529.364 324.499 550.173C323.601 560.353 328.391 572.928 327.643 581.311C327.493 583.407 325.397 586.401 324.798 588.946C324.349 591.042 324.798 596.132 324.499 596.431C322.852 598.228 308.181 593.437 304.439 594.635C255.935 583.557 211.772 569.335 175.843 534.304C173.148 531.759 164.765 529.513 170.603 523.824C173.747 520.681 180.185 517.237 183.777 514.243C205.634 495.381 227.79 476.667 250.246 458.254C254.737 454.661 259.827 446.277 265.965 445.978C268.659 445.978 274.199 449.122 275.396 447.774C276.145 447.026 276.145 441.487 279.887 442.685C283.63 443.732 284.977 451.517 286.325 452.865V452.715ZM224.946 545.681C224.946 545.681 231.533 547.777 232.731 547.478C238.719 545.831 233.928 535.352 227.641 536.998C224.796 537.747 224.197 544.933 225.096 545.681H224.946Z\" fill=\"currentColor\" />\n<path d=\"M319.26 211.541C317.015 213.786 308.182 212.888 304.889 213.636C296.655 215.583 285.727 219.924 277.493 222.918C273.301 224.415 269.559 228.607 264.619 227.11C262.523 226.511 258.032 220.523 255.636 218.577C236.474 201.81 212.671 185.342 195.156 167.078C193.509 165.282 192.91 162.737 190.964 160.941C185.725 156.15 176.892 156.898 174.647 147.617C172.85 140.581 175.395 142.826 177.641 140.88C221.504 105.55 262.223 89.5312 318.512 83.9921C320.308 83.8424 322.404 82.0462 323.752 82.3456C327.644 83.0941 326.746 93.5733 326.446 97.1662C324.051 130.251 322.704 165.132 319.56 198.666C319.26 201.51 320.009 210.942 319.56 211.69L319.26 211.541Z\" fill=\"currentColor\" />\n<path d=\"M433.035 99.8609C435.281 97.6153 449.502 107.346 452.796 108.993C472.407 118.873 485.132 130.101 502.348 139.832C507.288 142.527 513.426 140.281 509.234 148.814C507.887 151.659 500.551 153.904 498.755 157.497C496.21 155.701 501.3 150.611 499.653 148.665C499.653 148.665 495.462 147.467 495.312 147.467C490.821 147.317 472.707 160.641 480.341 165.431C481.24 166.03 489.773 166.629 485.581 169.773C485.282 169.923 483.036 169.923 481.24 171.42C476.898 174.863 477.946 177.557 476.15 180.402C474.653 182.498 470.91 181.749 468.215 182.947C459.982 186.689 455.491 196.42 445.46 200.462C442.616 201.51 437.826 200.462 436.778 204.055C436.179 206.45 437.227 209.594 435.73 211.84C434.832 213.038 428.245 216.481 426.149 217.978C423.753 219.625 418.813 226.661 415.52 223.966C415.22 223.816 419.412 219.026 414.621 216.93C410.729 215.283 411.178 222.918 410.28 223.816C408.633 225.613 388.423 217.229 384.082 215.882C379.142 214.385 367.465 213.337 364.77 210.792C361.626 207.798 363.423 199.864 362.974 195.073C359.98 163.934 356.087 132.047 354.141 100.609C354.141 97.7648 353.542 82.7944 354.141 82.1956C355.339 80.9979 360.279 83.6926 362.075 83.8423C372.854 84.8903 382.285 85.6389 393.064 87.8844C398.154 88.9324 431.089 97.3157 431.089 100.609C431.089 101.208 422.855 109.592 430.191 111.987C437.676 114.382 432.287 100.31 432.885 99.711L433.035 99.8609Z\" fill=\"currentColor\" />\n<path d=\"M599.205 349.868C600.703 351.215 597.559 360.047 597.409 362.892C597.11 366.485 596.96 373.671 597.409 376.815C597.559 378.461 599.954 377.413 600.553 378.012C605.044 382.204 598.457 387.443 596.511 391.635C587.08 413.043 582.289 439.541 572.558 461.248C566.271 463.793 562.678 471.727 560.432 477.865C556.54 481.907 544.564 506.309 540.671 506.459C540.072 506.459 533.785 504.812 532.587 504.363C518.515 498.524 499.353 472.625 489.024 460.499C481.688 451.966 482.437 454.212 477.796 443.882C471.508 430.109 465.221 435.05 459.682 429.66C458.933 428.912 458.783 426.816 457.735 425.618C456.089 423.822 452.346 421.127 451.448 419.63C448.454 413.941 451.747 414.839 455.041 412.594C469.113 402.713 482.287 392.084 496.209 382.054C503.245 376.964 528.545 356.904 534.084 355.107C545.162 351.514 559.983 351.365 572.409 350.317C574.205 350.317 581.091 349.718 582.888 349.568C585.582 349.568 598.906 348.969 599.505 349.568L599.205 349.868Z\" fill=\"currentColor\" />\n<path d=\"M265.366 360.047C261.773 355.556 260.875 330.855 261.474 324.418C267.163 261.991 350.847 231.151 393.662 278.159C416.866 303.608 421.807 326.064 413.872 359.598C413.423 361.544 414.172 364.089 413.573 366.335C412.974 368.58 408.483 371.275 406.836 373.521C400.998 381.455 396.507 388.94 388.572 395.377C373.153 407.653 360.428 410.198 341.416 411.096C339.32 411.096 337.374 413.043 334.38 412.893C313.421 411.246 281.983 394.03 272.552 374.868C270.606 370.976 271.055 363.79 269.707 361.993C268.809 360.646 266.115 360.796 265.516 360.047H265.366ZM328.99 262.44L324.649 266.781L328.092 270.224L332.433 265.883L328.99 262.44ZM355.787 294.177C354.739 293.129 340.517 290.435 337.673 290.285C324.05 289.387 306.385 302.71 300.846 314.837C296.355 324.418 295.007 339.987 299.049 349.867C302.343 357.951 307.283 355.706 308.63 356.903C309.08 357.353 308.032 361.544 310.427 364.688C319.559 377.263 342.464 378.611 355.937 373.371C373.153 366.634 384.231 346.274 382.135 328.01C381.686 323.519 377.494 310.794 373.452 308.699C368.961 306.453 362.374 305.106 358.033 300.614C356.685 299.267 356.835 295.375 355.637 294.177H355.787ZM391.117 320.226C388.423 322.921 396.357 327.711 396.357 322.92C396.357 321.873 392.165 319.328 391.117 320.226ZM394.56 327.112C391.117 323.519 384.68 332.951 387.524 335.795C387.824 336.094 394.261 336.094 394.56 335.795C394.86 335.496 394.86 327.412 394.56 326.963V327.112Z\" fill=\"currentColor\" />\n<path d=\"M151.293 505.261C151.293 505.261 145.155 505.71 144.706 505.261C144.257 504.812 144.406 503.165 143.658 502.117C117.46 465.29 91.7106 427.414 86.9201 380.407C86.1715 372.623 88.5668 366.634 88.7165 361.245C88.7165 358.55 86.0218 357.652 85.423 355.856C82.4289 346.125 89.465 351.514 94.7047 351.814C105.783 352.562 137.37 351.514 145.155 355.556C149.796 357.952 156.682 365.736 161.173 365.736C163.269 365.736 165.664 362.592 167.161 366.934C167.91 369.179 166.862 371.125 169.107 373.82C171.054 376.215 177.491 379.21 180.635 381.605C184.377 384.599 200.845 399.12 203.39 399.27C210.575 399.57 206.384 397.024 214.767 401.665C217.013 402.863 220.755 402.713 221.504 405.408C222.103 407.354 221.504 409.899 221.953 411.995C223.6 417.983 231.384 414.54 221.803 426.217C212.222 438.043 199.946 448.373 190.216 459.451C177.79 473.374 165.664 487.446 153.389 501.369C152.041 502.866 152.041 505.111 151.442 505.56L151.293 505.261Z\" fill=\"currentColor\" />\n<path d=\"M532.737 166.33C533.635 167.228 531.988 181.3 532.737 182.049C535.132 184.444 540.372 178.007 542.318 178.606C556.54 198.666 569.713 218.726 579.145 241.481C584.085 253.308 588.876 267.081 591.87 279.507C594.864 291.932 595.612 304.507 598.457 316.633C599.654 317.831 597.409 319.777 596.511 319.927C593.666 320.825 582.887 320.376 579.145 320.076C576.151 319.927 573.606 318.28 570.612 318.13C563.875 317.681 541.12 319.178 537.228 314.837C534.234 311.394 536.03 306.304 528.395 306.004C525.401 306.004 523.006 308.549 520.611 307.052L452.346 254.506C459.082 246.721 466.568 239.386 473.304 231.751C488.275 214.684 503.694 198.067 518.814 181.001C520.461 179.055 529.892 163.036 532.737 166.03V166.33ZM502.347 215.583C500.401 216.032 494.263 220.223 494.263 221.421C494.263 223.966 503.544 228.457 507.287 227.409C511.479 226.361 512.676 213.187 502.347 215.433V215.583Z\" fill=\"currentColor\" />\n<path d=\"M84.9721 320.226C83.6247 318.879 89.4632 292.98 88.8644 288.189C99.9424 247.919 116.26 205.852 144.404 174.114C145.902 172.468 150.243 167.378 152.339 167.976C153.686 168.426 159.974 178.905 161.92 181.151C177.04 198.516 193.807 214.385 209.226 231.751C212.669 235.643 216.262 241.931 219.706 245.823C222.849 249.266 229.885 251.362 228.388 256.152C227.79 258.398 221.951 259.895 219.706 261.542C195.603 278.608 172.848 297.771 148.446 314.388C134.823 317.382 120.751 317.082 106.979 318.28C105.182 318.28 103.386 319.777 101.589 319.927C98.8945 320.077 85.5709 320.526 84.9721 319.927V320.226ZM99.0442 290.585C96.3496 293.13 100.99 303.16 105.332 304.357C109.523 305.555 115.661 300.315 116.41 296.423C117.158 292.381 108.775 288.339 105.332 288.788C104.583 288.788 99.4933 290.435 99.3436 290.734L99.0442 290.585Z\" fill=\"currentColor\" />\n<path d=\"M240.665 384.899C240.665 384.899 240.665 388.641 239.767 390.138C237.97 392.983 237.372 390.587 235.874 390.438C234.228 390.438 230.335 390.288 230.036 390.138C229.138 389.539 230.036 383.851 232.731 383.102C233.779 382.803 240.216 384.599 240.515 384.899H240.665Z\" fill=\"currentColor\" />\n<path d=\"M83.1751 573.676C82.5763 576.221 86.3189 578.018 83.1751 579.814C81.5283 580.862 76.7378 581.162 76.139 580.712C75.8396 580.413 77.636 574.125 77.9354 573.676C78.2348 573.377 81.678 573.676 83.1751 573.676Z\" fill=\"currentColor\" />\n<path d=\"M663.877 132.945C665.823 134.892 658.787 141.778 656.841 139.982C656.692 139.832 656.991 138.485 656.841 137.437C656.242 135.94 653.847 135.64 656.841 133.844C658.488 132.945 663.428 132.496 663.877 132.945Z\" fill=\"currentColor\" />\n</g></svg>\n", { UiProvider: N, PageHeader: P, SettingsLayout: pe, Surface: F, SettingsGroup: I, StatusHint: L, FormField: R, FormGrid: me, ActionBar: z } = r, B = 0, he = "cs2", ge = {
	steam: fe,
	dota2: A,
	cs2: j,
	deadlock: M
};
function _e(e, n) {
	let r = ge[e];
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
function ve(i, o) {
	let s = n({ ...o.context });
	if ((o.context.owner.startsWith("steam_dlc/") ? o.context.owner.slice(10) : "") !== he) throw Error("module_owner_mismatch");
	let c = he, l = _(() => s.value.locale, r.translateUi, c), u = l.text, d = (e, t) => e === null && t !== l.textAt("zh-CN", "choice.followCore") ? t : r.uiThemeLabel?.(e, t, s.value.locale) ?? (e === null ? u("choice.followCore") : t), f = S[c], p = o.routeId === "settings", m = o.routeId === "home", h = p && [
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
	}[o.routeId], y = () => u(f ? "module.cs2.summary" : "page.moduleMissing"), b = () => f ? u("module.cs2.source") : "", x = !!(f && r.PageTemplate && r.uiText), ee = `steam-dlc-${++B}`, C, w, T, E, te = !1, D = () => {}, ne = [], re = {
		actions(n) {
			if (x) {
				n.classList.add("ui-action-bar");
				return;
			}
			let r = [...n.childNodes], i = e({ setup: () => () => t(z, {}, { default: () => t("div", {
				style: { display: "contents" },
				ref: (e) => {
					if (e) for (let t of r) t.parentNode !== e && e.append(t);
				}
			}) }) });
			i.mount(n), ne.push(i);
		},
		grid(n, r) {
			let a = i.ownerDocument.createElement("div");
			if (n.insertBefore(a, r || null), x) return a.className = "ui-form-grid", a.dataset.columns = p ? "1" : "2", a;
			let o, s = e({ setup: () => () => t(me, { columns: p ? 1 : 2 }, { default: () => t("div", {
				style: { display: "contents" },
				ref: (e) => {
					o = e;
				}
			}) }) });
			return s.mount(a), ne.push(s), o;
		},
		field(r, { control: a, reset: o, label: s, hint: c, error: u }) {
			let d = i.ownerDocument.createElement("div");
			if (r.append(d), x) return d.className = p ? "steam-dlc-field ui-settings-row" : "steam-dlc-public-field", a.name === "poster_limit" && d.classList.add("steam-dlc-limit-field"), s.htmlFor = a.id, s.id = a.id + "-label", a.setAttribute("aria-labelledby", s.id), a.setAttribute("aria-describedby", `${c.id} ${u.id}`), a.setAttribute("aria-invalid", String(!!u.textContent)), d.append(s, a, ...o ? [o] : [], c, u), {
				hint: c,
				error: u
			};
			let f = l.renderer(s), m = l.renderer(c), h = n(), g = n(u.textContent), _ = e({ setup: () => () => t(R, {
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
			return _.mount(d), ne.push(_), {
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
	}, ie = () => t("details", { class: "steam-dlc-disclosure" }, [
		t("summary", u("section.sourceScope")),
		t("p", { class: "steam-dlc-hint" }, b()),
		t("p", { class: "steam-dlc-hint" }, u("page.accountScope"))
	]), ae = /* @__PURE__ */ new Map(), O = n({}), oe = /* @__PURE__ */ new Map(), k = /* @__PURE__ */ new Map();
	if (p || g) {
		let e = p ? "save" : "query";
		k.set(e, {
			id: e,
			type: "submit",
			disabled: !0
		});
	}
	let se = (e) => {
		O.value = {
			...O.value,
			...e
		};
	}, ce = {
		bind(e, t, n) {
			oe.set(e, t), n && k.set(e, {
				id: e,
				...n
			}), se({});
		},
		actionState(e, t) {
			let n = k.get(e);
			n && k.set(e, {
				...n,
				...t
			}), (e === "query" || e === "save") && C?.closest("form")?.setAttribute("aria-busy", String(!!t.busy)), se({});
		},
		publish: se,
		groupHost(e) {
			return ae.get(e);
		},
		text(e) {
			return r.uiText(e, s.value.locale);
		}
	}, le = () => t(F, {
		title: u(h ? "section.sourceCredentials" : p ? "section.settingsHelp" : "section.dataAndAccounts"),
		eyebrow: h ? u("page.sourceAccess") : void 0
	}, { default: () => [
		t(L, {}, { default: () => p ? u("page.settings.cs2") : b() || u("page.moduleMissing") }),
		h ? t("div", { ref: (e) => {
			w = e;
		} }) : null,
		t("p", { class: "steam-dlc-hint" }, u(p ? "page.saveVerification" : "page.accountScope"))
	] }), ue = () => {
		let { themeField: e, themeValue: n, themeError: o, themeReadonly: l, notice: d, pending: h, availability: _ } = O.value;
		return t(r.PageTemplate, {
			idPrefix: ee,
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
				}],
				actions: [...k.values()].map((e) => typeof e.label == "function" ? {
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
			onFieldChange: ({ id: e, value: t }) => oe.get(e)?.(t),
			onAction: (e) => oe.get(e)?.()
		}, {
			...m ? { logo: () => _e(c, i.ownerDocument) } : {},
			sectionExtra: ({ section: e }) => t("div", { ref: (t) => {
				e.id === "workspace" ? C = t : ae.set(e.id, t);
			} }),
			aside: le,
			results: () => t("div", { ref: (e) => {
				T = e;
			} }),
			footer: () => [t(L, {}, { default: () => _ }), m ? ie() : null]
		});
	}, fe = e({ setup: () => () => x ? ue() : t(N, {
		theme: s.value.theme,
		locale: s.value.locale,
		styleMountTarget: i
	}, { default: () => t("section", {
		class: "steam-dlc-view",
		lang: s.value.locale
	}, [m ? t(F, {
		title: f?.title || u("page.moduleUnavailable"),
		eyebrow: u("page.moduleEyebrow", { module: f?.title?.toUpperCase() || "STEAM DLC" })
	}, { default: () => [
		_e(c, i.ownerDocument),
		t("p", y()),
		t(L, {}, { default: () => u("page.homeNavigation") }),
		t("div", { ref: (e) => {
			C = e;
		} }),
		ie()
	] }) : [p ? null : t(P, {
		title: f ? `${f.title}${g ? ` ${u(g)}` : ""}` : u("page.moduleUnavailable"),
		eyebrow: "YOMIHIME GAME LINK / STEAM DLC",
		subtitle: y()
	}), t(pe, {}, {
		default: () => p ? t("div", { ref: (e) => {
			C = e;
		} }) : t(I, {
			title: u(g || "section.statusAndHelp"),
			number: "01"
		}, { default: () => t("div", { ref: (e) => {
			C = e;
		} }) }),
		aside: le
	})]]) }) });
	fe.mount(i), re.credentialHost = w, x && (re.template = ce, re.resultHost = T), E = de(C, {
		...o,
		copy: l,
		themeLabel: d,
		presentation: re,
		scope: {
			signal: o.scope.signal,
			isCurrent: () => o.scope.isCurrent(),
			onDispose: () => () => {}
		}
	});
	let A = () => {
		te || (te = !0, E.dispose(), l.clear(), ne.splice(0).reverse().forEach((e) => e.unmount()), fe.unmount(), o.scope.signal.removeEventListener("abort", A), D());
	};
	return o.scope.signal.addEventListener("abort", A, { once: !0 }), D = o.scope.onDispose(A), {
		update(e) {
			if (te) return;
			let t = s.value.locale !== e.locale;
			s.value = { ...e }, E.update(e), t && l.refresh();
		},
		dispose: A,
		navigationImpact: E.navigationImpact
	};
}
//#endregion
export { ve as mount };
