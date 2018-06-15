import { FieldSchema, ValueSchema } from '@ephox/boulder';
import { Arr } from '@ephox/katamari';
import { PlatformDetection } from '@ephox/sand';
import { DomEvent, Node, Traverse } from '@ephox/sugar';

import Keys from '../alien/Keys';
import * as SystemEvents from '../api/events/SystemEvents';
import * as TapEvent from './TapEvent';
import { SugarEvent } from '../alien/TypeDefinitions';
import { setTimeout } from '@ephox/dom-globals';

const isDangerous = (event) => {
  // Will trigger the Back button in the browser
  return event.raw().which === Keys.BACKSPACE()[0] && !Arr.contains([ 'input', 'textarea' ], Node.name(event.target()));
};

const isFirefox = PlatformDetection.detect().browser.isFirefox();

const settingsSchema = ValueSchema.objOfOnly([
  // triggerEvent(eventName, event)
  FieldSchema.strictFunction('triggerEvent'),
  FieldSchema.strictFunction('broadcastEvent'),
  FieldSchema.defaulted('stopBackspace', true)
]);

const bindFocus = (container, handler) => {
  if (isFirefox) {
    // https://bugzilla.mozilla.org/show_bug.cgi?id=687787
    return DomEvent.capture(container, 'focus', handler);
  } else {
    return DomEvent.bind(container, 'focusin', handler);
  }
};

const bindBlur = (container, handler) => {
  if (isFirefox) {
    // https://bugzilla.mozilla.org/show_bug.cgi?id=687787
    return DomEvent.capture(container, 'blur', handler);
  } else {
    return DomEvent.bind(container, 'focusout', handler);
  }
};

const setup = (container, rawSettings) => {
  const settings = ValueSchema.asRawOrDie('Getting GUI events settings', settingsSchema, rawSettings);

  const pointerEvents = PlatformDetection.detect().deviceType.isTouch() ? [
    'touchstart',
    'touchmove',
    'touchend',
    'gesturestart'
  ] : [
    'mousedown',
    'mouseup',
    'mouseover',
    'mousemove',
    'mouseout',
    'click'
  ];

  const tapEvent = TapEvent.monitor(settings);

  // These events are just passed through ... no additional processing
  const simpleEvents = Arr.map(
    pointerEvents.concat([
      'selectstart',
      'input',
      'contextmenu',
      'change',
      'transitionend',
      // Test the drag events
      'drag',
      'dragstart',
      'dragend',
      'dragenter',
      'dragleave',
      'dragover',
      'drop'
    ]),
    (type) => {
      return DomEvent.bind(container, type, (event: SugarEvent) => {
        tapEvent.fireIfReady(event, type).each((tapStopped) => {
          if (tapStopped) { event.kill(); }
        });

        const stopped = settings.triggerEvent(type, event);
        if (stopped) { event.kill(); }
      });
    }
  );

  const onKeydown = DomEvent.bind(container, 'keydown', (event) => {
    // Prevent default of backspace when not in input fields.
    const stopped = settings.triggerEvent('keydown', event);
    if (stopped) { event.kill(); } else if (settings.stopBackspace === true && isDangerous(event)) { event.prevent(); }
  });

  const onFocusIn = bindFocus(container, (event) => {
    const stopped = settings.triggerEvent('focusin', event);
    if (stopped) { event.kill(); }
  });

  const onFocusOut = bindBlur(container, (event) => {
    const stopped = settings.triggerEvent('focusout', event);
    if (stopped) { event.kill(); }

    // INVESTIGATE: Come up with a better way of doing this. Related target can be used, but not on FF.
    // It allows the active element to change before firing the blur that we will listen to
    // for things like closing popups
    setTimeout(() => {
      settings.triggerEvent(SystemEvents.postBlur(), event);
    }, 0);
  });

  const defaultView = Traverse.defaultView(container);
  const onWindowScroll = DomEvent.bind(defaultView, 'scroll', (event) => {
    const stopped = settings.broadcastEvent(SystemEvents.windowScroll(), event);
    if (stopped) { event.kill(); }
  });

  const unbind = () => {
    Arr.each(simpleEvents, (e) => {
      e.unbind();
    });
    onKeydown.unbind();
    onFocusIn.unbind();
    onFocusOut.unbind();
    onWindowScroll.unbind();
  };

  return {
    unbind
  };
};

export {
  setup
};