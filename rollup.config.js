import resolve from 'rollup-plugin-node-resolve'
import sourceMaps from 'rollup-plugin-sourcemaps'

const pkg = require('./package.json')

export default {
  input: `dist/js/index.js`,
  output: [
    { format: 'umd', file: 'dist/umd/index.js', name: pkg.name },
    { format: 'cjs', file: 'dist/cjs/index.js' },
    { format: 'es', file: 'dist/es/index.js' },
  ],
  sourcemap: true,
  plugins: [
    resolve(),
    sourceMaps(),
  ],
}
