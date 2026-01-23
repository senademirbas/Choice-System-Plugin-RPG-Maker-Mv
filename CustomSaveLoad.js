/*:
 * @plugindesc Özel Menü Sistemi (Pause + Save/Load + Album) - v13 (No Polaroids)
 * @author Sena
 * @help 
 * v13 Değişiklikleri:
 * - Sağ taraftaki dekoratif polaroidler kaldırıldı.
 * - Albümdeki X tuşuna basıldığında çıkış sesi (Cancel Sound) korundu.
 */

(function() {

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

    
    // --- Scene_PauseMenu Fonksiyonları ---

    Scene_PauseMenu.prototype.initialize = function() {
        Scene_MenuBase.prototype.initialize.call(this);
        this._index = 0; 
        this._buttons = []; 
    };

    Scene_PauseMenu.prototype.create = function() {
        Scene_MenuBase.prototype.create.call(this);
        this.createBackground();
        this.createButtons();
        // this.createPolaroids(); // KALDIRILDI
        this.updateButtonHighlights();
    };

    Scene_PauseMenu.prototype.createBackground = function() {
        this._backgroundSprite = new Sprite(ImageManager.loadPicture('Pause Screen/Base'));
        this.addChild(this._backgroundSprite);
    };

    Scene_PauseMenu.prototype.createButtons = function() {
        const buttonInfo = [
            { img: 'Save',    handler: this.commandSave },
            { img: 'Load',    handler: this.commandLoad },
            { img: 'Album',   handler: this.commandAlbum },
            { img: 'Exit',    handler: this.commandExit }
        ];

        const buttonX = 100; 
        const spacingNormal = 110; 
        const spacingLarge = 180;  
        const totalHeight = (spacingNormal * 2) + spacingLarge;
        const startY = ((Graphics.boxHeight - totalHeight) / 2) - 50;

        let currentY = startY; 

        for (let i = 0; i < buttonInfo.length; i++) {
            const info = buttonInfo[i];
            const button = new Sprite_PauseButton(info.img);
            
            button.x = buttonX;
            button.y = currentY;
            
            button.setClickHandler(info.handler.bind(this));
            this._buttons.push(button);
            this.addChild(button);

            if (info.handler === this.commandAlbum) {
                currentY += (spacingLarge + 25);
            } else {
                currentY += spacingNormal;
            }
        }
    };

    // createPolaroids fonksiyonu tamamen kaldırıldı.
    
    Scene_PauseMenu.prototype.update = function() {
        Scene_MenuBase.prototype.update.call(this);
        this.processInput();
        this.processTouch();
        this.updateButtonHighlights();
    };

    Scene_PauseMenu.prototype.updateButtonHighlights = function() {
        for (let i = 0; i < this._buttons.length; i++) {
            const button = this._buttons[i];
            if (i === this._index) {
                button.scale.x = 1.1;
                button.scale.y = 1.1;
                button.opacity = 255;
            } else {
                button.scale.x = 1.0;
                button.scale.y = 1.0;
                button.opacity = 200;
            }
        }
    };

    Scene_PauseMenu.prototype.processInput = function() {
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

    Scene_PauseMenu.prototype.cursorUp = function() {
        if (this._index > 0) {
            this._index--;
            SoundManager.playCursor();
        }
    };

    Scene_PauseMenu.prototype.cursorDown = function() {
        if (this._index < this._buttons.length - 1) {
            this._index++;
            SoundManager.playCursor();
        }
    };

    Scene_PauseMenu.prototype.processOk = function() {
        this._buttons[this._index].callClickHandler();
    };

    Scene_PauseMenu.prototype.processTouch = function() {
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

    Scene_PauseMenu.prototype.commandResume = function() {
        SoundManager.playCancel();
        $gameTemp.justPoppedFromMenu = true; 
        SceneManager.pop(); 
    };

    Scene_PauseMenu.prototype.commandAlbum = function() {
        SoundManager.playOk();
        SceneManager.push(Scene_Album);
    };

    Scene_PauseMenu.prototype.commandSave = function() {
        if (!$gameSystem.isSaveEnabled()) {
            SoundManager.playBuzzer();
            return;
        }
        SoundManager.playOk();
        SceneManager.goto(Scene_CustomSaveLoad);
        SceneManager.prepareNextScene('save');
    };

    Scene_PauseMenu.prototype.commandLoad = function() {
        SoundManager.playOk();
        SceneManager.goto(Scene_CustomSaveLoad);
        SceneManager.prepareNextScene('load');
    };

    Scene_PauseMenu.prototype.commandExit = function() {
        SoundManager.playOk();
        $gameTemp.justPoppedFromMenu = true; 
        SceneManager.goto(Scene_Title); 
    };


    // --- Sprite_PauseButton ---
    Sprite_PauseButton.prototype.initialize = function(imageName) {
        Sprite.prototype.initialize.call(this);
        
        if (imageName.indexOf('/') >= 0) {
            this.bitmap = ImageManager.loadPicture(imageName);
        } else {
            this.bitmap = ImageManager.loadPicture('Pause Screen/' + imageName);
        }
        
        this._clickHandler = null;
        this.anchor.x = 0.0;
        this.anchor.y = 0.0;
        this.bitmap.addLoadListener(this.updateHitbox.bind(this));
    };

    Sprite_PauseButton.prototype.setClickHandler = function(handler) {
        this._clickHandler = handler;
    };

    Sprite_PauseButton.prototype.callClickHandler = function() {
        if (this._clickHandler) {
            this._clickHandler();
        }
    };

    Sprite_PauseButton.prototype.updateHitbox = function() {
        if (this.bitmap) {
            this._width = this.bitmap.width;
            this._height = this.bitmap.height;
        }
    };

    Sprite_PauseButton.prototype.isTouched = function() {
        if (!this._width || !this._height) return false;
        
        const x = this.canvasToLocalX(TouchInput.x);
        const y = this.canvasToLocalY(TouchInput.y);

        const x1 = -this._width * this.anchor.x;
        const x2 = this._width * (1 - this.anchor.x);
        const y1 = -this._height * this.anchor.y;
        const y2 = this._height * (1 - this.anchor.y);

        return x >= x1 && x < x2 && y >= y1 && y < y2;
    };
    
    Sprite_PauseButton.prototype.canvasToLocalX = function(x) {
        let node = this;
        while (node) { x -= node.x; node = node.parent; }
        return x;
    };
    
    Sprite_PauseButton.prototype.canvasToLocalY = function(y) {
        let node = this;
        while (node) { y -= node.y; node = node.parent; }
        return y;
    };

    // --- Scene_Album ---

    Scene_Album.prototype.initialize = function() {
        Scene_MenuBase.prototype.initialize.call(this);
        this._photoIndex = 1; 
        this._maxPhotos = 10;
    };

    Scene_Album.prototype.create = function() {
        Scene_MenuBase.prototype.create.call(this);
        this.createBackground();
        this.createPhoto();
        this.createControls();
        this.refreshPhoto();
    };

    Scene_Album.prototype.createBackground = function() {
        Scene_MenuBase.prototype.createBackground.call(this);
        
        this._dimmer = new Sprite();
        this._dimmer.bitmap = new Bitmap(Graphics.boxWidth, Graphics.boxHeight);
        this._dimmer.bitmap.fillAll('rgba(0, 0, 0, 0.1)'); 
        this.addChild(this._dimmer);
    };

    Scene_Album.prototype.createPhoto = function() {
        this._photoSprite = new Sprite();
        this._photoSprite.anchor.set(0.5);
        this._photoSprite.x = Graphics.boxWidth / 2;
        this._photoSprite.y = Graphics.boxHeight / 2;
        this.addChild(this._photoSprite);
    };

    Scene_Album.prototype.createControls = function() {
        this._leftArrow = new Sprite_PauseButton('Polaroids/arrow_to_left');
        this._leftArrow.anchor.set(0.5);
        this._leftArrow.setClickHandler(this.prevPhoto.bind(this));
        this.addChild(this._leftArrow);

        this._rightArrow = new Sprite_PauseButton('Polaroids/arrow_to_right');
        this._rightArrow.anchor.set(0.5);
        this._rightArrow.setClickHandler(this.nextPhoto.bind(this));
        this.addChild(this._rightArrow);

        this._closeBtn = new Sprite_PauseButton('Polaroids/X');
        this._closeBtn.anchor.set(0.5);
        
        this._closeBtn.setClickHandler(this.onClose.bind(this));
        
        this.addChild(this._closeBtn);
    };

    Scene_Album.prototype.onClose = function() {
        SoundManager.playCancel();
        this.popScene();
    };

    Scene_Album.prototype.refreshPhoto = function() {
        const photoName = 'Polaroids/' + this._photoIndex;
        this._photoSprite.bitmap = ImageManager.loadPicture(photoName);
        this._photoSprite.bitmap.addLoadListener(this.updateControlPositions.bind(this));
    };

    Scene_Album.prototype.updateControlPositions = function() {
        if (!this._photoSprite.bitmap) return;

        const cx = Graphics.boxWidth / 2;
        const cy = Graphics.boxHeight / 2 + 80;
        
        const arrowYOffset = 200; 
        const arrowSpacingX = 90; 

        // Sol Ok Konumu
        this._leftArrow.x = cx - arrowSpacingX;
        this._leftArrow.y = cy + arrowYOffset;
        
        // Sağ Ok Konumu
        this._rightArrow.x = cx + arrowSpacingX;
        this._rightArrow.y = cy + arrowYOffset;

        // Çıkış (X) Tuşu
        this._closeBtn.x = Graphics.boxWidth - 60;
        this._closeBtn.y = 60;
    };

    Scene_Album.prototype.nextPhoto = function() {
        SoundManager.playCursor();
        this._photoIndex++;
        if (this._photoIndex > this._maxPhotos) {
            this._photoIndex = 1; 
        }
        this.refreshPhoto();
    };

    Scene_Album.prototype.prevPhoto = function() {
        SoundManager.playCursor();
        this._photoIndex--;
        if (this._photoIndex < 1) {
            this._photoIndex = this._maxPhotos; 
        }
        this.refreshPhoto();
    };

    Scene_Album.prototype.update = function() {
        Scene_MenuBase.prototype.update.call(this);
        
        if (TouchInput.isTriggered()) {
            if (this._leftArrow.isTouched()) this._leftArrow.callClickHandler();
            else if (this._rightArrow.isTouched()) this._rightArrow.callClickHandler();
            else if (this._closeBtn.isTouched()) this._closeBtn.callClickHandler();
        }

        if (Input.isTriggered('right')) {
            this.nextPhoto();
        } else if (Input.isTriggered('left')) {
            this.prevPhoto();
        } else if (Input.isTriggered('cancel') || Input.isTriggered('menu')) {
            SoundManager.playCancel();
            this.popScene();
        }
    };


    // --- PluginManager ve Diğer Sistemler ---

    PluginManager.callCustomSaveLoad = function(mode) {
        SceneManager.push(Scene_CustomSaveLoad);
        SceneManager.prepareNextScene(mode);
    };

    const _DataManager_makeSaveLoad_makeSavefileInfo = DataManager.makeSavefileInfo;
    DataManager.makeSavefileInfo = function() {
        const info = _DataManager_makeSaveLoad_makeSavefileInfo.call(this);
        info.mapId = $gameMap.mapId();
        return info;
    };

    const _DataManager_makeSaveLoad_Scene_Map_updateCallMenu = Scene_Map.prototype.updateCallMenu;
    Scene_Map.prototype.updateCallMenu = function() {
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
    SceneManager.push = function(sceneClass) {
        if (sceneClass === Scene_Load) {
            PluginManager.callCustomSaveLoad('load');
        } else {
            _DataManager_makeSaveLoad_SceneManager_push.call(this, sceneClass);
        }
    };

    // --- Scene_CustomSaveLoad ---

    Scene_CustomSaveLoad.prototype.initialize = function() {
        Scene_MenuBase.prototype.initialize.call(this);
        this._index = 0; 
        this._savefileId = 0;
        this._mode = 'save';
    };

    Scene_CustomSaveLoad.prototype.prepare = function(mode) {
        this._mode = mode || 'save';
    };

    Scene_CustomSaveLoad.prototype.create = function() {
        Scene_MenuBase.prototype.create.call(this); 
        if ($gameTemp && $gameTemp.customSaveLoadMode) {
            this._mode = $gameTemp.customSaveLoadMode;
            $gameTemp.customSaveLoadMode = undefined; 
        }
        this.createUiBackground(); 
        this.createSlots();
        this.refreshSlots();
    };

    Scene_CustomSaveLoad.prototype.createUiBackground = function() {
        this._uiBackgroundSprite = new Sprite(ImageManager.loadPicture("Save-Load/SAVE_LOAD_Base"));
        this._uiBackgroundSprite.x = 50;
        this._uiBackgroundSprite.y = 0;
        this.addChild(this._uiBackgroundSprite);
    };

    Scene_CustomSaveLoad.prototype.createSlots = function() {
        this._slots = [];
        for (let i = 0; i < 3; i++) {
            const savefileId = i + 1;
            const info = DataManager.loadSavefileInfo(savefileId);
            let mapId = (info && info.mapId) ? info.mapId : 0;
            const slot = new SaveSlot(i, savefileId, mapId, !!info);
            this.addChild(slot);
            this._slots.push(slot);
            slot.refreshInfo();
        }
    };

    Scene_CustomSaveLoad.prototype.update = function() {
        Scene_MenuBase.prototype.update.call(this);
        this.processInput();
        this.processTouch();
    };

    Scene_CustomSaveLoad.prototype.processInput = function() {
        if (Input.isTriggered('menu') || Input.isTriggered('cancel') || TouchInput.isCancelled()) {
            SoundManager.playCancel();
            $gameTemp.justPoppedFromMenu = true; 
            SceneManager.pop();
        }
        if (Input.isTriggered('ok')) { this.processOk(); }
        if (Input.isTriggered('down')) { this.cursorDown(); }
        if (Input.isTriggered('up')) { this.cursorUp(); }
    };

    Scene_CustomSaveLoad.prototype.cursorUp = function() {
        if (this._index > 0) {
            this._index--;
            SoundManager.playCursor();
            this.refreshSlots();
        }
    };

    Scene_CustomSaveLoad.prototype.cursorDown = function() {
        if (this._index < 2) { 
            this._index++;
            SoundManager.playCursor();
            this.refreshSlots();
        }
    };

    Scene_CustomSaveLoad.prototype.refreshSlots = function() {
        for (let i = 0; i < this._slots.length; i++) {
            const slot = this._slots[i];
            if (this._mode === 'load' && !slot._exists) {
                slot.opacity = 128;
            } else {
                slot.opacity = (i === this._index) ? 255 : 200;
            }
        }
    };

    Scene_CustomSaveLoad.prototype.processTouch = function() {
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

    Scene_CustomSaveLoad.prototype.processOk = function() {
        this._savefileId = this._index + 1;
        if (this._mode === 'load') {
            this.processLoad();
        } else {
            this.processSave();
        }
    };

    Scene_CustomSaveLoad.prototype.processSave = function() {
        SoundManager.playSave();
        $gameSystem.onBeforeSave();
        if (DataManager.saveGame(this._savefileId)) {
            this.onSaveSuccess();
        } else {
            this.onSaveFailure();
        }
    };

    Scene_CustomSaveLoad.prototype.processLoad = function() {
        if (!this._slots[this._index]._exists) {
            SoundManager.playBuzzer();
            return;
        }
        if (DataManager.loadGame(this._savefileId)) {
            SoundManager.playLoad();
            this.onLoadSuccess();
        } else {
            SoundManager.playBuzzer();
        }
    };

    Scene_CustomSaveLoad.prototype.onLoadSuccess = function() {
        $gameSystem.onAfterLoad();
        $gameTemp.justPoppedFromMenu = true; 
        SceneManager.goto(Scene_Map);
    };

    Scene_CustomSaveLoad.prototype.onSaveSuccess = function() {
        const info = DataManager.loadSavefileInfo(this._savefileId);
        let mapId = (info && info.mapId) ? info.mapId : 0;
        this._slots[this._index].updateRoomImage(mapId, true);
        this._slots[this._index].refreshInfo();
        $gameTemp.justPoppedFromMenu = true; 
        SceneManager.pop();
    };

    Scene_CustomSaveLoad.prototype.onSaveFailure = function() {
        SoundManager.playBuzzer();
    };

    
    // --- SaveSlot Sınıfı ---

    SaveSlot.prototype.initialize = function(slotIndex, savefileId, mapId, exists) {
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

        this._frame = new Sprite(ImageManager.loadPicture("Save-Load/SAVE_LOAD_Line"));
        this.addChild(this._frame);

        this.x = 330; 
        this.y = 30 + slotIndex * 200; 
        
        this._frame.bitmap.addLoadListener(this.updateHitbox.bind(this));
        
        this._infoText = new Sprite(new Bitmap(300, 80));
        this._infoText.x = this._paddingX + 150;
        this._infoText.y = this._paddingY + 70;
        this.addChild(this._infoText);

        this.refreshInfo();
    };
    
    SaveSlot.prototype.updateRoomImage = function(mapId, exists) {
        this._mapId = mapId;
        this._exists = exists;
        let roomImg = "Save-Load/SAVE_LOAD_Base";

        if (this._exists) {
            switch (this._mapId) {
                case 2: roomImg = "Save-Load/SAVE_LOAD_Bathroom"; break;
                case 3: roomImg = "Save-Load/SAVE_LOAD_Bedroom"; break;
                case 4: roomImg = "Save-Load/SAVE_LOAD_Enterance"; break;
                case 5: roomImg = "Save-Load/SAVE_LOAD_Hallway"; break;
                case 6: roomImg = "Save-Load/SAVE_LOAD_Living_Room"; break;
                case 7: roomImg = "Save-Load/SAVE_LOAD_Lydias_Room"; break;
                case 8: roomImg = "Save-Load/SAVE_LOAD_Nightmare_1"; break;
                case 9: roomImg = "Save-Load/SAVE_LOAD_Outside"; break;
                default: roomImg = "Save-Load/SAVE_LOAD_Base"; break;
            }
        }
        
        this._roomSprite.bitmap = ImageManager.loadPicture(roomImg);
        this._roomSprite.bitmap.addLoadListener(this.onRoomImageLoad.bind(this));
    };
    
    SaveSlot.prototype.refreshInfo = function() {
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

    SaveSlot.prototype.onRoomImageLoad = function() {
        if (!this._frame || !this._frame.bitmap || !this._roomSprite || !this._roomSprite.bitmap || !this._frame.bitmap.isReady()) {
            return; 
        }
        
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
    
    SaveSlot.prototype.updateHitbox = function() {
        this._width = this._frame.width;
        this._height = this._frame.height;
    };

    SaveSlot.prototype.isTouched = function() {
        if (!this._width) return false;
        const x = this.canvasToLocalX(TouchInput.x);
        const y = this.canvasToLocalY(TouchInput.y);
        return x >= 0 && x < this._width && y < this._height;
    };
    
    SaveSlot.prototype.canvasToLocalX = function(x) {
        let node = this;
        while (node) { x -= node.x; node = node.parent; }
        return x;
    };
    
    SaveSlot.prototype.canvasToLocalY = function(y) {
        let node = this;
        while (node) { y -= node.y; node = node.parent; }
        return y;
    };

})();