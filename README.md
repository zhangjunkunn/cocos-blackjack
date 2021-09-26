# 21点游戏 - Cocos Creator 制造

「21点游戏」是 Cocos Creator 的 Demo 项目之一。由腾讯游戏和触控科技联合开发，用于教学和展示 Cocos Creator 快速开发游戏界面和玩法的目的。

游戏内容包括：

- 完整的菜单、排行榜和游戏循环
- 大量需要通过数据动态读取修改的图片和字体资源
- 高质量的帧动画特效
- 多分辨率自适应的 UI 布局
- 外部导入的状态机代码库
- 使用曲线动画和脚本混合呈现的动效细节

关于本项目中使用的资源，请阅读[资源授权声明](LICENSE.md)。

**本仓库已是优化后版本**

`optimization`目录存放优化后小游戏项目

下面介绍下[cocos 21点游戏](https://github.com/cocos-creator/tutorial-blackjack)的优化过程。

## 初始项目
将demo打包到小游戏平台，看初始情况下文件大小分布

构建设置及目录结构

<img src="https://res.wx.qq.com/wechatgame/product/webpack/userupload/20210909/190610/default-build.png" height="350" />
<img src="https://res.wx.qq.com/wechatgame/product/webpack/userupload/20210909/190620/default-main.png" height="350">

主包代码接近3.42MB（不包括cocos目录，这是引擎插件目录）

```bash
.
├── adapter-min.js
├── assets
│   ├── internal // cocos默认资源
│   └── main // 场景目录
├── ccRequire.js
├── cocos // 引擎插件目录
│   ├── cocos2d-js-min.js
│   ├── plugin.json
│   └── signature.json
├── game.js
├── game.json
├── main.js
├── project.config.json
└── src
    └── settings.js
```

## 优化包体

### 快速优化版
快速优化版本指的是通过修改cocos构建方式即可实现的优化。

- 主包压缩类型改为`小游戏分包`：可将assets中非引擎资源压缩为小游戏分包
- 初始场景分包：将首场景资源快速剥离，放到主包中加载，提升首场景启动速度

<img src="https://res.wx.qq.com/wechatgame/product/webpack/userupload/20210909/204153/opt-build.png" height="350" />
<img src="https://res.wx.qq.com/wechatgame/product/webpack/userupload/20210909/204524/opt-main.png" height="350" />
<img src="https://res.wx.qq.com/wechatgame/product/webpack/userupload/20210909/204317/opt-pkgs.png" width="350"/>
<img src="https://res.wx.qq.com/wechatgame/product/webpack/userupload/20210909/205950/opt-assets.png" width="350">

可见，只是简单的构建修改，就能减小1.3MB

```bash
.
├── adapter-min.js
├── assets
│   ├── internal
│   └── start-scene // 初始场景
├── ccRequire.js
├── cocos
│   ├── cocos2d-js-min.js
│   ├── plugin.json
│   └── signature.json
├── game.js
├── game.json
├── main.js
├── project.config.json
├── src
│   └── settings.js
└── subpackages
    └── main // 其他场景及文件
```

### 极限优化版
经过快速优化后，主包中还是有2.16MB，但这还不是优化的极限。理论上，主包中只需包含首帧所需图片，用非引擎的方式先渲染首帧图片，其余资源，都可在首帧渲染后加载。因此可以进一步优化。

可优化项：
- 初始场景也放分包加载
- `adapter-min.js`放分包

1. 初始场景放分包加载
在快速优化版中，通过勾选初始场景分包，可将初始场景拆分出来放主包加载，但同时也增加了主包体积。
通过[cocos官方文档-Asset Manager](https://docs.cocos.com/creator/manual/zh/asset-manager/)了解到如何将场景单独分包、以及如何处理场景间资源依赖。

> 在构建时，配置为 Asset Bundle 的文件夹中的资源（包含场景、代码和其他资源）以及文件夹外的相关依赖资源都会被合并到同一个 Asset Bundle 文件夹中。比如场景 A 放在 a 文件夹中，当 a 文件夹配置为 Asset Bundle 后，场景 A 以及它所依赖的资源都会被合并到 Asset Bundle a 文件夹中。

> - 当同个资源被**不同优先级**的多个 Asset Bundle 引用时，资源会优先放在优先级高的 Asset Bundle 中，低优先级的 Asset Bundle 只会存储一条记录信息。此时低优先级的 Asset Bundle 会依赖高优先级的 Asset Bundle。
如果你想在低优先级的 Asset Bundle 中加载此共享资源，必须在加载低优先级的 Asset Bundle**之前**先加载高优先级的 Asset Bundle。
> - 当同个资源被**相同优先级**的多个 Asset Bundle 引用时，资源会在每个 Asset Bundle 中都复制一份。此时不同的 Asset Bundle 之间没有依赖关系，可按任意顺序加载。所以请尽量确保共享的资源（例如`Texture`、`SpriteFrame`、`Audio`等）所在的 Asset Bundle 优先级更高，以便让更多低优先级的 Asset Bundle 共享资源，从而最小化包体

据此对cocos工程进行改造。

- 新建menu目录，将menu场景从scenes目录移动到menu目录，menu目录配置为bundle，并将优先级设置为2，目标平台`微信小游戏`，压缩类型`小游戏分包`
- 新建table目录，将table场景从scenes目录移动到table目录，table目录配置为bundle，优先级默认为1，目标平台`微信小游戏`，压缩类型`小游戏分包`

<img src="https://res.wx.qq.com/wechatgame/product/webpack/userupload/20210913/142702/menu-bundle-setting.png" width="450px"/>

将`scripts/Menu.js`改为如下

```js
cc.Class({
    extends: cc.Component,

    properties: {
        audioMng: cc.Node
    },

    // use this for initialization
    onLoad: function () {
        this.audioMng = this.audioMng.getComponent('AudioMng');
        this.audioMng.playMusic();
        // 预载bundle和场景
        cc.assetManager.loadBundle('table', (err, bundle) => {
            bundle.preload('table');
        });
    },

    playGame: function () {
        // 加载场景
        const bundle = cc.assetManager.getBundle('table');
        bundle.loadScene('table', (err, scene) => {
            cc.director.runScene(scene);
        })
    },

    // called every frame
    update: function (dt) {

    },
});
```

**做以上改动后，不需要再勾选初始场景分包**，重新构建项目

<img src="https://res.wx.qq.com/wechatgame/product/webpack/userupload/20210913/145752/bundle-scene.png" height="450" />

此时项目结构如下

```bash
.
├── assets
│   └── internal
├── ccRequire.js
├── adapter-min.js
├── cocos
│   ├── cocos2d-js-min.js
│   ├── plugin.json
│   └── signature.json
├── game.js
├── game.json
├── main.js
├── project.config.json
├── src
│   └── settings.js
└── subpackages
    ├── main
    ├── menu // menu场景及其依赖文件
    └── table // table场景及其依赖文件
```

因为导出时没有初始场景，而是作为分包加载，因此需要对main.js做一定改动。

```js
// main.js，游戏运行前先加载menu分包
var bundleRoot = [INTERNAL, 'menu'];
```

至此场景作为分包加载改动已经完成，游戏已可运行，各包体大小如下

<img src="https://res.wx.qq.com/wechatgame/product/webpack/userupload/20210913/150547/bundle-pkgs.png" width="450" />

2. adapter放分包加载
adapter放分包加载有两个好处
- 主包再次减小100KB
- adapter分包加载完成后才需要加载引擎，启动时不需要引擎代码注入。

开始改造
- 在`subpackages/`下新建`adapter`目录
- `subpackages/adapter`新建`game.js`
- 将`adapter-min.js`移动到`subpackages/adapter`
- `game.json`新增`adapter`分包配置
- `game.js`改造
```js
"use strict";
wx.loadSubpackage({
  complete: () => {},
  fail: (err) => {
    console.error('load adapter error ', err)
  },
  name: 'adapter',
  success: () => {
    require('subpackages/adapter/adapter-min.js')
    __globalAdapter.init();
    requirePlugin('cocos');
    __globalAdapter.adaptEngine();
    require('./ccRequire');
    require('./src/settings');
    require('./main');

    cc.view._maxPixelRatio = 4;

    if (cc.sys.platform !== cc.sys.WECHAT_GAME_SUB) {
      // Release Image objects after uploaded gl texture
      cc.macro.CLEANUP_IMAGE_CACHE = true;
    }

    window.boot();
  },
})
```

改造完成，再看下各分包大小

<img src="https://res.wx.qq.com/wechatgame/product/webpack/userupload/20210913/151718/final-pkgs.png" width="450" />

主包排除引擎插件后，仅不到70KB。相比之下，优化前3.42MB；快速优化版2.16MB

不过极限优化版本需要对原项目进行手动更改，cocos提供[定制项目构建流程](https://docs.cocos.com/creator/manual/zh/publish/custom-project-build-template.html?h=%E6%9E%84%E5%BB%BA)的能力。


