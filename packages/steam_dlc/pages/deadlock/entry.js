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
	let n = e.ownerDocument, r = d(t.context), i = t.context.owner.startsWith("steam_dlc/") ? t.context.owner.slice(10) : "", a = l[i], o = a ? v(t.context, r, t.routeId === "settings") : null, s = o?.token, c = { ...t.context }, h = !1, g = !1, y = 0, b = !1, x = !1, S = null, C = 0, w = "", T = 0, E = null, D = () => {}, O = new Map(o?.drafts), k = /* @__PURE__ */ new Map(), A = [], j = (e, t, r) => {
		let i = n.createElement(e);
		return t !== void 0 && (i.textContent = t), r && (i.className = r), i;
	}, M = (e, t, n) => {
		e.addEventListener(t, n), A.push(() => e.removeEventListener(t, n));
	}, N = j("section", void 0, "steam-dlc-page"), P = j("p", "", "steam-dlc-hint");
	P.setAttribute("role", "status");
	let F = j("p", "", "steam-dlc-message");
	F.setAttribute("role", "status"), F.setAttribute("aria-live", "polite"), N.append(P), e.replaceChildren(N);
	let I = () => !h && !g && !t.scope.signal.aborted && t.scope.isCurrent() && d(c) === r && (!o || m.get(r) === o && o.token === s), L = () => I() && c.available, R = () => Object.freeze({
		ordinary: O.size > 0,
		credentials: !1,
		pending: b,
		version: C
	}), z = () => {
		let e = JSON.stringify([
			O.size > 0,
			b,
			T
		]);
		e !== w && (w = e, C += 1, t.onNavigationStateChange?.());
	}, B = (e, t = "warning") => {
		E !== null && (clearTimeout(E), E = null), F.textContent = e, F.dataset.tone = t, e && t === "success" && (E = setTimeout(() => {
			E = null, I() && (F.textContent = "");
		}, 3500));
	}, ee = () => {
		N.dataset.theme = c.theme, P.textContent = I() ? c.available ? "当前页面入口可用。运行健康请在模块管理中查看；此处不检测上游服务。" : "当前页面入口不可用，请在模块管理中刷新状态后重新进入。" : "页面上下文已失效，请重新进入本模块。";
	}, V, H, U, W, te = () => {
		o && I() && (o.drafts = new Map([...O].filter(([e, t]) => (e === "timezone" || e === "reply_theme") && (t.kind === "clear" || t.kind === "set" && typeof t.value == "string" && t.value.length <= _))));
	}, G = () => {
		(o ? m.get(r) === o && o.token === s : t.routeId === "home") && m.delete(r), g = !0, y += 1, b = !1, x = !1, O.size && (T += 1), O.clear(), S = null;
		for (let { control: e } of k.values()) e.value = "";
	}, K = () => {
		if (te(), ee(), N.setAttribute("aria-busy", String(b)), H) {
			H.setAttribute("aria-disabled", String(!L() || b || !x || !O.size)), U.setAttribute("aria-disabled", String(!L() || b)), W.setAttribute("aria-disabled", String(!L() || b || !O.size));
			for (let { control: e, reset: t } of k.values()) e.disabled = !L() || !S, t.setAttribute("aria-disabled", String(!L() || !S));
		}
		z();
	}, q = i === "dota2" ? ["timezone", "reply_theme"] : ["reply_theme"], J = (e) => {
		if (!e || !Number.isSafeInteger(e.revision) || e.revision < 1 || !e.fields || !e.descriptors) throw Error("invalid_snapshot");
		for (let t of q) {
			let n = e.fields[t], r = e.descriptors[t];
			if (!n || !r || typeof r.description != "string" || t === "reply_theme" && (!Array.isArray(r.choices) || !r.choices.length || !r.choices.some((e) => e.value === null) || r.choices.some((e) => typeof e.label != "string" || e.value !== null && typeof e.value != "string")) || t === "timezone" && r.value_schema?.type !== "string") throw Error("invalid_snapshot");
		}
		return e;
	}, ne = (e) => {
		let t = O.get(e);
		return t ? t.kind === "clear" ? S.descriptors[e].default : t.value : S.fields[e].value;
	}, Y = (e, t) => {
		if (!L() || !S) return;
		let n = S.fields[e], r = !b && (t.kind === "clear" ? !n.present : n.state === "valid" && u(n.value, t.value)) ? void 0 : t;
		if (u(O.get(e), r)) return;
		r === void 0 ? O.delete(e) : O.set(e, r), T += 1, k.get(e).error.textContent = "", k.get(e).control.setAttribute("aria-invalid", "false");
		let i = O.size && (!o || [...O.values()].some((e) => e.kind === "set" && e.value.length > _));
		B(i ? "输入超过草稿保留上限，请先修正再切页。" : O.size ? "有未保存的修改。" : "", "warning"), K();
	}, X = () => {
		for (let [e, { control: t, error: n, hint: r }] of k) {
			r.textContent = S.descriptors[e].description;
			let i = ne(e);
			if (e === "reply_theme") {
				let n = S.descriptors[e].choices;
				t.replaceChildren(...n.map((e, t) => {
					let n = j("option", e.label);
					return n.value = String(t), n;
				})), t.value = String(n.findIndex((e) => u(e.value, i)));
			} else t.value = typeof i == "string" ? i : "";
			n.textContent = S.fields[e].state !== "valid" && !O.has(e) ? "当前配置无效，请修改或恢复默认后保存。" : "", t.setAttribute("aria-invalid", String(!!n.textContent));
		}
	}, re = () => {
		for (let e of q) {
			let t = S.descriptors[e], n = j("div", void 0, "steam-dlc-field"), r = j("label", e === "timezone" ? "输出时区" : "回复主题"), a = j(e === "reply_theme" ? "select" : "input");
			a.className = "ui-control", a.id = `steam-dlc-${i}-${e}`, r.htmlFor = a.id, a.name = e;
			let o = j("p", t.description, "steam-dlc-hint");
			o.id = `${a.id}-hint`;
			let s = j("p", "", "steam-dlc-field-error");
			s.id = `${a.id}-error`, a.setAttribute("aria-describedby", `${o.id} ${s.id}`), e === "timezone" && (a.type = "text", a.autocomplete = "off", a.maxLength = Math.min(t.value_schema.maxLength ?? _, _));
			let c = j("button", "恢复默认");
			c.className = "ui-button", c.type = "button", c.dataset.action = `reset-${e}`, M(c, "click", () => {
				L() && S && (Y(e, { kind: "clear" }), X());
			}), M(a, e === "reply_theme" ? "change" : "input", () => {
				if (L() && S) {
					if (e === "reply_theme") {
						let t = S.descriptors[e].choices[Number(a.value)];
						if (!t) return;
						Y(e, t.value === null ? { kind: "clear" } : {
							kind: "set",
							value: t.value
						});
					} else Y(e, {
						kind: "set",
						value: a.value
					});
				}
			}), k.set(e, {
				control: a,
				reset: c,
				error: s,
				hint: o
			}), n.append(r, a, c, o, s), V.insertBefore(n, V.querySelector(".steam-dlc-actions"));
		}
	}, Z = (e) => {
		S = J(e);
		for (let [e, t] of O) {
			let n = S.fields[e];
			(t.kind === "clear" ? !n.present : n.state === "valid" && u(n.value, t.value)) && (O.delete(e), T += 1);
		}
		k.size || re(), X(), x = !0;
	}, Q = async (e = !1) => {
		if (!L() || b) return;
		let n = ++y;
		b = !0, K();
		try {
			if (!L() || n !== y) return;
			let r = await t.services.config.current();
			if (!L() || n !== y) return;
			Z(r), B(O.size ? "已刷新；草稿已保留，请核对后保存。" : e ? "已刷新。" : "", O.size ? "warning" : "success");
		} catch (e) {
			if (!L() || n !== y) return;
			if (p.has(f(e))) {
				G(), B("管理授权或模块上下文已失效，请重新进入页面。", "error"), K();
				return;
			}
			x = !1, B("配置读取未完成。请检查 Dashboard 授权与模块状态，再手动刷新。", "error");
		} finally {
			I() && n === y && (b = !1, K());
		}
	}, ie = () => {
		let e = !0;
		for (let [t, n] of O) {
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
			} else r.choices.some((e) => u(e.value, n.value)) || (i = "请选择当前可用的回复主题。");
			k.get(t).error.textContent = i, k.get(t).control.setAttribute("aria-invalid", String(!!i)), i && (e = !1);
		}
		return e;
	}, ae = async () => {
		if (!L() || b || !x || !O.size || !ie()) return;
		let e = new Map(O), n = {}, r = [];
		for (let [t, i] of e) i.kind === "clear" ? r.push(t) : n[t] = i.value;
		let i = S.revision, a = !1, o = ++y;
		b = !0, x = !1, B("正在保存，请等待确认。"), K();
		let s = (e) => {
			if (!e || !Number.isSafeInteger(e.revision) || e.revision <= i) throw Error("invalid_receipt");
			i = e.revision, a = !0;
		};
		try {
			if (!L() || o !== y) return;
			if (Object.keys(n).length) {
				let e = await t.services.config.save(i, n);
				if (!L() || o !== y) return;
				s(e);
			}
			if (r.length) {
				let e = await t.services.config.clear(i, r);
				if (!L() || o !== y) return;
				s(e);
			}
			let a = await t.services.config.current();
			if (!L() || o !== y) return;
			if (J(a), a.revision < i) throw Error("unverified_snapshot");
			for (let [t, n] of e) {
				let e = a.fields[t];
				if (n.kind === "clear" ? e.present : e.state !== "valid" || !u(e.value, n.value)) throw Error("unverified_snapshot");
			}
			for (let [t, n] of e) O.get(t) === n && (O.delete(t), T += 1);
			Z(a), B(O.size ? "已保存本次提交；仍有新的未保存修改。" : "已保存。", O.size ? "warning" : "success");
		} catch (e) {
			if (!L() || o !== y) return;
			if (p.has(f(e))) {
				G(), B("管理授权或模块上下文已失效，请重新进入页面。", "error"), K();
				return;
			}
			let t = f(e) === "revision_conflict";
			B(a ? "部分或全部修改已提交，状态暂未核实。请手动刷新并核对，不要重复提交。" : t ? "配置已被其他操作修改。草稿已保留，请手动刷新、核对后再保存。" : f(e) === "invalid_config" ? "配置未被接受。请检查字段，手动刷新并核对后再保存。" : "保存结果尚未确认。草稿已保留，请手动刷新并核对，不要重复提交。", "error");
		} finally {
			I() && o === y && (b = !1, K());
		}
	};
	if (a && t.routeId === "home") {
		N.append(j("p", a.summary)), N.append(j("h3", "命令帮助"));
		let e = j("dl", void 0, "steam-dlc-help");
		for (let [t, n] of a.commands) {
			let r = j("dt");
			r.append(j("code", t)), e.append(r, j("dd", n));
		}
		N.append(e), i === "dota2" && N.append(j("p", "账号可用 Dota ID32 或 SteamID64。自然语言工具需要明确账号；关联与解除关联请使用私聊 Steam 命令。", "steam-dlc-hint"));
	} else if (a && t.routeId === "settings") {
		V = j("form"), M(V, "submit", (e) => {
			e.preventDefault(), ae();
		});
		let e = j("div", void 0, "steam-dlc-actions");
		H = j("button", "保存修改"), H.className = "ui-button", H.dataset.variant = "primary", H.type = "submit", H.dataset.action = "save", U = j("button", "刷新配置"), U.className = "ui-button", U.type = "button", U.dataset.action = "refresh", W = j("button", "放弃本模块修改"), W.className = "ui-button", W.type = "button", W.dataset.action = "discard", M(U, "click", () => {
			Q(!0);
		}), M(W, "click", () => {
			L() && !b && S && (O.size && (T += 1), O.clear(), X(), B("已放弃本模块修改。", "success"), K());
		}), e.append(H, U, W), N.append(V), V.append(e), N.append(j("p", "回复主题中的“跟随核心”清除模块覆盖值。恢复默认先形成草稿，保存后生效。", "steam-dlc-hint"));
	} else N.append(j("p", "该页面入口未声明，请返回模块列表重新进入。"));
	N.append(F);
	let $ = () => {
		h || (h = !0, y += 1, b = !1, E !== null && (clearTimeout(E), E = null), O.clear(), S = null, A.splice(0).forEach((e) => e()), D(), N.remove());
	};
	return D = t.scope.onDispose($), K(), V && Q(), {
		update(e) {
			if (h || g) return;
			let t = c.available;
			c = { ...e }, d(c) === r ? t !== c.available && (y += 1, b = !1, x = !1, B("页面可用状态已变化，请核对刷新后的配置。")) : (G(), B("模块运行上下文已变化，请重新进入页面。", "error")), K();
		},
		dispose: $,
		navigationImpact: R
	};
}
//#endregion
//#region packages/steam_dlc/pages/src/entry.js
function b(u, d) {
	let f = n({ ...d.context }), p = l[d.context.owner.startsWith("steam_dlc/") ? d.context.owner.slice(10) : ""], m = d.routeId === "settings", h, g, _ = !1, v = () => {}, b = e({ setup: () => () => t(c, {
		theme: f.value.theme,
		locale: f.value.locale,
		styleMountTarget: u
	}, { default: () => t("section", {
		class: "steam-dlc-view",
		lang: f.value.locale
	}, [t(r, {
		title: p ? `${p.title}${m ? " 设置" : ""}` : "模块页面不可用",
		eyebrow: "YOMIHIME GAME LINK / STEAM DLC",
		subtitle: m ? "维护本模块的命令输出设置。" : p?.summary
	}), t(a, {}, {
		default: () => t(i, {
			title: m ? "回复与输出" : "命令与可用状态",
			number: "01"
		}, { default: () => t("div", { ref: (e) => {
			h = e;
		} }) }),
		aside: () => t(s, { title: m ? "设置说明" : "数据与账号" }, { default: () => [t(o, {}, { default: () => m ? "网页浅深主题与命令图片回复主题分别设置。回复主题选项由当前授权配置提供。" : p?.source || "当前页面没有可用的模块声明。" }), t("p", { class: "steam-dlc-hint" }, m ? "保存后会重新读取并核对结果；冲突或未确认结果需要手动刷新。" : "默认账号只在已授权的命令路径使用。自然语言工具必须提供明确账号或比赛编号。")] })
	})]) }) });
	b.mount(u), g = y(h, {
		...d,
		scope: {
			signal: d.scope.signal,
			isCurrent: () => d.scope.isCurrent(),
			onDispose: () => () => {}
		}
	});
	let x = () => {
		_ || (_ = !0, g.dispose(), b.unmount(), v());
	};
	return v = d.scope.onDispose(x), {
		update(e) {
			_ || (g.update(e), f.value = { ...e });
		},
		dispose: x,
		navigationImpact: g.navigationImpact
	};
}
//#endregion
export { b as mount };
