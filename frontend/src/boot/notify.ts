import { boot } from 'quasar/wrappers';
import { Notify } from 'quasar';

const originalCreate = Notify.create;
const overrideNotify = function (opts: string | Parameters<typeof Notify.create>[0]) {
  if (typeof opts === 'string') {
    return originalCreate.call(Notify, { message: opts, position: 'bottom' });
  }
  if (opts && typeof opts === 'object') {
    opts.position = 'bottom';
  }
  return originalCreate.call(Notify, opts);
};

Notify.create = overrideNotify;

export default boot(({ app }) => {
  if (app.config.globalProperties.$q) {
    app.config.globalProperties.$q.notify = overrideNotify;
  }
});
