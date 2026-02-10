/*:
 * @plugindesc Visual Novel Choice System (Final Platinum) - Keyboard Only
 * @author SeninAdin
 *
 * @param --- General Settings ---
 * @default
 *
 * @param Result Variable ID
 * @desc Variable ID to store the selected choice index (1, 2, or 3).
 * @default 1
 * @type variable
 *
 * @param --- Choice 1 (Top/Middle) ---
 * @default
 *
 * @param Choice 1 X
 * @desc X coordinate for the first choice bar.
 * @default 770
 *
 * @param Choice 1 Y
 * @desc Y coordinate for the first choice bar.
 * @default 371
 *
 * @param --- Choice 2 (Middle/Bottom) ---
 * @default
 *
 * @param Choice 2 X
 * @desc X coordinate for the second choice bar.
 * @default 770
 *
 * @param Choice 2 Y
 * @desc Y coordinate for the second choice bar.
 * @default 425
 *
 * @param --- Choice 3 (Bottom) ---
 * @default
 *
 * @param Choice 3 X
 * @desc X coordinate for the third choice bar.
 * @default 770
 *
 * @param Choice 3 Y
 * @desc Y coordinate for the third choice bar.
 * @default 479
 *
 * @help
 * ============================================================================
 * VN CHOICE SYSTEM
 * ============================================================================
 * This plugin creates a Visual Novel style choice selection system using
 * custom images and layout.
 *
 * USAGE:
 * Plugin Command: ShowVNChoices choice1|choice2|choice3
 * 
 * EXAMPLE 1 (3 Choices):
 * ShowVNChoices Option A|Option B|Option C
 * -> Option A selected: Variable = 1
 * -> Option B selected: Variable = 2
 * -> Option C selected: Variable = 3
 *
 * EXAMPLE 2 (2 Choices):
 * ShowVNChoices Yes|No
 * -> Yes selected: Variable = 1
 * -> No selected: Variable = 2
 */

(function () {
    'use strict';

    // ============================= 
    // CONFIGURATION
    // ============================= 
    var params = PluginManager.parameters('VN_Choice_System');

    const VN_CHOICE_CONFIG = {
        CHOICE_AREAS: [
            // [0] -> TOP BAR (Bar 3)
            {
                x: Number(params['Choice 1 X'] || 770),
                y: Number(params['Choice 1 Y'] || 371),
                width: 850,
                height: 35
            },

            // [1] -> MIDDLE BAR (Bar 1)
            {
                x: Number(params['Choice 2 X'] || 770),
                y: Number(params['Choice 2 Y'] || 425),
                width: 850,
                height: 35
            },

            // [2] -> BOTTOM BAR (Bar 2)
            {
                x: Number(params['Choice 3 X'] || 770),
                y: Number(params['Choice 3 Y'] || 479),
                width: 850,
                height: 40
            }
        ],

        PICTURES: {
            BAR_1: 'Selection Bar',        // Middle
            BAR_1_ON: 'Selection Bar On',
            BAR_2: 'Selection Bar 2',      // Bottom
            BAR_2_ON: 'Selection Bar 2 On',
            BAR_3: 'Selection Bar 3',      // Top
            BAR_3_ON: 'Selection Bar 3 On'
        },

        TEXT: {
            FONT_SIZE: 21,
            FONT_COLOR: '#000000',
            BOLD_WIDTH: 1.0,
            ALIGN: 'left',
            PADDING_LEFT: 15,
            PADDING_TOP: 3,
            LINE_HEIGHT: 30
        },

        RESULT_VARIABLE_ID: Number(params['Result Variable ID'] || 1)
    };

    let vnChoiceTexts = [];

    // ============================= 
    // PLUGIN COMMAND
    // ============================= 
    const _Game_Interpreter_pluginCommand = Game_Interpreter.prototype.pluginCommand;
    Game_Interpreter.prototype.pluginCommand = function (command, args) {
        _Game_Interpreter_pluginCommand.call(this, command, args);

        if (command === 'ShowVNChoices') {
            const choiceText = args.join(' ');
            const choices = choiceText.split('|');

            if (choices.length >= 2) {
                vnChoiceTexts = choices.map(c => c.trim());

                if (SceneManager._scene instanceof Scene_Map) {
                    SceneManager._scene.startVNChoice();
                    this.setWaitMode('vnChoice');
                }
            }
        }
    };

    // ============================= 
    // WAIT MODE
    // ============================= 
    const _Game_Interpreter_updateWaitMode = Game_Interpreter.prototype.updateWaitMode;
    Game_Interpreter.prototype.updateWaitMode = function () {
        if (this._waitMode === 'vnChoice') {
            var scene = SceneManager._scene;
            if (scene instanceof Scene_Map && scene.isVNChoiceBusy()) {
                return true;
            }
            this._waitMode = '';
            return false;
        }
        return _Game_Interpreter_updateWaitMode.call(this);
    };

    // ============================= 
    // SCENE_MAP
    // ============================= 
    const _Scene_Map_createAllWindows = Scene_Map.prototype.createAllWindows;
    Scene_Map.prototype.createAllWindows = function () {
        _Scene_Map_createAllWindows.call(this);
        this.createVNChoiceWindow();
    };

    const _Scene_Map_createDisplayObjects = Scene_Map.prototype.createDisplayObjects;
    Scene_Map.prototype.createDisplayObjects = function () {
        _Scene_Map_createDisplayObjects.call(this);
        this.createVNChoiceLayer();
    };

    Scene_Map.prototype.createVNChoiceLayer = function () {
        this._vnChoiceContainer = new Sprite();

        // Sprite'ları oluşturuyoruz
        this._vnBarSprite3 = new Sprite(); // Üst
        this._vnBarSprite1 = new Sprite(); // Orta
        this._vnBarSprite2 = new Sprite(); // Alt

        this._vnBarSprite3.visible = false;
        this._vnBarSprite1.visible = false;
        this._vnBarSprite2.visible = false;

        this._vnChoiceContainer.addChild(this._vnBarSprite3);
        this._vnChoiceContainer.addChild(this._vnBarSprite1);
        this._vnChoiceContainer.addChild(this._vnBarSprite2);

        const windowLayerIndex = this.getChildIndex(this._windowLayer);
        if (windowLayerIndex > -1) {
            this.addChildAt(this._vnChoiceContainer, windowLayerIndex);
        } else {
            this.addChild(this._vnChoiceContainer);
        }
    };

    Scene_Map.prototype.createVNChoiceWindow = function () {
        this._vnChoiceWindow = new Window_VNChoice();
        this._vnChoiceWindow.setHandler('ok', this.onVNChoiceOk.bind(this));
        this.addWindow(this._vnChoiceWindow);
    };

    Scene_Map.prototype.startVNChoice = function () {
        this.showSelectionBars();

        if (this._vnChoiceWindow) {
            this._vnChoiceWindow.setBarSprites(
                this._vnBarSprite1,
                this._vnBarSprite2,
                this._vnBarSprite3
            );
            this._vnChoiceWindow.start();
            this._vnChoiceWindow.refresh();
            this._vnChoiceWindow.activate();
            this._vnChoiceWindow.show();
        }
    };

    Scene_Map.prototype.isVNChoiceBusy = function () {
        return this._vnChoiceWindow && this._vnChoiceWindow.visible;
    };

    Scene_Map.prototype.showSelectionBars = function () {
        const cfg = VN_CHOICE_CONFIG;
        if (!this._vnBarSprite1 || !this._vnBarSprite2 || !this._vnBarSprite3) return;

        const count = vnChoiceTexts.length;

        // --- BAR 1 (Orta) ---
        const bitmap1 = ImageManager.loadPicture(cfg.PICTURES.BAR_1);
        const bitmap1On = ImageManager.loadPicture(cfg.PICTURES.BAR_1_ON);
        this._vnBarSprite1.bitmap = bitmap1;
        this._vnBarSprite1._normalBitmap = bitmap1;
        this._vnBarSprite1._hoverBitmap = bitmap1On;
        this._vnBarSprite1.visible = true;

        // --- BAR 2 (Alt) ---
        const bitmap2 = ImageManager.loadPicture(cfg.PICTURES.BAR_2);
        const bitmap2On = ImageManager.loadPicture(cfg.PICTURES.BAR_2_ON);
        this._vnBarSprite2.bitmap = bitmap2;
        this._vnBarSprite2._normalBitmap = bitmap2;
        this._vnBarSprite2._hoverBitmap = bitmap2On;
        this._vnBarSprite2.visible = true;

        // --- BAR 3 (Üst) ---
        const bitmap3 = ImageManager.loadPicture(cfg.PICTURES.BAR_3);
        const bitmap3On = ImageManager.loadPicture(cfg.PICTURES.BAR_3_ON);
        this._vnBarSprite3.bitmap = bitmap3;
        this._vnBarSprite3._normalBitmap = bitmap3;
        this._vnBarSprite3._hoverBitmap = bitmap3On;
        // Yalnızca 3 seçenek varsa görünür
        this._vnBarSprite3.visible = (count === 3);
    };

    Scene_Map.prototype.hideVNChoice = function () {
        if (this._vnBarSprite1) this._vnBarSprite1.visible = false;
        if (this._vnBarSprite2) this._vnBarSprite2.visible = false;
        if (this._vnBarSprite3) this._vnBarSprite3.visible = false;

        if (this._vnChoiceWindow) {
            this._vnChoiceWindow.deactivate();
            this._vnChoiceWindow.hide();
        }
        Input.clear();
    };

    Scene_Map.prototype.onVNChoiceOk = function () {
        const index = this._vnChoiceWindow.index();
        // Index + 1 değişken değerine atanır.
        $gameVariables.setValue(VN_CHOICE_CONFIG.RESULT_VARIABLE_ID, index + 1);
        this.hideVNChoice();
    };

    // ============================= 
    // WINDOW_VNCHOICE
    // ============================= 
    function Window_VNChoice() {
        this.initialize.apply(this, arguments);
    }

    Window_VNChoice.prototype = Object.create(Window_Selectable.prototype);
    Window_VNChoice.prototype.constructor = Window_VNChoice;

    Window_VNChoice.prototype.initialize = function () {
        Window_Selectable.prototype.initialize.call(this, 0, 0, Graphics.width, Graphics.height);
        this.opacity = 0;
        this.hide();
        this.deactivate();
        this._barSprite1 = null;
        this._barSprite2 = null;
        this._barSprite3 = null;
    };

    Window_VNChoice.prototype.updateCursor = function () { };

    Window_VNChoice.prototype.processTouch = function () {
        return false;
    };

    Window_VNChoice.prototype.setBarSprites = function (s1, s2, s3) {
        this._barSprite1 = s1;
        this._barSprite2 = s2;
        this._barSprite3 = s3;
    };

    Window_VNChoice.prototype.maxItems = function () {
        return vnChoiceTexts.length;
    };

    Window_VNChoice.prototype.start = function () {
        this.refresh();
        this.select(0);
        this.updateBarGraphics(0);
        this.open();
        this.activate();
    };

    Window_VNChoice.prototype.drawAllItems = function () {
        for (let i = 0; i < this.maxItems(); i++) {
            const rect = this.itemRect(i);
            this.drawChoiceText(vnChoiceTexts[i], rect);
        }
    };

    // --- METİNLERİN KONUMUNU BELİRLEYEN KISIM ---
    Window_VNChoice.prototype.itemRect = function (index) {
        let areaIndex = 0;

        if (this.maxItems() === 3) {
            // 3 Seçenek: 
            areaIndex = index;
        } else {
            // 2 Seçenek:
            areaIndex = index + 1;
        }

        const area = VN_CHOICE_CONFIG.CHOICE_AREAS[areaIndex];
        return new Rectangle(
            area.x + VN_CHOICE_CONFIG.TEXT.PADDING_LEFT,
            area.y + VN_CHOICE_CONFIG.TEXT.PADDING_TOP,
            area.width - VN_CHOICE_CONFIG.TEXT.PADDING_LEFT * 2,
            area.height - VN_CHOICE_CONFIG.TEXT.PADDING_TOP * 2
        );
    };

    Window_VNChoice.prototype.drawChoiceText = function (text, rect) {
        const cfg = VN_CHOICE_CONFIG.TEXT;
        this.contents.fontSize = cfg.FONT_SIZE;
        this.contents.textColor = cfg.FONT_COLOR;

        if (cfg.BOLD_WIDTH > 0) {
            this.contents.outlineColor = cfg.FONT_COLOR;
            this.contents.outlineWidth = cfg.BOLD_WIDTH;
        } else {
            this.contents.outlineWidth = 0;
        }

        this.drawText(text, rect.x, rect.y, rect.width, 'left');
    };

    // --- TUŞ DÜZELTMESİ (YUKARI/AŞAĞI) ---
    Window_VNChoice.prototype.processCursorMove = function () {
        if (this.isCursorMovable()) {
            const lastIndex = this.index();
            const max = this.maxItems();

            // AŞAĞI TUŞU: Index ARTIRMALI (0 -> 1 -> 2)
            if (Input.isRepeated('down') || Input.isRepeated('right')) {
                this.select((this.index() + 1) % max);
            }

            // YUKARI TUŞU: Index AZALTMALI (2 -> 1 -> 0)
            if (Input.isRepeated('up') || Input.isRepeated('left')) {
                this.select((this.index() - 1 + max) % max);
            }

            if (this.index() !== lastIndex) {
                SoundManager.playCursor();
                this.updateBarGraphics(this.index());
            }
        }
    };

    // --- GÖRSEL PARLATMA DÜZELTMESİ ---
    Window_VNChoice.prototype.updateBarGraphics = function (hoverIndex) {
        if (!this._barSprite1 || !this._barSprite2 || !this._barSprite3) return;

        const isThree = (this.maxItems() === 3);
        let activeSpriteForIndex = null;

        if (isThree) {
            // 3 Seçenekliyken sıralama (DOKUNULMADI):
            if (hoverIndex === 0) activeSpriteForIndex = this._barSprite3;
            if (hoverIndex === 2) activeSpriteForIndex = this._barSprite1;
            if (hoverIndex === 1) activeSpriteForIndex = this._barSprite2;
        } else {
            // 2 Seçenekliyken sıralama (TAM TERSİ YAPILDI):
            // Eskisi: 0 -> Sprite1, 1 -> Sprite2 idi.
            // Yenisi: 0 -> Sprite2, 1 -> Sprite1 oldu.

            if (hoverIndex === 0) activeSpriteForIndex = this._barSprite2;
            if (hoverIndex === 1) activeSpriteForIndex = this._barSprite1;
        }

        // Önce hepsini söndür (Normal resim)
        this._barSprite1.bitmap = this._barSprite1._normalBitmap;
        this._barSprite2.bitmap = this._barSprite2._normalBitmap;
        this._barSprite3.bitmap = this._barSprite3._normalBitmap;

        // Seçili olanı yak (On resim)
        if (activeSpriteForIndex) {
            activeSpriteForIndex.bitmap = activeSpriteForIndex._hoverBitmap;
        }
    };

})();