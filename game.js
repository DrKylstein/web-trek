function Starship(galaxy) {
    this.category = 'starship'
    this._galaxy = galaxy
    this.quadrant = new Quadrant()
    this._x = 0; defineWatchableValue(this, 'x', '_x');
    this._y = 0; defineWatchableValue(this, 'y', '_y');
    this._qx = 0; defineWatchableValue(this, 'qx', '_qx');
    this._qy = 0; defineWatchableValue(this, 'qy', '_qy');
    this._energy = 3000; defineWatchableValue(this, 'energy', '_energy');
    this._shields = 0;  defineWatchableValue(this, 'shields', '_shields');
    this._torpedos = 10; defineWatchableValue(this, 'torpedos', '_torpedos');
    
    this.reset = function reset() {
        this.x = random.range(10);
        this.y = random.range(10);
        this.qx = random.range(10);
        this.qy = random.range(10);
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
        var dx = ((qx * 10) + x) - ((this.qx * 10) + this.x);
        var dy = ((qy * 10) + y) - ((this.qy * 10) + this.y);
        var cost = this.travelCost(dx, dy, warp);
        if(cost > this.energy) {
            return 0;
        }
        this.energy -= cost;
        if(this.qx != qx || this.qy != qy) {
            this.quadrant = this._galaxy.getQuadrant(qx, qy, [this]);
        }
        this.qx = qx;
        this.qy = qy;
        this.x = x;
        this.y = y;
        var time = 1;
        
        return time;
    };
    
    this.launchTorpedo = function launchTorpedo(x,y) {
        if(this.torpedos > 0) {
            --this.torpedos;
            var target = this.quadrant.sectorContents(x, y)
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
    
    this.firePhasers = function firePhasers(amount) {
        if (this.energy - amount < 0) {
            return false;
        } else {
            this.energy -= amount;
        }

        var targets = new Array();
        for(i in this.quadrant.things) {
            if(this.quadrant.things[i].category == 'klingon') {
                targets.push(this.quadrant.things[i])
            }
        }
        if(!targets) {
            return false;
        }
        var perTarget = amount / targets.length;
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
        return true;
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
    this.player = new Starship(self.galaxy);
    this.startTime = 0;
    this.duration = 26;
    this._time = 0; defineWatchableValue(this, 'time', '_time');
    this.dq = [0,0];
    this.ds = [0,0];
    
    this._initWidgets = function() {
        self._scan = new ScannerDisplay(self._widgets['srs']);
        self._chart = new Starchart(self._widgets['starchart']);
        
        this.timeChanged = function timeChanged(value) {
            $('#time').html(value);
            $('#end-time').html(value+self.duration);
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
        function updateWarp(value) {
            if(self.player.travelCost( self._widgets['engines'].value()) > self.player.energy) {
                self._widgets['engines'].setValue(self.player.energy);
            }
        }
        self._widgets['phasers'].onchange = updatePhasers;
        self._widgets['engines'].onchange = updateWarp;
        self.player.energyChanged = function energyChanged(value) {
            self._widgets['energy'].setValue(value);
            updatePhasers();
            updateWarp();
        }
        self.player.torpedosChanged = function updateTorpedos(value) {
            $("#torpedo-count").html(self.player.torpedos)
        }
        
        
        self._widgets['srs'].cellClick = function(x,y) {
            if(self.player.quadrant.sectorContents(x,y)) {
                self._widgets['srs'].highlightCell(x,y);
            } else {
                self.ds = [x, y];
                self.dq = [self.player.qx, self.player.qy];
                self._widgets['srs'].markCell(x,y);
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
        };
        self._scan.neighborClicked = function neighborClicked(dx,dy) {
            selectQuadrant(self.player.qx+dx, self.player.qy+dy)
        };
        self._widgets['starchart'].cellClick = selectQuadrant;
                        
        self.player.xChanged = function xChanged(x) {
            $('#sector').html('('+x+','+self.player.y+')');
            self._scan.update(self.player.qx, self.player.qy, self.player.quadrant, self.galaxy)
        };
        self.player.yChanged = function yChanged(y) {
            $('#sector').html('('+self.player.x+','+y+')');
            self._scan.update(self.player.qx, self.player.qy, self.player.quadrant, self.galaxy)
        };
        self.player.qxChanged = function qxChanged(x) {
            $('#quadrant').html('('+x+','+self.player.qy+')');
            self._chart.update(self.player.qx, self.player.qy, self.galaxy)
            self._scan.update(self.player.qx, self.player.qy, self.player.quadrant, self.galaxy)
            self._widgets['starchart'].highlightCell(self.player.qx, self.player.qy);
        };
        self.player.qyChanged = function qyChanged(y) {
            $('#quadrant').html('('+self.player.qx+','+y+')');
            self._chart.update(self.player.qx, self.player.qy, self.galaxy)
            self._scan.update(self.player.qx, self.player.qy, self.player.quadrant, self.galaxy)
            self._widgets['starchart'].highlightCell(self.player.qx, self.player.qy);
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
            self.player.engage(self.ds[0], self.ds[1], self.dq[0], self.dq[1], self._widgets['engines'].value());
            self._widgets['srs'].clearMark();
            self._widgets['starchart'].clearMark();
        });
        $('#launch-torpedo').click(function launchClicked() {
            if(self._widgets['srs'].getHighlighted() == undefined) {
                return;
            }
            self.player.launchTorpedo(self._widgets['srs'].getHighlighted()[0], self._widgets['srs'].getHighlighted()[1]);
            self._chart.update(self.player.qx, self.player.qy, self.galaxy);
            self._scan.update(self.player.qx, self.player.qy, self.player.quadrant, self.galaxy);
            self._widgets['srs'].clearHighlight();
        });
        $('#fire-phasers').click(function fireClicked() {
            self.player.firePhasers(self._widgets['phasers'].value());
            self._chart.update(self.player.qx, self.player.qy, self.galaxy);
            self._scan.update(self.player.qx, self.player.qy, self.player.quadrant, self.galaxy);
        });
        //is there a better place?
        this.time = (random.range(1,21) + 20)*100;
    };
    this._initWidgets();
    this.newGame = function() {
        this.galaxy.generate();
        this.player.reset();
        this.startTime = this.time;
        this.duration = 25 + random.range(1,11);
        this.ds = [this.player.x, this.player.y];
        this.dq = [this.player.qx, this.player.qy];
        this._widgets['srs'].clearMark();
        this._widgets['starchart'].clearMark();
        this._widgets['srs'].clearHighlight();
        this._widgets['starchart'].highlightCell(this.player.qx, this.player.qy);
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