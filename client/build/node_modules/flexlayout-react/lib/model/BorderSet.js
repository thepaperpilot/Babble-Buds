"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _Rect = require("../Rect.js");

var _Rect2 = _interopRequireDefault(_Rect);

var _DockLocation = require("../DockLocation.js");

var _DockLocation2 = _interopRequireDefault(_DockLocation);

var _BorderNode = require("./BorderNode.js");

var _BorderNode2 = _interopRequireDefault(_BorderNode);

var _Orientation = require("../Orientation.js");

var _Orientation2 = _interopRequireDefault(_Orientation);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var BorderSet = function () {
    function BorderSet(model) {
        _classCallCheck(this, BorderSet);

        this._model = model;
        this._borders = [];
    }

    _createClass(BorderSet, [{
        key: "getBorders",
        value: function getBorders() {
            return this._borders;
        }
    }, {
        key: "_forEachNode",
        value: function _forEachNode(fn) {
            this._borders.forEach(function (borderNode) {
                fn(borderNode);
                borderNode._children.forEach(function (node) {
                    node._forEachNode(fn);
                });
            });
        }
    }, {
        key: "_toJson",
        value: function _toJson() {
            return this._borders.map(function (borderNode) {
                return borderNode._toJson();
            });
        }
    }, {
        key: "_layout",
        value: function _layout(outerInnerRects) {

            var rect = outerInnerRects.outer;
            var height = rect.height;
            var width = rect.width;
            var sumHeight = 0;
            var sumWidth = 0;
            var countHeight = 0;
            var countWidth = 0;
            var adjustableHeight = 0;
            var adjustableWidth = 0;

            var showingBorders = this._borders.filter(function (border) {
                return border.isShowing();
            });

            // sum size of borders to see they will fit
            for (var _i = 0; _i < showingBorders.length; _i++) {
                var border = showingBorders[_i];
                if (border.isShowing()) {
                    border._setAdjustedSize(border.getSize());
                    var visible = border.getSelected() != -1;
                    if (border.getLocation().getOrientation() == _Orientation2.default.HORZ) {
                        sumWidth += border.getBorderBarSize() + this._model.getSplitterSize();
                        if (visible) {
                            sumWidth += border.getSize();
                            adjustableWidth += border.getSize();
                        }
                        countWidth++;
                    } else {
                        sumHeight += border.getBorderBarSize() + this._model.getSplitterSize();
                        if (visible) {
                            sumHeight += border.getSize();
                            adjustableHeight += border.getSize();
                        }
                        countHeight++;
                    }
                }
            }

            // adjust border sizes if too large
            var i = 0;
            while (sumWidth > width && adjustableWidth > 0 || sumHeight > height && adjustableHeight > 0) {
                var _border = showingBorders[i];
                if (_border.getSelected() != -1) {
                    //visible
                    var size = _border._getAdjustedSize();
                    if (sumWidth > width && adjustableWidth > 0 && _border.getLocation().getOrientation() == _Orientation2.default.HORZ && size > 0) {
                        _border._setAdjustedSize(size - 1);
                        sumWidth--;
                        adjustableWidth--;
                    } else if (sumHeight > height && adjustableHeight > 0 && _border.getLocation().getOrientation() == _Orientation2.default.VERT && size > 0) {
                        _border._setAdjustedSize(size - 1);
                        sumHeight--;
                        adjustableHeight--;
                    }
                }
                i = (i + 1) % showingBorders.length;
            }

            showingBorders.forEach(function (border) {
                outerInnerRects = border._layout(outerInnerRects);
            });
            return outerInnerRects;
        }
    }, {
        key: "_findDropTargetNode",
        value: function _findDropTargetNode(dragNode, x, y) {
            for (var i = 0; i < this._borders.length; i++) {
                var border = this._borders[i];
                if (border.isShowing()) {
                    var dropInfo = border._canDrop(dragNode, x, y);
                    if (dropInfo != null) {
                        return dropInfo;
                    }
                }
            }
            return null;
        }
    }], [{
        key: "_fromJson",
        value: function _fromJson(json, model) {
            var borderSet = new BorderSet(model);
            borderSet._borders = json.map(function (borderJson) {
                return _BorderNode2.default._fromJson(borderJson, model);
            });
            return borderSet;
        }
    }]);

    return BorderSet;
}();

exports.default = BorderSet;