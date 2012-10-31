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
        return new Quadrant(this, qx, qy, ships);
    }
    this.unifiedCoordinates = function(sectorPos, quadrantPos) {
        return [sectorPos[0] + (quadrantPos[0] * 10), sectorPos[1] + (quadrantPos[1] * 10)];
    }
}
function Quadrant(galaxy, x, y, ships) {
    this._galaxy = galaxy;
    this.x = x;
    this.y = y;
    this.things = ships;
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
                freeCells.push([x,y]);
            }
        }
        return freeCells;
    };
    this.generate = function generate(k, b, s) {
        var spots = this.emptySpots();
        random.shuffle(spots);
        for(;k>0;--k) {
            var pos = spots.pop();
            this.things.push(new Klingon(pos[0],pos[1], this));
        }
        for(;b>0;--b) {
            var pos = spots.pop();
            this.things.push(new Starbase(pos[0],pos[1], this));
        }
        for(;s>0;--s) {
            var pos = spots.pop();
            this.things.push(new Star(pos[0],pos[1], this));
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
                if(thing.category == 'klingon') {
                    this._galaxy.quadrants[this.y][this.x].klingons--;
                    this._galaxy.klingons--;
                } else if(thing.category == 'starbase') {
                    this._galaxy.quadrants[this.y][this.x].starbases--;
                    this._galaxy.starbases--;
                } else if(thing.category == 'star') {
                    this._galaxy.quadrants[this.y][this.x].stars--;
                    this._galaxy.stars--;
                }
                delete this.things[i];
                return;
            }
        }
    };
    var info = this._galaxy.quadrantInfo(this.x, this.y);
    this.generate(info.klingons, info.starbases, info.stars);
}

function Starchart(w,h) {
    this.width = w;
    this.height = h;
    this._info = new Array();
    for(var y=0;y<w;++y) {
        this._info.push(new Array())
        for(var x=0;x<w;++x) {
            this._info[y].push(undefined);
        }
    }
    this.update = function update(galaxy, pos) {
        for(var y=-1;y<=1;++y) {
            for(var x=-1;x<=1;++x) {
                if(pos[0] + x < 0 || pos[0] + x > this.width ||
                    pos[1] + y < 0 || pos[1] + y > this.height) {
                    continue;
                }
                this._info[pos[1]+y][pos[0]+x] = galaxy.quadrantInfo(pos[0]+x, pos[1]+y);
            }
        }
    }
    this.getQuadrant = function getQuadrant(x,y) {
        return this._info[y][x];
    }
    this.clear = function clear() {
        for(var y=0;y<w;++y) {
            for(var x=0;x<w;++x) {
                this._info[y][x] = undefined;
            }
        }
    }
}

function travelTime(dx, dy, w) {
    return Math.max((Math.abs(dx) + Math.abs(dy))/w, 1);
}
function travelCost(dx, dy, w) {
    return (Math.abs(dx) + Math.abs(dy)) * w;
}

function Starship(galaxy) {
    this.category = 'starship'
    this._galaxy = galaxy
    this.starchart = new Starchart(10,10);
    this._x = 0; defineWatchableValue(this, 'x', '_x');
    this._y = 0; defineWatchableValue(this, 'y', '_y');
    this._qx = 0; defineWatchableValue(this, 'qx', '_qx');
    this._qy = 0; defineWatchableValue(this, 'qy', '_qy');
    this.quadrant = this._galaxy.getQuadrant(0, 0);
    this._energy = 3000; defineWatchableValue(this, 'energy', '_energy');
    this._shields = 0;  defineWatchableValue(this, 'shields', '_shields');
    this._torpedos = 10; defineWatchableValue(this, 'torpedos', '_torpedos');
    
    this.reset = function reset() {
        this.x = random.range(10);
        this.y = random.range(10);
        this.shields = 0;
        this.phasers = 0;
        this.warpFactor = 1;
        this.energy = 3000;
        this.torpedos = 10;
        this.quadrant = this._galaxy.getQuadrant(random.range(10), random.range(10), [this])
        this.starchart.clear();
        this.starchart.update(this._galaxy, [this.quadrant.x, this.quadrant.y]);
    }
        
    this.shieldControl = function shieldControl(newvalue){
        var delta = newvalue - this.shields;
        if (this.energy - delta < 0) {
            delta = this.energy;
            this.energy = 0;
            this.shields += delta;
        } else {
            this.energy -= delta;
            this.shields = newvalue;
        }
    };
    
    this.engage = function engage(x, y, qx, qy, warp) {
        var dx = ((qx * 10) + x) - ((this.quadrant.x * 10) + this.x);
        var dy = ((qy * 10) + y) - ((this.quadrant.y * 10) + this.y);
        var cost = travelCost(dx, dy, warp);
        if(cost > this.energy) {
            return 0;
        }
        this.energy -= cost;
        this.x = x;
        this.y = y;
        if(this.quadrant.x != qx || this.quadrant.y != qy) {
            this.quadrant = this._galaxy.getQuadrant(qx, qy, [this]);
            this.starchart.update(this._galaxy, [this.quadrant.x, this.quadrant.y]);
        }
        var elapsed_time = travelTime(dx, dy, warp);
        return elapsed_time;
    };
    
    this.launchTorpedo = function launchTorpedo(x,y) {
        if(this.torpedos > 0) {
            --this.torpedos;
            var target = this.quadrant.sectorContents(x, y)
            if(target != undefined && target != this) {
                target.damage(10000);
            }
        }
    };
    
    this.firePhasers = function firePhasers(amount) {
        if (this.energy - amount >= 0) {
            this.energy -= amount;
            var targets = new Array();
            for(i in this.quadrant.things) {
                if(this.quadrant.things[i].category == 'klingon') {
                    targets.push(this.quadrant.things[i])
                }
            }
            if(targets) {
                var perTarget = amount / targets.length;
                for(i in targets) {
                    var damage = perTarget / distance(this.x, this.y, targets[i].x, targets[i].y) * (Math.random() + 2);
                    targets[i].damage(damage);
                }
            }
        }
    }
    
    this.damage = function damage(amount) {
        this.shields -= amount;
    }
    
    this.longRangeSensors = function longRangeSensors() {
        var longRange = new Array();
        for(var y=-1;y<=1;++y) {
            longRange.push(new Array());
            for(var x=-1;x<=1;++x) {
                if(this.quadrant.x+x < 0 || this.quadrant.x+x > 10 ||
                    this.quadrant.y+y < 0 || this.quadrant.y+y > 10) {
                    longRange[y+1].push(undefined);
                } else {
                    longRange[y+1].push(this._galaxy.quadrantInfo(this.quadrant.x+x, this.quadrant.y+y));
                }
            }
        }
        return longRange;
    }
}
function Klingon(x,y, quadrant) {
    this.category = 'klingon'
    this.x = x;
    this.y = y;
    this.shields = 100+random.range(200);
    this.quadrant = quadrant;
    this.move = function move() {
        var destination = random.choice(this.quadrant.emptySpots());
        this.x = destination[0];
        this.y = destination[1];
    }
    this.shoot = function shoot() {
        for(i in this.quadrant.things) {
            if(this.quadrant.things[i].category == 'starship') {
                var target = this.quadrant.things[i];
                var damage = (this.shields/distance(this.x, this.y, target.x,target.y))*(Math.random()+2);
                target.shields -= damage;
            }
        }
    }
    this.damage = function damage(amount) {
        if(damage < 0.15 * this.shields) {
            return 0;
        } else {
            this.shields -= amount;
            if(this.shields <= 0) {
                this.quadrant.destroy(this);
                return -1;
            }
            return amount;
        }
    }
}
function Starbase(x,y, quadrant) {
    this.category = 'starbase';
    this.x = x;
    this.y = y;
    this.quadrant = quadrant;
    this.damage = function(amount) {
        return 0;
    }
}
function Star(x,y, quadrant) {
    this.category = 'star';
    this.x = x;
    this.y = y;
    this.quadrant = quadrant;
    this.damage = function(amount) {
        return 0;
    }
}

var starNames = new Array(
    'Antares','Sirius',
    'Rigel','Deneb',
    'Procyon','Capella',
    'Vega','Betelgeuse',
    'Canopus','Aldebaran',
    'Altair','Regulus',
    'Sagittarius','Arcturus',
    'Pollux','Spica',
    'Fomalhaut', 'Navi'
);
var numerals = new Array('I', 'II', 'III', 'IV', 'V');

function quadrantName(q) {
    var nameIndex = Math.floor((q[0] + q[1]*10)/5)
    var numeralIndex = (q[0] + q[1]*10)%5
    return starNames[nameIndex]+' '+numerals[numeralIndex];
}

function ScannerDisplay(widget, player) {
    var self = this;
    this._widget = widget;
    this._player = player;
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
    this.neighborClicked = function defaultNeighborClicked(dx,dy){};
    function neighborClickedCallback(dx,dy) {
        self.neighborClicked(dx,dy);
    }
    for(var x=-1;x<=1;++x) {
        for(var y=-1;y<=1;++y) {
            $(this._summaries['('+x+','+y+')']).click(partial(neighborClickedCallback, x, y))
        }
    }
    this.update = function() {
        for(var x=0;x<10;++x) {
            for(var y=0;y<10;++y) {
                this._widget.cellHtml(x, y, '')
            }
        }
        things = this._player.quadrant.things;
        for(var i in things) {
            this._widget.cellHtml(things[i].x, things[i].y, 
                this._symbolIcons[things[i].category]);
        }
        lrs = this._player.longRangeSensors();
        for(var dx=-1;dx<=1;++dx) {
            for(var dy=-1;dy<=1;++dy) {
                if(lrs[dy+1][dx+1] == undefined) {
                    this._summaries['('+dx+','+dy+')'].innerHTML = '---';
                } else if(!(dx == 0 && dy == 0)) {
                    this._summaries['('+dx+','+dy+')'].innerHTML = (
                        lrs[dy+1][dx+1].klingons + '' 
                        + lrs[dy+1][dx+1].starbases + ''
                        + lrs[dy+1][dx+1].stars + ''
                    );
                }
            }
        }
        
    }
}
    
function StarchartDisplay(widget, chart) {
    this._widget = widget;
    this._chart = chart;
    
    this.update = function() {
        for(var x=0;x<this._chart.width;++x) {
            for(var y=0;y<this._chart.height;++y) {
                var summary;
                var info = this._chart.getQuadrant(x,y);
                if(info == undefined) {
                    summary = '?';
                } else {
                    summary = info.klingons + '' + info.starbases + '' + info.stars;
                }
                this._widget.cellHtml(x, y, summary);
            }
        }
    }
}


function Game(widgets) {
    var self = this;
    this._widgets = widgets;
    this.galaxy = new Galaxy();
    this.player = new Starship(self.galaxy);
    this._endTime = 26; defineWatchableValue(this, 'endTime', '_endTime');
    this._time = 0; defineWatchableValue(this, 'time', '_time');
    this.dq = [0,0];
    this.ds = [0,0];
    this._scan = new ScannerDisplay(this._widgets['srs'], this.player);
    this._chart = new StarchartDisplay(this._widgets['starchart'], this.player.starchart);
    
    this._updateWarp = function _updateWarp(value) {
        var warp = self._widgets['engines'].value();
        var currentPos = self.galaxy.unifiedCoordinates(
            [self.player.x, self.player.y], [self.player.quadrant.x, self.player.quadrant.y]);
        var newPos = self.galaxy.unifiedCoordinates(
            self.ds, self.dq);
        var dx = Math.abs(newPos[0] - currentPos[0]);
        var dy = Math.abs(newPos[1] - currentPos[1]);
        var cost = travelCost(dx, dy, warp);
        if(cost > self.player.energy) {
            warp = self.player.energy / (dx + dy);
            self._widgets['engines'].setValue(warp);
        }
        $('#eta').html(travelTime(dx, dy, warp).toFixed(1));
    }

    this._quadrantChanged = function _quadrantChanged() {
        self._scan.update();
        self._chart.update();
        var lrs = self.player.longRangeSensors();
        $('#quadrant-klingons').html(lrs[1][1].klingons)
        $('#quadrant-bases').html(lrs[1][1].starbases)
        self._widgets['srs'].clearMark();
        self._widgets['srs'].clearHighlight();
        self._widgets['starchart'].clearMark();
        self._updateWarp();
    }
    this._newQuadrant = function _newQuadrant() {
        self._quadrantChanged();
        $('#quadrant-name').html(quadrantName([self.player.quadrant.x, self.player.quadrant.y]));
        $('#quadrant').html('('+self.player.quadrant.x+','+self.player.quadrant.y+')');
        self._widgets['starchart'].highlightCell(self.player.quadrant.x, self.player.quadrant.y);
    }
    
    this._initWidgets = function() {
        
        this.timeChanged = function timeChanged(value) {
            $('#time').html(value);
        }
        this.endTimeChanged = function endTimeChanged(value) {
            $('#end-time').html(value);
        }
                
        self._widgets['shields'].onchange = function shieldsSliderChanged(value){
            self.player.shieldControl(value);
        };
        self.player.shieldsChanged = self._widgets['shields'].setValue;
        function updatePhasers(value) {
            if(self._widgets['phasers'].value() > self.player.energy) {
                self._widgets['phasers'].setValue(self.player.energy);
            }
        }
        self._widgets['phasers'].onchange = updatePhasers;
        self._widgets['engines'].onchange = self._updateWarp;
        self.player.energyChanged = function energyChanged(value) {
            self._widgets['energy'].setValue(value);
            updatePhasers();
            self._updateWarp();
        }
        self.player.torpedosChanged = function updateTorpedos(value) {
            $("#torpedo-count").html(self.player.torpedos)
        }
        
        
        self._widgets['srs'].cellClick = function(x,y) {
            if(self.player.quadrant.sectorContents(x,y)) {
                self._widgets['srs'].highlightCell(x,y);
            } else {
                self.ds = [x, y];
                self.dq = [self.player.quadrant.x, self.player.quadrant.y];
                self._widgets['srs'].markCell(x,y);
                self._updateWarp();
            }
        };
        
        function selectQuadrant(x,y) {
            if(x > self.dq[0]) {
                self.ds[0] = 0;
            } else if(x < self.dq[0]) {
                self.ds[0] = 9;
            } else {
                self.ds[0] = self.player.x;
            }
            if(y > self.dq[1]) {
                self.ds[1] = 0;
            } else if(y < self.dq[1]){
                self.ds[1] = 9;
            } else {
                self.ds[1] = self.player.y;
            }
            self.dq = [x, y];
            self._widgets['srs'].clearMark();
            self._widgets['starchart'].markCell(x,y);
            self._updateWarp();
        };
        self._scan.neighborClicked = function neighborClicked(dx,dy) {
            selectQuadrant(self.player.quadrant.x+dx, self.player.quadrant.y+dy);
        };
        self._widgets['starchart'].cellClick = selectQuadrant;
                        
        self.player.xChanged = function xChanged(x) {
            $('#sector').html('('+x+','+self.player.y+')');
        };
        self.player.yChanged = function yChanged(y) {
            $('#sector').html('('+self.player.x+','+y+')');
        };
        
        self.galaxy.klingonsChanged = function klingonsChanged(value) {
            $('#total-klingons').html(value);
        }
        self.galaxy.starbasesChanged = function starbasesChanged(value) {
            $('#total-bases').html(value);
        }
        self.galaxy.starsChanged = function starsChanged(value) {
            $('#total-stars').html(value);
        }
        
        
        $('#engage').click(function engageClicked() {
            if(self.ds[0] == self.player.x && self.ds[1] == self.player.y &&
                self.dq[0] == self.player.qx && self.dq[1] == self.player.qy
            ) {
                return;
            }
            var dt = self.player.engage(self.ds[0], self.ds[1], 
                self.dq[0], self.dq[1], self._widgets['engines'].value());
            self.time += dt;
            self._newQuadrant();
        });
        $('#launch-torpedo').click(function launchClicked() {
            if(self._widgets['srs'].getHighlighted() == undefined) {
                return;
            }
            self.player.launchTorpedo(self._widgets['srs'].getHighlighted()[0], self._widgets['srs'].getHighlighted()[1]);
            self._quadrantChanged();
        });
        $('#fire-phasers').click(function fireClicked() {
            self.player.firePhasers(self._widgets['phasers'].value());
            self._quadrantChanged();
        });
        //is there a better place?
        this.time = (random.range(1,21) + 20)*100;
    };
    this._initWidgets();
    this.newGame = function() {
        this.galaxy.generate();
        this.player.reset();
        this.endTime = this.time + 25 + random.range(1,11);
        this.ds = [this.player.x, this.player.y];
        this.dq = [this.player.quadrant.x, this.player.quadrant.y];
        self._newQuadrant();
    }
}

function setupGame() {
    var game = new Game(initializeWidgets());
    game.newGame();
}

$(document).ready(setupGame);