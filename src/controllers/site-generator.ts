import * as path from 'path';
import * as fs from 'fs-extra';
import { logger } from '@hopin/logger';

import {getConfig} from '../models/config';
import {getMarkdownFiles} from '../models/markdown-files';
import {WorkerPool} from './worker-pool';


export class SiteGenerator {
  async build(buildDir: string, configPath: string|null) {
    const config = await getConfig(buildDir, configPath);
    logger.log('🔧 Config......');
    logger.log(`    🏗️ Building In : ${path.relative(process.cwd(), buildDir)}`);
    logger.log(`    📓 Content     : ${path.relative(buildDir, config.contentPath)}`);
    logger.log(`    📦 Output      : ${path.relative(buildDir, config.outputPath)}`);

    // Find all files
    const mdFiles = await getMarkdownFiles(config);
    logger.log(`🔍 Found ${mdFiles.length} markdown files.`);

    // Worker Pool Start
    const workerPool = new WorkerPool(config, mdFiles);
    const results = await workerPool.start(path.join(__dirname, 'file-processor.js'));
    let errors = [];
    for (const key of Object.keys(results)) {
      const result = results[key];
      if (result instanceof Error) {
        errors.push(`
☠️ File:    ${key}
☠️ Message: ${result.message}`.trim());
      }
    }
    if (errors.length > 0) {
      logger.error(`☠️ Build returned ${errors.length} error${errors.length > 1 ? 's' : ''}`)
      for(const err of errors) {
        for (const line of err.split('\n')) {
          console.error(`  ${line}`);
        }
      }
      throw new Error(`${errors} errors occured.`);
    }

    // Copy over static/ files from theme
    const themeStatic = path.join(config.themePath, 'static');
    let staticExists = false;
    try {
      await fs.access(themeStatic);
      staticExists = true;
    } catch (err) {
      logger.debug('No <theme>/static/ directory found in theme.', err);
    }

    if (staticExists) {
      await fs.copy(themeStatic, config.outputPath);
    }

    staticExists = false;
    try {
      await fs.access(config.staticPath);
      staticExists = true;
    } catch (err) {
      logger.debug('No static/ directory found in theme.', err);
    }

    if (staticExists) {
      await fs.copy(config.staticPath, config.outputPath);
    }
  }
}