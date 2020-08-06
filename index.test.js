const wait = require('./wait');
const process = require('process');
const cp = require('child_process');
const path = require('path');
const { multiMatch, 
        extractVersion,
        checkCommitAnalyser,
        } = require('./index');

test('throws invalid number', async () => {
  await expect(wait('foo')).rejects.toThrow('milliseconds not a number');
});

test('wait 500 ms', async () => {
  const start = new Date();
  await wait(500);
  const end = new Date();
  var delta = Math.abs(end - start);
  expect(delta).toBeGreaterThan(450);
});

// shows how the runner will run a javascript action with env / stdout protocol
test('test runs', () => {
  process.env['INPUT_MILLISECONDS'] = 500;
  const ip = path.join(__dirname, 'index.js');
  //console.log(ip, process.env)
  console.log(cp.execSync(`node ${ip}`, {env: process.env}).toString());
});

test('test multiMatch', () => {
  const commit1 = 'merge 1.2.x to master'
  const commit2 = 'merge 1.2.x to 1.x'
  const commit3 = 'merge v1.2.x to v1.x'
  const re = /([0-9])+(.(([0-9])+|x))?.x/
  console.log(typeof(multiMatch))
  multiMatch(re, commit1)
  expect(multiMatch(re, commit1)).toEqual(['1.2.x'])
  expect(multiMatch(re, commit2)).toEqual(['1.2.x', '1.x'])
  expect(multiMatch(re, commit3)).toEqual(['1.2.x', '1.x'])
  //console.log(multiMatch(re, commit1))
  //console.log(multiMatch(re, commit2))
  //console.log(multiMatch(re, commit3))

})

test('test extractVersion', () => {
  const version1 = '1.2.x'
  const version2 = '1.x'
  const version3 = 'master'
  const version4 = '1.2.3'
  expect(extractVersion(version1)).toBe('N.N')
  expect(extractVersion(version2)).toBe('N')
  expect(extractVersion(version3)).toBe('master')
  expect(extractVersion(version4)).toBe('1.2.3')
}) 

test('test checkCommitAnalyser', ()=>{
  const commit1 = 'init: init commit'
  const commit2 = 'breaking change: new feature'
  const commit3 = 'feat: new feature'
  const commit4 = 'fix: bug #5'
  const commit5 = 'init: module-a @@ init commit'
  const commit6 = 'breaking change: module-b @@ new feature'
  const commit7 = 'feat: module c @@ new feature'
  const commit8 = 'fix: module d @@ bug #5'
  const commit9 = 'Merge pull request #98 from XXX/v1.0.x'
  const commit10 = "Merge branch 'master' of github.com:XXX/ABC"
  const commit11 = "Merge branch 'abc@@v1.0.x'"
  const commit12 = "Merge branch abc@@v1.x"
  const commit13 = "Merge branch abc@@v1.x.3"
  const commit14 = "Merge branch next"
  const commit15 = "Merge branch alpha"
  const commit16 = "Merge branch beta"
  const commit17 = "Merge branch abc@@next"
  const commit18 = "Merge branch abc@@alpha"
  const commit19 = "Merge branch abc@@beta"
  expect(checkCommitAnalyser(commit1, 'master'))
  .toEqual(['init', 'global'])
  expect(checkCommitAnalyser(commit2, 'master'))
  .toEqual(['breaking change', 'global'])
  expect(checkCommitAnalyser(commit3, 'master'))
  .toEqual(['feat', 'global'])
  expect(checkCommitAnalyser(commit4, 'master'))
  .toEqual(['fix', 'global'])
  expect(checkCommitAnalyser(commit5, 'master'))
  .toEqual(['init', 'module-a'])
  expect(checkCommitAnalyser(commit6, 'master'))
  .toEqual(['breaking change', 'module-b'])
  expect(checkCommitAnalyser(commit7, 'master'))
  .toEqual(['feat', 'modulec'])
  expect(checkCommitAnalyser(commit8, 'master'))
  .toEqual(['fix', 'moduled'])
  expect(checkCommitAnalyser(commit9, 'master'))
  .toEqual(['merge N.N', 'global'])
  expect(checkCommitAnalyser(commit10, 'master'))
  .toEqual([null, 'global'])
  expect(checkCommitAnalyser(commit10, 'next'))
  .toEqual([null, 'global'])
  expect(checkCommitAnalyser(commit11, 'master'))
  .toEqual(['merge N.N', 'abc'])
  expect(checkCommitAnalyser(commit12, 'master'))
  .toEqual(['merge N', 'abc'])
  expect(checkCommitAnalyser(commit13, 'master'))
  .toEqual(['merge N', 'abc'])
  expect(checkCommitAnalyser(commit14, 'master'))
  .toEqual(['merge next', 'global'])
  expect(checkCommitAnalyser(commit14, 'next'))
  .toEqual([null, 'global'])
  expect(checkCommitAnalyser(commit15, 'master'))
  .toEqual(['merge alpha', 'global'])
  expect(checkCommitAnalyser(commit16, 'master'))
  .toEqual(['merge beta', 'global'])
  expect(checkCommitAnalyser(commit17, 'master'))
  .toEqual(['merge next', 'abc'])
  expect(checkCommitAnalyser(commit18, 'master'))
  .toEqual(['merge alpha', 'abc'])
  expect(checkCommitAnalyser(commit19, 'master'))
  .toEqual(['merge beta', 'abc'])
  expect(checkCommitAnalyser(commit19, 'abc@@beta'))
  .toEqual([null, 'abc'])
})