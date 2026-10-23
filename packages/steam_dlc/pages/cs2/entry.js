import { createApp as e, h as t, shallowRef as n } from "../../../../../../../runtime.js";
import { PageHeader as r, SettingsGroup as i, SettingsLayout as a, StatusHint as o, Surface as s, UiProvider as c } from "../../../../../../../runtime.js";
//#region packages/steam_dlc/pages/src/controller.js
var l = Object.freeze({
	steam: {
		title: "Steam",
		summary: "商店搜索、游戏详情与公开账号资料。共享关联由用户声明，不代表账号所有权验证。",
		source: "零 Key 路线使用 Steam 商店与公开 Community 页面。最近展示 3 款与最常玩 5 款是不同公开样本；完整游戏库增强需要部署者配置可选 Steam Key，当前未配置。",
		commands: [
			["/ygl steam bind <Dota ID32、SteamID64 或 profiles URL>", "在私聊中关联当前用户的 Steam 账号。"],
			["/ygl steam binding", "在私聊中查看当前用户关联。"],
			["/ygl steam unbind", "在私聊中解除当前用户关联。"],
			["/ygl steam search <游戏名或 AppID> [--country CC] [--language english]", "商店默认 CN / schinese；价格按本次地区、币种和来源时间展示，不代表历史最低价。"],
			["/ygl steam app <AppID> [--country CC] [--language english]", "查看商店详情与当前可用价格；图片失败时保留文字结果。"],
			["/ygl steam profile [账号]", "查看公开资料；昵称、头像、等级逐项标明可用性。"],
			["/ygl steam recent [账号]", "查看主页最近展示的公开样本，不代表完整两周游戏列表。"],
			["/ygl steam games [账号]", "查看来源可用的公开样本；完整游戏库增强需要可选 Steam Key。"],
			["/ygl steam wall [账号] [--source games|recent|full] [--all-apps] [--limit 1..200] [--refresh]", "生成有界时长海报墙；默认排除软件等非游戏应用。公开样本与完整库明确分开。"],
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
			["/ygl dota2 status", "查看功能说明。"]
		]
	},
	cs2: {
		title: "CS2",
		summary: "状态与查询框架已接入。生产游戏数据查询受来源留存政策限制，当前已阻止。",
		source: "Leetify 匿名接口已完成有限可行性检查；当前 Host 留存机制尚未满足来源政策，生产数据请求在 HTTP 前阻止。请勿将框架可用理解为已可查询。",
		commands: [["/ygl cs2 status", "查看当前功能范围。"]]
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
]), m = /* @__PURE__ */ new Map(), h = 4, g = 4096, _ = 256;
function v(e, t, n) {
	for (let [n, r] of m) r.owner === e.owner && n !== t && m.delete(n);
	if (!n || t.length > g) return null;
	let r = m.get(t) || {
		owner: e.owner,
		drafts: /* @__PURE__ */ new Map(),
		token: null
	};
	for (r.token = Symbol("ordinary-draft-mount"), m.delete(t), m.set(t, r); m.size > h;) m.delete(m.keys().next().value);
	return r;
}
function y(e, t) {
	let n = e.ownerDocument, r = d(t.context), i = t.context.owner.startsWith("steam_dlc/") ? t.context.owner.slice(10) : "", a = l[i], o = a ? v(t.context, r, t.routeId === "settings") : null, s = o?.token, c = { ...t.context }, h = !1, g = !1, y = 0, b = !1, x = !1, S = null, C = 0, ee = "", w = 0, T = null, E = () => {}, D = new Map(o?.drafts), O = /* @__PURE__ */ new Map(), k = [], A = (e, t, r) => {
		let i = n.createElement(e);
		return t !== void 0 && (i.textContent = t), r && (i.className = r), i;
	}, j = (e, t, n) => {
		e.addEventListener(t, n), k.push(() => e.removeEventListener(t, n));
	}, M = A("section", void 0, "steam-dlc-page"), N = A("p", "", "steam-dlc-hint");
	N.setAttribute("role", "status");
	let P = A("p", "", "steam-dlc-message");
	P.setAttribute("role", "status"), P.setAttribute("aria-live", "polite"), M.append(N), e.replaceChildren(M);
	let F = () => !h && !g && !t.scope.signal.aborted && t.scope.isCurrent() && d(c) === r && (!o || m.get(r) === o && o.token === s), I = () => F() && c.available, te = () => Object.freeze({
		ordinary: D.size > 0,
		credentials: !1,
		pending: b,
		version: C
	}), ne = () => {
		let e = JSON.stringify([
			D.size > 0,
			b,
			w
		]);
		e !== ee && (ee = e, C += 1, t.onNavigationStateChange?.());
	}, L = (e, t = "warning") => {
		T !== null && (clearTimeout(T), T = null), P.textContent = e, P.dataset.tone = t, e && t === "success" && (T = setTimeout(() => {
			T = null, F() && (P.textContent = "");
		}, 3500));
	}, re = () => {
		M.dataset.theme = c.theme, N.textContent = F() ? c.available ? "当前页面入口可用。运行健康请在模块管理中查看；此处不检测上游服务。" : "当前页面入口不可用，请在模块管理中刷新状态后重新进入。" : "页面上下文已失效，请重新进入本模块。";
	}, R, z, B, V, ie = () => {
		o && F() && (o.drafts = new Map([...D].filter(([e, t]) => {
			let n = e === "timezone" || e === "reply_theme" || i === "steam" && (e === "poster_include_apps" || e === "poster_limit"), r = t.rawValue ?? t.value;
			return n && (t.kind === "clear" || t.kind === "set" && [
				"string",
				"boolean",
				"number"
			].includes(typeof r) && !(typeof r == "number" && !Number.isFinite(r)) && !(typeof r == "string" && r.length > _));
		})));
	}, H = () => {
		(o ? m.get(r) === o && o.token === s : t.routeId === "home") && m.delete(r), g = !0, y += 1, b = !1, x = !1, D.size && (w += 1), D.clear(), S = null;
		for (let { control: e } of O.values()) e.value = "";
	}, U = () => {
		if (ie(), re(), M.setAttribute("aria-busy", String(b)), z) {
			z.setAttribute("aria-disabled", String(!I() || b || !x || !D.size)), B.setAttribute("aria-disabled", String(!I() || b)), V.setAttribute("aria-disabled", String(!I() || b || !D.size));
			for (let { control: e, reset: t } of O.values()) e.disabled = !I() || !S, t.setAttribute("aria-disabled", String(!I() || !S));
		}
		Z && Z.setAttribute("aria-disabled", String(!I() || b)), ne();
	}, W = i === "dota2" ? ["timezone", "reply_theme"] : i === "steam" ? [
		"reply_theme",
		"poster_include_apps",
		"poster_limit"
	] : ["reply_theme"], G = (e) => {
		if (!e || !Number.isSafeInteger(e.revision) || e.revision < 1 || !e.fields || !e.descriptors) throw Error("invalid_snapshot");
		for (let t of W) {
			let n = e.fields[t], r = e.descriptors[t];
			if (!n || !r || typeof r.description != "string" || t === "reply_theme" && (!Array.isArray(r.choices) || !r.choices.length || !r.choices.some((e) => e.value === null) || r.choices.some((e) => typeof e.label != "string" || e.value !== null && typeof e.value != "string")) || t === "timezone" && r.value_schema?.type !== "string" || t === "poster_include_apps" && (r.value_schema?.type !== "boolean" || typeof r.default != "boolean" || typeof n.value != "boolean") || t === "poster_limit" && (r.value_schema?.type !== "integer" || r.value_schema.minimum !== 1 || r.value_schema.maximum !== 200 || !Number.isInteger(r.default) || !Number.isInteger(n.value))) throw Error("invalid_snapshot");
		}
		return e;
	}, ae = (e) => {
		let t = D.get(e);
		return t ? t.kind === "clear" ? S.descriptors[e].default : t.value : S.fields[e].value;
	}, K = (e) => e === "poster_include_apps" ? [{
		value: !1,
		label: "仅游戏"
	}, {
		value: !0,
		label: "全部应用"
	}] : S.descriptors[e].choices, q = (e, t) => {
		if (!I() || !S) return;
		let n = S.fields[e], r = !b && (t.kind === "clear" ? !n.present : n.state === "valid" && u(n.value, t.value)) ? void 0 : t;
		if (u(D.get(e), r)) return;
		r === void 0 ? D.delete(e) : D.set(e, r), w += 1, O.get(e).error.textContent = "", O.get(e).control.setAttribute("aria-invalid", "false");
		let i = D.size && (!o || [...D.values()].some((e) => e.kind === "set" && typeof (e.rawValue ?? e.value) == "string" && (e.rawValue ?? e.value).length > _));
		L(i ? "输入超过草稿保留上限，请先修正再切页。" : D.size ? "有未保存的修改。" : "", "warning"), U();
	}, J = () => {
		for (let [e, { control: t, error: n, hint: r }] of O) {
			r.textContent = S.descriptors[e].description;
			let i = ae(e);
			if (e === "reply_theme" || e === "poster_include_apps") {
				let n = K(e);
				t.replaceChildren(...n.map((e, t) => {
					let n = A("option", e.label);
					return n.value = String(t), n;
				})), t.value = String(n.findIndex((e) => u(e.value, i)));
			} else t.value = e === "poster_limit" && D.get(e)?.rawValue !== void 0 ? D.get(e).rawValue : typeof i == "string" || typeof i == "number" ? String(i) : "";
			n.textContent = S.fields[e].state !== "valid" && !D.has(e) ? "当前配置无效，请修改或恢复默认后保存。" : "", t.setAttribute("aria-invalid", String(!!n.textContent));
		}
	}, oe = () => {
		for (let e of W) {
			let t = S.descriptors[e], n = A("div", void 0, "steam-dlc-field"), r = A("label", e === "timezone" ? "输出时区" : e === "reply_theme" ? "回复主题" : e === "poster_include_apps" ? "海报包含全部应用" : "海报项目上限"), a = A(e === "reply_theme" || e === "poster_include_apps" ? "select" : "input");
			a.className = "ui-control", a.id = `steam-dlc-${i}-${e}`, r.htmlFor = a.id, a.name = e;
			let o = A("p", t.description, "steam-dlc-hint");
			o.id = `${a.id}-hint`;
			let s = A("p", "", "steam-dlc-field-error");
			s.id = `${a.id}-error`, a.setAttribute("aria-describedby", `${o.id} ${s.id}`), e === "timezone" && (a.type = "text", a.autocomplete = "off", a.maxLength = Math.min(t.value_schema.maxLength ?? _, _)), e === "poster_limit" && (a.type = "number", a.min = String(t.value_schema.minimum), a.max = String(t.value_schema.maximum), a.step = "1");
			let c = A("button", "恢复默认");
			c.className = "ui-button", c.type = "button", c.dataset.action = `reset-${e}`, j(c, "click", () => {
				I() && S && (q(e, { kind: "clear" }), J());
			}), j(a, e === "reply_theme" || e === "poster_include_apps" ? "change" : "input", () => {
				if (I() && S) {
					if (e === "reply_theme" || e === "poster_include_apps") {
						let t = K(e)[Number(a.value)];
						if (!t) return;
						q(e, t.value === null ? { kind: "clear" } : {
							kind: "set",
							value: t.value
						});
					} else if (e === "poster_limit") {
						let t = a.value;
						q(e, a.validity.valid && t !== "" ? {
							kind: "set",
							value: Number(t)
						} : {
							kind: "set",
							value: null,
							rawValue: t
						});
					} else q(e, {
						kind: "set",
						value: a.value
					});
				}
			}), O.set(e, {
				control: a,
				reset: c,
				error: s,
				hint: o
			}), n.append(r, a, c, o, s), R.insertBefore(n, R.querySelector(".steam-dlc-actions"));
		}
	}, Y = (e) => {
		S = G(e);
		for (let [e, t] of D) {
			let n = S.fields[e];
			(t.kind === "clear" ? !n.present : n.state === "valid" && u(n.value, t.value)) && (D.delete(e), w += 1);
		}
		O.size || oe(), J(), x = !0;
	}, X = async (e = !1) => {
		if (!I() || b) return;
		let n = ++y;
		b = !0, U();
		try {
			if (!I() || n !== y) return;
			let r = await t.services.config.current();
			if (!I() || n !== y) return;
			Y(r), L(D.size ? "已刷新；草稿已保留，请核对后保存。" : e ? "已刷新。" : "", D.size ? "warning" : "success");
		} catch (e) {
			if (!I() || n !== y) return;
			if (p.has(f(e))) {
				H(), L("管理授权或模块上下文已失效，请重新进入页面。", "error"), U();
				return;
			}
			x = !1, L("配置读取未完成。请检查 Dashboard 授权与模块状态，再手动刷新。", "error");
		} finally {
			F() && n === y && (b = !1, U());
		}
	}, se = () => {
		let e = !0;
		for (let [t, n] of D) {
			if (n.kind === "clear") continue;
			let r = S.descriptors[t], i = "";
			if (t === "timezone") {
				let e = r.value_schema;
				if (typeof n.value != "string" || n.value.length < (e.minLength ?? 0) || n.value.length > (e.maxLength ?? Infinity)) i = "请输入符合长度要求的 IANA 时区。";
				else try {
					new Intl.DateTimeFormat("zh-CN", { timeZone: n.value }).format();
				} catch {
					i = "请输入有效的 IANA 时区，例如 Asia/Shanghai。";
				}
			} else if (t === "poster_limit") {
				let e = r.value_schema;
				(n.rawValue !== void 0 || !Number.isInteger(n.value) || n.value < e.minimum || n.value > e.maximum) && (i = "请输入 1 到 200 之间的整数。");
			} else t === "poster_include_apps" && typeof n.value != "boolean" ? i = "请选择是否包含全部应用。" : t === "reply_theme" && !r.choices.some((e) => u(e.value, n.value)) && (i = "请选择当前可用的回复主题。");
			O.get(t).error.textContent = i, O.get(t).control.setAttribute("aria-invalid", String(!!i)), i && (e = !1);
		}
		return e;
	}, ce = async () => {
		if (!I() || b || !x || !D.size || !se()) return;
		let e = new Map(D), n = {}, r = [];
		for (let [t, i] of e) i.kind === "clear" ? r.push(t) : n[t] = i.value;
		let i = S.revision, a = !1, o = ++y;
		b = !0, x = !1, L("正在保存，请等待确认。"), U();
		let s = (e) => {
			if (!e || !Number.isSafeInteger(e.revision) || e.revision <= i) throw Error("invalid_receipt");
			i = e.revision, a = !0;
		};
		try {
			if (!I() || o !== y) return;
			if (Object.keys(n).length) {
				let e = await t.services.config.save(i, n);
				if (!I() || o !== y) return;
				s(e);
			}
			if (r.length) {
				let e = await t.services.config.clear(i, r);
				if (!I() || o !== y) return;
				s(e);
			}
			let a = await t.services.config.current();
			if (!I() || o !== y) return;
			if (G(a), a.revision < i) throw Error("unverified_snapshot");
			for (let [t, n] of e) {
				let e = a.fields[t];
				if (n.kind === "clear" ? e.present : e.state !== "valid" || !u(e.value, n.value)) throw Error("unverified_snapshot");
			}
			for (let [t, n] of e) D.get(t) === n && (D.delete(t), w += 1);
			Y(a), L(D.size ? "已保存本次提交；仍有新的未保存修改。" : "已保存。", D.size ? "warning" : "success");
		} catch (e) {
			if (!I() || o !== y) return;
			if (p.has(f(e))) {
				H(), L("管理授权或模块上下文已失效，请重新进入页面。", "error"), U();
				return;
			}
			let t = f(e) === "revision_conflict";
			L(a ? "部分或全部修改已提交，状态暂未核实。请手动刷新并核对，不要重复提交。" : t ? "配置已被其他操作修改。草稿已保留，请手动刷新、核对后再保存。" : f(e) === "invalid_config" ? "配置未被接受。请检查字段，手动刷新并核对后再保存。" : "保存结果尚未确认。草稿已保留，请手动刷新并核对，不要重复提交。", "error");
		} finally {
			F() && o === y && (b = !1, U());
		}
	}, Z, Q, $ = 0, le = (e) => {
		let t = e;
		if (!t || t.schema_version !== 1 || !["success", "partial_success"].includes(t.status) || t.privacy !== "public" || !t.document || !Array.isArray(t.document.blocks)) throw Error("invalid_cache_status");
		for (let e of t.document.blocks) {
			if (e?.kind !== "fields" || !e.fields || typeof e.fields != "object") continue;
			let t = e.fields.cache;
			if (t && Object.keys(t).sort().join(",") === "bytes,evictions,items,max_bytes,max_items" && !Object.values(t).some((e) => !Number.isSafeInteger(e) || e < 0)) return t;
		}
		throw Error("invalid_cache_status");
	}, ue = async () => {
		if (!I() || b || !Z) return;
		let e = ++$;
		b = !0, U();
		try {
			let n = await t.services.invoke("wall_cache_status", {});
			if (!I() || e !== $) return;
			let r = le(n);
			Q.textContent = `缓存：${r.items} 项 / ${r.bytes} 字节；上限 ${r.max_items} 项 / ${r.max_bytes} 字节；已淘汰 ${r.evictions} 项。`, L("缓存状态已刷新。此操作只读取统计；重新验证封面请使用 --refresh。", "success");
		} catch {
			if (!I() || e !== $) return;
			Q.textContent = "缓存状态暂不可用。", L("读取缓存状态失败，请稍后重试。", "error");
		} finally {
			F() && e === $ && (b = !1, U());
		}
	};
	if (a && t.routeId === "home") {
		M.append(A("p", a.summary)), M.append(A("h3", "命令帮助"));
		let e = A("dl", void 0, "steam-dlc-help");
		for (let [t, n] of a.commands) {
			let r = A("dt");
			r.append(A("code", t)), e.append(r, A("dd", n));
		}
		M.append(e), i === "steam" && (M.append(A("h3", "时长海报墙")), M.append(A("p", "默认按累计游玩时长排序并以 √分钟 作为面积权重，压低极端时长差异；显示的实际时长保持原值。只纳入可确认的游戏，未知类型或时长单独说明，不按名称猜测，也不把缺失当作零。", "steam-dlc-hint")), M.append(A("p", "默认使用公开样本：games 是主页 mostPlayed 样本，recent 是近期展示样本，两者都不是完整游戏库。full 需要可选 Steam Web API Key，目前未配置。缺失或权限受限会明确标注，不把未知时长当作零。全部应用选项会把软件等非游戏应用也纳入。项目上限为 1–200，结果按页码和项目范围标注；封面等比例裁切以填满块，不会拉伸。重新验证封面请在命令中使用 --refresh。", "steam-dlc-hint")), Q = A("p", "尚未读取缓存状态。", "steam-dlc-cache-value"), Z = A("button", "刷新缓存状态"), Z.className = "ui-button", Z.type = "button", Z.dataset.action = "refresh-cache", j(Z, "click", () => {
			ue();
		}), M.append(Q, Z)), i === "dota2" && M.append(A("p", "账号可用 Dota ID32 或 SteamID64。自然语言工具需要明确账号；关联与解除关联请使用私聊 Steam 命令。", "steam-dlc-hint"));
	} else if (a && t.routeId === "settings") {
		R = A("form"), j(R, "submit", (e) => {
			e.preventDefault(), ce();
		});
		let e = A("div", void 0, "steam-dlc-actions");
		z = A("button", "保存修改"), z.className = "ui-button", z.dataset.variant = "primary", z.type = "submit", z.dataset.action = "save", B = A("button", "刷新配置"), B.className = "ui-button", B.type = "button", B.dataset.action = "refresh", V = A("button", "放弃本模块修改"), V.className = "ui-button", V.type = "button", V.dataset.action = "discard", j(B, "click", () => {
			X(!0);
		}), j(V, "click", () => {
			I() && !b && S && (D.size && (w += 1), D.clear(), J(), L("已放弃本模块修改。", "success"), U());
		}), e.append(z, B, V), M.append(R), R.append(e), M.append(A("p", "回复主题中的“跟随核心”清除模块覆盖值。恢复默认先形成草稿，保存后生效。", "steam-dlc-hint"));
	} else M.append(A("p", "该页面入口未声明，请返回模块列表重新进入。"));
	M.append(P);
	let de = () => {
		h || (h = !0, y += 1, $ += 1, b = !1, T !== null && (clearTimeout(T), T = null), D.clear(), S = null, k.splice(0).forEach((e) => e()), E(), M.remove());
	};
	return E = t.scope.onDispose(de), U(), R && X(), Z && ue(), {
		update(e) {
			if (h || g) return;
			let t = c.available;
			c = { ...e }, d(c) === r ? t !== c.available && ($ += 1, y += 1, b = !1, x = !1, L("页面可用状态已变化，请核对刷新后的配置。")) : (H(), L("模块运行上下文已变化，请重新进入页面。", "error")), U();
		},
		dispose: de,
		navigationImpact: te
	};
}
//#endregion
//#region packages/steam_dlc/pages/src/entry.js
function b(u, d) {
	let f = n({ ...d.context }), p = d.context.owner.startsWith("steam_dlc/") ? d.context.owner.slice(10) : "", m = l[p], h = d.routeId === "settings", g, _, v = !1, b = () => {}, x = e({ setup: () => () => t(c, {
		theme: f.value.theme,
		locale: f.value.locale,
		styleMountTarget: u
	}, { default: () => t("section", {
		class: "steam-dlc-view",
		lang: f.value.locale
	}, [t(r, {
		title: m ? `${m.title}${h ? " 设置" : ""}` : "模块页面不可用",
		eyebrow: "YOMIHIME GAME LINK / STEAM DLC",
		subtitle: h ? "维护本模块的命令输出设置。" : m?.summary
	}), t(a, {}, {
		default: () => t(i, {
			title: h ? "回复与输出" : "命令与可用状态",
			number: "01"
		}, { default: () => t("div", { ref: (e) => {
			g = e;
		} }) }),
		aside: () => t(s, { title: h ? "设置说明" : "数据与账号" }, { default: () => [t(o, {}, { default: () => h ? p === "steam" ? "可设置回复主题、海报默认是否包含非游戏应用，以及每次海报墙最多纳入的项目数。海报墙默认只使用可见的公开游戏样本。" : "网页浅深主题与命令图片回复主题分别设置。回复主题选项由当前授权配置提供。" : m?.source || "当前页面没有可用的模块声明。" }), t("p", { class: "steam-dlc-hint" }, h ? "保存后会重新读取并核对结果；冲突或未确认结果需要手动刷新。" : "默认账号只在已授权的命令路径使用。自然语言工具必须提供明确账号或比赛编号。")] })
	})]) }) });
	x.mount(u), _ = y(g, {
		...d,
		scope: {
			signal: d.scope.signal,
			isCurrent: () => d.scope.isCurrent(),
			onDispose: () => () => {}
		}
	});
	let S = () => {
		v || (v = !0, _.dispose(), x.unmount(), b());
	};
	return b = d.scope.onDispose(S), {
		update(e) {
			v || (_.update(e), f.value = { ...e });
		},
		dispose: S,
		navigationImpact: _.navigationImpact
	};
}
//#endregion
export { b as mount };
