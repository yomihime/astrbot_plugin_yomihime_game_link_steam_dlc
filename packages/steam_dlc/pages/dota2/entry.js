import { createApp as e, h as t, shallowRef as n } from "../../../../../../../runtime.js";
import { ActionBar as r, FormField as i, FormGrid as a, PageHeader as o, SettingsGroup as s, SettingsLayout as c, StatusHint as l, Surface as u, UiProvider as d } from "../../../../../../../runtime.js";
//#region packages/steam_dlc/pages/src/job-controller.js
function f(e, { options: t, active: n, field: r, parseLimit: i, validatePNG: a, say: o }) {
	let s = e.ownerDocument, c = [], l = [], u = !1, d = null, f = 0, p = 0, m = null, h = null, g = !1, _ = (e) => !u && n() && e === f, v = (e) => Object.assign(Error(e), { publicMessage: e }), y = (e) => e?.publicMessage || "任务操作未完成，请刷新任务并核对。", b = (e, t) => {
		let n = s.createElement(e);
		return t !== void 0 && (n.textContent = t), n;
	}, x = (e, t, n) => {
		e.addEventListener(t, n), l.push(() => e.removeEventListener(t, n));
	}, S = () => {
		d !== null && (clearTimeout(d), d = null);
	}, C = () => {
		for (let e of c.splice(0)) s.defaultView.URL.revokeObjectURL(e);
	}, w = () => {
		if (!t.services.jobs) throw v("任务服务暂不可用，请刷新模块。");
		return t.services.jobs;
	}, T = b("form");
	T.className = "steam-dlc-public-form";
	let ee = t.presentation?.grid(T) || T, E = r(ee, "account", "SteamID64 / Dota ID32（明确账号）"), D = {};
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
	]) D[e] = r(ee, e, t, n, i);
	D.all_apps.options[0].textContent = "全部应用", D.all_apps.options[1].textContent = "仅游戏";
	let O = r(ee, "limit", "数量（至少20，可手填超过1000）", null, "500");
	O.inputMode = "decimal";
	let k = b("div");
	k.className = "steam-dlc-actions";
	let te = (e, t, r) => {
		let i = b("button", t);
		return i.type = "button", i.className = "ui-button", i.dataset.action = e, x(i, "click", () => {
			if (!n() || u) return;
			let e = (e) => {
				!u && n() && o(y(e), "error");
			};
			try {
				Promise.resolve(r()).catch(e);
			} catch (t) {
				e(t);
			}
		}), k.append(i), i;
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
		D.limit_mode.value = e === "all" ? "all" : "top", O.disabled = e === "all", e !== "all" && (O.value = String(e));
	});
	x(D.limit_mode, "change", () => {
		O.disabled = D.limit_mode.value === "all";
	});
	let A = b("button", "提交拼图任务");
	A.type = "submit", A.className = "ui-button", A.dataset.action = "generate", A.dataset.variant = "primary", k.append(A);
	let j = r(ee, "job_id", "任务ID（刷新后自动恢复）"), M = b("p", "尚未提交任务。");
	M.setAttribute("role", "status");
	let N = b("section");
	N.className = "steam-dlc-public-result";
	let ne = `ygl:job:${t.context.owner}:${t.routeId}`, P = (e) => {
		if (!e || typeof e.job_id != "string" || !Number.isSafeInteger(e.revision) || ![
			"queued",
			"running",
			"succeeded",
			"failed",
			"cancelled",
			"interrupted"
		].includes(e.status)) throw v("任务状态无法验证。");
		m = e, j.value = m.job_id;
		try {
			s.defaultView.sessionStorage.setItem(ne, m.job_id);
		} catch {}
		let t = m.progress || {}, n = m.summary || {}, r = {
			steam_key_required: "完整库需要在可信管理页配置Steam Key，可改选公开样本。",
			steam_source_unavailable: "Steam来源暂不可用，未用其他来源替代。",
			steam_source_not_public: "Steam库未公开或当前来源授权受限，未视为空库。",
			rate_limited: "来源限流，已停止后续批次；已完成页保留。",
			resource_budget: "资源预算不足，已停止后续批次；已完成页保留。"
		};
		M.textContent = `任务 ${m.job_id} · ${m.status} · 来源${n.source_returned ?? t.source_returned ?? "待确认"} · 符合${n.eligible ?? "待确认"} · 已选${n.selected ?? t.selected ?? "待确认"} · 已生成${n.generated ?? t.generated ?? 0} · 待处理${n.pending ?? t.pending ?? "待确认"} · 缺图${n.missing_images ?? t.missing_images ?? 0}${m.error_code ? ` · 失败原因 ${m.error_code}` : ""}${r[t.reason] ? ` · ${r[t.reason]}` : ""}${n.complete_source === !1 ? " · 来源覆盖不完整" : ""}`, L.disabled = !["queued", "running"].includes(m.status), re.disabled = ![
			"failed",
			"cancelled",
			"interrupted"
		].includes(m.status);
	}, F = async (e) => {
		if (!m || !n()) return;
		let t = f, r = ++p, i = m.job_id, o = await w().result(i, {
			cursor: e,
			page_size: 20
		});
		if (_(t) && r === p && m?.job_id === i) {
			if (!Array.isArray(o.entries) || o.entries.length > 20) throw v("任务结果范围无法验证。");
			C(), N.replaceChildren(), h = o.next_cursor || null;
			for (let [e, n] of o.entries.entries()) {
				if (n?.resource?.media_type !== "image/png" || typeof n.resource.asset_id != "string") throw v("任务资源无法验证。");
				let o = await w().resource(i, n.resource.asset_id);
				if (!_(t) || r !== p || m?.job_id !== i) return;
				if (o?.type !== "image/png" || typeof o.arrayBuffer != "function" || o.size > 16777216) throw v("图片资源无法验证。");
				if (a(new Uint8Array(await o.arrayBuffer())), !_(t) || r !== p || m?.job_id !== i) return;
				let l = s.defaultView.URL.createObjectURL(o);
				c.push(l);
				let u = b("figure"), d = b("img"), f = b("a", "下载原始 PNG");
				u.className = "steam-dlc-preview", d.src = l, d.alt = `批次${Number(n.metadata?.batch_index ?? 0) + 1} · 图片${e + 1}`, f.href = l, f.className = "ui-button", f.download = `steam-career-${n.metadata?.batch_index ?? 0}-${e + 1}.png`, u.append(d, f), N.append(u);
			}
			o.entries.length || N.append(b("p", "当前没有已完成结果页。")), ie.disabled = !h;
		}
	}, I = async () => {
		if (S(), !m || !n() || u) return;
		let e = f, t = m.job_id;
		try {
			let n = await w().status(t);
			if (!_(e) || m?.job_id !== t) return;
			P(n), ["queued", "running"].includes(m.status) ? d = setTimeout(() => {
				I();
			}, 1500) : await F(null);
		} catch (t) {
			_(e) && o(y(t), "error");
		}
	}, L = te("job-cancel", "取消任务", async () => {
		if (!m) return;
		S();
		let e = ++f, t = await w().cancel(m.job_id, m.revision);
		_(e) && (P(t), await I());
	}), re = te("job-retry", "重试任务", async () => {
		if (!m) return;
		S();
		let e = ++f, t = await w().retry(m.job_id, m.revision);
		_(e) && (P(t), await I());
	}), ie = te("job-next", "下一页结果", async () => {
		h && await F(h);
	});
	ie.disabled = !0, te("job-results", "查看已完成页", async () => {
		await F(null);
	}), te("job-refresh", "恢复 / 刷新任务", async () => {
		j.value.trim() && (S(), f += 1, m = { job_id: j.value.trim() }, await I());
	}), L.disabled = !0, re.disabled = !0, x(T, "submit", (e) => {
		e.preventDefault(), !(!n() || u || g) && (async () => {
			let e = ++f;
			S();
			try {
				let t = Object.fromEntries(Object.entries(D).map(([e, t]) => [e, e === "all_apps" ? t.value === "true" : t.value]));
				if (t.account = E.value.trim(), !t.account) throw v("请提供明确账号。");
				if (/^[0-9]+$/u.test(t.account)) {
					let e = BigInt(t.account);
					t.account = String(e < 4294967296n ? e + 76561197960265728n : e);
				}
				try {
					t.limit = t.limit_mode === "all" ? 500 : i(O.value);
				} catch (e) {
					throw v(e.message);
				}
				if (t.mode === "legacy" && (t.limit > 200 || t.limit_mode === "all")) throw v("兼容旧布局最多200项。");
				g = !0, A.disabled = !0;
				let n = JSON.stringify([
					t.account,
					...Object.keys(D).sort().map((e) => t[e]),
					t.limit
				]);
				if (n.length > 256) throw v("账号或参数过长，无法生成任务标识。");
				let r = await w().submit({
					handler_id: "steam_wall",
					parameters: t,
					idempotency_key: n
				});
				if (!_(e)) return;
				P(r), o("任务已提交，关闭页面只停止轮询。", "success"), await I();
			} catch (t) {
				_(e) && o(y(t), "error");
			} finally {
				g = !1, _(e) && (A.disabled = !1);
			}
		})();
	}), T.append(k), e.append(b("p", "不限覆盖来源实际返回范围。每批有资源预算，已完成页保留；关闭页面只停止轮询，取消需明确点击。"), T, M, N), t.presentation?.actions(k);
	try {
		let e = s.defaultView.sessionStorage.getItem(ne);
		e && (j.value = e, m = { job_id: e }, I());
	} catch {}
	return { dispose() {
		u || (u = !0, f += 1, S(), C(), N.replaceChildren(), M.textContent = "任务页面上下文已变化，请重新进入。", l.splice(0).forEach((e) => e()));
	} };
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
	let T = async (e) => {
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
		l = !0, x.disabled = !0;
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
			l = !1, !c && n() && a === s && (x.disabled = !1);
		}
	};
	return m(h, "submit", (e) => {
		e.preventDefault(), T(1);
	}), m(S, "click", () => {
		u > 1 && T(u - 1);
	}), m(C, "click", () => {
		u < d && T(u + 1);
	}), e.append(p("p", "匿名读取第一方公开愿望单，每页20项，仅补全当前页商店资料。私有、空单、限流与请求失败分别报告。"), h, w), t.presentation?.actions(b), { dispose() {
		c || (c = !0, s += 1, w.replaceChildren(), o.splice(0).forEach((e) => e()));
	} };
}
//#endregion
//#region packages/steam_dlc/pages/src/analysis-controller.js
function m(e, { options: t, active: n, field: r, renderResult: i, say: a }) {
	let o = e.ownerDocument, s = [], c = !1, l = 0, u = !1, d = (e, t) => {
		let n = o.createElement(e);
		return t !== void 0 && (n.textContent = t), n;
	}, f = d("form"), p = t.presentation?.grid(f) || f, m = r(p, "match_id", "比赛ID");
	m.maxLength = 20, m.inputMode = "numeric";
	let h = r(p, "account", "焦点玩家（Dota ID32 / SteamID64 / 本场唯一昵称）"), g = r(p, "refresh", "来源缓存", ["false", "true"], "false");
	g.options[0].textContent = "优先有效缓存", g.options[1].textContent = "刷新公开来源";
	let _ = d("button", "查看指定玩家分析");
	_.type = "submit", _.className = "ui-button", _.dataset.variant = "primary", _.dataset.action = "analysis-query";
	let v = d("div");
	v.className = "steam-dlc-actions", v.append(_), f.append(v);
	let y = d("section");
	y.className = "steam-dlc-public-result", y.setAttribute("aria-live", "polite");
	let b = async (e) => {
		if (e.preventDefault(), !n() || c || u) return;
		let r = {
			match_id: m.value.trim(),
			account: h.value.trim(),
			refresh: g.value === "true"
		};
		if (!/^[1-9][0-9]{0,19}$/u.test(r.match_id) || !r.account) {
			a("请提供有效比赛ID和明确焦点玩家。", "error");
			return;
		}
		let o = ++l;
		u = !0, _.disabled = !0, y.replaceChildren(d("p", "正在读取公开结算与可用时间线。"));
		try {
			let e = await t.services.invoke("analyze_explicit", r);
			if (c || !n() || o !== l) return;
			i(e, y);
			let a = e.model_facts;
			if (!a || typeof a != "object") return;
			y.prepend(d("p", `数据覆盖：${{
				settlement_only: "仅基础结算",
				partial: "部分分析段可用",
				supported_sections_complete: "支持的分析段已提供"
			}[a.data_completeness] || "待确认"}。本页展示确定性分析与公开事实；不会调用Host模型。`));
			let s = (e) => typeof e == "number" && Number.isFinite(e) ? String(e) : "未知", u = a.focus || {}, f = typeof u.account_id32 == "string" && /^[0-9]+$/u.test(u.account_id32) ? u.account_id32 : s(u.account_id32);
			y.append(d("p", `焦点：${typeof u.name == "string" ? u.name : "名称未提供"} · ID32 ${f} · 英雄${s(u.hero_id)} · K/D/A ${s(u.kills)}/${s(u.deaths)}/${s(u.assists)}`));
			for (let [e, t] of [
				["missing_sections", "缺失分析段"],
				["missing_fields", "缺失字段"],
				["truncated_sections", "来源截断段"]
			]) {
				let n = a[e];
				Array.isArray(n) && y.append(d("p", `${t}：${n.filter((e) => typeof e == "string").slice(0, 32).join("、") || "未列出"}。`));
			}
			y.append(d("p", `来源：${typeof a.source == "string" ? a.source : "未提供"} · 获取时间：${typeof a.fetched_at == "string" ? a.fetched_at : "未提供"}。缺失段保持未知，不补成0或完整时间线。`));
		} catch {
			!c && n() && o === l && (y.replaceChildren(d("p", "分析请求未完成，请核对比赛与焦点后重试。")), a("未取得可确认的分析结果。", "error"));
		} finally {
			u = !1, !c && n() && o === l && (_.disabled = !1);
		}
	};
	return f.addEventListener("submit", b), s.push(() => f.removeEventListener("submit", b)), e.append(d("p", "按明确比赛与玩家读取OpenDota公开事实。未收录的时间线、装备、团战或目标保持未知，不提交录像解析。"), f, y), t.presentation?.actions(v), { dispose() {
		c || (c = !0, l += 1, y.replaceChildren(), s.splice(0).forEach((e) => e()));
	} };
}
//#endregion
//#region packages/steam_dlc/pages/src/controller.js
var h = Object.freeze({
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
}), g = (e, t) => JSON.stringify(e) === JSON.stringify(t), _ = (e) => JSON.stringify([
	e.owner,
	e.runtimeId,
	e.epoch,
	e.boundary
]), v = (e) => typeof e?.message == "string" ? e.message : "", y = /* @__PURE__ */ new Set([
	"admin_authorization_denied",
	"page_revoked",
	"page_unavailable",
	"stale_context"
]), b = Object.freeze({
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
}), x = {
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
}, S = {
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
}, C = {
	steam: [["credential_steam_key", "Steam Web API Key"]],
	dota2: [["credential_opendota_key", "OpenDota Key（可选）"]],
	cs2: [["credential_perfect", "完美扫码授权"], ["credential_fivee", "5E 会话 Token"]]
};
x.poster_limit_mode = "作品数量模式", S.top = "按时长取前 N 项", S.all = "不限（来源实际返回范围）";
function w(e) {
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
var T = Uint32Array.from({ length: 256 }, (e, t) => {
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
		for (let e = o + 4; e < t - 4; e++) p = T[(p ^ i[e]) & 255] ^ p >>> 8;
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
var E = /* @__PURE__ */ new Map(), D = 4, O = 4096, k = 256;
function te(e, t, n) {
	for (let [n, r] of E) r.owner === e.owner && n !== t && E.delete(n);
	if (!n || t.length > O) return null;
	let r = E.get(t) || {
		owner: e.owner,
		drafts: /* @__PURE__ */ new Map(),
		token: null
	};
	for (r.token = Symbol("ordinary-draft-mount"), E.delete(t), E.set(t, r); E.size > D;) E.delete(E.keys().next().value);
	return r;
}
function A(e, t) {
	let n = e.ownerDocument, r = _(t.context), i = t.context.owner.startsWith("steam_dlc/") ? t.context.owner.slice(10) : "", a = h[i], o = a ? te(t.context, r, t.routeId === "settings") : null, s = o?.token, c = { ...t.context }, l = !1, u = !1, d = 0, T = !1, D = !1, O = null, A = !1, j = !1, M = null, N = 0, ne, P = null, F = null, I = !1, L = 0, re = () => {}, ie = [], ae = [], R = /* @__PURE__ */ new Map(), oe = () => {}, se = 0, ce = "", le = 0, z = null, ue = () => {}, B = new Map(o?.drafts), V = /* @__PURE__ */ new Map(), de = [], H = (e, t, r) => {
		let i = n.createElement(e);
		return t !== void 0 && (i.textContent = t), r && (i.className = r), i;
	}, U = (e, t, n) => {
		e.addEventListener(t, n), de.push(() => e.removeEventListener(t, n));
	}, W = H("section", void 0, "steam-dlc-page"), fe = H("p", "", "steam-dlc-hint");
	fe.setAttribute("role", "status");
	let pe = H("p", "", "steam-dlc-message");
	pe.setAttribute("role", "status"), pe.setAttribute("aria-live", "polite"), W.append(fe), e.replaceChildren(W);
	let G = () => !l && !u && !t.scope.signal.aborted && t.scope.isCurrent() && _(c) === r && (!o || E.get(r) === o && o.token === s), K = () => G() && c.available, me = () => Object.freeze({
		ordinary: B.size > 0,
		credentials: G() && ([...R.values()].some((e) => !!e.input?.value) || P?.state === "waiting"),
		pending: T || A,
		version: se
	}), he = () => {
		let e = JSON.stringify([
			B.size > 0,
			T,
			le,
			me().credentials,
			A
		]);
		e !== ce && (ce = e, se += 1, t.onNavigationStateChange?.());
	}, q = (e, t = "warning") => {
		z !== null && (clearTimeout(z), z = null), pe.textContent = e, pe.dataset.tone = t, e && t === "success" && (z = setTimeout(() => {
			z = null, G() && (pe.textContent = "");
		}, 3500));
	}, ge = () => {
		W.dataset.theme = c.theme, fe.textContent = G() ? c.available ? "当前页面入口可用。运行健康请在模块管理中查看；此处不检测上游服务。" : "当前页面入口不可用，请在模块管理中刷新状态后重新进入。" : "页面上下文已失效，请重新进入本模块。";
	}, J, Y, _e, ve, ye = () => {
		o && G() && (o.drafts = new Map([...B].filter(([e, t]) => {
			let n = b[i]?.includes(e), r = t.rawValue ?? t.value;
			return n && (t.kind === "clear" || t.kind === "set" && [
				"string",
				"boolean",
				"number"
			].includes(typeof r) && !(typeof r == "number" && !Number.isFinite(r)) && !(typeof r == "string" && r.length > k));
		})));
	}, be = () => {
		(o ? E.get(r) === o && o.token === s : t.routeId === "home") && E.delete(r), u = !0, d += 1, T = !1, D = !1, B.size && (le += 1), B.clear(), O = null;
		for (let { control: e } of V.values()) e.value = "";
		N += 1, Le(), Ie(), M = null, P = null, A = !1, j = !1;
	}, X = () => {
		if (ye(), ge(), W.setAttribute("aria-busy", String(T || A)), Y) {
			Y.setAttribute("aria-disabled", String(!K() || T || A || P?.state === "waiting" || !D || !B.size)), _e.setAttribute("aria-disabled", String(!K() || T || A)), ve.setAttribute("aria-disabled", String(!K() || T || A || !B.size));
			for (let { control: e, reset: t } of V.values()) e.disabled = !K() || !O, t.setAttribute("aria-disabled", String(!K() || !O));
		}
		Q && Q.setAttribute("aria-disabled", String(!K() || T)), oe(), he();
	}, xe = [], Se = (e) => {
		if (!e || !Number.isSafeInteger(e.revision) || e.revision < 1 || !e.fields || !e.descriptors || (xe = (b[i] || []).filter((t) => e.fields[t] && e.descriptors[t]), !xe.includes("reply_theme") || i === "dota2" && !xe.includes("timezone"))) throw Error("invalid_snapshot");
		for (let t of xe) {
			let n = e.fields[t], r = e.descriptors[t];
			if (!n || !r || typeof r.description != "string" || t === "reply_theme" && (!Array.isArray(r.choices) || !r.choices.length || !r.choices.some((e) => e.value === null) || r.choices.some((e) => typeof e.label != "string" || e.value !== null && typeof e.value != "string")) || t === "timezone" && r.value_schema?.type !== "string" || t === "poster_include_apps" && (r.value_schema?.type !== "boolean" || typeof r.default != "boolean" || typeof n.value != "boolean") || t === "poster_limit" && (r.value_schema?.type !== "integer" || ![1, 20].includes(r.value_schema.minimum) || !Number.isInteger(r.default) || !Number.isInteger(n.value))) throw Error("invalid_snapshot");
		}
		return e;
	}, Ce = (e) => {
		let t = B.get(e);
		return t ? t.kind === "clear" ? O.descriptors[e].default : t.value : O.fields[e].value;
	}, we = (e) => e === "poster_include_apps" ? [{
		value: !1,
		label: "仅游戏"
	}, {
		value: !0,
		label: "全部应用"
	}] : O.descriptors[e].value_schema?.type === "boolean" ? [{
		value: !1,
		label: "关闭"
	}, {
		value: !0,
		label: "开启"
	}] : O.descriptors[e].choices || O.descriptors[e].value_schema?.enum?.map((e) => ({
		value: e,
		label: S[e] || String(e)
	})), Te = (e) => !!we(e), Z = (e, t) => {
		if (!K() || !O) return;
		let n = O.fields[e], r = !T && (t.kind === "clear" ? !n.present : n.state === "valid" && g(n.value, t.value)) ? void 0 : t;
		if (g(B.get(e), r)) return;
		r === void 0 ? B.delete(e) : B.set(e, r), le += 1, V.get(e).error.textContent = "", V.get(e).control.setAttribute("aria-invalid", "false");
		let i = B.size && (!o || [...B.values()].some((e) => e.kind === "set" && typeof (e.rawValue ?? e.value) == "string" && (e.rawValue ?? e.value).length > k));
		q(i ? "输入超过草稿保留上限，请先修正再切页。" : B.size ? "有未保存的修改。" : "", "warning"), X();
	}, Ee = () => {
		for (let [e, { control: t, error: n, hint: r }] of V) {
			r.textContent = O.descriptors[e].description;
			let i = Ce(e);
			if (Te(e)) {
				let n = we(e);
				t.replaceChildren(...n.map((e, t) => {
					let n = H("option", e.label);
					return n.value = String(t), n;
				})), t.value = String(n.findIndex((e) => g(e.value, i)));
			} else t.value = B.get(e)?.rawValue === void 0 ? typeof i == "string" || typeof i == "number" ? String(i) : "" : B.get(e).rawValue;
			n.textContent = O.fields[e].state !== "valid" && !B.has(e) ? "当前配置无效，请修改或恢复默认后保存。" : "", t.setAttribute("aria-invalid", String(!!n.textContent));
		}
	}, De = () => {
		let e = t.presentation?.grid(J, J.querySelector(".steam-dlc-actions"));
		for (let n of xe) {
			let r = O.descriptors[n], a = H("div", void 0, "steam-dlc-field"), o = H("label", x[n] || n), s = H(Te(n) ? "select" : "input");
			s.className = "ui-control", s.id = `steam-dlc-${i}-${n}`, o.htmlFor = s.id, s.name = n;
			let c = H("p", r.description, "steam-dlc-hint");
			c.id = `${s.id}-hint`;
			let l = H("p", "", "steam-dlc-field-error");
			l.id = `${s.id}-error`, s.setAttribute("aria-describedby", `${c.id} ${l.id}`), n === "timezone" && (s.type = "text", s.autocomplete = "off", s.maxLength = Math.min(r.value_schema.maxLength ?? k, k)), !Te(n) && r.value_schema?.type === "integer" && (s.type = "number", s.min = String(r.value_schema.minimum), r.value_schema.maximum !== void 0 && (s.max = String(r.value_schema.maximum)), s.step = "1", n === "poster_limit" && (s.type = "text", s.inputMode = "decimal", s.removeAttribute("min"), s.removeAttribute("max")));
			let u = H("button", "恢复默认");
			u.className = "ui-button", u.type = "button", u.dataset.action = `reset-${n}`, U(u, "click", () => {
				K() && O && (Z(n, { kind: "clear" }), Ee());
			});
			let d = H("div", void 0, "steam-dlc-actions");
			if (d.append(u), n === "poster_limit") for (let e of [
				20,
				50,
				100,
				200,
				500,
				1e3,
				"all"
			]) {
				let t = H("button", e === "all" ? "不限" : String(e), "ui-button");
				t.type = "button", U(t, "click", () => {
					if (K() && O) {
						if (V.has("poster_limit_mode") && Z("poster_limit_mode", {
							kind: "set",
							value: e === "all" ? "all" : "top"
						}), e !== "all") Z(n, {
							kind: "set",
							value: e
						});
						else if (!V.has("poster_limit_mode")) {
							q("当前配置尚未提供不限模式，请刷新模块版本。", "warning");
							return;
						}
						Ee();
					}
				}), d.append(t);
			}
			U(s, Te(n) ? "change" : "input", () => {
				if (K() && O) {
					if (Te(n)) {
						let e = we(n)[Number(s.value)];
						if (!e) return;
						Z(n, e.value === null ? { kind: "clear" } : {
							kind: "set",
							value: e.value
						});
					} else if (r.value_schema?.type === "integer") {
						let e = s.value;
						if (n === "poster_limit") {
							try {
								Z(n, {
									kind: "set",
									value: w(e)
								});
							} catch {
								Z(n, {
									kind: "set",
									value: null,
									rawValue: e
								});
							}
							return;
						}
						Z(n, n === "opendota_rph" && e === "" ? { kind: "clear" } : s.validity.valid && e !== "" ? {
							kind: "set",
							value: Number(e)
						} : {
							kind: "set",
							value: null,
							rawValue: e
						});
					} else Z(n, {
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
			V.set(n, {
				control: s,
				reset: u,
				error: f?.error || l,
				hint: f?.hint || c
			}), f || (a.append(o, s, d, c, l), J.insertBefore(a, J.querySelector(".steam-dlc-actions")));
		}
	}, Oe = (e) => {
		O = Se(e);
		for (let [e, t] of B) {
			let n = O.fields[e];
			(t.kind === "clear" ? !n.present : n.state === "valid" && g(n.value, t.value)) && (B.delete(e), le += 1);
		}
		V.size || De(), Ee(), D = !0;
	}, ke = async (e = !1) => {
		if (!K() || T || A) return;
		e && Ie();
		let n = ++d;
		T = !0, X();
		try {
			if (!K() || n !== d) return;
			let r = await t.services.config.current();
			if (!K() || n !== d) return;
			Oe(r);
			try {
				await ze();
			} catch (e) {
				if (!K() || n !== d) return;
				Re(e), K() && q("普通配置已读取；来源凭据状态未确认，请单独刷新凭据。", "warning");
				return;
			}
			if (!K() || n !== d) return;
			q(B.size ? "已刷新；草稿已保留，请核对后保存。" : e ? "已刷新。" : "", B.size ? "warning" : "success");
		} catch (e) {
			if (!K() || n !== d) return;
			if (y.has(v(e))) {
				be(), q("管理授权或模块上下文已失效，请重新进入页面。", "error"), X();
				return;
			}
			D = !1, q("配置读取未完成。请检查 Dashboard 授权与模块状态，再手动刷新。", "error");
		} finally {
			G() && n === d && (T = !1, X());
		}
	}, Ae = () => {
		let e = !0;
		for (let [t, n] of B) {
			if (n.kind === "clear") continue;
			let r = O.descriptors[t], i = "";
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
					w(n.rawValue ?? String(n.value));
				} catch (e) {
					i = e.message;
				}
			} else Te(t) && !we(t).some((e) => g(e.value, n.value)) && (i = "请选择当前可用的选项。");
			V.get(t).error.textContent = i, V.get(t).control.setAttribute("aria-invalid", String(!!i)), i && (e = !1);
		}
		return V.has("poster_mode") && Ce("poster_mode") === "legacy" && Ce("poster_limit") > 200 && (V.get("poster_limit").error.textContent = "兼容旧布局最多支持 200 项，请调整数量或选择游戏生涯拼图。", V.get("poster_limit").control.setAttribute("aria-invalid", "true"), e = !1), e;
	}, je = async () => {
		if (!K() || T || A || P?.state === "waiting" || !D || !B.size || !Ae()) return;
		let e = new Map(B), n = {}, r = [];
		for (let [t, i] of e) i.kind === "clear" ? r.push(t) : n[t] = i.value;
		let i = O.revision, a = !1, o = ++d;
		T = !0, D = !1, q("正在保存，请等待确认。"), X();
		let s = (e) => {
			if (!e || !Number.isSafeInteger(e.revision) || e.revision <= i) throw Error("invalid_receipt");
			i = e.revision, a = !0;
		};
		try {
			if (!K() || o !== d) return;
			if (Object.keys(n).length) {
				let e = await t.services.config.save(i, n);
				if (!K() || o !== d) return;
				s(e);
			}
			if (r.length) {
				let e = await t.services.config.clear(i, r);
				if (!K() || o !== d) return;
				s(e);
			}
			let a = await t.services.config.current();
			if (!K() || o !== d) return;
			if (Se(a), a.revision < i) throw Error("unverified_snapshot");
			for (let [t, n] of e) {
				let e = a.fields[t];
				if (n.kind === "clear" ? e.present : e.state !== "valid" || !g(e.value, n.value)) throw Error("unverified_snapshot");
			}
			for (let [t, n] of e) B.get(t) === n && (B.delete(t), le += 1);
			Oe(a);
			try {
				await ze();
			} catch (e) {
				if (!K() || o !== d) return;
				Re(e), K() && q("普通配置已保存并核对；来源凭据状态未确认，请单独刷新凭据。", "warning");
				return;
			}
			if (!K() || o !== d) return;
			q(B.size ? "已保存本次提交；仍有新的未保存修改。" : "已保存。", B.size ? "warning" : "success");
		} catch (e) {
			if (!K() || o !== d) return;
			if (y.has(v(e))) {
				be(), q("管理授权或模块上下文已失效，请重新进入页面。", "error"), X();
				return;
			}
			let t = v(e) === "revision_conflict";
			q(a ? "部分或全部修改已提交，状态暂未核实。请手动刷新并核对，不要重复提交。" : t ? "配置已被其他操作修改。草稿已保留，请手动刷新、核对后再保存。" : v(e) === "invalid_config" ? "配置未被接受。请检查字段，手动刷新并核对后再保存。" : "保存结果尚未确认。草稿已保留，请手动刷新并核对，不要重复提交。", "error");
		} finally {
			G() && o === d && (T = !1, X());
		}
	}, Q, Me, Ne = 0, Pe = (e) => {
		let t = e;
		if (!t || t.schema_version !== 1 || !["success", "partial_success"].includes(t.status) || t.privacy !== "public" || !t.document || !Array.isArray(t.document.blocks)) throw Error("invalid_cache_status");
		for (let e of t.document.blocks) {
			if (e?.kind !== "fields" || !e.fields || typeof e.fields != "object") continue;
			let t = e.fields.cache;
			if (t && Object.keys(t).sort().join(",") === "bytes,evictions,items,max_bytes,max_items" && !Object.values(t).some((e) => !Number.isSafeInteger(e) || e < 0)) return t;
		}
		throw Error("invalid_cache_status");
	}, Fe = async () => {
		if (!K() || T || !Q) return;
		let e = ++Ne;
		T = !0, X();
		try {
			let n = await t.services.invoke("wall_cache_status", {});
			if (!K() || e !== Ne) return;
			let r = Pe(n);
			Me.textContent = `缓存：${r.items} 项 / ${r.bytes} 字节；上限 ${r.max_items} 项 / ${r.max_bytes} 字节；已淘汰 ${r.evictions} 项。`, q("缓存状态已刷新。此操作只读取统计；普通刷新游戏库会继续复用有效原图。", "success");
		} catch {
			if (!K() || e !== Ne) return;
			Me.textContent = "缓存状态暂不可用。", q("读取缓存状态失败，请稍后重试。", "error");
		} finally {
			G() && e === Ne && (T = !1, X());
		}
	}, Ie = () => {
		for (let e of R.values()) e.input && (e.input.value = "");
	}, Le = () => {
		F !== null && (clearTimeout(F), F = null), R.get("credential_perfect")?.qr?.removeAttribute("src");
	}, Re = (e) => {
		y.has(v(e)) ? (be(), q("管理授权或页面上下文已失效，请重新进入。", "error")) : v(e) === "operation_cancelled" ? q("已取消操作。") : (M = null, q(v(e) === "revision_conflict" ? "设置已被其他操作修改。凭据输入已清除，请刷新状态后重新操作。" : "操作未完成或结果未确认。凭据输入已清除，请刷新并核对状态。", "error"));
	}, ze = async () => {
		if (!K() || !C[i] || !t.services.credentials?.status) return;
		let e = N, n = d, r = await t.services.credentials.status();
		if (K() && e === N && n === d) {
			if (!r || !Number.isSafeInteger(r.revision) || r.revision < 1 || !r.fields) throw Error("invalid_credential_status");
			for (let [e] of C[i]) {
				let t = r.fields[e];
				if (t && (typeof t.configured != "boolean" || typeof t.decryptable != "boolean" || t.upstream !== "unverified")) throw Error("invalid_credential_status");
			}
			M = r, Ge(), oe();
		}
	}, Be = async (e) => {
		let n = N;
		if (!e || !Number.isSafeInteger(e.revision) || e.revision <= M.revision) throw Error("invalid_receipt");
		let r = await t.services.config.current();
		if (K() && n === N) {
			if (r.revision < e.revision) throw Error("unverified_snapshot");
			Oe(r), await ze();
		}
	}, Ve = async (e, n) => {
		if (!K() || T || A || !M || P?.state === "waiting") return;
		let r = R.get(e).input?.value.trim();
		if (!n && (!r || r.length > 4096 || /[\x00-\x1f\x7f-\x9f]/u.test(r))) {
			q("请输入 1 到 4096 字符的有效 Key 或 Token。", "error");
			return;
		}
		let i = ++N;
		Ie(), A = !0, X();
		try {
			let a = n ? await t.services.credentials.clear(M.revision, e) : await t.services.credentials.replace(M.revision, e, { token: r });
			if (!K() || i !== N || (await Be(a), !K() || i !== N)) return;
			let o = M.fields[e];
			if (!o || o.configured === n) throw Error("unverified_snapshot");
			q(n ? "凭据已清除。" : "凭据已保存；有效性会在来源请求时验证。", "success");
		} catch (e) {
			K() && i === N && Re(e);
		} finally {
			G() && i === N && (A = !1, X());
		}
	}, He = (e) => {
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
	}, Ue = () => {
		if (!K() || P?.state !== "waiting" || I) return;
		F !== null && clearTimeout(F);
		let e = P.expires_at * 1e3 - Date.now();
		if (e <= 0) {
			Le(), P = {
				...P,
				state: "expired"
			}, q("二维码已超时，请重新登录。"), X();
			return;
		}
		let t = Math.min(e, Math.max(250, P.next_poll_at * 1e3 - Date.now()));
		F = setTimeout(() => {
			F = null, We("poll");
		}, t);
	}, We = async (e) => {
		if (!K() || !M || e === "cancel" && (I = !0, Le(), X(), A) || T || A) return;
		e === "begin" && (Le(), P = null, I = !1);
		let n = ++N, r = P?.session_id || "", i = null;
		A = !0, j = !0, Ie(), X();
		try {
			let a = await t.services.credentials.authorize(M.revision, "perfect_qr", e, r);
			if (!K() || n !== N) return;
			if (e === "qr") {
				if (typeof a.qr_png != "string" || a.qr_png.length > 5e5 || !/^iVBORw0KGgo[A-Za-z0-9+/=]*$/u.test(a.qr_png)) throw Error("invalid_qr_png");
				I || (R.get("credential_perfect").qr.src = `data:image/png;base64,${a.qr_png}`);
			} else {
				if (e === "revoke") {
					if (!a || Object.keys(a).sort().join(",") !== "receipt,revoked" || a.revoked !== !0 || !a.receipt) throw Error("invalid_revocation_receipt");
					P = null;
				} else P = He(a.session);
				if (a.receipt && await Be(a.receipt), !K() || n !== N) return;
				if (e === "revoke" && M?.fields.credential_perfect?.configured !== !1) throw Error("unverified_revocation");
				if (P?.state === "waiting") q(I ? "正在取消扫码。" : "请使用完美 App 扫码并亲自确认授权；留在本页等待结果。"), e === "begin" && (i = "qr");
				else {
					Le();
					let t = P?.state;
					q(t === "authorized" ? "完美授权已保存，玩家 Steam 绑定保持独立。" : e === "revoke" ? "完美授权已撤销。" : t === "expired" ? "二维码已过期，请重新登录。" : t === "cancelled" ? "扫码已取消。" : "授权会话已结束，请刷新状态。", t === "authorized" || e === "revoke" ? "success" : "warning"), I = !1;
				}
			}
		} catch (e) {
			K() && n === N && (Le(), P = null, I = !1, Re(e));
		} finally {
			G() && n === N && (A = !1, j = !1, X(), I && P?.state === "waiting" ? We("cancel") : i ? We(i) : P?.state === "waiting" && Ue());
		}
	}, Ge = () => {
		let e = (C[i] || []).filter(([e]) => M.fields[e]);
		if (e.length) {
			ne || (ne = H("section", void 0, "steam-dlc-credentials"), ne.append(H("h3", "来源凭据与授权"), H("p", "凭据只在可信管理入口提交。输入不保留为跨页草稿；已配置不代表上游已验证有效。", "steam-dlc-hint")), W.insertBefore(ne, pe));
			for (let [n, r] of e) {
				if (R.has(n)) continue;
				let e = H("section", void 0, "steam-dlc-credential"), i = H("p", "", "steam-dlc-credential-status");
				i.setAttribute("role", "status");
				let a = H("div", void 0, "steam-dlc-actions"), o = {
					status: i,
					actions: a,
					buttons: []
				};
				e.append(H("h4", r), i);
				let s = (e, t, n) => {
					let r = H("button", t, "ui-button");
					return r.type = "button", r.dataset.action = e, U(r, "click", () => {
						r.getAttribute("aria-disabled") !== "true" && n();
					}), a.append(r), o.buttons.push(r), r;
				};
				if (n === "credential_perfect") o.qr = H("img", void 0, "steam-dlc-qr"), o.qr.alt = "完美登录二维码，仅供本次管理员授权", o.qr.setAttribute("referrerpolicy", "no-referrer"), e.append(o.qr), s("perfect-begin", "扫码登录 / 重新登录", () => {
					We("begin");
				}), s("perfect-cancel", "取消扫码", () => {
					We("cancel");
				}), s("perfect-poll", "检查扫码状态", () => {
					We("poll");
				}), s("perfect-revoke", "撤销完美授权", () => {
					We("revoke");
				});
				else {
					let i = H("input");
					if (i.type = "password", i.className = "ui-control", i.id = `steam-dlc-${n}`, i.name = n, i.maxLength = 4096, i.autocomplete = "new-password", i.spellcheck = !1, i.setAttribute("aria-label", r), o.input = i, t.presentation) {
						let n = H("label", r), a = H("p", "来源凭据不会作为普通草稿保留。"), o = H("p");
						a.id = `${i.id}-hint`, o.id = `${i.id}-error`, t.presentation.field(e, {
							control: i,
							label: n,
							hint: a,
							error: o
						});
					} else e.append(i);
					U(i, "input", X), s(`replace-${n}`, "保存凭据", () => {
						Ve(n, !1);
					}), s(`clear-${n}`, "清除凭据", () => {
						Ve(n, !0);
					});
				}
				e.append(a), R.set(n, o), ne.append(e);
			}
			oe = () => {
				for (let [e, t] of R) {
					let n = M?.fields[e];
					t.status.textContent = n ? n.configured ? n.decryptable ? "已配置；上游有效性尚未验证。" : "已配置，但当前无法解密，请检查服务密钥后重新设置。" : "未配置。" : "状态待刷新。", e === "credential_perfect" && P && (t.status.textContent += ` 当前扫码：${P.state}。`), t.input && (t.input.disabled = !K() || T || A || P?.state === "waiting");
					for (let e of t.buttons) {
						let t = e.dataset.action, n = t === "perfect-cancel", r = !K() || !M || (n ? P?.state !== "waiting" && !j : T || A || t === "perfect-poll" && P?.state !== "waiting" || P?.state === "waiting" && !t.startsWith("perfect-"));
						e.setAttribute("aria-disabled", String(r));
					}
				}
			};
		}
	}, Ke = () => {
		let e = n.defaultView?.URL || URL;
		for (let t of ie.splice(0)) e.revokeObjectURL(t);
	}, $ = (e, n, r, a, o = "") => {
		let s = H("div", void 0, "steam-dlc-public-field"), c = H("label", r), l = H(a ? "select" : "input");
		l.id = `steam-dlc-${i}-${t.routeId}-${n}`, l.name = n, l.className = "ui-control", c.htmlFor = l.id, a ? l.append(...a.map((e) => {
			let t = H("option", S[e] || e);
			return t.value = e, t;
		})) : (l.type = "text", l.maxLength = 128, l.autocomplete = "off"), l.value = o;
		let u = H("p", "", "steam-dlc-hint"), d = H("p", "", "steam-dlc-field-error");
		return u.id = `${l.id}-hint`, d.id = `${l.id}-error`, t.presentation ? t.presentation.field(e, {
			control: l,
			label: c,
			hint: u,
			error: d
		}) : (s.append(c, l), e.append(s)), ae.push(l), l;
	}, qe = (e, t) => {
		if (!["match", "recent"].includes(e.kind)) return;
		let n = e.data, r = (e) => typeof e == "number" && Number.isFinite(e) ? String(e) : "未知", i = (e) => typeof e == "string" && e ? e : "未知", a = (e) => `${r(e?.scores?.[0])} : ${r(e?.scores?.[1])}`, o = (e) => `${r(e?.kills)}/${r(e?.deaths)}/${r(e?.assists)}`, s = (e, n) => {
			let r = H("div", void 0, "steam-dlc-table"), i = H("table"), a = H("tr");
			a.append(...e.map((e) => H("th", e))), i.append(a);
			for (let e of n) {
				let t = H("tr");
				t.append(...e.map((e) => H("td", e))), i.append(t);
			}
			r.append(i), t.append(r);
		}, c = {
			platform_recorded: "平台收录",
			recorded_official: "完美收录官匹",
			recent_first_page: "近期首批样本",
			recent_player_summary: "有界近期玩家摘要"
		}[e.coverage] || i(e.coverage), l = e.detail_level === "full_match";
		if (t.append(H("p", `来源：${S[e.platform] || i(e.platform)} · 范围：${c} · 详情：${l ? "完整比赛" : "玩家摘要"}`, "steam-dlc-hint")), l || t.append(H("p", "该来源仅提供该玩家的有界近期摘要，不含完整比赛名单与详情。", "steam-dlc-hint")), e.unavailable_reason && e.unavailable_reason !== "full_match_detail_unavailable" && t.append(H("p", `缺项说明：${i(e.unavailable_reason)}`, "steam-dlc-hint")), t.append(H("p", "未知表示来源未提供，不按 0 计算。", "steam-dlc-hint")), e.kind === "recent") {
			if (!Array.isArray(n.matches) || !n.matches.length) {
				t.append(H("p", "来源当前样本没有可展示的比赛。"));
				return;
			}
			s([
				"比赛",
				"地图",
				"比分",
				"K/D/A",
				"rating"
			], n.matches.map((e) => [
				i(e?.match_id),
				i(e?.map),
				a(e),
				o(e),
				r(e?.rating)
			]));
			return;
		}
		if (t.append(H("p", `比赛：${i(n.match_id)} · 地图：${i(n.map)} · 比分：${a(n)}`)), !l) {
			t.append(H("p", `玩家：${i(n.focus?.id || e.target?.id)} · K/D/A：${o(n)} · rating：${r(n.rating)}`));
			return;
		}
		if (n.focus && typeof n.focus == "object" && t.append(H("p", `焦点：${i(n.focus.nickname)} · ${i(n.focus.account_id)} · K/D/A：${o(n.focus)} · rating：${r(n.focus.rating)}`)), !Array.isArray(n.players) || !n.players.length) {
			t.append(H("p", "来源未提供可用玩家名单。"));
			return;
		}
		s([
			"玩家",
			"账号",
			"队伍",
			"K/D/A",
			"rating",
			"PW rating",
			"ADR"
		], n.players.map((e) => [
			i(e?.nickname),
			i(e?.account_id),
			r(e?.team),
			o(e),
			r(e?.rating),
			r(e?.pw_rating),
			r(e?.adr)
		]));
	}, Je = (e, t) => {
		if (!e || e.schema_version !== 1 || ![
			"success",
			"partial_success",
			"needs_selection",
			"error"
		].includes(e.status)) throw Error("invalid_result");
		if (t.replaceChildren(), e.status === "error") return t.append(H("p", typeof e.error?.message == "string" ? e.error.message : "来源未返回可用结果。", "steam-dlc-field-error")), !1;
		if (!e.document || !Array.isArray(e.document.blocks)) throw Error("invalid_result");
		for (let n of e.document.blocks) {
			if (n?.kind === "text" && typeof n.text == "string" && t.append(H("p", n.text)), n?.kind === "table" && Array.isArray(n.columns) && Array.isArray(n.rows)) {
				let e = H("div", void 0, "steam-dlc-table"), r = H("table"), i = H("tr");
				i.append(...n.columns.map((e) => H("th", String(e)))), r.append(i);
				for (let e of n.rows) {
					if (!Array.isArray(e)) continue;
					let t = H("tr");
					t.append(...e.map((e) => H("td", e === null ? "未知" : String(typeof e == "object" ? e.value ?? "" : e)))), r.append(t);
				}
				e.append(r), t.append(e);
			}
			let e = n?.kind === "fields" ? n.fields?.cs2 : null;
			if (n?.kind === "fields" && !e) {
				let e = H("dl");
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
					e.append(H("dt", t), H("dd", r === null ? "未知" : typeof r == "string" || typeof r == "number" || typeof r == "boolean" ? String(r) : "未提供"));
				}
				e.childNodes.length && t.append(e);
			}
			if (Array.isArray(e?.sources)) {
				let n = H("dl", void 0, "steam-dlc-source-status");
				for (let t of e.sources) n.append(H("dt", S[t.platform] || t.platform), H("dd", t.credential_state === "configured" ? "凭据已配置；查询时验证上游有效性。" : "需要在可信设置页授权。"));
				t.append(n);
			} else e?.data && (typeof e.fetched_at == "string" && t.append(H("p", `采样：${e.fetched_at}${e.season ? ` · 赛季 ${e.season}` : ""}`, "steam-dlc-hint")), qe(e, t));
		}
		for (let n of e.warnings || []) typeof n == "string" && t.append(H("p", n, "steam-dlc-hint"));
		return e.status !== "needs_selection";
	}, Ye = () => {
		let e = H("form", void 0, "steam-dlc-public-form"), n = H("section", void 0, "steam-dlc-public-result");
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
		U(a, "change", d), d(), W.append(H("p", "页面查询始终需要明确账号，不读取本人默认绑定。5E 使用 domain；官匹与 5E 单场仅限来源近期玩家摘要。", "steam-dlc-hint"));
		let f = H("button", "查询", "ui-button");
		f.type = "submit", f.dataset.variant = "primary", f.dataset.action = "query";
		let p = H("div", void 0, "steam-dlc-actions");
		p.append(f), e.append(p);
		let m = async (r) => {
			if (!K() || T) return;
			let d = r ? {} : { account: i.value.trim() };
			if (!r && (!d.account || !e.checkValidity())) {
				q("请填写明确账号并检查输入范围。", "error");
				return;
			}
			r || (Object.assign(d, {
				action: a.value,
				platform: o.value
			}), !c.disabled && c.value.trim() && (d.season = c.value.trim()), s.disabled || (d.limit = Number(s.value)), l.disabled || (d.match_id = l.value.trim()), !u.disabled && u.value.trim() && (d.focus = u.value.trim()));
			let p = ++L;
			T = !0, Ke(), n.replaceChildren(H("p", "正在查询来源。")), X(), f.setAttribute("aria-disabled", "true");
			try {
				let e = await t.services.invoke("query", d);
				if (!K() || p !== L) return;
				let r = Je(e, n);
				e.status === "needs_selection" ? q("需要补充选择，请按来源提示配置或改选。", "warning") : q(r ? "来源结果已更新。" : "查询未完成，请查看来源反馈。", r ? "success" : "warning");
			} catch {
				if (!K() || p !== L) return;
				Ke(), n.replaceChildren(H("p", "请求未完成，或返回内容不完整。请核对来源设置后重试。", "steam-dlc-field-error")), q("未取得可确认结果。", "error");
			} finally {
				G() && p === L && (T = !1, f.setAttribute("aria-disabled", String(!K())), X());
			}
		};
		U(e, "submit", (e) => {
			e.preventDefault(), m(!1);
		});
		let h = H("button", "刷新来源状态", "ui-button");
		h.type = "button", h.dataset.action = "query-status", U(h, "click", () => {
			m(!0);
		}), p.append(h), W.append(e, n), t.presentation?.actions(p), m(!0);
	};
	if (a && t.routeId === "home") {
		if (W.append(H("p", a.summary)), i !== "steam") {
			let e = H("section", void 0, "steam-dlc-source-panel"), n = H("button", "刷新来源状态", "ui-button");
			n.type = "button", n.dataset.action = "refresh-status";
			let r = async () => {
				if (!K() || T) return;
				let r = ++L;
				T = !0, X(), n.setAttribute("aria-disabled", "true");
				try {
					let n = await t.services.invoke("status", {});
					if (!K() || r !== L) return;
					Je(n, e);
				} catch {
					K() && r === L && e.replaceChildren(H("p", "来源状态读取失败，请稍后刷新。", "steam-dlc-field-error"));
				} finally {
					G() && r === L && (T = !1, n.setAttribute("aria-disabled", String(!K())), X());
				}
			};
			U(n, "click", () => {
				r();
			}), W.append(e, n), r();
		}
		W.append(H("h3", "命令帮助"));
		let e = H("dl", void 0, "steam-dlc-help");
		for (let [t, n] of a.commands) {
			let r = H("dt");
			r.append(H("code", t)), e.append(r, H("dd", n));
		}
		W.append(e), i === "steam" && (W.append(H("h3", "时长海报墙")), W.append(H("p", "游戏生涯拼图用累计小时映射每张作品的目标面积，提供单机、标准和长玩预设。大图跨行、小图填空，封面保持纵向比例；旧布局可以显式选择。未知时长不补零。", "steam-dlc-hint")), W.append(H("p", "games 与 recent 是不同公开样本；full 需要可选 Steam Key。选择来源不会自动把样本当成完整库。默认纵向 2:3，可切换 9:16 或 1:2；作品数量和输出预算共同约束分页，兼容旧布局最多 200 项。包含全部应用会纳入软件，旧设置中的关闭值继续保留。", "steam-dlc-hint")), Me = H("p", "尚未读取缓存状态。", "steam-dlc-cache-value"), Q = H("button", "刷新缓存状态"), Q.className = "ui-button", Q.type = "button", Q.dataset.action = "refresh-cache", U(Q, "click", () => {
			Fe();
		}), W.append(Me, Q)), i === "dota2" && W.append(H("p", "账号可用 Dota ID32 或 SteamID64。订阅创建、查看和取消使用当前群或私聊中的命令；页面不伪造聊天身份。OpenDota Key 可选，匿名与有 Key 都遵守同一每小时预算；模型短评失败不会阻止基础通知。", "steam-dlc-hint"));
	} else if (a && t.routeId === "settings") {
		J = H("form"), U(J, "submit", (e) => {
			e.preventDefault(), je();
		});
		let e = H("div", void 0, "steam-dlc-actions");
		Y = H("button", "保存修改"), Y.className = "ui-button", Y.dataset.variant = "primary", Y.type = "submit", Y.dataset.action = "save", _e = H("button", "刷新配置"), _e.className = "ui-button", _e.type = "button", _e.dataset.action = "refresh", ve = H("button", "放弃本模块修改"), ve.className = "ui-button", ve.type = "button", ve.dataset.action = "discard", U(_e, "click", () => {
			ke(!0);
		}), U(ve, "click", () => {
			K() && !T && O && (B.size && (le += 1), B.clear(), Ee(), q("已放弃本模块修改。", "success"), X());
		}), e.append(Y, _e, ve), t.presentation?.actions(e), W.append(J), J.append(e), W.append(H("p", "回复主题中的“跟随核心”清除模块覆盖值。恢复默认先形成草稿，保存后生效。", "steam-dlc-hint"));
	} else if (i === "cs2" && t.routeId === "query") Ye(!1);
	else if (i === "steam" && t.routeId === "collage") {
		let e = f(W, {
			options: t,
			active: K,
			field: $,
			parseLimit: w,
			validatePNG: (e) => ee(e, n.defaultView),
			say: q
		});
		re = e.dispose, de.push(e.dispose);
	} else if (i === "steam" && t.routeId === "wishlist") {
		let e = p(W, {
			options: t,
			active: K,
			field: $,
			say: q
		});
		re = e.dispose, de.push(e.dispose);
	} else if (i === "dota2" && t.routeId === "analysis") {
		let e = m(W, {
			options: t,
			active: K,
			field: $,
			renderResult: Je,
			say: q
		});
		re = e.dispose, de.push(e.dispose);
	} else W.append(H("p", "该页面入口未声明，请返回模块列表重新进入。"));
	W.append(pe);
	let Xe = () => {
		l || (l = !0, d += 1, Ne += 1, N += 1, L += 1, T = !1, Ke(), ae.forEach((e) => {
			e.value = "";
		}), Le(), Ie(), P = null, M = null, A = !1, j = !1, z !== null && (clearTimeout(z), z = null), B.clear(), O = null, de.splice(0).forEach((e) => e()), ue(), W.remove());
	};
	return t.scope.signal.addEventListener("abort", Xe, { once: !0 }), de.push(() => t.scope.signal.removeEventListener("abort", Xe)), ue = t.scope.onDispose(Xe), X(), J && ke(), Q && Fe(), {
		update(e) {
			if (l || u) return;
			let t = c.available;
			c = { ...e }, _(c) === r ? t !== c.available && (re(), L += 1, Ke(), N += 1, Le(), Ie(), P = null, A = !1, j = !1, Ne += 1, d += 1, T = !1, D = !1, q("页面可用状态已变化，请核对刷新后的配置。")) : (re(), L += 1, Ke(), ae.forEach((e) => {
				e.value = "";
			}), be(), q("模块运行上下文已变化，请重新进入页面。", "error")), X();
		},
		dispose: Xe,
		navigationImpact: me
	};
}
//#endregion
//#region packages/steam_dlc/pages/src/entry.js
function j(f, p) {
	let m = n({ ...p.context }), g = p.context.owner.startsWith("steam_dlc/") ? p.context.owner.slice(10) : "", _ = h[g], v = p.routeId === "settings", y = p.routeId === "collage" ? "游戏生涯拼图" : p.routeId === "wishlist" ? "公开愿望单" : p.routeId === "analysis" ? "指定玩家分析" : p.routeId === "query" ? "平台查询" : "", b, x, S = !1, C = () => {}, w = [], T = {
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
	}, ee = e({ setup: () => () => t(d, {
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
		aside: () => t(u, { title: v ? "设置说明" : "数据与账号" }, { default: () => [t(l, {}, { default: () => v ? g === "steam" ? "选择公开样本或完整库、布局、时长预设、比例和输出预算。完整库需要可选 Steam Key；是否完整以来源实际返回为准。" : g === "cs2" ? "完美授权与 5E Token 仅用于来源请求，玩家查询目标保持独立。二维码需由账号本人亲自确认；离页将停止轮询。" : g === "dota2" ? "订阅设置控制当前服务的采集与预算；具体群或私聊订阅通过本人命令管理。OpenDota Key 可选，不会自动扩大请求额度。" : "网页浅深主题与命令图片回复主题分别设置。回复主题选项由当前授权配置提供。" : _?.source || "当前页面没有可用的模块声明。" }), t("p", { class: "steam-dlc-hint" }, v ? "保存后会重新读取并核对结果；冲突或未确认结果需要手动刷新。" : "默认账号只在已授权的命令路径使用。自然语言工具必须提供明确账号或比赛编号。")] })
	})]) }) });
	ee.mount(f), x = A(b, {
		...p,
		presentation: T,
		scope: {
			signal: p.scope.signal,
			isCurrent: () => p.scope.isCurrent(),
			onDispose: () => () => {}
		}
	});
	let E = () => {
		S || (S = !0, x.dispose(), w.splice(0).reverse().forEach((e) => e.unmount()), ee.unmount(), C());
	};
	return C = p.scope.onDispose(E), {
		update(e) {
			S || (x.update(e), m.value = { ...e });
		},
		dispose: E,
		navigationImpact: x.navigationImpact
	};
}
//#endregion
export { j as mount };
