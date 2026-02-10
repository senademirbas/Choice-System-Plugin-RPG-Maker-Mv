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