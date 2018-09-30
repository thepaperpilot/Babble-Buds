"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Utils = function () {
    function Utils() {
        _classCallCheck(this, Utils);
    }

    _createClass(Utils, null, [{
        key: "getGetters",
        value: function getGetters(thisObj, obj, valueMap) {
            var propertyNames = Object.getOwnPropertyNames(obj);
            for (var i = 0; i < propertyNames.length; i++) {
                var name = propertyNames[i];
                if (typeof obj[name] === 'function' && name.startsWith("get")) {
                    var value = null;
                    try {
                        value = thisObj[name]();
                    } catch (e) {}
                    valueMap[name] = value;
                }
            }

            var proto = Object.getPrototypeOf(obj);
            if (proto != undefined) {
                Utils.getGetters(thisObj, proto, valueMap);
            }

            return valueMap;
        }
    }]);

    return Utils;
}();

exports.default = Utils;