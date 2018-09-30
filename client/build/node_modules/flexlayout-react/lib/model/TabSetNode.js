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

var _DropInfo = require("./../DropInfo.js");

var _DropInfo2 = _interopRequireDefault(_DropInfo);

var _Node2 = require("./Node.js");

var _Node3 = _interopRequireDefault(_Node2);

var _TabNode = require("./TabNode.js");

var _TabNode2 = _interopRequireDefault(_TabNode);

var _RowNode = require("./RowNode.js");

var _RowNode2 = _interopRequireDefault(_RowNode);

var _BorderNode = require("./BorderNode.js");

var _BorderNode2 = _interopRequireDefault(_BorderNode);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var TabSetNode = function (_Node) {
    _inherits(TabSetNode, _Node);

    function TabSetNode(model, json) {
        _classCallCheck(this, TabSetNode);

        var _this = _possibleConstructorReturn(this, (TabSetNode.__proto__ || Object.getPrototypeOf(TabSetNode)).call(this, model));

        _this._contentRect = null;
        _this._headerRect = null;
        _this._tabHeaderRect = null;

        attributeDefinitions.fromJson(json, _this._attributes);
        model._addNode(_this);
        return _this;
    }

    _createClass(TabSetNode, [{
        key: "getName",
        value: function getName() {
            return this._attributes["name"];
        }
    }, {
        key: "getSelected",
        value: function getSelected() {
            return this._attributes["selected"];
        }
    }, {
        key: "getSelectedNode",
        value: function getSelectedNode() {
            var selected = this.getSelected();
            if (selected != -1) {
                return this._children[selected];
            }
            return null;
        }
    }, {
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
        key: "isMaximized",
        value: function isMaximized() {
            return this._model.getMaximizedTabset() === this;
        }
    }, {
        key: "isActive",
        value: function isActive() {
            return this._model.getActiveTabset() === this;
        }
    }, {
        key: "isEnableDeleteWhenEmpty",
        value: function isEnableDeleteWhenEmpty() {
            return this._getAttr("enableDeleteWhenEmpty");
        }
    }, {
        key: "isEnableClose",
        value: function isEnableClose() {
            return this._getAttr("enableClose");
        }
    }, {
        key: "isEnableDrop",
        value: function isEnableDrop() {
            return this._getAttr("enableDrop");
        }
    }, {
        key: "isEnableDrag",
        value: function isEnableDrag() {
            return this._getAttr("enableDrag");
        }
    }, {
        key: "isEnableDivide",
        value: function isEnableDivide() {
            return this._getAttr("enableDivide");
        }
    }, {
        key: "isEnableMaximize",
        value: function isEnableMaximize() {
            return this._getAttr("enableMaximize");
        }
    }, {
        key: "isEnableTabStrip",
        value: function isEnableTabStrip() {
            return this._getAttr("enableTabStrip");
        }
    }, {
        key: "getClassNameTabStrip",
        value: function getClassNameTabStrip() {
            return this._getAttr("classNameTabStrip");
        }
    }, {
        key: "getClassNameHeader",
        value: function getClassNameHeader() {
            return this._getAttr("classNameHeader");
        }
    }, {
        key: "getHeaderHeight",
        value: function getHeaderHeight() {
            return this._getAttr("headerHeight");
        }
    }, {
        key: "getTabStripHeight",
        value: function getTabStripHeight() {
            return this._getAttr("tabStripHeight");
        }
    }, {
        key: "_setWeight",
        value: function _setWeight(weight) {
            this._attributes["weight"] = weight;
        }
    }, {
        key: "_setSelected",
        value: function _setSelected(index) {
            this._attributes["selected"] = index;
        }
    }, {
        key: "_canDrop",
        value: function _canDrop(dragNode, x, y) {
            var dropInfo = null;

            if (dragNode === this) {
                var dockLocation = _DockLocation2.default.CENTER;
                var outlineRect = this._tabHeaderRect;
                dropInfo = new _DropInfo2.default(this, outlineRect, dockLocation, -1, "flexlayout__outline_rect");
            } else if (this._contentRect.contains(x, y)) {
                var _dockLocation = _DockLocation2.default.getLocation(this._contentRect, x, y);
                var _outlineRect = _dockLocation.getDockRect(this._rect);
                dropInfo = new _DropInfo2.default(this, _outlineRect, _dockLocation, -1, "flexlayout__outline_rect");
            } else if (this._children.length > 0 && this._tabHeaderRect != null && this._tabHeaderRect.contains(x, y)) {
                var child = this._children[0];
                var r = child._tabRect;
                var yy = r.y;
                var h = r.height;
                var p = this._tabHeaderRect.x;
                var childCenter = 0;
                for (var i = 0; i < this._children.length; i++) {
                    child = this._children[i];
                    r = child._tabRect;
                    childCenter = r.x + r.width / 2;
                    if (x >= p && x < childCenter) {
                        var _dockLocation2 = _DockLocation2.default.CENTER;
                        var _outlineRect2 = new _Rect2.default(r.x - 2, yy, 3, h);
                        dropInfo = new _DropInfo2.default(this, _outlineRect2, _dockLocation2, i, "flexlayout__outline_rect");
                        break;
                    }
                    p = childCenter;
                }
                if (dropInfo == null) {
                    var _dockLocation3 = _DockLocation2.default.CENTER;
                    var _outlineRect3 = new _Rect2.default(r.getRight() - 2, yy, 3, h);
                    dropInfo = new _DropInfo2.default(this, _outlineRect3, _dockLocation3, this._children.length, "flexlayout__outline_rect");
                }
            }

            if (!dragNode._canDockInto(dragNode, dropInfo)) {
                return null;
            }

            return dropInfo;
        }
    }, {
        key: "_layout",
        value: function _layout(rect) {
            var _this2 = this;

            if (this.isMaximized()) {
                rect = this._model._root._rect;
            }
            this._rect = rect;

            var showHeader = this.getName() != null;
            var y = 0;
            if (showHeader) {
                this._headerRect = new _Rect2.default(rect.x, rect.y, rect.width, this.getHeaderHeight());
                y += this.getHeaderHeight();
            }
            if (this.isEnableTabStrip()) {
                this._tabHeaderRect = new _Rect2.default(rect.x, rect.y + y, rect.width, this.getTabStripHeight());
                y += this.getTabStripHeight();
            }
            this._contentRect = new _Rect2.default(rect.x, rect.y + y, rect.width, rect.height - y);

            this._children.forEach(function (child, i) {
                child._layout(_this2._contentRect);
                child._setVisible(i === _this2.getSelected());
            });
        }
    }, {
        key: "_remove",
        value: function _remove(node) {
            this._removeChild(node);
            this._model._tidy();
            this._setSelected(Math.max(0, this.getSelected() - 1));
        }
    }, {
        key: "_drop",
        value: function _drop(dragNode, location, index) {
            var _this3 = this;

            var dockLocation = location;

            if (this === dragNode) {
                // tabset drop into itself
                return; // dock back to itself
            }

            var selectedNode = null;
            var fromIndex = 0;
            if (dragNode._parent != null) {
                selectedNode = dragNode._parent.getSelectedNode;
                fromIndex = dragNode._parent._removeChild(dragNode);
            }
            //console.log("removed child: " + fromIndex);

            // if dropping a tab back to same tabset and moving to forward position then reduce insertion index
            if (dragNode.getType() === _TabNode2.default.TYPE && dragNode._parent === this && fromIndex < index && index > 0) {
                index--;
            }

            // for the tabset/border being removed from set the selected index
            if (dragNode._parent !== null) {
                if (dragNode._parent.getType() === TabSetNode.TYPE) {
                    dragNode._parent._setSelected(0);
                } else if (dragNode._parent.getType() === _BorderNode2.default.TYPE) {
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
            if (dockLocation === _DockLocation2.default.CENTER) {
                var insertPos = index;
                if (insertPos === -1) {
                    insertPos = this._children.length;
                }

                if (dragNode.getType() === _TabNode2.default.TYPE) {
                    this._addChild(dragNode, insertPos);
                    this._setSelected(insertPos);
                    //console.log("added child at : " + insertPos);
                } else {
                    dragNode._children.forEach(function (child, i) {
                        _this3._addChild(child, insertPos);
                        //console.log("added child at : " + insertPos);
                        insertPos++;
                    });
                }
                this._model._activeTabSet = this;
            } else {
                var tabSet = null;
                if (dragNode.getType() === _TabNode2.default.TYPE) {
                    // create new tabset parent
                    //console.log("create a new tabset");
                    tabSet = new TabSetNode(this._model, {});
                    tabSet._addChild(dragNode);
                    //console.log("added child at end");
                    dragNode._parent = tabSet;
                } else {
                    tabSet = dragNode;
                }

                var parentRow = this._parent;
                var pos = parentRow._children.indexOf(this);

                if (parentRow.getOrientation() === dockLocation._orientation) {
                    tabSet._setWeight(this.getWeight() / 2);
                    this._setWeight(this.getWeight() / 2);
                    //console.log("added child 50% size at: " +  pos + dockLocation.indexPlus);
                    parentRow._addChild(tabSet, pos + dockLocation._indexPlus);
                } else {
                    // create a new row to host the new tabset (it will go in the opposite direction)
                    //console.log("create a new row");
                    var newRow = new _RowNode2.default(this._model, {});
                    newRow._setWeight(this.getWeight());
                    newRow._addChild(this);
                    this._setWeight(50);
                    tabSet._setWeight(50);
                    //console.log("added child 50% size at: " +  dockLocation.indexPlus);
                    newRow._addChild(tabSet, dockLocation._indexPlus);

                    parentRow._removeChild(this);
                    parentRow._addChild(newRow, pos);
                }
                this._model._activeTabSet = tabSet;
            }
            this._model._tidy();
        }
    }, {
        key: "_toJson",
        value: function _toJson() {
            var json = {};
            attributeDefinitions.toJson(json, this._attributes);
            json.children = this._children.map(function (child) {
                return child._toJson();
            });

            if (this.isActive()) {
                json.active = true;
            }

            if (this.isMaximized()) {
                json.maximized = true;
            }

            return json;
        }
    }, {
        key: "_updateAttrs",
        value: function _updateAttrs(json) {
            attributeDefinitions.update(json, this._attributes);
        }
    }, {
        key: "_getAttributeDefinitions",
        value: function _getAttributeDefinitions() {
            return attributeDefinitions;
        }
    }], [{
        key: "_fromJson",
        value: function _fromJson(json, model) {
            var newLayoutNode = new TabSetNode(model, json);

            if (json.children != undefined) {
                json.children.forEach(function (jsonChild) {
                    var child = _TabNode2.default._fromJson(jsonChild, model);
                    newLayoutNode._addChild(child);
                });
            }

            if (json.maximized && json.maximized == true) {
                model._setMaximizedTabset(newLayoutNode);
            }

            if (json.active && json.active == true) {
                model._setActiveTabset(newLayoutNode);
            }

            return newLayoutNode;
        }
    }]);

    return TabSetNode;
}(_Node3.default);

TabSetNode.TYPE = "tabset";

var attributeDefinitions = new _AttributeDefinitions2.default();
attributeDefinitions.add("type", TabSetNode.TYPE, true);
attributeDefinitions.add("id", null).setType(_Attribute2.default.ID);

attributeDefinitions.add("weight", 100);
attributeDefinitions.add("width", null);
attributeDefinitions.add("height", null);
attributeDefinitions.add("selected", 0);
attributeDefinitions.add("name", null).setType(_Attribute2.default.STRING);

attributeDefinitions.addInherited("enableDeleteWhenEmpty", "tabSetEnableDeleteWhenEmpty");
attributeDefinitions.addInherited("enableClose", "tabSetEnableClose");
attributeDefinitions.addInherited("enableDrop", "tabSetEnableDrop");
attributeDefinitions.addInherited("enableDrag", "tabSetEnableDrag");
attributeDefinitions.addInherited("enableDivide", "tabSetEnableDivide");
attributeDefinitions.addInherited("enableMaximize", "tabSetEnableMaximize");
attributeDefinitions.addInherited("classNameTabStrip", "tabSetClassNameTabStrip");
attributeDefinitions.addInherited("classNameHeader", "tabSetClassNameHeader");
attributeDefinitions.addInherited("enableTabStrip", "tabSetEnableTabStrip");

attributeDefinitions.addInherited("headerHeight", "tabSetHeaderHeight");
attributeDefinitions.addInherited("tabStripHeight", "tabSetTabStripHeight");

exports.default = TabSetNode;