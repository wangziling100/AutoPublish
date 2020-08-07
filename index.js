const core = require('@actions/core');
const github = require('@actions/github')
const context = github.context
//const wait = require('./wait');
const cp = require('child_process');
//const semver = require('semver')



// most @actions toolkit packages have async methods
async function run() {
  try { 
    const sha = context.sha;
    let commit = cp.execSync(`git log --format=%B -n 1 ${sha}`);
    commit = buffer2String(commit);
    let branch = cp.execSync(`git branch | sed -n '/* /s///p'`)
    branch = buffer2String(branch)
    branch = branch.replace(/\n/g, '')


    //console.log(commit, 'commit');
    //console.log(branch, 'branch');
    //console.log(context, 'context')
    const {email, name} = context.payload.pusher;

    let tag = null;
    let increace = '';
    //let succeed = false;
    let cmd = null;
    
    const [commit_key, commit_workspace] = checkCommitAnalyser(commit, branch);
    const branchInfo = getInfoFromBranch(branch);
    //console.log('branchInfo', branch, branchInfo, commit_workspace)
    //if (branchInfo.workspace!==commit_workspace) process.exit(-1);
    increace = checkDecisionTable([branchInfo.branch, commit_key], table);
    tag = getTagFromBranch(branchInfo.branch);
    cmd = getCMD( branchInfo.branch, 
                  commit_workspace,
                  increace,
                  tag )
    console.log(cmd, 'cmd')
    if (cmd!==null) runCMD(cmd, email, name)
    else {
      core.setFailed('publish failed')
      //process.exit(-1)
    }
    
  } catch (error) {
    core.setFailed(error.message);

  }
}

function getCMD(branch, workspace, increace, tag){
  let preid = '';
  let cmd = '';
  if (branch===null || 
      workspace===null || 
      increace===null || 
      tag===null){
    return null
  }

  if (increace==='prerelease') {
    preid = ' --preid ' + branch
  }

  if (workspace==='global'){
    cmd = 'yarn publish --' 
              + increace
              + preid
              + ' --tag '
              + tag
              + ' --access '
              + 'public'
              + ' --no-interactive'
  }
  else { 
    cmd = 'yarn workspace '
            + workspace 
            + ' publish --'
            + increace
            + preid
            + ' --tag '
            + tag
            + ' --access '
            + 'public'
            + ' --no-interactive'
  }
  return cmd
}

function runCMD(cmd, email, name){
  const token = process.env.NPM_TOKEN
  const loginCMD = `npm config set '//registry.npmjs.org/:_authToken' "`
                    +token
                    +`"`
  const gitConfCMD = `git config --global user.email "`
                      + email
                      + `" && git config --global user.name "`
                      + name
                      + `"`
  //console.log(gitConfCMD)
  //cp.execSync(loginCMD)
  //cp.execSync(gitConfCMD)
  if (cmd!==null) {
    cp.execSync(loginCMD)
    cp.execSync(gitConfCMD)
    cp.execSync(cmd)
  }
}

/*
function genGithubTag(workspace){
  const addCMD = 'git add -u'
  const commitCMD = `git commit -m ''`
}
*/

function buffer2String(buffer, key='data'){
  let ret = JSON.stringify(buffer);
  ret = JSON.parse(ret);
  ret = ret[key];
  return String.fromCharCode(...ret);
}

function checkDecisionTable(condition, table){
  const key = table.key;
  const result = table.value;
  for (let index in key){
    //console.log(condition, key[index], 'compare in check decision table')
    const isEqual = compare(key[index], condition);
    if (isEqual) {
      return result[index];
    }
  }
  return null;
}

function compare(a, b){
  //console.log(a, b, 'compare')
  if (a.length!==b.length) return false;
  for (let index in a){
    if(a[index]!==b[index]) return false;
  }
  return true;
}
const table = {}
table['key'] = [
  // branch, commit
  ['master', 'init'],             //1
  ['master', 'breaking change'],  //2
  ['master', 'feat'],             //3
  ['master', 'fix'],              //4
  ['master', 'merge N'],          //5
  ['master', 'merge N.N'],        //6
  ['master', 'merge next'],       //7
  ['master', 'merge alpha'],      //8
  ['master', 'merge beta'],       //9
  ['next', 'init'],               //10
  ['next', 'feat'],               //11
  ['next', 'fix'],                //12
  ['next', 'merge N'],            //13
  ['next', 'merge N.N'],          //14
  ['next', 'merge alpha'],        //15
  ['next', 'merge beta'],         //16
  ['N', 'feat'],                  //17
  ['N', 'fix'],                   //18
  ['N', 'merge N.N'],             //19
  ['N', 'merge alpha'],           //20
  ['N', 'merge beta'],            //21
  ['N.N', 'fix'],                 //22
  ['alpha', 'feat'],              //23
  ['alpha', 'fix'],               //24
  ['alpha', 'merge N'],           //25
  ['alpha', 'merge N.N'],         //26
  ['beta', 'feat'],               //27
  ['beta', 'fix'],                //28
  ['beta', 'merge N'],            //29
  ['beta', 'merge N.N'],          //30
  ['N', 'init'],                  //31
  ['N.N', 'init'],                //32
  ['alpha', 'init'],              //33
  ['beta', 'init']                //34
]
table['value1'] = [
  'major',        //1
  'major',        //2
  'minor',        //3
  'patch',        //4
  'minor',        //5
  'patch',        //6
  'major',        //7
  'major',        //8
  'major',        //9
  'major',        //10
  'minor',        //11
  'patch',        //12
  'minor',        //13
  'patch',        //14
  'minor',        //15 
  'minor',        //16
  'minor',        //17
  'patch',        //18
  'patch',        //19
  'minor',        //20
  'minor',        //21
  'patch',        //22
  'prerelease',   //23
  'prerelease',   //24
  'prerelease',   //25
  'prerelease',   //26
  'prerelease',   //27
  'prerelease',   //28
  'prerelease',   //29
  'prerelease',   //30
  'minor',        //31
  'patch',        //32
  'minor',        //33
  'minor',        //34
]
table['value'] = [
  // version
  'major',        //1
  'major',        //2
  'minor',        //3
  'patch',        //4
  'minor',        //5
  'patch',        //6
  'major',        //7
  'major',        //8
  'major',        //9
  'major',        //10
  'minor',        //11
  'patch',        //12
  'minor',        //13
  'patch',        //14
  'minor',        //15
  'minor',        //16
  'minor',        //17
  'patch',        //18
  'patch',        //19
  'minor',        //20
  'minor',        //21
  'patch',        //22*
  'prerelease',   //23
  'prerelease',   //24
  'prerelease',   //25
  'prerelease',   //26
  'prerelease',   //27
  'prerelease',   //28
  'prerelease',   //29
  'prerelease',   //30
  'minor',        //31
  'patch',        //32
  'minor',        //33
  'minor'         //34
]
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

/*
function checkVersionValid(versions){
  for (let version of versions){
    if(!semver.valid(version)) return false
  }
  return true
}
*/

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
  //console.log(version)
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

function getInfoFromBranch(branch){
  const parts = branch.split('@@')  
  const re = /([0-9])+(.(([0-9])+|x))?.x/;
  if (parts.length===1) {
    const tmp = re.exec(branch)
    if (tmp!==null) branch = tmp[0]
    branch = extractVersion(branch)
    return { workspace: 'global', branch: branch}
  }
  if (parts.length===2) {
    const tmp = re.exec(parts[1])
    if (tmp!==null) branch = tmp[0]
    else branch = parts[1]
    branch = extractVersion(branch)
    return { workspace: parts[0], branch: branch}
  }
  return null
}

function getTagFromBranch(branch){
  switch(branch){
    case 'master': return 'latest';
    case 'N': return 'dev';
    case 'N.N': return 'dev';
    default: return branch;
  }
}

run();

module.exports = {
  multiMatch: multiMatch,
  extractVersion: extractVersion,
  checkCommitAnalyser: checkCommitAnalyser,
  checkDecisionTable: checkDecisionTable,
  table: table,
  getInfoFromBranch: getInfoFromBranch,
  getTagFromBranch: getTagFromBranch,
  getCMD: getCMD,
}
