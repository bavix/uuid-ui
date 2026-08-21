var Nt = Object.create, we = Object.defineProperty, Pt = Object.getOwnPropertyDescriptor, $t = Object.getOwnPropertyNames, Ot = Object.getPrototypeOf, Se = Object.prototype.hasOwnProperty, Ut = (u, e) => () => (e || (u((e = { exports: {} }).exports, e), u = null), e.exports), Lt = (u, e, t, n) => {
  if (e && typeof e == "object" || typeof e == "function")
    for (var r = $t(e), i = 0, o = r.length, a; i < o; i++)
      a = r[i], !Se.call(u, a) && a !== t && we(u, a, {
        get: ((l) => e[l]).bind(null, a),
        enumerable: !(n = Pt(e, a)) || n.enumerable
      });
  return u;
}, Tt = (u, e, t) => (t = u != null ? Nt(Ot(u)) : {}, Lt(e || !u || !u.__esModule || !Se.call(u, "default") ? we(t, "default", {
  value: u,
  enumerable: !0
}) : t, u));
function Iu(u) {
  return u.length === 32 ? u.slice(0, 8) + "-" + u.slice(8, 12) + "-" + u.slice(12, 16) + "-" + u.slice(16, 20) + "-" + u.slice(20, 32) : u;
}
var xt = /[^a-z0-9]/g, jt = /^[0-9a-f]{32}$/, Mt = /.{1,2}/g, Rt = /^urn:uuid:/i;
function be(u) {
  if (typeof u != "string") return null;
  const e = u.replace(Rt, "").toLowerCase().replaceAll(xt, "");
  return jt.test(e) ? e : null;
}
function qt(u) {
  return typeof u == "bigint" ? u >= 0n && u <= 255n : Number.isInteger(u) && u >= 0 && u <= 255;
}
function tu(u) {
  const e = be(u);
  return e === null ? null : e.match(Mt).map((t) => parseInt(t, 16));
}
function eu(u) {
  return !Array.isArray(u) || u.length !== 16 || !u.every(qt) ? null : Iu(u.map((e) => e.toString(16).padStart(2, "0")).join(""));
}
function Xu(u) {
  return be(u);
}
function Ie(u) {
  const e = tu(u);
  return e === null ? null : JSON.stringify(e);
}
function _e(u) {
  const e = atob(u).split("").map((t) => t.charCodeAt(0));
  return eu(e);
}
var Vt = /^[A-Za-z0-9+/_-]+={0,2}$/;
function Ne(u) {
  if (typeof u != "string" || !Vt.test(u) || /[+/]/.test(u) && /[-_]/.test(u)) return null;
  const e = u.replace(/-/g, "+").replace(/_/g, "/").replace(/=+$/, ""), t = e + "=".repeat((4 - e.length % 4) % 4);
  return kt(t) !== null ? t : null;
}
function Pe(u) {
  const e = Ne(u);
  return e === null ? null : _e(e);
}
function kt(u) {
  try {
    return _e(u);
  } catch {
    return null;
  }
}
function $e(u) {
  const e = tu(u);
  return e === null ? null : btoa(String.fromCharCode.apply(null, new Uint8Array(e)));
}
var Ht = /* @__PURE__ */ Ut(((u, e) => {
  (function(t, n) {
    typeof u == "object" && typeof e < "u" ? e.exports = n() : typeof define == "function" && define.amd ? define(n) : t.JSON5 = n();
  })(u, (function() {
    "use strict";
    function t(D, c) {
      return c = { exports: {} }, D(c, c.exports), c.exports;
    }
    var n = t(function(D) {
      var c = D.exports = typeof window < "u" && window.Math == Math ? window : typeof self < "u" && self.Math == Math ? self : Function("return this")();
      typeof __g == "number" && (__g = c);
    }), r = t(function(D) {
      var c = D.exports = { version: "2.6.5" };
      typeof __e == "number" && (__e = c);
    });
    r.version;
    var i = function(D) {
      return typeof D == "object" ? D !== null : typeof D == "function";
    }, o = function(D) {
      if (!i(D)) throw TypeError(D + " is not an object!");
      return D;
    }, a = function(D) {
      try {
        return !!D();
      } catch {
        return !0;
      }
    }, l = !a(function() {
      return Object.defineProperty({}, "a", { get: function() {
        return 7;
      } }).a != 7;
    }), f = n.document, A = i(f) && i(f.createElement), v = function(D) {
      return A ? f.createElement(D) : {};
    }, b = !l && !a(function() {
      return Object.defineProperty(v("div"), "a", { get: function() {
        return 7;
      } }).a != 7;
    }), R = function(D, c) {
      if (!i(D)) return D;
      var F, C;
      if (c && typeof (F = D.toString) == "function" && !i(C = F.call(D)) || typeof (F = D.valueOf) == "function" && !i(C = F.call(D)) || !c && typeof (F = D.toString) == "function" && !i(C = F.call(D))) return C;
      throw TypeError("Can't convert object to primitive value");
    }, _ = Object.defineProperty, gu = { f: l ? Object.defineProperty : function(c, F, C) {
      if (o(c), F = R(F, !0), o(C), b) try {
        return _(c, F, C);
      } catch {
      }
      if ("get" in C || "set" in C) throw TypeError("Accessors not supported!");
      return "value" in C && (c[F] = C.value), c;
    } }, $u = function(D, c) {
      return {
        enumerable: !(D & 1),
        configurable: !(D & 2),
        writable: !(D & 4),
        value: c
      };
    }, Cu = l ? function(D, c, F) {
      return gu.f(D, c, $u(1, F));
    } : function(D, c, F) {
      return D[c] = F, D;
    }, it = {}.hasOwnProperty, re = function(D, c) {
      return it.call(D, c);
    }, Dt = 0, ot = Math.random(), at = function(D) {
      return "Symbol(".concat(D === void 0 ? "" : D, ")_", (++Dt + ot).toString(36));
    }, ct = !1, Ou = t(function(D) {
      var c = "__core-js_shared__", F = n[c] || (n[c] = {});
      (D.exports = function(C, E) {
        return F[C] || (F[C] = E !== void 0 ? E : {});
      })("versions", []).push({
        version: r.version,
        mode: ct ? "pure" : "global",
        copyright: "© 2019 Denis Pushkarev (zloirock.ru)"
      });
    })("native-function-to-string", Function.toString), st = t(function(D) {
      var c = at("src"), F = "toString", C = ("" + Ou).split(F);
      r.inspectSource = function(E) {
        return Ou.call(E);
      }, (D.exports = function(E, h, m, k) {
        var N = typeof m == "function";
        N && (re(m, "name") || Cu(m, "name", h)), E[h] !== m && (N && (re(m, c) || Cu(m, c, E[h] ? "" + E[h] : C.join(String(h)))), E === n ? E[h] = m : k ? E[h] ? E[h] = m : Cu(E, h, m) : (delete E[h], Cu(E, h, m)));
      })(Function.prototype, F, function() {
        return typeof this == "function" && this[c] || Ou.call(this);
      });
    }), lt = function(D) {
      if (typeof D != "function") throw TypeError(D + " is not a function!");
      return D;
    }, ie = function(D, c, F) {
      if (lt(D), c === void 0) return D;
      switch (F) {
        case 1:
          return function(C) {
            return D.call(c, C);
          };
        case 2:
          return function(C, E) {
            return D.call(c, C, E);
          };
        case 3:
          return function(C, E, h) {
            return D.call(c, C, E, h);
          };
      }
      return function() {
        return D.apply(c, arguments);
      };
    }, Uu = "prototype", q = function(D, c, F) {
      var C = D & q.F, E = D & q.G, h = D & q.S, m = D & q.P, k = D & q.B, N = E ? n : h ? n[c] || (n[c] = {}) : (n[c] || {})[Uu], iu = E ? r : r[c] || (r[c] = {}), au = iu[Uu] || (iu[Uu] = {}), Y, z, H, cu;
      E && (F = c);
      for (Y in F)
        z = !C && N && N[Y] !== void 0, H = (z ? N : F)[Y], cu = k && z ? ie(H, n) : m && typeof H == "function" ? ie(Function.call, H) : H, N && st(N, Y, H, D & q.U), iu[Y] != H && Cu(iu, Y, cu), m && au[Y] != H && (au[Y] = H);
    };
    n.core = r, q.F = 1, q.G = 2, q.S = 4, q.P = 8, q.B = 16, q.W = 32, q.U = 64, q.R = 128;
    var Fu = q, ft = Math.ceil, Ct = Math.floor, De = function(D) {
      return isNaN(D = +D) ? 0 : (D > 0 ? Ct : ft)(D);
    }, Ft = function(D) {
      if (D == null) throw TypeError("Can't call method on  " + D);
      return D;
    }, At = function(D) {
      return function(c, F) {
        var C = String(Ft(c)), E = De(F), h = C.length, m, k;
        return E < 0 || E >= h ? D ? "" : void 0 : (m = C.charCodeAt(E), m < 55296 || m > 56319 || E + 1 === h || (k = C.charCodeAt(E + 1)) < 56320 || k > 57343 ? D ? C.charAt(E) : m : D ? C.slice(E, E + 2) : (m - 55296 << 10) + (k - 56320) + 65536);
      };
    }, Et = At(!1);
    Fu(Fu.P, "String", { codePointAt: function(c) {
      return Et(this, c);
    } }), r.String.codePointAt;
    var dt = Math.max, Bt = Math.min, gt = function(D, c) {
      return D = De(D), D < 0 ? dt(D + c, 0) : Bt(D, c);
    }, oe = String.fromCharCode, ae = String.fromCodePoint;
    Fu(Fu.S + Fu.F * (!!ae && ae.length != 1), "String", { fromCodePoint: function(c) {
      for (var F = arguments, C = [], E = arguments.length, h = 0, m; E > h; ) {
        if (m = +F[h++], gt(m, 1114111) !== m) throw RangeError(m + " is not a valid code point");
        C.push(m < 65536 ? oe(m) : oe(((m -= 65536) >> 10) + 55296, m % 1024 + 56320));
      }
      return C.join("");
    } }), r.String.fromCodePoint;
    var Lu = {
      Space_Separator: /[\u1680\u2000-\u200A\u202F\u205F\u3000]/,
      ID_Start: /[\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0370-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u048A-\u052F\u0531-\u0556\u0559\u0561-\u0587\u05D0-\u05EA\u05F0-\u05F2\u0620-\u064A\u066E\u066F\u0671-\u06D3\u06D5\u06E5\u06E6\u06EE\u06EF\u06FA-\u06FC\u06FF\u0710\u0712-\u072F\u074D-\u07A5\u07B1\u07CA-\u07EA\u07F4\u07F5\u07FA\u0800-\u0815\u081A\u0824\u0828\u0840-\u0858\u0860-\u086A\u08A0-\u08B4\u08B6-\u08BD\u0904-\u0939\u093D\u0950\u0958-\u0961\u0971-\u0980\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BD\u09CE\u09DC\u09DD\u09DF-\u09E1\u09F0\u09F1\u09FC\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A59-\u0A5C\u0A5E\u0A72-\u0A74\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABD\u0AD0\u0AE0\u0AE1\u0AF9\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3D\u0B5C\u0B5D\u0B5F-\u0B61\u0B71\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BD0\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D\u0C58-\u0C5A\u0C60\u0C61\u0C80\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBD\u0CDE\u0CE0\u0CE1\u0CF1\u0CF2\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D\u0D4E\u0D54-\u0D56\u0D5F-\u0D61\u0D7A-\u0D7F\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0E01-\u0E30\u0E32\u0E33\u0E40-\u0E46\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB0\u0EB2\u0EB3\u0EBD\u0EC0-\u0EC4\u0EC6\u0EDC-\u0EDF\u0F00\u0F40-\u0F47\u0F49-\u0F6C\u0F88-\u0F8C\u1000-\u102A\u103F\u1050-\u1055\u105A-\u105D\u1061\u1065\u1066\u106E-\u1070\u1075-\u1081\u108E\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u1380-\u138F\u13A0-\u13F5\u13F8-\u13FD\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u170C\u170E-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176C\u176E-\u1770\u1780-\u17B3\u17D7\u17DC\u1820-\u1877\u1880-\u1884\u1887-\u18A8\u18AA\u18B0-\u18F5\u1900-\u191E\u1950-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u1A00-\u1A16\u1A20-\u1A54\u1AA7\u1B05-\u1B33\u1B45-\u1B4B\u1B83-\u1BA0\u1BAE\u1BAF\u1BBA-\u1BE5\u1C00-\u1C23\u1C4D-\u1C4F\u1C5A-\u1C7D\u1C80-\u1C88\u1CE9-\u1CEC\u1CEE-\u1CF1\u1CF5\u1CF6\u1D00-\u1DBF\u1E00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2071\u207F\u2090-\u209C\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u212F-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CEE\u2CF2\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2E2F\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303C\u3041-\u3096\u309D-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312E\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FEA\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA61F\uA62A\uA62B\uA640-\uA66E\uA67F-\uA69D\uA6A0-\uA6EF\uA717-\uA71F\uA722-\uA788\uA78B-\uA7AE\uA7B0-\uA7B7\uA7F7-\uA801\uA803-\uA805\uA807-\uA80A\uA80C-\uA822\uA840-\uA873\uA882-\uA8B3\uA8F2-\uA8F7\uA8FB\uA8FD\uA90A-\uA925\uA930-\uA946\uA960-\uA97C\uA984-\uA9B2\uA9CF\uA9E0-\uA9E4\uA9E6-\uA9EF\uA9FA-\uA9FE\uAA00-\uAA28\uAA40-\uAA42\uAA44-\uAA4B\uAA60-\uAA76\uAA7A\uAA7E-\uAAAF\uAAB1\uAAB5\uAAB6\uAAB9-\uAABD\uAAC0\uAAC2\uAADB-\uAADD\uAAE0-\uAAEA\uAAF2-\uAAF4\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB65\uAB70-\uABE2\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D\uFB1F-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE70-\uFE74\uFE76-\uFEFC\uFF21-\uFF3A\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]|\uD800[\uDC00-\uDC0B\uDC0D-\uDC26\uDC28-\uDC3A\uDC3C\uDC3D\uDC3F-\uDC4D\uDC50-\uDC5D\uDC80-\uDCFA\uDD40-\uDD74\uDE80-\uDE9C\uDEA0-\uDED0\uDF00-\uDF1F\uDF2D-\uDF4A\uDF50-\uDF75\uDF80-\uDF9D\uDFA0-\uDFC3\uDFC8-\uDFCF\uDFD1-\uDFD5]|\uD801[\uDC00-\uDC9D\uDCB0-\uDCD3\uDCD8-\uDCFB\uDD00-\uDD27\uDD30-\uDD63\uDE00-\uDF36\uDF40-\uDF55\uDF60-\uDF67]|\uD802[\uDC00-\uDC05\uDC08\uDC0A-\uDC35\uDC37\uDC38\uDC3C\uDC3F-\uDC55\uDC60-\uDC76\uDC80-\uDC9E\uDCE0-\uDCF2\uDCF4\uDCF5\uDD00-\uDD15\uDD20-\uDD39\uDD80-\uDDB7\uDDBE\uDDBF\uDE00\uDE10-\uDE13\uDE15-\uDE17\uDE19-\uDE33\uDE60-\uDE7C\uDE80-\uDE9C\uDEC0-\uDEC7\uDEC9-\uDEE4\uDF00-\uDF35\uDF40-\uDF55\uDF60-\uDF72\uDF80-\uDF91]|\uD803[\uDC00-\uDC48\uDC80-\uDCB2\uDCC0-\uDCF2]|\uD804[\uDC03-\uDC37\uDC83-\uDCAF\uDCD0-\uDCE8\uDD03-\uDD26\uDD50-\uDD72\uDD76\uDD83-\uDDB2\uDDC1-\uDDC4\uDDDA\uDDDC\uDE00-\uDE11\uDE13-\uDE2B\uDE80-\uDE86\uDE88\uDE8A-\uDE8D\uDE8F-\uDE9D\uDE9F-\uDEA8\uDEB0-\uDEDE\uDF05-\uDF0C\uDF0F\uDF10\uDF13-\uDF28\uDF2A-\uDF30\uDF32\uDF33\uDF35-\uDF39\uDF3D\uDF50\uDF5D-\uDF61]|\uD805[\uDC00-\uDC34\uDC47-\uDC4A\uDC80-\uDCAF\uDCC4\uDCC5\uDCC7\uDD80-\uDDAE\uDDD8-\uDDDB\uDE00-\uDE2F\uDE44\uDE80-\uDEAA\uDF00-\uDF19]|\uD806[\uDCA0-\uDCDF\uDCFF\uDE00\uDE0B-\uDE32\uDE3A\uDE50\uDE5C-\uDE83\uDE86-\uDE89\uDEC0-\uDEF8]|\uD807[\uDC00-\uDC08\uDC0A-\uDC2E\uDC40\uDC72-\uDC8F\uDD00-\uDD06\uDD08\uDD09\uDD0B-\uDD30\uDD46]|\uD808[\uDC00-\uDF99]|\uD809[\uDC00-\uDC6E\uDC80-\uDD43]|[\uD80C\uD81C-\uD820\uD840-\uD868\uD86A-\uD86C\uD86F-\uD872\uD874-\uD879][\uDC00-\uDFFF]|\uD80D[\uDC00-\uDC2E]|\uD811[\uDC00-\uDE46]|\uD81A[\uDC00-\uDE38\uDE40-\uDE5E\uDED0-\uDEED\uDF00-\uDF2F\uDF40-\uDF43\uDF63-\uDF77\uDF7D-\uDF8F]|\uD81B[\uDF00-\uDF44\uDF50\uDF93-\uDF9F\uDFE0\uDFE1]|\uD821[\uDC00-\uDFEC]|\uD822[\uDC00-\uDEF2]|\uD82C[\uDC00-\uDD1E\uDD70-\uDEFB]|\uD82F[\uDC00-\uDC6A\uDC70-\uDC7C\uDC80-\uDC88\uDC90-\uDC99]|\uD835[\uDC00-\uDC54\uDC56-\uDC9C\uDC9E\uDC9F\uDCA2\uDCA5\uDCA6\uDCA9-\uDCAC\uDCAE-\uDCB9\uDCBB\uDCBD-\uDCC3\uDCC5-\uDD05\uDD07-\uDD0A\uDD0D-\uDD14\uDD16-\uDD1C\uDD1E-\uDD39\uDD3B-\uDD3E\uDD40-\uDD44\uDD46\uDD4A-\uDD50\uDD52-\uDEA5\uDEA8-\uDEC0\uDEC2-\uDEDA\uDEDC-\uDEFA\uDEFC-\uDF14\uDF16-\uDF34\uDF36-\uDF4E\uDF50-\uDF6E\uDF70-\uDF88\uDF8A-\uDFA8\uDFAA-\uDFC2\uDFC4-\uDFCB]|\uD83A[\uDC00-\uDCC4\uDD00-\uDD43]|\uD83B[\uDE00-\uDE03\uDE05-\uDE1F\uDE21\uDE22\uDE24\uDE27\uDE29-\uDE32\uDE34-\uDE37\uDE39\uDE3B\uDE42\uDE47\uDE49\uDE4B\uDE4D-\uDE4F\uDE51\uDE52\uDE54\uDE57\uDE59\uDE5B\uDE5D\uDE5F\uDE61\uDE62\uDE64\uDE67-\uDE6A\uDE6C-\uDE72\uDE74-\uDE77\uDE79-\uDE7C\uDE7E\uDE80-\uDE89\uDE8B-\uDE9B\uDEA1-\uDEA3\uDEA5-\uDEA9\uDEAB-\uDEBB]|\uD869[\uDC00-\uDED6\uDF00-\uDFFF]|\uD86D[\uDC00-\uDF34\uDF40-\uDFFF]|\uD86E[\uDC00-\uDC1D\uDC20-\uDFFF]|\uD873[\uDC00-\uDEA1\uDEB0-\uDFFF]|\uD87A[\uDC00-\uDFE0]|\uD87E[\uDC00-\uDE1D]/,
      ID_Continue: /[\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0300-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u0483-\u0487\u048A-\u052F\u0531-\u0556\u0559\u0561-\u0587\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7\u05D0-\u05EA\u05F0-\u05F2\u0610-\u061A\u0620-\u0669\u066E-\u06D3\u06D5-\u06DC\u06DF-\u06E8\u06EA-\u06FC\u06FF\u0710-\u074A\u074D-\u07B1\u07C0-\u07F5\u07FA\u0800-\u082D\u0840-\u085B\u0860-\u086A\u08A0-\u08B4\u08B6-\u08BD\u08D4-\u08E1\u08E3-\u0963\u0966-\u096F\u0971-\u0983\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BC-\u09C4\u09C7\u09C8\u09CB-\u09CE\u09D7\u09DC\u09DD\u09DF-\u09E3\u09E6-\u09F1\u09FC\u0A01-\u0A03\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A3C\u0A3E-\u0A42\u0A47\u0A48\u0A4B-\u0A4D\u0A51\u0A59-\u0A5C\u0A5E\u0A66-\u0A75\u0A81-\u0A83\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABC-\u0AC5\u0AC7-\u0AC9\u0ACB-\u0ACD\u0AD0\u0AE0-\u0AE3\u0AE6-\u0AEF\u0AF9-\u0AFF\u0B01-\u0B03\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3C-\u0B44\u0B47\u0B48\u0B4B-\u0B4D\u0B56\u0B57\u0B5C\u0B5D\u0B5F-\u0B63\u0B66-\u0B6F\u0B71\u0B82\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BBE-\u0BC2\u0BC6-\u0BC8\u0BCA-\u0BCD\u0BD0\u0BD7\u0BE6-\u0BEF\u0C00-\u0C03\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D-\u0C44\u0C46-\u0C48\u0C4A-\u0C4D\u0C55\u0C56\u0C58-\u0C5A\u0C60-\u0C63\u0C66-\u0C6F\u0C80-\u0C83\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBC-\u0CC4\u0CC6-\u0CC8\u0CCA-\u0CCD\u0CD5\u0CD6\u0CDE\u0CE0-\u0CE3\u0CE6-\u0CEF\u0CF1\u0CF2\u0D00-\u0D03\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D44\u0D46-\u0D48\u0D4A-\u0D4E\u0D54-\u0D57\u0D5F-\u0D63\u0D66-\u0D6F\u0D7A-\u0D7F\u0D82\u0D83\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0DCA\u0DCF-\u0DD4\u0DD6\u0DD8-\u0DDF\u0DE6-\u0DEF\u0DF2\u0DF3\u0E01-\u0E3A\u0E40-\u0E4E\u0E50-\u0E59\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB9\u0EBB-\u0EBD\u0EC0-\u0EC4\u0EC6\u0EC8-\u0ECD\u0ED0-\u0ED9\u0EDC-\u0EDF\u0F00\u0F18\u0F19\u0F20-\u0F29\u0F35\u0F37\u0F39\u0F3E-\u0F47\u0F49-\u0F6C\u0F71-\u0F84\u0F86-\u0F97\u0F99-\u0FBC\u0FC6\u1000-\u1049\u1050-\u109D\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u135D-\u135F\u1380-\u138F\u13A0-\u13F5\u13F8-\u13FD\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u170C\u170E-\u1714\u1720-\u1734\u1740-\u1753\u1760-\u176C\u176E-\u1770\u1772\u1773\u1780-\u17D3\u17D7\u17DC\u17DD\u17E0-\u17E9\u180B-\u180D\u1810-\u1819\u1820-\u1877\u1880-\u18AA\u18B0-\u18F5\u1900-\u191E\u1920-\u192B\u1930-\u193B\u1946-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u19D0-\u19D9\u1A00-\u1A1B\u1A20-\u1A5E\u1A60-\u1A7C\u1A7F-\u1A89\u1A90-\u1A99\u1AA7\u1AB0-\u1ABD\u1B00-\u1B4B\u1B50-\u1B59\u1B6B-\u1B73\u1B80-\u1BF3\u1C00-\u1C37\u1C40-\u1C49\u1C4D-\u1C7D\u1C80-\u1C88\u1CD0-\u1CD2\u1CD4-\u1CF9\u1D00-\u1DF9\u1DFB-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u203F\u2040\u2054\u2071\u207F\u2090-\u209C\u20D0-\u20DC\u20E1\u20E5-\u20F0\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u212F-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D7F-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2DE0-\u2DFF\u2E2F\u3005-\u3007\u3021-\u302F\u3031-\u3035\u3038-\u303C\u3041-\u3096\u3099\u309A\u309D-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312E\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FEA\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA62B\uA640-\uA66F\uA674-\uA67D\uA67F-\uA6F1\uA717-\uA71F\uA722-\uA788\uA78B-\uA7AE\uA7B0-\uA7B7\uA7F7-\uA827\uA840-\uA873\uA880-\uA8C5\uA8D0-\uA8D9\uA8E0-\uA8F7\uA8FB\uA8FD\uA900-\uA92D\uA930-\uA953\uA960-\uA97C\uA980-\uA9C0\uA9CF-\uA9D9\uA9E0-\uA9FE\uAA00-\uAA36\uAA40-\uAA4D\uAA50-\uAA59\uAA60-\uAA76\uAA7A-\uAAC2\uAADB-\uAADD\uAAE0-\uAAEF\uAAF2-\uAAF6\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB65\uAB70-\uABEA\uABEC\uABED\uABF0-\uABF9\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE00-\uFE0F\uFE20-\uFE2F\uFE33\uFE34\uFE4D-\uFE4F\uFE70-\uFE74\uFE76-\uFEFC\uFF10-\uFF19\uFF21-\uFF3A\uFF3F\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]|\uD800[\uDC00-\uDC0B\uDC0D-\uDC26\uDC28-\uDC3A\uDC3C\uDC3D\uDC3F-\uDC4D\uDC50-\uDC5D\uDC80-\uDCFA\uDD40-\uDD74\uDDFD\uDE80-\uDE9C\uDEA0-\uDED0\uDEE0\uDF00-\uDF1F\uDF2D-\uDF4A\uDF50-\uDF7A\uDF80-\uDF9D\uDFA0-\uDFC3\uDFC8-\uDFCF\uDFD1-\uDFD5]|\uD801[\uDC00-\uDC9D\uDCA0-\uDCA9\uDCB0-\uDCD3\uDCD8-\uDCFB\uDD00-\uDD27\uDD30-\uDD63\uDE00-\uDF36\uDF40-\uDF55\uDF60-\uDF67]|\uD802[\uDC00-\uDC05\uDC08\uDC0A-\uDC35\uDC37\uDC38\uDC3C\uDC3F-\uDC55\uDC60-\uDC76\uDC80-\uDC9E\uDCE0-\uDCF2\uDCF4\uDCF5\uDD00-\uDD15\uDD20-\uDD39\uDD80-\uDDB7\uDDBE\uDDBF\uDE00-\uDE03\uDE05\uDE06\uDE0C-\uDE13\uDE15-\uDE17\uDE19-\uDE33\uDE38-\uDE3A\uDE3F\uDE60-\uDE7C\uDE80-\uDE9C\uDEC0-\uDEC7\uDEC9-\uDEE6\uDF00-\uDF35\uDF40-\uDF55\uDF60-\uDF72\uDF80-\uDF91]|\uD803[\uDC00-\uDC48\uDC80-\uDCB2\uDCC0-\uDCF2]|\uD804[\uDC00-\uDC46\uDC66-\uDC6F\uDC7F-\uDCBA\uDCD0-\uDCE8\uDCF0-\uDCF9\uDD00-\uDD34\uDD36-\uDD3F\uDD50-\uDD73\uDD76\uDD80-\uDDC4\uDDCA-\uDDCC\uDDD0-\uDDDA\uDDDC\uDE00-\uDE11\uDE13-\uDE37\uDE3E\uDE80-\uDE86\uDE88\uDE8A-\uDE8D\uDE8F-\uDE9D\uDE9F-\uDEA8\uDEB0-\uDEEA\uDEF0-\uDEF9\uDF00-\uDF03\uDF05-\uDF0C\uDF0F\uDF10\uDF13-\uDF28\uDF2A-\uDF30\uDF32\uDF33\uDF35-\uDF39\uDF3C-\uDF44\uDF47\uDF48\uDF4B-\uDF4D\uDF50\uDF57\uDF5D-\uDF63\uDF66-\uDF6C\uDF70-\uDF74]|\uD805[\uDC00-\uDC4A\uDC50-\uDC59\uDC80-\uDCC5\uDCC7\uDCD0-\uDCD9\uDD80-\uDDB5\uDDB8-\uDDC0\uDDD8-\uDDDD\uDE00-\uDE40\uDE44\uDE50-\uDE59\uDE80-\uDEB7\uDEC0-\uDEC9\uDF00-\uDF19\uDF1D-\uDF2B\uDF30-\uDF39]|\uD806[\uDCA0-\uDCE9\uDCFF\uDE00-\uDE3E\uDE47\uDE50-\uDE83\uDE86-\uDE99\uDEC0-\uDEF8]|\uD807[\uDC00-\uDC08\uDC0A-\uDC36\uDC38-\uDC40\uDC50-\uDC59\uDC72-\uDC8F\uDC92-\uDCA7\uDCA9-\uDCB6\uDD00-\uDD06\uDD08\uDD09\uDD0B-\uDD36\uDD3A\uDD3C\uDD3D\uDD3F-\uDD47\uDD50-\uDD59]|\uD808[\uDC00-\uDF99]|\uD809[\uDC00-\uDC6E\uDC80-\uDD43]|[\uD80C\uD81C-\uD820\uD840-\uD868\uD86A-\uD86C\uD86F-\uD872\uD874-\uD879][\uDC00-\uDFFF]|\uD80D[\uDC00-\uDC2E]|\uD811[\uDC00-\uDE46]|\uD81A[\uDC00-\uDE38\uDE40-\uDE5E\uDE60-\uDE69\uDED0-\uDEED\uDEF0-\uDEF4\uDF00-\uDF36\uDF40-\uDF43\uDF50-\uDF59\uDF63-\uDF77\uDF7D-\uDF8F]|\uD81B[\uDF00-\uDF44\uDF50-\uDF7E\uDF8F-\uDF9F\uDFE0\uDFE1]|\uD821[\uDC00-\uDFEC]|\uD822[\uDC00-\uDEF2]|\uD82C[\uDC00-\uDD1E\uDD70-\uDEFB]|\uD82F[\uDC00-\uDC6A\uDC70-\uDC7C\uDC80-\uDC88\uDC90-\uDC99\uDC9D\uDC9E]|\uD834[\uDD65-\uDD69\uDD6D-\uDD72\uDD7B-\uDD82\uDD85-\uDD8B\uDDAA-\uDDAD\uDE42-\uDE44]|\uD835[\uDC00-\uDC54\uDC56-\uDC9C\uDC9E\uDC9F\uDCA2\uDCA5\uDCA6\uDCA9-\uDCAC\uDCAE-\uDCB9\uDCBB\uDCBD-\uDCC3\uDCC5-\uDD05\uDD07-\uDD0A\uDD0D-\uDD14\uDD16-\uDD1C\uDD1E-\uDD39\uDD3B-\uDD3E\uDD40-\uDD44\uDD46\uDD4A-\uDD50\uDD52-\uDEA5\uDEA8-\uDEC0\uDEC2-\uDEDA\uDEDC-\uDEFA\uDEFC-\uDF14\uDF16-\uDF34\uDF36-\uDF4E\uDF50-\uDF6E\uDF70-\uDF88\uDF8A-\uDFA8\uDFAA-\uDFC2\uDFC4-\uDFCB\uDFCE-\uDFFF]|\uD836[\uDE00-\uDE36\uDE3B-\uDE6C\uDE75\uDE84\uDE9B-\uDE9F\uDEA1-\uDEAF]|\uD838[\uDC00-\uDC06\uDC08-\uDC18\uDC1B-\uDC21\uDC23\uDC24\uDC26-\uDC2A]|\uD83A[\uDC00-\uDCC4\uDCD0-\uDCD6\uDD00-\uDD4A\uDD50-\uDD59]|\uD83B[\uDE00-\uDE03\uDE05-\uDE1F\uDE21\uDE22\uDE24\uDE27\uDE29-\uDE32\uDE34-\uDE37\uDE39\uDE3B\uDE42\uDE47\uDE49\uDE4B\uDE4D-\uDE4F\uDE51\uDE52\uDE54\uDE57\uDE59\uDE5B\uDE5D\uDE5F\uDE61\uDE62\uDE64\uDE67-\uDE6A\uDE6C-\uDE72\uDE74-\uDE77\uDE79-\uDE7C\uDE7E\uDE80-\uDE89\uDE8B-\uDE9B\uDEA1-\uDEA3\uDEA5-\uDEA9\uDEAB-\uDEBB]|\uD869[\uDC00-\uDED6\uDF00-\uDFFF]|\uD86D[\uDC00-\uDF34\uDF40-\uDFFF]|\uD86E[\uDC00-\uDC1D\uDC20-\uDFFF]|\uD873[\uDC00-\uDEA1\uDEB0-\uDFFF]|\uD87A[\uDC00-\uDFE0]|\uD87E[\uDC00-\uDE1D]|\uDB40[\uDD00-\uDDEF]/
    }, I = {
      isSpaceSeparator: function(c) {
        return typeof c == "string" && Lu.Space_Separator.test(c);
      },
      isIdStartChar: function(c) {
        return typeof c == "string" && (c >= "a" && c <= "z" || c >= "A" && c <= "Z" || c === "$" || c === "_" || Lu.ID_Start.test(c));
      },
      isIdContinueChar: function(c) {
        return typeof c == "string" && (c >= "a" && c <= "z" || c >= "A" && c <= "Z" || c >= "0" && c <= "9" || c === "$" || c === "_" || c === "‌" || c === "‍" || Lu.ID_Continue.test(c));
      },
      isDigit: function(c) {
        return typeof c == "string" && /[0-9]/.test(c);
      },
      isHexDigit: function(c) {
        return typeof c == "string" && /[0-9A-Fa-f]/.test(c);
      }
    }, Tu, V, W, hu, Q, J, P, xu, Au, ht = function(c, F) {
      Tu = String(c), V = "start", W = [], hu = 0, Q = 1, J = 0, P = void 0, xu = void 0, Au = void 0;
      do
        P = pt(), yt[V]();
      while (P.type !== "eof");
      return typeof F == "function" ? ju({ "": Au }, "", F) : Au;
    };
    function ju(D, c, F) {
      var C = D[c];
      if (C != null && typeof C == "object") if (Array.isArray(C)) for (var E = 0; E < C.length; E++) {
        var h = String(E), m = ju(C, h, F);
        m === void 0 ? delete C[h] : Object.defineProperty(C, h, {
          value: m,
          writable: !0,
          enumerable: !0,
          configurable: !0
        });
      }
      else for (var k in C) {
        var N = ju(C, k, F);
        N === void 0 ? delete C[k] : Object.defineProperty(C, k, {
          value: N,
          writable: !0,
          enumerable: !0,
          configurable: !0
        });
      }
      return F.call(D, c, C);
    }
    var g, d, Eu, X, p;
    function pt() {
      for (g = "default", d = "", Eu = !1, X = 1; ; ) {
        p = K();
        var D = ce[g]();
        if (D) return D;
      }
    }
    function K() {
      if (Tu[hu]) return String.fromCodePoint(Tu.codePointAt(hu));
    }
    function s() {
      var D = K();
      return D === `
` ? (Q++, J = 0) : D ? J += D.length : J++, D && (hu += D.length), D;
    }
    var ce = {
      default: function() {
        switch (p) {
          case "	":
          case "\v":
          case "\f":
          case " ":
          case " ":
          case "\uFEFF":
          case `
`:
          case "\r":
          case "\u2028":
          case "\u2029":
            s();
            return;
          case "/":
            s(), g = "comment";
            return;
          case void 0:
            return s(), w("eof");
        }
        if (I.isSpaceSeparator(p)) {
          s();
          return;
        }
        return ce[V]();
      },
      comment: function() {
        switch (p) {
          case "*":
            s(), g = "multiLineComment";
            return;
          case "/":
            s(), g = "singleLineComment";
            return;
        }
        throw S(s());
      },
      multiLineComment: function() {
        switch (p) {
          case "*":
            s(), g = "multiLineCommentAsterisk";
            return;
          case void 0:
            throw S(s());
        }
        s();
      },
      multiLineCommentAsterisk: function() {
        switch (p) {
          case "*":
            s();
            return;
          case "/":
            s(), g = "default";
            return;
          case void 0:
            throw S(s());
        }
        s(), g = "multiLineComment";
      },
      singleLineComment: function() {
        switch (p) {
          case `
`:
          case "\r":
          case "\u2028":
          case "\u2029":
            s(), g = "default";
            return;
          case void 0:
            return s(), w("eof");
        }
        s();
      },
      value: function() {
        switch (p) {
          case "{":
          case "[":
            return w("punctuator", s());
          case "n":
            return s(), nu("ull"), w("null", null);
          case "t":
            return s(), nu("rue"), w("boolean", !0);
          case "f":
            return s(), nu("alse"), w("boolean", !1);
          case "-":
          case "+":
            s() === "-" && (X = -1), g = "sign";
            return;
          case ".":
            d = s(), g = "decimalPointLeading";
            return;
          case "0":
            d = s(), g = "zero";
            return;
          case "1":
          case "2":
          case "3":
          case "4":
          case "5":
          case "6":
          case "7":
          case "8":
          case "9":
            d = s(), g = "decimalInteger";
            return;
          case "I":
            return s(), nu("nfinity"), w("numeric", 1 / 0);
          case "N":
            return s(), nu("aN"), w("numeric", NaN);
          case '"':
          case "'":
            Eu = s() === '"', d = "", g = "string";
            return;
        }
        throw S(s());
      },
      identifierNameStartEscape: function() {
        if (p !== "u") throw S(s());
        s();
        var c = Mu();
        switch (c) {
          case "$":
          case "_":
            break;
          default:
            if (!I.isIdStartChar(c)) throw se();
        }
        d += c, g = "identifierName";
      },
      identifierName: function() {
        switch (p) {
          case "$":
          case "_":
          case "‌":
          case "‍":
            d += s();
            return;
          case "\\":
            s(), g = "identifierNameEscape";
            return;
        }
        if (I.isIdContinueChar(p)) {
          d += s();
          return;
        }
        return w("identifier", d);
      },
      identifierNameEscape: function() {
        if (p !== "u") throw S(s());
        s();
        var c = Mu();
        switch (c) {
          case "$":
          case "_":
          case "‌":
          case "‍":
            break;
          default:
            if (!I.isIdContinueChar(c)) throw se();
        }
        d += c, g = "identifierName";
      },
      sign: function() {
        switch (p) {
          case ".":
            d = s(), g = "decimalPointLeading";
            return;
          case "0":
            d = s(), g = "zero";
            return;
          case "1":
          case "2":
          case "3":
          case "4":
          case "5":
          case "6":
          case "7":
          case "8":
          case "9":
            d = s(), g = "decimalInteger";
            return;
          case "I":
            return s(), nu("nfinity"), w("numeric", X * (1 / 0));
          case "N":
            return s(), nu("aN"), w("numeric", NaN);
        }
        throw S(s());
      },
      zero: function() {
        switch (p) {
          case ".":
            d += s(), g = "decimalPoint";
            return;
          case "e":
          case "E":
            d += s(), g = "decimalExponent";
            return;
          case "x":
          case "X":
            d += s(), g = "hexadecimal";
            return;
        }
        return w("numeric", X * 0);
      },
      decimalInteger: function() {
        switch (p) {
          case ".":
            d += s(), g = "decimalPoint";
            return;
          case "e":
          case "E":
            d += s(), g = "decimalExponent";
            return;
        }
        if (I.isDigit(p)) {
          d += s();
          return;
        }
        return w("numeric", X * Number(d));
      },
      decimalPointLeading: function() {
        if (I.isDigit(p)) {
          d += s(), g = "decimalFraction";
          return;
        }
        throw S(s());
      },
      decimalPoint: function() {
        switch (p) {
          case "e":
          case "E":
            d += s(), g = "decimalExponent";
            return;
        }
        if (I.isDigit(p)) {
          d += s(), g = "decimalFraction";
          return;
        }
        return w("numeric", X * Number(d));
      },
      decimalFraction: function() {
        switch (p) {
          case "e":
          case "E":
            d += s(), g = "decimalExponent";
            return;
        }
        if (I.isDigit(p)) {
          d += s();
          return;
        }
        return w("numeric", X * Number(d));
      },
      decimalExponent: function() {
        switch (p) {
          case "+":
          case "-":
            d += s(), g = "decimalExponentSign";
            return;
        }
        if (I.isDigit(p)) {
          d += s(), g = "decimalExponentInteger";
          return;
        }
        throw S(s());
      },
      decimalExponentSign: function() {
        if (I.isDigit(p)) {
          d += s(), g = "decimalExponentInteger";
          return;
        }
        throw S(s());
      },
      decimalExponentInteger: function() {
        if (I.isDigit(p)) {
          d += s();
          return;
        }
        return w("numeric", X * Number(d));
      },
      hexadecimal: function() {
        if (I.isHexDigit(p)) {
          d += s(), g = "hexadecimalInteger";
          return;
        }
        throw S(s());
      },
      hexadecimalInteger: function() {
        if (I.isHexDigit(p)) {
          d += s();
          return;
        }
        return w("numeric", X * Number(d));
      },
      string: function() {
        switch (p) {
          case "\\":
            s(), d += mt();
            return;
          case '"':
            if (Eu)
              return s(), w("string", d);
            d += s();
            return;
          case "'":
            if (!Eu)
              return s(), w("string", d);
            d += s();
            return;
          case `
`:
          case "\r":
            throw S(s());
          case "\u2028":
          case "\u2029":
            wt(p);
            break;
          case void 0:
            throw S(s());
        }
        d += s();
      },
      start: function() {
        switch (p) {
          case "{":
          case "[":
            return w("punctuator", s());
        }
        g = "value";
      },
      beforePropertyName: function() {
        switch (p) {
          case "$":
          case "_":
            d = s(), g = "identifierName";
            return;
          case "\\":
            s(), g = "identifierNameStartEscape";
            return;
          case "}":
            return w("punctuator", s());
          case '"':
          case "'":
            Eu = s() === '"', g = "string";
            return;
        }
        if (I.isIdStartChar(p)) {
          d += s(), g = "identifierName";
          return;
        }
        throw S(s());
      },
      afterPropertyName: function() {
        if (p === ":") return w("punctuator", s());
        throw S(s());
      },
      beforePropertyValue: function() {
        g = "value";
      },
      afterPropertyValue: function() {
        switch (p) {
          case ",":
          case "}":
            return w("punctuator", s());
        }
        throw S(s());
      },
      beforeArrayValue: function() {
        if (p === "]") return w("punctuator", s());
        g = "value";
      },
      afterArrayValue: function() {
        switch (p) {
          case ",":
          case "]":
            return w("punctuator", s());
        }
        throw S(s());
      },
      end: function() {
        throw S(s());
      }
    };
    function w(D, c) {
      return {
        type: D,
        value: c,
        line: Q,
        column: J
      };
    }
    function nu(D) {
      for (var c = 0, F = D; c < F.length; c += 1) {
        var C = F[c];
        if (K() !== C) throw S(s());
        s();
      }
    }
    function mt() {
      switch (K()) {
        case "b":
          return s(), "\b";
        case "f":
          return s(), "\f";
        case "n":
          return s(), `
`;
        case "r":
          return s(), "\r";
        case "t":
          return s(), "	";
        case "v":
          return s(), "\v";
        case "0":
          if (s(), I.isDigit(K())) throw S(s());
          return "\0";
        case "x":
          return s(), vt();
        case "u":
          return s(), Mu();
        case `
`:
        case "\u2028":
        case "\u2029":
          return s(), "";
        case "\r":
          return s(), K() === `
` && s(), "";
        case "1":
        case "2":
        case "3":
        case "4":
        case "5":
        case "6":
        case "7":
        case "8":
        case "9":
          throw S(s());
        case void 0:
          throw S(s());
      }
      return s();
    }
    function vt() {
      var D = "", c = K();
      if (!I.isHexDigit(c) || (D += s(), c = K(), !I.isHexDigit(c))) throw S(s());
      return D += s(), String.fromCodePoint(parseInt(D, 16));
    }
    function Mu() {
      for (var D = "", c = 4; c-- > 0; ) {
        var F = K();
        if (!I.isHexDigit(F)) throw S(s());
        D += s();
      }
      return String.fromCodePoint(parseInt(D, 16));
    }
    var yt = {
      start: function() {
        if (P.type === "eof") throw ru();
        Ru();
      },
      beforePropertyName: function() {
        switch (P.type) {
          case "identifier":
          case "string":
            xu = P.value, V = "afterPropertyName";
            return;
          case "punctuator":
            pu();
            return;
          case "eof":
            throw ru();
        }
      },
      afterPropertyName: function() {
        if (P.type === "eof") throw ru();
        V = "beforePropertyValue";
      },
      beforePropertyValue: function() {
        if (P.type === "eof") throw ru();
        Ru();
      },
      beforeArrayValue: function() {
        if (P.type === "eof") throw ru();
        if (P.type === "punctuator" && P.value === "]") {
          pu();
          return;
        }
        Ru();
      },
      afterPropertyValue: function() {
        if (P.type === "eof") throw ru();
        switch (P.value) {
          case ",":
            V = "beforePropertyName";
            return;
          case "}":
            pu();
        }
      },
      afterArrayValue: function() {
        if (P.type === "eof") throw ru();
        switch (P.value) {
          case ",":
            V = "beforeArrayValue";
            return;
          case "]":
            pu();
        }
      },
      end: function() {
      }
    };
    function Ru() {
      var D;
      switch (P.type) {
        case "punctuator":
          switch (P.value) {
            case "{":
              D = {};
              break;
            case "[":
              D = [];
          }
          break;
        case "null":
        case "boolean":
        case "numeric":
        case "string":
          D = P.value;
      }
      if (Au === void 0) Au = D;
      else {
        var c = W[W.length - 1];
        Array.isArray(c) ? c.push(D) : Object.defineProperty(c, xu, {
          value: D,
          writable: !0,
          enumerable: !0,
          configurable: !0
        });
      }
      if (D !== null && typeof D == "object")
        W.push(D), Array.isArray(D) ? V = "beforeArrayValue" : V = "beforePropertyName";
      else {
        var F = W[W.length - 1];
        F == null ? V = "end" : Array.isArray(F) ? V = "afterArrayValue" : V = "afterPropertyValue";
      }
    }
    function pu() {
      W.pop();
      var D = W[W.length - 1];
      D == null ? V = "end" : Array.isArray(D) ? V = "afterArrayValue" : V = "afterPropertyValue";
    }
    function S(D) {
      return mu(D === void 0 ? "JSON5: invalid end of input at " + Q + ":" + J : "JSON5: invalid character '" + le(D) + "' at " + Q + ":" + J);
    }
    function ru() {
      return mu("JSON5: invalid end of input at " + Q + ":" + J);
    }
    function se() {
      return J -= 5, mu("JSON5: invalid identifier character at " + Q + ":" + J);
    }
    function wt(D) {
      console.warn("JSON5: '" + le(D) + "' in strings is not valid ECMAScript; consider escaping");
    }
    function le(D) {
      var c = {
        "'": "\\'",
        '"': '\\"',
        "\\": "\\\\",
        "\b": "\\b",
        "\f": "\\f",
        "\n": "\\n",
        "\r": "\\r",
        "	": "\\t",
        "\v": "\\v",
        "\0": "\\0",
        "\u2028": "\\u2028",
        "\u2029": "\\u2029"
      };
      if (c[D]) return c[D];
      if (D < " ") {
        var F = D.charCodeAt(0).toString(16);
        return "\\x" + ("00" + F).substring(F.length);
      }
      return D;
    }
    function mu(D) {
      var c = new SyntaxError(D);
      return c.lineNumber = Q, c.columnNumber = J, c;
    }
    return {
      parse: ht,
      stringify: function(c, F, C) {
        var E = [], h = "", m, k, N = "", iu;
        if (F != null && typeof F == "object" && !Array.isArray(F) && (C = F.space, iu = F.quote, F = F.replacer), typeof F == "function") k = F;
        else if (Array.isArray(F)) {
          m = [];
          for (var au = 0, Y = F; au < Y.length; au += 1) {
            var z = Y[au], H = void 0;
            typeof z == "string" ? H = z : (typeof z == "number" || z instanceof String || z instanceof Number) && (H = String(z)), H !== void 0 && m.indexOf(H) < 0 && m.push(H);
          }
        }
        return C instanceof Number ? C = Number(C) : C instanceof String && (C = String(C)), typeof C == "number" ? C > 0 && (C = Math.min(10, Math.floor(C)), N = "          ".substr(0, C)) : typeof C == "string" && (N = C.substr(0, 10)), cu("", { "": c });
        function cu(y, U) {
          var B = U[y];
          switch (B != null && (typeof B.toJSON5 == "function" ? B = B.toJSON5(y) : typeof B.toJSON == "function" && (B = B.toJSON(y))), k && (B = k.call(U, y, B)), B instanceof Number ? B = Number(B) : B instanceof String ? B = String(B) : B instanceof Boolean && (B = B.valueOf()), B) {
            case null:
              return "null";
            case !0:
              return "true";
            case !1:
              return "false";
          }
          if (typeof B == "string") return vu(B, !1);
          if (typeof B == "number") return String(B);
          if (typeof B == "object") return Array.isArray(B) ? It(B) : St(B);
        }
        function vu(y) {
          for (var U = {
            "'": 0.1,
            '"': 0.2
          }, B = {
            "'": "\\'",
            '"': '\\"',
            "\\": "\\\\",
            "\b": "\\b",
            "\f": "\\f",
            "\n": "\\n",
            "\r": "\\r",
            "	": "\\t",
            "\v": "\\v",
            "\0": "\\0",
            "\u2028": "\\u2028",
            "\u2029": "\\u2029"
          }, $ = "", G = 0; G < y.length; G++) {
            var L = y[G];
            switch (L) {
              case "'":
              case '"':
                U[L]++, $ += L;
                continue;
              case "\0":
                if (I.isDigit(y[G + 1])) {
                  $ += "\\x00";
                  continue;
                }
            }
            if (B[L]) {
              $ += B[L];
              continue;
            }
            if (L < " ") {
              var Du = L.charCodeAt(0).toString(16);
              $ += "\\x" + ("00" + Du).substring(Du.length);
              continue;
            }
            $ += L;
          }
          var Z = iu || Object.keys(U).reduce(function(su, ou) {
            return U[su] < U[ou] ? su : ou;
          });
          return $ = $.replace(new RegExp(Z, "g"), B[Z]), Z + $ + Z;
        }
        function St(y) {
          if (E.indexOf(y) >= 0) throw TypeError("Converting circular structure to JSON5");
          E.push(y);
          var U = h;
          h = h + N;
          for (var B = m || Object.keys(y), $ = [], G = 0, L = B; G < L.length; G += 1) {
            var Du = L[G], Z = cu(Du, y);
            if (Z !== void 0) {
              var su = bt(Du) + ":";
              N !== "" && (su += " "), su += Z, $.push(su);
            }
          }
          var ou;
          if ($.length === 0) ou = "{}";
          else {
            var yu;
            if (N === "")
              yu = $.join(","), ou = "{" + yu + "}";
            else {
              var _t = `,
` + h;
              yu = $.join(_t), ou = `{
` + h + yu + `,
` + U + "}";
            }
          }
          return E.pop(), h = U, ou;
        }
        function bt(y) {
          if (y.length === 0) return vu(y, !0);
          var U = String.fromCodePoint(y.codePointAt(0));
          if (!I.isIdStartChar(U)) return vu(y, !0);
          for (var B = U.length; B < y.length; B++) if (!I.isIdContinueChar(String.fromCodePoint(y.codePointAt(B)))) return vu(y, !0);
          return y;
        }
        function It(y) {
          if (E.indexOf(y) >= 0) throw TypeError("Converting circular structure to JSON5");
          E.push(y);
          var U = h;
          h = h + N;
          for (var B = [], $ = 0; $ < y.length; $++) {
            var G = cu(String($), y);
            B.push(G !== void 0 ? G : "null");
          }
          var L;
          if (B.length === 0) L = "[]";
          else if (N === "") L = "[" + B.join(",") + "]";
          else {
            var Du = `,
` + h, Z = B.join(Du);
            L = `[
` + h + Z + `,
` + U + "]";
          }
          return E.pop(), h = U, L;
        }
      }
    };
  }));
})), fe = /* @__PURE__ */ Tt(Ht(), 1), qu = /^-?\d+$/, Jt = /^[0-9a-f]{2}(?:[\s,]+[0-9a-f]{2}){15}$/i;
function lu(u) {
  if (typeof u != "string") throw new TypeError("objectParse expects a string");
  const e = /^(-?\d+)[;:,](-?\d+)$/, t = /^\s*(-?\d+)\s*[;:,]\s*(-?\d+)\s*[;:,]\s*(-?\d+)\s*[;:,]\s*(-?\d+)\s*$/, n = /(^|[[{,:]\s*)["']?(-?\d+)["']?(?=\s*([,}\]]|$))/g;
  if (Jt.test(u.trim())) return u.trim().split(/[\s,]+/).map((l) => parseInt(l, 16));
  if (u[0] === "[") return fe.default.parse(u.replace(n, "$1$2"));
  const r = u.match(t);
  if (r) return {
    w1: Number(r[1]),
    w2: Number(r[2]),
    w3: Number(r[3]),
    w4: Number(r[4])
  };
  if (u.match(e)) {
    const l = u.replace(e, "$1;$2").split(";");
    return {
      high: l[0].toString(),
      low: l[1].toString()
    };
  }
  const i = fe.default.parse(u.replace(n, '$1"$2"'));
  if (i === null || typeof i != "object" || Array.isArray(i)) throw new SyntaxError("Not a high/low object");
  if ([
    "w1",
    "w2",
    "w3",
    "w4"
  ].every((l) => l in i)) {
    const l = {};
    for (const f of [
      "w1",
      "w2",
      "w3",
      "w4"
    ]) {
      const A = String(i[f]);
      if (!qu.test(A)) throw new SyntaxError("w1..w4 must be integers");
      l[f] = Number(A);
    }
    return l;
  }
  const o = String(i.high), a = String(i.low);
  if (!qu.test(o) || !qu.test(a)) throw new SyntaxError("high and low must be integers");
  return {
    high: o,
    low: a
  };
}
var Su = [
  "w1",
  "w2",
  "w3",
  "w4"
], Oe = 4294967296;
function Yt(u) {
  return u >= 2147483648 ? u - Oe : u;
}
function Gt(u) {
  return u < 0 ? u + Oe : u;
}
function Ue(u, e = !1) {
  const t = tu(u);
  if (t === null) return null;
  const n = {};
  return Su.forEach((r, i) => {
    const o = i * 4, a = t[o] * 16777216 + (t[o + 1] << 16) + (t[o + 2] << 8) + t[o + 3] >>> 0;
    n[r] = e ? Yt(a) : a;
  }), n;
}
function zt(u) {
  if (u === null || typeof u != "object") return null;
  const e = [];
  for (const t of Su) {
    const n = Number(u[t]);
    if (!Number.isInteger(n) || n < -2147483648 || n > 4294967295) return null;
    const r = Gt(n);
    e.push(Math.floor(r / 16777216) & 255, r >>> 16 & 255, r >>> 8 & 255, r & 255);
  }
  return eu(e);
}
function Wt(u) {
  if (u === null || typeof u != "object" || Array.isArray(u)) return !1;
  const e = Object.keys(u);
  return e.length === Su.length && Su.every((t) => e.includes(t));
}
function Xt(u) {
  if (!_u(u)) return null;
  try {
    return Qt(Kt(u));
  } catch (e) {
    console.error(e);
  }
  return null;
}
function Ku(u) {
  const e = tu(u);
  if (e === null) return null;
  try {
    return Zt(e);
  } catch (t) {
    console.error(t);
  }
  return null;
}
function _u(u) {
  return typeof u == "string" && /^[0-7][0-9A-HJKMNP-TV-Z]{25}$/i.test(u.toUpperCase());
}
var Le = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
function Kt(u) {
  let e = 0, t = 0;
  const n = [];
  for (let r = u.length - 1; r >= 0; r--) {
    const i = u[r].toUpperCase(), o = Le.indexOf(i);
    if (o === -1) throw new Error("Invalid character in ULID");
    for (t |= o << e, e += 5; e >= 8; )
      n.unshift(t & 255), t >>>= 8, e -= 8;
  }
  return (t !== 0 || e >= 5) && n.unshift(t & 255), new Uint8Array(n);
}
function Zt(u) {
  const e = [...u].reverse();
  let t = 0, n = 0;
  const r = [];
  for (const i of e)
    for (n |= i << t, t += 8; t >= 5; )
      r.unshift(n & 31), n >>>= 5, t -= 5;
  return t > 0 && t < 5 && r.unshift(n & 31), r.map((i) => Le[i]).join("");
}
function Qt(u) {
  const e = Array.from(u).map((t) => t.toString(16).padStart(2, "0")).join("");
  return `${e.slice(0, 8)}-${e.slice(8, 12)}-${e.slice(12, 16)}-${e.slice(16, 20)}-${e.slice(20)}`;
}
var un = [
  '"',
  "'",
  "`"
];
function Zu(u) {
  if (typeof u != "string") return u;
  let e = u.trim().replace(/,+$/, "").trim();
  for (; e.length > 1 && un.includes(e[0]) && e[e.length - 1] === e[0]; ) e = e.slice(1, -1).trim();
  return e;
}
var pr = 2 ** 1, mr = 2 ** 2, vr = 2 ** 3, yr = 2 ** 4, wr = 2 ** 6, en = 36, tn = /^[0-9a-f]{2}(?:[\s,]+[0-9a-f]{2}){15}$/i;
function Te() {
  const u = [];
  return u[1] = "uuid", u[4] = "base64", u[2] = "high-low", u[8] = "bytes", u[16] = "ulid", u[64] = "words", u;
}
function Qu(u) {
  if (typeof u != "string") return 1;
  const e = Zu(u);
  if (_u(e.trim())) return 16;
  if (tn.test(e.trim())) return 8;
  try {
    const t = lu(e);
    return Array.isArray(t) ? 8 : Wt(t) ? 64 : 2;
  } catch {
  }
  try {
    const t = Pe(e);
    if (t !== null && t.length === en) return 4;
  } catch {
  }
  return 1;
}
function xe(u) {
  const e = tu(u);
  return e === null ? null : e.map((t) => BigInt(t));
}
function bu(u) {
  try {
    return BigInt(u);
  } catch {
    return null;
  }
}
function je(u) {
  const e = xe(u);
  if (e === null) return null;
  const t = BigInt(e[0] | e[1] << BigInt(8) | e[2] << BigInt(16) | e[3] << BigInt(24) | e[4] << BigInt(32) | e[5] << BigInt(40) | e[6] << BigInt(48) | e[7] << BigInt(56)), n = BigInt(e[8] | e[9] << BigInt(8) | e[10] << BigInt(16) | e[11] << BigInt(24) | e[12] << BigInt(32) | e[13] << BigInt(40) | e[14] << BigInt(48) | e[15] << BigInt(56));
  return {
    high: BigInt.asIntN(64, t) + "",
    low: BigInt.asIntN(64, n) + ""
  };
}
function nn(u, e) {
  const t = bu(u), n = bu(e);
  return t === null || n === null ? null : eu([
    t & BigInt(255),
    t >> BigInt(8) & BigInt(255),
    t >> BigInt(16) & BigInt(255),
    t >> BigInt(24) & BigInt(255),
    t >> BigInt(32) & BigInt(255),
    t >> BigInt(40) & BigInt(255),
    t >> BigInt(48) & BigInt(255),
    t >> BigInt(56) & BigInt(255),
    n & BigInt(255),
    n >> BigInt(8) & BigInt(255),
    n >> BigInt(16) & BigInt(255),
    n >> BigInt(24) & BigInt(255),
    n >> BigInt(32) & BigInt(255),
    n >> BigInt(40) & BigInt(255),
    n >> BigInt(48) & BigInt(255),
    n >> BigInt(56) & BigInt(255)
  ]);
}
function Me(u) {
  const e = xe(u);
  if (e === null) return null;
  const t = BigInt(e[7] | e[6] << BigInt(8) | e[5] << BigInt(16) | e[4] << BigInt(24) | e[3] << BigInt(32) | e[2] << BigInt(40) | e[1] << BigInt(48) | e[0] << BigInt(56)), n = BigInt(e[15] | e[14] << BigInt(8) | e[13] << BigInt(16) | e[12] << BigInt(24) | e[11] << BigInt(32) | e[10] << BigInt(40) | e[9] << BigInt(48) | e[8] << BigInt(56));
  return {
    high: BigInt.asUintN(64, t) + "",
    low: BigInt.asUintN(64, n) + ""
  };
}
function rn(u, e) {
  const t = bu(u), n = bu(e);
  return t === null || n === null ? null : eu([
    t >> BigInt(56) & BigInt(255),
    t >> BigInt(48) & BigInt(255),
    t >> BigInt(40) & BigInt(255),
    t >> BigInt(32) & BigInt(255),
    t >> BigInt(24) & BigInt(255),
    t >> BigInt(16) & BigInt(255),
    t >> BigInt(8) & BigInt(255),
    t & BigInt(255),
    n >> BigInt(56) & BigInt(255),
    n >> BigInt(48) & BigInt(255),
    n >> BigInt(40) & BigInt(255),
    n >> BigInt(32) & BigInt(255),
    n >> BigInt(24) & BigInt(255),
    n >> BigInt(16) & BigInt(255),
    n >> BigInt(8) & BigInt(255),
    n & BigInt(255)
  ]);
}
var ue = "plain";
var Dn = "braces";
function Re(u, e = ue, t = !1) {
  if (typeof u != "string" || u === "") return u;
  const n = t ? u.toUpperCase() : u.toLowerCase();
  return e === "hex" ? n.replace(/-/g, "") : e === "braces" ? `{${n}}` : e === "urn" ? `urn:uuid:${n}` : n;
}
function on(u, { resultType: e, intType: t, uuidStyle: n = ue, uuidUpper: r = !1 } = {}) {
  switch (e) {
    case 8:
      return Ie(u);
    case 2: {
      const i = t === 1 ? je(u) : Me(u);
      return i === null ? null : JSON.stringify(i);
    }
    case 64: {
      const i = Ue(u, t === 1);
      return i === null ? null : JSON.stringify(i);
    }
    case 4:
      return $e(u);
    case 16:
      return Ku(u);
  }
  return Re(u, n, r);
}
function qe(u, e) {
  if (typeof u != "string") return null;
  const t = Zu(u);
  try {
    switch (Qu(t)) {
      case 8:
        try {
          return eu(lu(t));
        } catch {
          const r = tu(t);
          return r === null ? null : eu(r);
        }
      case 2: {
        const n = lu(t);
        return (e === 2 ? rn : nn)(n.high, n.low);
      }
      case 64:
        return zt(lu(t));
      case 4:
        return Pe(t);
      case 16:
        return Xt(t);
      default: {
        const n = tu(t);
        return n === null ? null : eu(n);
      }
    }
  } catch {
    return null;
  }
}
var Ve = {
  1: [
    {
      id: ue,
      label: "plain"
    },
    {
      id: "hex",
      label: "hex"
    },
    {
      id: Dn,
      label: "braces"
    },
    {
      id: "urn",
      label: "urn"
    }
  ],
  4: [{
    id: "std",
    label: "standard"
  }, {
    id: "url",
    label: "url-safe"
  }],
  16: [{
    id: "upper",
    label: "ABCDEF"
  }, {
    id: "lower",
    label: "abcdef"
  }],
  8: [
    {
      id: "decimal",
      label: "113, 164"
    },
    {
      id: "hex",
      label: "71 a4"
    },
    {
      id: "chex",
      label: "0x71, 0xa4"
    }
  ],
  2: [{
    id: "object",
    label: "{ high, low }"
  }, {
    id: "pair",
    label: "high;low"
  }],
  64: [{
    id: "object",
    label: "{ w1…w4 }"
  }, {
    id: "quad",
    label: "w1;w2;w3;w4"
  }]
}, an = [...new Set(Object.values(Ve).flat().map((u) => u.id))];
function cn(u) {
  try {
    const e = JSON.parse(u);
    return Array.isArray(e) ? e : null;
  } catch {
    return null;
  }
}
function sn(u, e) {
  const t = new RegExp(`"?${e}"?\\s*:\\s*"?(-?\\d+)"?`).exec(u);
  return t === null ? null : t[1];
}
function Ce(u, e) {
  const t = e.map((n) => sn(u, n));
  return t.every((n) => n !== null) ? t : null;
}
function Ju(u, e, t, n = !1) {
  if (typeof e != "string" || e === "") return e;
  if (u === 1) return Re(e, t ?? "plain", n);
  if (u === 4) return t === "url" ? e.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "") : e;
  if (u === 16) return t === "lower" ? e.toLowerCase() : e.toUpperCase();
  if (u === 8) {
    const r = cn(e);
    if (r === null) return e;
    if (t === "hex") {
      const i = r.map((o) => o.toString(16).padStart(2, "0"));
      return (n ? i.map((o) => o.toUpperCase()) : i).join(" ");
    }
    if (t === "chex") {
      const i = r.map((o) => `0x${o.toString(16).padStart(2, "0")}`);
      return `[${(n ? i.map((o) => o.toUpperCase().replace("0X", "0x")) : i).join(", ")}]`;
    }
    return e;
  }
  if (u === 2 && t === "pair") {
    const r = Ce(e, ["high", "low"]);
    return r === null ? e : r.join(";");
  }
  if (u === 64 && t === "quad") {
    const r = Ce(e, [
      "w1",
      "w2",
      "w3",
      "w4"
    ]);
    return r === null ? e : r.join(";");
  }
  return e;
}
var Yu = {
  uuid: 1,
  base64: 4,
  "high-low": 2,
  bytes: 8,
  ulid: 16,
  hex: 32,
  words: 64
}, Sr = Object.fromEntries(Object.entries(Yu).map(([u, e]) => [e, u])), Gu = {
  signed: 1,
  unsigned: 2
}, br = Object.fromEntries(Object.entries(Gu).map(([u, e]) => [e, u]));
function Fe(u, e) {
  if (typeof u != "string") return null;
  const t = (new URLSearchParams(u.replace(/^#/, "")).get(e) || "").toLowerCase();
  return Object.prototype.hasOwnProperty.call(Gu, t) ? Gu[t] : null;
}
function Ae(u) {
  return Fe(u, "in") ?? Fe(u, "int");
}
function ln(u) {
  if (typeof u != "string") return null;
  const e = (new URLSearchParams(u.replace(/^#/, "")).get("style") || "").toLowerCase();
  return an.includes(e) ? e : null;
}
function fn(u) {
  if (typeof u != "string") return null;
  const e = (new URLSearchParams(u.replace(/^#/, "")).get("to") || "").toLowerCase();
  return Object.prototype.hasOwnProperty.call(Yu, e) ? Yu[e] : null;
}
var Cn = "0123456789ABCDEFGHJKMNPQRSTVWXYZ", Fn = /^[0-9a-f]{32}$/, Ee = 12219292800000n, de = 10000n, An = 864e13;
function wu(u) {
  return !Number.isFinite(u) || u < 0 || u > An ? null : new Date(u).toISOString();
}
function ke(u) {
  if (typeof u != "string" || u.length < 10) return null;
  let e = 0;
  for (const t of u.slice(0, 10).toUpperCase()) {
    const n = Cn.indexOf(t);
    if (n === -1) return null;
    e = e * 32 + n;
  }
  return wu(e);
}
function He(u) {
  const e = String(u).trim().toLowerCase().replace(/^urn:uuid:/, "").replace(/^\{|\}$/g, "").replace(/-/g, "");
  if (!Fn.test(e)) return null;
  switch (parseInt(e[12], 16)) {
    case 1: {
      const t = BigInt("0x" + e.slice(0, 8)), n = BigInt("0x" + e.slice(8, 12)), r = BigInt("0x" + e.slice(13, 16)) << 48n | n << 32n | t;
      return wu(Number(r / de - Ee));
    }
    case 6: {
      const t = BigInt("0x" + e.slice(0, 12)) << 12n | BigInt("0x" + e.slice(13, 16));
      return wu(Number(t / de - Ee));
    }
    case 7:
      return wu(parseInt(e.slice(0, 12), 16));
    default:
      return null;
  }
}
var Je = "ffffffff-ffff-ffff-ffff-ffffffffffff", Ye = "00000000-0000-0000-0000-000000000000", En = /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$/i;
function dn(u) {
  return typeof u == "string" && En.test(u);
}
function zu(u) {
  if (!dn(u)) throw TypeError("Invalid UUID");
  let e;
  return Uint8Array.of((e = parseInt(u.slice(0, 8), 16)) >>> 24, e >>> 16 & 255, e >>> 8 & 255, e & 255, (e = parseInt(u.slice(9, 13), 16)) >>> 8, e & 255, (e = parseInt(u.slice(14, 18), 16)) >>> 8, e & 255, (e = parseInt(u.slice(19, 23), 16)) >>> 8, e & 255, (e = parseInt(u.slice(24, 36), 16)) / 1099511627776 & 255, e / 4294967296 & 255, e >>> 24 & 255, e >>> 16 & 255, e >>> 8 & 255, e & 255);
}
var O = [];
for (let u = 0; u < 256; ++u) O.push((u + 256).toString(16).slice(1));
function fu(u, e = 0) {
  return (O[u[e + 0]] + O[u[e + 1]] + O[u[e + 2]] + O[u[e + 3]] + "-" + O[u[e + 4]] + O[u[e + 5]] + "-" + O[u[e + 6]] + O[u[e + 7]] + "-" + O[u[e + 8]] + O[u[e + 9]] + "-" + O[u[e + 10]] + O[u[e + 11]] + O[u[e + 12]] + O[u[e + 13]] + O[u[e + 14]] + O[u[e + 15]]).toLowerCase();
}
var Bn = /* @__PURE__ */ new Uint8Array(16);
function Bu() {
  return crypto.getRandomValues(Bn);
}
var du = {};
function Ge(u, e, t) {
  let n;
  const r = u?._v6 ?? !1;
  if (u) {
    const i = Object.keys(u);
    i.length === 1 && i[0] === "_v6" && (u = void 0);
  }
  if (u) n = Be(u.random ?? u.rng?.() ?? Bu(), u.msecs, u.nsecs, u.clockseq, u.node, e, t);
  else {
    const i = Date.now(), o = Bu();
    gn(du, i, o), n = Be(o, du.msecs, du.nsecs, r ? void 0 : du.clockseq, r ? void 0 : du.node, e, t);
  }
  return e ?? fu(n);
}
function gn(u, e, t) {
  return u.msecs ??= -1 / 0, u.nsecs ??= 0, e === u.msecs ? (u.nsecs++, u.nsecs >= 1e4 && (u.node = void 0, u.nsecs = 0)) : e > u.msecs ? u.nsecs = 0 : e < u.msecs && (u.node = void 0), u.node || (u.node = t.slice(10, 16), u.node[0] |= 1, u.clockseq = (t[8] << 8 | t[9]) & 16383), u.msecs = e, u;
}
function Be(u, e, t, n, r, i, o = 0) {
  if (u.length < 16) throw new Error("Random bytes length must be >= 16");
  if (!i)
    i = /* @__PURE__ */ new Uint8Array(16), o = 0;
  else if (o < 0 || o + 16 > i.length) throw new RangeError(`UUID byte range ${o}:${o + 15} is out of buffer bounds`);
  e ??= Date.now(), t ??= 0, n ??= (u[8] << 8 | u[9]) & 16383, r ??= u.slice(10, 16), e += 122192928e5;
  const a = ((e & 268435455) * 1e4 + t) % 4294967296;
  i[o++] = a >>> 24 & 255, i[o++] = a >>> 16 & 255, i[o++] = a >>> 8 & 255, i[o++] = a & 255;
  const l = e / 4294967296 * 1e4 & 268435455;
  i[o++] = l >>> 8 & 255, i[o++] = l & 255, i[o++] = l >>> 24 & 15 | 16, i[o++] = l >>> 16 & 255, i[o++] = n >>> 8 | 128, i[o++] = n & 255;
  for (let f = 0; f < 6; ++f) i[o++] = r[f];
  return i;
}
function hn(u) {
  const e = pn(typeof u == "string" ? zu(u) : u);
  return typeof u == "string" ? fu(e) : e;
}
function pn(u) {
  return Uint8Array.of((u[6] & 15) << 4 | u[7] >> 4 & 15, (u[7] & 15) << 4 | (u[4] & 240) >> 4, (u[4] & 15) << 4 | (u[5] & 240) >> 4, (u[5] & 15) << 4 | (u[0] & 240) >> 4, (u[0] & 15) << 4 | (u[1] & 240) >> 4, (u[1] & 15) << 4 | (u[2] & 240) >> 4, 96 | u[2] & 15, u[3], u[8], u[9], u[10], u[11], u[12], u[13], u[14], u[15]);
}
function mn(u) {
  return vn(yn(wn(u), u.length * 8));
}
function vn(u) {
  const e = new Uint8Array(u.length * 4);
  for (let t = 0; t < u.length * 4; t++) e[t] = u[t >> 2] >>> t % 4 * 8 & 255;
  return e;
}
function ze(u) {
  return (u + 64 >>> 9 << 4) + 14 + 1;
}
function yn(u, e) {
  const t = new Uint32Array(ze(e)).fill(0);
  t.set(u), t[e >> 5] |= 128 << e % 32, t[t.length - 1] = e, u = t;
  let n = 1732584193, r = -271733879, i = -1732584194, o = 271733878;
  for (let a = 0; a < u.length; a += 16) {
    const l = n, f = r, A = i, v = o;
    n = T(n, r, i, o, u[a], 7, -680876936), o = T(o, n, r, i, u[a + 1], 12, -389564586), i = T(i, o, n, r, u[a + 2], 17, 606105819), r = T(r, i, o, n, u[a + 3], 22, -1044525330), n = T(n, r, i, o, u[a + 4], 7, -176418897), o = T(o, n, r, i, u[a + 5], 12, 1200080426), i = T(i, o, n, r, u[a + 6], 17, -1473231341), r = T(r, i, o, n, u[a + 7], 22, -45705983), n = T(n, r, i, o, u[a + 8], 7, 1770035416), o = T(o, n, r, i, u[a + 9], 12, -1958414417), i = T(i, o, n, r, u[a + 10], 17, -42063), r = T(r, i, o, n, u[a + 11], 22, -1990404162), n = T(n, r, i, o, u[a + 12], 7, 1804603682), o = T(o, n, r, i, u[a + 13], 12, -40341101), i = T(i, o, n, r, u[a + 14], 17, -1502002290), r = T(r, i, o, n, u[a + 15], 22, 1236535329), n = x(n, r, i, o, u[a + 1], 5, -165796510), o = x(o, n, r, i, u[a + 6], 9, -1069501632), i = x(i, o, n, r, u[a + 11], 14, 643717713), r = x(r, i, o, n, u[a], 20, -373897302), n = x(n, r, i, o, u[a + 5], 5, -701558691), o = x(o, n, r, i, u[a + 10], 9, 38016083), i = x(i, o, n, r, u[a + 15], 14, -660478335), r = x(r, i, o, n, u[a + 4], 20, -405537848), n = x(n, r, i, o, u[a + 9], 5, 568446438), o = x(o, n, r, i, u[a + 14], 9, -1019803690), i = x(i, o, n, r, u[a + 3], 14, -187363961), r = x(r, i, o, n, u[a + 8], 20, 1163531501), n = x(n, r, i, o, u[a + 13], 5, -1444681467), o = x(o, n, r, i, u[a + 2], 9, -51403784), i = x(i, o, n, r, u[a + 7], 14, 1735328473), r = x(r, i, o, n, u[a + 12], 20, -1926607734), n = j(n, r, i, o, u[a + 5], 4, -378558), o = j(o, n, r, i, u[a + 8], 11, -2022574463), i = j(i, o, n, r, u[a + 11], 16, 1839030562), r = j(r, i, o, n, u[a + 14], 23, -35309556), n = j(n, r, i, o, u[a + 1], 4, -1530992060), o = j(o, n, r, i, u[a + 4], 11, 1272893353), i = j(i, o, n, r, u[a + 7], 16, -155497632), r = j(r, i, o, n, u[a + 10], 23, -1094730640), n = j(n, r, i, o, u[a + 13], 4, 681279174), o = j(o, n, r, i, u[a], 11, -358537222), i = j(i, o, n, r, u[a + 3], 16, -722521979), r = j(r, i, o, n, u[a + 6], 23, 76029189), n = j(n, r, i, o, u[a + 9], 4, -640364487), o = j(o, n, r, i, u[a + 12], 11, -421815835), i = j(i, o, n, r, u[a + 15], 16, 530742520), r = j(r, i, o, n, u[a + 2], 23, -995338651), n = M(n, r, i, o, u[a], 6, -198630844), o = M(o, n, r, i, u[a + 7], 10, 1126891415), i = M(i, o, n, r, u[a + 14], 15, -1416354905), r = M(r, i, o, n, u[a + 5], 21, -57434055), n = M(n, r, i, o, u[a + 12], 6, 1700485571), o = M(o, n, r, i, u[a + 3], 10, -1894986606), i = M(i, o, n, r, u[a + 10], 15, -1051523), r = M(r, i, o, n, u[a + 1], 21, -2054922799), n = M(n, r, i, o, u[a + 8], 6, 1873313359), o = M(o, n, r, i, u[a + 15], 10, -30611744), i = M(i, o, n, r, u[a + 6], 15, -1560198380), r = M(r, i, o, n, u[a + 13], 21, 1309151649), n = M(n, r, i, o, u[a + 4], 6, -145523070), o = M(o, n, r, i, u[a + 11], 10, -1120210379), i = M(i, o, n, r, u[a + 2], 15, 718787259), r = M(r, i, o, n, u[a + 9], 21, -343485551), n = uu(n, l), r = uu(r, f), i = uu(i, A), o = uu(o, v);
  }
  return Uint32Array.of(n, r, i, o);
}
function wn(u) {
  if (u.length === 0) return /* @__PURE__ */ new Uint32Array();
  const e = new Uint32Array(ze(u.length * 8)).fill(0);
  for (let t = 0; t < u.length; t++) e[t >> 2] |= (u[t] & 255) << t % 4 * 8;
  return e;
}
function uu(u, e) {
  const t = (u & 65535) + (e & 65535);
  return (u >> 16) + (e >> 16) + (t >> 16) << 16 | t & 65535;
}
function Sn(u, e) {
  return u << e | u >>> 32 - e;
}
function Nu(u, e, t, n, r, i) {
  return uu(Sn(uu(uu(e, u), uu(n, i)), r), t);
}
function T(u, e, t, n, r, i, o) {
  return Nu(e & t | ~e & n, u, e, r, i, o);
}
function x(u, e, t, n, r, i, o) {
  return Nu(e & n | t & ~n, u, e, r, i, o);
}
function j(u, e, t, n, r, i, o) {
  return Nu(e ^ t ^ n, u, e, r, i, o);
}
function M(u, e, t, n, r, i, o) {
  return Nu(t ^ (e | ~n), u, e, r, i, o);
}
function bn(u) {
  u = unescape(encodeURIComponent(u));
  const e = new Uint8Array(u.length);
  for (let t = 0; t < u.length; ++t) e[t] = u.charCodeAt(t);
  return e;
}
var We = "6ba7b810-9dad-11d1-80b4-00c04fd430c8", Xe = "6ba7b811-9dad-11d1-80b4-00c04fd430c8";
function Ke(u, e, t, n, r, i) {
  const o = typeof t == "string" ? bn(t) : t, a = typeof n == "string" ? zu(n) : n;
  if (typeof n == "string" && (n = zu(n)), n?.length !== 16) throw TypeError("Namespace must be array-like (16 iterable integer values, 0-255)");
  let l = new Uint8Array(16 + o.length);
  if (l.set(a), l.set(o, a.length), l = e(l), l[6] = l[6] & 15 | u, l[8] = l[8] & 63 | 128, r) {
    if (i ??= 0, i < 0 || i + 16 > r.length) throw new RangeError(`UUID byte range ${i}:${i + 15} is out of buffer bounds`);
    for (let f = 0; f < 16; ++f) r[i + f] = l[f];
    return r;
  }
  return fu(l);
}
function ee(u, e, t, n) {
  return Ke(48, mn, u, e, t, n);
}
ee.DNS = We;
ee.URL = Xe;
function In(u, e, t) {
  return !e && !u && crypto.randomUUID ? crypto.randomUUID() : _n(u, e, t);
}
function _n(u, e, t) {
  u = u || {};
  const n = u.random ?? u.rng?.() ?? Bu();
  if (n.length < 16) throw new Error("Random bytes length must be >= 16");
  if (n[6] = n[6] & 15 | 64, n[8] = n[8] & 63 | 128, e) {
    if (t = t || 0, t < 0 || t + 16 > e.length) throw new RangeError(`UUID byte range ${t}:${t + 15} is out of buffer bounds`);
    for (let r = 0; r < 16; ++r) e[t + r] = n[r];
    return e;
  }
  return fu(n);
}
function Nn(u, e, t, n) {
  switch (u) {
    case 0:
      return e & t ^ ~e & n;
    case 1:
      return e ^ t ^ n;
    case 2:
      return e & t ^ e & n ^ t & n;
    case 3:
      return e ^ t ^ n;
  }
}
function Vu(u, e) {
  return u << e | u >>> 32 - e;
}
function Pn(u) {
  const e = [
    1518500249,
    1859775393,
    2400959708,
    3395469782
  ], t = [
    1732584193,
    4023233417,
    2562383102,
    271733878,
    3285377520
  ], n = new Uint8Array(u.length + 1);
  n.set(u), n[u.length] = 128, u = n;
  const r = u.length / 4 + 2, i = Math.ceil(r / 16), o = new Array(i);
  for (let a = 0; a < i; ++a) {
    const l = /* @__PURE__ */ new Uint32Array(16);
    for (let f = 0; f < 16; ++f) l[f] = u[a * 64 + f * 4] << 24 | u[a * 64 + f * 4 + 1] << 16 | u[a * 64 + f * 4 + 2] << 8 | u[a * 64 + f * 4 + 3];
    o[a] = l;
  }
  o[i - 1][14] = (u.length - 1) * 8 / 2 ** 32, o[i - 1][14] = Math.floor(o[i - 1][14]), o[i - 1][15] = (u.length - 1) * 8 & 4294967295;
  for (let a = 0; a < i; ++a) {
    const l = /* @__PURE__ */ new Uint32Array(80);
    for (let _ = 0; _ < 16; ++_) l[_] = o[a][_];
    for (let _ = 16; _ < 80; ++_) l[_] = Vu(l[_ - 3] ^ l[_ - 8] ^ l[_ - 14] ^ l[_ - 16], 1);
    let f = t[0], A = t[1], v = t[2], b = t[3], R = t[4];
    for (let _ = 0; _ < 80; ++_) {
      const gu = Math.floor(_ / 20), $u = Vu(f, 5) + Nn(gu, A, v, b) + R + e[gu] + l[_] >>> 0;
      R = b, b = v, v = Vu(A, 30) >>> 0, A = f, f = $u;
    }
    t[0] = t[0] + f >>> 0, t[1] = t[1] + A >>> 0, t[2] = t[2] + v >>> 0, t[3] = t[3] + b >>> 0, t[4] = t[4] + R >>> 0;
  }
  return Uint8Array.of(t[0] >> 24, t[0] >> 16, t[0] >> 8, t[0], t[1] >> 24, t[1] >> 16, t[1] >> 8, t[1], t[2] >> 24, t[2] >> 16, t[2] >> 8, t[2], t[3] >> 24, t[3] >> 16, t[3] >> 8, t[3], t[4] >> 24, t[4] >> 16, t[4] >> 8, t[4]);
}
function te(u, e, t, n) {
  return Ke(80, Pn, u, e, t, n);
}
te.DNS = We;
te.URL = Xe;
function $n(u, e, t) {
  u ??= {}, t ??= 0;
  let n = Ge({
    ...u,
    _v6: !0
  }, /* @__PURE__ */ new Uint8Array(16));
  if (n = hn(n), e) {
    if (t < 0 || t + 16 > e.length) throw new RangeError(`UUID byte range ${t}:${t + 15} is out of buffer bounds`);
    for (let r = 0; r < 16; r++) e[t + r] = n[r];
    return e;
  }
  return fu(n);
}
var ku = {};
function ge(u, e, t) {
  let n;
  if (u) n = he(u.random ?? u.rng?.() ?? Bu(), u.msecs, u.seq, e, t);
  else {
    const r = Date.now(), i = Bu();
    On(ku, r, i), n = he(i, ku.msecs, ku.seq, e, t);
  }
  return e ?? fu(n);
}
function On(u, e, t) {
  return u.msecs ??= -1 / 0, u.seq ??= 0, e > u.msecs ? (u.seq = t[6] << 23 | t[7] << 16 | t[8] << 8 | t[9], u.msecs = e) : (u.seq = u.seq + 1 | 0, u.seq === 0 && u.msecs++), u;
}
function he(u, e, t, n, r = 0) {
  if (u.length < 16) throw new Error("Random bytes length must be >= 16");
  if (!n)
    n = /* @__PURE__ */ new Uint8Array(16), r = 0;
  else if (r < 0 || r + 16 > n.length) throw new RangeError(`UUID byte range ${r}:${r + 15} is out of buffer bounds`);
  return e ??= Date.now(), t ??= u[6] * 127 << 24 | u[7] << 16 | u[8] << 8 | u[9], n[r++] = e / 1099511627776 & 255, n[r++] = e / 4294967296 & 255, n[r++] = e / 16777216 & 255, n[r++] = e / 65536 & 255, n[r++] = e / 256 & 255, n[r++] = e & 255, n[r++] = 112 | t >>> 28 & 15, n[r++] = t >>> 20 & 255, n[r++] = 128 | t >>> 14 & 63, n[r++] = t >>> 6 & 255, n[r++] = t << 2 & 255 | u[10] & 3, n[r++] = u[11], n[r++] = u[12], n[r++] = u[13], n[r++] = u[14], n[r++] = u[15], n;
}
var Un = /"(-?\d+)"/g;
function Wu(u) {
  return u === null ? null : JSON.stringify(u).replace(Un, "$1");
}
function Ln(u) {
  return {
    1: u,
    4: $e(u),
    16: Ku(u),
    8: Ie(u),
    2: Wu(je(u)),
    64: Wu(Ue(u, !0))
  };
}
function Ze(u) {
  if (typeof u != "string" || u === "") return [];
  const e = Ln(u), t = [Xu(u), Wu(Me(u))];
  for (const [n, r] of Object.entries(e))
    if (r)
      for (const i of Ve[n] || [])
        t.push(Ju(Number(n), r, i.id, !1)), t.push(Ju(Number(n), r, i.id, !0));
  return [...new Set(t.filter(Boolean).map((n) => n.toLowerCase()))];
}
var Tn = new Set(Ze(Ye)), xn = new Set(Ze(Je)), Qe = [
  "deadbeef",
  "cafebabe",
  "feedface",
  "deadc0de",
  "badc0ffe",
  "8badf00d"
], jn = new Map(Qe.map((u) => [u.repeat(4), u]));
function Mn(u) {
  for (let e = 0, t = u.length - 1; e < t; e++, t--) if (u[e] !== u[t]) return !1;
  return !0;
}
var Rn = /* @__PURE__ */ new Set([
  "8",
  "9",
  "a",
  "b"
]);
function qn(u) {
  const e = parseInt(u[12], 16);
  return !(e >= 1 && e <= 8) || !Rn.has(u[16]);
}
var Vn = 31536e6;
function kn(u) {
  const e = He(u) || (_u(u) ? ke(u) : null);
  if (e === null) return !1;
  const t = Date.parse(e);
  return t > Date.now() + Vn || t < Date.parse("1971-01-01T00:00:00Z");
}
function Hn(u) {
  if (typeof u != "string") return [];
  const e = u.trim().toLowerCase(), t = [];
  Tn.has(e) ? t.push("nil", "palindrome") : xn.has(e) && t.push("max", "palindrome");
  const n = Xu(e);
  if (n === null) return t;
  t.length === 0 && /^0{32}$/.test(n) ? t.push("nil", "palindrome") : t.length === 0 && /^f{32}$/i.test(n) && t.push("max", "palindrome");
  const r = jn.get(n);
  return r && t.push(r), !t.includes("palindrome") && Mn(n) && t.push("palindrome"), t.includes("nil") || t.includes("max") || (qn(n) && t.push("non-rfc"), kn(e) && t.push("time traveler")), t;
}
function Jn(u) {
  return Qe.includes(u) ? Iu(u.repeat(4)) : null;
}
function Yn() {
  const u = /* @__PURE__ */ new Uint8Array(16);
  crypto.getRandomValues(u);
  let e = "";
  for (const t of u) e += "0123456789abcdef"[t & 15];
  return Iu(e + [...e].reverse().join(""));
}
function Gn(u) {
  const e = [[
    48,
    51,
    "version",
    "version"
  ], [
    64,
    65,
    "variant",
    "variant"
  ]];
  switch (u) {
    case 1:
      return [
        [
          0,
          31,
          "time",
          "time_low"
        ],
        [
          32,
          47,
          "time",
          "time_mid"
        ],
        ...e,
        [
          52,
          63,
          "time",
          "time_high"
        ],
        [
          66,
          79,
          "clock",
          "clock_seq"
        ],
        [
          80,
          127,
          "node",
          "node"
        ]
      ];
    case 2:
      return [
        [
          0,
          31,
          "clock",
          "local_id"
        ],
        [
          32,
          47,
          "time",
          "time_mid"
        ],
        ...e,
        [
          52,
          63,
          "time",
          "time_high"
        ],
        [
          66,
          71,
          "clock",
          "clock_seq_hi"
        ],
        [
          72,
          79,
          "clock",
          "local_domain"
        ],
        [
          80,
          127,
          "node",
          "node"
        ]
      ];
    case 6:
      return [
        [
          0,
          31,
          "time",
          "time_high"
        ],
        [
          32,
          47,
          "time",
          "time_mid"
        ],
        ...e,
        [
          52,
          63,
          "time",
          "time_low"
        ],
        [
          66,
          79,
          "clock",
          "clock_seq"
        ],
        [
          80,
          127,
          "node",
          "node"
        ]
      ];
    case 7:
      return [
        [
          0,
          47,
          "time",
          "unix_ts_ms"
        ],
        ...e,
        [
          52,
          63,
          "random",
          "rand_a"
        ],
        [
          66,
          127,
          "random",
          "rand_b"
        ]
      ];
    case 3:
      return [
        [
          0,
          47,
          "hash",
          "md5_high"
        ],
        ...e,
        [
          52,
          63,
          "hash",
          "md5_mid"
        ],
        [
          66,
          127,
          "hash",
          "md5_low"
        ]
      ];
    case 5:
      return [
        [
          0,
          47,
          "hash",
          "sha1_high"
        ],
        ...e,
        [
          52,
          63,
          "hash",
          "sha1_mid"
        ],
        [
          66,
          127,
          "hash",
          "sha1_low"
        ]
      ];
    case 8:
      return [
        [
          0,
          47,
          "random",
          "custom_a"
        ],
        ...e,
        [
          52,
          63,
          "random",
          "custom_b"
        ],
        [
          66,
          127,
          "random",
          "custom_c"
        ]
      ];
    default:
      return [
        [
          0,
          47,
          "random",
          "random"
        ],
        ...e,
        [
          52,
          63,
          "random",
          "random"
        ],
        [
          66,
          127,
          "random",
          "random"
        ]
      ];
  }
}
function zn(u) {
  const e = parseInt(u[16], 16);
  return e < 8 ? "NCS (0xxx) — reserved, backward compatibility" : e < 12 ? "RFC 9562 (10xx)" : e < 14 ? "Microsoft (110x) — reserved, backward compatibility" : "reserved for the future (111x)";
}
var Wn = /"(-?\d+)"/g;
function Xn(u) {
  if (typeof u != "string") return null;
  let e = Zu(u);
  try {
    switch (Qu(e)) {
      case 8: {
        const r = lu(e);
        return !Array.isArray(r) || r.length !== 16 || r.some((i) => !Number.isInteger(i) || i < 0 || i > 255) ? null : JSON.stringify(r);
      }
      case 2:
      case 64:
        return JSON.stringify(lu(e)).replace(/,$/g, "").replace(Wn, "$1");
      case 4:
        return Ne(e);
      case 16:
        return e;
    }
  } catch {
    return null;
  }
  e[0] === "{" && e[e.length - 1] === "}" && (e = e.substring(1, e.length - 1));
  const t = Iu(e);
  if (t.length === 36) return t;
  const n = tu(e);
  return n === null ? null : eu(n);
}
function ut(u) {
  if (typeof u != "string") return -1;
  const e = u.indexOf("#");
  let t = -1;
  for (let n = u.indexOf("//"); n !== -1; n = u.indexOf("//", n + 1)) if (n === 0 || /\s/.test(u[n - 1])) {
    t = n;
    break;
  }
  return e === -1 ? t : t === -1 ? e : Math.min(e, t);
}
function Kn(u) {
  const e = ut(u);
  return e === -1 ? u : u.slice(0, e);
}
function Zn(u) {
  const e = ut(u);
  return e === -1 ? null : u.slice(e + (u[e] === "#" ? 1 : 2)).trim();
}
var pe = {
  dns: "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
  url: "6ba7b811-9dad-11d1-80b4-00c04fd430c8",
  oid: "6ba7b812-9dad-11d1-80b4-00c04fd430c8",
  x500: "6ba7b814-9dad-11d1-80b4-00c04fd430c8"
};
function et(u) {
  if (typeof u != "string") return pe.dns;
  const e = pe[u.toLowerCase()];
  return e || (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(u.trim()) ? u.trim().toLowerCase() : null);
}
function tt(u, e, t) {
  const n = et(e);
  if (n === null || typeof t != "string" || t === "") return null;
  try {
    return u === 3 ? ee(t, n) : te(t, n);
  } catch {
    return null;
  }
}
var ne = 256, me = new Uint32Array(ne), Hu = ne;
function Qn() {
  return Hu >= ne && (crypto.getRandomValues(me), Hu = 0), me[Hu++] / 4294967296;
}
function ur(u) {
  return u > 0 ? Math.floor(Qn() * u) : 0;
}
function er() {
  const u = Array.from({ length: 16 }, () => ur(256));
  u[6] = u[6] & 15 | 128, u[8] = u[8] & 63 | 128;
  const e = u.map((t) => t.toString(16).padStart(2, "0")).join("");
  return `${e.slice(0, 8)}-${e.slice(8, 12)}-${e.slice(12, 16)}-${e.slice(16, 20)}-${e.slice(20)}`;
}
var tr = [
  "v1",
  "v6",
  "v7",
  "ulid"
];
function nr(u) {
  return tr.includes(u);
}
function rr(u) {
  if (typeof u != "string" || u.trim() === "") return {};
  const e = Date.parse(u);
  return Number.isFinite(e) ? { msecs: e } : {};
}
function ir(u) {
  const e = (t, n = 2) => String(t).padStart(n, "0");
  return `${u.getFullYear()}-${e(u.getMonth() + 1)}-${e(u.getDate())}T${e(u.getHours())}:${e(u.getMinutes())}:${e(u.getSeconds())}.${e(u.getMilliseconds(), 3)}`;
}
function Dr(u) {
  const e = fn(`#to=${u}`);
  if (e === null) throw new Error(`unknown format: ${u}`);
  return e;
}
function nt(u, e = {}) {
  const t = qe(u, e.int === void 0 ? void 0 : Ae(`#in=${e.int}`));
  if (t === null) return null;
  const n = Dr(e.to ?? "uuid"), r = on(t, {
    resultType: n,
    intType: e.int === void 0 ? void 0 : Ae(`#in=${e.int}`),
    uuidStyle: e.style === void 0 ? void 0 : ln(`#style=${e.style}`),
    uuidUpper: e.upper === !0
  });
  return r === null ? null : n === 1 ? r : Ju(n, Xn(r), e.style, e.upper === !0);
}
function rt(u) {
  const e = Te()[Qu(u)] ?? null;
  if (e === null) return null;
  const t = qe(u), n = t === null ? null : Xu(t), r = n === null ? null : parseInt(n[12], 16);
  return {
    format: e,
    uuid: t,
    variant: n === null ? null : zn(n),
    version: r !== null && r >= 1 && r <= 8 ? r : null,
    special: Hn(t ?? u),
    at: t === null ? null : He(t) ?? (_u(u.trim()) ? ke(u.trim()) : null)
  };
}
var or = [
  "v1",
  "v3",
  "v4",
  "v5",
  "v6",
  "v7",
  "v8",
  "nil",
  "max",
  "ulid",
  "deadbeef",
  "cafebabe",
  "palindrome"
];
function Pu(u = "v4", e = {}) {
  if (!or.includes(u)) return null;
  const t = nr(u) ? rr(e.moment ?? "") : {};
  switch (u) {
    case "v1":
      return Ge(t);
    case "v6":
      return $n(t);
    case "v7":
      return ge(t);
    case "ulid":
      return Ku(ge(t));
    case "v3":
    case "v5":
      return tt(u === "v3" ? 3 : 5, e.namespace ?? "dns", e.name ?? "");
    case "v8":
      return er();
    case "nil":
      return Ye;
    case "max":
      return Je;
    case "palindrome":
      return Yn();
    case "deadbeef":
    case "cafebabe":
      return Jn(u);
    default:
      return In();
  }
}
function Ir(u) {
  return et(u);
}
function ar(u, e = {}) {
  return String(u).split(`
`).map((t) => t.trim()).filter((t) => t !== "").map((t) => {
    const n = Kn(t).trim(), r = Zn(t), i = n === "" ? null : nt(n, e);
    return {
      input: n,
      comment: r,
      output: i,
      ok: i !== null
    };
  });
}
function cr(u, e = 122) {
  const t = 2 ** e, n = Number(u);
  return !Number.isFinite(n) || n <= 1 ? 0 : 1 - Math.exp(-(n * (n - 1)) / (2 * t));
}
function sr(u, e = 122) {
  const t = 2 ** e, n = Number(u);
  return !Number.isFinite(n) || n <= 0 || n >= 1 ? 1 / 0 : Math.sqrt(2 * t * Math.log(1 / (1 - n)));
}
function _r(u, e, t) {
  return tt(u, e, t);
}
var Nr = Te().reduce((u, e) => u.concat([e]), []);
function lr(u, e) {
  return u.find(([t, n]) => e >= t && e <= n) || null;
}
function fr(u, e, t, n) {
  const r = BigInt(`0x${u}`), i = t - e + 1, o = r >> BigInt(127 - t) & (1n << BigInt(i)) - 1n, a = Math.ceil(i / 4), l = [`0x${o.toString(16).padStart(a, "0")}`];
  return o <= 9007199254740991n && l.push(o.toString()), i <= 8 && l.push(o.toString(2).padStart(i, "0")), `${n} · bits ${e}-${t} · ${l.join("  ·  ")}`;
}
function Cr(u) {
  const e = u.querySelector(".doc-play-input"), t = u.querySelector(".doc-play-out code"), n = u.querySelector(".doc-play-note"), r = [...u.querySelectorAll(".doc-play-chip")];
  let i = u.dataset.to || "uuid";
  const o = u.dataset.int || void 0;
  function a() {
    const l = e.value.trim();
    if (l === "") {
      t.textContent = "", n.textContent = "Paste an identifier, or take a fresh one.";
      return;
    }
    const f = nt(l, {
      to: i,
      int: o
    });
    if (f === null) {
      t.textContent = "", n.textContent = "Not an identifier this tool reads.";
      return;
    }
    t.textContent = f;
    const A = rt(l);
    n.textContent = A === null || A.version === null ? `read as ${A === null ? "an identifier" : A.format}` : `read as ${A.format}, version ${A.version}${A.at === null ? "" : `, made ${A.at}`}`;
  }
  e.addEventListener("input", a);
  for (const l of r) l.addEventListener("click", () => {
    i = l.dataset.format;
    for (const f of r)
      f.classList.toggle("is-on", f === l), f.setAttribute("aria-pressed", String(f === l));
    a();
  });
  for (const l of u.querySelectorAll("[data-fill]")) l.addEventListener("click", () => {
    e.value = Pu(l.dataset.fill), a();
  });
  u.hidden = !1, a();
}
function Fr(u) {
  const e = [...u.querySelectorAll(".report-char")], t = [...u.querySelectorAll(".report-bit")], n = [...u.querySelectorAll(".report-run")], r = u.querySelector(".doc-reading");
  if (e.length !== 32 || r === null) return;
  const i = e.map((f) => f.textContent).join(""), o = parseInt(i[12], 16), a = o >= 1 && o <= 8 ? Gn(o) : [[
    0,
    127,
    "random",
    "no fields"
  ]];
  function l(f, A, v) {
    e.forEach((b, R) => b.classList.toggle("is-picked", R * 4 >= f && R * 4 <= A)), t.forEach((b, R) => b.classList.toggle("is-picked", R >= f && R <= A)), n.forEach((b) => b.classList.toggle("is-picked", b.textContent === v)), r.textContent = fr(i, f, A, v);
  }
  e.forEach((f, A) => {
    const v = lr(a, A * 4);
    v !== null && (f.setAttribute("tabindex", "0"), f.setAttribute("role", "button"), f.addEventListener("click", () => l(v[0], v[1], v[3])), f.addEventListener("mouseenter", () => l(v[0], v[1], v[3])), f.addEventListener("keydown", (b) => {
      (b.key === "Enter" || b.key === " ") && (b.preventDefault(), l(v[0], v[1], v[3]));
    }));
  });
  for (const f of n) {
    const A = a.find(([, , , v]) => v === f.textContent);
    A !== void 0 && f.addEventListener("click", () => l(A[0], A[1], A[3]));
  }
  u.classList.add("is-live"), r.textContent = "Point at a character to read its field.";
}
function Ar(u) {
  const e = u.querySelector("#gen-type"), t = u.querySelector("#gen-moment"), n = u.querySelector("#gen-space"), r = n.closest(".doc-play-pick"), i = u.querySelector("#gen-name"), o = u.querySelector(".doc-play-out code"), a = u.querySelector(".doc-play-note"), l = [
    "v1",
    "v6",
    "v7",
    "ulid"
  ], f = ["v3", "v5"];
  function A() {
    const v = e.value;
    t.hidden = !l.includes(v), r.hidden = !f.includes(v), i.hidden = !f.includes(v);
    const b = Pu(v, {
      moment: t.value,
      namespace: n.value,
      name: i.value
    });
    if (b === null) {
      o.textContent = "", a.textContent = "A name is needed for v3 and v5.";
      return;
    }
    o.textContent = b;
    const R = rt(b);
    a.textContent = R === null || R.at === null ? `${v}, fresh from this page` : `${v}, carrying ${R.at}`;
  }
  e.addEventListener("change", A), t.addEventListener("input", A), n.addEventListener("change", A), i.addEventListener("input", A), u.querySelector("[data-again]").addEventListener("click", A), u.hidden = !1, A();
}
function Er(u) {
  const e = u.querySelector(".doc-play-input"), t = u.querySelector(".doc-play-lines code"), n = u.querySelector(".doc-play-note"), r = [...u.querySelectorAll(".doc-play-chip")];
  let i = "uuid";
  function o() {
    const l = ar(e.value, { to: i });
    t.textContent = l.map((A) => {
      const v = A.ok ? A.output : `${A.input}  ← not an identifier`;
      return A.comment ? `${v}  # ${A.comment}` : v;
    }).join(`
`);
    const f = l.filter((A) => !A.ok).length;
    n.textContent = l.length === 0 ? "Paste a column of identifiers." : `${l.length} line${l.length === 1 ? "" : "s"}, ${f} unread`;
  }
  e.addEventListener("input", o);
  for (const l of r) l.addEventListener("click", () => {
    i = l.dataset.format;
    for (const f of r)
      f.classList.toggle("is-on", f === l), f.setAttribute("aria-pressed", String(f === l));
    o();
  });
  const a = u.querySelector("[data-fill-many]");
  a.addEventListener("click", () => {
    const l = Number(a.dataset.fillMany);
    e.value = Array.from({ length: l }, () => Pu("v7")).join(`
`), o();
  }), u.hidden = !1, o();
}
function ve(u) {
  const e = Number(String(u).replace(/[\s_]/g, ""));
  return Number.isFinite(e) ? e : null;
}
function dr(u) {
  return u >= 1e6 ? u.toExponential(2).replace("e+", " × 10^") : Math.round(u).toLocaleString("en-US");
}
function Br(u) {
  const e = u.querySelector("#odds-count"), t = u.querySelector("#odds-target"), n = u.querySelector(".doc-play-out code"), r = u.querySelector(".doc-play-out.is-second code"), i = u.querySelector(".doc-play-note");
  function o() {
    const a = ve(e.value), l = ve(t.value);
    n.textContent = a === null ? "—" : `${cr(a).toExponential(3)} chance that any two match`, r.textContent = l === null || l <= 0 || l >= 1 ? "—" : `${dr(sr(l))} identifiers`, i.textContent = "Over the 122 random bits of a v4. A generator with a broken random source beats every number here.";
  }
  e.addEventListener("input", o), t.addEventListener("input", o), u.hidden = !1, o();
}
function gr(u) {
  const e = {
    v4: u.querySelector('[data-list="v4"]'),
    v7: u.querySelector('[data-list="v7"]')
  }, t = u.querySelector(".doc-play-note");
  function n() {
    const r = Date.now() - 1e3;
    for (const i of ["v4", "v7"]) {
      const o = Array.from({ length: 5 }, (f, A) => Pu(i, { moment: ir(new Date(r + A * 250)) })), a = new Map(o.map((f, A) => [f, A + 1])), l = [...o].sort();
      e[i].innerHTML = "";
      for (const f of l) {
        const A = document.createElement("li");
        A.textContent = `${f}  (made ${a.get(f)})`, A.className = a.get(f) === l.indexOf(f) + 1 ? "is-kept" : "is-moved", e[i].appendChild(A);
      }
    }
    t.textContent = "Five of each, made a quarter of a second apart, then sorted as text. The number in brackets is the order they were made in: v7 keeps it, v4 does not. Inside a single millisecond even v7 depends on its generator spending rand_a on a counter.";
  }
  u.querySelector("[data-again]").addEventListener("click", n), u.hidden = !1, n();
}
var hr = {
  generate: Ar,
  bulk: Er,
  collision: Br,
  sort: gr
};
function ye() {
  for (const u of document.querySelectorAll("[data-widget]")) {
    const e = hr[u.dataset.widget];
    e !== void 0 && e(u);
  }
  for (const u of document.querySelectorAll("[data-play]")) Cr(u);
  for (const u of document.querySelectorAll(".doc-specimen")) Fr(u);
}
document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", ye) : ye();
export {
  Nr as FORMATS,
  or as GENERATORS,
  sr as collisionCount,
  cr as collisionOdds,
  nt as convert,
  ar as convertMany,
  _r as derive,
  rt as detect,
  Pu as generate,
  Ir as namespaceId
};
