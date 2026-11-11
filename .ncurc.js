import {localCooldown} from '@cto.af/ncurc';

export default {
  dep: ['prod', 'dev', 'packageManager'],
  reject: ['webpack-cli'],
  cooldown: await localCooldown(),
};
