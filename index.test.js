const { multiMatch, 
        extractVersion,
        checkCommitAnalyser,
        checkDecisionTable,
        table,
        getInfoFromBranch,
        getTagFromBranch,
        getCMD,
        } = require('./index');

test('test multiMatch', () => {
  const commit1 = 'merge 1.2.x to master'
  const commit2 = 'merge 1.2.x to 1.x'
  const commit3 = 'merge v1.2.x to v1.x'
  const commit4 = 'Merge pull request #2 from wangziling100/5.3.x '
  const re = /([0-9])+(.(([0-9])+|x))?.x/
  multiMatch(re, commit1)
  expect(multiMatch(re, commit1)).toEqual(['1.2.x'])
  expect(multiMatch(re, commit2)).toEqual(['1.2.x', '1.x'])
  expect(multiMatch(re, commit3)).toEqual(['1.2.x', '1.x'])
  expect(multiMatch(re, commit4)).toEqual(['5.3.x'])
})

test('test extractVersion', () => {
  const version1 = '1.2.x'
  const version2 = '1.x'
  const version3 = 'master'
  const version4 = '1.2.3'
  const version5 = '5.3.x'
  expect(extractVersion(version1)).toBe('N.N')
  expect(extractVersion(version2)).toBe('N')
  expect(extractVersion(version3)).toBe('master')
  expect(extractVersion(version4)).toBe('1.2.3')
  expect(extractVersion(version5)).toBe('N.N')
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
  const commit20 = "Merge pull request #11 from wangziling100/module-a@@v5.x"
  const commit21 = 'publish-feat: module-a@@ new feature'
  const commit22 = 'publish-fix: module-b@@ fix bug'
  const commit23 = 'publish-breaking change: module-c@@ new version'
  //const commit20 = "Merge pull request #2 from wangziling100/5.3.x"
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
  expect(checkCommitAnalyser(commit20, 'next'))
  .toEqual(['merge N', 'module-a'])
  expect(checkCommitAnalyser(commit20, 'abc@@next'))
  .toEqual(['merge N', 'module-a'])
  expect(checkCommitAnalyser(commit21, 'next'))
  .toEqual(['feat', 'module-a'])
  expect(checkCommitAnalyser(commit22, 'next'))
  .toEqual(['fix', 'module-b'])
  expect(checkCommitAnalyser(commit23, 'next'))
  .toEqual(['breaking change', 'module-c'])
})

test('test checkDecisionTable', () => {
  const branch1 = 'master'
  const branch2 = 'next'
  //const branch3 = 'alpha'
  //const branch4 = 'beta'
  //const branch5 = 'v1.0.x'
  //const branch6 = 'v1.x'
  const branch7 = 'abc@@master'
  const branch8 = 'abc@@next'
  const branch9 = 'abc@@alpha'
  //const branch10 = 'abc@@beta'
  const branch11 = 'abc@@v1.0.x'
  const branch12 = 'abc@@v1.x'

  /*
  const commit1 = 'feat'
  const commit2 = 'fix'
  const commit3 = 'breaking change'
  const commit4 = 'merge N'
  const commit5 = 'merge N.N'
  const commit6 = 'merge next'
  const commit7 = 'merge alpha'
  const commit8 = 'merge beta'
  */
  const branchInfo1 = getInfoFromBranch(branch2)
  const branchInfo2 = getInfoFromBranch(branch8)
  const branchInfo3 = getInfoFromBranch(branch11)
  const branchInfo4 = getInfoFromBranch(branch12)
  const branchInfo5 = getInfoFromBranch(branch9)
  const condition1 = [
    getInfoFromBranch(branch1).branch, 'feat'
  ]
  const condition2 = [
    getInfoFromBranch(branch7).branch, 'feat'
  ]
  const condition3 = [
    getInfoFromBranch(branch11).branch, 'merge alpha'
  ]
  const condition4 = [
    getInfoFromBranch(branch12).branch, 'merge alpha'
  ]
  const condition5 = [
    getInfoFromBranch(branch9).branch, 'merge N.N'
  ]
  //let increase = checkDecisionTable(condition1, table)
  expect(checkDecisionTable(condition1, table))
  .toBe('minor')
  expect(checkDecisionTable(condition2, table))
  .toBe('minor')
  expect(checkDecisionTable(condition3, table))
  .toBe(null)
  expect(checkDecisionTable(condition4, table))
  .toBe('minor')
  expect(checkDecisionTable(condition5, table))
  .toBe(null)

  const condition6 = [
    branchInfo1.branch,
    'merge N.N'
  ]
  const condition7 = [
    branchInfo2.branch,
    'merge N.N'
  ]

  const condition8 = [
    branchInfo3.branch,
    'feat'
  ]
  
  const condition9 = [
    branchInfo4.branch,
    'merge N.N'
  ]
  
  const condition10 = [
    branchInfo5.branch,
    'fix'
  ]

  const condition11 = [
    branchInfo5.branch,
    'init'
  ]
  const condition12 = [
    branchInfo5.branch,
    'feat'
  ]
  
  const increase1 = checkDecisionTable(condition6, table)
  const increase2 = checkDecisionTable(condition7, table)
  const increase3 = checkDecisionTable(condition8, table)
  const increase4 = checkDecisionTable(condition9, table)
  const increase5 = checkDecisionTable(condition10, table)
  const increase6 = checkDecisionTable(condition11, table)
  const increase7 = checkDecisionTable(condition12, table)

  const tag1 = getTagFromBranch(branchInfo1.branch)
  const tag2 = getTagFromBranch(branchInfo2.branch)
  const tag3 = getTagFromBranch(branchInfo3.branch)
  const tag4 = getTagFromBranch(branchInfo4.branch)
  const tag5 = getTagFromBranch(branchInfo5.branch)
  const tag6 = tag5
  const tag7 = tag5

  const cmd1 = getCMD(branchInfo1.branch, 
                      branchInfo1.workspace,
                      increase1,
                      tag1,
                      '') 
  const cmd2 = getCMD(branchInfo2.branch,
                      branchInfo2.workspace,
                      increase2,
                      tag2,
                      '')
  const cmd3 = getCMD(branchInfo3.branch,
                      branchInfo3.workspace,
                      increase3,
                      tag3,
                      '')
  const cmd4 = getCMD(branchInfo4.branch,
                      branchInfo4.workspace,
                      increase4,
                      tag4,
                      '')
  const cmd5 = getCMD(branchInfo5.branch,
                      branchInfo5.workspace,
                      increase5,
                      tag5,
                      '')
  const cmd6 = getCMD(branchInfo5.branch,
                      branchInfo5.workspace,
                      increase6,
                      tag6,
                      '')
  const cmd7 = getCMD(branchInfo5.branch,
                      branchInfo5.workspace,
                      increase7,
                      tag7,
                      '')


  expect(cmd1).toBe(null)
  expect(cmd2).toBe(null)
  expect(cmd3).toBe(null)
  expect(cmd4).toBe(null)
  expect(cmd5).toBe('yarn workspace abc publish --prerelease --preid alpha --tag alpha --access public --no-interactive --no-git-tag-version --no-commit-hooks')
  expect(cmd6).toBe('yarn workspace abc publish --preminor --preid alpha --tag alpha --access public --no-interactive --no-git-tag-version --no-commit-hooks')
  expect(cmd7).toBe('yarn workspace abc publish --prerelease --preid alpha --tag alpha --access public --no-interactive --no-git-tag-version --no-commit-hooks')
})

test('test decision table', () => {
  expect(table.value).toEqual(table.value1)
})
