(function() {
	var Main = /*@__PURE__*/ (function(Component) {
		function Main(props) {
			Component.call(this, props);
			this.data = {
				msg: "Hello APICloud"
			};
		}

		if (Component) Main.__proto__ = Component;
		Main.prototype = Object.create(Component && Component.prototype);
		Main.prototype.constructor = Main;
		Main.prototype.apiready = function() {};
		Main.prototype.render = function() {
			return apivm.h(
				"safe-area",
				{class: "page"},
				apivm.h(
					"view",
					{class: "header"},
					apivm.h("text", {class: "title"}, "首页")
				),
				apivm.h(
					"view",
					{class: "body"},
					apivm.h("text", {class: "h1"}, "Hello , APICloud"),
					apivm.h("img", {class: "img", src: "../../image/img.png"}),
					apivm.h("text", {class: "p"}, "拖入组件搭建你的第一个 APP")
				)
			);
		};

		return Main;
	})(Component);
	Main.css = {
		".page": {height: "100%", background: "#fff"},
		".header": {height: "44px", justifyContent: "center", alignItems: "center"},
		".title": {fontSize: "16px", fontWeight: "bold", color: "#333"},
		".body": {background: "#f5f6f7", flex: "1"},
		".h1": {
			fontSize: "22px",
			fontWeight: "bold",
			color: "#333",
			textAlign: "center",
			margin: "50px"
		},
		".img": {maxWidth: "100%"},
		".p": {color: "#aaa", textAlign: "center", fontSize: "16px", margin: "15px"}
	};
	apivm.define("main", Main);
	apivm.render(apivm.h("main", null), "body");
})();
