/*:
 * @plugindesc [v5.7 Fix] Lydia Was Here - isClosing Hatası Giderildi
 * @author Studio Rainy Day
 *
 * @param --- LOGO AYARLARI ---
 * @default
 *
 * @param Title X
 * @desc Oyun Logosunun X Konumu
 * @default 550
 *
 * @param Title Y
 * @desc Oyun Logosunun Y Konumu
 * @default 130
 *
 * @param --- BUTON AYARLARI ---
 * @default
 *
 * @param Start X
 * @default 1010
 * @param Start Y
 * @default 400
 *
 * @param Load X
 * @default 1010
 * @param Load Y
 * @default 470
 *
 * @param Exit X
 * @default 1010
 * @param Exit Y
 * @default 540
 *
 * @help
 * ============================================================================
 * HATA DÜZELTMESİ (v5.7)
 * ============================================================================
 * - "TypeError: Cannot read property 'isClosing' of undefined" hatası giderildi.
 * - Bu hata, orijinal menü penceresi silindiği için motorun boşluğu kontrol
 * etmeye çalışmasından kaynaklanıyordu.
 * * DİĞER ÖZELLİKLER:
 * 1. START: Map 4 (Dream01) X:9 Y:119 konumuna ışınlar.
 * 2. MOUSE: Tamamen kapalı.
 */

(function() {
    'use strict';

    // ==============================================================================
    // BÖLÜM 1: GLOBAL MOUSE ENGELLEME
    // ==============================================================================

    var _Scene_Boot_start = Scene_Boot.prototype.start;
    Scene_Boot.prototype.start = function() {
        _Scene_Boot_start.call(this);
        document.body.style.cursor = 'none'; 
    };

    TouchInput.update = function() {};
    TouchInput.isPressed = function() { return false; };
    TouchInput.isTriggered = function() { return false; };
    TouchInput.isRepeated = function() { return false; };
    TouchInput.isLongPressed = function() { return false; };
    TouchInput.isCancelled = function() { return false; };
    TouchInput.isMoved = function() { return false; };
    TouchInput.isHovered = function() { return false; };
    TouchInput.isReleased = function() { return false; };

    Object.defineProperty(TouchInput, 'wheelX', {
        get: function() { return 0; },
        configurable: true
    });
    Object.defineProperty(TouchInput, 'wheelY', {
        get: function() { return 0; },
        configurable: true
    });

    // ==============================================================================
    // BÖLÜM 2: ANA MENÜ (SCENE_TITLE)
    // ==============================================================================

    var p = PluginManager.parameters('MainMenu');
    var tX = Number(p && p['Title X']) || 550;
    var tY = Number(p && p['Title Y']) || 130;
    var sX = Number(p && p['Start X']) || 1010;
    var sY = Number(p && p['Start Y']) || 400;
    var lX = Number(p && p['Load X']) || 1010;
    var lY = Number(p && p['Load Y']) || 470;
    var eX = Number(p && p['Exit X']) || 1010;
    var eY = Number(p && p['Exit Y']) || 540;

    Scene_Title.prototype.create = function() {
        Scene_Base.prototype.create.call(this);
        this.createBackground(); 
        this._commandIndex = 0; 
        this.createCustomMenu();
        AudioManager.playBgm({ name: "Menu", volume: 90, pitch: 100, pan: 0 });
    };

    // --- KRİTİK DÜZELTME BURADA ---
    // Orijinal kod burada olmayan bir pencerenin (commandWindow) kapanıp kapanmadığını
    // kontrol ediyordu. Bunu iptal edip sadece genel meşguliyet durumuna bakıyoruz.
    Scene_Title.prototype.isBusy = function() {
        return Scene_Base.prototype.isBusy.call(this);
    };
    // -----------------------------

    Scene_Title.prototype.createCustomMenu = function() {
        this._baseSprite = new Sprite(ImageManager.loadPicture('Main-Menu/Base'));
        this.addChild(this._baseSprite);

        this._titleSprite = new Sprite(ImageManager.loadPicture('Main-Menu/Title'));
        this._titleSprite.x = tX;
        this._titleSprite.y = tY;
        this.addChild(this._titleSprite);

        this._btns = [];

        this._btnStart = new Sprite(ImageManager.loadPicture('Main-Menu/Start'));
        this._btnStart.x = sX; this._btnStart.y = sY;
        this.addChild(this._btnStart);
        this._btns.push(this._btnStart);

        this._btnLoad = new Sprite(ImageManager.loadPicture('Main-Menu/Load'));
        this._btnLoad.x = lX; this._btnLoad.y = lY;
        this.addChild(this._btnLoad);
        this._btns.push(this._btnLoad);

        this._btnExit = new Sprite(ImageManager.loadPicture('Main-Menu/Exit'));
        this._btnExit.x = eX; this._btnExit.y = eY;
        this.addChild(this._btnExit);
        this._btns.push(this._btnExit);

        this.updateButtonOpacity();
    };

    Scene_Title.prototype.update = function() {
        Scene_Base.prototype.update.call(this);
        if (!this._btns || this._btns.length === 0) return;

        if (!SceneManager.isSceneChanging()) {
            this.updateInput();
            this.updateButtonOpacity();
        }
    };

    Scene_Title.prototype.updateInput = function() {
        if (Input.isTriggered('down')) {
            this._commandIndex = (this._commandIndex + 1) % 3;
            SoundManager.playCursor();
        }
        if (Input.isTriggered('up')) {
            this._commandIndex = (this._commandIndex + 2) % 3;
            SoundManager.playCursor();
        }
        if (Input.isTriggered('ok') || Input.isTriggered('confirm')) {
            this.executeCommand(this._commandIndex);
        }
    };

    Scene_Title.prototype.updateButtonOpacity = function() {
        for (var i = 0; i < this._btns.length; i++) {
            if (i === this._commandIndex) {
                this._btns[i].opacity = 255; 
            } else {
                this._btns[i].opacity = 160; 
            }
        }
    };

    Scene_Title.prototype.executeCommand = function(index) {
        SoundManager.playOk();
        switch (index) {
            case 0: // Start
                this.commandStart();
                break;
            case 1: // Load
                this.commandLoad();
                break;
            case 2: // Exit
                SceneManager.exit();
                break;
        }
    };

    Scene_Title.prototype.commandStart = function() {
        DataManager.setupNewGame();
        // Map ID 2, X:9, Y:119
        // map ID ilk parametre olarak verilir
        $gamePlayer.reserveTransfer(2, 9, 119, 2, 0);
        AudioManager.fadeOutBgm(3); 
        this.fadeOutAll();
        SceneManager.goto(Scene_Map);
    };

    Scene_Title.prototype.commandLoad = function() {
        if (typeof PluginManager.callCustomSaveLoad === 'function') {
            PluginManager.callCustomSaveLoad('load');
        } else {
            SceneManager.push(Scene_Load);
        }
    };

    Scene_Title.prototype.createForeground = function() {};
    Scene_Title.prototype.createCommandWindow = function() {};

})();