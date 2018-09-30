"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _reactDom = require("react-dom");

var _reactDom2 = _interopRequireDefault(_reactDom);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var PopupMenu = function (_React$Component) {
    _inherits(PopupMenu, _React$Component);

    function PopupMenu(props) {
        _classCallCheck(this, PopupMenu);

        var _this = _possibleConstructorReturn(this, (PopupMenu.__proto__ || Object.getPrototypeOf(PopupMenu)).call(this, props));

        _this.onDocMouseUp = _this.onDocMouseUp.bind(_this);
        _this.hidden = false;
        return _this;
    }

    _createClass(PopupMenu, [{
        key: "componentDidMount",
        value: function componentDidMount() {
            document.addEventListener("mouseup", this.onDocMouseUp);
        }
    }, {
        key: "componentWillUnmount",
        value: function componentWillUnmount() {
            document.removeEventListener("mouseup", this.onDocMouseUp);
        }
    }, {
        key: "onDocMouseUp",
        value: function onDocMouseUp(event) {
            setInterval(function () {
                this.hide();
            }.bind(this), 0);
        }
    }, {
        key: "hide",
        value: function hide() {
            if (!this.hidden) {
                this.props.onHide();
                this.hidden = true;
            }
        }
    }, {
        key: "onItemClick",
        value: function onItemClick(item, event) {
            this.props.onSelect(item);
            this.hide();
            event.stopPropagation();
        }
    }, {
        key: "render",
        value: function render() {
            var _this2 = this;

            var items = this.props.items.map(function (item) {
                return _react2.default.createElement(
                    "div",
                    { key: item.index, className: "flexlayout__popup_menu_item",
                        onClick: _this2.onItemClick.bind(_this2, item) },
                    item.name
                );
            });

            return _react2.default.createElement(
                "div",
                { className: "popup_menu" },
                items
            );
        }
    }], [{
        key: "show",
        value: function show(triggerElement, items, onSelect) {
            var triggerRect = triggerElement.getBoundingClientRect();
            var docRect = document.body.getBoundingClientRect();

            var elm = document.createElement("div");
            elm.className = "flexlayout__popup_menu_container";
            elm.style.right = docRect.right - triggerRect.right + "px";
            elm.style.top = triggerRect.bottom + "px";
            document.body.appendChild(elm);

            var onHide = function onHide() {
                _reactDom2.default.unmountComponentAtNode(elm);
                document.body.removeChild(elm);
            };

            _reactDom2.default.render(_react2.default.createElement(PopupMenu, { element: elm, onSelect: onSelect, onHide: onHide, items: items }), elm);
            this.elm = elm;
        }
    }]);

    return PopupMenu;
}(_react2.default.Component);

exports.default = PopupMenu;