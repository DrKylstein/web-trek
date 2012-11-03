function initializeWidgets() {
    function blinkOn() {
        $(".offline").addClass("blink")
        setTimeout(blinkOff, 2000)
    }
    function blinkOff() {
        $(".offline").removeClass("blink")
        setTimeout(blinkOn, 1000)
    }
    blinkOn()
    var widgets = {};
    $('.slider').each(function(index) {
        widgets[this.id] = new Slider(this);
    });
    $('.tabbed').each(function(index) {
        widgets[this.id] = new Tabbed(this);
    });
    $('.bargraph').each(function(index) {
        widgets[this.id] = new BarGraph(this);
    });
    $('.spinbox').each(function(index) {
        widgets[this.id] = new SpinBox(this);
    });
    $('.grid').each(function(index) {
        widgets[this.id] = new Grid(this);
    });
    $('.message-box').each(function(index) {
        widgets[this.id] = new MessageBox(this);
    });
    $('.button').each(function(index) {
        widgets[this.id] = new Button(this);
    });
    return widgets;
}

function defineWatchableProperty(self, name, getter, setter) { // (self, publicName, internalName)
    //callback for notifying of changes
    self[name+'Changed'] = function defaultOnChange(value) {};
    //function to set value without triggering notifications
    //~ self['set_'+name] = function silentSet(value) {
        //~ setter.apply(self, arguments);
    //~ }
    //setting the normal way triggers a notification
    self.__defineSetter__(name, function setAndNotify(value) {
        setter.apply(self, arguments);
        self[name+'Changed'](value);
    })
    //getting as usual
    self.__defineGetter__(name, getter);
}

function defineWatchableValue(self, name, field) {
    var setter = function valueSetter(newvalue) {
        self[field] = newvalue;
    };
    var getter = function valueGetter() {
        return self[field];
    };
    defineWatchableProperty(self, name, getter, setter);
}


function Widget(element) {
    var self = this;
    self.elementRoot = element;
    self._disabled = false;
    self.__defineSetter__('disabled', function setDisabled(state) {
        self._disabled = state;
        if(state) {
            $(self._elementRoot).addClass('disabled');
        } else {
            $(self._elementRoot).removeClass('disabled');
        }
    });
    self.__defineGetter__('disabled', function getDisabled() {
       return self._disabled; 
    });
}

function Tabbed(element) {
    var self = this;
    Widget.call(this, element);
    self.tabs = $(self.elementRoot).find('> ol > li > a').get();
    self.pages = $(self.elementRoot).find('> section').get();
    self.changetab = function(index) {
        $(self.tabs).each(function (index) {
            $(this).removeClass('active');
        })
        $(self.pages).each(function (index) {
            $(this).removeClass('active');
        })
        $(self.tabs[index]).addClass('active');
        $(self.pages[index]).addClass('active');
    };
    $(self.tabs).each(function (index) {
        $(this).click(partial(self.changetab, index));
    });
    self.changetab(0);
}

function Slider(element) {
    var self = this;
    Widget.call(this, element);
    self.elementHandle = $(element).find('.handle')[0];
    self.elementLabel = $(element).find('.label')[0];
    var stepinfo = parseFloatPrecision($(element).attr('data-step'));
    self.step = stepinfo['value'];
    self._precision = stepinfo['precision'];
    self.max = parseFloat($(self.elementRoot).attr('data-max'));
    self.min = parseFloat($(self.elementRoot).attr('data-min'));
    self.isHorizontal = $(self.elementRoot).hasClass('horizontal');
    self.displayScale = 1;
    self.displayPrecision = self._precision;
    if($(element).attr('data-display-scale')) {
        self.displayScale = parseFloat($(element).attr('data-display-scale'));
        self.displayPrecision = parseFloatPrecision($(element).attr('data-display-scale'))['precision'];
    }
    self._value = self.min;
    self.onchange = function defaultOnChange(newvalue) {
        return newvalue;
    };
    self._sliderValueToPos = function _sliderValueToPos(value) {
        var availableSpace;
        if(self.isHorizontal) {
            availableSpace = $(self.elementRoot).width() - $(self.elementHandle).width();
            return ((value - self.min) / self.max) * availableSpace;
        } else {
            availableSpace = $(self.elementRoot).height() - $(self.elementHandle).height();
            return availableSpace - (((value - self.min) / self.max) * availableSpace);
        }
    };
    self._sliderPosToValue = function _sliderPosToValue(pos) {
        var availableSpace,
            val;
        var range = self.max - self.min;
        if(self.isHorizontal) {
            availableSpace = $(self.elementRoot).width() - $(self.elementHandle).width();
            val = ((pos / availableSpace) * range) + self.min;
        } else {
            availableSpace = $(self.elementRoot).height() - $(self.elementHandle).height();
            val = self.max - ((pos / availableSpace) * range);
        }        
        return roundDecimal(val, self._precision);
    };
    self.value = function() {
        return self._value;
    };
    self.setValue = function setValue(value) {
        self._value = value;
        if(self.isHorizontal) {
            $(self.elementHandle).css('margin-left', self._sliderValueToPos(self._value)+'px');
        } else {
            $(self.elementHandle).css('margin-top', self._sliderValueToPos(self._value)+'px');
        }
        $(self.elementLabel).html((self._value * self.displayScale).toFixed(self.displayPrecision));
    };
    self.mousedown = function(event) {
        event.preventDefault();
        $('body').mousemove(self.mousemove);
        $('body').mouseup(function mouseup(event) {
            $('body').unbind('mousemove', self.mousemove);
        });
    };
    self.mousemove = function mousemove(event) {
        event.preventDefault();
        var baseline,
            currentLine,
            cursorLine,
            availableSpace;
        if(self.isHorizontal) {
            cursorLine = event.pageX;
            baseline = $(self.elementRoot).offset().left;
            availableSpace = $(self.elementRoot).width() - $(self.elementHandle).width();
        } else {
            cursorLine = event.pageY;
            baseline = $(self.elementRoot).offset().top;
            availableSpace = $(self.elementRoot).height() - $(self.elementHandle).height();
        }
        var newLine = cursorLine-baseline;
        if (newLine > availableSpace) {
            newLine = availableSpace;
        }
        if (newLine < 0) {
            newLine = 0;
        }
        var newValue = self._sliderPosToValue(newLine);
        self.setValue(newValue);
        self.onchange(newValue);
    };
    $(self.elementRoot).mousedown(self.mousedown);
    self.setValue(parseFloat($(self.elementRoot).attr('data-value')));
}

function BarGraph(element) {
    var self = this;
    Widget.call(this, element);
    self.elementBar = $(element).find('.bar')[0];
    self.elementLabel = $(element).find('.label')[0];
    var stepinfo = parseFloatPrecision($(element).attr('data-step'));
    self.isHorizontal = $(self.elementRoot).hasClass('horizontal');
    self._precision = stepinfo['precision'];
    self._value = 0;
    self._valueToPos = function (value) {
        var dimension;
        if(self.isHorizontal) {
            dimension = $(self.elementRoot).width();
        } else {
            dimension = $(self.elementRoot).height();
        }
        return dimension - ((value * dimension) / $(self.elementRoot).attr('data-max'));
    };
    self.value = function() {
        return self._value;
    };
    self.setValue = function(value) {
        var dimension;
        self._value = value;
        if(self.isHorizontal) {
            $(self.elementBar).css('right', self._valueToPos(self._value)+'px');
            dimension = $(self.elementRoot).width();
        } else {
            $(self.elementBar).css('top', self._valueToPos(self._value)+'px');
            dimension = $(self.elementRoot).height();
        }
        self.elementLabel.innerHTML = self._value.toFixed(self._precision);
    };
    self.setValue(parseFloat($(self.elementRoot).attr('data-value')));
}

function SpinBox(element) {
    var self = this;
    Widget.call(this, element);
    self.elementPlus = $(element).find('.plus')[0];
    self.elementMinus = $(element).find('.minus')[0];
    self.elementLabel = $(element).find('.label')[0];
    var stepinfo = parseFloatPrecision($(element).attr('data-step'));
    self.step = stepinfo['value'];
    self._precision = stepinfo['precision'];
    self.max = parseFloat($(element).attr('data-max'));
    self.min = parseFloat($(element).attr('data-min'));
    self.displayScale = 1;
    if($(element).attr('data-display-scale')) {
        self.displayScale = parseFloat($(element).attr('data-display-scale'));
        self._precision = parseFloatPrecision($(element).attr('data-display-scale'))['precision'];
    }
    self.onchange = function defaultOnChange(newvalue) {};
    self._value = self.min;
    self.value = function() {
        return self._value;
    };
    self.setValue = function(value) {
        self._value = roundDecimal(value, self._precision);
        $(self.elementLabel).html((self._value * self.displayScale).toFixed(self._precision));
    };
    self.increment = function(event) {
        event.preventDefault();
        newvalue = Math.min(self.value()+self.step, self.max);
        self.setValue(newvalue);
        self.onchange(newvalue);
    };
    self.decrement = function(event) {
        event.preventDefault();
        newvalue = Math.max(self.value()-self.step, self.min);
        self.setValue(newvalue);
        self.onchange(newvalue);
    };
    $(self.elementPlus).click(self.increment);
    $(self.elementMinus).click(self.decrement);
    self.setValue(parseFloat($(self.elementRoot).attr('data-value')));
}

function Grid(element) {
    var self = this;
    Widget.call(this, element);
    self.cells = new Array();
    self._marked;
    self.cellClick = function defaultCellClick(x,y){};
    self._handleCellClick = function _handleCellClick(x,y) {
        self.cellClick(x,y);
    };
    var x=0,
        y=-1;
    $(element).find('tr').each(function(i) {
        x = 0;
        $(this).find('.cell').each(function(j) {
            if(x == 0) {
                y += 1;
                self.cells[y] = new Array();
            }
            self.cells[y][x] = this;
            $(this).click(partial(self._handleCellClick, x, y));
            x += 1;
        });
    });
    self.cellHtml = function(x, y, text) {
        self.cells[y][x].innerHTML = text;
    };
    
    self.clearMark = function clearMark() {
        if(self._marked != undefined) {
            $(self.cells[self._marked[1]][self._marked[0]]).removeClass('marked');
        }
        self._marked = undefined;
    }
    self.markCell = function markCell(x,y) {
        self.clearMark();
        self._marked = [x,y];
        $(self.cells[y][x]).addClass('marked');
    };
    self.getMarked = function getMarked() {
        return self._marked;
    };
}
function MessageBox(element) {
    var self = this;
    Widget.call(this, element);
    self.elementButton = $(self.elementRoot).find('.button')[0];
    self.onConfirm = function(){};
    self.show = function show() {
        $(self.elementRoot).css('display', 'block');
    }
    self.hide = function hide() {
        $(self.elementRoot).css('display', 'none');
    }
    $(self.elementButton).click(function clicked() {
        self.hide();
        self.onConfirm();
    });
    self.hide();
}
function Button(element) {
    var self = this;
    Widget.call(this, element);
    self.onclick = function(){};
    self._disabled = false;
    self.__defineSetter__('disabled', function setDisabled(state) {
        self._disabled = state;
        if(state) {
            $(self.elementRoot).addClass('disabled');
        } else {
            $(self.elementRoot).removeClass('disabled');
        }
    });
    self.__defineGetter__('disabled', function getDisabled() {
       return self._disabled; 
    });
    $(self.elementRoot).click(function elementClicked(event) {
        if(!self.disabled) {
            self.onclick();
        }
    });
}