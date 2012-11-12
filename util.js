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
function normalizeManhattan(vec) {
    var newVec = [vec[0], vec[1]];
    if(newVec[0]) {
        newVec[0] = vec[0]/Math.abs(vec[0]);
    }
    if(newVec[1]) {
        newVec[1] = vec[1]/Math.abs(vec[1]);
    }
    return newVec;
}
function normalToRange(normal, start, end) {
    return start + Math.round(normal*(end-start-1));
}

function _normalToRangeTest() {
    console.log('0-10 0=%s, 1=%s', normalToRange(0, 0, 10), normalToRange(1, 0, 10))
    console.log('5-7 0=%s, 1=%s', normalToRange(0, 5, 7), normalToRange(1, 5, 7))
}
//_normalToRangeTest()

var random = {
    'range':function(start, end) {
        if(!end) {
            end = start;
            start = 0;
        }
        return normalToRange(Math.random(), start, end);
    },
    'choice':function(array) {
        return array[normalToRange(Math.random(), 0, array.length)];
    },
    'shuffle':function(array) {
        for(var i=array.length-1; i!=1;--i) {
            var j = random.range(0,i+1);
            var temp = array[i];
            array[i] = array[j];
            array[j] = temp;
        }
    }
}

function distance(x1,y1, x2, y2) {
    return Math.sqrt(Math.pow(x2-x1,2)+Math.pow(y2-y1,2));
}

function partial( fn /*, args...*/) {
    var aps = Array.prototype.slice,
        args = aps.call( arguments, 1 );

    return function() {
        return fn.apply(this, args.concat(aps.call( arguments )));
    }
}
function parseFloatPrecision(text) {
    var decimal = text.indexOf('.'),
        precision = 0;
    if(decimal > -1) {
        precision = text.length - decimal - 1;
    }
    num = parseFloat(text);
    return {'value':num, 'precision':precision};
}

function roundDecimal(num, precision) {
    return parseFloat(num.toFixed(precision));
}
