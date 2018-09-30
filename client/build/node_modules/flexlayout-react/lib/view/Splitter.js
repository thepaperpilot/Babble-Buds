"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _reactDom = require("react-dom");

var _reactDom2 = _interopRequireDefault(_reactDom);

var _DragDrop = require("../DragDrop.js");

var _DragDrop2 = _interopRequireDefault(_DragDrop);

var _Orientation = require("../Orientation.js");

var _Orientation2 = _interopRequireDefault(_Orientation);

var _BorderNode = require("../model/BorderNode.js");

var _BorderNode2 = _interopRequireDefault(_BorderNode);

var _Actions = require("../model/Actions.js");

var _Actions2 = _interopRequireDefault(_Actions);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Splitter = function (_React$Component) {
    _inherits(Splitter, _React$Component);

    function Splitter() {
        _classCallCheck(this, Splitter);

        return _possibleConstructorReturn(this, (Splitter.__proto__ || Object.getPrototypeOf(Splitter)).apply(this, arguments));
    }

    _createClass(Splitter, [{
        key: "onMouseDown",
        value: function onMouseDown(event) {
            _DragDrop2.default.instance.startDrag(event, this.onDragStart.bind(this), this.onDragMove.bind(this), this.onDragEnd.bind(this), this.onDragCancel.bind(this));
        }
    }, {
        key: "onDragCancel",
        value: function onDragCancel() {
            var rootdiv = _reactDom2.default.findDOMNode(this.props.layout);
            rootdiv.removeChild(this.outlineDiv);
        }
    }, {
        key: "onDragStart",
        value: function onDragStart(event) {
            this.pBounds = this.props.node.getParent()._getSplitterBounds(this.props.node);
            var rootdiv = _reactDom2.default.findDOMNode(this.props.layout);
            this.outlineDiv = document.createElement("div");
            this.outlineDiv.style.position = "absolute";
            this.outlineDiv.className = "flexlayout__splitter_drag";
            this.outlineDiv.style.cursor = this.props.node.getOrientation() === _Orientation2.default.HORZ ? "ns-resize" : "ew-resize";
            this.props.node.getRect().positionElement(this.outlineDiv);
            rootdiv.appendChild(this.outlineDiv);
            return true;
        }
    }, {
        key: "onDragMove",
        value: function onDragMove(event) {
            var clientRect = _reactDom2.default.findDOMNode(this.props.layout).getBoundingClientRect();
            var pos = {
                x: event.clientX - clientRect.left,
                y: event.clientY - clientRect.top
            };

            if (this.props.node.getOrientation() === _Orientation2.default.HORZ) {
                this.outlineDiv.style.top = this.getBoundPosition(pos.y - 4) + "px";
            } else {
                this.outlineDiv.style.left = this.getBoundPosition(pos.x - 4) + "px";
            }
        }
    }, {
        key: "onDragEnd",
        value: function onDragEnd(event) {
            var node = this.props.node;
            var value = 0;
            if (node.getOrientation() === _Orientation2.default.HORZ) {
                value = this.outlineDiv.offsetTop;
            } else {
                value = this.outlineDiv.offsetLeft;
            }

            if (node.getParent().getType() == _BorderNode2.default.TYPE) {
                var pos = node.getParent()._calculateSplit(node, value);
                this.props.layout.doAction(_Actions2.default.adjustBorderSplit(node.getParent().getId(), pos));
            } else {
                var splitSpec = node.getParent()._calculateSplit(this.props.node, value);
                if (splitSpec != null) {
                    this.props.layout.doAction(_Actions2.default.adjustSplit(splitSpec));
                }
            }

            var rootdiv = _reactDom2.default.findDOMNode(this.props.layout);
            rootdiv.removeChild(this.outlineDiv);
        }
    }, {
        key: "getBoundPosition",
        value: function getBoundPosition(p) {
            var rtn = p;
            if (p < this.pBounds[0]) {
                rtn = this.pBounds[0];
            }
            if (p > this.pBounds[1]) {
                rtn = this.pBounds[1];
            }

            return rtn;
        }
    }, {
        key: "render",
        value: function render() {
            var node = this.props.node;
            var style = node._styleWithPosition({
                cursor: this.props.node.getOrientation() === _Orientation2.default.HORZ ? "ns-resize" : "ew-resize"
            });

            return _react2.default.createElement("div", { style: style, onTouchStart: this.onMouseDown.bind(this), onMouseDown: this.onMouseDown.bind(this),
                className: "flexlayout__splitter" });
        }
    }]);

    return Splitter;
}(_react2.default.Component);

exports.default = Splitter;