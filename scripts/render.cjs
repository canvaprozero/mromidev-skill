// Copy to the episode project root beside package.json and src/index.ts.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const project = __dirname;
const home = os.homedir();
const windows = process.platform === 'win32';
const mac = process.platform === 'darwin';
const motion = path.join(home, mac ? 'Movies' : 'Videos', 'Motion');
const localModules = path.join(project, 'node_modules');
const cliPath = path.join('@remotion', 'cli', 'remotion-cli.js');
const headlessShell = /^(chrome-headless-shell|headless_shell)(\.exe)?$/i;

function fileExists(filename) {
  return fs.statSync(filename, { throwIfNoEntry: false })?.isFile() ?? false;
}

function isExecutable(filename) {
  try {
    fs.accessSync(filename, fs.constants.X_OK);
    return fileExists(filename);
  } catch {
    return false;
  }
}

function resolveModules() {
  if (fs.existsSync(localModules)) {
    if (!fileExists(path.join(localModules, cliPath))) {
      throw new Error('Project node_modules is incomplete. Repair it or use the existing shared Motion dependencies.');
    }
    return localModules;
  }

  const custom = process.env.MOTION_NODE_MODULES;
  const candidates = custom
    ? [path.resolve(custom)]
    : [path.join(project, '..', 'node_modules'), path.join(motion, 'node_modules')];
  const shared = candidates.find((candidate) => fileExists(path.join(candidate, cliPath)));
  if (!shared) {
    throw new Error('Set MOTION_NODE_MODULES to the existing Motion node_modules folder with @remotion/cli installed.');
  }

  try {
    fs.symlinkSync(fs.realpathSync(shared), localModules, windows ? 'junction' : 'dir');
  } catch (error) {
    // A second local render can create the same link while this one starts.
    if (error.code !== 'EEXIST' || fs.realpathSync(localModules) !== fs.realpathSync(shared)) {
      throw error;
    }
  }
  return localModules;
}

function findHeadlessShell(directory, depth = 5) {
  if (depth < 0 || !fs.statSync(directory, { throwIfNoEntry: false })?.isDirectory()) {
    return undefined;
  }

  const entries = fs.readdirSync(directory, { withFileTypes: true });
  for (const entry of entries) {
    const candidate = path.join(directory, entry.name);
    if (headlessShell.test(entry.name) && isExecutable(candidate)) return candidate;
  }

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const result = findHeadlessShell(path.join(directory, entry.name), depth - 1);
    if (result) return result;
  }
  return undefined;
}

function resolveBrowser(modules) {
  const custom = process.env.REMOTION_BROWSER_EXECUTABLE;
  if (custom) {
    const browser = path.resolve(custom);
    if (!isExecutable(browser)) {
      throw new Error('REMOTION_BROWSER_EXECUTABLE must point to an installed Chromium executable.');
    }
    return browser;
  }

  const caches = [
    path.join(modules, '.remotion'),
    path.join(project, '.remotion'),
    path.join(path.dirname(fs.realpathSync(modules)), '.remotion'),
    path.join(motion, '.remotion'),
    path.join(home, '.cache', 'ms-playwright'),
    path.join(home, 'Library', 'Caches', 'ms-playwright'),
  ];
  if (process.env.LOCALAPPDATA) caches.push(path.join(process.env.LOCALAPPDATA, 'ms-playwright'));
  for (const cache of caches) {
    const result = findHeadlessShell(cache);
    if (result) return result;
  }

  throw new Error('Set REMOTION_BROWSER_EXECUTABLE to your preinstalled Chromium headless shell.');
}

function main(args) {
  const check = args.length === 1 && args[0] === '--check';
  const [composition, output, ...options] = args;
  const encoderOptions = options.filter((option) => option.startsWith('--hardware-acceleration='));
  const validOptions = options.every((option) =>
    /^--(?:frames=\d+(?:-\d+)?|gl=(?:angle|egl|swangle|swiftshader|vulkan)|hardware-acceleration=(?:disable|required)|log=verbose|overwrite)$/.test(option)
  );
  if (!check && (!composition || composition.startsWith('-') || !output || !/\.mp4$/i.test(output) || !validOptions || encoderOptions.length > 1)) {
    throw new Error([
      'Usage: node render.cjs --check',
      '   or: node render.cjs Composition Output.mp4 [--frames=820-860] [--gl=angle]',
      '       [--hardware-acceleration=disable|required] [--log=verbose] [--overwrite]',
    ].join('\n'));
  }
  if (Number(process.versions.node.split('.')[0]) < 20) {
    throw new Error('Use the existing Node.js 20 or newer installation.');
  }

  const entry = path.join(project, 'src', 'index.ts');
  if (!fileExists(entry)) throw new Error('Missing src/index.ts in the episode project.');

  const modules = resolveModules();
  const browser = resolveBrowser(modules);
  const cli = path.join(modules, cliPath);
  if (check) {
    console.log(`Offline inputs found.\nRemotion CLI: ${cli}\nChromium: ${browser}`);
    return;
  }

  const outputPath = path.resolve(output);
  if (fs.existsSync(outputPath) && !options.includes('--overwrite')) {
    throw new Error(`Output already exists: ${outputPath}. Choose a new name or pass --overwrite.`);
  }

  const encoderOption = encoderOptions[0] ?? '--hardware-acceleration=disable';
  const qualityOption = encoderOption.endsWith('=required') ? '--video-bitrate=12M' : '--crf=17';
  const renderArgs = [
    cli, 'render', entry, composition, outputPath,
    `--browser-executable=${browser}`,
    `--chrome-mode=${headlessShell.test(path.basename(browser)) ? 'headless-shell' : 'chrome-for-testing'}`,
    '--codec=h264', qualityOption, '--pixel-format=yuv420p',
    '--concurrency=1', '--timeout=120000',
    '--disable-shared-memory-capture', encoderOption,
    ...options.filter((option) => option !== encoderOption),
  ];
  const result = spawnSync(process.execPath, renderArgs, { cwd: project, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.signal) throw new Error(`Remotion was terminated by ${result.signal}.`);
  process.exitCode = result.status ?? 1;
}

try {
  main(process.argv.slice(2));
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
