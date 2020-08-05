const core = require('@actions/core');
const github = require('@actions/github')
const context = github.context
const wait = require('./wait');
const cp = require('child_process');



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
  ret = JSON.parse(ret)
  ret = ret[key]
  return String.fromCharCode(...ret)
}

run();
