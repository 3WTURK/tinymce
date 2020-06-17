/**
 * Copyright (c) Tiny Technologies, Inc. All rights reserved.
 * Licensed under the LGPL or a commercial license.
 * For LGPL see License.txt in the project root for license information.
 * For commercial licenses see https://www.tiny.cloud/
 */

import { TableSelection } from '@ephox/darwin';
import { Arr, Fun, Option } from '@ephox/katamari';
import { Attr } from '@ephox/sugar';
import * as Ephemera from '../selection/Ephemera';
import { SelectionTypes } from '@ephox/snooker';

// Return an array of the selected elements
const selection = (cell, selections) => SelectionTypes.cata(selections.get(),
  Fun.constant([]),
  Fun.identity,
  Fun.constant([ cell ])
);

const unmergable = (cell, selections): Option<any> => {
  const hasSpan = (elem) => (Attr.has(elem, 'rowspan') && parseInt(Attr.get(elem, 'rowspan'), 10) > 1) ||
    (Attr.has(elem, 'colspan') && parseInt(Attr.get(elem, 'colspan'), 10) > 1);

  const candidates = selection(cell, selections);

  return candidates.length > 0 && Arr.forall(candidates, hasSpan) ? Option.some(candidates) : Option.none();
};

const mergable = (table, selections): Option<any> => SelectionTypes.cata(selections.get(),
  Option.none,
  (cells) => {
    if (cells.length === 0) {
      return Option.none();
    }
    return TableSelection.retrieveBox(table, Ephemera.firstSelectedSelector, Ephemera.lastSelectedSelector).bind(function (bounds) {
      return cells.length > 1 ? Option.some({
        bounds: Fun.constant(bounds),
        cells: Fun.constant(cells)
      }) : Option.none();
    });
  },
  Option.none
);

export {
  mergable,
  unmergable,
  selection
};
