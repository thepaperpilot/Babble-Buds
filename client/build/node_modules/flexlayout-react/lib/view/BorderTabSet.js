"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _reactDom = require("react-dom");

var _reactDom2 = _interopRequireDefault(_reactDom);

var _Rect = require("../Rect.js");

var _Rect2 = _interopRequireDefault(_Rect);

var _Actions = require("../model/Actions.js");

var _Actions2 = _interopRequireDefault(_Actions);

var _BorderNode = require("../model/BorderNode.js");

var _BorderNode2 = _interopRequireDefault(_BorderNode);

var _BorderButton = require("./BorderButton.js");

var _BorderButton2 = _interopRequireDefault(_BorderButton);

var _DockLocation = require("../DockLocation.js");

var _DockLocation2 = _interopRequireDefault(_DockLocation);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var BorderTabSet = function (_React$Component) {
    _inherits(BorderTabSet, _React$Component);

    function BorderTabSet(props) {
        _classCallCheck(this, BorderTabSet);

        return _possibleConstructorReturn(this, (BorderTabSet.__proto__ || Object.getPrototypeOf(BorderTabSet)).call(this, props));
    }

    _createClass(BorderTabSet, [{
        key: "render",
        value: function render() {
            var border = this.props.border;
            var style = border.getTabHeaderRect().styleWithPosition({});
            var tabs = [];
            if (border.getLocation() != _DockLocation2.default.LEFT) {
                for (var i = 0; i < border.getChildren().length; i++) {
                    var isSelected = border.getSelected() === i;
                    var child = border.getChildren()[i];
                    tabs.push(_react2.default.createElement(_BorderButton2.default, { layout: this.props.layout,
                        border: border,
                        node: child,
                        key: child.getId(),
                        selected: isSelected,
                        height: border.getBorderBarSize(),
                        pos: i }));
                }
            } else {
                for (var _i = border.getChildren().length - 1; _i >= 0; _i--) {
                    var _isSelected = border.getSelected() === _i;
                    var _child = border.getChildren()[_i];
                    tabs.push(_react2.default.createElement(_BorderButton2.default, { layout: this.props.layout,
                        border: border,
                        node: _child,
                        key: _child.getId(),
                        selected: _isSelected,
                        height: border.getBorderBarSize(),
                        pos: _i }));
                }
            }

            var borderClasses = "flexlayout__border_" + border.getLocation().getName();
            if (this.props.border.getClassNameBorder() != null) {
                borderClasses += " " + this.props.border.getClassNameBorder();
            }

            // allow customization of tabset right/bottom buttons
            var buttons = [];
            var renderState = { buttons: buttons };
            this.props.layout.customizeTabSet(border, renderState);
            buttons = renderState.buttons;

            //buttons.push(<button
            //    key="1"
            //    className={"flexlayout__tab_toolbar_button-min"}></button>);

            var toolbar = _react2.default.createElement(
                "div",
                {
                    key: "toolbar",
                    ref: "toolbar",
                    className: "flexlayout__border_toolbar_" + border.getLocation().getName() },
                buttons
            );

            return _react2.default.createElement(
                "div",
                {
                    style: style,
                    className: borderClasses },
                _react2.default.createElement(
                    "div",
                    { className: "flexlayout__border_inner_" + border.getLocation().getName() },
                    tabs
                ),
                toolbar
            );
        }
    }]);

    return BorderTabSet;
}(_react2.default.Component);

exports.default = BorderTabSet;