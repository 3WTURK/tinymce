import * as Boxes from '../../alien/Boxes';
import { FieldSchema, FieldProcessorAdt } from '@ephox/boulder';
import { Scroll } from '@ephox/sugar';
import { window } from '@ephox/dom-globals';

const defaultLazyViewport = (_component) => {
  const scroll = Scroll.get();
  return Boxes.bounds(scroll.left(), scroll.top(), window.innerWidth, window.innerHeight);
};

export default <any> [
  FieldSchema.optionObjOf('contextual', [
    FieldSchema.strict('fadeInClass'),
    FieldSchema.strict('fadeOutClass'),
    FieldSchema.strict('transitionClass'),
    FieldSchema.strict('lazyContext')
  ]),
  FieldSchema.defaulted('lazyViewport', defaultLazyViewport),
  FieldSchema.strict('leftAttr'),
  FieldSchema.strict('topAttr')
] as FieldProcessorAdt[];