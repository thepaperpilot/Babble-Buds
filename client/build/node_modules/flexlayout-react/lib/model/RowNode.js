"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _Rect = require("../Rect.js");

var _Rect2 = _interopRequireDefault(_Rect);

var _AttributeDefinitions = require("../AttributeDefinitions.js");

var _AttributeDefinitions2 = _interopRequireDefault(_AttributeDefinitions);

var _Orientation = require("../Orientation.js");

var _Orientation2 = _interopRequireDefault(_Orientation);

var _DockLocation = require("../DockLocation.js");

var _DockLocation2 = _interopRequireDefault(_DockLocation);

var _SplitterNode = require("./SplitterNode.js");

var _SplitterNode2 = _interopRequireDefault(_SplitterNode);

var _Node2 = require("./Node.js");

var _Node3 = _interopRequireDefault(_Node2);

var _TabSetNode = require("./TabSetNode.js");

var _TabSetNode2 = _interopRequireDefault(_TabSetNode);

var _BorderNode = require("./BorderNode.js");

var _BorderNode2 = _interopRequireDefault(_BorderNode);

var _DropInfo = require("./../DropInfo.js");

var _DropInfo2 = _interopRequireDefault(_DropInfo);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var RowNode = function (_Node) {
    _inherits(RowNode, _Node);

    function RowNode(model, json) {
        _classCallCheck(this, RowNode);

        var _this = _possibleConstructorReturn(this, (RowNode.__proto__ || Object.getPrototypeOf(RowNode)).call(this, model));

        _this._dirty = true;
        _this._drawChildren = [];
        attributeDefinitions.fromJson(json, _this._attributes);
        model._addNode(_this);
        return _this;
    }

    _createClass(RowNode, [{
        key: "getWeight",
        value: function getWeight() {
            return this._attributes["weight"];
        }
    }, {
        key: "getWidth",
        value: function getWidth() {
            return this._attributes["width"];
        }
    }, {
        key: "getHeight",
        value: function getHeight() {
            return this._attributes["height"];
        }
    }, {
        key: "_setWeight",
        value: function _setWeight(weight) {
            this._attributes["weight"] = weight;
        }
    }, {
        key: "_layout",
        value: function _layout(rect) {
            _get(RowNode.prototype.__proto__ || Object.getPrototypeOf(RowNode.prototype), "_layout", this).call(this, rect);

            var pixelSize = this._rect._getSize(this.getOrientation());

            var totalWeight = 0;
            var fixedPixels = 0;
            var prefPixels = 0;
            var numVariable = 0;
            var totalPrefWeight = 0;
            var drawChildren = this._getDrawChildren();

            for (var i = 0; i < drawChildren.length; i++) {
                var child = drawChildren[i];
                var prefSize = child._getPrefSize(this.getOrientation());
                if (child._fixed) {
                    fixedPixels += prefSize;
                } else {
                    if (prefSize == null) {
                        totalWeight += child.getWeight();
                    } else {
                        prefPixels += prefSize;
                        totalPrefWeight += child.getWeight();
                    }
                    numVariable++;
                }
            }

            var resizePreferred = false;
            var availablePixels = pixelSize - fixedPixels - prefPixels;
            if (availablePixels < 0) {
                availablePixels = pixelSize - fixedPixels;
                resizePreferred = true;
                totalWeight += totalPrefWeight;
            }

            // assign actual pixel sizes
            var totalSizeGiven = 0;
            var variableSize = 0;
            for (var _i = 0; _i < drawChildren.length; _i++) {
                var _child = drawChildren[_i];
                var _prefSize = _child._getPrefSize(this.getOrientation());
                if (_child._fixed) {
                    _child.tempsize = _prefSize;
                } else {
                    if (_prefSize == null || resizePreferred) {
                        if (totalWeight === 0) {
                            _child.tempsize = 0;
                        } else {
                            _child.tempsize = Math.floor(availablePixels * (_child.getWeight() / totalWeight));
                        }
                        variableSize += _child.tempsize;
                    } else {
                        _child.tempsize = _prefSize;
                    }
                }

                totalSizeGiven += _child.tempsize;
            }

            // adjust sizes to exactly fit
            if (variableSize > 0) {
                while (totalSizeGiven < pixelSize) {
                    for (var _i2 = 0; _i2 < drawChildren.length; _i2++) {
                        var _child2 = drawChildren[_i2];
                        var _prefSize2 = _child2._getPrefSize(this.getOrientation());
                        if (!_child2._fixed && (_prefSize2 == null || resizePreferred) && totalSizeGiven < pixelSize) {
                            _child2.tempsize++;
                            totalSizeGiven++;
                        }
                    }
                }
            }

            var childOrientation = _Orientation2.default.flip(this.getOrientation());

            // layout children
            var p = 0;
            for (var _i3 = 0; _i3 < drawChildren.length; _i3++) {
                var _child3 = drawChildren[_i3];

                if (this.getOrientation() === _Orientation2.default.HORZ) {
                    _child3._layout(new _Rect2.default(this._rect.x + p, this._rect.y, _child3.tempsize, this._rect.height));
                } else {
                    _child3._layout(new _Rect2.default(this._rect.x, this._rect.y + p, this._rect.width, _child3.tempsize));
                }
                p += _child3.tempsize;
            }

            return true;
        }
    }, {
        key: "_getSplitterBounds",
        value: function _getSplitterBounds(splitterNode) {
            var pBounds = [0, 0];
            var drawChildren = this._getDrawChildren();
            var p = drawChildren.indexOf(splitterNode);
            if (this.getOrientation() === _Orientation2.default.HORZ) {
                pBounds[0] = drawChildren[p - 1]._rect.x;
                pBounds[1] = drawChildren[p + 1]._rect.getRight() - splitterNode.getWidth();
            } else {
                pBounds[0] = drawChildren[p - 1]._rect.y;
                pBounds[1] = drawChildren[p + 1]._rect.getBottom() - splitterNode.getHeight();
            }
            return pBounds;
        }
    }, {
        key: "_calculateSplit",
        value: function _calculateSplit(splitter, splitterPos) {
            var rtn = null;
            var drawChildren = this._getDrawChildren();
            var p = drawChildren.indexOf(splitter);
            var pBounds = this._getSplitterBounds(splitter);

            var weightedLength = drawChildren[p - 1].getWeight() + drawChildren[p + 1].getWeight();

            var pixelWidth1 = Math.max(0, splitterPos - pBounds[0]);
            var pixelWidth2 = Math.max(0, pBounds[1] - splitterPos);

            if (pixelWidth1 + pixelWidth2 > 0) {
                var weight1 = pixelWidth1 * weightedLength / (pixelWidth1 + pixelWidth2);
                var weight2 = pixelWidth2 * weightedLength / (pixelWidth1 + pixelWidth2);

                rtn = {
                    node1: drawChildren[p - 1].getId(), weight1: weight1, pixelWidth1: pixelWidth1,
                    node2: drawChildren[p + 1].getId(), weight2: weight2, pixelWidth2: pixelWidth2
                };
            }

            return rtn;
        }
    }, {
        key: "_getDrawChildren",
        value: function _getDrawChildren() {
            if (this._dirty) {
                this._drawChildren = [];

                for (var i = 0; i < this._children.length; i++) {
                    var child = this._children[i];
                    if (i !== 0) {
                        var newSplitter = new _SplitterNode2.default(this._model);
                        newSplitter._parent = this;
                        this._drawChildren.push(newSplitter);
                    }
                    this._drawChildren.push(child);
                }
                this._dirty = false;
            }

            return this._drawChildren;
        }
    }, {
        key: "_tidy",
        value: function _tidy() {
            //console.log("a", this._model.toString());
            var i = 0;
            while (i < this._children.length) {
                var child = this._children[i];
                if (child.getType() === RowNode.TYPE) {
                    child._tidy();

                    if (child._children.length === 0) {
                        this._removeChild(child);
                    } else if (child._children.length === 1) {
                        // hoist child/children up to this level
                        var subchild = child._children[0];
                        this._removeChild(child);
                        if (subchild.getType() === RowNode.TYPE) {
                            var subChildrenTotal = 0;
                            for (var j = 0; j < subchild._children.length; j++) {
                                var subsubChild = subchild._children[j];
                                subChildrenTotal += subsubChild.getWeight();
                            }
                            for (var _j = 0; _j < subchild._children.length; _j++) {
                                var _subsubChild = subchild._children[_j];
                                _subsubChild._setWeight(child.getWeight() * _subsubChild.getWeight() / subChildrenTotal);
                                this._addChild(_subsubChild, i + _j);
                            }
                        } else {
                            subchild._setWeight(child.getWeight());
                            this._addChild(subchild, i);
                        }
                    } else {
                        i++;
                    }
                } else if (child.getType() === _TabSetNode2.default.TYPE && child._children.length === 0) {
                    if (child.isEnableDeleteWhenEmpty()) {
                        this._removeChild(child);
                    } else {
                        i++;
                    }
                } else {
                    i++;
                }
            }

            // add tabset into empty root
            if (this == this._model.getRoot() && this._children.length == 0) {
                var _child4 = new _TabSetNode2.default(this._model, { type: "tabset" });
                this._addChild(_child4);
            }

            //console.log("b", this._model.toString());
        }
    }, {
        key: "_canDrop",
        value: function _canDrop(dragNode, x, y) {
            var yy = y - this._rect.y;
            var xx = x - this._rect.x;
            var w = this._rect.width;
            var h = this._rect.height;
            var margin = 10; // height of edge rect
            var half = 50; // half width of edge rect
            var dropInfo = null;

            if (this._model.isEnableEdgeDock() && this._parent == null) {
                // _root row
                if (x < this._rect.x + margin && yy > h / 2 - half && yy < h / 2 + half) {
                    var dockLocation = _DockLocation2.default.LEFT;
                    var outlineRect = dockLocation.getDockRect(this._rect);
                    outlineRect.width = outlineRect.width / 2;
                    dropInfo = new _DropInfo2.default(this, outlineRect, dockLocation, -1, "flexlayout__outline_rect_edge");
                } else if (x > this._rect.getRight() - margin && yy > h / 2 - half && yy < h / 2 + half) {
                    var _dockLocation = _DockLocation2.default.RIGHT;
                    var _outlineRect = _dockLocation.getDockRect(this._rect);
                    _outlineRect.width = _outlineRect.width / 2;
                    _outlineRect.x += _outlineRect.width;
                    dropInfo = new _DropInfo2.default(this, _outlineRect, _dockLocation, -1, "flexlayout__outline_rect_edge");
                } else if (y < this._rect.y + margin && xx > w / 2 - half && xx < w / 2 + half) {
                    var _dockLocation2 = _DockLocation2.default.TOP;
                    var _outlineRect2 = _dockLocation2.getDockRect(this._rect);
                    _outlineRect2.height = _outlineRect2.height / 2;
                    dropInfo = new _DropInfo2.default(this, _outlineRect2, _dockLocation2, -1, "flexlayout__outline_rect_edge");
                } else if (y > this._rect.getBottom() - margin && xx > w / 2 - half && xx < w / 2 + half) {
                    var _dockLocation3 = _DockLocation2.default.BOTTOM;
                    var _outlineRect3 = _dockLocation3.getDockRect(this._rect);
                    _outlineRect3.height = _outlineRect3.height / 2;
                    _outlineRect3.y += _outlineRect3.height;
                    dropInfo = new _DropInfo2.default(this, _outlineRect3, _dockLocation3, -1, "flexlayout__outline_rect_edge");
                }

                if (dropInfo != null) {
                    if (!dragNode._canDockInto(dragNode, dropInfo)) {
                        return null;
                    }
                }
            }

            return dropInfo;
        }
    }, {
        key: "_drop",
        value: function _drop(dragNode, location, index) {
            var dockLocation = location;

            if (dragNode._parent) {
                dragNode._parent._removeChild(dragNode);
            }

            if (dragNode._parent !== null && dragNode._parent.getType() === _TabSetNode2.default.TYPE) {
                dragNode._parent._setSelected(0);
            }

            if (dragNode._parent !== null && dragNode._parent.getType() === _BorderNode2.default.TYPE) {
                dragNode._parent._setSelected(-1);
            }

            var tabSet = null;
            if (dragNode.getType() === _TabSetNode2.default.TYPE) {
                tabSet = dragNode;
            } else {
                tabSet = new _TabSetNode2.default(this._model, {});
                tabSet._addChild(dragNode);
            }
            var size = this._children.reduce(function (sum, child) {
                return sum + child.getWeight();
            }, 0);

            if (size === 0) {
                size = 100;
            }

            tabSet._setWeight(size / 3);

            if (dockLocation === _DockLocation2.default.LEFT) {
                this._addChild(tabSet, 0);
            } else if (dockLocation === _DockLocation2.default.RIGHT) {
                this._addChild(tabSet);
            } else if (dockLocation === _DockLocation2.default.TOP) {
                var vrow = new RowNode(this._model, {});
                var hrow = new RowNode(this._model, {});
                hrow._setWeight(75);
                tabSet._setWeight(25);
                this._children.forEach(function (child) {
                    hrow._addChild(child);
                });
                this._removeAll();
                vrow._addChild(tabSet);
                vrow._addChild(hrow);
                this._addChild(vrow);
            } else if (dockLocation === _DockLocation2.default.BOTTOM) {
                var _vrow = new RowNode(this._model, {});
                var _hrow = new RowNode(this._model, {});
                _hrow._setWeight(75);
                tabSet._setWeight(25);
                this._children.forEach(function (child) {
                    _hrow._addChild(child);
                });
                this._removeAll();
                _vrow._addChild(_hrow);
                _vrow._addChild(tabSet);
                this._addChild(_vrow);
            }

            this._model._activeTabSet = tabSet;

            this._model._tidy();
        }
    }, {
        key: "_toJson",
        value: function _toJson() {
            var json = {};
            attributeDefinitions.toJson(json, this._attributes);

            json.children = [];
            this._children.forEach(function (child) {
                json.children.push(child._toJson());
            });

            return json;
        }
    }, {
        key: "_getAttributeDefinitions",
        value: function _getAttributeDefinitions() {
            return attributeDefinitions;
        }
    }], [{
        key: "_fromJson",
        value: function _fromJson(json, model) {
            var newLayoutNode = new RowNode(model, json);

            if (json.children != undefined) {
                for (var i = 0; i < json.children.length; i++) {
                    var jsonChild = json.children[i];
                    if (jsonChild.type === _TabSetNode2.default.TYPE) {
                        var child = _TabSetNode2.default._fromJson(jsonChild, model);
                        newLayoutNode._addChild(child);
                    } else {
                        var _child5 = RowNode._fromJson(jsonChild, model);
                        newLayoutNode._addChild(_child5);
                    }
                }
            }

            return newLayoutNode;
        }
    }]);

    return RowNode;
}(_Node3.default);

RowNode.TYPE = "row";

var attributeDefinitions = new _AttributeDefinitions2.default();
attributeDefinitions.add("type", RowNode.TYPE, true);
attributeDefinitions.add("id", null);

attributeDefinitions.add("weight", 100);
attributeDefinitions.add("width", null);
attributeDefinitions.add("height", null);

exports.default = RowNode;