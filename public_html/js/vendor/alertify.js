! function (a, b) {
    "use strict";
    var c, d = a.document;
    c = function () {
        function c(a, b, c) {
            for (var e = "undefined" != typeof c ? [c] : d.styleSheets, f = 0, g = e.length; g > f; f++)
                if (c = e[f], c.cssRules)
                    for (var h = 0, i = c.cssRules.length; i > h; h++) {
                        var j = c.cssRules[h];
                        if (j.selectorText && -1 !== j.selectorText.split(",").indexOf(b)) return j.style[a]
                    }
                return null
        }
        var e, f, g, h, i, j, k, l, m, n, o, p, q, r = {},
            s = {},
            t = !1,
            u = {
                ENTER: 13,
                ESC: 27,
                SPACE: 32
            },
            v = [];
        return s = {
            buttons: {
                holder: '<nav class="alertify-buttons">{{buttons}}</nav>',
                submit: '<button type="submit" class="alertify-button alertify-button-ok" id="alertify-ok">{{ok}}</button>',
                ok: '<button class="alertify-button alertify-button-ok" id="alertify-ok">{{ok}}</button>',
                cancel: '<button class="alertify-button alertify-button-cancel" id="alertify-cancel">{{cancel}}</button>'
            },
            input: '<div class="alertify-text-wrapper"><input type="text" class="alertify-text" id="alertify-text"></div>',
            message: '<p class="alertify-message">{{message}}</p>',
            log: '<article class="alertify-log{{class}}">{{message}}</article>'
        }, q = function () {
            var a, c, e = !1,
                f = d.createElement("fakeelement"),
                g = {
                    WebkitTransition: "webkitTransitionEnd",
                    MozTransition: "transitionend",
                    OTransition: "otransitionend",
                    transition: "transitionend"
                };
            for (a in g)
                if (g.hasOwnProperty(a) && f.style[a] !== b) {
                    c = g[a], e = !0;
                    break
                }
            return {
                type: c,
                supported: e
            }
        }, e = function (a) {
            return d.getElementById(a)
        }, r = {
            labels: {
                ok: "OK",
                cancel: "Cancel"
            },
            delay: 5e3,
            buttonReverse: !1,
            buttonFocus: "ok",
            transition: b,
            keydown: !1,
            addListeners: function (b) {
                var c, d, e, j, k, l, m = "undefined" != typeof g,
                    n = "undefined" != typeof f,
                    o = "undefined" != typeof p,
                    q = "",
                    r = this;
                d = function (a) {
                    a.preventDefault(), j(a), "undefined" != typeof p && (q = p.value), "function" == typeof b && ("undefined" != typeof p ? b(!0, q) : b(!0))
                }, e = function (a) {
                    a.preventDefault(), j(a), "function" == typeof b && b(!1)
                }, j = function () {
                    r.hide(), a.removeEventListener("keyup", k), a.removeEventListener("keydown", c), a.removeEventListener("focus", l), m && g.removeEventListener("click", d), n && f.removeEventListener("click", e)
                }, k = function (a) {
                    var b = a.keyCode;
                    r.keydown = !1, b === u.SPACE && !o || o && b === u.ENTER ? d(a) : b === u.ESC && n && e(a)
                }, c = function () {
                    r.keydown = !0
                }, l = function () {
                    o ? p.focus() : !n || r.buttonReverse ? g.focus() : f.focus()
                }, h.addEventListener("focus", l), i.addEventListener("focus", l), m && g.addEventListener("click", d), n && f.addEventListener("click", e), a.addEventListener("keyup", k), a.addEventListener("keydown", c), this.transition.supported || this.setFocus()
            },
            handleErrors: function () {
                if ("undefined" != typeof a.onerror) {
                    var b = this;
                    return a.onerror = function (a, c, d) {
                        b.error("[" + a + " on line " + d + " of " + c + "]", 0)
                    }, !0
                }
                return !1
            },
            appendButtons: function (a, b) {
                return this.buttonReverse ? b + a : a + b
            },
            build: function (a) {
                var b = "",
                    c = a.type,
                    d = a.message,
                    e = a.cssClass || "";
                switch (b += '<div class="alertify-dialog">', b += '<a id="alertify-resetFocusBack" class="alertify-resetFocus" href="#">Reset Focus</a>', "none" === r.buttonFocus && (b += '<a href="#" id="alertify-noneFocus" class="alertify-hidden"></a>'), "prompt" === c && (b += '<div id="alertify-form">'), b += '<article class="alertify-inner">', b += s.message.replace("{{message}}", d), "prompt" === c && (b += s.input), b += s.buttons.holder, b += "</article>", "prompt" === c && (b += "</div>"), b += '<a id="alertify-resetFocus" class="alertify-resetFocus" href="#">Reset Focus</a>', b += "</div>", c) {
                case "confirm":
                    b = b.replace("{{buttons}}", this.appendButtons(s.buttons.cancel, s.buttons.ok)), b = b.replace("{{ok}}", this.labels.ok).replace("{{cancel}}", this.labels.cancel);
                    break;
                case "confirmA":
                    b = b.replace("{{buttons}}", s.buttons.ok), b = b.replace("{{ok}}", this.labels.ok);
                    break;
                case "prompt":
                    b = b.replace("{{buttons}}", this.appendButtons(s.buttons.cancel, s.buttons.submit)), b = b.replace("{{ok}}", this.labels.ok).replace("{{cancel}}", this.labels.cancel);
                    break;
                case "alert":
                    b = b.replace("{{buttons}}", s.buttons.ok), b = b.replace("{{ok}}", this.labels.ok)
                }
                return m.className = "alertify alertify-" + c + " " + e, l.className = "alertify-cover", b
            },
            close: function (a, b) {
                var d, e, f = b && !isNaN(b) ? +b : this.delay,
                    g = this;
                a.addEventListener("click", function () {
                    d(a)
                }), e = function (a) {
                    a.stopPropagation(), this.removeEventListener(g.transition.type, e), n.removeChild(this), n.hasChildNodes() || (n.className += " alertify-logs-hidden")
                }, d = function (a) {
                    if ("undefined" != typeof a && a.parentNode === n)
                        if (g.transition.supported) {
                            a.addEventListener(g.transition.type, e), a.className += " alertify-log-hide";
                            var b = (c("transition-duration", ".alertify-log-hide") || c("-webkit-transition-duration", ".alertify-log-hide") || c("-moz-transition-duration", ".alertify-log-hide") || c("-o-transition-duration", ".alertify-log-hide") || "0").toLowerCase(),
                                d = parseInt(b),
                                f = 1;
                            (!d || isNaN(d)) && (d = 500), b.indexOf("ms") > -1 ? d += f : b.indexOf("s") > -1 && (d *= 1e3, d += f), setTimeout(function () {
                                "undefined" != typeof a && a.parentNode === n && n.removeChild(a)
                            }, d)
                        } else n.removeChild(a), n.hasChildNodes() || (n.className += " alertify-logs-hidden")
                }, 0 !== b && setTimeout(function () {
                    d(a)
                }, f)
            },
            dialog: function (a, b, c, e, f) {
                k = d.activeElement;
                var g = function () {
                    n && null !== n.scrollTop && l && null !== l.scrollTop || g()
                };
                if ("string" != typeof a) throw new Error("message must be a string");
                if ("string" != typeof b) throw new Error("type must be a string");
                if ("undefined" != typeof c && "function" != typeof c) throw new Error("fn must be a function");
                return this.init(), g(), v.push({
                    type: b,
                    message: a,
                    callback: c,
                    placeholder: e,
                    cssClass: f
                }), t || this.setup(), this
            },
            extend: function (a) {
                if ("string" != typeof a) throw new Error("extend method must have exactly one parameter");
                return function (b, c) {
                    return this.log(b, a, c), this
                }
            },
            hide: function () {
                var a, b = this;
                v.splice(0, 1), v.length > 0 ? this.setup(!0) : (t = !1, a = function (c) {
                    c.stopPropagation(), m.removeEventListener(b.transition.type, a)
                }, this.transition.supported ? (m.addEventListener(this.transition.type, a), m.className = "alertify alertify-hide alertify-hidden") : m.className = "alertify alertify-hide alertify-hidden alertify-isHidden", l.className = "alertify-cover alertify-cover-hidden", setTimeout(function () {
                    b.keydown ? d.body.focus() : k.focus()
                }))
            },
            init: function () {
                null == e("alertify-cover") && (l = d.createElement("div"), l.setAttribute("id", "alertify-cover"), l.className = "alertify-cover alertify-cover-hidden", d.body.appendChild(l)), null == e("alertify") && (t = !1, v = [], m = d.createElement("section"), m.setAttribute("id", "alertify"), m.className = "alertify alertify-hidden", d.body.appendChild(m)), null == e("alertify-logs") && (n = d.createElement("section"), n.setAttribute("id", "alertify-logs"), n.className = "alertify-logs alertify-logs-hidden", d.body.appendChild(n)), d.body.setAttribute("tabindex", "0"), this.transition = q()
            },
            log: function (a, b, c, d) {
                var e = function () {
                    n && null !== n.scrollTop || e()
                };
                return this.init(), e(), n.className = "alertify-logs", this.notify(a, b, c, d), this
            },
            notify: function (a, b, c, e) {
                var f = d.createElement("article");
                f.className = "alertify-log" + ("string" == typeof b && "" !== b ? " alertify-log-" + b : ""), f.innerHTML = a, "function" == typeof e && f.addEventListener("click", e), n.appendChild(f), setTimeout(function () {
                    f.className = f.className + " alertify-log-show"
                }, 50), this.close(f, c)
            },
            set: function (a) {
                var b;
                if ("object" != typeof a && a instanceof Array) throw new Error("args must be an object");
                for (b in a) a.hasOwnProperty(b) && (this[b] = a[b])
            },
            setFocus: function () {
                p ? (p.focus(), p.select()) : j.focus()
            },
            setup: function (a) {
                var c, d = v[0],
                    k = this;
                t = !0, c = function (a) {
                    a.stopPropagation(), k.setFocus(), m.removeEventListener(k.transition.type, c)
                }, this.transition.supported && !a && m.addEventListener(this.transition.type, c), m.innerHTML = this.build(d), h = e("alertify-resetFocus"), i = e("alertify-resetFocusBack"), g = e("alertify-ok") || b, f = e("alertify-cancel") || b, j = "cancel" === r.buttonFocus ? f : "none" === r.buttonFocus ? e("alertify-noneFocus") : g, p = e("alertify-text") || b, o = e("alertify-form") || b, "string" == typeof d.placeholder && "" !== d.placeholder && (p.value = d.placeholder), a && this.setFocus(), this.addListeners(d.callback)
            }
        }, {
            alert: function (a, b, c) {
                return r.dialog(a, "alert", b, "", c), this
            },
            confirm: function (a, b, c) {
                return r.dialog(a, "confirm", b, "", c), this
            },            
            confirmA: function (a, b, c) {
                return r.dialog(a, "confirmA", b, "", c), this
            },
            extend: r.extend,
            init: r.init,
            log: function (a, b, c, d) {
                return r.log(a, b, c, d), this
            },
            prompt: function (a, b, c, d) {
                return r.dialog(a, "prompt", b, c, d), this
            },
            success: function (a, b, c) {
                return r.log(a, "success", b, c), this
            },
            error: function (a, b, c) {
                return r.log(a, "error", b, c), this
            },
            set: function (a) {
                r.set(a)
            },
            labels: r.labels,
            debug: r.handleErrors
        }
    }, "function" == typeof define ? define([], function () {
        return new c
    }) : "undefined" == typeof a.alertify && (a.alertify = new c)
}(window);
//# sourceMappingURL=alertify.js.map