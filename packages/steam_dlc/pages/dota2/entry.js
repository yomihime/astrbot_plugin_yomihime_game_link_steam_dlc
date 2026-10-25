import { createApp as e, h as t, shallowRef as n } from "../../../../../../../runtime.js";
import { ActionBar as r, FormField as i, FormGrid as a, PageHeader as o, SettingsGroup as s, SettingsLayout as c, StatusHint as l, Surface as u, UiProvider as d } from "../../../../../../../runtime.js";
//#region packages/steam_dlc/pages/src/job-controller.js
function f(e, { options: t, active: n, field: r, parseLimit: i, validatePNG: a, say: o }) {
	let s = e.ownerDocument, c = [], l = [], u = !1, d = null, f = 0, p = 0, m = null, h = null, g = !1, _ = null, v = (e) => !u && n() && e === f, y = (e) => Object.assign(Error(e), { publicMessage: e }), b = (e) => e?.publicMessage || "任务操作未完成，请刷新任务并核对。", x = (e, t) => {
		let n = s.createElement(e);
		return t !== void 0 && (n.textContent = t), n;
	}, S = (e, t, n) => {
		e.addEventListener(t, n), l.push(() => e.removeEventListener(t, n));
	}, C = () => {
		d !== null && (clearTimeout(d), d = null);
	}, w = () => {
		for (let e of c.splice(0)) s.defaultView.URL.revokeObjectURL(e);
	}, T = () => {
		if (!t.services.jobs) throw y("任务服务暂不可用，请刷新模块。");
		return t.services.jobs;
	}, E = x("form");
	E.className = "steam-dlc-public-form";
	let ee = t.presentation?.grid(E) || E, D = r(ee, "account", "SteamID64 / Dota ID32（明确账号）"), O = {};
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
	]) O[e] = r(ee, e, t, n, i);
	O.all_apps.options[0].textContent = "全部应用", O.all_apps.options[1].textContent = "仅游戏";
	let k = r(ee, "limit", "数量（至少20，可手填超过1000）", null, "500");
	k.inputMode = "decimal";
	let A = x("div");
	A.className = "steam-dlc-actions";
	let te = (e, t, r) => {
		let i = x("button", t);
		return i.type = "button", i.className = "ui-button", i.dataset.action = e, S(i, "click", () => {
			if (!n() || u) return;
			let e = f, t = (t) => {
				v(e) && o(b(t), "error");
			};
			try {
				let n = r();
				e = f, Promise.resolve(n).catch(t);
			} catch (e) {
				t(e);
			}
		}), A.append(i), i;
	};
	for (let e of [
		20,
		50,
		100,
		200,
		500,
		1e3,
		"all"
	]) te(`limit-${e}`, e === "all" ? "不限" : String(e), () => {
		O.limit_mode.value = e === "all" ? "all" : "top", k.disabled = e === "all", e !== "all" && (k.value = String(e));
	});
	S(O.limit_mode, "change", () => {
		k.disabled = O.limit_mode.value === "all";
	});
	let j = x("button", "提交拼图任务");
	j.type = "submit", j.className = "ui-button", j.dataset.action = "generate", j.dataset.variant = "primary", A.append(j);
	let M = r(ee, "job_id", "任务ID（刷新后自动恢复）"), N = x("p", "尚未提交任务。");
	N.setAttribute("role", "status");
	let P = x("section");
	P.className = "steam-dlc-public-result";
	let F = () => {
		let e = u || !n();
		E.setAttribute("aria-busy", String(g));
		for (let t of E.querySelectorAll("button")) t.disabled = e || g;
		for (let t of E.querySelectorAll("input,select")) t.disabled = e;
		k.disabled = e || O.limit_mode.value === "all", z.disabled = e || g || !["queued", "running"].includes(m?.status), re.disabled = e || g || ![
			"failed",
			"cancelled",
			"interrupted"
		].includes(m?.status), ie.disabled = e || g || !h;
	}, ne = `ygl:job:${t.context.owner}:${t.routeId}`, I = (e) => {
		if (!e || typeof e.job_id != "string" || !Number.isSafeInteger(e.revision) || ![
			"queued",
			"running",
			"succeeded",
			"failed",
			"cancelled",
			"interrupted"
		].includes(e.status)) throw y("任务状态无法验证。");
		m = e, M.value = m.job_id;
		try {
			s.defaultView.sessionStorage.setItem(ne, m.job_id);
		} catch {}
		let t = m.progress || {}, n = m.summary || {}, r = {
			steam_key_required: "完整库需要在可信管理页配置Steam Key，可改选公开样本。",
			steam_source_unavailable: "Steam来源暂不可用，未用其他来源替代。",
			steam_source_not_public: "Steam库未公开或当前来源授权受限，未视为空库。",
			rate_limited: "来源限流，已停止后续批次；已完成页保留。",
			resource_budget: "资源预算不足，已停止后续批次；已完成页保留。",
			metadata_incomplete: "部分作品类型尚未验证，无法完成仅游戏筛选；请稍后重试，未视为空库。"
		};
		N.textContent = `任务 ${m.job_id} · ${m.status} · 来源${n.source_returned ?? t.source_returned ?? "待确认"} · ${n.eligible_complete === !1 ? "已确认符合" : "符合"}${n.eligible ?? "待确认"} · 已选${n.selected ?? t.selected ?? "待确认"} · 已生成${n.generated ?? t.generated ?? 0} · 待处理${n.pending ?? t.pending ?? "待确认"} · 缺图${n.missing_images ?? t.missing_images ?? 0}${m.error_code ? ` · 失败原因 ${m.error_code}` : ""}${r[t.reason] ? ` · ${r[t.reason]}` : ""}${n.complete_source === !1 ? " · 来源覆盖不完整" : ""}`;
		let i = n.metadata_unexamined ?? t.metadata_unexamined ?? 0, a = [
			"examined",
			"unexamined",
			"classification_unknown"
		].map((e) => n[e] ?? t[e]), o = (e) => Number.isSafeInteger(e) && e >= 0 ? String(e) : "待确认", c = n.metadata_failures ?? n.counters?.metadata_failed ?? t.counters?.metadata_failed ?? 0;
		a.some((e) => e !== void 0) ? N.textContent += ` · 已检查${o(a[0])}项 · 未检查${o(a[1])}项 · 已检查中类型未知${o(a[2])}项` : i && (N.textContent += ` · 类型尚未验证${i}项（未区分未检查与已检查但类型未知）`), n.selection_exact === !0 && n.all_apps === !1 && (N.textContent += ` · 选集排序已验证${Number.isSafeInteger(a[1]) && a[1] > 0 ? "，剩余未检查" : ""}`), c && (N.textContent += ` · 元数据请求失败${c}次`), F();
	}, L = async (e) => {
		if (!m || !n()) return;
		let t = f, r = ++p, i = m.job_id, o = await T().result(i, {
			cursor: e,
			page_size: 20
		});
		if (v(t) && r === p && m?.job_id === i) {
			if (!Array.isArray(o.entries) || o.entries.length > 20) throw y("任务结果范围无法验证。");
			w(), P.replaceChildren(), h = o.next_cursor || null;
			for (let [e, n] of o.entries.entries()) {
				if (n?.resource?.media_type !== "image/png" || typeof n.resource.asset_id != "string") throw y("任务资源无法验证。");
				let o = await T().resource(i, n.resource.asset_id);
				if (!v(t) || r !== p || m?.job_id !== i) return;
				if (o?.type !== "image/png" || typeof o.arrayBuffer != "function" || o.size > 16777216) throw y("图片资源无法验证。");
				if (a(new Uint8Array(await o.arrayBuffer())), !v(t) || r !== p || m?.job_id !== i) return;
				let l = s.defaultView.URL.createObjectURL(o);
				c.push(l);
				let u = x("figure"), d = x("img"), f = x("a", "下载原始 PNG");
				u.className = "steam-dlc-preview", d.src = l, d.alt = `批次${Number(n.metadata?.batch_index ?? 0) + 1} · 图片${e + 1}`, f.href = l, f.className = "ui-button", f.download = `steam-career-${n.metadata?.batch_index ?? 0}-${e + 1}.png`, u.append(d, f), P.append(u);
			}
			o.entries.length || P.append(x("p", "当前没有已完成结果页。")), F();
		}
	}, R = async () => {
		if (C(), !m || !n() || u) return;
		let e = f, t = m.job_id;
		try {
			let n = await T().status(t);
			if (!v(e) || m?.job_id !== t) return;
			I(n), ["queued", "running"].includes(m.status) ? d = setTimeout(() => {
				R();
			}, 1500) : await L(null);
		} catch (t) {
			v(e) && o(b(t), "error");
		}
	}, z = te("job-cancel", "取消任务", async () => {
		if (!m) return;
		C();
		let e = ++f, t = await T().cancel(m.job_id, m.revision);
		v(e) && (I(t), await R());
	}), re = te("job-retry", "重试任务", async () => {
		if (!m) return;
		C();
		let e = ++f, t = await T().retry(m.job_id, m.revision);
		v(e) && (I(t), await R());
	}), ie = te("job-next", "下一页结果", async () => {
		h && await L(h);
	});
	ie.disabled = !0, te("job-results", "查看已完成页", async () => {
		await L(null);
	}), te("job-refresh", "恢复 / 刷新任务", async () => {
		M.value.trim() && (C(), f += 1, m = { job_id: M.value.trim() }, await R());
	}), z.disabled = !0, re.disabled = !0, S(E, "submit", (e) => {
		e.preventDefault(), !(!n() || u || g) && (async () => {
			let e = ++f;
			C();
			try {
				let t = Object.fromEntries(Object.entries(O).map(([e, t]) => [e, e === "all_apps" ? t.value === "true" : t.value]));
				if (t.account = D.value.trim(), !t.account) throw y("请提供明确账号。");
				if (/^[0-9]+$/u.test(t.account)) {
					let e = BigInt(t.account);
					t.account = String(e < 4294967296n ? e + 76561197960265728n : e);
				}
				try {
					t.limit = t.limit_mode === "all" ? 500 : i(k.value);
				} catch (e) {
					throw y(e.message);
				}
				if (t.mode === "legacy" && (t.limit > 200 || t.limit_mode === "all")) throw y("兼容旧布局最多200项。");
				g = !0, F();
				let n = JSON.stringify(t);
				(!_ || _.fingerprint !== n) && (_ = {
					fingerprint: n,
					key: s.defaultView.crypto.randomUUID()
				});
				let r = await T().submit({
					handler_id: "steam_wall",
					parameters: t,
					idempotency_key: _.key
				});
				if (!v(e)) return;
				I(r), _ = null, o("任务已提交，关闭页面只停止轮询。", "success"), await R();
			} catch (t) {
				v(e) && o(b(t), "error");
			} finally {
				v(e) && (g = !1, F());
			}
		})();
	}), E.append(A), e.append(x("p", "不限覆盖来源实际返回范围。每批有资源预算，已完成页保留；关闭页面只停止轮询，取消需明确点击。"), E, N, P), t.presentation?.actions(A), F();
	try {
		let e = s.defaultView.sessionStorage.getItem(ne);
		e && (M.value = e, m = { job_id: e }, R());
	} catch {}
	return {
		setAvailable(e) {
			u || (f += 1, p += 1, C(), w(), P.replaceChildren(), g = !1, _ = null, m = null, h = null, N.textContent = e ? "页面已恢复，请手动恢复 / 刷新任务，或提交新任务。" : "任务页面暂不可用，已停止轮询；任务ID保留供恢复后查询。", F());
		},
		dispose() {
			u || (u = !0, f += 1, p += 1, g = !1, _ = null, C(), w(), P.replaceChildren(), N.textContent = "任务页面上下文已变化，请重新进入。", F(), l.splice(0).forEach((e) => e()));
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
				not_public: "愿望单未公开或来源受限，未视为空单。",
				rate_limited: "愿望单来源限流，请稍后重试。",
				upstream_error: "愿望单来源请求失败，未视为空单。",
				unparsed: "愿望单来源结构无法验证，未视为空单。",
				parameter_error: "请检查账号、地区、语言或页码。",
				module_unavailable: "愿望单服务或本次授权暂不可用。"
			}[i.error?.code] || "愿望单来源暂不可用，未视为空单。");
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
			o.state === "empty" && w.append(p("p", "来源明确返回空items，本次公开愿望单为空。")), o.enrichment_failed && w.append(p("p", "愿望单已读取；当前页商店补全失败，未将缺失价格视为免费。")), S.disabled = u <= 1, C.disabled = u >= d;
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
	}), e.append(p("p", "匿名读取第一方公开愿望单，每页20项，仅补全当前页商店资料。私有、空单、限流与请求失败分别报告。"), h, w), t.presentation?.actions(b), T(), {
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
function h(e, { options: t, active: n, field: r, renderResult: i, say: a }) {
	let o = e.ownerDocument, s = [], c = !1, l = 0, u = !1, d = (e, t) => {
		let n = o.createElement(e);
		return t !== void 0 && (n.textContent = t), n;
	}, f = d("form"), p = t.presentation?.grid(f) || f, h = r(p, "match_id", "比赛ID");
	h.maxLength = 20, h.inputMode = "numeric";
	let g = r(p, "account", "焦点玩家（Dota ID32 / SteamID64 / 本场唯一昵称）"), _ = r(p, "refresh", "来源缓存", ["false", "true"], "false");
	_.options[0].textContent = "优先有效缓存", _.options[1].textContent = "刷新公开来源";
	let v = d("button", "查看指定玩家分析");
	v.type = "submit", v.className = "ui-button", v.dataset.variant = "primary", v.dataset.action = "analysis-query";
	let y = d("div");
	y.className = "steam-dlc-actions", y.append(v), f.append(y);
	let b = d("section");
	b.className = "steam-dlc-public-result", b.setAttribute("aria-live", "polite");
	let x = () => {
		v.disabled = c || !n() || u, f.setAttribute("aria-busy", String(u));
		for (let e of f.querySelectorAll("input,select")) e.disabled = c || !n();
	}, S = async (e) => {
		if (e.preventDefault(), !n() || c || u) return;
		let r = {
			match_id: h.value.trim(),
			account: g.value.trim(),
			refresh: _.value === "true"
		};
		if (!/^[1-9][0-9]{0,19}$/u.test(r.match_id) || !r.account) {
			a("请提供有效比赛ID和明确焦点玩家。", "error");
			return;
		}
		a("");
		let o = ++l;
		u = !0, x(), b.replaceChildren(d("p", "正在读取公开结算与可用时间线。"));
		try {
			let e = await t.services.invoke("analyze_explicit", r);
			if (c || !n() || o !== l) return;
			i(e, b);
			let a = e.model_facts;
			if (!a || typeof a != "object") return;
			b.prepend(d("p", `数据覆盖：${{
				settlement_only: "仅基础结算",
				partial: "部分分析段可用",
				supported_sections_complete: "支持的分析段已提供"
			}[a.data_completeness] || "待确认"}。本页展示确定性分析与公开事实；不会调用Host模型。`));
			let s = a.focus || {}, u = typeof s.account_id32 == "string" && /^[0-9]+$/u.test(s.account_id32) ? s.account_id32 : m(s.account_id32);
			b.append(d("p", `焦点：${typeof s.name == "string" ? s.name : "名称未提供"} · ID32 ${u} · 英雄${m(s.hero_id)} · K/D/A ${m(s.kills)}/${m(s.deaths)}/${m(s.assists)}`));
			for (let [e, t] of [
				["missing_sections", "缺失分析段"],
				["missing_fields", "缺失字段"],
				["truncated_sections", "来源截断段"]
			]) {
				let n = a[e];
				Array.isArray(n) && b.append(d("p", `${t}：${n.filter((e) => typeof e == "string").slice(0, 32).join("、") || "未列出"}。`));
			}
			b.append(d("p", `来源：${typeof a.source == "string" ? a.source : "未提供"} · 获取时间：${typeof a.fetched_at == "string" ? a.fetched_at : "未提供"}。缺失段保持未知，不补成0或完整时间线。`));
		} catch {
			!c && n() && o === l && (b.replaceChildren(d("p", "分析请求未完成，请核对比赛与焦点后重试。")), a("未取得可确认的分析结果。", "error"));
		} finally {
			!c && o === l && (u = !1, x());
		}
	};
	return f.addEventListener("submit", S), s.push(() => f.removeEventListener("submit", S)), e.append(d("p", "按明确比赛与玩家读取OpenDota公开事实。未收录的时间线、装备、团战或目标保持未知，不提交录像解析。"), f, b), t.presentation?.actions(y), x(), {
		setAvailable() {
			c || (l += 1, u = !1, b.replaceChildren(), x());
		},
		dispose() {
			c || (c = !0, l += 1, u = !1, b.replaceChildren(), x(), s.splice(0).forEach((e) => e()));
		}
	};
}
//#endregion
//#region packages/steam_dlc/pages/src/controller.js
var g = Object.freeze({
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
			["/ygl dota2 analyze <比赛ID> --account <玩家账号或本场唯一昵称>", "查看指定玩家的对线、装备、团战和证据边界；网页与Tool仅提供确定性事实，Host模型仅在真实命令路径可选生成。"],
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
}), _ = (e, t) => JSON.stringify(e) === JSON.stringify(t), v = (e) => JSON.stringify([
	e.owner,
	e.runtimeId,
	e.epoch,
	e.boundary
]), y = (e) => typeof e?.message == "string" ? e.message : "", b = /* @__PURE__ */ new Set([
	"admin_authorization_denied",
	"page_revoked",
	"page_unavailable",
	"stale_context"
]), x = Object.freeze({
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
}), S = {
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
}, C = {
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
}, w = {
	steam: [["credential_steam_key", "Steam Web API Key"]],
	dota2: [["credential_opendota_key", "OpenDota Key（可选）"]],
	cs2: [["credential_perfect", "完美扫码授权"], ["credential_fivee", "5E 会话 Token"]]
};
S.poster_limit_mode = "作品数量模式", C.top = "按时长取前 N 项", C.all = "不限（来源实际返回范围）";
function T(e) {
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
var E = Uint32Array.from({ length: 256 }, (e, t) => {
	let n = t;
	for (let e = 0; e < 8; e++) n = n & 1 ? 3988292384 ^ n >>> 1 : n >>> 1;
	return n >>> 0;
});
function ee(e, t) {
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
		for (let e = o + 4; e < t - 4; e++) p = E[(p ^ i[e]) & 255] ^ p >>> 8;
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
var D = /* @__PURE__ */ new Map(), O = 4, k = 4096, A = 256;
function te(e, t, n) {
	for (let [n, r] of D) r.owner === e.owner && n !== t && D.delete(n);
	if (!n || t.length > k) return null;
	let r = D.get(t) || {
		owner: e.owner,
		drafts: /* @__PURE__ */ new Map(),
		token: null
	};
	for (r.token = Symbol("ordinary-draft-mount"), D.delete(t), D.set(t, r); D.size > O;) D.delete(D.keys().next().value);
	return r;
}
function j(e, t) {
	let n = e.ownerDocument, r = v(t.context), i = t.context.owner.startsWith("steam_dlc/") ? t.context.owner.slice(10) : "", a = g[i], o = a ? te(t.context, r, t.routeId === "settings") : null, s = o?.token, c = { ...t.context }, l = !1, u = !1, d = !1, E = 0, O = !1, k = !1, j = null, M = !1, N = !1, P = null, F = 0, ne, I = null, L = null, R = !1, z = 0, re = () => {}, ie = () => {}, ae = [], oe = [], B = /* @__PURE__ */ new Map(), se = () => {}, ce = 0, le = "", ue = 0, V = null, de = () => {}, H = new Map(o?.drafts), U = /* @__PURE__ */ new Map(), fe = [], W = (e, t, r) => {
		let i = n.createElement(e);
		return t !== void 0 && (i.textContent = t), r && (i.className = r), i;
	}, G = (e, t, n) => {
		e.addEventListener(t, n), fe.push(() => e.removeEventListener(t, n));
	}, K = W("section", void 0, "steam-dlc-page"), pe = W("p", "", "steam-dlc-hint");
	pe.setAttribute("role", "status");
	let me = W("p", "", "steam-dlc-message");
	me.setAttribute("role", "status"), me.setAttribute("aria-live", "polite"), K.append(pe), e.replaceChildren(K);
	let q = () => ((t.scope.signal.aborted || !t.scope.isCurrent()) && (d = !0), !l && !u && !d && v(c) === r && (!o || D.get(r) === o && o.token === s)), J = () => q() && c.available, he = () => Object.freeze({
		ordinary: H.size > 0,
		credentials: q() && ([...B.values()].some((e) => !!e.input?.value) || I?.state === "waiting"),
		pending: O || M,
		version: ce
	}), ge = () => {
		let e = JSON.stringify([
			H.size > 0,
			O,
			ue,
			he().credentials,
			M
		]);
		e !== le && (le = e, ce += 1, t.onNavigationStateChange?.());
	}, Y = (e, t = "warning") => {
		V !== null && (clearTimeout(V), V = null), me.textContent = e, me.dataset.tone = t, e && t === "success" && (V = setTimeout(() => {
			V = null, q() && (me.textContent = "");
		}, 3500));
	}, _e = () => {
		K.dataset.theme = c.theme, pe.textContent = q() ? c.available ? "当前页面入口可用。运行健康请在模块管理中查看；此处不检测上游服务。" : "当前页面入口不可用，请在模块管理中刷新状态后重新进入。" : "页面上下文已失效，请重新进入本模块。";
	}, X, ve, ye, be, xe = () => {
		o && q() && (o.drafts = new Map([...H].filter(([e, t]) => {
			let n = x[i]?.includes(e), r = t.rawValue ?? t.value;
			return n && (t.kind === "clear" || t.kind === "set" && [
				"string",
				"boolean",
				"number"
			].includes(typeof r) && !(typeof r == "number" && !Number.isFinite(r)) && !(typeof r == "string" && r.length > A));
		})));
	}, Se = () => {
		(o ? D.get(r) === o && o.token === s : t.routeId === "home") && D.delete(r), u = !0, E += 1, O = !1, k = !1, H.size && (ue += 1), H.clear(), j = null;
		for (let { control: e } of U.values()) e.value = "";
		F += 1, Be(), ze(), P = null, I = null, M = !1, N = !1;
	}, Z = () => {
		if (xe(), _e(), K.setAttribute("aria-busy", String(O || M)), ve) {
			ve.setAttribute("aria-disabled", String(!J() || O || M || I?.state === "waiting" || !k || !H.size)), ye.setAttribute("aria-disabled", String(!J() || O || M)), be.setAttribute("aria-disabled", String(!J() || O || M || !H.size));
			for (let { control: e, reset: t } of U.values()) e.disabled = !J() || !j, t.setAttribute("aria-disabled", String(!J() || !j));
		}
		Q && Q.setAttribute("aria-disabled", String(!J() || O)), se(), ge();
	}, Ce = [], we = (e) => {
		if (!e || !Number.isSafeInteger(e.revision) || e.revision < 1 || !e.fields || !e.descriptors || (Ce = (x[i] || []).filter((t) => e.fields[t] && e.descriptors[t]), !Ce.includes("reply_theme") || i === "dota2" && !Ce.includes("timezone"))) throw Error("invalid_snapshot");
		for (let t of Ce) {
			let n = e.fields[t], r = e.descriptors[t];
			if (!n || !r || typeof r.description != "string" || t === "reply_theme" && (!Array.isArray(r.choices) || !r.choices.length || !r.choices.some((e) => e.value === null) || r.choices.some((e) => typeof e.label != "string" || e.value !== null && typeof e.value != "string")) || t === "timezone" && r.value_schema?.type !== "string" || t === "poster_include_apps" && (r.value_schema?.type !== "boolean" || typeof r.default != "boolean" || typeof n.value != "boolean") || t === "poster_limit" && (r.value_schema?.type !== "integer" || ![1, 20].includes(r.value_schema.minimum) || !Number.isInteger(r.default) || !Number.isInteger(n.value))) throw Error("invalid_snapshot");
		}
		return e;
	}, Te = (e) => {
		let t = H.get(e);
		return t ? t.kind === "clear" ? j.descriptors[e].default : t.value : j.fields[e].value;
	}, Ee = (e) => e === "poster_include_apps" ? [{
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
		label: C[e] || String(e)
	})), De = (e) => !!Ee(e), Oe = (e, t) => {
		if (!J() || !j) return;
		let n = j.fields[e], r = !O && (t.kind === "clear" ? !n.present : n.state === "valid" && _(n.value, t.value)) ? void 0 : t;
		if (_(H.get(e), r)) return;
		r === void 0 ? H.delete(e) : H.set(e, r), ue += 1, U.get(e).error.textContent = "", U.get(e).control.setAttribute("aria-invalid", "false");
		let i = H.size && (!o || [...H.values()].some((e) => e.kind === "set" && typeof (e.rawValue ?? e.value) == "string" && (e.rawValue ?? e.value).length > A));
		Y(i ? "输入超过草稿保留上限，请先修正再切页。" : H.size ? "有未保存的修改。" : "", "warning"), Z();
	}, ke = () => {
		for (let [e, { control: t, error: n, hint: r }] of U) {
			r.textContent = j.descriptors[e].description;
			let i = Te(e);
			if (De(e)) {
				let n = Ee(e);
				t.replaceChildren(...n.map((e, t) => {
					let n = W("option", e.label);
					return n.value = String(t), n;
				})), t.value = String(n.findIndex((e) => _(e.value, i)));
			} else t.value = H.get(e)?.rawValue === void 0 ? typeof i == "string" || typeof i == "number" ? String(i) : "" : H.get(e).rawValue;
			n.textContent = j.fields[e].state !== "valid" && !H.has(e) ? "当前配置无效，请修改或恢复默认后保存。" : "", t.setAttribute("aria-invalid", String(!!n.textContent));
		}
	}, Ae = () => {
		let e = t.presentation?.grid(X, X.querySelector(".steam-dlc-actions"));
		for (let n of Ce) {
			let r = j.descriptors[n], a = W("div", void 0, "steam-dlc-field"), o = W("label", S[n] || n), s = W(De(n) ? "select" : "input");
			s.className = "ui-control", s.id = `steam-dlc-${i}-${n}`, o.htmlFor = s.id, s.name = n;
			let c = W("p", r.description, "steam-dlc-hint");
			c.id = `${s.id}-hint`;
			let l = W("p", "", "steam-dlc-field-error");
			l.id = `${s.id}-error`, s.setAttribute("aria-describedby", `${c.id} ${l.id}`), n === "timezone" && (s.type = "text", s.autocomplete = "off", s.maxLength = Math.min(r.value_schema.maxLength ?? A, A)), !De(n) && r.value_schema?.type === "integer" && (s.type = "number", s.min = String(r.value_schema.minimum), r.value_schema.maximum !== void 0 && (s.max = String(r.value_schema.maximum)), s.step = "1", n === "poster_limit" && (s.type = "text", s.inputMode = "decimal", s.removeAttribute("min"), s.removeAttribute("max")));
			let u = W("button", "恢复默认");
			u.className = "ui-button", u.type = "button", u.dataset.action = `reset-${n}`, G(u, "click", () => {
				J() && j && (Oe(n, { kind: "clear" }), ke());
			});
			let d = W("div", void 0, "steam-dlc-actions");
			if (d.append(u), n === "poster_limit") for (let e of [
				20,
				50,
				100,
				200,
				500,
				1e3,
				"all"
			]) {
				let t = W("button", e === "all" ? "不限" : String(e), "ui-button");
				t.type = "button", G(t, "click", () => {
					if (J() && j) {
						if (U.has("poster_limit_mode") && Oe("poster_limit_mode", {
							kind: "set",
							value: e === "all" ? "all" : "top"
						}), e !== "all") Oe(n, {
							kind: "set",
							value: e
						});
						else if (!U.has("poster_limit_mode")) {
							Y("当前配置尚未提供不限模式，请刷新模块版本。", "warning");
							return;
						}
						ke();
					}
				}), d.append(t);
			}
			G(s, De(n) ? "change" : "input", () => {
				if (J() && j) {
					if (De(n)) {
						let e = Ee(n)[Number(s.value)];
						if (!e) return;
						Oe(n, e.value === null ? { kind: "clear" } : {
							kind: "set",
							value: e.value
						});
					} else if (r.value_schema?.type === "integer") {
						let e = s.value;
						if (n === "poster_limit") {
							try {
								Oe(n, {
									kind: "set",
									value: T(e)
								});
							} catch {
								Oe(n, {
									kind: "set",
									value: null,
									rawValue: e
								});
							}
							return;
						}
						Oe(n, n === "opendota_rph" && e === "" ? { kind: "clear" } : s.validity.valid && e !== "" ? {
							kind: "set",
							value: Number(e)
						} : {
							kind: "set",
							value: null,
							rawValue: e
						});
					} else Oe(n, {
						kind: "set",
						value: s.value
					});
				}
			});
			let f = e && t.presentation.field(e, {
				control: s,
				reset: d,
				label: o,
				hint: c,
				error: l
			});
			U.set(n, {
				control: s,
				reset: u,
				error: f?.error || l,
				hint: f?.hint || c
			}), f || (a.append(o, s, d, c, l), X.insertBefore(a, X.querySelector(".steam-dlc-actions")));
		}
	}, je = (e) => {
		j = we(e);
		for (let [e, t] of H) {
			let n = j.fields[e];
			(t.kind === "clear" ? !n.present : n.state === "valid" && _(n.value, t.value)) && (H.delete(e), ue += 1);
		}
		U.size || Ae(), ke(), k = !0;
	}, Me = async (e = !1) => {
		if (!J() || O || M) return;
		e && ze();
		let n = ++E;
		O = !0, Z();
		try {
			if (!J() || n !== E) return;
			let r = await t.services.config.current();
			if (!J() || n !== E) return;
			je(r);
			try {
				await He();
			} catch (e) {
				if (!J() || n !== E) return;
				Ve(e), J() && Y("普通配置已读取；来源凭据状态未确认，请单独刷新凭据。", "warning");
				return;
			}
			if (!J() || n !== E) return;
			Y(H.size ? "已刷新；草稿已保留，请核对后保存。" : e ? "已刷新。" : "", H.size ? "warning" : "success");
		} catch (e) {
			if (!J() || n !== E) return;
			if (b.has(y(e))) {
				Se(), Y("管理授权或模块上下文已失效，请重新进入页面。", "error"), Z();
				return;
			}
			k = !1, Y("配置读取未完成。请检查 Dashboard 授权与模块状态，再手动刷新。", "error");
		} finally {
			q() && n === E && (O = !1, Z());
		}
	}, Ne = () => {
		let e = !0;
		for (let [t, n] of H) {
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
					T(n.rawValue ?? String(n.value));
				} catch (e) {
					i = e.message;
				}
			} else De(t) && !Ee(t).some((e) => _(e.value, n.value)) && (i = "请选择当前可用的选项。");
			U.get(t).error.textContent = i, U.get(t).control.setAttribute("aria-invalid", String(!!i)), i && (e = !1);
		}
		return U.has("poster_mode") && Te("poster_mode") === "legacy" && Te("poster_limit") > 200 && (U.get("poster_limit").error.textContent = "兼容旧布局最多支持 200 项，请调整数量或选择游戏生涯拼图。", U.get("poster_limit").control.setAttribute("aria-invalid", "true"), e = !1), e;
	}, Pe = async () => {
		if (!J() || O || M || I?.state === "waiting" || !k || !H.size || !Ne()) return;
		let e = new Map(H), n = {}, r = [];
		for (let [t, i] of e) i.kind === "clear" ? r.push(t) : n[t] = i.value;
		let i = j.revision, a = !1, o = ++E;
		O = !0, k = !1, Y("正在保存，请等待确认。"), Z();
		let s = (e) => {
			if (!e || !Number.isSafeInteger(e.revision) || e.revision <= i) throw Error("invalid_receipt");
			i = e.revision, a = !0;
		};
		try {
			if (!J() || o !== E) return;
			if (Object.keys(n).length) {
				let e = await t.services.config.save(i, n);
				if (!J() || o !== E) return;
				s(e);
			}
			if (r.length) {
				let e = await t.services.config.clear(i, r);
				if (!J() || o !== E) return;
				s(e);
			}
			let a = await t.services.config.current();
			if (!J() || o !== E) return;
			if (we(a), a.revision < i) throw Error("unverified_snapshot");
			for (let [t, n] of e) {
				let e = a.fields[t];
				if (n.kind === "clear" ? e.present : e.state !== "valid" || !_(e.value, n.value)) throw Error("unverified_snapshot");
			}
			for (let [t, n] of e) H.get(t) === n && (H.delete(t), ue += 1);
			je(a);
			try {
				await He();
			} catch (e) {
				if (!J() || o !== E) return;
				Ve(e), J() && Y("普通配置已保存并核对；来源凭据状态未确认，请单独刷新凭据。", "warning");
				return;
			}
			if (!J() || o !== E) return;
			Y(H.size ? "已保存本次提交；仍有新的未保存修改。" : "已保存。", H.size ? "warning" : "success");
		} catch (e) {
			if (!J() || o !== E) return;
			if (b.has(y(e))) {
				Se(), Y("管理授权或模块上下文已失效，请重新进入页面。", "error"), Z();
				return;
			}
			let t = y(e) === "revision_conflict";
			Y(a ? "部分或全部修改已提交，状态暂未核实。请手动刷新并核对，不要重复提交。" : t ? "配置已被其他操作修改。草稿已保留，请手动刷新、核对后再保存。" : y(e) === "invalid_config" ? "配置未被接受。请检查字段，手动刷新并核对后再保存。" : "保存结果尚未确认。草稿已保留，请手动刷新并核对，不要重复提交。", "error");
		} finally {
			q() && o === E && (O = !1, Z());
		}
	}, Q, Fe, Ie = 0, Le = (e) => {
		let t = e;
		if (!t || t.schema_version !== 1 || !["success", "partial_success"].includes(t.status) || t.privacy !== "public" || !t.document || !Array.isArray(t.document.blocks)) throw Error("invalid_cache_status");
		for (let e of t.document.blocks) {
			if (e?.kind !== "fields" || !e.fields || typeof e.fields != "object") continue;
			let t = e.fields.cache;
			if (t && Object.keys(t).sort().join(",") === "bytes,evictions,items,max_bytes,max_items" && !Object.values(t).some((e) => !Number.isSafeInteger(e) || e < 0)) return t;
		}
		throw Error("invalid_cache_status");
	}, Re = async () => {
		if (!J() || O || !Q) return;
		let e = ++Ie;
		O = !0, Z();
		try {
			let n = await t.services.invoke("wall_cache_status", {});
			if (!J() || e !== Ie) return;
			let r = Le(n);
			Fe.textContent = `缓存：${r.items} 项 / ${r.bytes} 字节；上限 ${r.max_items} 项 / ${r.max_bytes} 字节；已淘汰 ${r.evictions} 项。`, Y("缓存状态已刷新。此操作只读取统计；普通刷新游戏库会继续复用有效原图。", "success");
		} catch {
			if (!J() || e !== Ie) return;
			Fe.textContent = "缓存状态暂不可用。", Y("读取缓存状态失败，请稍后重试。", "error");
		} finally {
			q() && e === Ie && (O = !1, Z());
		}
	}, ze = () => {
		for (let e of B.values()) e.input && (e.input.value = "");
	}, Be = () => {
		L !== null && (clearTimeout(L), L = null), B.get("credential_perfect")?.qr?.removeAttribute("src");
	}, Ve = (e) => {
		b.has(y(e)) ? (Se(), Y("管理授权或页面上下文已失效，请重新进入。", "error")) : y(e) === "operation_cancelled" ? Y("已取消操作。") : (P = null, Y(y(e) === "revision_conflict" ? "设置已被其他操作修改。凭据输入已清除，请刷新状态后重新操作。" : "操作未完成或结果未确认。凭据输入已清除，请刷新并核对状态。", "error"));
	}, He = async () => {
		if (!J() || !w[i] || !t.services.credentials?.status) return;
		let e = F, n = E, r = await t.services.credentials.status();
		if (J() && e === F && n === E) {
			if (!r || !Number.isSafeInteger(r.revision) || r.revision < 1 || !r.fields) throw Error("invalid_credential_status");
			for (let [e] of w[i]) {
				let t = r.fields[e];
				if (t && (typeof t.configured != "boolean" || typeof t.decryptable != "boolean" || t.upstream !== "unverified")) throw Error("invalid_credential_status");
			}
			P = r, Je(), se();
		}
	}, Ue = async (e) => {
		let n = F;
		if (!e || !Number.isSafeInteger(e.revision) || e.revision <= P.revision) throw Error("invalid_receipt");
		let r = await t.services.config.current();
		if (J() && n === F) {
			if (r.revision < e.revision) throw Error("unverified_snapshot");
			je(r), await He();
		}
	}, We = async (e, n) => {
		if (!J() || O || M || !P || I?.state === "waiting") return;
		let r = B.get(e).input?.value.trim();
		if (!n && (!r || r.length > 4096 || /[\x00-\x1f\x7f-\x9f]/u.test(r))) {
			Y("请输入 1 到 4096 字符的有效 Key 或 Token。", "error");
			return;
		}
		let i = ++F;
		ze(), M = !0, Z();
		try {
			let a = n ? await t.services.credentials.clear(P.revision, e) : await t.services.credentials.replace(P.revision, e, { token: r });
			if (!J() || i !== F || (await Ue(a), !J() || i !== F)) return;
			let o = P.fields[e];
			if (!o || o.configured === n) throw Error("unverified_snapshot");
			Y(n ? "凭据已清除。" : "凭据已保存；有效性会在来源请求时验证。", "success");
		} catch (e) {
			J() && i === F && Ve(e);
		} finally {
			q() && i === F && (M = !1, Z());
		}
	}, Ge = (e) => {
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
	}, Ke = () => {
		if (!J() || I?.state !== "waiting" || R) return;
		L !== null && clearTimeout(L);
		let e = I.expires_at * 1e3 - Date.now();
		if (e <= 0) {
			Be(), I = {
				...I,
				state: "expired"
			}, Y("二维码已超时，请重新登录。"), Z();
			return;
		}
		let t = Math.min(e, Math.max(250, I.next_poll_at * 1e3 - Date.now()));
		L = setTimeout(() => {
			L = null, qe("poll");
		}, t);
	}, qe = async (e) => {
		if (!J() || !P || e === "cancel" && (R = !0, Be(), Z(), M) || O || M) return;
		e === "begin" && (Be(), I = null, R = !1);
		let n = ++F, r = I?.session_id || "", i = null;
		M = !0, N = !0, ze(), Z();
		try {
			let a = await t.services.credentials.authorize(P.revision, "perfect_qr", e, r);
			if (!J() || n !== F) return;
			if (e === "qr") {
				if (typeof a.qr_png != "string" || a.qr_png.length > 5e5 || !/^iVBORw0KGgo[A-Za-z0-9+/=]*$/u.test(a.qr_png)) throw Error("invalid_qr_png");
				R || (B.get("credential_perfect").qr.src = `data:image/png;base64,${a.qr_png}`);
			} else {
				if (e === "revoke") {
					if (!a || Object.keys(a).sort().join(",") !== "receipt,revoked" || a.revoked !== !0 || !a.receipt) throw Error("invalid_revocation_receipt");
					I = null;
				} else I = Ge(a.session);
				if (a.receipt && await Ue(a.receipt), !J() || n !== F) return;
				if (e === "revoke" && P?.fields.credential_perfect?.configured !== !1) throw Error("unverified_revocation");
				if (I?.state === "waiting") Y(R ? "正在取消扫码。" : "请使用完美 App 扫码并亲自确认授权；留在本页等待结果。"), e === "begin" && (i = "qr");
				else {
					Be();
					let t = I?.state;
					Y(t === "authorized" ? "完美授权已保存，玩家 Steam 绑定保持独立。" : e === "revoke" ? "完美授权已撤销。" : t === "expired" ? "二维码已过期，请重新登录。" : t === "cancelled" ? "扫码已取消。" : "授权会话已结束，请刷新状态。", t === "authorized" || e === "revoke" ? "success" : "warning"), R = !1;
				}
			}
		} catch (e) {
			J() && n === F && (Be(), I = null, R = !1, Ve(e));
		} finally {
			q() && n === F && (M = !1, N = !1, Z(), R && I?.state === "waiting" ? qe("cancel") : i ? qe(i) : I?.state === "waiting" && Ke());
		}
	}, Je = () => {
		let e = (w[i] || []).filter(([e]) => P.fields[e]);
		if (e.length) {
			ne || (ne = W("section", void 0, "steam-dlc-credentials"), ne.append(W("h3", "来源凭据与授权"), W("p", "凭据只在可信管理入口提交。输入不保留为跨页草稿；已配置不代表上游已验证有效。", "steam-dlc-hint")), K.insertBefore(ne, me));
			for (let [n, r] of e) {
				if (B.has(n)) continue;
				let e = W("section", void 0, "steam-dlc-credential"), i = W("p", "", "steam-dlc-credential-status");
				i.setAttribute("role", "status");
				let a = W("div", void 0, "steam-dlc-actions"), o = {
					status: i,
					actions: a,
					buttons: []
				};
				e.append(W("h4", r), i);
				let s = (e, t, n) => {
					let r = W("button", t, "ui-button");
					return r.type = "button", r.dataset.action = e, G(r, "click", () => {
						r.getAttribute("aria-disabled") !== "true" && n();
					}), a.append(r), o.buttons.push(r), r;
				};
				if (n === "credential_perfect") o.qr = W("img", void 0, "steam-dlc-qr"), o.qr.alt = "完美登录二维码，仅供本次管理员授权", o.qr.setAttribute("referrerpolicy", "no-referrer"), e.append(o.qr), s("perfect-begin", "扫码登录 / 重新登录", () => {
					qe("begin");
				}), s("perfect-cancel", "取消扫码", () => {
					qe("cancel");
				}), s("perfect-poll", "检查扫码状态", () => {
					qe("poll");
				}), s("perfect-revoke", "撤销完美授权", () => {
					qe("revoke");
				});
				else {
					let i = W("input");
					if (i.type = "password", i.className = "ui-control", i.id = `steam-dlc-${n}`, i.name = n, i.maxLength = 4096, i.autocomplete = "new-password", i.spellcheck = !1, i.setAttribute("aria-label", r), o.input = i, t.presentation) {
						let n = W("label", r), a = W("p", "来源凭据不会作为普通草稿保留。"), o = W("p");
						a.id = `${i.id}-hint`, o.id = `${i.id}-error`, t.presentation.field(e, {
							control: i,
							label: n,
							hint: a,
							error: o
						});
					} else e.append(i);
					G(i, "input", Z), s(`replace-${n}`, "保存凭据", () => {
						We(n, !1);
					}), s(`clear-${n}`, "清除凭据", () => {
						We(n, !0);
					});
				}
				e.append(a), B.set(n, o), ne.append(e);
			}
			se = () => {
				for (let [e, t] of B) {
					let n = P?.fields[e];
					t.status.textContent = n ? n.configured ? n.decryptable ? "已配置；上游有效性尚未验证。" : "已配置，但当前无法解密，请检查服务密钥后重新设置。" : "未配置。" : "状态待刷新。", e === "credential_perfect" && I && (t.status.textContent += ` 当前扫码：${I.state}。`), t.input && (t.input.disabled = !J() || O || M || I?.state === "waiting");
					for (let e of t.buttons) {
						let t = e.dataset.action, n = t === "perfect-cancel", r = !J() || !P || (n ? I?.state !== "waiting" && !N : O || M || t === "perfect-poll" && I?.state !== "waiting" || I?.state === "waiting" && !t.startsWith("perfect-"));
						e.setAttribute("aria-disabled", String(r));
					}
				}
			};
		}
	}, Ye = () => {
		let e = n.defaultView?.URL || URL;
		for (let t of ae.splice(0)) e.revokeObjectURL(t);
	}, $ = (e, n, r, a, o = "") => {
		let s = W("div", void 0, "steam-dlc-public-field"), c = W("label", r), l = W(a ? "select" : "input");
		l.id = `steam-dlc-${i}-${t.routeId}-${n}`, l.name = n, l.className = "ui-control", c.htmlFor = l.id, a ? l.append(...a.map((e) => {
			let t = W("option", C[e] || e);
			return t.value = e, t;
		})) : (l.type = "text", l.maxLength = 128, l.autocomplete = "off"), l.value = o;
		let u = W("p", "", "steam-dlc-hint"), d = W("p", "", "steam-dlc-field-error");
		return u.id = `${l.id}-hint`, d.id = `${l.id}-error`, t.presentation ? t.presentation.field(e, {
			control: l,
			label: c,
			hint: u,
			error: d
		}) : (s.append(c, l), e.append(s)), oe.push(l), l;
	}, Xe = (e, t) => {
		if (![
			"profile",
			"stats",
			"match",
			"recent"
		].includes(e.kind)) return;
		let n = e.data, r = (e) => typeof e == "string" && e ? e : "未知", i = (e) => `${m(e?.scores?.[0])} : ${m(e?.scores?.[1])}`, a = (e) => `${m(e?.kills)}/${m(e?.deaths)}/${m(e?.assists)}`, o = (e, n) => {
			let r = W("div", void 0, "steam-dlc-table"), i = W("table"), a = W("tr");
			a.append(...e.map((e) => W("th", e))), i.append(a);
			for (let e of n) {
				let t = W("tr");
				t.append(...e.map((e) => W("td", e))), i.append(t);
			}
			r.append(i), t.append(r);
		}, s = {
			platform_recorded: "平台收录",
			recorded_official: "完美收录官匹",
			recent_first_page: "近期首批样本",
			recent_player_summary: "有界近期玩家摘要"
		}[e.coverage] || r(e.coverage), c = e.detail_level === "full_match";
		if (["profile", "stats"].includes(e.kind)) {
			let e = n.metrics || {};
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
			].map((t) => m(e[t]))]]), t.append(W("p", "未知表示来源未提供，不按 0 计算。", "steam-dlc-hint"));
			return;
		}
		if (t.append(W("p", `来源：${C[e.platform] || r(e.platform)} · 范围：${s} · 详情：${c ? "完整比赛" : "玩家摘要"}`, "steam-dlc-hint")), c || t.append(W("p", "该来源仅提供该玩家的有界近期摘要，不含完整比赛名单与详情。", "steam-dlc-hint")), e.unavailable_reason && e.unavailable_reason !== "full_match_detail_unavailable" && t.append(W("p", `缺项说明：${r(e.unavailable_reason)}`, "steam-dlc-hint")), t.append(W("p", "未知表示来源未提供，不按 0 计算。", "steam-dlc-hint")), e.kind === "recent") {
			if (!Array.isArray(n.matches) || !n.matches.length) {
				t.append(W("p", "来源当前样本没有可展示的比赛。"));
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
		if (t.append(W("p", `比赛：${r(n.match_id)} · 地图：${r(n.map)} · 比分：${i(n)}`)), !c) {
			t.append(W("p", `玩家：${r(n.focus?.id || e.target?.id)} · K/D/A：${a(n)} · rating：${m(n.rating)} · PW rating：${m(n.pw_rating)} · ADR：${m(n.adr)}`));
			return;
		}
		if (n.focus && typeof n.focus == "object" && t.append(W("p", `焦点：${r(n.focus.nickname)} · ${r(n.focus.account_id)} · K/D/A：${a(n.focus)} · rating：${m(n.focus.rating)} · PW rating：${m(n.focus.pw_rating)} · ADR：${m(n.focus.adr)}`)), !Array.isArray(n.players) || !n.players.length) {
			t.append(W("p", "来源未提供可用玩家名单。"));
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
	}, Ze = (e, t) => {
		if (!e || e.schema_version !== 1 || ![
			"success",
			"partial_success",
			"needs_selection",
			"error"
		].includes(e.status)) throw Error("invalid_result");
		if (t.replaceChildren(), e.status === "error") return t.append(W("p", typeof e.error?.message == "string" ? e.error.message : "来源未返回可用结果。", "steam-dlc-field-error")), !1;
		if (!e.document || !Array.isArray(e.document.blocks)) throw Error("invalid_result");
		for (let n of e.document.blocks) {
			if (n?.kind === "text" && typeof n.text == "string" && t.append(W("p", n.text)), n?.kind === "table" && Array.isArray(n.columns) && Array.isArray(n.rows)) {
				let e = W("div", void 0, "steam-dlc-table"), r = W("table"), i = W("tr");
				i.append(...n.columns.map((e) => W("th", String(e)))), r.append(i);
				for (let e of n.rows) {
					if (!Array.isArray(e)) continue;
					let t = W("tr");
					t.append(...e.map((e) => W("td", e === null ? "未知" : String(typeof e == "object" ? e.value ?? "" : e)))), r.append(t);
				}
				e.append(r), t.append(e);
			}
			let e = n?.kind === "fields" ? n.fields?.cs2 : null;
			if (n?.kind === "fields" && !e) {
				let e = W("dl");
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
					e.append(W("dt", t), W("dd", r === null ? "未知" : typeof r == "string" || typeof r == "number" || typeof r == "boolean" ? String(r) : "未提供"));
				}
				e.childNodes.length && t.append(e);
			}
			if (Array.isArray(e?.sources)) {
				let n = W("dl", void 0, "steam-dlc-source-status");
				for (let t of e.sources) n.append(W("dt", C[t.platform] || t.platform), W("dd", t.credential_state === "configured" ? "凭据已配置；查询时验证上游有效性。" : "需要在可信设置页授权。"));
				t.append(n);
			} else e?.data && (typeof e.fetched_at == "string" && t.append(W("p", `采样：${e.fetched_at}${e.season ? ` · 赛季 ${e.season}` : ""}`, "steam-dlc-hint")), Xe(e, t));
		}
		for (let n of e.warnings || []) typeof n == "string" && t.append(W("p", n, "steam-dlc-hint"));
		return e.status !== "needs_selection";
	}, Qe = () => {
		let e = W("form", void 0, "steam-dlc-public-form"), n = W("section", void 0, "steam-dlc-public-result");
		n.setAttribute("aria-live", "polite");
		let r = t.presentation?.grid(e) || e, i = $(r, "account", "玩家账号（SteamID64 / 5E domain）");
		i.required = !0;
		let a, o, s, c, l, u;
		a = $(r, "action", "查询类型", [
			"profile",
			"recent",
			"stats",
			"last",
			"match"
		], "profile"), o = $(r, "platform", "来源", [
			"perfect",
			"official",
			"5e"
		], "perfect"), c = $(r, "season", "赛季（可选）"), s = $(r, "limit", "近期展示数量", null, "5"), s.type = "number", s.min = "1", s.max = "20", s.step = "1", l = $(r, "match_id", "来源比赛 ID"), u = $(r, "focus", "单场焦点账号（可选）");
		let d = () => {
			c.disabled = !["profile", "stats"].includes(a.value), s.disabled = a.value !== "recent", l.disabled = a.value !== "match", u.disabled = a.value !== "match", l.required = a.value === "match";
		};
		G(a, "change", d), d(), K.append(W("p", "页面查询始终需要明确账号，不读取本人默认绑定。5E 使用 domain；官匹与 5E 单场仅限来源近期玩家摘要。", "steam-dlc-hint"));
		let f = W("button", "查询", "ui-button");
		f.type = "submit", f.dataset.variant = "primary", f.dataset.action = "query";
		let p = W("div", void 0, "steam-dlc-actions");
		p.append(f), e.append(p);
		let m = async (r) => {
			if (!J() || O) return;
			let d = r ? {} : { account: i.value.trim() };
			if (!r && (!d.account || !e.checkValidity())) {
				Y("请填写明确账号并检查输入范围。", "error");
				return;
			}
			r || (Object.assign(d, {
				action: a.value,
				platform: o.value
			}), !c.disabled && c.value.trim() && (d.season = c.value.trim()), s.disabled || (d.limit = Number(s.value)), l.disabled || (d.match_id = l.value.trim()), !u.disabled && u.value.trim() && (d.focus = u.value.trim()));
			let p = ++z;
			O = !0, Ye(), n.replaceChildren(W("p", "正在查询来源。")), Z(), f.setAttribute("aria-disabled", "true");
			try {
				let e = await t.services.invoke("query", d);
				if (!J() || p !== z) return;
				let r = Ze(e, n);
				e.status === "needs_selection" ? Y("需要补充选择，请按来源提示配置或改选。", "warning") : Y(r ? "来源结果已更新。" : "查询未完成，请查看来源反馈。", r ? "success" : "warning");
			} catch {
				if (!J() || p !== z) return;
				Ye(), n.replaceChildren(W("p", "请求未完成，或返回内容不完整。请核对来源设置后重试。", "steam-dlc-field-error")), Y("未取得可确认结果。", "error");
			} finally {
				q() && p === z && (O = !1, f.setAttribute("aria-disabled", String(!J())), Z());
			}
		};
		G(e, "submit", (e) => {
			e.preventDefault(), m(!1);
		});
		let h = W("button", "刷新来源状态", "ui-button");
		h.type = "button", h.dataset.action = "query-status", G(h, "click", () => {
			m(!0);
		}), p.append(h), K.append(e, n), t.presentation?.actions(p), m(!0);
	};
	if (a && t.routeId === "home") {
		if (K.append(W("p", a.summary)), i !== "steam") {
			let e = W("section", void 0, "steam-dlc-source-panel"), n = W("button", "刷新来源状态", "ui-button");
			n.type = "button", n.dataset.action = "refresh-status";
			let r = async () => {
				if (!J() || O) return;
				let r = ++z;
				O = !0, Z(), n.setAttribute("aria-disabled", "true");
				try {
					let n = await t.services.invoke("status", {});
					if (!J() || r !== z) return;
					Ze(n, e);
				} catch {
					J() && r === z && e.replaceChildren(W("p", "来源状态读取失败，请稍后刷新。", "steam-dlc-field-error"));
				} finally {
					q() && r === z && (O = !1, n.setAttribute("aria-disabled", String(!J())), Z());
				}
			};
			G(n, "click", () => {
				r();
			}), K.append(e, n), r();
		}
		K.append(W("h3", "命令帮助"));
		let e = W("dl", void 0, "steam-dlc-help");
		for (let [t, n] of a.commands) {
			let r = W("dt");
			r.append(W("code", t)), e.append(r, W("dd", n));
		}
		K.append(e), i === "steam" && (K.append(W("h3", "时长海报墙")), K.append(W("p", "游戏生涯拼图用累计小时映射每张作品的目标面积，提供单机、标准和长玩预设。大图跨行、小图填空，封面保持纵向比例；旧布局可以显式选择。未知时长不补零。", "steam-dlc-hint")), K.append(W("p", "games 与 recent 是不同公开样本；full 需要可选 Steam Key。选择来源不会自动把样本当成完整库。默认纵向 2:3，可切换 9:16 或 1:2；作品数量和输出预算共同约束分页，兼容旧布局最多 200 项。包含全部应用会纳入软件，旧设置中的关闭值继续保留。", "steam-dlc-hint")), Fe = W("p", "尚未读取缓存状态。", "steam-dlc-cache-value"), Q = W("button", "刷新缓存状态"), Q.className = "ui-button", Q.type = "button", Q.dataset.action = "refresh-cache", G(Q, "click", () => {
			Re();
		}), K.append(Fe, Q)), i === "dota2" && K.append(W("p", "账号可用 Dota ID32 或 SteamID64。订阅创建、查看和取消使用当前群或私聊中的命令；页面不伪造聊天身份。OpenDota Key 可选，匿名与有 Key 都遵守同一每小时预算；模型短评失败不会阻止基础通知。", "steam-dlc-hint"));
	} else if (a && t.routeId === "settings") {
		X = W("form"), G(X, "submit", (e) => {
			e.preventDefault(), Pe();
		});
		let e = W("div", void 0, "steam-dlc-actions");
		ve = W("button", "保存修改"), ve.className = "ui-button", ve.dataset.variant = "primary", ve.type = "submit", ve.dataset.action = "save", ye = W("button", "刷新配置"), ye.className = "ui-button", ye.type = "button", ye.dataset.action = "refresh", be = W("button", "放弃本模块修改"), be.className = "ui-button", be.type = "button", be.dataset.action = "discard", G(ye, "click", () => {
			Me(!0);
		}), G(be, "click", () => {
			J() && !O && j && (H.size && (ue += 1), H.clear(), ke(), Y("已放弃本模块修改。", "success"), Z());
		}), e.append(ve, ye, be), t.presentation?.actions(e), K.append(X), X.append(e), K.append(W("p", "回复主题中的“跟随核心”清除模块覆盖值。恢复默认先形成草稿，保存后生效。", "steam-dlc-hint"));
	} else if (i === "cs2" && t.routeId === "query") Qe(!1);
	else if (i === "steam" && t.routeId === "collage") {
		let e = f(K, {
			options: t,
			active: J,
			field: $,
			parseLimit: T,
			validatePNG: (e) => ee(e, n.defaultView),
			say: Y
		});
		re = e.dispose, ie = e.setAvailable, fe.push(e.dispose);
	} else if (i === "steam" && t.routeId === "wishlist") {
		let e = p(K, {
			options: t,
			active: J,
			field: $,
			say: Y
		});
		re = e.dispose, ie = e.setAvailable, fe.push(e.dispose);
	} else if (i === "dota2" && t.routeId === "analysis") {
		let e = h(K, {
			options: t,
			active: J,
			field: $,
			renderResult: Ze,
			say: Y
		});
		re = e.dispose, ie = e.setAvailable, fe.push(e.dispose);
	} else K.append(W("p", "该页面入口未声明，请返回模块列表重新进入。"));
	K.append(me);
	let $e = () => {
		l || (l = !0, E += 1, Ie += 1, F += 1, z += 1, O = !1, Ye(), oe.forEach((e) => {
			e.value = "";
		}), Be(), ze(), I = null, P = null, M = !1, N = !1, V !== null && (clearTimeout(V), V = null), H.clear(), j = null, fe.splice(0).forEach((e) => e()), de(), K.remove());
	};
	return t.scope.signal.addEventListener("abort", $e, { once: !0 }), fe.push(() => t.scope.signal.removeEventListener("abort", $e)), de = t.scope.onDispose($e), Z(), X && Me(), Q && Re(), {
		update(e) {
			if (l || u) return;
			let t = c.available;
			c = { ...e }, v(c) !== r || !q() ? (re(), z += 1, Ye(), oe.forEach((e) => {
				e.value = "";
			}), Se(), Y("模块运行上下文已变化，请重新进入页面。", "error")) : t !== c.available && (ie(c.available), z += 1, Ye(), F += 1, Be(), ze(), I = null, M = !1, N = !1, Ie += 1, E += 1, O = !1, k = !1, Y("页面可用状态已变化，请核对刷新后的配置。")), Z();
		},
		dispose: $e,
		navigationImpact: he
	};
}
//#endregion
//#region packages/steam_dlc/pages/src/entry.js
function M(f, p) {
	let m = n({ ...p.context }), h = p.context.owner.startsWith("steam_dlc/") ? p.context.owner.slice(10) : "", _ = g[h], v = p.routeId === "settings", y = p.routeId === "collage" ? "游戏生涯拼图" : p.routeId === "wishlist" ? "公开愿望单" : p.routeId === "analysis" ? "指定玩家分析" : p.routeId === "query" ? "平台查询" : "", b, x, S = !1, C = () => {}, w = [], T = {
		actions(n) {
			let i = [...n.childNodes], a = e({ setup: () => () => t(r, {}, { default: () => t("div", {
				style: { display: "contents" },
				ref: (e) => {
					if (e) for (let t of i) t.parentNode !== e && e.append(t);
				}
			}) }) });
			a.mount(n), w.push(a);
		},
		grid(n, r) {
			let i = f.ownerDocument.createElement("div");
			n.insertBefore(i, r || null);
			let o, s = e({ setup: () => () => t(a, {}, { default: () => t("div", {
				style: { display: "contents" },
				ref: (e) => {
					o = e;
				}
			}) }) });
			return s.mount(i), w.push(s), o;
		},
		field(r, { control: a, reset: o, label: s, hint: c, error: l }) {
			let u = f.ownerDocument.createElement("div");
			r.append(u);
			let d = n(c.textContent), p = n(l.textContent), m = e({ setup: () => () => t(i, {
				controlId: a.id,
				label: s.textContent,
				hint: d.value,
				error: p.value,
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
			return m.mount(u), w.push(m), {
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
	}, E = e({ setup: () => () => t(d, {
		theme: m.value.theme,
		locale: m.value.locale,
		styleMountTarget: f
	}, { default: () => t("section", {
		class: "steam-dlc-view",
		lang: m.value.locale
	}, [t(o, {
		title: _ ? `${_.title}${v ? " 设置" : y ? ` ${y}` : ""}` : "模块页面不可用",
		eyebrow: "YOMIHIME GAME LINK / STEAM DLC",
		subtitle: v ? "维护查询、输出设置与来源授权。" : _?.summary
	}), t(c, {}, {
		default: () => t(s, {
			title: v ? "模块设置与来源" : y || "命令与可用状态",
			number: "01"
		}, { default: () => t("div", { ref: (e) => {
			b = e;
		} }) }),
		aside: () => t(u, { title: v ? "设置说明" : "数据与账号" }, { default: () => [t(l, {}, { default: () => v ? h === "steam" ? "选择公开样本或完整库、布局、时长预设、比例和输出预算。完整库需要可选 Steam Key；是否完整以来源实际返回为准。" : h === "cs2" ? "完美授权与 5E Token 仅用于来源请求，玩家查询目标保持独立。二维码需由账号本人亲自确认；离页将停止轮询。" : h === "dota2" ? "订阅设置控制当前服务的采集与预算；具体群或私聊订阅通过本人命令管理。OpenDota Key 可选，不会自动扩大请求额度。" : "网页浅深主题与命令图片回复主题分别设置。回复主题选项由当前授权配置提供。" : _?.source || "当前页面没有可用的模块声明。" }), t("p", { class: "steam-dlc-hint" }, v ? "保存后会重新读取并核对结果；冲突或未确认结果需要手动刷新。" : "默认账号只在已授权的命令路径使用。自然语言工具必须提供明确账号或比赛编号。")] })
	})]) }) });
	E.mount(f), x = j(b, {
		...p,
		presentation: T,
		scope: {
			signal: p.scope.signal,
			isCurrent: () => p.scope.isCurrent(),
			onDispose: () => () => {}
		}
	});
	let ee = () => {
		S || (S = !0, x.dispose(), w.splice(0).reverse().forEach((e) => e.unmount()), E.unmount(), C());
	};
	return C = p.scope.onDispose(ee), {
		update(e) {
			S || (x.update(e), m.value = { ...e });
		},
		dispose: ee,
		navigationImpact: x.navigationImpact
	};
}
//#endregion
export { M as mount };
