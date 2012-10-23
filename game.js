var random = {
    "range":function(start, end) {
        if(!end) {
            end = start
            start = 0
        }
        return start + Math.round(Math.random()*(end-start-1))
    },
    "choice":function(array) {
        return array[Math.round(Math.random()*(array.length-1))]
    },
    "shuffle":function(array) {
        array.sort(function(a,b){return Math.random()})
    }
}

function start() {
    var widgets = {}
    function energyLink(system, newvalue) {
        delta = newvalue - widgets[system].value()
        if (widgets["energy"].value() - delta < 0) {
            delta = widgets["energy"].value()
            widgets["energy"].setValue(0)
            return delta + widgets[system].value()
        } else {
            widgets["energy"].setValue(widgets["energy"].value() - delta)
            return newvalue
        }
    }
    function travelCost(x, y, w) {
        return (Math.abs(x) + Math.abs(y)) * (w)
    }
        
    function Galaxy(w, h) {
        this.quadrants = new Array()
        this.klingons = 0
        this.starbases = 0
        this.star = 0
        
        for(var y=0; y<10; ++y) {
            this.quadrants.push(new Array())
            for(var x=0; x<10; ++x) {
                var quadrant = {"klingons":0, "stars":0, "starbases":0}
                var rnd = random.range(100)
                if(rnd > 98) {
                    quadrant["klingons"] = 3
                } else if (rnd > 95) {
                    quadrant["klingons"] = 2
                } else if (rnd > 80) {
                    quadrant["klingons"] = 1
                }
                this.klingons += quadrant["klingons"]
                if(random.range(100) > 96) {
                    quadrant["starbases"] = 1
                }
                this.starbases += quadrant["starbases"]
                quadrant["stars"] = random.range(10)
                this.stars += quadrant["stars"]
                this.quadrants[y].push(quadrant)
            }
        }
        if (this.starbases == 0) {
            var x = random.range(10)
            var y = random.range(10)
            this.quadrants[y][x]["starbases"] = 1
            this.starbases += 1
        }
        this.getQuadrant = function(x, y) {
            var q = new Quadrant(this.quadrants[y][x]["klingons"], this.quadrants[y][x]["starbases"], this.quadrants[y][x]["stars"])
            return q
        }
    }
    
    function Quadrant(k, b, s, grid) {
        this._srs = grid
        this.klingons = new Array()
        this.starbases = new Array()
        this.stars = new Array()
        this.emptySpots = function() {
            var freeCells = new Array()
            for(var x=0;x<10;++x) {
                for(var y=0;y<10;++y) {
                    var occupied = false
                    for(k in self.klingons) {
                        if(k.x == x || k.y == y) {
                            occupied = true
                            break
                        }
                    }
                    if(occupied) {
                        continue
                    }
                    for(b in self.starbases) {
                        if(b.x == x || b.y == y) {
                            occupied = true
                            break
                        }
                    }
                    if(occupied) {
                        continue
                    }
                    for(s in self.stars) {
                        if(s.x == x || s.y == y) {
                            occupied = true
                            break
                        }
                    }
                    if(occupied) {
                        continue
                    }
                    freeCells.push({"x":x,"y":y})
                }
            }
            return freeCells
        }
        var spots = this.emptySpots()
        random.shuffle(spots)
        for(;k>0;--k) {
            var pos = spots.pop()
            this.klingons.push(new Klingon(pos["x"],pos["y"]))
        }
        for(;b>0;--b) {
            var pos = spots.pop()
            this.starbases.push(pos)
        }
        for(;s>0;--s) {
            var pos = spots.pop()
            this.stars.push(pos)
        }
    }
    
    function ScannerDisplay(widget) {
        this._widget = widget
        this._names = new Array(
            "Antares","Sirius",
            "Rigel","Deneb",
            "Procyon","Capella",
            "Vega","Betelgeuse",
            "Canopus","Aldebaran",
            "Altair","Regulus",
            "Sagittarius","Arcturus",
            "Pollux","Spica",
            "Fomalhaut", "Navi"
        )
        this._numerals = new Array("I", "II", "III", "IV", "V")
        this.update = function(player) {
            for(var x=0;x<10;++x) {
                for(var y=0;y<10;++y) {
                    this._widget.cellHtml(x, y, "")
                }
            }
            for(var i in player.quadrant.klingons) {
                this._widget.cellHtml(player.quadrant.klingons[i].x, player.quadrant.klingons[i].y, "&#9760;") // "+K+"
            }
            for(var i in player.quadrant.starbases) {
                this._widget.cellHtml(player.quadrant.starbases[i].x, player.quadrant.starbases[i].y, "&#9737;") // ">!<"
            }
            for(var i in player.quadrant.stars) {
                this._widget.cellHtml(player.quadrant.stars[i].x, player.quadrant.stars[i].y, "&#9733;") //" * "
            }
            var playerPos = player.sectorPos()
            this._widget.cellHtml(playerPos.x, playerPos.y, "&#9679;") //"<*>"
            $("#quadrant-klingons").html(player.quadrant.klingons.length)
            $("#quadrant-bases").html(player.quadrant.starbases.length)
            $("#quadrant-stars").html(player.quadrant.stars.length)
            function _summarize(x, y) {
                var q = player.galaxy.quadrants[y][x]
                //return "&#9760;" + q.klingons + " &#9737;" + q.starbases + " &#9733;" + q.stars
                return q.klingons + "" + q.starbases + "" + q.stars
            }
            
            if(player.quadrantPos().x > 0) {
                $("#summary-west").html(_summarize(player.quadrantPos().y, player.quadrantPos().x-1))
            } else {
                $("#summary-west").html("---")
            }
            if(player.quadrantPos().x < 9) {
                $("#summary-east").html(_summarize(player.quadrantPos().y, player.quadrantPos().x+1))
            } else {
                $("#summary-east").html("---")
            }
            
            if(player.quadrantPos().y < 9) {
                $("#summary-south").html(_summarize(player.quadrantPos().y+1, player.quadrantPos().x))
                if(player.quadrantPos().x > 0) {
                    $("#summary-southwest").html(_summarize(player.quadrantPos().y+1, player.quadrantPos().x-1))
                } else {
                    $("#summary-southwest").html("---")
                }
                if(player.quadrantPos().x < 9) {
                    $("#summary-southeast").html(_summarize(player.quadrantPos().y+1, player.quadrantPos().x+1))
                } else {
                    $("#summary-southeast").html("---")
                }
            } else {
                $("#summary-south").html("---")
                $("#summary-southeast").html("---")
                $("#summary-southwest").html("---")
            }
            
            if(player.quadrantPos().y > 0) {
                $("#summary-north").html(_summarize(player.quadrantPos().y-1, player.quadrantPos().x))
                if(player.quadrantPos().x > 0) {
                    $("#summary-northwest").html(_summarize(player.quadrantPos().y-1, player.quadrantPos().x-1))
                } else {
                    $("#summary-northwest").html("---")
                }
                if(player.quadrantPos().x < 9) {
                    $("#summary-northeast").html(_summarize(player.quadrantPos().y-1, player.quadrantPos().x+1))
                } else {
                    $("#summary-northeast").html("---")
                }
            } else {
                $("#summary-north").html("---")
                $("#summary-northeast").html("---")
                $("#summary-northwest").html("---")
            }
            var nameIndex = player.quadrantPos().x + player.quadrantPos().y*10
            $("#quadrant-name").html(this._names[Math.floor(nameIndex/5)]+ " " + this._numerals[nameIndex%5])
        }
    }
    
    function Starchart(widget) {
        this._widget = widget
        this._chart = new Array()
        
        for(var y=0;y<10;++y) {
            this._chart.push(new Array())
            for(var x=0;x<10;++x) {
                this._chart[y].push({"klingons":undefined, "starbases":undefined, "stars":undefined})
            }
        }
        this._updateChart = function (x, y, galaxy) {
            this._chart[y][x].klingons = galaxy.quadrants[y][x].klingons
            this._chart[y][x].starbases = galaxy.quadrants[y][x].starbases
            this._chart[y][x].stars = galaxy.quadrants[y][x].stars
        }
        this._summarize = function(x, y) {
            var q = this._chart[y][x]
            var klingons = q.klingons
            var starbases = q.starbases
            var stars = q.stars
            if(klingons == undefined) {
                klingons = "?"
            }
            if(starbases == undefined) {
                starbases = "?"
            }
            if(stars == undefined) {
                stars = "?"
            }
            return klingons + "" + starbases + "" + stars
        }

        this.update = function(player) {
            this._updateChart(player.quadrantPos().x, player.quadrantPos().y, player.galaxy)
            if(player.quadrantPos().y > 0) {
                this._updateChart(player.quadrantPos().x, player.quadrantPos().y-1, player.galaxy)
            }
            if(player.quadrantPos().y < 9) {
                this._updateChart(player.quadrantPos().x, player.quadrantPos().y+1, player.galaxy)
            }
            if(player.quadrantPos().x > 0) {
                this._updateChart(player.quadrantPos().x-1, player.quadrantPos().y, player.galaxy)
                if(player.quadrantPos().y > 0) {
                    this._updateChart(player.quadrantPos().x-1, player.quadrantPos().y-1, player.galaxy)
                }
                if(player.quadrantPos().y < 9) {
                    this._updateChart(player.quadrantPos().x-1, player.quadrantPos().y+1, player.galaxy)
                }
            }
            if(player.quadrantPos().x < 9) {
                this._updateChart(player.quadrantPos().x+1, player.quadrantPos().y, player.galaxy)
                if(player.quadrantPos().y > 0) {
                    this._updateChart(player.quadrantPos().x+1, player.quadrantPos().y-1, player.galaxy)
                }
                if(player.quadrantPos().y < 9) {
                    this._updateChart(player.quadrantPos().x+1, player.quadrantPos().y+1, player.galaxy)
                }
            }
            
            for(var x=0;x<10;++x) {
                for(var y=0;y<10;++y) {
                    this._widget.cellHtml(x, y, this._summarize(x,y))
                }
            }
            $("#total-klingons").html(player.galaxy.klingons)
            $("#total-bases").html(player.galaxy.starbases)
            $("#total-stars").html(player.galaxy.starbases)
        }
    }
    
    function Klingon(x,y) {
        this.x = x
        this.y = y
        this.shields = 100+random.range(200)
    }
    function PlayerShip(x,y) {
        this.x = x
        this.y = y
        this.quadrant = undefined
        this.toQuadrantPos = function(x, y) {
            return {"x":Math.floor(x/10), "y":Math.floor(y/10)}
        }
        this.quadrantPos = function() {
            return this.toQuadrantPos(this.x, this.y)
        }
        this.toSectorPos = function(x,y) {
            return {"x":x%10, "y":y%10}
        }
        this.sectorPos = function() {
            return this.toSectorPos(this.x, this.y)
        }
    }

    widgets = initializeWidgets()
    //link energy-using subsystems to main reserve
    widgets["shields"].onchange = partial(energyLink, "shields")
    widgets["phasers"].onchange = function(newvalue) {
        newvalue = energyLink("phasers", newvalue)
        $("#phaser-count").html(newvalue)
        return newvalue
    }
    
        
    widgets["course-x"].onchange = function(newvalue) {
        if(enterprise.x+newvalue > 99) {
            newvalue = 99 - enterprise.x
        }            
        if(enterprise.x+newvalue < 0) {
            newvalue = -1*enterprise.x
        }            
        var prevCost = travelCost(
            widgets["course-x"].value(), 
            widgets["course-y"].value(), 
            widgets["engines"].value()
        )
        var delta = travelCost(
                newvalue, 
                widgets["course-y"].value(), 
                widgets["engines"].value()
            ) - prevCost
        if(widgets["energy"].value() - delta < 0) {
            delta = widgets["energy"].value()
            var w = widgets["engines"].value()
            var x = Math.abs(widgets["course-x"].value())
            var y = Math.abs(widgets["course-y"].value())
            newCost = prevCost+delta
            var nx = (newCost / w) - y
            newvalue = nx * (newvalue/Math.abs(newvalue))
        }
        widgets["energy"].setValue(widgets["energy"].value() - delta)
        return newvalue
    }
    widgets["course-y"].onchange = function(newvalue) {
        if(enterprise.y+newvalue > 99) {
            newvalue = 99 - enterprise.y
        }            
        if(enterprise.y+newvalue < 0) {
            newvalue = -1*enterprise.y
        }            
        var prevCost = travelCost(
            widgets["course-x"].value(), 
            widgets["course-y"].value(), 
            widgets["engines"].value()
        )
        var delta = (
                    travelCost(
                        widgets["course-x"].value(), 
                        newvalue, 
                        widgets["engines"].value()
                    ) - prevCost
                )
        if(widgets["energy"].value() - delta < 0){
            delta = widgets["energy"].value()
            var w = widgets["engines"].value()
            var x = Math.abs(widgets["course-x"].value())
            var y = Math.abs(widgets["course-y"].value())
            newCost = prevCost+delta
            var ny = (newCost / w) - x
            newvalue = ny*(newvalue/Math.abs(newvalue))
        }
        widgets["energy"].setValue(widgets["energy"].value() - delta)
        return newvalue
    }
    widgets["engines"].onchange = function(newvalue) {
        var prevCost = travelCost(
            widgets["course-x"].value(), 
            widgets["course-y"].value(), 
            widgets["engines"].value()
        )
        var delta = (
                    travelCost(
                        widgets["course-x"].value(), 
                        widgets["course-y"].value(), 
                        newvalue
                    ) - prevCost
                )
        if(widgets["energy"].value() - delta < 0){
            delta = widgets["energy"].value()
            var w = widgets["engines"].value()
            var x = Math.abs(widgets["course-x"].value())
            var y = Math.abs(widgets["course-y"].value())
            newCost = prevCost+delta
            var nw = newCost / (x+y)
            newvalue = nw
        }
        widgets["energy"].setValue(widgets["energy"].value() - delta)
        return newvalue
    }
        
        
    var scanner = new ScannerDisplay(widgets["srs"])
    var chart = new Starchart(widgets["starchart"])
    var time = 1440
    
    var galaxy = new Galaxy()
    
    var enterprise = new PlayerShip(random.range(0,100),random.range(0,100))
    enterprise.quadrant = galaxy.getQuadrant(enterprise.quadrantPos().x, enterprise.quadrantPos().y)
    enterprise.galaxy = galaxy
    $("#position").html("("+ enterprise.quadrantPos().x + "," + enterprise.quadrantPos().y + ")")
    
    function updateDisplays() {
        scanner.update(enterprise)
        chart.update(enterprise)
        $("#mission-klingons").html(galaxy.klingons)
        $("#time").html(time)
    }
        
    $("#engage").click(function() {
        var newQuadrantPos = enterprise.toQuadrantPos(enterprise.x + widgets["course-x"].value(), enterprise.y + widgets["course-y"].value())        
        if(newQuadrantPos.x != enterprise.quadrantPos().x || newQuadrantPos.y != enterprise.quadrantPos().y) {
            enterprise.quadrant = galaxy.getQuadrant(newQuadrantPos.x, newQuadrantPos.y)
        }
        enterprise.x += widgets["course-x"].value()
        enterprise.y += widgets["course-y"].value()
        elapsed_time = (Math.abs(widgets["course-x"].value()) + Math.abs(widgets["course-y"].value()))/widgets["engines"].value()
        
        time -= Math.max(elapsed_time, 1)
        updateDisplays()
        $("#position").html("("+ newQuadrantPos.x + "," + newQuadrantPos.y + ")")
        widgets["course-x"].setValue(0)
        widgets["course-y"].setValue(0)
    })
    $("#reset-course").click(function() {
        var released = (Math.abs(widgets["course-x"].value(0)) + Math.abs(widgets["course-y"].value(0))) * widgets["engines"].value()
        widgets["energy"].setValue(widgets["energy"].value() + released)
        widgets["course-x"].setValue(0)
        widgets["course-y"].setValue(0)
    })
    updateDisplays()
}
$(document).ready(start)