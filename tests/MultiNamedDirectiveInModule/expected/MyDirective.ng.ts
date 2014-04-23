/// <reference path="MyApp.Area.ng.ts" />

module MyApp.Area {
    //@NgDirective('foo')
    //@NgDirective('bar')
    class MyDirective implements ng.IDirective {
        constructor() {
            for (var m in this) {
                if (this[m].bind) {
                    this[m] = this[m].bind(this);
                }
            }
        }

        public restrict = "A";

        public link(scope: any, element: ng.IAugmentedJQuery, attrs) {
            
        }
    }
    
    angular.module("MyApp.Area")
        .directive("foo", [
            function () {
                return new MyDirective();
            }
        ])
        .directive("bar", [
            function () {
                return new MyDirective();
            }
        ]);
}  