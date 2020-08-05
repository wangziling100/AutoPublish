const core = require('@actions/core');
const { Github, context } = require('@actions/github')
const wait = require('./wait');


// most @actions toolkit packages have async methods
async function run() {
  try {
    const githubClient = new GitHub(process.env.GITHUB_TOKEN);
    const { owner, repo } = context.repo;
    console.log(context)
    const commitRef = context.ref;
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
