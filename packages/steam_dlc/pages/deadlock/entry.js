import { createApp as e, h as t, shallowRef as n } from "../../../../../../../runtime.js";
import { PageHeader as r, SettingsGroup as i, SettingsLayout as a, StatusHint as o, Surface as s, UiProvider as c } from "../../../../../../../runtime.js";
//#region packages/steam_dlc/pages/src/controller.js
var l = Object.freeze({
	steam: {
		title: "Steam",
		summary: "商店搜索、游戏详情与公开账号资料。共享关联由用户声明，不代表账号所有权验证。",
		source: "Steam 商店和 Community 提供公开样本；完整库 full 使用可选 Steam Key。是否完整以本次来源返回为准，私密库、缺少 Key 与上游失败会分别说明。",
		commands: [
			["/ygl steam bind <Dota ID32、SteamID64 或 profiles URL>", "在私聊中关联当前用户的 Steam 账号。"],
			["/ygl steam binding", "在私聊中查看当前用户关联。"],
			["/ygl steam unbind", "在私聊中解除当前用户关联。"],
			["/ygl steam search <游戏名或 AppID> [--country CC] [--language english]", "商店默认 CN / schinese；价格按本次地区、币种和来源时间展示，不代表历史最低价。"],
			["/ygl steam app <AppID> [--country CC] [--language english]", "查看商店详情与当前可用价格；图片失败时保留文字结果。"],
			["/ygl steam profile [账号]", "查看公开资料；昵称、头像、等级逐项标明可用性。"],
			["/ygl steam recent [账号]", "查看主页最近展示的公开样本，不代表完整两周游戏列表。"],
			["/ygl steam games [账号]", "查看来源可用的公开样本；完整游戏库增强需要可选 Steam Key。"],
			["/ygl steam wall [账号] [--source games|recent|full] [--all-apps] [--limit N] [--refresh]", "生成游戏生涯拼图。来源、时间预设、比例与数量受已保存设置及输出预算约束；完整库需要可选 Key。"],
			["/ygl steam status", "查看使用说明。"]
		]
	},
	dota2: {
		title: "Dota2",
		summary: "近期战绩、样本统计、可读资料与个人战报已实现，使用 OpenDota 公开数据，不提交解析。",
		source: "数据来自 OpenDota 社区公开记录。样本统计按有效字段分别计算，未收录与缺失数据保持未知，不补零。",
		commands: [
			["/ygl dota2 recent [账号] [--limit N]", "默认 5 场，最多 20 场；省略账号时使用当前用户的 Steam 关联。"],
			["/ygl dota2 profile [账号]", "查看精简玩家资料；省略账号时使用当前用户的 Steam 关联。"],
			["/ygl dota2 stats [账号] [--limit N]", "默认20场，范围1–20；显示实际有效样本、独立分母和本次英雄/模式分布。"],
			["/ygl dota2 last [账号]", "查询该玩家上一场基础结算；省略账号时使用当前用户关联。"],
			["/ygl dota2 match <match_id> [--account <账号>]", "指定账号查看个人焦点，无账号保持全场概览；不读取默认关联，不提交解析。"],
			["/ygl dota2 status", "查看功能说明。"],
			["/ygl dota2 watch [账号]", "在当前群或私聊创建自己的比赛订阅；省略账号使用当前 Steam 绑定。"],
			["/ygl dota2 watchlist", "在当前会话查看自己的订阅；首次建立基线，不补发旧比赛。"],
			["/ygl dota2 unwatch <订阅ID>", "取消当前会话中自己的订阅。"]
		]
	},
	cs2: {
		title: "CS2",
		summary: "完美平台、完美收录官匹与 5E 玩家资料、近期战绩、赛季统计和来源单场查询。",
		source: "完美扫码与 5E Token 在可信管理页设置。登录主体只用于请求授权，不替换玩家绑定。官匹与 5E 单场只提供来源近期样本中的玩家摘要。",
		commands: [
			["/ygl cs2 status", "查看来源和凭据配置状态；配置不等于平台当前验证有效。"],
			["/ygl cs2 profile [SteamID64] --platform perfect [--season S16]", "完美/官匹可复用本人 Steam 绑定；模型查询必须明确账号。"],
			["/ygl cs2 recent [SteamID64] --platform official [--limit 5]", "官匹仅指完美收录口径，不代表全部 Valve 历史。"],
			["/ygl cs2 stats <5E-domain> --platform 5e [--season 2026S5]", "5E domain 与 SteamID 分开；统计注明来源赛季口径。"],
			["/ygl cs2 last [SteamID64] --platform perfect", "查看来源最近一场；官匹与 5E 返回有界玩家摘要。"],
			["/ygl cs2 match <来源比赛ID> --platform perfect [--focus SteamID64]", "完美可返回完整名单及焦点；官匹/5E 另需 --account，限定在该玩家近期样本。"]
		]
	},
	deadlock: {
		title: "Deadlock",
		summary: "玩家资料、近期样本、统计与单场焦点查询，数据来自 Deadlock API 社区已收录记录。",
		source: "默认使用最近 20 条已收录记录，不代表 Valve 官方实时完整历史。未收录、受保护、尚未解析与空结果分别报告；缺失段位不推断为最低段位或零 MMR。",
		commands: [
			["/ygl deadlock profile [账号]", "查看来源已收录资料与最近可用排位记录。"],
			["/ygl deadlock recent [账号] [--limit N]", "默认 20 条，范围 1–20；仅指来源已收录近期记录。"],
			["/ygl deadlock stats [账号] [--limit N]", "默认 20 条，范围 1–20；按有效分母计算，缺失字段保持未知。"],
			["/ygl deadlock last [账号]", "查看有界窗口最近有效记录，详情失败不暗换另一场。"],
			["/ygl deadlock match <match_id> [--account <账号>]", "按明确账号精确匹配个人焦点，不读取默认关联。"],
			["/ygl deadlock status", "查看功能与来源范围。"]
		]
	}
}), u = (e, t) => JSON.stringify(e) === JSON.stringify(t), d = (e) => JSON.stringify([
	e.owner,
	e.runtimeId,
	e.epoch,
	e.boundary
]), f = (e) => typeof e?.message == "string" ? e.message : "", p = /* @__PURE__ */ new Set([
	"admin_authorization_denied",
	"page_revoked",
	"page_unavailable",
	"stale_context"
]), m = Object.freeze({
	steam: [
		"reply_theme",
		"poster_source",
		"poster_mode",
		"poster_preset",
		"poster_aspect",
		"poster_quality",
		"poster_fit",
		"poster_include_apps",
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
}), h = {
	timezone: "输出时区",
	reply_theme: "回复主题",
	poster_source: "游戏库来源",
	poster_mode: "拼图布局",
	poster_preset: "时长预设",
	poster_aspect: "输出比例",
	poster_quality: "输出清晰度",
	poster_fit: "封面适配",
	poster_include_apps: "包含软件等全部应用",
	poster_limit: "作品数量上限",
	subscription_enabled: "启用比赛订阅",
	poll_interval_seconds: "订阅检查间隔（秒）",
	opendota_rph: "每小时请求上限",
	commentary_enabled: "启用模型短评",
	default_platform: "默认 CS2 来源"
}, g = {
	games: "公开主页样本",
	recent: "近期公开样本",
	full: "完整游戏库（需要 Key）",
	dense: "游戏生涯拼图",
	legacy: "兼容旧布局",
	single: "单机",
	standard: "标准",
	long: "长玩",
	normal: "标准",
	hd: "高清",
	cover: "等比裁切填充",
	contain: "保留完整封面",
	perfect: "完美平台",
	official: "完美收录官匹",
	"5e": "5E"
}, ee = {
	steam: [["credential_steam_key", "Steam Web API Key"]],
	dota2: [["credential_opendota_key", "OpenDota Key（可选）"]],
	cs2: [["credential_perfect", "完美扫码授权"], ["credential_fivee", "5E 会话 Token"]]
}, _ = /* @__PURE__ */ new Map(), v = 4, y = 4096, b = 256;
function te(e, t, n) {
	for (let [n, r] of _) r.owner === e.owner && n !== t && _.delete(n);
	if (!n || t.length > y) return null;
	let r = _.get(t) || {
		owner: e.owner,
		drafts: /* @__PURE__ */ new Map(),
		token: null
	};
	for (r.token = Symbol("ordinary-draft-mount"), _.delete(t), _.set(t, r); _.size > v;) _.delete(_.keys().next().value);
	return r;
}
function x(e, t) {
	let n = e.ownerDocument, r = d(t.context), i = t.context.owner.startsWith("steam_dlc/") ? t.context.owner.slice(10) : "", a = l[i], o = a ? te(t.context, r, t.routeId === "settings") : null, s = o?.token, c = { ...t.context }, v = !1, y = !1, x = 0, S = !1, C = !1, w = null, T = !1, E = !1, D = null, O = 0, ne, k = null, A = null, j = !1, M = 0, re = [], ie = [], N = /* @__PURE__ */ new Map(), ae = () => {}, oe = 0, se = "", ce = 0, P = null, le = () => {}, F = new Map(o?.drafts), I = /* @__PURE__ */ new Map(), ue = [], L = (e, t, r) => {
		let i = n.createElement(e);
		return t !== void 0 && (i.textContent = t), r && (i.className = r), i;
	}, R = (e, t, n) => {
		e.addEventListener(t, n), ue.push(() => e.removeEventListener(t, n));
	}, z = L("section", void 0, "steam-dlc-page"), de = L("p", "", "steam-dlc-hint");
	de.setAttribute("role", "status");
	let B = L("p", "", "steam-dlc-message");
	B.setAttribute("role", "status"), B.setAttribute("aria-live", "polite"), z.append(de), e.replaceChildren(z);
	let V = () => !v && !y && !t.scope.signal.aborted && t.scope.isCurrent() && d(c) === r && (!o || _.get(r) === o && o.token === s), H = () => V() && c.available, fe = () => Object.freeze({
		ordinary: F.size > 0,
		credentials: V() && ([...N.values()].some((e) => !!e.input?.value) || k?.state === "waiting"),
		pending: S || T,
		version: oe
	}), pe = () => {
		let e = JSON.stringify([
			F.size > 0,
			S,
			ce,
			fe().credentials,
			T
		]);
		e !== se && (se = e, oe += 1, t.onNavigationStateChange?.());
	}, U = (e, t = "warning") => {
		P !== null && (clearTimeout(P), P = null), B.textContent = e, B.dataset.tone = t, e && t === "success" && (P = setTimeout(() => {
			P = null, V() && (B.textContent = "");
		}, 3500));
	}, me = () => {
		z.dataset.theme = c.theme, de.textContent = V() ? c.available ? "当前页面入口可用。运行健康请在模块管理中查看；此处不检测上游服务。" : "当前页面入口不可用，请在模块管理中刷新状态后重新进入。" : "页面上下文已失效，请重新进入本模块。";
	}, W, G, K, q, he = () => {
		o && V() && (o.drafts = new Map([...F].filter(([e, t]) => {
			let n = m[i]?.includes(e), r = t.rawValue ?? t.value;
			return n && (t.kind === "clear" || t.kind === "set" && [
				"string",
				"boolean",
				"number"
			].includes(typeof r) && !(typeof r == "number" && !Number.isFinite(r)) && !(typeof r == "string" && r.length > b));
		})));
	}, ge = () => {
		(o ? _.get(r) === o && o.token === s : t.routeId === "home") && _.delete(r), y = !0, x += 1, S = !1, C = !1, F.size && (ce += 1), F.clear(), w = null;
		for (let { control: e } of I.values()) e.value = "";
		O += 1, Z(), Me(), D = null, k = null, T = !1, E = !1;
	}, J = () => {
		if (he(), me(), z.setAttribute("aria-busy", String(S || T)), G) {
			G.setAttribute("aria-disabled", String(!H() || S || T || k?.state === "waiting" || !C || !F.size)), K.setAttribute("aria-disabled", String(!H() || S || T)), q.setAttribute("aria-disabled", String(!H() || S || T || !F.size));
			for (let { control: e, reset: t } of I.values()) e.disabled = !H() || !w, t.setAttribute("aria-disabled", String(!H() || !w));
		}
		Y && Y.setAttribute("aria-disabled", String(!H() || S)), ae(), pe();
	}, _e = [], ve = (e) => {
		if (!e || !Number.isSafeInteger(e.revision) || e.revision < 1 || !e.fields || !e.descriptors || (_e = (m[i] || []).filter((t) => e.fields[t] && e.descriptors[t]), !_e.includes("reply_theme") || i === "dota2" && !_e.includes("timezone"))) throw Error("invalid_snapshot");
		for (let t of _e) {
			let n = e.fields[t], r = e.descriptors[t];
			if (!n || !r || typeof r.description != "string" || t === "reply_theme" && (!Array.isArray(r.choices) || !r.choices.length || !r.choices.some((e) => e.value === null) || r.choices.some((e) => typeof e.label != "string" || e.value !== null && typeof e.value != "string")) || t === "timezone" && r.value_schema?.type !== "string" || t === "poster_include_apps" && (r.value_schema?.type !== "boolean" || typeof r.default != "boolean" || typeof n.value != "boolean") || t === "poster_limit" && (r.value_schema?.type !== "integer" || r.value_schema.minimum !== 1 || ![200, 1e3].includes(r.value_schema.maximum) || !Number.isInteger(r.default) || !Number.isInteger(n.value))) throw Error("invalid_snapshot");
		}
		return e;
	}, ye = (e) => {
		let t = F.get(e);
		return t ? t.kind === "clear" ? w.descriptors[e].default : t.value : w.fields[e].value;
	}, be = (e) => e === "poster_include_apps" ? [{
		value: !1,
		label: "仅游戏"
	}, {
		value: !0,
		label: "全部应用"
	}] : w.descriptors[e].value_schema?.type === "boolean" ? [{
		value: !1,
		label: "关闭"
	}, {
		value: !0,
		label: "开启"
	}] : w.descriptors[e].choices || w.descriptors[e].value_schema?.enum?.map((e) => ({
		value: e,
		label: g[e] || String(e)
	})), xe = (e) => !!be(e), Se = (e, t) => {
		if (!H() || !w) return;
		let n = w.fields[e], r = !S && (t.kind === "clear" ? !n.present : n.state === "valid" && u(n.value, t.value)) ? void 0 : t;
		if (u(F.get(e), r)) return;
		r === void 0 ? F.delete(e) : F.set(e, r), ce += 1, I.get(e).error.textContent = "", I.get(e).control.setAttribute("aria-invalid", "false");
		let i = F.size && (!o || [...F.values()].some((e) => e.kind === "set" && typeof (e.rawValue ?? e.value) == "string" && (e.rawValue ?? e.value).length > b));
		U(i ? "输入超过草稿保留上限，请先修正再切页。" : F.size ? "有未保存的修改。" : "", "warning"), J();
	}, Ce = () => {
		for (let [e, { control: t, error: n, hint: r }] of I) {
			r.textContent = w.descriptors[e].description;
			let i = ye(e);
			if (xe(e)) {
				let n = be(e);
				t.replaceChildren(...n.map((e, t) => {
					let n = L("option", e.label);
					return n.value = String(t), n;
				})), t.value = String(n.findIndex((e) => u(e.value, i)));
			} else t.value = F.get(e)?.rawValue === void 0 ? typeof i == "string" || typeof i == "number" ? String(i) : "" : F.get(e).rawValue;
			n.textContent = w.fields[e].state !== "valid" && !F.has(e) ? "当前配置无效，请修改或恢复默认后保存。" : "", t.setAttribute("aria-invalid", String(!!n.textContent));
		}
	}, we = () => {
		for (let e of _e) {
			let t = w.descriptors[e], n = L("div", void 0, "steam-dlc-field"), r = L("label", h[e] || e), a = L(xe(e) ? "select" : "input");
			a.className = "ui-control", a.id = `steam-dlc-${i}-${e}`, r.htmlFor = a.id, a.name = e;
			let o = L("p", t.description, "steam-dlc-hint");
			o.id = `${a.id}-hint`;
			let s = L("p", "", "steam-dlc-field-error");
			s.id = `${a.id}-error`, a.setAttribute("aria-describedby", `${o.id} ${s.id}`), e === "timezone" && (a.type = "text", a.autocomplete = "off", a.maxLength = Math.min(t.value_schema.maxLength ?? b, b)), t.value_schema?.type === "integer" && (a.type = "number", a.min = String(t.value_schema.minimum), a.max = String(t.value_schema.maximum), a.step = "1");
			let c = L("button", "恢复默认");
			c.className = "ui-button", c.type = "button", c.dataset.action = `reset-${e}`, R(c, "click", () => {
				H() && w && (Se(e, { kind: "clear" }), Ce());
			}), R(a, xe(e) ? "change" : "input", () => {
				if (H() && w) {
					if (xe(e)) {
						let t = be(e)[Number(a.value)];
						if (!t) return;
						Se(e, t.value === null ? { kind: "clear" } : {
							kind: "set",
							value: t.value
						});
					} else if (t.value_schema?.type === "integer") {
						let t = a.value;
						Se(e, e === "opendota_rph" && t === "" ? { kind: "clear" } : a.validity.valid && t !== "" ? {
							kind: "set",
							value: Number(t)
						} : {
							kind: "set",
							value: null,
							rawValue: t
						});
					} else Se(e, {
						kind: "set",
						value: a.value
					});
				}
			}), I.set(e, {
				control: a,
				reset: c,
				error: s,
				hint: o
			}), n.append(r, a, c, o, s), W.insertBefore(n, W.querySelector(".steam-dlc-actions"));
		}
	}, Te = (e) => {
		w = ve(e);
		for (let [e, t] of F) {
			let n = w.fields[e];
			(t.kind === "clear" ? !n.present : n.state === "valid" && u(n.value, t.value)) && (F.delete(e), ce += 1);
		}
		I.size || we(), Ce(), C = !0;
	}, Ee = async (e = !1) => {
		if (!H() || S || T) return;
		e && Me();
		let n = ++x;
		S = !0, J();
		try {
			if (!H() || n !== x) return;
			let r = await t.services.config.current();
			if (!H() || n !== x || (Te(r), await Pe(), !H() || n !== x)) return;
			U(F.size ? "已刷新；草稿已保留，请核对后保存。" : e ? "已刷新。" : "", F.size ? "warning" : "success");
		} catch (e) {
			if (!H() || n !== x) return;
			if (p.has(f(e))) {
				ge(), U("管理授权或模块上下文已失效，请重新进入页面。", "error"), J();
				return;
			}
			C = !1, U("配置读取未完成。请检查 Dashboard 授权与模块状态，再手动刷新。", "error");
		} finally {
			V() && n === x && (S = !1, J());
		}
	}, De = () => {
		let e = !0;
		for (let [t, n] of F) {
			if (n.kind === "clear") continue;
			let r = w.descriptors[t], i = "";
			if (t === "timezone") {
				let e = r.value_schema;
				if (typeof n.value != "string" || n.value.length < (e.minLength ?? 0) || n.value.length > (e.maxLength ?? Infinity)) i = "请输入符合长度要求的 IANA 时区。";
				else try {
					new Intl.DateTimeFormat("zh-CN", { timeZone: n.value }).format();
				} catch {
					i = "请输入有效的 IANA 时区，例如 Asia/Shanghai。";
				}
			} else if (r.value_schema?.type === "integer") {
				let e = r.value_schema;
				(n.rawValue !== void 0 || !Number.isInteger(n.value) || n.value < e.minimum || n.value > e.maximum) && (i = `请输入 ${e.minimum} 到 ${e.maximum} 之间的整数。`);
			} else xe(t) && !be(t).some((e) => u(e.value, n.value)) && (i = "请选择当前可用的选项。");
			I.get(t).error.textContent = i, I.get(t).control.setAttribute("aria-invalid", String(!!i)), i && (e = !1);
		}
		return I.has("poster_mode") && ye("poster_mode") === "legacy" && ye("poster_limit") > 200 && (I.get("poster_limit").error.textContent = "兼容旧布局最多支持 200 项，请调整数量或选择游戏生涯拼图。", I.get("poster_limit").control.setAttribute("aria-invalid", "true"), e = !1), e;
	}, Oe = async () => {
		if (!H() || S || T || k?.state === "waiting" || !C || !F.size || !De()) return;
		let e = new Map(F), n = {}, r = [];
		for (let [t, i] of e) i.kind === "clear" ? r.push(t) : n[t] = i.value;
		let i = w.revision, a = !1, o = ++x;
		S = !0, C = !1, U("正在保存，请等待确认。"), J();
		let s = (e) => {
			if (!e || !Number.isSafeInteger(e.revision) || e.revision <= i) throw Error("invalid_receipt");
			i = e.revision, a = !0;
		};
		try {
			if (!H() || o !== x) return;
			if (Object.keys(n).length) {
				let e = await t.services.config.save(i, n);
				if (!H() || o !== x) return;
				s(e);
			}
			if (r.length) {
				let e = await t.services.config.clear(i, r);
				if (!H() || o !== x) return;
				s(e);
			}
			let a = await t.services.config.current();
			if (!H() || o !== x) return;
			if (ve(a), a.revision < i) throw Error("unverified_snapshot");
			for (let [t, n] of e) {
				let e = a.fields[t];
				if (n.kind === "clear" ? e.present : e.state !== "valid" || !u(e.value, n.value)) throw Error("unverified_snapshot");
			}
			for (let [t, n] of e) F.get(t) === n && (F.delete(t), ce += 1);
			if (Te(a), await Pe(), !H() || o !== x) return;
			U(F.size ? "已保存本次提交；仍有新的未保存修改。" : "已保存。", F.size ? "warning" : "success");
		} catch (e) {
			if (!H() || o !== x) return;
			if (p.has(f(e))) {
				ge(), U("管理授权或模块上下文已失效，请重新进入页面。", "error"), J();
				return;
			}
			let t = f(e) === "revision_conflict";
			U(a ? "部分或全部修改已提交，状态暂未核实。请手动刷新并核对，不要重复提交。" : t ? "配置已被其他操作修改。草稿已保留，请手动刷新、核对后再保存。" : f(e) === "invalid_config" ? "配置未被接受。请检查字段，手动刷新并核对后再保存。" : "保存结果尚未确认。草稿已保留，请手动刷新并核对，不要重复提交。", "error");
		} finally {
			V() && o === x && (S = !1, J());
		}
	}, Y, ke, X = 0, Ae = (e) => {
		let t = e;
		if (!t || t.schema_version !== 1 || !["success", "partial_success"].includes(t.status) || t.privacy !== "public" || !t.document || !Array.isArray(t.document.blocks)) throw Error("invalid_cache_status");
		for (let e of t.document.blocks) {
			if (e?.kind !== "fields" || !e.fields || typeof e.fields != "object") continue;
			let t = e.fields.cache;
			if (t && Object.keys(t).sort().join(",") === "bytes,evictions,items,max_bytes,max_items" && !Object.values(t).some((e) => !Number.isSafeInteger(e) || e < 0)) return t;
		}
		throw Error("invalid_cache_status");
	}, je = async () => {
		if (!H() || S || !Y) return;
		let e = ++X;
		S = !0, J();
		try {
			let n = await t.services.invoke("wall_cache_status", {});
			if (!H() || e !== X) return;
			let r = Ae(n);
			ke.textContent = `缓存：${r.items} 项 / ${r.bytes} 字节；上限 ${r.max_items} 项 / ${r.max_bytes} 字节；已淘汰 ${r.evictions} 项。`, U("缓存状态已刷新。此操作只读取统计；重新验证封面请使用 --refresh。", "success");
		} catch {
			if (!H() || e !== X) return;
			ke.textContent = "缓存状态暂不可用。", U("读取缓存状态失败，请稍后重试。", "error");
		} finally {
			V() && e === X && (S = !1, J());
		}
	}, Me = () => {
		for (let e of N.values()) e.input && (e.input.value = "");
	}, Z = () => {
		A !== null && (clearTimeout(A), A = null), N.get("credential_perfect")?.qr?.removeAttribute("src");
	}, Ne = (e) => {
		p.has(f(e)) ? (ge(), U("管理授权或页面上下文已失效，请重新进入。", "error")) : f(e) === "operation_cancelled" ? U("已取消操作。") : (D = null, U(f(e) === "revision_conflict" ? "设置已被其他操作修改。凭据输入已清除，请刷新状态后重新操作。" : "操作未完成或结果未确认。凭据输入已清除，请刷新并核对状态。", "error"));
	}, Pe = async () => {
		if (!H() || !ee[i] || !t.services.credentials?.status) return;
		let e = O, n = x, r = await t.services.credentials.status();
		if (H() && e === O && n === x) {
			if (!r || !Number.isSafeInteger(r.revision) || r.revision < 1 || !r.fields) throw Error("invalid_credential_status");
			for (let [e] of ee[i]) {
				let t = r.fields[e];
				if (t && (typeof t.configured != "boolean" || typeof t.decryptable != "boolean" || t.upstream !== "unverified")) throw Error("invalid_credential_status");
			}
			D = r, ze(), ae();
		}
	}, Fe = async (e) => {
		let n = O;
		if (!e || !Number.isSafeInteger(e.revision) || e.revision <= D.revision) throw Error("invalid_receipt");
		let r = await t.services.config.current();
		if (H() && n === O) {
			if (r.revision < e.revision) throw Error("unverified_snapshot");
			Te(r), await Pe();
		}
	}, Ie = async (e, n) => {
		if (!H() || S || T || !D || k?.state === "waiting") return;
		let r = N.get(e).input?.value.trim();
		if (!n && (!r || r.length > 4096 || /[\x00-\x1f\x7f-\x9f]/u.test(r))) {
			U("请输入 1 到 4096 字符的有效 Key 或 Token。", "error");
			return;
		}
		let i = ++O;
		Me(), T = !0, J();
		try {
			let a = n ? await t.services.credentials.clear(D.revision, e) : await t.services.credentials.replace(D.revision, e, { token: r });
			if (!H() || i !== O || (await Fe(a), !H() || i !== O)) return;
			let o = D.fields[e];
			if (!o || o.configured === n) throw Error("unverified_snapshot");
			U(n ? "凭据已清除。" : "凭据已保存；有效性会在来源请求时验证。", "success");
		} catch (e) {
			H() && i === O && Ne(e);
		} finally {
			V() && i === O && (T = !1, J());
		}
	}, Le = (e) => {
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
	}, Re = () => {
		if (!H() || k?.state !== "waiting" || j) return;
		A !== null && clearTimeout(A);
		let e = k.expires_at * 1e3 - Date.now();
		if (e <= 0) {
			Z(), k = {
				...k,
				state: "expired"
			}, U("二维码已超时，请重新登录。"), J();
			return;
		}
		let t = Math.min(e, Math.max(250, k.next_poll_at * 1e3 - Date.now()));
		A = setTimeout(() => {
			A = null, Q("poll");
		}, t);
	}, Q = async (e) => {
		if (!H() || !D || e === "cancel" && (j = !0, Z(), J(), T) || S || T) return;
		e === "begin" && (Z(), k = null, j = !1);
		let n = ++O, r = k?.session_id || "", i = null;
		T = !0, E = !0, Me(), J();
		try {
			let a = await t.services.credentials.authorize(D.revision, "perfect_qr", e, r);
			if (!H() || n !== O) return;
			if (e === "qr") {
				if (typeof a.qr_png != "string" || a.qr_png.length > 5e5 || !/^iVBORw0KGgo[A-Za-z0-9+/=]*$/u.test(a.qr_png)) throw Error("invalid_qr_png");
				j || (N.get("credential_perfect").qr.src = `data:image/png;base64,${a.qr_png}`);
			} else {
				if (e === "revoke") {
					if (!a || Object.keys(a).sort().join(",") !== "receipt,revoked" || a.revoked !== !0 || !a.receipt) throw Error("invalid_revocation_receipt");
					k = null;
				} else k = Le(a.session);
				if (a.receipt && await Fe(a.receipt), !H() || n !== O) return;
				if (e === "revoke" && D?.fields.credential_perfect?.configured !== !1) throw Error("unverified_revocation");
				if (k?.state === "waiting") U(j ? "正在取消扫码。" : "请使用完美 App 扫码并亲自确认授权；留在本页等待结果。"), e === "begin" && (i = "qr");
				else {
					Z();
					let t = k?.state;
					U(t === "authorized" ? "完美授权已保存，玩家 Steam 绑定保持独立。" : e === "revoke" ? "完美授权已撤销。" : t === "expired" ? "二维码已过期，请重新登录。" : t === "cancelled" ? "扫码已取消。" : "授权会话已结束，请刷新状态。", t === "authorized" || e === "revoke" ? "success" : "warning"), j = !1;
				}
			}
		} catch (e) {
			H() && n === O && (Z(), k = null, j = !1, Ne(e));
		} finally {
			V() && n === O && (T = !1, E = !1, J(), j && k?.state === "waiting" ? Q("cancel") : i ? Q(i) : k?.state === "waiting" && Re());
		}
	}, ze = () => {
		let e = (ee[i] || []).filter(([e]) => D.fields[e]);
		if (e.length) {
			ne || (ne = L("section", void 0, "steam-dlc-credentials"), ne.append(L("h3", "来源凭据与授权"), L("p", "凭据只在可信管理入口提交。输入不保留为跨页草稿；已配置不代表上游已验证有效。", "steam-dlc-hint")), z.insertBefore(ne, B));
			for (let [t, n] of e) {
				if (N.has(t)) continue;
				let e = L("section", void 0, "steam-dlc-credential"), r = L("p", "", "steam-dlc-credential-status");
				r.setAttribute("role", "status");
				let i = L("div", void 0, "steam-dlc-actions"), a = {
					status: r,
					actions: i,
					buttons: []
				};
				e.append(L("h4", n), r);
				let o = (e, t, n) => {
					let r = L("button", t, "ui-button");
					return r.type = "button", r.dataset.action = e, R(r, "click", () => {
						r.getAttribute("aria-disabled") !== "true" && n();
					}), i.append(r), a.buttons.push(r), r;
				};
				if (t === "credential_perfect") a.qr = L("img", void 0, "steam-dlc-qr"), a.qr.alt = "完美登录二维码，仅供本次管理员授权", a.qr.setAttribute("referrerpolicy", "no-referrer"), e.append(a.qr), o("perfect-begin", "扫码登录 / 重新登录", () => {
					Q("begin");
				}), o("perfect-cancel", "取消扫码", () => {
					Q("cancel");
				}), o("perfect-poll", "检查扫码状态", () => {
					Q("poll");
				}), o("perfect-revoke", "撤销完美授权", () => {
					Q("revoke");
				});
				else {
					let r = L("input");
					r.type = "password", r.className = "ui-control", r.id = `steam-dlc-${t}`, r.name = t, r.maxLength = 4096, r.autocomplete = "new-password", r.spellcheck = !1, r.setAttribute("aria-label", n), a.input = r, e.append(r), R(r, "input", J), o(`replace-${t}`, "保存凭据", () => {
						Ie(t, !1);
					}), o(`clear-${t}`, "清除凭据", () => {
						Ie(t, !0);
					});
				}
				e.append(i), N.set(t, a), ne.append(e);
			}
			ae = () => {
				for (let [e, t] of N) {
					let n = D?.fields[e];
					t.status.textContent = n ? n.configured ? n.decryptable ? "已配置；上游有效性尚未验证。" : "已配置，但当前无法解密，请检查服务密钥后重新设置。" : "未配置。" : "状态待刷新。", e === "credential_perfect" && k && (t.status.textContent += ` 当前扫码：${k.state}。`), t.input && (t.input.disabled = !H() || S || T || k?.state === "waiting");
					for (let e of t.buttons) {
						let t = e.dataset.action, n = t === "perfect-cancel", r = !H() || !D || (n ? k?.state !== "waiting" && !E : S || T || t === "perfect-poll" && k?.state !== "waiting" || k?.state === "waiting" && !t.startsWith("perfect-"));
						e.setAttribute("aria-disabled", String(r));
					}
				}
			};
		}
	}, Be = () => {
		let e = n.defaultView?.URL || URL;
		for (let t of re.splice(0)) e.revokeObjectURL(t);
	}, $ = (e, n, r, a, o = "") => {
		let s = L("div", void 0, "steam-dlc-public-field"), c = L("label", r), l = L(a ? "select" : "input");
		return l.id = `steam-dlc-${i}-${t.routeId}-${n}`, l.name = n, l.className = "ui-control", c.htmlFor = l.id, a ? l.append(...a.map((e) => {
			let t = L("option", g[e] || e);
			return t.value = e, t;
		})) : (l.type = "text", l.maxLength = 128, l.autocomplete = "off"), l.value = o, s.append(c, l), e.append(s), ie.push(l), l;
	}, Ve = (e, t) => {
		if (!e || e.schema_version !== 1 || ![
			"success",
			"partial_success",
			"error"
		].includes(e.status)) throw Error("invalid_result");
		if (t.replaceChildren(), e.status === "error") return t.append(L("p", typeof e.error?.message == "string" ? e.error.message : "来源未返回可用结果。", "steam-dlc-field-error")), !1;
		if (!e.document || !Array.isArray(e.document.blocks)) throw Error("invalid_result");
		for (let n of e.document.blocks) {
			if (n?.kind === "text" && typeof n.text == "string" && t.append(L("p", n.text)), n?.kind === "table" && Array.isArray(n.columns) && Array.isArray(n.rows)) {
				let e = L("div", void 0, "steam-dlc-table"), r = L("table"), i = L("tr");
				i.append(...n.columns.map((e) => L("th", String(e)))), r.append(i);
				for (let e of n.rows) {
					if (!Array.isArray(e)) continue;
					let t = L("tr");
					t.append(...e.map((e) => L("td", e === null ? "未知" : String(typeof e == "object" ? e.value ?? "" : e)))), r.append(t);
				}
				e.append(r), t.append(e);
			}
			let e = n?.kind === "fields" ? n.fields?.cs2 : null;
			if (Array.isArray(e?.sources)) {
				let n = L("dl", void 0, "steam-dlc-source-status");
				for (let t of e.sources) n.append(L("dt", g[t.platform] || t.platform), L("dd", t.credential_state === "configured" ? "凭据已配置；查询时验证上游有效性。" : "需要在可信设置页授权。"));
				t.append(n);
			} else e?.data && e.fetched_at && t.append(L("p", `采样：${e.fetched_at}${e.season ? ` · 赛季 ${e.season}` : ""}`, "steam-dlc-hint"));
		}
		for (let n of e.warnings || []) typeof n == "string" && t.append(L("p", n, "steam-dlc-hint"));
		return !0;
	}, He = (e) => {
		let r = L("form", void 0, "steam-dlc-public-form"), i = L("section", void 0, "steam-dlc-public-result");
		i.setAttribute("aria-live", "polite");
		let a = $(r, "account", e ? "SteamID64（明确账号）" : "玩家账号（SteamID64 / 5E domain）");
		a.required = !0;
		let o, s, c, l, u, d, f = {};
		if (e) {
			for (let [e, t, n, i] of [
				[
					"source",
					"来源",
					[
						"games",
						"recent",
						"full"
					],
					"games"
				],
				[
					"mode",
					"布局",
					["dense", "legacy"],
					"dense"
				],
				[
					"preset",
					"时长预设",
					[
						"single",
						"standard",
						"long"
					],
					"standard"
				],
				[
					"aspect",
					"比例",
					[
						"2:3",
						"9:16",
						"1:2"
					],
					"2:3"
				],
				[
					"quality",
					"清晰度",
					["normal", "hd"],
					"normal"
				],
				[
					"fit",
					"封面适配",
					["cover", "contain"],
					"cover"
				]
			]) f[e] = $(r, e, t, n, i);
			f.all_apps = $(r, "all_apps", "包含软件等全部应用", ["true", "false"], "true"), f.all_apps.options[0].textContent = "包含", f.all_apps.options[1].textContent = "仅游戏", c = $(r, "limit", "作品数量上限", null, "500"), c.type = "number", c.min = "1", c.max = "1000", c.step = "1", z.append(L("p", "公开样本不代表完整库。full 需要已配置的 Steam Key；过大输出会受预算限制。生成后可逐页下载原始 PNG。", "steam-dlc-hint"));
		} else {
			o = $(r, "action", "查询类型", [
				"profile",
				"recent",
				"stats",
				"last",
				"match"
			], "profile"), s = $(r, "platform", "来源", [
				"perfect",
				"official",
				"5e"
			], "perfect"), l = $(r, "season", "赛季（可选）"), c = $(r, "limit", "近期展示数量", null, "5"), c.type = "number", c.min = "1", c.max = "20", c.step = "1", u = $(r, "match_id", "来源比赛 ID"), d = $(r, "focus", "单场焦点账号（可选）");
			let e = () => {
				l.disabled = !["profile", "stats"].includes(o.value), c.disabled = o.value !== "recent", u.disabled = o.value !== "match", d.disabled = o.value !== "match", u.required = o.value === "match";
			};
			R(o, "change", e), e(), z.append(L("p", "页面查询始终需要明确账号，不读取本人默认绑定。5E 使用 domain；官匹与 5E 单场仅限来源近期玩家摘要。", "steam-dlc-hint"));
		}
		let p = L("button", e ? "生成拼图" : "查询", "ui-button");
		p.type = "submit", p.dataset.variant = "primary", p.dataset.action = e ? "generate" : "query";
		let m = L("div", void 0, "steam-dlc-actions");
		m.append(p), r.append(m);
		let h = async (m) => {
			if (!H() || S) return;
			let h = m ? {} : { account: a.value.trim() };
			if (!m && (!h.account || !r.checkValidity())) {
				U("请填写明确账号并检查输入范围。", "error");
				return;
			}
			if (!m && e) {
				if (Object.assign(h, Object.fromEntries(Object.entries(f).map(([e, t]) => [e, e === "all_apps" ? t.value === "true" : t.value]))), h.limit = Number(c.value), h.mode === "legacy" && h.limit > 200) {
					U("兼容旧布局最多 200 项，请调整数量或选择游戏生涯拼图。", "error");
					return;
				}
			} else m || (Object.assign(h, {
				action: o.value,
				platform: s.value
			}), !l.disabled && l.value.trim() && (h.season = l.value.trim()), c.disabled || (h.limit = Number(c.value)), u.disabled || (h.match_id = u.value.trim()), !d.disabled && d.value.trim() && (h.focus = d.value.trim()));
			let g = ++M;
			S = !0, Be(), i.replaceChildren(L("p", e ? "正在生成拼图，请等待。" : "正在查询来源。")), J(), p.setAttribute("aria-disabled", "true");
			try {
				let r = e ? await t.services.preview("wall_preview", h) : await t.services.invoke("query", h);
				if (!H() || g !== M) return;
				let a = Ve(r, i);
				if (e && a) {
					if (!Array.isArray(r.images) || !r.images.length || r.images.length > 8) throw Error("invalid_images");
					let e = 0;
					for (let [t, a] of r.images.entries()) {
						if (a.media_type !== "image/png" || typeof a.base64 != "string" || a.base64.length > 24e6 || !/^[A-Za-z0-9+/]*={0,2}$/u.test(a.base64)) throw Error("invalid_images");
						let o = n.defaultView.atob(a.base64);
						if (e += o.length, e > 16777216 || !o.startsWith("PNG\r\n\n")) throw Error("invalid_images");
						let s = Uint8Array.from(o, (e) => e.charCodeAt(0)), c = new n.defaultView.Blob([s], { type: "image/png" }), l = n.defaultView.URL.createObjectURL(c);
						re.push(l);
						let u = L("figure", void 0, "steam-dlc-preview"), d = L("img");
						d.src = l, d.alt = `游戏生涯拼图第 ${t + 1} / ${r.images.length} 页`;
						let f = L("a", `下载第 ${t + 1} 页 PNG`, "ui-button");
						f.href = l, f.download = `steam-career-${String(t + 1).padStart(2, "0")}.png`, u.append(d, f), i.append(u);
					}
				}
				U(a ? e ? "拼图已生成，可逐页下载。" : "来源结果已更新。" : "查询未完成，请查看来源反馈。", a ? "success" : "warning");
			} catch {
				if (!H() || g !== M) return;
				Be(), i.replaceChildren(L("p", "请求未完成，或返回内容不完整。请核对来源设置后重试。", "steam-dlc-field-error")), U("未取得可确认结果。", "error");
			} finally {
				V() && g === M && (S = !1, p.setAttribute("aria-disabled", String(!H())), J());
			}
		};
		if (R(r, "submit", (e) => {
			e.preventDefault(), h(!1);
		}), !e) {
			let e = L("button", "刷新来源状态", "ui-button");
			e.type = "button", e.dataset.action = "query-status", R(e, "click", () => {
				h(!0);
			}), m.append(e);
		}
		z.append(r, i), e || h(!0);
	};
	if (a && t.routeId === "home") {
		if (z.append(L("p", a.summary)), i !== "steam") {
			let e = L("section", void 0, "steam-dlc-source-panel"), n = L("button", "刷新来源状态", "ui-button");
			n.type = "button", n.dataset.action = "refresh-status";
			let r = async () => {
				if (!H() || S) return;
				let r = ++M;
				S = !0, J(), n.setAttribute("aria-disabled", "true");
				try {
					let n = await t.services.invoke("status", {});
					if (!H() || r !== M) return;
					Ve(n, e);
				} catch {
					H() && r === M && e.replaceChildren(L("p", "来源状态读取失败，请稍后刷新。", "steam-dlc-field-error"));
				} finally {
					V() && r === M && (S = !1, n.setAttribute("aria-disabled", String(!H())), J());
				}
			};
			R(n, "click", () => {
				r();
			}), z.append(e, n), r();
		}
		z.append(L("h3", "命令帮助"));
		let e = L("dl", void 0, "steam-dlc-help");
		for (let [t, n] of a.commands) {
			let r = L("dt");
			r.append(L("code", t)), e.append(r, L("dd", n));
		}
		z.append(e), i === "steam" && (z.append(L("h3", "时长海报墙")), z.append(L("p", "游戏生涯拼图用累计小时映射每张作品的目标面积，提供单机、标准和长玩预设。大图跨行、小图填空，封面保持纵向比例；旧布局可以显式选择。未知时长不补零。", "steam-dlc-hint")), z.append(L("p", "games 与 recent 是不同公开样本；full 需要可选 Steam Key。选择来源不会自动把样本当成完整库。默认纵向 2:3，可切换 9:16 或 1:2；作品数量和输出预算共同约束分页，兼容旧布局最多 200 项。包含全部应用会纳入软件，旧设置中的关闭值继续保留。", "steam-dlc-hint")), ke = L("p", "尚未读取缓存状态。", "steam-dlc-cache-value"), Y = L("button", "刷新缓存状态"), Y.className = "ui-button", Y.type = "button", Y.dataset.action = "refresh-cache", R(Y, "click", () => {
			je();
		}), z.append(ke, Y)), i === "dota2" && z.append(L("p", "账号可用 Dota ID32 或 SteamID64。订阅创建、查看和取消使用当前群或私聊中的命令；页面不伪造聊天身份。OpenDota Key 可选，匿名与有 Key 都遵守同一每小时预算；模型短评失败不会阻止基础通知。", "steam-dlc-hint"));
	} else if (a && t.routeId === "settings") {
		W = L("form"), R(W, "submit", (e) => {
			e.preventDefault(), Oe();
		});
		let e = L("div", void 0, "steam-dlc-actions");
		G = L("button", "保存修改"), G.className = "ui-button", G.dataset.variant = "primary", G.type = "submit", G.dataset.action = "save", K = L("button", "刷新配置"), K.className = "ui-button", K.type = "button", K.dataset.action = "refresh", q = L("button", "放弃本模块修改"), q.className = "ui-button", q.type = "button", q.dataset.action = "discard", R(K, "click", () => {
			Ee(!0);
		}), R(q, "click", () => {
			H() && !S && w && (F.size && (ce += 1), F.clear(), Ce(), U("已放弃本模块修改。", "success"), J());
		}), e.append(G, K, q), z.append(W), W.append(e), z.append(L("p", "回复主题中的“跟随核心”清除模块覆盖值。恢复默认先形成草稿，保存后生效。", "steam-dlc-hint"));
	} else i === "cs2" && t.routeId === "query" ? He(!1) : i === "steam" && t.routeId === "collage" ? He(!0) : z.append(L("p", "该页面入口未声明，请返回模块列表重新进入。"));
	z.append(B);
	let Ue = () => {
		v || (v = !0, x += 1, X += 1, O += 1, M += 1, S = !1, Be(), ie.forEach((e) => {
			e.value = "";
		}), Z(), Me(), k = null, D = null, T = !1, E = !1, P !== null && (clearTimeout(P), P = null), F.clear(), w = null, ue.splice(0).forEach((e) => e()), le(), z.remove());
	};
	return t.scope.signal.addEventListener("abort", Ue, { once: !0 }), ue.push(() => t.scope.signal.removeEventListener("abort", Ue)), le = t.scope.onDispose(Ue), J(), W && Ee(), Y && je(), {
		update(e) {
			if (v || y) return;
			let t = c.available;
			c = { ...e }, d(c) === r ? t !== c.available && (M += 1, Be(), O += 1, Z(), Me(), k = null, T = !1, E = !1, X += 1, x += 1, S = !1, C = !1, U("页面可用状态已变化，请核对刷新后的配置。")) : (M += 1, Be(), ie.forEach((e) => {
				e.value = "";
			}), ge(), U("模块运行上下文已变化，请重新进入页面。", "error")), J();
		},
		dispose: Ue,
		navigationImpact: fe
	};
}
//#endregion
//#region packages/steam_dlc/pages/src/entry.js
function S(u, d) {
	let f = n({ ...d.context }), p = d.context.owner.startsWith("steam_dlc/") ? d.context.owner.slice(10) : "", m = l[p], h = d.routeId === "settings", g = d.routeId === "collage" ? "游戏生涯拼图" : d.routeId === "query" ? "平台查询" : "", ee, _, v = !1, y = () => {}, b = e({ setup: () => () => t(c, {
		theme: f.value.theme,
		locale: f.value.locale,
		styleMountTarget: u
	}, { default: () => t("section", {
		class: "steam-dlc-view",
		lang: f.value.locale
	}, [t(r, {
		title: m ? `${m.title}${h ? " 设置" : g ? ` ${g}` : ""}` : "模块页面不可用",
		eyebrow: "YOMIHIME GAME LINK / STEAM DLC",
		subtitle: h ? "维护查询、输出设置与来源授权。" : m?.summary
	}), t(a, {}, {
		default: () => t(i, {
			title: h ? "模块设置与来源" : g || "命令与可用状态",
			number: "01"
		}, { default: () => t("div", { ref: (e) => {
			ee = e;
		} }) }),
		aside: () => t(s, { title: h ? "设置说明" : "数据与账号" }, { default: () => [t(o, {}, { default: () => h ? p === "steam" ? "选择公开样本或完整库、布局、时长预设、比例和输出预算。完整库需要可选 Steam Key；是否完整以来源实际返回为准。" : p === "cs2" ? "完美授权与 5E Token 仅用于来源请求，玩家查询目标保持独立。二维码需由账号本人亲自确认；离页将停止轮询。" : p === "dota2" ? "订阅设置控制当前服务的采集与预算；具体群或私聊订阅通过本人命令管理。OpenDota Key 可选，不会自动扩大请求额度。" : "网页浅深主题与命令图片回复主题分别设置。回复主题选项由当前授权配置提供。" : m?.source || "当前页面没有可用的模块声明。" }), t("p", { class: "steam-dlc-hint" }, h ? "保存后会重新读取并核对结果；冲突或未确认结果需要手动刷新。" : "默认账号只在已授权的命令路径使用。自然语言工具必须提供明确账号或比赛编号。")] })
	})]) }) });
	b.mount(u), _ = x(ee, {
		...d,
		scope: {
			signal: d.scope.signal,
			isCurrent: () => d.scope.isCurrent(),
			onDispose: () => () => {}
		}
	});
	let te = () => {
		v || (v = !0, _.dispose(), b.unmount(), y());
	};
	return y = d.scope.onDispose(te), {
		update(e) {
			v || (_.update(e), f.value = { ...e });
		},
		dispose: te,
		navigationImpact: _.navigationImpact
	};
}
//#endregion
export { S as mount };
