/*:
 * @plugindesc (MV) Visual Novel Textbox - Advanced Word Wrap, Auto-Preload & Custom Skins.
 * @author SeninAdin
 *
 * @param --- General Settings ---
 * @default
 *
 * @param Textbox Width
 * @desc Total width of the message window.
 * @default 1296
 *
 * @param Textbox Height
 * @desc Total height of the message window.
 * @default 720
 *
 * @param --- Text Area Settings ---
 * @desc Configuration for the text display area.
 * @default
 *
 * @param Text X
 * @desc X coordinate for the text starting position.
 * @default 420
 *
 * @param Text Y
 * @desc Y coordinate for the text starting position.
 * @default 565
 *
 * @param Max Text Width
 * @desc Maximum width allowed for text before wrapping.
 * @default 596
 *
 * @param --- Font Settings ---
 * @default
 *
 * @param Font Size
 * @desc Default font size for message text.
 * @default 21
 *
 * @param Font Color
 * @desc Default font color for message text (Hex format).
 * @default #000000
 *
 * @param --- Performance ---
 * @default
 *
 * @param Preload List
 * @desc Comma-separated list of image filenames to preload.
 * @default CyrusAngry, CyrusHappy, CyrusNeutral, LydiaHappy, Thoughts and Actions
 * @type string
 *
 * @param Preload Delay Frames
 * @desc Delay (in frames) between preloading each image to prevent lag.
 * @default 2
 * @type number
 * @min 0
 * @max 60
 *
 * @param Cache All Textboxes
 * @desc Automatically cache all used textbox skins? (Recommended: true)
 * @default true
 * @type boolean
 *
 * @help
 * ============================================================================
 * VISUAL NOVEL MESSAGING SYSTEM
 * ============================================================================
 * This plugin replaces the standard message window with a highly customizable,
 * performance-optimized Visual Novel style textbox.
 *
 * FEATURES:
 * - Dynamic Skins: Change textboxes on the fly.
 * - Optimized Performance: Smart preloading and caching to eliminate lag.
 * - Custom Word Wrap: Ensures text stays within the defined area.
 * 
 * SETUP:
 * Configure the window dimensions and text area in the parameters.
 * Use the 'Preload List' to define heavy assets that should be loaded at start.
 */

(function () {

    // =============================
    // PARAMETERS
    // =============================
    var parameters = PluginManager.parameters('CustomVNTextbox');

    const TEXTBOX_WIDTH = Number(parameters['Textbox Width'] || 1296);
    const TEXTBOX_HEIGHT = Number(parameters['Textbox Height'] || 720);
    const TEXT_X = Number(parameters['Text X'] || 420);
    const TEXT_Y = Number(parameters['Text Y'] || 565);
    const TEXT_W = Number(parameters['Max Text Width'] || 596);

    const MAX_X_LIMIT = TEXT_X + TEXT_W;
    const MAX_Y_LIMIT = TEXT_Y + 125;

    const FONT_SIZE = Number(parameters['Font Size'] || 21);
    const FONT_COLOR = String(parameters['Font Color'] || '#000000');

    // Performance Parameters
    const PRELOAD_RAW = String(parameters['Preload List'] || "");
    const PRELOAD_LIST = PRELOAD_RAW.split(',').map(function (item) {
        return item.trim();
    }).filter(function (item) {
        return item.length > 0;
    });

    const PRELOAD_DELAY = Number(parameters['Preload Delay Frames'] || 2);
    const CACHE_ALL = String(parameters['Cache All Textboxes']) === 'true';

    const FAUX_BOLD_WIDTH = 1.0;
    let currentTextboxSkin = "";

    // Performance Management
    const loadedTextboxes = new Set();
    const pendingPreloads = [];

    // =============================
    // OPTIMIZED PRELOAD SYSTEM
    // =============================

    // Smart preloading with frame delay to prevent freezing
    const optimizedPreload = function () {
        if (PRELOAD_LIST.length === 0) return;

        let index = 0;
        const preloadNext = function () {
            if (index >= PRELOAD_LIST.length) return;

            const skinName = PRELOAD_LIST[index];
            if (skinName && !loadedTextboxes.has(skinName)) {
                ImageManager.loadPicture(skinName);
                loadedTextboxes.add(skinName);
                console.log(`[VNTextbox] Preloaded: ${skinName}`);
            }

            index++;
            if (index < PRELOAD_LIST.length) {
                if (PRELOAD_DELAY > 0) {
                    setTimeout(preloadNext, PRELOAD_DELAY * (1000 / 60));
                } else {
                    preloadNext();
                }
            }
        };

        // Start preloading on next frame
        setTimeout(preloadNext, 0);
    };

    // Initialize preloading when game starts
    const _Scene_Boot_start = Scene_Boot.prototype.start;
    Scene_Boot.prototype.start = function () {
        _Scene_Boot_start.call(this);
        optimizedPreload();
    };

    // =============================
    // DYNAMIC CACHE MANAGEMENT
    // =============================

    const loadAndCacheTextbox = function (skinName) {
        if (!skinName || skinName.toLowerCase() === 'none') return;

        // If already loaded, use cached version
        if (loadedTextboxes.has(skinName)) {
            return ImageManager.loadPicture(skinName);
        }

        // Load and cache for future use
        const bitmap = ImageManager.loadPicture(skinName);
        loadedTextboxes.add(skinName);

        if (CACHE_ALL) {
            console.log(`[VNTextbox] Cached: ${skinName}`);
        }

        return bitmap;
    };

    // =============================
    // PLUGIN COMMAND
    // =============================

    const _Game_Interpreter_pluginCommand = Game_Interpreter.prototype.pluginCommand;
    Game_Interpreter.prototype.pluginCommand = function (command, args) {
        _Game_Interpreter_pluginCommand.call(this, command, args);

        if (command === 'SetTextbox') {
            const skinName = args.join(' ');
            currentTextboxSkin = skinName;

            // Preload the skin if not already cached
            if (skinName && skinName.toLowerCase() !== 'none') {
                loadAndCacheTextbox(skinName);
            }
        }
    };

    // =============================
    // WINDOW MANAGEMENT WITH OPTIMIZATION
    // =============================

    Window_Message.prototype.windowWidth = function () { return TEXTBOX_WIDTH; };
    Window_Message.prototype.windowHeight = function () { return TEXTBOX_HEIGHT; };

    const _Window_Message_initialize = Window_Message.prototype.initialize;
    Window_Message.prototype.initialize = function () {
        _Window_Message_initialize.call(this);
        this.createVNBackground();
        this.opacity = 0;
        this.backOpacity = 0;
        this.padding = 0;

        // Ensure background is set to transparent
        this._background = 2;
        this.setBackgroundType(2);
    };

    const _Window_Message_update = Window_Message.prototype.update;
    Window_Message.prototype.update = function () {
        _Window_Message_update.call(this);

        // Keep window transparent
        this.opacity = 0;
        this.backOpacity = 0;

        // Hide default window elements
        if (this._windowFrameSprite) this._windowFrameSprite.visible = false;
        if (this._windowBackSprite) this._windowBackSprite.visible = false;
        if (this._windowCursorSprite) this._windowCursorSprite.visible = false;
    };

    Window_Message.prototype.standardPadding = function () { return 0; };
    Window_Message.prototype.textPadding = function () { return 0; };

    Window_Message.prototype.createVNBackground = function () {
        if (this._vnBackgroundSprite) return;
        this._vnBackgroundSprite = new Sprite();
        this.addChildAt(this._vnBackgroundSprite, 0);
        this._vnBackgroundSprite.visible = false;
    };

    Window_Message.prototype.refreshVNSkin = function () {
        if (!this._vnBackgroundSprite) return;

        if (currentTextboxSkin && currentTextboxSkin.toLowerCase() !== 'none') {
            // Use cached version if available
            const bitmap = loadAndCacheTextbox(currentTextboxSkin);
            this._vnBackgroundSprite.bitmap = bitmap;
            this._vnBackgroundSprite.visible = !!bitmap;

            // Ensure proper positioning and scaling
            if (bitmap) {
                this._vnBackgroundSprite.x = 0;
                this._vnBackgroundSprite.y = 0;
                this._vnBackgroundSprite.scale.x = TEXTBOX_WIDTH / bitmap.width;
                this._vnBackgroundSprite.scale.y = TEXTBOX_HEIGHT / bitmap.height;
            }
        } else {
            this._vnBackgroundSprite.visible = false;
        }
    };

    // Update skin when window opens
    const _Window_Message_open = Window_Message.prototype.open;
    Window_Message.prototype.open = function () {
        _Window_Message_open.call(this);
        this.refreshVNSkin();
    };

    // =============================
    // TEXT POSITIONING
    // =============================

    Window_Message.prototype.newLineX = function () { return TEXT_X; };

    const _Window_Message_newPage = Window_Message.prototype.newPage;
    Window_Message.prototype.newPage = function (textState) {
        _Window_Message_newPage.call(this, textState);
        textState.x = TEXT_X;
        textState.y = TEXT_Y;
        textState._lastWordEndIndex = -1;
        this.resetFontSettings();
    };

    // =============================
    // OPTIMIZED WORD WRAP
    // =============================

    // (Your existing word wrap code remains the same)
    const _Window_Message_processNormalCharacter = Window_Message.prototype.processNormalCharacter;
    Window_Message.prototype.processNormalCharacter = function (textState) {
        const c = textState.text[textState.index];

        if (c === ' ' || c === '\n' || c === '\f' || c === '\x1b') {
            textState._lastWordEndIndex = -1;
            _Window_Message_processNormalCharacter.call(this, textState);
            return;
        }

        if (!textState._lastWordEndIndex || textState.index > textState._lastWordEndIndex) {
            let width = 0;
            let i = textState.index;

            while (i < textState.text.length) {
                const char = textState.text[i];
                if (char === ' ' || char === '\n' || char === '\f' || char === '\x1b') break;

                let charW = this.textWidth(char);
                if (this.contents.fontBold) charW += FAUX_BOLD_WIDTH;
                width += charW;
                i++;
            }

            textState._lastWordEndIndex = i;
            width += 5;

            if (textState.x + width > MAX_X_LIMIT) {
                if (textState.x > TEXT_X + 20) {
                    this.processNewLine(textState);
                    textState.index--;
                    textState.x = TEXT_X;
                }
            }
        }
        _Window_Message_processNormalCharacter.call(this, textState);
    };

    // =============================
    // FONT SETTINGS
    // =============================

    Window_Message.prototype.standardFontSize = function () {
        return FONT_SIZE;
    };

    const _Window_Message_resetFontSettings = Window_Message.prototype.resetFontSettings;
    Window_Message.prototype.resetFontSettings = function () {
        _Window_Message_resetFontSettings.call(this);
        this.contents.textColor = FONT_COLOR;
        this.contents.fontSize = FONT_SIZE;
        this.contents.outlineWidth = 0;
        this.contents.outlineColor = FONT_COLOR;
        this.contents.fontBold = false;
        this.contents.fontItalic = false;
    };

    const _Window_Message_processEscapeCharacter = Window_Message.prototype.processEscapeCharacter;
    Window_Message.prototype.processEscapeCharacter = function (code, textState) {
        switch (code) {
            case 'B':
                this.contents.fontBold = !this.contents.fontBold;
                this.contents.outlineWidth = this.contents.fontBold ? FAUX_BOLD_WIDTH : 0;
                this.contents.outlineColor = FONT_COLOR;
                break;
            case 'S':
                this.contents.fontItalic = !this.contents.fontItalic;
                break;
            case 'R':
                this.contents.fontBold = false;
                this.contents.fontItalic = false;
                this.contents.outlineWidth = 0;
                break;
            default:
                _Window_Message_processEscapeCharacter.call(this, code, textState);
                break;
        }
    };

})();