import { COMPONENT_ROOT } from '../helper/index.mjs';

const files = {
  '/fake.json': '{}',
  '/fake.js': '/**用于创建分包的假页面**/',
  '/fake.wxml': '<!--用于创建分包的假页面-->',
};

export class EmitFakePlugin {
  PLUGIN_NAME = 'EmitFakePlugin';

  apply(compiler) {
    const {
      sources: { RawSource },
      Compilation: { PROCESS_ASSETS_STAGE_ADDITIONAL },
    } = compiler.webpack;

    compiler.hooks.make.tap(this.PLUGIN_NAME, (compilation) => {
      compilation.hooks.processAssets.tap(
        {
          name: this.PLUGIN_NAME,
          stage: PROCESS_ASSETS_STAGE_ADDITIONAL,
        },
        () => {
          for (const [path, content] of Object.entries(files)) {
            compilation.emitAsset(
              COMPONENT_ROOT + path,
              new RawSource(content),
            );
          }
        },
      );
    });
  }
}
