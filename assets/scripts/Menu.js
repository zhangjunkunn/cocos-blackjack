cc.Class({
    extends: cc.Component,

    properties: {
        audioMng: cc.Node
    },

    // use this for initialization
    onLoad: function () {
        this.audioMng = this.audioMng.getComponent('AudioMng');
        this.audioMng.playMusic();
        // cc.director.preloadScene('table', function () {
        //     cc.log('Next scene preloaded');
        // });
        const t1 = Date.now();
        cc.assetManager.loadBundle('table', (err, bundle) => {
            console.log('onload loadbundle cost: ', Date.now() - t1);
            bundle.preload('table');
        });
    },

    playGame: function () {
        const t1 = Date.now();
        const bundle = cc.assetManager.getBundle('table');
        const t2 = Date.now();
        bundle.loadScene('table', (err, scene) => {
            console.log('playgame cost ', Date.now() - t1, Date.now() - t2);
            cc.director.runScene(scene);
        })
        // cc.assetManager.loadBundle('table', (err, bundle) => {
        //     const t2 = Date.now();
        //     bundle.loadScene('table', function (err, scene) {
        //         console.log('playgame cost ', Date.now() - t1, Date.now() - t2);
        //         cc.director.runScene(scene);
        //     });
        // })
        // cc.director.loadScene('table');
    },

    // called every frame
    update: function (dt) {

    },
});
