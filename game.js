function Starship(galaxy) {
    this.category = 'starship'
    this._galaxy = galaxy
    this.quadrant = new Quadrant()
    this._x = 0; defineWatchableValue(this, 'x', '_x');
    this._y = 0; defineWatchableValue(this, 'y', '_y');
    this._qx = 0; defineWatchableValue(this, 'qx', '_qx');
    this._qy = 0; defineWatchableValue(this, 'qy', '_qy');
    this._targetX = 0; defineWatchableValue(this, 'targetX', '_targetX');
    this._targetY = 0; defineWatchableValue(this, 'targetY', '_targetY');
    this._destX = 0; defineWatchableValue(this, 'destX', '_destX');
    this._destY = 0; defineWatchableValue(this, 'destY', '_destY');
    this._qDestX = 0; defineWatchableValue(this, 'qDestX', '_qDestX');
    this._qDestY = 0; defineWatchableValue(this, 'qDestY', '_qDestY');
    this._energy = 3000; defineWatchableValue(this, 'energy', '_energy');
    this._shields = 0;
    this._phasers = 0;
    this._warpFactor = 1;
    this._torpedos = 10; defineWatchableValue(this, 'torpedos', '_torpedos');
    
    this.reset = function reset() {
        this.x = random.range(10);
        this.y = random.range(10);
        this.qx = random.range(10);
        this.qy = random.range(10);
        this.destX = this._x;
        this.destY = this._y;
        this.qDestX = this._qx;
        this.qDestY = this._qy;
        this.shields = 0;
        this.phasers = 0;
        this.warpFactor = 1;
        this.energy = 3000;
        this.torpedos = 10;
        this.quadrant = this._galaxy.getQuadrant(this._qx, this._qy, [this])
    }
    
    this.travelCost = function travelCost(x, y, w) {
        return (Math.abs(x) + Math.abs(y)) * (w)
    }
    
    this._setShields = function _setShields(newvalue){
        var delta = newvalue - this._shields;
        if (this.energy - delta < 0) {
            delta = this.energy;
            this.energy = 0;
            this._shields += delta;
        } else {
            this.energy -= delta;
            this._shields = newvalue;
        }
    };
    this._getShields = function _getShields() {return this._shields};
    defineWatchableProperty(this, 'shields', this._getShields, this._setShields)
    
    this._setPhasers = function _setPhasers(newvalue){
        var delta = newvalue - this._phasers;
        if (this.energy - delta < 0) {
            delta = this.energy;
            this.energy = 0;
            this._phasers += delta;
        } else {
            this.energy -= delta;
            this._phasers = newvalue;
        }
    };
    this._getPhasers = function _getPhasers() {
        return this._phasers;
    };
    defineWatchableProperty(this, 'phasers', this._getPhasers, this._setPhasers);
    
    this._setWarpFactor = function _setWarpFactor(newvalue) {
        var prevCost = this.travelCost(
            this.destX-this.x,
            this.destY-this.y,
            this._warpFactor
        );
        var delta = (
                    this.travelCost(
                        this.destX-this.x,
                        this.destY-this.y,
                        newvalue
                    ) - prevCost
                );
        if(this.energy - delta < 0){
            delta = this.energy;
            var w = this._warpFactor;
            var x = Math.abs(this.destX-this.x);
            var y = Math.abs(this.destY-this.y);
            newCost = prevCost+delta;
            var nw = newCost / (x+y);
            newvalue = nw;
        }
        this.energy -= delta;
        this._warpFactor = newvalue;
    };
    this._getWarpFactor = function _getWarpFactor() {
        return this._phasers;
    };
    defineWatchableProperty(this, 'warpFactor', this._getWarpFactor, this._setWarpFactor);
    
    this.engage = function engage() {
        if(this.qx != this.qDestX || this.qy != this.qDestY) {
            this.quadrant = this._galaxy.getQuadrant(this.qDestX, this.qDestY, [this]);
        }
        this.qx = this.qDestX;
        this.qy = this.qDestY;
        this.x = this.destX;
        this.y = this.destY;
    };
    
    this.launchTorpedo = function launchTorpedo() {
        if(this.torpedos > 0) {
            --this.torpedos;
            var target = this.quadrant.sectorContents(this.targetX, this.targetY)
            if(target != undefined && target != this) {
                if(target.category == 'klingon') {
                    this._galaxy.quadrants[this.qy][this.qx].klingons--;
                    this._galaxy.klingons--;
                    this.quadrant.destroy(target);
                }
                if(target.category == 'starbase') {
                    this._galaxy.quadrants[this.qy][this.qx].starbases--;
                    this._galaxy.starbases--;
                    this.quadrant.destroy(target);
                }
            }
        }
    };
    
    this.firePhasers = function firePhasers() {
        var targets = new Array();
        for(i in this.quadrant.things) {
            if(this.quadrant.things[i].category == 'klingon') {
                targets.push(this.quadrant.things[i])
            }
        }
        var perTarget = this.phasers / targets.length
        this._phasers = 0;
        this.phasersChanged(0);
        for(i in targets) {
            var damage = perTarget / distance(this.x, this.y, targets[i].x, targets[i].y) * (random.normal() + 2);
            if(damage < 0.15 * targets[i].shields) {
                continue; //"Sensors show no damage to enemy..."
            } else {
                targets[i].shields -= damage;
                if(targets[i].shields <= 0) {
                    this._galaxy.quadrants[this.qy][this.qx].klingons--;
                    this._galaxy.klingons--;
                    this.quadrant.destroy(targets[i]);
                }
            }
        }
    }
}

function Galaxy() {
    this.quadrants = new Array();
    this._klingons = 0; defineWatchableValue(this, 'klingons', '_klingons');
    this._starbases = 0; defineWatchableValue(this, 'starbases', '_starbases');
    this._stars = 0; defineWatchableValue(this, 'stars', '_stars');
    for(var y=0; y<10; ++y) {
        this.quadrants.push(new Array());
        for(var x=0; x<10; ++x) {
            var quadrant = {'klingons':0, 'stars':0, 'starbases':0};
            this.quadrants[y].push(quadrant);
        }
    }
    this.generate = function generate() {
        this._klingons = 0;
        this._starbases = 0;
        this._stars = 0;
        for(var y=0; y<10; ++y) {
            for(var x=0; x<10; ++x) {
                var quadrant = {'klingons':0, 'stars':0, 'starbases':0};
                var rnd = random.range(100);
                if(rnd > 98) {
                    quadrant['klingons'] = 3;
                } else if (rnd > 95) {
                    quadrant['klingons'] = 2;
                } else if (rnd > 80) {
                    quadrant['klingons'] = 1;
                }
                this.klingons += quadrant['klingons'];
                if(random.range(100) > 96) {
                    quadrant['starbases'] = 1;
                }
                this.starbases += quadrant['starbases'];
                quadrant['stars'] = random.range(10);
                this.stars += quadrant['stars'];
                this.quadrants[y][x] = quadrant;
            }
        }
        if (this.starbases == 0) {
            var x = random.range(10);
            var y = random.range(10);
            this.quadrants[y][x]['starbases'] = 1;
            this.starbases += 1;
        }
    }
    this.quadrantInfo = function quadrantInfo(x,y) {
        return this.quadrants[y][x];
    }
    this.getQuadrant = function getQuadrant(qx, qy, ships) {
        var quadrant = new Quadrant()
        var info = this.quadrantInfo(qx, qy)
        quadrant.things = quadrant.things.concat(ships)
        quadrant.generate(info.klingons, info.starbases, info.stars)
        return quadrant
    }
    
}
function Quadrant() {
    this.things = new Array();
    this.emptySpots = function emptySpots() {
        var freeCells = new Array();
        for(var x=0;x<10;++x) {
            for(var y=0;y<10;++y) {
                var occupied = false;
                for(i in self.things) {
                    if(i.x == x || i.y == y) {
                        occupied = true;
                        break;
                    }
                }
                if(occupied) {
                    continue;
                }
                freeCells.push({'x':x,'y':y});
            }
        }
        return freeCells;
    };
    this.generate = function generate(k, b, s) {
        var spots = this.emptySpots();
        random.shuffle(spots);
        for(;k>0;--k) {
            var pos = spots.pop();
            this.things.push(new Klingon(pos['x'],pos['y']));
        }
        for(;b>0;--b) {
            var pos = spots.pop();
            this.things.push(new Starbase(pos['x'],pos['y']));
        }
        for(;s>0;--s) {
            var pos = spots.pop();
            this.things.push(new Star(pos['x'],pos['y']));
        }
    }
    this.sectorContents = function sectorContents(x, y) {
        for(i in this.things) {
            if(this.things[i].x == x && this.things[i].y == y) {
                return this.things[i];
            }
        }
    };
    this.destroy = function destroy(thing) {
        for(i in this.things) {
            if(this.things[i] == thing) {
                delete this.things[i];
                return;
            }
        }
    };
}
function ScannerDisplay(widget) {
    var self = this;
    this._widget = widget
    this._summaries = {
        '(-1,-1)':$('#summary-northwest')[0],
        '(-1,0)':$('#summary-west')[0],
        '(-1,1)':$('#summary-southwest')[0],
        '(0,-1)':$('#summary-north')[0],
        '(0,1)':$('#summary-south')[0],
        '(1,-1)':$('#summary-northeast')[0],
        '(1,0)':$('#summary-east')[0],
        '(1,1)':$('#summary-southeast')[0],
    }
    this.neighborClicked = function defaultNeighborClicked(dx,dy){};
    function neighborClickedCallback(dx,dy) {
        self.neighborClicked(dx,dy);
    }
    for(var x=-1;x<=1;++x) {
        for(var y=-1;y<=1;++y) {
            $(this._summaries['('+x+','+y+')']).click(partial(neighborClickedCallback, x, y))
        }
    }
    this._names = new Array(
        'Antares','Sirius',
        'Rigel','Deneb',
        'Procyon','Capella',
        'Vega','Betelgeuse',
        'Canopus','Aldebaran',
        'Altair','Regulus',
        'Sagittarius','Arcturus',
        'Pollux','Spica',
        'Fomalhaut', 'Navi'
    )
    this._symbolIcons = {
        'klingon':'&#9760;',
        'starbase':'&#9737;',
        'star':'&#9733;',
        'starship':'&#9679;'
    }
    this._asciiIcons = {
        'klingon':'+K+',
        'starbase':'>!<',
        'star':' * ',
        'starship':'<*>'
    }
    this._numerals = new Array('I', 'II', 'III', 'IV', 'V')
    this.update = function(qx, qy, quadrant, galaxy) {
        for(var x=0;x<10;++x) {
            for(var y=0;y<10;++y) {
                this._widget.cellHtml(x, y, '')
            }
        }
        for(var i in quadrant.things) {
            this._widget.cellHtml(quadrant.things[i].x, quadrant.things[i].y, this._symbolIcons[quadrant.things[i].category])
        }
        $('#quadrant-klingons').html(galaxy.quadrantInfo(qx, qy).klingons)
        $('#quadrant-bases').html(galaxy.quadrantInfo(qx, qy).starbases)
        $('#quadrant-stars').html(galaxy.quadrantInfo(qx, qy).stars)
        function _summarize(x, y) {
            var q = galaxy.quadrantInfo(x,y)
            return q.klingons + '' + q.starbases + '' + q.stars
        }
        for(var dx=-1;dx<=1;++dx) {
            for(var dy=-1;dy<=1;++dy) {
                if('('+dx+','+dy+')' in this._summaries) {
                    if(qx+dx < 0 || qx+dx >= 10 || qy+dy < 0 || qy+dy >= 10) {
                        this._summaries['('+dx+','+dy+')'].innerHTML = '---';
                    } else {
                        this._summaries['('+dx+','+dy+')'].innerHTML = _summarize(qx+dx, qy+dy);
                    }
                }
            }
        }
        
        var nameIndex = Math.floor((qx + qy*10)/5)
        var numeralIndex = (qx + qy*10)%5
        $('#quadrant-name').html(this._names[nameIndex]+' '+this._numerals[numeralIndex])
    }
}
    
function Starchart(widget) {
    this._widget = widget
    this._chart = new Array()
    
    for(var y=0;y<10;++y) {
        this._chart.push(new Array())
        for(var x=0;x<10;++x) {
            this._chart[y].push({'klingons':undefined, 'starbases':undefined, 'stars':undefined})
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
            klingons = '?'
        }
        if(starbases == undefined) {
            starbases = '?'
        }
        if(stars == undefined) {
            stars = '?'
        }
        return klingons + '' + starbases + '' + stars
    }
    this.reset = function reset() {
        for(var x=0;x<10;++x) {
            for(var y=0;y<10;++y) {
                this._chart[y][x].klingons = undefined;
                this._chart[y][x].starbases = undefined;
                this._chart[y][x].stars = undefined;
                this._widget.cellHtml(x, y, this._summarize(x,y))
            }
        }
    }
    this.update = function(qx,qy, galaxy) {
        for(var dx=-1;dx<=1;dx+=1) {
            for(var dy=-1;dy<=1;dy+=1) {
                if(qx+dx < 0 || qx+dx >= 10 || qy+dy < 0 || qy+dy >= 10) {
                    continue;
                } else {
                    this._updateChart(qx+dx, qy+dy, galaxy);
                    this._widget.cellHtml(qx+dx, qy+dy, this._summarize(qx+dx,qy+dy));
                }
            }
        }
    }
}

function Game(widgets) {
    var self = this;
    this._widgets = widgets;
    this.galaxy = new Galaxy();
    this.player = new Starship(this.galaxy);
    
    this._initWidgets = function() {
        this._scan = new ScannerDisplay(this._widgets['srs']);
        this._chart = new Starchart(this._widgets['starchart']);
        this._widgets['shields'].onchange = function shieldsSliderChanged(value){
            self.player.shields = value;
        };
        this.player.shieldsChanged = this._widgets['shields'].setValue;
        
        this._widgets['phasers'].onchange = function phasersSliderChanged(value){
            self.player.phasers = value;
        };
        this.player.phasersChanged = this._widgets['phasers'].setValue;
        
        this._widgets['engines'].onchange = function enginesSliderChanged(value){
            self.player.warpFactor = value;
        };
        this.player.warpFactorChanged = this._widgets['engines'].setValue;
        
        this.player.energyChanged = this._widgets['energy'].setValue;
        this.player.torpedosChanged = function updateTorpedos(value) {
            $("#torpedo-count").html(self.player.torpedos)
        }
        
        
        this._widgets['srs'].cellClick = function(x,y) {
            if(self.player.quadrant.sectorContents(x,y)) {
                self.player.targetX = x;
                self.player.targetY = y;
                self._widgets['srs'].highlightCell(x,y);
            } else {
                self.player.destX = x;
                self.player.destY = y;
                self.player.qDestX = self.player.qx;
                self.player.qDestY = self.player.qy;
                self._widgets['srs'].markCell(x,y);
            }
        };
        this._scan.neighborClicked = function neighborClicked(dx,dy) {
            self.player.qDestX = self.player.qx+dx;
            self.player.qDestY = self.player.qy+dy;
            if(dx > 0) {
                self.player.destX = 0;
            } else if(dx < 0) {
                self.player.destX = 9;
            } else {
                self.player.destX = self.player.x;
            }
            if(dy > 0) {
                self.player.destY = 0;
            } else if(dy < 0) {
                self.player.destY = 9;
            } else {
                self.player.destX = self.player.y;
            }
            self._widgets['srs'].clearMark();
            self._widgets['starchart'].markCell(self.player.qx+dx,self.player.qy+dy);
        }
        
        
        this._widgets['starchart'].cellClick = function(x,y) {
            self.player.qDestX = x;
            self.player.qDestY = y;
            if(x > self.player.destX) {
                self.player.destX = 0;
            } else if(x < self.player.destX) {
                self.player.destX = 9;
            } else {
                self.player.destX = self.player.x;
            }
            if(y > self.player.destY) {
                self.player.destY = 0;
            } else if(y < self.player.destY){
                self.player.destY = 9;
            } else {
                self.player.destX = self.player.y;
            }
            self._widgets['srs'].clearMark();
            self._widgets['starchart'].markCell(x,y);
        };
        
        function updateCourse() {
            $('#course-target').html('('+self.player.qDestX+','+self.player.qDestY+') ('+self.player.destX+','+self.player.destY+')');
        }
        this.player.destXChanged = updateCourse;
        this.player.destYChanged = updateCourse;
        this.player.qDestXChanged = updateCourse;
        this.player.qDestYChanged = updateCourse;
        
        function updateTarget() {
            $('#torpedo-target').html('('+self.player.targetX+','+self.player.targetY+')');
        }
        this.player.targetXChanged = updateTarget;
        this.player.targetYChanged = updateTarget;
        
        this.player.xChanged = function xChanged(x) {
            $('#sector').html('('+x+','+self.player.y+')');
            self._scan.update(self.player.qx, self.player.qy, self.player.quadrant, self.galaxy)
        };
        this.player.yChanged = function yChanged(y) {
            $('#sector').html('('+self.player.x+','+y+')');
            self._scan.update(self.player.qx, self.player.qy, self.player.quadrant, self.galaxy)
        };
        this.player.qxChanged = function qxChanged(x) {
            $('#quadrant').html('('+x+','+self.player.qy+')');
            self._chart.update(self.player.qx, self.player.qy, self.galaxy)
            self._scan.update(self.player.qx, self.player.qy, self.player.quadrant, self.galaxy)
            self._widgets['starchart'].highlightCell(self.player.qx, self.player.qy);
        };
        this.player.qyChanged = function qyChanged(y) {
            $('#quadrant').html('('+self.player.qx+','+y+')');
            self._chart.update(self.player.qx, self.player.qy, self.galaxy)
            self._scan.update(self.player.qx, self.player.qy, self.player.quadrant, self.galaxy)
            self._widgets['starchart'].highlightCell(self.player.qx, self.player.qy);
        };
        
        this.galaxy.klingonsChanged = function klingonsChanged(value) {
            $('#total-klingons').html(value);
        }
        this.galaxy.starbasesChanged = function starbasesChanged(value) {
            $('#total-bases').html(value);
        }
        this.galaxy.starsChanged = function starsChanged(value) {
            $('#total-stars').html(value);
        }
        
        
        $('#engage').click(function engageClicked() {
            self.player.engage()
            self._widgets['srs'].clearMark();
            self._widgets['starchart'].clearMark();
        });
        $('#launch-torpedo').click(function launchClicked() {
            self.player.launchTorpedo()
            self._chart.update(self.player.qx, self.player.qy, self.galaxy)
            self._scan.update(self.player.qx, self.player.qy, self.player.quadrant, self.galaxy)
        });
        $('#fire-phasers').click(function fireClicked() {
            self.player.firePhasers()
            self._chart.update(self.player.qx, self.player.qy, self.galaxy)
            self._scan.update(self.player.qx, self.player.qy, self.player.quadrant, self.galaxy)
        });
    };
    this._initWidgets();
    this.newGame = function() {
        this.galaxy.generate();
        this.player.reset();
        this._chart.reset();
        this._scan.update(this.player.qx,this.player.qy, this.player.quadrant, this.galaxy);
        this._chart.update(this.player.qx,this.player.qy, this.galaxy);
    }
}

function Klingon(x,y) {
    this.category = 'klingon'
    this.x = x;
    this.y = y;
    this.shields = 100+random.range(200);
}
function Starbase(x,y) {
    this.category = 'starbase'
    this.x = x;
    this.y = y;
}
function Star(x,y) {
    this.category = 'star'
    this.x = x;
    this.y = y;
}

function setupGame() {
    var game = new Game(initializeWidgets());
    game.newGame();
}

$(document).ready(setupGame);