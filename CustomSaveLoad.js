/*:
 * @plugindesc Özel Menü Sistemi (Pause + Save/Load + Album) - v19.4 (Event State Fix)
 * @author Sena
 * @help 
 * v19.4 Değişiklikleri:
 * - FIX: Load yapıldığında eventlerin sıfırlanması sorunu çözüldü (oyuna tam olarak kalındığı yerden devam ediliyor)
 * 
 * v19.3 Değişiklikleri:
 * - CRITICAL FIX: Load menüsünün Save olarak çalışması sorunu düzeltildi (Mode overwrite bug)
 * 
 * v19.2 Değişiklikleri:
 * - CRITICAL FIX: Load sonrası siyah ekran sorunu çözüldü (Scene_Map override eklendi)
 * - FIX: Map versiyon değişikliği kontrolü eklendi (reloadMapIfUpdated)
 * 
 * v19.1 Değişiklikleri:
 * - CRITICAL FIX: Load işlemi düzeltildi - artık kayıtlı oyuna kaldığınız yerden devam edebilirsiniz
 * - Custom fade transition kaldırıldı (RPG Maker MV'nin built-in transition'ı kullanılıyor)
 * 
 * v19 Değişiklikleri:
 * - FEATURE: Save file'lar timestamp'e göre sıralanıyor (en son save en üstte)
 * - FEATURE: "Saving..." göstergesi ve "Game Saved!" başarı mesajı eklendi
 * - FEATURE: Hata yönetimi ve corrupted save file kontrolü
 * - FEATURE: Detaylı error message gösterme sistemi
 * - OPTIMIZATION: Try-catch blokları ile güvenli işlem yapma
 * - UX: Profesyonel görsel geri bildirim sistemi
 */

(function () {

    // --- SABITLER ---
    const SAVE_UNLOCK_SWITCH_ID = 48;
    const MAX_SAVE_SLOTS = 3;
    const SLOT_SPACING = 200;
    const SLOT_X = 330;
    const SLOT_Y_START = 30;
    const PAUSE_BUTTON_X = 100;
    const PAUSE_BUTTON_NORMAL_SPACING = 110;
    const PAUSE_BUTTON_LARGE_SPACING = 180;
    const PAUSE_Y_OFFSET = 50;

    // İmaj yolları
    const Images = {
        pauseBase: 'Pause Screen/Base',
        saveLoadBase: 'Save-Load/SAVE_LOAD_Base',
        saveLoadLine: 'Save-Load/SAVE_LOAD_Line',
        saveLoadRooms: {
            4: 'Save-Load/SAVE_LOAD_04_Lydias_Room',
            5: 'Save-Load/SAVE_LOAD_05_Hallway',
            6: 'Save-Load/SAVE_LOAD_06_Enterance',
            7: 'Save-Load/SAVE_LOAD_07_Living Room',
            9: 'Save-Load/SAVE_LOAD_08_Dream_Two',
            10: 'Save-Load/SAVE_LOAD_09_Dream_Three'
        }
    };

    // Albüm Ayarları
    const AlbumConfig = [
        { file: 'Lydias Room Polaroid 1', switchId: 50 },
        // Buraya virgül koyarak yenilerini ekleyebilirsin
    ];

    // ----------------------------------------

    // --- Sınıf Tanımlamaları ---
    function Scene_CustomSaveLoad() {
        this.initialize.apply(this, arguments);
    }
    Scene_CustomSaveLoad.prototype = Object.create(Scene_MenuBase.prototype);
    Scene_CustomSaveLoad.prototype.constructor = Scene_CustomSaveLoad;

    function SaveSlot(slotIndex, savefileId, mapId, exists) {
        this.initialize.apply(this, arguments);
    }
    SaveSlot.prototype = Object.create(Sprite.prototype);
    SaveSlot.prototype.constructor = SaveSlot;

    function Scene_PauseMenu() {
        this.initialize.apply(this, arguments);
    }
    Scene_PauseMenu.prototype = Object.create(Scene_MenuBase.prototype);
    Scene_PauseMenu.prototype.constructor = Scene_PauseMenu;

    function Sprite_PauseButton() {
        this.initialize.apply(this, arguments);
    }
    Sprite_PauseButton.prototype = Object.create(Sprite.prototype);
    Sprite_PauseButton.prototype.constructor = Sprite_PauseButton;

    function Scene_Album() {
        this.initialize.apply(this, arguments);
    }
    Scene_Album.prototype = Object.create(Scene_MenuBase.prototype);
    Scene_Album.prototype.constructor = Scene_Album;

    function Scene_LockedSave() {
        this.initialize.apply(this, arguments);
    }
    Scene_LockedSave.prototype = Object.create(Scene_MenuBase.prototype);
    Scene_LockedSave.prototype.constructor = Scene_LockedSave;


    // --- Scene_PauseMenu ---

    Scene_PauseMenu.prototype.initialize = function () {
        Scene_MenuBase.prototype.initialize.call(this);
        this._index = 0;
        this._buttons = [];
    };

    Scene_PauseMenu.prototype.create = function () {
        Scene_MenuBase.prototype.create.call(this);
        this.createBackground();
        this.createButtons();
        this.updateButtonHighlights();
    };

    Scene_PauseMenu.prototype.createBackground = function () {
        this._backgroundSprite = new Sprite(ImageManager.loadPicture(Images.pauseBase));
        this.addChild(this._backgroundSprite);
    };

    Scene_PauseMenu.prototype.createButtons = function () {
        const buttonInfo = [
            { img: 'Save', handler: this.commandSave },
            { img: 'Load', handler: this.commandLoad },
            { img: 'Album', handler: this.commandAlbum },
            { img: 'Exit', handler: this.commandExit }
        ];

        const baseY = ((Graphics.boxHeight - this.calculateTotalButtonHeight()) / 2) - PAUSE_Y_OFFSET;
        let currentY = baseY;

        buttonInfo.forEach((info, i) => {
            const button = new Sprite_PauseButton(info.img);
            button.x = PAUSE_BUTTON_X;
            button.y = currentY;
            button.setClickHandler(info.handler.bind(this));
            this._buttons.push(button);
            this.addChild(button);

            currentY += (info.handler === this.commandAlbum ?
                PAUSE_BUTTON_LARGE_SPACING + 25 : PAUSE_BUTTON_NORMAL_SPACING);
        });
    };

    Scene_PauseMenu.prototype.calculateTotalButtonHeight = function () {
        return (PAUSE_BUTTON_NORMAL_SPACING * 2) + PAUSE_BUTTON_LARGE_SPACING;
    };

    Scene_PauseMenu.prototype.update = function () {
        Scene_MenuBase.prototype.update.call(this);
        this.processInput();
        this.processTouch();
        this.updateButtonHighlights();
    };

    Scene_PauseMenu.prototype.updateButtonHighlights = function () {
        this._buttons.forEach((button, i) => {
            const isSelected = (i === this._index);
            button.scale.set(isSelected ? 1.1 : 1.0);
            button.opacity = isSelected ? 255 : 200;
        });
    };

    Scene_PauseMenu.prototype.processInput = function () {
        if (Input.isTriggered('cancel') || Input.isTriggered('menu')) {
            this.commandResume();
        }
        if (Input.isTriggered('ok')) {
            this.processOk();
        }
        if (Input.isTriggered('up')) {
            this.cursorUp();
        }
        if (Input.isTriggered('down')) {
            this.cursorDown();
        }
    };

    Scene_PauseMenu.prototype.cursorUp = function () {
        if (this._index > 0) {
            this._index--;
            SoundManager.playCursor();
        }
    };

    Scene_PauseMenu.prototype.cursorDown = function () {
        if (this._index < this._buttons.length - 1) {
            this._index++;
            SoundManager.playCursor();
        }
    };

    Scene_PauseMenu.prototype.processOk = function () {
        this._buttons[this._index].callClickHandler();
    };

    Scene_PauseMenu.prototype.processTouch = function () {
        if (TouchInput.isTriggered()) {
            for (let i = 0; i < this._buttons.length; i++) {
                if (this._buttons[i].isTouched()) {
                    if (this._index !== i) {
                        this._index = i;
                        SoundManager.playCursor();
                    }
                    this.processOk();
                    break;
                }
            }
        }
    };

    // --- Buton Komutları ---

    Scene_PauseMenu.prototype.commandResume = function () {
        SoundManager.playCancel();
        $gameTemp.justPoppedFromMenu = true;
        SceneManager.pop();
    };

    Scene_PauseMenu.prototype.commandAlbum = function () {
        SoundManager.playOk();
        SceneManager.push(Scene_Album);
    };

    Scene_PauseMenu.prototype.commandSave = function () {
        if (!$gameSystem.isSaveEnabled()) {
            SoundManager.playBuzzer();
            return;
        }

        if (!$gameSwitches.value(SAVE_UNLOCK_SWITCH_ID)) {
            SoundManager.playBuzzer();
            SceneManager.push(Scene_LockedSave);
            return;
        }

        SoundManager.playOk();
        SceneManager.goto(Scene_CustomSaveLoad);
        SceneManager.prepareNextScene('save');
    };

    Scene_PauseMenu.prototype.commandLoad = function () {
        SoundManager.playOk();
        SceneManager.goto(Scene_CustomSaveLoad);
        SceneManager.prepareNextScene('load');
    };

    Scene_PauseMenu.prototype.commandExit = function () {
        SoundManager.playOk();
        $gameTemp.justPoppedFromMenu = true;
        SceneManager.goto(Scene_Title);
    };


    // --- Sprite_PauseButton ---
    Sprite_PauseButton.prototype.initialize = function (imageName) {
        Sprite.prototype.initialize.call(this);
        const imagePath = imageName.indexOf('/') >= 0 ? imageName : 'Pause Screen/' + imageName;
        this.bitmap = ImageManager.loadPicture(imagePath);
        this._clickHandler = null;
        this.anchor.x = 0.0;
        this.anchor.y = 0.0;
        this.bitmap.addLoadListener(this.updateHitbox.bind(this));
    };

    Sprite_PauseButton.prototype.setClickHandler = function (handler) {
        this._clickHandler = handler;
    };

    Sprite_PauseButton.prototype.callClickHandler = function () {
        if (this._clickHandler) {
            this._clickHandler();
        }
    };

    Sprite_PauseButton.prototype.updateHitbox = function () {
        if (this.bitmap) {
            this._width = this.bitmap.width;
            this._height = this.bitmap.height;
        }
    };

    Sprite_PauseButton.prototype.isTouched = function () {
        if (!this._width || !this._height) return false;
        const x = this.canvasToLocalX(TouchInput.x);
        const y = this.canvasToLocalY(TouchInput.y);
        const x1 = -this._width * this.anchor.x;
        const x2 = this._width * (1 - this.anchor.x);
        const y1 = -this._height * this.anchor.y;
        const y2 = this._height * (1 - this.anchor.y);
        return x >= x1 && x < x2 && y >= y1 && y < y2;
    };

    Sprite_PauseButton.prototype.canvasToLocalX = function (x) {
        let node = this;
        while (node) { x -= node.x; node = node.parent; }
        return x;
    };

    Sprite_PauseButton.prototype.canvasToLocalY = function (y) {
        let node = this;
        while (node) { y -= node.y; node = node.parent; }
        return y;
    };

    // --- Scene_LockedSave ---

    Scene_LockedSave.prototype.create = function () {
        Scene_MenuBase.prototype.create.call(this);
        this.createBackground();
        this.createMessage();
    };

    Scene_LockedSave.prototype.createBackground = function () {
        this._dimmer = new Sprite();
        this._dimmer.bitmap = new Bitmap(Graphics.boxWidth, Graphics.boxHeight);
        this._dimmer.bitmap.fillAll('rgba(0, 0, 0, 0.8)');
        this.addChild(this._dimmer);
    };

    Scene_LockedSave.prototype.createMessage = function () {
        this._textSprite = new Sprite(new Bitmap(600, 100));
        this._textSprite.anchor.set(0.5);
        this._textSprite.x = Graphics.boxWidth / 2;
        this._textSprite.y = Graphics.boxHeight / 2;

        const bmp = this._textSprite.bitmap;
        bmp.fontFace = "GameFont";
        bmp.fontSize = 28;
        bmp.textColor = "#ffffff";
        bmp.drawText("It's not time yet...", 0, 0, 600, 100, 'center');

        this.addChild(this._textSprite);
    };

    Scene_LockedSave.prototype.update = function () {
        Scene_MenuBase.prototype.update.call(this);
        if (Input.isTriggered('ok') || Input.isTriggered('cancel') || Input.isTriggered('menu') || TouchInput.isTriggered()) {
            SoundManager.playCancel();
            this.popScene();
        }
    };


    // --- Scene_Album ---
    Scene_Album.prototype.initialize = function () {
        Scene_MenuBase.prototype.initialize.call(this);
        this._index = 0;
        this._unlockedPhotos = AlbumConfig.filter(item =>
            item.switchId === 0 || $gameSwitches.value(item.switchId)
        );
        this._maxPhotos = this._unlockedPhotos.length;
    };

    Scene_Album.prototype.create = function () {
        Scene_MenuBase.prototype.create.call(this);
        this.createBackground();
        this.createPhoto();
        this.createControls();
        this.refreshPhoto();
    };

    Scene_Album.prototype.createBackground = function () {
        Scene_MenuBase.prototype.createBackground.call(this);
        this._dimmer = new Sprite();
        this._dimmer.bitmap = new Bitmap(Graphics.boxWidth, Graphics.boxHeight);
        this._dimmer.bitmap.fillAll('rgba(0, 0, 0, 0.1)');
        this.addChild(this._dimmer);
    };

    Scene_Album.prototype.createPhoto = function () {
        this._photoSprite = new Sprite();
        this._photoSprite.anchor.set(0.5);
        this._photoSprite.x = Graphics.boxWidth / 2;
        this._photoSprite.y = Graphics.boxHeight / 2;
        this.addChild(this._photoSprite);

        this._emptyText = new Sprite(new Bitmap(400, 50));
        this._emptyText.x = Graphics.boxWidth / 2 - 200;
        this._emptyText.y = Graphics.boxHeight / 2;
        this._emptyText.bitmap.fontSize = 28;
        this._emptyText.bitmap.drawText("No memories found...", 0, 0, 400, 50, 'center');
        this._emptyText.visible = false;
        this.addChild(this._emptyText);
    };

    Scene_Album.prototype.createControls = function () {
        this._leftArrow = new Sprite_PauseButton('Polaroids/arrow_to_left');
        this._leftArrow.anchor.set(0.5);
        this._leftArrow.setClickHandler(this.prevPhoto.bind(this));
        this.addChild(this._leftArrow);

        this._rightArrow = new Sprite_PauseButton('Polaroids/arrow_to_right');
        this._rightArrow.anchor.set(0.5);
        this._rightArrow.setClickHandler(this.nextPhoto.bind(this));
        this.addChild(this._rightArrow);
    };

    Scene_Album.prototype.onClose = function () {
        SoundManager.playCancel();
        this.popScene();
    };

    Scene_Album.prototype.refreshPhoto = function () {
        if (this._maxPhotos === 0) {
            this._photoSprite.visible = false;
            this._leftArrow.visible = false;
            this._rightArrow.visible = false;
            this._emptyText.visible = true;
            return;
        }

        this._photoSprite.visible = true;
        this._leftArrow.visible = true;
        this._rightArrow.visible = true;
        this._emptyText.visible = false;

        const data = this._unlockedPhotos[this._index];
        const photoName = 'Polaroids/' + data.file;
        this._photoSprite.bitmap = ImageManager.loadPicture(photoName);
        this._photoSprite.bitmap.addLoadListener(this.updateControlPositions.bind(this));
    };

    Scene_Album.prototype.updateControlPositions = function () {
        if (!this._photoSprite.bitmap || this._maxPhotos === 0) return;
        const cx = Graphics.boxWidth / 2;
        const cy = Graphics.boxHeight / 2 + 80;
        const arrowYOffset = 200;
        const arrowSpacingX = 90;
        this._leftArrow.x = cx - arrowSpacingX;
        this._leftArrow.y = cy + arrowYOffset;
        this._rightArrow.x = cx + arrowSpacingX;
        this._rightArrow.y = cy + arrowYOffset;
    };

    Scene_Album.prototype.nextPhoto = function () {
        if (this._maxPhotos === 0) return;
        SoundManager.playCursor();
        this._index = (this._index + 1) % this._maxPhotos;
        this.refreshPhoto();
    };

    Scene_Album.prototype.prevPhoto = function () {
        if (this._maxPhotos === 0) return;
        SoundManager.playCursor();
        this._index = (this._index - 1 + this._maxPhotos) % this._maxPhotos;
        this.refreshPhoto();
    };

    Scene_Album.prototype.update = function () {
        Scene_MenuBase.prototype.update.call(this);
        if (TouchInput.isTriggered()) {
            if (this._leftArrow.visible && this._leftArrow.isTouched()) this._leftArrow.callClickHandler();
            else if (this._rightArrow.visible && this._rightArrow.isTouched()) this._rightArrow.callClickHandler();
        }
        if (Input.isTriggered('right')) {
            this.nextPhoto();
        } else if (Input.isTriggered('left')) {
            this.prevPhoto();
        } else if (Input.isTriggered('cancel') || Input.isTriggered('menu')) {
            this.onClose();
        }
    };

    PluginManager.callCustomSaveLoad = function (mode) {
        SceneManager.push(Scene_CustomSaveLoad);
        SceneManager.prepareNextScene(mode);
    };

    const _DataManager_makeSaveLoad_makeSavefileInfo = DataManager.makeSavefileInfo;
    DataManager.makeSavefileInfo = function () {
        const info = _DataManager_makeSaveLoad_makeSavefileInfo.call(this);
        info.mapId = $gameMap.mapId();
        return info;
    };

    const _DataManager_makeSaveLoad_Scene_Map_updateCallMenu = Scene_Map.prototype.updateCallMenu;
    Scene_Map.prototype.updateCallMenu = function () {
        if ($gameTemp && $gameTemp.justPoppedFromMenu) {
            $gameTemp.justPoppedFromMenu = false;
            Input.clear();
            return;
        }
        if ($gameParty.inBattle()) {
            _DataManager_makeSaveLoad_Scene_Map_updateCallMenu.call(this);
            return;
        }
        if (this.isMenuEnabled() && $gameSystem.isSaveEnabled()) {
            if (Input.isTriggered('menu') || TouchInput.isCancelled()) {
                SceneManager.push(Scene_PauseMenu);
                return;
            }
        }
        _DataManager_makeSaveLoad_Scene_Map_updateCallMenu.call(this);
    };

    const _DataManager_makeSaveLoad_SceneManager_push = SceneManager.push;
    SceneManager.push = function (sceneClass) {
        if (sceneClass === Scene_Load) {
            PluginManager.callCustomSaveLoad('load');
        } else {
            _DataManager_makeSaveLoad_SceneManager_push.call(this, sceneClass);
        }
    };


    // --- Scene_CustomSaveLoad ---
    Scene_CustomSaveLoad.prototype.initialize = function () {
        Scene_MenuBase.prototype.initialize.call(this);
        this._index = 0;
        this._savefileId = 0;
        this._mode = 'save';
        this._slots = [];
        this._uiBackgroundSprite = null;
        this._sortedSavefileIds = []; // Timestamp'e göre sıralanmış save ID'leri
        this._messageSprite = null;
        this._messageTimer = 0;
    };

    Scene_CustomSaveLoad.prototype.prepare = function (mode) {
        this._mode = mode || 'save';
    };

    Scene_CustomSaveLoad.prototype.createBackground = function () {
        // Override Scene_MenuBase's createBackground to prevent duplicate backgrounds
        // We create our own custom UI background instead
    };

    Scene_CustomSaveLoad.prototype.create = function () {
        // Önceki açılıştan kalan sprites'ları tamamen temizle
        while (this.children.length > 0) {
            this.removeChild(this.children[0]);
        }

        this._index = 0;

        // Mode kontrolü
        if (!this._mode) {
            this._mode = 'save';
        }

        if ($gameTemp && $gameTemp.customSaveLoadMode) {
            this._mode = $gameTemp.customSaveLoadMode;
            $gameTemp.customSaveLoadMode = undefined;
        }

        this.createUiBackground();
        this.createSlots();
        this.refreshSlots();
    };

    Scene_CustomSaveLoad.prototype.createUiBackground = function () {
        // Create dimmer for subtle screen darkening
        this._dimmerSprite = new Sprite();
        this._dimmerSprite.bitmap = new Bitmap(Graphics.boxWidth, Graphics.boxHeight);
        this._dimmerSprite.bitmap.fillAll('rgba(0, 0, 0, 0.5)');
        this._dimmerSprite.x = 0;
        this._dimmerSprite.y = 0;

        // Create UI base background
        this._uiBackgroundSprite = new Sprite(ImageManager.loadPicture(Images.saveLoadBase));
        this._uiBackgroundSprite.x = 50;
        this._uiBackgroundSprite.y = 0;

        // Add dimmer first (covers whole screen), then UI base on top
        this.addChild(this._dimmerSprite);
        this.addChild(this._uiBackgroundSprite);
    };

    Scene_CustomSaveLoad.prototype.createSlots = function () {
        // Önceki slotları temizle
        this._slots = [];

        // Save file'ları timestamp'e göre sırala (en yeni en üstte)
        this._sortedSavefileIds = this.getSortedSaveFiles();

        for (let i = 0; i < MAX_SAVE_SLOTS; i++) {
            const savefileId = this._sortedSavefileIds[i] || (i + 1);
            const info = DataManager.loadSavefileInfo(savefileId);
            const mapId = (info && info.mapId) ? info.mapId : 0;
            const slot = new SaveSlot(i, savefileId, mapId, !!info);
            this.addChild(slot);
            this._slots.push(slot);
            slot.refreshInfo();
        }
    };

    Scene_CustomSaveLoad.prototype.getSortedSaveFiles = function () {
        const saveFiles = [];

        // Tüm save slot'larını tara
        for (let i = 1; i <= MAX_SAVE_SLOTS; i++) {
            const info = DataManager.loadSavefileInfo(i);
            if (info) {
                saveFiles.push({
                    id: i,
                    timestamp: info.timestamp || 0
                });
            }
        }

        // Timestamp'e göre sırala (en yeni en üstte)
        saveFiles.sort((a, b) => b.timestamp - a.timestamp);

        // Sadece ID'leri döndür
        const sortedIds = saveFiles.map(file => file.id);

        // Boş slot'ları sonuna ekle
        for (let i = 1; i <= MAX_SAVE_SLOTS; i++) {
            if (!sortedIds.includes(i)) {
                sortedIds.push(i);
            }
        }

        return sortedIds;
    };

    Scene_CustomSaveLoad.prototype.update = function () {
        Scene_MenuBase.prototype.update.call(this);
        this.updateMessageTimer();
        this.processInput();
        this.processTouch();
    };

    Scene_CustomSaveLoad.prototype.updateMessageTimer = function () {
        if (this._messageTimer > 0) {
            this._messageTimer--;
            if (this._messageTimer === 0) {
                this.hideMessage();
            }
        }
    };

    Scene_CustomSaveLoad.prototype.processInput = function () {
        if (Input.isTriggered('menu') || Input.isTriggered('cancel') || TouchInput.isCancelled()) {
            SoundManager.playCancel();
            $gameTemp.justPoppedFromMenu = true;
            SceneManager.pop();
        }
        if (Input.isTriggered('ok')) { this.processOk(); }
        if (Input.isTriggered('down')) { this.cursorDown(); }
        if (Input.isTriggered('up')) { this.cursorUp(); }
    };

    Scene_CustomSaveLoad.prototype.cursorUp = function () {
        if (this._index > 0) {
            this._index--;
            SoundManager.playCursor();
            this.refreshSlots();
        }
    };

    Scene_CustomSaveLoad.prototype.cursorDown = function () {
        if (this._index < 2) {
            this._index++;
            SoundManager.playCursor();
            this.refreshSlots();
        }
    };

    Scene_CustomSaveLoad.prototype.refreshSlots = function () {
        this._slots.forEach((slot, i) => {
            if (this._mode === 'load' && !slot._exists) {
                slot.opacity = 128;
            } else {
                slot.opacity = (i === this._index) ? 255 : 200;
            }
        });
    };

    Scene_CustomSaveLoad.prototype.processTouch = function () {
        if (TouchInput.isTriggered()) {
            for (let i = 0; i < this._slots.length; i++) {
                if (this._slots[i].isTouched()) {
                    if (this._index !== i) {
                        this._index = i;
                        SoundManager.playCursor();
                        this.refreshSlots();
                    } else {
                        this.processOk();
                    }
                    break;
                }
            }
        }
    };

    Scene_CustomSaveLoad.prototype.processOk = function () {
        // Get the actual savefileId from the slot, not from index (slots are sorted by timestamp)
        this._savefileId = this._slots[this._index]._savefileId;
        if (this._mode === 'load') {
            this.processLoad();
        } else {
            this.processSave();
        }
    };

    Scene_CustomSaveLoad.prototype.processSave = function () {
        this.showSavingIndicator();

        // Kısa bir delay ile save işlemini gerçekleştir (indicator görünsün diye)
        setTimeout(() => {
            try {
                $gameSystem.onBeforeSave();

                if (DataManager.saveGame(this._savefileId)) {
                    SoundManager.playSave();
                    this.onSaveSuccess();
                } else {
                    this.onSaveFailure();
                }
            } catch (error) {
                console.error('Save Error:', error);
                this.onSaveFailure();
            }
        }, 300);
    };

    Scene_CustomSaveLoad.prototype.processLoad = function () {
        if (!this._slots[this._index]._exists) {
            SoundManager.playBuzzer();
            this.showErrorMessage("No save data found.");
            return;
        }

        try {
            if (DataManager.loadGame(this._savefileId)) {
                SoundManager.playLoad();
                this.onLoadSuccess();
            } else {
                SoundManager.playBuzzer();
                this.showErrorMessage("Failed to load save data.\nThe file may be corrupted.");
            }
        } catch (error) {
            console.error('Load Error:', error);
            SoundManager.playBuzzer();
            this.showErrorMessage("Error loading save data.\nThe file may be corrupted.");
        }
    };

    Scene_CustomSaveLoad.prototype.onLoadSuccess = function () {
        $gameSystem.onAfterLoad();
        $gameTemp.justPoppedFromMenu = true;

        // Map reload'u kaldırıyoruz çünkü Erase Event gibi durumları sıfırlıyor
        // this.reloadMapIfUpdated(); 

        SceneManager.goto(Scene_Map);
    };

    // Override Scene_Map needsFadeIn to recognize our custom scene
    const _Scene_Map_needsFadeIn = Scene_Map.prototype.needsFadeIn;
    Scene_Map.prototype.needsFadeIn = function () {
        return _Scene_Map_needsFadeIn.call(this) ||
            SceneManager.isPreviousScene(Scene_CustomSaveLoad);
    };

    Scene_CustomSaveLoad.prototype.onSaveSuccess = function () {
        this.hideMessage(); // "Saving..." mesajını gizle

        // Slot'ları yeniden sırala (en son save en üstte olacak)
        this.refreshAllSlots();

        // "Game Saved!" mesajını göster
        this.showSaveSuccessMessage();

        // 1.5 saniye sonra menüyü kapat
        setTimeout(() => {
            $gameTemp.justPoppedFromMenu = true;
            SceneManager.pop();
        }, 1500);
    };

    Scene_CustomSaveLoad.prototype.refreshAllSlots = function () {
        // Tüm slot'ları temizle
        this._slots.forEach(slot => {
            if (slot && slot.parent) {
                this.removeChild(slot);
            }
        });

        // Slot'ları yeniden oluştur (timestamp sıralaması ile)
        this.createSlots();
        this.refreshSlots();
    };

    Scene_CustomSaveLoad.prototype.onSaveFailure = function () {
        this.hideMessage(); // "Saving..." mesajını gizle
        SoundManager.playBuzzer();
        this.showErrorMessage("Failed to save game.\nPlease try again.");
    };

    // --- Visual Feedback Methods ---

    Scene_CustomSaveLoad.prototype.showSavingIndicator = function () {
        this.hideMessage(); // Önceki mesajı temizle

        this._messageSprite = new Sprite();
        this._messageSprite.bitmap = new Bitmap(400, 100);
        this._messageSprite.x = (Graphics.boxWidth - 400) / 2;
        this._messageSprite.y = (Graphics.boxHeight - 100) / 2;
        this._messageSprite.opacity = 0;

        const bmp = this._messageSprite.bitmap;
        bmp.fontFace = "GameFont";
        bmp.fontSize = 32;
        bmp.textColor = "#FFFFFF";
        bmp.outlineColor = "rgba(0, 0, 0, 0.8)";
        bmp.outlineWidth = 6;
        bmp.drawText("Saving...", 0, 0, 400, 100, 'center');

        this.addChild(this._messageSprite);

        // Fade-in animasyonu
        this.fadeInMessage();
    };

    Scene_CustomSaveLoad.prototype.showSaveSuccessMessage = function () {
        this.hideMessage(); // Önceki mesajı temizle

        this._messageSprite = new Sprite();
        this._messageSprite.bitmap = new Bitmap(400, 100);
        this._messageSprite.x = (Graphics.boxWidth - 400) / 2;
        this._messageSprite.y = (Graphics.boxHeight - 100) / 2;
        this._messageSprite.opacity = 0;

        const bmp = this._messageSprite.bitmap;
        bmp.fontFace = "GameFont";
        bmp.fontSize = 36;
        bmp.textColor = "#00FF00";
        bmp.outlineColor = "rgba(0, 0, 0, 0.8)";
        bmp.outlineWidth = 6;
        bmp.drawText("Game Saved!", 0, 0, 400, 100, 'center');

        this.addChild(this._messageSprite);

        // Fade-in animasyonu
        this.fadeInMessage();

        // 1.5 saniye sonra kaybol
        this._messageTimer = 90; // 60 FPS * 1.5 saniye
    };

    Scene_CustomSaveLoad.prototype.showErrorMessage = function (message) {
        this.hideMessage(); // Önceki mesajı temizle

        this._messageSprite = new Sprite();
        this._messageSprite.bitmap = new Bitmap(500, 150);
        this._messageSprite.x = (Graphics.boxWidth - 500) / 2;
        this._messageSprite.y = (Graphics.boxHeight - 150) / 2;
        this._messageSprite.opacity = 0;

        const bmp = this._messageSprite.bitmap;
        bmp.fontFace = "GameFont";
        bmp.fontSize = 28;
        bmp.textColor = "#FF4444";
        bmp.outlineColor = "rgba(0, 0, 0, 0.8)";
        bmp.outlineWidth = 6;

        // Çok satırlı mesaj desteği
        const lines = message.split('\n');
        const lineHeight = 40;
        const startY = (150 - (lines.length * lineHeight)) / 2;

        lines.forEach((line, index) => {
            bmp.drawText(line, 0, startY + (index * lineHeight), 500, lineHeight, 'center');
        });

        this.addChild(this._messageSprite);

        // Fade-in animasyonu
        this.fadeInMessage();

        // 2.5 saniye sonra kaybol
        this._messageTimer = 150; // 60 FPS * 2.5 saniye
    };

    Scene_CustomSaveLoad.prototype.fadeInMessage = function () {
        if (!this._messageSprite) return;

        const fadeSpeed = 15;
        const fadeIn = setInterval(() => {
            if (!this._messageSprite || this._messageSprite.opacity >= 255) {
                clearInterval(fadeIn);
                return;
            }
            this._messageSprite.opacity = Math.min(255, this._messageSprite.opacity + fadeSpeed);
        }, 16); // ~60 FPS
    };

    Scene_CustomSaveLoad.prototype.hideMessage = function () {
        if (this._messageSprite) {
            if (this._messageSprite.bitmap) {
                this._messageSprite.bitmap = null;
            }
            if (this._messageSprite.parent) {
                this.removeChild(this._messageSprite);
            }
            this._messageSprite = null;
        }
        this._messageTimer = 0;
    };

    // Scene kaldırıldığında tüm kaynakları temizle
    Scene_CustomSaveLoad.prototype.terminate = function () {
        Scene_MenuBase.prototype.terminate.call(this);

        // Slot'ları temizle
        if (this._slots) {
            this._slots.forEach(slot => {
                if (slot && slot.parent) {
                    this.removeChild(slot);
                }
            });
            this._slots = [];
        }

        // UI elementlerini temizle
        if (this._dimmerSprite) {
            if (this._dimmerSprite.parent) {
                this.removeChild(this._dimmerSprite);
            }
            this._dimmerSprite.bitmap = null;
            this._dimmerSprite = null;
        }

        if (this._uiBackgroundSprite) {
            if (this._uiBackgroundSprite.parent) {
                this.removeChild(this._uiBackgroundSprite);
            }
            this._uiBackgroundSprite = null;
        }

        // Mesaj sprite'ını temizle
        this.hideMessage();
    };

    // --- SaveSlot ---

    SaveSlot.prototype.initialize = function (slotIndex, savefileId, mapId, exists) {
        Sprite.prototype.initialize.call(this);
        this._slotIndex = slotIndex;
        this._savefileId = savefileId;
        this._mapId = mapId;
        this._exists = exists;
        this._paddingX = 35;
        this._paddingY = 35;
        this._roomSprite = new Sprite();
        this._roomSprite.x = this._paddingX;
        this._roomSprite.y = this._paddingY;
        this.updateRoomImage(this._mapId, this._exists);
        this.addChild(this._roomSprite);

        this._frame = new Sprite(ImageManager.loadPicture(Images.saveLoadLine));
        this.addChild(this._frame);

        this.x = SLOT_X;
        this.y = SLOT_Y_START + slotIndex * SLOT_SPACING;

        this._frame.bitmap.addLoadListener(this.updateHitbox.bind(this));

        this._infoText = new Sprite(new Bitmap(300, 80));
        this._infoText.x = this._paddingX + 150;
        this._infoText.y = this._paddingY + 70;
        this.addChild(this._infoText);
        this.refreshInfo();
    };

    SaveSlot.prototype.updateRoomImage = function (mapId, exists) {
        this._mapId = mapId;
        this._exists = !!exists;

        // Eğer slotta save yoksa, room sprite'ını gizle ve bitmap yükleme yapma.
        if (!this._exists) {
            this._roomSprite.visible = false;
            this._roomSprite.bitmap = null;
            return;
        }

        this._roomSprite.visible = true;
        const roomImg = Images.saveLoadRooms[mapId] || Images.saveLoadBase;

        // Eğer roomImg UI base ile aynıysa, UI'da zaten gösterildiği için slot'ta tekrar göstermeyelim
        if (roomImg === Images.saveLoadBase) {
            this._roomSprite.visible = false;
            this._roomSprite.bitmap = null;
            return;
        }

        this._roomSprite.bitmap = ImageManager.loadPicture(roomImg);
        this._roomSprite.bitmap.addLoadListener(this.onRoomImageLoad.bind(this));
    };

    SaveSlot.prototype.refreshInfo = function () {
        const info = DataManager.loadSavefileInfo(this._savefileId);
        const bitmap = this._infoText.bitmap;
        bitmap.clear();

        if (!info) {
            bitmap.fontFace = "GameFont";
            bitmap.fontSize = 26;
            bitmap.textColor = "#AAAAAA";
            bitmap.drawText("— Empty Slot —", 0, 0, 280, 40, "center");
            return;
        }

        let mapName = "";
        if ($dataMapInfos && $dataMapInfos[info.mapId]) {
            mapName = $dataMapInfos[info.mapId].name || "";
            mapName = mapName.replace(/^\d+\s*[-_]?\s*/, "");
        } else {
            mapName = "Bilinmeyen Bölge";
        }

        const playtime = info.playtime || "00:00:00";
        bitmap.fontFace = "GameFont";
        bitmap.fontSize = 26;
        bitmap.textColor = "#FFFFFF";

        const maxWidth = 170;
        let displayName = mapName;
        while (bitmap.measureTextWidth(displayName) > maxWidth) {
            displayName = displayName.slice(0, -1);
            if (bitmap.measureTextWidth(displayName + "…") <= maxWidth) {
                displayName += "…";
                break;
            }
        }

        bitmap.drawText(displayName, 20, 0, maxWidth, 40, "left");
        bitmap.fontSize = 24;
        bitmap.textColor = "#DDDDDD";

        const playtimeX = 190;
        const playtimeWidth = 110;
        bitmap.drawText(playtime, playtimeX, 0, playtimeWidth, 40, "right");
    };

    SaveSlot.prototype.onRoomImageLoad = function () {
        if (!this._frame || !this._frame.bitmap || !this._roomSprite || !this._roomSprite.bitmap ||
            !this._frame.bitmap.isReady()) return;

        const bitmapWidth = this._roomSprite.bitmap.width;
        const bitmapHeight = this._roomSprite.bitmap.height;

        if (bitmapWidth === 0 || bitmapHeight === 0) return;

        const targetWidth = this._frame.width - (this._paddingX * 2);
        const targetHeight = this._frame.height - (this._paddingY * 2) - 10;
        const scale = Math.min(targetWidth / bitmapWidth, targetHeight / bitmapHeight);

        this._roomSprite.scale.x = scale;
        this._roomSprite.scale.y = scale;
        this._roomSprite.x = this._paddingX + (targetWidth - (bitmapWidth * scale)) / 2;
        this._roomSprite.y = this._paddingY + (targetHeight - (bitmapHeight * scale)) / 2;
    };

    SaveSlot.prototype.updateHitbox = function () {
        this._width = this._frame.width;
        this._height = this._frame.height;
    };

    SaveSlot.prototype.isTouched = function () {
        if (!this._width) return false;
        const x = this.canvasToLocalX(TouchInput.x);
        const y = this.canvasToLocalY(TouchInput.y);
        return x >= 0 && x < this._width && y < this._height;
    };

    SaveSlot.prototype.canvasToLocalX = function (x) {
        let node = this;
        while (node) { x -= node.x; node = node.parent; }
        return x;
    };

    SaveSlot.prototype.canvasToLocalY = function (y) {
        let node = this;
        while (node) { y -= node.y; node = node.parent; }
        return y;
    };

})();