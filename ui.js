function initializeWidgets() {
    var widgets = {}
    function blinkOn() {
        $(".offline").addClass("blink")
        setTimeout(blinkOff, 2000)
    }
    function blinkOff() {
        $(".offline").removeClass("blink")
        setTimeout(blinkOn, 1000)
    }
    blinkOn()
    $(".slider").each(function(index) {
        widgets[this.id] = new Slider(this)
    })
    $(".tabbed").each(function(index) {
        widgets[this.id] = new Tabbed(this)
    })
    $(".bargraph").each(function(index) {
        widgets[this.id] = new BarGraph(this)
    })
    $(".spinbox").each(function(index) {
        widgets[this.id] = new SpinBox(this)
    })
    $(".grid").each(function(index) {
        widgets[this.id] = new Grid(this)
    })
    return widgets
}

function partial( fn /*, args...*/) {
    var aps = Array.prototype.slice
    var args = aps.call( arguments, 1 )

    return function() {
        return fn.apply(this, args.concat(aps.call( arguments )))
    }
}
function parseFloatPrecision(text) {
    decimal = text.indexOf(".")
    var precision = 0
    if(decimal > -1) {
        precision = text.length - decimal - 1
    }
    num = parseFloat(text)
    return {"value":num, "precision":precision}
}

function roundDecimal(num, precision) {
    return parseFloat(num.toFixed(precision))
}

function Tabbed(element) {
    var self = this
    self.elementRoot = element
    self.tabs = $(self.elementRoot).find("> ol > li > a").get()
    self.pages = $(self.elementRoot).find("> section").get()
    self.changetab = function(index) {
        $(self.tabs).each(function (index) {
            $(this).removeClass("active")
        })
        $(self.pages).each(function (index) {
            $(this).removeClass("active")
        })
        $(self.tabs[index]).addClass("active")
        $(self.pages[index]).addClass("active")
    }
    $(self.tabs).each(function (index) {
        $(this).click(partial(self.changetab, index))
    })
    self.changetab(0)
}

function Slider(element) {
    var self = this
    self.elementRoot = element
    self.elementHandle = $(element).find(".handle")[0]
    self.elementLabel = $(element).find(".label")[0]
    var stepinfo = parseFloatPrecision($(element).attr("data-step"))
    self.step = stepinfo["value"]
    self._precision = stepinfo["precision"]
    self.max = $(self.elementRoot).attr("data-max")
    self.min = $(self.elementRoot).attr("data-min")
    self.displayScale = 1
    self.displayPrecision = self._precision
    if($(element).attr("data-display-scale")) {
        self.displayScale = parseFloat($(element).attr("data-display-scale"))
        self.displayPrecision = parseFloatPrecision($(element).attr("data-display-scale"))["precision"]
    }
    self._value = self.min
    self.onchange = function(newvalue) {return newvalue}
    self._sliderValueToPos = function (value) {
        var availableHeight = $(self.elementRoot).height() - $(self.elementHandle).height()
        return availableHeight - (((value - self.min) / self.max) * availableHeight)
    }
    self._sliderPosToValue = function (pos) {
        var availableHeight = $(self.elementRoot).height() - $(self.elementHandle).height()
        var range = self.max - self.min
        var val = self.max - ((pos / availableHeight) * range)
        return roundDecimal(val, self._precision)
    }
    self.value = function() {
        return self._value
    }
    self.setValue = function(value) {
        self._value = value
        $(self.elementHandle).css("margin-top", self._sliderValueToPos(self._value)+"px")
        $(self.elementLabel).html((self._value * self.displayScale).toFixed(self.displayPrecision))
    }
    self.mousedown = function(event) {
        event.preventDefault()
        $('body').mousemove(self.mousemove)
        $('body').mouseup(function(event) {
            $('body').unbind("mousemove", self.mousemove)
        })
    }
    self.mousemove = function(event) {
        event.preventDefault();
        var start_y = $(self.elementRoot).offset().top
        var slider_y = $(self.elementHandle).css("margin-top")
        slider_y = slider_y.substr(0, top.length-2)
        var newslider_y = slider_y + event.pageY-start_y
        if (newslider_y > $(self.elementRoot).height() - $(self.elementHandle).height()) {
            newslider_y = $(self.elementRoot).height() - $(self.elementHandle).height()
        }
        if (newslider_y < 0) {
            newslider_y = 0
        }
        var newvalue = self._sliderPosToValue(newslider_y)
        newvalue = self.onchange(newvalue)
        self.setValue(newvalue)
        
    }
    $(self.elementRoot).mousedown(self.mousedown)
    self.setValue(parseFloat($(self.elementRoot).attr("data-value")))
}

function BarGraph(element) {
    var self = this
    self.elementRoot = element
    self.elementBar = $(element).find(".bar")[0]
    self.elementLabel = $(element).find(".label")[0]
    var stepinfo = parseFloatPrecision($(element).attr("data-step"))
    self._precision = stepinfo["precision"]
    self._value = 0
    self._valueToPos = function (value) {
        return $(self.elementRoot).height() - (value * $(self.elementRoot).height() / $(self.elementRoot).attr("data-max"))
    }
    self.value = function() {
        return self._value
    }
    self.setValue = function(value) {
        self._value = value
        $(self.elementBar).css("top", self._valueToPos(self._value)+"px")
        self.elementLabel.innerHTML = self._value.toFixed(self._precision)
        if(self._valueToPos(self._value) < $(self.elementRoot).height()/2) {
            $(self.elementLabel).addClass("inverse")
        } else {
            $(self.elementLabel).removeClass("inverse")
        }
    }
    self.setValue(parseFloat($(self.elementRoot).attr("data-value")))
}

function SpinBox(element) {
    var self = this
    self.elementRoot = element
    self.elementPlus = $(element).find(".plus")[0]
    self.elementMinus = $(element).find(".minus")[0]
    self.elementLabel = $(element).find(".label")[0]
    var stepinfo = parseFloatPrecision($(element).attr("data-step"))
    self.step = stepinfo["value"]
    self._precision = stepinfo["precision"]
    self.max = parseFloat($(element).attr("data-max"))
    self.min = parseFloat($(element).attr("data-min"))
    self.displayScale = 1
    if($(element).attr("data-display-scale")) {
        self.displayScale = parseFloat($(element).attr("data-display-scale"))
        self._precision = parseFloatPrecision($(element).attr("data-display-scale"))["precision"]
    }
    self.onchange = function(newvalue) {return newvalue}
    self._value = self.min
    self.value = function() {
        return self._value
    }
    self.setValue = function(value) {
        self._value = roundDecimal(value, self._precision)
        $(self.elementLabel).html((self._value * self.displayScale).toFixed(self._precision))
    }
    self.increment = function(event) {
        event.preventDefault()
        newvalue = Math.min(self.value()+self.step, self.max)
        self.setValue(self.onchange(newvalue))
    }
    self.decrement = function(event) {
        event.preventDefault()
        newvalue = Math.max(self.value()-self.step, self.min)
        self.setValue(self.onchange(newvalue))
    }
    $(self.elementPlus).click(self.increment)
    $(self.elementMinus).click(self.decrement)
    self.setValue(parseFloat($(self.elementRoot).attr("data-value")))
}

function Grid(element) {
    var self = this
    self.elementRoot = element
    self.cells = new Array()
    var x=0, y=-1
    $(element).find("tr").each(function(i) {
        x = 0
        $(this).find(".cell").each(function(j) {
            if(x == 0) {
                y += 1
                self.cells[y] = new Array()
            }
            self.cells[y][x] = this
            x += 1
        })
    })
    self.cellHtml = function(x, y, text) {
        self.cells[y][x].innerHTML = text
    }
}