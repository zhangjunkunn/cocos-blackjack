"use strict";
require('adapter-min.js')
__globalAdapter.init();

// 判断版本号
function compareVersion(v1, v2) {
  v1 = v1.split(".");
  v2 = v2.split(".");
  const len = Math.max(v1.length, v2.length);
  while (v1.length < len) {
      v1.push("0");
  }
  while (v2.length < len) {
      v2.push("0");
  }
  for (let i = 0; i < len; i++) {
      const num1 = parseInt(v1[i]);
      const num2 = parseInt(v2[i]);
      if (num1 > num2) {
          return 1;
      }
      if (num1 < num2) {
          return -1;
      }
  }
  return 0;
}
// 注入引擎，加载游戏
var loaded = false;
function loadGame() {
  if (loaded) {
    return;
  }

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
}
// 当基础库版本>=2.1.0才能使用分包能力，当不支持分包功能时，会下载完整包，因此不需要展示加载封面
if (compareVersion(wx.getSystemInfoSync().SDKVersion, '2.1.0') > -1) {
  try {
    // 在加载子包前，先加载封面插件
    GameGlobal.LoadingManager = requirePlugin("MinigameLoading", {
      customEnv: {
        wx,
        canvas,
      },
    }).default;
    GameGlobal.LoadingManager.create({
      images: [
        {
          src: 'images/background.jpg'
        }
      ],
      contextType: 'webgl',
      // contextAttributes在接入点封面插件前获取，不同游戏可能不同
      contextAttributes: {
        alpha: false,
        antialias: false,
        depth: true,
        desynchronized: false,
        failIfMajorPerformanceCaveat: false,
        powerPreference: "default",
        premultipliedAlpha: true,
        preserveDrawingBuffer: false,
        stencil: true,
        xrCompatible: false,
      }
    }).then(() => {
      // 封面图已显示
    }).catch((err) => {
      console.error('封面图显示失败')
    })
  } catch (error) {
    // 当前客户端不支持使用插件，会黑屏（占比小于1%）
    console.error('当前环境不支持使用插件', error);
  }
  loadGame()
} else {
  // 不支持分包能力
  loadGame()
}