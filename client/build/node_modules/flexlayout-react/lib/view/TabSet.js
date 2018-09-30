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

var _PopupMenu = require("../PopupMenu.js");

var _PopupMenu2 = _interopRequireDefault(_PopupMenu);

var _Actions = require("../model/Actions.js");

var _Actions2 = _interopRequireDefault(_Actions);

var _TabButton = require("./TabButton.js");

var _TabButton2 = _interopRequireDefault(_TabButton);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var TabSet = function (_React$Component) {
    _inherits(TabSet, _React$Component);

    function TabSet(props) {
        _classCallCheck(this, TabSet);

        var _this = _possibleConstructorReturn(this, (TabSet.__proto__ || Object.getPrototypeOf(TabSet)).call(this, props));

        _this.recalcVisibleTabs = true;
        _this.showOverflow = false;
        _this.showToolbar = true;
        _this.state = { hideTabsAfter: 999 };
        return _this;
    }

    _createClass(TabSet, [{
        key: "componentDidMount",
        value: function componentDidMount() {
            this.updateVisibleTabs();
        }
    }, {
        key: "componentDidUpdate",
        value: function componentDidUpdate() {
            this.updateVisibleTabs();
        }
    }, {
        key: "componentWillReceiveProps",
        value: function componentWillReceiveProps(nextProps) {
            this.showToolbar = true;
            this.showOverflow = false;
            this.recalcVisibleTabs = true;
            this.setState({ hideTabsAfter: 999 });
        }
    }, {
        key: "updateVisibleTabs",
        value: function updateVisibleTabs() {
            var node = this.props.node;

            if (node.isEnableTabStrip() && this.recalcVisibleTabs) {
                var toolbarWidth = this.refs.toolbar.getBoundingClientRect().width;
                var hideTabsAfter = 999;
                for (var i = 0; i < node.getChildren().length; i++) {
                    var child = node.getChildren()[i];
                    if (child.getTabRect().getRight() > node.getRect().getRight() - (20 + toolbarWidth)) {
                        hideTabsAfter = Math.max(0, i - 1);
                        //console.log("tabs truncated to:" + hideTabsAfter);
                        this.showOverflow = node.getChildren().length > 1;

                        if (i === 0) {
                            this.showToolbar = false;
                            if (child.getTabRect().getRight() > node.getRect().getRight() - 20) {
                                this.showOverflow = false;
                            }
                        }

                        break;
                    }
                }
                if (this.state.hideTabsAfter !== hideTabsAfter) {
                    this.setState({ hideTabsAfter: hideTabsAfter });
                }
                this.recalcVisibleTabs = false;
            }
        }
    }, {
        key: "render",
        value: function render() {
            var node = this.props.node;
            var style = node._styleWithPosition();

            if (this.props.node.isMaximized()) {
                style.zIndex = 100;
            }

            var tabs = [];
            var hiddenTabs = [];
            if (node.isEnableTabStrip()) {
                for (var i = 0; i < node.getChildren().length; i++) {
                    var isSelected = this.props.node.getSelected() === i;
                    var showTab = this.state.hideTabsAfter >= i;

                    var child = node.getChildren()[i];

                    if (this.state.hideTabsAfter === i && this.props.node.getSelected() > this.state.hideTabsAfter) {
                        hiddenTabs.push({ name: child.getName(), node: child, index: i });
                        child = node.getChildren()[this.props.node.getSelected()];
                        isSelected = true;
                    } else if (!showTab && !isSelected) {
                        hiddenTabs.push({ name: child.getName(), node: child, index: i });
                    }
                    if (showTab) {
                        tabs.push(_react2.default.createElement(_TabButton2.default, { layout: this.props.layout,
                            node: child,
                            key: child.getId(),
                            selected: isSelected,
                            show: showTab,
                            height: node.getTabStripHeight(),
                            pos: i }));
                    }
                }
            }
            //tabs.forEach(c => console.log(c.key));

            var buttons = [];

            // allow customization of header contents and buttons
            var renderState = { headerContent: node.getName(), buttons: buttons };
            this.props.layout.customizeTabSet(this.props.node, renderState);
            var headerContent = renderState.headerContent;
            buttons = renderState.buttons;

            var toolbar = null;
            if (this.showToolbar === true) {
                if (this.props.node.isEnableMaximize()) {
                    buttons.push(_react2.default.createElement("button", { key: "max",
                        className: "flexlayout__tab_toolbar_button-" + (node.isMaximized() ? "max" : "min"),
                        onClick: this.onMaximizeToggle.bind(this) }));
                }
                toolbar = _react2.default.createElement(
                    "div",
                    { key: "toolbar", ref: "toolbar", className: "flexlayout__tab_toolbar",
                        onMouseDown: this.onInterceptMouseDown.bind(this) },
                    buttons
                );
            }

            if (this.showOverflow === true) {
                tabs.push(_react2.default.createElement(
                    "button",
                    { key: "overflowbutton", ref: "overflowbutton", className: "flexlayout__tab_button_overflow",
                        onClick: this.onOverflowClick.bind(this, hiddenTabs),
                        onMouseDown: this.onInterceptMouseDown.bind(this)
                    },
                    hiddenTabs.length
                ));
            }

            var showHeader = node.getName() != null;
            var header = null;
            var tabStrip = null;

            var tabStripClasses = "flexlayout__tab_header_outer";
            if (this.props.node.getClassNameTabStrip() != null) {
                tabStripClasses += " " + this.props.node.getClassNameTabStrip();
            }
            if (node.isActive() && !showHeader) {
                tabStripClasses += " flexlayout__tabset-selected";
            }

            if (node.isMaximized() && !showHeader) {
                tabStripClasses += " flexlayout__tabset-maximized";
            }

            if (showHeader) {
                var tabHeaderClasses = "flexlayout__tabset_header";
                if (node.isActive()) {
                    tabHeaderClasses += " flexlayout__tabset-selected";
                }
                if (node.isMaximized()) {
                    tabHeaderClasses += " flexlayout__tabset-maximized";
                }
                if (this.props.node.getClassNameHeader() != null) {
                    tabHeaderClasses += " " + this.props.node.getClassNameHeader();
                }

                header = _react2.default.createElement(
                    "div",
                    { className: tabHeaderClasses,
                        style: { height: node.getHeaderHeight() + "px" },
                        onMouseDown: this.onMouseDown.bind(this),
                        onTouchStart: this.onMouseDown.bind(this) },
                    headerContent,
                    toolbar
                );
                tabStrip = _react2.default.createElement(
                    "div",
                    { className: tabStripClasses,
                        style: { height: node.getTabStripHeight() + "px", top: node.getHeaderHeight() + "px" } },
                    _react2.default.createElement(
                        "div",
                        { ref: "header", className: "flexlayout__tab_header_inner" },
                        tabs
                    )
                );
            } else {
                tabStrip = _react2.default.createElement(
                    "div",
                    { className: tabStripClasses, style: { top: "0px", height: node.getTabStripHeight() + "px" },
                        onMouseDown: this.onMouseDown.bind(this),
                        onTouchStart: this.onMouseDown.bind(this) },
                    _react2.default.createElement(
                        "div",
                        { ref: "header", className: "flexlayout__tab_header_inner" },
                        tabs
                    ),
                    toolbar
                );
            }

            return _react2.default.createElement(
                "div",
                { style: style, className: "flexlayout__tabset" },
                header,
                tabStrip
            );
        }
    }, {
        key: "onOverflowClick",
        value: function onOverflowClick(hiddenTabs, event) {
            //console.log("hidden tabs: " + hiddenTabs);
            var element = this.refs.overflowbutton;
            _PopupMenu2.default.show(element, hiddenTabs, this.onOverflowItemSelect.bind(this));
        }
    }, {
        key: "onOverflowItemSelect",
        value: function onOverflowItemSelect(item) {
            var node = this.props.node;
            this.props.layout.doAction(_Actions2.default.selectTab(item.node.getId()));
        }
    }, {
        key: "onMouseDown",
        value: function onMouseDown(event) {
            var name = this.props.node.getName();
            if (name == null) {
                name = "";
            } else {
                name = ": " + name;
            }
            this.props.layout.doAction(_Actions2.default.setActiveTabset(this.props.node.getId()));
            this.props.layout.dragStart(event, "Move tabset" + name, this.props.node, this.props.node.isEnableDrag(), null, this.onDoubleClick.bind(this));
        }
    }, {
        key: "onInterceptMouseDown",
        value: function onInterceptMouseDown(event) {
            event.stopPropagation();
        }
    }, {
        key: "onMaximizeToggle",
        value: function onMaximizeToggle() {
            if (this.props.node.isEnableMaximize()) {
                this.props.layout.maximize(this.props.node);
            }
        }
    }, {
        key: "onDoubleClick",
        value: function onDoubleClick() {
            if (this.props.node.isEnableMaximize()) {
                this.props.layout.maximize(this.props.node);
            }
        }
    }]);

    return TabSet;
}(_react2.default.Component);

exports.default = TabSet;