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