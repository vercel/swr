let e = {data: ""}, t = (t2) => typeof window == "object" ? ((t2 ? t2.querySelector("#_goober") : window._goober) || Object.assign((t2 || document.head).appendChild(document.createElement("style")), {innerHTML: " ", id: "_goober"})).firstChild : t2 || e, r = (e2) => {
  let r2 = t(e2), l2 = r2.data;
  return r2.data = "", l2;
}, l = /(?:([\u0080-\uFFFF\w-%@]+) *:? *([^{;]+?);|([^;}{]*?) *{)|(}\s*)/g, a = /\/\*[^]*?\*\/|\s\s+|\n/g, n = (e2, t2) => {
  let r2 = "", l2 = "", a2 = "";
  for (let o2 in e2) {
    let s2 = e2[o2];
    o2[0] == "@" ? o2[1] == "i" ? r2 = o2 + " " + s2 + ";" : l2 += o2[1] == "f" ? n(s2, o2) : o2 + "{" + n(s2, o2[1] == "k" ? "" : t2) + "}" : typeof s2 == "object" ? l2 += n(s2, t2 ? t2.replace(/([^,])+/g, (e3) => o2.replace(/(^:.*)|([^,])+/g, (t3) => /&/.test(t3) ? t3.replace(/&/g, e3) : e3 ? e3 + " " + t3 : t3)) : o2) : s2 != null && (o2 = o2.replace(/[A-Z]/g, "-$&").toLowerCase(), a2 += n.p ? n.p(o2, s2) : o2 + ":" + s2 + ";");
  }
  return r2 + (t2 && a2 ? t2 + "{" + a2 + "}" : a2) + l2;
}, o = {}, s = (e2) => {
  if (typeof e2 == "object") {
    let t2 = "";
    for (let r2 in e2)
      t2 += r2 + s(e2[r2]);
    return t2;
  }
  return e2;
}, c = (e2, t2, r2, c2, i2) => {
  let u2 = s(e2), p2 = o[u2] || (o[u2] = ((e3) => {
    let t3 = 0, r3 = 11;
    for (; t3 < e3.length; )
      r3 = 101 * r3 + e3.charCodeAt(t3++) >>> 0;
    return "go" + r3;
  })(u2));
  if (!o[p2]) {
    let t3 = u2 !== e2 ? e2 : ((e3) => {
      let t4, r3 = [{}];
      for (; t4 = l.exec(e3.replace(a, "")); )
        t4[4] ? r3.shift() : t4[3] ? r3.unshift(r3[0][t4[3]] = r3[0][t4[3]] || {}) : r3[0][t4[1]] = t4[2];
      return r3[0];
    })(e2);
    o[p2] = n(i2 ? {["@keyframes " + p2]: t3} : t3, r2 ? "" : "." + p2);
  }
  return ((e3, t3, r3) => {
    t3.data.indexOf(e3) == -1 && (t3.data = r3 ? e3 + t3.data : t3.data + e3);
  })(o[p2], t2, c2), p2;
}, i = (e2, t2, r2) => e2.reduce((e3, l2, a2) => {
  let o2 = t2[a2];
  if (o2 && o2.call) {
    let e4 = o2(r2), t3 = e4 && e4.props && e4.props.className || /^go/.test(e4) && e4;
    o2 = t3 ? "." + t3 : e4 && typeof e4 == "object" ? e4.props ? "" : n(e4, "") : e4 === false ? "" : e4;
  }
  return e3 + l2 + (o2 == null ? "" : o2);
}, "");
function u(e2) {
  let r2 = this || {}, l2 = e2.call ? e2(r2.p) : e2;
  return c(l2.unshift ? l2.raw ? i(l2, [].slice.call(arguments, 1), r2.p) : l2.reduce((e3, t2) => Object.assign(e3, t2 && t2.call ? t2(r2.p) : t2), {}) : l2, t(r2.target), r2.g, r2.o, r2.k);
}
let p, d, f, g = u.bind({g: 1}), b = u.bind({k: 1});
function h(e2, t2, r2, l2) {
  n.p = t2, p = e2, d = r2, f = l2;
}
function m(e2, t2) {
  let r2 = this || {};
  return function() {
    let l2 = arguments;
    function a2(n2, o2) {
      let s2 = Object.assign({}, n2), c2 = s2.className || a2.className;
      r2.p = Object.assign({theme: d && d()}, s2), r2.o = / *go\d+/.test(c2), s2.className = u.apply(r2, l2) + (c2 ? " " + c2 : ""), t2 && (s2.ref = o2);
      let i2 = e2;
      return e2[0] && (i2 = s2.as || e2, delete s2.as), f && i2[0] && f(s2), p(i2, s2);
    }
    return t2 ? t2(a2) : a2;
  };
}
export {u as css, r as extractCss, g as glob, b as keyframes, h as setup, m as styled};
export default null;
