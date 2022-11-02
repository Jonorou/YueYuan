var APP = {
    //ajax域名路径
    baseUrl: 'https://metaswapweb.cn/v1/',
    //图片相对路径
    imgUrl: '../',
    //URL Scheme
    schemeUrl: 'huanhuandaba://',
    //https双向验证证书
    certPath: '',
    certPassword: '',
    //openWin根目录路径
    winPath: 'widget://',
    //openFrame根目录路径
    framePath: 'widget://html/',
    //setCustomRefreshHeaderInfo配置项
    refreshHeader: {
          bgColor: '#fef6fe',
          loadAnimInterval: 100,
          image: {
              pull: ['widget://image/logo.png'],
              load: ['widget://image/1.gif', 'widget://image/2.gif', 'widget://image/3.gif', 'widget://image/4.gif', 'widget://image/5.gif', 'widget://image/6.gif', 'widget://image/7.gif', 'widget://image/8.gif', 'widget://image/9.gif', 'widget://image/10.gif'],
          }
    },

    /**
    * 封装 api.openWin
    * string|array name win文件名|[winName，win文件名]
    * json pageParam (可选)传参 api.pageParam，可忽略，直接传第三参数
    * boolen isLogin (可选)是否需要检查登陆状态
    * json params   (可选)openWin其他属性参数
    **/
    openWin: function(name, pageParam, isLogin, params) {
        typeof pageParam === 'boolean' && (isLogin = pageParam, pageParam = {});
        if(isLogin && $api.getStorage('token') === undefined) return void this.openWin('login');
        var url = name; typeof name === 'object' && (url = name[1], name = name[0]);
        params = params || {};
        Object.assign(params, {
            name: name,
            url: this.winPath + url +'.html',
            pageParam: pageParam,
            slidBackType: 'edge'
        });
        api.openWin(params);
    },

    /**
    * openwin禁用动画效果，模拟底部导航的openFrameGroup，主要解决顶部不一致问题
    * string|array name win文件名|[winName，win文件名]
    * boolen isLogin (可选)是否需要检查登陆状态
    **/
    openBar: function(name, pageParam, isLogin) {
        this.openWin(name, pageParam, isLogin, {
            slidBackEnabled: false,
            animation: {type:'none'},
        });
    },

    //计算frame rect
    frameRect: function(rect){
        if(rect){
            var header_h = footer_h = 0;
            if(rect.header){
                header_h = $api.fixStatusBar($api.byId(rect.header[0]));
                if(rect.header[1]) header_h += $api.offset($api.byId(rect.header[1])).h;
            }
            if(rect.footer){
                footer_h = $api.fixTabBar($api.byId(rect.footer));
            }
            if(header_h > 0 || footer_h > 0)
            rect = {x: 0, y: header_h, w: 'auto', h: api.winHeight-header_h-footer_h};
        }
        return rect;
    },

    /**
    * 封装 api.openFrame
    * string name (可选)frm文件名，默认当前winName，可忽略，直接传第二参数
    * json params   (可选)openFrame其他属性参数，注：rect可传xywh，或者{header:['最顶部id1','id2'], footer:'最底部id'}
    **/
    openFrame: function(name, params) {
        typeof name !== 'string' && (params = name, name = api.winName);
        params = params || {};
        Object.assign(params, {
            name: name,
            url: this.framePath + name +'.html',
            pageParam: params.pageParam || api.pageParam,
            rect: this.frameRect(params.rect)
        });
        api.openFrame(params);
    },

    /**
    * 封装 api.openFrame浮窗筛选器
    * string name frm文件名
    * json pageParam api.pageParam
    * json rect   (可选)this.openFrame的rect值
    **/
    openMask: function(name, pageParam, rect){
        this.openFrame(name, {
            pageParam: pageParam,
            rect: rect,
            bounces: false,
            animation: {type: 'fade'},
        });
    },

    /**
    * 封装 api.openFrameGroup
    * number|array tab  1：指定frameName：['a','b']，2：frame数量，frameGroupName=winName，frameName=winName0|winName1
    * json params  (可选)openFrame其他属性参数，注：rect可传xywh，或者{header:['最顶部id1','id2'], footer:['最底部id1','id2']}
    * function fn  (可选)回调函数
    **/
    openFrameGroup: function(tab, params, fn) {
        var frames = [];
        var winName = api.winName;
        var pageParam = api.pageParam;
        if(typeof tab === 'number'){
            for (var i = 0; i < tab; i++) {
                frames[i] = {
                    name : winName + i,
                    url : this.framePath + winName +'.html',
                    pageParam: Object.assign({}, pageParam, {i: i}),
                }
            }
        }else{
            for (var i in tab) {
                frames[i] = {
                    name : tab[i],
                    url : this.framePath + tab[i] +'.html',
                    pageParam: Object.assign({}, pageParam, {i: i}),
                }
            }
        }
        params = params || {};
        Object.assign(params, {
            name: winName,
            frames: frames,
            preload: 0,
            rect: this.frameRect(params.rect)
        });
        api.openFrameGroup(params, function(ret){
            fn && fn(ret);
        });
    },

    /**
    * 链接解析，用于服务器链接智能识别，如，app内web和本地win页面互跳，外部浏览器唤醒本app。
    * 1、app协议：app://?@=name&a=1&b=2，2、http/https协议：https://www.mmyya.com?a=1&b=2
    * string url    跳转链接
    * string title  (可选)标题
    **/
    aLink: function(url, title) {
        if (url === '') return false;
        var pageParam = {};
        //app协议网址
        if(url.indexOf(this.schemeUrl) === 0){
            pageParam = url.slice(this.schemeUrl.length+1).split('&').reduce(function(res, item){
                query = item.split('=')
                res[query[0]] = query[1];
                return res;
            }, {});
        //正常网址
        }else{
            pageParam = {
                '@': 'web',
                url: url
            }
        }
        pageParam.title = title || '';
        this.openWin(pageParam['@'], pageParam);
    },

    /**
    * 监听广播事件，可广播到多个指定页面
    * array winframeName  (可选)广播到指定页面，['winName','winName/frameName']，可忽略，直接传第三参数
    * array pageParam   (可选)类似api.pageParam，可忽略，直接传第三参数
    * function fn   (可选)默认刷新，可自定义监听事件，返回两个参数：1、来源array：[winName,frameName]，2、pageParam值，任意类型
    **/
    bindEvent: function(winframeName, pageParam, fn) {
        if(winframeName === undefined || typeof winframeName === 'function'){
            fn = winframeName;
            api.addEventListener({
                name: api.winName + (api.frameName && '/'+api.frameName)
            }, function(ret){
                if(ret && ret.value){
                    fn ? fn(ret.value.source, ret.value.pageParam) : window.location.reload();
                }
            });
        }else{
            for (var i = 0; i < winframeName.length; i++) {
                api.sendEvent({
                    name: winframeName[i],
                    extra: {
                        source: [api.winName, api.frameName],
                        pageParam: pageParam
                    }
                });
            }
        }
    },

    /**
    * 上拉加载更多
    * function fn   (可选)function=添加监听，undefined=移除监听
    **/
    loadMore: function(fn){
        if (typeof(fn) === 'function') {
            //添加上拉加载监听
            api.addEventListener({
                name: 'scrolltobottom'
            }, function(){
                fn();
            });
        }else{
            //移除上拉加载监听
            api.removeEventListener({name: 'scrolltobottom'});
        }
    },

    //下拉刷新
    pullRefresh: function(fn) {
        api.setCustomRefreshHeaderInfo(this.refreshHeader, function() {
            setTimeout(function(){
                api.refreshHeaderLoadDone();
                fn ? fn() : window.location.reload();
            }, 1500);
        });
    },

    //检验手机号合法性
    isMobile: function(str) {
        return /^1[34578]\d{9}$/.test(str);
    },

    /**
    * 发送验证码
    * json obj      {seconds: 总秒数，默认60, timer: 计时器，默认0, t: 倒计秒，默认0}
    * function mobile   接受短信的手机号
    **/
    sendSms: function(obj, mobile){
        //防止重载
        if(this.isMobile(mobile) === false || obj.timer > 0) return false;
        //重发按钮倒计时
        obj.t = obj.seconds;
        obj.timer = window.setInterval(function(){
            if(--obj.t <= 0){
                window.clearInterval(obj.timer);
                obj.timer = 0;
            }
        }, 1000);
        //mob短信验证码
        var smsVerify = api.require('smsVerify');
        smsVerify.register();
        smsVerify.sms({phone: mobile});
    },

    /**
    * 单选图片或拍照
    * function fn    返回图片绝对路径
    **/
    getPicture: function(title, fn){
        api.actionSheet({
            title: title,
            buttons: ['拍照', '从相册选择'],
        }, function(ret){
            if(ret){
                if(ret.buttonIndex == 1){
                    var sourceType = 'camera';
                }else
                if(ret.buttonIndex == 2){
                    var sourceType = 'album';
                }else{
                    return false;
                }
                api.getPicture({
                    sourceType: sourceType,
                    encodingType: 'jpg',
                    quality: 90,
                }, function(ret) {
                    if(ret && ret.data){
                        fn && fn(ret.data);
                    }
                });
            }
        });
    },

    //图片完整地址
    getImgUrl: function(img){
        return img;
    },

    //格式化 UNIX 时间戳为人易读的字符串
    dateFormat: function(time, istamp) {
        var now = Date.parse(new Date()) / 1000;
        var timediff = now - time;
        var chunks = [
            [60 * 60 * 24 * 7, '周前'],
            [60 * 60 * 24, '天前'],
            [60 * 60, '小时前'],
            [60, '分钟前'],
            [1, '秒前']
        ];
        if(istamp || timediff > chunks[0][0] * 2){
            var now = new Date(time * 1000);
            return now.getFullYear() +'-'+ (now.getMonth()+1) +'-'+ now.getDate() +' '+
                 now.getHours() +':'+ now.getMinutes() +':'+ now.getSeconds();
        }
        for (i = 0, j = chunks.length; i < j; i++) {
            var seconds = chunks[i][0];
            var name = chunks[i][1];
            if ((count = Math.floor(timediff / seconds)) != 0) {
                break;
            }
        }
        return count + name;
    },

    /**
    * aui-toast
    * string style    字体图标 success/fail/loading/自定义，hide=关闭
    * string title   文字描述
    * function fn    （可选）回调函数
    **/
    toast: function(style, text, fn){
        this.create = function(style, text, fn) {
            this.hide();
            switch (style) {
                case "success":
                    var iconHtml = '<i class="aui-iconfont aui-icon-check"></i>';
                    break;
                case "fail":
                    var iconHtml = '<i class="aui-iconfont aui-icon-close"></i>';
                    break;
                case "loading":
                    var iconHtml = '<div class="aui-toast-loading"></div>';
                    break;
                default:
                    var iconHtml = '<i class="aui-iconfont aui-icon-'+ style +'"></i>';
                    break;
            }
            var titleHtml = text ? '<div class="aui-toast-content">' + text + '</div>' : '';
            var toastHtml = '<div class="aui-toast">' + iconHtml + titleHtml + '</div>';
            if (document.querySelector(".aui-toast")) return;
            document.body.insertAdjacentHTML('beforeend', toastHtml);
            this.show();
            if (style == 'loading') {
                fn && fn();
            } else {
                var self = this;
                setTimeout(function() {
                    self.hide();
                    fn && fn();
                }, 1500)
            }
        },
        this.show = function() {
            document.querySelector(".aui-toast").style.display = "block";
            document.querySelector(".aui-toast").style.marginTop = "-" + Math.round(document.querySelector(".aui-toast").offsetHeight / 2) + "px";
            if (document.querySelector(".aui-toast")) return
        },
        this.hide = function() {
            if (document.querySelector(".aui-toast")) {
                document.querySelector(".aui-toast").parentNode.removeChild(document.querySelector(".aui-toast"))
            }
        }

        style === 'hide' ? this.hide() : this.create(style, text, fn);
    },

	/**
    * 支付宝app支付
    * string payinfo  支付信息
    * function fn1   支付成功的回调
    * function fn2   (可选)支付失败的回调
    **/
	alipay: function(payinfo, fn1, fn2){
		api.require('aliPayPlus').payOrder({
		    orderInfo: payinfo
		}, function(ret, err) {
			if(ret && ret.code == 9000){
				APP.toast('success', '支付成功', function(){
					fn1();
				});
			}else{
				APP.toast('fail', '支付失败', function(){
					fn2 && fn2();
				});
			}
		});
	},
};

//vue es5
// new Vue({
// 		el: '#app',
// 		data: {},
// 		watch: {
//         handler: function(){},
//         deep: true,
//         immediate: true,
//     },
//     computed: {
//         a() {
//             return function(b){
//                 return b;
//             }
//         }
//     },
// 		created: function(){},
// 		mounted: function(){
//         this.$nextTick(function(){
//             api.parseTapmode();
//         });
//     },
// 		updated: function(){},
// 		methods: {},
// });

//vue es6
// export default {
//     props: {       //用于接收父组件向子组件传递的数据
//       tester: {
//         type: Object
//       }
//     },
//     data() {    //本组件的数据
//       return {
//         tests: [],
//         selectedTest: {}
//       };
//     },
//     computed: {    //计算属性，所有get,set的this上下文都被绑定到Vue实例
//       方法名() {
//         //.....
//       }
//     },
//     created() {    //在模板渲染成html前调用，即通常初始化某些属性值，然后再渲染成视图
//       this.classMap = ['a', 'b', 'c', 'd', 'e'];
//       //如进行异步数据请求
//       this.$http.get('/api/tests').then((response) => {
//         response = response.body;
//         if (response.errno === 0) {
//           this.goods = response.data;
//         }
//       });
//     },
//     mounted() {   //在模板渲染成html后调用，通常是初始化页面完成后，再对html的dom节点进行一些需要的操作
//       this.$nextTick(() => {
//         this._initScroll();
//         this._initPics();
//       });
//     },
//     methods: {    //定义方法
//       方法名(参数) {
//         //...
//       }
//     },
//     filters: {  //过滤器，可用来写，比如格式化日期的代码
//       //例
//       formatDate(time) {
//         let date = new Date(time);
//         return formatDate(date, 'yyyy-MM-dd hh:mm');
//       }
//     },
//     watch: {    //用来观察Vue实例的数据变动，后执行的方法
//       //...
//     },
//     components: {    //注册组件，首先要在最上面导入组件
//       //如test(要在export default上加入import test from '路径...';
//     }
// };
