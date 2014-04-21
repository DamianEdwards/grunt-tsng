module MyApp.Area {
    //@NgDirective('myDirective')
    class MyDirective implements ng.IDirective {
        private _window: ng.IWindowService;

        constructor($window: ng.IWindowService) {
            this._window = $window;

            this.link = this.link.bind(this);
        }

        public restrict = "A";

        public link(scope: any, element: ng.IAugmentedJQuery, attrs) {
            
        }
    }
}