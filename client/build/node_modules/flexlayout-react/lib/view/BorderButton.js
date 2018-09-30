'use strict';

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

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var BorderButton = function (_React$Component) {
    _inherits(BorderButton, _React$Component);

    function BorderButton(props) {
        _classCallCheck(this, BorderButton);

        return _possibleConstructorReturn(this, (BorderButton.__proto__ || Object.getPrototypeOf(BorderButton)).call(this, props));
    }

    _createClass(BorderButton, [{
        key: "onMouseDown",
        value: function onMouseDown(event) {
            this.props.layout.dragStart(event, "Move: " + this.props.node.getName(), this.props.node, this.props.node.isEnableDrag(), this.onClick.bind(this), null);
        }
    }, {
        key: "onClick",
        value: function onClick(event) {
            var node = this.props.node;
            this.props.layout.doAction(_Actions2.default.selectTab(node.getId()));
        }
    }, {
        key: "onClose",
        value: function onClose(event) {
            var node = this.props.node;
            this.props.layout.doAction(_Actions2.default.deleteTab(node.getId()));
        }
    }, {
        key: "onCloseMouseDown",
        value: function onCloseMouseDown(event) {
            event.stopPropagation();
        }
    }, {
        key: "componentDidMount",
        value: function componentDidMount() {
            this.updateRect();
        }
    }, {
        key: "componentDidUpdate",
        value: function componentDidUpdate() {
            this.updateRect();
        }
    }, {
        key: "updateRect",
        value: function updateRect() {
            // record position of tab in border
            var clientRect = _reactDom2.default.findDOMNode(this.props.layout).getBoundingClientRect();
            var r = this.refs.self.getBoundingClientRect();
            this.props.node.setTabRect(new _Rect2.default(r.left - clientRect.left, r.top - clientRect.top, r.width, r.height));
            this.contentWidth = this.refs.contents.getBoundingClientRect().width;
        }
    }, {
        key: "render",
        value: function render() {
            var classNames = "flexlayout__border_button flexlayout__border_button_" + this.props.border.getLocation().getName();
            var node = this.props.node;

            if (this.props.selected) {
                classNames += " flexlayout__border_button--selected";
            } else {
                classNames += " flexlayout__border_button--unselected";
            }

            if (this.props.node.getClassName() != null) {
                classNames += " " + this.props.node.getClassName();
            }

            var leadingContent = null;

            if (node.getIcon() != null) {
                leadingContent = _react2.default.createElement("img", { src: node.getIcon() });
            }

            var content = _react2.default.createElement(
                "div",
                { ref: "contents", className: "flexlayout__border_button_content" },
                node.getName()
            );

            var closeButton = null;
            if (this.props.node.isEnableClose()) {
                closeButton = _react2.default.createElement("div", { className: "flexlayout__border_button_trailing",
                    onMouseDown: this.onCloseMouseDown.bind(this),
                    onClick: this.onClose.bind(this),
                    onTouchStart: this.onCloseMouseDown.bind(this)
                });
            }

            return _react2.default.createElement(
                "div",
                { ref: "self",
                    style: {},
                    className: classNames,
                    onMouseDown: this.onMouseDown.bind(this),
                    onTouchStart: this.onMouseDown.bind(this) },
                leadingContent,
                content,
                closeButton
            );
        }
    }]);

    return BorderButton;
}(_react2.default.Component);

exports.default = BorderButton;