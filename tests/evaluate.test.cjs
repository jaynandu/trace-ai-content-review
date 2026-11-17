const {test} = require('node:test');
const assert = require('node:assert/strict');
const {spawnSync} = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const script=path.join(__dirname,'../scripts/evaluate.cjs');
test('evaluation requires documented labels and emits aggregates without source excerpts', () => {
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'trace-eval-'));
  try {
    const file=path.join(dir,'fixture.json');
    // Synthetic test fixtures only: not a validation corpus.
    fs.writeFileSync(file,JSON.stringify([{text:'Synthetic private fixture.',label:'human',source:'Synthetic test fixture, not an empirical human sample',language:'en'}]));
    let r=spawnSync(process.execPath,[script,file],{encoding:'utf8'});
    assert.equal(r.status,0);const report=JSON.parse(r.stdout);
    assert.equal(report.groups.human.samples,1);
    assert.ok(!r.stdout.includes('Synthetic private fixture'));
    fs.writeFileSync(file,JSON.stringify([{text:'No source.',label:'human'}]));
    r=spawnSync(process.execPath,[script,file],{encoding:'utf8'});assert.notEqual(r.status,0);
    r=spawnSync(process.execPath,[script],{encoding:'utf8'});assert.notEqual(r.status,0);
  } finally {fs.rmSync(dir,{recursive:true,force:true});}
});
