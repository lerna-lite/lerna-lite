export default {
  transform: (commit, context) => {
    const clonedCommit = { ...commit };
    let discard = true;
    const issues: string[] = [];

    clonedCommit.notes.forEach((note) => {
      note.title = 'BREAKING CHANGES';
      discard = false;
    });

    if (clonedCommit.type === 'feat') {
      clonedCommit.type = 'Features';
    } else if (clonedCommit.type === 'fix') {
      clonedCommit.type = 'Bug Fixes';
    } else if (clonedCommit.type === 'perf') {
      clonedCommit.type = 'Performance Improvements';
    } else if (clonedCommit.type === 'revert') {
      clonedCommit.type = 'Reverts';
    } else if (discard) {
      return;
    } else if (clonedCommit.type === 'docs') {
      clonedCommit.type = 'Documentation';
    } else if (clonedCommit.type === 'style') {
      clonedCommit.type = 'Styles';
    } else if (clonedCommit.type === 'refactor') {
      clonedCommit.type = 'Code Refactoring';
    } else if (clonedCommit.type === 'test') {
      clonedCommit.type = 'Tests';
    } else if (clonedCommit.type === 'build') {
      clonedCommit.type = 'Build System';
    } else if (clonedCommit.type === 'ci') {
      clonedCommit.type = 'Continuous Integration';
    }

    if (clonedCommit.scope === '*') {
      clonedCommit.scope = '';
    }

    if (typeof clonedCommit.hash === 'string') {
      clonedCommit.shortHash = clonedCommit.hash.substring(0, 7);
    }

    if (typeof clonedCommit.subject === 'string') {
      let url = context.repository ? `${context.host}/${context.owner}/${context.repository}` : context.repoUrl;
      if (url) {
        url = `${url}/issues/`;
        // Issue URLs.
        clonedCommit.subject = clonedCommit.subject.replace(/#([0-9]+)/g, (_, issue: string) => {
          issues.push(issue);
          return `[#${issue}](${url}${issue})`;
        });
      }
      if (context.host) {
        // User URLs.
        clonedCommit.subject = clonedCommit.subject.replace(/\B@([a-z0-9](?:-?[a-z0-9]){0,38})/g, '[@$1](${context.host}/$1)');
      }
    }

    // remove references that already appear in the subject
    clonedCommit.references = clonedCommit.references.filter((reference) => {
      if (issues.indexOf(reference.issue) === -1) {
        return true;
      }

      return false;
    });

    return clonedCommit;
  },
  groupBy: 'type',
  commitGroupsSort: 'title',
  commitsSort: ['scope', 'subject'],
  noteGroupsSort: 'title',
  // notesSort: compareFunc,
  mainTemplate: [
    '{{> header}}',
    '',
    '{{#each commitGroups}}',
    '{{#each commits}}',
    '{{> commit root=@root}}',
    '{{/each}}',
    '{{/each}}',
    '',
    '{{> footer}}',
  ].join('\n'),
  headerPartial: [
    '<a name="{{version}}"></a>',
    '## {{#if isPatch~}} <small>',
    '{{~/if~}} {{version}}',
    '{{~#if title}} "{{title}}"',
    '{{~/if~}}',
    '{{~#if date}} ({{date}})',
    '{{~/if~}}',
    '{{~#if isPatch~}} </small>',
    '{{~/if}}',
    '',
    '',
  ].join('\n'),
  commitPartial: [
    '* {{header}} {{#if @root.linkReferences~}}',
    '([{{shortHash}}](',
    '{{~#if @root.repository}}',
    '{{~#if @root.host}}',
    '{{~@root.host}}/',
    '{{~/if}}',
    '{{~#if @root.owner}}',
    '{{~@root.owner}}/',
    '{{~/if}}',
    '{{~@root.repository}}',
    '{{~else}}',
    '{{~@root.repoUrl}}',
    '{{~/if}}/',
    '{{~@root.commit}}/{{hash}}))',
    '{{~else}}',
    '{{~shortHash}}',
    '{{~/if}}',
    '',
  ].join('\n'),
  footerPartial: [
    '{{#if noteGroups}}',
    '{{#each noteGroups}}',
    '',
    '### {{title}}',
    '',
    '{{#each notes}}',
    '* {{text}}',
    '{{/each}}',
    '{{/each}}',
    '{{/if}}',
  ].join('\n'),
};
