import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validateSelections} from '../lib/selection.ts';
const good=[{index:0,score:70,reason:'Clear portrait'},{index:2,score:95,reason:'Natural expression'}];
test('ranks valid selections by score without mutating input',()=>{
  assert.deepEqual(validateSelections(good,2,3).map(item=>item.index),[2,0]);
  assert.equal(good[0].index,0);
});
for(const [name,value] of Object.entries({
  missing:undefined,object:{},null:null,short:[good[0]],extra:[...good,{index:1,score:80,reason:'Good'}],
  duplicate:[good[0],good[0]],negative:[good[0],{...good[1],index:-1}],outOfRange:[good[0],{...good[1],index:3}],
  fractionalIndex:[good[0],{...good[1],index:1.5}],nullItem:[good[0],null],
  missingScore:[good[0],{index:1,reason:'Good'}],stringScore:[good[0],{...good[1],score:'95'}],
  scoreTooHigh:[good[0],{...good[1],score:101}],scoreTooLow:[good[0],{...good[1],score:0}],
  blankReason:[good[0],{...good[1],reason:'   '}],objectReason:[good[0],{...good[1],reason:{}}],
  hugeReason:[good[0],{...good[1],reason:'x'.repeat(2001)}],
}))test(`rejects ${name}`,()=>assert.throws(()=>validateSelections(value,2,3)));
