"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _Rect = require("../Rect.js");

var _Rect2 = _interopRequireDefault(_Rect);

var _AttributeDefinitions = require("../AttributeDefinitions.js");

var _AttributeDefinitions2 = _interopRequireDefault(_AttributeDefinitions);

var _Attribute = require("../Attribute");

var _Attribute2 = _interopRequireDefault(_Attribute);

var _DockLocation = require("../DockLocation.js");

var _DockLocation2 = _interopRequireDefault(_DockLocation);

var _Orientation = require("../Orientation.js");

var _Orientation2 = _interopRequireDefault(_Orientation);

var _DropInfo = require("./../DropInfo.js");

var _DropInfo2 = _interopRequireDefault(_DropInfo);

var _Node2 = require("./Node.js");

var _Node3 = _interopRequireDefault(_Node2);

var _TabNode = require("./TabNode.js");

var _TabNode2 = _interopRequireDefault(_TabNode);

var _TabSetNode = require("./TabSetNode.js");

var _TabSetNode2 = _interopRequireDefault(_TabSetNode);

var _SplitterNode = require("./SplitterNode.js");

var _SplitterNode2 = _interopRequireDefault(_SplitterNode);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var BorderNode = function (_Node) {
    _inherits(BorderNode, _Node);

    function BorderNode(location, json, model) {
        _classCallCheck(this, BorderNode);

        var _this = _possibleConstructorReturn(this, (BorderNode.__proto__ || Object.getPrototypeOf(BorderNode)).call(this, model));

        _this._contentRect = null;
        _this._tabHeaderRect = null;
        _this._location = location;
        _this._drawChildren = [];
        _this._attributes["id"] = "border_" + location.getName();
        attributeDefinitions.fromJson(json, _this._attributes);
        model._addNode(_this);
        return _this;
    }

    _createClass(BorderNode, [{
        key: "getLocation",
        value: function getLocation() {
            return this._location;
        }
    }, {
        key: "getTabHeaderRect",
        value: function getTabHeaderRect() {
            return this._tabHeaderRect;
        }
    }, {
        key: "getContentRect",
        value: function getContentRect() {
            return this._contentRect;
        }
    }, {
        key: "isEnableDrop",
        value: function isEnableDrop() {
            return this._getAttr("enableDrop");
        }
    }, {
        key: "getClassNameBorder",
        value: function getClassNameBorder() {
            return this._getAttr("className");
        }
    }, {
        key: "getBorderBarSize",
        value: function getBorderBarSize() {
            return this._getAttr("barSize");
        }
    }, {
        key: "getSize",
        value: function getSize() {
            return this._attributes["size"];
        }
    }, {
        key: "getSelected",
        value: function getSelected() {
            return this._attributes["selected"];
        }
    }, {
        key: "getSelectedNode",
        value: function getSelectedNode() {
            if (this.getSelected() != -1) {
                return this._children[this.getSelected()];
            }
            return null;
        }
    }, {
        key: "getOrientation",
        value: function getOrientation() {
            return this._location.getOrientation();
        }
    }, {
        key: "isMaximized",
        value: function isMaximized() {
            return false;
        }
    }, {
        key: "isShowing",
        value: function isShowing() {
            return this._attributes["show"];
        }
    }, {
        key: "_setSelected",
        value: function _setSelected(index) {
            this._attributes["selected"] = index;
        }
    }, {
        key: "_setSize",
        value: function _setSize(pos) {
            this._attributes["size"] = pos;
        }
    }, {
        key: "_updateAttrs",
        value: function _updateAttrs(json) {
            attributeDefinitions.update(json, this._attributes);
        }
    }, {
        key: "_getDrawChildren",
        value: function _getDrawChildren() {
            return this._drawChildren;
        }
    }, {
        key: "_setAdjustedSize",
        value: function _setAdjustedSize(size) {
            this._adjustedSize = size;
        }
    }, {
        key: "_getAdjustedSize",
        value: function _getAdjustedSize() {
            return this._adjustedSize;
        }
    }, {
        key: "_layout",
        value: function _layout(borderRects) {
            var _this2 = this;

            this._drawChildren = [];
            var location = this._location;

            var split1 = location.split(borderRects.outer, this.getBorderBarSize()); // split border outer
            var split2 = location.split(borderRects.inner, this.getBorderBarSize()); // split border inner
            var split3 = location.split(split2.end, this._adjustedSize + this._model.getSplitterSize()); // split off tab contents
            var split4 = location.reflect().split(split3.start, this._model.getSplitterSize()); // split contents into content and splitter

            this._tabHeaderRect = split2.start;
            this._contentRect = split4.end;

            this._children.forEach(function (child, i) {
                child._layout(_this2._contentRect);
                child._setVisible(i === _this2.getSelected());
                _this2._drawChildren.push(child);
            });

            if (this.getSelected() == -1) {
                return { outer: split1.end, inner: split2.end };
            } else {
                var newSplitter = new _SplitterNode2.default(this._model);
                newSplitter._parent = this;
                newSplitter._rect = split4.start;
                this._drawChildren.push(newSplitter);

                return { outer: split1.end, inner: split3.end };
            }
        }
    }, {
        key: "_remove",
        value: function _remove(node) {
            if (this.getSelected() != -1) {
                var selectedNode = this._children[this.getSelected()];
                if (node === selectedNode) {
                    this._setSelected(-1);
                    this._removeChild(node);
                } else {
                    this._removeChild(node);
                    for (var i = 0; i < this._children.length; i++) {
                        if (this._children[i] === selectedNode) {
                            this._setSelected(i);
                            break;
                        }
                    }
                }
            } else {
                this._removeChild(node);
            }
        }
    }, {
        key: "_canDrop",
        value: function _canDrop(dragNode, x, y) {
            if (dragNode.getType() != _TabNode2.default.TYPE) {
                return false;
            }

            var dropInfo = null;
            var dockLocation = _DockLocation2.default.CENTER;

            if (this._tabHeaderRect.contains(x, y)) {
                if (this._location._orientation == _Orientation2.default.VERT) {
                    if (this._children.length > 0) {
                        var child = this._children[0];
                        var childRect = child._tabRect;
                        var childY = childRect.y;

                        var childHeight = childRect.height;

                        var pos = this._tabHeaderRect.x;
                        var childCenter = 0;
                        for (var i = 0; i < this._children.length; i++) {
                            child = this._children[i];
                            childRect = child._tabRect;
                            childCenter = childRect.x + childRect.width / 2;
                            if (x >= pos && x < childCenter) {
                                var outlineRect = new _Rect2.default(childRect.x - 2, childY, 3, childHeight);
                                dropInfo = new _DropInfo2.default(this, outlineRect, dockLocation, i, "flexlayout__outline_rect");
                                break;
                            }
                            pos = childCenter;
                        }
                        if (dropInfo == null) {
                            var _outlineRect = new _Rect2.default(childRect.getRight() - 2, childY, 3, childHeight);
                            dropInfo = new _DropInfo2.default(this, _outlineRect, dockLocation, this._children.length, "flexlayout__outline_rect");
                        }
                    } else {
                        var _outlineRect2 = new _Rect2.default(this._tabHeaderRect.x + 1, this._tabHeaderRect.y + 2, 3, 18);
                        dropInfo = new _DropInfo2.default(this, _outlineRect2, dockLocation, 0, "flexlayout__outline_rect");
                    }
                } else {
                    if (this._children.length > 0) {
                        var _child = this._children[0];
                        var _childRect = _child._tabRect;
                        var childX = _childRect.x;
                        var childWidth = _childRect.width;

                        var _pos = this._tabHeaderRect.y;
                        var _childCenter = 0;
                        for (var _i = 0; _i < this._children.length; _i++) {
                            _child = this._children[_i];
                            _childRect = _child._tabRect;
                            _childCenter = _childRect.y + _childRect.height / 2;
                            if (y >= _pos && y < _childCenter) {
                                var _outlineRect3 = new _Rect2.default(childX, _childRect.y - 2, childWidth, 3);
                                dropInfo = new _DropInfo2.default(this, _outlineRect3, dockLocation, _i, "flexlayout__outline_rect");
                                break;
                            }
                            _pos = _childCenter;
                        }
                        if (dropInfo == null) {
                            var _outlineRect4 = new _Rect2.default(childX, _childRect.getBottom() - 2, childWidth, 3);
                            dropInfo = new _DropInfo2.default(this, _outlineRect4, dockLocation, this._children.length, "flexlayout__outline_rect");
                        }
                    } else {
                        var _outlineRect5 = new _Rect2.default(this._tabHeaderRect.x + 2, this._tabHeaderRect.y + 1, 18, 3);
                        dropInfo = new _DropInfo2.default(this, _outlineRect5, dockLocation, 0, "flexlayout__outline_rect");
                    }
                }
                if (!dragNode._canDockInto(dragNode, dropInfo)) {
                    return null;
                }
            } else if (this.getSelected() != -1 && this._contentRect.contains(x, y)) {
                var _outlineRect6 = this._contentRect;
                dropInfo = new _DropInfo2.default(this, _outlineRect6, dockLocation, -1, "flexlayout__outline_rect");
                if (!dragNode._canDockInto(dragNode, dropInfo)) {
                    return null;
                }
            }

            return dropInfo;
        }
    }, {
        key: "_drop",
        value: function _drop(dragNode, location, index) {
            var fromIndex = 0;
            if (dragNode._parent != null) {
                fromIndex = dragNode._parent._removeChild(dragNode);
            }

            // if dropping a tab back to same tabset and moving to forward position then reduce insertion index
            if (dragNode.getType() === _TabNode2.default.TYPE && dragNode._parent === this && fromIndex < index && index > 0) {
                index--;
            }

            // for the tabset/border being removed from set the selected index
            if (dragNode._parent !== null) {
                if (dragNode._parent.getType() === _TabSetNode2.default.TYPE) {
                    dragNode._parent._setSelected(0);
                } else if (dragNode._parent.getType() === BorderNode.TYPE) {
                    if (dragNode._parent.getSelected() != -1) {
                        if (fromIndex === dragNode._parent.getSelected() && dragNode._parent._children.length > 0) {
                            dragNode._parent._setSelected(0);
                        } else if (fromIndex < dragNode._parent.getSelected()) {
                            dragNode._parent._setSelected(dragNode._parent.getSelected() - 1);
                        } else if (fromIndex > dragNode._parent.getSelected()) {
                            // leave selected index as is
                        } else {
                            dragNode._parent._setSelected(-1);
                        }
                    }
                }
            }

            // simple_bundled dock to existing tabset
            var insertPos = index;
            if (insertPos === -1) {
                insertPos = this._children.length;
            }

            if (dragNode.getType() === _TabNode2.default.TYPE) {
                this._addChild(dragNode, insertPos);
            }

            if (this.getSelected() !== -1) {
                // already open
                this._setSelected(insertPos);
            }

            this._model._tidy();
        }
    }, {
        key: "_toJson",
        value: function _toJson() {
            var json = {};
            attributeDefinitions.toJson(json, this._attributes);
            json.location = this._location.getName();
            json.children = this._children.map(function (child) {
                return child._toJson();
            });
            return json;
        }
    }, {
        key: "_getSplitterBounds",
        value: function _getSplitterBounds(splitter) {
            var pBounds = [0, 0];
            var outerRect = this._model._getOuterInnerRects().outer;
            var innerRect = this._model._getOuterInnerRects().inner;
            if (this._location === _DockLocation2.default.TOP) {
                pBounds[0] = outerRect.y;
                pBounds[1] = innerRect.getBottom() - splitter.getHeight();
            } else if (this._location === _DockLocation2.default.LEFT) {
                pBounds[0] = outerRect.x;
                pBounds[1] = innerRect.getRight() - splitter.getWidth();
            } else if (this._location === _DockLocation2.default.BOTTOM) {
                pBounds[0] = innerRect.y;
                pBounds[1] = outerRect.getBottom() - splitter.getHeight();
            } else if (this._location === _DockLocation2.default.RIGHT) {
                pBounds[0] = innerRect.x;
                pBounds[1] = outerRect.getRight() - splitter.getWidth();
            }
            return pBounds;
        }
    }, {
        key: "_calculateSplit",
        value: function _calculateSplit(splitter, splitterPos) {
            var pBounds = this._getSplitterBounds(splitter);
            if (this._location == _DockLocation2.default.BOTTOM || this._location == _DockLocation2.default.RIGHT) {
                return Math.max(0, pBounds[1] - splitterPos);
            } else {
                return Math.max(0, splitterPos - pBounds[0]);
            }
        }
    }, {
        key: "_getAttributeDefinitions",
        value: function _getAttributeDefinitions() {
            return attributeDefinitions;
        }
    }], [{
        key: "_fromJson",
        value: function _fromJson(json, model) {

            var location = _DockLocation2.default.getByName(json.location);
            var border = new BorderNode(location, json, model);
            if (json.children) {
                border._children = json.children.map(function (jsonChild) {
                    var child = _TabNode2.default._fromJson(jsonChild, model);
                    child._parent = border;
                    return child;
                });
            }

            return border;
        }
    }]);

    return BorderNode;
}(_Node3.default);

BorderNode.TYPE = "border";

var attributeDefinitions = new _AttributeDefinitions2.default();
attributeDefinitions.add("type", BorderNode.TYPE, true);

attributeDefinitions.add("size", 200);
attributeDefinitions.add("selected", -1);
attributeDefinitions.add("show", true).setType(_Attribute2.default.BOOLEAN);

attributeDefinitions.addInherited("barSize", "borderBarSize").setType(_Attribute2.default.INT).setFrom(0);
attributeDefinitions.addInherited("enableDrop", "borderEnableDrop").setType(_Attribute2.default.BOOLEAN);
attributeDefinitions.addInherited("className", "borderClassName").setType(_Attribute2.default.STRING);

exports.default = BorderNode;