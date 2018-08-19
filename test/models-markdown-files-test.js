import test from 'ava';
import * as path from 'path';

import {getMarkdownFiles} from '../build/models/markdown-files';

const projectsPath = path.join(__dirname, 'static', 'projects');

test('getMarkdownFiles() should throw for non-existant path', async (t) => {
	try {
		await getMarkdownFiles({
      contentPath: path.join(__dirname, 'static', 'non-existant'),
      markdownExtension: 'md',
    });
	} catch (err) {
		t.true(err.message.indexOf('Unable to access content directory:') === 0);
	}
});

test('getMarkdownFiles() should return no files for empty directory', async (t) => {
  const files = await getMarkdownFiles({
    contentPath: path.join(projectsPath, 'empty-project'),
    markdownExtension: 'md',
  });
  t.deepEqual(files, []);
});

test('getMarkdownFiles() should return expected files valid directory', async (t) => {
  const projectPath = path.join(projectsPath, 'valid-project');
  const files = await getMarkdownFiles({
    contentPath: projectPath,
    markdownExtension: 'md',
  });
  t.deepEqual(files.sort(), [
    path.join(projectPath, 'index.md'),
    path.join(projectPath, 'page.md'),
    path.join(projectPath, 'directory', 'nested-page.md'),
    path.join(projectPath, 'directory', 'directory-2', 'nested-page-2.md'),
  ].sort());
});

test('getMarkdownFiles() should filter files based on config markdown extension', async (t) => {
  const projectPath = path.join(projectsPath, 'valid-project');
  const files = await getMarkdownFiles({
    contentPath: projectPath,
    markdownExtension: 'txt',
  });
  t.deepEqual(files.sort(), [
    path.join(projectPath, 'ignore.txt'),
  ].sort());
});