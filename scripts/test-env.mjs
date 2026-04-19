import { execa } from 'execa';
import { exec } from 'tinyexec';

const pkgName = '@lerna-lite/listable';

try {
  const { stdout } = await execa('node', ['-e', 'console.log(process.env.LERNA_PACKAGE_NAME)'], {
    env: {
      ...process.env, // Explicitly extend
      LERNA_PACKAGE_NAME: pkgName,
    },
    shell: false,
    extendEnv: true,
  });

  console.log('Execa Result:', stdout);
} catch (err) {
  console.error('Execa Failed:', err.message);
}

// tinyexec uses 'x' as the primary function
process.env.LERNA_PACKAGE_NAME = pkgName; // Set the environment variable for tinyexec
console.log(await exec('node', ['-e', 'console.log(process.env.LERNA_PACKAGE_NAME)'], {}));
