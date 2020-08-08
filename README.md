# Introduction

This project provides an automatic publishing solution based on monorepo, presented in the form of Github Action. Action will analyze the user's Git Commit, and then publish the corresponding module according to the regulations. The specific regulations are as follows:  
- Action acts on branches master, next, alpha, beta, N.x, N.N.x  
- Branch naming rules: \<workspace>@@\<branch name>  
- commit follows the form of "\<commit type>: \<workspace>@@\<commit content>  
- Commit type has "init", "feat", "fix", "breaking change"  
- workspace is the module to be published  
- If the workplace is not set, the action publishes for the entire project
- The publishing action follows the [decision table](https://github.com/wangziling100/AutoPublish/issues/4)

# Quick Start
```yml
name: Node.js Auto Publish

on:
  push

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v1
        with:
          node-version: 12
      - uses: wangziling100/AutoPublish@v1.0.0-alpha.26
        with:
          scope: '@wangziling100'
          strict_error: false
        env:
          NPM_TOKEN: ${{secrets.NPM_TOKEN}}
```
No parameters are required, but usually you need to set scope and NPM_TOKEN 
## Parameter Descriptions
- scope: Scope of your package
- root_dir: Root directory of your monorepo
- strict_error: If it is true, it will report an error once it is not successfully published. If it is false, it will ignore the commit format error.
# Example
This action will not generate a release every time a module is published, but it will generate a tag for this module, like [this](https://github.com/wangziling100/AutoPublishTest/tags). 

More examples see [here](https://github.com/wangziling100/AutoPublishTest/actions)
