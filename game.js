/*
Copyright (c) 2012, Kyle Delaney
All rights reserved.

Redistribution and use in source and binary forms, with or without 
modification, are permitted provided that the following conditions are met:

* Redistributions of source code must retain the above copyright notice, this 
  list of conditions and the following disclaimer.
* Redistributions in binary form must reproduce the above copyright notice, 
  this list of conditions and the following disclaimer in the documentation 
  and/or other materials provided with the distribution.
  
THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" 
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE 
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE 
ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE 
LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR 
CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF 
SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS 
INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN 
CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) 
ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE 
POSSIBILITY OF SUCH DAMAGE.
*/
/*
overlap bug spotted again.

-clearer starchart display
-add additional system damage effects
-torpedo blast radius to discourage overuse?
*/
function Galaxy(size, qSize) {
    this.quadrants = new Array();
    this.width = size[0];
    this.height = size[1];
    this.qSize = qSize;
    this._klingons = 0; defineWatchableValue(this, 'klingons', '_klingons');
    this._starbases = 0; defineWatchableValue(this, 'starbases', '_starbases');
    this._stars = 0; defineWatchableValue(this, 'stars', '_stars');
    for(var y=0; y<this.height; ++y) {
        this.quadrants.push(new Array());
        for(var x=0; x<this.width; ++x) {
            var quadrant = {'klingons':0, 'stars':0, 'starbases':0};
            this.quadrants[y].push(quadrant);
        }
    }
    this.generate = function generate() {
        this._klingons = 0;
        this._starbases = 0;
        this._stars = 0;
        for(var y=0; y<this.height; ++y) {
            for(var x=0; x<this.width; ++x) {
                var quadrant = {'klingons':0, 'stars':0, 'starbases':0};
                var rnd = random.range(1,101);
                if(rnd > 98) {
                    quadrant['klingons'] = 3;
                } else if (rnd > 95) {
                    quadrant['klingons'] = 2;
                } else if (rnd > 80) {
                    quadrant['klingons'] = 1;
                }
                this._klingons += quadrant['klingons'];
                if(random.range(1,101) > 96) {
                    quadrant['starbases'] = 1;
                }
                this._starbases += quadrant['starbases'];
                quadrant['stars'] = random.range(1,10);
                this._stars += quadrant['stars'];
                this.quadrants[y][x] = quadrant;
            }
        }
        if (this.starbases == 0) {
            var x = random.range(this.width);
            var y = random.range(this.height);
            this.quadrants[y][x]['starbases'] = 1;
            this.starbases += 1;
        }
        this.klingonsChanged(this._klingons);
        this.starbasesChanged(this._starbases);
        this.starsChanged(this._stars);
    }
    this.quadrantInfo = function quadrantInfo(x,y) {
        return this.quadrants[y][x];
    }
    this.getQuadrant = function getQuadrant(qx, qy, ships) {
        return new Quadrant(this, [qx, qy], this.qSize, ships);
    }
    this.unifiedCoordinates = function(sectorPos, quadrantPos) {
        return [sectorPos[0] + (quadrantPos[0] * this.width), sectorPos[1] + (quadrantPos[1] * this.height)];
    }
}
function Quadrant(galaxy, pos, size, ships) {
    this._galaxy = galaxy;
    this.x = pos[0];
    this.y = pos[1];
    this.width = size[0];
    this.height = size[1];
    this.things = ships;
    this.emptySpots = function emptySpots() {
        var occupied = false;
        var freeCells = new Array();
        for(var x=0;x<this.width;++x) {
            for(var y=0;y<this.height;++y) {
                if(this.sectorContents(x, y)) {
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
    this.hitScan = function hitscan(pos0, pos1) {
        var hitCells = new Array();
        var steep = Math.abs(pos1[1] - pos0[1]) > Math.abs(pos1[0] - pos0[0]);
        if(steep) {
            pos0 = [pos0[1], pos0[0]];
            pos1 = [pos1[1], pos1[0]];
        }
        if(pos0[0] > pos1[0]) {
            var temp = pos1;
            pos1 = pos0;
            pos0 = temp;
        }
        var delta = [pos1[0]-pos0[0], Math.abs(pos1[1]-pos0[1])];
        var error = delta[0]/2;
        var ystep;
        var y = pos0[1];
        if(pos0[1] < pos1[1]) {
            ystep = 1;
        } else {
            ystep = -1;
        }
        for(var x=pos0[0]; x<pos1[0]; ++x) {
            if(x != pos0[0]) {
                if(steep) {
                    hitCells.push([y,x]);
                } else {
                    hitCells.push([x,y]);
                }
            }
            error -= delta[1];
            if(error < 0) {
                y += ystep;
                error += delta[0];
            }
        }
        for(var i in hitCells) {
            if(this.sectorContents(hitCells[i][0], hitCells[i][1])) {
                return true;
            }
        }
        return false;
    };
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
                if(pos[0] + x < 0 || pos[0] + x >= this.width ||
                    pos[1] + y < 0 || pos[1] + y >= this.height) {
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

function Starship(galaxy) {
    var _MAX_ENERGY = 3000;
    var _MAX_TORPEDOS = 10;
    
    this.category = 'starship';
    this._galaxy = galaxy;
    this.starchart = new Starchart(10,10);
    this._x = 0; defineWatchableValue(this, 'x', '_x');
    this._y = 0; defineWatchableValue(this, 'y', '_y');
    this.quadrant = this._galaxy.getQuadrant(0, 0);
    this._energy = _MAX_ENERGY; defineWatchableValue(this, 'energy', '_energy');
    this._shields = 0;  defineWatchableValue(this, 'shields', '_shields');
    this._torpedos = _MAX_TORPEDOS; defineWatchableValue(this, 'torpedos', '_torpedos');
    this.dead = false;
    this.damaged = {'engine':0, 'srs':0, 'lrs':0, 'phaser':0, 'torpedo':0, 'damage':0, 'shield':0, 'library':0}
    this._docked = false; defineWatchableValue(this, 'docked', '_docked');
    
    this.reset = function reset() {
        this.x = random.range(10);
        this.y = random.range(10);
        this.shields = 0;
        this.energy = _MAX_ENERGY;
        this.torpedos = _MAX_TORPEDOS;
        this.dead = false;
        this.quadrant = this._galaxy.getQuadrant(random.range(this._galaxy.width), random.range(this._galaxy.height), [this]);
        this.starchart.clear();
        this.starchart.update(this._galaxy, [this.quadrant.x, this.quadrant.y]);
        this.docked = false;
        this.fullRepair();
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
    
    this.travelCost = function travelCost(dest, qDest) {
        var uDest = this._galaxy.unifiedCoordinates(dest, qDest);
        var uPos = this._galaxy.unifiedCoordinates([this.x, this.y], [this.quadrant.x, this.quadrant.y]);
        return Math.floor(distance(uDest[0], uDest[1], uPos[0], uPos[1]));
    }
    
    this.travelTime = function travelTime(cost) {
        return Math.min(cost, 10);
    }
    
    this.handleDocking = function handleDocking() {
        this._docked = false;
        for(var i in this.quadrant.things) {
            if(this.quadrant.things[i].category == 'starbase') {
                if(Math.abs(this.quadrant.things[i].x - this.x) <= 1 &&
                Math.abs(this.quadrant.things[i].y - this.y) <= 1) {
                    this._docked = true;
                    this.energy = _MAX_ENERGY;
                    this.torpedos = _MAX_TORPEDOS;
                    this.shields = 0;
                }
            }
        }
        this.dockedChanged(this._docked);
    }
    
    this.maxRange = function maxRange() {
        if(this.shields > 0) {
            return 1; //cannot exceed warp 0.1 with shields up
        }
        if(this.damaged['engines']) {
            return 2; //cannot exceed warp 0.2 when engines are damaged
        }
        return Math.min(this.energy, 101);
    }
    
    this.canMove = function canMove(dest, qDest) {
        if(dest[0] == this.x && dest[1] == this.y && qDest[0] == this.quadrant.x && qDest[1] == this.quadrant.y) {
            return false;
        }
        var cost = this.travelCost(dest, qDest);
        if(this.energy - cost < 0) {
            return false;
        }
        if(cost > this.maxRange()) {
            return false;
        }

        return true;
    }
    
    this.move = function move(dest, qDest) {
        if(!this.canMove(dest, qDest)) {
            return 0;
        }
        var cost = this.travelCost(dest, qDest);

        this.energy -= cost;
        this.x = dest[0];
        this.y = dest[1];
        if(this.quadrant.x != qDest[0] || this.quadrant.y != qDest[1]) {
            this.quadrant = this._galaxy.getQuadrant(qDest[0], qDest[1], [this]);
            this.starchart.update(this._galaxy, [this.quadrant.x, this.quadrant.y]);
        }
        this.handleDocking();
        var dt = this.travelTime(cost)
        if(!this.damaged['damage']) {
            this.repair(dt);
        }
        return dt;
    };
    
    this.canTorpedoReach = function canTorpedoReach(pos) {
        return !this.quadrant.hitScan([this.x, this.y], pos);
    }
    
    this.launchTorpedo = function launchTorpedo(pos) {
        if(this.torpedos > 0 && this.canTorpedoReach(pos)) {
            --this.torpedos;
            var target = this.quadrant.sectorContents(pos[0], pos[1])
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
        if(this.docked) {
            return 0;
        }
        this.shields -= amount;
        if(amount > 20 && Math.random() <= 0.6 && amount / this.shields > 0.2) {
            var system = random.choice(Object.keys(this.damaged));
            this.damaged[system] += ((amount / this.shields) + (Math.random() * 0.5))*10; //10x time units (fixed point)
        }
        if(this.shields < 0) {
            this.dead = true;
        }
        return amount;
    }
    
    this.repair = function(dt) {
        var keys = Object.keys(this.damaged);
        for(var k in keys) {
            if(this.damaged[keys[k]] > 0) {
                this.damaged[keys[k]] -= dt;
                if(this.damaged[keys[k]] < 1 && this.damaged[keys[k]] > 0) {
                    this.damaged[keys[k]] = 1;
                }
                if(this.damaged[keys[k]] < 0) {
                    this.damaged[keys[k]] = 0;
                }
            }
        }
    }
    
    this.fullRepairTime = function fullRepairTime() {
        var keys = Object.keys(this.damaged);
        var dt = 0;
        for(var k in keys) {
            dt += this.damaged[keys[k]];
        }
        return dt;
    }
    
    this.fullRepair = function fullRepair() {
        var keys = Object.keys(this.damaged);
        var dt = this.fullRepairTime();
        for(var k in keys) {
            this.damaged[keys[k]] = 0;
        }
        return dt;
    }
    
    this.longRangeSensors = function longRangeSensors() {
        var longRange = new Array();
        for(var y=-1;y<=1;++y) {
            longRange.push(new Array());
            for(var x=-1;x<=1;++x) {
                if(this.quadrant.x+x < 0 || this.quadrant.x+x > 9 ||
                    this.quadrant.y+y < 0 || this.quadrant.y+y > 9) {
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
    this.shields = 100+random.range(201);
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
                target.damage(damage);
            }
        }
    }
    this.damage = function damage(amount) {
        if(amount < 0.15 * this.shields) {
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
//classic names: aaaabccdpprrsssv
//unused letters: efghijklmnoqtuwxyz
//new names: efnk
/* var starNames = new Array(
    'Antares','Sirius',
    'Rigel','Deneb',
    'Procyon','Capella',
    'Vega','Betelgeuse',
    'Canopus','Aldebaran',
    'Altair','Regulus',
    'Sagittarius','Arcturus',
    'Pollux','Spica',
    'Fomalhaut', 'Navi',
    'Elnath', 'Kastra'
);
var numerals = new Array('I', 'II', 'III', 'IV', 'V');

function quadrantName(q) {
    var nameIndex = Math.floor((q[0] + (q[1] * 10)) / 5);
    var numeralIndex = (q[0] + (q[1] * 10)) % 5;
    return starNames[nameIndex]+' '+numerals[numeralIndex];
}
 */
function ScannerDisplay(widget, player) {
    var self = this;
    this._widget = widget;
    this._player = player;
    this._marked = [0,0];
    this._summaries = {
        '(-1,-1)':$('#summary-northwest')[0],
        '(-1,0)':$('#summary-west')[0],
        '(-1,1)':$('#summary-southwest')[0],
        '(0,-1)':$('#summary-north')[0],
        '(0,1)':$('#summary-south')[0],
        '(1,-1)':$('#summary-northeast')[0],
        '(1,0)':$('#summary-east')[0],
        '(1,1)':$('#summary-southeast')[0]
    }
    this._symbolIcons = {
        'klingon':'<span class="klingon">&#9660;</span>',
        'starbase':'<span class="starbase">&#9632;</span>',
        'star':'<span class="star">&#9679;</span>',
        'starship':'<span class="starship">&#9650;</span>'
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
        function summarize(category, count) {
            if(count) {
                return '<span class='+category+'>'+count+'</span>';
            }
            return '';
        }
        for(var dx=-1;dx<=1;++dx) {
            for(var dy=-1;dy<=1;++dy) {
                if(lrs[dy+1][dx+1] == undefined) {
                    this._summaries['('+dx+','+dy+')'].innerHTML = '';
                } else if(!(dx == 0 && dy == 0)) {
                    this._summaries['('+dx+','+dy+')'].innerHTML = (
                        summarize('klingon', lrs[dy+1][dx+1].klingons) +
                        summarize('starbase', lrs[dy+1][dx+1].starbases) +
                        summarize('star', lrs[dy+1][dx+1].stars)
                    );
                }
            }
        }
    }
    this.markNeighbor = function markNeighbor(vec) {
        self.clearNeighborMark();
        self._marked = vec;
        $(self._summaries['('+self._marked[0]+','+self._marked[1]+')']).addClass('marked');
    }
    this.clearNeighborMark = function clearNeighborMark() {
        if(self._marked == [0,0]) {
            return;
        }
        $(self._summaries['('+self._marked[0]+','+self._marked[1]+')']).removeClass('marked');
        self._marked = [0,0];
    }
}
    
function StarchartDisplay(widget, chart) {
    this._widget = widget;
    this._chart = chart;
    
    this.update = function() {
        function summarize(category, count) {
            if(count) {
                return '<span class='+category+'>'+count+'</span>';
            }
            return '';
        }
        for(var x=0;x<this._chart.width;++x) {
            for(var y=0;y<this._chart.height;++y) {
                var summary;
                var info = this._chart.getQuadrant(x,y);
                if(info == undefined) {
                    summary = '';
                } else {
                    summary = (summarize('klingon', info.klingons)
                        + summarize('starbase', info.starbases)
                        + summarize('star', info.stars)
                    );
                }
                this._widget.cellHtml(x, y, summary);
            }
        }
    }
}


function Game(widgets) {
    var self = this;
    this._widgets = widgets;
    this.galaxy = new Galaxy([10,10], [10,10]);
    this.player = new Starship(self.galaxy);
    this._endTime = 26; defineWatchableValue(this, 'endTime', '_endTime');
    this._time = 0; defineWatchableValue(this, 'time', '_time');
    this.dq = [0,0];
    this.ds = [0,0];
    this._scan = new ScannerDisplay(this._widgets['srs'], this.player);
    this._chart = new StarchartDisplay(this._widgets['starchart'], this.player.starchart);
    
    this._updateDamage = function _updateDamage() {
        var keys = Object.keys(self.player.damaged);
        var total = 0;
        if(self.player.damaged['damage'] > 0) {
            $('#damage-control').addClass('offline');
            for(k in keys) {
                $('#'+keys[k]+'-damage').html('???');
                total += self.player.damaged[keys[k]];
            }
            if(self.player.docked) {
                $('#total-damage').html((total/10).toFixed(1));
            } else {
                $('#total-damage').html('???');
            }
        } else {
            $('#damage-control').removeClass('offline');
            for(k in keys) {
                $('#'+keys[k]+'-damage').html((self.player.damaged[keys[k]]/10).toFixed(1));
                total += self.player.damaged[keys[k]];
            }
            $('#total-damage').html((total/10).toFixed(1));
        }
    }
    
    this._updateWarp = function _updateWarp(value) {
        if(self._widgets['srs'].getMarked() || self._widgets['starchart'].getMarked()) {
            self._widgets['engage'].disabled = !self.player.canMove(self.ds, self.dq);
        } else {
            self._widgets['engage'].disabled = true;
        }
        $('#range').html((self.player.maxRange()/10).toFixed(1));
        var cost = self.player.travelCost(self.ds, self.dq);
        var travelTime = self.player.travelTime(cost);
        if(travelTime > 0) {
            $('#eta').html((travelTime/10).toFixed(1));
        } else {
            $('#eta').html(0.0);
        }
        $('#travel-energy').html(cost);
    }

    this.updateCondition = function updateCondition() {
        var lrs = self.player.longRangeSensors();
        if(lrs[1][1].klingons > 0) {
            $('#condition').html('Red');
            $('body').addClass('red-alert');
            $('#condition').removeClass('green');
            $('#condition').removeClass('yellow');
            $('#condition').addClass('red');
        } else if(self.player.energy < 300) {
            $('#condition').html('Yellow');
            $('body').removeClass('red-alert');
            $('#condition').removeClass('green');
            $('#condition').addClass('yellow');
            $('#condition').removeClass('red');
        } else {
            $('#condition').html('Green');
            $('body').removeClass('red-alert');
            $('#condition').addClass('green');
            $('#condition').removeClass('yellow');
            $('#condition').removeClass('red');
        }
    }
    
    this._quadrantChanged = function _quadrantChanged() {
        self._scan.update();
        self._chart.update();
        var lrs = self.player.longRangeSensors();
        $('#quadrant-klingons').html(lrs[1][1].klingons)
        $('#quadrant-bases').html(lrs[1][1].starbases)
        self._widgets['srs'].clearMark();
        self._widgets['starchart'].clearMark();
        self._scan.clearNeighborMark();
        self._updateWarp();
        self.updateCondition();
    }
    this._newQuadrant = function _newQuadrant() {
        self._quadrantChanged();
        //$('#quadrant-name').html(quadrantName([self.player.quadrant.x, self.player.quadrant.y]));
        //$('#quadrant').html('('+self.player.quadrant.x+','+self.player.quadrant.y+')');
    }
    
    this.klingonsMove = function klingonsMove() {
        for(var i in this.player.quadrant.things) {
            var thing = this.player.quadrant.things[i];
            if(thing.category == 'klingon') {
                thing.move();
                thing.shoot();
            }
        }
    }
    this.klingonsShoot = function klingonsShoot() {
        for(var i in this.player.quadrant.things) {
            var thing = this.player.quadrant.things[i];
            if(thing.category == 'klingon') {
                thing.shoot();
            }
        }
    }
    
    this.checkDead = function checkDead() {
        if(self.player.dead) {
            self._widgets['destroyed-message'].show();
            self._widgets['destroyed-message'].onConfirm = self.newGame;
        } else if(self.time >= self.endTime) {
            self._widgets['time-message'].show();
            self._widgets['time-message'].onConfirm = self.newGame;
        }
    }
    this.doDockedRepairs = function doDockedRepairs() {
        if(!self.player.docked) {
            return;
        }
        var dt = self.player.fullRepair();
        self.time += dt;
        self.klingonsMove();
        self._quadrantChanged();
        self._updateDamage();
        self.checkDead();
        self._widgets['do-repair'].disabled = true;
    }
    this.playerMove = function playerMove() {
        var newQuad = false;
        if(self.dq[0] != self.player.quadrant.x || self.dq[1] != self.player.quadrant.y) {
            newQuad = true;
        }
        if(self.ds[0] == self.player.x && self.ds[1] == self.player.y && !newQuad) {
            return false;
        }
        if(self.player.travelCost(self.ds, self.dq) > self.player.energy) {
            return false;
        }
        var dt = self.player.move(self.ds, self.dq);
        if(dt <= 0) {
            return false;
        }
        self.time += dt;
        if(newQuad) {
            self._newQuadrant();
        } else {
            self.klingonsMove();
            self._quadrantChanged();
        }
        self._updateDamage();
        self.checkDead();
        self.checkTorpedo();
    };
       
    this.checkTorpedo = function checkTorpedo() {
        if(self.player.torpedos > 0 
            && self._widgets['srs'].getMarked() != undefined 
            && self.player.canTorpedoReach(self._widgets['srs'].getMarked())
        ) {
            self._widgets['launch-torpedo'].disabled = false;
        } else {
            self._widgets['launch-torpedo'].disabled = true;
        }
    }
    
    this.launchTorpedo =  function launchTorpedo() {
        if(self._widgets['srs'].getMarked() == undefined) {
            return;
        }
        self.player.launchTorpedo(self._widgets['srs'].getMarked());
        self.klingonsShoot();
        self._quadrantChanged();
        self._updateDamage();
        self.checkDead();
    };
    
    this.firePhasers = function firePhasers() {
        self.player.firePhasers(self._widgets['phasers'].value());
        self.klingonsShoot();
        self._quadrantChanged();
        self._updateDamage();
        self.checkDead();
    }

    this._initWidgets = function() {
        
        this.timeChanged = function timeChanged(value) {
            $('#time').html((value/10).toFixed(1));
        }
        this.endTimeChanged = function endTimeChanged(value) {
            $('#end-time').html((value/10).toFixed(1));
        }
                
        self._widgets['shields'].onchange = function shieldsSliderChanged(value){
            self.player.shieldControl(value);
            self._updateWarp();
        };
        self.player.shieldsChanged = function shieldsChanged(value) {
            self._widgets['shields'].setValue(value);
            self.updateCondition();
        }
        function updatePhasers(value) {
            if(self._widgets['phasers'].value() > self.player.energy) {
                self._widgets['phasers'].setValue(self.player.energy);
            }
        }
        self._widgets['phasers'].onchange = updatePhasers;
        self.player.energyChanged = function energyChanged(value) {
            self._widgets['energy'].setValue(value);
            updatePhasers();
            self._updateWarp();
        }
        self.player.torpedosChanged = function updateTorpedos(value) {
            $("#torpedo-count").html(self.player.torpedos);
            self.checkTorpedo();
        }
        
        self.player.dockedChanged = function dockedChanged(state) {
            if(state) {
                $('#docking').removeClass('disabled');
                $('#docked').html('engaged');
                if(self.player.damaged['damage'] > 0) {
                    self._widgets['do-repair'].disabled = false;
                } else {
                    self._widgets['do-repair'].disabled = true;
                }
            } else {
                $('#docking').addClass('disabled');
                $('#docked').html('closed');
                self._widgets['do-repair'].disabled = true;
            }
        }
        
        self._widgets['srs'].cellClick = function(x,y) {
            self.ds = [x, y];
            self.dq = [self.player.quadrant.x, self.player.quadrant.y];
            self._widgets['srs'].markCell(x,y);
            self._widgets['starchart'].clearMark();
            self._scan.clearNeighborMark();
            self._updateWarp();
            self.checkTorpedo();
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
            var vec = [x-self.player.quadrant.x,y-self.player.quadrant.y];
            vec = normalizeManhattan(vec);
            self._scan.markNeighbor(vec);
            self._updateWarp();
            self.checkTorpedo();
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
            if(value == 0) {
                self._widgets['win-message'].show();
                self._widgets['win-message'].onConfirm = self.newGame;
            }
        }
        self.galaxy.starbasesChanged = function starbasesChanged(value) {
            $('#total-bases').html(value);
        }
        self.galaxy.starsChanged = function starsChanged(value) {
            $('#total-stars').html(value);
        }
        
        self._widgets['engage'].onclick = self.playerMove;
        self._widgets['launch-torpedo'].onclick = self.launchTorpedo;
        self._widgets['fire-phasers'].onclick = self.firePhasers;
        self._widgets['do-repair'].onclick = self.doDockedRepairs;

        //is there a better place?
        this.time = ((random.range(1,21) + 20) * 100) * 10; //decimal fixed point n.1
    };
    this._initWidgets();
    this.newGame = function() {
        self.galaxy.generate();
        self.player.reset();
        self.endTime = self.time + ((25 + random.range(1,11)) * 10); //decimal fixed point n.1
        self.ds = [self.player.x, self.player.y];
        self.dq = [self.player.quadrant.x, self.player.quadrant.y];
        self._newQuadrant();
        self._updateDamage();
    }
}

function setupGame() {
    var game = new Game(initializeWidgets());
    game.newGame();
}

$(document).ready(setupGame);