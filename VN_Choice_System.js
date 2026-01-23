/*:
 * @plugindesc VN Seçim Sistemi - Final Gold Version (Bold Added)
 * @author SeninAdin
 * * @help
 * ============================================================================
 * KULLANIM:
 * ============================================================================
 * Plugin Command: ShowVNChoices choice1text|choice2text
 * * Örnek:
 * ShowVNChoices Onunla konuş|Geri çekil
 */

(function() {
    'use strict';

    // ============================= 
    // AYARLAR
    // ============================= 
    const VN_CHOICE_CONFIG = {
        CHOICE_AREAS: [
            // ÜST BAR (Güncellendi: y: 425)
            { x: 770, y: 425, width: 850, height: 35 },
            // ALT BAR (Güncellendi: y: 479)
            { x: 770, y: 479, width: 850, height: 40 }
        ],
        
        PICTURES: {
            BAR_1: 'Selection Bar',        
            BAR_1_ON: 'Selection Bar On',  
            BAR_2: 'Selection Bar 2',      
            BAR_2_ON: 'Selection Bar 2 On',
            BAR_3: 'Selection Bar 3',      
            BAR_3_ON: 'Selection Bar 3 On'
        },
        
        TEXT: {
            FONT_SIZE: 21,         
            FONT_COLOR: '#000000', 
            
            // --- YENİ EKLENEN BOLD AYARI ---
            BOLD_WIDTH: 1.0,       // Diğer plugininizdeki FAUX_BOLD_WIDTH değeri
            
            ALIGN: 'left',
            PADDING_LEFT: 15,      
            PADDING_TOP: 3,        
            LINE_HEIGHT: 30        
        },
        
        RESULT_VARIABLE_ID: 1
    };

    let vnChoiceTexts = ["", ""];

    // ============================= 
    // PLUGIN COMMAND
    // ============================= 
    const _Game_Interpreter_pluginCommand = Game_Interpreter.prototype.pluginCommand;
    Game_Interpreter.prototype.pluginCommand = function(command, args) {
        _Game_Interpreter_pluginCommand.call(this, command, args);
        
        if (command === 'ShowVNChoices') {
            const choiceText = args.join(' ');
            const choices = choiceText.split('|');
            
            if (choices.length >= 2) {
                vnChoiceTexts = [choices[0].trim(), choices[1].trim()];
                
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
    Game_Interpreter.prototype.updateWaitMode = function() {
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
    Scene_Map.prototype.createAllWindows = function() {
        _Scene_Map_createAllWindows.call(this);
        this.createVNChoiceWindow();
    };

    const _Scene_Map_createDisplayObjects = Scene_Map.prototype.createDisplayObjects;
    Scene_Map.prototype.createDisplayObjects = function() {
        _Scene_Map_createDisplayObjects.call(this);
        this.createVNChoiceLayer();
    };

    Scene_Map.prototype.createVNChoiceLayer = function() {
        this._vnChoiceContainer = new Sprite();
        this._vnBarSprite1 = new Sprite();
        this._vnBarSprite2 = new Sprite();
        
        this._vnBarSprite1.visible = false;
        this._vnBarSprite2.visible = false;
        
        this._vnChoiceContainer.addChild(this._vnBarSprite1);
        this._vnChoiceContainer.addChild(this._vnBarSprite2);
        
        const windowLayerIndex = this.getChildIndex(this._windowLayer);
        if (windowLayerIndex > -1) {
            this.addChildAt(this._vnChoiceContainer, windowLayerIndex);
        } else {
            this.addChild(this._vnChoiceContainer);
        }
    };

    Scene_Map.prototype.createVNChoiceWindow = function() {
        this._vnChoiceWindow = new Window_VNChoice();
        this._vnChoiceWindow.setHandler('ok', this.onVNChoiceOk.bind(this));
        this.addWindow(this._vnChoiceWindow);
    };

    Scene_Map.prototype.startVNChoice = function() {
        this.showSelectionBars();
        
        if (this._vnChoiceWindow) {
            this._vnChoiceWindow.setBarSprites(this._vnBarSprite1, this._vnBarSprite2);
            this._vnChoiceWindow.start();
            this._vnChoiceWindow.refresh();
            this._vnChoiceWindow.activate();
            this._vnChoiceWindow.show();
        }
    };

    Scene_Map.prototype.isVNChoiceBusy = function() {
        return this._vnChoiceWindow && this._vnChoiceWindow.visible;
    };

    Scene_Map.prototype.showSelectionBars = function() {
        const cfg = VN_CHOICE_CONFIG;
        if (!this._vnBarSprite1 || !this._vnBarSprite2) return;
        
        // --- ÜST BAR ---
        const bitmap1 = ImageManager.loadPicture(cfg.PICTURES.BAR_1);
        const bitmap1On = ImageManager.loadPicture(cfg.PICTURES.BAR_1_ON);
        
        this._vnBarSprite1.bitmap = bitmap1; 
        this._vnBarSprite1.x = 0; this._vnBarSprite1.y = 0;
        this._vnBarSprite1.visible = true;
        this._vnBarSprite1._normalBitmap = bitmap1;
        this._vnBarSprite1._hoverBitmap = bitmap1On;
        
        // --- ALT BAR ---
        const bitmap2 = ImageManager.loadPicture(cfg.PICTURES.BAR_2);
        const bitmap2On = ImageManager.loadPicture(cfg.PICTURES.BAR_2_ON);
        
        this._vnBarSprite2.bitmap = bitmap2; 
        this._vnBarSprite2.x = 0; this._vnBarSprite2.y = 0;
        this._vnBarSprite2.visible = true;
        this._vnBarSprite2._normalBitmap = bitmap2;
        this._vnBarSprite2._hoverBitmap = bitmap2On;
    };

    Scene_Map.prototype.hideVNChoice = function() {
        if (this._vnBarSprite1) this._vnBarSprite1.visible = false;
        if (this._vnBarSprite2) this._vnBarSprite2.visible = false;
        
        if (this._vnChoiceWindow) {
            this._vnChoiceWindow.deactivate();
            this._vnChoiceWindow.hide();
        }
        Input.clear();
    };

    Scene_Map.prototype.onVNChoiceOk = function() {
        const index = this._vnChoiceWindow.index();
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

    Window_VNChoice.prototype.initialize = function() {
        Window_Selectable.prototype.initialize.call(this, 0, 0, Graphics.width, Graphics.height);
        this.opacity = 0; 
        this.hide();
        this.deactivate();
        this._barSprite1 = null;
        this._barSprite2 = null;
    };

    Window_VNChoice.prototype.updateCursor = function() { };

    Window_VNChoice.prototype.setBarSprites = function(sprite1, sprite2) {
        this._barSprite1 = sprite1;
        this._barSprite2 = sprite2;
    };

    Window_VNChoice.prototype.maxItems = function() { return 2; };

    Window_VNChoice.prototype.start = function() {
        this.refresh();
        this.select(0);
        this.updateBarGraphics(0);
        this.open();
        this.activate();
    };

    Window_VNChoice.prototype.drawAllItems = function() {
        for (let i = 0; i < 2; i++) {
            const rect = this.itemRect(i);
            this.drawChoiceText(vnChoiceTexts[i], rect);
        }
    };

    Window_VNChoice.prototype.itemRect = function(index) {
        const area = VN_CHOICE_CONFIG.CHOICE_AREAS[index];
        return new Rectangle(
            area.x + VN_CHOICE_CONFIG.TEXT.PADDING_LEFT,
            area.y + VN_CHOICE_CONFIG.TEXT.PADDING_TOP,
            area.width - VN_CHOICE_CONFIG.TEXT.PADDING_LEFT * 2,
            area.height - VN_CHOICE_CONFIG.TEXT.PADDING_TOP * 2
        );
    };

    Window_VNChoice.prototype.drawChoiceText = function(text, rect) {
        const cfg = VN_CHOICE_CONFIG.TEXT;
        this.contents.fontSize = cfg.FONT_SIZE;
        this.contents.textColor = cfg.FONT_COLOR;
        
        // --- BOLD EFFECT ---
        // Outline rengini yazı rengiyle aynı yaparak kalınlık efekti veriyoruz.
        if (cfg.BOLD_WIDTH > 0) {
            this.contents.outlineColor = cfg.FONT_COLOR;
            this.contents.outlineWidth = cfg.BOLD_WIDTH;
        } else {
            this.contents.outlineWidth = 0;
        }
        
        this.drawText(text, rect.x, rect.y, rect.width, 'left');
    };

    Window_VNChoice.prototype.processCursorMove = function() {
        if (this.isCursorMovable()) {
            const lastIndex = this.index();
            
            if (Input.isRepeated('down') || Input.isRepeated('right') ||
                Input.isRepeated('up') || Input.isRepeated('left')) {
                
                const nextIndex = (this.index() === 0) ? 1 : 0;
                this.select(nextIndex);
            }
            
            if (this.index() !== lastIndex) {
                SoundManager.playCursor();
                this.updateBarGraphics(this.index());
            }
        }
    };

    Window_VNChoice.prototype.updateBarGraphics = function(hoverIndex) {
        if (!this._barSprite1 || !this._barSprite2) return;
        this._barSprite1.bitmap = (hoverIndex === 0) ? this._barSprite1._hoverBitmap : this._barSprite1._normalBitmap;
        this._barSprite2.bitmap = (hoverIndex === 1) ? this._barSprite2._hoverBitmap : this._barSprite2._normalBitmap;
    };

})();