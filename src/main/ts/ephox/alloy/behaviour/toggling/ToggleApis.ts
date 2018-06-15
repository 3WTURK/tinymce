import { Class } from '@ephox/sugar';
import { AlloyComponent } from '../../api/component/ComponentApi';
import { TogglingConfig } from '../../behaviour/toggling/TogglingTypes';
import { Stateless } from '../../behaviour/common/NoState';

const updateAriaState = (component: AlloyComponent, toggleConfig: TogglingConfig) => {
  const pressed = isOn(component, toggleConfig);

  const ariaInfo = toggleConfig.aria();
  ariaInfo.update()(component, ariaInfo, pressed);
};

const toggle = (component: AlloyComponent, toggleConfig: TogglingConfig, toggleState: Stateless) => {
  Class.toggle(component.element(), toggleConfig.toggleClass());
  updateAriaState(component, toggleConfig);
};

const on = (component: AlloyComponent, toggleConfig: TogglingConfig, toggleState: Stateless) => {
  Class.add(component.element(), toggleConfig.toggleClass());
  updateAriaState(component, toggleConfig);
};

const off = (component: AlloyComponent, toggleConfig: TogglingConfig, toggleState: Stateless) => {
  Class.remove(component.element(), toggleConfig.toggleClass());
  updateAriaState(component, toggleConfig);
};

const isOn = (component: AlloyComponent, toggleConfig: TogglingConfig) => {
  return Class.has(component.element(), toggleConfig.toggleClass());
};

const onLoad = (component: AlloyComponent, toggleConfig: TogglingConfig, toggleState: Stateless) => {
  // There used to be a bit of code in here that would only overwrite
  // the attribute if it didn't have a current value. I can't remember
  // what case that was for, so I'm removing it until it is required.
  const api = toggleConfig.selected() ? on : off;
  api(component, toggleConfig, toggleState);
};

export {
  onLoad,
  toggle,
  isOn,
  on,
  off
};