const test = require('node:test');
const assert = require('node:assert/strict');
function ema(values,p){const a=2/(p+1);let e=values[0];for(let i=1;i<values.length;i++)e=values[i]*a+e*(1-a);return e}
test('EMA calculation is deterministic',()=>assert.equal(Math.round(ema([1,2,3],2)*100)/100,2.56));
test('live trading is disabled by default',()=>assert.equal(String(process.env.LIVE_TRADING_ENABLED||'false'),'false'));
