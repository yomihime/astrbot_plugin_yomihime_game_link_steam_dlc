// The controller owns requests and validity. Modern Core owns the actual
// submit element and dispatch; legacy Core keeps the original DOM form.
export function primaryForm(root, {presentation}, {id, label, className = '', legacyLabel = label}) {
  const template = presentation?.template;
  const body = root.ownerDocument.createElement(template ? 'div' : 'form');
  body.className = className;
  const actions = root.ownerDocument.createElement('div');
  actions.className = 'steam-dlc-actions';
  let button;
  if (!template) {
    button = root.ownerDocument.createElement('button');
    button.type = 'submit';
    button.className = 'ui-button';
    button.dataset.action = id;
    button.dataset.variant = 'primary';
    button.textContent = legacyLabel;
    actions.append(button);
  }
  return {
    body, actions,
    bind(run) {
      if (template) {
        template.bind('query', run, {type: 'submit', label});
        return () => {};
      }
      const submit = event => {event.preventDefault(); void run();};
      body.addEventListener('submit', submit);
      return () => body.removeEventListener('submit', submit);
    },
    sync(disabled, pending) {
      body.setAttribute('aria-busy', String(pending));
      if (template) template.actionState('query', {disabled, busy: pending});
      else button.disabled = disabled || pending;
    },
    result(...children) {
      (presentation?.resultHost || root).append(...children);
    },
  };
}
