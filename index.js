const core = require('@actions/core');
const github = require('@actions/github')
const context = github.context
const wait = require('./wait');
const cp = require('child_process');



// most @actions toolkit packages have async methods
async function run() {
  try { 
    const githubClient = new github.getOctokit(process.env.GITHUB_TOKEN);
    const { owner, repo} = context.repo;
    const sha = context.sha;
    console.log(owner, repo, sha, 'context')
    //const commitRef = context.ref;
    //const commit = await githubClient.git.getCommit({owner, repo, sha})
    //core.info(`${commit} commit`)
    //console.log(commit, 'commit')
    let commit = cp.execSync(`git log --format=%B -n 1 ${sha}`);
    commit = JSON.stringify(commit);
    commit = JSON.parse(commit);
    commit = commit['data'];
    console.log(commit, typeof(commit), 'commit0')
    commit = String.fromCharCode(...commit);
    console.log(commit, 'commit');
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

run();
