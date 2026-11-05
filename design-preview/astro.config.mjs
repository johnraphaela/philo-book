import original from '../astro.config.mjs';
import { defineConfig } from 'astro/config';
export default defineConfig({...original, srcDir:'./design-preview/src', outDir:'./design-preview/dist', cacheDir:'./design-preview/.astro', publicDir:'./public'});
