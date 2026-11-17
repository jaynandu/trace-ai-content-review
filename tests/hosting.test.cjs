const {test} = require('node:test');
const assert = require('node:assert/strict');
const {execFileSync} = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const root=path.join(__dirname,'..');
test('hosting wrapper serves assets and enforces HTTP policies on every response', async () => {
  execFileSync(process.execPath,['scripts/build-worker.mjs'],{cwd:root});
  const source=fs.readFileSync(path.join(root,'dist/server/index.js'),'utf8');
  const server=(await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'))).default;
  for(const pathname of ['/','/index.html','/app.js','/engine.js','/style.css','/worker.js','/missing']) {
    const response=await server.fetch(new Request('https://example.test'+pathname));
    assert.equal(response.status,pathname==='/missing'?404:200);
    assert.match(response.headers.get('Content-Security-Policy'),/connect-src 'none'/);
    assert.match(response.headers.get('Content-Security-Policy'),/frame-ancestors/);
    assert.equal(response.headers.get('X-Content-Type-Options'),'nosniff');
    assert.equal(response.headers.get('Referrer-Policy'),'no-referrer');
    assert.match(response.headers.get('Permissions-Policy'),/camera=\(\)/);
    if(pathname==='/app.js') assert.match(response.headers.get('Content-Type'),/javascript/);
  }
  assert.equal((await server.fetch(new Request('https://example.test/',{method:'HEAD'}))).body,null);
  assert.equal((await server.fetch(new Request('https://example.test/',{method:'POST',body:'Do not process this'}))).status,405);
  assert.equal((await server.fetch(new Request('https://example.test/.openai/hosting.json'))).status,404);
});
