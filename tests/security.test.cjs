const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const read = file => fs.readFileSync(path.join(__dirname,'..',file),'utf8');

test('static app restricts external connections and removes remote assets', () => {
  const html=read('dist/index.html');
  assert.match(html,/http-equiv="Content-Security-Policy"/);
  for(const rule of ["script-src 'self'", "worker-src 'self'", "connect-src 'none'", "object-src 'none'", "base-uri 'none'"]) assert.ok(html.includes(rule));
  assert.ok(!read('dist/style.css').includes('@import'));
  assert.ok(!/https?:/.test(read('dist/style.css')));
  assert.ok(!/Private access/.test(html));
  assert.ok(html.includes('spellcheck="false"'));
});
test('app contains no HTML parsing sink, eval, persistence, or text network request', () => {
  const app=read('dist/app.js');
  assert.ok(!/innerHTML|outerHTML|insertAdjacentHTML|document\.write|\beval\s*\(|localStorage|sessionStorage|\bfetch\s*\(|XMLHttpRequest|sendBeacon/.test(app));
  assert.match(app,/createTextNode/);
});
test('worker returns a review and returns validation errors as data', () => {
  const context={self:{}, Intl};
  vm.createContext(context);
  context.importScripts=()=>vm.runInContext(read('dist/engine.js'),context);
  let output;
  context.self.postMessage=data=>{output=data;};
  vm.runInContext(read('dist/worker.js'),context);
  context.self.onmessage({data:{id:1,text:'Hello world.',language:'en'}});
  assert.equal(output.id,1);
  assert.equal(output.review.wordCount,2);
  context.self.onmessage({data:{id:2,text:'a'.repeat(100001),language:'en'}});
  assert.match(output.error,/limit/);
});
test('app displays imported markup using text nodes and invalidates stale results', async () => {
  class Node {
    constructor(){this.value='';this.textContent='';this.children=[];this.hidden=false;this.checked=false;this.files=[];this.listeners={};}
    append(...nodes){this.children.push(...nodes);}
    replaceChildren(...nodes){this.children=nodes;}
    addEventListener(name,callback){this.listeners[name]=callback;}
    focus(){} click(){} remove(){} showModal(){} close(){}
  }
  const nodes=new Map();
  const get=id=>{if(!nodes.has(id))nodes.set(id,new Node());return nodes.get(id);};
  const workers=[];const downloads=[];
  const context={Intl,Blob,console,setTimeout,clearTimeout,
    document:{getElementById:get,createElement:()=>new Node(),createTextNode:text=>({textContent:text}),body:new Node()},
    URL:{createObjectURL:blob=>{downloads.push(blob);return 'blob:test';},revokeObjectURL(){}},
    Worker:class{constructor(){workers.push(this);}postMessage(data){this.data=data;}terminate(){this.terminated=true;}}
  };
  vm.createContext(context);vm.runInContext(read('dist/engine.js'),context);vm.runInContext(read('dist/app.js'),context);
  get('language').value='en';get('language').listeners.change();
  get('content').value='<img src=x onerror=alert(1)> Furthermore, it is important to note this. In conclusion, rest.';
  get('content').listeners.input();get('analyze').onclick();
  const worker=workers.at(-1);
  worker.onmessage({data:{id:worker.data.id,review:context.TraceEngine.analyze(worker.data.text)}});
  assert.equal(get('results').hidden,false);
  get('export').onclick();
  const report=JSON.parse(await downloads.at(-1).text());
  assert.equal(report.passages,undefined);
  assert.equal(report.excerptsIncluded,false);
  // Source markup is held as text on a leaf, never as parsed child elements.
  const flatten=n=>[n.textContent,...n.children?.flatMap(flatten)||[]].filter(Boolean).join(' ');
  assert.match(flatten(get('passages')),/Further/);
  get('content').value='Changed text.';get('content').listeners.input();
  assert.equal(get('results').hidden,true);
  get('analyze').onclick();const stale=workers.at(-1);
  get('clear').onclick();
  stale.onmessage({data:{id:stale.data.id,review:context.TraceEngine.analyze('Old content.')}});
  assert.equal(get('results').hidden,true);
  assert.equal(stale.terminated,true);
  get('language').value='other';get('language').listeners.change();
  assert.equal(get('analyze').disabled,true);
  assert.match(get('message').textContent,/Unsupported/);
  get('file').files=[{name:'bad.html',size:10,text:async()=>'<h1>Bad</h1>'}];
  await get('file').onchange();assert.match(get('message').textContent,/txt/);
  let finish;
  get('file').files=[{name:'slow.txt',size:10,text:()=>new Promise(resolve=>finish=resolve)}];
  const pending=get('file').onchange();get('clear').onclick();finish('late text');await pending;
  assert.equal(get('content').value,'');
});
