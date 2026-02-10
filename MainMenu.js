/*:
 * @plugindesc [v7.1 Final] Lydia Was Here - 0 Ses Limiti ve Görsel Temizlik
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
 * @param Options X
 * @default 1010
 * @param Options Y
 * @default 540
 *
 * @param Exit X
 * @default 1010
 * @param Exit Y
 * @default 610
 *
 * @help
 * ============================================================================
 * SİSTEM GÜNCELLEMESİ (v7.1)
 * ============================================================================
 * - Options menüsündeki üst başlık görseli kaldırıldı.
 * - Ses seviyelerinin 0'a (sessiz) kadar inmesi sağlandı.
 * - ConfigManager entegrasyonu devam ediyor.
 */

(function () {
    'use strict';

    // ==============================================================================
    // BÖLÜM 0: CONFIG MANAGER (AYARLARIN KALICI OLMASI İÇİN)
    // ==============================================================================

    // Varsayılan değerler
    ConfigManager.myBgmLevel = 5;
    ConfigManager.myBgsLevel = 5;
    ConfigManager.myLanguage = 'English';

    // Ayarları Kaydetme (Save)
    var _ConfigManager_makeData = ConfigManager.makeData;
    ConfigManager.makeData = function () {
        var config = _ConfigManager_makeData.call(this);
        config.myBgmLevel = this.myBgmLevel;
        config.myBgsLevel = this.myBgsLevel;
        config.myLanguage = this.myLanguage;
        return config;
    };

    // Ayarları Yükleme (Load)
    var _ConfigManager_applyData = ConfigManager.applyData;
    ConfigManager.applyData = function (config) {
        _ConfigManager_applyData.call(this, config);
        this.myBgmLevel = this.readCustomData(config, 'myBgmLevel', 5);
        this.myBgsLevel = this.readCustomData(config, 'myBgsLevel', 5);
        this.myLanguage = this.readCustomData(config, 'myLanguage', 'English');

        // Ses ayarlarını motora uygula
        this.applyCustomVolume();
    };

    // Yardımcı okuma fonksiyonu
    ConfigManager.readCustomData = function (config, name, defaultValue) {
        if (name in config) {
            return config[name];
        } else {
            return defaultValue;
        }
    };

    // Sesi güncelleme fonksiyonu
    // Sesi güncelleme fonksiyonu
    ConfigManager.applyCustomVolume = function () {
        // Seviye 0-5 arası değerler için özel hassasiyet haritası
        // [0, 5, 20, 50, 80, 100]
        var volumeMap = [0, 5, 20, 50, 80, 100];

        var bgmVol = (volumeMap[this.myBgmLevel] !== undefined) ? volumeMap[this.myBgmLevel] : this.myBgmLevel * 20;
        var bgsVol = (volumeMap[this.myBgsLevel] !== undefined) ? volumeMap[this.myBgsLevel] : this.myBgsLevel * 20;

        AudioManager.bgmVolume = bgmVol;
        AudioManager.bgsVolume = bgsVol;
        AudioManager.meVolume = bgmVol;
        AudioManager.seVolume = bgsVol;
    };

    // ==============================================================================
    // BÖLÜM 1: GLOBAL MOUSE ENGELLEME
    // ==============================================================================

    var _Scene_Boot_start = Scene_Boot.prototype.start;
    Scene_Boot.prototype.start = function () {
        _Scene_Boot_start.call(this);
        document.body.style.cursor = 'none';
    };

    TouchInput.update = function () { };
    TouchInput.isPressed = function () { return false; };
    TouchInput.isTriggered = function () { return false; };
    TouchInput.isRepeated = function () { return false; };
    TouchInput.isLongPressed = function () { return false; };
    TouchInput.isCancelled = function () { return false; };
    TouchInput.isMoved = function () { return false; };
    TouchInput.isHovered = function () { return false; };
    TouchInput.isReleased = function () { return false; };

    Object.defineProperty(TouchInput, 'wheelX', { get: function () { return 0; }, configurable: true });
    Object.defineProperty(TouchInput, 'wheelY', { get: function () { return 0; }, configurable: true });

    // ==============================================================================
    // BÖLÜM 2: ANA MENÜ (SCENE_TITLE)
    // ==============================================================================

    var p = PluginManager.parameters('MainMenu');
    var tX = Number(p && p['Title X']) || 550;
    var tY = Number(p && p['Title Y']) || 130;
    var sX = Number(p && p['Start X']) || 1000;
    var sY = Number(p && p['Start Y']) || 370;
    var lX = Number(p && p['Load X']) || 1000;
    var lY = Number(p && p['Load Y']) || 440;
    var oX = Number(p && p['Options X']) || 1000;
    var oY = Number(p && p['Options Y']) || 510;
    var eX = Number(p && p['Exit X']) || 1000;
    var eY = Number(p && p['Exit Y']) || 580;

    // Game System Başlatılırken Config'den Veri Çek
    var _Game_System_initialize = Game_System.prototype.initialize;
    Game_System.prototype.initialize = function () {
        _Game_System_initialize.call(this);
        this._bgmVolume = ConfigManager.myBgmLevel;
        this._bgsVolume = ConfigManager.myBgsLevel;
        this._language = ConfigManager.myLanguage;
        ConfigManager.applyCustomVolume();
    };

    Scene_Title.prototype.create = function () {
        Scene_Base.prototype.create.call(this);
        this.createBackground();
        this._commandIndex = 0;
        this.createCustomMenu();
        ConfigManager.applyCustomVolume();
        AudioManager.playBgm({ name: "Menu", volume: 90, pitch: 100, pan: 0 });
    };

    Scene_Title.prototype.isBusy = function () {
        return Scene_Base.prototype.isBusy.call(this);
    };

    Scene_Title.prototype.createCustomMenu = function () {
        this._baseSprite = new Sprite(ImageManager.loadPicture('Main-Menu/Base'));
        this.addChild(this._baseSprite);

        this._titleSprite = new Sprite(ImageManager.loadPicture('Main-Menu/Title'));
        this._titleSprite.x = tX;
        this._titleSprite.y = tY;
        this.addChild(this._titleSprite);

        this._btns = [];

        // Start
        this._btnStart = new Sprite(ImageManager.loadPicture('Main-Menu/Start'));
        this._btnStart.x = sX; this._btnStart.y = sY;
        this.addChild(this._btnStart);
        this._btns.push(this._btnStart);

        // Load
        this._btnLoad = new Sprite(ImageManager.loadPicture('Main-Menu/Load'));
        this._btnLoad.x = lX; this._btnLoad.y = lY;
        this.addChild(this._btnLoad);
        this._btns.push(this._btnLoad);

        // Options
        this._btnOptions = new Sprite(ImageManager.loadPicture('Main-Menu/Options'));
        this._btnOptions.x = oX; this._btnOptions.y = oY;
        this.addChild(this._btnOptions);
        this._btns.push(this._btnOptions);

        // Exit
        this._btnExit = new Sprite(ImageManager.loadPicture('Main-Menu/Exit'));
        this._btnExit.x = eX; this._btnExit.y = eY;
        this.addChild(this._btnExit);
        this._btns.push(this._btnExit);

        this.updateButtonOpacity();
    };

    Scene_Title.prototype.update = function () {
        Scene_Base.prototype.update.call(this);

        if (!this._btns || this._btns.length === 0) return;
        if (!SceneManager.isSceneChanging()) {
            this.updateInput();
            this.updateButtonOpacity();
        }
    };

    Scene_Title.prototype.updateInput = function () {
        if (Input.isTriggered('down')) {
            this._commandIndex = (this._commandIndex + 1) % 4;
            SoundManager.playCursor();
        }
        if (Input.isTriggered('up')) {
            this._commandIndex = (this._commandIndex + 3) % 4;
            SoundManager.playCursor();
        }
        if (Input.isTriggered('ok') || Input.isTriggered('confirm')) {
            this.executeCommand(this._commandIndex);
        }
    };

    Scene_Title.prototype.updateButtonOpacity = function () {
        for (var i = 0; i < this._btns.length; i++) {
            if (i === this._commandIndex) {
                this._btns[i].opacity = 255;
            } else {
                this._btns[i].opacity = 160;
            }
        }
    };

    Scene_Title.prototype.executeCommand = function (index) {
        SoundManager.playOk();
        switch (index) {
            case 0: this.commandStart(); break;
            case 1: this.commandLoad(); break;
            case 2: this.commandOptions(); break;
            case 3: SceneManager.exit(); break;
        }
    };

    Scene_Title.prototype.commandStart = function () {
        DataManager.setupNewGame();
        $gamePlayer.reserveTransfer(2, 9, 119, 2, 0);
        AudioManager.fadeOutBgm(3);
        this.fadeOutAll();
        SceneManager.goto(Scene_Map);
    };

    Scene_Title.prototype.commandLoad = function () {
        if (typeof PluginManager.callCustomSaveLoad === 'function') {
            PluginManager.callCustomSaveLoad('load');
        } else {
            SceneManager.push(Scene_Load);
        }
    };

    Scene_Title.prototype.commandOptions = function () {
        SceneManager.push(Scene_LydiaOptions);
    };

    Scene_Title.prototype.createForeground = function () { };
    Scene_Title.prototype.createCommandWindow = function () { };

    // ==============================================================================
    // BÖLÜM 3: SHARED SCENE_LYDIAOPTIONS
    // ==============================================================================

    window.Scene_LydiaOptions = function () {
        this.initialize.apply(this, arguments);
    };

    Scene_LydiaOptions.prototype = Object.create(Scene_MenuBase.prototype);
    Scene_LydiaOptions.prototype.constructor = Scene_LydiaOptions;

    Scene_LydiaOptions.prototype.initialize = function () {
        Scene_MenuBase.prototype.initialize.call(this);
        this._optionsIndex = 0;
    };

    Scene_LydiaOptions.prototype.isInTitle = function () {
        // Scene_Title stack'te var mı diye kontrol etmiyoruz, çünkü Title'dan push edildi.
        // Basitçe: Oyunda mıyız? $gameParty genelde Title'da boştur veya setupNewGame ile dolar.
        // En sağlam yöntem: SceneManager._stack kontrolü, ama MV'de stack constructor tutar.
        // Eğer stack'teki önceki sahne Scene_Title ise Title'dayızdır.
        // Veya daha basiti: $gameSystem.playtime() 0 ise ve $dataMap yoksa...
        // Kullanıcı isteğine göre: "Oyun içerisinde iken".
        // $gameParty.exists() kontrolü yeterli olabilir.
        return !$gameParty.inBattle() && ($gameParty.members().length === 0 || SceneManager._stack.length <= 1);
        // Not: Bu kontrol riskli olabilir. Şunu kullanalım:
        // Eğer SceneManager._previousClass Scene_Title ise...
        // MV'de _previousClass yok. _stack[0] genellikle Scene_Title olur ama oyun başlayınca silinir.
        // O yüzden: Stack boyutu 1 ise (Title -> Options) Title'dayız.
        // Oyun içi: Map -> Pause -> Options (Stack boyutu 2 veya 3).
        // Scene_Title kendisi stack'te kalıyor mu? Push edince evet.
        // Title -> Push Options => Stack: [Scene_Title, Scene_LydiaOptions] (Len: 2)
        // Game -> Push Pause -> Push Options => Stack: [Scene_Map, Scene_PauseMenu, Scene_LydiaOptions] (Len: 3)
        // Ama Scene_Map goto ile açılırsa stack sıfırlanır, Scene_Map stack[0] olur.
        // Yani stack[0] == Scene_Title ise Title'dayız.
        return (SceneManager._stack.length > 0 && SceneManager._stack[0] === Scene_Title);
    };

    Scene_LydiaOptions.prototype.create = function () {
        Scene_MenuBase.prototype.create.call(this);
        this.createBackground();
        this.createOptionsUi();
    };

    Scene_LydiaOptions.prototype.createBackground = function () {
        // Her durumda arka planın (önceki sahne veya Title) anlık görüntüsünü al
        Scene_MenuBase.prototype.createBackground.call(this);

        // Ekstra karartma (Dimmer) ekle
        this._dimmerSprite = new Sprite();
        this._dimmerSprite.bitmap = new Bitmap(Graphics.boxWidth, Graphics.boxHeight);
        this._dimmerSprite.bitmap.fillAll('rgba(0, 0, 0, 0.6)');
        this.addChild(this._dimmerSprite);

        // Options Base görselini ekle
        this._optionsBase = new Sprite(ImageManager.loadPicture('Main-Menu/Options_Base'));
        this.addChild(this._optionsBase);
    };

    Scene_LydiaOptions.prototype.createOptionsUi = function () {
        this._optionsElements = [];

        // Metinler
        this.createOptionText('MUSIC', 450, 230);
        this.createOptionText('SOUND EFFECTS', 450, 305);
        this.createOptionText('LANGUAGE', 450, 390);
        this.createOptionText('Go Back', 450, 470);

        // Daireler
        this._musicCircles = [];
        this._bgsCircles = [];

        for (let i = 0; i < 5; i++) {
            // Music
            let musicCircle = new Sprite(ImageManager.loadPicture('Main-Menu/Circle Full'));
            musicCircle.x = 700 + (i * 40);
            musicCircle.y = 240;
            this.addChild(musicCircle);
            this._musicCircles.push(musicCircle);
            this._optionsElements.push(musicCircle);

            // Sound
            let bgsCircle = new Sprite(ImageManager.loadPicture('Main-Menu/Circle Full'));
            bgsCircle.x = 700 + (i * 40);
            bgsCircle.y = 320;
            this.addChild(bgsCircle);
            this._bgsCircles.push(bgsCircle);
            this._optionsElements.push(bgsCircle);
        }

        // Dil Metni Ayarları
        this._languageText = new Sprite(new Bitmap(200, 40));
        this._languageText.bitmap.fontSize = 28;
        this._languageText.bitmap.textColor = '#000000'; // Siyah Yazı
        this._languageText.bitmap.outlineWidth = 1;
        this._languageText.bitmap.outlineColor = '#000000';
        this._languageText.x = 670;
        this._languageText.y = 385;
        this.addChild(this._languageText);
        this._optionsElements.push(this._languageText);

        // Oklar - Sadece Title ekranındaysak göster
        if (this.isInTitle()) {
            this._langLeftArrow = new Sprite(ImageManager.loadPicture('Main-Menu/Arrow Right'));
            this._langLeftArrow.x = 650;
            this._langLeftArrow.y = 390;
            this.addChild(this._langLeftArrow);
            this._optionsElements.push(this._langLeftArrow);

            this._langRightArrow = new Sprite(ImageManager.loadPicture('Main-Menu/Arrow Left'));
            this._langRightArrow.x = 880;
            this._langRightArrow.y = 390;
            this.addChild(this._langRightArrow);
            this._optionsElements.push(this._langRightArrow);
        } else {
            // Oyun içindeyse metni biraz daha soluk yapabiliriz veya değiştirmeyiz.
            this._languageText.opacity = 160;
        }

        // Seçim Oku
        this._selectionArrow = new Sprite(ImageManager.loadPicture('Main-Menu/Arrow Left'));
        this._selectionArrow.x = 420;
        this._selectionArrow.y = 190;
        this.addChild(this._selectionArrow);
        this._optionsElements.push(this._selectionArrow);

        this.updateOptionsDisplay();
    };

    Scene_LydiaOptions.prototype.createOptionText = function (text, x, y) {
        var textSprite = new Sprite(new Bitmap(300, 40));
        textSprite.bitmap.fontSize = 30;
        textSprite.bitmap.textColor = '#000000';
        textSprite.bitmap.outlineWidth = 2;
        textSprite.bitmap.outlineColor = '#000000';
        textSprite.bitmap.drawText(text, 0, 0, 300, 40, 'left');
        textSprite.x = x;
        textSprite.y = y;
        this.addChild(textSprite);
        this._optionsElements.push(textSprite);
    };

    Scene_LydiaOptions.prototype.update = function () {
        Scene_MenuBase.prototype.update.call(this);
        this.updateOptionsInput();
        this.updateOptionsDisplay();
    };

    Scene_LydiaOptions.prototype.updateOptionsInput = function () {
        // --- NAVİGASYON ---
        if (Input.isTriggered('down')) {
            this._optionsIndex = (this._optionsIndex + 1) % 4;
            SoundManager.playCursor();
        }
        if (Input.isTriggered('up')) {
            this._optionsIndex = (this._optionsIndex + 3) % 4;
            SoundManager.playCursor();
        }

        if (Input.isTriggered('right')) {
            this.handleOptionsRight();
        }
        if (Input.isTriggered('left')) {
            this.handleOptionsLeft();
        }

        // Disable Language selection skip? No, user can still select it but arrows won't work.
        // Opsiyonel: Eğer dil değiştirmek yasaksa o satıra inemesin? 
        // Hayır, sadece değiştirilemesin dedi kullanıcı. "sağ sol oklarını kaldıralım"

        // --- ONAY VE ÇIKIŞ ---
        if (Input.isTriggered('ok') || Input.isTriggered('confirm')) {
            if (this._optionsIndex === 3) { // 3. index 'Go Back'
                this.popScene();
                return;
            }
        }

        if (Input.isTriggered('cancel') || Input.isTriggered('escape')) {
            this.popScene();
        }
    };

    Scene_LydiaOptions.prototype.handleOptionsRight = function () {
        switch (this._optionsIndex) {
            case 0: // Music
                if (ConfigManager.myBgmLevel < 5) {
                    ConfigManager.myBgmLevel++;
                    ConfigManager.save();
                    ConfigManager.applyCustomVolume();
                    SoundManager.playCursor();
                }
                break;
            case 1: // Sound
                if (ConfigManager.myBgsLevel < 5) {
                    ConfigManager.myBgsLevel++;
                    ConfigManager.save();
                    ConfigManager.applyCustomVolume();
                    SoundManager.playCursor();
                }
                break;
            case 2: // Language
                if (this.isInTitle()) {
                    this.cycleLanguage('next');
                } else {
                    SoundManager.playBuzzer();
                }
                break;
        }
    };

    Scene_LydiaOptions.prototype.handleOptionsLeft = function () {
        switch (this._optionsIndex) {
            case 0: // Music
                if (ConfigManager.myBgmLevel > 0) {
                    ConfigManager.myBgmLevel--;
                    ConfigManager.save();
                    ConfigManager.applyCustomVolume();
                    SoundManager.playCursor();
                }
                break;
            case 1: // Sound
                if (ConfigManager.myBgsLevel > 0) {
                    ConfigManager.myBgsLevel--;
                    ConfigManager.save();
                    ConfigManager.applyCustomVolume();
                    SoundManager.playCursor();
                }
                break;
            case 2: // Language
                if (this.isInTitle()) {
                    this.cycleLanguage('prev');
                } else {
                    SoundManager.playBuzzer();
                }
                break;
        }
    };

    Scene_LydiaOptions.prototype.cycleLanguage = function (direction) {
        var languages = ['English'];
        var currentIndex = languages.indexOf(ConfigManager.myLanguage);

        if (direction === 'next') {
            currentIndex = (currentIndex + 1) % languages.length;
        } else {
            currentIndex = (currentIndex - 1 + languages.length) % languages.length;
        }

        ConfigManager.myLanguage = languages[currentIndex];
        ConfigManager.save();
        SoundManager.playCursor();
    };

    Scene_LydiaOptions.prototype.updateOptionsDisplay = function () {
        // Music Circles
        for (let i = 0; i < 5; i++) {
            let mName = (i < ConfigManager.myBgmLevel) ? 'Main-Menu/Circle Full' : 'Main-Menu/Circle Empty';
            this._musicCircles[i].bitmap = ImageManager.loadPicture(mName);

            let sName = (i < ConfigManager.myBgsLevel) ? 'Main-Menu/Circle Full' : 'Main-Menu/Circle Empty';
            this._bgsCircles[i].bitmap = ImageManager.loadPicture(sName);
        }

        // Language Text
        this._languageText.bitmap.clear();
        this._languageText.bitmap.drawText(ConfigManager.myLanguage, 0, 0, 200, 40, 'center');

        // Selection Arrow Y Position
        switch (this._optionsIndex) {
            case 0: this._selectionArrow.y = 235; break;
            case 1: this._selectionArrow.y = 310; break;
            case 2: this._selectionArrow.y = 400; break;
            case 3: this._selectionArrow.y = 480; break;
        }
    };

    Scene_LydiaOptions.prototype.popScene = function () {
        SoundManager.playCancel();
        Scene_MenuBase.prototype.popScene.call(this);
    };

})();