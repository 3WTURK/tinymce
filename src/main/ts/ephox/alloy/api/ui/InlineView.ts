import { FieldSchema } from '@ephox/boulder';
import { Fun, Merger, Option, Result } from '@ephox/katamari';
import * as ComponentStructure from '../../alien/ComponentStructure';
import { AlloyComponent } from '../../api/component/ComponentApi';
import { AlloySpec, SketchSpec } from '../../api/component/SpecTypes';
import * as SystemEvents from '../../api/events/SystemEvents';
import { SingleSketchFactory } from '../../api/ui/UiSketcher';
import * as Fields from '../../data/Fields';
import { AnchorSpec } from '../../positioning/mode/Anchoring';
import * as Dismissal from '../../sandbox/Dismissal';
import { InlineViewDetail, InlineViewSketcher, InlineViewSpec, InlineMenuSpec } from '../../ui/types/InlineViewTypes';
import * as Behaviour from '../behaviour/Behaviour';
import { Positioning } from '../behaviour/Positioning';
import { Receiving } from '../behaviour/Receiving';
import { Sandboxing } from '../behaviour/Sandboxing';
import * as SketchBehaviours from '../component/SketchBehaviours';
import * as Sketcher from './Sketcher';
import { tieredMenu } from './TieredMenu';

const makeMenu = (lazySink: () => Result<AlloyComponent, Error>, menuSandbox: AlloyComponent, anchor: AnchorSpec, menuSpec: InlineMenuSpec) => {
  return tieredMenu.sketch({
    dom: {
      tag: 'div'
    },

    data: menuSpec.data,
    markers: menuSpec.menu.markers,

    onEscape() {
      return Option.some(true);
    },

    onExecute() {
      return Option.some(true);
    },

    onOpenMenu(notmysandbox, menu) {
      Positioning.position(lazySink().getOrDie(), anchor, menu);
    },

    onOpenSubmenu(notmysandbox, item, submenu) {
      const sink = lazySink().getOrDie();
      Positioning.position(sink, {
        anchor: 'submenu',
        item
      }, submenu);
      Sandboxing.decloak(menuSandbox);
    },
  });
}

const factory: SingleSketchFactory<InlineViewDetail, InlineViewSpec> = (detail, spec): SketchSpec => {
  const isPartOfRelated = (container, queryElem) => {
    const related = detail.getRelated()(container);
    return related.exists((rel) => {
      return ComponentStructure.isPartOf(rel, queryElem);
    });
  };

  return Merger.deepMerge(
    {
      uid: detail.uid(),
      dom: detail.dom(),
      behaviours: Merger.deepMerge(
        Behaviour.derive([
          Sandboxing.config({
            isPartOf (container, data, queryElem) {
              return ComponentStructure.isPartOf(data, queryElem) || isPartOfRelated(container, queryElem);
            },
            getAttachPoint () {
              return detail.lazySink()().getOrDie();
            }
          }),
          Dismissal.receivingConfig(
            Merger.deepMerge(
              {
                isExtraPart: Fun.constant(false),
              },
              detail.fireDismissalEventInstead().map((fe) => ({
                'fireEventInstead': {
                  event: fe.event()
                }
              } as any)).getOr({ })
            )
          )
        ]),
        SketchBehaviours.get(detail.inlineBehaviours())
      ),
      eventOrder: detail.eventOrder(),

      apis: {
        showAt (sandbox: AlloyComponent, anchor: AnchorSpec, thing: AlloySpec) {
          const sink = detail.lazySink()().getOrDie();
          Sandboxing.cloak(sandbox);
          Sandboxing.open(sandbox, thing);
          Sandboxing.decloak(sandbox);
          detail.onShow()(sandbox);
        },
        showMenuAt(sandbox: AlloyComponent, anchor: AnchorSpec, menuSpec: InlineMenuSpec) {
          const thing = makeMenu(detail.lazySink(), sandbox, anchor, menuSpec);

          Sandboxing.cloak(sandbox);
          Sandboxing.open(sandbox, thing);
          Sandboxing.decloak(sandbox);
          detail.onShow()(sandbox);
        },
        hide (sandbox: AlloyComponent) {
          Sandboxing.close(sandbox);
          detail.onHide()(sandbox);
        },
        getContent (sandbox: AlloyComponent): Option<AlloyComponent> {
          return Sandboxing.getState(sandbox);
        },
        isOpen: Sandboxing.isOpen
      }
    }
  );
};

const InlineView = Sketcher.single({
  name: 'InlineView',
  configFields: [
    FieldSchema.strict('lazySink'),
    Fields.onHandler('onShow'),
    Fields.onHandler('onHide'),
    SketchBehaviours.field('inlineBehaviours', [ Sandboxing, Receiving ]),
    FieldSchema.optionObjOf('fireDismissalEventInstead', [
      FieldSchema.defaulted('event', SystemEvents.dismissRequested())
    ]),
    FieldSchema.defaulted('getRelated', Option.none),
    FieldSchema.defaulted('eventOrder', Option.none)
  ],
  factory,
  apis: {
    showAt (apis, component, anchor, thing) {
      apis.showAt(component, anchor, thing);
    },
    showMenuAt(apis, component, anchor, menuSpec) {
      apis.showMenuAt(component, anchor, menuSpec);
    },
    hide (apis, component) {
      apis.hide(component);
    },
    isOpen (apis, component) {
      return apis.isOpen(component);
    },
    getContent (apis, component) {
      return apis.getContent(component);
    }
  }
}) as InlineViewSketcher;

export { InlineView };
