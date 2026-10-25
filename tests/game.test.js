import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Race,CONFIG} from '../src/game.js';
test('180 second round ends in a tie without gifts',()=>{const race=new Race();race.update(180);assert.equal(race.time,0);assert.equal(race.ended,true);assert.equal(race.winner,null);assert.equal(race.runners.r.distance,0);});
test('gifts provide temporary speed and points',()=>{const race=new Race();race.gift('r','turbo');race.update(3);assert.equal(race.runners.r.score,10);assert.ok(race.runners.r.distance>race.runners.g.distance);assert.equal(race.runners.r.boost,0);const gap=race.runners.r.distance-race.runners.g.distance;race.update(2);assert.ok(Math.abs(race.runners.r.distance-race.runners.g.distance-gap)<.0001);});
test('pause rejects gifts and freezes clock',()=>{const race=new Race();race.toggle();assert.equal(race.gift('r','rose'),false);race.update(20);assert.equal(race.time,180);});
test('finish, reset and automatic restart',()=>{const race=new Race();race.gift('g','special');race.update(180);assert.equal(race.winner,'g');assert.equal(race.gift('r','rose'),false);race.autoRestart=true;race.update(CONFIG.autoRestartDelay);assert.equal(race.round,2);assert.equal(race.ended,false);assert.equal(race.runners.g.score,0);});
test('invalid events ignored and progress bounded',()=>{const race=new Race();assert.equal(race.gift('x','special'),false);assert.equal(race.gift('r','unknown'),false);race.update(NaN);assert.equal(race.time,180);for(let i=0;i<20;i++){race.gift('r','special');race.update(1);}assert.ok(race.runners.r.distance<=100);});

test('every gift contributes distance, including repeated gifts',()=>{const race=new Race();for(let i=0;i<10;i++)race.gift('r','rose');race.update(10);assert.ok(Math.abs(race.runners.r.distance-1)<1e-9);assert.equal(race.runners.g.distance,0);});

test('finish requires 1000 gift points with slower progression',()=>{const race=new Race();for(let i=0;i<39;i++)race.gift('r','special');race.update(156);assert.equal(race.ended,false);assert.equal(race.runners.r.distance,97.5);race.gift('r','special');race.update(4);assert.equal(race.ended,true);assert.equal(race.runners.r.distance,100);assert.equal(race.runners.r.score,1000);});

test('new default automatically restarts one second after victory',()=>{const race=new Race();assert.equal(race.autoRestart,true);race.gift('r','turbo');race.update(180);assert.equal(race.winner,'r');assert.equal(race.ended,true);race.update(.9);assert.equal(race.ended,true);race.update(.11);assert.equal(race.ended,false);assert.equal(race.round,2);assert.equal(race.time,180);assert.equal(race.runners.r.score,0);});
