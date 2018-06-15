import { Attr, Css } from '@ephox/sugar';
import { Option } from '@ephox/katamari';
import { Positioning } from '../../api/behaviour/Positioning';
import * as Attachment from '../../api/system/Attachment';
import { AlloyComponent } from '../../api/component/ComponentApi';
import { SandboxingConfig, SandboxingState } from '../../behaviour/sandboxing/SandboxingTypes';
import { AlloySpec } from '../../api/component/SpecTypes';
import { SugarElement } from '../../alien/TypeDefinitions';

// NOTE: A sandbox should not start as part of the world. It is expected to be
// added to the sink on rebuild.
const rebuild = (sandbox: AlloyComponent, sConfig: SandboxingConfig, sState: SandboxingState, data: AlloySpec) => {
  sState.get().each((data) => {
    // If currently has data, so it hasn't been removed yet. It is
    // being "re-opened"
    Attachment.detachChildren(sandbox);
  });

  const point = sConfig.getAttachPoint()();
  Attachment.attach(point, sandbox);

  // Must be after the sandbox is in the system
  const built = sandbox.getSystem().build(data);
  Attachment.attach(sandbox, built);
  sState.set(built);
  return built;
};

// Open sandbox transfers focus to the opened menu
const open = (sandbox: AlloyComponent, sConfig: SandboxingConfig, sState: SandboxingState, data) => {
  const state = rebuild(sandbox, sConfig, sState, data);
  sConfig.onOpen()(sandbox, state);
  return state;
};

const close = (sandbox: AlloyComponent, sConfig: SandboxingConfig, sState: SandboxingState) => {
  sState.get().each((data) => {
    Attachment.detachChildren(sandbox);
    Attachment.detach(sandbox);
    sConfig.onClose()(sandbox, data);
    sState.clear();
  });
};

const isOpen = (sandbox: AlloyComponent, sConfig: SandboxingConfig, sState: SandboxingState) => {
  return sState.isOpen();
};

const isPartOf = (sandbox: AlloyComponent, sConfig: SandboxingConfig, sState: SandboxingState, queryElem: SugarElement) => {
  return isOpen(sandbox, sConfig, sState) && sState.get().exists((data) => {
    return sConfig.isPartOf()(sandbox, data, queryElem);
  });
};

const getState = (sandbox: AlloyComponent, sConfig: SandboxingConfig, sState: SandboxingState) => {
  return sState.get();
};

const store = (sandbox, cssKey, attr, newValue) => {
  Css.getRaw(sandbox.element(), cssKey).fold(() => {
    Attr.remove(sandbox.element(), attr);
  }, (v) => {
    Attr.set(sandbox.element(), attr, v);
  });
  Css.set(sandbox.element(), cssKey, newValue);
};

const restore = (sandbox, cssKey, attr) => {
  if (Attr.has(sandbox.element(), attr)) {
    const oldValue = Attr.get(sandbox.element(), attr);
    Css.set(sandbox.element(), cssKey, oldValue);
  } else {
    Css.remove(sandbox.element(), cssKey);
  }
};

const cloak = (sandbox: AlloyComponent, sConfig: SandboxingConfig, sState: SandboxingState) => {
  const sink = sConfig.getAttachPoint()();
  // Use the positioning mode of the sink, so that it does not interfere with the sink's positioning
  // We add it here to stop it causing layout problems.
  Css.set(sandbox.element(), 'position', Positioning.getMode(sink));
  store(sandbox, 'visibility', sConfig.cloakVisibilityAttr(), 'hidden');
};

const decloak = (sandbox: AlloyComponent, sConfig: SandboxingConfig, sState: SandboxingState) => {
  restore(sandbox, 'visibility', sConfig.cloakVisibilityAttr());
};

export {
  cloak,
  decloak,
  open,
  close,
  isOpen,
  isPartOf,
  getState
};