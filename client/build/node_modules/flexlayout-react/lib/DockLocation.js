"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _Rect = require("./Rect.js");

var _Rect2 = _interopRequireDefault(_Rect);

var _Orientation = require("./Orientation.js");

var _Orientation2 = _interopRequireDefault(_Orientation);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var values = {};

var DockLocation = function () {
    function DockLocation(name, orientation, indexPlus) {
        _classCallCheck(this, DockLocation);

        this._name = name;
        this._orientation = orientation;
        this._indexPlus = indexPlus;
        values[this._name] = this;
    }

    _createClass(DockLocation, [{
        key: "getName",
        value: function getName() {
            return this._name;
        }
    }, {
        key: "getOrientation",
        value: function getOrientation() {
            return this._orientation;
        }
    }, {
        key: "getDockRect",
        value: function getDockRect(r) {
            if (this === DockLocation.TOP) {
                return new _Rect2.default(r.x, r.y, r.width, r.height / 2);
            } else if (this === DockLocation.BOTTOM) {
                return new _Rect2.default(r.x, r.getBottom() - r.height / 2, r.width, r.height / 2);
            }
            if (this === DockLocation.LEFT) {
                return new _Rect2.default(r.x, r.y, r.width / 2, r.height);
            } else if (this === DockLocation.RIGHT) {
                return new _Rect2.default(r.getRight() - r.width / 2, r.y, r.width / 2, r.height);
            } else {
                return r.clone();
            }
        }
    }, {
        key: "split",
        value: function split(rect, size) {
            if (this === DockLocation.TOP) {
                var r1 = new _Rect2.default(rect.x, rect.y, rect.width, size);
                var r2 = new _Rect2.default(rect.x, rect.y + size, rect.width, rect.height - size);
                return { start: r1, end: r2 };
            } else if (this === DockLocation.LEFT) {
                var _r = new _Rect2.default(rect.x, rect.y, size, rect.height);
                var _r2 = new _Rect2.default(rect.x + size, rect.y, rect.width - size, rect.height);
                return { start: _r, end: _r2 };
            }
            if (this === DockLocation.RIGHT) {
                var _r3 = new _Rect2.default(rect.getRight() - size, rect.y, size, rect.height);
                var _r4 = new _Rect2.default(rect.x, rect.y, rect.width - size, rect.height);
                return { start: _r3, end: _r4 };
            } else if (this === DockLocation.BOTTOM) {
                var _r5 = new _Rect2.default(rect.x, rect.getBottom() - size, rect.width, size);
                var _r6 = new _Rect2.default(rect.x, rect.y, rect.width, rect.height - size);
                return { start: _r5, end: _r6 };
            }
        }
    }, {
        key: "reflect",
        value: function reflect() {
            if (this === DockLocation.TOP) {
                return DockLocation.BOTTOM;
            } else if (this === DockLocation.LEFT) {
                return DockLocation.RIGHT;
            }
            if (this === DockLocation.RIGHT) {
                return DockLocation.LEFT;
            } else if (this === DockLocation.BOTTOM) {
                return DockLocation.TOP;
            }
        }
    }, {
        key: "toString",
        value: function toString() {
            return "(DockLocation: name=" + this._name + ", orientation=" + this._orientation + ")";
        }
    }], [{
        key: "getByName",
        value: function getByName(name) {
            return values[name];
        }
    }, {
        key: "getLocation",
        value: function getLocation(rect, x, y) {
            if (x < rect.x + rect.width / 4) {
                return DockLocation.LEFT;
            } else if (x > rect.getRight() - rect.width / 4) {
                return DockLocation.RIGHT;
            } else if (y < rect.y + rect.height / 4) {
                return DockLocation.TOP;
            } else if (y > rect.getBottom() - rect.height / 4) {
                return DockLocation.BOTTOM;
            } else {
                return DockLocation.CENTER;
            }
        }
    }]);

    return DockLocation;
}();

// statics


DockLocation.TOP = new DockLocation("top", _Orientation2.default.VERT, 0);
DockLocation.BOTTOM = new DockLocation("bottom", _Orientation2.default.VERT, 1);
DockLocation.LEFT = new DockLocation("left", _Orientation2.default.HORZ, 0);
DockLocation.RIGHT = new DockLocation("right", _Orientation2.default.HORZ, 1);
DockLocation.CENTER = new DockLocation("center", _Orientation2.default.VERT, 0);

exports.default = DockLocation;