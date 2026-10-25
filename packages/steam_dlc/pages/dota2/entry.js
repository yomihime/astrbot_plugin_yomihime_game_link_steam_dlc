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
	}, O = () => {
		for (let e of c.splice(0)) s.defaultView.URL.revokeObjectURL(e);
	}, k = () => {
		if (!t.services.jobs) throw C("任务服务暂不可用，请刷新模块。");
		return t.services.jobs;
	}, A = T("form");
	A.className = "steam-dlc-public-form";
	let ee = t.presentation?.grid(A) || A, te = r(ee, "account", "SteamID64 / Dota ID32（明确账号）"), j = {};
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
	]) j[e] = r(ee, e, t, n, i);
	j.all_apps.options[0].textContent = "全部应用", j.all_apps.options[1].textContent = "仅游戏";
	let M = r(ee, "limit", "数量（至少20，可手填超过1000）", null, "500");
	M.inputMode = "decimal";
	let N = T("div");
	N.className = "steam-dlc-actions";
	let P = (e, t, n) => {
		let r = T("button", t);
		return r.type = "button", r.className = "ui-button", r.dataset.action = e, E(r, "click", () => {
			if (!b() || _) return;
			let e = p, t = (t) => ae(t, e);
			try {
				let r = n();
				e = p, r && typeof r.then == "function" && (_ = !0, z(), r.catch(t).finally(() => {
					x(e) && (_ = !1, z());
				}));
			} catch (e) {
				t(e);
			}
		}), N.append(r), r;
	};
	for (let e of [
		20,
		50,
		100,
		200,
		500,
		1e3,
		"all"
	]) P(`limit-${e}`, e === "all" ? "不限" : String(e), () => {
		j.limit_mode.value = e === "all" ? "all" : "top", M.disabled = e === "all", e !== "all" && (M.value = String(e));
	});
	E(j.limit_mode, "change", () => {
		M.disabled = j.limit_mode.value === "all";
	});
	let F = T("button", "提交拼图任务");
	F.type = "submit", F.className = "ui-button", F.dataset.action = "generate", F.dataset.variant = "primary", N.append(F);
	let I = r(ee, "job_id", "任务ID（刷新后自动恢复）"), L = T("p", "尚未提交任务。");
	L.setAttribute("role", "status");
	let R = T("section");
	R.className = "steam-dlc-public-result";
	let z = () => {
		let e = !b();
		A.setAttribute("aria-busy", String(_));
		for (let t of A.querySelectorAll("button")) t.disabled = e || _;
		for (let t of A.querySelectorAll("input,select")) t.disabled = e;
		M.disabled = e || j.limit_mode.value === "all", ie.disabled = e || _ || !["queued", "running"].includes(h?.status), oe.disabled = e || _ || ![
			"failed",
			"cancelled",
			"interrupted"
		].includes(h?.status), oe.hidden = ![
			"failed",
			"cancelled",
			"interrupted"
		].includes(h?.status), ie.hidden = !["queued", "running"].includes(h?.status), se.disabled = e || _ || !g;
	}, B = `ygl:job:${t.context.owner}:${t.routeId}`, V = (e) => {
		if (!e || typeof e.job_id != "string" || !Number.isSafeInteger(e.revision) || ![
			"queued",
			"running",
			"succeeded",
			"failed",
			"cancelled",
			"interrupted"
		].includes(e.status)) throw C("任务状态无法验证。");
		h = e, I.value = h.job_id;
		try {
			s.defaultView.sessionStorage.setItem(B, h.job_id);
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
		let d = (e) => Number.isSafeInteger(e) && e >= 0 ? String(e) : "待确认";
		L.textContent = `任务 ${h.job_id} · ${i[h.status]} · 来源${d(n.source_returned ?? t.source_returned)} · ${(n.eligible_complete ?? t.eligible_complete) === !1 ? "已确认符合" : "符合"}${d(n.eligible ?? t.eligible)} · 已选${d(n.selected ?? t.selected)} · 已生成${d(n.generated ?? t.generated)} · 待处理${d(n.pending ?? t.pending)} · 缺图${d(n.missing_images ?? t.missing_images)}${o ? ` · ${o}` : ""}${a === "rate_limited" && l ? ` · 来源建议等待${c}秒后再试（非自动重试或倒计时）。` : ""}${(n.complete_source ?? t.complete_source) === !1 ? " · 来源覆盖不完整" : ""}`;
		let f = n.metadata_unexamined ?? t.metadata_unexamined, p = [
			"examined",
			"unexamined",
			"classification_unknown"
		].map((e) => n[e] ?? t[e]), m = n.metadata_failures ?? n.counters?.metadata_failed ?? t.counters?.metadata_failed ?? 0;
		p.some((e) => e !== void 0) ? L.textContent += ` · 已检查${d(p[0])}项 · 未检查${d(p[1])}项 · 已检查中类型未知${d(p[2])}项` : f && (L.textContent += ` · 类型尚未验证${f}项（未区分未检查与已检查但类型未知）`), n.selection_exact === !0 && n.all_apps === !1 && (L.textContent += ` · 选集排序已验证${Number.isSafeInteger(p[1]) && p[1] > 0 ? "，剩余未检查" : ""}`), m && (L.textContent += ` · 元数据请求失败${m}次`), ["queued", "running"].includes(h.status) ? L.textContent += " · 可刷新状态或取消任务；排队或执行中不能重试。" : [
			"failed",
			"cancelled",
			"interrupted"
		].includes(h.status) && (L.textContent += " · 核对条件后可稍后重试，显式重新执行并复用有效缓存；不会从最后一项自动断点续跑。"), y > 0 && (L.textContent += ` · 已发布图片资源${y}项，可点击“查询结果页”或使用 /ygl steam wall result ${h.job_id} 查看。`), z();
	}, ne = async (e) => {
		if (!h || !b()) return;
		let t = p, n = ++m, r = h.job_id, i = await k().result(r, {
			cursor: e,
			page_size: 20
		});
		if (x(t) && n === m && h?.job_id === r) {
			if (!Array.isArray(i.entries) || i.entries.length > 20) throw C("任务结果范围无法验证。");
			if (i.entries.some((e) => e?.resource?.media_type !== "image/png" || typeof e.resource.asset_id != "string" || !e.resource.asset_id)) throw C("任务资源无法验证。");
			i.entries.length && (y = Math.max(y, i.entries.length), V(h)), O(), R.replaceChildren(), g = i.next_cursor || null;
			for (let [e, o] of i.entries.entries()) {
				let i = await k().resource(r, o.resource.asset_id);
				if (!x(t) || n !== m || h?.job_id !== r) return;
				if (i?.type !== "image/png" || typeof i.arrayBuffer != "function" || i.size > 16777216) throw C("图片资源无法验证。");
				if (a(new Uint8Array(await i.arrayBuffer())), !x(t) || n !== m || h?.job_id !== r) return;
				let l = s.defaultView.URL.createObjectURL(i);
				c.push(l);
				let u = T("figure"), d = T("img"), f = T("a", "下载原始 PNG");
				u.className = "steam-dlc-preview", d.src = l, d.alt = `批次${Number(o.metadata?.batch_index ?? 0) + 1} · 图片${e + 1}`, f.href = l, f.className = "ui-button", f.download = `steam-career-${o.metadata?.batch_index ?? 0}-${e + 1}.png`, u.append(d, f), R.append(u);
			}
			i.entries.length || R.append(T("p", "当前没有已完成结果页。")), z();
		}
	}, re = async () => {
		if (D(), !h || !b()) return;
		let e = p, t = h.job_id;
		try {
			let n = await k().status(t);
			if (!x(e) || h?.job_id !== t) return;
			V(n), ["queued", "running"].includes(h.status) ? f = setTimeout(() => {
				re();
			}, 1500) : await ne(null);
		} catch (t) {
			ae(t, e);
		}
	}, ie = P("job-cancel", "取消任务", async () => {
		if (!h || !["queued", "running"].includes(h.status)) return;
		D();
		let e = ++p, t = await k().cancel(h.job_id, h.revision);
		x(e) && (V(t), await re());
	}), H = () => {
		m += 1, y = 0, g = null, O(), R.replaceChildren();
	}, ae = (e, t) => {
		if (x(t)) {
			if (!S.has(e?.message)) {
				o(w(e), "error");
				return;
			}
			d = !0, p += 1, D(), H(), _ = !1, v = null, h = null, I.value = "", te.value = "";
			try {
				s.defaultView.sessionStorage.removeItem(B);
			} catch {}
			L.textContent = "任务页面授权或运行上下文已失效，请重新进入页面。", o("页面授权或运行上下文已变化，请重新进入页面。", "error"), z();
		}
	}, oe = P("job-retry", "重新执行（复用有效缓存）", async () => {
		if (!h || ![
			"failed",
			"cancelled",
			"interrupted"
		].includes(h.status)) return;
		D(), H();
		let e = ++p, t = await k().retry(h.job_id, h.revision);
		x(e) && (V(t), await re());
	}), se = P("job-next", "下一页结果", async () => {
		g && await ne(g);
	});
	se.disabled = !0, P("job-results", "查询结果页", async () => {
		await ne(null);
	}), P("job-refresh", "恢复 / 刷新任务", async () => {
		I.value.trim() && (D(), H(), p += 1, h = { job_id: I.value.trim() }, await re());
	}), ie.disabled = !0, oe.disabled = !0, E(A, "submit", (e) => {
		e.preventDefault(), b() && !_ && (async () => {
			let e = ++p;
			D(), H();
			try {
				let t = Object.fromEntries(Object.entries(j).map(([e, t]) => [e, e === "all_apps" ? t.value === "true" : t.value]));
				if (t.account = te.value.trim(), !t.account) throw C("请提供明确账号。");
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
				_ = !0, z();
				let n = JSON.stringify(t);
				(!v || v.fingerprint !== n) && (v = {
					fingerprint: n,
					key: s.defaultView.crypto.randomUUID()
				});
				let r = await k().submit({
					handler_id: "steam_wall",
					parameters: t,
					idempotency_key: v.key
				});
				if (!x(e)) return;
				V(r), v = null, o("任务已提交，关闭页面只停止轮询。", "success"), await re();
			} catch (t) {
				ae(t, e);
			} finally {
				x(e) && (_ = !1, z());
			}
		})();
	}), A.append(N), e.append(T("p", "不限覆盖来源实际返回范围。每批有资源预算，已完成页保留；关闭页面只停止轮询，取消需明确点击。"), A, L, R), t.presentation?.actions(N), z();
	try {
		let e = s.defaultView.sessionStorage.getItem(B);
		e && (I.value = e, h = { job_id: e }, re());
	} catch {}
	return {
		setAvailable(e) {
			u || d || (p += 1, H(), D(), _ = !1, v = null, h = null, g = null, L.textContent = e ? "页面已恢复，请手动恢复 / 刷新任务，或提交新任务。" : "任务页面暂不可用，已停止轮询；任务ID保留供恢复后查询。", z());
		},
		dispose() {
			u || (u = !0, p += 1, m += 1, _ = !1, v = null, D(), O(), R.replaceChildren(), L.textContent = "任务页面上下文已变化，请重新进入。", z(), l.splice(0).forEach((e) => e()));
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
function D(e, t) {
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
var O = /* @__PURE__ */ new Map(), k = 4, A = 4096, ee = 256;
function te(e, t, n) {
	for (let [n, r] of O) r.owner === e.owner && n !== t && O.delete(n);
	if (!n || t.length > A) return null;
	let r = O.get(t) || {
		owner: e.owner,
		drafts: /* @__PURE__ */ new Map(),
		token: null
	};
	for (r.token = Symbol("ordinary-draft-mount"), O.delete(t), O.set(t, r); O.size > k;) O.delete(O.keys().next().value);
	return r;
}
function j(e, t) {
	let n = e.ownerDocument, r = v(t.context), i = t.context.owner.startsWith("steam_dlc/") ? t.context.owner.slice(10) : "", a = g[i], o = a ? te(t.context, r, t.routeId === "settings") : null, s = o?.token, c = { ...t.context }, l = !1, u = !1, d = !1, E = 0, k = !1, A = !1, j = null, M = !1, N = !1, P = null, F = 0, I, L = null, R = null, z = !1, B = 0, V = () => {}, ne = () => {}, re = [], ie = [], H = /* @__PURE__ */ new Map(), ae = () => {}, oe = 0, se = "", ce = 0, le = null, ue = () => {}, U = new Map(o?.drafts), W = /* @__PURE__ */ new Map(), de = [], G = (e, t, r) => {
		let i = n.createElement(e);
		return t !== void 0 && (i.textContent = t), r && (i.className = r), i;
	}, K = (e, t, n) => {
		e.addEventListener(t, n), de.push(() => e.removeEventListener(t, n));
	}, q = G("section", void 0, "steam-dlc-page"), fe = G("p", "", "steam-dlc-hint");
	fe.setAttribute("role", "status");
	let pe = G("p", "", "steam-dlc-message");
	pe.setAttribute("role", "status"), pe.setAttribute("aria-live", "polite"), q.append(fe), e.replaceChildren(q);
	let J = () => ((t.scope.signal.aborted || !t.scope.isCurrent()) && (d = !0), !l && !u && !d && v(c) === r && (!o || O.get(r) === o && o.token === s)), Y = () => J() && c.available, me = () => Object.freeze({
		ordinary: U.size > 0,
		credentials: J() && ([...H.values()].some((e) => !!e.input?.value) || L?.state === "waiting"),
		pending: k || M,
		version: oe
	}), he = () => {
		let e = JSON.stringify([
			U.size > 0,
			k,
			ce,
			me().credentials,
			M
		]);
		e !== se && (se = e, oe += 1, t.onNavigationStateChange?.());
	}, X = (e, t = "warning") => {
		le !== null && (clearTimeout(le), le = null), pe.textContent = e, pe.dataset.tone = t, e && t === "success" && (le = setTimeout(() => {
			le = null, J() && (pe.textContent = "");
		}, 3500));
	}, ge = () => {
		q.dataset.theme = c.theme, fe.textContent = J() ? c.available ? "当前页面入口可用。运行健康请在模块管理中查看；此处不检测上游服务。" : "当前页面入口不可用，请在模块管理中刷新状态后重新进入。" : "页面上下文已失效，请重新进入本模块。";
	}, _e, ve, ye, be, xe = () => {
		o && J() && (o.drafts = new Map([...U].filter(([e, t]) => {
			let n = x[i]?.includes(e), r = t.rawValue ?? t.value;
			return n && (t.kind === "clear" || t.kind === "set" && [
				"string",
				"boolean",
				"number"
			].includes(typeof r) && !(typeof r == "number" && !Number.isFinite(r)) && !(typeof r == "string" && r.length > ee));
		})));
	}, Se = () => {
		(o ? O.get(r) === o && o.token === s : t.routeId === "home") && O.delete(r), u = !0, E += 1, k = !1, A = !1, U.size && (ce += 1), U.clear(), j = null;
		for (let { control: e } of W.values()) e.value = "";
		F += 1, Be(), ze(), P = null, L = null, M = !1, N = !1;
	}, Z = () => {
		if (xe(), ge(), q.setAttribute("aria-busy", String(k || M)), ve) {
			ve.setAttribute("aria-disabled", String(!Y() || k || M || L?.state === "waiting" || !A || !U.size)), ye.setAttribute("aria-disabled", String(!Y() || k || M)), be.setAttribute("aria-disabled", String(!Y() || k || M || !U.size));
			for (let { control: e, reset: t } of W.values()) e.disabled = !Y() || !j, t.setAttribute("aria-disabled", String(!Y() || !j));
		}
		Q && Q.setAttribute("aria-disabled", String(!Y() || k)), ae(), he();
	}, Ce = [], we = (e) => {
		if (!e || !Number.isSafeInteger(e.revision) || e.revision < 1 || !e.fields || !e.descriptors || (Ce = (x[i] || []).filter((t) => e.fields[t] && e.descriptors[t]), !Ce.includes("reply_theme") || i === "dota2" && !Ce.includes("timezone"))) throw Error("invalid_snapshot");
		for (let t of Ce) {
			let n = e.fields[t], r = e.descriptors[t];
			if (!n || !r || typeof r.description != "string" || t === "reply_theme" && (!Array.isArray(r.choices) || !r.choices.length || !r.choices.some((e) => e.value === null) || r.choices.some((e) => typeof e.label != "string" || e.value !== null && typeof e.value != "string")) || t === "timezone" && r.value_schema?.type !== "string" || t === "poster_include_apps" && (r.value_schema?.type !== "boolean" || typeof r.default != "boolean" || typeof n.value != "boolean") || t === "poster_limit" && (r.value_schema?.type !== "integer" || ![1, 20].includes(r.value_schema.minimum) || !Number.isInteger(r.default) || !Number.isInteger(n.value))) throw Error("invalid_snapshot");
		}
		return e;
	}, Te = (e) => {
		let t = U.get(e);
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
		if (!Y() || !j) return;
		let n = j.fields[e], r = !k && (t.kind === "clear" ? !n.present : n.state === "valid" && _(n.value, t.value)) ? void 0 : t;
		if (_(U.get(e), r)) return;
		r === void 0 ? U.delete(e) : U.set(e, r), ce += 1, W.get(e).error.textContent = "", W.get(e).control.setAttribute("aria-invalid", "false");
		let i = U.size && (!o || [...U.values()].some((e) => e.kind === "set" && typeof (e.rawValue ?? e.value) == "string" && (e.rawValue ?? e.value).length > ee));
		X(i ? "输入超过草稿保留上限，请先修正再切页。" : U.size ? "有未保存的修改。" : "", "warning"), Z();
	}, ke = () => {
		for (let [e, { control: t, error: n, hint: r }] of W) {
			r.textContent = j.descriptors[e].description;
			let i = Te(e);
			if (De(e)) {
				let n = Ee(e);
				t.replaceChildren(...n.map((e, t) => {
					let n = G("option", e.label);
					return n.value = String(t), n;
				})), t.value = String(n.findIndex((e) => _(e.value, i)));
			} else t.value = U.get(e)?.rawValue === void 0 ? typeof i == "string" || typeof i == "number" ? String(i) : "" : U.get(e).rawValue;
			n.textContent = j.fields[e].state !== "valid" && !U.has(e) ? "当前配置无效，请修改或恢复默认后保存。" : "", t.setAttribute("aria-invalid", String(!!n.textContent));
		}
	}, Ae = () => {
		let e = t.presentation?.grid(_e, _e.querySelector(".steam-dlc-actions"));
		for (let n of Ce) {
			let r = j.descriptors[n], a = G("div", void 0, "steam-dlc-field"), o = G("label", S[n] || n), s = G(De(n) ? "select" : "input");
			s.className = "ui-control", s.id = `steam-dlc-${i}-${n}`, o.htmlFor = s.id, s.name = n;
			let c = G("p", r.description, "steam-dlc-hint");
			c.id = `${s.id}-hint`;
			let l = G("p", "", "steam-dlc-field-error");
			l.id = `${s.id}-error`, s.setAttribute("aria-describedby", `${c.id} ${l.id}`), n === "timezone" && (s.type = "text", s.autocomplete = "off", s.maxLength = Math.min(r.value_schema.maxLength ?? ee, ee)), !De(n) && r.value_schema?.type === "integer" && (s.type = "number", s.min = String(r.value_schema.minimum), r.value_schema.maximum !== void 0 && (s.max = String(r.value_schema.maximum)), s.step = "1", n === "poster_limit" && (s.type = "text", s.inputMode = "decimal", s.removeAttribute("min"), s.removeAttribute("max")));
			let u = G("button", "恢复默认");
			u.className = "ui-button", u.type = "button", u.dataset.action = `reset-${n}`, K(u, "click", () => {
				Y() && j && (Oe(n, { kind: "clear" }), ke());
			});
			let d = G("div", void 0, "steam-dlc-actions");
			if (d.append(u), n === "poster_limit") for (let e of [
				20,
				50,
				100,
				200,
				500,
				1e3,
				"all"
			]) {
				let t = G("button", e === "all" ? "不限" : String(e), "ui-button");
				t.type = "button", K(t, "click", () => {
					if (Y() && j) {
						if (W.has("poster_limit_mode") && Oe("poster_limit_mode", {
							kind: "set",
							value: e === "all" ? "all" : "top"
						}), e !== "all") Oe(n, {
							kind: "set",
							value: e
						});
						else if (!W.has("poster_limit_mode")) {
							X("当前配置尚未提供不限模式，请刷新模块版本。", "warning");
							return;
						}
						ke();
					}
				}), d.append(t);
			}
			K(s, De(n) ? "change" : "input", () => {
				if (Y() && j) {
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
			W.set(n, {
				control: s,
				reset: u,
				error: f?.error || l,
				hint: f?.hint || c
			}), f || (a.append(o, s, d, c, l), _e.insertBefore(a, _e.querySelector(".steam-dlc-actions")));
		}
	}, je = (e) => {
		j = we(e);
		for (let [e, t] of U) {
			let n = j.fields[e];
			(t.kind === "clear" ? !n.present : n.state === "valid" && _(n.value, t.value)) && (U.delete(e), ce += 1);
		}
		W.size || Ae(), ke(), A = !0;
	}, Me = async (e = !1) => {
		if (!Y() || k || M) return;
		e && ze();
		let n = ++E;
		k = !0, Z();
		try {
			if (!Y() || n !== E) return;
			let r = await t.services.config.current();
			if (!Y() || n !== E) return;
			je(r);
			try {
				await He();
			} catch (e) {
				if (!Y() || n !== E) return;
				Ve(e), Y() && X("普通配置已读取；来源凭据状态未确认，请单独刷新凭据。", "warning");
				return;
			}
			if (!Y() || n !== E) return;
			X(U.size ? "已刷新；草稿已保留，请核对后保存。" : e ? "已刷新。" : "", U.size ? "warning" : "success");
		} catch (e) {
			if (!Y() || n !== E) return;
			if (b.has(y(e))) {
				Se(), X("管理授权或模块上下文已失效，请重新进入页面。", "error"), Z();
				return;
			}
			A = !1, X("配置读取未完成。请检查 Dashboard 授权与模块状态，再手动刷新。", "error");
		} finally {
			J() && n === E && (k = !1, Z());
		}
	}, Ne = () => {
		let e = !0;
		for (let [t, n] of U) {
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
			W.get(t).error.textContent = i, W.get(t).control.setAttribute("aria-invalid", String(!!i)), i && (e = !1);
		}
		return W.has("poster_mode") && Te("poster_mode") === "legacy" && Te("poster_limit") > 200 && (W.get("poster_limit").error.textContent = "兼容旧布局最多支持 200 项，请调整数量或选择游戏生涯拼图。", W.get("poster_limit").control.setAttribute("aria-invalid", "true"), e = !1), e;
	}, Pe = async () => {
		if (!Y() || k || M || L?.state === "waiting" || !A || !U.size || !Ne()) return;
		let e = new Map(U), n = {}, r = [];
		for (let [t, i] of e) i.kind === "clear" ? r.push(t) : n[t] = i.value;
		let i = j.revision, a = !1, o = ++E;
		k = !0, A = !1, X("正在保存，请等待确认。"), Z();
		let s = (e) => {
			if (!e || !Number.isSafeInteger(e.revision) || e.revision <= i) throw Error("invalid_receipt");
			i = e.revision, a = !0;
		};
		try {
			if (!Y() || o !== E) return;
			if (Object.keys(n).length) {
				let e = await t.services.config.save(i, n);
				if (!Y() || o !== E) return;
				s(e);
			}
			if (r.length) {
				let e = await t.services.config.clear(i, r);
				if (!Y() || o !== E) return;
				s(e);
			}
			let a = await t.services.config.current();
			if (!Y() || o !== E) return;
			if (we(a), a.revision < i) throw Error("unverified_snapshot");
			for (let [t, n] of e) {
				let e = a.fields[t];
				if (n.kind === "clear" ? e.present : e.state !== "valid" || !_(e.value, n.value)) throw Error("unverified_snapshot");
			}
			for (let [t, n] of e) U.get(t) === n && (U.delete(t), ce += 1);
			je(a);
			try {
				await He();
			} catch (e) {
				if (!Y() || o !== E) return;
				Ve(e), Y() && X("普通配置已保存并核对；来源凭据状态未确认，请单独刷新凭据。", "warning");
				return;
			}
			if (!Y() || o !== E) return;
			X(U.size ? "已保存本次提交；仍有新的未保存修改。" : "已保存。", U.size ? "warning" : "success");
		} catch (e) {
			if (!Y() || o !== E) return;
			if (b.has(y(e))) {
				Se(), X("管理授权或模块上下文已失效，请重新进入页面。", "error"), Z();
				return;
			}
			let t = y(e) === "revision_conflict";
			X(a ? "部分或全部修改已提交，状态暂未核实。请手动刷新并核对，不要重复提交。" : t ? "配置已被其他操作修改。草稿已保留，请手动刷新、核对后再保存。" : y(e) === "invalid_config" ? "配置未被接受。请检查字段，手动刷新并核对后再保存。" : "保存结果尚未确认。草稿已保留，请手动刷新并核对，不要重复提交。", "error");
		} finally {
			J() && o === E && (k = !1, Z());
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
		if (!Y() || k || !Q) return;
		let e = ++Ie;
		k = !0, Z();
		try {
			let n = await t.services.invoke("wall_cache_status", {});
			if (!Y() || e !== Ie) return;
			let r = Le(n);
			Fe.textContent = `缓存：${r.items} 项 / ${r.bytes} 字节；上限 ${r.max_items} 项 / ${r.max_bytes} 字节；已淘汰 ${r.evictions} 项。`, X("缓存状态已刷新。此操作只读取统计；普通刷新游戏库会继续复用有效原图。", "success");
		} catch {
			if (!Y() || e !== Ie) return;
			Fe.textContent = "缓存状态暂不可用。", X("读取缓存状态失败，请稍后重试。", "error");
		} finally {
			J() && e === Ie && (k = !1, Z());
		}
	}, ze = () => {
		for (let e of H.values()) e.input && (e.input.value = "");
	}, Be = () => {
		R !== null && (clearTimeout(R), R = null), H.get("credential_perfect")?.qr?.removeAttribute("src");
	}, Ve = (e) => {
		b.has(y(e)) ? (Se(), X("管理授权或页面上下文已失效，请重新进入。", "error")) : y(e) === "operation_cancelled" ? X("已取消操作。") : (P = null, X(y(e) === "revision_conflict" ? "设置已被其他操作修改。凭据输入已清除，请刷新状态后重新操作。" : "操作未完成或结果未确认。凭据输入已清除，请刷新并核对状态。", "error"));
	}, He = async () => {
		if (!Y() || !w[i] || !t.services.credentials?.status) return;
		let e = F, n = E, r = await t.services.credentials.status();
		if (Y() && e === F && n === E) {
			if (!r || !Number.isSafeInteger(r.revision) || r.revision < 1 || !r.fields) throw Error("invalid_credential_status");
			for (let [e] of w[i]) {
				let t = r.fields[e];
				if (t && (typeof t.configured != "boolean" || typeof t.decryptable != "boolean" || t.upstream !== "unverified")) throw Error("invalid_credential_status");
			}
			P = r, Je(), ae();
		}
	}, Ue = async (e) => {
		let n = F;
		if (!e || !Number.isSafeInteger(e.revision) || e.revision <= P.revision) throw Error("invalid_receipt");
		let r = await t.services.config.current();
		if (Y() && n === F) {
			if (r.revision < e.revision) throw Error("unverified_snapshot");
			je(r), await He();
		}
	}, We = async (e, n) => {
		if (!Y() || k || M || !P || L?.state === "waiting") return;
		let r = H.get(e).input?.value.trim();
		if (!n && (!r || r.length > 4096 || /[\x00-\x1f\x7f-\x9f]/u.test(r))) {
			X("请输入 1 到 4096 字符的有效 Key 或 Token。", "error");
			return;
		}
		let i = ++F;
		ze(), M = !0, Z();
		try {
			let a = n ? await t.services.credentials.clear(P.revision, e) : await t.services.credentials.replace(P.revision, e, { token: r });
			if (!Y() || i !== F || (await Ue(a), !Y() || i !== F)) return;
			let o = P.fields[e];
			if (!o || o.configured === n) throw Error("unverified_snapshot");
			X(n ? "凭据已清除。" : "凭据已保存；有效性会在来源请求时验证。", "success");
		} catch (e) {
			Y() && i === F && Ve(e);
		} finally {
			J() && i === F && (M = !1, Z());
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
		if (!Y() || L?.state !== "waiting" || z) return;
		R !== null && clearTimeout(R);
		let e = L.expires_at * 1e3 - Date.now();
		if (e <= 0) {
			Be(), L = {
				...L,
				state: "expired"
			}, X("二维码已超时，请重新登录。"), Z();
			return;
		}
		let t = Math.min(e, Math.max(250, L.next_poll_at * 1e3 - Date.now()));
		R = setTimeout(() => {
			R = null, qe("poll");
		}, t);
	}, qe = async (e) => {
		if (!Y() || !P || e === "cancel" && (z = !0, Be(), Z(), M) || k || M) return;
		e === "begin" && (Be(), L = null, z = !1);
		let n = ++F, r = L?.session_id || "", i = null;
		M = !0, N = !0, ze(), Z();
		try {
			let a = await t.services.credentials.authorize(P.revision, "perfect_qr", e, r);
			if (!Y() || n !== F) return;
			if (e === "qr") {
				if (typeof a.qr_png != "string" || a.qr_png.length > 5e5 || !/^iVBORw0KGgo[A-Za-z0-9+/=]*$/u.test(a.qr_png)) throw Error("invalid_qr_png");
				z || (H.get("credential_perfect").qr.src = `data:image/png;base64,${a.qr_png}`);
			} else {
				if (e === "revoke") {
					if (!a || Object.keys(a).sort().join(",") !== "receipt,revoked" || a.revoked !== !0 || !a.receipt) throw Error("invalid_revocation_receipt");
					L = null;
				} else L = Ge(a.session);
				if (a.receipt && await Ue(a.receipt), !Y() || n !== F) return;
				if (e === "revoke" && P?.fields.credential_perfect?.configured !== !1) throw Error("unverified_revocation");
				if (L?.state === "waiting") X(z ? "正在取消扫码。" : "请使用完美 App 扫码并亲自确认授权；留在本页等待结果。"), e === "begin" && (i = "qr");
				else {
					Be();
					let t = L?.state;
					X(t === "authorized" ? "完美授权已保存，玩家 Steam 绑定保持独立。" : e === "revoke" ? "完美授权已撤销。" : t === "expired" ? "二维码已过期，请重新登录。" : t === "cancelled" ? "扫码已取消。" : "授权会话已结束，请刷新状态。", t === "authorized" || e === "revoke" ? "success" : "warning"), z = !1;
				}
			}
		} catch (e) {
			Y() && n === F && (Be(), L = null, z = !1, Ve(e));
		} finally {
			J() && n === F && (M = !1, N = !1, Z(), z && L?.state === "waiting" ? qe("cancel") : i ? qe(i) : L?.state === "waiting" && Ke());
		}
	}, Je = () => {
		let e = (w[i] || []).filter(([e]) => P.fields[e]);
		if (e.length) {
			I || (I = G("section", void 0, "steam-dlc-credentials"), I.append(G("h3", "来源凭据与授权"), G("p", "凭据只在可信管理入口提交。输入不保留为跨页草稿；已配置不代表上游已验证有效。", "steam-dlc-hint")), q.insertBefore(I, pe));
			for (let [n, r] of e) {
				if (H.has(n)) continue;
				let e = G("section", void 0, "steam-dlc-credential"), i = G("p", "", "steam-dlc-credential-status");
				i.setAttribute("role", "status");
				let a = G("div", void 0, "steam-dlc-actions"), o = {
					status: i,
					actions: a,
					buttons: []
				};
				e.append(G("h4", r), i);
				let s = (e, t, n) => {
					let r = G("button", t, "ui-button");
					return r.type = "button", r.dataset.action = e, K(r, "click", () => {
						r.getAttribute("aria-disabled") !== "true" && n();
					}), a.append(r), o.buttons.push(r), r;
				};
				if (n === "credential_perfect") o.qr = G("img", void 0, "steam-dlc-qr"), o.qr.alt = "完美登录二维码，仅供本次管理员授权", o.qr.setAttribute("referrerpolicy", "no-referrer"), e.append(o.qr), s("perfect-begin", "扫码登录 / 重新登录", () => {
					qe("begin");
				}), s("perfect-cancel", "取消扫码", () => {
					qe("cancel");
				}), s("perfect-poll", "检查扫码状态", () => {
					qe("poll");
				}), s("perfect-revoke", "撤销完美授权", () => {
					qe("revoke");
				});
				else {
					let i = G("input");
					if (i.type = "password", i.className = "ui-control", i.id = `steam-dlc-${n}`, i.name = n, i.maxLength = 4096, i.autocomplete = "new-password", i.spellcheck = !1, i.setAttribute("aria-label", r), o.input = i, t.presentation) {
						let n = G("label", r), a = G("p", "来源凭据不会作为普通草稿保留。"), o = G("p");
						a.id = `${i.id}-hint`, o.id = `${i.id}-error`, t.presentation.field(e, {
							control: i,
							label: n,
							hint: a,
							error: o
						});
					} else e.append(i);
					K(i, "input", Z), s(`replace-${n}`, "保存凭据", () => {
						We(n, !1);
					}), s(`clear-${n}`, "清除凭据", () => {
						We(n, !0);
					});
				}
				e.append(a), H.set(n, o), I.append(e);
			}
			ae = () => {
				for (let [e, t] of H) {
					let n = P?.fields[e];
					t.status.textContent = n ? n.configured ? n.decryptable ? "已配置；上游有效性尚未验证。" : "已配置，但当前无法解密，请检查服务密钥后重新设置。" : "未配置。" : "状态待刷新。", e === "credential_perfect" && L && (t.status.textContent += ` 当前扫码：${L.state}。`), t.input && (t.input.disabled = !Y() || k || M || L?.state === "waiting");
					for (let e of t.buttons) {
						let t = e.dataset.action, n = t === "perfect-cancel", r = !Y() || !P || (n ? L?.state !== "waiting" && !N : k || M || t === "perfect-poll" && L?.state !== "waiting" || L?.state === "waiting" && !t.startsWith("perfect-"));
						e.setAttribute("aria-disabled", String(r));
					}
				}
			};
		}
	}, Ye = () => {
		let e = n.defaultView?.URL || URL;
		for (let t of re.splice(0)) e.revokeObjectURL(t);
	}, $ = (e, n, r, a, o = "") => {
		let s = G("div", void 0, "steam-dlc-public-field"), c = G("label", r), l = G(a ? "select" : "input");
		l.id = `steam-dlc-${i}-${t.routeId}-${n}`, l.name = n, l.className = "ui-control", c.htmlFor = l.id, a ? l.append(...a.map((e) => {
			let t = G("option", C[e] || e);
			return t.value = e, t;
		})) : (l.type = "text", l.maxLength = 128, l.autocomplete = "off"), l.value = o;
		let u = G("p", "", "steam-dlc-hint"), d = G("p", "", "steam-dlc-field-error");
		return u.id = `${l.id}-hint`, d.id = `${l.id}-error`, t.presentation ? t.presentation.field(e, {
			control: l,
			label: c,
			hint: u,
			error: d
		}) : (s.append(c, l), e.append(s)), ie.push(l), l;
	}, Xe = (e, t) => {
		if (![
			"profile",
			"stats",
			"match",
			"recent"
		].includes(e.kind)) return;
		let n = e.data, r = (e) => typeof e == "string" && e ? e : "未知", i = (e) => `${m(e?.scores?.[0])} : ${m(e?.scores?.[1])}`, a = (e) => `${m(e?.kills)}/${m(e?.deaths)}/${m(e?.assists)}`, o = (e, n) => {
			let r = G("div", void 0, "steam-dlc-table"), i = G("table"), a = G("tr");
			a.append(...e.map((e) => G("th", e))), i.append(a);
			for (let e of n) {
				let t = G("tr");
				t.append(...e.map((e) => G("td", e))), i.append(t);
			}
			r.append(i), t.append(r);
		}, s = {
			platform_recorded: "平台收录",
			recorded_official: "完美收录官匹",
			recent_first_page: "近期首批样本",
			recent_player_summary: "有界近期玩家摘要"
		}[e.coverage] || r(e.coverage), c = e.detail_level === "full_match";
		if (["profile", "stats"].includes(e.kind)) {
			if (t.append(G("p", `来源：${C[e.platform] || r(e.platform)} · 范围：${s}`, "steam-dlc-hint")), e.kind === "profile") {
				let i = n.rank || {}, a = typeof i.value == "string" && i.value.trim() && !/^[+-]?[\d.]+$/u.test(i.value) ? i.value : m(i.value);
				t.append(G("p", `玩家：${r(n.nickname)} · 账号：${r(n.account_id || e.target?.id)} · 段位：${a} · 积分：${m(i.score)}`));
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
			].map((e) => m(i[e]))]]), t.append(G("p", "未知表示来源未提供，不按 0 计算。", "steam-dlc-hint"));
			return;
		}
		if (t.append(G("p", `来源：${C[e.platform] || r(e.platform)} · 范围：${s} · 详情：${c ? "完整比赛" : "玩家摘要"}`, "steam-dlc-hint")), c || t.append(G("p", "该来源仅提供该玩家的有界近期摘要，不含完整比赛名单与详情。", "steam-dlc-hint")), e.unavailable_reason && e.unavailable_reason !== "full_match_detail_unavailable" && t.append(G("p", `缺项说明：${r(e.unavailable_reason)}`, "steam-dlc-hint")), t.append(G("p", "未知表示来源未提供，不按 0 计算。", "steam-dlc-hint")), e.kind === "recent") {
			if (!Array.isArray(n.matches) || !n.matches.length) {
				t.append(G("p", "来源当前样本没有可展示的比赛。"));
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
		if (t.append(G("p", `比赛：${r(n.match_id)} · 地图：${r(n.map)} · 比分：${i(n)}`)), !c) {
			t.append(G("p", `玩家：${r(n.focus?.id || e.target?.id)} · K/D/A：${a(n)} · rating：${m(n.rating)} · PW rating：${m(n.pw_rating)} · ADR：${m(n.adr)}`));
			return;
		}
		if (n.focus && typeof n.focus == "object" && t.append(G("p", `焦点：${r(n.focus.nickname)} · ${r(n.focus.account_id)} · K/D/A：${a(n.focus)} · rating：${m(n.focus.rating)} · PW rating：${m(n.focus.pw_rating)} · ADR：${m(n.focus.adr)}`)), !Array.isArray(n.players) || !n.players.length) {
			t.append(G("p", "来源未提供可用玩家名单。"));
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
		if (t.replaceChildren(), e.status === "error") return t.append(G("p", typeof e.error?.message == "string" ? e.error.message : "来源未返回可用结果。", "steam-dlc-field-error")), !1;
		if (!e.document || !Array.isArray(e.document.blocks)) throw Error("invalid_result");
		for (let n of e.document.blocks) {
			if (n?.kind === "text" && typeof n.text == "string" && t.append(G("p", n.text)), n?.kind === "table" && Array.isArray(n.columns) && Array.isArray(n.rows)) {
				let e = G("div", void 0, "steam-dlc-table"), r = G("table"), i = G("tr");
				i.append(...n.columns.map((e) => G("th", String(e)))), r.append(i);
				for (let e of n.rows) {
					if (!Array.isArray(e)) continue;
					let t = G("tr");
					t.append(...e.map((e) => G("td", e === null ? "未知" : String(typeof e == "object" ? e.value ?? "" : e)))), r.append(t);
				}
				e.append(r), t.append(e);
			}
			let e = n?.kind === "fields" ? n.fields?.cs2 : null;
			if (n?.kind === "fields" && !e) {
				let e = G("dl");
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
					e.append(G("dt", t), G("dd", r === null ? "未知" : typeof r == "string" || typeof r == "number" || typeof r == "boolean" ? String(r) : "未提供"));
				}
				e.childNodes.length && t.append(e);
			}
			if (Array.isArray(e?.sources)) {
				let n = G("dl", void 0, "steam-dlc-source-status");
				for (let t of e.sources) n.append(G("dt", C[t.platform] || t.platform), G("dd", t.credential_state === "configured" ? "凭据已配置；查询时验证上游有效性。" : "需要在可信设置页授权。"));
				t.append(n);
			} else e?.data && (typeof e.fetched_at == "string" && t.append(G("p", `采样：${e.fetched_at}${e.season ? ` · 赛季 ${e.season}` : ""}`, "steam-dlc-hint")), Xe(e, t));
		}
		for (let n of e.warnings || []) typeof n == "string" && t.append(G("p", n, "steam-dlc-hint"));
		return e.status !== "needs_selection";
	}, Qe = (e, t) => {
		let r = Ze(e, t);
		if (!r) return !1;
		try {
			if (!Array.isArray(e.images) || e.images.length > 8 || !["ready", "none"].includes(e.image_state) || e.image_state === "ready" != !!e.images.length || e.images.reduce((e, t) => e + (typeof t?.base64 == "string" ? t.base64.length : Infinity), 0) > 22369656) throw Error("invalid_images");
			let r = e.images.map((e) => {
				if (e?.media_type !== "image/png") throw Error("invalid_images");
				return D(e.base64, n.defaultView);
			});
			if (r.reduce((e, t) => e + t.length, 0) > 16777216) throw Error("invalid_images");
			for (let [e, i] of r.entries()) {
				let r = n.defaultView.URL.createObjectURL(new n.defaultView.Blob([i], { type: "image/png" }));
				re.push(r);
				let a = G("figure", void 0, "steam-dlc-preview"), o = G("img");
				o.src = r, o.alt = `CS2 资料卡 ${e + 1}`, a.append(o), t.append(a);
			}
			r.length || t.append(G("p", "本次未提供资料卡，文字资料仍可查看。", "steam-dlc-hint"));
		} catch {
			Ye(), t.querySelectorAll("figure.steam-dlc-preview").forEach((e) => e.remove()), t.append(G("p", "资料卡图片无法验证，已保留文字资料。", "steam-dlc-hint"));
		}
		return r;
	}, $e = () => {
		let e = G("form", void 0, "steam-dlc-public-form"), n = G("section", void 0, "steam-dlc-public-result");
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
		K(a, "change", d), d(), q.append(G("p", "页面查询始终需要明确账号，不读取本人默认绑定。5E 使用 domain；官匹与 5E 单场仅限来源近期玩家摘要。", "steam-dlc-hint"));
		let f = G("button", "查询", "ui-button");
		f.type = "submit", f.dataset.variant = "primary", f.dataset.action = "query";
		let p = G("div", void 0, "steam-dlc-actions");
		p.append(f), e.append(p);
		let m = null, h = 0, g = G("div", void 0, "steam-dlc-actions");
		g.hidden = !0;
		let _ = G("button", "重试资料卡预览", "ui-button");
		_.type = "button", _.dataset.action = "query-preview-retry";
		let v = G("button", "仅查询文字资料", "ui-button");
		v.type = "button", v.dataset.action = "query-text-only", g.append(_, v);
		let x = () => {
			h += 1, m = null, g.hidden = !0;
		};
		K(e, "input", x), K(e, "change", x);
		let S = () => {
			e.setAttribute("aria-busy", String(k));
			for (let e of [
				...p.querySelectorAll("button"),
				_,
				v
			]) e.setAttribute("aria-disabled", String(!Y() || k));
			for (let t of e.querySelectorAll("input,select")) t.disabled = !Y();
			Y() && d();
		}, C = () => {
			x(), k = !1, B += 1, Ye(), n.replaceChildren(), S();
		};
		V = C, ne = C;
		let w = async (r, d = "normal") => {
			if (!Y() || k) return;
			let f = d !== "normal";
			if (f && (!m || m.formRevision !== h)) return;
			let p = f ? { ...m.parameters } : r ? {} : { account: i.value.trim() };
			if (!r && !f && (!p.account || !e.checkValidity())) {
				X("请填写明确账号并检查输入范围。", "error");
				return;
			}
			!r && !f && (Object.assign(p, {
				action: a.value,
				platform: o.value
			}), !c.disabled && c.value.trim() && (p.season = c.value.trim()), s.disabled || (p.limit = Number(s.value)), l.disabled || (p.match_id = l.value.trim()), !u.disabled && u.value.trim() && (p.focus = u.value.trim()));
			let _ = p.action === "profile" && d !== "text", v = h, x = ++B;
			k = !0, g.hidden = !0, Ye(), n.replaceChildren(G("p", "正在查询来源。")), Z(), S();
			try {
				let e = await t.services[_ ? "preview" : "invoke"]("query", p);
				if (!Y() || x !== B) return;
				if (_ && e?.status === "error") {
					let t = (/* @__PURE__ */ new Map([
						["auth_required", "所选来源需要授权。请在可信设置页完成完美扫码授权或配置 5E Token，核对来源后重新查询。"],
						["auth_expired", "所选来源的授权已过期。请在可信设置页重新授权后查询。"],
						["rate_limited", "来源请求限流，请稍后再查询；页面不会自动重试。"],
						["parameter_error", "查询参数不符合要求，请核对玩家账号、所选来源、赛季和比赛 ID 后重新查询。"],
						["not_public", "玩家资料未公开或来源访问受限，请核对公开设置与来源授权后重新查询。"],
						["not_found", "来源未找到对应玩家或记录，请核对玩家账号与所选来源后重新查询。"],
						["no_records", "来源当前没有可用记录，可稍后查询；这不代表该玩家没有比赛历史。"],
						["unparsed", "来源尚未解析对应记录，请等待来源解析后再查询。"],
						["upstream_error", "所选来源暂时不可用，请稍后再查询。"]
					])).get(e.schema_version === 1 ? e.error?.code : null);
					if (!t) throw Error("preview_unavailable");
					m = null, n.replaceChildren(G("p", t, "steam-dlc-field-error")), X("查询未完成，请按来源提示处理后重新查询。", "warning");
					return;
				}
				let r = _ ? Qe(e, n) : Ze(e, n);
				m = null, e.status === "needs_selection" ? X("需要补充选择，请按来源提示配置或改选。", "warning") : X(r ? "来源结果已更新。" : "查询未完成，请查看来源反馈。", r ? "success" : "warning");
			} catch (e) {
				if (!Y() || x !== B) return;
				if (Ye(), b.has(y(e))) {
					C(), Se(), Z(), ie.forEach((e) => {
						e.value = "";
					}), S(), X("页面授权或运行上下文已变化，请重新进入页面。", "error");
					return;
				}
				let t = _ && v === h;
				m = t ? {
					parameters: { ...p },
					formRevision: v
				} : null, g.hidden = !t, n.replaceChildren(G("p", t ? "资料卡预览未完成，未取得可确认的文字或图片。可主动重试预览，或仅查询文字资料；每次操作会重新查询来源。" : "请求未完成，或返回内容不完整。请核对当前账号与来源后重新查询。", "steam-dlc-field-error")), X("未取得可确认结果。", "error");
			} finally {
				J() && x === B && (k = !1, Z(), S());
			}
		};
		K(_, "click", () => {
			w(!1, "preview");
		}), K(v, "click", () => {
			w(!1, "text");
		}), K(e, "submit", (e) => {
			e.preventDefault(), w(!1);
		});
		let T = G("button", "刷新来源状态", "ui-button");
		T.type = "button", T.dataset.action = "query-status", K(T, "click", () => {
			w(!0);
		}), p.append(T), q.append(e, g, n), t.presentation?.actions(p), w(!0);
	};
	if (a && t.routeId === "home") {
		if (q.append(G("p", a.summary)), i !== "steam") {
			let e = G("section", void 0, "steam-dlc-source-panel"), n = G("button", "刷新来源状态", "ui-button");
			n.type = "button", n.dataset.action = "refresh-status";
			let r = async () => {
				if (!Y() || k) return;
				let r = ++B;
				k = !0, Z(), n.setAttribute("aria-disabled", "true");
				try {
					let n = await t.services.invoke("status", {});
					if (!Y() || r !== B) return;
					Ze(n, e);
				} catch {
					Y() && r === B && e.replaceChildren(G("p", "来源状态读取失败，请稍后刷新。", "steam-dlc-field-error"));
				} finally {
					J() && r === B && (k = !1, n.setAttribute("aria-disabled", String(!Y())), Z());
				}
			};
			K(n, "click", () => {
				r();
			}), q.append(e, n), r();
		}
		q.append(G("h3", "命令帮助"));
		let e = G("dl", void 0, "steam-dlc-help");
		for (let [t, n] of a.commands) {
			let r = G("dt");
			r.append(G("code", t)), e.append(r, G("dd", n));
		}
		q.append(e), i === "steam" && (q.append(G("h3", "时长海报墙")), q.append(G("p", "游戏生涯拼图用累计小时映射每张作品的目标面积，提供单机、标准和长玩预设。大图跨行、小图填空，封面保持纵向比例；旧布局可以显式选择。未知时长不补零。", "steam-dlc-hint")), q.append(G("p", "games 与 recent 是不同公开样本；full 需要可选 Steam Key。选择来源不会自动把样本当成完整库。默认纵向 2:3，可切换 9:16 或 1:2；作品数量和输出预算共同约束分页，兼容旧布局最多 200 项。包含全部应用会纳入软件，旧设置中的关闭值继续保留。", "steam-dlc-hint")), Fe = G("p", "尚未读取缓存状态。", "steam-dlc-cache-value"), Q = G("button", "刷新缓存状态"), Q.className = "ui-button", Q.type = "button", Q.dataset.action = "refresh-cache", K(Q, "click", () => {
			Re();
		}), q.append(Fe, Q)), i === "dota2" && q.append(G("p", "账号可用 Dota ID32 或 SteamID64。订阅创建、查看和取消使用当前群或私聊中的命令；页面不伪造聊天身份。OpenDota Key 可选，匿名与有 Key 都遵守同一每小时预算；模型短评失败不会阻止基础通知。", "steam-dlc-hint"));
	} else if (a && t.routeId === "settings") {
		_e = G("form"), K(_e, "submit", (e) => {
			e.preventDefault(), Pe();
		});
		let e = G("div", void 0, "steam-dlc-actions");
		ve = G("button", "保存修改"), ve.className = "ui-button", ve.dataset.variant = "primary", ve.type = "submit", ve.dataset.action = "save", ye = G("button", "刷新配置"), ye.className = "ui-button", ye.type = "button", ye.dataset.action = "refresh", be = G("button", "放弃本模块修改"), be.className = "ui-button", be.type = "button", be.dataset.action = "discard", K(ye, "click", () => {
			Me(!0);
		}), K(be, "click", () => {
			Y() && !k && j && (U.size && (ce += 1), U.clear(), ke(), X("已放弃本模块修改。", "success"), Z());
		}), e.append(ve, ye, be), t.presentation?.actions(e), q.append(_e), _e.append(e), q.append(G("p", "回复主题中的“跟随核心”清除模块覆盖值。恢复默认先形成草稿，保存后生效。", "steam-dlc-hint"));
	} else if (i === "cs2" && t.routeId === "query") $e(!1);
	else if (i === "steam" && t.routeId === "collage") {
		let e = f(q, {
			options: t,
			active: Y,
			field: $,
			parseLimit: T,
			validatePNG: (e) => D(e, n.defaultView),
			say: X
		});
		V = e.dispose, ne = e.setAvailable, de.push(e.dispose);
	} else if (i === "steam" && t.routeId === "wishlist") {
		let e = p(q, {
			options: t,
			active: Y,
			field: $,
			say: X
		});
		V = e.dispose, ne = e.setAvailable, de.push(e.dispose);
	} else if (i === "dota2" && t.routeId === "analysis") {
		let e = h(q, {
			options: t,
			active: Y,
			field: $,
			renderResult: Ze,
			say: X
		});
		V = e.dispose, ne = e.setAvailable, de.push(e.dispose);
	} else q.append(G("p", "该页面入口未声明，请返回模块列表重新进入。"));
	q.append(pe);
	let et = () => {
		l || (l = !0, E += 1, Ie += 1, F += 1, B += 1, k = !1, Ye(), ie.forEach((e) => {
			e.value = "";
		}), Be(), ze(), L = null, P = null, M = !1, N = !1, le !== null && (clearTimeout(le), le = null), U.clear(), j = null, de.splice(0).forEach((e) => e()), ue(), q.remove());
	};
	return t.scope.signal.addEventListener("abort", et, { once: !0 }), de.push(() => t.scope.signal.removeEventListener("abort", et)), ue = t.scope.onDispose(et), Z(), _e && Me(), Q && Re(), {
		update(e) {
			if (l || u) return;
			let t = c.available;
			c = { ...e }, v(c) !== r || !J() ? (V(), B += 1, Ye(), ie.forEach((e) => {
				e.value = "";
			}), Se(), X("模块运行上下文已变化，请重新进入页面。", "error")) : t !== c.available && (ne(c.available), B += 1, Ye(), F += 1, Be(), ze(), L = null, M = !1, N = !1, Ie += 1, E += 1, k = !1, A = !1, X("页面可用状态已变化，请核对刷新后的配置。")), Z();
		},
		dispose: et,
		navigationImpact: me
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
	let D = () => {
		S || (S = !0, x.dispose(), w.splice(0).reverse().forEach((e) => e.unmount()), E.unmount(), C());
	};
	return C = p.scope.onDispose(D), {
		update(e) {
			S || (x.update(e), m.value = { ...e });
		},
		dispose: D,
		navigationImpact: x.navigationImpact
	};
}
//#endregion
export { M as mount };
