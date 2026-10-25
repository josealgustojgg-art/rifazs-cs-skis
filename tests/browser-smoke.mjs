import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
const base=process.env.PLANALTO_TEST_URL??'http://127.0.0.1:8086';
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH??'/usr/bin/chromium',headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']});
const errors=[];
try{
 const controller=await browser.newPage({viewport:{width:540,height:1300}});controller.on('pageerror',e=>errors.push(e.message));
 await controller.goto(base);await controller.waitForFunction(()=>document.getElementById('connection-status').textContent.includes('Modo de teste'));
 assert.equal(await controller.locator('canvas').count(),1);assert.equal(await controller.locator('#render-error').isVisible(),false);assert.equal(await controller.locator('#live-username').inputValue(),'soou_jg');
 const capture=await browser.newPage({viewport:{width:1080,height:1920}});capture.on('pageerror',e=>errors.push(e.message));await capture.goto(base+'/?live=1');await capture.waitForFunction(()=>document.body.classList.contains('capture'));
 assert.equal(await capture.locator('#live-panel').isVisible(),false);assert.equal(await capture.locator('.controls').isVisible(),false);
 await controller.click('#reset');await controller.click('[data-gift="turbo"]');
 await controller.waitForFunction(()=>document.getElementById('score-r').textContent==='10');await capture.waitForFunction(()=>document.getElementById('score-r').textContent==='10');
 await controller.click('#pause');await controller.waitForFunction(()=>document.getElementById('state').textContent==='PAUSADA');await capture.waitForFunction(()=>document.getElementById('state').textContent==='PAUSADA');const time=await controller.locator('#timer').textContent();await controller.waitForTimeout(1100);assert.equal(await controller.locator('#timer').textContent(),time);
 assert.equal(await capture.evaluate(()=>Math.round(document.getElementById('app').getBoundingClientRect().width)),1080);assert.equal(await capture.evaluate(()=>Math.round(document.getElementById('app').getBoundingClientRect().height)),1920);
 await capture.screenshot({path:'/tmp/planalto-live-1080x1920.png'});
 await controller.click('#reset');await capture.waitForFunction(()=>document.getElementById('score-r').textContent==='0');assert.equal(await capture.locator('#play-again').count(),0);
 const bad=await controller.evaluate(()=>window.planalto.loadModel('r','/models/absent.glb'));assert.equal(bad,false);
 await controller.setViewportSize({width:360,height:800});assert.equal(await controller.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 assert.deepEqual(errors,[]);console.log('PASS: localhost WebGL, shared race across controller/capture, gifts, pause, reset, 1080×1920, GLB fallback, mobile; no JS errors.');
}finally{await browser.close();}
