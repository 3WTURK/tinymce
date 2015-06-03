test(
  'ModelOperationsTest',

  [
    'ephox.peanut.Fun',
    'ephox.perhaps.Option',
    'ephox.scullion.Struct',
    'ephox.snooker.model.ModelOperations'
  ],

  function (Fun, Option, Struct, ModelOperations) {
    var nu = {
      lead: Struct.immutable('cell', 'rowspan', 'colspan'),
      bounds: Struct.immutable('startRow', 'startCol', 'finishRow', 'finishCol')
    };

    var generators = function () {
      var counter = 0;
      var prior = Option.none();
      var getOrInit = function (element, comparator) {
        return prior.fold(function () {
          var r = '?_' + counter;
          counter++;
          prior = Option.some({ item: element, sub: r });
          return r;
        }, function (p) {
          if (comparator(element, p.item)) {
            return p.sub;
          } else {
            var r = '?_' + counter;
            counter++;
            prior = Option.some({ item: element, sub: r });
            return r;
          }
        });
      };

      var nu = function () {
        return '?';
      };

      return {
        getOrInit: getOrInit,
        nu: nu
      };
    };

    // Test basic merge.
    (function () {
      var check = function (expected, grid, bounds, lead) {
        var actual = ModelOperations.merge(grid, bounds, lead, Fun.tripleEquals);
        assert.eq(expected, actual);
      };

      check([], [], nu.bounds(0, 0, 1, 1), 'a');
      check([[ 'a', 'a' ]], [[ 'a', 'b' ]], nu.bounds(0, 0, 0, 1), 'a');
      check(
        [
          [ 'a', 'a' ],
          [ 'a', 'a' ]
        ],
        [
          [ 'a', 'b' ],
          [ 'c', 'd' ]
        ], nu.bounds(0, 0, 1, 1), 'a');
    })();

    // Test basic unmerge.
    (function () {
      var check = function (expected, grid, target) {
        var actual = ModelOperations.unmerge(grid, target, Fun.tripleEquals, Fun.constant('?'));
        assert.eq(expected, actual);
      };

      check([], [], 'a');
      check([[ 'a', '?' ]], [[ 'a', 'a' ]], 'a');
      check(
        [
          [ 'a', '?' ],
          [ '?', '?' ]
        ],
        [
          [ 'a', 'a' ],
          [ 'a', 'a' ]
        ], 'a'
      );
    })();

    // Test basic insert column
    (function () {
      var check = function (expected, grid, example, index) {
        var actual = ModelOperations.insertColumnAt(grid, index, example, Fun.tripleEquals, generators());
        assert.eq(expected, actual);
      };

      check([], [], 0, 0);
      check([[ '?_0' ]], [[ ]], 0, 0);
      check([[ '?_0', 'a' ]], [[ 'a' ]], 0, 0);
      check([[ 'a', '?_0' ]], [[ 'a' ]], 0, 1);
      check(
        [
          [ 'a', '?_0' ],
          [ 'b', '?_1' ]
        ],
        [
          [ 'a' ],
          [ 'b' ]
        ], 0, 1
      );
      check(
        [
          [ '?_0', 'a' ],
          [ '?_1', 'b' ]
        ],
        [
          [ 'a' ],
          [ 'b' ]
        ], 0, 0
      );
      // Spanning check.
      check(
        [
          [ 'a', 'a', 'a' ],
          [ 'b', '?_0', 'c' ]
        ],
        [
          [ 'a', 'a' ],
          [ 'b', 'c' ]
        ], 0, 1
      );
      check(
        [
          [ 'a', 'b', '?_0' ],
          [ 'c', 'b', '?_0' ],
          [ 'c', 'd', '?_1' ]
        ],
        [
          [ 'a', 'b' ],
          [ 'c', 'b' ],
          [ 'c', 'd' ]
        ], 1, 2
      );

      // Copying the target row with a column
    })();

    // Test basic insert row
    (function () {
      var check = function (expected, grid, example, index) {
        var actual = ModelOperations.insertRowAt(grid, index, example, Fun.tripleEquals, generators());
        assert.eq(expected, actual);
      };

      check([[ '?_0' ], [ 'a' ]], [[ 'a' ]], 0, 0);
      check([[ 'a' ], [ '?_0' ]], [[ 'a' ]], 0, 1);
      check([[ 'a', 'b' ], [ '?_0', '?_1' ]], [[ 'a', 'b' ]], 0, 1);
      check([[ 'a', 'a' ], [ '?_0', '?_0' ]], [[ 'a', 'a' ]], 0, 1);

      check(
        [
          [ 'a', 'a', 'b' ],
          [ '?_0', '?_0', 'b' ],
          [ 'c', 'd', 'b' ]
        ],
        [
          [ 'a', 'a', 'b' ],
          [ 'c', 'd', 'b' ]
        ], 0, 1);
    })();

    // Test basic delete column
    (function () {
      var check = function (expected, grid, index) {
        var actual = ModelOperations.deleteColumnAt(grid, index, Fun.tripleEquals);
        assert.eq(expected, actual);
      };

      check([[ ]], [[ 'a' ]], 0);
      check([[ 'b' ]], [[ 'a', 'b' ]], 0);
      check(
        [
          [ 'a', 'b' ], 
          [ 'c', 'c' ]
        ], 
        [
          [ 'a', 'b', 'b' ],
          [ 'c', 'c', 'c' ]
        ], 1);
    })();

    // Test basic delete row
    (function () {
      var check = function (expected, grid, index) {
        var actual = ModelOperations.deleteRowAt(grid, index, Fun.tripleEquals);
        assert.eq(expected, actual);
      };

      check([], [[ 'a' ]], 0);
      check([[ 'b' ]], [[ 'a' ], [ 'b' ]], 0);
      check(
        [
          [ 'a', 'b', 'b' ], 
          [ 'c', 'c', 'c' ]
        ], 
        [
          [ 'a', 'b', 'b' ],
          [ 'a', 'b', 'b' ],
          [ 'c', 'c', 'c' ]
        ], 1);
    })();
  }
);