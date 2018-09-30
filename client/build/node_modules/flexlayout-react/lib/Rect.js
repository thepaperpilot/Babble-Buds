"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _Orientation = require("./Orientation.js");

var _Orientation2 = _interopRequireDefault(_Orientation);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Rect = function () {
    function Rect(x, y, width, height) {
        _classCallCheck(this, Rect);

        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }

    _createClass(Rect, [{
        key: "clone",
        value: function clone() {
            return new Rect(this.x, this.y, this.width, this.height);
        }
    }, {
        key: "equals",
        value: function equals(rect) {
            if (this.x === rect.x && this.y === rect.y && this.width === rect.width && this.height === rect.height) {
                return true;
            } else {
                return false;
            }
        }
    }, {
        key: "getBottom",
        value: function getBottom() {
            return this.y + this.height;
        }
    }, {
        key: "getRight",
        value: function getRight() {
            return this.x + this.width;
        }
    }, {
        key: "positionElement",
        value: function positionElement(element) {
            this.styleWithPosition(element.style);
        }
    }, {
        key: "styleWithPosition",
        value: function styleWithPosition(style) {
            style.left = this.x + "px";
            style.top = this.y + "px";
            style.width = Math.max(0, this.width) + "px"; // need Math.max to prevent -ve, cause error in IE
            style.height = Math.max(0, this.height) + "px";
            style.position = "absolute";
            return style;
        }
    }, {
        key: "contains",
        value: function contains(x, y) {
            if (this.x <= x && x <= this.getRight() && this.y <= y && y <= this.getBottom()) {
                return true;
            } else {
                return false;
            }
        }
    }, {
        key: "centerInRect",
        value: function centerInRect(outerRect) {
            this.x = (outerRect.width - this.width) / 2;
            this.y = (outerRect.height - this.height) / 2;
        }
    }, {
        key: "_getSize",
        value: function _getSize(orientation) {
            var prefSize = this.width;
            if (orientation === _Orientation2.default.VERT) {
                prefSize = this.height;
            }
            return prefSize;
        }
    }, {
        key: "toString",
        value: function toString() {
            return "(Rect: x=" + this.x + ", y=" + this.y + ", width=" + this.width + ", height=" + this.height + ")";
        }
    }]);

    return Rect;
}();

exports.default = Rect;