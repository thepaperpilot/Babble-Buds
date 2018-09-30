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

var _PopupMenu = require("../PopupMenu.js");

var _PopupMenu2 = _interopRequireDefault(_PopupMenu);

var _Actions = require("../model/Actions.js");

var _Actions2 = _interopRequireDefault(_Actions);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var TabButton = function (_React$Component) {
    _inherits(TabButton, _React$Component);

    function TabButton(props) {
        _classCallCheck(this, TabButton);

        var _this = _possibleConstructorReturn(this, (TabButton.__proto__ || Object.getPrototypeOf(TabButton)).call(this, props));

        _this.state = { editing: false };
        _this.onEndEdit = _this.onEndEdit.bind(_this);
        return _this;
    }

    _createClass(TabButton, [{
        key: "onMouseDown",
        value: function onMouseDown(event) {
            this.props.layout.dragStart(event, "Move: " + this.props.node.getName(), this.props.node, this.props.node.isEnableDrag(), this.onClick.bind(this), this.onDoubleClick.bind(this));
        }
    }, {
        key: "onClick",
        value: function onClick(event) {
            var node = this.props.node;
            this.props.layout.doAction(_Actions2.default.selectTab(node.getId()));
        }
    }, {
        key: "onDoubleClick",
        value: function onDoubleClick(event) {
            if (this.props.node.isEnableRename()) {
                this.setState({ editing: true });
                document.body.addEventListener("mousedown", this.onEndEdit);
                document.body.addEventListener("touchstart", this.onEndEdit);
            } else {
                if (this.props.node._parent.isEnableMaximize()) {
                    this.props.layout.maximize(this.props.node.getParent());
                }
            }
        }
    }, {
        key: "onEndEdit",
        value: function onEndEdit(event) {
            if (event.target !== this.refs.contents) {
                this.setState({ editing: false });
                document.body.removeEventListener("mousedown", this.onEndEdit);
                document.body.removeEventListener("touchstart", this.onEndEdit);
            }
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
            if (this.state.editing) {
                this.refs.contents.select();
            }
        }
    }, {
        key: "updateRect",
        value: function updateRect() {
            // record position of tab in node
            var clientRect = _reactDom2.default.findDOMNode(this.props.layout).getBoundingClientRect();
            var r = this.refs.self.getBoundingClientRect();
            this.props.node.setTabRect(new _Rect2.default(r.left - clientRect.left, r.top - clientRect.top, r.width, r.height));
            this.contentWidth = this.refs.contents.getBoundingClientRect().width;
        }
    }, {
        key: "onTextBoxMouseDown",
        value: function onTextBoxMouseDown(event) {
            //console.log("onTextBoxMouseDown");
            event.stopPropagation();
        }
    }, {
        key: "onTextBoxKeyPress",
        value: function onTextBoxKeyPress(event) {
            //console.log(event, event.keyCode);
            if (event.keyCode === 27) {
                // esc
                this.setState({ editing: false });
            } else if (event.keyCode === 13) {
                // enter
                this.setState({ editing: false });
                var node = this.props.node;

                this.props.layout.doAction(_Actions2.default.renameTab(node.getId(), event.target.value));
            }
        }
    }, {
        key: "doRename",
        value: function doRename(node, newName) {
            this.props.layout.doAction(_Actions2.default.renameTab(node.getId(), newName));
        }
    }, {
        key: "render",
        value: function render() {
            var classNames = "flexlayout__tab_button";
            var node = this.props.node;

            if (this.props.selected) {
                classNames += " flexlayout__tab_button--selected";
            } else {
                classNames += " flexlayout__tab_button--unselected";
            }

            if (this.props.node.getClassName() != null) {
                classNames += " " + this.props.node.getClassName();
            }

            var leadingContent = null;

            if (node.getIcon() != null) {
                leadingContent = _react2.default.createElement("img", { src: node.getIcon() });
            }

            // allow customization of leading contents (icon) and contents
            var renderState = { leading: leadingContent, content: node.getName() };
            this.props.layout.customizeTab(node, renderState);

            var content = _react2.default.createElement(
                "div",
                { ref: "contents", className: "flexlayout__tab_button_content" },
                renderState.content
            );
            var leading = _react2.default.createElement(
                "div",
                { className: "flexlayout__tab_button_leading" },
                renderState.leading
            );

            if (this.state.editing) {
                var contentStyle = { width: this.contentWidth + "px" };
                content = _react2.default.createElement("input", { style: contentStyle,
                    ref: "contents",
                    className: "flexlayout__tab_button_textbox",
                    type: "text",
                    autoFocus: true,
                    defaultValue: node.getName(),
                    onKeyDown: this.onTextBoxKeyPress.bind(this),
                    onMouseDown: this.onTextBoxMouseDown.bind(this),
                    onTouchStart: this.onTextBoxMouseDown.bind(this)
                });
            }

            var closeButton = null;
            if (this.props.node.isEnableClose()) {
                closeButton = _react2.default.createElement("div", { className: "flexlayout__tab_button_trailing",
                    onMouseDown: this.onCloseMouseDown.bind(this),
                    onClick: this.onClose.bind(this),
                    onTouchStart: this.onCloseMouseDown.bind(this)
                });
            }

            return _react2.default.createElement(
                "div",
                { ref: "self",
                    style: { visibility: this.props.show ? "visible" : "hidden",
                        height: this.props.height },
                    className: classNames,
                    onMouseDown: this.onMouseDown.bind(this),
                    onTouchStart: this.onMouseDown.bind(this) },
                leading,
                content,
                closeButton
            );
        }
    }]);

    return TabButton;
}(_react2.default.Component);

exports.default = TabButton;