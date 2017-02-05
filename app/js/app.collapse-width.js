/**
 * Created by Luis Blanco on 2/4/2017.
 */
(()=>{
    angular('app').directive('collapseWidth', ['$transition', function ($transition, $timeout) {

    return {
        link: function (scope, element, attrs) {

            var initialAnimSkip = true;
            var currentTransition;

            function doTransition(change) {
                var newTransition = $transition(element, change);
                if (currentTransition) {
                    currentTransition.cancel();
                }
                currentTransition = newTransition;
                newTransition.then(newTransitionDone, newTransitionDone);
                return newTransition;

                function newTransitionDone() {
                    // Make sure it's this transition, otherwise, leave it alone.
                    if (currentTransition === newTransition) {
                        currentTransition = undefined;
                    }
                }
            }

            function expand() {
                if (initialAnimSkip) {
                    initialAnimSkip = false;
                    expandDone();
                } else {
                    element.removeClass('collapse').addClass('collapsing-width');
                    doTransition({ width: element[0].scrollWidth + 'px' }).then(expandDone);
                }
            }

            function expandDone() {
                element.removeClass('collapsing-width');
                element.addClass('collapse in');
                element.css({width: 'auto'});
            }

            function collapse() {
                if (initialAnimSkip) {
                    initialAnimSkip = false;
                    collapseDone();
                    element.css({width: 0});
                } else {
                    // CSS transitions don't work with height: auto, so we have to manually change the height to a specific value
                    element.css({ width: element[0].scrollWidth + 'px' });
                    //trigger reflow so a browser realizes that height was updated from auto to a specific value
                    var x = element[0].offsetHeight;

                    element.removeClass('collapse in').addClass('collapsing-width');

                    doTransition({ width: 0 }).then(collapseDone);
                }
            }

            function collapseDone() {
                element.removeClass('collapsing-width');
                element.addClass('collapse');
            }

            scope.$watch(attrs.collapseWidth, function (shouldCollapse) {
                if (shouldCollapse) {
                    collapse();
                } else {
                    expand();
                }
            });
        }
    };
}]);
})