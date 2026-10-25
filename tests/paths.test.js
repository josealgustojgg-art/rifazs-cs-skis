import {test} from 'node:test';import assert from 'node:assert/strict';import path from 'node:path';import {resolveStaticPath} from '../server/paths.js';
for(const [name,p,base]of [['Windows',path.win32,'C:\\Users\\Jogador\\Downloads\\corrida\\dist'],['Linux',path.posix,'/workspace/corrida/dist']]){
 test(`${name}: serves index and nested game assets`,()=>{
  assert.equal(resolveStaticPath(base,'index.html',p),p.join(base,'index.html'));
  assert.equal(resolveStaticPath(base,'assets/game.js',p),p.join(base,'assets','game.js'));
 });
 test(`${name}: rejects traversal, siblings and absolute paths outside dist`,()=>{
  assert.equal(resolveStaticPath(base,'../package.json',p),null);
  assert.equal(resolveStaticPath(base,'../dist-private/token.json',p),null);
  assert.equal(resolveStaticPath(base,p.resolve(base,'../secret.json'),p),null);
  assert.equal(resolveStaticPath(base,'.',p),null);
 });
}
test('Windows also rejects backslash traversal and other drives',()=>{const base='C:\\game\\dist';assert.equal(resolveStaticPath(base,'..\\server\\index.js',path.win32),null);assert.equal(resolveStaticPath(base,'D:\\secret.txt',path.win32),null);});
