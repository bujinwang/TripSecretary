// @ts-nocheck


if (typeof AbortSignal.timeout !== 'function') {
  AbortSignal.timeout = function(ms) {
    const controller = new AbortController();
    setTimeout(() => {
      controller.abort(new DOMException('TimeoutError', 'TimeoutError'));
    }, ms);
    return controller.signal;
  };
}
