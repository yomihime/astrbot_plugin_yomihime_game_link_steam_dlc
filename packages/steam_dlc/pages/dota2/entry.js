import { createApp as e, h as t, shallowRef as n } from "../../../../../../../runtime.js";
import { ActionBar as r, FormField as i, FormGrid as a, PageHeader as o, SettingsGroup as s, SettingsLayout as c, StatusHint as l, Surface as u, UiProvider as d } from "../../../../../../../runtime.js";
//#region packages/steam_dlc/pages/src/job-controller.js
function f(e, { options: t, active: n, field: r, parseLimit: i, validatePNG: a, say: o }) {
	let s = e.ownerDocument, c = [], l = [], u = !1, d = !1, f = null, p = 0, m = 0, h = null, g = null, _ = !1, v = null, y = 0, b = () => !u && !d && n(), x = (e) => b() && e === p, S = /* @__PURE__ */ new Set([
		"admin_authorization_denied",
		"page_revoked",
		"page_unavailable",
		"stale_context"
	]), C = (e) => Object.assign(Error(e), { publicMessage: e }), w = (e) => e?.publicMessage || "任务操作未完成，请刷新任务并核对。", T = (e, t) => {
		let n = s.createElement(e);
		return t !== void 0 && (n.textContent = t), n;
	}, E = (e, t, n) => {
		e.addEventListener(t, n), l.push(() => e.removeEventListener(t, n));
	}, D = () => {
		f !== null && (clearTimeout(f), f = null);
	}, ee = () => {
		for (let e of c.splice(0)) s.defaultView.URL.revokeObjectURL(e);
	}, O = () => {
		if (!t.services.jobs) throw C("任务服务暂不可用，请刷新模块。");
		return t.services.jobs;
	}, k = T("form");
	k.className = "steam-dlc-public-form";
	let te = t.presentation?.grid(k) || k, A = r(te, "account", "SteamID64 / Dota ID32（明确账号）"), j = {};
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
		],
		[
			"limit_mode",
			"数量模式",
			["top", "all"],
			"top"
		],
		[
			"all_apps",
			"应用筛选",
			["true", "false"],
			"true"
		]
	]) j[e] = r(te, e, t, n, i);
	j.all_apps.options[0].textContent = "全部应用", j.all_apps.options[1].textContent = "仅游戏";
	let M = r(te, "limit", "数量（至少20，可手填超过1000）", null, "500");
	M.inputMode = "decimal";
	let ne = T("div");
	ne.className = "steam-dlc-actions";
	let re = T("div");
	re.className = "steam-dlc-actions";
	let N = (e, t, n, r = ne) => {
		let i = T("button", t);
		return i.type = "button", i.className = "ui-button", i.dataset.action = e, E(i, "click", () => {
			if (!b() || _) return;
			let e = p, t = (t) => le(t, e);
			try {
				let r = n();
				e = p, r && typeof r.then == "function" && (_ = !0, V(), r.catch(t).finally(() => {
					x(e) && (_ = !1, V());
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
	]) N(`limit-${e}`, e === "all" ? "不限" : String(e), () => {
		j.limit_mode.value = e === "all" ? "all" : "top", M.disabled = e === "all", e !== "all" && (M.value = String(e));
	});
	E(j.limit_mode, "change", () => {
		M.disabled = j.limit_mode.value === "all";
	});
	let P = T("button", "提交拼图任务");
	P.type = "submit", P.className = "ui-button", P.dataset.action = "generate", P.dataset.variant = "primary", ne.append(P);
	let F = T("h3", "任务状态与恢复"), I = t.presentation?.grid(k) || k, L = I === k ? null : k.lastElementChild, R = r(I, "job_id", "任务ID（刷新后自动恢复）"), z = T("div", "尚未提交任务。");
	z.className = "steam-dlc-job-status", z.setAttribute("role", "status");
	let B = T("section");
	B.className = "steam-dlc-public-result";
	let V = () => {
		let e = !b();
		k.setAttribute("aria-busy", String(_));
		for (let t of k.querySelectorAll("button")) t.disabled = e || _;
		for (let t of k.querySelectorAll("input,select")) t.disabled = e;
		M.disabled = e || j.limit_mode.value === "all", se.disabled = e || _ || !["queued", "running"].includes(h?.status), ue.disabled = e || _ || ![
			"failed",
			"cancelled",
			"interrupted"
		].includes(h?.status), ue.hidden = ![
			"failed",
			"cancelled",
			"interrupted"
		].includes(h?.status), se.hidden = !["queued", "running"].includes(h?.status), U.disabled = e || _ || !g;
	}, ie = `ygl:job:${t.context.owner}:${t.routeId}`, ae = (e) => {
		if (!e || typeof e.job_id != "string" || !Number.isSafeInteger(e.revision) || ![
			"queued",
			"running",
			"succeeded",
			"failed",
			"cancelled",
			"interrupted"
		].includes(e.status)) throw C("任务状态无法验证。");
		h = e, R.value = h.job_id;
		try {
			s.defaultView.sessionStorage.setItem(ie, h.job_id);
		} catch {}
		let t = h.progress || {}, n = h.summary || {}, r = {
			steam_key_required: "完整库需要在可信管理页配置Steam Key，可改选公开样本。",
			steam_source_unavailable: "Steam来源暂不可用，请核对来源状态；未用其他来源替代。",
			steam_source_access_denied: "Steam来源拒绝访问，请检查可信管理页的Steam配置、来源授权与目标公开或访问范围；未视为空库。",
			steam_source_not_public: "Steam库未公开或当前来源授权受限，请核对公开设置与来源授权；未视为空库。",
			rate_limited: "来源限流，已停止后续批次；请等待来源恢复。",
			resource_budget: "资源预算不足，已停止后续批次；可减少数量或降低清晰度后重新提交。",
			metadata_incomplete: "部分作品类型尚未验证，无法完成仅游戏筛选；未视为空库。"
		}, i = {
			queued: "排队中",
			running: "执行中",
			succeeded: "已完成",
			failed: "失败",
			cancelled: "已取消",
			interrupted: "已中断"
		}, a = n.reason ?? t.reason ?? h.error_code, o = r[a] || (a || h.status === "failed" ? "任务未完成，原因暂不可确认；请刷新状态并核对来源与设置。" : ""), c = n.retry_after ?? t.retry_after, l = Number.isSafeInteger(c) && c >= 0 && c <= 86400, u = n.result_entries ?? t.result_entries;
		Number.isSafeInteger(u) && u >= 0 && (y = Math.max(y, u));
		let d = (e) => Number.isSafeInteger(e) && e >= 0 ? String(e) : "待确认", f = [
			`来源${d(n.source_returned ?? t.source_returned)}`,
			`${(n.eligible_complete ?? t.eligible_complete) === !1 ? "已确认符合" : "符合"}${d(n.eligible ?? t.eligible)}`,
			`已选${d(n.selected ?? t.selected)}`,
			`已生成${d(n.generated ?? t.generated)}`,
			`待处理${d(n.pending ?? t.pending)}`,
			`缺图${d(n.missing_images ?? t.missing_images)}`
		], p = [], m = n.metadata_unexamined ?? t.metadata_unexamined, g = [
			"examined",
			"unexamined",
			"classification_unknown"
		].map((e) => n[e] ?? t[e]), _ = n.metadata_failures ?? n.counters?.metadata_failed ?? t.counters?.metadata_failed ?? 0;
		(n.complete_source ?? t.complete_source) === !1 && p.push("来源覆盖不完整"), g.some((e) => e !== void 0) ? p.push(`已检查${d(g[0])}项 · 未检查${d(g[1])}项 · 已检查中类型未知${d(g[2])}项`) : m && p.push(`类型尚未验证${m}项（未区分未检查与已检查但类型未知）`), n.selection_exact === !0 && n.all_apps === !1 && p.push(`选集排序已验证${Number.isSafeInteger(g[1]) && g[1] > 0 ? "，剩余未检查" : ""}`), _ && p.push(`元数据请求失败${_}次`);
		let v = [];
		["queued", "running"].includes(h.status) ? v.push("可刷新状态或取消任务；排队或执行中不能重试。") : [
			"failed",
			"cancelled",
			"interrupted"
		].includes(h.status) && v.push("核对条件后可稍后重试，显式重新执行并复用有效缓存；不会从最后一项自动断点续跑。"), y > 0 && v.push(`已发布图片资源${y}项，可点击“查询结果页”或使用 /ygl steam wall result ${h.job_id} 查看。`);
		let b = [T("p", `任务 ${h.job_id} · ${i[h.status]}`), T("p", f.join(" · "))];
		o && b.push(T("p", o)), a === "rate_limited" && l && b.push(T("p", `来源建议等待${c}秒后再试（非自动重试或倒计时）。`)), p.length && b.push(T("p", p.join(" · "))), v.length && b.push(T("p", v.join(" "))), z.replaceChildren(...b), V();
	}, oe = async (e) => {
		if (!h || !b()) return;
		let t = p, n = ++m, r = h.job_id, i = await O().result(r, {
			cursor: e,
			page_size: 20
		});
		if (x(t) && n === m && h?.job_id === r) {
			if (!Array.isArray(i.entries) || i.entries.length > 20) throw C("任务结果范围无法验证。");
			if (i.entries.some((e) => e?.resource?.media_type !== "image/png" || typeof e.resource.asset_id != "string" || !e.resource.asset_id)) throw C("任务资源无法验证。");
			i.entries.length && (y = Math.max(y, i.entries.length), ae(h)), ee(), B.replaceChildren(), g = i.next_cursor || null;
			for (let [e, o] of i.entries.entries()) {
				let i = await O().resource(r, o.resource.asset_id);
				if (!x(t) || n !== m || h?.job_id !== r) return;
				if (i?.type !== "image/png" || typeof i.arrayBuffer != "function" || i.size > 16777216) throw C("图片资源无法验证。");
				if (a(new Uint8Array(await i.arrayBuffer())), !x(t) || n !== m || h?.job_id !== r) return;
				let l = s.defaultView.URL.createObjectURL(i);
				c.push(l);
				let u = T("figure"), d = T("img"), f = T("a", "下载原始 PNG");
				u.className = "steam-dlc-preview", d.src = l, d.alt = `批次${Number(o.metadata?.batch_index ?? 0) + 1} · 图片${e + 1}`, f.href = l, f.className = "ui-button", f.download = `steam-career-${o.metadata?.batch_index ?? 0}-${e + 1}.png`, u.append(d, f), B.append(u);
			}
			i.entries.length || B.append(T("p", "当前没有已完成结果页。")), V();
		}
	}, H = async () => {
		if (D(), !h || !b()) return;
		let e = p, t = h.job_id;
		try {
			let n = await O().status(t);
			if (!x(e) || h?.job_id !== t) return;
			ae(n), ["queued", "running"].includes(h.status) ? f = setTimeout(() => {
				H();
			}, 1500) : await oe(null);
		} catch (t) {
			le(t, e);
		}
	}, se = N("job-cancel", "取消任务", async () => {
		if (!h || !["queued", "running"].includes(h.status)) return;
		D();
		let e = ++p, t = await O().cancel(h.job_id, h.revision);
		x(e) && (ae(t), await H());
	}, re), ce = () => {
		m += 1, y = 0, g = null, ee(), B.replaceChildren();
	}, le = (e, t) => {
		if (x(t)) {
			if (!S.has(e?.message)) {
				o(w(e), "error");
				return;
			}
			d = !0, p += 1, D(), ce(), _ = !1, v = null, h = null, R.value = "", A.value = "";
			try {
				s.defaultView.sessionStorage.removeItem(ie);
			} catch {}
			z.textContent = "任务页面授权或运行上下文已失效，请重新进入页面。", o("页面授权或运行上下文已变化，请重新进入页面。", "error"), V();
		}
	}, ue = N("job-retry", "重新执行（复用有效缓存）", async () => {
		if (!h || ![
			"failed",
			"cancelled",
			"interrupted"
		].includes(h.status)) return;
		D(), ce();
		let e = ++p, t = await O().retry(h.job_id, h.revision);
		x(e) && (ae(t), await H());
	}, re), U = N("job-next", "下一页结果", async () => {
		g && await oe(g);
	}, re);
	U.disabled = !0, N("job-results", "查询结果页", async () => {
		await oe(null);
	}, re), N("job-refresh", "恢复 / 刷新任务", async () => {
		R.value.trim() && (D(), ce(), p += 1, h = { job_id: R.value.trim() }, await H());
	}, re), se.disabled = !0, ue.disabled = !0, E(k, "submit", (e) => {
		e.preventDefault(), b() && !_ && (async () => {
			let e = ++p;
			D(), ce();
			try {
				let t = Object.fromEntries(Object.entries(j).map(([e, t]) => [e, e === "all_apps" ? t.value === "true" : t.value]));
				if (t.account = A.value.trim(), !t.account) throw C("请提供明确账号。");
				if (/^[0-9]+$/u.test(t.account)) {
					let e = BigInt(t.account);
					t.account = String(e < 4294967296n ? e + 76561197960265728n : e);
				}
				try {
					t.limit = t.limit_mode === "all" ? 500 : i(M.value);
				} catch (e) {
					throw C(e.message);
				}
				if (t.mode === "legacy" && (t.limit > 200 || t.limit_mode === "all")) throw C("兼容旧布局最多200项。");
				_ = !0, V();
				let n = JSON.stringify(t);
				(!v || v.fingerprint !== n) && (v = {
					fingerprint: n,
					key: s.defaultView.crypto.randomUUID()
				});
				let r = await O().submit({
					handler_id: "steam_wall",
					parameters: t,
					idempotency_key: v.key
				});
				if (!x(e)) return;
				ae(r), v = null, o("任务已提交，关闭页面只停止轮询。", "success"), await H();
			} catch (t) {
				le(t, e);
			} finally {
				x(e) && (_ = !1, V());
			}
		})();
	}), k.insertBefore(ne, L), k.insertBefore(F, L), k.append(re), e.append(T("p", "不限覆盖来源实际返回范围。每批有资源预算，已完成页保留；关闭页面只停止轮询，取消需明确点击。"), T("h3", "创建拼图任务"), k, z, B), t.presentation?.actions(ne), t.presentation?.actions(re), V();
	try {
		let e = s.defaultView.sessionStorage.getItem(ie);
		e && (R.value = e, h = { job_id: e }, H());
	} catch {}
	return {
		setAvailable(e) {
			u || d || (p += 1, ce(), D(), _ = !1, v = null, h = null, g = null, z.textContent = e ? "页面已恢复，请手动恢复 / 刷新任务，或提交新任务。" : "任务页面暂不可用，已停止轮询；任务ID保留供恢复后查询。", V());
		},
		dispose() {
			u || (u = !0, p += 1, m += 1, _ = !1, v = null, D(), ee(), B.replaceChildren(), z.textContent = "任务页面上下文已变化，请重新进入。", V(), l.splice(0).forEach((e) => e()));
		}
	};
}
//#endregion
//#region packages/steam_dlc/pages/src/wishlist-controller.js
function p(e, { options: t, active: n, field: r, say: i }) {
	let a = e.ownerDocument, o = [], s = 0, c = !1, l = !1, u = 1, d = 1, f = (e) => Object.assign(Error(e), { publicMessage: e }), p = (e, t) => {
		let n = a.createElement(e);
		return t !== void 0 && (n.textContent = t), n;
	}, m = (e, t, n) => {
		e.addEventListener(t, n), o.push(() => e.removeEventListener(t, n));
	}, h = p("form"), g = t.presentation?.grid(h) || h, _ = r(g, "account", "SteamID64 / Dota ID32（明确账号）"), v = r(g, "country", "地区", null, "CN"), y = r(g, "language", "Steam语言", null, "schinese"), b = p("div");
	b.className = "steam-dlc-actions";
	let x = p("button", "读取愿望单");
	x.type = "submit", x.className = "ui-button", x.dataset.action = "wishlist-query";
	let S = p("button", "上一页"), C = p("button", "下一页");
	for (let [e, t] of [[S, "wishlist-previous"], [C, "wishlist-next"]]) e.type = "button", e.className = "ui-button", e.dataset.action = t, e.disabled = !0;
	b.append(x, S, C), h.append(b);
	let w = p("section");
	w.className = "steam-dlc-public-result", w.setAttribute("aria-live", "polite");
	let T = () => {
		x.disabled = c || !n() || l, S.disabled = x.disabled || u <= 1, C.disabled = x.disabled || u >= d, h.setAttribute("aria-busy", String(l));
		for (let e of h.querySelectorAll("input,select")) e.disabled = c || !n();
	}, E = async (e) => {
		if (!n() || c || l) return;
		let r = {
			account: _.value.trim(),
			country: v.value.trim().toUpperCase(),
			language: y.value.trim(),
			page: e
		};
		if (!r.account) {
			i("请提供明确账号。", "error");
			return;
		}
		let a = ++s;
		l = !0, T();
		try {
			let i = await t.services.invoke("wishlist_explicit", r);
			if (c || !n() || a !== s) return;
			if (i?.status === "error") throw f({
				not_public: "愿望单未公开或来源受限，请确认公开设置后重试。",
				rate_limited: "愿望单来源限流，请稍后重试。",
				upstream_error: "愿望单来源请求失败，请稍后重试。",
				unparsed: "愿望单来源结构无法验证，请稍后重试。",
				parameter_error: "请检查账号、地区、语言或页码。",
				module_unavailable: "愿望单服务或本次授权暂不可用。"
			}[i.error?.code] || "愿望单来源暂不可用，请稍后重试。");
			let o = i?.document?.blocks?.find((e) => e?.kind === "fields" && e.fields?.wishlist)?.fields.wishlist;
			if (!o || !Array.isArray(o.items) || o.items.length > 20 || !Number.isSafeInteger(o.pages) || o.page !== e) throw Error("愿望单结果无法验证。");
			u = o.page, d = o.pages, w.replaceChildren(p("p", `共${o.total}项 · 第${u}/${d}页 · 地区${o.region} · 愿望单来源时间${o.fetched_at} · 商店补全时间${o.store_fetched_at || "未取得"}`));
			for (let e of o.items) {
				let t = p("article"), n = p("a", `${e.name || "名称未提供"} · AppID ${e.app_id}`);
				if (!/^[1-9][0-9]*$/u.test(e.app_id)) throw Error("愿望单AppID无法验证。");
				n.href = `https://store.steampowered.com/app/${e.app_id}/`, n.target = "_blank", n.rel = "noopener noreferrer", t.append(n, p("p", `添加：${(/* @__PURE__ */ new Date(e.date_added * 1e3)).toISOString()} · ${e.price || {
					free: "免费",
					unreleased: "未发售",
					no_local_price: "本地区未提供价格",
					region_locked: "来源明确标记地区受限",
					region_or_store_unavailable: "商店或地区不可用",
					fetch_failed: "商店补全失败"
				}[e.price_state] || "价格未知"} · 币种${e.currency || "未提供"} · 折扣${e.discount_percent ?? "未知"}% · ${{
					unreleased: "未发售",
					released: "已发售",
					unknown: "发售状态未知"
				}[e.release_state] || "发售状态未知"}`)), w.append(t);
			}
			o.state === "empty" && w.append(p("p", "来源返回的本次公开愿望单为空。")), o.enrichment_failed && w.append(p("p", "愿望单已读取；当前页商店补全失败，未将缺失价格视为免费。")), S.disabled = u <= 1, C.disabled = u >= d;
		} catch (e) {
			!c && n() && a === s && (w.replaceChildren(p("p", e.publicMessage || "愿望单请求未完成，请稍后重试。")), i("愿望单查询未完成。", "error"));
		} finally {
			!c && a === s && (l = !1, T());
		}
	};
	return m(h, "submit", (e) => {
		e.preventDefault(), E(1);
	}), m(S, "click", () => {
		u > 1 && E(u - 1);
	}), m(C, "click", () => {
		u < d && E(u + 1);
	}), e.append(p("p", "匿名读取第一方公开愿望单，每页20项，仅补全当前页商店资料。私有、空单、限流与请求失败分别报告。"), p("h3", "查询条件"), h, p("h3", "愿望单结果"), w), t.presentation?.actions(b), T(), {
		setAvailable() {
			c || (s += 1, l = !1, u = 1, d = 1, w.replaceChildren(), T());
		},
		dispose() {
			c || (c = !0, s += 1, l = !1, w.replaceChildren(), T(), o.splice(0).forEach((e) => e()));
		}
	};
}
//#endregion
//#region packages/steam_dlc/pages/src/metric.js
function m(e) {
	return typeof e == "number" ? Number.isFinite(e) ? String(e) : "未知" : typeof e == "string" && /^-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?$/u.test(e) && Number.isFinite(Number(e)) ? e : "未知";
}
//#endregion
//#region packages/steam_dlc/pages/src/analysis-controller.js
var h = {
	timeline: "发育时间线",
	purchases: "购买时间线",
	lane: "对线位置",
	teamfights: "团战",
	objectives: "目标事件",
	team_advantage: "团队经济/经验差",
	benchmarks: "表现基准",
	players: "玩家名单",
	invalid_player: "无效玩家记录",
	gold_t: "经济时间线",
	xp_t: "经验时间线",
	team_gold: "团队经济差",
	team_xp: "团队经验差",
	teamfight_players: "团战玩家记录",
	account_id32: "玩家账号",
	player_slot: "玩家位置",
	name: "玩家名称",
	hero_id: "英雄",
	team: "阵营",
	outcome: "胜负",
	kills: "击杀",
	deaths: "死亡",
	assists: "助攻",
	last_hits: "补刀",
	denies: "反补",
	gold_per_min: "每分钟金钱",
	xp_per_min: "每分钟经验",
	hero_damage: "英雄伤害",
	tower_damage: "建筑伤害",
	hero_healing: "治疗量",
	items: "装备",
	backpack: "背包",
	level: "等级"
};
function g(e) {
	let [t, n] = e.split(".");
	return (Object.hasOwn(h, t) ? h[t] : "未知数据项") + (n === "invalid_rows" ? "（含无效记录）" : n === "missing_points" ? "（采样点缺失）" : n ? "（范围待确认）" : "");
}
function _(e, { options: t, active: n, field: r, renderResult: i, say: a }) {
	let o = e.ownerDocument, s = [], c = !1, l = 0, u = !1, d = (e, t) => {
		let n = o.createElement(e);
		return t !== void 0 && (n.textContent = t), n;
	}, f = d("form"), p = t.presentation?.grid(f) || f, h = r(p, "match_id", "比赛ID");
	h.maxLength = 20, h.inputMode = "numeric";
	let _ = r(p, "account", "焦点玩家（Dota ID32 / SteamID64 / 本场唯一昵称）"), v = r(p, "refresh", "来源缓存", ["false", "true"], "false");
	v.options[0].textContent = "优先有效缓存", v.options[1].textContent = "刷新公开来源";
	let y = d("button", "查看指定玩家分析");
	y.type = "submit", y.className = "ui-button", y.dataset.variant = "primary", y.dataset.action = "analysis-query";
	let b = d("div");
	b.className = "steam-dlc-actions", b.append(y), f.append(b);
	let x = d("section");
	x.className = "steam-dlc-public-result", x.setAttribute("aria-live", "polite");
	let S = () => {
		y.disabled = c || !n() || u, f.setAttribute("aria-busy", String(u));
		for (let e of f.querySelectorAll("input,select")) e.disabled = c || !n();
	}, C = async (e) => {
		if (e.preventDefault(), !n() || c || u) return;
		let r = {
			match_id: h.value.trim(),
			account: _.value.trim(),
			refresh: v.value === "true"
		};
		if (!/^[1-9][0-9]{0,19}$/u.test(r.match_id) || !r.account) {
			a("请提供有效比赛ID和明确焦点玩家。", "error");
			return;
		}
		a("");
		let o = ++l;
		u = !0, S(), x.replaceChildren(d("p", "正在读取公开结算与可用时间线。"));
		try {
			let e = await t.services.invoke("analyze_explicit", r);
			if (c || !n() || o !== l) return;
			i(e, x);
			let a = e.model_facts;
			if (!a || typeof a != "object") return;
			let s = {
				settlement_only: "仅基础结算",
				partial: "部分分析段可用",
				supported_sections_complete: "支持的分析段已提供"
			};
			x.prepend(d("p", `数据覆盖：${Object.hasOwn(s, a.data_completeness) ? s[a.data_completeness] : "待确认"}。本页展示基于公开事实的分析。`));
			let u = a.focus || {}, f = typeof u.account_id32 == "string" && /^[0-9]+$/u.test(u.account_id32) ? u.account_id32 : m(u.account_id32);
			x.append(d("p", `焦点：${typeof u.name == "string" ? u.name : "名称未提供"} · ID32 ${f} · 英雄${m(u.hero_id)} · K/D/A ${m(u.kills)}/${m(u.deaths)}/${m(u.assists)}`));
			for (let [e, t] of [
				["missing_sections", "缺失分析段"],
				["missing_fields", "缺失字段"],
				["truncated_sections", "来源截断段"]
			]) {
				let n = a[e];
				Array.isArray(n) && x.append(d("p", `${t}：${n.filter((e) => typeof e == "string").slice(0, 32).map(g).join("、") || "未列出"}。`));
			}
			x.append(d("p", `来源：${a.source === "opendota" ? "OpenDota" : "来源未知"} · 获取时间：${typeof a.fetched_at == "string" ? a.fetched_at : "未提供"}。缺失分析段保持未知；时间线范围以来源返回为准。`));
		} catch {
			!c && n() && o === l && (x.replaceChildren(d("p", "分析请求未完成，请核对比赛与焦点后重试。")), a("未取得可确认的分析结果。", "error"));
		} finally {
			!c && o === l && (u = !1, S());
		}
	};
	return f.addEventListener("submit", C), s.push(() => f.removeEventListener("submit", C)), e.append(d("p", "按明确比赛与玩家读取OpenDota公开事实。未收录的时间线、装备、团战或目标保持未知，不提交录像解析。"), d("h3", "分析条件"), f, d("h3", "分析结果"), x), t.presentation?.actions(b), S(), {
		setAvailable() {
			c || (l += 1, u = !1, x.replaceChildren(), S());
		},
		dispose() {
			c || (c = !0, l += 1, u = !1, x.replaceChildren(), S(), s.splice(0).forEach((e) => e()));
		}
	};
}
//#endregion
//#region packages/steam_dlc/pages/src/controller.js
var v = Object.freeze({
	steam: {
		title: "Steam",
		summary: "商店搜索、游戏详情与公开账号资料。共享关联是用户自行声明的账号信息，所有权尚未验证。",
		source: "Steam 商店和 Community 提供公开样本；完整库 full 使用可选 Steam Key。是否完整以本次来源返回为准，私密库、缺少 Key 与上游失败会分别说明。",
		commands: [
			["/ygl steam bind <Dota ID32、SteamID64 或 profiles URL>", "在私聊中关联当前用户的 Steam 账号。"],
			["/ygl steam binding", "在私聊中查看当前用户关联。"],
			["/ygl steam unbind", "在私聊中解除当前用户关联。"],
			["/ygl steam search <游戏名或 AppID> [--country CC] [--language english]", "商店默认 CN / schinese；展示本次地区、币种和来源时间对应的当前价格。"],
			["/ygl steam app <AppID> [--country CC] [--language english]", "查看商店详情与当前可用价格；图片失败时保留文字结果。"],
			["/ygl steam profile [账号]", "查看公开资料；昵称、头像、等级逐项标明可用性。"],
			["/ygl steam recent [账号]", "查看主页最近展示的公开样本，范围以本次来源返回为准。"],
			["/ygl steam games [账号]", "查看来源可用的公开样本；完整游戏库增强需要可选 Steam Key。"],
			["/ygl steam wall [账号] [--source games|recent|full] [--all-apps] [--limit N] [--refresh]", "生成游戏生涯拼图。来源、时间预设、比例与数量受已保存设置及输出预算约束；完整库需要可选 Key。"],
			["/ygl steam wall status|result|cancel|retry <任务ID>", "查看本人任务状态、逐图结果、取消或重试。result支持 --page N --image N，每次只返回选中一张，不自动刷屏。"],
			["/ygl steam status", "查看使用说明。"],
			["/ygl steam wishlist [账号] [--page N] [--country CN]", "匿名查看公开愿望单，每页20项；模型与页面必须提供明确账号。"]
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
			["/ygl dota2 analyze <比赛ID> --account <玩家账号或本场唯一昵称>", "查看指定玩家的对线、装备、团战和证据边界；网页与模型查询展示公开事实；聊天命令可选生成模型短评。"],
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
			["/ygl cs2 status", "查看来源和凭据配置状态；上游有效性在查询时验证。"],
			["/ygl cs2 profile [SteamID64] --platform perfect [--season S16]", "完美/官匹可复用本人 Steam 绑定；模型查询必须明确账号。"],
			["/ygl cs2 recent [SteamID64] --platform official [--limit 5]", "官匹展示完美平台已收录的比赛。"],
			["/ygl cs2 stats <5E-domain> --platform 5e [--season 2026S5]", "5E domain 与 SteamID 分开；统计注明来源赛季口径。"],
			["/ygl cs2 last [SteamID64] --platform perfect", "查看来源最近一场；官匹与 5E 返回有界玩家摘要。"],
			["/ygl cs2 match <来源比赛ID> --platform perfect [--focus SteamID64]", "完美可返回完整名单及焦点；官匹/5E 另需 --account，限定在该玩家近期样本。"]
		]
	},
	deadlock: {
		title: "Deadlock",
		summary: "玩家资料、近期样本、统计与单场焦点查询，数据来自 Deadlock API 社区已收录记录。",
		source: "使用社区来源最近 20 条已收录记录，范围和更新时间以该来源为准。未收录、受保护、尚未解析与空结果分别报告；缺失段位保持未知。",
		commands: [
			["/ygl deadlock profile [账号]", "查看来源已收录资料与最近可用排位记录。"],
			["/ygl deadlock recent [账号] [--limit N]", "默认 20 条，范围 1–20；仅指来源已收录近期记录。"],
			["/ygl deadlock stats [账号] [--limit N]", "默认 20 条，范围 1–20；按有效分母计算，缺失字段保持未知。"],
			["/ygl deadlock last [账号]", "查看有界窗口最近有效记录，详情失败不暗换另一场。"],
			["/ygl deadlock match <match_id> [--account <账号>]", "按明确账号精确匹配个人焦点，不读取默认关联。"],
			["/ygl deadlock status", "查看功能与来源范围。"]
		]
	}
}), y = (e) => b({
	waiting: "等待扫码确认",
	authorized: "授权成功",
	completed: "授权完成",
	cancelled: "已取消",
	expired: "已过期",
	failed: "授权失败"
}, e, "状态未知"), b = (e, t, n) => Object.hasOwn(e, t) ? e[t] : n, x = (e, t) => JSON.stringify(e) === JSON.stringify(t), S = (e) => JSON.stringify([
	e.owner,
	e.runtimeId,
	e.epoch,
	e.boundary
]), C = (e) => typeof e?.message == "string" ? e.message : "", w = /* @__PURE__ */ new Set([
	"admin_authorization_denied",
	"page_revoked",
	"page_unavailable",
	"stale_context"
]), T = Object.freeze({
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
}), E = {
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
}, D = {
	profile: "玩家资料",
	stats: "玩家统计",
	last: "上一场比赛",
	match: "比赛详情",
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
};
E.poster_limit_mode = "作品数量模式", D.top = "按时长取前 N 项", D.all = "不限（来源实际返回范围）", Object.assign(D, {
	"2:3": "2:3",
	"9:16": "9:16",
	"1:2": "1:2"
});
function O(e) {
	if (typeof e != "string" || e.length > 128) throw Error("数量必须是完整有限数值。");
	let t = e.trim(), n = /^([+-]?)(?:(\d+)(?:\.(\d*))?|\.(\d+))(?:[eE]([+-]?\d+))?$/u.exec(t);
	if (!n) throw Error("数量必须是完整有限数值，不能包含其他文字。");
	let r = n[3] ?? n[4] ?? "", i = (n[2] || "0") + r, a = Number(n[5] || 0) - r.length;
	if (!Number.isSafeInteger(a) || a > 128) throw Error("数量超过安全数值范围，请选择不限。");
	let o = BigInt(i);
	if (o = a < -256 ? 0n : a >= 0 ? o * 10n ** BigInt(a) : o / 10n ** BigInt(-a), n[1] === "-" && (o = -o), o > BigInt(2 ** 53 - 1)) throw Error("数量超过安全数值范围，请选择不限。");
	if (o < 20n) throw Error("数量向零截断后至少为20。");
	return Number(o);
}
var k = Uint32Array.from({ length: 256 }, (e, t) => {
	let n = t;
	for (let e = 0; e < 8; e++) n = n & 1 ? 3988292384 ^ n >>> 1 : n >>> 1;
	return n >>> 0;
});
function te(e, t) {
	let n = e instanceof Uint8Array;
	if (!n && (typeof e != "string" || !e.length || e.length > 24e6 || e.length % 4 || !/^[A-Za-z0-9+/]*={0,2}$/u.test(e))) throw Error("图片内容无法验证。");
	let r = n ? Array.from({ length: Math.ceil(e.length / 32768) }, (t, n) => String.fromCharCode(...e.subarray(n * 32768, (n + 1) * 32768))).join("") : t.atob(e);
	if (!r.startsWith("PNG\r\n\n")) throw Error("invalid_images");
	let i = n ? e : Uint8Array.from(r, (e) => e.charCodeAt(0)), a = (e) => (i[e] << 24 | i[e + 1] << 16 | i[e + 2] << 8 | i[e + 3]) >>> 0, o = 8, s = !1, c = !1, l = !1, u = !1, d = 0, f = !1;
	for (; o + 12 <= i.length;) {
		let e = a(o), t = o + e + 12;
		if (t > i.length) throw Error("invalid_images");
		let n = r.slice(o + 4, o + 8);
		if (!/^[A-Za-z]{4}$/u.test(n) || !s && n !== "IHDR") throw Error("invalid_images");
		let p = 4294967295;
		for (let e = o + 4; e < t - 4; e++) p = k[(p ^ i[e]) & 255] ^ p >>> 8;
		if ((p ^ 4294967295) >>> 0 !== a(t - 4)) throw Error("invalid_images");
		if (n === "IHDR") {
			let t = i[o + 16], n = i[o + 17];
			if (s || e !== 13 || !a(o + 8) || !a(o + 12) || !{
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
			}[n]?.includes(t) || i[o + 18] !== 0 || i[o + 19] !== 0 || i[o + 20] > 1) throw Error("invalid_images");
			s = !0, f = n === 3;
		} else if (n === "PLTE") {
			if (c || l || !e || e > 768 || e % 3) throw Error("invalid_images");
			c = !0;
		} else if (n === "IDAT") {
			if (u || f && !c) throw Error("invalid_images");
			l = !0, d += e;
		} else if (n === "IEND") {
			if (e || !d || t !== i.length) throw Error("invalid_images");
			return i;
		} else {
			if (n[0] === n[0].toUpperCase()) throw Error("invalid_images");
			l && (u = !0);
		}
		o = t;
	}
	throw Error("invalid_images");
}
var A = /* @__PURE__ */ new Map(), j = 4, M = 4096, ne = 256;
function re(e, t, n) {
	for (let [n, r] of A) r.owner === e.owner && n !== t && A.delete(n);
	if (!n || t.length > M) return null;
	let r = A.get(t) || {
		owner: e.owner,
		drafts: /* @__PURE__ */ new Map(),
		token: null
	};
	for (r.token = Symbol("ordinary-draft-mount"), A.delete(t), A.set(t, r); A.size > j;) A.delete(A.keys().next().value);
	return r;
}
function N(e, t) {
	let n = e.ownerDocument, r = S(t.context), i = t.context.owner.startsWith("steam_dlc/") ? t.context.owner.slice(10) : "", a = v[i], o = a ? re(t.context, r, t.routeId === "settings") : null, s = o?.token, c = { ...t.context }, l = !1, u = !1, d = !1, h = 0, g = !1, k = !1, j = null, M = !1, N = !1, P = null, F = 0, I, L = null, R = null, z = !1, B = 0, V = () => {}, ie = () => {}, ae = [], oe = [], H = /* @__PURE__ */ new Map(), se = () => {}, ce = 0, le = "", ue = 0, U = null, de = () => {}, W = new Map(o?.drafts), G = /* @__PURE__ */ new Map(), fe = [], K = (e, t, r) => {
		let i = n.createElement(e);
		return t !== void 0 && (i.textContent = t), r && (i.className = r), i;
	}, q = (e, t, n) => {
		e.addEventListener(t, n), fe.push(() => e.removeEventListener(t, n));
	}, J = K("section", void 0, "steam-dlc-page"), pe = K("p", "", "steam-dlc-hint");
	pe.setAttribute("role", "status");
	let me = K("p", "", "steam-dlc-message");
	me.setAttribute("role", "status"), me.setAttribute("aria-live", "polite"), J.append(pe), e.replaceChildren(J);
	let Y = () => ((t.scope.signal.aborted || !t.scope.isCurrent()) && (d = !0), !l && !u && !d && S(c) === r && (!o || A.get(r) === o && o.token === s)), X = () => Y() && c.available, he = () => Object.freeze({
		ordinary: W.size > 0,
		credentials: Y() && ([...H.values()].some((e) => !!e.input?.value) || L?.state === "waiting"),
		pending: g || M,
		version: ce
	}), ge = () => {
		let e = JSON.stringify([
			W.size > 0,
			g,
			ue,
			he().credentials,
			M
		]);
		e !== le && (le = e, ce += 1, t.onNavigationStateChange?.());
	}, Z = (e, t = "warning") => {
		U !== null && (clearTimeout(U), U = null), me.textContent = e, me.dataset.tone = t, e && t === "success" && (U = setTimeout(() => {
			U = null, Y() && (me.textContent = "");
		}, 3500));
	}, _e = () => {
		J.dataset.theme = c.theme, pe.textContent = Y() ? c.available ? "当前页面入口可用。运行健康请在模块管理中查看；此处不检测上游服务。" : "当前页面入口不可用，请在模块管理中刷新状态后重新进入。" : "页面上下文已失效，请重新进入本模块。";
	}, ve, ye, be, xe, Se = () => {
		o && Y() && (o.drafts = new Map([...W].filter(([e, t]) => {
			let n = T[i]?.includes(e), r = t.rawValue ?? t.value;
			return n && (t.kind === "clear" || t.kind === "set" && [
				"string",
				"boolean",
				"number"
			].includes(typeof r) && !(typeof r == "number" && !Number.isFinite(r)) && !(typeof r == "string" && r.length > ne));
		})));
	}, Ce = () => {
		(o ? A.get(r) === o && o.token === s : t.routeId === "home") && A.delete(r), u = !0, h += 1, g = !1, k = !1, W.size && (ue += 1), W.clear(), j = null;
		for (let { control: e } of G.values()) e.value = "";
		F += 1, Ve(), Be(), P = null, L = null, M = !1, N = !1;
	}, Q = () => {
		if (Se(), _e(), J.setAttribute("aria-busy", String(g || M)), ye) {
			ye.setAttribute("aria-disabled", String(!X() || g || M || L?.state === "waiting" || !k || !W.size)), be.setAttribute("aria-disabled", String(!X() || g || M)), xe.setAttribute("aria-disabled", String(!X() || g || M || !W.size));
			for (let { control: e, reset: t } of G.values()) e.disabled = !X() || !j, t.setAttribute("aria-disabled", String(!X() || !j));
		}
		$ && $.setAttribute("aria-disabled", String(!X() || g)), se(), ge();
	}, we = [], Te = (e) => {
		if (!e || !Number.isSafeInteger(e.revision) || e.revision < 1 || !e.fields || !e.descriptors || (we = (T[i] || []).filter((t) => e.fields[t] && e.descriptors[t]), !we.includes("reply_theme") || i === "dota2" && !we.includes("timezone"))) throw Error("invalid_snapshot");
		for (let t of we) {
			let n = e.fields[t], r = e.descriptors[t];
			if (!n || !r || typeof r.description != "string" || t === "reply_theme" && (!Array.isArray(r.choices) || !r.choices.length || !r.choices.some((e) => e.value === null) || r.choices.some((e) => typeof e.label != "string" || e.value !== null && typeof e.value != "string")) || t === "timezone" && r.value_schema?.type !== "string" || t === "poster_include_apps" && (r.value_schema?.type !== "boolean" || typeof r.default != "boolean" || typeof n.value != "boolean") || t === "poster_limit" && (r.value_schema?.type !== "integer" || ![1, 20].includes(r.value_schema.minimum) || !Number.isInteger(r.default) || !Number.isInteger(n.value))) throw Error("invalid_snapshot");
		}
		return e;
	}, Ee = (e) => {
		let t = W.get(e);
		return t ? t.kind === "clear" ? j.descriptors[e].default : t.value : j.fields[e].value;
	}, De = (e) => e === "poster_include_apps" ? [{
		value: !1,
		label: "仅游戏"
	}, {
		value: !0,
		label: "全部应用"
	}] : j.descriptors[e].value_schema?.type === "boolean" ? [{
		value: !1,
		label: "关闭"
	}, {
		value: !0,
		label: "开启"
	}] : j.descriptors[e].choices || j.descriptors[e].value_schema?.enum?.map((e) => ({
		value: e,
		label: D[e] || String(e)
	})), Oe = (e) => !!De(e), ke = (e, t) => {
		if (!X() || !j) return;
		let n = j.fields[e], r = !g && (t.kind === "clear" ? !n.present : n.state === "valid" && x(n.value, t.value)) ? void 0 : t;
		if (x(W.get(e), r)) return;
		r === void 0 ? W.delete(e) : W.set(e, r), ue += 1, G.get(e).error.textContent = "", G.get(e).control.setAttribute("aria-invalid", "false");
		let i = W.size && (!o || [...W.values()].some((e) => e.kind === "set" && typeof (e.rawValue ?? e.value) == "string" && (e.rawValue ?? e.value).length > ne));
		Z(i ? "输入超过草稿保留上限，请先修正再切页。" : W.size ? "有未保存的修改。" : "", "warning"), Q();
	}, Ae = () => {
		for (let [e, { control: t, error: n, hint: r }] of G) {
			r.textContent = j.descriptors[e].description;
			let i = Ee(e);
			if (Oe(e)) {
				let n = De(e);
				t.replaceChildren(...n.map((e, t) => {
					let n = K("option", e.label);
					return n.value = String(t), n;
				})), t.value = String(n.findIndex((e) => x(e.value, i)));
			} else t.value = W.get(e)?.rawValue === void 0 ? typeof i == "string" || typeof i == "number" ? String(i) : "" : W.get(e).rawValue;
			n.textContent = j.fields[e].state !== "valid" && !W.has(e) ? "当前配置无效，请修改或恢复默认后保存。" : "", t.setAttribute("aria-invalid", String(!!n.textContent));
		}
	}, je = () => {
		let e = /* @__PURE__ */ new Map(), n = (e) => i === "steam" && e.startsWith("poster_") ? "游戏生涯拼图" : i === "dota2" && [
			"subscription_enabled",
			"poll_interval_seconds",
			"opendota_rph",
			"commentary_enabled"
		].includes(e) ? "订阅与数据来源" : "查询与回复";
		for (let r of we) {
			let a = n(r);
			if (!e.has(a)) {
				let n = K("section", void 0, "steam-dlc-config-group");
				n.append(K("h3", a)), ve.insertBefore(n, ve.querySelector(":scope > .steam-dlc-actions")), e.set(a, {
					section: n,
					grid: t.presentation?.grid(n)
				});
			}
			let { section: o, grid: s } = e.get(a), c = j.descriptors[r], l = K("div", void 0, "steam-dlc-field"), u = K("label", E[r] || r), d = K(Oe(r) ? "select" : "input");
			d.className = "ui-control", d.id = `steam-dlc-${i}-${r}`, u.htmlFor = d.id, d.name = r;
			let f = K("p", c.description, "steam-dlc-hint");
			f.id = `${d.id}-hint`;
			let p = K("p", "", "steam-dlc-field-error");
			p.id = `${d.id}-error`, d.setAttribute("aria-describedby", `${f.id} ${p.id}`), r === "timezone" && (d.type = "text", d.autocomplete = "off", d.maxLength = Math.min(c.value_schema.maxLength ?? ne, ne)), !Oe(r) && c.value_schema?.type === "integer" && (d.type = "number", d.min = String(c.value_schema.minimum), c.value_schema.maximum !== void 0 && (d.max = String(c.value_schema.maximum)), d.step = "1", r === "poster_limit" && (d.type = "text", d.inputMode = "decimal", d.removeAttribute("min"), d.removeAttribute("max")));
			let m = K("button", "恢复默认");
			m.className = "ui-button", m.type = "button", m.dataset.action = `reset-${r}`, q(m, "click", () => {
				X() && j && (ke(r, { kind: "clear" }), Ae());
			});
			let h = K("div", void 0, "steam-dlc-actions");
			if (h.append(m), r === "poster_limit") for (let e of [
				20,
				50,
				100,
				200,
				500,
				1e3,
				"all"
			]) {
				let t = K("button", e === "all" ? "不限" : String(e), "ui-button");
				t.type = "button", q(t, "click", () => {
					if (X() && j) {
						if (G.has("poster_limit_mode") && ke("poster_limit_mode", {
							kind: "set",
							value: e === "all" ? "all" : "top"
						}), e !== "all") ke(r, {
							kind: "set",
							value: e
						});
						else if (!G.has("poster_limit_mode")) {
							Z("当前配置尚未提供不限模式，请刷新模块版本。", "warning");
							return;
						}
						Ae();
					}
				}), h.append(t);
			}
			q(d, Oe(r) ? "change" : "input", () => {
				if (X() && j) {
					if (Oe(r)) {
						let e = De(r)[Number(d.value)];
						if (!e) return;
						ke(r, e.value === null ? { kind: "clear" } : {
							kind: "set",
							value: e.value
						});
					} else if (c.value_schema?.type === "integer") {
						let e = d.value;
						if (r === "poster_limit") {
							try {
								ke(r, {
									kind: "set",
									value: O(e)
								});
							} catch {
								ke(r, {
									kind: "set",
									value: null,
									rawValue: e
								});
							}
							return;
						}
						ke(r, r === "opendota_rph" && e === "" ? { kind: "clear" } : d.validity.valid && e !== "" ? {
							kind: "set",
							value: Number(e)
						} : {
							kind: "set",
							value: null,
							rawValue: e
						});
					} else ke(r, {
						kind: "set",
						value: d.value
					});
				}
			});
			let g = s && t.presentation.field(s, {
				control: d,
				reset: h,
				label: u,
				hint: f,
				error: p
			});
			G.set(r, {
				control: d,
				reset: m,
				error: g?.error || p,
				hint: g?.hint || f
			}), g || (l.append(u, d, h, f, p), o.append(l));
		}
	}, Me = (e) => {
		j = Te(e);
		for (let [e, t] of W) {
			let n = j.fields[e];
			(t.kind === "clear" ? !n.present : n.state === "valid" && x(n.value, t.value)) && (W.delete(e), ue += 1);
		}
		G.size || je(), Ae(), k = !0;
	}, Ne = async (e = !1) => {
		if (!X() || g || M) return;
		e && Be();
		let n = ++h;
		g = !0, Q();
		try {
			if (!X() || n !== h) return;
			let r = await t.services.config.current();
			if (!X() || n !== h) return;
			Me(r);
			try {
				await Ue();
			} catch (e) {
				if (!X() || n !== h) return;
				He(e), X() && Z("普通配置已读取；来源凭据状态未确认，请单独刷新凭据。", "warning");
				return;
			}
			if (!X() || n !== h) return;
			Z(W.size ? "已刷新；草稿已保留，请核对后保存。" : e ? "已刷新。" : "", W.size ? "warning" : "success");
		} catch (e) {
			if (!X() || n !== h) return;
			if (w.has(C(e))) {
				Ce(), Z("管理授权或模块上下文已失效，请重新进入页面。", "error"), Q();
				return;
			}
			k = !1, Z("配置读取未完成。请检查 Dashboard 授权与模块状态，再手动刷新。", "error");
		} finally {
			Y() && n === h && (g = !1, Q());
		}
	}, Pe = () => {
		let e = !0;
		for (let [t, n] of W) {
			if (n.kind === "clear") continue;
			let r = j.descriptors[t], i = "";
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
				if ((n.rawValue !== void 0 || !Number.isSafeInteger(n.value) || n.value < e.minimum || n.value > e.maximum) && (i = `请输入 ${e.minimum} 到 ${e.maximum} 之间的整数。`), t === "poster_limit") try {
					O(n.rawValue ?? String(n.value));
				} catch (e) {
					i = e.message;
				}
			} else Oe(t) && !De(t).some((e) => x(e.value, n.value)) && (i = "请选择当前可用的选项。");
			G.get(t).error.textContent = i, G.get(t).control.setAttribute("aria-invalid", String(!!i)), i && (e = !1);
		}
		return G.has("poster_mode") && Ee("poster_mode") === "legacy" && Ee("poster_limit") > 200 && (G.get("poster_limit").error.textContent = "兼容旧布局最多支持 200 项，请调整数量或选择游戏生涯拼图。", G.get("poster_limit").control.setAttribute("aria-invalid", "true"), e = !1), e;
	}, Fe = async () => {
		if (!X() || g || M || L?.state === "waiting" || !k || !W.size || !Pe()) return;
		let e = new Map(W), n = {}, r = [];
		for (let [t, i] of e) i.kind === "clear" ? r.push(t) : n[t] = i.value;
		let i = j.revision, a = !1, o = ++h;
		g = !0, k = !1, Z("正在保存，请等待确认。"), Q();
		let s = (e) => {
			if (!e || !Number.isSafeInteger(e.revision) || e.revision <= i) throw Error("invalid_receipt");
			i = e.revision, a = !0;
		};
		try {
			if (!X() || o !== h) return;
			if (Object.keys(n).length) {
				let e = await t.services.config.save(i, n);
				if (!X() || o !== h) return;
				s(e);
			}
			if (r.length) {
				let e = await t.services.config.clear(i, r);
				if (!X() || o !== h) return;
				s(e);
			}
			let a = await t.services.config.current();
			if (!X() || o !== h) return;
			if (Te(a), a.revision < i) throw Error("unverified_snapshot");
			for (let [t, n] of e) {
				let e = a.fields[t];
				if (n.kind === "clear" ? e.present : e.state !== "valid" || !x(e.value, n.value)) throw Error("unverified_snapshot");
			}
			for (let [t, n] of e) W.get(t) === n && (W.delete(t), ue += 1);
			Me(a);
			try {
				await Ue();
			} catch (e) {
				if (!X() || o !== h) return;
				He(e), X() && Z("普通配置已保存并核对；来源凭据状态未确认，请单独刷新凭据。", "warning");
				return;
			}
			if (!X() || o !== h) return;
			Z(W.size ? "已保存本次提交；仍有新的未保存修改。" : "已保存。", W.size ? "warning" : "success");
		} catch (e) {
			if (!X() || o !== h) return;
			if (w.has(C(e))) {
				Ce(), Z("管理授权或模块上下文已失效，请重新进入页面。", "error"), Q();
				return;
			}
			let t = C(e) === "revision_conflict";
			Z(a ? "部分或全部修改已提交，状态暂未核实。请手动刷新并核对，不要重复提交。" : t ? "配置已被其他操作修改。草稿已保留，请手动刷新、核对后再保存。" : C(e) === "invalid_config" ? "配置未被接受。请检查字段，手动刷新并核对后再保存。" : "保存结果尚未确认。草稿已保留，请手动刷新并核对，不要重复提交。", "error");
		} finally {
			Y() && o === h && (g = !1, Q());
		}
	}, $, Ie, Le = 0, Re = (e) => {
		let t = e;
		if (!t || t.schema_version !== 1 || !["success", "partial_success"].includes(t.status) || t.privacy !== "public" || !t.document || !Array.isArray(t.document.blocks)) throw Error("invalid_cache_status");
		for (let e of t.document.blocks) {
			if (e?.kind !== "fields" || !e.fields || typeof e.fields != "object") continue;
			let t = e.fields.cache;
			if (t && Object.keys(t).sort().join(",") === "bytes,evictions,items,max_bytes,max_items" && !Object.values(t).some((e) => !Number.isSafeInteger(e) || e < 0)) return t;
		}
		throw Error("invalid_cache_status");
	}, ze = async () => {
		if (!X() || g || !$) return;
		let e = ++Le;
		g = !0, Q();
		try {
			let n = await t.services.invoke("wall_cache_status", {});
			if (!X() || e !== Le) return;
			let r = Re(n);
			Ie.textContent = `缓存：${r.items} 项 / ${r.bytes} 字节；上限 ${r.max_items} 项 / ${r.max_bytes} 字节；已淘汰 ${r.evictions} 项。`, Z("缓存状态已刷新。此操作只读取统计；普通刷新游戏库会继续复用有效原图。", "success");
		} catch {
			if (!X() || e !== Le) return;
			Ie.textContent = "缓存状态暂不可用。", Z("读取缓存状态失败，请稍后重试。", "error");
		} finally {
			Y() && e === Le && (g = !1, Q());
		}
	}, Be = () => {
		for (let e of H.values()) e.input && (e.input.value = "");
	}, Ve = () => {
		R !== null && (clearTimeout(R), R = null), H.get("credential_perfect")?.qr?.removeAttribute("src");
	}, He = (e) => {
		w.has(C(e)) ? (Ce(), Z("管理授权或页面上下文已失效，请重新进入。", "error")) : C(e) === "operation_cancelled" ? Z("已取消操作。") : (P = null, Z(C(e) === "revision_conflict" ? "设置已被其他操作修改。凭据输入已清除，请刷新状态后重新操作。" : "操作未完成或结果未确认。凭据输入已清除，请刷新并核对状态。", "error"));
	}, Ue = async () => {
		if (!X() || !ee[i] || !t.services.credentials?.status) return;
		let e = F, n = h, r = await t.services.credentials.status();
		if (X() && e === F && n === h) {
			if (!r || !Number.isSafeInteger(r.revision) || r.revision < 1 || !r.fields) throw Error("invalid_credential_status");
			for (let [e] of ee[i]) {
				let t = r.fields[e];
				if (t && (typeof t.configured != "boolean" || typeof t.decryptable != "boolean" || t.upstream !== "unverified")) throw Error("invalid_credential_status");
			}
			P = r, Ye(), se();
		}
	}, We = async (e) => {
		let n = F;
		if (!e || !Number.isSafeInteger(e.revision) || e.revision <= P.revision) throw Error("invalid_receipt");
		let r = await t.services.config.current();
		if (X() && n === F) {
			if (r.revision < e.revision) throw Error("unverified_snapshot");
			Me(r), await Ue();
		}
	}, Ge = async (e, n) => {
		if (!X() || g || M || !P || L?.state === "waiting") return;
		let r = H.get(e).input?.value.trim();
		if (!n && (!r || r.length > 4096 || /[\x00-\x1f\x7f-\x9f]/u.test(r))) {
			Z("请输入 1 到 4096 字符的有效 Key 或 Token。", "error");
			return;
		}
		let i = ++F;
		Be(), M = !0, Q();
		try {
			let a = n ? await t.services.credentials.clear(P.revision, e) : await t.services.credentials.replace(P.revision, e, { token: r });
			if (!X() || i !== F || (await We(a), !X() || i !== F)) return;
			let o = P.fields[e];
			if (!o || o.configured === n) throw Error("unverified_snapshot");
			Z(n ? "凭据已清除。" : "凭据已保存；有效性会在来源请求时验证。", "success");
		} catch (e) {
			X() && i === F && He(e);
		} finally {
			Y() && i === F && (M = !1, Q());
		}
	}, Ke = (e) => {
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
	}, qe = () => {
		if (!X() || L?.state !== "waiting" || z) return;
		R !== null && clearTimeout(R);
		let e = L.expires_at * 1e3 - Date.now();
		if (e <= 0) {
			Ve(), L = {
				...L,
				state: "expired"
			}, Z("二维码已超时，请重新登录。"), Q();
			return;
		}
		let t = Math.min(e, Math.max(250, L.next_poll_at * 1e3 - Date.now()));
		R = setTimeout(() => {
			R = null, Je("poll");
		}, t);
	}, Je = async (e) => {
		if (!X() || !P || e === "cancel" && (z = !0, Ve(), Q(), M) || g || M) return;
		e === "begin" && (Ve(), L = null, z = !1);
		let n = ++F, r = L?.session_id || "", i = null;
		M = !0, N = !0, Be(), Q();
		try {
			let a = await t.services.credentials.authorize(P.revision, "perfect_qr", e, r);
			if (!X() || n !== F) return;
			if (e === "qr") {
				if (typeof a.qr_png != "string" || a.qr_png.length > 5e5 || !/^iVBORw0KGgo[A-Za-z0-9+/=]*$/u.test(a.qr_png)) throw Error("invalid_qr_png");
				z || (H.get("credential_perfect").qr.src = `data:image/png;base64,${a.qr_png}`);
			} else {
				if (e === "revoke") {
					if (!a || Object.keys(a).sort().join(",") !== "receipt,revoked" || a.revoked !== !0 || !a.receipt) throw Error("invalid_revocation_receipt");
					L = null;
				} else L = Ke(a.session);
				if (a.receipt && await We(a.receipt), !X() || n !== F) return;
				if (e === "revoke" && P?.fields.credential_perfect?.configured !== !1) throw Error("unverified_revocation");
				if (L?.state === "waiting") Z(z ? "正在取消扫码。" : "请使用完美 App 扫码并亲自确认授权；留在本页等待结果。"), e === "begin" && (i = "qr");
				else {
					Ve();
					let t = L?.state;
					Z(t === "authorized" ? "完美授权已保存，玩家 Steam 绑定保持独立。" : e === "revoke" ? "完美授权已撤销。" : t === "expired" ? "二维码已过期，请重新登录。" : t === "cancelled" ? "扫码已取消。" : "授权会话已结束，请刷新状态。", t === "authorized" || e === "revoke" ? "success" : "warning"), z = !1;
				}
			}
		} catch (e) {
			X() && n === F && (Ve(), L = null, z = !1, He(e));
		} finally {
			Y() && n === F && (M = !1, N = !1, Q(), z && L?.state === "waiting" ? Je("cancel") : i ? Je(i) : L?.state === "waiting" && qe());
		}
	}, Ye = () => {
		let e = (ee[i] || []).filter(([e]) => P.fields[e]);
		if (e.length) {
			I || (I = K("section", void 0, "steam-dlc-credentials"), t.presentation?.credentialHost || I.append(K("h3", "来源凭据与授权")), I.append(K("p", "凭据只在可信管理入口提交。输入仅在当前页面保留；上游有效性在查询时验证。", "steam-dlc-hint")), t.presentation?.credentialHost ? t.presentation.credentialHost.append(I) : J.insertBefore(I, me));
			for (let [n, r] of e) {
				if (H.has(n)) continue;
				let e = K("section", void 0, "steam-dlc-credential"), i = K("p", "", "steam-dlc-credential-status");
				i.setAttribute("role", "status");
				let a = K("div", void 0, "steam-dlc-actions"), o = {
					status: i,
					actions: a,
					buttons: []
				};
				e.append(K("h4", r), i);
				let s = (e, t, n) => {
					let r = K("button", t, "ui-button");
					return r.type = "button", r.dataset.action = e, q(r, "click", () => {
						r.getAttribute("aria-disabled") !== "true" && n();
					}), a.append(r), o.buttons.push(r), r;
				};
				if (n === "credential_perfect") o.qr = K("img", void 0, "steam-dlc-qr"), o.qr.alt = "完美登录二维码，仅供本次管理员授权", o.qr.setAttribute("referrerpolicy", "no-referrer"), e.append(o.qr), s("perfect-begin", "扫码登录 / 重新登录", () => {
					Je("begin");
				}), s("perfect-cancel", "取消扫码", () => {
					Je("cancel");
				}), s("perfect-poll", "检查扫码状态", () => {
					Je("poll");
				}), s("perfect-revoke", "撤销完美授权", () => {
					Je("revoke");
				});
				else {
					let i = K("input");
					if (i.type = "password", i.className = "ui-control", i.id = `steam-dlc-${n}`, i.name = n, i.maxLength = 4096, i.autocomplete = "new-password", i.spellcheck = !1, i.setAttribute("aria-label", r), o.input = i, t.presentation) {
						let n = K("label", r), a = K("p", "来源凭据不会作为普通草稿保留。"), o = K("p");
						a.id = `${i.id}-hint`, o.id = `${i.id}-error`, t.presentation.field(e, {
							control: i,
							label: n,
							hint: a,
							error: o
						});
					} else e.append(i);
					q(i, "input", Q), s(`replace-${n}`, "保存凭据", () => {
						Ge(n, !1);
					}), s(`clear-${n}`, "清除凭据", () => {
						Ge(n, !0);
					});
				}
				e.append(a), H.set(n, o), I.append(e);
			}
			se = () => {
				for (let [e, t] of H) {
					let n = P?.fields[e];
					t.status.textContent = n ? n.configured ? n.decryptable ? "已配置；上游有效性尚未验证。" : "已配置，但当前无法解密，请检查服务密钥后重新设置。" : "未配置。" : "状态待刷新。", e === "credential_perfect" && L && (t.status.textContent += ` 当前扫码：${y(L.state)}。`), t.input && (t.input.disabled = !X() || g || M || L?.state === "waiting");
					for (let e of t.buttons) {
						let t = e.dataset.action, n = t === "perfect-cancel", r = !X() || !P || (n ? L?.state !== "waiting" && !N : g || M || t === "perfect-poll" && L?.state !== "waiting" || L?.state === "waiting" && !t.startsWith("perfect-"));
						e.setAttribute("aria-disabled", String(r));
					}
				}
			};
		}
	}, Xe = () => {
		let e = n.defaultView?.URL || URL;
		for (let t of ae.splice(0)) e.revokeObjectURL(t);
	}, Ze = (e, n, r, a, o = "") => {
		let s = K("div", void 0, "steam-dlc-public-field"), c = K("label", r), l = K(a ? "select" : "input");
		l.id = `steam-dlc-${i}-${t.routeId}-${n}`, l.name = n, l.className = "ui-control", c.htmlFor = l.id, a ? l.append(...a.map((e) => {
			let t = K("option", (n === "action" && e === "recent" ? "近期战绩" : D[e]) || "未知选项");
			return t.value = e, t;
		})) : (l.type = "text", l.maxLength = 128, l.autocomplete = "off"), l.value = o;
		let u = K("p", "", "steam-dlc-hint"), d = K("p", "", "steam-dlc-field-error");
		return u.id = `${l.id}-hint`, d.id = `${l.id}-error`, t.presentation ? t.presentation.field(e, {
			control: l,
			label: c,
			hint: u,
			error: d
		}) : (s.append(c, l), e.append(s)), oe.push(l), l;
	}, Qe = (e, t) => {
		if (![
			"profile",
			"stats",
			"match",
			"recent"
		].includes(e.kind)) return;
		let n = e.data, r = (e) => typeof e == "string" && e ? e : "未知", i = (e) => `${m(e?.scores?.[0])} : ${m(e?.scores?.[1])}`, a = (e) => `${m(e?.kills)}/${m(e?.deaths)}/${m(e?.assists)}`, o = (e, n) => {
			let r = K("div", void 0, "steam-dlc-table"), i = K("table"), a = K("tr");
			a.append(...e.map((e) => K("th", e))), i.append(a);
			for (let e of n) {
				let t = K("tr");
				t.append(...e.map((e) => K("td", e))), i.append(t);
			}
			r.append(i), t.append(r);
		}, s = b({
			platform_recorded: "平台收录",
			recorded_official: "完美收录官匹",
			recent_first_page: "近期首批样本",
			recent_player_summary: "有界近期玩家摘要"
		}, e.coverage, "范围未知"), c = e.detail_level === "full_match";
		if (["profile", "stats"].includes(e.kind)) {
			if (t.append(K("p", `来源：${b(D, e.platform, "来源未知")} · 范围：${s}`, "steam-dlc-hint")), e.kind === "profile") {
				let i = n.rank || {}, a = typeof i.value == "string" && i.value.trim() && !/^[+-]?[\d.]+$/u.test(i.value) ? i.value : m(i.value);
				t.append(K("p", `玩家：${r(n.nickname)} · 账号：${r(n.account_id || e.target?.id)} · 段位：${a} · 积分：${m(i.score)}`));
			}
			let i = n.metrics || {};
			o([
				"场次",
				"K/D",
				"rating",
				"PW rating",
				"ADR",
				"RWS",
				"胜率"
			], [[...[
				"matches",
				"kd",
				"rating",
				"pw_rating",
				"adr",
				"rws",
				"win_rate"
			].map((e) => m(i[e]))]]), t.append(K("p", "未知表示来源未提供，不按 0 计算。", "steam-dlc-hint"));
			return;
		}
		if (t.append(K("p", `来源：${b(D, e.platform, "来源未知")} · 范围：${s} · 详情：${b({
			full_match: "完整比赛",
			player_summary: "玩家摘要"
		}, e.detail_level, "详情范围未知")}`, "steam-dlc-hint")), e.detail_level === "player_summary" && t.append(K("p", "该来源提供该玩家的近期样本摘要。", "steam-dlc-hint")), e.unavailable_reason && e.unavailable_reason !== "full_match_detail_unavailable" && t.append(K("p", "部分详情暂不可用。", "steam-dlc-hint")), t.append(K("p", "未知表示来源未提供，不按 0 计算。", "steam-dlc-hint")), e.kind === "recent") {
			if (!Array.isArray(n.matches) || !n.matches.length) {
				t.append(K("p", "来源当前样本没有可展示的比赛。"));
				return;
			}
			o([
				"比赛",
				"地图",
				"比分",
				"K/D/A",
				"rating",
				"PW rating",
				"ADR"
			], n.matches.map((e) => [
				r(e?.match_id),
				r(e?.map),
				i(e),
				a(e),
				m(e?.rating),
				m(e?.pw_rating),
				m(e?.adr)
			]));
			return;
		}
		if (t.append(K("p", `比赛：${r(n.match_id)} · 地图：${r(n.map)} · 比分：${i(n)}`)), !c) {
			t.append(K("p", `玩家：${r(n.focus?.id || e.target?.id)} · K/D/A：${a(n)} · rating：${m(n.rating)} · PW rating：${m(n.pw_rating)} · ADR：${m(n.adr)}`));
			return;
		}
		if (n.focus && typeof n.focus == "object" && t.append(K("p", `焦点：${r(n.focus.nickname)} · ${r(n.focus.account_id)} · K/D/A：${a(n.focus)} · rating：${m(n.focus.rating)} · PW rating：${m(n.focus.pw_rating)} · ADR：${m(n.focus.adr)}`)), !Array.isArray(n.players) || !n.players.length) {
			t.append(K("p", "来源未提供可用玩家名单。"));
			return;
		}
		o([
			"玩家",
			"账号",
			"队伍",
			"K/D/A",
			"rating",
			"PW rating",
			"ADR"
		], n.players.map((e) => [
			r(e?.nickname),
			r(e?.account_id),
			m(e?.team),
			a(e),
			m(e?.rating),
			m(e?.pw_rating),
			m(e?.adr)
		]));
	}, $e = (e, t) => {
		if (!e || e.schema_version !== 1 || ![
			"success",
			"partial_success",
			"needs_selection",
			"error"
		].includes(e.status)) throw Error("invalid_result");
		if (t.replaceChildren(), e.status === "error") return t.append(K("p", typeof e.error?.message == "string" ? e.error.message : "来源未返回可用结果。", "steam-dlc-field-error")), !1;
		if (!e.document || !Array.isArray(e.document.blocks)) throw Error("invalid_result");
		for (let n of e.document.blocks) {
			if (n?.kind === "text" && typeof n.text == "string" && t.append(K("p", n.text)), n?.kind === "table" && Array.isArray(n.columns) && Array.isArray(n.rows)) {
				let e = K("div", void 0, "steam-dlc-table"), r = K("table"), i = K("tr");
				i.append(...n.columns.map((e) => K("th", String(e)))), r.append(i);
				for (let e of n.rows) {
					if (!Array.isArray(e)) continue;
					let t = K("tr");
					t.append(...e.map((e) => K("td", e === null ? "未知" : String(typeof e == "object" ? e.value ?? "" : e)))), r.append(t);
				}
				e.append(r), t.append(e);
			}
			let e = n?.kind === "fields" ? n.fields?.cs2 : null;
			if (n?.kind === "fields" && !e) {
				let e = K("dl");
				for (let t of [
					"比赛ID",
					"焦点账号",
					"焦点名称",
					"英雄ID",
					"焦点胜负",
					"时长（秒）"
				]) {
					if (!(t in (n.fields || {}))) continue;
					let r = n.fields[t];
					e.append(K("dt", t), K("dd", r === null ? "未知" : typeof r == "string" || typeof r == "number" || typeof r == "boolean" ? String(r) : "未提供"));
				}
				e.childNodes.length && t.append(e);
			}
			if (Array.isArray(e?.sources)) {
				let n = K("dl", void 0, "steam-dlc-source-status");
				for (let t of e.sources) n.append(K("dt", b(D, t.platform, "来源未知")), K("dd", t.credential_state === "configured" ? "凭据已配置；查询时验证上游有效性。" : "需要在可信设置页授权。"));
				t.append(n);
			} else e?.data && (typeof e.fetched_at == "string" && t.append(K("p", `采样：${e.fetched_at}${e.season ? ` · 赛季 ${e.season}` : ""}`, "steam-dlc-hint")), Qe(e, t));
		}
		for (let n of e.warnings || []) typeof n == "string" && t.append(K("p", n, "steam-dlc-hint"));
		return e.status !== "needs_selection";
	}, et = (e, t) => {
		let r = $e(e, t);
		if (!r) return !1;
		try {
			if (!Array.isArray(e.images) || e.images.length > 8 || !["ready", "none"].includes(e.image_state) || e.image_state === "ready" != !!e.images.length || e.images.reduce((e, t) => e + (typeof t?.base64 == "string" ? t.base64.length : Infinity), 0) > 22369656) throw Error("invalid_images");
			let r = e.images.map((e) => {
				if (e?.media_type !== "image/png") throw Error("invalid_images");
				return te(e.base64, n.defaultView);
			});
			if (r.reduce((e, t) => e + t.length, 0) > 16777216) throw Error("invalid_images");
			for (let [e, i] of r.entries()) {
				let r = n.defaultView.URL.createObjectURL(new n.defaultView.Blob([i], { type: "image/png" }));
				ae.push(r);
				let a = K("figure", void 0, "steam-dlc-preview"), o = K("img");
				o.src = r, o.alt = `CS2 资料卡 ${e + 1}`, a.append(o), t.append(a);
			}
			r.length || t.append(K("p", "本次未提供资料卡，文字资料仍可查看。", "steam-dlc-hint"));
		} catch {
			Xe(), t.querySelectorAll("figure.steam-dlc-preview").forEach((e) => e.remove()), t.append(K("p", "资料卡图片无法验证，已保留文字资料。", "steam-dlc-hint"));
		}
		return r;
	}, tt = () => {
		let e = K("form", void 0, "steam-dlc-public-form"), n = K("section", void 0, "steam-dlc-public-result");
		n.setAttribute("aria-live", "polite");
		let r = t.presentation?.grid(e) || e, i = Ze(r, "account", "玩家账号（SteamID64 / 5E domain）");
		i.required = !0;
		let a, o, s, c, l, u;
		a = Ze(r, "action", "查询类型", [
			"profile",
			"recent",
			"stats",
			"last",
			"match"
		], "profile"), o = Ze(r, "platform", "来源", [
			"perfect",
			"official",
			"5e"
		], "perfect"), c = Ze(r, "season", "赛季（可选）"), s = Ze(r, "limit", "近期展示数量", null, "5"), s.type = "number", s.min = "1", s.max = "20", s.step = "1", l = Ze(r, "match_id", "来源比赛 ID"), u = Ze(r, "focus", "单场焦点账号（可选）");
		let d = () => {
			c.disabled = !["profile", "stats"].includes(a.value), s.disabled = a.value !== "recent", l.disabled = a.value !== "match", u.disabled = a.value !== "match", l.required = a.value === "match";
		};
		q(a, "change", d), d(), J.append(K("p", "页面查询始终需要明确账号，不读取本人默认绑定。5E 使用 domain；官匹与 5E 单场仅限来源近期玩家摘要。", "steam-dlc-hint"), K("h3", "查询条件"));
		let f = K("button", "查询", "ui-button");
		f.type = "submit", f.dataset.variant = "primary", f.dataset.action = "query";
		let p = K("div", void 0, "steam-dlc-actions");
		p.append(f), e.append(p);
		let m = null, h = 0, _ = K("div", void 0, "steam-dlc-actions");
		_.hidden = !0;
		let v = K("button", "重试资料卡预览", "ui-button");
		v.type = "button", v.dataset.action = "query-preview-retry";
		let y = K("button", "仅查询文字资料", "ui-button");
		y.type = "button", y.dataset.action = "query-text-only", _.append(v, y);
		let b = () => {
			h += 1, m = null, _.hidden = !0;
		};
		q(e, "input", b), q(e, "change", b);
		let x = () => {
			e.setAttribute("aria-busy", String(g));
			for (let e of [
				...p.querySelectorAll("button"),
				v,
				y
			]) e.setAttribute("aria-disabled", String(!X() || g));
			for (let t of e.querySelectorAll("input,select")) t.disabled = !X();
			X() && d();
		}, S = () => {
			b(), g = !1, B += 1, Xe(), n.replaceChildren(), x();
		};
		V = S, ie = S;
		let T = async (r, d = "normal") => {
			if (!X() || g) return;
			let f = d !== "normal";
			if (f && (!m || m.formRevision !== h)) return;
			let p = f ? { ...m.parameters } : r ? {} : { account: i.value.trim() };
			if (!r && !f && (!p.account || !e.checkValidity())) {
				Z("请填写明确账号并检查输入范围。", "error");
				return;
			}
			!r && !f && (Object.assign(p, {
				action: a.value,
				platform: o.value
			}), !c.disabled && c.value.trim() && (p.season = c.value.trim()), s.disabled || (p.limit = Number(s.value)), l.disabled || (p.match_id = l.value.trim()), !u.disabled && u.value.trim() && (p.focus = u.value.trim()));
			let v = p.action === "profile" && d !== "text", y = h, b = ++B;
			g = !0, _.hidden = !0, Xe(), n.replaceChildren(K("p", "正在查询来源。")), Q(), x();
			try {
				let e = await t.services[v ? "preview" : "invoke"]("query", p);
				if (!X() || b !== B) return;
				if (v && e?.status === "error") {
					let t = (/* @__PURE__ */ new Map([
						["auth_required", "所选来源需要授权。请在可信设置页完成完美扫码授权或配置 5E Token，核对来源后重新查询。"],
						["auth_expired", "所选来源的授权已过期。请在可信设置页重新授权后查询。"],
						["rate_limited", "来源请求限流，请稍后再查询；页面不会自动重试。"],
						["parameter_error", "查询参数不符合要求，请核对玩家账号、所选来源、赛季和比赛 ID 后重新查询。"],
						["not_public", "玩家资料未公开或来源访问受限，请核对公开设置与来源授权后重新查询。"],
						["not_found", "来源未找到对应玩家或记录，请核对玩家账号与所选来源后重新查询。"],
						["no_records", "来源当前暂无可用记录，可稍后重新查询已收录比赛。"],
						["unparsed", "来源尚未解析对应记录，请等待来源解析后再查询。"],
						["upstream_error", "所选来源暂时不可用，请稍后再查询。"]
					])).get(e.schema_version === 1 ? e.error?.code : null);
					if (!t) throw Error("preview_unavailable");
					m = null, n.replaceChildren(K("p", t, "steam-dlc-field-error")), Z("查询未完成，请按来源提示处理后重新查询。", "warning");
					return;
				}
				let r = v ? et(e, n) : $e(e, n);
				m = null, e.status === "needs_selection" ? Z("需要补充选择，请按来源提示配置或改选。", "warning") : Z(r ? "来源结果已更新。" : "查询未完成，请查看来源反馈。", r ? "success" : "warning");
			} catch (e) {
				if (!X() || b !== B) return;
				if (Xe(), w.has(C(e))) {
					S(), Ce(), Q(), oe.forEach((e) => {
						e.value = "";
					}), x(), Z("页面授权或运行上下文已变化，请重新进入页面。", "error");
					return;
				}
				let t = v && y === h;
				m = t ? {
					parameters: { ...p },
					formRevision: y
				} : null, _.hidden = !t, n.replaceChildren(K("p", t ? "资料卡预览未完成，未取得可确认的文字或图片。可主动重试预览，或仅查询文字资料；每次操作会重新查询来源。" : "请求未完成，或返回内容不完整。请核对当前账号与来源后重新查询。", "steam-dlc-field-error")), Z("未取得可确认结果。", "error");
			} finally {
				Y() && b === B && (g = !1, Q(), x());
			}
		};
		q(v, "click", () => {
			T(!1, "preview");
		}), q(y, "click", () => {
			T(!1, "text");
		}), q(e, "submit", (e) => {
			e.preventDefault(), T(!1);
		});
		let E = K("button", "刷新来源状态", "ui-button");
		E.type = "button", E.dataset.action = "query-status", q(E, "click", () => {
			T(!0);
		}), p.append(E), J.append(e, _, K("h3", "查询结果"), n), t.presentation?.actions(p), T(!0);
	};
	if (a && t.routeId === "home") {
		if (i !== "steam") {
			let e = K("section", void 0, "steam-dlc-source-panel");
			J.append(K("h3", "来源状态"));
			let n = K("button", "刷新来源状态", "ui-button");
			n.type = "button", n.dataset.action = "refresh-status";
			let r = async () => {
				if (!X() || g) return;
				let r = ++B;
				g = !0, Q(), n.setAttribute("aria-disabled", "true");
				try {
					let n = await t.services.invoke("status", {});
					if (!X() || r !== B) return;
					$e(n, e);
				} catch {
					X() && r === B && e.replaceChildren(K("p", "来源状态读取失败，请稍后刷新。", "steam-dlc-field-error"));
				} finally {
					Y() && r === B && (g = !1, n.setAttribute("aria-disabled", String(!X())), Q());
				}
			};
			q(n, "click", () => {
				r();
			}), J.append(e, n), r();
		}
		let e = K("details", void 0, "steam-dlc-disclosure");
		e.append(K("summary", "命令帮助"));
		let n = K("dl", void 0, "steam-dlc-help");
		for (let [e, t] of a.commands) {
			let r = K("dt");
			r.append(K("code", e)), n.append(r, K("dd", t));
		}
		if (e.append(n), J.append(e), i === "steam") {
			let e = K("details", void 0, "steam-dlc-disclosure");
			e.append(K("summary", "游戏生涯拼图说明")), e.append(K("p", "游戏生涯拼图用累计小时映射每张作品的目标面积，提供单机、标准和长玩预设。大图跨行、小图填空，封面保持纵向比例；旧布局可以显式选择。未知时长不补零。", "steam-dlc-hint")), e.append(K("p", "公开主页与近期记录各有其样本范围；完整游戏库需要可选 Steam Key，完整性以本次来源返回为准。默认纵向 2:3，可切换 9:16 或 1:2；作品数量和输出预算共同约束分页，兼容旧布局最多 200 项。包含全部应用会纳入软件，旧设置中的关闭值继续保留。", "steam-dlc-hint")), J.append(e, K("h3", "缓存状态")), Ie = K("p", "尚未读取缓存状态。", "steam-dlc-cache-value"), $ = K("button", "刷新缓存状态"), $.className = "ui-button", $.type = "button", $.dataset.action = "refresh-cache", q($, "click", () => {
				ze();
			}), J.append(Ie, $);
		}
		if (i === "dota2") {
			let e = K("details", void 0, "steam-dlc-disclosure");
			e.append(K("summary", "账号与订阅说明"), K("p", "账号可用 Dota ID32 或 SteamID64。订阅创建、查看和取消通过当前群或私聊中的命令完成。OpenDota Key 可选，匿名与有 Key 都遵守同一每小时预算；模型短评失败不会阻止基础通知。", "steam-dlc-hint")), J.append(e);
		}
	} else if (a && t.routeId === "settings") {
		ve = K("form"), q(ve, "submit", (e) => {
			e.preventDefault(), Fe();
		});
		let e = K("div", void 0, "steam-dlc-actions");
		ye = K("button", "保存修改"), ye.className = "ui-button", ye.dataset.variant = "primary", ye.type = "submit", ye.dataset.action = "save", be = K("button", "刷新配置"), be.className = "ui-button", be.type = "button", be.dataset.action = "refresh", xe = K("button", "放弃本模块修改"), xe.className = "ui-button", xe.type = "button", xe.dataset.action = "discard", q(be, "click", () => {
			Ne(!0);
		}), q(xe, "click", () => {
			X() && !g && j && (W.size && (ue += 1), W.clear(), Ae(), Z("已放弃本模块修改。", "success"), Q());
		}), e.append(ye, be, xe), t.presentation?.actions(e), J.append(ve), ve.append(e), J.append(K("p", "回复主题中的“跟随核心”清除模块覆盖值。恢复默认先形成草稿，保存后生效。", "steam-dlc-hint"));
	} else if (i === "cs2" && t.routeId === "query") tt(!1);
	else if (i === "steam" && t.routeId === "collage") {
		let e = f(J, {
			options: t,
			active: X,
			field: Ze,
			parseLimit: O,
			validatePNG: (e) => te(e, n.defaultView),
			say: Z
		});
		V = e.dispose, ie = e.setAvailable, fe.push(e.dispose);
	} else if (i === "steam" && t.routeId === "wishlist") {
		let e = p(J, {
			options: t,
			active: X,
			field: Ze,
			say: Z
		});
		V = e.dispose, ie = e.setAvailable, fe.push(e.dispose);
	} else if (i === "dota2" && t.routeId === "analysis") {
		let e = _(J, {
			options: t,
			active: X,
			field: Ze,
			renderResult: $e,
			say: Z
		});
		V = e.dispose, ie = e.setAvailable, fe.push(e.dispose);
	} else J.append(K("p", "该页面入口未声明，请返回模块列表重新进入。"));
	J.append(me);
	let nt = () => {
		l || (l = !0, h += 1, Le += 1, F += 1, B += 1, g = !1, Xe(), oe.forEach((e) => {
			e.value = "";
		}), Ve(), Be(), L = null, P = null, M = !1, N = !1, U !== null && (clearTimeout(U), U = null), W.clear(), j = null, fe.splice(0).forEach((e) => e()), de(), I?.remove(), J.remove());
	};
	return t.scope.signal.addEventListener("abort", nt, { once: !0 }), fe.push(() => t.scope.signal.removeEventListener("abort", nt)), de = t.scope.onDispose(nt), Q(), ve && Ne(), $ && ze(), {
		update(e) {
			if (l || u) return;
			let t = c.available;
			c = { ...e }, S(c) !== r || !Y() ? (V(), B += 1, Xe(), oe.forEach((e) => {
				e.value = "";
			}), Ce(), Z("模块运行上下文已变化，请重新进入页面。", "error")) : t !== c.available && (ie(c.available), B += 1, Xe(), F += 1, Ve(), Be(), L = null, M = !1, N = !1, Le += 1, h += 1, g = !1, k = !1, Z("页面可用状态已变化，请核对刷新后的配置。")), Q();
		},
		dispose: nt,
		navigationImpact: he
	};
}
//#endregion
//#region packages/steam_dlc/pages/src/entry.js
function P(f, p) {
	let m = n({ ...p.context }), h = p.context.owner.startsWith("steam_dlc/") ? p.context.owner.slice(10) : "", g = v[h], _ = p.routeId === "settings", y = p.routeId === "home", b = _ && [
		"steam",
		"dota2",
		"cs2"
	].includes(h), x = p.routeId === "collage" ? "游戏生涯拼图" : p.routeId === "wishlist" ? "公开愿望单" : p.routeId === "analysis" ? "指定玩家分析" : p.routeId === "query" ? "平台查询" : "", S, C, w, T = !1, E = () => {}, D = [], ee = {
		actions(n) {
			let i = [...n.childNodes], a = e({ setup: () => () => t(r, {}, { default: () => t("div", {
				style: { display: "contents" },
				ref: (e) => {
					if (e) for (let t of i) t.parentNode !== e && e.append(t);
				}
			}) }) });
			a.mount(n), D.push(a);
		},
		grid(n, r) {
			let i = f.ownerDocument.createElement("div");
			n.insertBefore(i, r || null);
			let o, s = e({ setup: () => () => t(a, { columns: _ ? 1 : 2 }, { default: () => t("div", {
				style: { display: "contents" },
				ref: (e) => {
					o = e;
				}
			}) }) });
			return s.mount(i), D.push(s), o;
		},
		field(r, { control: a, reset: o, label: s, hint: c, error: l }) {
			let u = f.ownerDocument.createElement("div");
			r.append(u);
			let d = n(c.textContent), p = n(l.textContent), m = e({ setup: () => () => t(i, {
				controlId: a.id,
				label: s.textContent,
				hint: d.value,
				error: p.value,
				layout: _ ? "row" : "stacked",
				hintId: c.id,
				errorId: l.id
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
			return m.mount(u), D.push(m), {
				hint: {
					get textContent() {
						return d.value;
					},
					set textContent(e) {
						d.value = e;
					}
				},
				error: {
					get textContent() {
						return p.value;
					},
					set textContent(e) {
						p.value = e;
					}
				}
			};
		}
	}, O = e({ setup: () => () => t(d, {
		theme: m.value.theme,
		locale: m.value.locale,
		styleMountTarget: f
	}, { default: () => t("section", {
		class: "steam-dlc-view",
		lang: m.value.locale
	}, [y ? t(u, {
		title: g?.title || "模块页面不可用",
		eyebrow: `${g?.title?.toUpperCase() || "STEAM DLC"} / MODULE`
	}, { default: () => [
		t("p", g?.summary || "当前页面没有可用的模块声明。"),
		t(l, {}, { default: () => "请从模块导航选择查询，或进入业务配置调整设置。" }),
		t("div", { ref: (e) => {
			S = e;
		} }),
		t("details", { class: "steam-dlc-disclosure" }, [
			t("summary", "数据来源与范围"),
			t("p", { class: "steam-dlc-hint" }, g?.source || ""),
			t("p", { class: "steam-dlc-hint" }, "默认账号只在已授权的命令路径使用。自然语言工具必须提供明确账号或比赛编号。")
		])
	] }) : [_ ? null : t(o, {
		title: g ? `${g.title}${x ? ` ${x}` : ""}` : "模块页面不可用",
		eyebrow: "YOMIHIME GAME LINK / STEAM DLC",
		subtitle: g?.summary
	}), t(c, {}, {
		default: () => _ ? t("div", { ref: (e) => {
			S = e;
		} }) : t(s, {
			title: x || "状态与帮助",
			number: "01"
		}, { default: () => t("div", { ref: (e) => {
			S = e;
		} }) }),
		aside: () => t(u, {
			title: b ? "来源凭据与授权" : _ ? "设置说明" : "数据与账号",
			eyebrow: b ? "SOURCE ACCESS" : void 0
		}, { default: () => [
			t(l, {}, { default: () => _ ? h === "steam" ? "选择公开样本或完整库、布局、时长预设、比例和输出预算。完整库需要可选 Steam Key；是否完整以来源实际返回为准。" : h === "cs2" ? "完美授权与 5E Token 仅用于来源请求，玩家查询目标保持独立。二维码需由账号本人亲自确认；离页将停止轮询。" : h === "dota2" ? "订阅设置控制当前服务的采集与预算；具体群或私聊订阅通过本人命令管理。OpenDota Key 可选，不会自动扩大请求额度。" : "网页浅深主题与命令图片回复主题分别设置。回复主题选项由当前授权配置提供。" : g?.source || "当前页面没有可用的模块声明。" }),
			b ? t("div", { ref: (e) => {
				C = e;
			} }) : null,
			t("p", { class: "steam-dlc-hint" }, _ ? "保存后会重新读取并核对结果；冲突或未确认结果需要手动刷新。" : "默认账号只在已授权的命令路径使用。自然语言工具必须提供明确账号或比赛编号。")
		] })
	})]]) }) });
	O.mount(f), ee.credentialHost = C, w = N(S, {
		...p,
		presentation: ee,
		scope: {
			signal: p.scope.signal,
			isCurrent: () => p.scope.isCurrent(),
			onDispose: () => () => {}
		}
	});
	let k = () => {
		T || (T = !0, w.dispose(), D.splice(0).reverse().forEach((e) => e.unmount()), O.unmount(), E());
	};
	return E = p.scope.onDispose(k), {
		update(e) {
			T || (w.update(e), m.value = { ...e });
		},
		dispose: k,
		navigationImpact: w.navigationImpact
	};
}
//#endregion
export { P as mount };
