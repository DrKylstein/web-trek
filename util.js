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
        array.sort(function(a,b){return Math.random()});
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
