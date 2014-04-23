/// <reference path="MyApp.Area.ng.ts" />

module MyApp.Area {
    //@NgDirective('myDirective')
    class MyDirective implements ng.IDirective {
        private _window: ng.IWindowService;

        constructor($window: ng.IWindowService) {
            for (var m in this) {
                if (this[m].bind) {
                    this[m] = this[m].bind(this);
                }
            }
            this._window = $window;
        }

        public restrict = "A";

        public link(scope: any, element: ng.IAugmentedJQuery, attrs) {
            
        }
    }
    
    angular.module("MyApp.Area")
        .directive("myDirective", [
            "$window",
            function (a) {
                return new MyDirective(a);
            }
        ]);
}