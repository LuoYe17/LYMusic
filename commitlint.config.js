module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'perf', 'refactor', 'docs', 'style', 'test', 'build', 'ci', 'chore', 'revert']
    ],
    'subject-empty': [2, 'never'],
    'type-empty': [2, 'never'],
    // 本仓库 subject 用中文写。大小写规则对中文没有意义，而以专有名词开头
    // （GitHub、CodeGraph、GPL、DEV.md…）会被 config-conventional 判成
    // sentence-case 而拦下提交——是误报，故关闭。
    'subject-case': [0]
  }
};
