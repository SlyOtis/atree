import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import {resolve} from 'path'
import tsConfigPaths from 'vite-tsconfig-paths'
// @ts-ignore
import dts from 'vite-plugin-dts'
import * as packageJson from './package.json'


// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      jsxRuntime: 'automatic'
    }),
    tsConfigPaths(),
    dts({
      include: ['src/component/'],
      insertTypesEntry: true,
    })
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/component/index.ts'),
      name: 'ATree',
      formats: ['es', 'umd'],
      fileName: (format) => `atree.${format}.js`,
    },
    rollupOptions: {
      external: [...Object.keys(packageJson.peerDependencies)],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM'
        }
      }
    },
  }
})
