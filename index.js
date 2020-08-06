const core = require('@actions/core');
const github = require('@actions/github')
const context = github.context
const wait = require('./wait');
const cp = require('child_process');
const semver = require('semver')



// most @actions toolkit packages have async methods
async function run() {
  try { 
    const sha = context.sha;
    let commit = cp.execSync(`git log --format=%B -n 1 ${sha}`);
    commit = buffer2String(commit);
    let branch = cp.execSync(`git branch | sed -n '/\* /s///p'`)
    branch = buffer2String(branch)


    console.log(commit, 'commit');
    console.log(branch, 'branch')

    let tag = null
    let increace = ''
    let succeed = false
    const table = {}
    table['key'] = [
      // branch, commit
      ['master', 'init'],
      ['master', 'breaking change'],
      ['master', 'feat'],
      ['master', 'fix'],
      ['master', 'merge N'],
      ['master', 'merge N.N'],
      ['master', 'merge next'],
      ['master', 'merge alpha'],
      ['master', 'merge beta'],
      ['next', 'init'],
      ['next', 'feat'],
      ['next', 'fix'],
      ['next', 'merge N'],
      ['next', 'merge N.N'],
      ['next', 'merge alpha'],
      ['next', 'merge beta'],
      ['N', 'feat'],
      ['N', 'fix'],
      ['N', 'merge N.N'],
      ['N', 'merge alpha'],
      ['N', 'merge beta'],
      ['N.N', 'fix'],
      ['alpha', 'feat'],
      ['alpha', 'fix'],
      ['alpha', 'merge N'],
      ['alpha', 'merge N.N'],
      ['beta', 'feat'],
      ['beta', 'fix'],
      ['beta', 'merge N'],
      ['beta', 'merge N.N']
      ['N', 'init'],
      ['N.N', 'init'],
      ['alpha', 'init'],
      ['beta', 'init']
    ]
    table['value'] = [
      // version
      ['major'],
      ['major'],
      ['minor'],
      ['patch'],
      ['minor'],
      ['patch'],
      ['major'],
      ['major'],
      ['major'],
      ['major'],
      ['minor'],
      ['patch'],
      ['minor'],
      ['patch'],
      ['minor'],
      ['minor'],
      ['minor'],
      ['patch'],
      ['minor'],
      ['minor'],
      ['patch'],
      ['prerelease'],
      ['prerelease'],
      ['prerelease'],
      ['prerelease'],
      ['prerelease'],
      ['prerelease'],
      ['prerelease'],
      ['prerelease'],
      ['major'],
      ['minor'],
      ['prerelease'],
      ['prerelease']
    ]
    switch (branch){
      case 'master': tag='latest'
    }
    const ms = core.getInput('milliseconds');
    core.info(`Waiting ${ms} milliseconds ...`);

    core.debug((new Date()).toTimeString()); // debug is only output if you set the secret `ACTIONS_RUNNER_DEBUG` to true
    await wait(parseInt(ms));
    core.info((new Date()).toTimeString());

    core.setOutput('time', new Date().toTimeString());
  } catch (error) {
    core.setFailed(error.message);
  }
}

function buffer2String(buffer, key='data'){
  let ret = JSON.stringify(buffer);
  ret = JSON.parse(ret);
  ret = ret[key];
  return String.fromCharCode(...ret);
}

function checkDecisionTable(condition, table){
  const keys = table.keys;
  const result = table.value;
  for (let index in keys){
    const isEqual = compare(keys[index], condition);
    if (isEqual) return result[index];
  }
  return null;
}

function compare(a, b){
  if (a.length!==b.length) return false;
  for (let index in a){
    if(a[index]!==b[index]) return false;
  }
  return true;
}

function checkCommitAnalyser(commit, branch){
  //console.log(commit, '---------------')
  let workspace = null;
  let returnCommit = null;
  const subcommits = commit.split(':');
  let head = subcommits[0]
  head = head.replace(/ /g,'');
  //console.log(head, 'head')
  switch (head){
    case 'feat': returnCommit='feat'; break;
    case 'fix': returnCommit='fix'; break;
    case 'init': returnCommit='init'; break;
    case 'breakingchange': 
      returnCommit='breaking change'; break;
  }
  //console.log(returnCommit, 'returnCommit1')
  let rest = null;
  let content = null;
  if (returnCommit===null){
    const tmp = head.slice(0,5);
    //console.log(tmp, tmp.length, tmp==='Merge', 'tmp')
    // merge type
    if (tmp==='Merge') {
      returnCommit = 'merge';
      //rest = commit;
      content = commit
    }
    else return [ null, workspace ];
  }
  else {
    // feat, fix, init, breakingchange type
    rest = subcommits[1];
    let tmp = rest.split('@@');
    if (tmp.length>1) {
      //console.log(tmp[0], tmp[0].length, 'workspace before')
      workspace = tmp[0].replace(/ /g, '');
      //console.log(workspace, workspace.length, 'workspace after')
      content = tmp.slice(1).join('@@');
    }
    else {
      workspace = 'global';
      content = rest;
    }
  }
  //console.log(content, 'content')

  if (returnCommit==='merge'){
    let re = /( |'|")+([0-9]|[a-z]|[A-Z])+@@/
    workspace = re.exec(content);
    if (workspace===null) workspace = 'global';
    else {
      workspace = workspace[0]
      workspace = workspace.replace(/ /g, '');
      workspace = workspace.replace(/@@/g, '');
      workspace = workspace.replace(/'/g, '');
      workspace = workspace.replace(/"/g, '');
    }
    re = /([0-9])+(.(([0-9])+|x))?.x/;
    let versions = multiMatch(re, content);
    //if (!checkVersionValid(versions)) return [ null, workspace ];
    re = /master|next|alpha|beta/;
    versions = versions.concat(multiMatch(re, content));
    //console.log(versions, content, 'versions')
    if (versions.length===0) return [ null, workspace ]
    let mergeBranch = findMergeBranch(versions, branch, workspace);
    if (mergeBranch===null) return [ null, workspace ]
    mergeBranch = extractVersion(mergeBranch)
    //console.log(mergeBranch, 'merge branch')
    if (mergeBranch===null) return [ null, workspace ];
    switch (mergeBranch){
      case 'next': returnCommit='merge next'; break;
      case 'alpha': returnCommit='merge alpha'; break;
      case 'beta': returnCommit='merge beta'; break;
      case 'N': returnCommit='merge N'; break;
      case 'N.N': returnCommit='merge N.N'; break;
      default: returnCommit=null; break;
    }
  }
  return [ returnCommit, workspace]
}

function multiMatch(reg, string){
  let matched='';
  let result = [];
  let limit = 50;
  let cnt = 0
  while (matched!==null && cnt<limit){
    matched = reg.exec(string);
    if (matched!==null) {
      matched = matched[0]
      result.push(matched);
    }
    else break;
    string = string.replace(matched, '');
    cnt++
  }
  return result;
}

function checkVersionValid(versions){
  for (let version of versions){
    if(!semver.valid(version)) return false
  }
  return true
}

function findMergeBranch(branches, localBranch, workspace){
  if (branches.length>2) return null
  for (let branch of branches){
    let tmp = branch
    if (workspace!=='global') tmp = workspace+'@@'+branch
    if (tmp!==localBranch) return branch
  }
  return null
}

function extractVersion(version){
  const parts = version.split('.')
  try{
    if (parts[1]==='x') return 'N';
    if (parts[2]==='x') return 'N.N';
  }
  catch(err){
    console.log(err);
  }
  return version;
  
}

run();

module.exports = {
  multiMatch: multiMatch,
  extractVersion: extractVersion,
  checkCommitAnalyser: checkCommitAnalyser,
}
