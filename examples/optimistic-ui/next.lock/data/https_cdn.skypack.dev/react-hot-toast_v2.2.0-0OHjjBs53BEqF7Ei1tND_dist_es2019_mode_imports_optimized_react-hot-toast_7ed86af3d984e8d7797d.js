import __commonjs_module0 from "/-/react@v17.0.1-yH0aYV1FOvoIPeKBbHxg/dist=es2019,mode=imports/optimized/react.js";
const {useState} = __commonjs_module0;
const {useEffect} = __commonjs_module0;
const {useMemo} = __commonjs_module0;
const {createElement} = __commonjs_module0;
const {memo} = __commonjs_module0;
const {Fragment} = __commonjs_module0;
const {forwardRef} = __commonjs_module0;
;
import {styled, keyframes, setup, css} from "/-/goober@v2.1.7-lQI24z4FeLOgHLSq5jIX/dist=es2019,mode=imports/optimized/goober.js";
function _extends() {
  _extends = Object.assign || function(target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i];
      for (var key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          target[key] = source[key];
        }
      }
    }
    return target;
  };
  return _extends.apply(this, arguments);
}
function _taggedTemplateLiteralLoose(strings, raw) {
  if (!raw) {
    raw = strings.slice(0);
  }
  strings.raw = raw;
  return strings;
}
var isFunction = function isFunction2(valOrFunction) {
  return typeof valOrFunction === "function";
};
var resolveValue = function resolveValue2(valOrFunction, arg) {
  return isFunction(valOrFunction) ? valOrFunction(arg) : valOrFunction;
};
var genId = /* @__PURE__ */ function() {
  var count = 0;
  return function() {
    return (++count).toString();
  };
}();
var createRectRef = function createRectRef2(onRect) {
  return function(el) {
    if (el) {
      setTimeout(function() {
        var boundingRect = el.getBoundingClientRect();
        onRect(boundingRect);
      });
    }
  };
};
var prefersReducedMotion = /* @__PURE__ */ function() {
  var shouldReduceMotion = void 0;
  return function() {
    if (shouldReduceMotion === void 0 && typeof window !== "undefined") {
      var mediaQuery = matchMedia("(prefers-reduced-motion: reduce)");
      shouldReduceMotion = !mediaQuery || mediaQuery.matches;
    }
    return shouldReduceMotion;
  };
}();
var TOAST_LIMIT = 20;
var ActionType;
(function(ActionType2) {
  ActionType2[ActionType2["ADD_TOAST"] = 0] = "ADD_TOAST";
  ActionType2[ActionType2["UPDATE_TOAST"] = 1] = "UPDATE_TOAST";
  ActionType2[ActionType2["UPSERT_TOAST"] = 2] = "UPSERT_TOAST";
  ActionType2[ActionType2["DISMISS_TOAST"] = 3] = "DISMISS_TOAST";
  ActionType2[ActionType2["REMOVE_TOAST"] = 4] = "REMOVE_TOAST";
  ActionType2[ActionType2["START_PAUSE"] = 5] = "START_PAUSE";
  ActionType2[ActionType2["END_PAUSE"] = 6] = "END_PAUSE";
})(ActionType || (ActionType = {}));
var toastTimeouts = /* @__PURE__ */ new Map();
var addToRemoveQueue = function addToRemoveQueue2(toastId) {
  if (toastTimeouts.has(toastId)) {
    return;
  }
  var timeout = setTimeout(function() {
    toastTimeouts["delete"](toastId);
    dispatch({
      type: ActionType.REMOVE_TOAST,
      toastId
    });
  }, 1e3);
  toastTimeouts.set(toastId, timeout);
};
var clearFromRemoveQueue = function clearFromRemoveQueue2(toastId) {
  var timeout = toastTimeouts.get(toastId);
  if (timeout) {
    clearTimeout(timeout);
  }
};
var reducer = function reducer2(state, action) {
  switch (action.type) {
    case ActionType.ADD_TOAST:
      return _extends({}, state, {
        toasts: [action.toast].concat(state.toasts).slice(0, TOAST_LIMIT)
      });
    case ActionType.UPDATE_TOAST:
      if (action.toast.id) {
        clearFromRemoveQueue(action.toast.id);
      }
      return _extends({}, state, {
        toasts: state.toasts.map(function(t) {
          return t.id === action.toast.id ? _extends({}, t, action.toast) : t;
        })
      });
    case ActionType.UPSERT_TOAST:
      var toast3 = action.toast;
      return state.toasts.find(function(t) {
        return t.id === toast3.id;
      }) ? reducer2(state, {
        type: ActionType.UPDATE_TOAST,
        toast: toast3
      }) : reducer2(state, {
        type: ActionType.ADD_TOAST,
        toast: toast3
      });
    case ActionType.DISMISS_TOAST:
      var toastId = action.toastId;
      if (toastId) {
        addToRemoveQueue(toastId);
      } else {
        state.toasts.forEach(function(toast4) {
          addToRemoveQueue(toast4.id);
        });
      }
      return _extends({}, state, {
        toasts: state.toasts.map(function(t) {
          return t.id === toastId || toastId === void 0 ? _extends({}, t, {
            visible: false
          }) : t;
        })
      });
    case ActionType.REMOVE_TOAST:
      if (action.toastId === void 0) {
        return _extends({}, state, {
          toasts: []
        });
      }
      return _extends({}, state, {
        toasts: state.toasts.filter(function(t) {
          return t.id !== action.toastId;
        })
      });
    case ActionType.START_PAUSE:
      return _extends({}, state, {
        pausedAt: action.time
      });
    case ActionType.END_PAUSE:
      var diff = action.time - (state.pausedAt || 0);
      return _extends({}, state, {
        pausedAt: void 0,
        toasts: state.toasts.map(function(t) {
          return _extends({}, t, {
            pauseDuration: t.pauseDuration + diff
          });
        })
      });
  }
};
var listeners = [];
var memoryState = {
  toasts: [],
  pausedAt: void 0
};
var dispatch = function dispatch2(action) {
  memoryState = reducer(memoryState, action);
  listeners.forEach(function(listener) {
    listener(memoryState);
  });
};
var defaultTimeouts = {
  blank: 4e3,
  error: 4e3,
  success: 2e3,
  loading: Infinity,
  custom: 4e3
};
var useStore = function useStore2(toastOptions) {
  if (toastOptions === void 0) {
    toastOptions = {};
  }
  var _useState = useState(memoryState), state = _useState[0], setState = _useState[1];
  useEffect(function() {
    listeners.push(setState);
    return function() {
      var index = listeners.indexOf(setState);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, [state]);
  var mergedToasts = state.toasts.map(function(t) {
    var _toastOptions$t$type, _toastOptions, _toastOptions$t$type2;
    return _extends({}, toastOptions, toastOptions[t.type], t, {
      duration: t.duration || ((_toastOptions$t$type = toastOptions[t.type]) == null ? void 0 : _toastOptions$t$type.duration) || ((_toastOptions = toastOptions) == null ? void 0 : _toastOptions.duration) || defaultTimeouts[t.type],
      style: _extends({}, toastOptions.style, (_toastOptions$t$type2 = toastOptions[t.type]) == null ? void 0 : _toastOptions$t$type2.style, t.style)
    });
  });
  return _extends({}, state, {
    toasts: mergedToasts
  });
};
var createToast = function createToast2(message, type, opts) {
  if (type === void 0) {
    type = "blank";
  }
  return _extends({
    createdAt: Date.now(),
    visible: true,
    type,
    ariaProps: {
      role: "status",
      "aria-live": "polite"
    },
    message,
    pauseDuration: 0
  }, opts, {
    id: (opts == null ? void 0 : opts.id) || genId()
  });
};
var createHandler = function createHandler2(type) {
  return function(message, options) {
    var toast3 = createToast(message, type, options);
    dispatch({
      type: ActionType.UPSERT_TOAST,
      toast: toast3
    });
    return toast3.id;
  };
};
var toast = function toast2(message, opts) {
  return createHandler("blank")(message, opts);
};
toast.error = /* @__PURE__ */ createHandler("error");
toast.success = /* @__PURE__ */ createHandler("success");
toast.loading = /* @__PURE__ */ createHandler("loading");
toast.custom = /* @__PURE__ */ createHandler("custom");
toast.dismiss = function(toastId) {
  dispatch({
    type: ActionType.DISMISS_TOAST,
    toastId
  });
};
toast.remove = function(toastId) {
  return dispatch({
    type: ActionType.REMOVE_TOAST,
    toastId
  });
};
toast.promise = function(promise, msgs, opts) {
  var id = toast.loading(msgs.loading, _extends({}, opts, opts == null ? void 0 : opts.loading));
  promise.then(function(p) {
    toast.success(resolveValue(msgs.success, p), _extends({
      id
    }, opts, opts == null ? void 0 : opts.success));
    return p;
  })["catch"](function(e) {
    toast.error(resolveValue(msgs.error, e), _extends({
      id
    }, opts, opts == null ? void 0 : opts.error));
  });
  return promise;
};
var useToaster = function useToaster2(toastOptions) {
  var _useStore = useStore(toastOptions), toasts = _useStore.toasts, pausedAt = _useStore.pausedAt;
  useEffect(function() {
    if (pausedAt) {
      return;
    }
    var now = Date.now();
    var timeouts = toasts.map(function(t) {
      if (t.duration === Infinity) {
        return;
      }
      var durationLeft = (t.duration || 0) + t.pauseDuration - (now - t.createdAt);
      if (durationLeft < 0) {
        if (t.visible) {
          toast.dismiss(t.id);
        }
        return;
      }
      return setTimeout(function() {
        return toast.dismiss(t.id);
      }, durationLeft);
    });
    return function() {
      timeouts.forEach(function(timeout) {
        return timeout && clearTimeout(timeout);
      });
    };
  }, [toasts, pausedAt]);
  var handlers = useMemo(function() {
    return {
      startPause: function startPause() {
        dispatch({
          type: ActionType.START_PAUSE,
          time: Date.now()
        });
      },
      endPause: function endPause() {
        if (pausedAt) {
          dispatch({
            type: ActionType.END_PAUSE,
            time: Date.now()
          });
        }
      },
      updateHeight: function updateHeight(toastId, height) {
        return dispatch({
          type: ActionType.UPDATE_TOAST,
          toast: {
            id: toastId,
            height
          }
        });
      },
      calculateOffset: function calculateOffset(toast3, opts) {
        var _relevantToasts$filte;
        var _ref = opts || {}, _ref$reverseOrder = _ref.reverseOrder, reverseOrder = _ref$reverseOrder === void 0 ? false : _ref$reverseOrder, _ref$gutter = _ref.gutter, gutter = _ref$gutter === void 0 ? 8 : _ref$gutter, defaultPosition = _ref.defaultPosition;
        var relevantToasts = toasts.filter(function(t) {
          return (t.position || defaultPosition) === (toast3.position || defaultPosition) && t.height;
        });
        var toastIndex = relevantToasts.findIndex(function(t) {
          return t.id === toast3.id;
        });
        var toastsBefore = relevantToasts.filter(function(toast4, i) {
          return i < toastIndex && toast4.visible;
        }).length;
        var offset = (_relevantToasts$filte = relevantToasts.filter(function(t) {
          return t.visible;
        })).slice.apply(_relevantToasts$filte, reverseOrder ? [toastsBefore + 1] : [0, toastsBefore]).reduce(function(acc, t) {
          return acc + (t.height || 0) + gutter;
        }, 0);
        return offset;
      }
    };
  }, [toasts, pausedAt]);
  return {
    toasts,
    handlers
  };
};
function _templateObject4() {
  var data = _taggedTemplateLiteralLoose(["\n  width: 20px;\n  opacity: 0;\n  height: 20px;\n  border-radius: 10px;\n  background: ", ";\n  position: relative;\n  transform: rotate(45deg);\n\n  animation: ", " 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)\n    forwards;\n  animation-delay: 100ms;\n\n  &:after,\n  &:before {\n    content: '';\n    animation: ", " 0.15s ease-out forwards;\n    animation-delay: 150ms;\n    position: absolute;\n    border-radius: 3px;\n    opacity: 0;\n    background: ", ";\n    bottom: 9px;\n    left: 4px;\n    height: 2px;\n    width: 12px;\n  }\n\n  &:before {\n    animation: ", " 0.15s ease-out forwards;\n    animation-delay: 180ms;\n    transform: rotate(90deg);\n  }\n"]);
  _templateObject4 = function _templateObject42() {
    return data;
  };
  return data;
}
function _templateObject3() {
  var data = _taggedTemplateLiteralLoose(["\nfrom {\n  transform: scale(0) rotate(90deg);\n	opacity: 0;\n}\nto {\n  transform: scale(1) rotate(90deg);\n	opacity: 1;\n}"]);
  _templateObject3 = function _templateObject32() {
    return data;
  };
  return data;
}
function _templateObject2() {
  var data = _taggedTemplateLiteralLoose(["\nfrom {\n  transform: scale(0);\n  opacity: 0;\n}\nto {\n  transform: scale(1);\n  opacity: 1;\n}"]);
  _templateObject2 = function _templateObject22() {
    return data;
  };
  return data;
}
function _templateObject() {
  var data = _taggedTemplateLiteralLoose(["\nfrom {\n  transform: scale(0) rotate(45deg);\n	opacity: 0;\n}\nto {\n transform: scale(1) rotate(45deg);\n  opacity: 1;\n}"]);
  _templateObject = function _templateObject5() {
    return data;
  };
  return data;
}
var circleAnimation = /* @__PURE__ */ keyframes(/* @__PURE__ */ _templateObject());
var firstLineAnimation = /* @__PURE__ */ keyframes(/* @__PURE__ */ _templateObject2());
var secondLineAnimation = /* @__PURE__ */ keyframes(/* @__PURE__ */ _templateObject3());
var ErrorIcon = /* @__PURE__ */ styled("div")(/* @__PURE__ */ _templateObject4(), function(p) {
  return p.primary || "#ff4b4b";
}, circleAnimation, firstLineAnimation, function(p) {
  return p.secondary || "#fff";
}, secondLineAnimation);
function _templateObject2$1() {
  var data = _taggedTemplateLiteralLoose(["\n  width: 12px;\n  height: 12px;\n  box-sizing: border-box;\n  border: 2px solid;\n  border-radius: 100%;\n  border-color: ", ";\n  border-right-color: ", ";\n  animation: ", " 1s linear infinite;\n"]);
  _templateObject2$1 = function _templateObject22() {
    return data;
  };
  return data;
}
function _templateObject$1() {
  var data = _taggedTemplateLiteralLoose(["\n  from {\n    transform: rotate(0deg);\n  }\n  to {\n    transform: rotate(360deg);\n  }\n"]);
  _templateObject$1 = function _templateObject5() {
    return data;
  };
  return data;
}
var rotate = /* @__PURE__ */ keyframes(/* @__PURE__ */ _templateObject$1());
var LoaderIcon = /* @__PURE__ */ styled("div")(/* @__PURE__ */ _templateObject2$1(), function(p) {
  return p.secondary || "#e0e0e0";
}, function(p) {
  return p.primary || "#616161";
}, rotate);
function _templateObject3$1() {
  var data = _taggedTemplateLiteralLoose(["\n  width: 20px;\n  opacity: 0;\n  height: 20px;\n  border-radius: 10px;\n  background: ", ";\n  position: relative;\n  transform: rotate(45deg);\n\n  animation: ", " 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)\n    forwards;\n  animation-delay: 100ms;\n  &:after {\n    content: '';\n    box-sizing: border-box;\n    animation: ", " 0.2s ease-out forwards;\n    opacity: 0;\n    animation-delay: 200ms;\n    position: absolute;\n    border-right: 2px solid;\n    border-bottom: 2px solid;\n    border-color: ", ";\n    bottom: 6px;\n    left: 6px;\n    height: 10px;\n    width: 6px;\n  }\n"]);
  _templateObject3$1 = function _templateObject32() {
    return data;
  };
  return data;
}
function _templateObject2$2() {
  var data = _taggedTemplateLiteralLoose(["\n0% {\n	height: 0;\n	width: 0;\n	opacity: 0;\n}\n40% {\n  height: 0;\n	width: 6px;\n	opacity: 1;\n}\n100% {\n  opacity: 1;\n  height: 10px;\n}"]);
  _templateObject2$2 = function _templateObject22() {
    return data;
  };
  return data;
}
function _templateObject$2() {
  var data = _taggedTemplateLiteralLoose(["\nfrom {\n  transform: scale(0) rotate(45deg);\n	opacity: 0;\n}\nto {\n  transform: scale(1) rotate(45deg);\n	opacity: 1;\n}"]);
  _templateObject$2 = function _templateObject5() {
    return data;
  };
  return data;
}
var circleAnimation$1 = /* @__PURE__ */ keyframes(/* @__PURE__ */ _templateObject$2());
var checkmarkAnimation = /* @__PURE__ */ keyframes(/* @__PURE__ */ _templateObject2$2());
var CheckmarkIcon = /* @__PURE__ */ styled("div")(/* @__PURE__ */ _templateObject3$1(), function(p) {
  return p.primary || "#61d345";
}, circleAnimation$1, checkmarkAnimation, function(p) {
  return p.secondary || "#fff";
});
function _templateObject4$1() {
  var data = _taggedTemplateLiteralLoose(["\n  position: relative;\n  transform: scale(0.6);\n  opacity: 0.4;\n  min-width: 20px;\n  animation: ", " 0.3s 0.12s cubic-bezier(0.175, 0.885, 0.32, 1.275)\n    forwards;\n"]);
  _templateObject4$1 = function _templateObject42() {
    return data;
  };
  return data;
}
function _templateObject3$2() {
  var data = _taggedTemplateLiteralLoose(["\nfrom {\n  transform: scale(0.6);\n  opacity: 0.4;\n}\nto {\n  transform: scale(1);\n  opacity: 1;\n}"]);
  _templateObject3$2 = function _templateObject32() {
    return data;
  };
  return data;
}
function _templateObject2$3() {
  var data = _taggedTemplateLiteralLoose(["\n  position: relative;\n  display: flex;\n  justify-content: center;\n  align-items: center;\n  min-width: 20px;\n  min-height: 20px;\n"]);
  _templateObject2$3 = function _templateObject22() {
    return data;
  };
  return data;
}
function _templateObject$3() {
  var data = _taggedTemplateLiteralLoose(["\n  position: absolute;\n"]);
  _templateObject$3 = function _templateObject5() {
    return data;
  };
  return data;
}
var StatusWrapper = /* @__PURE__ */ styled("div")(/* @__PURE__ */ _templateObject$3());
var IndicatorWrapper = /* @__PURE__ */ styled("div")(/* @__PURE__ */ _templateObject2$3());
var enter = /* @__PURE__ */ keyframes(/* @__PURE__ */ _templateObject3$2());
var AnimatedIconWrapper = /* @__PURE__ */ styled("div")(/* @__PURE__ */ _templateObject4$1(), enter);
var ToastIcon = function ToastIcon2(_ref) {
  var toast3 = _ref.toast;
  var icon = toast3.icon, type = toast3.type, iconTheme = toast3.iconTheme;
  if (icon !== void 0) {
    if (typeof icon === "string") {
      return createElement(AnimatedIconWrapper, null, icon);
    } else {
      return icon;
    }
  }
  if (type === "blank") {
    return null;
  }
  return createElement(IndicatorWrapper, null, createElement(LoaderIcon, Object.assign({}, iconTheme)), type !== "loading" && createElement(StatusWrapper, null, type === "error" ? createElement(ErrorIcon, Object.assign({}, iconTheme)) : createElement(CheckmarkIcon, Object.assign({}, iconTheme))));
};
function _templateObject2$4() {
  var data = _taggedTemplateLiteralLoose(["\n  display: flex;\n  justify-content: center;\n  margin: 4px 10px;\n  color: inherit;\n  flex: 1 1 auto;\n  white-space: pre-line;\n"]);
  _templateObject2$4 = function _templateObject22() {
    return data;
  };
  return data;
}
function _templateObject$4() {
  var data = _taggedTemplateLiteralLoose(["\n  display: flex;\n  align-items: center;\n  background: #fff;\n  color: #363636;\n  line-height: 1.3;\n  will-change: transform;\n  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1), 0 3px 3px rgba(0, 0, 0, 0.05);\n  max-width: 350px;\n  pointer-events: auto;\n  padding: 8px 10px;\n  border-radius: 8px;\n"]);
  _templateObject$4 = function _templateObject5() {
    return data;
  };
  return data;
}
var enterAnimation = function enterAnimation2(factor) {
  return "\n0% {transform: translate3d(0," + factor * -200 + "%,0) scale(.6); opacity:.5;}\n100% {transform: translate3d(0,0,0) scale(1); opacity:1;}\n";
};
var exitAnimation = function exitAnimation2(factor) {
  return "\n0% {transform: translate3d(0,0,-1px) scale(1); opacity:1;}\n100% {transform: translate3d(0," + factor * -150 + "%,-1px) scale(.6); opacity:0;}\n";
};
var fadeInAnimation = "0%{opacity:0;} 100%{opacity:1;}";
var fadeOutAnimation = "0%{opacity:1;} 100%{opacity:0;}";
var ToastBarBase = /* @__PURE__ */ styled("div", forwardRef)(/* @__PURE__ */ _templateObject$4());
var Message = /* @__PURE__ */ styled("div")(/* @__PURE__ */ _templateObject2$4());
var getAnimationStyle = function getAnimationStyle2(position, visible) {
  var top = position.includes("top");
  var factor = top ? 1 : -1;
  var _ref = prefersReducedMotion() ? [fadeInAnimation, fadeOutAnimation] : [enterAnimation(factor), exitAnimation(factor)], enter2 = _ref[0], exit = _ref[1];
  return {
    animation: visible ? keyframes(enter2) + " 0.35s cubic-bezier(.21,1.02,.73,1) forwards" : keyframes(exit) + " 0.4s forwards cubic-bezier(.06,.71,.55,1)"
  };
};
var ToastBar = /* @__PURE__ */ memo(function(_ref2) {
  var toast3 = _ref2.toast, position = _ref2.position, style = _ref2.style, children = _ref2.children;
  var animationStyle = toast3 != null && toast3.height ? getAnimationStyle(toast3.position || position || "top-center", toast3.visible) : {
    opacity: 0
  };
  var icon = createElement(ToastIcon, {
    toast: toast3
  });
  var message = createElement(Message, Object.assign({}, toast3.ariaProps), resolveValue(toast3.message, toast3));
  return createElement(ToastBarBase, {
    className: toast3.className,
    style: _extends({}, animationStyle, style, toast3.style)
  }, typeof children === "function" ? children({
    icon,
    message
  }) : createElement(Fragment, null, icon, message));
});
function _templateObject$5() {
  var data = _taggedTemplateLiteralLoose(["\n  z-index: 9999;\n  > * {\n    pointer-events: auto;\n  }\n"]);
  _templateObject$5 = function _templateObject5() {
    return data;
  };
  return data;
}
setup(createElement);
var getPositionStyle = function getPositionStyle2(position, offset) {
  var top = position.includes("top");
  var verticalStyle = top ? {
    top: 0
  } : {
    bottom: 0
  };
  var horizontalStyle = position.includes("center") ? {
    justifyContent: "center"
  } : position.includes("right") ? {
    justifyContent: "flex-end"
  } : {};
  return _extends({
    left: 0,
    right: 0,
    display: "flex",
    position: "absolute",
    transition: prefersReducedMotion() ? void 0 : "all 230ms cubic-bezier(.21,1.02,.73,1)",
    transform: "translateY(" + offset * (top ? 1 : -1) + "px)"
  }, verticalStyle, horizontalStyle);
};
var activeClass = /* @__PURE__ */ css(/* @__PURE__ */ _templateObject$5());
var DEFAULT_OFFSET = 16;
var Toaster = function Toaster2(_ref) {
  var reverseOrder = _ref.reverseOrder, _ref$position = _ref.position, position = _ref$position === void 0 ? "top-center" : _ref$position, toastOptions = _ref.toastOptions, gutter = _ref.gutter, children = _ref.children, containerStyle = _ref.containerStyle, containerClassName = _ref.containerClassName;
  var _useToaster = useToaster(toastOptions), toasts = _useToaster.toasts, handlers = _useToaster.handlers;
  return createElement("div", {
    style: _extends({
      position: "fixed",
      zIndex: 9999,
      top: DEFAULT_OFFSET,
      left: DEFAULT_OFFSET,
      right: DEFAULT_OFFSET,
      bottom: DEFAULT_OFFSET,
      pointerEvents: "none"
    }, containerStyle),
    className: containerClassName,
    onMouseEnter: handlers.startPause,
    onMouseLeave: handlers.endPause
  }, toasts.map(function(t) {
    var toastPosition = t.position || position;
    var offset = handlers.calculateOffset(t, {
      reverseOrder,
      gutter,
      defaultPosition: position
    });
    var positionStyle = getPositionStyle(toastPosition, offset);
    var ref = t.height ? void 0 : createRectRef(function(rect) {
      handlers.updateHeight(t.id, rect.height);
    });
    return createElement("div", {
      ref,
      className: t.visible ? activeClass : "",
      key: t.id,
      style: positionStyle
    }, t.type === "custom" ? resolveValue(t.message, t) : children ? children(t) : createElement(ToastBar, {
      toast: t,
      position: toastPosition
    }));
  }));
};
export default toast;
export {CheckmarkIcon, ErrorIcon, LoaderIcon, ToastBar, ToastIcon, Toaster, resolveValue, toast, useToaster, useStore as useToasterStore};
