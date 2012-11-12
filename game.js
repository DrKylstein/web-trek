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
-fix hitscan!
-klingons are actually pretty tough when they have the opportunity to shoot.
*/
function Galaxy(size, qSize) {
    this.quadrants = new Array();
    this.width = size[0];
    this.height = size[1];
    this.qSize = qSize;
    this.klingons = 0;
    this.starbases = 0;
    this.stars = 0;
    for(var y=0; y<this.height; ++y) {
        this.quadrants.push(new Array());
        for(var x=0; x<this.width; ++x) {
            var quadrant = {'klingons':0, 'stars':0, 'starbases':0};
            this.quadrants[y].push(quadrant);
        }
    }
    this.generate = function generate() {
        this.klingons = 0;
        this.starbases = 0;
        this.stars = 0;
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
                this.klingons += quadrant['klingons'];
                if(random.range(1,101) > 96) {
                    quadrant['starbases'] = 1;
                }
                this.starbases += quadrant['starbases'];
                quadrant['stars'] = random.range(1,this.qSize[0]);
                this.stars += quadrant['stars'];
                this.quadrants[y][x] = quadrant;
            }
        }
        if (this.starbases == 0) {
            var x = random.range(this.width);
            var y = random.range(this.height);
            this.quadrants[y][x]['starbases'] = 1;
            this.starbases += 1;
        }
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
    
    //classic names: aaaabccdpprrsssv
    //unused letters: efghijklmnoqtuwxyz
    //new names: efkn
    this._starNames = new Array(
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
    this._numerals = new Array('I', 'II', 'III', 'IV', 'V');

    this.quadrantName = function quadrantName(q) {
        var nameIndex = q[1]*2;
        if(q[0] > this.width/2) {
            ++nameIndex;
        }
        var numeralIndex = q[0] % (this.width/2);
        return this._starNames[nameIndex]+' '+this._numerals[numeralIndex];
    }
    
}
function Quadrant(galaxy, pos, size, ships) {
    this._galaxy = galaxy;
    this.x = pos[0];
    this.y = pos[1];
    this.width = size[0];
    this.height = size[1];
    this.things = ships;
    this.__defineGetter__('klingons', function getKlingons() {
        var total = 0;
        for(var i in this.things) {
            if(this.things[i].category == 'klingon') {
                total++;
            }
        }
        return total;
    });
    this.__defineGetter__('starbases', function getStarbases() {
        var total = 0;
        for(var i in this.things) {
            if(this.things[i].category == 'starbase') {
                total++;
            }
        }
        return total;
    });
    this.__defineGetter__('stars', function getStars() {
        var total = 0;
        for(var i in this.things) {
            if(this.things[i].category == 'star') {
                total++;
            }
        }
        return total;
    });
    this.emptySpots = function emptySpots() {
        var occupied = false;
        var freeCells = new Array();
        for(var x=0;x<this.width;++x) {
            for(var y=0;y<this.height;++y) {
                if(this.sectorContents([x, y])) {
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
    this.sectorContents = function sectorContents(pos) {
        for(i in this.things) {
            if(this.things[i].x == pos[0] && this.things[i].y == pos[1]) {
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
    this.hitScan = function hitscan(origin, dest) {
        var hitCells = new Array();
        var major = 0;
        var minor = 1;
        if(Math.abs(dest[1] - origin[1]) > Math.abs(dest[0] - origin[0])) {
            major = 1;
            minor = 0;
        }
        var majStep = 1; 
        if(origin[major] > dest[major]) {
            majStep = -1;
        }
        var delta = new Array();
        delta[major] = dest[major]-origin[major]; 
        delta[minor] = Math.abs(dest[minor]-origin[minor]);
        var error = delta[major]/2;
        var minStep = 0;
        var minC = origin[minor];
        if(origin[minor] < dest[minor]) {
            minStep = 1;
        } else if(origin[minor] > dest[minor]) {
            minStep = -1;
        }
        var lastCell;
        console.log('hitscan from (%d,%d) to (%d,%d)', origin[0], origin[1], dest[0], dest[1]);
        for(var majC=origin[major]; majC*majStep<=dest[major]*majStep; majC+=majStep) {
            var lastCell = new Array();
            lastCell[major] = majC;
            lastCell[minor] = minC;
            hitCells.push(lastCell);
            console.log(lastCell/*,this.sectorContents(lastCell)*/);
            if(!(lastCell[0] == origin[0] && lastCell[1] == origin[1]) && this.sectorContents(lastCell) != undefined) {
                if(hitCells.length > 1) {
                    return [hitCells[hitCells.length-2], lastCell];
                }
                return [origin, lastCell];
            }
            error -= delta[minor];
            if(error < 0) {
                minC += minStep;
                error += delta[major];
            }
        }
        return false;
    };
}

function Starchart(w,h) {
    this.width = w;
    this.height = h;
    this.enabled = true;
    this._info = new Array();
    for(var y=0;y<w;++y) {
        this._info.push(new Array())
        for(var x=0;x<w;++x) {
            this._info[y].push(undefined);
        }
    }
    this.update = function update(quadrant, lrs) {
        if(!this.enabled) {
            return;
        }
        for(var dy=-1;dy<=1;++dy) {
            for(var dx=-1;dx<=1;++dx) {
                var x = quadrant.x + dx;
                var y = quadrant.y + dy;
                if(x < 0 || x >= this.width ||
                    y < 0 || y >= this.height) {
                    continue;
                }
                if(dx == 0 && dy == 0) {
                    this._info[y][x] = {
                        'klingons':quadrant.klingons, 
                        'starbases':quadrant.starbases, 
                        'stars':quadrant.stars};
                } else if(lrs != undefined) {
                    this._info[y][x] = lrs[dy+1][dx+1];
                }
            }
        }
    }
    this.getQuadrant = function getQuadrant(x,y) {
        if(!this.enabled) {
            return undefined;
        }
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
    this.starchart = new Starchart(this._galaxy.width,this._galaxy.height);
    this.x = 0;
    this.y = 0;
    this.quadrant = this._galaxy.getQuadrant(0, 0);
    this.energy = _MAX_ENERGY;
    this.shields = 0;
    this.torpedos = _MAX_TORPEDOS;
    this.dead = false;
    this.damaged = {'engines':0, /*'srs':0,*/ 'lrs':0, 'phasers':0, 'torpedos':0, 'damage':0, 'shields':0, 'library':0}
    this.docked = false;
    
    this.reset = function reset() {
        this.x = random.range(this._galaxy.qSize[0]);
        this.y = random.range(this._galaxy.qSize[1]);
        this.shields = 0;
        this.energy = _MAX_ENERGY;
        this.torpedos = _MAX_TORPEDOS;
        this.dead = false;
        this.quadrant = this._galaxy.getQuadrant(random.range(this._galaxy.width), random.range(this._galaxy.height), [this]);
        this.fullRepair();
        this.starchart.clear();
        this.starchart.update(this.quadrant, this.longRangeSensors());
        this.docked = false;
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
        this.docked = false;
        for(var i in this.quadrant.things) {
            if(this.quadrant.things[i].category == 'starbase') {
                if(Math.abs(this.quadrant.things[i].x - this.x) <= 1 &&
                Math.abs(this.quadrant.things[i].y - this.y) <= 1) {
                    this.docked = true;
                    this.energy = _MAX_ENERGY;
                    this.torpedos = _MAX_TORPEDOS;
                    this.shields = 0;
                }
            }
        }
    }
    
    this.maxRange = function maxRange() {
        if(this.shields > 0) {
            return 1; //cannot exceed warp 0.1 with shields up
        }
        if(this.damaged['engines']) {
            return 2; //cannot exceed warp 0.2 when engines are damaged
        }
        return Math.min(this.energy, this._galaxy.unifiedCoordinates([1,0], [this._galaxy.width, 0])[0]);
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
        if(qDest[0] == this.quadrant.x && qDest[1] == this.quadrant.y) {
            //console.log('intraquadrant travel');
            var hitPos = this.quadrant.hitScan([this.x, this.y], dest)[0];
            if(hitPos) {
                dest = hitPos;
            }
        }
        var cost = this.travelCost(dest, qDest);

        this.energy -= cost;
        this.x = dest[0];
        this.y = dest[1];
        if(this.quadrant.x != qDest[0] || this.quadrant.y != qDest[1]) {
            this.quadrant = this._galaxy.getQuadrant(qDest[0], qDest[1], [this]);
            this.starchart.update(this.quadrant, this.longRangeSensors());
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
        if(this.torpedos > 0 && this.damaged['torpedos'] == 0) {
            --this.torpedos;
            var hitPos = this.quadrant.hitScan([this.x, this.y], pos);
            if(hitPos) {
                pos = hitPos[1];
            }
            var target = this.quadrant.sectorContents(pos);
            if(target != undefined && target != this) {
                target.damage(10000);
                return target;
            }
        }
        return false;
    };
    
    this.firePhasers = function firePhasers(amount) {
        var report = new Array();
        if (this.energy - amount >= 0 && this.damaged['phasers'] == 0) {
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
                    report.push({'target':targets[i], 'damage':damage});
                    targets[i].damage(damage);
                }
            }
        }
        return report;
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
        this.starchart.enabled = (this.damaged.library == 0);
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
        this.starchart.enabled = (this.damaged.library == 0);
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
        this.starchart.enabled = (this.damaged.library == 0);
        return dt;
    }
    
    this.longRangeSensors = function longRangeSensors() {
        if(this.damaged.lrs > 0) {
            return;
        }
        var longRange = new Array();
        for(var y=-1;y<=1;++y) {
            longRange.push(new Array());
            for(var x=-1;x<=1;++x) {
                if(this.quadrant.x+x < 0 || this.quadrant.x+x >= this._galaxy.width ||
                    this.quadrant.y+y < 0 || this.quadrant.y+y >= this._galaxy.height) {
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
                return damage;
            }
        }
        return 0;
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

function ScannerDisplay(widget, player) {
    var self = this;
    this._widget = widget;
    this._player = player;
    this._marked = [0,0];
    this._damageAnims = new Array();
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
    this.animateDamage = function animateDamage(pos, amount) {
        //this._widget.cellHtml(pos[0], pos[1], 'amount');
        //this._damageAnims.push({'pos':pos, 'amount':amount})
        var cell = this._widget.cells[pos[1]][pos[0]]
        function thenBackInAgain() {
            $(cell).fadeIn();
        }
        $(cell).fadeOut(thenBackInAgain);
    }
    this.update = function() {
        for(var x=0;x<this._player.quadrant.width;++x) {
            for(var y=0;y<this._player.quadrant.height;++y) {
                this._widget.cellHtml(x, y, '')
            }
        }
        things = this._player.quadrant.things;
        for(var i in things) {
            this._widget.cellHtml(things[i].x, things[i].y, 
                this._symbolIcons[things[i].category]);
        }
        function summarize(category, count) {
            if(count) {
                return '<span class='+category+'>'+count+'</span>';
            }
            return '';
        }
        lrs = this._player.longRangeSensors();
        if(lrs == undefined) {
            for(var dx=-1;dx<=1;++dx) {
                for(var dy=-1;dy<=1;++dy) {
                    if(!(dx == 0 && dy == 0)) {
                        this._summaries['('+dx+','+dy+')'].innerHTML = '?';
                    }
                }
            }
        } else{
            for(var dx=-1;dx<=1;++dx) {
                for(var dy=-1;dy<=1;++dy) {
                    if(lrs[dy+1][dx+1] == undefined) {
                        this._summaries['('+dx+','+dy+')'].innerHTML = '&nbsp;';
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
    this.galaxy = new Galaxy([8,8], [8,8]);
    this.player = new Starship(self.galaxy);
    this.endTime = 26;
    this.time = ((random.range(1,21) + 20) * 100) * 10; //decimal fixed point n.1

    this.dq = [0,0];
    this.ds = [0,0];
    this._scan = new ScannerDisplay(this._widgets['srs'], this.player);
    this._chart = new StarchartDisplay(this._widgets['starchart'], this.player.starchart);
    
    this.playersTurn = false;
        
    this.klingonsMove = function klingonsMove() {
        for(var i in this.player.quadrant.things) {
            var thing = this.player.quadrant.things[i];
            if(thing.category == 'klingon') {
                thing.move();
            }
        }
        this.klingonsShoot();
    }
    this.klingonsShoot = function klingonsShoot() {
        for(var i in this.player.quadrant.things) {
            var thing = this.player.quadrant.things[i];
            if(thing.category == 'klingon') {
                var damage = thing.shoot();
                self._scan.animateDamage([self.player.x, self.player.y]);
                //self._widgets['tactical-log'].log('Recieved '+damage.toFixed(1)+' units of damage from Klingon at ('+thing.x+', '+thing.y+').');
            }
        }
    }
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
        if(self.player.damaged['shields'] > 0) {
            self._widgets['shields'].disabled = true;
            $('#shields-section').addClass('offline');
        } else {
            self._widgets['shields'].disabled = false;
            $('#shields-section').removeClass('offline');
        }
        if(self.player.damaged['library'] > 0) {
            $('#starchart').addClass('offline');
        } else {
            $('#starchart').removeClass('offline');
        }
    }
    
    this._updateWarp = function _updateWarp(value) {
        if(self._widgets['srs'].getMarked() || self._widgets['starchart'].getMarked()) {
            self._widgets['engage'].disabled = !self.player.canMove(self.ds, self.dq);
        } else {
            self._widgets['engage'].disabled = true;
        }
        $('#range').html((self.player.maxRange()));
        var cost = self.player.travelCost(self.ds, self.dq);
        var travelTime = self.player.travelTime(cost);
        if(travelTime > 0) {
            $('#eta').html((travelTime/10).toFixed(1));
        } else {
            $('#eta').html(0.0);
        }
        $('#travel-energy').html(cost);
        if(self.player.damaged['engines'] > 0) {
            $('#engines-section').addClass('offline');
        } else {
            $('#engines-section').removeClass('offline');
        }
    }

    this._updateCondition = function _updateCondition() {
        if(self.player.quadrant.klingons) {
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
    
    this._updateQuadrant = function _updateQuadrant() {
        self._scan.update();
        self._chart.update();
        var lrs = self.player.longRangeSensors();
        self._widgets['srs'].clearMark();
        self._widgets['starchart'].clearMark();
        self._scan.clearNeighborMark();
        function zeroPad(n) {
            if(n > 9) {
                return n.toString();
            }
            return '0'+n;
        }
        $('#location').html(self.galaxy.quadrantName([self.player.quadrant.x, self.player.quadrant.y]));
        $('#position').html('('+zeroPad(self.player.quadrant.x+1)+', '+zeroPad(self.player.quadrant.y+1)+')');
    }
    
    this._checkDead = function _checkDead() {
        if(self.player.dead) {
            self._widgets['destroyed-message'].show();
            self._widgets['destroyed-message'].onConfirm = self.newGame;
        } else if(self.time >= self.endTime) {
            self._widgets['time-message'].show();
            self._widgets['time-message'].onConfirm = self.newGame;
        } else if(self.galaxy.klingons == 0) {
            self._widgets['win-message'].show();
            self._widgets['win-message'].onConfirm = self.newGame;
        }
    }
    
    self._updateArms = function shieldsChanged() {
        self._widgets['shields'].setValue(self.player.shields);
        self._widgets['energy'].setValue(self.player.energy);
        self._widgets['shields'].setMax(self._widgets['shields'].value() + self.player.energy);

        self._widgets['phasers'].setMax(self.player.energy);
        if(self.player.damaged['phasers'] > 0) {
            self._widgets['fire-phasers'].disabled = true;
            $('#phasers-section').addClass('offline');
        } else {
            self._widgets['fire-phasers'].disabled = false;
            $('#phasers-section').removeClass('offline');
        }
        
        $("#torpedo-count").html(self.player.torpedos);
        if(self.player.damaged['torpedos'] == 0) {
            $('#torpedo-section').removeClass('offline');
        } else {
            $('#torpedo-section').addClass('offline');
        }
    }
    self._updateTargeting = function _updateTargeting() {
        if(self.player.torpedos > 0 
            && self._widgets['srs'].getMarked() != undefined
            && self.player.damaged['torpedos'] == 0
        ) {
            self._widgets['launch-torpedo'].disabled = false;
        } else {
            self._widgets['launch-torpedo'].disabled = true;
        }
    }
    
    self._updateDocked = function _updateDocked() {
        if(self.player.docked) {
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
    
    self._updateTotals = function _updateTotals() {
        $('#total-klingons').html(self.galaxy.klingons);
        $('#total-bases').html(self.galaxy.starbases);
        $('#time').html((self.time/10).toFixed(1));
        $('#end-time').html(((self.endTime-self.time)/10).toFixed(1));
    }

    
    this._updateDisplays = function updateDisplays() {
        self._updateDamage();
        self._updateWarp();
        self._updateCondition();
        self._updateQuadrant();
        self._updateArms();
        self._updateTargeting();
        self._updateDocked();
        self._updateTotals();
    }

    this._launchTorpedo =  function launchTorpedo() {
        if(self._widgets['srs'].getMarked() == undefined) {
            return -1;
        }
        var result = self.player.launchTorpedo(self._widgets['srs'].getMarked());
        if(result == false) {
            self._scan.animateDamage(self._widgets['srs'].getMarked());
        } else {
            self._scan.animateDamage([result.x, result.y]);
        }
        return 0;
    };
        
    this._doDockedRepairs = function doDockedRepairs() {
        if(!self.player.docked) {
            return -1;
        }
        var dt = self.player.fullRepair();
        self._widgets['do-repair'].disabled = true;
        return dt;
    }
    
    this._playerMove = function playerMove() {
        var newQuad = true;
        if(self.dq[0] == self.player.quadrant.x 
            && self.dq[1] == self.player.quadrant.y) {
            newQuad = false;
            if(self.ds[0] == self.player.x 
                && self.ds[1] == self.player.y) {
                return -1;
            }
        }
        if(self.player.travelCost(self.ds, self.dq) > self.player.energy) {
            return -1;
        }
        var dt = self.player.move(self.ds, self.dq);
        if(dt <= 0) {
            return -1;
        }
        return [dt, newQuad];
    };
    
    this._firePhasers = function firePhasers() {
        var report = self.player.firePhasers(self._widgets['phasers'].value());
        for(var i in report) {
            self._scan.animateDamage([report[i].target.x, report[i].target.y]);
        }
        return 0;
    }

    
    this.doPlayerTurn = function doPlayerTurn(action) {
        var dt = 0;
        switch(action) {
            case 'pha':
                dt = self._firePhasers();
                if(dt >= 0) {
                    self.klingonsShoot();
                }
                break;
            case 'tor':
                dt = self._launchTorpedo();
                if(dt >= 0) {
                    self.klingonsShoot();
                }
                break;
            case 'mov':
                var result = self._playerMove();
                dt = result[0];
                if(dt >= 0 && !result[1]) {
                    self.klingonsMove();
                }
                break;
            case 'dam':
                dt = self._doDockedRepairs();
                if(dt >= 0) {
                    self.klingonsMove();
                }
                break;
            case 'she':
                self.player.shieldControl(self._widgets['shields'].value());
                break;
        }
        console.log(dt);
        if(dt > 0) {
            self.time += dt;
        }
        self._updateDisplays();
        self._checkDead();
    }
    
    /*this.do_turn = function do_turn() {
        self.playersTurn  = true;
    }*/
        
    this._initWidgets = function() {
                        
        self._widgets['srs'].cellClick = function(x,y) {
            self.ds = [x, y];
            self.dq = [self.player.quadrant.x, self.player.quadrant.y];
            self._widgets['srs'].markCell(x,y);
            self._widgets['starchart'].clearMark();
            self._scan.clearNeighborMark();
            self._updateWarp();
            self._updateTargeting();
        };
        
        function selectQuadrant(x,y) {
            if(x > self.dq[0]) {
                self.ds[0] = 0;
            } else if(x < self.dq[0]) {
                self.ds[0] = self.player.quadrant.width-1;
            } else {
                self.ds[0] = self.player.x;
            }
            if(y > self.dq[1]) {
                self.ds[1] = 0;
            } else if(y < self.dq[1]){
                self.ds[1] = self.player.quadrant.height-1;
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
        };
        self._scan.neighborClicked = function neighborClicked(dx,dy) {
            var x = self.player.quadrant.x+dx;
            var y = self.player.quadrant.y+dy
            if(x < 0 || x > self.galaxy.width) {
                return;
            }
            if(y < 0 || y > self.galaxy.height) {
                return;
            }
            selectQuadrant(x, y);
        };
        self._widgets['starchart'].cellClick = selectQuadrant;
                                
        
        self._widgets['engage'].onclick = partial(self.doPlayerTurn, 'mov');
        self._widgets['launch-torpedo'].onclick = partial(self.doPlayerTurn, 'tor');
        self._widgets['fire-phasers'].onclick = partial(self.doPlayerTurn, 'pha');
        self._widgets['do-repair'].onclick = partial(self.doPlayerTurn, 'dam');
        self._widgets['shields'].onchange = partial(self.doPlayerTurn, 'she');
    };
    this._initWidgets();
    this.newGame = function() {
        self.galaxy.generate();
        self.player.reset();
        self.endTime = self.time + ((25 + random.range(1,11)) * 10); //decimal fixed point n.1
        self.ds = [self.player.x, self.player.y];
        self.dq = [self.player.quadrant.x, self.player.quadrant.y];
        self._updateDisplays();
    }
}

function setupGame() {
    var game = new Game(initializeWidgets());
    game.newGame();
}

$(document).ready(setupGame);