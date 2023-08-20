(function () {
    'use strict';

    var n,
      l$1,
      u$1,
      i$1,
      o$1,
      r$1,
      f$1,
      e$1,
      c$1 = {},
      s$1 = [],
      a$1 = /acit|ex(?:s|g|n|p|$)|rph|grid|ows|mnc|ntw|ine[ch]|zoo|^ord|itera/i,
      h$1 = Array.isArray;
    function v$1(n, l) {
      for (var u in l) n[u] = l[u];
      return n;
    }
    function p$1(n) {
      var l = n.parentNode;
      l && l.removeChild(n);
    }
    function y$1(l, u, t) {
      var i,
        o,
        r,
        f = {};
      for (r in u) "key" == r ? i = u[r] : "ref" == r ? o = u[r] : f[r] = u[r];
      if (arguments.length > 2 && (f.children = arguments.length > 3 ? n.call(arguments, 2) : t), "function" == typeof l && null != l.defaultProps) for (r in l.defaultProps) void 0 === f[r] && (f[r] = l.defaultProps[r]);
      return d$1(l, f, i, o, null);
    }
    function d$1(n, t, i, o, r) {
      var f = {
        type: n,
        props: t,
        key: i,
        ref: o,
        __k: null,
        __: null,
        __b: 0,
        __e: null,
        __d: void 0,
        __c: null,
        __h: null,
        constructor: void 0,
        __v: null == r ? ++u$1 : r
      };
      return null == r && null != l$1.vnode && l$1.vnode(f), f;
    }
    function _$1() {
      return {
        current: null
      };
    }
    function k$2(n) {
      return n.children;
    }
    function b$1(n, l) {
      this.props = n, this.context = l;
    }
    function g$2(n, l) {
      if (null == l) return n.__ ? g$2(n.__, n.__.__k.indexOf(n) + 1) : null;
      for (var u; l < n.__k.length; l++) if (null != (u = n.__k[l]) && null != u.__e) return u.__e;
      return "function" == typeof n.type ? g$2(n) : null;
    }
    function m$1(n) {
      var l, u;
      if (null != (n = n.__) && null != n.__c) {
        for (n.__e = n.__c.base = null, l = 0; l < n.__k.length; l++) if (null != (u = n.__k[l]) && null != u.__e) {
          n.__e = n.__c.base = u.__e;
          break;
        }
        return m$1(n);
      }
    }
    function w$2(n) {
      (!n.__d && (n.__d = !0) && i$1.push(n) && !x$2.__r++ || o$1 !== l$1.debounceRendering) && ((o$1 = l$1.debounceRendering) || r$1)(x$2);
    }
    function x$2() {
      var n, l, u, t, o, r, e, c, s;
      for (i$1.sort(f$1); n = i$1.shift();) n.__d && (l = i$1.length, t = void 0, o = void 0, r = void 0, c = (e = (u = n).__v).__e, (s = u.__P) && (t = [], o = [], (r = v$1({}, e)).__v = e.__v + 1, L$1(s, e, r, u.__n, void 0 !== s.ownerSVGElement, null != e.__h ? [c] : null, t, null == c ? g$2(e) : c, e.__h, o), M$1(t, e, o), e.__e != c && m$1(e)), i$1.length > l && i$1.sort(f$1));
      x$2.__r = 0;
    }
    function P$1(n, l, u, t, i, o, r, f, e, a, v) {
      var p,
        y,
        _,
        b,
        g,
        m,
        w,
        x,
        P,
        S,
        H = 0,
        I = t && t.__k || s$1,
        T = I.length,
        j = T,
        z = l.length;
      for (u.__k = [], p = 0; p < z; p++) null != (b = u.__k[p] = null == (b = l[p]) || "boolean" == typeof b || "function" == typeof b ? null : "string" == typeof b || "number" == typeof b || "bigint" == typeof b ? d$1(null, b, null, null, b) : h$1(b) ? d$1(k$2, {
        children: b
      }, null, null, null) : b.__b > 0 ? d$1(b.type, b.props, b.key, b.ref ? b.ref : null, b.__v) : b) && (b.__ = u, b.__b = u.__b + 1, -1 === (x = A$2(b, I, w = p + H, j)) ? _ = c$1 : (_ = I[x] || c$1, I[x] = void 0, j--), L$1(n, b, _, i, o, r, f, e, a, v), g = b.__e, (y = b.ref) && _.ref != y && (_.ref && O$1(_.ref, null, b), v.push(y, b.__c || g, b)), null != g && (null == m && (m = g), S = !(P = _ === c$1 || null === _.__v) && x === w, P ? -1 == x && H-- : x !== w && (x === w + 1 ? (H++, S = !0) : x > w ? j > z - w ? (H += x - w, S = !0) : H-- : H = x < w && x == w - 1 ? x - w : 0), w = p + H, S = S || x == p && !P, "function" != typeof b.type || x === w && _.__k !== b.__k ? "function" == typeof b.type || S ? void 0 !== b.__d ? (e = b.__d, b.__d = void 0) : e = g.nextSibling : e = $$1(n, g, e) : e = C$1(b, e, n), "function" == typeof u.type && (u.__d = e)));
      for (u.__e = m, p = T; p--;) null != I[p] && ("function" == typeof u.type && null != I[p].__e && I[p].__e == u.__d && (u.__d = I[p].__e.nextSibling), q$2(I[p], I[p]));
    }
    function C$1(n, l, u) {
      for (var t, i = n.__k, o = 0; i && o < i.length; o++) (t = i[o]) && (t.__ = n, l = "function" == typeof t.type ? C$1(t, l, u) : $$1(u, t.__e, l));
      return l;
    }
    function S(n, l) {
      return l = l || [], null == n || "boolean" == typeof n || (h$1(n) ? n.some(function (n) {
        S(n, l);
      }) : l.push(n)), l;
    }
    function $$1(n, l, u) {
      return null == u || u.parentNode !== n ? n.insertBefore(l, null) : l == u && null != l.parentNode || n.insertBefore(l, u), l.nextSibling;
    }
    function A$2(n, l, u, t) {
      var i = n.key,
        o = n.type,
        r = u - 1,
        f = u + 1,
        e = l[u];
      if (null === e || e && i == e.key && o === e.type) return u;
      if (t > (null != e ? 1 : 0)) for (; r >= 0 || f < l.length;) {
        if (r >= 0) {
          if ((e = l[r]) && i == e.key && o === e.type) return r;
          r--;
        }
        if (f < l.length) {
          if ((e = l[f]) && i == e.key && o === e.type) return f;
          f++;
        }
      }
      return -1;
    }
    function H$1(n, l, u, t, i) {
      var o;
      for (o in u) "children" === o || "key" === o || o in l || T$2(n, o, null, u[o], t);
      for (o in l) i && "function" != typeof l[o] || "children" === o || "key" === o || "value" === o || "checked" === o || u[o] === l[o] || T$2(n, o, l[o], u[o], t);
    }
    function I$1(n, l, u) {
      "-" === l[0] ? n.setProperty(l, null == u ? "" : u) : n[l] = null == u ? "" : "number" != typeof u || a$1.test(l) ? u : u + "px";
    }
    function T$2(n, l, u, t, i) {
      var o;
      n: if ("style" === l) {
        if ("string" == typeof u) n.style.cssText = u;else {
          if ("string" == typeof t && (n.style.cssText = t = ""), t) for (l in t) u && l in u || I$1(n.style, l, "");
          if (u) for (l in u) t && u[l] === t[l] || I$1(n.style, l, u[l]);
        }
      } else if ("o" === l[0] && "n" === l[1]) o = l !== (l = l.replace(/Capture$/, "")), l = l.toLowerCase() in n ? l.toLowerCase().slice(2) : l.slice(2), n.l || (n.l = {}), n.l[l + o] = u, u ? t || n.addEventListener(l, o ? z$2 : j$2, o) : n.removeEventListener(l, o ? z$2 : j$2, o);else if ("dangerouslySetInnerHTML" !== l) {
        if (i) l = l.replace(/xlink(H|:h)/, "h").replace(/sName$/, "s");else if ("width" !== l && "height" !== l && "href" !== l && "list" !== l && "form" !== l && "tabIndex" !== l && "download" !== l && "rowSpan" !== l && "colSpan" !== l && l in n) try {
          n[l] = null == u ? "" : u;
          break n;
        } catch (n) {}
        "function" == typeof u || (null == u || !1 === u && "-" !== l[4] ? n.removeAttribute(l) : n.setAttribute(l, u));
      }
    }
    function j$2(n) {
      return this.l[n.type + !1](l$1.event ? l$1.event(n) : n);
    }
    function z$2(n) {
      return this.l[n.type + !0](l$1.event ? l$1.event(n) : n);
    }
    function L$1(n, u, t, i, o, r, f, e, c, s) {
      var a,
        p,
        y,
        d,
        _,
        g,
        m,
        w,
        x,
        C,
        S,
        $,
        A,
        H,
        I,
        T = u.type;
      if (void 0 !== u.constructor) return null;
      null != t.__h && (c = t.__h, e = u.__e = t.__e, u.__h = null, r = [e]), (a = l$1.__b) && a(u);
      try {
        n: if ("function" == typeof T) {
          if (w = u.props, x = (a = T.contextType) && i[a.__c], C = a ? x ? x.props.value : a.__ : i, t.__c ? m = (p = u.__c = t.__c).__ = p.__E : ("prototype" in T && T.prototype.render ? u.__c = p = new T(w, C) : (u.__c = p = new b$1(w, C), p.constructor = T, p.render = B$2), x && x.sub(p), p.props = w, p.state || (p.state = {}), p.context = C, p.__n = i, y = p.__d = !0, p.__h = [], p._sb = []), null == p.__s && (p.__s = p.state), null != T.getDerivedStateFromProps && (p.__s == p.state && (p.__s = v$1({}, p.__s)), v$1(p.__s, T.getDerivedStateFromProps(w, p.__s))), d = p.props, _ = p.state, p.__v = u, y) null == T.getDerivedStateFromProps && null != p.componentWillMount && p.componentWillMount(), null != p.componentDidMount && p.__h.push(p.componentDidMount);else {
            if (null == T.getDerivedStateFromProps && w !== d && null != p.componentWillReceiveProps && p.componentWillReceiveProps(w, C), !p.__e && (null != p.shouldComponentUpdate && !1 === p.shouldComponentUpdate(w, p.__s, C) || u.__v === t.__v)) {
              for (u.__v !== t.__v && (p.props = w, p.state = p.__s, p.__d = !1), u.__e = t.__e, u.__k = t.__k, u.__k.forEach(function (n) {
                n && (n.__ = u);
              }), S = 0; S < p._sb.length; S++) p.__h.push(p._sb[S]);
              p._sb = [], p.__h.length && f.push(p);
              break n;
            }
            null != p.componentWillUpdate && p.componentWillUpdate(w, p.__s, C), null != p.componentDidUpdate && p.__h.push(function () {
              p.componentDidUpdate(d, _, g);
            });
          }
          if (p.context = C, p.props = w, p.__P = n, p.__e = !1, $ = l$1.__r, A = 0, "prototype" in T && T.prototype.render) {
            for (p.state = p.__s, p.__d = !1, $ && $(u), a = p.render(p.props, p.state, p.context), H = 0; H < p._sb.length; H++) p.__h.push(p._sb[H]);
            p._sb = [];
          } else do {
            p.__d = !1, $ && $(u), a = p.render(p.props, p.state, p.context), p.state = p.__s;
          } while (p.__d && ++A < 25);
          p.state = p.__s, null != p.getChildContext && (i = v$1(v$1({}, i), p.getChildContext())), y || null == p.getSnapshotBeforeUpdate || (g = p.getSnapshotBeforeUpdate(d, _)), P$1(n, h$1(I = null != a && a.type === k$2 && null == a.key ? a.props.children : a) ? I : [I], u, t, i, o, r, f, e, c, s), p.base = u.__e, u.__h = null, p.__h.length && f.push(p), m && (p.__E = p.__ = null);
        } else null == r && u.__v === t.__v ? (u.__k = t.__k, u.__e = t.__e) : u.__e = N$1(t.__e, u, t, i, o, r, f, c, s);
        (a = l$1.diffed) && a(u);
      } catch (n) {
        u.__v = null, (c || null != r) && (u.__e = e, u.__h = !!c, r[r.indexOf(e)] = null), l$1.__e(n, u, t);
      }
    }
    function M$1(n, u, t) {
      for (var i = 0; i < t.length; i++) O$1(t[i], t[++i], t[++i]);
      l$1.__c && l$1.__c(u, n), n.some(function (u) {
        try {
          n = u.__h, u.__h = [], n.some(function (n) {
            n.call(u);
          });
        } catch (n) {
          l$1.__e(n, u.__v);
        }
      });
    }
    function N$1(l, u, t, i, o, r, f, e, s) {
      var a,
        v,
        y,
        d = t.props,
        _ = u.props,
        k = u.type,
        b = 0;
      if ("svg" === k && (o = !0), null != r) for (; b < r.length; b++) if ((a = r[b]) && "setAttribute" in a == !!k && (k ? a.localName === k : 3 === a.nodeType)) {
        l = a, r[b] = null;
        break;
      }
      if (null == l) {
        if (null === k) return document.createTextNode(_);
        l = o ? document.createElementNS("http://www.w3.org/2000/svg", k) : document.createElement(k, _.is && _), r = null, e = !1;
      }
      if (null === k) d === _ || e && l.data === _ || (l.data = _);else {
        if (r = r && n.call(l.childNodes), v = (d = t.props || c$1).dangerouslySetInnerHTML, y = _.dangerouslySetInnerHTML, !e) {
          if (null != r) for (d = {}, b = 0; b < l.attributes.length; b++) d[l.attributes[b].name] = l.attributes[b].value;
          (y || v) && (y && (v && y.__html == v.__html || y.__html === l.innerHTML) || (l.innerHTML = y && y.__html || ""));
        }
        if (H$1(l, _, d, o, e), y) u.__k = [];else if (P$1(l, h$1(b = u.props.children) ? b : [b], u, t, i, o && "foreignObject" !== k, r, f, r ? r[0] : t.__k && g$2(t, 0), e, s), null != r) for (b = r.length; b--;) null != r[b] && p$1(r[b]);
        e || ("value" in _ && void 0 !== (b = _.value) && (b !== l.value || "progress" === k && !b || "option" === k && b !== d.value) && T$2(l, "value", b, d.value, !1), "checked" in _ && void 0 !== (b = _.checked) && b !== l.checked && T$2(l, "checked", b, d.checked, !1));
      }
      return l;
    }
    function O$1(n, u, t) {
      try {
        "function" == typeof n ? n(u) : n.current = u;
      } catch (n) {
        l$1.__e(n, t);
      }
    }
    function q$2(n, u, t) {
      var i, o;
      if (l$1.unmount && l$1.unmount(n), (i = n.ref) && (i.current && i.current !== n.__e || O$1(i, null, u)), null != (i = n.__c)) {
        if (i.componentWillUnmount) try {
          i.componentWillUnmount();
        } catch (n) {
          l$1.__e(n, u);
        }
        i.base = i.__P = null, n.__c = void 0;
      }
      if (i = n.__k) for (o = 0; o < i.length; o++) i[o] && q$2(i[o], u, t || "function" != typeof n.type);
      t || null == n.__e || p$1(n.__e), n.__ = n.__e = n.__d = void 0;
    }
    function B$2(n, l, u) {
      return this.constructor(n, u);
    }
    function D$1(u, t, i) {
      var o, r, f, e;
      l$1.__ && l$1.__(u, t), r = (o = "function" == typeof i) ? null : i && i.__k || t.__k, f = [], e = [], L$1(t, u = (!o && i || t).__k = y$1(k$2, null, [u]), r || c$1, c$1, void 0 !== t.ownerSVGElement, !o && i ? [i] : r ? null : t.firstChild ? n.call(t.childNodes) : null, f, !o && i ? i : r ? r.__e : t.firstChild, o, e), M$1(f, u, e);
    }
    function E$1(n, l) {
      D$1(n, l, E$1);
    }
    function F$2(l, u, t) {
      var i,
        o,
        r,
        f,
        e = v$1({}, l.props);
      for (r in l.type && l.type.defaultProps && (f = l.type.defaultProps), u) "key" == r ? i = u[r] : "ref" == r ? o = u[r] : e[r] = void 0 === u[r] && void 0 !== f ? f[r] : u[r];
      return arguments.length > 2 && (e.children = arguments.length > 3 ? n.call(arguments, 2) : t), d$1(l.type, e, i || l.key, o || l.ref, null);
    }
    function G$1(n, l) {
      var u = {
        __c: l = "__cC" + e$1++,
        __: n,
        Consumer: function (n, l) {
          return n.children(l);
        },
        Provider: function (n) {
          var u, t;
          return this.getChildContext || (u = [], (t = {})[l] = this, this.getChildContext = function () {
            return t;
          }, this.shouldComponentUpdate = function (n) {
            this.props.value !== n.value && u.some(function (n) {
              n.__e = !0, w$2(n);
            });
          }, this.sub = function (n) {
            u.push(n);
            var l = n.componentWillUnmount;
            n.componentWillUnmount = function () {
              u.splice(u.indexOf(n), 1), l && l.call(n);
            };
          }), n.children;
        }
      };
      return u.Provider.__ = u.Consumer.contextType = u;
    }
    n = s$1.slice, l$1 = {
      __e: function (n, l, u, t) {
        for (var i, o, r; l = l.__;) if ((i = l.__c) && !i.__) try {
          if ((o = i.constructor) && null != o.getDerivedStateFromError && (i.setState(o.getDerivedStateFromError(n)), r = i.__d), null != i.componentDidCatch && (i.componentDidCatch(n, t || {}), r = i.__d), r) return i.__E = i;
        } catch (l) {
          n = l;
        }
        throw n;
      }
    }, u$1 = 0, b$1.prototype.setState = function (n, l) {
      var u;
      u = null != this.__s && this.__s !== this.state ? this.__s : this.__s = v$1({}, this.state), "function" == typeof n && (n = n(v$1({}, u), this.props)), n && v$1(u, n), null != n && this.__v && (l && this._sb.push(l), w$2(this));
    }, b$1.prototype.forceUpdate = function (n) {
      this.__v && (this.__e = !0, n && this.__h.push(n), w$2(this));
    }, b$1.prototype.render = k$2, i$1 = [], r$1 = "function" == typeof Promise ? Promise.prototype.then.bind(Promise.resolve()) : setTimeout, f$1 = function (n, l) {
      return n.__v.__b - l.__v.__b;
    }, x$2.__r = 0, e$1 = 0;

    var t,
      r,
      u,
      i,
      o = 0,
      f = [],
      c = [],
      e = l$1.__b,
      a = l$1.__r,
      v = l$1.diffed,
      l = l$1.__c,
      m = l$1.unmount;
    function d(t, u) {
      l$1.__h && l$1.__h(r, t, o || u), o = 0;
      var i = r.__H || (r.__H = {
        __: [],
        __h: []
      });
      return t >= i.__.length && i.__.push({
        __V: c
      }), i.__[t];
    }
    function h(n) {
      return o = 1, s(B$1, n);
    }
    function s(n, u, i) {
      var o = d(t++, 2);
      if (o.t = n, !o.__c && (o.__ = [i ? i(u) : B$1(void 0, u), function (n) {
        var t = o.__N ? o.__N[0] : o.__[0],
          r = o.t(t, n);
        t !== r && (o.__N = [r, o.__[1]], o.__c.setState({}));
      }], o.__c = r, !r.u)) {
        var f = function (n, t, r) {
          if (!o.__c.__H) return !0;
          var u = o.__c.__H.__.filter(function (n) {
            return n.__c;
          });
          if (u.every(function (n) {
            return !n.__N;
          })) return !c || c.call(this, n, t, r);
          var i = !1;
          return u.forEach(function (n) {
            if (n.__N) {
              var t = n.__[0];
              n.__ = n.__N, n.__N = void 0, t !== n.__[0] && (i = !0);
            }
          }), !(!i && o.__c.props === n) && (!c || c.call(this, n, t, r));
        };
        r.u = !0;
        var c = r.shouldComponentUpdate,
          e = r.componentWillUpdate;
        r.componentWillUpdate = function (n, t, r) {
          if (this.__e) {
            var u = c;
            c = void 0, f(n, t, r), c = u;
          }
          e && e.call(this, n, t, r);
        }, r.shouldComponentUpdate = f;
      }
      return o.__N || o.__;
    }
    function p(u, i) {
      var o = d(t++, 3);
      !l$1.__s && z$1(o.__H, i) && (o.__ = u, o.i = i, r.__H.__h.push(o));
    }
    function y(u, i) {
      var o = d(t++, 4);
      !l$1.__s && z$1(o.__H, i) && (o.__ = u, o.i = i, r.__h.push(o));
    }
    function _(n) {
      return o = 5, F$1(function () {
        return {
          current: n
        };
      }, []);
    }
    function A$1(n, t, r) {
      o = 6, y(function () {
        return "function" == typeof n ? (n(t()), function () {
          return n(null);
        }) : n ? (n.current = t(), function () {
          return n.current = null;
        }) : void 0;
      }, null == r ? r : r.concat(n));
    }
    function F$1(n, r) {
      var u = d(t++, 7);
      return z$1(u.__H, r) ? (u.__V = n(), u.i = r, u.__h = n, u.__V) : u.__;
    }
    function T$1(n, t) {
      return o = 8, F$1(function () {
        return n;
      }, t);
    }
    function q$1(n) {
      var u = r.context[n.__c],
        i = d(t++, 9);
      return i.c = n, u ? (null == i.__ && (i.__ = !0, u.sub(r)), u.props.value) : n.__;
    }
    function x$1(t, r) {
      l$1.useDebugValue && l$1.useDebugValue(r ? r(t) : t);
    }
    function V$1() {
      var n = d(t++, 11);
      if (!n.__) {
        for (var u = r.__v; null !== u && !u.__m && null !== u.__;) u = u.__;
        var i = u.__m || (u.__m = [0, 0]);
        n.__ = "P" + i[0] + "-" + i[1]++;
      }
      return n.__;
    }
    function b() {
      for (var t; t = f.shift();) if (t.__P && t.__H) try {
        t.__H.__h.forEach(k$1), t.__H.__h.forEach(w$1), t.__H.__h = [];
      } catch (r) {
        t.__H.__h = [], l$1.__e(r, t.__v);
      }
    }
    l$1.__b = function (n) {
      r = null, e && e(n);
    }, l$1.__r = function (n) {
      a && a(n), t = 0;
      var i = (r = n.__c).__H;
      i && (u === r ? (i.__h = [], r.__h = [], i.__.forEach(function (n) {
        n.__N && (n.__ = n.__N), n.__V = c, n.__N = n.i = void 0;
      })) : (i.__h.forEach(k$1), i.__h.forEach(w$1), i.__h = [], t = 0)), u = r;
    }, l$1.diffed = function (t) {
      v && v(t);
      var o = t.__c;
      o && o.__H && (o.__H.__h.length && (1 !== f.push(o) && i === l$1.requestAnimationFrame || ((i = l$1.requestAnimationFrame) || j$1)(b)), o.__H.__.forEach(function (n) {
        n.i && (n.__H = n.i), n.__V !== c && (n.__ = n.__V), n.i = void 0, n.__V = c;
      })), u = r = null;
    }, l$1.__c = function (t, r) {
      r.some(function (t) {
        try {
          t.__h.forEach(k$1), t.__h = t.__h.filter(function (n) {
            return !n.__ || w$1(n);
          });
        } catch (u) {
          r.some(function (n) {
            n.__h && (n.__h = []);
          }), r = [], l$1.__e(u, t.__v);
        }
      }), l && l(t, r);
    }, l$1.unmount = function (t) {
      m && m(t);
      var r,
        u = t.__c;
      u && u.__H && (u.__H.__.forEach(function (n) {
        try {
          k$1(n);
        } catch (n) {
          r = n;
        }
      }), u.__H = void 0, r && l$1.__e(r, u.__v));
    };
    var g$1 = "function" == typeof requestAnimationFrame;
    function j$1(n) {
      var t,
        r = function () {
          clearTimeout(u), g$1 && cancelAnimationFrame(t), setTimeout(n);
        },
        u = setTimeout(r, 100);
      g$1 && (t = requestAnimationFrame(r));
    }
    function k$1(n) {
      var t = r,
        u = n.__c;
      "function" == typeof u && (n.__c = void 0, u()), r = t;
    }
    function w$1(n) {
      var t = r;
      n.__c = n.__(), r = t;
    }
    function z$1(n, t) {
      return !n || n.length !== t.length || t.some(function (t, r) {
        return t !== n[r];
      });
    }
    function B$1(n, t) {
      return "function" == typeof t ? t(n) : t;
    }

    function g(n, t) {
      for (var e in t) n[e] = t[e];
      return n;
    }
    function C(n, t) {
      for (var e in n) if ("__source" !== e && !(e in t)) return !0;
      for (var r in t) if ("__source" !== r && n[r] !== t[r]) return !0;
      return !1;
    }
    function E(n, t) {
      return n === t && (0 !== n || 1 / n == 1 / t) || n != n && t != t;
    }
    function w(n) {
      this.props = n;
    }
    function x(n, e) {
      function r(n) {
        var t = this.props.ref,
          r = t == n.ref;
        return !r && t && (t.call ? t(null) : t.current = null), e ? !e(this.props, n) || !r : C(this.props, n);
      }
      function u(e) {
        return this.shouldComponentUpdate = r, y$1(n, e);
      }
      return u.displayName = "Memo(" + (n.displayName || n.name) + ")", u.prototype.isReactComponent = !0, u.__f = !0, u;
    }
    (w.prototype = new b$1()).isPureReactComponent = !0, w.prototype.shouldComponentUpdate = function (n, t) {
      return C(this.props, n) || C(this.state, t);
    };
    var R = l$1.__b;
    l$1.__b = function (n) {
      n.type && n.type.__f && n.ref && (n.props.ref = n.ref, n.ref = null), R && R(n);
    };
    var N = "undefined" != typeof Symbol && Symbol.for && Symbol.for("react.forward_ref") || 3911;
    function k(n) {
      function t(t) {
        var e = g({}, t);
        return delete e.ref, n(e, t.ref || null);
      }
      return t.$$typeof = N, t.render = t, t.prototype.isReactComponent = t.__f = !0, t.displayName = "ForwardRef(" + (n.displayName || n.name) + ")", t;
    }
    var A = function (n, t) {
        return null == n ? null : S(S(n).map(t));
      },
      O = {
        map: A,
        forEach: A,
        count: function (n) {
          return n ? S(n).length : 0;
        },
        only: function (n) {
          var t = S(n);
          if (1 !== t.length) throw "Children.only";
          return t[0];
        },
        toArray: S
      },
      T = l$1.__e;
    l$1.__e = function (n, t, e, r) {
      if (n.then) for (var u, o = t; o = o.__;) if ((u = o.__c) && u.__c) return null == t.__e && (t.__e = e.__e, t.__k = e.__k), u.__c(n, t);
      T(n, t, e, r);
    };
    var I = l$1.unmount;
    function L(n, t, e) {
      return n && (n.__c && n.__c.__H && (n.__c.__H.__.forEach(function (n) {
        "function" == typeof n.__c && n.__c();
      }), n.__c.__H = null), null != (n = g({}, n)).__c && (n.__c.__P === e && (n.__c.__P = t), n.__c = null), n.__k = n.__k && n.__k.map(function (n) {
        return L(n, t, e);
      })), n;
    }
    function U(n, t, e) {
      return n && (n.__v = null, n.__k = n.__k && n.__k.map(function (n) {
        return U(n, t, e);
      }), n.__c && n.__c.__P === t && (n.__e && e.insertBefore(n.__e, n.__d), n.__c.__e = !0, n.__c.__P = e)), n;
    }
    function D() {
      this.__u = 0, this.t = null, this.__b = null;
    }
    function F(n) {
      var t = n.__.__c;
      return t && t.__a && t.__a(n);
    }
    function M(n) {
      var e, r, u;
      function o(o) {
        if (e || (e = n()).then(function (n) {
          r = n.default || n;
        }, function (n) {
          u = n;
        }), u) throw u;
        if (!r) throw e;
        return y$1(r, o);
      }
      return o.displayName = "Lazy", o.__f = !0, o;
    }
    function V() {
      this.u = null, this.o = null;
    }
    l$1.unmount = function (n) {
      var t = n.__c;
      t && t.__R && t.__R(), t && !0 === n.__h && (n.type = null), I && I(n);
    }, (D.prototype = new b$1()).__c = function (n, t) {
      var e = t.__c,
        r = this;
      null == r.t && (r.t = []), r.t.push(e);
      var u = F(r.__v),
        o = !1,
        i = function () {
          o || (o = !0, e.__R = null, u ? u(l) : l());
        };
      e.__R = i;
      var l = function () {
          if (! --r.__u) {
            if (r.state.__a) {
              var n = r.state.__a;
              r.__v.__k[0] = U(n, n.__c.__P, n.__c.__O);
            }
            var t;
            for (r.setState({
              __a: r.__b = null
            }); t = r.t.pop();) t.forceUpdate();
          }
        },
        c = !0 === t.__h;
      r.__u++ || c || r.setState({
        __a: r.__b = r.__v.__k[0]
      }), n.then(i, i);
    }, D.prototype.componentWillUnmount = function () {
      this.t = [];
    }, D.prototype.render = function (n, e) {
      if (this.__b) {
        if (this.__v.__k) {
          var r = document.createElement("div"),
            o = this.__v.__k[0].__c;
          this.__v.__k[0] = L(this.__b, r, o.__O = o.__P);
        }
        this.__b = null;
      }
      var i = e.__a && y$1(k$2, null, n.fallback);
      return i && (i.__h = null), [y$1(k$2, null, e.__a ? null : n.children), i];
    };
    var W = function (n, t, e) {
      if (++e[1] === e[0] && n.o.delete(t), n.props.revealOrder && ("t" !== n.props.revealOrder[0] || !n.o.size)) for (e = n.u; e;) {
        for (; e.length > 3;) e.pop()();
        if (e[1] < e[0]) break;
        n.u = e = e[2];
      }
    };
    function P(n) {
      return this.getChildContext = function () {
        return n.context;
      }, n.children;
    }
    function j(n) {
      var e = this,
        r = n.i;
      e.componentWillUnmount = function () {
        D$1(null, e.l), e.l = null, e.i = null;
      }, e.i && e.i !== r && e.componentWillUnmount(), n.__v ? (e.l || (e.i = r, e.l = {
        nodeType: 1,
        parentNode: r,
        childNodes: [],
        appendChild: function (n) {
          this.childNodes.push(n), e.i.appendChild(n);
        },
        insertBefore: function (n, t) {
          this.childNodes.push(n), e.i.appendChild(n);
        },
        removeChild: function (n) {
          this.childNodes.splice(this.childNodes.indexOf(n) >>> 1, 1), e.i.removeChild(n);
        }
      }), D$1(y$1(P, {
        context: e.context
      }, n.__v), e.l)) : e.l && e.componentWillUnmount();
    }
    function z(n, e) {
      var r = y$1(j, {
        __v: n,
        i: e
      });
      return r.containerInfo = e, r;
    }
    (V.prototype = new b$1()).__a = function (n) {
      var t = this,
        e = F(t.__v),
        r = t.o.get(n);
      return r[0]++, function (u) {
        var o = function () {
          t.props.revealOrder ? (r.push(u), W(t, n, r)) : u();
        };
        e ? e(o) : o();
      };
    }, V.prototype.render = function (n) {
      this.u = null, this.o = new Map();
      var t = S(n.children);
      n.revealOrder && "b" === n.revealOrder[0] && t.reverse();
      for (var e = t.length; e--;) this.o.set(t[e], this.u = [1, 0, this.u]);
      return n.children;
    }, V.prototype.componentDidUpdate = V.prototype.componentDidMount = function () {
      var n = this;
      this.o.forEach(function (t, e) {
        W(n, e, t);
      });
    };
    var B = "undefined" != typeof Symbol && Symbol.for && Symbol.for("react.element") || 60103,
      H = /^(?:accent|alignment|arabic|baseline|cap|clip(?!PathU)|color|dominant|fill|flood|font|glyph(?!R)|horiz|image(!S)|letter|lighting|marker(?!H|W|U)|overline|paint|pointer|shape|stop|strikethrough|stroke|text(?!L)|transform|underline|unicode|units|v|vector|vert|word|writing|x(?!C))[A-Z]/,
      Z = /^on(Ani|Tra|Tou|BeforeInp|Compo)/,
      Y = /[A-Z0-9]/g,
      $ = "undefined" != typeof document,
      q = function (n) {
        return ("undefined" != typeof Symbol && "symbol" == typeof Symbol() ? /fil|che|rad/ : /fil|che|ra/).test(n);
      };
    function G(n, t, e) {
      return null == t.__k && (t.textContent = ""), D$1(n, t), "function" == typeof e && e(), n ? n.__c : null;
    }
    function J(n, t, e) {
      return E$1(n, t), "function" == typeof e && e(), n ? n.__c : null;
    }
    b$1.prototype.isReactComponent = {}, ["componentWillMount", "componentWillReceiveProps", "componentWillUpdate"].forEach(function (t) {
      Object.defineProperty(b$1.prototype, t, {
        configurable: !0,
        get: function () {
          return this["UNSAFE_" + t];
        },
        set: function (n) {
          Object.defineProperty(this, t, {
            configurable: !0,
            writable: !0,
            value: n
          });
        }
      });
    });
    var K = l$1.event;
    function Q() {}
    function X() {
      return this.cancelBubble;
    }
    function nn() {
      return this.defaultPrevented;
    }
    l$1.event = function (n) {
      return K && (n = K(n)), n.persist = Q, n.isPropagationStopped = X, n.isDefaultPrevented = nn, n.nativeEvent = n;
    };
    var tn,
      en = {
        enumerable: !1,
        configurable: !0,
        get: function () {
          return this.class;
        }
      },
      rn = l$1.vnode;
    l$1.vnode = function (n) {
      "string" == typeof n.type && function (n) {
        var t = n.props,
          e = n.type,
          u = {};
        for (var o in t) {
          var i = t[o];
          if (!("value" === o && "defaultValue" in t && null == i || $ && "children" === o && "noscript" === e || "class" === o || "className" === o)) {
            var l = o.toLowerCase();
            "defaultValue" === o && "value" in t && null == t.value ? o = "value" : "download" === o && !0 === i ? i = "" : "ondoubleclick" === l ? o = "ondblclick" : "onchange" !== l || "input" !== e && "textarea" !== e || q(t.type) ? "onfocus" === l ? o = "onfocusin" : "onblur" === l ? o = "onfocusout" : Z.test(o) ? o = l : -1 === e.indexOf("-") && H.test(o) ? o = o.replace(Y, "-$&").toLowerCase() : null === i && (i = void 0) : l = o = "oninput", "oninput" === l && u[o = l] && (o = "oninputCapture"), u[o] = i;
          }
        }
        "select" == e && u.multiple && Array.isArray(u.value) && (u.value = S(t.children).forEach(function (n) {
          n.props.selected = -1 != u.value.indexOf(n.props.value);
        })), "select" == e && null != u.defaultValue && (u.value = S(t.children).forEach(function (n) {
          n.props.selected = u.multiple ? -1 != u.defaultValue.indexOf(n.props.value) : u.defaultValue == n.props.value;
        })), t.class && !t.className ? (u.class = t.class, Object.defineProperty(u, "className", en)) : (t.className && !t.class || t.class && t.className) && (u.class = u.className = t.className), n.props = u;
      }(n), n.$$typeof = B, rn && rn(n);
    };
    var un = l$1.__r;
    l$1.__r = function (n) {
      un && un(n), tn = n.__c;
    };
    var on = l$1.diffed;
    l$1.diffed = function (n) {
      on && on(n);
      var t = n.props,
        e = n.__e;
      null != e && "textarea" === n.type && "value" in t && t.value !== e.value && (e.value = null == t.value ? "" : t.value), tn = null;
    };
    var ln = {
        ReactCurrentDispatcher: {
          current: {
            readContext: function (n) {
              return tn.__n[n.__c].props.value;
            }
          }
        }
      };
    function fn(n) {
      return y$1.bind(null, n);
    }
    function an(n) {
      return !!n && n.$$typeof === B;
    }
    function sn(n) {
      return an(n) ? F$2.apply(null, arguments) : n;
    }
    function hn(n) {
      return !!n.__k && (D$1(null, n), !0);
    }
    function vn(n) {
      return n && (n.base || 1 === n.nodeType && n) || null;
    }
    var dn = function (n, t) {
        return n(t);
      },
      pn = function (n, t) {
        return n(t);
      },
      mn = k$2;
    function yn(n) {
      n();
    }
    function _n(n) {
      return n;
    }
    function bn() {
      return [!1, yn];
    }
    var Sn = y;
    function gn(n, t) {
      var e = t(),
        r = h({
          h: {
            __: e,
            v: t
          }
        }),
        u = r[0].h,
        o = r[1];
      return y(function () {
        u.__ = e, u.v = t, E(u.__, t()) || o({
          h: u
        });
      }, [n, e, t]), p(function () {
        return E(u.__, u.v()) || o({
          h: u
        }), n(function () {
          E(u.__, u.v()) || o({
            h: u
          });
        });
      }, [n]), e;
    }
    var Cn = {
      useState: h,
      useId: V$1,
      useReducer: s,
      useEffect: p,
      useLayoutEffect: y,
      useInsertionEffect: Sn,
      useTransition: bn,
      useDeferredValue: _n,
      useSyncExternalStore: gn,
      startTransition: yn,
      useRef: _,
      useImperativeHandle: A$1,
      useMemo: F$1,
      useCallback: T$1,
      useContext: q$1,
      useDebugValue: x$1,
      version: "17.0.2",
      Children: O,
      render: G,
      hydrate: J,
      unmountComponentAtNode: hn,
      createPortal: z,
      createElement: y$1,
      createContext: G$1,
      createFactory: fn,
      cloneElement: sn,
      createRef: _$1,
      Fragment: k$2,
      isValidElement: an,
      findDOMNode: vn,
      Component: b$1,
      PureComponent: w,
      memo: x,
      forwardRef: k,
      flushSync: pn,
      unstable_batchedUpdates: dn,
      StrictMode: mn,
      Suspense: D,
      SuspenseList: V,
      lazy: M,
      __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED: ln
    };

    function uuidFormatter(input) {
      return input.slice(0, 8) + '-' + input.slice(8, 12) + '-' + input.slice(12, 16) + '-' + input.slice(16, 20) + '-' + input.slice(20, 32);
    }

    const uuidAlf = /[^a-z0-9]/g;
    const chunk = /.{1,2}/g;
    function _getUuid(input) {
      const uuidStr = input.toLowerCase().replaceAll(uuidAlf, '');
      if (uuidStr.length !== 32) {
        return null;
      }
      return uuidStr;
    }
    function uuidToBytes(input) {
      const uuidStr = _getUuid(input);
      if (uuidStr === null) {
        return null;
      }
      return uuidStr.match(chunk).map(b => parseInt(b, 16));
    }
    function bytesToUuid(bytes) {
      return uuidFormatter(bytes.map(b => b.toString(16).padStart(2, '0')).join(''));
    }
    function uuidToBytesString(input) {
      const bytes = uuidToBytes(input);
      if (bytes === null) {
        return null;
      }
      return '[' + [...bytes].join(',') + ']';
    }

    function base64StdToUuid(base64) {
      return bytesToUuid(atob(base64).split('').map(c => c.charCodeAt(0)));
    }
    function uuidToBase64Std(uuid) {
      return btoa(String.fromCharCode.apply(null, new Uint8Array(uuidToBytes(uuid))));
    }

    const rg = /"?([a-zA-Z0-9]*)"?:/g;
    function objectParse(val) {
      return JSON.parse(val.replace(rg, '"$1":'));
    }

    const TYPE_UUID = 2 ** 0;
    const TYPE_HIGH_LOW = 2 ** 1;
    const TYPE_BASE64 = 2 ** 2;
    const TYPE_BYTES = 2 ** 3;
    function uuidTypeList() {
      const list = [];
      list[TYPE_UUID] = 'uuid';
      list[TYPE_BASE64] = 'base64';
      list[TYPE_HIGH_LOW] = 'high-low';
      list[TYPE_BYTES] = 'bytes';
      return list;
    }
    const UUID_LENGTH = 36;
    function typeDetector(input) {
      // high-low-type or bytes-type
      try {
        return Array.isArray(objectParse(input)) ? TYPE_BYTES : TYPE_HIGH_LOW;
      } catch (e) {}

      // base64-type
      try {
        if (base64StdToUuid(input).length === UUID_LENGTH) {
          return TYPE_BASE64;
        }
      } catch (e) {}

      // default-type
      return TYPE_UUID;
    }

    function uuidToInts(input) {
      const v = uuidToBytes(input).map(i => BigInt(i));
      if (v === null) {
        return null;
      }
      const high = BigInt(v[0] | v[1] << BigInt(8) | v[2] << BigInt(16) | v[3] << BigInt(24) | v[4] << BigInt(32) | v[5] << BigInt(40) | v[6] << BigInt(48) | v[7] << BigInt(56));
      const low = BigInt(v[8] | v[9] << BigInt(8) | v[10] << BigInt(16) | v[11] << BigInt(24) | v[12] << BigInt(32) | v[13] << BigInt(40) | v[14] << BigInt(48) | v[15] << BigInt(56));
      return {
        high: BigInt.asIntN(64, high) + "",
        low: BigInt.asIntN(64, low) + ""
      };
    }
    function intsToUuid(high, low) {
      return bytesToUuid([BigInt(high) & BigInt(0xff), BigInt(high) >> BigInt(8) & BigInt(0xff), BigInt(high) >> BigInt(16) & BigInt(0xff), BigInt(high) >> BigInt(24) & BigInt(0xff), BigInt(high) >> BigInt(32) & BigInt(0xff), BigInt(high) >> BigInt(40) & BigInt(0xff), BigInt(high) >> BigInt(48) & BigInt(0xff), BigInt(high) >> BigInt(56) & BigInt(0xff), BigInt(low) & BigInt(0xff), BigInt(low) >> BigInt(8) & BigInt(0xff), BigInt(low) >> BigInt(16) & BigInt(0xff), BigInt(low) >> BigInt(24) & BigInt(0xff), BigInt(low) >> BigInt(32) & BigInt(0xff), BigInt(low) >> BigInt(40) & BigInt(0xff), BigInt(low) >> BigInt(48) & BigInt(0xff), BigInt(low) >> BigInt(56) & BigInt(0xff)]);
    }
    function uuidToUints(input) {
      const v = uuidToBytes(input).map(i => BigInt(i));
      if (v === null) {
        return null;
      }
      const high = BigInt(v[7] | v[6] << BigInt(8) | v[5] << BigInt(16) | v[4] << BigInt(24) | v[3] << BigInt(32) | v[2] << BigInt(40) | v[1] << BigInt(48) | v[0] << BigInt(56));
      const low = BigInt(v[15] | v[14] << BigInt(8) | v[13] << BigInt(16) | v[12] << BigInt(24) | v[11] << BigInt(32) | v[10] << BigInt(40) | v[9] << BigInt(48) | v[8] << BigInt(56));
      return {
        high: BigInt.asUintN(64, high) + "",
        low: BigInt.asUintN(64, low) + ""
      };
    }
    function uintsToUuid(high, low) {
      return bytesToUuid([BigInt(high) >> BigInt(56) & BigInt(0xff), BigInt(high) >> BigInt(48) & BigInt(0xff), BigInt(high) >> BigInt(40) & BigInt(0xff), BigInt(high) >> BigInt(32) & BigInt(0xff), BigInt(high) >> BigInt(24) & BigInt(0xff), BigInt(high) >> BigInt(16) & BigInt(0xff), BigInt(high) >> BigInt(8) & BigInt(0xff), BigInt(high) & BigInt(0xff), BigInt(low) >> BigInt(56) & BigInt(0xff), BigInt(low) >> BigInt(48) & BigInt(0xff), BigInt(low) >> BigInt(40) & BigInt(0xff), BigInt(low) >> BigInt(32) & BigInt(0xff), BigInt(low) >> BigInt(24) & BigInt(0xff), BigInt(low) >> BigInt(16) & BigInt(0xff), BigInt(low) >> BigInt(8) & BigInt(0xff), BigInt(low) & BigInt(0xff)]);
    }

    const SIGNED = 2 ** 0;
    const UNSIGNED = 2 ** 1;
    function intTypeList() {
      const list = [];
      list[SIGNED] = 'signed';
      list[UNSIGNED] = 'unsigned';
      return list;
    }
    class Item {
      constructor(input, output) {
        this.input = input;
        this.output = output;
      }
      toString() {
        return this.input + ':' + this.output;
      }
    }
    class InputComponent extends Cn.Component {
      state = {
        resultType: TYPE_HIGH_LOW,
        intType: SIGNED
      };
      constructor(props) {
        super(props);
      }
      onKeyboardInput = e => {
        if (e.target.value[e.target.value.length - 1] !== "\n") {
          return;
        }
        this.addItems(e.target.value.split("\n").map(l => l.trim()).filter(l => l.length > 0));
      };
      addItems = items => {
        let result = [];
        for (const item of items.reverse()) {
          const obj = this.newItem(item);
          if (obj !== null) {
            result = result.concat(obj);
          }
        }
        this.props.setItems([...new Map(result.concat(...this.props.items).map(item => [item.toString(), item])).values()]);
      };
      newItem = input => {
        try {
          const uuid = this.castToUuid(input);
          const output = this.castFromUuid(uuid);
          if (input === output) {
            return null;
          }
          return new Item(input, output);
        } catch (e) {
          return null;
        }
      };

      /**
       * @returns {string}
       */
      castToUuid = input => {
        const {
          intType
        } = this.state;
        switch (typeDetector(input)) {
          case TYPE_BYTES:
            return bytesToUuid(objectParse(input));
          case TYPE_HIGH_LOW:
            const u = objectParse(input);
            const fn = intType === SIGNED ? intsToUuid : uintsToUuid;
            return fn(u.high, u.low);
          case TYPE_BASE64:
            return base64StdToUuid(input);
        }
        return input;
      };
      castFromUuid = uuid => {
        const {
          resultType,
          intType
        } = this.state;
        switch (resultType) {
          case TYPE_BYTES:
            return uuidToBytesString(uuid);
          case TYPE_HIGH_LOW:
            return JSON.stringify(intType === SIGNED ? uuidToInts(uuid) : uuidToUints(uuid));
          case TYPE_BASE64:
            return uuidToBase64Std(uuid);
        }
        return uuid;
      };
      setResultType = type => {
        this.setState({
          resultType: type
        });
      };
      setIntType = type => {
        this.setState({
          intType: type
        });
      };
      render({
        items
      }, {
        resultType,
        intType
      }) {
        return /*#__PURE__*/Cn.createElement("div", null, /*#__PURE__*/Cn.createElement("div", {
          className: "notification is-info"
        }, "The project is provided \"as is\". Project revisions will only be made when absolutely necessary."), /*#__PURE__*/Cn.createElement("label", null, /*#__PURE__*/Cn.createElement("textarea", {
          className: "textarea",
          onChange: this.onKeyboardInput,
          placeholder: "Enter uuid. Input examples:\n0;0\n{low: 0, high: 1}\n71a46cec-4809-4cc5-9689-5b0441b46186\nhuW65O9YQDGzT16f+RTNVQ==\n",
          rows: "10"
        })), /*#__PURE__*/Cn.createElement("div", {
          className: "container margin-top"
        }, /*#__PURE__*/Cn.createElement("div", {
          className: "box"
        }, /*#__PURE__*/Cn.createElement("label", null, "Select result type:"), /*#__PURE__*/Cn.createElement("div", {
          className: "control"
        }, uuidTypeList().map((v, k) => /*#__PURE__*/Cn.createElement("label", {
          className: "radio"
        }, /*#__PURE__*/Cn.createElement("input", {
          type: "radio",
          name: "rtype",
          checked: resultType === k,
          onChange: () => this.setResultType(k)
        }), v))))), /*#__PURE__*/Cn.createElement("div", {
          className: "container margin-top"
        }, /*#__PURE__*/Cn.createElement("div", {
          className: "box"
        }, /*#__PURE__*/Cn.createElement("label", null, "Integer type:"), /*#__PURE__*/Cn.createElement("div", {
          className: "control"
        }, intTypeList().map((v, k) => /*#__PURE__*/Cn.createElement("label", {
          className: "radio"
        }, /*#__PURE__*/Cn.createElement("input", {
          type: "radio",
          name: "itype",
          checked: intType === k,
          onChange: () => this.setIntType(k)
        }), v))))));
      }
    }

    var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

    var notiflixNotifyAio = {exports: {}};

    /*
    * Notiflix Notify AIO (https://notiflix.github.io)
    * Description: This file has been created automatically that using "notiflix.js", and "notiflix.css" files.
    * Version: 3.2.6
    * Author: Furkan (https://github.com/furcan)
    * Copyright 2019 - 2023 Notiflix, MIT Licence (https://opensource.org/licenses/MIT)
    */
    (function (module) {
      /* global define */
      (function (root, factory) {
        {
          module.exports = factory(root);
        }
      })(typeof commonjsGlobal !== 'undefined' ? commonjsGlobal : typeof window !== 'undefined' ? window : commonjsGlobal, function (window) {

        // COMMON: SSR check: begin
        if (typeof window === 'undefined' && typeof window.document === 'undefined') {
          return false;
        }
        // COMMON: SSR check: end

        // COMMON: Variables: begin
        var notiflixNamespace = 'Notiflix';
        var notiflixConsoleDocs = '\n\nVisit documentation page to learn more: https://notiflix.github.io/documentation';
        var defaultFontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif';
        // COMMON: Variables: end

        // NOTIFY: Default Settings: begin
        var typesNotify = {
          Success: 'Success',
          Failure: 'Failure',
          Warning: 'Warning',
          Info: 'Info'
        };
        var newNotifySettings;
        var notifySettings = {
          wrapID: 'NotiflixNotifyWrap',
          // can not customizable
          overlayID: 'NotiflixNotifyOverlay',
          // can not customizable
          width: '280px',
          position: 'right-top',
          // 'right-top' - 'right-bottom' - 'left-top' - 'left-bottom' - 'center-top' - 'center-bottom' - 'center-center'
          distance: '10px',
          opacity: 1,
          borderRadius: '5px',
          rtl: false,
          timeout: 3000,
          messageMaxLength: 110,
          backOverlay: false,
          backOverlayColor: 'rgba(0,0,0,0.5)',
          plainText: true,
          showOnlyTheLastOne: false,
          clickToClose: false,
          pauseOnHover: true,
          ID: 'NotiflixNotify',
          className: 'notiflix-notify',
          zindex: 4001,
          fontFamily: 'Quicksand',
          fontSize: '13px',
          cssAnimation: true,
          cssAnimationDuration: 400,
          cssAnimationStyle: 'fade',
          // 'fade' - 'zoom' - 'from-right' - 'from-top' - 'from-bottom' - 'from-left'
          closeButton: false,
          useIcon: true,
          useFontAwesome: false,
          fontAwesomeIconStyle: 'basic',
          // 'basic' - 'shadow'
          fontAwesomeIconSize: '34px',
          success: {
            background: '#32c682',
            textColor: '#fff',
            childClassName: 'notiflix-notify-success',
            notiflixIconColor: 'rgba(0,0,0,0.2)',
            fontAwesomeClassName: 'fas fa-check-circle',
            fontAwesomeIconColor: 'rgba(0,0,0,0.2)',
            backOverlayColor: 'rgba(50,198,130,0.2)'
          },
          failure: {
            background: '#ff5549',
            textColor: '#fff',
            childClassName: 'notiflix-notify-failure',
            notiflixIconColor: 'rgba(0,0,0,0.2)',
            fontAwesomeClassName: 'fas fa-times-circle',
            fontAwesomeIconColor: 'rgba(0,0,0,0.2)',
            backOverlayColor: 'rgba(255,85,73,0.2)'
          },
          warning: {
            background: '#eebf31',
            textColor: '#fff',
            childClassName: 'notiflix-notify-warning',
            notiflixIconColor: 'rgba(0,0,0,0.2)',
            fontAwesomeClassName: 'fas fa-exclamation-circle',
            fontAwesomeIconColor: 'rgba(0,0,0,0.2)',
            backOverlayColor: 'rgba(238,191,49,0.2)'
          },
          info: {
            background: '#26c0d3',
            textColor: '#fff',
            childClassName: 'notiflix-notify-info',
            notiflixIconColor: 'rgba(0,0,0,0.2)',
            fontAwesomeClassName: 'fas fa-info-circle',
            fontAwesomeIconColor: 'rgba(0,0,0,0.2)',
            backOverlayColor: 'rgba(38,192,211,0.2)'
          }
        };
        // NOTIFY: Default Settings: end

        // COMMON: Console Error: begin
        var commonConsoleError = function (message) {
          return console.error('%c ' + notiflixNamespace + ' Error ', 'padding:2px;border-radius:20px;color:#fff;background:#ff5549', '\n' + message + notiflixConsoleDocs);
        };
        // COMMON: Console Error: end

        // COMMON: Check Head or Body: begin
        var commonCheckHeadOrBody = function (element) {
          if (!element) {
            element = 'head';
          }
          if (window.document[element] === null) {
            commonConsoleError('\nNotiflix needs to be appended to the "<' + element + '>" element, but you called it before the "<' + element + '>" element has been created.');
            return false;
          }
          return true;
        };
        // COMMON: Check Head or Body: end

        // COMMON: Set Internal CSS Codes: begin
        var commonSetInternalCSSCodes = function (getInternalCSSCodes, styleElementId) {
          // check doc head
          if (!commonCheckHeadOrBody('head')) {
            return false;
          }

          // internal css
          if (getInternalCSSCodes() !== null && !window.document.getElementById(styleElementId)) {
            var internalCSS = window.document.createElement('style');
            internalCSS.id = styleElementId;
            internalCSS.innerHTML = getInternalCSSCodes();
            window.document.head.appendChild(internalCSS);
          }
        };
        // COMMON: Set Internal CSS Codes: end

        // COMMON: Extend Options: begin
        var commonExtendOptions = function () {
          // variables
          var extended = {};
          var deep = false;
          var i = 0;
          // check if a deep merge
          if (Object.prototype.toString.call(arguments[0]) === '[object Boolean]') {
            deep = arguments[0];
            i++;
          }
          // merge the object into the extended object
          var merge = function (obj) {
            for (var prop in obj) {
              if (Object.prototype.hasOwnProperty.call(obj, prop)) {
                // if property is an object, merge properties
                if (deep && Object.prototype.toString.call(obj[prop]) === '[object Object]') {
                  extended[prop] = commonExtendOptions(extended[prop], obj[prop]);
                } else {
                  extended[prop] = obj[prop];
                }
              }
            }
          };
          // loop through each object and conduct a merge
          for (; i < arguments.length; i++) {
            merge(arguments[i]);
          }
          return extended;
        };
        // COMMON: Extend Options: end

        // COMMON: Get Plaintext: begin
        var commonGetPlaintext = function (html) {
          var htmlPool = window.document.createElement('div');
          htmlPool.innerHTML = html;
          return htmlPool.textContent || htmlPool.innerText || '';
        };
        // COMMON: Get Plaintext: end

        // NOTIFY: Get Internal CSS Codes: begin
        var notifyGetInternalCSSCodes = function () {
          var notifyCSS = '[id^=NotiflixNotifyWrap]{pointer-events:none;position:fixed;z-index:4001;opacity:1;right:10px;top:10px;width:280px;max-width:96%;-webkit-box-sizing:border-box;box-sizing:border-box;background:transparent}[id^=NotiflixNotifyWrap].nx-flex-center-center{max-height:calc(100vh - 20px);overflow-x:hidden;overflow-y:auto;display:-webkit-box;display:-webkit-flex;display:-ms-flexbox;display:flex;-webkit-flex-wrap:wrap;-ms-flex-wrap:wrap;flex-wrap:wrap;-webkit-box-orient:vertical;-webkit-box-direction:normal;-webkit-flex-direction:column;-ms-flex-direction:column;flex-direction:column;-webkit-box-pack:center;-webkit-justify-content:center;-ms-flex-pack:center;justify-content:center;-webkit-box-align:center;-webkit-align-items:center;-ms-flex-align:center;align-items:center;margin:auto}[id^=NotiflixNotifyWrap]::-webkit-scrollbar{width:0;height:0}[id^=NotiflixNotifyWrap]::-webkit-scrollbar-thumb{background:transparent}[id^=NotiflixNotifyWrap]::-webkit-scrollbar-track{background:transparent}[id^=NotiflixNotifyWrap] *{-webkit-box-sizing:border-box;box-sizing:border-box}[id^=NotiflixNotifyOverlay]{-webkit-transition:background .3s ease-in-out;-o-transition:background .3s ease-in-out;transition:background .3s ease-in-out}[id^=NotiflixNotifyWrap]>div{pointer-events:all;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none;font-family:"Quicksand",-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;width:100%;display:-webkit-inline-box;display:-webkit-inline-flex;display:-ms-inline-flexbox;display:inline-flex;-webkit-flex-wrap:wrap;-ms-flex-wrap:wrap;flex-wrap:wrap;-webkit-box-align:center;-webkit-align-items:center;-ms-flex-align:center;align-items:center;position:relative;margin:0 0 10px;border-radius:5px;background:#1e1e1e;color:#fff;padding:10px 12px;font-size:14px;line-height:1.4}[id^=NotiflixNotifyWrap]>div:last-child{margin:0}[id^=NotiflixNotifyWrap]>div.nx-with-callback{cursor:pointer}[id^=NotiflixNotifyWrap]>div.nx-with-icon{padding:8px;min-height:56px}[id^=NotiflixNotifyWrap]>div.nx-paused{cursor:auto}[id^=NotiflixNotifyWrap]>div.nx-notify-click-to-close{cursor:pointer}[id^=NotiflixNotifyWrap]>div.nx-with-close-button{padding:10px 36px 10px 12px}[id^=NotiflixNotifyWrap]>div.nx-with-icon.nx-with-close-button{padding:6px 36px 6px 6px}[id^=NotiflixNotifyWrap]>div>span.nx-message{cursor:inherit;font-weight:normal;font-family:inherit!important;word-break:break-all;word-break:break-word}[id^=NotiflixNotifyWrap]>div>span.nx-close-button{cursor:pointer;-webkit-transition:all .2s ease-in-out;-o-transition:all .2s ease-in-out;transition:all .2s ease-in-out;position:absolute;right:8px;top:0;bottom:0;margin:auto;color:inherit;width:20px;height:20px}[id^=NotiflixNotifyWrap]>div>span.nx-close-button:hover{-webkit-transform:rotate(90deg);transform:rotate(90deg)}[id^=NotiflixNotifyWrap]>div>span.nx-close-button>svg{position:absolute;width:16px;height:16px;right:2px;top:2px}[id^=NotiflixNotifyWrap]>div>.nx-message-icon{position:absolute;width:40px;height:40px;font-size:30px;line-height:40px;text-align:center;left:8px;top:0;bottom:0;margin:auto;border-radius:inherit}[id^=NotiflixNotifyWrap]>div>.nx-message-icon-fa.nx-message-icon-fa-shadow{color:inherit;background:rgba(0,0,0,.15);-webkit-box-shadow:inset 0 0 34px rgba(0,0,0,.2);box-shadow:inset 0 0 34px rgba(0,0,0,.2);text-shadow:0 0 10px rgba(0,0,0,.3)}[id^=NotiflixNotifyWrap]>div>span.nx-with-icon{position:relative;float:left;width:calc(100% - 40px);margin:0 0 0 40px;padding:0 0 0 10px;-webkit-box-sizing:border-box;box-sizing:border-box}[id^=NotiflixNotifyWrap]>div.nx-rtl-on>.nx-message-icon{left:auto;right:8px}[id^=NotiflixNotifyWrap]>div.nx-rtl-on>span.nx-with-icon{padding:0 10px 0 0;margin:0 40px 0 0}[id^=NotiflixNotifyWrap]>div.nx-rtl-on>span.nx-close-button{right:auto;left:8px}[id^=NotiflixNotifyWrap]>div.nx-with-icon.nx-with-close-button.nx-rtl-on{padding:6px 6px 6px 36px}[id^=NotiflixNotifyWrap]>div.nx-with-close-button.nx-rtl-on{padding:10px 12px 10px 36px}[id^=NotiflixNotifyOverlay].nx-with-animation,[id^=NotiflixNotifyWrap]>div.nx-with-animation.nx-fade{-webkit-animation:notify-animation-fade .3s ease-in-out 0s normal;animation:notify-animation-fade .3s ease-in-out 0s normal}@-webkit-keyframes notify-animation-fade{0%{opacity:0}100%{opacity:1}}@keyframes notify-animation-fade{0%{opacity:0}100%{opacity:1}}[id^=NotiflixNotifyWrap]>div.nx-with-animation.nx-zoom{-webkit-animation:notify-animation-zoom .3s ease-in-out 0s normal;animation:notify-animation-zoom .3s ease-in-out 0s normal}@-webkit-keyframes notify-animation-zoom{0%{-webkit-transform:scale(0);transform:scale(0)}50%{-webkit-transform:scale(1.05);transform:scale(1.05)}100%{-webkit-transform:scale(1);transform:scale(1)}}@keyframes notify-animation-zoom{0%{-webkit-transform:scale(0);transform:scale(0)}50%{-webkit-transform:scale(1.05);transform:scale(1.05)}100%{-webkit-transform:scale(1);transform:scale(1)}}[id^=NotiflixNotifyWrap]>div.nx-with-animation.nx-from-right{-webkit-animation:notify-animation-from-right .3s ease-in-out 0s normal;animation:notify-animation-from-right .3s ease-in-out 0s normal}@-webkit-keyframes notify-animation-from-right{0%{right:-300px;opacity:0}50%{right:8px;opacity:1}100%{right:0;opacity:1}}@keyframes notify-animation-from-right{0%{right:-300px;opacity:0}50%{right:8px;opacity:1}100%{right:0;opacity:1}}[id^=NotiflixNotifyWrap]>div.nx-with-animation.nx-from-left{-webkit-animation:notify-animation-from-left .3s ease-in-out 0s normal;animation:notify-animation-from-left .3s ease-in-out 0s normal}@-webkit-keyframes notify-animation-from-left{0%{left:-300px;opacity:0}50%{left:8px;opacity:1}100%{left:0;opacity:1}}@keyframes notify-animation-from-left{0%{left:-300px;opacity:0}50%{left:8px;opacity:1}100%{left:0;opacity:1}}[id^=NotiflixNotifyWrap]>div.nx-with-animation.nx-from-top{-webkit-animation:notify-animation-from-top .3s ease-in-out 0s normal;animation:notify-animation-from-top .3s ease-in-out 0s normal}@-webkit-keyframes notify-animation-from-top{0%{top:-50px;opacity:0}50%{top:8px;opacity:1}100%{top:0;opacity:1}}@keyframes notify-animation-from-top{0%{top:-50px;opacity:0}50%{top:8px;opacity:1}100%{top:0;opacity:1}}[id^=NotiflixNotifyWrap]>div.nx-with-animation.nx-from-bottom{-webkit-animation:notify-animation-from-bottom .3s ease-in-out 0s normal;animation:notify-animation-from-bottom .3s ease-in-out 0s normal}@-webkit-keyframes notify-animation-from-bottom{0%{bottom:-50px;opacity:0}50%{bottom:8px;opacity:1}100%{bottom:0;opacity:1}}@keyframes notify-animation-from-bottom{0%{bottom:-50px;opacity:0}50%{bottom:8px;opacity:1}100%{bottom:0;opacity:1}}[id^=NotiflixNotifyOverlay].nx-with-animation.nx-remove,[id^=NotiflixNotifyWrap]>div.nx-with-animation.nx-fade.nx-remove{opacity:0;-webkit-animation:notify-remove-fade .3s ease-in-out 0s normal;animation:notify-remove-fade .3s ease-in-out 0s normal}@-webkit-keyframes notify-remove-fade{0%{opacity:1}100%{opacity:0}}@keyframes notify-remove-fade{0%{opacity:1}100%{opacity:0}}[id^=NotiflixNotifyWrap]>div.nx-with-animation.nx-zoom.nx-remove{-webkit-transform:scale(0);transform:scale(0);-webkit-animation:notify-remove-zoom .3s ease-in-out 0s normal;animation:notify-remove-zoom .3s ease-in-out 0s normal}@-webkit-keyframes notify-remove-zoom{0%{-webkit-transform:scale(1);transform:scale(1)}50%{-webkit-transform:scale(1.05);transform:scale(1.05)}100%{-webkit-transform:scale(0);transform:scale(0)}}@keyframes notify-remove-zoom{0%{-webkit-transform:scale(1);transform:scale(1)}50%{-webkit-transform:scale(1.05);transform:scale(1.05)}100%{-webkit-transform:scale(0);transform:scale(0)}}[id^=NotiflixNotifyWrap]>div.nx-with-animation.nx-from-top.nx-remove{opacity:0;-webkit-animation:notify-remove-to-top .3s ease-in-out 0s normal;animation:notify-remove-to-top .3s ease-in-out 0s normal}@-webkit-keyframes notify-remove-to-top{0%{top:0;opacity:1}50%{top:8px;opacity:1}100%{top:-50px;opacity:0}}@keyframes notify-remove-to-top{0%{top:0;opacity:1}50%{top:8px;opacity:1}100%{top:-50px;opacity:0}}[id^=NotiflixNotifyWrap]>div.nx-with-animation.nx-from-right.nx-remove{opacity:0;-webkit-animation:notify-remove-to-right .3s ease-in-out 0s normal;animation:notify-remove-to-right .3s ease-in-out 0s normal}@-webkit-keyframes notify-remove-to-right{0%{right:0;opacity:1}50%{right:8px;opacity:1}100%{right:-300px;opacity:0}}@keyframes notify-remove-to-right{0%{right:0;opacity:1}50%{right:8px;opacity:1}100%{right:-300px;opacity:0}}[id^=NotiflixNotifyWrap]>div.nx-with-animation.nx-from-bottom.nx-remove{opacity:0;-webkit-animation:notify-remove-to-bottom .3s ease-in-out 0s normal;animation:notify-remove-to-bottom .3s ease-in-out 0s normal}@-webkit-keyframes notify-remove-to-bottom{0%{bottom:0;opacity:1}50%{bottom:8px;opacity:1}100%{bottom:-50px;opacity:0}}@keyframes notify-remove-to-bottom{0%{bottom:0;opacity:1}50%{bottom:8px;opacity:1}100%{bottom:-50px;opacity:0}}[id^=NotiflixNotifyWrap]>div.nx-with-animation.nx-from-left.nx-remove{opacity:0;-webkit-animation:notify-remove-to-left .3s ease-in-out 0s normal;animation:notify-remove-to-left .3s ease-in-out 0s normal}@-webkit-keyframes notify-remove-to-left{0%{left:0;opacity:1}50%{left:8px;opacity:1}100%{left:-300px;opacity:0}}@keyframes notify-remove-to-left{0%{left:0;opacity:1}50%{left:8px;opacity:1}100%{left:-300px;opacity:0}}';
          return notifyCSS || null;
        };
        // NOTIFY: Get Internal CSS Codes: end

        // NOTIFY: Create: begin
        var notifyCreateCounter = 0;
        var notifyCreate = function (notifyType, message, callbackOrOptions, options) {
          // check doc body
          if (!commonCheckHeadOrBody('body')) {
            return false;
          }

          // if not initialized pretend like init
          if (!newNotifySettings) {
            Notiflix.Notify.init({});
          }

          // create a backup for new settings
          var newNotifySettingsBackup = commonExtendOptions(true, newNotifySettings, {});

          // check callbackOrOptions and options: begin
          if (typeof callbackOrOptions === 'object' && !Array.isArray(callbackOrOptions) || typeof options === 'object' && !Array.isArray(options)) {
            // new options
            var newOptions = {};
            if (typeof callbackOrOptions === 'object') {
              newOptions = callbackOrOptions;
            } else if (typeof options === 'object') {
              newOptions = options;
            }

            // extend new settings with the new options
            newNotifySettings = commonExtendOptions(true, newNotifySettings, newOptions);
          }
          // check callbackOrOptions and options: end

          // notify type
          var theType = newNotifySettings[notifyType.toLocaleLowerCase('en')];

          // notify counter
          notifyCreateCounter++;

          // check the message: begin
          if (typeof message !== 'string') {
            message = 'Notiflix ' + notifyType;
          }
          // check the message: end

          // if plainText is true => HTML tags not allowed: begin
          if (newNotifySettings.plainText) {
            message = commonGetPlaintext(message); // message plain text
          }
          // if plainText is true => HTML tags not allowed: end

          // if plainText is false but the message length more than messageMaxLength => Possible HTML tags error: begin
          if (!newNotifySettings.plainText && message.length > newNotifySettings.messageMaxLength) {
            // extend settings for error massege
            newNotifySettings = commonExtendOptions(true, newNotifySettings, {
              closeButton: true,
              messageMaxLength: 150
            });
            // error message
            message = 'Possible HTML Tags Error: The "plainText" option is "false" and the notification content length is more than the "messageMaxLength" option.';
          }
          // if plainText is false but the message length more than messageMaxLength => Possible HTML tags error: end

          // check message max length: begin
          if (message.length > newNotifySettings.messageMaxLength) {
            message = message.substring(0, newNotifySettings.messageMaxLength) + '...';
          }
          // check message max length: end

          // font awesome icon style: begin
          if (newNotifySettings.fontAwesomeIconStyle === 'shadow') {
            theType.fontAwesomeIconColor = theType.background;
          }
          // font awesome icon style: end

          // if cssAnimaion is false => duration: begin
          if (!newNotifySettings.cssAnimation) {
            newNotifySettings.cssAnimationDuration = 0;
          }
          // if cssAnimaion is false => duration: end

          // notify wrap: begin
          var ntflxNotifyWrap = window.document.getElementById(notifySettings.wrapID) || window.document.createElement('div');
          ntflxNotifyWrap.id = notifySettings.wrapID;
          ntflxNotifyWrap.style.width = newNotifySettings.width;
          ntflxNotifyWrap.style.zIndex = newNotifySettings.zindex;
          ntflxNotifyWrap.style.opacity = newNotifySettings.opacity;

          // wrap position: begin
          if (newNotifySettings.position === 'center-center') {
            ntflxNotifyWrap.style.left = newNotifySettings.distance;
            ntflxNotifyWrap.style.top = newNotifySettings.distance;
            ntflxNotifyWrap.style.right = newNotifySettings.distance;
            ntflxNotifyWrap.style.bottom = newNotifySettings.distance;
            ntflxNotifyWrap.style.margin = 'auto';
            ntflxNotifyWrap.classList.add('nx-flex-center-center');
            ntflxNotifyWrap.style.maxHeight = 'calc((100vh - ' + newNotifySettings.distance + ') - ' + newNotifySettings.distance + ')';
            ntflxNotifyWrap.style.display = 'flex';
            ntflxNotifyWrap.style.flexWrap = 'wrap';
            ntflxNotifyWrap.style.flexDirection = 'column';
            ntflxNotifyWrap.style.justifyContent = 'center';
            ntflxNotifyWrap.style.alignItems = 'center';
            ntflxNotifyWrap.style.pointerEvents = 'none';
          } else if (newNotifySettings.position === 'center-top') {
            ntflxNotifyWrap.style.left = newNotifySettings.distance;
            ntflxNotifyWrap.style.right = newNotifySettings.distance;
            ntflxNotifyWrap.style.top = newNotifySettings.distance;
            ntflxNotifyWrap.style.bottom = 'auto';
            ntflxNotifyWrap.style.margin = 'auto';
          } else if (newNotifySettings.position === 'center-bottom') {
            ntflxNotifyWrap.style.left = newNotifySettings.distance;
            ntflxNotifyWrap.style.right = newNotifySettings.distance;
            ntflxNotifyWrap.style.bottom = newNotifySettings.distance;
            ntflxNotifyWrap.style.top = 'auto';
            ntflxNotifyWrap.style.margin = 'auto';
          } else if (newNotifySettings.position === 'right-bottom') {
            ntflxNotifyWrap.style.right = newNotifySettings.distance;
            ntflxNotifyWrap.style.bottom = newNotifySettings.distance;
            ntflxNotifyWrap.style.top = 'auto';
            ntflxNotifyWrap.style.left = 'auto';
          } else if (newNotifySettings.position === 'left-top') {
            ntflxNotifyWrap.style.left = newNotifySettings.distance;
            ntflxNotifyWrap.style.top = newNotifySettings.distance;
            ntflxNotifyWrap.style.right = 'auto';
            ntflxNotifyWrap.style.bottom = 'auto';
          } else if (newNotifySettings.position === 'left-bottom') {
            ntflxNotifyWrap.style.left = newNotifySettings.distance;
            ntflxNotifyWrap.style.bottom = newNotifySettings.distance;
            ntflxNotifyWrap.style.top = 'auto';
            ntflxNotifyWrap.style.right = 'auto';
          } else {
            // 'right-top' or else
            ntflxNotifyWrap.style.right = newNotifySettings.distance;
            ntflxNotifyWrap.style.top = newNotifySettings.distance;
            ntflxNotifyWrap.style.left = 'auto';
            ntflxNotifyWrap.style.bottom = 'auto';
          }
          // wrap position: end

          // if background overlay is true: begin
          if (newNotifySettings.backOverlay) {
            var ntflxNotifyOverlay = window.document.getElementById(notifySettings.overlayID) || window.document.createElement('div');
            ntflxNotifyOverlay.id = notifySettings.overlayID;
            ntflxNotifyOverlay.style.width = '100%';
            ntflxNotifyOverlay.style.height = '100%';
            ntflxNotifyOverlay.style.position = 'fixed';
            ntflxNotifyOverlay.style.zIndex = newNotifySettings.zindex - 1;
            ntflxNotifyOverlay.style.left = 0;
            ntflxNotifyOverlay.style.top = 0;
            ntflxNotifyOverlay.style.right = 0;
            ntflxNotifyOverlay.style.bottom = 0;
            ntflxNotifyOverlay.style.background = theType.backOverlayColor || newNotifySettings.backOverlayColor;
            ntflxNotifyOverlay.className = newNotifySettings.cssAnimation ? 'nx-with-animation' : '';
            ntflxNotifyOverlay.style.animationDuration = newNotifySettings.cssAnimation ? newNotifySettings.cssAnimationDuration + 'ms' : '';
            if (!window.document.getElementById(notifySettings.overlayID)) {
              window.document.body.appendChild(ntflxNotifyOverlay);
            }
          }
          // if background overlay is true: end

          if (!window.document.getElementById(notifySettings.wrapID)) {
            window.document.body.appendChild(ntflxNotifyWrap);
          }
          // notify wrap: end

          // notify content: begin
          var ntflxNotify = window.document.createElement('div');
          ntflxNotify.id = newNotifySettings.ID + '-' + notifyCreateCounter;
          ntflxNotify.className = newNotifySettings.className + ' ' + theType.childClassName + ' ' + (newNotifySettings.cssAnimation ? 'nx-with-animation' : '') + ' ' + (newNotifySettings.useIcon ? 'nx-with-icon' : '') + ' nx-' + newNotifySettings.cssAnimationStyle + ' ' + (newNotifySettings.closeButton && typeof callbackOrOptions !== 'function' ? 'nx-with-close-button' : '') + ' ' + (typeof callbackOrOptions === 'function' ? 'nx-with-callback' : '') + ' ' + (newNotifySettings.clickToClose ? 'nx-notify-click-to-close' : '');
          ntflxNotify.style.fontSize = newNotifySettings.fontSize;
          ntflxNotify.style.color = theType.textColor;
          ntflxNotify.style.background = theType.background;
          ntflxNotify.style.borderRadius = newNotifySettings.borderRadius;
          ntflxNotify.style.pointerEvents = 'all';

          // rtl: begin
          if (newNotifySettings.rtl) {
            ntflxNotify.setAttribute('dir', 'rtl');
            ntflxNotify.classList.add('nx-rtl-on');
          }
          // rtl: end

          // font-family: begin
          ntflxNotify.style.fontFamily = '"' + newNotifySettings.fontFamily + '", ' + defaultFontFamily;
          // font-family: end

          // use css animation: begin
          if (newNotifySettings.cssAnimation) {
            ntflxNotify.style.animationDuration = newNotifySettings.cssAnimationDuration + 'ms';
          }
          // use css animation: end

          // close button element: begin
          var closeButtonHTML = '';
          if (newNotifySettings.closeButton && typeof callbackOrOptions !== 'function') {
            closeButtonHTML = '<span class="nx-close-button"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20"><g><path fill="' + theType.notiflixIconColor + '" d="M0.38 2.19l7.8 7.81 -7.8 7.81c-0.51,0.5 -0.51,1.31 -0.01,1.81 0.25,0.25 0.57,0.38 0.91,0.38 0.34,0 0.67,-0.14 0.91,-0.38l7.81 -7.81 7.81 7.81c0.24,0.24 0.57,0.38 0.91,0.38 0.34,0 0.66,-0.14 0.9,-0.38 0.51,-0.5 0.51,-1.31 0,-1.81l-7.81 -7.81 7.81 -7.81c0.51,-0.5 0.51,-1.31 0,-1.82 -0.5,-0.5 -1.31,-0.5 -1.81,0l-7.81 7.81 -7.81 -7.81c-0.5,-0.5 -1.31,-0.5 -1.81,0 -0.51,0.51 -0.51,1.32 0,1.82z"/></g></svg></span>';
          }
          // close buttpon element: end

          // use icon: begin
          if (newNotifySettings.useIcon) {
            // use font awesome
            if (newNotifySettings.useFontAwesome) {
              ntflxNotify.innerHTML = '<i style="color:' + theType.fontAwesomeIconColor + '; font-size:' + newNotifySettings.fontAwesomeIconSize + ';" class="nx-message-icon nx-message-icon-fa ' + theType.fontAwesomeClassName + ' ' + (newNotifySettings.fontAwesomeIconStyle === 'shadow' ? 'nx-message-icon-fa-shadow' : 'nx-message-icon-fa-basic') + '"></i><span class="nx-message nx-with-icon">' + message + '</span>' + (newNotifySettings.closeButton ? closeButtonHTML : '');
            }
            // use notiflix icon
            else {
              var svgIcon = '';
              if (notifyType === typesNotify.Success) {
                // success
                svgIcon = '<svg class="nx-message-icon" xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><g><path fill="' + theType.notiflixIconColor + '" d="M20 0c11.03,0 20,8.97 20,20 0,11.03 -8.97,20 -20,20 -11.03,0 -20,-8.97 -20,-20 0,-11.03 8.97,-20 20,-20zm0 37.98c9.92,0 17.98,-8.06 17.98,-17.98 0,-9.92 -8.06,-17.98 -17.98,-17.98 -9.92,0 -17.98,8.06 -17.98,17.98 0,9.92 8.06,17.98 17.98,17.98zm-2.4 -13.29l11.52 -12.96c0.37,-0.41 1.01,-0.45 1.42,-0.08 0.42,0.37 0.46,1 0.09,1.42l-12.16 13.67c-0.19,0.22 -0.46,0.34 -0.75,0.34 -0.23,0 -0.45,-0.07 -0.63,-0.22l-7.6 -6.07c-0.43,-0.35 -0.5,-0.99 -0.16,-1.42 0.35,-0.43 0.99,-0.5 1.42,-0.16l6.85 5.48z"/></g></svg>';
              } else if (notifyType === typesNotify.Failure) {
                // failure
                svgIcon = '<svg class="nx-message-icon" xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><g><path fill="' + theType.notiflixIconColor + '" d="M20 0c11.03,0 20,8.97 20,20 0,11.03 -8.97,20 -20,20 -11.03,0 -20,-8.97 -20,-20 0,-11.03 8.97,-20 20,-20zm0 37.98c9.92,0 17.98,-8.06 17.98,-17.98 0,-9.92 -8.06,-17.98 -17.98,-17.98 -9.92,0 -17.98,8.06 -17.98,17.98 0,9.92 8.06,17.98 17.98,17.98zm1.42 -17.98l6.13 6.12c0.39,0.4 0.39,1.04 0,1.43 -0.19,0.19 -0.45,0.29 -0.71,0.29 -0.27,0 -0.53,-0.1 -0.72,-0.29l-6.12 -6.13 -6.13 6.13c-0.19,0.19 -0.44,0.29 -0.71,0.29 -0.27,0 -0.52,-0.1 -0.71,-0.29 -0.39,-0.39 -0.39,-1.03 0,-1.43l6.13 -6.12 -6.13 -6.13c-0.39,-0.39 -0.39,-1.03 0,-1.42 0.39,-0.39 1.03,-0.39 1.42,0l6.13 6.12 6.12 -6.12c0.4,-0.39 1.04,-0.39 1.43,0 0.39,0.39 0.39,1.03 0,1.42l-6.13 6.13z"/></g></svg>';
              } else if (notifyType === typesNotify.Warning) {
                // warning
                svgIcon = '<svg class="nx-message-icon" xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><g><path fill="' + theType.notiflixIconColor + '" d="M21.91 3.48l17.8 30.89c0.84,1.46 -0.23,3.25 -1.91,3.25l-35.6 0c-1.68,0 -2.75,-1.79 -1.91,-3.25l17.8 -30.89c0.85,-1.47 2.97,-1.47 3.82,0zm16.15 31.84l-17.8 -30.89c-0.11,-0.2 -0.41,-0.2 -0.52,0l-17.8 30.89c-0.12,0.2 0.05,0.4 0.26,0.4l35.6 0c0.21,0 0.38,-0.2 0.26,-0.4zm-19.01 -4.12l0 -1.05c0,-0.53 0.42,-0.95 0.95,-0.95 0.53,0 0.95,0.42 0.95,0.95l0 1.05c0,0.53 -0.42,0.95 -0.95,0.95 -0.53,0 -0.95,-0.42 -0.95,-0.95zm0 -4.66l0 -13.39c0,-0.52 0.42,-0.95 0.95,-0.95 0.53,0 0.95,0.43 0.95,0.95l0 13.39c0,0.53 -0.42,0.96 -0.95,0.96 -0.53,0 -0.95,-0.43 -0.95,-0.96z"/></g></svg>';
              } else if (notifyType === typesNotify.Info) {
                // info
                svgIcon = '<svg class="nx-message-icon" xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><g><path fill="' + theType.notiflixIconColor + '" d="M20 0c11.03,0 20,8.97 20,20 0,11.03 -8.97,20 -20,20 -11.03,0 -20,-8.97 -20,-20 0,-11.03 8.97,-20 20,-20zm0 37.98c9.92,0 17.98,-8.06 17.98,-17.98 0,-9.92 -8.06,-17.98 -17.98,-17.98 -9.92,0 -17.98,8.06 -17.98,17.98 0,9.92 8.06,17.98 17.98,17.98zm-0.99 -23.3c0,-0.54 0.44,-0.98 0.99,-0.98 0.55,0 0.99,0.44 0.99,0.98l0 15.86c0,0.55 -0.44,0.99 -0.99,0.99 -0.55,0 -0.99,-0.44 -0.99,-0.99l0 -15.86zm0 -5.22c0,-0.55 0.44,-0.99 0.99,-0.99 0.55,0 0.99,0.44 0.99,0.99l0 1.09c0,0.54 -0.44,0.99 -0.99,0.99 -0.55,0 -0.99,-0.45 -0.99,-0.99l0 -1.09z"/></g></svg>';
              }
              ntflxNotify.innerHTML = svgIcon + '<span class="nx-message nx-with-icon">' + message + '</span>' + (newNotifySettings.closeButton ? closeButtonHTML : '');
            }
          }
          // without icon
          else {
            ntflxNotify.innerHTML = '<span class="nx-message">' + message + '</span>' + (newNotifySettings.closeButton ? closeButtonHTML : '');
          }
          // use icon: end
          // notify content: end

          // notify append or prepend: begin
          if (newNotifySettings.position === 'left-bottom' || newNotifySettings.position === 'right-bottom') {
            // the new one will be first
            var notifyWrap = window.document.getElementById(notifySettings.wrapID);
            notifyWrap.insertBefore(ntflxNotify, notifyWrap.firstChild);
          } else {
            window.document.getElementById(notifySettings.wrapID).appendChild(ntflxNotify);
          }
          // notify append or prepend: end

          // remove by timeout or click: begin
          var eachNotifyElement = window.document.getElementById(ntflxNotify.id);
          if (eachNotifyElement) {
            // timeout variables
            var timeoutHide;
            var timeoutRemove;

            // hide notify elm and hide overlay: begin
            var hideNotifyElementsAndOverlay = function () {
              eachNotifyElement.classList.add('nx-remove');
              var removeOverlay = window.document.getElementById(notifySettings.overlayID);
              if (removeOverlay && ntflxNotifyWrap.childElementCount <= 0) {
                removeOverlay.classList.add('nx-remove');
              }
              clearTimeout(timeoutHide);
            };
            // hide notify elm and hide overlay: end

            // remove notify elm and wrapper: begin
            var removeNotifyElmentsAndWrapper = function () {
              if (eachNotifyElement && eachNotifyElement.parentNode !== null) {
                eachNotifyElement.parentNode.removeChild(eachNotifyElement);
              }
              if (ntflxNotifyWrap.childElementCount <= 0 && ntflxNotifyWrap.parentNode !== null) {
                // if childs count === 0 remove wrap
                ntflxNotifyWrap.parentNode.removeChild(ntflxNotifyWrap);
                var removeOverlay = window.document.getElementById(notifySettings.overlayID);
                if (removeOverlay && removeOverlay.parentNode !== null) {
                  removeOverlay.parentNode.removeChild(removeOverlay);
                }
              }
              clearTimeout(timeoutRemove);
            };
            // remove notify elm and wrapper: end

            // if has close button and callbackOrOptions is not a function: begin
            if (newNotifySettings.closeButton && typeof callbackOrOptions !== 'function') {
              var closeButtonElm = window.document.getElementById(ntflxNotify.id).querySelector('span.nx-close-button');
              closeButtonElm.addEventListener('click', function () {
                hideNotifyElementsAndOverlay();
                var clickToCloseTimeout = setTimeout(function () {
                  removeNotifyElmentsAndWrapper();
                  clearTimeout(clickToCloseTimeout);
                }, newNotifySettings.cssAnimationDuration);
              });
            }
            // if has close button and callbackOrOptions is not a function: end

            // if callbackOrOptions or click to close: begin
            if (typeof callbackOrOptions === 'function' || newNotifySettings.clickToClose) {
              eachNotifyElement.addEventListener('click', function () {
                if (typeof callbackOrOptions === 'function') {
                  callbackOrOptions();
                }
                hideNotifyElementsAndOverlay();
                var callbackTimeout = setTimeout(function () {
                  removeNotifyElmentsAndWrapper();
                  clearTimeout(callbackTimeout);
                }, newNotifySettings.cssAnimationDuration);
              });
            }
            // if callbackOrOptions or click to close: end

            // else auto remove: begin
            if (!newNotifySettings.closeButton && typeof callbackOrOptions !== 'function') {
              // auto remove: begin
              var autoRemove = function () {
                timeoutHide = setTimeout(function () {
                  hideNotifyElementsAndOverlay();
                }, newNotifySettings.timeout);
                timeoutRemove = setTimeout(function () {
                  removeNotifyElmentsAndWrapper();
                }, newNotifySettings.timeout + newNotifySettings.cssAnimationDuration);
              };
              autoRemove();
              // auto remove: end

              // pause auto remove: begin
              if (newNotifySettings.pauseOnHover) {
                eachNotifyElement.addEventListener('mouseenter', function () {
                  eachNotifyElement.classList.add('nx-paused');
                  clearTimeout(timeoutHide);
                  clearTimeout(timeoutRemove);
                });
                eachNotifyElement.addEventListener('mouseleave', function () {
                  eachNotifyElement.classList.remove('nx-paused');
                  autoRemove();
                });
              }
              // pause auto remove: end
            }
            // else auto remove: end
          }
          // remove by timeout or click: end

          // notify - show only the last one: begin
          if (newNotifySettings.showOnlyTheLastOne && notifyCreateCounter > 0) {
            var allNotifyElmNotTheLastOne = window.document.querySelectorAll('[id^=' + newNotifySettings.ID + '-]:not([id=' + newNotifySettings.ID + '-' + notifyCreateCounter + '])');
            for (var i = 0; i < allNotifyElmNotTheLastOne.length; i++) {
              var eachNotifyElmNotLastOne = allNotifyElmNotTheLastOne[i];
              if (eachNotifyElmNotLastOne.parentNode !== null) {
                eachNotifyElmNotLastOne.parentNode.removeChild(eachNotifyElmNotLastOne);
              }
            }
          }
          // notify - show only the last one: end

          // extend new settings with the backup settings
          newNotifySettings = commonExtendOptions(true, newNotifySettings, newNotifySettingsBackup);
        };
        // NOTIFY: Create: end

        var Notiflix = {
          Notify: {
            // Init
            init: function (userNotifyOptions) {
              // extend options
              newNotifySettings = commonExtendOptions(true, notifySettings, userNotifyOptions);
              // internal css if exist
              commonSetInternalCSSCodes(notifyGetInternalCSSCodes, 'NotiflixNotifyInternalCSS');
            },
            // Merge First Init
            merge: function (userNotifyExtendOptions) {
              // if initialized already
              if (newNotifySettings) {
                newNotifySettings = commonExtendOptions(true, newNotifySettings, userNotifyExtendOptions);
              }
              // initialize first
              else {
                commonConsoleError('You have to initialize the Notify module before call Merge function.');
                return false;
              }
            },
            // Success
            success: function (message, callbackOrOptions, options) {
              notifyCreate(typesNotify.Success, message, callbackOrOptions, options);
            },
            // Failure
            failure: function (message, callbackOrOptions, options) {
              notifyCreate(typesNotify.Failure, message, callbackOrOptions, options);
            },
            // Warning
            warning: function (message, callbackOrOptions, options) {
              notifyCreate(typesNotify.Warning, message, callbackOrOptions, options);
            },
            // Info
            info: function (message, callbackOrOptions, options) {
              notifyCreate(typesNotify.Info, message, callbackOrOptions, options);
            }
          }
        };
        if (typeof window.Notiflix === 'object') {
          return commonExtendOptions(true, window.Notiflix, {
            Notify: Notiflix.Notify
          });
        } else {
          return {
            Notify: Notiflix.Notify
          };
        }
      });
    })(notiflixNotifyAio);
    var notiflixNotifyAioExports = notiflixNotifyAio.exports;

    class HistoryComponent extends Cn.Component {
      constructor(props) {
        super(props);
      }
      copy = e => {
        navigator.clipboard.writeText(e.target.innerText);
        notiflixNotifyAioExports.Notify.success('Text ' + e.target.innerText + ' copied');
      };
      render({
        items
      }, {}) {
        return /*#__PURE__*/Cn.createElement("nav", {
          className: "panel"
        }, /*#__PURE__*/Cn.createElement("p", {
          className: "panel-heading"
        }, "History"), items.map(i => /*#__PURE__*/Cn.createElement("div", {
          className: "panel-block"
        }, /*#__PURE__*/Cn.createElement("div", {
          className: "field"
        }, /*#__PURE__*/Cn.createElement("a", {
          href: "javascript:",
          onClick: this.copy,
          className: "tag is-link is-light"
        }, i.output), /*#__PURE__*/Cn.createElement("div", {
          className: "tags"
        }, /*#__PURE__*/Cn.createElement("a", {
          href: "javascript:",
          onClick: this.copy,
          className: "tag is-primary is-light"
        }, i.input))))));
      }
    }

    class AppComponent extends Cn.Component {
      state = {
        items: []
      };
      constructor(props) {
        super(props);
      }
      render({}, {
        items
      }) {
        return /*#__PURE__*/Cn.createElement("div", {
          className: "columns is-centered"
        }, /*#__PURE__*/Cn.createElement("div", {
          className: "column is-three-fifths",
          id: "input-cp"
        }, /*#__PURE__*/Cn.createElement(InputComponent, {
          items: items,
          setItems: items => this.setState({
            items
          })
        })), /*#__PURE__*/Cn.createElement("div", {
          className: "column is-two-fifths is-narrow",
          id: "history-cp"
        }, /*#__PURE__*/Cn.createElement(HistoryComponent, {
          items: items
        })));
      }
    }

    Cn.render( /*#__PURE__*/Cn.createElement(AppComponent, null), document.getElementById('app'));

})();
//# sourceMappingURL=index.js.map
