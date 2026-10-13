const src=require('fs').readFileSync('/home/claude/w/locpicker.js','utf8');
global.window={};global.document={};
new Function('window','document',src+';')(global.window,global.document);
const P=window.LocPicker.parse;
const T=[["18.5204, 73.8567",18.5204,73.8567],["18.5204 73.8567",18.5204,73.8567],["(-33.8688,151.2093)",-33.8688,151.2093],["28°36'50\"N 77°12'32\"E",28.613889,77.208889],["N 28° 36' 50\" E 77° 12' 32\"",28.613889,77.208889],["40.7128° N, 74.0060° W",40.7128,-74.006],["34.05 S 18.42 E",-34.05,18.42],["https://www.google.com/maps/@18.5204,73.8567,12z",18.5204,73.8567],["https://www.google.com/maps/place/Pune/@18.5246,73.8786,11z/data=!3m1!4b1!4m6!3m5!1s0x0:0x0!8m2!3d18.5204!4d73.8567",18.5246,73.8786],["https://www.google.com/maps?q=12.9716,77.5946",12.9716,77.5946],["https://www.google.com/maps/search/?api=1&query=19.076,72.8777",19.076,72.8777],["77.2090, 28.6139",28.6139,77.209],["hello",null],["200, 300",null],["12",null],["Pune 411001",null]];
let bad=0;T.forEach(([t,la,lo])=>{const r=P(t);const ok=la===null?r===null:(r&&Math.abs(r.lat-la)<1e-4&&Math.abs(r.lon-lo)<1e-4);if(!ok){bad++;console.log('FAIL',t,r);}});
console.log('parse tests',T.length,'bad',bad);
